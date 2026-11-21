# Desert Sunset theme: Gemini prompts

Renamed from "Sunset Catan" (2026-11-21): "Catan" is a registered trademark,
so neither the name nor the art may look like that board game. No hexagon
tiles, no settlers, no island map, no wooden road/house pieces.

The scene: a desert canyon at sunset. Terracotta cliffs frame the screen, the
canyon floor is in deep warm shadow, the sky glows amber high above. The board
is a slab of smooth sandstone; the pieces are glazed terracotta (P1) and
polished parchment-cream sandstone (P2); claimed lines are braided cords.

Player colours (CSS `[data-theme="sunset-catan"]` in `src/styles.css`, id kept
so saved settings still work): P1 = terracotta, dark (#9c3a14 body, #c25527
glow); P2 = parchment cream, bright (#e8d4a6 body, #f4e4bc glow). Dark vs
bright, so the sides are told apart by brightness alone (colour-blind safe).
Never make P1 bright or P2 dark.

**How to use:** paste ONE prompt per message (everything inside the box).
Save each result in `art-src/desert-sunset/` with the file name given, then
tell Claude. Claude cuts, cleans and installs them (`scripts/process-art.mjs`).
For prompts 3 to 6, attach `public/art/forest-pearl/dot-p1.webp` and
`line-5-p1.webp` as size and shape references so the pieces fit the game, and
add "Match only the size, shape and camera angle of the attached images, not
their colours or materials."

Order: 1 → 2 → 3 first (they set the look), then 4 to 7.

---

## Prompt 1 — Background, phone → `background-portrait.png`

```
A painted desert canyon at sunset, made as a tall vertical phone wallpaper (9:16 portrait), in the style of premium mobile-game background art: rich, soft, painterly brushwork, slightly stylized, warm and calm. Sharp and detailed throughout, at the highest resolution possible.

We are standing on the floor of a wide canyon, looking straight ahead down the valley. Tall terracotta and rust-red sandstone cliffs, layered in soft horizontal bands, rise along the left and right sides of the picture from the bottom to the top, framing the view. Between them, the canyon continues far into the distance: cliffs getting smaller, softer and more purple as they fade into a warm golden haze. High above, a narrow strip of sunset sky glows amber and soft peach, with a few thin glowing clouds. The low sun is hidden behind the far cliffs, so its light only touches the tops of the rocks with a warm golden rim.

The canyon floor in the lower and middle part of the picture lies in deep, calm, cool shadow: dark warm brown #3a2418 fading to #1c100a, smooth sand and a few low rounded rocks, with no strong details. A few small desert plants and dry grass tufts sit only along the very bottom edge and at the foot of the cliffs. A handful of tiny warm dust motes float in the light.

Colours: terracotta #c25527, rust, burnt orange, warm parchment cream highlights #f4e4bc, deep warm browns in the shadows; no green, no blue water, no neon. No people, no animals, no buildings, no roads, no tents, no hexagons, no game pieces, no text, letters, watermark or logo.
```

Claude: `background-portrait`.

---

## Prompt 2 — Background, desktop → `background-landscape.png`

Same as prompt 1, with "tall vertical phone wallpaper (9:16 portrait)"
changed to "wide desktop wallpaper (16:9 landscape)".

Claude: `background-landscape`.

---

## Prompt 3 — Board surface (sandstone slab) → `felt-base.png`

```
A quiet, low-contrast overhead texture of smooth, sun-warmed sandstone, meant purely as a background surface underneath game pieces, NOT a hero illustration. Fine-grained stone with very soft, wide, wavy bands of colour (like gentle wind-worn strata), in deep warm umber #3a2418 to dark rust-brown #2a160c, with a few faint lighter sand-coloured streaks #5a3a24. No cracks, no pebbles, no fossils, no carvings, no patterns and no big objects. Soft, even lighting with no bright spots or focal point, calm and unobtrusive like a plain fabric with a hint of texture, so brightly coloured pieces placed on top remain the clear centre of attention. Even detail across the whole image and no repeating pattern, so any part can be cropped and still look complete. Fill the frame edge to edge, no margins. No text, letters, watermark or logo. Square composition, high detail.
```

Claude: `felt-base`. It must stay DARK: the cream P2 pieces need it to stand out.

---

## Prompt 4 — The two dots → `dots-sheet.png`

```
Premium glossy 3D mobile-game asset render, in the visual register of high-end mobile puzzle games (Candy Crush, Clash Royale pieces). Smooth polished materials, rich specular highlights, soft rim light, slightly stylized and rounded rather than photorealistic. No text, numbers, letters, watermark or logo anywhere.

Render exactly TWO round game pieces side by side, the same size, centred on the same horizontal line, with a wide empty gap between them. Each piece is a PERFECT SPHERE seen straight on, with no cap, hole, string or stand. Light falls from the top left: one crisp warm-white specular highlight on the upper left of each ball, a soft warm reflected glow along the lower right edge.

LEFT ball: glossy glazed terracotta ceramic, like a fired clay bead with a deep glaze. #3a0f04 in the shadow, #9c3a14 in the body, #c25527 to #e07a3f where the light hits. A very faint, fine clay texture under the glaze, no pattern. It must read as a DARK ball.
RIGHT ball: polished parchment-cream sandstone, smooth like a river-polished pebble, with a very faint soft grain. #8b7a52 in the deepest shadow, #e8d4a6 in the body, #f4e4bc to #fffaf0 where the light hits. It must read as a BRIGHT, LIGHT ball, clearly lighter than the terracotta one even in black and white.

Wide composition, about 2:1.

BACKGROUND: extremely important. Everything around and between the balls MUST be a bright, saturated, completely flat, solid magenta, hex #FF00FF. No gradient, no vignette, no shadow cast onto it, no reflection of the magenta in the balls, no fade to white and no grey. Only pure flat magenta, because it will be cut out and replaced with transparency.
```

Claude: `dot-p1` (left), `dot-p2` (right).

---

## Prompt 5 — Terracotta cords (Player 1 lines) → `cords-p1-sheet.png`

```
Premium glossy 3D mobile-game asset render, in the visual register of high-end mobile puzzle games (Candy Crush, Clash Royale pieces). Rich materials, soft specular highlights, slightly stylized and rounded rather than photorealistic. No text, numbers, letters, watermark or logo anywhere.

Render EIGHT pieces of thick BRAIDED LEATHER CORD standing UPRIGHT (each one runs straight up and down, vertically), side by side in one row, left to right from SHORTEST to LONGEST, with a wide empty gap between each. Every piece is one perfectly STRAIGHT, tight, neat three-strand braid of smooth, slightly glossy leather. No sag, no curve, no loops, no knots, no beads, no tassels.

Colour: deep terracotta-dyed leather. Shadows #3a0f04, body #9c3a14 to #c25527, soft warm highlights #e07a3f along the top of each strand. It must read as DARK terracotta overall, not orange or pink.

All eight have exactly the same thickness; longer pieces are simply longer. Both ends are neatly finished with a small, plain, rounded cap of the same leather. Piece 1 is short (about three times as long as it is thick); piece 8 is about four times as long as piece 1; lengths grow evenly in between.

Very wide composition, about 2:1, all eight standing on the same baseline.

BACKGROUND: extremely important. Everything around and between the cords MUST be a bright, saturated, completely flat, solid magenta, hex #FF00FF. No gradient, no vignette, no shadow cast onto it, no magenta reflected in the leather, no fade to white and no grey. Only pure flat magenta, because it will be cut out and replaced with transparency.
```

Claude: `line-2-p1` … `line-9-p1`, left to right.

---

## Prompt 6 — Cream cords (Player 2 lines) → `cords-p2-sheet.png`

Same as prompt 5, with the material and colour paragraph replaced by:

```
Colour: natural parchment-cream linen rope, braided the same way, smooth and slightly glossy. Shadows #8b7a52, body #e8d4a6 to #f4e4bc, bright highlights #fffaf0 along the top of each strand. It must read as BRIGHT cream overall, clearly lighter than terracotta even in black and white.
```

and "BRAIDED LEATHER CORD" changed to "BRAIDED LINEN ROPE".

Claude: `line-2-p2` … `line-9-p2`, left to right.

---

## Prompt 7 — Sandstone board frame (optional) → `stone-frame.png`

Attach `felt-base.png` so the stone matches.

```
Premium painted 2D mobile-game art, in a painterly, slightly realistic style, lit by warm low sunset light from the top left. No text, numbers, letters, watermark or logo anywhere.

ONE square picture FRAME made of a thick band of carved, sun-warmed sandstone, seen straight from the front. The band has the SAME width on all four sides (about one tenth of the frame's width) and perfectly straight outer and inner edges with slightly rounded corners. The stone is smooth with soft wind-worn horizontal strata, terracotta #9c3a14 to warm sand #c2875a, with golden highlights on the top edges and deep umber #2a160c in the shadows.

The four straight sides are plain stone: even and repeating, with NOTHING else on them, because the sides will be stretched.

Decorations ONLY on the four corners: on each corner one small, round, polished cream sandstone stud #f4e4bc set into the stone, with a thin carved ring around it.

The INSIDE of the frame is completely EMPTY: flat solid magenta, no stone, no shadow, nothing.

Square composition, the frame filling the image edge to edge.

BACKGROUND: extremely important. Everything outside the frame AND the empty inside MUST be a bright, saturated, completely flat, solid magenta, hex #FF00FF. No gradient, no vignette, no shadow cast onto it, no glow, no fade to white and no grey. Only pure flat magenta, because it will be cut out and replaced with transparency.
```

Claude: `stone-frame:nine` (nine-slice, fits all three board shapes).

---

## When Gemini drifts

- Cliffs fill the middle or the sky is too bright: "Keep the canyon floor in the lower middle dark and calm, in deep warm shadow."
- It paints hexagons, little houses or roads: "No hexagons, no buildings, no roads, no game pieces."
- Terracotta ball looks orange or bright: "Make the left ball a deep, dark glazed terracotta."
- Cream ball looks grey or dark: "The right ball must be bright parchment cream, clearly lighter."
- Cords curved or horizontal: "Each cord is perfectly straight and vertical, standing upright in one row."
- Magenta reflected in the pieces: "No magenta reflections in the objects."
