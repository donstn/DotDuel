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

Attach: the result of Prompt 1, `public/art/forest-pearl/background-landscape.webp`,
`header-combined.webp`.

```
Premium painted mobile-game promotional card, in the visual register of high-end mobile puzzle game key art (Candy Crush, Clash Royale). Match the attached reference images exactly in style, materials and colour. No watermark and no user-interface.

Wide composition, exactly 1.91:1 (for example 1910×1000).

Background: an enchanted forest clearing at dusk, deep emerald (#0d4a23, #15291e) fading to near-black (#02090b) at the edges, soft mint (#7bdb95) fireflies, gentle magical light from above.

CENTRE: the game's name as a big glossy 3D logo. The word is exactly: DotDuel. That is seven letters, D-o-t-D-u-e-l, with a capital D at the start and a capital D in the middle. Spell it exactly like this. Chunky, rounded, friendly display letters of polished cream pearl (#f0fbcf with white highlights), a thin deep-emerald (#0d4a23) outline and a soft mint glow along the edges.
Left of the word: a large glossy deep-emerald glass sphere. Right of the word: a large glossy cream-pearl sphere, like the two spheres in the attached icon, with a faint glowing mint line running between them behind the word.
No other text: no tagline, no web address, no buttons.

Keep everything important inside the middle 80% of the width and height; some apps crop the edges or show the card as a square.
```

If "DotDuel" is misspelled, generate it again.
