import { getBoards } from '../geometry';
import type { GameState, Player, ShapeId } from '../types';
import type { ResultShare } from './resultShareText';

/**
 * Renders a 1200×630 (OG-card proportions) victory-card PNG entirely on an
 * offscreen <canvas> — no DOM capture, no deps. The card mirrors the
 * public/og-card.svg aesthetic but is theme-aware (colors read from the active
 * theme's CSS vars, same pattern as WinCelebration) and shows the REAL final
 * board: every dot in its end-of-game color plus the completed-line strikes.
 * The Blob is produced on demand and never persisted.
 */

const W = 1200;
const H = 630;

const FONT_DISPLAY = "'Chakra Petch', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
const FONT_BODY = "'Outfit', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

function cssVar(name: string, fallback: string): string {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch {
    return fallback;
  }
}

interface Theme {
  bgCenter: string;
  bgEdge: string;
  text: string;
  textDim: string;
  accent: string;
  titleTop: string;
  titleBottom: string;
  dot: Record<Player, { bright: string; glow: string; deep: string }>;
  strike: Record<Player, { outer: string; inner: string }>;
}

function readTheme(): Theme {
  return {
    bgCenter: cssVar('--bg-center', '#15291e'),
    bgEdge: cssVar('--bg-edge', '#02090b'),
    text: cssVar('--text-bright', '#ffffff'),
    textDim: cssVar('--text-dim', '#93a89a'),
    accent: cssVar('--accent', '#7bdb95'),
    titleTop: cssVar('--title-grad-top', '#ffffff'),
    titleBottom: cssVar('--title-grad-bottom', '#b9d6c4'),
    dot: {
      1: {
        bright: cssVar('--p1-bright', '#62cf90'),
        glow: cssVar('--p1-glow', '#1c7a3d'),
        deep: cssVar('--p1', '#0d4a23'),
      },
      2: {
        bright: cssVar('--p2-bright', '#ffffff'),
        glow: cssVar('--p2-glow', '#f0fbcf'),
        deep: cssVar('--p2-deep', '#5a7045'),
      },
    },
    strike: {
      1: {
        outer: cssVar('--strike-p1-outer', '#2b8a4c'),
        inner: cssVar('--strike-p1-inner', '#b8f5d3'),
      },
      2: {
        outer: cssVar('--strike-p2-outer', '#c8c878'),
        inner: cssVar('--strike-p2-inner', '#ffffff'),
      },
    },
  };
}

function dotGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  stops: [string, string, string],
): CanvasGradient {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.44, r * 0.08, x, y, r);
  g.addColorStop(0, stops[0]);
  g.addColorStop(0.55, stops[1]);
  g.addColorStop(1, stops[2]);
  return g;
}

function drawGlowDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  theme: Theme,
  player: Player,
): void {
  const c = theme.dot[player];
  ctx.save();
  ctx.shadowColor = c.bright;
  ctx.shadowBlur = r * 0.6;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = dotGradient(ctx, x, y, r, [c.bright, c.glow, c.deep]);
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.ellipse(x - r * 0.26, y - r * 0.3, r * 0.3, r * 0.19, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fill();
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  shape: ShapeId,
  rect: { x: number; y: number; w: number; h: number },
  theme: Theme,
): void {
  const board = getBoards()[shape];
  const vb = board.viewBox;
  const scale = Math.min(rect.w / vb.w, rect.h / vb.h);
  const ox = rect.x + (rect.w - vb.w * scale) / 2 - vb.x * scale;
  const oy = rect.y + (rect.h - vb.h * scale) / 2 - vb.y * scale;
  const px = (x: number) => ox + x * scale;
  const py = (y: number) => oy + y * scale;

  // Dot radius from the closest neighboring pair (consecutive dots on a line).
  let minD = Infinity;
  for (const line of board.lines) {
    for (let i = 1; i < line.dotIds.length; i++) {
      const a = board.dots[line.dotIds[i - 1]];
      const b = board.dots[line.dotIds[i]];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > 0 && d < minD) minD = d;
    }
  }
  if (!Number.isFinite(minD)) minD = 1;
  const r = minD * 0.3 * scale;

  for (const d of board.dots) {
    const cd = state.colored[d.id];
    const x = px(d.x);
    const y = py(d.y);
    if (cd) {
      const c = theme.dot[cd.player];
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = dotGradient(ctx, x, y, r, [c.bright, c.glow, c.deep]);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x - r * 0.26, y - r * 0.3, r * 0.3, r * 0.19, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${cd.player === 2 ? 0.75 : 0.5})`;
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, r * 0.82, 0, Math.PI * 2);
      ctx.fillStyle = dotGradient(ctx, x, y, r * 0.82, ['#2a3a30', '#1a2820', '#0d1812']);
      ctx.fill();
    }
  }

  // Strikes over the dots, like the in-game ribbon (outer base + inner highlight).
  const lineById = new Map(board.lines.map((l) => [l.id, l]));
  for (const c of state.completed) {
    const line = lineById.get(c.lineId);
    if (!line) continue;
    const first = board.dots[line.dotIds[0]];
    const last = board.dots[line.dotIds[line.dotIds.length - 1]];
    let dx = last.x - first.x;
    let dy = last.y - first.y;
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
    } else {
      dx = 1;
      dy = 0;
    }
    const over = (r * 5) / 3 / scale;
    const x1 = px(first.x - dx * over);
    const y1 = py(first.y - dy * over);
    const x2 = px(last.x + dx * over);
    const y2 = py(last.y + dy * over);
    const s = theme.strike[c.player];
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = s.outer;
    ctx.lineWidth = r * 1.15;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = s.inner;
    ctx.lineWidth = r * 0.44;
    ctx.stroke();
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const probe = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(probe).width <= maxWidth || !cur) cur = probe;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function truncate(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) {
    t = t.slice(0, -1);
  }
  return `${t}…`;
}

export interface VictoryCardInput {
  share: ResultShare;
  state: GameState;
  shape: ShapeId;
}

export async function renderVictoryCard({
  share,
  state,
  shape,
}: VictoryCardInput): Promise<Blob> {
  // Make sure the display fonts are usable on canvas before measuring text.
  try {
    await Promise.all([
      document.fonts.load(`700 56px ${FONT_DISPLAY}`),
      document.fonts.load(`600 30px ${FONT_BODY}`),
    ]);
  } catch {
    // Font API unavailable — system fallbacks still render fine.
  }

  const theme = readTheme();
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d unavailable');

  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 750);
  bg.addColorStop(0, theme.bgCenter);
  bg.addColorStop(0.6, theme.bgCenter === '#15291e' ? '#0a1a12' : theme.bgCenter);
  bg.addColorStop(1, theme.bgEdge);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Wordmark with flanking player dots.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 62px ${FONT_DISPLAY}`;
  const title = ctx.createLinearGradient(0, 40, 0, 100);
  title.addColorStop(0, theme.titleTop);
  title.addColorStop(1, theme.titleBottom);
  ctx.fillStyle = title;
  ctx.fillText('DotDuel', W / 2, 96);
  const half = ctx.measureText('DotDuel').width / 2;
  drawGlowDot(ctx, W / 2 - half - 56, 74, 24, theme, 1);
  drawGlowDot(ctx, W / 2 + half + 56, 74, 24, theme, 2);

  // Final board on the right.
  drawBoard(ctx, state, shape, { x: 630, y: 140, w: 520, h: 450 }, theme);

  // Left column: headline, score, CTA, domain.
  const colCx = 330;
  const colMax = 520;
  ctx.font = `700 54px ${FONT_DISPLAY}`;
  let headLines = wrapText(ctx, share.headline, colMax);
  if (headLines.length > 2) {
    ctx.font = `700 44px ${FONT_DISPLAY}`;
    headLines = wrapText(ctx, share.headline, colMax);
  }
  ctx.fillStyle = theme.text;
  const headLineH = headLines.length > 2 ? 54 : 64;
  let y = 218;
  for (const l of headLines) {
    ctx.fillText(l, colCx, y);
    y += headLineH;
  }

  const scoreY = Math.max(y + 96, 380);
  if (share.b) {
    ctx.font = `700 88px ${FONT_DISPLAY}`;
    const dashW = ctx.measureText(' – ').width;
    const aW = ctx.measureText(String(share.a.score)).width;
    const bW = ctx.measureText(String(share.b.score)).width;
    const total = aW + dashW + bW;
    let x = colCx - total / 2;
    ctx.textAlign = 'left';
    ctx.fillStyle = theme.dot[share.a.player].bright;
    ctx.fillText(String(share.a.score), x, scoreY);
    x += aW;
    ctx.fillStyle = theme.textDim;
    ctx.fillText(' – ', x, scoreY);
    x += dashW;
    ctx.fillStyle = theme.dot[share.b.player].bright;
    ctx.fillText(String(share.b.score), x, scoreY);
    ctx.textAlign = 'center';
    ctx.font = `600 28px ${FONT_BODY}`;
    const nameAX = colCx - total / 2 + aW / 2;
    const nameBX = colCx + total / 2 - bW / 2;
    ctx.fillStyle = theme.dot[share.a.player].bright;
    ctx.fillText(truncate(ctx, share.a.name, 250), nameAX, scoreY + 44);
    ctx.fillStyle = theme.dot[share.b.player].bright;
    ctx.fillText(truncate(ctx, share.b.name, 250), nameBX, scoreY + 44);
  } else {
    ctx.font = `700 96px ${FONT_DISPLAY}`;
    ctx.fillStyle = theme.accent;
    ctx.fillText(`${share.a.score} pts`, colCx, scoreY);
    ctx.font = `600 28px ${FONT_BODY}`;
    ctx.fillStyle = theme.dot[share.a.player].bright;
    ctx.fillText(truncate(ctx, share.a.name, colMax), colCx, scoreY + 44);
  }

  const ctaY = Math.min(scoreY + 110, 548);
  ctx.font = `600 32px ${FONT_BODY}`;
  ctx.fillStyle = theme.accent;
  ctx.fillText(share.cta, colCx, ctaY);

  ctx.font = `600 22px ${FONT_BODY}`;
  ctx.globalAlpha = 0.9;
  ctx.fillText('W W W . D O T D U E L . C O M', colCx, Math.min(ctaY + 54, 600));
  ctx.globalAlpha = 1;

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/png',
    );
  });
}
