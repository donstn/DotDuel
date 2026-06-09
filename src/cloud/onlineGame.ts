import type { GameAction, GameMode, GameState, Player, ShapeId } from '../types';
import type { TimeControl } from './matchmaking';
import { diag as DIAG } from '../diag';
import { supabase, currentSupabaseUid } from '../supabase';

// Wrap any network write so a silent hang shows up in logs after 10s.
async function loggedWrite<T>(tag: string, op: () => Promise<T>): Promise<T> {
  DIAG(`${tag} starting`);
  const hangTimer = setTimeout(
    () => DIAG(`${tag} STILL PENDING after 10s — write likely hung`),
    10_000,
  );
  try {
    const r = await op();
    clearTimeout(hangTimer);
    DIAG(`${tag} completed`);
    return r;
  } catch (e) {
    clearTimeout(hangTimer);
    DIAG(`${tag} threw`, e);
    throw e;
  }
}

// RTDB-only connection diagnostics — no-ops under the Supabase transport, which
// surfaces real failures directly from invoke/RPC rejections instead.
export function subscribeConnectionDiag(): () => void {
  return () => {};
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

// Supabase doesn't use an RTDB-style connection pseudo-node; report optimistic
// 'connected'. Real transport failures surface from matchmake/sendMove.
export function watchConnection(cb: (status: ConnectionStatus) => void): () => void {
  cb('connected');
  return () => {};
}

export interface GameClock {
  p1RemainingMs: number;
  p2RemainingMs: number;
  turnStartedAt: number;
  current: Player;
  totalMs: number;
}

export interface OnlineGame {
  state: GameState;
  playerUids: { '1': string; '2': string };
  status: 'active' | 'finished';
  shape: ShapeId;
  timeControl: TimeControl;
  ready?: { '1'?: boolean; '2'?: boolean };
  boardLoaded?: { '1'?: boolean; '2'?: boolean };
  rematch?: { '1'?: boolean; '2'?: boolean };
  rematchSpawnedId?: string;
  clock?: GameClock;
  winner?: Player | 'draw' | null;
  finishedAt?: number;
  finishedReason?: 'normal' | 'timeout' | 'resign' | 'aborted';
  gameStartedAt?: number;
}

// Restore the GameState contract for any fields a serializer may have dropped.
function normalizeState(raw: Partial<GameState> & Record<string, unknown>): GameState {
  return {
    shape: (raw.shape ?? 'square') as ShapeId,
    mode: (raw.mode ?? 'multiplayer') as GameMode,
    difficulty: raw.difficulty as GameState['difficulty'],
    current: (raw.current ?? 1) as Player,
    turn: (raw.turn ?? 1) as number,
    colored: (raw.colored ?? {}) as GameState['colored'],
    completed: (raw.completed ?? []) as GameState['completed'],
    pending: (raw.pending ?? []) as GameState['pending'],
    scores: (raw.scores ?? { 1: 0, 2: 0 }) as GameState['scores'],
    finished: (raw.finished ?? false) as boolean,
    winner: (raw.winner ?? null) as GameState['winner'],
  };
}

export interface OnlineError {
  code: string;
  message: string;
  forUid: string;
  ts: number;
}

// `games.winner` is stored as text ('1' | '2' | 'draw' | null). Map to the union.
function parseWinner(w: unknown): Player | 'draw' | null {
  if (w === '1' || w === 1) return 1;
  if (w === '2' || w === 2) return 2;
  if (w === 'draw') return 'draw';
  return null;
}

function isoToMs(v: unknown): number | undefined {
  if (typeof v !== 'string') return undefined;
  const ms = Date.parse(v);
  return Number.isNaN(ms) ? undefined : ms;
}

// Convert a Postgres `games` row (snake_case columns + jsonb blobs) to OnlineGame.
// The jsonb state/clock are already camelCase (same engine the client runs).
function supabaseRowToOnlineGame(row: Record<string, unknown>): OnlineGame {
  return {
    state: normalizeState((row.state ?? {}) as Record<string, unknown>),
    playerUids: {
      '1': (row.p1_uid ?? '') as string,
      '2': (row.p2_uid ?? '') as string,
    },
    status: (row.status ?? 'active') as OnlineGame['status'],
    shape: (row.shape ?? 'triangle') as ShapeId,
    timeControl: (row.time_control ?? '3min') as TimeControl,
    ready: (row.ready ?? {}) as OnlineGame['ready'],
    boardLoaded: (row.board_loaded ?? {}) as OnlineGame['boardLoaded'],
    rematch: (row.rematch ?? {}) as OnlineGame['rematch'],
    rematchSpawnedId: (row.rematch_spawned_id ?? undefined) as string | undefined,
    clock: (row.clock ?? undefined) as GameClock | undefined,
    winner: parseWinner(row.winner),
    finishedAt: isoToMs(row.finished_at),
    finishedReason: (row.finished_reason ?? undefined) as OnlineGame['finishedReason'],
    gameStartedAt: isoToMs(row.game_started_at),
  };
}

// Invoke a Supabase Edge Function (auth JWT attached from the active session).
async function invokeFn(name: string, body: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.functions.invoke(name, { body });
  if (error) throw error;
}

// Call a SECURITY DEFINER RPC; throw on error.
async function callRpc(fn: string, params: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.rpc(fn, params);
  if (error) throw error;
}

export function watchGame(
  gameId: string,
  onChange: (game: OnlineGame | null) => void,
): () => void {
  DIAG(`watchGame[${gameId}] subscribing (supabase realtime)`);
  let cancelled = false;

  // Realtime delivers only CHANGES, not the current row. Subscribe FIRST, then
  // fetch the initial snapshot on SUBSCRIBED — closes the race where an opponent
  // move lands between an initial select and the subscription attaching (that
  // first move would otherwise be missed). RLS limits delivery to the two players.
  const fetchSnapshot = () => {
    void supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          DIAG(`watchGame[${gameId}] initial select error`, error);
          return;
        }
        onChange(data ? supabaseRowToOnlineGame(data) : null);
      });
  };

  const channel = supabase
    .channel(`game:${gameId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
      (payload) => {
        if (cancelled) return;
        DIAG(`watchGame[${gameId}] realtime ${payload.eventType}`);
        if (payload.eventType === 'DELETE') {
          onChange(null);
          return;
        }
        onChange(supabaseRowToOnlineGame(payload.new as Record<string, unknown>));
      },
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED' && !cancelled) fetchSnapshot();
    });

  return () => {
    cancelled = true;
    void supabase.removeChannel(channel);
  };
}

// Supabase moves validation errors onto the submit-move promise rejection —
// there's no per-game error node to watch.
export function watchError(
  _gameId: string,
  onChange: (err: OnlineError | null) => void,
): () => void {
  onChange(null);
  return () => {};
}

export async function sendMove(
  gameId: string,
  _uid: string,
  action: GameAction,
  clientSentAtMs?: number,
): Promise<void> {
  // clientSentAtMs is the send time in SERVER time (caller adds its measured
  // skew); the server uses it for lag compensation (credit network transit).
  await loggedWrite(`sendMove[${gameId} kind=${action.kind}] (supabase)`, () =>
    invokeFn('submit-move', { gameId, action, clientSentAt: clientSentAtMs }),
  );
}

export async function markReady(
  gameId: string,
  slot: 1 | 2,
  value: boolean,
): Promise<void> {
  await loggedWrite(`markReady[${gameId}:${slot}=${value}] (supabase)`, () =>
    callRpc('set_ready', { p_game_id: gameId, p_value: value }),
  );
}

export async function markBoardLoaded(gameId: string, slot: 1 | 2): Promise<void> {
  await loggedWrite(`markBoardLoaded[${gameId}:${slot}] (supabase)`, () =>
    callRpc('set_board_loaded', { p_game_id: gameId }),
  );
}

// Either participant can claim a timeout when the active player's clock hits 0.
// The server verifies the clock state and only forfeits if the timeout is real.
export async function claimTimeout(gameId: string, _uid: string): Promise<void> {
  await invokeFn('submit-move', { gameId, action: { kind: 'timeout' } });
}

// Claim a first-move abort. The server only accepts it if the game is still on
// someone's first move and >10s have passed. No winner, no rating change.
export async function claimAbort(gameId: string, _uid: string): Promise<void> {
  await invokeFn('submit-move', { gameId, action: { kind: 'abort' } });
}

// Flag this player as wanting a rematch. When both slots agree, set_rematch
// spawns a fresh game + new pairings.
export async function requestRematch(
  gameId: string,
  _slot: 1 | 2,
  value: boolean,
): Promise<void> {
  await callRpc('set_rematch', { p_game_id: gameId, p_value: value });
}

// Submitting player concedes. Opponent wins immediately.
export async function sendResign(gameId: string, _uid: string): Promise<void> {
  await invokeFn('submit-move', { gameId, action: { kind: 'resign' } });
}

export function playerNumFor(game: OnlineGame, uid: string): Player | null {
  // game.playerUids hold Supabase auth uuids; callers may pass a stale uid, so
  // prefer the cached Supabase uid (falls back to the passed uid pre-session).
  const effectiveUid = currentSupabaseUid() ?? uid;
  if (game.playerUids['1'] === effectiveUid) return 1;
  if (game.playerUids['2'] === effectiveUid) return 2;
  return null;
}
