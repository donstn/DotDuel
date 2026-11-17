# Christmas theme: Gemini prompts

Seasonal theme (1 Dec – 6 Jan). It reuses Forest & Pearl's green buttons,
frames, header and avatars; only the pieces below are new. The Triangle board
points UP in this theme, so the board itself is the tree: the felt is fir
needles, the dots are baubles, a claimed line is a garland.

Player colours (CSS in `src/styles.css`, `html[data-theme="christmas"]`):
P1 = deep red, P2 = shiny gold. Dark vs bright, so the sides are told apart
by brightness alone (colour-blind safe). Never make P1 bright or P2 dark.

**How to use:** paste ONE prompt per message (everything inside the box).
Save each result in `art-src/christmas/` with the file name given, then tell
Claude. Claude cuts, cleans and installs them (`scripts/process-art.mjs`).
For prompts 1, 2, 3 and 6 attach `public/art/forest-pearl/dot-p1.webp` and
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

## Prompt 2 — Red garlands (Player 1 lines) → `garlands-p1-sheet.png`

```
Premium glossy 3D mobile-game asset render, in the visual register of high-end mobile puzzle games. Smooth glass and polished-metal materials, rich specular highlights, slightly stylized and rounded rather than photorealistic. No text, numbers, letters, watermark or logo anywhere.

Render EIGHT Christmas garlands standing UPRIGHT (each one runs straight up and down, vertically), side by side in one row, left to right from SHORTEST to LONGEST, with a wide empty gap between each. Every garland is a perfectly STRAIGHT vertical string (no sag, no curve, no loops) of small round deep ruby-red glass beads (#7a0f1f to #a3162b, with tiny bright #e8475c highlights), strung close together on a thin gold thread, with a soft warm red glow around the string. Both ends finish in a tiny gold bead. The beads are all the same size in every garland; longer garlands simply have more beads. Garland 1 is short (about 3 beads); garland 8 is about four times as long as garland 1; lengths grow evenly in between. Every garland is equally thin.

Very wide composition, about 2:1, with all eight garlands the same width and standing on the same baseline.

BACKGROUND: extremely important. Everything around and between the garlands MUST be a bright, saturated, completely flat, solid magenta, hex #FF00FF. No gradient, no vignette, no shadow cast onto it, no fade to white and no grey. Only pure flat magenta, because it will be cut out and replaced with transparency.
```

Claude: `line-2-p1` … `line-9-p1`, left to right.

---

## Prompt 3 — Gold garlands (Player 2 lines) → `garlands-p2-sheet.png`

Same as prompt 2 with ONE change: replace the bead sentence with

```
Every garland is a perfectly STRAIGHT vertical strand of fluffy, shimmering GOLD TINSEL (#e0b23a to #f2c94c with bright #fff3c4 glints), with a soft warm golden glow around it. Both ends finish in a tiny gold star-shaped sparkle.
```

(Paste the whole prompt 2 text with that sentence swapped in.)

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

## Optional: snowy header sign → `header-snow.png`

Attach `public/art/forest-pearl/header-combined.webp` and paste:

```
Recreate the attached sign EXACTLY: same shape, same proportions, same "DotDuel" lettering letter by letter, same empty dark panel underneath, same colours and materials. Only add winter details: a soft layer of fresh snow along the top edges of the sign and the letters, a few small icicles hanging from the bottom edge, and one small sprig of holly with red berries on each upper corner. Do not change the panel, it stays completely empty and dark. Same flat solid magenta #FF00FF background, no shadow on it.
```

Claude: `header-combined` for this theme (checks the wordmark letter by letter).

## When Gemini drifts

- Balls not round or cap too big: "Make both balls perfect spheres; the cap is tiny."
- Garlands curved or horizontal: "Each garland is perfectly straight and vertical, standing upright in one row."
- Red ball looks bright / gold looks dark: "The red ball must be dark, the gold ball clearly bright."
- Magenta reflected in the glass: "No magenta reflections in the objects."
