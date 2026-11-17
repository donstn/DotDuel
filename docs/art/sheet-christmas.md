# Christmas theme: Gemini prompts

Seasonal theme (1 Dec – 6 Jan). It reuses Forest & Pearl's green buttons,
frames, header and avatars; only the pieces below are new. The Triangle board
points UP in this theme, so the board itself is the tree: the felt is fir
needles, the dots are baubles, a claimed line is a strand of tinsel.

Player colours (CSS in `src/styles.css`, `html[data-theme="christmas"]`):
P1 = deep red, P2 = shiny gold. Dark vs bright, so the sides are told apart
by brightness alone (colour-blind safe). Never make P1 bright or P2 dark.

**How to use:** paste ONE prompt per message (everything inside the box).
Save each result in `art-src/christmas/` with the file name given, then tell
Claude. Claude cuts, cleans and installs them (`scripts/process-art.mjs`).
For prompts 1, 2 and 3 attach `public/art/forest-pearl/dot-p1.webp` and
`line-5-p1.webp` as style references, so the new pieces match the game.

---

## Prompt 1 — Baubles (the two dots) → `baubles-sheet.png`

```
Premium glossy 3D mobile-game asset render, in the visual register of high-end mobile puzzle games (Candy Crush, Clash Royale pieces). Smooth glass and polished-metal materials, rich specular highlights, soft rim light, slightly stylized and rounded rather than photorealistic. No text, numbers, letters, watermark or logo anywhere.

Render exactly TWO Christmas tree baubles side by side, the same size, centred on the same horizontal line, with a wide empty gap between them. Each bauble is a PERFECT SPHERE seen straight on, with only a very small, simple gold cap and tiny loop on top (the cap is small: the round ball fills at least 85% of the object's height). Light falls from the top left: one crisp white specular highlight on the upper left of each ball, a soft reflected glow along the lower right edge.

LEFT bauble: deep ruby-red glass, #7a0f1f in the shadow, #a3162b in the body, #e8475c where the light hits. Glossy and smooth, no pattern. It must read as a DARK ball.
RIGHT bauble: shiny gold, #e0b23a in the body brightening to #f2c94c and a pale #fff3c4 highlight, with a very fine glitter sparkle. It must read as a BRIGHT, LIGHT ball, clearly lighter than the red one even in black and white.

Wide composition, about 2:1.

BACKGROUND: extremely important. Everything around and between the baubles MUST be a bright, saturated, completely flat, solid magenta, hex #FF00FF. No gradient, no vignette, no shadow cast onto it, no reflection of the magenta in the balls, no fade to white and no grey. Only pure flat magenta, because it will be cut out and replaced with transparency.
```

Claude: `dot-p1` (left), `dot-p2` (right).

---

## Prompt 2 — Red tinsel (Player 1 lines) → `tinsel-p1-sheet.png`

```
Premium glossy 3D mobile-game asset render, in the visual register of high-end mobile puzzle games (Candy Crush, Clash Royale pieces). Shiny metallic foil materials, rich specular highlights, slightly stylized and rounded rather than photorealistic. No text, numbers, letters, watermark or logo anywhere.

Render EIGHT pieces of Christmas TINSEL standing UPRIGHT (each one runs straight up and down, vertically), side by side in one row, left to right from SHORTEST to LONGEST, with a wide empty gap between each. Every piece is one perfectly STRAIGHT, fluffy rope of shiny metallic tinsel: many fine glittering foil strands bristling evenly all around a central cord, like a soft shiny bottle brush. No sag, no curve, no loops, no beads, no lights, no bows.

Colour: deep metallic ruby red. Shadows #4a0812, body #7a0f1f to #a3162b, small bright glints #e8475c and a few tiny white sparkles. It must read as DARK red tinsel overall, not pink or bright red.

All eight have exactly the same thickness and the same fluffiness; longer pieces are simply longer. The ends are softly rounded, finishing the tinsel neatly. Piece 1 is short (about three times as long as it is thick); piece 8 is about four times as long as piece 1; lengths grow evenly in between.

Very wide composition, about 2:1, all eight standing on the same baseline.

BACKGROUND: extremely important. Everything around and between the tinsel pieces MUST be a bright, saturated, completely flat, solid magenta, hex #FF00FF. No gradient, no vignette, no shadow cast onto it, no magenta reflected in the foil, no fade to white and no grey. Only pure flat magenta, because it will be cut out and replaced with transparency.
```

