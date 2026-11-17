// Builds every app/web icon from the two painted logo images:
//   art-src/store/icon-master.png   full logo (spheres on the dark glow), 1024²
//   art-src/store/icon-spheres.png  the same spheres on flat #FF00FF magenta
//
//   node scripts/build-icons.mjs
//
// Writes: Play 512 icon, PWA 512 (maskable-safe), apple-touch 180, favicon
// 32 + SVG, Android adaptive (background/foreground/monochrome), legacy and
// round launcher icons, splash screens. sharp (Apache-2.0) is a dev dependency — $0.

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

sharp.cache(false);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const at = (p) => resolve(root, p);
const res = (p) => at(`android/app/src/main/res/${p}`);

// Background glow sampled from icon-master.png.
const BG = (w, h) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs><radialGradient id="g" cx="50%" cy="50%" r="72%">
    <stop offset="0%" stop-color="#0a3a20"/>
    <stop offset="55%" stop-color="#05210f"/>
    <stop offset="100%" stop-color="#020b0c"/>
  </radialGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/></svg>`);

// --- spheres cut-out: key the magenta, un-mix edges, fade the line's ends ---
const { data: src, info } = await sharp(at('art-src/store/icon-spheres.png'))
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const SW = info.width;
const SH = info.height;
const rgba = Buffer.alloc(SW * SH * 4);
for (let i = 0, j = 0; i < src.length; i += 3, j += 4) {
  let r = src[i], g = src[i + 1], b = src[i + 2];
  const m = Math.min(r, b) - g;
  const a = Math.min(1, Math.max(0, (170 - m) / 130));
  if (a > 0 && a < 1) {
    r = (r - (1 - a) * 255) / a;
    b = (b - (1 - a) * 255) / a;
    g = g / a;
  }
  rgba[j] = Math.max(0, Math.min(255, Math.round(r)));
  rgba[j + 1] = Math.max(0, Math.min(255, Math.round(g)));
  rgba[j + 2] = Math.max(0, Math.min(255, Math.round(b)));
  rgba[j + 3] = Math.round(a * 255);
}
// The light line runs off both edges; fade it out so no layer ends in a cut.
const FADE = Math.round(SW * 0.1);
for (let y = 0; y < SH; y++) {
  for (let x = 0; x < FADE; x++) {
    const k = x / FADE;
    rgba[(y * SW + x) * 4 + 3] *= k;
    rgba[(y * SW + (SW - 1 - x)) * 4 + 3] *= k;
  }
}
const spheres = await sharp(rgba, { raw: { width: SW, height: SH, channels: 4 } })
  .trim({ threshold: 1 })
  .png()
  .toBuffer();
const sMeta = await sharp(spheres).metadata();

/** Background + spheres scaled to `widthFrac` of the canvas, centred. */
async function composed(w, h, widthFrac, bg = BG(w, h)) {
  const sw = Math.round(w * widthFrac);
  const layer = await sharp(spheres).resize({ width: sw }).toBuffer();
  const lm = await sharp(layer).metadata();
  return sharp(bg).composite([
    { input: layer, left: Math.round((w - lm.width) / 2), top: Math.round((h - lm.height) / 2) },
  ]);
}
const spheresOnly = async (size, widthFrac, mono = false) => {
  const sw = Math.round(size * widthFrac);
  let layer = sharp(spheres).resize({ width: sw });
  if (mono) {
    // Themed icon: one flat colour, Android tints it. Shape from the alpha.
    const { data, info: li } = await layer.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = data[i + 3] > 110 ? 255 : 0;
    }
    layer = sharp(data, { raw: { width: li.width, height: li.height, channels: 4 } });
  }
  const buf = await layer.png().toBuffer();
  const lm = await sharp(buf).metadata();
  return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: buf, left: Math.round((size - lm.width) / 2), top: Math.round((size - lm.height) / 2) }]);
};
const master = () => sharp(at('art-src/store/icon-master.png')).removeAlpha();
const png = (img, out) => img.png({ compressionLevel: 9 }).toFile(out);

console.log(`spheres cut-out ${sMeta.width}x${sMeta.height}`);

// --- store + web ------------------------------------------------------------
await png(master().resize(512, 512), at('play-store/app-icon-512.png'));
await png(master().resize(180, 180), at('public/apple-touch-icon.png'));
await png(master().resize(32, 32), at('public/favicon-32.png'));
// PWA icon is also "maskable": keep the spheres inside the 80% safe circle.
await png(await composed(512, 512, 0.7), at('public/icon-512.png'));
const fav = await master().resize(96, 96).png().toBuffer();
writeFileSync(
  at('public/favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 96 96"><image width="96" height="96" href="data:image/png;base64,${fav.toString('base64')}"/></svg>\n`,
);
console.log('  play 512, apple-touch 180, favicon 32 + svg, pwa 512');

// --- android launcher ---------------------------------------------------------
// Adaptive layers are 108dp; launchers keep only the centre 66dp circle, so the
// pair (wide and short) is 56dp wide, with a little air inside that circle.
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, k] of Object.entries(DENSITIES)) {
  const a = Math.round(108 * k);
  const l = Math.round(48 * k);
  await png(sharp(BG(a, a)), res(`mipmap-${d}/ic_launcher_background.png`));
  await png(await spheresOnly(a, 56 / 108), res(`mipmap-${d}/ic_launcher_foreground.png`));
  await png(await spheresOnly(a, 56 / 108, true), res(`mipmap-${d}/ic_launcher_monochrome.png`));
  const rounded = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${l}" height="${l}"><rect width="${l}" height="${l}" rx="${l * 0.18}"/></svg>`);
  await png(master().resize(l, l).ensureAlpha().composite([{ input: rounded, blend: 'dest-in' }]), res(`mipmap-${d}/ic_launcher.png`));
  const circle = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${l}" height="${l}"><circle cx="${l / 2}" cy="${l / 2}" r="${l / 2}"/></svg>`);
  // A second composite() would replace the first, so bake the spheres in first.
  const roundBase = await (await composed(l, l, 0.82)).png().toBuffer();
  await png(
    sharp(roundBase).ensureAlpha().composite([{ input: circle, blend: 'dest-in' }]),
    res(`mipmap-${d}/ic_launcher_round.png`),
  );
  console.log(`  mipmap-${d}  ${a}px layers, ${l}px legacy`);
}

const SPLASH = {
  'drawable': [480, 320],
  'drawable-land-mdpi': [480, 320],
  'drawable-land-hdpi': [800, 480],
  'drawable-land-xhdpi': [1280, 720],
  'drawable-land-xxhdpi': [1600, 960],
  'drawable-land-xxxhdpi': [1920, 1280],
  'drawable-port-mdpi': [320, 480],
  'drawable-port-hdpi': [480, 800],
  'drawable-port-xhdpi': [720, 1280],
  'drawable-port-xxhdpi': [960, 1600],
  'drawable-port-xxxhdpi': [1280, 1920],
};
for (const [dir, [w, h]] of Object.entries(SPLASH)) {
  const frac = (Math.min(w, h) * 0.55) / w;
  await png((await composed(w, h, frac)).flatten(), res(`${dir}/splash.png`));
}
console.log(`  ${Object.keys(SPLASH).length} splash screens`);
console.log('done.');
