// Turns a Gemini art sheet (objects on flat #FF00FF magenta) into shipped
// theme assets: keys out the magenta (with edge decontamination), splits the
// sheet into its objects, trims each, writes WebP, and for stretchable slots
// measures the decorated end caps and checks the middle really is plain.
//
//   node scripts/process-art.mjs <sheet> <theme> <slot>[:stretch] [<slot>...]
//
// Objects are matched to slot names top-to-bottom, then left-to-right.
// Prints the metrics to paste into src/themeArt.ts. Raw sheets live in
// art-src/<theme>/ (outside public/, never shipped); output goes to
// public/art/<theme>/<slot>.webp. See docs/art/README.md.
//
// sharp (Apache-2.0) is already a dev dependency — zero-cost stack.

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [sheetPath, theme, ...slotArgs] = process.argv.slice(2);
if (!sheetPath || !theme || slotArgs.length === 0) {
  console.error('usage: node scripts/process-art.mjs <sheet> <theme> <slot>[:stretch] ...');
  process.exit(1);
}
const slots = slotArgs.map((s) => {
  const [name, kind] = s.split(':');
  return { name, stretch: kind === 'stretch' };
});

const { data: src, info } = await sharp(resolve(root, sheetPath))
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;

// --- 1. key out magenta -------------------------------------------------
// "Magenta-ness" = min(R,B) − G: ~255 on the backdrop, ≤0 on greens/pearls.
const LO = 40;
const HI = 170;
const rgba = Buffer.alloc(W * H * 4);
for (let i = 0, j = 0; i < src.length; i += 3, j += 4) {
  let r = src[i], g = src[i + 1], b = src[i + 2];
  const m = Math.min(r, b) - g;
  const a = Math.min(1, Math.max(0, (HI - m) / (HI - LO)));
  if (a > 0 && a < 1) {
    // Un-mix the magenta that bled into anti-aliased edge pixels.
    r = (r - (1 - a) * 255) / a;
    b = (b - (1 - a) * 255) / a;
    g = g / a;
  }
  // Any pink/purple cast left on opaque pixels (backdrop reflections) → neutral.
  const cap = g;
  if (Math.min(r, b) > cap) {
    r = Math.min(r, cap);
    b = Math.min(b, cap);
  }
  rgba[j] = clamp(r);
  rgba[j + 1] = clamp(g);
  rgba[j + 2] = clamp(b);
  rgba[j + 3] = Math.round(a * 255);
}

// --- 2. split into objects ----------------------------------------------
const A_MIN = 24;
const alphaAt = (x, y) => rgba[(y * W + x) * 4 + 3];
const rowHas = (y, x0 = 0, x1 = W) => {
  for (let x = x0; x < x1; x++) if (alphaAt(x, y) > A_MIN) return true;
  return false;
};
const colHas = (x, y0, y1) => {
  for (let y = y0; y < y1; y++) if (alphaAt(x, y) > A_MIN) return true;
  return false;
};
const runs = (n, has) => {
  const out = [];
  let start = -1;
  for (let i = 0; i < n; i++) {
    const h = has(i);
    if (h && start < 0) start = i;
    if (!h && start >= 0) { out.push([start, i]); start = -1; }
  }
  if (start >= 0) out.push([start, n]);
  return out.filter(([a, b]) => b - a > 12); // drop specks
};
const boxes = [];
for (const [y0, y1] of runs(H, (y) => rowHas(y))) {
  for (const [x0, x1] of runs(W, (x) => colHas(x, y0, y1))) {
    let t = y0, btm = y1;
    while (t < btm && !rowHas(t, x0, x1)) t++;
    while (btm > t && !rowHas(btm - 1, x0, x1)) btm--;
    boxes.push({ x: x0, y: t, w: x1 - x0, h: btm - t });
  }
}
if (boxes.length !== slots.length) {
  console.error(`found ${boxes.length} objects, expected ${slots.length} — check the sheet`);
  process.exit(1);
}

// --- 3. write + measure ---------------------------------------------------
const report = {};
let failed = false;
for (let k = 0; k < slots.length; k++) {
  const { name, stretch } = slots[k];
  const bx = boxes[k];
  const crop = Buffer.alloc(bx.w * bx.h * 4);
  for (let y = 0; y < bx.h; y++) {
    rgba.copy(crop, y * bx.w * 4, ((bx.y + y) * W + bx.x) * 4, ((bx.y + y) * W + bx.x + bx.w) * 4);
  }
  const out = resolve(root, 'public/art', theme, `${name}.webp`);
  await sharp(crop, { raw: { width: bx.w, height: bx.h, channels: 4 } })
    .webp({ quality: 88, effort: 6 })
    .toFile(out);
  const entry = { width: bx.w, height: bx.h };
  if (stretch) Object.assign(entry, measureCaps(crop, bx.w, bx.h));
  report[name] = entry;
  if (entry.plainMiddle === false) failed = true;
  console.log(`  ${name}.webp  ${bx.w}x${bx.h}`);
}
console.log(JSON.stringify(report, null, 2));
if (failed) {
  console.error('middle is NOT plain on at least one stretch slot — regenerate in Gemini');
  process.exit(2);
}

// Caps = outermost columns that differ from the plain middle. Each column is
// compared with the median of the central 20% (rows within the inner 70% of
// height, so the rim's rounded corners don't count). A small safety margin is
// added so the stretched region never includes ornament.
function measureCaps(px, w, h) {
  const y0 = Math.round(h * 0.15);
  const y1 = Math.round(h * 0.85);
  const col = (x) => {
    const v = [];
    for (let y = y0; y < y1; y++) {
      const i = (y * w + x) * 4;
      v.push(px[i], px[i + 1], px[i + 2], px[i + 3]);
    }
    return v;
  };
  const mid0 = Math.round(w * 0.4);
  const mid1 = Math.round(w * 0.6);
  const midCols = [];
  for (let x = mid0; x < mid1; x++) midCols.push(col(x));
  const ref = midCols[0].map((_, i) => median(midCols.map((c) => c[i])));
  const diff = (c) => c.reduce((s, v, i) => s + Math.abs(v - ref[i]), 0) / c.length;
  const d = [];
  for (let x = 0; x < w; x++) d.push(diff(col(x)));
  const smooth = d.map((_, x) => {
    let s = 0, n = 0;
    for (let k = -3; k <= 3; k++) if (d[x + k] !== undefined) { s += d[x + k]; n++; }
    return s / n;
  });
  const noise = median(smooth.slice(mid0, mid1));
  const thr = noise * 2.5 + 4;
  let capL = 0;
  for (let x = 0; x < w / 2; x++) if (smooth[x] > thr) capL = x + 1;
  let capR = 0;
  for (let x = w - 1; x >= w / 2; x--) if (smooth[x] > thr) capR = w - x;
  const margin = Math.round(w * 0.01);
  capL = Math.min(Math.round(w / 2) - 1, capL + margin);
  capR = Math.min(Math.round(w / 2) - 1, capR + margin);
  const plainMiddle = capL + capR < w * 0.7;
  return { capLeft: capL, capRight: capR, plainMiddle };
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}
function clamp(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}