Claude: `line-2-p1` … `line-9-p1`, left to right.

---

## Prompt 3 — Gold tinsel (Player 2 lines) → `tinsel-p2-sheet.png`

```
Premium glossy 3D mobile-game asset render, in the visual register of high-end mobile puzzle games (Candy Crush, Clash Royale pieces). Shiny metallic foil materials, rich specular highlights, slightly stylized and rounded rather than photorealistic. No text, numbers, letters, watermark or logo anywhere.

Render EIGHT pieces of Christmas TINSEL standing UPRIGHT (each one runs straight up and down, vertically), side by side in one row, left to right from SHORTEST to LONGEST, with a wide empty gap between each. Every piece is one perfectly STRAIGHT, fluffy rope of shiny metallic tinsel: many fine glittering foil strands bristling evenly all around a central cord, like a soft shiny bottle brush. No sag, no curve, no loops, no beads, no lights, no bows.

Colour: bright shiny GOLD. Body #e0b23a to #f2c94c, many bright glints #fff3c4 and tiny white sparkles, only small warm shadows #b8861f. It must read as BRIGHT, LIGHT gold tinsel overall, clearly lighter than dark red even in black and white.

All eight have exactly the same thickness and the same fluffiness; longer pieces are simply longer. The ends are softly rounded, finishing the tinsel neatly. Piece 1 is short (about three times as long as it is thick); piece 8 is about four times as long as piece 1; lengths grow evenly in between.

Very wide composition, about 2:1, all eight standing on the same baseline.

BACKGROUND: extremely important. Everything around and between the tinsel pieces MUST be a bright, saturated, completely flat, solid magenta, hex #FF00FF. No gradient, no vignette, no shadow cast onto it, no magenta reflected in the foil, no fade to white and no grey. Only pure flat magenta, because it will be cut out and replaced with transparency.
```

Claude: `line-2-p2` … `line-9-p2`, left to right.

---

## Prompt 4 — Board surface (the tree) → `felt-base.png`

```
A quiet, low-contrast overhead texture of dense dark fir-tree needles, meant purely as a background surface underneath game pieces, NOT a hero illustration. Fine, small-scale overlapping evergreen needles with gentle colour variation in deep pine green #0f2a1d to #071a10, a very light dusting of snow in a few places, and no ornaments, lights, cones or big objects. Soft, even lighting with no bright spots or focal point, calm and unobtrusive like a plain fabric with a hint of texture, so brightly coloured baubles placed on top remain the clear centre of attention. Even detail across the whole image and no repeating pattern, so any part can be cropped and still look complete. Fill the frame edge to edge, no margins. No text, letters, watermark or logo. Square composition, high detail.
```

Claude: `felt-base`.

---

## Prompt 5 — Background, phone → `background-portrait.png`

```
Premium painterly 3D mobile-game background, in the visual register of high-end mobile puzzle games. A magical snowy winter night in a pine forest: tall snow-covered fir trees on both sides fading into soft blue-green mist, gentle falling snow, a few warm golden fairy-light bokeh dots far in the background, deep pine green #0f2a1d to near-black #020a06 in the shadows, cool moonlight from the top. Cosy, calm and festive. Keep the CENTRE THIRD of the image dark, calm and uncluttered: a game board will sit there. No people, no animals, no houses, no Santa, no text, letters, watermark or logo. Vertical portrait composition, about 9:16.
```

Claude: `background-portrait`.

---

## Prompt 6 — Background, desktop → `background-landscape.png`

Same as prompt 5, with the last sentence changed to:

```
Wide horizontal composition, about 16:9.
```

Claude: `background-landscape`.

---

