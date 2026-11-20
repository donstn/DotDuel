# Paints the flame out of the Christmas campfire backgrounds (diffusion fill),
# so the Godot build can draw its own animated fire there (scripts/campfire.gd).
# Run from the repo root: python godot/tools/remove_painted_fire.py [preview_dir]
import os
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd


def clean(src, dst, box, cut, dil, preview):
    img = np.asarray(Image.open(src).convert('RGB')).astype(float)
    x0, y0, x1, y1 = box
    c = img[y0:y1, x0:x1].copy()
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    sat = (c.max(-1) - c.min(-1)) / (c.max(-1) + 1)
    m = ((r > 150) & (r - b > 60) & (sat > 0.3)) | ((r > 230) & (g > 200))
    m[cut:] = False  # keep the front stones
    lab, n = nd.label(m)
    m = lab == (1 + int(np.argmax(nd.sum(m, lab, range(1, n + 1)))))
    m = nd.binary_dilation(nd.binary_fill_holes(m), iterations=dil)
    m[cut:] = False
    f = c.copy()
    f[m] = c[~m].mean(0)
    for _ in range(2500):
        avg = (np.roll(f, 1, 0) + np.roll(f, -1, 0) + np.roll(f, 1, 1) + np.roll(f, -1, 1)) / 4
        f[m] = avg[m]
    rng = np.random.default_rng(7)
    f[m] += rng.normal(0, 1.8, f[m].shape)
    w = nd.gaussian_filter(m.astype(float), 2)[..., None]
    c2 = c * (1 - w) + f * w
    img[y0:y1, x0:x1] = c2
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(dst, quality=92)
    if preview:
        crop = Image.fromarray(np.clip(c2, 0, 255).astype(np.uint8))
        crop.resize(((x1 - x0) * 3, (y1 - y0) * 3)).save(os.path.join(preview, os.path.basename(dst) + '.png'))


preview = sys.argv[1] if len(sys.argv) > 1 else ''
clean('public/art/christmas/background-portrait.webp', 'godot/assets/art/christmas/background-portrait.webp', (80, 690, 270, 900), 150, 10, preview)
clean('public/art/christmas/background-landscape.webp', 'godot/assets/art/christmas/background-landscape.webp', (190, 380, 330, 530), 95, 5, preview)
