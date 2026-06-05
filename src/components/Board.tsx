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
  const feltMin = Math.min(vb.w, vb.h);
  const dotRadius = state.shape === 'triangle' ? 0.32 : 0.34;
  const strokeWidth = dotRadius * 0.42;
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
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
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
        </defs>

        <rect
          x={vb.x + feltMin * 0.015}
          y={vb.y + feltMin * 0.015}
          width={vb.w - feltMin * 0.03}
          height={vb.h - feltMin * 0.03}
          rx={feltMin * 0.06}
          fill="url(#board-felt)"
          stroke="var(--board-felt-border)"
          strokeWidth={feltMin * 0.008}
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
