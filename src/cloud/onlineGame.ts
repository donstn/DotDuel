import { get, onValue, ref, set } from 'firebase/database';
import { rtdb } from '../firebase';
import type { GameAction, GameMode, GameState, Player, ShapeId } from '../types';
import type { TimeControl } from './matchmaking';

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
  const r = ref(rtdb, `games/${gameId}`);
  return onValue(
    r,
    (snap) => {
      const v = snap.val();
      if (!v) {
        console.warn(`watchGame[${gameId}]: snap.val() is null`);
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
      console.warn(`watchGame[${gameId}] error:`, err);
      onChange(null);
    },
  );
}

// One-shot fallback for when the streaming subscription (watchGame) hasn't
// delivered data. Uses RTDB's get() — RPC-style, single request — which
// sometimes succeeds on privacy-strict mobile browsers (Brave Shields) where
// onValue registration registers but never fires. The game data IS in RTDB;
// this is a "yes it's really there" probe + retrieval.
export async function fetchGameOnce(gameId: string): Promise<OnlineGame | null> {
  try {
    const snap = await get(ref(rtdb, `games/${gameId}`));
    const v = snap.val();
    if (!v) return null;
    return {
      ...(v as OnlineGame),
      state: normalizeState(v.state ?? {}),
    };
  } catch (e) {
    console.warn(`fetchGameOnce[${gameId}] error:`, e);
    return null;
  }
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
  await set(r, {
    from: uid,
    action,
    clientTime: Date.now(),
  });
}

export async function markReady(
  gameId: string,
  slot: 1 | 2,
  value: boolean,
): Promise<void> {
  const r = ref(rtdb, `games/${gameId}/ready/${slot}`);
  await set(r, value);
}

export async function markBoardLoaded(
  gameId: string,
  slot: 1 | 2,
): Promise<void> {
  const r = ref(rtdb, `games/${gameId}/boardLoaded/${slot}`);
  await set(r, true);
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
