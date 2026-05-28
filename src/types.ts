export type ShapeId = 'triangle' | 'square' | 'rectangle' | 'rhombus';

export type Player = 1 | 2;

export type GameMode = 'ai' | 'hotseat' | 'multiplayer';

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface Dot {
  id: number;
  row: number;
  col: number;
  x: number;
  y: number;
}

export interface Line {
  id: string;
  dotIds: number[];
  length: number;
  kind: 'h' | 'v' | 'd1' | 'd2';
}

export interface BoardShape {
  id: ShapeId;
  label: string;
  dots: Dot[];
  lines: Line[];
  viewBox: { x: number; y: number; w: number; h: number };
}

export interface ColoredDot {
  player: Player;
  turn: number;
}

export interface CompletedLine {
  lineId: string;
  player: Player;
  turn: number;
}

export interface GameState {
  shape: ShapeId;
  mode: GameMode;
  difficulty?: Difficulty;
  current: Player;
  turn: number;
  colored: Record<number, ColoredDot>;
  completed: CompletedLine[];
  pending: string[];
  scores: Record<Player, number>;
  finished: boolean;
  winner: Player | 'draw' | null;
}

export type GameAction =
  | { kind: 'dot'; dotId: number }
  | { kind: 'claim'; lineId: string };

export interface Progress {
  unlocked: {
    triangle: Difficulty;
    square: Difficulty | 0;
    rectangle: Difficulty | 0;
    rhombus: Difficulty | 0;
  };
  wins: Record<string, boolean>;
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: 'Beginner',
  2: 'Easy',
  3: 'Medium',
  4: 'Hard',
  5: 'Impossible',
};

export interface ShapeMeta {
  id: ShapeId;
  label: string;
  dots: number;
}

export const SHAPE_META: ShapeMeta[] = [
  { id: 'triangle', label: 'Triangle', dots: 36 },
  { id: 'square', label: 'Square', dots: 49 },
  { id: 'rectangle', label: 'Rectangle', dots: 63 },
  { id: 'rhombus', label: 'Rhombus', dots: 36 },
];

export const BANNED_SHAPES: ReadonlySet<ShapeId> = new Set(['rhombus']);
export const PLAYABLE_SHAPE_META: ShapeMeta[] = SHAPE_META.filter(
  (s) => !BANNED_SHAPES.has(s.id),
);

export const SHAPE_LABEL: Record<ShapeId, string> = {
  triangle: 'Triangle',
  square: 'Square',
  rectangle: 'Rectangle',
  rhombus: 'Rhombus',
};

// =============================================================================
// Multiplayer backend transport flag (Firestore migration in progress)
// =============================================================================
//
// Controls which database the multiplayer game state lives in. During the
// migration this flag goes through three values, each as a separate deploy:
//
//   'rtdb'      — current production. RTDB authoritative. Firestore untouched.
//   'dual'      — server writes BOTH RTDB and Firestore. Client still reads
//                 RTDB (which is canonical). Firestore is a parallel copy that
//                 lets us verify schema mapping with zero user impact.
//   'firestore' — Firestore authoritative. RTDB no longer written. Last step
//                 of the migration.
//
// Shared across client AND server (this file is mirrored to
// functions/src/engine/types.ts via the copy-engine prebuild script).
//
// Changing this value is the entire rollout knob — three small commits.
// =============================================================================
export type MultiplayerBackend = 'rtdb' | 'dual' | 'firestore';
export const MULTIPLAYER_BACKEND: MultiplayerBackend = 'dual';

// FirestoreGame document shape — what `games/{matchId}` looks like in Firestore.
// Matches the existing RTDB shape closely so the migration is mechanical, but
// removes RTDB-only oddities:
//   - No `pendingMove` field. The client-to-server move submission becomes a
//     callable function invocation; no document field needed.
//   - No `error` subnode. Validation errors come back from the callable
//     directly via Promise rejection.
//   - All map fields (`colored`, `playerUids`, `ready`, etc.) are explicit
//     objects, not RTDB's "empty map gets stripped" behaviour. Read code
//     doesn't need `normalizeState`.
export interface FirestoreGame {
  shape: ShapeId;
  timeControl: '1min' | '3min' | '5min';
  playerUids: { '1': string; '2': string };

  status: 'active' | 'finished';
  createdAt: number;
  gameStartedAt?: number;
  finishedAt?: number;
  finishedReason?: 'normal' | 'timeout' | 'resign';
  winner?: Player | 'draw' | null;

  state: GameState;

  clock: {
    p1RemainingMs: number;
    p2RemainingMs: number;
    turnStartedAt: number;
    current: Player;
    totalMs: number;
  };

  ready: { '1': boolean; '2': boolean };
  boardLoaded: { '1': boolean; '2': boolean };
  rematch?: { '1'?: boolean; '2'?: boolean };
  rematchSpawnedId?: string;
}
