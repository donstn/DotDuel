// Christmas board tree: dims the snow at the tree's foot toward the
// background's snow and feathers it out, so the tree stands IN the scene
// instead of on a white island. Run after process-art.mjs wrote
// public/art/christmas/tree-board.webp:
//
//   node scripts/process-art.mjs art-src/christmas/tree-board.png christmas tree-board
//   node scripts/blend-tree-snow.mjs
//
// DIM: how far snow goes toward the background snow colour (0 = untouched,
// 1 = exactly SNOW). FADE: width of the soft edge (bigger = softer).
// sharp (Apache-2.0) is a dev dependency — $0.

import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const FILE = 'public/art/christmas/tree-board.webp';
const SNOW = [128, 150, 160]; // background-portrait/landscape snow, a shade darker
const DIM = 0.85;
const FADE = 0.85;
const TOP = 770; // sprite row where the snow starts (below the lowest branches)
const ELLIPSE = { cx: 403, cy: 880, rx: 400, ry: 110 };

sharp.cache(false);
const { data, info } = await sharp(readFileSync(FILE))
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
for (let y = TOP; y < H; y++) {
  const ramp = Math.min(1, (y - TOP) / 40);
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    if (!data[i + 3]) continue;
    const bright = (data[i] + data[i + 1] + data[i + 2]) / 3;
    // Snow is bright; the trunk and branch tips are dark and stay as they are.
    const snow = Math.max(0, Math.min(1, (bright - 100) / 60)) * ramp * DIM;
    if (snow > 0) {
      // Keep the snow's own shading: scale it toward SNOW, not flatten it.
      const shade = bright / 215;
      for (let c = 0; c < 3; c++) {
        data[i + c] = Math.round(data[i + c] + (SNOW[c] * shade - data[i + c]) * snow);
      }
    }
    const d = Math.hypot((x - ELLIPSE.cx) / ELLIPSE.rx, (y - ELLIPSE.cy) / ELLIPSE.ry);
    const keep = Math.max(0, Math.min(1, (1 - d) / FADE));
    data[i + 3] = Math.round(data[i + 3] * (1 - (1 - keep) * ramp));
  }
}
await sharp(data, { raw: { width: W, height: H, channels: 4 } })
  .webp({ quality: 85, alphaQuality: 100 })
  .toFile(FILE);
console.log(`blended snow in ${FILE}`);