## Prompt 7 — Snowflakes for the win snowfall → `snow-sheet.png`

```
Premium glossy 3D mobile-game asset render. Four small, distinct snowflakes in a clean 2x2 grid with wide empty gaps between them, each seen straight on: top-left, a classic six-armed crystal snowflake with fine branches; top-right, a simpler chunky six-pointed snowflake; bottom-left, a soft round fluffy snow puff; bottom-right, a tiny sparkling ice-crystal star. All pure white #ffffff to icy pale blue #e6f0ff, softly glowing, glossy and slightly stylized. No text, letters, watermark or logo. Square composition.

BACKGROUND: extremely important. Everything around and between the snowflakes MUST be a bright, saturated, completely flat, solid magenta, hex #FF00FF. No gradient, no vignette, no shadow, no fade to white and no grey. Only pure flat magenta, because it will be cut out and replaced with transparency.
```

Claude: `particle-snow-1` … `particle-snow-4` (reading order).

---

## Prompt 8 — The tree that IS the board → `tree-board.png`

Attach `felt-base.png` (the fir-needle board surface) so Gemini matches its needles.

```
Premium painted 2D mobile-game art, in the visual register of high-end mobile puzzle games (Candy Crush, Clash Royale). Rich, soft painterly shading, slightly stylized, not photorealistic. No text, numbers, letters, watermark or logo anywhere.

ONE big, perfectly SYMMETRICAL Christmas fir tree, seen straight from the front, that will be used as a game board: round game pieces will later be placed all over its branches.

The foliage is ONE broad, solid TRIANGLE: straight sloping sides from the top to a wide flat bottom, about as wide at the bottom as it is tall. NO separate tiers, NO gaps, NO holes and NO see-through spaces anywhere inside it. The whole triangle is evenly filled with lush, dense, dark fir branches and needles, exactly like the attached fir-needle texture, with gentle light and shadow so it looks rich and three-dimensional, never flat. Only the outer edges are feathery branch tips, with a little soft snow on the tips along the two sloping sides.

NO decorations at all on the tree: no baubles, no lights, no tinsel, no garlands, no flat panel or shape in the middle. The tree is bare green so the game pieces stand out.

A shining golden star on the very top. A short brown trunk in a small wooden tub at the bottom.

Colours: needles #0f2a1d to #1f5236 with lighter tips #3d7a52, snow white with pale blue shadows, star #f2c94c with #fff3c4 highlights.

Square composition. The tree fills the image from top to bottom.

BACKGROUND: extremely important. Everything around the tree MUST be a bright, saturated, completely flat, solid magenta, hex #FF00FF. No gradient, no vignette, no shadow cast onto it, no glow, no snow on the background, no fade to white and no grey. Only pure flat magenta, because it will be cut out and replaced with transparency.
```

Claude: `tree-board`; replaces the board's felt and rim in the Christmas theme. The dot sockets are drawn on the branches.

---

## Optional: snowy header sign → `header-snow.png`

Attach `public/art/forest-pearl/header-combined.webp` and paste:

```
Recreate the attached sign EXACTLY: same shape, same proportions, same "DotDuel" lettering letter by letter, same empty dark panel underneath, same colours and materials. Only add winter details: a soft layer of fresh snow along the top edges of the sign and the letters, a few small icicles hanging from the bottom edge, and one small sprig of holly with red berries on each upper corner. Do not change the panel, it stays completely empty and dark. Same flat solid magenta #FF00FF background, no shadow on it.
```

Claude: `header-combined` for this theme (checks the wordmark letter by letter).

## When Gemini drifts

- Balls not round or cap too big: "Make both balls perfect spheres; the cap is tiny."
- Tinsel curved or horizontal: "Each piece of tinsel is perfectly straight and vertical, standing upright in one row."
- Red tinsel too bright or pink: "Make the red tinsel a deep, dark metallic ruby red."
- Red ball looks bright / gold looks dark: "The red ball must be dark, the gold ball clearly bright."
- Magenta reflected in the glass: "No magenta reflections in the objects."
