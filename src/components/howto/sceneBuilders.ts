/**
 * "How to play" animated scenes. Each scene is a list of precomputed frames
 * (full GameState snapshots) the player cycles through on a loop — a tiny,
 * deterministic GIF driven by the REAL engine (applyMove/applyClaim) so what
 * the tutorial shows is exactly what the game does.
 *
 * Setup dots are placed with prefill() (colours a dot WITHOUT scoring) so we can
 * stage a board; the illustrative move/claim then runs through the engine and
 * scores for real (biggest-only + pending falls out naturally).
 */
import { applyClaim, applyMove } from '../../game';
import { createGame } from '../../game';
import { getBoard } from '../../geometry';
import type { GameState, Player, ShapeId } from '../../types';

export interface SceneScore {
  dotId: number;
  points: number;
  player: Player;
  seq: number;
}

export interface Frame {
  state: GameState;
  lastDot: number | null;
  score: SceneScore | null;
  hold: number;
}

/** A scene id maps to a caption in `t.howto.scenes[id]`. */
export interface Scene {
  id: string;
  shape: ShapeId;
  frames: Frame[];
}

const HOLD_EMPTY = 650;
const HOLD_STEP = 560;
const HOLD_SCORE = 1500;
const HOLD_END = 1300;

class Rec {
  state: GameState;
  frames: Frame[] = [];
  private seq = 0;

  constructor(shape: ShapeId) {
    this.state = createGame(shape, 'hotseat');
  }

  private snap(hold: number, lastDot: number | null, score: SceneScore | null) {
    this.frames.push({ state: this.state, lastDot, score, hold });
  }

  /** Snapshot the current board (e.g. an empty/hold frame). */
  hold(ms: number) {
    this.snap(ms, null, null);
  }

  /** Colour dots without running the engine — pure staging, never scores. */
  prefill(dotIds: number[], by: Player) {
    const colored = { ...this.state.colored };
    let turn = this.state.turn;
    for (const id of dotIds) colored[id] = { player: by, turn: ++turn };
    this.state = { ...this.state, colored, turn };
  }

  /** Place a dot for `by`; snapshots the result (with a +N float when it scores). */
  place(dotId: number, by: Player, hold = HOLD_STEP) {
    const r = applyMove({ ...this.state, current: by }, dotId);
    this.state = r.state;
    const score =
      r.pointsGained > 0 && r.scoredLine
        ? { dotId, points: r.pointsGained, player: by, seq: ++this.seq }
        : null;
    this.snap(score ? Math.max(hold, HOLD_SCORE) : hold, dotId, score);
  }

  /** Claim a pending line for `by`; floats +N over the line's first dot. */
  claim(lineId: string, by: Player, anchorDot: number, hold = HOLD_SCORE) {
    const r = applyClaim({ ...this.state, current: by }, lineId);
    this.state = r.state;
    this.snap(hold, null, {
      dotId: anchorDot,
      points: r.pointsGained,
      player: by,
      seq: ++this.seq,
    });
  }
}

function dotId(shape: ShapeId, r: number, c: number): number {
  const d = getBoard(shape).dots.find((x) => x.row === r && x.col === c);
  if (!d) throw new Error(`no dot ${shape} ${r},${c}`);
  return d.id;
}

function lineDots(shape: ShapeId, lineId: string): number[] {
  const l = getBoard(shape).lines.find((x) => x.id === lineId);
  if (!l) throw new Error(`no line ${shape} ${lineId}`);
  return l.dotIds;
}

/** Dots that are a 1-point line on their own (board corners/edges). */
function cornerDots(shape: ShapeId): Set<number> {
  const s = new Set<number>();
  for (const l of getBoard(shape).lines) if (l.length === 1) s.add(l.dotIds[0]);
  return s;
}

const other = (p: Player): Player => (p === 1 ? 2 : 1);

/**
 * Build one line and score it. Players ALTERNATE (so the line is two-coloured,
 * not one) — teaching that whoever places the LAST dot scores the whole line,
 * not whoever owns the most dots. Corner dots on the line (themselves 1-point
 * lines) are pre-filled silently so they don't fire stray +1s.
 */
function playLine(rec: Rec, shape: ShapeId, lineId: string, startBy: Player = 1) {
  const corners = cornerDots(shape);
  // Skip dots already on the board (shared with a previously-drawn line) so we
  // can accumulate several lines without re-placing — the line still scores its
  // full geometric length when its last NEW dot lands.
  const dots = lineDots(shape, lineId).filter((d) => !rec.state.colored[d]);
  const pre = dots.filter((d) => corners.has(d));
  const seq = dots.filter((d) => !corners.has(d));
  if (pre.length) rec.prefill(pre, 2);
  seq.forEach((id, i) => {
    const by: Player = i % 2 === 0 ? startBy : other(startBy);
    rec.place(id, by, i === seq.length - 1 ? HOLD_SCORE : HOLD_STEP);
  });
}

