# Sheets — achievement icons (Forest & Pearl)

Painted replacements for the code-drawn glyphs in
`src/achievements/AchievementBadge.tsx`. They sit in the empty centre disc of
the medal frames (`sheet-achievement-frames.md`), so send these in the SAME
Gemini chat as the frames and attach the frames sheet as a reference.

29 pictures over three sheets (Gemini drifts past ~10 objects). Not painted:
the shape badges (`shape-*`) stay as code-drawn dot clusters, and the
per-shape crown / skull badges reuse ONE painted crown and ONE painted skull
with the small shape dots overlaid in code.

Size: the icon shows at ~24–28 px on screen, so every prompt asks for one bold
object with a strong silhouette, bright on the dark disc.

| Sheet | Objects (left → right, top → bottom) |
|---|---|
| A — play | spark, trophy, claim, map, crown, skull, nightmare, medal, corner, longline |
| B — ranked & social | sword, sword-win, chevron, clock, upset, rematch, friend, refer, share, palette |
| C — daily & streaks | fire, flame-day, fire-bot, couch, calendar, calendar-streak, calendar-dots, three, crown-daily |

Process:

```
node scripts/process-art.mjs art-src/forest-pearl/ach-icons-a.png forest-pearl ach-spark ach-trophy ach-claim ach-map ach-crown ach-skull ach-nightmare ach-medal ach-corner-old ach-longline-old
node scripts/process-art.mjs art-src/forest-pearl/ach-icons-a2.png forest-pearl ach-corner ach-longline   # redo of A9/A10; drop the *-old files
node scripts/process-art.mjs art-src/forest-pearl/ach-icons-b.png forest-pearl ach-sword ach-sword-win ach-chevron ach-clock ach-upset ach-rematch ach-friend ach-refer ach-share ach-palette
node scripts/process-art.mjs art-src/forest-pearl/ach-icons-c.png forest-pearl ach-fire ach-flame-day ach-fire-bot ach-couch ach-calendar ach-calendar-streak ach-calendar-dots ach-three ach-crown-daily
```

## Shared style block (top of every sheet prompt)

```
Premium glossy 3D mobile-game ICON renders, in the visual register of high-end mobile puzzle games (Board Kings, Clash Royale, Candy Crush pieces), made to sit inside the empty centre of the attached achievement medal frames, from the same set. Materials: lustrous pearl and ivory, polished emerald and mint glass, carved dark emerald wood, small touches of burnished pale gold. Colour palette: deep emerald #0d4a23 and sage #1c7a3d brightening to mint #62cf90; pale cream-pearl #d3ecaa, ivory #f0fbcf and white #ffffff; mint-green #7bdb95 for magical light; pale gold #e8d9a0 only for small accents. Light falls from the top left.

EVERY ICON: one single, bold, instantly recognisable object, seen straight on, centred, about 1:1, filling its square. It will be shown TINY (about 26 pixels wide) on a very dark jade-black disc (#15291e), so: bright, light-coloured main shapes, a strong simple silhouette, a thin dark outline around the whole object, very few large details, no thin lines, no small text-like marks. NO frame, NO disc, NO background plate behind the icon — just the object itself.
```

Closing block (end of every sheet prompt):

```
Absolutely no text, letters, numbers, labels, watermark or signature anywhere in the image (the numbering above is for you, do not draw it).

BACKGROUND: extremely important. Everything around and between the objects MUST be a bright, saturated, completely flat, solid magenta, hex #FF00FF. No gradient, no vignette, no shadow cast onto it, no fade to white and no grey. Only pure flat magenta, because it will be cut out and replaced with transparency.
```

## Sheet A — play

