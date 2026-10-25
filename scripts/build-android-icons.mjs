// Rasterises the Android launcher icon (adaptive + legacy + round + themed
// monochrome) and the splash screens from the same two-sphere artwork as
// play-store/sources/play-icon.svg. Re-run after changing the artwork:
//   node scripts/build-android-icons.mjs
// Sharp is MIT-licensed and dev-only.

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const res = (p) => resolve(root, 'android/app/src/main/res', p);

const DEFS = `
  <radialGradient id="bg" cx="50%" cy="42%" r="75%">
    <stop offset="0%" stop-color="#1a3326"/>
    <stop offset="60%" stop-color="#0c1d14"/>
    <stop offset="100%" stop-color="#02090b"/>
  </radialGradient>
  <radialGradient id="p1" cx="35%" cy="28%" r="68%">
    <stop offset="0%" stop-color="#9af0b8"/>
    <stop offset="55%" stop-color="#62cf90"/>
    <stop offset="100%" stop-color="#0d4a23"/>
  </radialGradient>
  <radialGradient id="p2" cx="35%" cy="28%" r="68%">
    <stop offset="0%" stop-color="#ffffff"/>
    <stop offset="55%" stop-color="#f0fbcf"/>
    <stop offset="100%" stop-color="#92a872"/>
  </radialGradient>
  <filter id="ds" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="10"/>
    <feOffset dx="0" dy="10"/>
    <feComponentTransfer><feFuncA type="linear" slope="0.45"/></feComponentTransfer>
    <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`;

// Sphere pair in play-icon.svg's 512 space, centred on (256, 256).
const SPHERES = `
  <g filter="url(#ds)">
    <circle cx="156" cy="256" r="92" fill="url(#p1)"/>
    <ellipse cx="128" cy="222" rx="26" ry="17" fill="#ffffff" opacity="0.55"/>
    <circle cx="356" cy="256" r="92" fill="url(#p2)"/>
    <ellipse cx="328" cy="222" rx="26" ry="17" fill="#ffffff" opacity="0.85"/>
  </g>`;
const SPHERES_MONO = `
  <circle cx="156" cy="256" r="92" fill="#ffffff"/>
  <circle cx="356" cy="256" r="92" fill="#ffffff"/>`;

// Returns a renderer: the viewBox stays fixed, the pixel size is set per output.
const svg = (vw, vh, body) => (w, h) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${vw} ${vh}"><defs>${DEFS}</defs>${body}</svg>`;

// Spheres span 384 units; place them centred at (cx, cy) with the given width.
const spheresAt = (cx, cy, width, body = SPHERES) =>
  `<g transform="translate(${cx} ${cy}) scale(${width / 384}) translate(-256 -256)">${body}</g>`;

// Adaptive layers are 108dp; the 66dp centre circle is the only area every
// launcher mask keeps, so the pair is 52dp wide with breathing room.
const ADAPTIVE = {
  background: svg(108, 108, `<rect width="108" height="108" fill="url(#bg)"/>`),
  foreground: svg(108, 108, spheresAt(54, 54, 52)),
  monochrome: svg(108, 108, spheresAt(54, 54, 52, SPHERES_MONO)),
};
const LEGACY = svg(512, 512, `<rect width="512" height="512" rx="92" fill="url(#bg)"/>${spheresAt(256, 256, 384)}`);
const ROUND = svg(512, 512, `<circle cx="256" cy="256" r="256" fill="url(#bg)"/>${spheresAt(256, 256, 360)}`);

const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

async function render(src, out, w, h) {
  const png = await sharp(Buffer.from(src(w, h)))
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(res(out), png);
}

console.log('building android icons + splash:');
for (const [d, k] of Object.entries(DENSITIES)) {
  const adaptive = Math.round(108 * k);
  const legacy = Math.round(48 * k);
  for (const [layer, src] of Object.entries(ADAPTIVE)) {
    await render(src, `mipmap-${d}/ic_launcher_${layer}.png`, adaptive, adaptive);
  }
  await render(LEGACY, `mipmap-${d}/ic_launcher.png`, legacy, legacy);
  await render(ROUND, `mipmap-${d}/ic_launcher_round.png`, legacy, legacy);
  console.log(`  mipmap-${d}  ${adaptive}px layers, ${legacy}px legacy`);
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
  const body = `<rect width="${w}" height="${h}" fill="url(#bg)"/>${spheresAt(w / 2, h / 2, Math.min(w, h) * 0.42)}`;
  await render(svg(w, h, body), `${dir}/splash.png`, w, h);
}
console.log(`  ${Object.keys(SPLASH).length} splash screens`);
console.log('done.');
