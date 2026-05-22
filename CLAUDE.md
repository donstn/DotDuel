# DotDuel

A two-player dot-coloring strategy game. Players take turns coloring dots on a geometric board; lines (horizontal / vertical / diagonal runs of dots) score points when all their dots are filled, but the scoring rule is **biggest-only with pending claims** (see Game Rules below). Game ends when every dot is colored AND every completed line has been claimed; higher total score wins.

Live staging: **https://donstn.github.io/DotDuel/** (auto-deployed from `main` via `.github/workflows/deploy.yml`). Production domain **www.dotduel.com** is pending.

Notable changes are tracked in `CHANGELOG.md` at the repo root.

---

## Tech stack

- **React 18** + **Vite 5** + **TypeScript** (strict mode)
- SVG board (auto-scales via `viewBox`)
- **localStorage** for progression (no backend yet)
- `tsx` for headless simulation scripts (dev-only)
- No runtime UI framework

## Running it

```powershell
npm install
npm run dev              # http://localhost:5173
npm run build            # production bundle in ./dist
npm run preview          # serve the production build
npm run simulate         # 4×4 AI matrix on triangle (research)
npm run simulate:l4      # L5 vs L5 on all shapes (N=1000)
npm run simulate:f       # Standalone Variant F balance check
npm run simulate:square  # 50-game L5 vs L5 square integrity check
npm run simulate:tri8    # Triangle-8 prototype
```

TypeScript is checked as part of `npm run build` (`tsc -b`).

**Deploy.** Every `git push origin main` triggers the GitHub Pages workflow (`.github/workflows/deploy.yml`): `npm ci` → `npm run build` → publish `dist/` to Pages. Vite's `base` is set to `/DotDuel/` for builds only so production asset paths resolve under the `donstn.github.io/DotDuel/` subpath; dev still serves from `/`.

---

## File layout

```
src/
  main.tsx                  React entry
  App.tsx                   Screen state machine (menu ↔ game), AI scheduler, win recording, popover state
  types.ts                  Shared types: GameState, GameAction, ShapeId, Difficulty, DIFFICULTY_LABELS
  geometry.ts               Board generation: dot coordinates + line buckets per shape
  game.ts                   Pure game logic: applyMove, applyClaim, applyAction, pointsIfPlayed
  ai.ts                     5-tier AI: pickAIAction returns a dot or claim action
  storage.ts                localStorage: progression + settings + per-name W/D/L stats
  styles.css                Glass theme, side panels, board, animations, responsive layout
  components/
    Menu.tsx                Mode/shape/difficulty pickers, name inputs, Rankings entry
    Board.tsx               SVG defs (gradients/filters) + 3D dots + strike rendering + click handling
    SidePanel.tsx           Avatar + name + rating + score (horizontal cards on mobile, side columns on desktop). Includes AI robot SVGs.
    GameOver.tsx            Final scores, unlock banner, play-again
    AppFooter.tsx           Frosted footer bar (Rules / Settings shortcuts; menu screens only)
    RulesPopover.tsx        Glass-card popover with player-facing rules
    SettingsPopover.tsx     Name editing, hot-seat color swap, reset progress, etc.
    RankingsPopover.tsx     Per-player stats + head-to-head + profile-delete confirm
    TutorialPopover.tsx     First-time onboarding card (gated by settings.tutorialSeen)
scripts/
  simulate.ts               4×4 AI matrix simulation
  simulate-l4.ts            L5 vs L5 across shapes (N=1000)
  simulate-variant-f.ts     Standalone rule-variant prototype (kept for reference)
  simulate-square.ts        50-game L5 vs L5 square integrity check
  simulate-triangle8.ts     Triangle-8 prototype balance check
simulation-results.md       Accumulated balance data (committed)
CHANGELOG.md                Notable changes since 0.1.0 (Keep a Changelog format)
.github/workflows/deploy.yml  GitHub Pages deploy on push to main
```

`geometry.ts` is the single source of truth for what counts as a "line." Everywhere else iterates over `board.lines`.

---

## Game rules (definitive)

### Turn structure

