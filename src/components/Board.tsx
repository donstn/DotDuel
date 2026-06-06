import { useEffect, useMemo, useRef, useState } from 'react';
import { getBoard } from '../geometry';
import type { GameState, Line, Player } from '../types';

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

interface HintInput {
  text: string;
  anchorDotId: number;
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
  hint?: HintInput | null;
  onDismissHint?: () => void;
}

// Word-wrap a caption into <=maxLines lines, trying to keep each line
// under maxCharsPerLine. Greedy line-fill — overflow words go to the next
// line. Last line may exceed maxCharsPerLine if a single word is longer.
function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;
    if (candidate.length <= maxCharsPerLine || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = w;
      if (lines.length === maxLines - 1) {
        current = words.slice(words.indexOf(w)).join(' ');
        break;
      }
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

function colorIndex(player: Player, swap: boolean): 1 | 2 {
  if (!swap) return player;
  return player === 1 ? 2 : 1;
}

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

// Push each hull edge outward by `margin` (true edge-normal offset, so every
// edge clears the dots evenly), clamping how far a sharp corner can shoot out
// so an acute apex (triangle) stays inside the viewBox.
function offsetPolygon(poly: Pt[], margin: number, maxExt: number): Pt[] {
  const n = poly.length;
  if (n < 3) return poly;
  const cx = poly.reduce((s, p) => s + p.x, 0) / n;
  const cy = poly.reduce((s, p) => s + p.y, 0) / n;
  const lines = poly.map((p, i) => {
    const q = poly[(i + 1) % n];
    let dx = q.x - p.x;
    let dy = q.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    let nx = dy;
    let ny = -dx;
    const mx = (p.x + q.x) / 2;
    const my = (p.y + q.y) / 2;
    if ((cx - mx) * nx + (cy - my) * ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    return { px: p.x + nx * margin, py: p.y + ny * margin, dx, dy };
  });
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = lines[(i - 1 + n) % n];
    const b = lines[i];
    const det = a.dx * b.dy - a.dy * b.dx;
    let vx: number;
    let vy: number;
    if (Math.abs(det) < 1e-9) {
      vx = b.px;
      vy = b.py;
    } else {
      const t = ((b.px - a.px) * b.dy - (b.py - a.py) * b.dx) / det;
      vx = a.px + a.dx * t;
      vy = a.py + a.dy * t;
    }
    const ex = vx - poly[i].x;
    const ey = vy - poly[i].y;
    const ext = Math.hypot(ex, ey);
    if (ext > maxExt) {
      const s = maxExt / ext;
      vx = poly[i].x + ex * s;
      vy = poly[i].y + ey * s;
    }
    out.push({ x: vx, y: vy });
  }
  return out;
}

// SVG path for a polygon with rounded corners (quadratic fillets).
function roundedPolygonPath(poly: Pt[], radius: number): string {
  const n = poly.length;
  if (n < 3) return '';
  const t1: Pt[] = [];
  const t2: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const prev = poly[(i - 1 + n) % n];
    const cur = poly[i];
    const next = poly[(i + 1) % n];
    const v1x = cur.x - prev.x;
    const v1y = cur.y - prev.y;
    const l1 = Math.hypot(v1x, v1y) || 1;
    const v2x = next.x - cur.x;
    const v2y = next.y - cur.y;
    const l2 = Math.hypot(v2x, v2y) || 1;
    const r = Math.min(radius, l1 / 2, l2 / 2);
    t1.push({ x: cur.x - (v1x / l1) * r, y: cur.y - (v1y / l1) * r });
    t2.push({ x: cur.x + (v2x / l2) * r, y: cur.y + (v2y / l2) * r });
  }
  const f = (v: number) => v.toFixed(3);
  let d = `M ${f(t1[0].x)} ${f(t1[0].y)}`;
  for (let i = 0; i < n; i++) {
    d += ` Q ${f(poly[i].x)} ${f(poly[i].y)} ${f(t2[i].x)} ${f(t2[i].y)}`;
    const nt1 = t1[(i + 1) % n];
    d += ` L ${f(nt1.x)} ${f(nt1.y)}`;
  }
  return `${d} Z`;
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
  hint = null,
  onDismissHint,
}: Props) {
  const board = getBoard(state.shape);
  const vb = board.viewBox;
  const dotRadius = state.shape === 'triangle' ? 0.32 : 0.34;
  const strokeWidth = dotRadius * 0.42;
  const feltMin = Math.min(vb.w, vb.h);
  const rimWidth = dotRadius * 0.7;
  // Extra headroom so the bezel rim lives in the margin without clipping or
  // shrinking the play area more than a hair.
  const framePad = dotRadius * 1.3 + rimWidth * 0.7;
  const vbExp = {
    x: vb.x - framePad,
    y: vb.y - framePad,
    w: vb.w + framePad * 2,
    h: vb.h + framePad * 2,
  };
  // Single source of truth for the board outline, then derive the bezel rim
  // from the same hull so every shape (triangle/square/rectangle) frames true.
  const feltRound = feltMin * 0.05;
  const feltPoly = offsetPolygon(
    convexHull(board.dots.map((d) => ({ x: d.x, y: d.y }))),
    dotRadius * 1.7,
    // Keep corner miter close to the edge margin so sharp shapes (triangle)
    // don't bulge a big gap at the points — even spacing all the way round.
    dotRadius * 1.95
  );
  const feltPath = roundedPolygonPath(feltPoly, feltRound);
  const rimPoly = offsetPolygon(feltPoly, rimWidth, rimWidth * 1.1);
  const rimPath = roundedPolygonPath(rimPoly, feltRound + rimWidth * 0.6);
  const [floats, setFloats] = useState<FloatingScore[]>([]);
  const [focusedDotId, setFocusedDotId] = useState<number | null>(null);
  const dotRefs = useRef(new Map<number, SVGCircleElement | null>());

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
    const timer = window.setTimeout(() => {
      setFloats((prev) => prev.filter((f) => f.id !== float.id));
    }, SCORE_FLOAT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [scoreEvent]);

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

  const activateDot = (dotId: number) => {
    if (disabled) return;
    const cd = state.colored[dotId];
    if (!cd) {
      onDotClick?.(dotId);
      return;
    }
    const claim = claimableLineForDot(dotId);
    if (claim && onClaimClick) onClaimClick(claim.id);
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
      ? `Game over. It's a draw, ${state.scores[1]} to ${state.scores[2]}.`
      : `Game over. Player ${state.winner} wins, ${state.scores[1]} to ${state.scores[2]}.`
    : `Player ${state.current} to move. Score: Player 1, ${state.scores[1]}; Player 2, ${state.scores[2]}.`;

  return (
    <div className="board-wrap">
      <svg
        className="board"
        role="group"
        aria-label={`${board.label} game board`}
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
            <feGaussianBlur in="ring" stdDeviation={feltMin * 0.012} result="blur" />
            <feOffset in="blur" dx="0" dy={feltMin * 0.006} result="drop" />
            <feComposite in="drop" in2="SourceAlpha" operator="in" result="innerShadow" />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="innerShadow" />
            </feMerge>
          </filter>
        </defs>

        {/* Raised lacquer rim (shape-matched), drawn under the felt; CSS
            drop-shadow floats the whole board above the vignette. */}
        <path
          d={rimPath}
          fill="url(#board-rim)"
          stroke="var(--rim-edge)"
          strokeWidth={feltMin * 0.004}
          strokeLinejoin="round"
          style={{ filter: 'var(--rim-drop)' }}
        />
        {/* Felt, recessed below the rim lip via the shape-matched inner shadow. */}
        <path d={feltPath} fill="url(#board-felt)" filter="url(#felt-recess)" />
        {/* Bright lip on the felt's top edge. */}
        <path
          d={feltPath}
          fill="none"
          stroke="var(--felt-lip)"
          strokeWidth={feltMin * 0.006}
          strokeLinejoin="round"
        />

        {board.dots.map((d) => {
          const cd = state.colored[d.id];
          const isLast = lastDot === d.id;
          const owner = cd?.player;
          const ownerColor = owner ? colorIndex(owner, colorSwap) : null;
          const claimLine = cd ? claimableLineForDot(d.id) : null;
          const canClaim = !disabled && !!onClaimClick && !!claimLine;
          const hintGlow = showHints && canClaim;

          let fillId = 'dot-empty';
          if (ownerColor === 1) fillId = 'dot-p1';
          else if (ownerColor === 2) fillId = 'dot-p2';

          let cls = 'dot';
          if (ownerColor === 1) cls += ' dot-p1';
          else if (ownerColor === 2) cls += ' dot-p2';
          else cls += ' dot-empty';
          if (isLast) cls += ' dot-last';
          if (hintGlow) cls += ' dot-hint';

          const showHighlight = !!owner;

          const interactive = (!cd && !disabled) || canClaim;
          const rowNum = d.row + 1;
          const posNum = d.col + 1;
          let ariaLabel: string;
          if (!cd && !disabled) {
            ariaLabel = `Row ${rowNum}, position ${posNum}, empty. Place your dot.`;
          } else if (canClaim && claimLine) {
            const pts = claimLine.length;
            ariaLabel = `Row ${rowNum}, position ${posNum}, Player ${owner}. Claim line worth ${pts} point${pts === 1 ? '' : 's'}.`;
          } else if (owner) {
            ariaLabel = `Row ${rowNum}, position ${posNum}, Player ${owner}.`;
          } else {
            ariaLabel = `Row ${rowNum}, position ${posNum}, empty.`;
          }
          return (
            <g key={d.id} className="dot-group">
              {hintGlow && (
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={dotRadius * 1.35}
                  className="dot-hint-ring"
                  fill="none"
                  style={{ pointerEvents: 'none' }}
                />
              )}
              <circle
                cx={d.x}
                cy={d.y}
                r={owner ? dotRadius : dotRadius * 0.82}
                fill={`url(#${fillId})`}
                className={cls}
                filter={owner ? 'url(#dot-shadow)' : undefined}
                role={interactive ? 'button' : 'img'}
                aria-label={ariaLabel}
                tabIndex={d.id === rovingId ? 0 : -1}
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
                  pointerEvents: cd && !canClaim ? 'none' : 'auto',
                }}
              />
              {showHighlight && (
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
              {!cd && !disabled && (
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={dotRadius * 1.4}
                  fill="transparent"
                  aria-hidden="true"
                  onClick={() => onDotClick?.(d.id)}
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

        {state.completed.map((c) => {
          const line = board.lines.find((l) => l.id === c.lineId);
          if (!line) return null;
          const { x1, y1, x2, y2 } = lineEndpoints(board, line, overshoot);
          const outer = strokeWidth * 0.575;
          const innerHighlight = strokeWidth * 0.22;
          const cIdx = colorIndex(c.player, colorSwap);
          return (
            <g
              key={c.lineId}
              className={`crossline-group crossline-group-p${cIdx}`}
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

        {hint && (() => {
          const anchor = board.dots[hint.anchorDotId];
          if (!anchor) return null;
          const lines = wrapText(hint.text, 24, 4);
          const fontSize = dotRadius * 1.05;
          const lineHeight = fontSize * 1.25;
          const padX = dotRadius * 0.7;
          const padY = dotRadius * 0.5;
          const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
          const charW = fontSize * 0.55;
          const bubbleW = Math.min(vb.w - padX, longest * charW + padX * 2);
          const bubbleH = lines.length * lineHeight + padY * 2;
          const tailLen = dotRadius * 0.7;
          const aboveRoom = anchor.y - vb.y;
          const belowRoom = vb.y + vb.h - anchor.y;
          const placeAbove = aboveRoom >= bubbleH + tailLen + dotRadius * 1.4
            || aboveRoom > belowRoom;
          // Clamp the bubble horizontally so it doesn't escape viewBox.
          const halfW = bubbleW / 2;
          const minCx = vb.x + halfW + padX * 0.2;
          const maxCx = vb.x + vb.w - halfW - padX * 0.2;
          const bubbleCx = Math.max(minCx, Math.min(maxCx, anchor.x));
          const bubbleX = bubbleCx - halfW;
          const bubbleY = placeAbove
            ? anchor.y - dotRadius - tailLen - bubbleH
            : anchor.y + dotRadius + tailLen;
          const tailBaseY = placeAbove ? bubbleY + bubbleH : bubbleY;
          const tailTipY = placeAbove ? anchor.y - dotRadius : anchor.y + dotRadius;
          // Tail base sits along the bubble's edge, clamped so its base
          // stays inside the bubble rect even when the bubble was clamped
          // away from the anchor.
          const tailHalfW = dotRadius * 0.45;
          const tailBaseMinX = bubbleX + dotRadius * 0.4;
          const tailBaseMaxX = bubbleX + bubbleW - dotRadius * 0.4;
          const tailBaseCenter = Math.max(
            tailBaseMinX + tailHalfW,
            Math.min(tailBaseMaxX - tailHalfW, anchor.x),
          );
          const tailPoints = [
            `${tailBaseCenter - tailHalfW},${tailBaseY}`,
            `${tailBaseCenter + tailHalfW},${tailBaseY}`,
            `${anchor.x},${tailTipY}`,
          ].join(' ');
          const textStartY = bubbleY + padY + fontSize * 0.95;
          return (
            <g
              className="hint-bubble"
              onClick={onDismissHint}
              style={{ cursor: onDismissHint ? 'pointer' : 'default' }}
            >
              <polygon points={tailPoints} className="hint-bubble-tail" />
              <rect
                x={bubbleX}
                y={bubbleY}
                width={bubbleW}
                height={bubbleH}
                rx={dotRadius * 0.4}
                className="hint-bubble-bg"
              />
              {lines.map((ln, i) => (
                <text
                  key={i}
                  x={bubbleX + bubbleW / 2}
                  y={textStartY + i * lineHeight}
                  textAnchor="middle"
                  dominantBaseline="alphabetic"
                  fontSize={fontSize}
                  className="hint-bubble-text"
                >
                  {ln}
                </text>
              ))}
            </g>
          );
        })()}
      </svg>
      <div className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </div>
    </div>
  );
}
