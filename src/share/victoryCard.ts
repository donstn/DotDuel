import type { ThemeId } from '../theme';
import { themeArt } from '../themeArt';
import type { GameState, Player, ShapeId } from '../types';
import {
  FONT_BODY,
  FONT_DISPLAY,
  H,
  SCALE,
  W,
  buildQr,
  drawQrTile,
  fillSilhouette,
  inscribeRect,
  layoutBoard,
  readTheme,
  setLetterSpacing,
  strikeEnds,
  themedQrSkin,
  toPngBlob,
  truncate,
  wrapText,
  type Pt,
  type Qr,
  type QrSkin,
  type Theme,
} from './cardKit';
import { drawPaintedCard } from './paintedCard';
import type { ResultShare } from './resultShareText';

/**
 * Renders a 1200×630 (OG-card proportions) victory-card PNG entirely on an
 * offscreen <canvas> — no DOM capture, no deps. A theme with painted art
 * (themeArt.ts) gets the painted card (paintedCard.ts); every other theme
 * keeps the Glass Orb card below: dark vignette + faint triangular lattice +
 * film grain, the REAL final board as the in-game felt table, and a
 * typographic stack (headline → hero score → CTA) on the left. Colors read
 * from the active theme's CSS vars (same pattern as WinCelebration), light
 * themes flip the glass/texture inks. The Blob is produced on demand and
 * never persisted.
 */

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

function drawBoard(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  shape: ShapeId,
  rect: { x: number; y: number; w: number; h: number },
  theme: Theme,
): Pt[] {
  const l = layoutBoard(shape, rect);
  const { board, px, py, r, hull, feltGap, rimW } = l;

  // ---- In-game felt board: bezel rim, recessed felt — the 3D "table" the
  // game plays on.
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
  fillSilhouette(ctx, hull, feltGap + rimW, rim);
  ctx.restore();

  // Dark contact band just inside the rim, then the felt surface — radial
  // top-left light like the in-game board-felt gradient, slightly darker at
  // the edges so the felt reads as recessed into the bezel.
  fillSilhouette(ctx, hull, feltGap + rimW * 0.36, theme.rimLo);
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
  fillSilhouette(ctx, hull, feltGap, felt);

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
  const lineById = new Map(board.lines.map((ln) => [ln.id, ln]));
  for (const c of state.completed) {
    const line = lineById.get(c.lineId);
    if (!line) continue;
    const { x1, y1, x2, y2 } = strikeEnds(l, line.dotIds);
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

export interface VictoryCardInput {
  share: ResultShare;
  state: GameState;
  shape: ShapeId;
  /** Localized "pts" unit label drawn next to the big score numbers. */
  ptsLabel: string;
  /** Localized "Scan to play now!" caption under the QR medallion. */
  scanCaption: string;
}

export async function renderVictoryCard(input: VictoryCardInput): Promise<Blob> {
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

  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d unavailable');
  ctx.scale(SCALE, SCALE);

  const art = themeArt(document.documentElement.dataset.theme as ThemeId | undefined);
  // Art loads before anything is drawn; if any of it fails the card falls back
  // to Glass Orb — a shared image with a missing sign or felt looks broken.
  if (!(await drawPaintedCard(ctx, input, art, readTheme()))) drawGlassCard(ctx, input);
  return toPngBlob(canvas);
}

function drawGlassCard(
  ctx: CanvasRenderingContext2D,
  { share, state, shape, ptsLabel, scanCaption }: VictoryCardInput,
): void {
  const theme = readTheme();

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
        caption: scanCaption,
        skin: themedQrSkin(),
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

  // Verdict — Win / Loss / Draw from the sharer's side (daily: its headline).
  // Coloured by outcome: a win glows accent, a loss is muted, a draw is neutral.
  const verdict = share.verdict;
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
    ctx.fillText(ptsLabel, numCX + nW / 2 + 20, scoreBase);
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
}
