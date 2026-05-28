import { onValue, ref, set } from 'firebase/database';
import { rtdb } from '../firebase';
import type { GameAction, GameMode, GameState, Player, ShapeId } from '../types';
import type { TimeControl } from './matchmaking';
import { diag as DIAG } from '../diag';

// Wrap any RTDB write so a silent hang shows up in logs after 10s.
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

// Subscribe to Firebase's connection-state pseudo-node. Logs every change.
// Useful for spotting WebSocket-level failures (PC stays connected, mobile
// flaps or never connects).
export function subscribeConnectionDiag(): () => void {
  const r = ref(rtdb, '.info/connected');
  DIAG('subscribing to .info/connected');
  return onValue(
    r,
    (snap) => {
      DIAG(`.info/connected = ${snap.val() === true}`);
    },
    (err) => {
      DIAG('.info/connected error', err);
    },
  );
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
  finishedReason?: 'normal' | 'timeout' | 'resign';
  gameStartedAt?: number;
}

// Firebase RTDB drops empty objects and empty arrays on write — anything that
// would serialize to {} or [] is treated as null and not stored. When the
// client reads the game back, colored / completed / pending may be undefined
// even though the GameState type says they're always present. Restore them
// here so downstream components can rely on the GameState contract.
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

export function watchGame(
  gameId: string,
  onChange: (game: OnlineGame | null) => void,
): () => void {
  DIAG(`watchGame[${gameId}] subscribing`);
  let firstFire = true;
  const r = ref(rtdb, `games/${gameId}`);
  // Diagnostic: if onValue never fires within 8s, the subscription registered
  // but the server never pushed initial data — classic mobile-WebSocket stall.
  const stallTimer = setTimeout(() => {
    if (firstFire) {
      DIAG(`watchGame[${gameId}] STILL no onValue fire after 8s — subscription likely stalled`);
    }
  }, 8_000);
  return onValue(
    r,
    (snap) => {
      if (firstFire) {
        clearTimeout(stallTimer);
        firstFire = false;
      }
      const v = snap.val();
      DIAG(`watchGame[${gameId}] onValue fired, hasData=${!!v}`);
      if (!v) {
        onChange(null);
        return;
      }
      const game: OnlineGame = {
        ...(v as OnlineGame),
        state: normalizeState(v.state ?? {}),
      };
      onChange(game);
    },
    (err) => {
      clearTimeout(stallTimer);
      DIAG(`watchGame[${gameId}] error`, err);
      console.warn('watchGame error:', err);
      onChange(null);
    },
  );
}

export function watchError(
  gameId: string,
  onChange: (err: OnlineError | null) => void,
): () => void {
  const r = ref(rtdb, `games/${gameId}/error`);
  return onValue(
    r,
    (snap) => {
      const v = snap.val();
      if (!v) {
        onChange(null);
        return;
      }
      onChange(v as OnlineError);
    },
    (err) => {
      console.warn('watchError error:', err);
    },
  );
}

export async function sendMove(
  gameId: string,
  uid: string,
  action: GameAction,
): Promise<void> {
  const r = ref(rtdb, `games/${gameId}/pendingMove`);
  await loggedWrite(`sendMove[${gameId} kind=${action.kind}]`, () =>
    set(r, { from: uid, action, clientTime: Date.now() }),
  );
}

export async function markReady(
  gameId: string,
  slot: 1 | 2,
  value: boolean,
): Promise<void> {
  const r = ref(rtdb, `games/${gameId}/ready/${slot}`);
  await loggedWrite(`markReady[${gameId}:${slot}=${value}]`, () => set(r, value));
}

export async function markBoardLoaded(
  gameId: string,
  slot: 1 | 2,
): Promise<void> {
  const r = ref(rtdb, `games/${gameId}/boardLoaded/${slot}`);
  await loggedWrite(`markBoardLoaded[${gameId}:${slot}]`, () => set(r, true));
}

// Either participant can claim a timeout when they see the active player's
// clock has visually hit 0. The server verifies the clock state and only
// forfeits if the timeout is real.
export async function claimTimeout(
  gameId: string,
  uid: string,
): Promise<void> {
  const r = ref(rtdb, `games/${gameId}/pendingMove`);
  await set(r, {
    from: uid,
    action: { kind: 'timeout' },
    clientTime: Date.now(),
  });
}

// Flag this player as wanting a rematch. When both slots are true,
// the rematchGame Cloud Function spawns a fresh game + new pairings.
export async function requestRematch(
  gameId: string,
  slot: 1 | 2,
  value: boolean,
): Promise<void> {
  const r = ref(rtdb, `games/${gameId}/rematch/${slot}`);
  await set(r, value);
}

// Submitting player concedes. Opponent wins immediately.
export async function sendResign(
  gameId: string,
  uid: string,
): Promise<void> {
  const r = ref(rtdb, `games/${gameId}/pendingMove`);
  await set(r, {
    from: uid,
    action: { kind: 'resign' },
    clientTime: Date.now(),
  });
}

export function playerNumFor(game: OnlineGame, uid: string): Player | null {
  if (game.playerUids['1'] === uid) return 1;
  if (game.playerUids['2'] === uid) return 2;
  return null;
}
