import { useEffect, useMemo, useRef, useState } from 'react';
import { getBoard } from '../geometry';
import { useT } from '../i18n';
import type { GameState, Line, Player } from '../types';
import type { ThemeId } from '../theme';
import { themeArt } from '../themeArt';

interface ScoreEvent {
  dotId: number;
  points: number;
  player: Player;
  seq: number;
}

interface FloatingScore {
  id: string;
  dotId: number;
  text: string;
  player: Player;
}

const SCORE_FLOAT_DURATION_MS = 1050;
const INPUT_GUARD_MS = 350;
const BOARD_HINT_MS = 3200;
// Strikes older than the last few fade back so the newest ones read first.
const RECENT_STRIKES = 2;

/** Tutorial guidance (first-game Coach only; real games never pass it). */
export interface CoachMarks {
  /** Dots kept at full strength; every other dot and line is dimmed. */
  spotlight?: number[];
  /** Dots that also get a gold ring. */
  rings?: number[];
  /** Lines to highlight with a soft band behind their dots. */
  bands?: string[];
  /** The empty dot to tap: dashed ring + a ghost of the player's colour. */
  gap?: number | null;
  /** Small gold label (e.g. "+4") above a dot. */
  label?: { dot: number; text: string } | null;
  /** Waiting (pending) lines drawn as a dashed "not taken yet" stroke. */
  waiting?: string[];
  /** Dot the hand pointer taps. */
  pointer?: number | null;
  /** Empty dots this returns false for can't be placed (they shake instead). */
  canPlace?: (dotId: number) => boolean;
  onRefused?: (dotId: number) => void;
}

interface Props {
  state: GameState;
  onDotClick?: (dotId: number) => void;
  onClaimClick?: (lineId: string) => void;
  disabled?: boolean;
  lastDot?: number | null;
  colorSwap?: boolean;
  showHints?: boolean;
  scoreEvent?: ScoreEvent | null;
  theme?: ThemeId;
  coach?: CoachMarks;
}

function colorIndex(player: Player, swap: boolean): 1 | 2 {
  if (!swap) return player;
  return player === 1 ? 2 : 1;
}

// Forest & Pearl line art (line-{2-9}-p{1,2}.png): each was generated
// separately, so how much of each image's own width its glowing "core"
// actually fills isn't consistent — measured directly from the files
// (solid-alpha pixel width / total image width): P1 ranges ~0.30 (length 2)
// down to ~0.18 (length 9); P2 ranges ~0.29 down to ~0.86 the other way.
// Board.tsx stretches each image's FULL width to one constant target box
// (lineImgH) regardless of that ratio, so on screen P2 reads visibly
// thicker/more solid than P1 at most lengths, worse at longer ones.
// Simply resizing the source PNGs can't fix this: scaling an image's
// width uniformly scales its core by the identical factor, so the
// core-to-width ratio — and therefore the rendered thickness — is
// invariant under that operation. The actual fix has to live here: scale
// the per-instance target width by the inverse of each asset's own ratio
// (relative to the sample median), so every length/color renders at a
// consistent core thickness regardless of how each source image happened
// to come out. Length 1 has no entry — corners reuse length 2's art (see
// below) and never index this table.
const LINE_THICKNESS_MULT: Record<1 | 2, Record<number, number>> = {
  1: { 2: 0.808, 3: 0.874, 4: 0.954, 5: 1.027, 6: 1.1, 7: 1.178, 8: 1.265, 9: 1.348 },
  2: { 2: 0.824, 3: 1.04, 4: 1.065, 5: 1.022, 6: 0.978, 7: 0.979, 8: 0.898, 9: 0.859 },
};

function kindDirection(
  board: ReturnType<typeof getBoard>,
  kind: Line['kind']
): { ux: number; uy: number } {
  const sample = board.lines.find((l) => l.kind === kind && l.dotIds.length >= 2);
  if (!sample) return { ux: 1, uy: 0 };
  const first = board.dots[sample.dotIds[0]];
  const last = board.dots[sample.dotIds[sample.dotIds.length - 1]];
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { ux: 1, uy: 0 };
  return { ux: dx / len, uy: dy / len };
}