Each turn the current player chooses **one** action:

1. **Place a dot** on any empty cell. — OR —
2. **Claim a pending line** (see scoring below). No dot placed.

Turn always passes after the action. No extra turns. P1 → P2 → P1 → … starting with P1.

### Scoring — "biggest-only + pending"

When you **place a dot** and it becomes the last unfilled dot of *one or more* lines:

- You score `line.length` points for the **single longest** of those lines.
- The other newly-completed lines become **pending**: their dots are all colored, but no one has scored them yet. They sit on the board silently (no visual indicator — see UI rules).

When you **claim a pending line**, you score its full `line.length` points and remove it from the pending pool.

A single move can only score one line directly; further value from the same move is parked as pending for whoever claims it next.

**Why this rule:** the simple "sum of all lines completed in one move" rule made the last-move player win ~99% of games at optimal play. Variant F removes that jackpot; pending claims dynamically rebalance parity. Empirical balance at L5 vs L5 is within ~1–3 average score points across all four shapes. See `simulation-results.md`.

### Minimum line length: 1

A length-1 "line" (a triangle apex, rhombus top/bottom, square or rectangle corner diagonal) scores 1 point. Corner strikes are visualized as a short stroke through the single dot, extending past it in that line's natural direction.

### Pending lines are claimable by either player

Pending is a shared pool. Whoever's turn it is may claim any pending line. There is no ownership reservation. In practice the player whose turn comes right after a multi-line completion gets first dibs, but the line stays available across many turns if no one claims it.

### Game end

Game ends when **all dots are colored AND `pending.length === 0`**.

If all dots are colored but pending lines remain, play continues — every subsequent turn is forced to be a claim. Players alternate claims until the pool empties.

Winner = higher total score. Equal scores = draw.

### Per-shape geometry

| Shape | Dots | Line directions | Total scoring lines | Total points (Σ length) |
|-------|------|-----------------|---------------------|--------------------------|
| Triangle (inverted, rows 8→1) | 36 | horizontal + 2 triangular-lattice diagonals | 24 | 108 |
| Square 7×7 | 49 | horizontal + vertical + 2 square diagonals | 40 | 196 |
| Rectangle 7 col × 9 row | 63 | horizontal + vertical + 2 square diagonals | 46 | 252 |
| Rhombus rows 1,2,3,4,5,6,5,4,3,2,1 | 36 | horizontal + 2 triangular-lattice diagonals | 23 | 108 |

Triangle and rhombus use a **triangular lattice** — only 3 line directions exist naturally; there is no vertical.

---

## UI rules

### Theme — Glass Orb

The entire app uses a **glassmorphism** treatment over a dark green vignette background (`#15291e` center → `#02090b` edges) with a subtle film-grain overlay. Cards, HUD, side panels, modals, footer are all `backdrop-filter: blur(...) saturate(...)` with thin gradient borders.

### Color palette (CVD-friendly)

| Token | Hex | Role |
|-------|-----|------|
| `--p1` / `--p1-glow` / `--p1-bright` | `#0d4a23` / `#1c7a3d` / `#62cf90` | Player 1 — dark green family |
| `--p2` / `--p2-glow` / `--p2-bright` | `#d3ecaa` / `#f0fbcf` / `#ffffff` | Player 2 — light cream-green family |
| `--accent` | `#7bdb95` | "Remaining points" highlight, link hover |
| `--glass-bg` / `--glass-border` | rgba whites | All glass surfaces |

P1 vs P2 are distinguishable by **luminance** alone (deep green vs near-white), playable under deuteranopia / protanopia.

### Layout — game screen

- **Top bar (slim)**: back-arrow, "X pts left" indicator centered with the "N lines to claim" badge directly below (always rendered — `visibility: hidden` when empty so the topbar height never shifts), `?` rules button on the right.
- **Body — responsive**:
  - **Desktop / wide viewports**: three columns — left side panel (P1) · board · right side panel (P2). Side panel width `clamp(86px, 22vw, 150px)`, vertical layout (avatar → name → stats → score → per-game points).
  - **Phone viewports (`max-width: 720px` or `(orientation: landscape) and (max-height: 500px)`)**: CSS grid stacks the two players as compact horizontal cards above the board so the board uses the full viewport width. Per-card stats / points-totals / rating are hidden in this layout (they remain in the Rankings popover). Landscape phones shrink the cards a further ~30%.
