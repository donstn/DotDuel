"""Rebuild the emoji/symbol fallback fonts (assets/fonts/noto-*-subset.ttf).

The web export can't use system fonts, so every emoji or symbol the UI shows must
be in a bundled font. Run this after adding a new emoji/symbol to scripts or i18n:

    python tools/subset-symbol-fonts.py <dir with the source fonts>

Source fonts (all SIL OFL 1.1, $0):
  NotoColorEmoji.ttf    github.com/googlefonts/noto-emoji  2D/fonts/NotoColorEmoji.ttf
  NotoSansMath.ttf      github.com/notofonts/notofonts.github.io  fonts/NotoSansMath/hinted/ttf/NotoSansMath-Regular.ttf
  NotoSansSymbols.ttf   github.com/notofonts/notofonts.github.io  fonts/NotoSansSymbols/hinted/ttf/NotoSansSymbols-Regular.ttf
"""
import glob
import os
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1]
OUT = os.path.join(ROOT, "assets", "fonts")

covered = set()
for f in ("outfit-var.ttf", "chakra-petch-700.ttf"):
    covered |= set(TTFont(os.path.join(OUT, f)).getBestCmap())

need = set()
for pattern in ("scripts/**/*.gd", "scenes/**/*.tscn", "i18n/**/*.json"):
    for p in glob.glob(os.path.join(ROOT, pattern), recursive=True):
        with open(p, encoding="utf-8") as fh:
            need |= {ord(c) for c in fh.read() if ord(c) > 127}
need -= covered

# Arrows/shapes look better as plain text glyphs than as colour emoji.
text_first = [("NotoSansMath.ttf", "noto-math-subset.ttf"), ("NotoSansSymbols.ttf", "noto-symbols-subset.ttf")]
emoji_cmap = set(TTFont(os.path.join(SRC, "NotoColorEmoji.ttf")).getBestCmap())
plan = {}
for src, out in text_first:
    cmap = set(TTFont(os.path.join(SRC, src)).getBestCmap())
    taken = {c for c in need if c in cmap and (c < 0x2300 or 0x2460 <= c <= 0x25FF or c == 0x2605)}
    plan[(src, out)] = taken
    need -= taken
plan[("NotoColorEmoji.ttf", "noto-emoji-subset.ttf")] = {c for c in need if c in emoji_cmap} | {0xFE0F, 0x200D}
missing = need - emoji_cmap
if missing:
    print("NOT COVERED:", " ".join(chr(c) for c in sorted(missing)))

for (src, out), cps in plan.items():
    opts = subset.Options()
    opts.layout_features = ["*"]
    opts.hinting = False
    font = subset.load_font(os.path.join(SRC, src), opts)
    s = subset.Subsetter(opts)
    s.populate(unicodes=sorted(cps))
    s.subset(font)
    subset.save_font(font, os.path.join(OUT, out), opts)
    print(out, len(cps), "glyphs")
