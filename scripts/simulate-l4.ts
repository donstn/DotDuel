import { appendFileSync } from 'node:fs';
import { applyAction, createGame } from '../src/game';
import { pickAIAction } from '../src/ai';
import { getBoard } from '../src/geometry';
import type { ShapeId } from '../src/types';

const SHAPES: ShapeId[] = ['triangle', 'rhombus', 'square', 'rectangle'];
const N = 1000;
const LEVEL = 5;

interface GameRun {
  winner: 1 | 2 | 'draw' | null;
  s1: number;
  s2: number;
  turns: number;
  p1Turns: number;
  p2Turns: number;
  anomaly: string | null;
}

function simulateOne(shape: ShapeId): GameRun {
  let state = createGame(shape, 'ai', LEVEL);
  let turns = 0;
  let p1Turns = 0;
  let p2Turns = 0;
  let anomaly: string | null = null;
  while (!state.finished) {
    const before = state.current;
    const action = pickAIAction(state, LEVEL, state.current);
    const next = applyAction(state, action);
    turns++;
    if (before === 1) p1Turns++;
    else p2Turns++;
    if (!next.finished && next.current === before) {
      anomaly = `double-turn at turn ${turns} (current stayed P${before})`;
    }
    state = next;
    if (turns > 500) {
      anomaly = anomaly ?? `runaway (>500 turns)`;
      break;
    }
  }
  return {
    winner: state.winner,
    s1: state.scores[1],
    s2: state.scores[2],
    turns,
    p1Turns,
    p2Turns,
    anomaly,
  };
}

interface Row {
  shape: ShapeId;
  dots: number;
  totalPoints: number;
  oddEven: 'odd' | 'even';
  lastMover: 1 | 2;
  p1Wins: number;
  draws: number;
  p2Wins: number;
  avgP1: number;
  avgP2: number;
  avgTurns: number;
  avgP1Turns: number;
  avgP2Turns: number;
  scoringIntegrity: boolean;
  doubleTurns: number;
  ms: number;
}

function runShape(shape: ShapeId): Row {
  const board = getBoard(shape);
  const dots = board.dots.length;
  const totalPoints = board.lines.reduce((sum, l) => sum + l.length, 0);
  const oddEven = dots % 2 === 0 ? 'even' : 'odd';
  const lastMover: 1 | 2 = dots % 2 === 0 ? 2 : 1;
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
    const r = simulateOne(shape);
    sumP1 += r.s1;
    sumP2 += r.s2;
    sumTurns += r.turns;
    sumP1Turns += r.p1Turns;
    sumP2Turns += r.p2Turns;
    if (r.s1 + r.s2 !== totalPoints) scoringIntegrity = false;
    if (r.anomaly?.startsWith('double-turn')) doubleTurns++;
    if (r.winner === 1) p1Wins++;
    else if (r.winner === 2) p2Wins++;
    else draws++;
  }
  const ms = Date.now() - t0;
  return {
    shape,
    dots,
    totalPoints,
    oddEven,
    lastMover,
    p1Wins,
    draws,
    p2Wins,
    avgP1: sumP1 / N,
    avgP2: sumP2 / N,
    avgTurns: sumTurns / N,
    avgP1Turns: sumP1Turns / N,
    avgP2Turns: sumP2Turns / N,
    scoringIntegrity,
    doubleTurns,
    ms,
  };
}

function main() {
  console.log(`Running L${LEVEL} (Impossible) vs L${LEVEL} simulation, N=${N} per shape\n`);
  const rows: Row[] = [];
  for (const s of SHAPES) {
    process.stdout.write(`  ${s}: `);
    const r = runShape(s);
    rows.push(r);
    const integrityFlag = r.scoringIntegrity ? '✓' : '✗ SCORING MISMATCH';
    const doubleFlag = r.doubleTurns === 0 ? '✓ no double-turns' : `✗ ${r.doubleTurns} double-turns`;
    console.log(
      `P1 ${(r.p1Wins / N * 100).toFixed(1)}% / draws ${(r.draws / N * 100).toFixed(1)}% / P2 ${(r.p2Wins / N * 100).toFixed(1)}% — ` +
      `avg ${r.avgP1.toFixed(1)} vs ${r.avgP2.toFixed(1)} of ${r.totalPoints} — ` +
      `turns ${r.avgTurns.toFixed(1)} (P1:${r.avgP1Turns.toFixed(1)} P2:${r.avgP2Turns.toFixed(1)}) — ` +
      `${integrityFlag} ${doubleFlag} — ${r.ms}ms`
    );
  }

  let md = `\n---\n\n## L${LEVEL} (Impossible) vs L${LEVEL} — all shapes (N=${N} per shape)\n\n`;
  md += `| Shape | Dots | Total pts | Parity | Last move | P1 wins | Draws | P2 wins | Avg P1 | Avg P2 | Avg turns | P1/P2 turns | Integrity | Double-turns |\n`;
  md += `|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
  for (const r of rows) {
    const integrity = r.scoringIntegrity ? 'OK' : '**FAIL**';
    const dt = r.doubleTurns === 0 ? '0' : `**${r.doubleTurns}**`;
    md += `| ${r.shape} | ${r.dots} | ${r.totalPoints} | ${r.oddEven} | P${r.lastMover} | `;
    md += `${(r.p1Wins / N * 100).toFixed(1)}% | ${(r.draws / N * 100).toFixed(1)}% | ${(r.p2Wins / N * 100).toFixed(1)}% | `;
    md += `${r.avgP1.toFixed(1)} | ${r.avgP2.toFixed(1)} | ${r.avgTurns.toFixed(1)} | ${r.avgP1Turns.toFixed(1)}/${r.avgP2Turns.toFixed(1)} | `;
    md += `${integrity} | ${dt} |\n`;
  }

  md += `\n**Integrity check:** every game's combined player scores must equal the total points (sum of all line lengths).\n`;
  md += `**Double-turn check:** track whether \`state.current\` ever stays on the same player across two consecutive non-finishing actions.\n`;

  console.log('\n=== Summary table ===');
  console.log(md);

  appendFileSync('simulation-results.md', md, 'utf8');
  console.log('Appended to simulation-results.md');
}

main();
