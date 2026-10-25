import { LINE_THICKNESS_MULT } from '../components/Board';
import { getBoards } from '../geometry';
import type { NineArt, PanelArt, ThemeArt } from '../themeArt';
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
  setLetterSpacing,
  strikeEnds,
  themedQrSkin,
  truncate,
  type Theme,
} from './cardKit';
import type { ResultShare } from './resultShareText';

/**
 * The victory card for themes with painted art (themeArt.ts): the theme's
 * scenery behind everything, the header sign with the verdict on its plank,
 * the score in a card frame, and the final board drawn with the same felt,
 * dot and strand sprites as the in-game painted board.
 */

interface CardArt {
  sign: PanelArt;
  frame: NineArt;
  img: {
    background: HTMLImageElement;
    sign: HTMLImageElement;
    frame: HTMLImageElement;
    felt: HTMLImageElement;
    dot: Record<Player, HTMLImageElement>;
    /** Strand sprites by `${len}-${player}`, lengths 2–9. */
    line: Map<string, HTMLImageElement>;
  };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`art failed to load: ${url}`));
    img.src = url;
  });
}

const lineKey = (len: number, p: Player) => `${len}-${p}`;
// Corners (length 1) reuse length 2's strand, as on the in-game board.
const strandLen = (len: number) => Math.min(Math.max(len, 2), 9);

async function loadCardArt(art: ThemeArt, state: GameState, shape: ShapeId): Promise<CardArt | null> {
  const { headerSign, cardFrame, board, background } = art;
  if (!headerSign || !cardFrame || !board || !background) return null;
  const lens = new Set<string>();
  const lines = new Map(getBoards()[shape].lines.map((ln) => [ln.id, ln.length]));
  for (const c of state.completed) {
    const len = lines.get(c.lineId);
    if (len != null) lens.add(lineKey(strandLen(len), c.player));
  }
  try {
    const [bg, sign, frame, felt, d1, d2, ...strands] = await Promise.all([
      loadImage(background.landscape),
      loadImage(headerSign.url),
      loadImage(cardFrame.url),
      loadImage(board.felt),
      loadImage(board.dot(1)),
      loadImage(board.dot(2)),
      ...[...lens].map((k) => {
        const [len, p] = k.split('-').map(Number);
        return loadImage(board.line(len, p as Player));
      }),
    ]);
    const line = new Map<string, HTMLImageElement>();
    [...lens].forEach((k, i) => line.set(k, strands[i]));
    return {
      sign: headerSign,
      frame: cardFrame,
      img: { background: bg, sign, frame, felt, dot: { 1: d1, 2: d2 }, line },
    };
  } catch {
    return null;
  }
}

/** Draws `img` to cover the box, centred, cropping the overflow. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const s = Math.max(w / img.width, h / img.height);
  const sw = w / s;
  const sh = h / s;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

/** Nine-slice: corners keep their painted shape at `k` canvas units per art pixel. */
function drawNine(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  a: NineArt,
  x: number,
  y: number,
  w: number,
  h: number,
  k: number,
): void {
  // Art geometry is in the processed image's own pixels; the decoded image
  // may differ if it was re-exported, so map through the real size.
  const fx = img.width / a.width;
  const fy = img.height / a.height;
  const sx = [0, a.capLeft * fx, img.width - a.capRight * fx, img.width];
  const sy = [0, a.capTop * fy, img.height - a.capBottom * fy, img.height];
  const dx = [x, x + a.capLeft * k, x + w - a.capRight * k, x + w];
  const dy = [y, y + a.capTop * k, y + h - a.capBottom * k, y + h];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      ctx.drawImage(
        img,
        sx[i],
        sy[j],
        sx[i + 1] - sx[i],
        sy[j + 1] - sy[j],
        dx[i],
        dy[j],
        dx[i + 1] - dx[i],
        dy[j + 1] - dy[j],
      );
    }
  }
}

/** Text with a pearl-ivory fill and a dark drop, like the painted sign lettering. */
function pearlText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  glow?: string,
): void {
  const g = ctx.createLinearGradient(0, y - size * 0.8, 0, y);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.5, '#f0fbcf');
  g.addColorStop(1, '#d3ecaa');
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 6 * SCALE;
  ctx.shadowOffsetY = 3 * SCALE;
  ctx.fillStyle = g;
  ctx.fillText(text, x, y);
  ctx.restore();
  if (glow) {
    ctx.save();
    ctx.shadowColor = glow;
    ctx.shadowBlur = 20 * SCALE;
    ctx.fillStyle = g;
    ctx.fillText(text, x, y);
    ctx.restore();
  }
}