function lineEndpoints(
  board: ReturnType<typeof getBoard>,
  line: Line,
  overshoot: number
): { x1: number; y1: number; x2: number; y2: number } {
  if (line.dotIds.length === 1) {
    const center = board.dots[line.dotIds[0]];
    const { ux, uy } = kindDirection(board, line.kind);
    return {
      x1: center.x - ux * overshoot,
      y1: center.y - uy * overshoot,
      x2: center.x + ux * overshoot,
      y2: center.y + uy * overshoot,
    };
  }
  const first = board.dots[line.dotIds[0]];
  const last = board.dots[line.dotIds[line.dotIds.length - 1]];
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x1: first.x, y1: first.y, x2: last.x, y2: last.y };
  const ux = dx / len;
  const uy = dy / len;
  return {
    x1: first.x - ux * overshoot,
    y1: first.y - uy * overshoot,
    x2: last.x + ux * overshoot,
    y2: last.y + uy * overshoot,
  };
}

type Pt = { x: number; y: number };

// Convex hull (Andrew's monotone chain). Used to frame the board in its OWN
// shape — triangle dots hull to a triangle, rhombus to a diamond, square to a
// square — instead of always boxing it in a rectangle.
function convexHull(points: Pt[]): Pt[] {
  const pts = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length < 3) return pts;
  const cross = (o: Pt, a: Pt, b: Pt) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Pt[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop();
    lower.push(p);
  }
  const upper: Pt[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

// Drop only COLLINEAR hull vertices. The inverted-triangle hull emits one
// spurious mid-edge point with turn-sine ~0; 0.02 is a collinearity epsilon,
// NOT an angular cull (real 60/90deg corners have sine 0.866/1.0 and survive).
function simplifyHull(poly: Pt[], angleEps: number): Pt[] {
  const p = poly.slice();
  let changed = true;
  while (changed && p.length > 3) {
    changed = false;
    for (let i = 0; i < p.length; i++) {
      const a = p[(i - 1 + p.length) % p.length];
      const b = p[i];
      const c = p[(i + 1) % p.length];
      const v1x = b.x - a.x, v1y = b.y - a.y, v2x = c.x - b.x, v2y = c.y - b.y;
      const l1 = Math.hypot(v1x, v1y) || 1, l2 = Math.hypot(v2x, v2y) || 1;
      if (Math.abs((v1x * v2y - v1y * v2x) / (l1 * l2)) < angleEps) {
        p.splice(i, 1);
        changed = true;
        break;
      }
    }
  }
  return p;
}

// True Minkowski round-offset of a CONVEX polygon: each edge pushed straight out
// along its outward normal by a CONSTANT `gap`; adjacent offset edges joined by a
// CONSTANT-radius (=gap) circular ARC centred on the ORIGINAL vertex. Identical
// rounding at every corner (60deg apex == 90deg corner), uniform perpendicular
// clearance, no miter, no clamp.
//
// SWEEP = 1, HARDCODED. convexHull returns these hulls CLOCKWISE on screen
// (geometry y grows DOWNWARD, so all four shapes have signedArea > 0 in y-down
// space). For a CW-on-screen convex traversal the OUTWARD/convex corner arc is
// the SVG sweep-flag=1 arc (verified via the true endpoint->center conversion:
// at the triangle apex sweep=1 puts the arc midpoint OUTSIDE the apex = convex;
// sweep=0 collapses it onto the apex = concave notch). Do NOT re-derive this from
// signedArea's sign at runtime — that sign is y-down and would pick sweep=0.
function minkowskiHullPath(poly: Pt[], gap: number): string {
  const n = poly.length;
  if (n < 3) return '';
  const f = (v: number) => v.toFixed(3);
  const cx = poly.reduce((s, p) => s + p.x, 0) / n;
  const cy = poly.reduce((s, p) => s + p.y, 0) / n;
  const sweep = 1;
  const edges = poly.map((p, i) => {
    const q = poly[(i + 1) % n];
    let dx = q.x - p.x, dy = q.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    let nx = dy, ny = -dx;
    const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
    if ((cx - mx) * nx + (cy - my) * ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    return { p, q, nx, ny };
  });
  const g = gap.toFixed(4);
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = edges[i];
    const sx = a.p.x + a.nx * gap, sy = a.p.y + a.ny * gap;
    const ex = a.q.x + a.nx * gap, ey = a.q.y + a.ny * gap;
    if (i === 0) d += 'M ' + f(sx) + ' ' + f(sy) + ' ';
    d += 'L ' + f(ex) + ' ' + f(ey) + ' ';
    const k = edges[(i + 1) % n];
    d += 'A ' + g + ' ' + g + ' 0 0 ' + sweep + ' ' +
         f(k.p.x + k.nx * gap) + ' ' + f(k.p.y + k.ny * gap) + ' ';
  }
  return d + 'Z';
}

// Tutorial tap hand, drawn (not an emoji) so it looks the same everywhere and
// stays visible on light dots. Fingertip at (x, y); `flip` points it down.
function CoachHand({ x, y, size, flip }: { x: number; y: number; size: number; flip: boolean }) {
  const s = size / 16;
  const parts = (
    <>
      <rect x="2" y="0" width="2.6" height="9" rx="1.3" />
      <rect x="4.4" y="5" width="2.1" height="4.5" rx="1.05" />
      <rect x="6.3" y="5.6" width="2.1" height="4" rx="1.05" />
      <rect x="8.1" y="6.4" width="1.9" height="3.4" rx="0.95" />
      <rect x="2" y="7" width="8" height="6.4" rx="2.4" />
      <rect x="-0.3" y="7.6" width="3.4" height="2.2" rx="1.1" transform="rotate(28 1.4 8.7)" />
    </>
  );
  return (
    <g
      className="coach-hand"
      transform={`translate(${x} ${y}) scale(${s} ${flip ? -s : s}) translate(-3.3 0)`}
      aria-hidden="true"
      style={{ pointerEvents: 'none' }}
    >
      <g className="coach-hand-tap">
        <g className="coach-hand-outline">{parts}</g>
        <g className="coach-hand-fill">{parts}</g>
        <rect className="coach-hand-cuff" x="2.7" y="13" width="6.6" height="2.8" rx="0.8" />
      </g>
    </g>
  );
}

export function Board({
  state,
  onDotClick,
  onClaimClick,
  disabled,
  lastDot,
  colorSwap = false,
  showHints = false,
  scoreEvent = null,
  theme,
  coach,
}: Props) {
  const t = useT();
  const boardArt = themeArt(theme).board;
  const paintedBoard = Boolean(boardArt);
  const board = getBoard(state.shape);
  const vb = board.viewBox;
  const dotRadius = state.shape === 'triangle' ? 0.32 : 0.34;
  const strokeWidth = dotRadius * 0.42;
  const feltMin = Math.min(vb.w, vb.h);
  const feltGap = dotRadius * 1.64; // outer felt edge — even perpendicular gap
  const facetW = dotRadius * 0.34; // dark contact-band radial width
  const innerGap = feltGap - facetW; // 1.30*dotRadius — strictly outside dot rim
  const litWidth = dotRadius * 0.22; // lit inner-facet stroke width
  const recessBlur = feltMin * 0.013;
  const recessOff = feltMin * 0.0065;
  const framePad = feltGap + dotRadius * 0.25; // outer arc stays inside vbExp
  const vbExp = {
    x: vb.x - framePad,
    y: vb.y - framePad,
    w: vb.w + framePad * 2,
    h: vb.h + framePad * 2,
  };
  // Minkowski round-offset frame: constant gap + constant-radius arc corners, so
  // every shape (triangle apex included) frames with an even margin and identical
  // corner rounding. Two gaps -> a uniform-width annulus = the bevel facet.
  const { feltPathOuter, feltPathInner } = useMemo(() => {
    const hull = simplifyHull(
      convexHull(board.dots.map((d) => ({ x: d.x, y: d.y }))),
      0.02,
    );
    return {
      feltPathOuter: minkowskiHullPath(hull, feltGap),
      feltPathInner: minkowskiHullPath(hull, innerGap),
    };
  }, [board, feltGap, innerGap]);
  const [floats, setFloats] = useState<FloatingScore[]>([]);
  const [focusedDotId, setFocusedDotId] = useState<number | null>(null);
  const dotRefs = useRef(new Map<number, SVGCircleElement | null>());

  // Each float removes itself after its own duration. Timers are NOT cleared
  // when the next scoreEvent arrives (that used to strand floats from fast
  // scoring in the DOM, replaying on a later re-render) — only on unmount.
  const floatTimers = useRef<number[]>([]);
  useEffect(() => () => floatTimers.current.forEach((t) => window.clearTimeout(t)), []);
  useEffect(() => {
    if (!scoreEvent) return;
    if (scoreEvent.points <= 0) return;
    const float: FloatingScore = {
      id: `${scoreEvent.seq}-gain`,
      dotId: scoreEvent.dotId,
      text: `+${scoreEvent.points}`,
      player: scoreEvent.player,
    };
    setFloats((prev) => [...prev, float]);
    floatTimers.current.push(
      window.setTimeout(() => {
        setFloats((prev) => prev.filter((f) => f.id !== float.id));
      }, SCORE_FLOAT_DURATION_MS),
    );
  }, [scoreEvent]);
  // New game (Play again / rematch): nothing from the previous board carries over.
  useEffect(() => {
    if (state.turn === 0) setFloats([]);
  }, [state.turn]);

  // Ignore taps for a moment after the board appears (or a new game starts on
  // it), so the second tap of a double-tap on Start / Play again can't land on
  // a dot.
  const inputReadyAt = useRef(0);
  useEffect(() => {
    if (state.turn === 0) inputReadyAt.current = performance.now() + INPUT_GUARD_MS;
  }, [state.turn]);
  useEffect(() => {
    inputReadyAt.current = performance.now() + INPUT_GUARD_MS;
  }, []);
  const inputReady = () => performance.now() >= inputReadyAt.current;

  // Claim phase: every dot is coloured but lines are still pending, so each
  // turn must be a claim. Tell the player once per game, and again whenever a
  // tap lands on a dot with nothing to claim (that dot also shakes).
  const claimPhase =
    !disabled &&
    !state.finished &&
    state.pending.length > 0 &&
    board.dots.every((d) => state.colored[d.id]);
  const [boardHint, setBoardHint] = useState<{ text: string; seq: number } | null>(null);
  const hintTimer = useRef<number | null>(null);
  const claimHintShown = useRef(false);
  const showBoardHint = (text: string) => {
    setBoardHint((prev) => ({ text, seq: (prev?.seq ?? 0) + 1 }));
    if (hintTimer.current !== null) window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setBoardHint(null), BOARD_HINT_MS);
  };
  useEffect(
    () => () => {
      if (hintTimer.current !== null) window.clearTimeout(hintTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (state.turn === 0) {
      claimHintShown.current = false;
      setBoardHint(null);
    }
  }, [state.turn]);
  useEffect(() => {
    if (!claimPhase || claimHintShown.current || coach) return;
    claimHintShown.current = true;
    showBoardHint(t.game.claimPhaseHint);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimPhase]);

  // Tap zone: the whole cell around a dot (half the nearest-neighbour gap), so
  // taps between dots still land and claims don't need a pixel-perfect tap.
  const hitRadius = useMemo(() => {
    const [first, ...rest] = board.dots;
    const gap = Math.min(...rest.map((d) => Math.hypot(d.x - first.x, d.y - first.y)));
    return gap / 2;
  }, [board.dots]);

  const linesById = useMemo(() => {
    const map = new Map<string, Line>();
    for (const line of board.lines) map.set(line.id, line);
    return map;
  }, [board.lines]);

  const pendingThroughDot = useMemo(() => {
    const pendingSet = new Set(state.pending);
    const map = new Map<number, Line[]>();
    for (const line of board.lines) {
      if (!pendingSet.has(line.id)) continue;
      for (const id of line.dotIds) {
        const arr = map.get(id) ?? [];
        arr.push(line);
        map.set(id, arr);
      }
    }
    return map;
  }, [state.pending, board.lines]);

  const claimableLineForDot = (dotId: number): Line | null => {
    const arr = pendingThroughDot.get(dotId);
    if (!arr || arr.length === 0) return null;
    return arr.slice().sort((a, b) => b.length - a.length)[0];
  };

  const isInteractiveDot = (dotId: number): boolean => {
    const cd = state.colored[dotId];
    if (!cd) return !disabled;
    if (disabled || !onClaimClick) return false;
    return !!claimableLineForDot(dotId);
  };

  // One-shot nudge via the Web Animations API, so the dot isn't remounted
  // (which would replay its pop and drop keyboard focus).
  const shakeDot = (dotId: number) => {
    const g = dotRefs.current.get(dotId)?.parentElement;
    if (!g?.animate || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const dx = dotRadius * 0.22;
    g.animate(
      [0, -dx, dx, -dx, dx, 0].map((x) => ({ transform: `translateX(${x}px)` })),
      { duration: 320, easing: 'ease-in-out' },
    );
  };

  const activateDot = (dotId: number) => {
    if (disabled || !inputReady()) return;
    const cd = state.colored[dotId];
    if (!cd) {
      if (coach?.canPlace && !coach.canPlace(dotId)) {
        shakeDot(dotId);
        coach.onRefused?.(dotId);
        return;
      }
      onDotClick?.(dotId);
      return;
    }
    const claim = claimableLineForDot(dotId);
    if (claim && onClaimClick) {
      onClaimClick(claim.id);
    } else if (claimPhase) {
      shakeDot(dotId);
      showBoardHint(t.game.nothingToClaim);
    }
  };

  // Roving-tabindex grid navigation: the board is a single Tab stop; arrow keys
  // move focus to the nearest dot in that direction. Without this every dot is
  // its own Tab stop (up to 49 on the square) and the focus ring appears to
  // jump in DOM order rather than spatially toward where the player is looking.
  const moveFocus = (fromId: number, dirX: number, dirY: number) => {
    const from = board.dots[fromId];
    if (!from) return;
    let best: number | null = null;
    let bestScore = Infinity;
    for (const o of board.dots) {
      if (o.id === fromId) continue;
      const vx = o.x - from.x;
      const vy = o.y - from.y;
      const along = vx * dirX + vy * dirY;
      if (along <= 1e-6) continue;
      const perp = Math.abs(vx * dirY - vy * dirX);
      const score = along + perp * 2;
      if (score < bestScore) {
        bestScore = score;
        best = o.id;
      }
    }
    if (best === null) return;
    setFocusedDotId(best);
    dotRefs.current.get(best)?.focus();
  };

  const firstInteractiveId =
    board.dots.find((d) => isInteractiveDot(d.id))?.id ?? board.dots[0]?.id ?? null;
  const rovingId =
    focusedDotId !== null && board.dots.some((d) => d.id === focusedDotId)
      ? focusedDotId
      : firstInteractiveId;

  const overshoot = (dotRadius * 5) / 3;
  const hlRx = dotRadius * 0.42;
  const hlRy = dotRadius * 0.26;
  const hlDx = dotRadius * 0.3;
  const hlDy = dotRadius * 0.38;

  const liveMessage = state.finished
    ? state.winner === 'draw'
      ? t.game.liveDraw(state.scores[1], state.scores[2])
      : t.game.liveWin(state.winner as Player, state.scores[1], state.scores[2])
    : t.game.liveTurn(state.current, state.scores[1], state.scores[2]);

  const spot = coach?.spotlight?.length ? new Set(coach.spotlight) : null;
  const rings = coach?.rings?.length ? new Set(coach.rings) : null;
  const gapDot = coach?.gap != null ? board.dots[coach.gap] : null;
  const labelDot = coach?.label ? board.dots[coach.label.dot] : null;
  const pointerDot = coach?.pointer != null ? board.dots[coach.pointer] : null;
  // The hand sits under the dot, pointing up, unless that would leave the board.
  const pointerBelow = !!pointerDot && pointerDot.y + dotRadius * 2.6 < vbExp.y + vbExp.h;

  return (
    <div className="board-wrap">
      <svg
        className={spot ? 'board board-spotlight' : 'board'}
        role="group"
        aria-label={t.game.boardAriaLabel(t.shapes[state.shape])}
        viewBox={`${vbExp.x} ${vbExp.y} ${vbExp.w} ${vbExp.h}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="dot-p1" cx="35%" cy="28%" r="72%">
            <stop offset="0%" stopColor="var(--p1-bright)" />
            <stop offset="32%" stopColor="var(--p1-glow)" />
            <stop offset="78%" stopColor="var(--p1)" />
            <stop offset="100%" stopColor="var(--p1-deep)" />
          </radialGradient>
          <radialGradient id="dot-p2" cx="35%" cy="28%" r="72%">
            <stop offset="0%" stopColor="var(--p2-bright)" />
            <stop offset="32%" stopColor="var(--p2-glow)" />
            <stop offset="78%" stopColor="var(--p2)" />
            <stop offset="100%" stopColor="var(--p2-deep)" />
          </radialGradient>
          <radialGradient id="dot-empty" cx="36%" cy="30%" r="75%">
            <stop offset="0%" stopColor="var(--dot-empty-mid)" />
            <stop offset="58%" stopColor="var(--dot-empty-core)" />
            <stop offset="100%" stopColor="var(--dot-empty-core)" />
          </radialGradient>
          <radialGradient id="dot-empty-hover" cx="36%" cy="30%" r="75%">
            <stop offset="0%" stopColor="var(--dot-empty-rim)" />
            <stop offset="55%" stopColor="var(--dot-empty-mid)" />
            <stop offset="100%" stopColor="var(--dot-empty-core)" />
          </radialGradient>
          <radialGradient id="dot-highlight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <filter id="dot-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="0.04" />
            <feOffset dx="0" dy="0.04" result="off" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="board-felt" cx="32%" cy="22%" r="92%">
            <stop offset="0%" stopColor="var(--board-felt-1)" />
            <stop offset="100%" stopColor="var(--board-felt-2)" />
          </radialGradient>
          {boardArt && (
            <pattern
              id="board-felt-image"
              patternUnits="userSpaceOnUse"
              x={vbExp.x}
              y={vbExp.y}
              width={vbExp.w}
              height={vbExp.h}
            >
              <image
                href={boardArt.felt}
                x="0"
                y="0"
                width={vbExp.w}
                height={vbExp.h}
                preserveAspectRatio="xMidYMid slice"
              />
            </pattern>
          )}
          {/* Bezel rim: top-lit gradient down the expanded viewBox so the top
              edge catches light and the bottom falls into shade. */}
          <linearGradient
            id="board-rim"
            x1="0"
            y1={vbExp.y}
            x2="0"
            y2={vbExp.y + vbExp.h}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="var(--rim-hi)" />
            <stop offset="50%" stopColor="var(--rim-mid)" />
            <stop offset="100%" stopColor="var(--rim-lo)" />
          </linearGradient>
          {/* Shape-matched inner shadow: flood OUT the felt silhouette, blur +
              offset it back across the edge, then clip IN to the felt — so only
              the inner border darkens and the felt reads as recessed. No blend
              modes (bugs.md endgame crash was mix-blend-mode). */}
          <filter id="felt-recess" x="-20%" y="-20%" width="140%" height="140%">
            <feFlood floodColor="#000" floodOpacity="0.5" result="flood" />
            <feComposite in="flood" in2="SourceAlpha" operator="out" result="ring" />
            <feGaussianBlur in="ring" stdDeviation={recessBlur} result="blur" />
            <feOffset in="blur" dx="0" dy={recessOff} result="drop" />
            <feComposite in="drop" in2="SourceAlpha" operator="in" result="innerShadow" />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="innerShadow" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Drop shadow — floats the board above the vignette. */}
        <path
          d={feltPathOuter}
          fill={paintedBoard ? 'url(#board-felt-image)' : 'url(#board-felt)'}
          pointerEvents="none"
          style={{ filter: 'var(--rim-drop)' }}
        />
        {/* 2. Felt fill + recessed inner shadow (shape-matched, no blend modes). */}
        <path
          d={feltPathOuter}
          fill={paintedBoard ? 'url(#board-felt-image)' : 'url(#board-felt)'}
          pointerEvents="none"
          filter="url(#felt-recess)"
        />
        {/* 3. Dark contact band — the evenodd annulus between the two offset
            paths: the recessed valley where the bevel meets the felt. */}
        <path
          d={`${feltPathOuter} ${feltPathInner}`}
          fillRule="evenodd"
          fill="var(--rim-contact)"
          pointerEvents="none"
        />
        {/* 4. Lit inner facet (raised bevel lip) — top-lit gradient stroke on the
            inner path, inboard of the dark band, outboard of every dot. */}
        <path
          d={feltPathInner}
          fill="none"
          stroke="url(#board-rim)"
          strokeWidth={litWidth}
          pointerEvents="none"
        />

        {coach?.bands?.map((id) => {
          const line = linesById.get(id);
          if (!line) return null;
          const e = lineEndpoints(board, line, dotRadius * 0.5);
          return (
            <line
              key={`band-${id}`}
              {...e}
              className="coach-band"
              strokeWidth={dotRadius * 2.4}
              strokeLinecap="round"
              style={{ pointerEvents: 'none' }}
            />
          );
        })}
        {board.dots.map((d) => {
          const cd = state.colored[d.id];
          const isLast = lastDot === d.id;
          const owner = cd?.player;
          const ownerColor = owner ? colorIndex(owner, colorSwap) : null;
          const claimLine = cd ? claimableLineForDot(d.id) : null;
          const canClaim = !disabled && !!onClaimClick && !!claimLine;

          let fillId = 'dot-empty';
          if (ownerColor === 1) fillId = 'dot-p1';
          else if (ownerColor === 2) fillId = 'dot-p2';

          let cls = 'dot';
          if (ownerColor === 1) cls += ' dot-p1';
          else if (ownerColor === 2) cls += ' dot-p2';
          else cls += ' dot-empty';
          if (isLast) cls += ' dot-last';

          const showHighlight = !!owner;

          const interactive = (!cd && !disabled) || canClaim;
          const rowNum = d.row + 1;
          const posNum = d.col + 1;
          let ariaLabel: string;
          if (!cd && !disabled) {
            ariaLabel = t.game.dotEmptyPlace(rowNum, posNum);
          } else if (canClaim && claimLine) {
            const pts = claimLine.length;
            ariaLabel = t.game.dotClaim(rowNum, posNum, owner, pts);
          } else if (owner) {
            ariaLabel = t.game.dotOwned(rowNum, posNum, owner);
          } else {
            ariaLabel = t.game.dotEmpty(rowNum, posNum);
          }
          return (
            <g key={d.id} className={spot?.has(d.id) ? 'dot-group dot-group-spot' : 'dot-group'}>
              {rings?.has(d.id) && (
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={dotRadius * 1.38}
                  className="coach-ring"
                  fill="none"
                  strokeWidth={dotRadius * 0.16}
                  style={{ pointerEvents: 'none' }}
                />
              )}
              <circle
                cx={d.x}
                cy={d.y}
                r={owner ? dotRadius : dotRadius * 0.82}
                fill={`url(#${fillId})`}
                className={cls}
                filter={isLast && owner ? 'url(#dot-shadow)' : undefined}
                role={interactive ? 'button' : 'img'}
                aria-label={ariaLabel}
                tabIndex={!disabled && d.id === rovingId ? 0 : -1}
                ref={(el) => {
                  dotRefs.current.set(d.id, el);
                }}
                onClick={() => activateDot(d.id)}
                onMouseDown={(e) => e.preventDefault()}
                onFocus={() => setFocusedDotId(d.id)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    moveFocus(d.id, 0, -1);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    moveFocus(d.id, 0, 1);
                  } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    moveFocus(d.id, -1, 0);
                  } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    moveFocus(d.id, 1, 0);
                  } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                    if (interactive) {
                      e.preventDefault();
                      activateDot(d.id);
                    }
                  }
                }}
                style={{
                  cursor: !cd && !disabled ? 'pointer' : 'default',
                  pointerEvents: cd && !canClaim && !claimPhase ? 'none' : 'auto',
                }}
              />
              {boardArt && ownerColor && (
                <image
                  href={boardArt.dot(ownerColor)}
                  x={d.x - dotRadius}
                  y={d.y - dotRadius}
                  width={dotRadius * 2}
                  height={dotRadius * 2}
                  className={isLast ? 'dot-art-last' : undefined}
                  style={{ pointerEvents: 'none' }}
                  aria-hidden="true"
                />
              )}
              {showHighlight && !paintedBoard && (
                <ellipse
                  cx={d.x - hlDx}
                  cy={d.y - hlDy}
                  rx={hlRx}
                  ry={hlRy}
                  fill="url(#dot-highlight)"
                  style={{ pointerEvents: 'none' }}
                />
              )}
              {isLast && owner && (
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={dotRadius * 1.22}
                  className="dot-last-ring"
                  fill="none"
                  strokeWidth={dotRadius * 0.14}
                  style={{ pointerEvents: 'none' }}
                />
              )}
              {interactive && (
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={hitRadius}
                  fill="transparent"
                  aria-hidden="true"
                  onClick={() => activateDot(d.id)}
                  style={{ cursor: 'pointer' }}
                />
              )}
            </g>
          );
        })}

        {floats.map((f) => {
          const dot = board.dots[f.dotId];
          if (!dot) return null;
          const fontSize = dotRadius * 1.85;
          // Default position is above the dot. For top-row dots the text
          // would overshoot the viewBox top edge and get clipped (SVG
          // default overflow is hidden) — flip below in that case so the
          // popup stays visible.
          const aboveRoom = dot.y - vb.y;
          const placeAbove = aboveRoom > dotRadius + fontSize;
          const y = placeAbove
            ? dot.y - dotRadius * 1.1
            : dot.y + dotRadius * 1.1 + fontSize * 0.85;
          const cIdx = colorIndex(f.player, colorSwap);
          return (
            <text
              key={f.id}
              x={dot.x}
              y={y}
              className={`score-float score-float-${placeAbove ? 'above' : 'below'} score-float-p${cIdx}`}
              textAnchor="middle"
              dominantBaseline="alphabetic"
              fontSize={fontSize}
              fontWeight="800"
            >
              {f.text}
            </text>
          );
        })}

        {state.completed.map((c, i) => {
          const line = linesById.get(c.lineId);
          if (!line) return null;
          const old = !state.finished && i < state.completed.length - RECENT_STRIKES;
          const { x1, y1, x2, y2 } = lineEndpoints(board, line, overshoot);
          const outer = strokeWidth * 0.575;
          const innerHighlight = strokeWidth * 0.22;
          const cIdx = colorIndex(c.player, colorSwap);
          const keep = spot && line.dotIds.every((id) => spot.has(id)) ? 'coach-keep' : undefined;
          if (boardArt) {
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const len = Math.hypot(x2 - x1, y2 - y1);
            const angleDeg = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
            const lineImgH = strokeWidth * 3.4;
            // Art only exists for lengths 1-9 (every line on every current
            // board shape falls in that range); clamp defensively so a
            // future shape with a longer line can't 404 into an invisible
            // completed line instead of just reusing the longest strand.
            //
            // Corners (length 1) originally used a dedicated round "spark"
            // asset (line-1-p*.png) sized and glowed to stand out — but a
            // round glow doesn't read as "struck through" the way every
            // other completed line does, which broke the visual language
            // players rely on to tell claimed corners apart from unclaimed
            // ones. Fixed by dropping the special case entirely: a corner
            // now renders exactly like any other completed line — the same
            // elongated strand art (line-2's, the shortest real strand we
            // have; line-1's round asset is unused here now), stretched
            // across the corner's own short real span (`len`, already
            // ~dotRadius*3.3 from the overshoot-based endpoints below) —
            // so every claimed line, corners included, looks like the same
            // kind of mark.
            const clampedLen = Math.min(Math.max(line.length, 1), 9);
            const artLen = clampedLen === 1 ? 2 : clampedLen;
            // The art was generated as a TALL strand (content runs along
            // the image's own height, not its width — confirmed by opening
            // the actual files: line-9-p1.png is 151x661, a portrait
            // strip). Rotating by angleDeg and mapping len onto the box
            // WIDTH (the old code) put the strand's long axis perpendicular
            // to the real line, squashing it into an unrecognizable smear —
            // that's what read as "wavy/not straight". Rotating by
            // (angleDeg - 90) instead puts the group's local +Y axis (which
            // now carries `height`, i.e. the image's own long axis) along
            // the true line direction, so `height=len` stretches the
            // strand's actual long axis to the real endpoint-to-endpoint
            // span.
            const imgW = lineImgH * LINE_THICKNESS_MULT[cIdx][artLen];
            const imgH = len;
            const groupRotate = angleDeg - 90;
            return (
              <g
                key={c.lineId}
                className={[keep, old && 'strike-old'].filter(Boolean).join(' ') || undefined}
                transform={`translate(${midX} ${midY}) rotate(${groupRotate})`}
                style={{ pointerEvents: 'none' }}
              >
                <image
                  href={boardArt.line(artLen, cIdx)}
                  x={-imgW / 2}
                  y={-imgH / 2}
                  width={imgW}
                  height={imgH}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                />
              </g>
            );
          }
          return (
            <g
              key={c.lineId}
              className={`crossline-group crossline-group-p${cIdx}${keep ? ' coach-keep' : ''}${old ? ' strike-old' : ''}`}
              style={{ pointerEvents: 'none' }}
            >
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={`crossline crossline-p${cIdx}`}
                strokeLinecap="round"
                strokeWidth={outer}
              />
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={`crossline-inner crossline-inner-p${cIdx}`}
                strokeLinecap="round"
                strokeWidth={innerHighlight}
              />
            </g>
          );
        })}
        {(coach?.waiting ?? (showHints ? state.pending : [])).map((id) => {
          const line = linesById.get(id);
          if (!line) return null;
          const e = lineEndpoints(board, line, dotRadius * 0.9);
          return (
            <line
              key={`wait-${id}`}
              {...e}
              className="waiting-line"
              strokeWidth={dotRadius * 0.34}
              strokeDasharray={`${dotRadius * 0.6} ${dotRadius * 0.45}`}
              strokeLinecap="round"
              style={{ pointerEvents: 'none' }}
            />
          );
        })}
        {gapDot && (
          <g className="coach-keep" style={{ pointerEvents: 'none' }}>
            <circle
              cx={gapDot.x}
              cy={gapDot.y}
              r={dotRadius * 0.82}
              fill="url(#dot-p1)"
              opacity={0.4}
            />
            <circle
              cx={gapDot.x}
              cy={gapDot.y}
              r={dotRadius * 1.4}
              fill="none"
              className="coach-gap-ring"
              strokeWidth={dotRadius * 0.14}
              strokeDasharray={`${dotRadius * 0.55} ${dotRadius * 0.35}`}
            />
          </g>
        )}
        {labelDot && coach?.label && (
          <text
            x={labelDot.x}
            y={labelDot.y - dotRadius * 1.75}
            fontSize={dotRadius * 1.1}
            fontWeight="800"
            textAnchor="middle"
            className="coach-label"
            strokeWidth={dotRadius * 0.14}
            style={{ pointerEvents: 'none' }}
          >
            {coach.label.text}
          </text>
        )}
        {pointerDot && (
          <CoachHand
            key={coach?.pointer}
            x={pointerDot.x + dotRadius * 0.3}
            y={pointerBelow ? pointerDot.y + dotRadius * 0.3 : pointerDot.y - dotRadius * 0.3}
            size={dotRadius * 2.8}
            flip={!pointerBelow}
          />
        )}
      </svg>
      {boardHint && (
        <div key={boardHint.seq} className="board-hint" role="status">
          {boardHint.text}
        </div>
      )}
      <div className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </div>
    </div>
  );
}
