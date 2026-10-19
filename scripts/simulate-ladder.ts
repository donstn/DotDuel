import { applyAction, availableActions, availableDots, createGame, pointsIfPlayed } from '../src/game';
import { pickAIAction } from '../src/ai';
import { getBoard } from '../src/geometry';
import type { BoardShape, Difficulty, GameAction, GameState, ShapeId } from '../src/types';

// Difficulty ladder check: how often stand-in human players (moving first, as
// in the app) beat each bot level. Aim (2026-10-19): Beginner ~60% for the
// novice, Easy ~80% / Medium ~20% for the learner, Hard and Impossible ≈ 0% for both
// (Easy/Medium softened the same day after an 8-player-type check).

type Player = (s: GameState, b: BoardShape) => GameAction;
const N = Number(process.argv[2] ?? 300);
const SHAPES: ShapeId[] = ['triangle', 'square'];
const LEVELS: Difficulty[] = [1, 2, 3, 4, 5];

const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function scoring(s: GameState, b: BoardShape) {
  return availableActions(s, b)
    .map((a) => ({
      a,
      gain:
        a.kind === 'claim'
          ? b.lines.find((l) => l.id === a.lineId)!.length
          : pointsIfPlayed(s, b, a.dotId).gained,
    }))
    .filter((x) => x.gain > 0);
}

function randomMove(s: GameState, b: BoardShape): GameAction {
  const dots = availableDots(s, b);
  return dots.length ? { kind: 'dot', dotId: rand(dots) } : { kind: 'claim', lineId: rand(s.pending) };
}

// Spots a scoring move half the time, any line.
const novice: Player = (s, b) => {
  const sc = scoring(s, b);
  return sc.length && Math.random() < 0.5 ? rand(sc).a : randomMove(s, b);
};

// Takes the biggest line 85% of the time; never thinks about the reply.
const learner: Player = (s, b) => {
  const sc = scoring(s, b);
  if (!sc.length || Math.random() >= 0.85) return randomMove(s, b);
  const top = Math.max(...sc.map((x) => x.gain));
  return rand(sc.filter((x) => x.gain === top)).a;
};

function humanWinRate(shape: ShapeId, human: Player, level: Difficulty): number {
  const board = getBoard(shape);
  let won = 0;
  for (let i = 0; i < N; i++) {
    let s = createGame(shape, 'ai', level);
    while (!s.finished) {
      s = applyAction(s, s.current === 1 ? human(s, board) : pickAIAction(s, level, 2));
    }
    won += s.winner === 1 ? 1 : s.winner === null ? 0.5 : 0;
  }
  return Math.round((100 * won) / N);
}

for (const shape of SHAPES) {
  console.log(`\n${shape} — human (P1) win %, ${N} games per cell`);
  console.log('level   novice  learner');
  for (const level of LEVELS) {
    const n = humanWinRate(shape, novice, level);
    const l = humanWinRate(shape, learner, level);
    console.log(`L${level}      ${String(n).padStart(3)}%    ${String(l).padStart(3)}%`);
  }
}
