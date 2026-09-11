# Forest & Pearl Art Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the 36 Gemini-rendered Forest & Pearl art assets (already processed and saved to `public/art/forest-pearl/`) into the live game, replacing the procedural CSS/SVG rendering for this one theme only — every other theme keeps its current rendering untouched.

**Architecture:** Every change is gated behind "is the active theme Forest & Pearl" — in React components via a `theme === 'forest-pearl'` check (or `theme` left undefined for call sites that don't thread it), in pure-CSS spots via the existing `:root` (default) / `[data-theme="…"]` convention. Nothing is deleted: the original procedural rendering stays in place as the code path used by every other theme, and as the safe fallback if an image asset is ever missing. Board geometry (dot positions, line endpoints/angles/lengths) is unchanged — only what gets *drawn* at those computed positions changes.

**Tech Stack:** React 18 + TypeScript (strict) + Vite, inline SVG board, plain CSS (no framework). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-11-forest-pearl-visual-reskin-design.md` and `docs/superpowers/specs/2026-09-11-forest-pearl-gemini-prompts.txt`

## Global Constraints

- Every other theme (7 of 8) must render pixel-identical to before this work — verify by switching themes in Settings and confirming no visual change outside Forest & Pearl.
- Board SVG performance guardrails from `CLAUDE.md` still apply: no per-element count that grows with game progress beyond what already exists (dots/lines already scale with board size — we are only changing how each is *painted*, not adding new elements per game state), no new `mix-blend-mode`, no new `feGaussianBlur` stacked per-element.
- `body { overflow: hidden }` and the 320px-viewport rule must still hold after the background-image change (Task 4).
- This codebase has no component/visual test framework — `npm run build` (strict `tsc`) is the automated check for every task; the actual visual correctness check is running `npm run dev` and looking at the real board/panels/menu, per task. This replaces the "write a failing test" step from the standard task template — noted once here so it isn't repeated as a caveat in every task.
- **Explicitly deferred, not part of this plan:** the two `button-normal.png`/`button-pressed.png` assets. They were painted as a labeled-CTA button shape (~1.08:1 rounded rect with a flat label area) and there is no existing button in the app that shape fits well — `.btn-back` is a 40px icon-only square, and other buttons are full-width pills. Forcing the art onto a mismatched shape would look worse than the current design. They stay saved in `public/art/forest-pearl/` for a future task once a matching button design exists. Flagging this now rather than silently skipping it.
- **Also deferred:** `Menu.tsx`'s difficulty-picker icons (they reuse `AIAvatar` too, but threading `theme` into `Menu.tsx` is out of scope here — small icons were already flagged as deferred in the design doc).

---

### Task 1: Dots — Board.tsx

**Files:**
- Modify: `src/components/Board.tsx`

**Interfaces:**
- Consumes: nothing new from other tasks.
- Produces: a `theme?: ThemeId` prop on `Board`, which Task 3 (felt) and Task 2 (lines) also read from the same component — defined once in this task.

- [ ] **Step 1: Add the `theme` prop and the `useForestArt` flag**

In `src/components/Board.tsx`, add the import and extend `Props`:

```ts
import type { ThemeId } from '../theme';
```

```ts
interface Props {
  state: GameState;
  onDotClick?: (dotId: number) => void;
  onClaimClick?: (lineId: string) => void;
  disabled?: boolean;
  lastDot?: number | null;
  colorSwap?: boolean;
  showHints?: boolean;
  scoreEvent?: ScoreEvent | null;
  theme?: ThemeId;
}
```

Change the `Board` function signature (starts line 185) from:

```ts
export function Board({
  state,
  onDotClick,
  onClaimClick,
  disabled,
  lastDot,
  colorSwap = false,
  showHints = false,
  scoreEvent = null,
}: Props) {
```

to:

```ts
export function Board({
  state,
  onDotClick,
  onClaimClick,
  disabled,
  lastDot,
  colorSwap = false,
  showHints = false,
  scoreEvent = null,
  theme,
}: Props) {
```

Then, right after `const t = useT();` (line 195), add:

```ts
const useForestArt = theme === 'forest-pearl';
```

- [ ] **Step 2: Render dot art on top of colored dots**

Inside the `board.dots.map((d) => { ... })` block (starts line 452), the existing highlight ellipse is:

```tsx
{showHighlight && (
  <ellipse
    cx={d.x - hlDx}
    cy={d.y - hlDy}
    rx={hlRx}
    ry={hlRy}
    fill="url(#dot-highlight)"
    style={{ pointerEvents: 'none' }}
  />
)}
```

Replace that block with:

```tsx
{useForestArt && ownerColor && (
  <image
    href={`/art/forest-pearl/dot-p${ownerColor}.png`}
    x={d.x - dotRadius}
    y={d.y - dotRadius}
    width={dotRadius * 2}
    height={dotRadius * 2}
    style={{ pointerEvents: 'none' }}
    aria-hidden="true"
  />
)}
{showHighlight && !useForestArt && (
  <ellipse
    cx={d.x - hlDx}
    cy={d.y - hlDy}
    rx={hlRx}
    ry={hlRy}
    fill="url(#dot-highlight)"
    style={{ pointerEvents: 'none' }}
  />
)}
```

This draws the art image directly on top of the existing (unchanged) gradient circle — the circle still handles all click/focus/keyboard/aria behavior exactly as before, the image is purely decorative (`pointerEvents: 'none'`) and opaque, so it visually replaces the flat gradient without touching any interaction code. `ownerColor` is already computed a few lines above (`const ownerColor = owner ? colorIndex(owner, colorSwap) : null;`) — this reuses it.

- [ ] **Step 3: Verify**

Run `npm run build` — must be green (strict TS: `ownerColor` is `1 | 2 | null`, the `ownerColor &&` guard narrows it correctly for the template string).

Run `npm run dev`, open the app, and if the active theme isn't already Forest & Pearl, switch to it via Settings → Theme. Start a Hot-seat Triangle game, place a dot for each player, and confirm: a glossy green orb appears for P1, a glossy pearl orb for P2, both correctly positioned on the dot's grid location, and clicking/keyboard-navigating dots still works exactly as before.

- [ ] **Step 4: Commit**

```bash
git add src/components/Board.tsx
git commit -m "feat(forest-pearl): render painted orb art for placed dots"
```

---

### Task 2: Strings of light — Board.tsx

**Files:**
- Modify: `src/components/Board.tsx`

**Interfaces:**
- Consumes: `useForestArt` from Task 1 (same file, same component scope).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Replace the completed-line rendering**

The existing block (starts line 607, `{state.completed.map((c) => { ... })}`) is:

```tsx
{state.completed.map((c) => {
  const line = linesById.get(c.lineId);
  if (!line) return null;
  const { x1, y1, x2, y2 } = lineEndpoints(board, line, overshoot);
  const outer = strokeWidth * 0.575;
  const innerHighlight = strokeWidth * 0.22;
  const cIdx = colorIndex(c.player, colorSwap);
  return (
    <g
      key={c.lineId}
      className={`crossline-group crossline-group-p${cIdx}`}
      style={{ pointerEvents: 'none' }}
    >
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        className={`crossline crossline-p${cIdx}`}
        strokeLinecap="round"
        strokeWidth={outer}
      />
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        className={`crossline-inner crossline-inner-p${cIdx}`}
        strokeLinecap="round"
        strokeWidth={innerHighlight}
      />
    </g>
  );
})}
```

Replace the `return (...)` inside that `.map` with:

```tsx
  if (useForestArt) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const len = Math.hypot(x2 - x1, y2 - y1);
    const angleDeg = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
    const lineImgH = strokeWidth * 3.4;
    return (
      <g
        key={c.lineId}
        transform={`translate(${midX} ${midY}) rotate(${angleDeg})`}
        style={{ pointerEvents: 'none' }}
      >
        <image
          href={`/art/forest-pearl/line-${line.length}-p${cIdx}.png`}
          x={-len / 2}
          y={-lineImgH / 2}
          width={len}
          height={lineImgH}
          preserveAspectRatio="none"
          aria-hidden="true"
        />
      </g>
    );
  }
  return (
    <g
      key={c.lineId}
      className={`crossline-group crossline-group-p${cIdx}`}
      style={{ pointerEvents: 'none' }}
    >
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        className={`crossline crossline-p${cIdx}`}
        strokeLinecap="round"
        strokeWidth={outer}
      />
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        className={`crossline-inner crossline-inner-p${cIdx}`}
        strokeLinecap="round"
        strokeWidth={innerHighlight}
      />
    </g>
  );
```

(Everything above the `if (useForestArt)` — the `const line = ...`, `lineEndpoints`, `outer`, `innerHighlight`, `cIdx` — is unchanged from the original, it's only the final `return` that branches.)

`preserveAspectRatio="none"` deliberately stretches the art to match the exact on-screen distance between the two dots — per the design spec, an exact endpoint connection matters more than preserving the source art's native proportions, and the mismatch is mild. `line.length` is always 1-9 (confirmed against `src/geometry.ts` during design — every line on every board shape falls in that range), matching the 9 generated lengths exactly, no clamping needed.

- [ ] **Step 2: Verify**

Run `npm run build`. Then in the dev server, play a Hot-seat Triangle game to completion of at least one line (e.g. fill a full row of 8) and one corner (length-1 apex). Confirm: the corner shows the small spark art, longer lines show the elongated glowing strand stretched to the right length, in the right color, at the right angle (test at least one horizontal and one diagonal line), and claiming a pending line still works (click behavior is on the dots, untouched by this task).

- [ ] **Step 3: Commit**

```bash
git add src/components/Board.tsx
git commit -m "feat(forest-pearl): render string-of-light art for completed lines"
```

---

### Task 3: Board surface (felt) — Board.tsx

**Files:**
- Modify: `src/components/Board.tsx`

**Interfaces:**
- Consumes: `useForestArt`, `vbExp` (already computed in the component).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add the felt-image pattern to `<defs>`**

Inside the existing `<defs>` block (starts line 346), after the `board-felt` `radialGradient` (ends line 388), add:

```tsx
<pattern
  id="board-felt-image"
  patternUnits="userSpaceOnUse"
  x={vbExp.x}
  y={vbExp.y}
  width={vbExp.w}
  height={vbExp.h}
>
  <image
    href="/art/forest-pearl/felt-base.png"
    x="0"
    y="0"
    width={vbExp.w}
    height={vbExp.h}
    preserveAspectRatio="xMidYMid slice"
  />
</pattern>
```

This covers whichever board shape's bounding box with the one felt texture, cropped-to-fill (never stretched) via `slice` — the same single image works for Triangle, Square, Rectangle, and Rhombus without needing four separate patterns.

- [ ] **Step 2: Use the pattern for the felt fill**

There are two `<path d={feltPathOuter} fill="url(#board-felt)" .../>` elements (the "1. Drop shadow" path at line ~421 and the "2. Felt fill + recessed inner shadow" path at line ~428 — both reference `fill="url(#board-felt)"`). Change both to:

```tsx
fill={useForestArt ? 'url(#board-felt-image)' : 'url(#board-felt)'}
```

Leave the drop-shadow `style={{ filter: 'var(--rim-drop)' }}` and the `filter="url(#felt-recess)"` on the second path exactly as they are — only the fill source changes. The dark contact band and lit inner facet (paths 3 and 4, right after) are unchanged — they draw the bevel edge, not the felt itself.

- [ ] **Step 3: Verify**

Run `npm run build`. In the dev server, load each of the four board shapes (Triangle, Square, Rectangle, Rhombus — via Hot-seat mode's shape picker) with Forest & Pearl active, and confirm the mossy texture fills each board shape's interior cleanly, cropped to the shape's outline with no visible seam or distortion, and that placed dots/lines (Tasks 1-2) still read clearly against it.

- [ ] **Step 4: Commit**

```bash
git add src/components/Board.tsx
git commit -m "feat(forest-pearl): use painted forest-floor texture for the board surface"
```

---

### Task 4: Ambient background scenery — pure CSS

**Files:**
- Modify: `src/styles.css`

**Interfaces:** none (pure CSS, no component changes).

- [ ] **Step 1: Add the themed background rules**

In `src/styles.css`, the existing `body` rule (line 624) is:

```css
body {
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 38%, var(--bg-center) 0%, var(--bg-edge) 78%),
    #000;
  background-attachment: fixed;
}
```

Directly after that rule (before the `body::before` film-grain rule that follows it), add:

```css
/* Forest & Pearl only: painted scenery behind the vignette. Two crops (the
   app has no way to test real device orientation at build time) picked by
   viewport aspect ratio, not by device type. Layered UNDER the existing
   radial-gradient vignette so the vignette's darkening toward the edges
   still applies on top of the art, keeping foreground UI legible — and the
   film-grain overlay (body::before, z-index 1) still draws over everything,
   unifying art + vignette into one image exactly as it already did for the
   plain gradient. */
html:not([data-theme]) body,
html[data-theme="forest-pearl"] body {
  background:
    radial-gradient(ellipse at 50% 38%, transparent 0%, var(--bg-edge) 92%),
    url('/art/forest-pearl/background-landscape.png') center / cover no-repeat,
    #000;
  background-attachment: fixed;
}

@media (max-aspect-ratio: 4/5) {
  html:not([data-theme]) body,
  html[data-theme="forest-pearl"] body {
    background:
      radial-gradient(ellipse at 50% 38%, transparent 0%, var(--bg-edge) 92%),
      url('/art/forest-pearl/background-portrait.png') center / cover no-repeat,
      #000;
    background-attachment: fixed;
  }
}
```

The vignette gradient's center stop changes from `var(--bg-center)` to `transparent` in this override — with the art now providing the scenery, an opaque green center would just hide the middle of the picture; keeping the edge-darkening (`var(--bg-edge)` at 92%) preserves the "content fades to black at the screen edges" effect that makes foreground panels/board readable.

- [ ] **Step 2: Verify**

Run `npm run build` (CSS-only change, this mainly confirms nothing else broke). In the dev server with Forest & Pearl active, resize the browser window to a narrow/tall shape (or use DevTools device emulation at 320×568, per the project's iPhone-SE hard rule) and confirm the portrait art shows and nothing overflows the viewport (`body { overflow: hidden }` already prevents scrolling — confirm no horizontal/vertical scrollbar appears). Widen the window past a landscape aspect ratio and confirm it switches to the landscape art. Switch to a different theme (e.g. Royal Court) and confirm the background reverts to the original plain gradient — the new rules must not leak into other themes.

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "feat(forest-pearl): painted forest scenery behind the vignette"
```

---

### Task 5: Avatars — SidePanel.tsx

**Files:**
- Modify: `src/components/SidePanel.tsx`
- Modify: `src/App.tsx` (4 call sites)

**Interfaces:**
- Consumes: the `theme` state already declared in `App.tsx` (`const [theme, setThemeState] = useState<ThemeId>(loadTheme);` at line 289).
- Produces: an optional `theme?: ThemeId` param on the exported `AIAvatar` function — `Menu.tsx`'s existing call (`<AIAvatar level={d} />`, no `theme`) keeps compiling and keeps its current procedural rendering unchanged, since `theme` defaults to not-forest-pearl behavior when omitted.

- [ ] **Step 1: Thread `theme` through `SidePanelProps`**

In `src/components/SidePanel.tsx`, add the import and prop:

```ts
import type { ThemeId } from '../theme';
```

Add `theme?: ThemeId;` to `SidePanelProps` (after `avatar: ...` around line 27):

```ts
interface SidePanelProps {
  side: 'left' | 'right';
  player: Player;
  active: boolean;
  thinking?: boolean;
  name: string;
  score: number;
  rating?: string;
  ratingSlot?: ReactNode;
  avatar: 'human' | { kind: 'ai'; level: Difficulty } | { kind: 'guest'; label: string };
  theme?: ThemeId;
  colorSwap?: boolean;
  stats?: PlayerRow | null;
  belowAvatar?: ReactNode;
  featured?: { icon: string; tier?: number; title: string } | null;
  onFeaturedClick?: () => void;
}
```

Change the `SidePanel` function signature (lines 44-59) from:

```ts
export function SidePanel({
  side,
  player,
  active,
  thinking,
  name,
  score,
  rating,
  ratingSlot,
  avatar,
  colorSwap = false,
  stats,
  belowAvatar,
  featured,
  onFeaturedClick,
}: SidePanelProps) {
```

to:

```ts
export function SidePanel({
  side,
  player,
  active,
  thinking,
  name,
  score,
  rating,
  ratingSlot,
  avatar,
  theme,
  colorSwap = false,
  stats,
  belowAvatar,
  featured,
  onFeaturedClick,
}: SidePanelProps) {
```

- [ ] **Step 2: Pass `theme` to the avatar components**

Change the avatar-rendering block (lines 85-93):

```tsx
<div className="avatar-frame">
  {avatar === 'human' ? (
    <HumanAvatar player={color} />
  ) : avatar.kind === 'guest' ? (
    <GuestAvatar label={avatar.label} player={color} />
  ) : (
    <AIAvatar level={avatar.level} />
  )}
</div>
```

to:

```tsx
<div className="avatar-frame">
  {avatar === 'human' ? (
    <HumanAvatar player={color} theme={theme} />
  ) : avatar.kind === 'guest' ? (
    <GuestAvatar label={avatar.label} player={color} />
  ) : (
    <AIAvatar level={avatar.level} theme={theme} />
  )}
</div>
```

(`GuestAvatar` is intentionally left alone — there's no guest-specific art asset, guests keep the existing procedural figure regardless of theme.)

- [ ] **Step 3: Swap in art inside `AIAvatar` and `HumanAvatar`**

Change (around line 301):

```tsx
export function AIAvatar({ level }: { level: Difficulty }) {
  const t = useT();
  const label = t.sidePanel.aiLabel(t.difficulty[level]);
  switch (level) {
    case 1:
      return <RobotL1 label={label} />;
    case 2:
      return <RobotL2 label={label} />;
    case 3:
      return <RobotL3 label={label} />;
    case 4:
      return <RobotL4 label={label} />;
    case 5:
      return <RobotL5 label={label} />;
  }
}
```

to:

```tsx
export function AIAvatar({ level, theme }: { level: Difficulty; theme?: ThemeId }) {
  const t = useT();
  const label = t.sidePanel.aiLabel(t.difficulty[level]);
  if (theme === 'forest-pearl') {
    return (
      <img
        src={`/art/forest-pearl/avatar-l${level}.png`}
        className="avatar-img"
        alt={label}
      />
    );
  }
  switch (level) {
    case 1:
      return <RobotL1 label={label} />;
    case 2:
      return <RobotL2 label={label} />;
    case 3:
      return <RobotL3 label={label} />;
    case 4:
      return <RobotL4 label={label} />;
    case 5:
      return <RobotL5 label={label} />;
  }
}
```

Find the `HumanAvatar` function (around line 229, `function HumanAvatar({ player }: { player: Player }) {`) and change its signature and add the same branch:

```tsx
function HumanAvatar({ player, theme }: { player: Player; theme?: ThemeId }) {
  if (theme === 'forest-pearl') {
    return (
      <img src="/art/forest-pearl/avatar-human.png" className="avatar-img" alt="" aria-hidden="true" />
    );
  }
  const fg = player === 1 ? 'var(--avatar-p1-fg)' : 'var(--avatar-p2-fg)';
  // ...existing SVG body unchanged below this point
```

(Keep the rest of the existing function body — the `const fg = ...` line and everything after it — exactly as-is; only the new early-return branch and the signature are new.)

- [ ] **Step 4: Add the `.avatar-img` CSS rule**

In `src/styles.css`, find the existing `.avatar-svg` rule (used by the procedural SVG avatars — search for `.avatar-svg` to find its selector block) and add a sibling rule right after it:

```css
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
```

This makes the `<img>` fill the same `.avatar-frame` box the SVGs already fill, matching size.

- [ ] **Step 5: Pass `theme` at all 4 `<SidePanel>` call sites in App.tsx**

In `src/App.tsx`, there are four `<SidePanel ... />` usages (around lines 2260, 2289, 2869, 2891). Add `theme={theme}` as a prop at each one (the `theme` state variable declared at line 289 is already in scope at all four, since they're all inside the same `App` component).

- [ ] **Step 6: Verify**

Run `npm run build`. In the dev server with Forest & Pearl active: start a Vs AI game at each difficulty L1-L5 and confirm the matching painted robot portrait shows in the opponent's side panel; start a Hot-seat game and confirm the glowing human figure shows for both player panels. Switch to a different theme and confirm the panels revert to the procedural SVG robots/figure. Also open the Menu's difficulty picker and confirm those icons are unchanged (still the procedural SVGs) — this is the intentionally-deferred `Menu.tsx` case from the Global Constraints section, so seeing the old art there is correct, not a bug.

- [ ] **Step 7: Commit**

```bash
git add src/components/SidePanel.tsx src/App.tsx src/styles.css
git commit -m "feat(forest-pearl): render painted avatar portraits in side panels"
```

---

### Task 6: Victory celebration particle sprites — WinCelebration.tsx

**Files:**
- Modify: `src/components/WinCelebration.tsx`

**Interfaces:** none (self-contained; reads the active theme directly from the DOM, matching the existing `themePalette()` function's own pattern in this same file — using the same mechanism the file already uses, not inventing a second one).

- [ ] **Step 1: Preload the four particle sprites and branch on theme**

Near the top of the `useEffect` in `WinCelebration` (right after `const lvl = ...` / `const SHOW_MS = ...`, around line 68-69), add:

```ts
const isForestPearl = document.documentElement.dataset.theme === 'forest-pearl'
  || document.documentElement.dataset.theme === undefined;
const spritePaths = [
  '/art/forest-pearl/particle-spark.png',
  '/art/forest-pearl/particle-leaf.png',
  '/art/forest-pearl/particle-pearl.png',
  '/art/forest-pearl/particle-firefly.png',
];
const sprites = isForestPearl ? spritePaths.map((src) => {
  const img = new Image();
  img.src = src;
  return img;
}) : [];
const pickSprite = () => sprites[(Math.random() * sprites.length) | 0];
```

(`document.documentElement.dataset.theme === undefined` covers the default/no-attribute case, same as the `:root:not([data-theme])` convention used in CSS — Forest & Pearl is the default theme and doesn't get an explicit attribute until a player changes it at least once.)

- [ ] **Step 2: Draw confetti as sprites instead of flat rectangles when Forest & Pearl is active**

The confetti-drawing loop (around line 157-167) currently is:

```ts
for (let i = confetti.length - 1; i >= 0; i--) {
  const c = confetti[i];
  c.y += c.vy; c.x += Math.sin(t * c.sway + c.phase) * 1.3 * c.z * DPR; c.rot += c.vrot;
  ctx.save();
  ctx.translate(c.x, c.y); ctx.rotate(c.rot);
  ctx.globalAlpha = 0.92; ctx.fillStyle = c.color;
  const sq = 0.35 + Math.abs(Math.sin(t * c.sway + c.phase)) * 0.65;
  ctx.fillRect((-c.w / 2) * sq, -c.h / 2, c.w * sq, c.h);
  ctx.restore();
  if (c.y > H + 30) confetti.splice(i, 1);
}
```

Change the drawing portion (keep the physics — `c.y +=`, `c.x +=`, `c.rot +=` — exactly as-is) to:

```ts
  ctx.save();
  ctx.translate(c.x, c.y); ctx.rotate(c.rot);
  ctx.globalAlpha = 0.92;
  const sq = 0.35 + Math.abs(Math.sin(t * c.sway + c.phase)) * 0.65;
  if (isForestPearl && c.sprite) {
    const w = c.w * sq * 2.2;
    const h = c.h * 2.2;
    ctx.drawImage(c.sprite, -w / 2, -h / 2, w, h);
  } else {
    ctx.fillStyle = c.color;
    ctx.fillRect((-c.w / 2) * sq, -c.h / 2, c.w * sq, c.h);
  }
  ctx.restore();
```

(The `2.2` size multiplier compensates for the sprite images including their own soft glow margin, unlike the flat `fillRect` — tune this by eye in Step 4 if particles read too small/large on screen.)

- [ ] **Step 3: Give each `Confetto` an assigned sprite**

Add `sprite?: HTMLImageElement;` to the `Confetto` interface (near the top of the file, around line 47-50):

```ts
interface Confetto {
  x: number; y: number; z: number; w: number; h: number; color: string;
  vy: number; sway: number; phase: number; rot: number; vrot: number;
  sprite?: HTMLImageElement;
}
```

In the `rain` function (around line 106-116), where each `Confetto` is pushed, add `sprite: isForestPearl ? pickSprite() : undefined,` to the pushed object:

```ts
const rain = (set: string[], count: number) => {
  for (let i = 0; i < count; i++) {
    const z = rnd(0.5, 1.2);
    confetti.push({
      x: rnd(0, W), y: rnd(-H * 0.4, -10), z,
      w: rnd(5, 10) * z * DPR, h: rnd(8, 16) * z * DPR, color: pick(set),
      vy: rnd(1.5, 3.2) * z * DPR, sway: rnd(0.6, 1.6),
      phase: rnd(0, Math.PI * 2), rot: rnd(0, Math.PI * 2), vrot: rnd(-0.12, 0.12),
      sprite: isForestPearl ? pickSprite() : undefined,
    });
  }
};
```

- [ ] **Step 4: Verify**

Run `npm run build` (the `Confetto.sprite` field is optional, so this must type-check cleanly against the existing `pick(set)`-only construction sites — there are none besides `rain`, so no other edits needed). In the dev server with Forest & Pearl active, win a Vs AI game (any difficulty) and watch the GameOver celebration: confirm sprites (leaves/pearls/sparks/fireflies) fall instead of flat rectangles, sized reasonably (adjust the `2.2` multiplier from Step 2 if they look too small or too large), and that the shell/burst spark effects (unchanged, still flat colors) still layer correctly underneath. Switch to a different theme and win again — confirm celebration reverts to the original flat-rectangle confetti.

- [ ] **Step 5: Commit**

```bash
git add src/components/WinCelebration.tsx
git commit -m "feat(forest-pearl): use painted particle sprites in the victory celebration"
```

---

### Task 7: Side panel texture — pure CSS

**Files:**
- Modify: `src/styles.css`

**Interfaces:** none (pure CSS).

- [ ] **Step 1: Add the themed panel background**

Find the existing `.side-panel {` rule (`src/styles.css:1805`). Directly after that rule block closes, add:

```css
/* Forest & Pearl only: the panel-texture.png asset is a "9-slice" style
   image — a plain, calm vertical middle with carved detail concentrated at
   the top and bottom edges (see docs/superpowers/specs/2026-09-11-forest-
   pearl-visual-reskin-design.md, section 7). border-image with `fill` is
   the native CSS mechanism for exactly this: the top/bottom slices stay
   crisp at their source resolution while the middle stretches to whatever
   height a given panel actually needs, so one image works for every panel
   regardless of how much content (stats, ratings, achievement badges) it's
   showing. The slice values are a starting point — check them against the
   live panel in the dev server and adjust if the carved band looks cropped
   or the plain middle looks too short. */
html:not([data-theme]) .side-panel,
html[data-theme="forest-pearl"] .side-panel {
  border-image: url('/art/forest-pearl/panel-texture.png') 340 0 340 0 fill;
  border-image-width: auto;
  border-style: solid;
  border-width: 20px 0;
}
```

- [ ] **Step 2: Verify**

Run `npm run build`. In the dev server with Forest & Pearl active, open any screen showing side panels (Vs AI or Hot-seat game screen) and confirm the carved leaf/vine motif appears at the top and bottom of each panel with a calm textured middle, without pushing the panel's content around or breaking the panel's existing width/active-state glow styling (`.side-panel.active::after` etc., untouched by this rule). Check at 320px width per the project's iPhone-SE hard rule — confirm nothing overflows. If the top/bottom carved band looks squashed or the plain middle looks too thin, adjust the `340` slice values (in source-image pixels, out of the asset's 1376px height) and re-check. Switch to a different theme and confirm panels revert to their normal (non-textured) background.

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "feat(forest-pearl): carved panel texture on side panels"
```

---

## Final full-pass check (after all 7 tasks)

- [ ] Run `npm run build` once more — full strict build, green.
- [ ] Run `npm run simulate:l4` and `npm run simulate:square` per `CLAUDE.md`'s sanity checklist — these only exercise `game.ts`/`ai.ts` logic, untouched by this plan, but are cheap to confirm nothing was accidentally broken.
- [ ] In the dev server, play one full game start-to-finish on each of the 4 board shapes with Forest & Pearl active, confirm no console errors, and confirm the GameOver celebration + victory card still render correctly (victory-card rendering, `src/share/`, is untouched by this plan but worth a glance since it also reads theme colors).
- [ ] Switch through all 8 themes once each and confirm only Forest & Pearl looks different from before this plan — every other theme must be visually identical to `main`.
- [ ] Bump `src/version.ts` + `src/changelog.ts` per `CLAUDE.md` convention for user-visible changes (changelog wording is user-owned — draft it and flag for the user's review rather than finalizing the copy yourself).
