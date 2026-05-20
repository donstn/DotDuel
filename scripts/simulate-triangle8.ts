// Self-contained test: triangle with 8 dots on the top edge (36 dots total).
// Mirrors the production rule set (Variant F + biggest-line + pending claims)
// and the production L5 AI (2-ply minimax + PENDING_DISCOUNT = 0.5).
//
// Goal: see whether enlarging Triangle reduces the P1 win-rate skew.

import { appendFileSync } from 'node:fs';

const TOP_ROW = 8;
const N = 1000;

type Player = 1 | 2;

interface Dot {
  id: number;
  row: number;
  col: number;
  x: number;
  y: number;
}

interface Line {
  id: string;
  dotIds: number[];
  length: number;
  kind: 'h' | 'd1' | 'd2';
}

interface Board {
  dots: Dot[];
  lines: Line[];
}

interface State {
  current: Player;
  colored: Record<number, Player>;
  completed: Set<string>;
  pending: Set<string>;
  scores: { 1: number; 2: number };
}

type Action =
  | { kind: 'dot'; dotId: number }
  | { kind: 'claim'; lineId: string };

const PENDING_DISCOUNT = 0.5;
const ROW_TRI = Math.sqrt(3) / 2;

function buildTriangle(topRow: number): Board {
  const dots: Dot[] = [];
  let id = 0;
  for (let r = 0; r < topRow; r++) {
    const len = topRow - r;
    for (let c = 0; c < len; c++) {
      dots.push({
        id: id++,
        row: r,
        col: c,
        x: r / 2 + c,
        y: r * ROW_TRI,
      });
    }
  }
  const buckets = new Map<string, { kind: Line['kind']; ids: number[] }>();
  const push = (key: string, kind: Line['kind'], dotId: number) => {
    let b = buckets.get(key);
    if (!b) {
      b = { kind, ids: [] };
      buckets.set(key, b);
    }
    b.ids.push(dotId);
  };
  for (const d of dots) {
    push(`h:${d.row}`, 'h', d.id);
    push(`d1:${d.col}`, 'd1', d.id);
    push(`d2:${d.row + d.col}`, 'd2', d.id);
  }
  const lines: Line[] = [];
  for (const [key, { kind, ids }] of buckets) {
    if (ids.length === 0) continue;
    ids.sort((a, b) => {
      const da = dots[a];
      const db = dots[b];
      if (da.y !== db.y) return da.y - db.y;
      return da.x - db.x;
    });
    lines.push({ id: key, dotIds: ids, length: ids.length, kind });
  }
  return { dots, lines };
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
  return a.kind === 'dot' ? placeDot(s, a.dotId, board) : claimLine(s, a.lineId, board);
}

