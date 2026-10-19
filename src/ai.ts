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
const EASY_SCORE_RATE = 0.6;
const MEDIUM_SAFE_RATE = 0.1;

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

// Pending lines split greedily: whoever moves next takes the biggest, then
// alternate. Discounted because the split rarely plays out that cleanly.
function pendingShare(
  state: GameState,
  me: Player,
  board: BoardShape,
  leader: Player
): number {
  const lengths = state.pending
    .map((id) => board.lines.find((l) => l.id === id)!.length)
    .sort((x, y) => y - x);
  let v = 0;
  let cur = leader;
  for (const len of lengths) {
    v += (cur === me ? len : -len) * PENDING_DISCOUNT;
    cur = cur === 1 ? 2 : 1;
  }
  return v;
}

function scoreDiff(state: GameState, me: Player): number {
  return state.scores[me] - state.scores[me === 1 ? 2 : 1];
}

// Gap dot -> points it scores right now (the biggest line it finishes).
function gapGains(state: GameState, board: BoardShape): Map<number, number> {
  const done = new Set(state.completed.map((c) => c.lineId));
  const pending = new Set(state.pending);
  const gains = new Map<number, number>();
  for (const line of board.lines) {
    if (done.has(line.id) || pending.has(line.id)) continue;
    let gap = -1;
    let empties = 0;
    for (const d of line.dotIds) {
      if (state.colored[d]) continue;
      gap = d;
      if (++empties > 1) break;
    }
    if (empties === 1 && line.length > (gains.get(gap) ?? 0)) gains.set(gap, line.length);
  }
  return gains;
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

// Value of a position where it is my move: either finish the best line now
// (the opponent then leads the pending split) or claim / play quiet (I lead).
function myBestFollowUp(state: GameState, me: Player, board: BoardShape): number {
  if (state.finished) return scoreDiff(state, me);
  const opp: Player = me === 1 ? 2 : 1;
  let best = scoreDiff(state, me) + pendingShare(state, me, board, me);
  for (const dotId of gapGains(state, board).keys()) {
    const after = applyAction(state, { kind: 'dot', dotId });
    best = Math.max(best, scoreDiff(after, me) + pendingShare(after, me, board, opp));
  }
  return best;
}

// Threat order: claims and big finishes first, so the search cuts early.
function byThreat(state: GameState, board: BoardShape, actions: GameAction[]): GameAction[] {
  const gains = gapGains(state, board);
  const threat = (a: GameAction) => (a.kind === 'claim' ? 1000 : gains.get(a.dotId) ?? 0);
  return actions.sort((x, y) => threat(y) - threat(x));
}

// Looks three moves deep: my move, every reply, then my best follow-up.
function pickDeepAction(state: GameState, board: BoardShape, me: Player): GameAction {
  const actions = byThreat(state, board, shuffle(availableActions(state, board)));
  let best = actions[0];
  let bestValue = -Infinity;
  for (const a of actions) {
    const after = applyAction(state, a);
    let worst = Infinity;
    if (after.finished) worst = scoreDiff(after, me);
    else {
      for (const reply of byThreat(after, board, availableActions(after, board))) {
        worst = Math.min(worst, myBestFollowUp(applyAction(after, reply), me, board));
        if (worst <= bestValue) break;
      }
    }
    if (worst > bestValue) {
      bestValue = worst;
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
      return pickDeepAction(state, board, me);
  }
}

