import { getBoard } from './geometry';
import {
  applyAction,
  availableActions,
  availableDots,
  pointsIfPlayed,
} from './game';
import type { BoardShape, Difficulty, GameAction, GameState, Player } from './types';

const PENDING_DISCOUNT = 0.5;
const BEGINNER_SCORE_RATE = 0.35;
const EASY_SCORE_RATE = 0.85;
const MEDIUM_SAFE_RATE = 0.4;

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

function scoringActions(state: GameState, board: BoardShape) {
  return availableActions(state, board)
    .map((a) => ({ a, gain: immediateGainOfAction(state, board, a) }))
    .filter((x) => x.gain > 0);
}

function biggestOf(scoring: { a: GameAction; gain: number }[]): GameAction {
  const top = Math.max(...scoring.map((x) => x.gain));
  return rand(scoring.filter((x) => x.gain === top)).a;
}

function fallbackRandomAction(state: GameState, board: BoardShape): GameAction {
  const dots = availableDots(state, board);
  if (dots.length > 0) return { kind: 'dot', dotId: rand(dots) };
  return { kind: 'claim', lineId: rand(state.pending) };
}

// Finishes some line now and then (not necessarily the biggest), so a
// beginner sees that the bot scores and can take waiting lines too.
function pickBeginnerAction(state: GameState, board: BoardShape): GameAction {
  const scoring = scoringActions(state, board);
  if (scoring.length > 0 && Math.random() < BEGINNER_SCORE_RATE) return rand(scoring).a;
  return fallbackRandomAction(state, board);
}

function pickEasyAction(state: GameState, board: BoardShape): GameAction {
  const scoring = scoringActions(state, board);
  if (scoring.length > 0 && Math.random() < EASY_SCORE_RATE) return biggestOf(scoring);
  return fallbackRandomAction(state, board);
}

// Greedy; with nothing to score, sometimes picks a dot that hands the
// opponent nothing new.
function pickMediumAction(state: GameState, board: BoardShape): GameAction {
  const scoring = scoringActions(state, board);
  if (scoring.length > 0) return biggestOf(scoring);
  if (Math.random() < MEDIUM_SAFE_RATE) {
    const before = opponentBestResponseGain(state, board);
    const safe = availableDots(state, board).filter(
      (d) => opponentBestResponseGain(applyAction(state, { kind: 'dot', dotId: d }), board) <= before
    );
    if (safe.length > 0) return { kind: 'dot', dotId: rand(safe) };
  }
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
      return pickBeginnerAction(state, board);
    case 2:
      return pickEasyAction(state, board);
    case 3:
      return pickMediumAction(state, board);
    case 4:
      return pickGreedyMinSetupAction(state, board);
    case 5:
      return pickMinimaxAction(state, board, me);
  }
}

