import { getBoard } from './geometry';
import type {
  BoardShape,
  CompletedLine,
  Difficulty,
  GameAction,
  GameMode,
  GameState,
  Line,
  Player,
  ShapeId,
} from './types';

export function createGame(
  shape: ShapeId,
  mode: GameMode,
  difficulty?: Difficulty
): GameState {
  return {
    shape,
    mode,
    difficulty,
    current: 1,
    turn: 0,
    colored: {},
    completed: [],
    pending: [],
    scores: { 1: 0, 2: 0 },
    finished: false,
    winner: null,
  };
}

export interface MoveResult {
  state: GameState;
  scoredLine: CompletedLine | null;
  newlyPending: string[];
  pointsGained: number;
}

function nextPlayer(p: Player): Player {
  return p === 1 ? 2 : 1;
}

function finalize(state: GameState, board: BoardShape): GameState {
  const allColored = board.dots.every((d) => state.colored[d.id]);
  if (allColored && state.pending.length === 0) {
    const winner =
      state.scores[1] > state.scores[2]
        ? 1
        : state.scores[2] > state.scores[1]
          ? 2
          : 'draw';
    return { ...state, finished: true, winner };
  }
  return state;
}

export function applyMove(state: GameState, dotId: number): MoveResult {
  if (state.finished) throw new Error('Game finished');
  if (state.colored[dotId]) throw new Error('Dot already colored');
  const board = getBoard(state.shape);
  const player = state.current;
  const turn = state.turn + 1;

  const colored = {
    ...state.colored,
    [dotId]: { player, turn },
  };

  const already = new Set(state.completed.map((c) => c.lineId));
  const pendingSet = new Set(state.pending);
  const newlyComplete: Line[] = [];

  for (const line of board.lines) {
    if (already.has(line.id)) continue;
    if (pendingSet.has(line.id)) continue;
    if (!line.dotIds.includes(dotId)) continue;
    if (line.dotIds.every((id) => colored[id])) {
      newlyComplete.push(line);
    }
  }

  let scoredLine: CompletedLine | null = null;
  const newlyPending: string[] = [];
  let pointsGained = 0;
  const completed = [...state.completed];

  if (newlyComplete.length > 0) {
    newlyComplete.sort((a, b) => b.length - a.length);
    const winner = newlyComplete[0];
    scoredLine = { lineId: winner.id, player, turn };
    completed.push(scoredLine);
    pointsGained = winner.length;
    for (let i = 1; i < newlyComplete.length; i++) {
      newlyPending.push(newlyComplete[i].id);
    }
  }

  const pending = [...state.pending, ...newlyPending];
  const scores = { ...state.scores, [player]: state.scores[player] + pointsGained };

  let next: GameState = {
    ...state,
    colored,
    completed,
    pending,
    scores,
    turn,
    current: nextPlayer(player),
  };
  next = finalize(next, board);

  return { state: next, scoredLine, newlyPending, pointsGained };
}

export interface ClaimResult {
  state: GameState;
  scoredLine: CompletedLine;
  pointsGained: number;
}

export function applyClaim(state: GameState, lineId: string): ClaimResult {
  if (state.finished) throw new Error('Game finished');
  if (!state.pending.includes(lineId)) throw new Error('Line not pending');
  const board = getBoard(state.shape);
  const line = board.lines.find((l) => l.id === lineId);
  if (!line) throw new Error('Unknown line');
  const player = state.current;
  const turn = state.turn + 1;
  const scoredLine: CompletedLine = { lineId, player, turn };
  const completed = [...state.completed, scoredLine];
  const pending = state.pending.filter((id) => id !== lineId);
  const scores = { ...state.scores, [player]: state.scores[player] + line.length };

  let next: GameState = {
    ...state,
    completed,
    pending,
    scores,
    turn,
    current: nextPlayer(player),
  };
  next = finalize(next, board);

  return { state: next, scoredLine, pointsGained: line.length };
}

export function applyAction(
  state: GameState,
  action: GameAction
): GameState {
  if (action.kind === 'dot') return applyMove(state, action.dotId).state;
  return applyClaim(state, action.lineId).state;
}

export function availableDots(state: GameState, board: BoardShape): number[] {
  return board.dots.filter((d) => !state.colored[d.id]).map((d) => d.id);
}

export function availableActions(
  state: GameState,
  board: BoardShape
): GameAction[] {
  const actions: GameAction[] = [];
  for (const id of availableDots(state, board)) actions.push({ kind: 'dot', dotId: id });
  for (const id of state.pending) actions.push({ kind: 'claim', lineId: id });
  return actions;
}

export function pointsIfPlayed(
  state: GameState,
  board: BoardShape,
  dotId: number
): { gained: number; biggest: Line | null; pending: Line[] } {
  if (state.colored[dotId]) return { gained: 0, biggest: null, pending: [] };
  const already = new Set(state.completed.map((c) => c.lineId));
  const pendingSet = new Set(state.pending);
  const completing: Line[] = [];
  for (const line of board.lines) {
    if (already.has(line.id)) continue;
    if (pendingSet.has(line.id)) continue;
    if (!line.dotIds.includes(dotId)) continue;
    let allOthers = true;
    for (const id of line.dotIds) {
      if (id === dotId) continue;
      if (!state.colored[id]) {
        allOthers = false;
        break;
      }
    }
    if (allOthers) completing.push(line);
  }
  if (completing.length === 0) return { gained: 0, biggest: null, pending: [] };
  completing.sort((a, b) => b.length - a.length);
  return {
    gained: completing[0].length,
    biggest: completing[0],
    pending: completing.slice(1),
  };
}