function evalState(s: State, me: Player, board: Board): number {
  const opp: Player = me === 1 ? 2 : 1;
  let v = s.scores[me] - s.scores[opp];
  if (s.pending.size === 0) return v;
  const pendingLines = board.lines
    .filter((l) => s.pending.has(l.id))
    .sort((a, b) => b.length - a.length);
  let cur: Player = s.current;
  for (const line of pendingLines) {
    if (cur === me) v += line.length * PENDING_DISCOUNT;
    else v -= line.length * PENDING_DISCOUNT;
    cur = cur === 1 ? 2 : 1;
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

function pickL5(s: State, board: Board): Action {
  const me = s.current;
  const actions = listActions(s, board);
  if (actions.length === 0) throw new Error('no actions');
  const myScored = actions.map((a) => ({ a, after: applyAction(s, a, board) }));
  myScored.sort((x, y) => evalState(y.after, me, board) - evalState(x.after, me, board));
  const K = actions.length <= 16 ? 16 : 10;
  const myShortlist = myScored.slice(0, Math.min(myScored.length, K));

  let best = myShortlist[0].a;
  let bestEval = -Infinity;

  for (const { a, after } of shuffle(myShortlist)) {
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
    const oppScored = oppActions.map((oa) => ({ a: oa, after2: applyAction(after, oa, board) }));
    oppScored.sort((x, y) => evalState(x.after2, me, board) - evalState(y.after2, me, board));
    const oppShortlist = oppScored.slice(0, Math.min(oppScored.length, K));

    let worstForMe = Infinity;
    for (const { after2 } of oppShortlist) {
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

function main() {
  const board = buildTriangle(TOP_ROW);
  const dots = board.dots.length;
  const totalPoints = board.lines.reduce((sum, l) => sum + l.length, 0);
  const parity: 'even' | 'odd' = dots % 2 === 0 ? 'even' : 'odd';
  const lastMover: 1 | 2 = dots % 2 === 0 ? 2 : 1;

  console.log(
    `Triangle (top row = ${TOP_ROW}, ${dots} dots, ${board.lines.length} lines, ${totalPoints} total points, parity ${parity}, last mover P${lastMover})`
  );
  console.log(`Running L5 vs L5 simulation, N=${N}\n`);

  let p1Wins = 0;
  let p2Wins = 0;
  let draws = 0;
  let sumP1 = 0;
  let sumP2 = 0;
  let sumTurns = 0;
  let sumP1Turns = 0;
  let sumP2Turns = 0;
  let scoringIntegrity = true;
  let doubleTurns = 0;
  const t0 = Date.now();

  for (let i = 0; i < N; i++) {
    let state = createState();
    let turns = 0;
    let p1Turns = 0;
    let p2Turns = 0;
    let safety = 0;
    while (!isFinished(state, board)) {
      if (++safety > 800) throw new Error('runaway');
      const before = state.current;
      const action = pickL5(state, board);
      const next = applyAction(state, action, board);
      turns++;
      if (before === 1) p1Turns++;
      else p2Turns++;
      if (!isFinished(next, board) && next.current === before) doubleTurns++;
      state = next;
    }
    if (state.scores[1] + state.scores[2] !== totalPoints) scoringIntegrity = false;
    sumP1 += state.scores[1];
    sumP2 += state.scores[2];
    sumTurns += turns;
    sumP1Turns += p1Turns;
    sumP2Turns += p2Turns;
    if (state.scores[1] > state.scores[2]) p1Wins++;
    else if (state.scores[2] > state.scores[1]) p2Wins++;
    else draws++;
    if ((i + 1) % 200 === 0) {
      process.stdout.write(`  ${i + 1}/${N} games... `);
    }
  }
  const ms = Date.now() - t0;

  const avgP1 = sumP1 / N;
  const avgP2 = sumP2 / N;
  const gap = avgP1 - avgP2;
  const gapPct = (gap / totalPoints) * 100;
  const p1Pct = (p1Wins / N) * 100;
  const drawPct = (draws / N) * 100;
  const p2Pct = (p2Wins / N) * 100;

  console.log(`\ndone in ${(ms / 1000).toFixed(1)}s.\n`);
  console.log(`P1 wins: ${p1Pct.toFixed(1)}%   draws: ${drawPct.toFixed(1)}%   P2 wins: ${p2Pct.toFixed(1)}%`);
  console.log(`Avg score: P1 ${avgP1.toFixed(1)} vs P2 ${avgP2.toFixed(1)} (gap ${gap.toFixed(2)}, ${gapPct.toFixed(2)}% of total)`);
  console.log(`Avg turns: ${(sumTurns / N).toFixed(1)} (P1 ${(sumP1Turns / N).toFixed(1)} / P2 ${(sumP2Turns / N).toFixed(1)})`);
  console.log(`Integrity: ${scoringIntegrity ? 'OK' : 'FAIL'}   Double-turns: ${doubleTurns}`);

  let md = `\n---\n\n## Triangle TOP=${TOP_ROW} (${dots} dots) — L5 vs L5, N=${N}\n\n`;
  md += `- Total points on board: **${totalPoints}**\n`;
  md += `- Parity: ${parity}, last mover P${lastMover}\n`;
  md += `- Win rates: **P1 ${p1Pct.toFixed(1)}% / draws ${drawPct.toFixed(1)}% / P2 ${p2Pct.toFixed(1)}%**\n`;
  md += `- Average score: P1 ${avgP1.toFixed(1)} vs P2 ${avgP2.toFixed(1)} (gap ${gap.toFixed(2)}, ${gapPct.toFixed(2)}% of total)\n`;
  md += `- Average turns: ${(sumTurns / N).toFixed(1)} (P1 ${(sumP1Turns / N).toFixed(1)} / P2 ${(sumP2Turns / N).toFixed(1)})\n`;
  md += `- Scoring integrity: ${scoringIntegrity ? 'OK' : '**FAIL**'}\n`;
  md += `- Double-turn anomalies: ${doubleTurns}\n`;
  md += `- Runtime: ${(ms / 1000).toFixed(1)}s\n`;
  appendFileSync('simulation-results.md', md, 'utf8');
  console.log('\nAppended to simulation-results.md');
}

main();
