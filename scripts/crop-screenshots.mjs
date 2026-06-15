// Crops raw emulator screenshots (1080x2400, 2.22:1) to Play Store spec:
// 1080x2160 = exactly 2:1 (Play's max ratio), top-anchored, which also removes
// the bottom test-ad strip + footer. Strips alpha (Play wants 24-bit PNG).
// sharp (MIT, dev-only).

import { readdirSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const inDir = resolve(root, '.android-test-shots');
const outDir = resolve(root, 'play-store', 'screenshots');
mkdirSync(outDir, { recursive: true });

// raw file -> friendly output name
const MAP = {
  'raw-midgame-tri-forest.png': '01-triangle-forest-pearl.png',
  'raw-midgame-sq-twilight.png': '02-square-twilight-cosmos.png',
  'raw-midgame-rect-sunset.png': '03-rectangle-sunset-catan.png',
  'raw-celebration-b.png': '04-win-celebration-royal-court.png',
  'raw-themepicker-vintage.png': '05-theme-picker-vintage-press.png',
  'raw-vsai-L1-coral.png': '06-vs-ai-beginner-coral-reef.png',
  'raw-vsai-L5-forest.png': '07-vs-ai-impossible-forest-pearl.png',
};

const CROP_W = 1080;
const CROP_H = 2160;

for (const [src, dst] of Object.entries(MAP)) {
  const img = sharp(resolve(inDir, src));
  const meta = await img.metadata();
  const left = Math.max(0, Math.round((meta.width - CROP_W) / 2));
  const out = await img
    .extract({ left, top: 0, width: Math.min(CROP_W, meta.width), height: Math.min(CROP_H, meta.height) })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toBuffer();
  const { writeFileSync } = await import('node:fs');
  writeFileSync(resolve(outDir, dst), out);
  console.log(`  ${dst}  (from ${meta.width}x${meta.height}) -> ${Math.min(CROP_W, meta.width)}x${Math.min(CROP_H, meta.height)}  ${(out.length / 1024).toFixed(0)} kB`);
}
console.log('done. Available raw inputs:', readdirSync(inDir).filter((f) => f.startsWith('raw-')).join(', '));