```
SHEET LAYOUT: one image, aspect ratio 5:2 (for example 3000 × 1200 pixels), exactly TEN separate icons in two rows of five: row 1 is icons 1–5, row 2 is icons 6–10, left to right. All the same size, same lighting, clearly one matching set. No icon touches another; at least 60 pixels of empty background around each.

1. SPARK (first game): a bright four-pointed star sparkle bursting from a single glowing pearl.
2. TROPHY (first win): a small polished pale-gold trophy cup with two handles and a pearl on its front.
3. CLAIM (claim a waiting line): a small pennant flag planted on top of a short glowing mint bar.
4. MAP (unlock every board): a small unrolled parchment map with three pearl dots joined by a dotted path.
5. CROWN (grandmaster): a regal crown of ivory and pale gold, three points each tipped with a pearl, an emerald in the centre.
6. SKULL (executioner): a friendly, cartoon, rounded ivory skull, game-like and not scary, with two dark round eyes.
7. NIGHTMARE (beat the hardest bot): an angular near-black robot head with two small horns and glowing red eyes.
8. MEDAL (hundred games): a round pale-gold medal with a pearl at its centre, hanging from a short emerald ribbon.
9. CORNER (one-point corner line): ONE single pearl, with a short, thick, straight glowing mint bar running diagonally through its exact centre and sticking out a little on both sides, drawn on top of the pearl.
10. LONG LINE (eight in a row): four pearls in a perfectly straight diagonal row, evenly spaced with small gaps, and one thick, straight glowing mint bar (about half a pearl wide) running exactly through all their centres, drawn on top of them and sticking out a little beyond the first and last pearl.
```

## Sheet B — ranked & social

```
SHEET LAYOUT: one image, aspect ratio 5:2 (for example 3000 × 1200 pixels), exactly TEN separate icons in two rows of five: row 1 is icons 1–5, row 2 is icons 6–10, left to right. All the same size, same lighting, clearly one matching set, matching the icons already made in this chat. No icon touches another; at least 60 pixels of empty background around each.

1. SWORD (first ranked game): a single upright short sword, ivory blade, emerald hilt with a pearl pommel.
2. VICTOR (ranked wins): two crossed swords over a small green laurel wreath.
3. RISING (rating milestones): two stacked upward-pointing chevrons in polished mint glass, like a rank insignia.
4. CLOCK (win on time): a round ivory stopwatch with a pale-gold crown button and two dark hands.
5. GIANT SLAYER (beat a much higher-rated player): a small sword in front of a much larger cracked shield.
6. REMATCH (win a rematch): two curved arrows chasing each other in a circle, one emerald, one ivory.
7. FRIENDS (add a friend): two rounded figures side by side, one emerald, one ivory pearl, simple busts.
8. RECRUITER (invite a new player): a rounded figure with a small glowing mint plus sign beside it.
9. SHOW OFF (share a card): a folded paper plane in ivory with a soft mint trail.
10. DECORATOR (try every theme): a painter's palette in carved wood with four round blobs of paint: emerald, ivory, mint and pale gold.
```

## Sheet C — daily & streaks

```
SHEET LAYOUT: one image, aspect ratio 3:1 (for example 3000 × 1000 pixels), exactly NINE separate icons in one row of five (icons 1–5) above a row of four (icons 6–9), left to right. All the same size, same lighting, clearly one matching set, matching the icons already made in this chat. No icon touches another; at least 60 pixels of empty background around each.

1. HEATING UP (ranked win streak): a bold flame, mint-green at the base rising to ivory-white at the tip.
2. REGULAR (play several days in a row): the same flame, with a small pale-gold sun disc behind it.
3. HOT HAND (bot win streak): the same flame with a small, cute round robot face in its centre.
4. COUCH RIVALS (hot-seat games): a small two-seat sofa in emerald velvet with two ivory cushions.
5. DAILY DABBLER (first daily puzzle): a single tear-off calendar page in ivory with an emerald top band and one pearl in the middle.
6. ON SCHEDULE (daily puzzle streak): the same calendar page with a small flame in the middle instead of the pearl.
7. FIRST WEEK (seven different days): the same calendar page with seven small pearls in a neat grid.
8. PERSISTENT (use all three attempts): three glowing round orbs in a row, emerald, mint and ivory.
9. PUZZLE CHAMPION (first place on a daily): a small crown resting on top of the same calendar page.
```

## Follow-ups when Gemini drifts

- Icons too detailed: "Same icons, but simpler and bolder, so each one reads at 26 pixels: fewer details, thicker shapes, stronger outline."
- Icons on plates or discs: "Remove every background plate, disc and frame; only the object itself on magenta."
- Style drifts from sheet A: "Match the icons from the earlier sheet in this chat exactly: same materials, outline and lighting."
