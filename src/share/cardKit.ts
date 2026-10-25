import qrcode from 'qrcode-generator';
import { getBoards } from '../geometry';
import type { Player, ShapeId } from '../types';

/** Shared canvas plumbing for the share-card renderers (victoryCard.ts). */

export const W = 1200;
export const H = 630;
// Output at 2× (2400×1260): messengers open shared images FULL-SCREEN on
// 1080-1440px phones, where a 1200px image shows visible pixels. All layout
// stays in 1200×630 logical units via ctx.scale — but canvas shadows are
// DEVICE-space per spec (the CTM doesn't touch them), so every shadowBlur/
// shadowOffset multiplies by SCALE explicitly.
export const SCALE = 2;

export const FONT_DISPLAY = "'Chakra Petch', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
export const FONT_BODY = "'Outfit', -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

export function cssVar(name: string, fallback: string): string {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch {
    return fallback;
  }
}

export interface Theme {
  bgCenter: string;
  bgEdge: string;
  text: string;
  textDim: string;
  accent: string;
  titleTop: string;
  titleBottom: string;
  isLight: boolean;
  /** Ink for glass borders / lattice / grain — white on dark themes, black on light. */
  glass: (a: number) => string;
  /** In-game board surface: felt gradient + bezel rim (same CSS vars as Board.tsx). */
  felt1: string;
  felt2: string;
  rimHi: string;
  rimLo: string;
  dot: Record<Player, { bright: string; glow: string; deep: string }>;
  strike: Record<Player, { outer: string; inner: string }>;
}

function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}

