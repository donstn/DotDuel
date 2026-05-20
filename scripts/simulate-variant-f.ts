import { appendFileSync } from 'node:fs';
import { getBoard } from '../src/geometry';
import type { Line, ShapeId } from '../src/types';

type Player = 1 | 2;

const SHAPES: ShapeId[] = ['triangle', 'rhombus', 'square', 'rectangle'];
const N_GAMES = 100;

interface State {
  current: Player;
  colored: Record<number, Player>;
  completed: Set<string>;
  pending: Set<string>;
  scores: { 1: number; 2: number };
}

interface Board {
  lines: Line[];
  dots: { id: number }[];
}

function createState(): State {
  return {
    current: 1,
    colored: {},
    completed: new Set(),
    pending: new Set(),
    scores: { 1: 0, 2: 0 },
  };
}

function cloneState(s: State): State {
  return {
    current: s.current,
    colored: { ...s.colored },
    completed: new Set(s.completed),
    pending: new Set(s.pending),
    scores: { 1: s.scores[1], 2: s.scores[2] },
  };
}

function placeDot(s: State, dotId: number, board: Board): State {
  const next = cloneState(s);
  next.colored[dotId] = s.current;
  const newlyComplete: Line[] = [];
  for (const line of board.lines) {
    if (s.completed.has(line.id)) continue;
    if (s.pending.has(line.id)) continue;
    if (!line.dotIds.includes(dotId)) continue;
    let all = true;
    for (const id of line.dotIds) {
      if (id !== dotId && !next.colored[id]) {
        all = false;
        break;
      }
    }
    if (all) newlyComplete.push(line);
  }
  if (newlyComplete.length > 0) {
    newlyComplete.sort((a, b) => b.length - a.length);
    const scored = newlyComplete[0];
    next.scores[s.current] += scored.length;
    next.completed.add(scored.id);
    for (let i = 1; i < newlyComplete.length; i++) {
      next.pending.add(newlyComplete[i].id);
    }
  }
  next.current = s.current === 1 ? 2 : 1;
  return next;
}

function claimLine(s: State, lineId: string, board: Board): State {
  const next = cloneState(s);
  const line = board.lines.find((l) => l.id === lineId)!;
  next.scores[s.current] += line.length;
  next.pending.delete(lineId);
  next.completed.add(lineId);
  next.current = s.current === 1 ? 2 : 1;
  return next;
}

function isFinished(s: State, board: Board): boolean {
  for (const d of board.dots) {
    if (!s.colored[d.id]) return false;
  }
  return s.pending.size === 0;
}

type Action =
  | { kind: 'dot'; dotId: number }
  | { kind: 'claim'; lineId: string };

function listActions(s: State, board: Board): Action[] {
  const actions: Action[] = [];
  for (const d of board.dots) {
    if (!s.colored[d.id]) actions.push({ kind: 'dot', dotId: d.id });
  }
  for (const lineId of s.pending) {
    actions.push({ kind: 'claim', lineId });
  }
  return actions;
}

function applyAction(s: State, a: Action, board: Board): State {
  return a.kind === 'dot'
    ? placeDot(s, a.dotId, board)
    : claimLine(s, a.lineId, board);
}

const PENDING_DISCOUNT = 0.5;

