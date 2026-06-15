// Rasterises the Play Store SVG sources (play-store/sources/) into the exact
// PNG sizes the Play Console listing requires. Same approach as
// scripts/build-assets.mjs — sharp (MIT, dev-only). Edit the SVGs, then re-run
// `node scripts/build-play-assets.mjs`.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = (p) => resolve(root, 'play-store', 'sources', p);
const out = (p) => resolve(root, 'play-store', p);

async function raster(srcSvg, outPng, w, h) {
  const svg = readFileSync(src(srcSvg));
  const png = await sharp(svg, { density: 384 })
    .resize(w, h, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(out(outPng), png);
  console.log(`  ${outPng}  ${w}x${h}  (${(png.length / 1024).toFixed(1)} kB)`);
}

mkdirSync(out('.'), { recursive: true });
console.log('building Play Store assets:');
await raster('feature-graphic.svg', 'feature-graphic-1024x500.png', 1024, 500);
await raster('play-icon.svg', 'app-icon-512.png', 512, 512);
console.log('done.');
