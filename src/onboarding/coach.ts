// First-game tutorial ("Coach" match): a partly-filled real Triangle, the
// scripted steps (finish a line, two lines at once, claim the waiting line),
// and the Coach bot. Pure logic — no React.

import { applyAction, createGame, pointsIfPlayed } from '../game';
import { getBoard } from '../geometry';
import type { GameAction, GameState } from '../types';

// A game already under way, so the lesson is short. Chosen with a search so
// that, at the start:
//   - the struck lines are 8–8;
//   - the only lines one dot short are the 1-dot corners (0, 7, 35), h:r4
//     (gap 28), the double at 15 (h:r2, 6 pts + d2:s2, 3 pts — one tap
//     finishes both) and two singles: d1:c3 (gap 24, 5) and d1:c4 (gap 12, 4);
//   - the scripted taps (35, 28, 15) open no new line, so each step shows
//     exactly what it teaches.
const OPENING_P1 = [2, 4, 6, 10, 13, 16, 18, 20, 22, 26, 29, 34];
const OPENING_P2 = [3, 5, 9, 11, 14, 17, 19, 21, 25, 27, 33];
const OPENING_LINES: { lineId: string; player: 1 | 2 }[] = [
  { lineId: 'd2:s4', player: 1 },
  { lineId: 'd1:c5', player: 1 },
  { lineId: 'd2:s3', player: 2 },
  { lineId: 'h:r6', player: 2 },
  { lineId: 'd1:c6', player: 2 },
];

export const COACH_CORNER_DOT = 35; // apex: a 1-dot line → +1
export const COACH_FINISH_LINE = 'h:r4'; // 26 27 [28] 29 → +4
export const COACH_FINISH_DOT = 28;
export const COACH_DOUBLE_DOT = 15; // finishes h:r2 (6, scores) and d2:s2 (3, waits)
export const COACH_DOUBLE_LINES = ['h:r2', 'd2:s2'];

export function coachOpening(): GameState {
  const board = getBoard('triangle');
  const base = createGame('triangle', 'ai', 1);
  const colored: GameState['colored'] = {};
  OPENING_P1.forEach((id) => (colored[id] = { player: 1, turn: 0 }));
  OPENING_P2.forEach((id) => (colored[id] = { player: 2, turn: 0 }));
  const scores = { 1: 0, 2: 0 };
  for (const l of OPENING_LINES) {
    scores[l.player] += board.lines.find((x) => x.id === l.lineId)?.length ?? 0;
  }
  return {
    ...base,
    colored,
    completed: OPENING_LINES.map((l) => ({ ...l, turn: 0 })),
    scores,
  };
}

export function lineDots(lineId: string): number[] {
  return getBoard('triangle').lines.find((l) => l.id === lineId)?.dotIds ?? [];
}

export function gainAt(state: GameState, dotId: number): number {
  return pointsIfPlayed(state, getBoard(state.shape), dotId).gained;
}

export function emptyDots(state: GameState): number[] {
  return getBoard(state.shape)
    .dots.filter((d) => !state.colored[d.id])
    .map((d) => d.id);
}

/** Dots that would score right now, best first. */
export function scoringDots(state: GameState): number[] {
  return emptyDots(state)
    .map((id) => ({ id, g: gainAt(state, id) }))
    .filter((x) => x.g > 0)
    .sort((a, b) => b.g - a.g)
    .map((x) => x.id);
}

/** Every dot of every line the given scoring dots would finish (for the spotlight). */
export function linesFinishedBy(state: GameState, dotIds: number[]): number[] {
  const board = getBoard(state.shape);
  const out = new Set<number>();
  for (const d of dotIds) {
    const r = pointsIfPlayed(state, board, d);
    if (r.biggest) r.biggest.dotIds.forEach((id) => out.add(id));
  }
  return [...out];
}

