import { useMemo } from 'react';
import { getBoard } from '../geometry';
import type { GameState, Line, Player } from '../types';

interface Props {
  state: GameState;
  onDotClick?: (dotId: number) => void;
  onClaimClick?: (lineId: string) => void;
  disabled?: boolean;
  lastDot?: number | null;
  colorSwap?: boolean;
  showHints?: boolean;
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
}: Props) {
  const board = getBoard(state.shape);
  const vb = board.viewBox;
  const dotRadius = state.shape === 'triangle' ? 0.32 : 0.34;
  const strokeWidth = dotRadius * 0.42;
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

  const overshoot = (dotRadius * 5) / 3;
  const hlRx = dotRadius * 0.42;
  const hlRy = dotRadius * 0.26;
  const hlDx = dotRadius * 0.3;
  const hlDy = dotRadius * 0.38;

  return (
    <div className="board-wrap">
      <svg
        className="board"
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="dot-p1" cx="35%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#62cf90" />
            <stop offset="32%" stopColor="#1e6e35" />
            <stop offset="78%" stopColor="#0a371a" />
            <stop offset="100%" stopColor="#021608" />
          </radialGradient>
          <radialGradient id="dot-p2" cx="35%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="32%" stopColor="#e8f5cb" />
            <stop offset="78%" stopColor="#a8c989" />
            <stop offset="100%" stopColor="#5a7045" />
          </radialGradient>
          <radialGradient id="dot-empty" cx="35%" cy="30%" r="72%">
            <stop offset="0%" stopColor="#6b8a78" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#2c4434" />
            <stop offset="100%" stopColor="#0c1a14" />
          </radialGradient>
          <radialGradient id="dot-empty-hover" cx="35%" cy="30%" r="72%">
            <stop offset="0%" stopColor="#8ab098" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#3c5b46" />
            <stop offset="100%" stopColor="#10231a" />
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
        </defs>

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
                r={dotRadius}
                fill={`url(#${fillId})`}
                className={cls}
                filter={owner ? 'url(#dot-shadow)' : undefined}
                onClick={() => {
                  if (disabled) return;
                  if (!cd) {
                    onDotClick?.(d.id);
                  } else if (canClaim && claimLine) {
                    onClaimClick?.(claimLine.id);
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
                  onClick={() => onDotClick?.(d.id)}
                  style={{ cursor: 'pointer' }}
                />
              )}
            </g>
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
      </svg>
    </div>
  );
}