/** Score one full line on a fresh board (players alternate). */
function buildScoreLine(shape: ShapeId, lineId: string, startBy: Player = 1): Rec {
  const rec = new Rec(shape);
  rec.hold(HOLD_EMPTY);
  playLine(rec, shape, lineId, startBy);
  rec.hold(HOLD_END);
  return rec;
}

// ---- scenes ----

/**
 * A single corner dot is a 1-point line. Corners are usually grabbed first, so
 * this leads the tutorial: place a dot, and the corner scores 1 immediately.
 */
function sceneCorner(): Scene {
  const shape: ShapeId = 'triangle';
  const rec = new Rec(shape);
  rec.hold(HOLD_EMPTY);
  // a couple of opponent dots first → shows it's a two-player game
  rec.place(dotId(shape, 1, 2), 2, 850);
  rec.place(dotId(shape, 2, 3), 1, 850);
  // the apex is its own 1-dot horizontal line → scores 1 when placed
  rec.place(dotId(shape, 7, 0), 1, HOLD_SCORE);
  rec.hold(HOLD_END);
  return { id: 'corner', shape, frames: rec.frames };
}

/** Complete a longer line → score its length. */
function sceneLineScored(): Scene {
  return { id: 'lineScored', shape: 'triangle', frames: buildScoreLine('triangle', 'h:r3', 1).frames };
}

/**
 * One move finishes several lines at once → the longest scores, the rest go
 * pending; then claim the pending ones (shared pool — either player).
 */
function sceneClaim(): Scene {
  const shape: ShapeId = 'square';
  const rec = new Rec(shape);
  const center = dotId(shape, 3, 3);
  // Four length-7 lines through the centre (h, v, both diagonals), pre-filled
  // except the shared centre dot. Placing the centre completes all four.
  const lines = ['h:r3', 'v:c3', 'd1:d0', 'd2:s6'];
  const setup = new Set<number>();
  for (const lid of lines) for (const id of lineDots(shape, lid)) if (id !== center) setup.add(id);
  rec.prefill([...setup], 2);
  rec.hold(HOLD_EMPTY + 300);
  // longest scores 7, the other three become pending
  rec.place(center, 1, HOLD_SCORE);
  rec.hold(800);
  // claim the pending lines — alternate players to show it's a shared pool
  const claimers: Player[] = [2, 1, 2];
  [...rec.state.pending].forEach((lid, i) => {
    rec.claim(lid, claimers[i % claimers.length], lineDots(shape, lid)[0]);
  });
  rec.hold(HOLD_END);
  return { id: 'claim', shape, frames: rec.frames };
}

/** Triangle scores three ways: horizontal + both diagonals. */
function sceneTriThreeWays(): Scene {
  const shape: ShapeId = 'triangle';
  const rec = new Rec(shape);
  // Accumulate all three lines on ONE board so the score visibly climbs and the
  // final frame shows every direction at once (also the reduced-motion view).
  const ways: string[] = ['h:r3', 'd1:c2', 'd2:s4'];
  rec.hold(HOLD_EMPTY);
  ways.forEach((lid, wi) => {
    if (wi > 0) rec.hold(500);
    playLine(rec, shape, lid, ((wi % 2) + 1) as Player);
    rec.hold(700);
  });
  rec.hold(HOLD_END);
  return { id: 'triThreeWays', shape, frames: rec.frames };
}

/** Square scores four ways: horizontal, vertical, both diagonals. */
function sceneSqFourWays(): Scene {
  const shape: ShapeId = 'square';
  const rec = new Rec(shape);
  // Accumulate all four lines (they cross at the centre) so the score climbs and
  // the final frame is a four-pointed star of completed lines.
  const ways: string[] = ['h:r3', 'v:c3', 'd1:d0', 'd2:s6'];
  rec.hold(HOLD_EMPTY);
  ways.forEach((lid, wi) => {
    if (wi > 0) rec.hold(450);
    playLine(rec, shape, lid, ((wi % 2) + 1) as Player);
    rec.hold(650);
  });
  rec.hold(HOLD_END);
  return { id: 'sqFourWays', shape, frames: rec.frames };
}

/** Built once (geometry is static). Order = display order in the popover. */
let _scenes: Scene[] | null = null;
export function getScenes(): Scene[] {
  if (!_scenes) {
    _scenes = [
      sceneCorner(),
      sceneLineScored(),
      sceneClaim(),
      sceneTriThreeWays(),
      sceneSqFourWays(),
    ];
  }
  return _scenes;
}