- **Side panel** content order: glass-framed avatar circle → player name → stats panel (per-difficulty AI W/D/L + hot-seat row) → rating slot (`—` until multiplayer) → score (large bold) → points-totals (scored / given averages).
- The **active player's panel** has a coloured glow border + inner shadow + a subtle 2.2 s `panelBreathe` filter pulse (brightness/saturation).
- The **AI's thinking indicator** (`···`) shows in the panel when `thinking` is true (450 ms `AI_DELAY_MS` before each AI move). On mobile the indicator is absolutely-positioned inside the card so it doesn't reflow the name/score when it appears.

### Dot rendering — 3D glass orbs

Each dot is a glassy 3D sphere built from:
- A radial gradient per role (`dot-p1`, `dot-p2`, `dot-empty`, `dot-empty-hover`) with off-center highlight (cx 35% / cy 28%).
- A small specular **highlight ellipse** painted on top-left of colored dots.
- A soft drop-shadow filter (Gaussian blur + offset) for grounding.

Empty dots are darker graphite-glass; brightness ticks up on hover.

### Strike (crossline) rendering

A scored or claimed line is rendered as a **two-line stack** in the player's color family, giving a 3D-ribbon look while keeping a single slim apparent width:

- **Outer base stroke** — player base tone (`#2b8a4c` for P1, `#c8c878` for P2), width `strokeWidth * 0.575`.
- **Inner highlight stripe** — bright tone (`#b8f5d3` for P1, `#ffffff` for P2), width `strokeWidth * 0.22`, blend mode `screen` so it reads as a glow on top.

Lines are rendered **after** dots (so they sit on top, pen-on-paper style) with `pointer-events: none` so the dots remain clickable through the strike.

Lines **overshoot** the first/last dot by 1/3 of dot diameter (push from center = `5R/3`). Length-1 corner lines are drawn as short strokes through the lone dot, oriented by the line's natural direction (sampled from another 2+ dot line of the same kind on the board).

### Pending lines — invisible by design (except for new-player hints)

- **No persistent visual indicator** for pending lines once the player is past the learning window. Pending dots look identical to ordinary colored dots.
- **Learning hints** (`showLearningHints = settings.gamesPlayed < 10 || settings.claimsMade < 3`): colored dots that belong to a pending line get a static soft yellow ring (`.dot-hint-ring`, `stroke-width: 0.08`, `opacity: 0.55`). **No animation** — the ring is intentionally flat so a busy board (e.g., the square at endgame with ~9 pending lines) never strobes. Once the player has played 10 games AND claimed 3 lines, hints disappear and the design returns to pure observation.

### Claiming pending lines