/** Shrinks `font(size)` until `text` fits `maxW`; returns the size used. */
function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  size: number,
  font: (s: number) => string,
): number {
  ctx.font = font(size);
  while (size > 18 && ctx.measureText(text).width > maxW) {
    size -= 2;
    ctx.font = font(size);
  }
  return size;
}

function drawPaintedBoard(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  shape: ShapeId,
  rect: { x: number; y: number; w: number; h: number },
  theme: Theme,
  art: CardArt,
) {
  const l = layoutBoard(shape, rect);
  const { board, px, py, r, hull, feltGap, rimW } = l;
  const top = Math.min(...hull.map((p) => p.y)) - feltGap - rimW;
  const bot = Math.max(...hull.map((p) => p.y)) + feltGap + rimW;
  const left = Math.min(...hull.map((p) => p.x)) - feltGap - rimW;
  const right = Math.max(...hull.map((p) => p.x)) + feltGap + rimW;

  // Bezel rim, top-lit, floated on a drop shadow; dark contact band inside.
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 30 * SCALE;
  ctx.shadowOffsetY = 12 * SCALE;
  const rim = ctx.createLinearGradient(0, top, 0, bot);
  rim.addColorStop(0, theme.rimHi);
  rim.addColorStop(0.5, theme.felt1);
  rim.addColorStop(1, theme.rimLo);
  fillSilhouette(ctx, hull, feltGap + rimW, rim);
  ctx.restore();
  fillSilhouette(ctx, hull, feltGap + rimW * 0.36, theme.rimLo);

  // Moss felt: the silhouette on an offscreen layer, the felt art composited
  // into it, then darkened toward the edge so it reads as recessed.
  const layer = document.createElement('canvas');
  layer.width = W * SCALE;
  layer.height = H * SCALE;
  const lc = layer.getContext('2d');
  if (lc) {
    lc.scale(SCALE, SCALE);
    fillSilhouette(lc, hull, feltGap, '#000');
    lc.globalCompositeOperation = 'source-in';
    drawCover(lc, art.img.felt, left, top, right - left, bot - top);
    lc.globalCompositeOperation = 'source-atop';
    const span = Math.max(right - left, bot - top);
    const shade = lc.createRadialGradient(
      (left + right) / 2,
      top + (bot - top) * 0.42,
      span * 0.2,
      (left + right) / 2,
      (top + bot) / 2,
      span * 0.62,
    );
    shade.addColorStop(0, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,0,0,0.42)');
    lc.fillStyle = shade;
    lc.fillRect(left, top, right - left, bot - top);
    ctx.drawImage(layer, 0, 0, W, H);
  }

  for (const d of board.dots) {
    const cd = state.colored[d.id];
    const x = px(d.x);
    const y = py(d.y);
    if (cd) {
      ctx.drawImage(art.img.dot[cd.player], x - r, y - r, r * 2, r * 2);
    } else {
      const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.3, r * 0.05, x, y, r * 0.78);
      g.addColorStop(0, '#2a3a30');
      g.addColorStop(0.55, '#1a2820');
      g.addColorStop(1, '#0d1812');
      ctx.beginPath();
      ctx.arc(x, y, r * 0.78, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }
  }

  // Strands exactly as Board.tsx lays them: the art's long axis is its height,
  // stretched to the overshot endpoint span; width normalised per asset.
  const lineImgH = r * 0.42 * 3.4;
  const lineById = new Map(board.lines.map((ln) => [ln.id, ln]));
  for (const c of state.completed) {
    const line = lineById.get(c.lineId);
    if (!line) continue;
    const artLen = strandLen(line.length);
    const img = art.img.line.get(lineKey(artLen, c.player));
    if (!img) continue;
    const { x1, y1, x2, y2 } = strikeEnds(l, line.dotIds);
    const len = Math.hypot(x2 - x1, y2 - y1);
    const imgW = lineImgH * LINE_THICKNESS_MULT[c.player][artLen];
    ctx.save();
    ctx.translate((x1 + x2) / 2, (y1 + y2) / 2);
    ctx.rotate(Math.atan2(y2 - y1, x2 - x1) - Math.PI / 2);
    ctx.drawImage(img, -imgW / 2, -len / 2, imgW, len);
    ctx.restore();
  }
  return hull;
}

