// Turns a Gemini art sheet (objects on flat #FF00FF magenta) into shipped
// theme assets: keys out the magenta (with edge decontamination), splits the
// sheet into its objects, trims, measures stretch caps, validates, and only
// then writes WebP.
//
//   node scripts/process-art.mjs <sheet> <theme> <slot>[:stretch|:nine] [...] [--keep-pink]
//
// Objects are matched to slot names top-to-bottom, then left-to-right.
//   :stretch  horizontal three-slice → measures capLeft / capRight
//   :nine     nine-slice frame       → also measures capTop / capBottom
// Nothing is written unless every stretch/nine slot has a plain middle.
// --keep-pink skips the "pink/purple cast → neutral" pass (use it for themes
// whose art really contains pinks or purples).
// Prints the metrics to paste into src/themeArt.ts. Raw sheets live in
// art-src/<theme>/ (never shipped); output goes to public/art/<theme>/<slot>.webp.
// See docs/art/README.md. sharp (Apache-2.0) is a dev dependency — $0.

import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const keepPink = args.includes('--keep-pink');
const [sheetPath, theme, ...slotArgs] = args.filter((a) => !a.startsWith('--'));
if (!sheetPath || !theme || slotArgs.length === 0) {
  console.error('usage: node scripts/process-art.mjs <sheet> <theme> <slot>[:stretch|:nine] ... [--keep-pink]');
  process.exit(1);
}
const slots = slotArgs.map((s) => {
  const [name, kind = 'plain'] = s.split(':');
  return { name, kind };
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
  // Light magenta haze (Gemini sometimes glows the backdrop) is background
  // too — un-mixing it against pure magenta would leave a white halo.
  const haze = r >= 200 && b >= 200 && Math.abs(r - b) < 40 && g < Math.min(r, b) - 50;
  const m = Math.min(r, b) - g;
  const a = haze ? 0 : Math.min(1, Math.max(0, (HI - m) / (HI - LO)));
  if (a > 0 && a < 1) {
    // Un-mix the magenta that bled into anti-aliased edge pixels.
    r = (r - (1 - a) * 255) / a;
    b = (b - (1 - a) * 255) / a;
    g = g / a;
  }
  if (!keepPink && Math.min(r, b) > g) {
    // Magenta reflections on opaque pixels → neutral.
    r = Math.min(r, g);
    b = Math.min(b, g);
  }
  rgba[j] = clamp(r);
  rgba[j + 1] = clamp(g);
  rgba[j + 2] = clamp(b);
  rgba[j + 3] = Math.round(a * 255);
}

// --- 2. split into objects ----------------------------------------------
const A_SPLIT = 24; // finding objects / gaps between them
const A_TRIM = 6; //   final trim — keeps soft glows and shadows
const alphaAt = (x, y) => rgba[(y * W + x) * 4 + 3];
const rowHas = (y, x0, x1, t) => {
  for (let x = x0; x < x1; x++) if (alphaAt(x, y) > t) return true;
  return false;
};
const colHas = (x, y0, y1, t) => {
  for (let y = y0; y < y1; y++) if (alphaAt(x, y) > t) return true;
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
for (const [y0, y1] of runs(H, (y) => rowHas(y, 0, W, A_SPLIT))) {
  for (const [x0, x1] of runs(W, (x) => colHas(x, y0, y1, A_SPLIT))) {
    // Grow back out to soft edges, then trim at the low threshold.
    let l = Math.max(0, x0 - 8), r = Math.min(W, x1 + 8);
    let t = Math.max(0, y0 - 8), btm = Math.min(H, y1 + 8);
    while (l < r && !colHas(l, t, btm, A_TRIM)) l++;
    while (r > l && !colHas(r - 1, t, btm, A_TRIM)) r--;
    while (t < btm && !rowHas(t, l, r, A_TRIM)) t++;
    while (btm > t && !rowHas(btm - 1, l, r, A_TRIM)) btm--;
    boxes.push({ x: l, y: t, w: r - l, h: btm - t });
  }
}
if (boxes.length !== slots.length) {
  console.error(`found ${boxes.length} objects, expected ${slots.length} — check the sheet`);
  process.exit(1);
}

// --- 3. measure + validate (nothing written yet) -------------------------
const outputs = [];
const report = {};
let failed = false;
for (let k = 0; k < slots.length; k++) {
  const { name, kind } = slots[k];
  const bx = boxes[k];
  const crop = Buffer.alloc(bx.w * bx.h * 4);
  for (let y = 0; y < bx.h; y++) {
    rgba.copy(crop, y * bx.w * 4, ((bx.y + y) * W + bx.x) * 4, ((bx.y + y) * W + bx.x + bx.w) * 4);
  }
  const entry = { width: bx.w, height: bx.h };
  if (kind === 'stretch' || kind === 'nine') {
    const h = measureCaps(crop, bx.w, bx.h, false);
    Object.assign(entry, { capLeft: h.capA, capRight: h.capB });
    let plain = h.plain;
    if (kind === 'nine') {
      const v = measureCaps(crop, bx.w, bx.h, true);
      Object.assign(entry, { capTop: v.capA, capBottom: v.capB });
      plain = plain && v.plain;
    }
    entry.plainMiddle = plain;
    if (!plain) failed = true;
  }
  report[name] = entry;
  outputs.push({ name, crop, w: bx.w, h: bx.h });
}
console.log(JSON.stringify(report, null, 2));
if (failed) {
  console.error('a middle is NOT plain — nothing written. Regenerate in Gemini.');
  process.exit(2);
}

// --- 4. write -------------------------------------------------------------
const outDir = resolve(root, 'public/art', theme);
mkdirSync(outDir, { recursive: true });
for (const o of outputs) {
  await sharp(o.crop, { raw: { width: o.w, height: o.h, channels: 4 } })
    .webp({ quality: 88, effort: 6 })
    .toFile(resolve(outDir, `${o.name}.webp`));
  console.log(`  wrote ${theme}/${o.name}.webp  ${o.w}x${o.h}`);
}

// Caps along one axis (vertical=false → columns / left+right; true → rows /
// top+bottom). Each line is compared with the median of the central 20%. The
// cap ends where, scanning inward from the edge, a run of plain lines starts —
// so a stray knot near the centre can't drag the cap inward. The middle must
// be (almost) entirely plain.
function measureCaps(px, w, h, vertical) {
  const len = vertical ? h : w; // lines along the measured axis
  const span = vertical ? w : h; // samples per line
  const s0 = Math.round(span * 0.05);
  const s1 = Math.round(span * 0.95);
  const at = (line, k) => (vertical ? (line * w + k) * 4 : (k * w + line) * 4);
  const vec = (line) => {
    const v = [];
    for (let k = s0; k < s1; k++) {
      const i = at(line, k);
      v.push(px[i], px[i + 1], px[i + 2], px[i + 3]);
    }
    return v;
  };
  const m0 = Math.round(len * 0.4);
  const m1 = Math.round(len * 0.6);
  const mids = [];
  for (let x = m0; x < m1; x++) mids.push(vec(x));
  const ref = mids[0].map((_, i) => median(mids.map((c) => c[i])));
  const d = [];
  for (let x = 0; x < len; x++) {
    const c = vec(x);
    d.push(c.reduce((sum, v, i) => sum + Math.abs(v - ref[i]), 0) / c.length);
  }
  const smooth = d.map((_, x) => {
    let sum = 0, n = 0;
    for (let k = -3; k <= 3; k++) if (d[x + k] !== undefined) { sum += d[x + k]; n++; }
    return sum / n;
  });
  const thr = median(smooth.slice(m0, m1)) * 2.5 + 4;
  const RUN = Math.max(6, Math.round(len * 0.02));
  const scan = (from, step) => {
    let plainRun = 0;
    for (let x = from, i = 0; i < len / 2; x += step, i++) {
      plainRun = smooth[x] > thr ? 0 : plainRun + 1;
      if (plainRun >= RUN) return i - RUN + 1;
    }
    return Math.floor(len / 2);
  };
  const margin = Math.round(len * 0.01);
  const capA = Math.min(Math.floor(len / 2) - 1, scan(0, 1) + margin);
  const capB = Math.min(Math.floor(len / 2) - 1, scan(len - 1, -1) + margin);
  let busy = 0;
  for (let x = capA; x < len - capB; x++) if (smooth[x] > thr) busy++;
  const plain = capA + capB < len * 0.8 && busy <= len * 0.02;
  return { capA, capB, plain };
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}
function clamp(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}