export function readTheme(): Theme {
  const bgCenter = cssVar('--bg-center', '#15291e');
  const isLight = luminance(bgCenter) > 0.5;
  return {
    bgCenter,
    bgEdge: cssVar('--bg-edge', '#02090b'),
    text: cssVar('--text-bright', '#ffffff'),
    textDim: cssVar('--text-dim', '#93a89a'),
    accent: cssVar('--accent', '#7bdb95'),
    titleTop: cssVar('--title-grad-top', '#ffffff'),
    titleBottom: cssVar('--title-grad-bottom', '#b9d6c4'),
    isLight,
    glass: isLight ? (a) => `rgba(20,16,8,${a})` : (a) => `rgba(255,255,255,${a})`,
    felt1: cssVar('--board-felt-1', '#16291e'),
    felt2: cssVar('--board-felt-2', '#0a1812'),
    rimHi: cssVar('--rim-hi', '#37473e'),
    rimLo: cssVar('--rim-lo', '#07100c'),
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

export function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export interface Pt {
  x: number;
  y: number;
}

// Andrew monotone chain — the dots' convex hull is the felt outline.
function convexHull(pts: Pt[]): Pt[] {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Pt, a: Pt, b: Pt) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Pt[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0)
      lower.pop();
    lower.push(q);
  }
  const upper: Pt[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0)
      upper.pop();
    upper.push(q);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

export interface BoardLayout {
  board: ReturnType<typeof getBoards>[ShapeId];
  px: (x: number) => number;
  py: (y: number) => number;
  /** Board units → canvas units. */
  scale: number;
  /** Dot radius in canvas units. */
  r: number;
  /** The dots' convex hull in canvas space. */
  hull: Pt[];
  feltGap: number;
  rimW: number;
}

export function layoutBoard(
  shape: ShapeId,
  rect: { x: number; y: number; w: number; h: number },
): BoardLayout {
  const board = getBoards()[shape];
  const vb = board.viewBox;
  // Two-pass fit: the felt + rim extend past the dots by a dot-radius-derived
  // margin, so size the dot layout once, derive the margin, then refit.
  let scale = Math.min(rect.w / vb.w, rect.h / vb.h);
  let margin = 0;
  for (let pass = 0; pass < 2; pass++) {
    scale = Math.min((rect.w - margin * 2) / vb.w, (rect.h - margin * 2) / vb.h);
    margin = scale * 0.31 * (1.64 + 0.55) + 6; // feltGap + rim + breathing room
  }
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
  const r = minD * 0.31 * scale;
  const hull = convexHull(board.dots.map((d) => ({ x: px(d.x), y: py(d.y) })));
  return { board, px, py, scale, r, hull, feltGap: r * 1.64, rimW: r * 0.5 };
}

/**
 * Minkowski-rounded hull at `offset` (round-join fat stroke + fill = the
 * disc-offset silhouette Board.tsx builds), filled with `paint`.
 */
export function fillSilhouette(
  ctx: CanvasRenderingContext2D,
  hull: Pt[],
  offset: number,
  paint: string | CanvasGradient | CanvasPattern,
): void {
  ctx.beginPath();
  hull.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = offset * 2;
  ctx.strokeStyle = paint;
  ctx.fillStyle = paint;
  ctx.stroke();
  ctx.fill();
}

/** Strike endpoints with the in-game 5R/3 overshoot, in canvas space. */
export function strikeEnds(
  l: BoardLayout,
  dotIds: number[],
): { x1: number; y1: number; x2: number; y2: number } {
  const first = l.board.dots[dotIds[0]];
  const last = l.board.dots[dotIds[dotIds.length - 1]];
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
  const over = (l.r * (5 / 3)) / l.scale;
  return {
    x1: l.px(first.x - dx * over),
    y1: l.py(first.y - dy * over),
    x2: l.px(last.x + dx * over),
    y2: l.py(last.y + dy * over),
  };
}

// Vertical span [yMin,yMax] where the line x=X crosses a convex polygon, or null
// if X is outside it.
function yIntervalAt(poly: Pt[], x: number): [number, number] | null {
  const ys: number[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    if (x < Math.min(a.x, b.x) || x > Math.max(a.x, b.x)) continue;
    if (a.x === b.x) ys.push(a.y, b.y);
    else ys.push(a.y + ((x - a.x) / (b.x - a.x)) * (b.y - a.y));
  }
  if (ys.length < 2) return null;
  return [Math.min(...ys), Math.max(...ys)];
}

// Largest rectangle of the given aspect (h/w), centered on x=cx, that fits
// inside a convex polygon. For a convex hull the binding columns are the two
// vertical edges of the rect, so intersect their y-spans and grow w by binary
// search. Returns the rect's top-left + width, or null if nothing fits.
export function inscribeRect(
  poly: Pt[],
  cx: number,
  aspect: number,
  maxW: number,
): { x: number; y: number; w: number } | null {
  const topYFor = (w: number): number | null => {
    const half = w / 2;
    const i1 = yIntervalAt(poly, cx - half);
    const i2 = yIntervalAt(poly, cx + half);
    if (!i1 || !i2) return null;
    const ylo = Math.max(i1[0], i2[0]);
    const yhi = Math.min(i1[1], i2[1]);
    const band = yhi - ylo;
    const h = w * aspect;
    if (band < h) return null;
    return ylo + (band - h) / 2; // centered vertically in the available band
  };
  let lo = 0;
  let hi = maxW;
  let best: { x: number; y: number; w: number } | null = null;
  for (let i = 0; i < 34; i++) {
    const w = (lo + hi) / 2;
    const y = topYFor(w);
    if (y != null) {
      best = { x: cx - w / 2, y, w };
      lo = w;
    } else {
      hi = w;
    }
  }
  return best;
}

export function wrapText(
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

export function truncate(
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

export function setLetterSpacing(ctx: CanvasRenderingContext2D, v: string): void {
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = v;
  } catch {
    // Older engines — spacing is cosmetic, skip.
  }
}

// The domain text on the card isn't clickable (it's pixels), and forwarded
// images usually lose their accompanying link — the QR survives inside the
// picture. Recipients long-press the image (Google Lens / Live Text) or scan
// from another screen; the URL carries the sharer's ?ref=<CODE>.
export type Qr = ReturnType<typeof qrcode>;

export interface QrSkin {
  tile: string; // light field — high luminance
  module: string; // dark modules — low luminance
  border?: string;
}
const QR_DEFAULT: QrSkin = { tile: '#ffffff', module: '#0c120e' };

export function buildQr(url: string, ec: 'M' | 'Q' | 'H' = 'M'): Qr | null {
  try {
    const qr = qrcode(0, ec);
    qr.addData(url);
    qr.make();
    return qr;
  } catch {
    return null; // overlong URL etc. — the card just ships without a QR
  }
}

// Scale every RGB channel by f (0..1) — keeps the hue, drops the luminance, so
// a brand colour can be pushed dark enough to read as QR modules.
export function darken(hex: string, f: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** The themed QR skin: deep p1-green modules on a light p2-cream tile. */
export function themedQrSkin(): QrSkin {
  return {
    tile: cssVar('--p2-glow', '#f0fbcf'),
    module: darken(cssVar('--p1', '#0d4a23'), 0.62),
  };
}

// Rounded tile at (x,y), QR in the top w×w square, an optional caption strip of
// height capH below it. Painted late (after the grain) so film noise never
// speckles the modules and costs scannability. Default skin is dark-on-white; a
// themed skin (dark p1 green on light p2 cream) stays scannable because the
// palette is luminance-separated by design.
export function drawQrTile(
  ctx: CanvasRenderingContext2D,
  qr: Qr,
  x: number,
  y: number,
  w: number,
  capH: number,
  skin: QrSkin = QR_DEFAULT,
  caption?: string,
  shadow = true,
): void {
  const count = qr.getModuleCount();
  const PAD = Math.max(10, w * 0.085); // quiet zone (≈4 modules)
  const totalH = w + capH;

  ctx.save();
  if (shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 18 * SCALE;
    ctx.shadowOffsetY = 6 * SCALE;
  }
  rr(ctx, x, y, w, totalH, 16);
  ctx.fillStyle = skin.tile;
  ctx.fill();
  ctx.restore();
  if (skin.border) {
    rr(ctx, x, y, w, totalH, 16);
    ctx.strokeStyle = skin.border;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (caption && capH > 10) {
    let fs = Math.round(capH * 0.46);
    ctx.font = `700 ${fs}px ${FONT_BODY}`;
    while (fs > 9 && ctx.measureText(caption).width > w * 0.9) {
      fs -= 1;
      ctx.font = `700 ${fs}px ${FONT_BODY}`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = skin.module;
    ctx.fillText(caption, x + w / 2, y + w + capH * 0.54);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  // Modules in DEVICE pixels at integer coordinates/size — under ctx.scale
  // they'd land on half-pixels and anti-alias into gray, which JPEG then
  // smears; crisp squares are the scannability budget.
  const innerDev = (w - PAD * 2) * SCALE;
  const m = Math.max(1, Math.floor(innerDev / count));
  const qrDev = m * count;
  const x0 = Math.round((x + w / 2) * SCALE - qrDev / 2);
  const y0 = Math.round((y + w / 2) * SCALE - qrDev / 2);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = skin.module;
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) ctx.fillRect(x0 + col * m, y0 + row * m, m, m);
    }
  }
  ctx.restore();
}

export function toPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });
}