export async function drawPaintedCard(
  ctx: CanvasRenderingContext2D,
  {
    share,
    state,
    shape,
    ptsLabel,
    scanCaption,
  }: { share: ResultShare; state: GameState; shape: ShapeId; ptsLabel: string; scanCaption: string },
  themeArtSet: ThemeArt,
  theme: Theme,
): Promise<boolean> {
  const art = await loadCardArt(themeArtSet, state, shape);
  if (!art) return false;

  // ---- Scenery: the forest, darkened on the left so the text column reads.
  drawCover(ctx, art.img.background, 0, 0, W, H);
  const shade = ctx.createLinearGradient(0, 0, W * 0.62, 0);
  shade.addColorStop(0, 'rgba(2,9,11,0.74)');
  shade.addColorStop(0.75, 'rgba(2,9,11,0.42)');
  shade.addColorStop(1, 'rgba(2,9,11,0.12)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.72);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // ---- Board (right), with a soft mint bloom behind it.
  const panel = { x: 616, y: 34, w: 570, h: 562 };
  const bloom = ctx.createRadialGradient(
    panel.x + panel.w / 2,
    panel.y + panel.h / 2,
    40,
    panel.x + panel.w / 2,
    panel.y + panel.h / 2,
    panel.w * 0.75,
  );
  bloom.addColorStop(0, `${theme.accent}40`);
  bloom.addColorStop(1, `${theme.accent}00`);
  ctx.fillStyle = bloom;
  ctx.fillRect(panel.x - 130, panel.y - 130, panel.w + 260, panel.h + 260);
  const hull = drawPaintedBoard(ctx, state, shape, panel, theme, art);

  // ---- Left column, centred.
  const colCX = 316;

  // Header sign: the painted "DotDuel" wordmark, verdict on its plank.
  const signW = 520;
  const signH = (signW * art.sign.height) / art.sign.width;
  const signX = colCX - signW / 2;
  const signY = 14;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 18 * SCALE;
  ctx.shadowOffsetY = 8 * SCALE;
  ctx.drawImage(art.img.sign, signX, signY, signW, signH);
  ctx.restore();

  // Verdict — Win / Loss / Draw from the sharer's side (daily: its headline).
  const verdict = share.verdict;
  const tb = art.sign.text;
  const plank = {
    x: signX + signW * tb.left,
    y: signY + signH * tb.top,
    w: signW * (1 - tb.left - tb.right),
    h: signH * (1 - tb.top - tb.bottom),
  };
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  setLetterSpacing(ctx, '2px');
  const vSize = fitFont(ctx, verdict, plank.w - 24, 58, (s) => `700 ${s}px ${FONT_DISPLAY}`);
  pearlText(
    ctx,
    verdict,
    colCX,
    plank.y + plank.h / 2 + vSize * 0.36,
    vSize,
    share.b && share.outcome === 'win' ? theme.accent : undefined,
  );
  setLetterSpacing(ctx, '0px');

  // Score in a painted card frame.
  const box = { x: colCX - 230, y: signY + signH + 14, w: 460, h: 186 };
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 16 * SCALE;
  ctx.shadowOffsetY = 6 * SCALE;
  drawNine(ctx, art.img.frame, art.frame, box.x, box.y, box.w, box.h, 0.8);
  ctx.restore();

  const scoreBase = box.y + 106;
  const nameY = box.y + 152;
  const nameDot = 22;
  const drawName = (name: string, player: Player, atCX: number): void => {
    const nw = ctx.measureText(name).width;
    const total = nameDot + 10 + nw;
    const x0 = atCX - total / 2;
    ctx.drawImage(art.img.dot[player], x0, nameY - nameDot + 3, nameDot, nameDot);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f0fbcf';
    ctx.fillText(name, x0 + nameDot + 10, nameY);
    ctx.textAlign = 'center';
  };
  const scoreFont = `700 76px ${FONT_DISPLAY}`;
  if (share.b) {
    // Each score centred over its name, the dash at the middle: symmetric for
    // any digit count (3-digit Square/Rectangle scores included).
    const aCX = colCX - box.w / 4;
    const bCX = colCX + box.w / 4;
    // "pts" beside each number so the card says the game is won on points.
    // 3-digit scores shrink the number until score + label fit their half.
    const ptsFont = `700 26px ${FONT_DISPLAY}`;
    ctx.font = ptsFont;
    const ptsW = ctx.measureText(ptsLabel).width + 8;
    const maxNum = Math.max(share.a.score, share.b.score);
    const numSize = fitFont(ctx, String(maxNum), box.w / 2 - 84 - ptsW, 76, (s) => `700 ${s}px ${FONT_DISPLAY}`);
    const drawScore = (score: number, player: Player, lit: boolean, atCX: number) => {
      ctx.save();
      ctx.font = `700 ${numSize}px ${FONT_DISPLAY}`;
      const nW = ctx.measureText(String(score)).width;
      const x0 = atCX - (nW + ptsW) / 2;
      ctx.textAlign = 'left';
      if (lit) {
        ctx.shadowColor = theme.dot[player].bright;
        ctx.shadowBlur = 22 * SCALE;
      }
      ctx.fillStyle = lit ? theme.dot[player].bright : theme.textDim;
      ctx.fillText(String(score), x0, scoreBase);
      ctx.shadowBlur = 0;
      ctx.font = ptsFont;
      ctx.fillStyle = theme.textDim;
      ctx.fillText(ptsLabel, x0 + nW + 8, scoreBase);
      ctx.restore();
    };
    drawScore(share.a.score, share.a.player, share.outcome !== 'loss', aCX);
    ctx.font = scoreFont;
    ctx.fillStyle = 'rgba(240,251,207,0.35)';
    ctx.fillText('–', colCX, scoreBase);
    drawScore(share.b.score, share.b.player, share.outcome !== 'win', bCX);

    ctx.font = `600 24px ${FONT_BODY}`;
    const maxName = box.w / 2 - 40 - nameDot;
    drawName(truncate(ctx, share.a.name, maxName), share.a.player, aCX);
    drawName(truncate(ctx, share.b.name, maxName), share.b.player, bCX);
  } else {
    ctx.font = scoreFont;
    const nW = ctx.measureText(String(share.a.score)).width;
    ctx.font = `700 34px ${FONT_DISPLAY}`;
    const ptsW = ctx.measureText(ptsLabel).width;
    const numCX = colCX - (ptsW + 16) / 2;
    ctx.save();
    ctx.font = scoreFont;
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = 24 * SCALE;
    ctx.fillStyle = theme.accent;
    ctx.fillText(String(share.a.score), numCX, scoreBase);
    ctx.restore();
    ctx.font = `700 34px ${FONT_DISPLAY}`;
    ctx.fillStyle = theme.textDim;
    ctx.textAlign = 'left';
    ctx.fillText(ptsLabel, numCX + nW / 2 + 16, scoreBase);
    ctx.textAlign = 'center';
    ctx.font = `600 24px ${FONT_BODY}`;
    drawName(truncate(ctx, share.a.name, box.w - 80), 1, colCX);
  }

  // CTA + domain under the frame.
  const ctaBase = box.y + box.h + 58;
  setLetterSpacing(ctx, '1px');
  const ctaSize = fitFont(ctx, share.cta, 500, 32, (s) => `700 ${s}px ${FONT_DISPLAY}`);
  ctx.save();
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 16 * SCALE;
  ctx.fillStyle = theme.accent;
  ctx.fillText(share.cta, colCX, ctaBase);
  ctx.restore();
  setLetterSpacing(ctx, '0px');
  const ctaW = ctx.measureText(share.cta).width;
  for (const dir of [1, -1] as const) {
    const from = colCX + dir * (ctaW / 2 + 22);
    const to = from + dir * 56;
    const g = ctx.createLinearGradient(from, 0, to, 0);
    g.addColorStop(0, `${theme.accent}cc`);
    g.addColorStop(1, `${theme.accent}00`);
    ctx.strokeStyle = g;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(from, ctaBase - ctaSize * 0.32);
    ctx.lineTo(to, ctaBase - ctaSize * 0.32);
    ctx.stroke();
  }

  setLetterSpacing(ctx, '2px');
  ctx.font = `700 32px ${FONT_BODY}`;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.75)';
  ctx.shadowBlur = 8 * SCALE;
  ctx.shadowOffsetY = 2 * SCALE;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('www.DotDuel.com', colCX, Math.min(ctaBase + 52, 606));
  ctx.restore();
  setLetterSpacing(ctx, '0px');
  ctx.textAlign = 'left';

  // ---- QR in a painted frame, inscribed inside the board silhouette.
  const qr = buildQr(share.url, 'H');
  if (qr && hull.length >= 3) {
    const xs = hull.map((p) => p.x);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const ASPECT = 1.16;
    // Capped under half the board's width so the finished board stays the
    // hero on the wide shapes (square / rectangle).
    const span = Math.max(...xs) - Math.min(...xs);
    const rect = inscribeRect(hull, cx, ASPECT, Math.min(span * 0.46, 300));
    if (rect) {
      const k = 0.55;
      const inset = art.frame.capLeft * k * 0.62;
      const outerH = rect.w * ASPECT;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 18 * SCALE;
      ctx.shadowOffsetY = 6 * SCALE;
      drawNine(ctx, art.img.frame, art.frame, rect.x, rect.y, rect.w, outerH, k);
      ctx.restore();
      const tileW = rect.w - inset * 2;
      const tileH = outerH - inset * 2;
      drawQrTile(
        ctx,
        qr,
        rect.x + inset,
        rect.y + inset,
        tileW,
        tileH - tileW,
        themedQrSkin(),
        scanCaption,
        false,
      );
    }
  }
  return true;
}
