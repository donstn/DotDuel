# Slot structure blocks

Identical for every theme. Prompt = style block (`style-<theme>.md`) + one
SHEET LAYOUT line + the structure blocks of the slots on that sheet + the
BACKGROUND block, all in one message.

## Background block (always last)

```
Absolutely no text, letters, numbers, labels, watermark or signature anywhere in the image.

BACKGROUND: extremely important. Everything around and between the objects MUST be a bright, saturated, completely flat, solid magenta, hex #FF00FF. No gradient, no vignette, no shadow cast onto it, no fade to white and no grey. Only pure flat magenta, because it will be cut out and replaced with transparency.
```

## Sheet layout line (adapt the count/positions)

```
SHEET LAYOUT: one image, aspect ratio 2:1 (for example 2048 × 1024 pixels), showing exactly TWO separate objects on one shared background, both seen straight on with no perspective or tilt, made of the same materials under the same lighting. The objects must not touch or overlap. Leave a wide band of empty background between them and at least 40 pixels of empty background around each one.
```

## headerSign — panel

```
OBJECT: one combined sign. TOP PART (about the upper 55% of its height): the word "DotDuel" in the theme's lettering treatment, bold, chunky, rounded, very legible, exactly the seven characters D-o-t-D-u-e-l, correctly spelled. BOTTOM PART (about the lower 45%): directly beneath the lettering and joined to it, a wide, smooth, flat recessed panel whose inner surface is COMPLETELY EMPTY — plain, dark, evenly lit base material, no text, symbols, ornaments or glow — covering about 80% of the sign's width and tall enough for two lines of text. Slim, simple frame around the panel; the crest above stays the hero. It must read as ONE object, not two stacked signs. Overall aspect about 2.2:1.
```

## menuButton — stretch (process with `:stretch`)

```
OBJECT: a wide menu button. A single wide, low, horizontal button plate with gently rounded ends, exactly 6:1 proportions. It will be stretched horizontally in code, so:
- DECORATED ENDS: the left 12% and right 12% of its width are the only places with decoration. Each end has one small ornament in the theme's style and one cabochon or accent piece. The two ends mirror each other.
- PLAIN MIDDLE: the central 76% is completely plain and uniform from left to right: the theme's base material with only a very faint texture that looks the same everywhere. No ornaments, gems, knots, bright spots, text or symbols in the middle.
- LONG EDGES: the top and bottom edges are one thin, simple raised rim running perfectly straight along the whole length, identical everywhere, with a highlight on top and a soft shadow below. Shallow, no carving.
- The middle stays dark enough that light cream text on it is very easy to read. A subtle accent glow along the top rim is allowed.
```

## pillButton — stretch (process with `:stretch`)

```
OBJECT: a small pill button. A single fully rounded pill, exactly 3:1 proportions. It will also be stretched horizontally in code:
- DECORATED ENDS: the left 15% and right 15% each hold one tiny accent piece (pearl or gem) and nothing else, mirrored.
- PLAIN MIDDLE: the central 70% is completely plain, uniform base material with only a very faint texture that looks identical everywhere.
- RIM: one thin, simple raised rim runs evenly around the whole pill, highlight on top, soft shadow underneath. Quieter and simpler than the menu button, but clearly from the same set.
```

## Follow-ups when Gemini drifts

- Decorated middle: "Keep the ends exactly as they are, but make the middle plain and uniform, identical from left to right."
- Objects fused: "Exactly N separate objects with magenta between them."
- Wrong proportions: "Make it much wider and lower, exactly 6 to 1." (Painted proportions matter less than plain middles — only the middle stretches.)

## primaryButton — stretch (process with `:stretch`)

```
OBJECT: a PRIMARY action button, the most important button in the game. A wide, low, horizontal plate with gently rounded ends, exactly 6:1 proportions. Same construction as the menu button but clearly more important: inlaid with the theme's bright accent material, glowing softly from within, with a bright rim. DECORATED ENDS only in the left 12% and right 12% (small ornament + one large accent piece, mirrored). PLAIN MIDDLE (central 76%) completely plain and uniform, so dark text on it is easy to read. LONG EDGES: one thin, straight, simple rim, identical along the whole length.
```

## cardFrame — nine-slice (process with `:nine`)

```
OBJECT: an empty CARD FRAME, a tall rectangular panel with softly rounded corners, about 3:4. It will be stretched in BOTH directions (nine-slice): decoration ONLY inside each of the four corners, within the outer 15% of width and height, mirrored; between the corners all four edges are one thin, simple, straight raised rim, perfectly uniform; the centre is completely plain, very dark base material with only a faint uniform texture. No text, symbols, ornaments or glow inside.
```

## titleBanner — stretch (process with `:stretch`)

```
OBJECT: a TITLE BANNER for screen headings, a slim horizontal carved ribbon or plaque, exactly 5:1. DECORATED ENDS only in the left 15% and right 15% (small leaves + one tiny accent, mirrored). PLAIN MIDDLE completely plain, uniform base material, so light text on it is easy to read. Straight, simple long edges.
```
