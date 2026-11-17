# App logo + link preview: Gemini prompts

Two things only:
1. **App logo:** the icon on the phone and in Google Play. Claude also makes
   the browser-tab icon (favicon) from it.
2. **Link preview:** the picture people see when a dotduel.com link is posted
   (Facebook, Messenger, WhatsApp, Discord…).

Store screenshots are NOT made here. Claude captures them from the real game.

**How to use:** paste ONE prompt per message (everything inside the box).
Attach the reference images listed above it. Save each result in
`art-src/store/` under the file name given, then tell Claude. If any stray
letters, a watermark or a fake menu appear in an image, generate it again.

---

## Prompt 1: App logo → `icon-master.png`

Attach: `public/art/forest-pearl/dot-p1.webp`, `dot-p2.webp`,
`header-combined.webp`.

```
Premium glossy 3D mobile-game APP ICON, in the visual register of top mobile puzzle game icons (Candy Crush, Clash Royale, Board Kings). Match the attached reference images exactly in materials and colour. No text, letters, numbers, watermark or logo anywhere.

Square image, 1:1, full-bleed: the artwork fills the whole square edge to edge. Do NOT draw rounded corners, a border, a frame, a drop shadow around the square or an icon "tile" shape; the store adds its own rounding.

Subject: TWO large glossy spheres side by side, together filling about 70% of the icon's width, centred both ways.
LEFT sphere: deep emerald glass, #0d4a23 in shadow, #1c7a3d body, #62cf90 where the light hits. It must read as the DARK sphere.
RIGHT sphere: lustrous cream pearl, #d3ecaa body brightening to #f0fbcf and a white highlight. It must read as the BRIGHT sphere, clearly lighter even in black and white.
One short, straight glowing mint (#7bdb95) light streak passes through the centres of both spheres, like a line being completed between two game pieces.
Light falls from the top left: one crisp white specular highlight on each sphere's upper left, a soft rim glow on the lower right.

Background: a deep, rich emerald radial glow, #1a3326 in the centre fading to #02090b at the corners, with a few faint mint fireflies and a soft hint of moss. Simple and dark, so the two spheres pop.

The icon must still read clearly when shrunk to 48×48 pixels: two big round shapes, strong contrast, no small detail that matters.
```

## Prompt 2: App logo, spheres only → `icon-spheres.png`

Android needs the spheres as a separate layer from the background (phones
crop icons into circles, squircles and other shapes). Attach the result of
Prompt 1.

```
Recreate the attached app icon artwork exactly: the same two spheres, the same mint light streak, the same materials, lighting and size. Square image, 1:1. No text, letters, numbers, watermark or logo.

Remove everything else. NO background, NO fireflies, NO moss, NO glow behind the spheres. The spheres keep only their own highlights and their own soft rim glow.

BACKGROUND: extremely important. Everything around the spheres MUST be a bright, saturated, completely flat, solid magenta, hex #FF00FF. No gradient, no vignette, no shadow cast onto it, no reflection of the magenta in the spheres. Only pure flat magenta, because it will be cut out and replaced with transparency.
```

## Prompt 3: Link preview → `link-preview.png`

The game's carved forest-sign look, with the name big and bold enough to read
when the preview is shrunk to a small chat thumbnail.

Attach: BOTH earlier takes (the bold-letter one and the carved-sign one),
`public/art/forest-pearl/header-combined.webp`, and the app logo (Prompt 1).

```
Premium painted mobile-game promotional card, in the visual register of high-end mobile puzzle game key art (Candy Crush, Clash Royale, Board Kings). Combine the two attached takes: keep the ORNATE CARVED FOREST SIGN, the vines, leaves, pearls and emerald cabochons, and the forest scene of the carved-sign take, but use the BIG, BOLD, HIGH-CONTRAST LETTERS of the bold-letter take. No watermark, no user-interface, no other text.

Wide composition, exactly 1.91:1 (for example 1910×1000).

Background: an enchanted forest clearing at dusk, deep emerald (#0d4a23, #15291e) fading to near-black (#02090b) at the edges, a soft beam of light from above, a few mint (#7bdb95) fireflies. Keep the background darker and calmer than the sign, so the sign stands out.

CENTRE: a wide carved wooden sign in deep emerald-stained wood, framed with twisting vines, leaves, small pearls and emerald cabochons, matching the attached header sign. The sign's face (the flat board behind the letters) is DARK: deep jade-black #15291e, plain and smooth, with no carving, studs or pattern behind the letters.

On the sign: the game's name. The word is exactly: DotDuel. That is seven letters, D-o-t-D-u-e-l, with a capital D at the start and a capital D in the middle. Spell it exactly like this.
The letters are LARGE: together they fill about 60% of the whole image's width, and they are tall, filling most of the sign's height. Chunky, rounded, heavy display letters in SOLID smooth polished cream pearl (#f0fbcf, glossy white highlight along the top), with a thick dark-emerald (#0d4a23) outline and a soft mint glow around them. The letters are solid and smooth: NOT made of small pearls, NOT studded, NOT outlined with beads, NOT green. Pale letters on a dark sign: the strongest contrast in the whole picture.

At the two ends of the sign, set into the carving: on the LEFT a large glossy deep-emerald glass sphere (the DARK piece), on the RIGHT a large glossy cream-pearl sphere (the BRIGHT piece), like the two spheres in the attached app logo. A thin glowing mint line runs from one sphere to the other behind the sign.

Keep the sign and everything important inside the middle 85% of the width and height; some apps crop the edges. The word itself must sit in the middle 60% of the width.

The name must stay easy to read when the whole picture is shrunk to 260 pixels wide.
```

If "DotDuel" is misspelled, or the letters come out green, beaded or small,
generate it again.