// How many lines colouring `dotId` would leave exactly one dot short (free
// lines for the next player).
function linesOpened(state: GameState, dotId: number): number {
  const board = getBoard(state.shape);
  return board.lines.filter(
    (l) =>
      l.dotIds.includes(dotId) &&
      l.dotIds.filter((id) => !state.colored[id]).length === 2,
  ).length;
}

// A quiet move must leave every line that is already one dot short exactly as
// it was (same gap, same points) — the scripted steps rely on them.
function keepsGaps(state: GameState, dotId: number): boolean {
  const after = applyAction(state, { kind: 'dot', dotId });
  const board = getBoard(state.shape);
  return scoringDots(state).every(
    (id) =>
      pointsIfPlayed(after, board, id).pending.length ===
        pointsIfPlayed(state, board, id).pending.length && gainAt(after, id) === gainAt(state, id),
  );
}

// The longest waiting line and a dot whose tap claims exactly it (a tap
// claims the longest waiting line through the dot).
export function claimTarget(state: GameState): { lineId: string; dot: number } | null {
  if (state.pending.length === 0) return null;
  const byLength = [...state.pending].sort((a, b) => lineLength(b) - lineLength(a));
  const lineId = byLength[0];
  const dots = lineDots(lineId);
  const dot =
    dots.find((d) => byLength.every((other) => other === lineId || !lineDots(other).includes(d))) ?? dots[0];
  return { lineId, dot };
}

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

function lineLength(lineId: string): number {
  return getBoard('triangle').lines.find((l) => l.id === lineId)?.length ?? 0;
}

// The most the next player could score with one action.
function bestReply(state: GameState): number {
  const dots = scoringDots(state);
  const top = dots.length ? gainAt(state, dots[0]) : 0;
  return Math.max(top, ...state.pending.map(lineLength));
}

/**
 * The Coach's move.
 *  - 'quiet': no points and leaves the lesson's gaps alone (scripted steps).
 *  - 'greedy': takes the biggest line on offer (the "anyone can take a gap" lesson).
 *  - 'easy': free play — the most generous move (own points minus what it
 *    hands the player), so a first-timer wins. Takes the smallest waiting line
 *    first, so the player sees lines can be lost and they don't pile up.
 */
export function coachBotAction(state: GameState, style: 'quiet' | 'greedy' | 'easy'): GameAction {
  const empty = emptyDots(state);
  if (empty.length === 0) {
    const byLength = [...state.pending].sort((a, b) => lineLength(a) - lineLength(b));
    return { kind: 'claim', lineId: style === 'greedy' ? byLength[byLength.length - 1] : byLength[0] };
  }
  if (style === 'greedy') {
    const best = scoringDots(state)[0];
    if (best !== undefined) return { kind: 'dot', dotId: best };
  }
  if (style === 'easy') {
    if (state.pending.length >= 1) {
      const smallest = [...state.pending].sort((a, b) => lineLength(a) - lineLength(b))[0];
      return { kind: 'claim', lineId: smallest };
    }
    const scored = empty.map((id) => ({
      id,
      v: gainAt(state, id) - bestReply(applyAction(state, { kind: 'dot', dotId: id })),
    }));
    const min = Math.min(...scored.map((x) => x.v));
    return { kind: 'dot', dotId: pick(scored.filter((x) => x.v === min).map((x) => x.id)) };
  }
  const zero = empty.filter((id) => gainAt(state, id) === 0);
  if (zero.length) {
    const safe = zero.filter((id) => keepsGaps(state, id));
    const pool = safe.length ? safe : zero;
    const fewest = Math.min(...pool.map((id) => linesOpened(state, id)));
    return { kind: 'dot', dotId: pick(pool.filter((id) => linesOpened(state, id) === fewest)) };
  }
  const cheapest = [...empty].sort((a, b) => gainAt(state, a) - gainAt(state, b))[0];
  return { kind: 'dot', dotId: cheapest };
}
