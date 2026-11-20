"""Rebuild the fallback fonts in assets/fonts/ (noto-*-subset.ttf, catch-all.ttf).

The web export can't use system fonts, so a character missing from Outfit /
Chakra Petch would draw as Godot's hex box. Fallback chain (scripts/ui.gd):
  noto-sans-subset     letters in player names: Latin Ext A/B, Greek, Cyrillic
  noto-math-subset     arrows/shapes the UI uses (text style, not emoji)
  noto-symbols-subset  circled digits
  noto-emoji-subset    colour emoji the UI uses
  catch-all            every other code point -> blank glyph (never a hex box)

Run after adding a new emoji/symbol to scripts or i18n:

    python tools/subset-symbol-fonts.py <dir with the source fonts>

Source fonts (all SIL OFL 1.1, $0):
  NotoColorEmoji.ttf   github.com/googlefonts/noto-emoji  2D/fonts/NotoColorEmoji.ttf
  NotoSans.ttf, NotoSansMath.ttf, NotoSansSymbols.ttf
                       github.com/notofonts/notofonts.github.io  fonts/<Family>/hinted/ttf/<Family>-Regular.ttf
"""
import glob
import os
import struct
import sys

from fontTools import subset
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables.DefaultTable import DefaultTable

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1]
OUT = os.path.join(ROOT, "assets", "fonts")


def cmap(path):
    return set(TTFont(path).getBestCmap())


def write_subset(src, out, cps):
    opts = subset.Options()
    opts.layout_features = ["*"]
    opts.hinting = False
    font = subset.load_font(os.path.join(SRC, src), opts)
    s = subset.Subsetter(opts)
    s.populate(unicodes=sorted(cps))
    s.subset(font)
    subset.save_font(font, os.path.join(OUT, out), opts)
    print(out, len(cps), "code points")


# Every character either game font can't draw, per font (text can use either).
used = set()
for pattern in ("scripts/**/*.gd", "scenes/**/*.tscn", "i18n/**/*.json"):
    for p in glob.glob(os.path.join(ROOT, pattern), recursive=True):
        with open(p, encoding="utf-8") as fh:
            used |= {ord(c) for c in fh.read() if ord(c) > 127}
outfit = cmap(os.path.join(OUT, "outfit-var.ttf"))
chakra = cmap(os.path.join(OUT, "chakra-petch-700.ttf"))
need = {c for c in used if c not in outfit or c not in chakra}

letters = set(range(0x00A0, 0x0250)) | set(range(0x0370, 0x0400)) | set(range(0x0400, 0x0530)) \
    | set(range(0x1E00, 0x1F00)) | set(range(0x2010, 0x2050)) | set(range(0x20A0, 0x20C1))
write_subset("NotoSans.ttf", "noto-sans-subset.ttf", letters & cmap(os.path.join(SRC, "NotoSans.ttf")))
need -= letters

def text_style(c):
    return c < 0x2300 or 0x2460 <= c <= 0x25FF or c in (0x2605, 0x2713)

for src, out in (("NotoSansMath.ttf", "noto-math-subset.ttf"), ("NotoSansSymbols.ttf", "noto-symbols-subset.ttf")):
    have = cmap(os.path.join(SRC, src))
    take = {c for c in need if c in have and text_style(c)}
    write_subset(src, out, take)
    need -= take

emoji = cmap(os.path.join(SRC, "NotoColorEmoji.ttf"))
write_subset("NotoColorEmoji.ttf", "noto-emoji-subset.ttf", {c for c in need if c in emoji} | {0xFE0F, 0x200D})
missing = need - emoji
if missing:
    print("NOT COVERED:", " ".join(chr(c) for c in sorted(missing)))

# catch-all: one cmap format-13 group maps U+00A0..U+10FFFF to a single blank
# glyph, so whatever the chain above lacks renders as a thin space.
fb = FontBuilder(1000, isTTF=True)
fb.setupGlyphOrder([".notdef", "blank"])
fb.setupCharacterMap({0x20: "blank"})
empty = TTGlyphPen(None).glyph()
fb.setupGlyf({".notdef": empty, "blank": empty})
fb.setupHorizontalMetrics({".notdef": (0, 0), "blank": (250, 0)})
fb.setupHorizontalHeader(ascent=800, descent=-200)
fb.setupNameTable({"familyName": "DotDuel CatchAll", "styleName": "Regular"})
fb.setupOS2()
fb.setupPost()
# cmap written by hand: (3,10) format 13, two groups around the surrogates.
groups = [(0x00A0, 0xD7FF, 1), (0xE000, 0x10FFFF, 1)]
sub13 = struct.pack(">HHIII", 13, 0, 16 + 12 * len(groups), 0, len(groups))
sub13 += b"".join(struct.pack(">III", *g) for g in groups)
raw = DefaultTable("cmap")
raw.data = struct.pack(">HH", 0, 1) + struct.pack(">HHI", 3, 10, 12) + sub13
fb.font["cmap"] = raw
fb.save(os.path.join(OUT, "catch-all.ttf"))
print("catch-all.ttf", os.path.getsize(os.path.join(OUT, "catch-all.ttf")), "bytes")
