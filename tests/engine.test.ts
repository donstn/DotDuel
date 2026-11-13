import { describe, expect, it } from 'vitest';
import { pickAIAction } from '../src/ai';
import { applyAction, applyClaim, applyMove, createGame } from '../src/game';
import { getBoard } from '../src/geometry';
import { recordWin } from '../src/storage';
import type { Difficulty, GameState, Progress, ShapeId } from '../src/types';

const BOARDS: { id: ShapeId; dots: number; lines: number; points: number }[] = [
  { id: 'triangle', dots: 36, lines: 24, points: 108 },
  { id: 'square', dots: 49, lines: 40, points: 196 },
  { id: 'rectangle', dots: 63, lines: 46, points: 252 },
  { id: 'rhombus', dots: 36, lines: 23, points: 108 },
];

describe('board geometry', () => {
  it.each(BOARDS)('$id has $dots dots, $lines lines, $points points', (b) => {
    const board = getBoard(b.id);
    expect(board.dots).toHaveLength(b.dots);
    expect(board.lines).toHaveLength(b.lines);
    expect(board.lines.reduce((s, l) => s + l.length, 0)).toBe(b.points);
    for (const l of board.lines) expect(l.dotIds).toHaveLength(l.length);
  });
});

describe('scoring', () => {
  it('a 1-dot corner line scores 1 for the mover and passes the turn', () => {
    const board = getBoard('triangle');
    const corner = board.lines.find((l) => l.length === 1)!;
    const r = applyMove(createGame('triangle', 'hotseat'), corner.dotIds[0]);
    expect(r.pointsGained).toBe(1);
    expect(r.state.scores[1]).toBe(1);
    expect(r.state.current).toBe(2);
  });

  it('completing several lines scores only the longest; the rest go pending', () => {
    // Fill the square board except one dot that sits on 4 lines, then play it.
    const board = getBoard('square');
    const last = board.dots.find(
      (d) => board.lines.filter((l) => l.dotIds.includes(d.id)).length === 4,
    )!;
    let s = createGame('square', 'hotseat');
    for (const d of board.dots) if (d.id !== last.id) s = applyMove(s, d.id).state;
    const through = board.lines.filter(
      (l) =>
        l.dotIds.includes(last.id) &&
        !s.completed.some((c) => c.lineId === l.id) &&
        !s.pending.includes(l.id),
    );
    expect(through.length).toBeGreaterThan(1);
    const r = applyMove(s, last.id);
    expect(r.pointsGained).toBe(Math.max(...through.map((l) => l.length)));
    expect(r.newlyPending).toHaveLength(through.length - 1);
  });

  it('either player can claim a pending line for its full length', () => {
    const board = getBoard('square');
    let s = createGame('square', 'hotseat');
    for (const d of board.dots) {
      s = applyMove(s, d.id).state;
      if (s.pending.length > 0) break;
    }
    expect(s.pending.length).toBeGreaterThan(0);
    const lineId = s.pending[0];
    const claimer = s.current;
    const before = s.scores[claimer];
    const r = applyClaim(s, lineId);
    const length = board.lines.find((l) => l.id === lineId)!.length;
    expect(r.state.scores[claimer]).toBe(before + length);
    expect(r.state.pending).not.toContain(lineId);
    expect(r.state.current).not.toBe(claimer);
  });

  it('rejects illegal moves', () => {
    const s = applyMove(createGame('triangle', 'hotseat'), 0).state;
    expect(() => applyMove(s, 0)).toThrow();
    expect(() => applyClaim(s, 'no-such-line')).toThrow();
  });
});

describe('full games', () => {
  function playOut(shape: ShapeId, level: Difficulty): GameState {
    let s = createGame(shape, 'hotseat');
    for (let guard = 0; guard < 500 && !s.finished; guard++) {
      s = applyAction(s, pickAIAction(s, level));
    }
    return s;
  }

  it.each(BOARDS.filter((b) => b.id !== 'rhombus'))(
    '$id: bots finish, every point is awarded once, nothing is left pending',
    (b) => {
      for (const level of [1, 3] as Difficulty[]) {
        const s = playOut(b.id, level);
        expect(s.finished).toBe(true);
        expect(s.pending).toHaveLength(0);
        expect(s.scores[1] + s.scores[2]).toBe(b.points);
        expect(s.completed).toHaveLength(b.lines);
        const expected = s.scores[1] === s.scores[2] ? 'draw' : s.scores[1] > s.scores[2] ? 1 : 2;
        expect(s.winner).toBe(expected);
      }
    },
  );
});

describe('progression', () => {
  const fresh: Progress = {
    unlocked: { triangle: 1, square: 0, rectangle: 0, rhombus: 0 },
    wins: {},
  };

  it('beating Beginner unlocks Easy but not the next shape', () => {
    const p = recordWin(fresh, 'triangle', 1);
    expect(p.unlocked.triangle).toBe(2);
    expect(p.unlocked.square).toBe(0);
  });

  it('beating Easy unlocks the next shape', () => {
    const p = recordWin(recordWin(fresh, 'triangle', 1), 'triangle', 2);
    expect(p.unlocked.square).toBe(1);
  });
});
