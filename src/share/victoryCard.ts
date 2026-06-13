import qrcode from 'qrcode-generator';
import { getBoards } from '../geometry';
import type { GameState, Player, ShapeId } from '../types';
import type { ResultShare } from './resultShareText';

/**
 * Renders a 1200×630 (OG-card proportions) victory-card PNG entirely on an
 * offscreen <canvas> — no DOM capture, no deps. Glass Orb aesthetic: dark
 * vignette + faint triangular lattice + film grain, the REAL final board
 * inside a glassmorphism panel with a glow bloom, and a typographic stack
 * (mode chip → headline → hero score → CTA button) on the left. Theme-aware:
 * colors read from the active theme's CSS vars (same pattern as
 * WinCelebration), light themes flip the glass/texture inks. The Blob is
 * produced on demand and never persisted.
 */

const W = 1200;
const H = 630;
// Output at 2× (2400×1260): messengers open shared images FULL-SCREEN on
// 1080-1440px phones, where a 1200px image shows visible pixels. All layout
// stays in 1200×630 logical units via ctx.scale — but canvas shadows are
// DEVICE-space per spec (the CTM doesn't touch them), so every shadowBlur/
// shadowOffset below multiplies by SCALE explicitly.
const SCALE = 2;

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

function readTheme(): Theme {
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

function rr(
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
  ctx.shadowBlur = r * 0.7 * SCALE;
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

function drawLattice(ctx: CanvasRenderingContext2D, theme: Theme): void {
  // Faint triangular lattice — the game's board geometry as background texture.
  const step = 74;
  ctx.save();
  ctx.strokeStyle = theme.glass(theme.isLight ? 0.05 : 0.035);
  ctx.lineWidth = 1;
  const dirs = [Math.PI / 3, -Math.PI / 3, 0];
  for (const ang of dirs) {
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    // Normal to the line direction; march the family across the canvas.
    const nx = -dy;
    const ny = dx;
    const reach = Math.hypot(W, H);
    for (let k = -reach; k <= reach; k += step) {
      const cx = W / 2 + nx * k;
      const cy = H / 2 + ny * k;
      ctx.beginPath();
      ctx.moveTo(cx - dx * reach, cy - dy * reach);
      ctx.lineTo(cx + dx * reach, cy + dy * reach);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawGrain(ctx: CanvasRenderingContext2D, theme: Theme): void {
  const tile = document.createElement('canvas');
  tile.width = 128;
  tile.height = 128;
  const tctx = tile.getContext('2d');
  if (!tctx) return;
  const img = tctx.createImageData(128, 128);
  const ink = theme.isLight ? 0 : 255;
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = ink;
    img.data[i + 1] = ink;
    img.data[i + 2] = ink;
    img.data[i + 3] = Math.random() * 26;
  }
  tctx.putImageData(img, 0, 0);
  const pat = ctx.createPattern(tile, 'repeat');
  if (!pat) return;
  ctx.save();
  // Device space: under ctx.scale the pattern's noise pixels would smear into
  // soft 2×2 blobs. Resetting the transform keeps true 1-device-px film grain.
  // Slightly lower alpha than the 1× original — noise is incompressible, and
  // 4× the grain pixels would otherwise balloon the PNG.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, W * SCALE, H * SCALE);
  ctx.restore();
}

interface Pt {
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

function drawBoard(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  shape: ShapeId,
  rect: { x: number; y: number; w: number; h: number },
  theme: Theme,
): Pt[] {
  const board = getBoards()[shape];
  const vb = board.viewBox;
  // Two-pass fit: the felt + rim extend past the dots by a dot-radius-derived
  // margin, so size the dot layout once, derive the margin, then refit.
  let scale = Math.min(rect.w / vb.w, rect.h / vb.h);
  let margin = Math.min(rect.w, rect.h) * 0.0; // first pass: none
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

  // ---- In-game felt board: Minkowski-rounded hull (round-join fat stroke +
  // fill = the disc-offset silhouette Board.tsx builds), bezel rim, recessed
  // felt — the 3D "table" the game plays on.
  const hull = convexHull(board.dots.map((d) => ({ x: px(d.x), y: py(d.y) })));
  const traceHull = () => {
    ctx.beginPath();
    hull.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
  };
  const silhouette = (offset: number, paint: string | CanvasGradient) => {
    traceHull();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = offset * 2;
    ctx.strokeStyle = paint;
    ctx.fillStyle = paint;
    ctx.stroke();
    ctx.fill();
  };
  const feltGap = r * 1.64; // in-game feltGap = dotRadius * 1.64
  const rimW = r * 0.5;
  const top = Math.min(...hull.map((p) => p.y)) - feltGap - rimW;
  const bot = Math.max(...hull.map((p) => p.y)) + feltGap + rimW;

  // Bezel rim, top-lit, floated on a drop shadow.
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 26 * SCALE;
  ctx.shadowOffsetY = 10 * SCALE;
  const rim = ctx.createLinearGradient(0, top, 0, bot);
  rim.addColorStop(0, theme.rimHi);
  rim.addColorStop(0.5, theme.felt1);
  rim.addColorStop(1, theme.rimLo);
  silhouette(feltGap + rimW, rim);
  ctx.restore();

  // Dark contact band just inside the rim, then the felt surface — radial
  // top-left light like the in-game board-felt gradient, slightly darker at
  // the edges so the felt reads as recessed into the bezel.
  silhouette(feltGap + rimW * 0.36, theme.rimLo);
  const cxF = (Math.min(...hull.map((p) => p.x)) + Math.max(...hull.map((p) => p.x))) / 2;
  const spanF = bot - top;
  const felt = ctx.createRadialGradient(
    cxF - spanF * 0.18,
    top + spanF * 0.22,
    spanF * 0.08,
    cxF,
    (top + bot) / 2,
    spanF * 0.92,
  );
  felt.addColorStop(0, theme.felt1);
  felt.addColorStop(1, theme.felt2);
  silhouette(feltGap, felt);

  for (const d of board.dots) {
    const cd = state.colored[d.id];
    const x = px(d.x);
    const y = py(d.y);
    if (cd) {
      const c = theme.dot[cd.player];
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = r * 0.5 * SCALE;
      ctx.shadowOffsetY = r * 0.22 * SCALE;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = dotGradient(ctx, x, y, r, [c.bright, c.glow, c.deep]);
      ctx.fill();
      ctx.restore();
      ctx.beginPath();
      ctx.ellipse(x - r * 0.26, y - r * 0.3, r * 0.3, r * 0.19, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${cd.player === 2 ? 0.75 : 0.5})`;
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, r * 0.78, 0, Math.PI * 2);
      ctx.fillStyle = theme.isLight
        ? dotGradient(ctx, x, y, r * 0.78, ['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.16)', 'rgba(0,0,0,0.24)'])
        : dotGradient(ctx, x, y, r * 0.78, ['#2a3a30', '#1a2820', '#0d1812']);
      ctx.fill();
    }
  }

  // Strikes over the dots — EXACT in-game proportions (Board.tsx: strokeWidth
  // = dotRadius*0.42, outer ×0.575, inner ×0.22, overshoot 5R/3, opaque).
  // Anything fatter turns a finished Square board (40 struck lines) into a
  // bright mesh that buries the dots and reads as fake.
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
    const over = (r * (5 / 3)) / scale;
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
    ctx.lineWidth = r * 0.42 * 0.575;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = s.inner;
    ctx.lineWidth = r * 0.42 * 0.22;
    ctx.stroke();
  }

  // The dots' convex hull (canvas space) — the medallion is inscribed inside it
  // so the QR can never poke past the board's silhouette (matters for the
  // pointed shapes: triangle, rhombus).
  return hull;
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
function inscribeRect(
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

function setLetterSpacing(ctx: CanvasRenderingContext2D, v: string): void {
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
type Qr = ReturnType<typeof qrcode>;

interface QrSkin {
  tile: string; // light field — high luminance
  module: string; // dark modules — low luminance
  border?: string;
}
const QR_DEFAULT: QrSkin = { tile: '#ffffff', module: '#0c120e' };

function buildQr(url: string, ec: 'M' | 'Q' | 'H' = 'M'): Qr | null {
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
function darken(hex: string, f: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// Rounded tile at (x,y), QR in the top w×w square, an optional caption strip of
// height capH below it. Painted late (after the grain) so film noise never
// speckles the modules and costs scannability. Default skin is dark-on-white; a
// themed skin (dark p1 green on light p2 cream) stays scannable because the
// palette is luminance-separated by design.
function drawQrTile(
  ctx: CanvasRenderingContext2D,
  qr: Qr,
  x: number,
  y: number,
  w: number,
  capH: number,
  skin: QrSkin = QR_DEFAULT,
  caption?: string,
): void {
  const count = qr.getModuleCount();
  const PAD = Math.max(10, w * 0.085); // quiet zone (≈4 modules)
  const totalH = w + capH;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 18 * SCALE;
  ctx.shadowOffsetY = 6 * SCALE;
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
      document.fonts.load(`800 30px ${FONT_BODY}`),
    ]);
  } catch {
    // Font API unavailable — system fallbacks still render fine.
  }

  const theme = readTheme();
  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d unavailable');
  ctx.scale(SCALE, SCALE);

  // ---- Atmosphere -----------------------------------------------------------
  ctx.fillStyle = theme.bgEdge;
  ctx.fillRect(0, 0, W, H);
  // Light source sits behind the board panel (right side) for depth.
  const bg = ctx.createRadialGradient(870, 290, 60, 870, 290, 900);
  bg.addColorStop(0, theme.bgCenter);
  bg.addColorStop(1, theme.bgEdge);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  drawLattice(ctx, theme);

  // Corner vignette pulls the eye inward.
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.72);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, theme.isLight ? 'rgba(60,40,10,0.18)' : 'rgba(0,0,0,0.42)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // ---- Board (right) — the real in-game felt table, no glass card ----------
  // Spans (roughly) from the wordmark at the top to the domain at the bottom,
  // and as wide as the card allows — the board is the hero on the right.
  const panel = { x: 610, y: 82, w: 578, h: 516 };

  // Accent bloom behind the board — the card's light source.
  const bloom = ctx.createRadialGradient(
    panel.x + panel.w / 2,
    panel.y + panel.h / 2,
    40,
    panel.x + panel.w / 2,
    panel.y + panel.h / 2,
    panel.w * 0.78,
  );
  bloom.addColorStop(0, `${theme.accent}3c`);
  bloom.addColorStop(1, `${theme.accent}00`);
  ctx.fillStyle = bloom;
  ctx.fillRect(panel.x - 130, panel.y - 130, panel.w + 260, panel.h + 260);

  const hull = drawBoard(ctx, state, shape, panel, theme);

  // ---- Themed QR medallion, inscribed INSIDE the board silhouette ------------
  // Game colours: deep p1-green modules on a light p2-cream tile + a "Scan to
  // play now!" caption. The palette is luminance-separated by design (CVD-safe),
  // so the colour still scans; EC level H adds redundancy for the colour + the
  // busy felt. inscribeRect keeps the whole tile within the hull so it never
  // pokes past a pointed shape's edges. Only the POSITION is reserved here — the
  // tile is painted after the grain (below) so noise never costs contrast.
  let qrDraw:
    | { qr: Qr; x: number; y: number; w: number; capH: number; skin: QrSkin; caption: string }
    | null = null;
  const medQr = buildQr(share.url, 'H');
  if (medQr && hull.length >= 3) {
    const xsH = hull.map((p) => p.x);
    const cx = (Math.min(...xsH) + Math.max(...xsH)) / 2;
    const spanX = Math.max(...xsH) - Math.min(...xsH);
    const ASPECT = 1.18; // square QR + ~18% caption strip
    const rect = inscribeRect(hull, cx, ASPECT, Math.min(spanX, 300));
    if (rect) {
      qrDraw = {
        qr: medQr,
        x: rect.x,
        y: rect.y,
        w: rect.w,
        capH: rect.w * (ASPECT - 1),
        caption: 'Scan to play now!',
        skin: {
          tile: cssVar('--p2-glow', '#f0fbcf'),
          module: darken(cssVar('--p1', '#0d4a23'), 0.62),
        },
      };
    }
  }

  // ---- Left column — CENTERED stack -----------------------------------------
  const colX = 64;
  const colW = 540;
  const colCX = colX + colW / 2;

  // Wordmark, flanked by the two player dots.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 42px ${FONT_DISPLAY}`;
  const title = ctx.createLinearGradient(0, 70, 0, 110);
  title.addColorStop(0, theme.titleTop);
  title.addColorStop(1, theme.titleBottom);
  const wmW = ctx.measureText('DotDuel').width;
  drawGlowDot(ctx, colCX - wmW / 2 - 33, 96, 15, theme, 1);
  ctx.fillStyle = title;
  ctx.fillText('DotDuel', colCX, 110);
  drawGlowDot(ctx, colCX + wmW / 2 + 33, 96, 15, theme, 2);

  // Verdict — just Win / Loss / Draw, from the sharer's perspective. Coloured by
  // outcome: a win glows accent, a loss is muted, a draw is neutral. Solo/daily
  // (no opponent) keeps its own headline since Win/Loss is meaningless there.
  const verdict = share.b
    ? share.outcome === 'win'
      ? 'Win'
      : share.outcome === 'loss'
        ? 'Loss'
        : 'Draw'
    : share.headline;
  ctx.font = `700 76px ${FONT_DISPLAY}`;
  const vLine = wrapText(ctx, verdict, colW)[0] ?? verdict;
  ctx.save();
  if (share.b && share.outcome === 'win') {
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = 22 * SCALE;
    ctx.fillStyle = theme.accent;
  } else if (share.b && share.outcome === 'loss') {
    ctx.fillStyle = theme.textDim;
  } else {
    ctx.fillStyle = theme.text;
  }
  ctx.fillText(vLine, colCX, 252);
  ctx.restore();

  // Hero score block — fixed single-line layout now the chip + multi-line
  // headline are gone; the whole left stack is vertically balanced.
  const scoreSize = share.b ? 84 : 92;
  const scoreFont = `700 ${scoreSize}px ${FONT_DISPLAY}`;
  const scoreBase = 378;
  const nameY = scoreBase + 44;
  if (share.b) {
    const winnerIsA = share.outcome === 'win';
    ctx.font = scoreFont;
    const sepW = ctx.measureText('–').width + 36;
    const aW = ctx.measureText(String(share.a.score)).width;
    const bW = ctx.measureText(String(share.b.score)).width;
    const total = aW + 18 + sepW + bW;
    const aCX = colCX - total / 2 + aW / 2;
    const bCX = colCX + total / 2 - bW / 2;

    const drawScore = (
      score: number,
      player: Player,
      won: boolean,
      atCX: number,
    ): void => {
      ctx.save();
      if (won) {
        ctx.shadowColor = theme.dot[player].bright;
        ctx.shadowBlur = 24 * SCALE;
      }
      ctx.fillStyle = won ? theme.dot[player].bright : theme.textDim;
      ctx.font = scoreFont;
      ctx.fillText(String(score), atCX, scoreBase);
      ctx.restore();
    };

    drawScore(share.a.score, share.a.player, winnerIsA || share.outcome === 'draw', aCX);
    ctx.fillStyle = theme.glass(0.35);
    ctx.font = scoreFont;
    ctx.fillText('–', colCX, scoreBase);
    drawScore(
      share.b.score,
      share.b.player,
      share.outcome === 'loss' || share.outcome === 'draw',
      bCX,
    );

    // Names centered under their numerals, bullet dots in player colors.
    ctx.font = `600 25px ${FONT_BODY}`;
    const nameA = truncate(ctx, share.a.name, 230);
    const nameB = truncate(ctx, share.b.name, 230);
    const drawName = (name: string, player: Player, atCX: number): void => {
      const nw = ctx.measureText(name).width;
      ctx.beginPath();
      ctx.arc(atCX - nw / 2 - 18, nameY - 8, 7, 0, Math.PI * 2);
      ctx.fillStyle = theme.dot[player].bright;
      ctx.fill();
      ctx.fillStyle = theme.text;
      ctx.fillText(name, atCX + 9, nameY);
    };
    drawName(nameA, share.a.player, aCX);
    drawName(nameB, share.b.player, bCX);
  } else {
    // Solo (daily): accent score + "pts".
    ctx.font = scoreFont;
    const nW = ctx.measureText(String(share.a.score)).width;
    ctx.font = `700 38px ${FONT_DISPLAY}`;
    const ptsW = ctx.measureText('pts').width;
    const numCX = colCX - (ptsW + 20) / 2;
    ctx.save();
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = 26 * SCALE;
    ctx.font = scoreFont;
    ctx.fillStyle = theme.accent;
    ctx.fillText(String(share.a.score), numCX, scoreBase);
    ctx.restore();
    ctx.font = `700 38px ${FONT_DISPLAY}`;
    ctx.fillStyle = theme.textDim;
    ctx.textAlign = 'left';
    ctx.fillText('pts', numCX + nW / 2 + 20, scoreBase);
    ctx.textAlign = 'center';
    ctx.font = `600 25px ${FONT_BODY}`;
    const soloName = truncate(ctx, share.a.name, 300);
    const snW = ctx.measureText(soloName).width;
    ctx.beginPath();
    ctx.arc(colCX - snW / 2 - 18, nameY - 8, 7, 0, Math.PI * 2);
    ctx.fillStyle = theme.dot[1].bright;
    ctx.fill();
    ctx.fillStyle = theme.text;
    ctx.fillText(soloName, colCX + 9, nameY);
  }

  // CTA — a challenge line (not a button; nothing on a picture is clickable),
  // accent rules flanking glowing text, with the domain right below as the
  // "where". The QR now lives on the board, so this returns to a centered stack.
  ctx.textBaseline = 'alphabetic';
  const ctaBase = 524;
  setLetterSpacing(ctx, '1px');
  ctx.textAlign = 'center';
  ctx.font = `700 31px ${FONT_DISPLAY}`;
  const ctaW = ctx.measureText(share.cta).width;
  ctx.save();
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 18 * SCALE;
  ctx.fillStyle = theme.accent;
  ctx.fillText(share.cta, colCX, ctaBase);
  ctx.restore();
  setLetterSpacing(ctx, '0px');
  const ruleY = ctaBase - 10;
  const ruleGap = ctaW / 2 + 26;
  const ruleLen = 64;
  const rule = (dir: 1 | -1) => {
    const g = ctx.createLinearGradient(
      colCX + dir * ruleGap,
      0,
      colCX + dir * (ruleGap + ruleLen),
      0,
    );
    g.addColorStop(0, `${theme.accent}cc`);
    g.addColorStop(1, `${theme.accent}00`);
    ctx.strokeStyle = g;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(colCX + dir * ruleGap, ruleY);
    ctx.lineTo(colCX + dir * (ruleGap + ruleLen), ruleY);
    ctx.stroke();
  };
  rule(1);
  rule(-1);

  setLetterSpacing(ctx, '2px');
  ctx.font = `700 34px ${FONT_BODY}`;
  ctx.fillStyle = theme.text;
  ctx.fillText('www.DotDuel.com', colCX, Math.min(ctaBase + 56, 600));
  setLetterSpacing(ctx, '0px');
  ctx.textAlign = 'left';

  drawGrain(ctx, theme);
  // After the grain so noise never speckles the tile / QR modules.
  if (qrDraw)
    drawQrTile(ctx, qrDraw.qr, qrDraw.x, qrDraw.y, qrDraw.w, qrDraw.capH, qrDraw.skin, qrDraw.caption);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/png',
    );
  });
}
