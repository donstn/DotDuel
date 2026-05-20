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

export const SHAPE_LABEL: Record<ShapeId, string> = {
  triangle: 'Triangle',
  square: 'Square',
  rectangle: 'Rectangle',
  rhombus: 'Rhombus',
};