- Click any colored dot belonging to a pending line. The **longest** pending line through that dot is claimed. No menu, no second-click cycling.
- Cursor stays as the default arrow on colored dots (no hover hint that they're claimable).

### Animations

- Dot pop on placement: scale 0.5 → 1.08 → 1.0 over 380 ms (cubic-bezier overshoot). Origin is the dot's own centre (`transform-box: fill-box`).
- Strike appear: crossline group scale-fade-in over ~360 ms.
- Active-panel glow: subtle 2.2 s `panelBreathe` filter pulse (brightness/saturation).
- Thinking dots in AI panel: 1.4 s `dotsPulse`.
- **No infinite animations on board content** (hint ring is static, see above). Layout-shift sources are reserved away — `topbar-center` has `min-height: 44px` to absorb the pending badge, and mobile `thinking-dots` is `position: absolute` so the side card doesn't reflow.

### Rules popover

- Triggered from the menu footer ("Rules") or the in-game top bar ("?" button).
- Renders as a centered glass card over a dimmed/blurred backdrop.
- Closes on: backdrop click, ✕ button, or ESC.
- Body scrolls if content overflows on small screens.
- Available in **both** menu and active game so players can reference rules without leaving the game.

### Menu footer

`AppFooter.tsx` renders a frosted glass bar shown on menu screens (and also during gameplay — its `onOpenRules` / `onOpenSettings` callbacks are the only way to reach Settings mid-game). Currently holds: `DotDuel © 2026` · **Rules** · **Settings**. Privacy / Contact links will be added when GDPR copy is ready (see *Deferred → Legal footer*).

---

## AI design (`ai.ts`)

The AI plays as Player 2 in vs-AI mode. All levels share `availableActions(state, board)` (dots + claims) and the `pointsIfPlayed` / `applyAction` primitives in `game.ts`.

### Level 1 — Beginner (`pickPureRandomAction`)

- Picks any available action (any uncolored dot OR any pending line) uniformly at random.
- **Zero strategy.** Will happily ignore a free 7-point completion.
- Floor of the difficulty range.

### Level 2 — Easy (`pickEasyAction`)

- Picks "obvious" moves; otherwise random.
- An action is obvious if it either:
  - Closes a **1-dot corner**, or
  - Scores **≥ 5 points** immediately.
- Mid-size gains (2–4 points) are ignored and treated as random fodder.
- Casual-player profile: notices the very-obvious moves, misses everything else.

### Level 3 — Medium (`pickGreedyOrRandomAction`)

- Computes immediate gain of every action.
- If any action gains > 0, picks the highest. Ties broken by shuffle.
- Otherwise random.
- Always grabs scoring moves but doesn't think one step ahead.

### Level 4 — Hard (`pickGreedyMinSetupAction`, 1-ply minimax)

- For every action: simulate it, then compute the opponent's best single-move response.
- Score = `my_gain − opp_best_response`.
- Picks the highest. Refuses small immediate wins that leave a bigger gift to the opponent.

### Level 5 — Impossible (`pickMinimaxAction`, 2-ply minimax)

- For each candidate action (shortlist of top K by `evalState` after the action — K = 16 for ≤16 actions, 10 otherwise):
  - Simulate it, then for each of opponent's top-K responses simulate again.
  - Take the min over opponent responses (worst-case for me).
- Pick the candidate with the best worst-case.
- **Leaf eval (`evalState`):** `scores[me] − scores[opp]` plus a **pending-claim prediction**: sort pending lines by length descending, alternate awarding their length to "me" and "opp" starting with the player whose turn it currently is, **scaled by `PENDING_DISCOUNT = 0.5`**. This nudges the AI toward setting up favorable pending claim sequences without overcommitting.

### Tie-breaks and determinism

All level evaluations shuffle their candidate list before selecting the best, so the AI doesn't play identically across repeated games.

A 450 ms delay (`AI_DELAY_MS` in `App.tsx`) is inserted before the AI's move so the user visually registers the change.

### AI avatars

Each level has a distinct robot SVG portrait rendered in the AI's side panel:

| Level | Visual character |
|-------|------------------|
| **L1 Beginner** | Round chubby head, brightest pastel mint, asymmetric big eyes, open-mouth smile with tongue, big rosy cheeks, floppy antenna with a star |
| **L2 Easy** | Round head, light mint, symmetric big eyes with sparkles, wide curved smile, subtle cheeks, antenna with a pink heart |
| **L3 Medium** | Rounded square, mid-green, medium round eyes, gentle closed-mouth smile, chest indicator, antenna with a circle |
| **L4 Hard** | Squarer head with sharper corners, dark green, narrow rectangular eyes, neutral straight mouth (slight frown), two antennae with green tips, forehead sensor |
| **L5 Impossible** | Angular chamfered head, near-black, **glowing red eyes** (SVG glow filter), frown, **three sharp horns** with red tips, battle scar, metallic seam |

---

## Storage (`storage.ts`)

Three independent localStorage keys, each versioned with a `:vN` suffix. **Bump the suffix when the shape semantics change** so old data is silently re-defaulted instead of crashing the parser.

### `dotduel:progress:v3` — unlock ladder

```ts
{
  unlocked: { triangle: 1..5, square: 0|1..5, rectangle: 0|1..5, rhombus: 0|1..5 },
  wins:     { "shape:diff": true, ... }
}
```

**Unlock rules:**

1. Triangle L1 is unlocked at start. Square / Rectangle / Rhombus start locked.
2. **Within a shape:** beating level N unlocks level N+1 (capped at 5).
3. **Across shapes:** beating **L2 or higher** on the current shape unlocks the **next** shape at L1. Order: Triangle → Square → Rectangle → Rhombus.

So the cross-shape unlocks happen at: Triangle L2 → Square L1, Square L2 → Rectangle L1, Rectangle L2 → Rhombus L1. Hot-seat mode never touches progression. "Reset progress" in Settings calls `resetProgress()` → wipes the progress key.

### `dotduel:settings:v1` — preferences + counters

`{ playerName, opponentName, hotseatColorSwap, tutorialSeen, gamesPlayed, claimsMade }`. `gamesPlayed` / `claimsMade` drive the learning-hint window (see Pending lines).

### `dotduel:stats:v4` — per-name W/D/L

Keyed by `normKey(name)` (lowercased + trimmed). Each player row holds vs-AI stats split by difficulty AND shape, hot-seat stats split by shape, plus a `byOpponent` map (other player's key, or `ai:<diff>` for AI) for the head-to-head view in `RankingsPopover.tsx`. Totals and percentages are derived on read — never stored — so they can't drift.

---

## Modes & menu entry points

- **Vs AI** — single player vs the bot. Drives the unlock progression.
- **Hot-seat** — two humans, one device, alternating taps. All shapes available immediately. No progression.
- **Multiplayer** — placeholder menu card, currently disabled. See *Deferred* below.
- **Rankings** — a full-width menu card below the mode grid. Opens `RankingsPopover.tsx`, which shows a leaderboard (per-player row) and a head-to-head view; entries include AI difficulty levels as opponents. Profile delete is gated behind a confirm dialog inside the popover.

---

## MANDATORY: zero-cost, no-royalty stack

**The user does not want to pay any licensing, patent, royalty, or per-user fee when the game ships publicly.** When introducing any new dependency, asset, service, or algorithm:

1. **Default to permissive open-source** (MIT / Apache-2.0 / BSD / ISC). Avoid GPL / AGPL (copyleft can require source disclosure). Avoid anything labelled "commercial use restricted," "non-commercial," or "evaluation."
2. **No patented algorithms.** Rare in modern web dev, but watch for audio/video codecs (H.264/H.265), some compression schemes, "patent-pending" libraries.
3. **No paid SaaS in the runtime path.** Free tiers are acceptable *only if* the free tier remains free at expected production scale. If a service might force payment after N users / requests / MB, flag before adding.
4. **No proprietary fonts/icons/audio/images.** System fonts only, or self-hosted OSS fonts (e.g., Inter via SIL OFL). Royalty-free or original assets only.
5. **No analytics / telemetry that charges by event volume** without explicit user approval.
6. **When in doubt, surface it.** After adding *any* new dependency or service, the assistant must explicitly list it and its license/cost terms in the same response.

Current dependency audit (all free, all permissive OSS):

| Package | License | Cost |
|---------|---------|------|
| react, react-dom | MIT | free |
| vite | MIT | free |
| typescript | Apache-2.0 | free |
| @vitejs/plugin-react | MIT | free |
| @types/react, @types/react-dom | MIT | free |
| tsx | MIT | free (dev-only) |

Runtime resources: only browser APIs (`localStorage`, SVG, DOM). No external network calls. No third-party fonts, icons, audio, or images. No analytics. No backend.

---

## Deferred — do not start without explicit ask

### Multiplayer

- Realtime sync between two players signed in with Google.
- The "Multiplayer" menu card is currently disabled.
- Required pieces (when we get there): WebSocket or WebRTC transport, lobby/match-making, server-authoritative game state, reconnection handling, anti-cheat (server validates `applyAction`).
- Hosting: ideally Cloudflare Workers / Durable Objects free tier, or similar zero-cost OSS-friendly option — must stay within the zero-cost rule above.

### Google authentication

- Required for multiplayer + cloud-synced progress.
- Use Google Identity Services (free for standard sign-in flows). Verify free-tier limits before committing.
- localStorage progression should migrate transparently to a per-user cloud doc when a user signs in.
- Real profile photos (from Google / Facebook / direct upload) will replace the current placeholder `HumanAvatar` in `SidePanel.tsx`.

### Rating (Elo or similar)

- Side panel has a `rating` slot displaying `—` today.
- When multiplayer + auth land, populate from a server-stored Elo or similar.

### Monetization (TBD design)

- User has flagged this as future work. Likely options (to be decided): cosmetic skins, optional ad break (only with explicit consent, no third-party SDK that bundles tracking), a one-time "Pro" unlock.
- **Constraint reminder:** monetization MUST NOT require paying a third party to use the game (no Unity ads, no GameAnalytics that charges per event, no premium SDK licenses). Anything we ship must respect the zero-cost rule.

### Legal footer

- The menu footer reserves space for Privacy / Terms / Contact. When GDPR/compliance content is written, replace the stub anchors in `Menu.tsx` with real navigation (could open similar popovers, or dedicated routes).

### Production domain (www.dotduel.com)

- GitHub Pages serves the staging build at `https://donstn.github.io/DotDuel/` already (auto-deployed on push to `main`).
- Cutover to `www.dotduel.com` is on hold until the user signs off on overall polish. Either keep GH Pages with a custom domain CNAME, or migrate to Cloudflare Pages / Netlify / Vercel free tier — all within the zero-cost rule.

---

## Development conventions

- **Strict TS** — `noUnusedLocals`, `noUnusedParameters`, `strict: true`. Use `void` or destructure-omit unused params.
- **No comments** unless they explain non-obvious *why* (a constraint, a workaround). Code should read self-evidently; identifier names beat inline narration.
- **Game state is immutable** — `applyMove` / `applyClaim` / `applyAction` return new `GameState` objects. Don't mutate `colored`, `completed`, `pending`, or `scores`.
- **Geometry is computed once** — `getBoards()` memoizes. Don't recompute per render.
- **localStorage writes via `saveProgress()`** — never `localStorage.setItem` directly elsewhere; bump the `KEY` version suffix when the `Progress` shape changes semantics.
- UI strings live in components (no i18n yet). Game UI is **English**; team communication is Lithuanian.
- **HMR can stall** — if file edits don't reach the browser, restart `npm run dev` and clear `node_modules/.vite`.

---

## Sanity checklist before shipping changes

1. `npm run build` succeeds (TS strict + Vite bundle).
2. Triangle L1 vs-AI win unlocks L2; Triangle L2 win unlocks Square. (Spot-check the progression chain end-to-end.)
3. Hot-seat mode does not modify `dotduel:progress:v3`. (Per-name stats in `dotduel:stats:v4` DO update for hot-seat — that's intended.)
4. Placing a corner dot scores its 1-point line immediately and the corner strike renders.
5. A move completing two lines: longest scores (crossline draws); shorter becomes pending (no visual unless within the learning-hint window). Clicking any dot on the pending line on a later turn claims it.
6. Endgame phase: when all dots are colored, both players continue claiming pending lines until the pool is empty before the game-over screen appears.
7. Mobile layout: in DevTools device toolbar, the iPhone-SE portrait stacks player cards above the board (no horizontal side panels); iPhone-SE landscape fits the three mode cards on one line on the menu.
8. Topbar / board don't shift vertically when pending lines appear or the AI starts thinking (pending badge slot + absolute thinking-dots).
9. Rules popover opens from menu footer "Rules" link AND from in-game `?` button; closes on backdrop click, ✕, or ESC.
10. After AI changes: `npm run simulate:l4` — average scores across L5 vs L5 should stay within ~3 points per shape.
11. After square / pending-flow changes: `npm run simulate:square` — must report 50/50 clean games with integrity OK and no double-turn anomalies.
12. After pushing to `main`: confirm the `Deploy to GitHub Pages` workflow goes green (`gh run list --limit 1`) and the staging URL loads.