function evalState(s: State, me: Player, board: Board): number {
  const opp: Player = me === 1 ? 2 : 1;
  let v = s.scores[me] - s.scores[opp];

  if (s.pending.size > 0) {
    const pendingLines = board.lines
      .filter((l) => s.pending.has(l.id))
      .sort((a, b) => b.length - a.length);
    let cur: Player = s.current;
    for (const line of pendingLines) {
      if (cur === me) v += line.length * PENDING_DISCOUNT;
      else v -= line.length * PENDING_DISCOUNT;
      cur = cur === 1 ? 2 : 1;
    }
  }

  return v;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickL4(s: State, board: Board): Action {
  const me = s.current;
  const actions = listActions(s, board);
  if (actions.length === 0) throw new Error('no actions');

  const myScored = actions.map((a) => {
    const after = applyAction(s, a, board);
    return { a, eval0: evalState(after, me, board) };
  });
  myScored.sort((x, y) => y.eval0 - x.eval0);
  const K = actions.length <= 16 ? 16 : 10;
  const myShortlist = myScored.slice(0, Math.min(myScored.length, K));

  let best = myShortlist[0].a;
  let bestEval = -Infinity;

  for (const { a } of shuffle(myShortlist)) {
    const after = applyAction(s, a, board);
    if (isFinished(after, board)) {
      const ev = evalState(after, me, board);
      if (ev > bestEval) {
        bestEval = ev;
        best = a;
      }
      continue;
    }
    const oppActions = listActions(after, board);
    if (oppActions.length === 0) {
      const ev = evalState(after, me, board);
      if (ev > bestEval) {
        bestEval = ev;
        best = a;
      }
      continue;
    }
    const oppScored = oppActions.map((oa) => {
      const after2 = applyAction(after, oa, board);
      return { a: oa, eval0: evalState(after2, me, board) };
    });
    oppScored.sort((x, y) => x.eval0 - y.eval0);
    const oppShortlist = oppScored.slice(0, Math.min(oppScored.length, K));

    let worstForMe = Infinity;
    for (const { a: oa } of oppShortlist) {
      const after2 = applyAction(after, oa, board);
      const ev = evalState(after2, me, board);
      if (ev < worstForMe) worstForMe = ev;
    }
    if (worstForMe > bestEval) {
      bestEval = worstForMe;
      best = a;
    }
  }

  return best;
}

interface ShapeResult {
  shape: ShapeId;
  p1Wins: number;
  draws: number;
  p2Wins: number;
  avgP1: number;
  avgP2: number;
  avgTurns: number;
  avgPendingPeak: number;
  ms: number;
}

function runShape(shape: ShapeId): ShapeResult {
  const board = getBoard(shape) as unknown as Board;
  let p1Wins = 0;
  let p2Wins = 0;
  let draws = 0;
  let sumP1 = 0;
  let sumP2 = 0;
  let sumTurns = 0;
  let sumPendingPeak = 0;
  const t0 = Date.now();
  for (let i = 0; i < N_GAMES; i++) {
    let state = createState();
    let turns = 0;
    let pendingPeak = 0;
    while (!isFinished(state, board)) {
      const action = pickL4(state, board);
      state = applyAction(state, action, board);
      turns++;
      if (state.pending.size > pendingPeak) pendingPeak = state.pending.size;
      if (turns > 500) throw new Error('runaway');
    }
    sumP1 += state.scores[1];
    sumP2 += state.scores[2];
    sumTurns += turns;
    sumPendingPeak += pendingPeak;
    if (state.scores[1] > state.scores[2]) p1Wins++;
    else if (state.scores[2] > state.scores[1]) p2Wins++;
    else draws++;
  }
  const ms = Date.now() - t0;
  return {
    shape,
    p1Wins,
    draws,
    p2Wins,
    avgP1: sumP1 / N_GAMES,
    avgP2: sumP2 / N_GAMES,
    avgTurns: sumTurns / N_GAMES,
    avgPendingPeak: sumPendingPeak / N_GAMES,
    ms,
  };
}

function main() {
  console.log('Variant F: biggest-line-only scoring + pending claims (L4 vs L4)\n');
  const results: ShapeResult[] = [];
  for (const shape of SHAPES) {
    process.stdout.write(`  ${shape}: `);
    const r = runShape(shape);
    results.push(r);
    console.log(
      `P1 ${r.p1Wins}% / draws ${r.draws}% / P2 ${r.p2Wins}% — avg ${r.avgP1.toFixed(1)} vs ${r.avgP2.toFixed(1)} — turns ${r.avgTurns.toFixed(1)}, pending-peak ${r.avgPendingPeak.toFixed(1)}, ${r.ms}ms`
    );
  }

  let md = `\n---\n\n## Variant F: biggest-line-only + pending claims (L4 vs L4, N=${N_GAMES})\n\n`;
  md += `**Rule:** Placing a dot completes lines → only LARGEST scores; others become pending. Alternative action: claim a pending line (no dot placed). Endgame phase: alternating claims until pending empty.\n\n`;
  md += `| Shape | P1 wins | Draws | P2 wins | Avg P1 | Avg P2 | Avg turns | Pending peak |\n`;
  md += `|---|---|---|---|---|---|---|---|\n`;
  for (const r of results) {
    md += `| ${r.shape} | ${r.p1Wins}% | ${r.draws}% | ${r.p2Wins}% | ${r.avgP1.toFixed(1)} | ${r.avgP2.toFixed(1)} | ${r.avgTurns.toFixed(1)} | ${r.avgPendingPeak.toFixed(1)} |\n`;
  }

  appendFileSync('simulation-results.md', md, 'utf8');
  console.log('\nAppended to simulation-results.md');
}

main();
