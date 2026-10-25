# Sheet — UI renewal (Forest & Pearl)

One Gemini message that paints every new piece the old-style screens need
(audit 2026-10-23), so they all share materials and lighting. Attach as
references: `public/art/forest-pearl/header-combined.webp`, `menu-button.webp`,
`card-frame.webp`, `pill-button.webp`.

What this sheet covers, and what it does not:

| Audit item | New art from this sheet | Reuses existing art (code only) |
|---|---|---|
| 1 In-game HUD | round icon button, danger pill (hud bar painted but unused: its ornate ends leave no room for text) | card frame for side panels + score strip, title banner for "pts left" |
| 2 Lobby time controls | choice tile | — |
| 3 Popover chrome | tab (off/on), round icon button (close) | title banner for headers, primary/pill buttons |
| 4 Share dialog | — | card frame, pill buttons |
| 5 Coach bubble / tip | speech bubble + tail | pill button for "Got it" |
| 6 Toasts, daily loading | — | title banner |
| 7 Confirm buttons | danger pill | menu / pill buttons |
| 8 OG card, web icons, store art | — | not Gemini: OG card = victory-card renderer, icons = `play-store/sources/play-icon.svg`, screenshots = re-shoot |
| 9 Footer, inputs, toggles, swatches | input field, toggle track + knob; hud bar for footer; icon button rim for swatches | — |
| 10 Fonts | — | not art: pick an OFL display font separately |

Process (reading order = the numbering below):

```
node scripts/process-art.mjs art-src/forest-pearl/ui-renewal-sheet.png forest-pearl hud-bar:stretch input-field:stretch danger-pill:stretch tab-off:stretch tab-on:stretch toggle-track:stretch choice-tile:nine speech-bubble:nine icon-button bubble-tail toggle-knob
```

## Prompt

```
Premium glossy 3D mobile-game asset render, in the visual register of high-end mobile puzzle games (Board Kings, Clash Royale, Candy Crush pieces). Match the attached reference images exactly in style, materials and colour. Materials: rich dark emerald-stained carved wood, twisting vine and leaf relief, polished round cabochons in deep emerald and lustrous pearl. Colour palette: deep emerald #0d4a23 and sage #1c7a3d brightening to mint #62cf90; pale cream-pearl #d3ecaa, ivory #f0fbcf and white #ffffff; mint-green #7bdb95 for magical light; deep jade-black #15291e to near-black #02090b for shadow. Mood: an enchanted, glowing forest clearing at dusk, with moss, pearls, fireflies and soft magical luminescence. Light falls from the top.

SHEET LAYOUT: one image, aspect ratio 3:2 (for example 2400 × 1600 pixels), showing exactly ELEVEN separate objects on one shared background, all seen straight on with no perspective or tilt, all made of the same materials under the same lighting, all clearly from ONE matching UI set. Arrange them in three rows. Row 1 (top): objects 1 and 2, side by side. Row 2 (middle): objects 3, 4, 5 and 6, left to right. Row 3 (bottom): objects 7, 8, 9, 10 and 11, left to right. No object touches or overlaps another. Leave a wide band of empty background between all objects and at least 40 pixels of empty background around each one.

RULE FOR EVERY STRETCHABLE OBJECT (1–8): it will be stretched in code, so decoration lives ONLY in the end caps or corners described; everything between them is completely plain, uniform base material with only a very faint texture that looks identical everywhere; edges between the decorated parts are one thin, simple, perfectly straight raised rim, identical along its whole length. No ornaments, gems, bright spots, text, icons or symbols in any plain area.

1. HUD BAR: a slim horizontal bar for the top of the game screen, exactly 8:1. Dark carved emerald wood. DECORATED ENDS only in the left 8% and right 8%: one small vine curl and one small pearl each, mirrored. Plain dark middle so light cream text and numbers are easy to read on it. Low, quiet, understated — less decorated than a button.

2. INPUT FIELD: a text-entry slot, exactly 6:1. A RECESSED plain channel sunk into dark emerald wood: the inner surface is very dark, flat and evenly lit (looks pressed in, with a soft inner shadow along its top edge), surrounded by a thin simple rim. DECORATED ENDS only in the left 6% and right 6%: one tiny pearl each, mirrored. Nothing else.

3. DANGER PILL: a small fully rounded pill button for destructive actions (resign, delete), exactly 3:1, the same construction as the attached pill button, but its two end accents are deep GARNET-RED cabochons (#7a1f2a with a warm highlight) instead of pearls, and the plain middle is a slightly warmer, darker wood. Still clearly part of the same green set — red only in the two gems.

4. TAB — INACTIVE: a small fully rounded pill, exactly 3:1, matte dark emerald wood, NO gems, NO glow, sunken-looking and quiet. Thin simple rim. Completely plain middle.

5. TAB — ACTIVE: the SAME pill as object 4, same size and silhouette, but raised and lit: polished sage-to-mint inlay glowing softly from within, bright thin rim, one tiny pearl in the left 12% and right 12%, mirrored. Plain middle where dark text is easy to read.

6. TOGGLE TRACK: a switch track, exactly 2.2:1, a fully rounded recessed channel in dark emerald wood with a soft inner shadow, thin rim, completely plain inside. No knob in it.

7. CHOICE TILE: a compact square selection tile, about 1:1, with softly rounded corners, lighter and smaller-scale than the attached card frame. Stretched in both directions (nine-slice): decoration ONLY inside each of the four corners, within the outer 18% of width and height — one tiny leaf and one tiny pearl per corner, mirrored. Between corners, four thin straight uniform rims. Centre completely plain, dark emerald base material.

8. SPEECH BUBBLE: a helper speech panel, about 4:3, rounded rectangle with generously rounded corners, made of slightly LIGHTER, softer jade wood than the card frame so it reads as a friendly tip. Stretched in both directions (nine-slice): decoration ONLY in the four corners (one tiny curling vine tip each, mirrored), thin straight uniform rims between them, centre completely plain and dark enough for cream text. NO tail attached — the tail is object 10.

9. ROUND ICON BUTTON: a small perfectly circular button plate, 1:1, carved emerald wood ring with a thin bright rim and one tiny pearl at the top. The circular centre is completely EMPTY, flat and plain dark wood — no icon, arrow, symbol or letter (icons are added in code).

10. BUBBLE TAIL: a small separate triangular speech-bubble tail pointing straight DOWN, made of exactly the same material and rim as object 8, about 1:1, simple and smooth, no decoration.

11. TOGGLE KNOB: a single round glossy PEARL knob, 1:1, lustrous ivory-cream with a soft mint reflection and a crisp specular highlight on the upper left, sized to sit inside object 6.

Absolutely no text, letters, numbers, labels, watermark or signature anywhere in the image.

BACKGROUND: extremely important. Everything around and between the objects MUST be a bright, saturated, completely flat, solid magenta, hex #FF00FF. No gradient, no vignette, no shadow cast onto it, no fade to white and no grey. Only pure flat magenta, because it will be cut out and replaced with transparency.
```

## Follow-ups when Gemini drifts

- Missing / merged objects: "Exactly ELEVEN separate objects in the 2 / 4 / 5 row layout, magenta between all of them."
- Decorated middles: "Keep the ends and corners exactly as they are, but make every middle plain and uniform."
- Text or icons appear: "Remove every symbol, arrow and letter; the centres stay empty."
- If eleven is too many for one image, split rows 1–2 and row 3 into two messages, keeping the same style block and references.
