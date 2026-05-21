import { applyAction, createGame } from '../src/game';
import { pickAIAction } from '../src/ai';
import { getBoard } from '../src/geometry';

const N = 50;
const LEVEL = 5;

interface GameRun {
  winner: 1 | 2 | 'draw' | null;
  s1: number;
  s2: number;
  turns: number;
  p1Turns: number;
  p2Turns: number;
  maxPending: number;
  finalPending: number;
  anomaly: string | null;
}

function simulateOne(): GameRun {
  let state = createGame('square', 'ai', LEVEL);
  let turns = 0;
  let p1Turns = 0;
  let p2Turns = 0;
  let maxPending = 0;
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
    if (next.pending.length > maxPending) maxPending = next.pending.length;
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
    maxPending,
    finalPending: state.pending.length,
    anomaly,
  };
}

function main() {
  const board = getBoard('square');
  const totalPoints = board.lines.reduce((sum, l) => sum + l.length, 0);
  console.log(
    `Square L${LEVEL} vs L${LEVEL} — N=${N} games · ${board.dots.length} dots · ${board.lines.length} lines · ${totalPoints} total points\n`
  );

  let p1Wins = 0;
  let p2Wins = 0;
  let draws = 0;
  let sumP1 = 0;
  let sumP2 = 0;
  let sumTurns = 0;
  let sumMaxPending = 0;
  let scoringIntegrityFails = 0;
  let doubleTurns = 0;
  let cleanGames = 0;
  let anomalies: string[] = [];
  let finalPendingNonZero = 0;

  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const r = simulateOne();
    sumP1 += r.s1;
    sumP2 += r.s2;
    sumTurns += r.turns;
    sumMaxPending += r.maxPending;
    if (r.s1 + r.s2 !== totalPoints) scoringIntegrityFails++;
    if (r.finalPending !== 0) finalPendingNonZero++;
    if (r.anomaly?.startsWith('double-turn')) doubleTurns++;
    if (r.winner === 1) p1Wins++;
    else if (r.winner === 2) p2Wins++;
    else draws++;
    if (r.anomaly) anomalies.push(`game ${i + 1}: ${r.anomaly}`);
    else cleanGames++;
  }
  const ms = Date.now() - t0;

  const avgP1 = sumP1 / N;
  const avgP2 = sumP2 / N;
  const avgTurns = sumTurns / N;
  const avgMaxPending = sumMaxPending / N;

  console.log(`Results:`);
  console.log(`  P1 wins        : ${p1Wins} (${((p1Wins / N) * 100).toFixed(1)}%)`);
  console.log(`  Draws          : ${draws} (${((draws / N) * 100).toFixed(1)}%)`);
  console.log(`  P2 wins        : ${p2Wins} (${((p2Wins / N) * 100).toFixed(1)}%)`);
  console.log(`  Avg score      : P1 ${avgP1.toFixed(1)} vs P2 ${avgP2.toFixed(1)} of ${totalPoints}`);
  console.log(`  Avg turns      : ${avgTurns.toFixed(1)}`);
  console.log(`  Avg max pending: ${avgMaxPending.toFixed(2)} (peak pending lines in a single game)`);

  console.log(`\nIntegrity checks:`);
  console.log(`  Scoring totals match (s1 + s2 == totalPoints): ${scoringIntegrityFails === 0 ? 'OK' : `FAIL (${scoringIntegrityFails}/${N})`}`);
  console.log(`  Final pending empty at game end             : ${finalPendingNonZero === 0 ? 'OK' : `FAIL (${finalPendingNonZero}/${N})`}`);
  console.log(`  No double-turn anomalies                    : ${doubleTurns === 0 ? 'OK' : `FAIL (${doubleTurns}/${N})`}`);
  console.log(`  Clean games (no anomalies)                  : ${cleanGames}/${N}`);

  if (anomalies.length > 0) {
    console.log(`\nAnomalies:`);
    for (const a of anomalies.slice(0, 10)) console.log(`  - ${a}`);
    if (anomalies.length > 10) console.log(`  ... and ${anomalies.length - 10} more`);
  }

  console.log(`\nRuntime: ${ms}ms (${(ms / N).toFixed(1)}ms/game)`);

  const allOk =
    scoringIntegrityFails === 0 && doubleTurns === 0 && finalPendingNonZero === 0;
  console.log(`\n${allOk ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED — review anomalies above'}`);
  process.exit(allOk ? 0 : 1);
}

main();
