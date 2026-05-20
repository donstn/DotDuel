import { getBoard } from './geometry';
import {
  applyAction,
  availableActions,
  availableDots,
  pointsIfPlayed,
} from './game';
import type { BoardShape, Difficulty, GameAction, GameState, Player } from './types';

const PENDING_DISCOUNT = 0.5;

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function evalState(state: GameState, me: Player, board: BoardShape): number {
  const opp: Player = me === 1 ? 2 : 1;
  let v = state.scores[me] - state.scores[opp];
  if (state.pending.length === 0) return v;
  const pendingLines = board.lines
    .filter((l) => state.pending.includes(l.id))
    .sort((a, b) => b.length - a.length);
  let cur: Player = state.current;
  for (const line of pendingLines) {
    if (cur === me) v += line.length * PENDING_DISCOUNT;
    else v -= line.length * PENDING_DISCOUNT;
    cur = cur === 1 ? 2 : 1;
  }
  return v;
}

function immediateGainOfAction(
  state: GameState,
  board: BoardShape,
  action: GameAction
): number {
  if (action.kind === 'claim') {
    const line = board.lines.find((l) => l.id === action.lineId);
    return line ? line.length : 0;
  }
  return pointsIfPlayed(state, board, action.dotId).gained;
}

function pickPureRandomAction(state: GameState, board: BoardShape): GameAction {
  const actions = availableActions(state, board);
  return rand(actions);
}

function fallbackRandomAction(state: GameState, board: BoardShape): GameAction {
  const dots = availableDots(state, board);
  if (dots.length > 0) return { kind: 'dot', dotId: rand(dots) };
  return { kind: 'claim', lineId: rand(state.pending) };
}

function pickEasyAction(state: GameState, board: BoardShape): GameAction {
  const actions = availableActions(state, board);
  let bestObvious: GameAction | null = null;
  let bestObviousGain = 0;
  for (const a of shuffle(actions)) {
    if (a.kind === 'claim') {
      const line = board.lines.find((l) => l.id === a.lineId);
      if (line && line.length === 1 && line.length > bestObviousGain) {
        bestObviousGain = line.length;
        bestObvious = a;
      }
      continue;
    }
    const { gained, biggest } = pointsIfPlayed(state, board, a.dotId);
    const closesCorner = biggest !== null && biggest.length === 1;
    const isBigWin = gained >= 5;
    if ((closesCorner || isBigWin) && gained > bestObviousGain) {
      bestObviousGain = gained;
      bestObvious = a;
    }
  }
  if (bestObvious) return bestObvious;
  return fallbackRandomAction(state, board);
}

function pickGreedyOrRandomAction(state: GameState, board: BoardShape): GameAction {
  const actions = availableActions(state, board);
  let best: GameAction | null = null;
  let bestGain = 0;
  for (const a of shuffle(actions)) {
    const gain = immediateGainOfAction(state, board, a);
    if (gain > bestGain) {
      bestGain = gain;
      best = a;
    }
  }
  if (best) return best;
  return fallbackRandomAction(state, board);
}

function opponentBestResponseGain(
  stateAfterMyMove: GameState,
  board: BoardShape
): number {
  let best = 0;
  for (const a of availableActions(stateAfterMyMove, board)) {
    const g = immediateGainOfAction(stateAfterMyMove, board, a);
    if (g > best) best = g;
  }
  return best;
}

function pickGreedyMinSetupAction(state: GameState, board: BoardShape): GameAction {
  const actions = availableActions(state, board);
  let best: GameAction = actions[0];
  let bestScore = -Infinity;
  for (const a of shuffle(actions)) {
    const myGain = immediateGainOfAction(state, board, a);
    const after = applyAction(state, a);
    const oppGain = after.finished ? 0 : opponentBestResponseGain(after, board);
    const score = myGain - oppGain;
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  return best;
}

function pickMinimaxAction(
  state: GameState,
  board: BoardShape,
  me: Player
): GameAction {
  const actions = availableActions(state, board);
  if (actions.length === 0) {
    return { kind: 'dot', dotId: -1 };
  }

  const myScored = actions.map((a) => ({
    a,
    after: applyAction(state, a),
  }));
  myScored.sort(
    (x, y) => evalState(y.after, me, board) - evalState(x.after, me, board)
  );

  const branchLimit = actions.length <= 16 ? 16 : 10;
  const myShortlist = myScored.slice(0, Math.min(myScored.length, branchLimit));

  let best: GameAction = myShortlist[0].a;
  let bestEval = -Infinity;

  for (const { a, after } of shuffle(myShortlist)) {
    if (after.finished) {
      const ev = evalState(after, me, board);
      if (ev > bestEval) {
        bestEval = ev;
        best = a;
      }
      continue;
    }
    const oppActions = availableActions(after, board);
    if (oppActions.length === 0) {
      const ev = evalState(after, me, board);
      if (ev > bestEval) {
        bestEval = ev;
        best = a;
      }
      continue;
    }
    const oppScored = oppActions.map((oa) => ({
      a: oa,
      after2: applyAction(after, oa),
    }));
    oppScored.sort(
      (x, y) => evalState(x.after2, me, board) - evalState(y.after2, me, board)
    );
    const oppShortlist = oppScored.slice(
      0,
      Math.min(oppScored.length, branchLimit)
    );

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

export function pickAIAction(
  state: GameState,
  difficulty: Difficulty,
  me: Player
): GameAction {
  const board = getBoard(state.shape);
  switch (difficulty) {
    case 1:
      return pickPureRandomAction(state, board);
    case 2:
      return pickEasyAction(state, board);
    case 3:
      return pickGreedyOrRandomAction(state, board);
    case 4:
      return pickGreedyMinSetupAction(state, board);
    case 5:
      return pickMinimaxAction(state, board, me);
  }
}

