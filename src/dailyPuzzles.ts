import type { Difficulty, ShapeId } from './types';

// Phase 2b — daily-puzzle library.
//
// Each puzzle is a deterministic challenge that rotates by UTC date.
// Puzzle ID = hash(utcDate) % LIBRARY.length, so every user worldwide
// faces the same puzzle on the same UTC day. v1 ships with mostly
// blank-board puzzles rotating by shape; curated opening positions
// can be added in follow-up commits without changing the loader API.
//
// The file is intentionally a plain TS module so dynamic import() can
// code-split it out of the initial bundle.

export interface DailyPuzzleConfig {
  id: number;
  shape: ShapeId;
  // Pre-played moves to set up the starting position. Empty = blank board,
  // player goes first. Otherwise applied in order via applyMove() before
  // handing control to the player. Players alternate naturally so the
  // first opening move is always by player 1 (then 2, then 1, …).
  openingMoves: number[]; // dot IDs in play order
  aiDifficulty: Difficulty;
}

// 28 puzzles = 4 weeks of rotation. Currently weighted toward triangle
// because that's the unlock-tier-1 shape and most players' first board.
// Square and rectangle picked up at every-3rd and every-4th positions
// so a returning user sees variety in week one.
//
// Openings are blank for v1 (player goes first on an empty board). Hand-
// curated openings to add in a follow-up.
function buildLibrary(): DailyPuzzleConfig[] {
  const shapes: ShapeId[] = [
    'triangle', 'square', 'triangle', 'rectangle',
    'triangle', 'square', 'rectangle', 'triangle',
    'square', 'triangle', 'rectangle', 'square',
    'triangle', 'rectangle', 'square', 'triangle',
    'square', 'triangle', 'rectangle', 'square',
    'triangle', 'rectangle', 'square', 'triangle',
    'rectangle', 'triangle', 'square', 'triangle',
  ];
  return shapes.map((shape, id) => ({
    id,
    shape,
    openingMoves: [],
    aiDifficulty: 4 as Difficulty,
  }));
}

const LIBRARY: DailyPuzzleConfig[] = buildLibrary();

export function getDailyPuzzleLibrarySize(): number {
  return LIBRARY.length;
}

// 'YYYY-MM-DD' in UTC. Stable for the whole UTC calendar day regardless
// of the player's local time zone — prevents the "travel across time
// zones to play the same puzzle twice" attack on the streak.
export function dateToUtcKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

// Cheap deterministic hash (djb2-style) for the UTC date string. Doesn't
// need cryptographic properties — we only need stable bucketing.
function hashDateKey(key: string): number {
  let h = 5381;
  for (let i = 0; i < key.length; i++) {
    h = ((h * 33) ^ key.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function puzzleForDate(d: Date = new Date()): DailyPuzzleConfig {
  const idx = hashDateKey(dateToUtcKey(d)) % LIBRARY.length;
  return LIBRARY[idx];
}
