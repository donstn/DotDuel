// Rasterises the SVG source assets in public/ into the PNG variants
// social platforms (Facebook, Twitter, Discord, iOS) require. SVG sources
// stay the source-of-truth — edit them, then re-run `node scripts/build-assets.mjs`
// and commit both the SVG and the regenerated PNGs.
//
// Sharp is MIT-licensed and ships pre-built native bindings, fits the
// zero-cost stack rule. Dev-only, never loaded at runtime.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = (p) => resolve(root, 'public', p);

async function rasterise(srcSvg, outPng, width, height) {
  const svg = readFileSync(pub(srcSvg));
  const png = await sharp(svg, { density: 384 })
    .resize(width, height, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(pub(outPng), png);
  console.log(`  ${outPng}  ${width}x${height}  (${(png.length / 1024).toFixed(1)} kB)`);
}

console.log('building public assets:');
await rasterise('og-card.svg', 'og-card.png', 1200, 630);
await rasterise('favicon.svg', 'apple-touch-icon.png', 180, 180);
await rasterise('favicon.svg', 'icon-512.png', 512, 512);
await rasterise('favicon.svg', 'favicon-32.png', 32, 32);
console.log('done.');
