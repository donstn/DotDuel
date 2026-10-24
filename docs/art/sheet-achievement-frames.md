# Sheet — achievement medal frames (Forest & Pearl)

Five painted medal frames, one per achievement tier (1–5). The badge's glyph
(`src/achievements/AchievementBadge.tsx`, drawn in code in the theme's dot
colours) sits in the empty centre, so one sheet re-skins all 97 badges. Locked
badges keep working: CSS greys out the same art.

Attach as references: `public/art/forest-pearl/card-frame.webp`,
`menu-button.webp`, `icon-button.webp` (the round plate is the closest
existing piece).

Where it shows and how big: achievements popover (50–52 px), achievement
pop-up (56 px), the featured badge next to a player name (small, ~24 px). The
frames must still read at 24 px, so they need bold silhouettes and few, chunky
details.

Fit: the code draws the glyph in the middle 48 % of the badge. The centre disc
is therefore ~55 % of the frame's width, perfectly plain.

Tier is carried by the material, so the five frames rise visibly from humble
to grand while keeping the same octagon silhouette. With painted frames the
code drops the small tier pips under the glyph.

Process (left → right = tier 1 → 5):

```
node scripts/process-art.mjs art-src/forest-pearl/achievement-frames-sheet.png forest-pearl ach-frame-1 ach-frame-2 ach-frame-3 ach-frame-4 ach-frame-5
```

## Prompt

```
Premium glossy 3D mobile-game asset render, in the visual register of high-end mobile puzzle games (Board Kings, Clash Royale, Candy Crush pieces). Match the attached reference images exactly in style, materials and colour. Materials: rich dark emerald-stained carved wood, twisting vine and leaf relief, polished round cabochons in deep emerald and lustrous pearl. Colour palette: deep emerald #0d4a23 and sage #1c7a3d brightening to mint #62cf90; pale cream-pearl #d3ecaa, ivory #f0fbcf and white #ffffff; mint-green #7bdb95 for magical light; deep jade-black #15291e to near-black #02090b for shadow. Mood: an enchanted, glowing forest clearing at dusk, with moss, pearls, fireflies and soft magical luminescence. Light falls from the top.

SHEET LAYOUT: one image, aspect ratio 3:1 (for example 3000 × 1000 pixels), showing exactly FIVE separate achievement medal frames in ONE row, left to right, numbered 1 to 5 below. All five are seen straight on with no perspective or tilt, all exactly the SAME size and the SAME shape, all made of the same family of materials under the same lighting, clearly from ONE matching set. No object touches or overlaps another. Leave a wide band of empty background between them and at least 60 pixels of empty background around each one.

SHAPE (identical for all five): a regular OCTAGON medal with softly rounded corners, 1:1, flat sides at top, bottom, left and right. A thick carved outer rim, then a slightly recessed inner ring, then a perfectly round CENTRE DISC that fills about 55% of the medal's width. The centre disc is completely EMPTY: flat, plain, evenly lit, very dark jade-black (#15291e), slightly sunken with a soft inner shadow along its top edge. No symbol, icon, letter, number, star, gem or texture inside the disc — an icon is added in code.

READABILITY: these are shown very small (24 to 56 pixels wide), so use bold shapes, strong light-and-dark contrast on the rim, and only a few large, chunky details. No fine filigree, no thin lines, no tiny gems.

The five tiers rise from humble to grand. Keep every decoration on the outer rim and the inner ring, never in the centre disc:

1. TIER 1 — HUMBLE: matte dark emerald carved wood rim, simple and plain, one small pearl at the top. No glow.

2. TIER 2 — POLISHED: the same wood, polished with a soft sheen, a thin bright mint inner ring, one pearl at the top and one at the bottom.

3. TIER 3 — ADORNED: polished wood with a carved vine-and-leaf relief wrapping the rim, four pearls at the top, bottom, left and right, a soft mint glow on the inner ring.

4. TIER 4 — PRECIOUS: the rim inlaid with pale cream-pearl mother-of-pearl, deep emerald cabochons at the top, bottom, left and right, pearls on the four corners, a brighter mint glow on the inner ring.

5. TIER 5 — LEGENDARY: lustrous ivory-and-pearl rim with burnished pale gold edging, a large glowing emerald cabochon at the top, pearls on all eight corners, small curling leaves at the sides, a radiant mint-white glow around the inner ring and a few soft firefly sparkles just outside the rim.

Absolutely no text, letters, numbers, labels, watermark or signature anywhere in the image (the numbering above is for you, do not draw it).

BACKGROUND: extremely important. Everything around and between the objects MUST be a bright, saturated, completely flat, solid magenta, hex #FF00FF. No gradient, no vignette, no shadow cast onto it, no fade to white and no grey. Only pure flat magenta, because it will be cut out and replaced with transparency.
```

## Follow-ups when Gemini drifts

- Shapes differ: "All five medals must have the identical octagon silhouette and size; only the materials and decorations change."
- Something in the centre: "Keep the rims exactly as they are, but make every centre disc completely empty, flat and dark."
- Too fussy at small size: "Same medals, but simpler: fewer, bigger details and stronger contrast, so each reads at 32 pixels."
- Sparkles merge into the background on tier 5: "Keep the sparkles touching the rim, with flat magenta beyond them."
