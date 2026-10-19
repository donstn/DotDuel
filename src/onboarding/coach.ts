// First-game tutorial ("Coach" match): a partly-filled real Triangle, the
// scripted steps that teach "finish a line to score it", and the Coach bot.
// Pure logic — no React. Pending lines / claiming are NOT taught here; they
// get a just-in-time tip the first time they happen.

import { applyAction, createGame, pointsIfPlayed } from '../game';
import { getBoard } from '../geometry';
import type { GameAction, GameState } from '../types';

// A game already under way, so the lesson is about a minute long. Chosen with
// a search so that, at the start:
//   - the struck lines are 6–7 (the Coach is slightly ahead);
//   - the only lines one dot short are the 1-dot corners (0, 7, 35), h:r4
//     (gap at 28) and two more: d2:s4 (gap 11, 5 pts) and d1:c5 (gap 20, 3 pts);
//   - no empty dot finishes two lines at once, and the two scripted taps
//     (35, 28) open no new line, so each step shows exactly what it teaches.
const OPENING_P1 = [1, 4, 6, 9, 13, 15, 18, 21, 25, 27, 32, 34];
const OPENING_P2 = [2, 5, 8, 12, 14, 17, 19, 22, 26, 29, 33];
const OPENING_LINES: { lineId: string; player: 1 | 2 }[] = [
  { lineId: 'h:r6', player: 1 },
  { lineId: 'd1:c6', player: 1 },
  { lineId: 'd2:s1', player: 1 },
  { lineId: 'd1:c4', player: 2 },
  { lineId: 'd2:s2', player: 2 },
];

export const COACH_CORNER_DOT = 35; // apex: a 1-dot line → +1
export const COACH_FINISH_LINE = 'h:r4'; // 26 27 [28] 29 → +4
export const COACH_FINISH_DOT = 28;

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

function emptyDots(state: GameState): number[] {
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
  return scoringDots(state).every(
    (id) =>
      pointsIfPlayed(after, getBoard(state.shape), id).pending.length === 0 &&
      gainAt(after, id) === gainAt(state, id),
  );
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
 *    hands the player), so a first-timer wins. Never claims unless forced.
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
