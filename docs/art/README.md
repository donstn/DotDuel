# Theme art system

Painted (Gemini) art per colour theme. One contract, shared by code, prompts
and the processing script, so adding or restyling a theme is mechanical.

## Pieces

| File | Role |
|---|---|
| `src/themeArt.ts` | **The contract.** Per theme: URL + pixel geometry of each art slot. Code reads only this — no `theme === '…'` checks for art. A missing slot = that piece falls back to plain CSS. |
| `docs/art/style-<theme>.md` | The theme's **style block** (materials, palette hexes, mood, reference images). The only prompt text that changes between themes. |
| `docs/art/slots.md` | One **structure block** per slot (shape, aspect, decorated vs plain zones, magenta background). Identical for every theme. |
| `scripts/process-art.mjs` | Keys out magenta, splits a sheet into objects, trims, writes WebP, measures stretch caps and fails if a "plain middle" isn't plain. Prints the numbers to paste into `themeArt.ts`. |
| `art-src/<theme>/` | Raw Gemini outputs (kept for re-processing, never shipped). |
| `public/art/<theme>/<slot>.webp` | Shipped assets. |

## Slots (current contract)

| Slot | Kind | Geometry the code relies on |
|---|---|---|
| `headerSign` | panel | aspect; text-safe box as fractions (left/top/right/bottom) |
| `menuButton` | stretch | `capLeft` / `capRight` px — only the middle stretches |
| `pillButton` | stretch | `capLeft` / `capRight` px |
| `shapeIcons` | icons | one image per board shape |

Not yet migrated (still hardcoded `forest-pearl` paths in `SidePanel.tsx`,
`Board.tsx`, `WinCelebration.tsx`, `styles.css`): avatars, dots, line
strokes, board felt, backgrounds. Move each into `ThemeArt` when it is next
touched, and derive `locked` in `src/theme.ts` from "has all required slots".

## Workflow for new art

1. **Prompt = style block + sheet layout + slot structure blocks**, all in ONE
   Gemini message, so every piece on the sheet shares materials and lighting.
   Attach 2–3 of the theme's already-approved assets as style references.
   Group pieces by screen into sheets (e.g. both buttons on one sheet); objects
   must not touch, with a wide magenta gap between them.
2. Save the raw sheet to `art-src/<theme>/<sheet>.jpg|png`.
3. Run, listing slots in reading order (top→bottom, left→right):
   `node scripts/process-art.mjs art-src/<theme>/buttons-sheet.jpg <theme> menu-button:stretch pill-button:stretch`
4. Paste the printed width/height/caps into the theme's entry in
   `src/themeArt.ts`. Panel text boxes are measured by eye for now — check
   the greeting at 320px in Lithuanian after any header regeneration.
5. Check at 320×568 and 412×703, Lithuanian, signed in and out: home menu
   must fit with no scroll.

## Rules learned the hard way

- Stretchable art: decoration ONLY in the end caps; plain, uniform middle;
  straight, shallow long edges. Ornament on all four sides cannot stretch
  (the reverted 2026-09-11 panel texture).
- Never paint words — all text is code (translated, sharp, no AI typos).
  Exception: the logo wordmark, checked letter by letter.
- Flat `#FF00FF` background, no shadows cast on it; the script un-mixes
  magenta from edges and neutralises magenta reflections.
- Ship WebP, not PNG (the header went 1.03 MB → 94 KB).
