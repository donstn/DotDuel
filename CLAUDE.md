# DotDuel

A two-player dot-coloring strategy game. Players take turns coloring dots on a geometric board; lines (runs of dots in valid directions) score points when fully filled — but the scoring rule is **biggest-only with pending claims** (see Game Rules). Game ends when every dot is colored AND every completed line is claimed; higher score wins.

Live staging: **https://donstn.github.io/DotDuel/** (auto-deployed from `main` via `.github/workflows/deploy.yml`). Production domain **www.dotduel.com** pending.

Notable changes tracked in `CHANGELOG.md`. Current version: see `src/version.ts` (`APP_VERSION`).

---

## Tech stack

- **React 18** + **Vite 5** + **TypeScript** (strict mode)
- SVG board (auto-scales via `viewBox`)
- **Firebase** (Auth, Firestore, RTDB, Cloud Functions `europe-west1`) for multiplayer + accounts
- **localStorage** for offline progression
- `tsx` for headless simulation scripts (dev-only)
- No runtime UI framework

## Running it

```powershell
npm install
npm run dev              # http://localhost:5173
npm run build            # production bundle in ./dist (runs tsc -b first)
npm run preview          # serve the production build
npm run simulate         # 4×4 AI matrix on triangle
npm run simulate:l4      # L5 vs L5 across shapes (N=1000)
npm run simulate:square  # 50-game L5 vs L5 square integrity check
npm run simulate:tri8    # Triangle-8 prototype
```

**Deploy.** `git push origin main` triggers `.github/workflows/deploy.yml`: `npm ci` → `npm run build` → publish `dist/` to Pages. Vite `base` is `/DotDuel/` for builds (not dev). Cloud Functions deploy separately via `firebase deploy --only functions`.

---

## File layout

```
src/
  main.tsx, App.tsx              Entry; screen state machine, AI scheduler, popover state
  version.ts, changelog.ts       Public version label + in-app changelog modal data
  types.ts                       GameState, GameAction, ShapeId, Difficulty
  geometry.ts                    Board generation (dots + line buckets). Single source of truth for "what is a line"
  game.ts                        Pure logic: applyMove, applyClaim, applyAction, pointsIfPlayed
  ai.ts                          5-tier AI: pickAIAction
  storage.ts                     localStorage: progression, settings, per-name W/D/L
  styles.css                     Glass theme, layout, animations
  components/                    Menu, Board, SidePanel, GameOver, AppFooter,
                                 Rules/Settings/Rankings/Tutorial Popover, MatchFoundScreen, ClockBadge
  cloud/                         Firebase wrappers: matchmake, watchGame, sendMove, usernames, friends?, profile
  auth/                          Google sign-in (signInWithPopup for web, native plugin on Capacitor)
functions/src/                   Cloud Functions; engine/ is auto-copied from src/ on build
scripts/                         simulate*.ts + build-assets.mjs (OG card / favicon pipeline via sharp)
simulation-results.md            Accumulated balance data
CHANGELOG.md                     Authoritative shipped-changes log (Keep a Changelog)
.github/workflows/deploy.yml     GH Pages deploy on push to main
```

`geometry.ts` is the only place that defines lines — everywhere else iterates `board.lines`.

---

## Game rules (definitive)

### Turn structure

Each turn: **place a dot** on any empty cell, OR **claim a pending line**. Turn always passes. P1 → P2 → P1, starting P1.

### Scoring — "biggest-only + pending"

When placing a dot completes one or more lines:
- Score `line.length` for the **single longest** completed line.
- Other completed lines become **pending** (colored on the board, unscored).

Claiming a pending line scores its full length. A single move only scores one line directly; excess value is parked as pending.

**Why this rule:** the naïve "sum all completed lines" gave the last-mover a ~99% win at optimal play. Pending claims rebalance parity — L5 vs L5 stays within ~1–3 average points across all shapes. See `simulation-results.md`.

### Other rules

- **Minimum line length: 1.** Corner apexes count as 1-point lines, drawn as a short stroke through the single dot.
- **Pending is a shared pool.** Either player may claim any pending line on their turn — no ownership reservation.
- **Game end:** all dots colored AND `pending.length === 0`. If dots fill before pending drains, remaining turns are forced claims. Equal scores = draw.

### Per-shape geometry

| Shape | Dots | Directions | Lines | Total points |
|-------|------|------------|-------|--------------|
| Triangle (inverted, rows 8→1) | 36 | horiz + 2 triangular diagonals | 24 | 108 |
| Square 7×7 | 49 | horiz + vert + 2 diagonals | 40 | 196 |
| Rectangle 7×9 | 63 | horiz + vert + 2 diagonals | 46 | 252 |
| Rhombus (rows 1..6..1) | 36 | horiz + 2 triangular diagonals | 23 | 108 |

Triangle + rhombus use a triangular lattice — only 3 directions exist, no vertical.

---

## UI rules

### Hard rule — nothing escapes the viewport

`body { overflow: hidden }` — the game never scrolls. Every popover/footer/banner must fit at iPhone-SE class (~320×568). Recurring traps:

- **Inline-flex pill rows without `flex-wrap`** silently overflow right. Always add `flex-wrap: wrap; justify-content: center; max-width: 100%`.
- **`100vh` in popover `max-height`** — on mobile Safari/Brave it's the URL-bar-collapsed value, content gets clipped when the bar is visible. Use cascade `max-height: 100vh; max-height: 100dvh; max-height: 100svh;` (svh is safest).
- **Flex columns missing `min-height: 0`** — child with `overflow-y: auto` refuses to scroll because intrinsic body height wins.
- **`position: fixed` overlays (consent banner)** silently cover content below. Reserve space with `body:has(.banner-class) .other-thing { padding-bottom: ... }`.

Always emulate 320px-wide viewport before merging layout changes.

### Theme — Glass Orb

Glassmorphism over dark green vignette (`#15291e` center → `#02090b` edges) + film-grain overlay. All surfaces are `backdrop-filter: blur(...) saturate(...)` with thin gradient borders.

### Color palette (CVD-friendly, luminance-distinguishable)

| Token | Value | Role |
|-------|-------|------|
| `--p1` / `--p1-glow` / `--p1-bright` | `#0d4a23` / `#1c7a3d` / `#62cf90` | P1 dark green |
| `--p2` / `--p2-glow` / `--p2-bright` | `#d3ecaa` / `#f0fbcf` / `#ffffff` | P2 cream-green |
| `--accent` | `#7bdb95` | "points left" highlight |
| `--glass-bg` / `--glass-border` | rgba whites | All glass surfaces |

P1/P2 distinguishable by luminance alone (deuteranopia/protanopia safe).

### Game-screen layout

- **Top bar:** back-arrow · "X pts left" + "N lines to claim" badge below (always rendered with `visibility:hidden` when empty, so topbar height never shifts) · `?` rules button.
- **Desktop:** three columns — left panel · board · right panel. Panel width `clamp(86px, 22vw, 150px)`, vertical content order: avatar → name → stats → rating → score → totals.
- **Phone (`max-width: 720px` or short landscape):** CSS-grid stacks both player cards as compact horizontal rows above the board. Stats/totals/rating hidden in this layout (still in Rankings). Landscape shrinks ~30% further.
- **Active panel:** colored glow border + 2.2s `panelBreathe` filter pulse.
- **AI thinking dots (`···`):** shown during 450ms `AI_DELAY_MS`. On mobile the indicator is absolutely-positioned so name/score don't reflow.

### Dot & strike rendering

- **Dots:** glassy 3D spheres — radial gradient per role (`dot-p1/p2/empty/empty-hover`) with off-center highlight (35%/28%) + small specular ellipse + soft drop-shadow.
- **Strikes:** two-stacked-strokes for a ribbon look. Outer base (`#2b8a4c` P1 / `#c8c878` P2) at `strokeWidth * 0.575`; inner highlight (`#b8f5d3` P1 / `#ffffff` P2) at `strokeWidth * 0.22`, blend `screen`. Rendered after dots with `pointer-events: none`.
- **Overshoot:** strikes extend `5R/3` past first/last dot centers. Length-1 corner strikes are oriented by sampling another same-direction line on the board.

### Pending lines — invisible by design

No persistent visual once the user is past the **learning window** (`settings.gamesPlayed < 10 || settings.claimsMade < 3`). During the window, colored dots on a pending line get a static soft yellow ring (`.dot-hint-ring`, `stroke-width: 0.08`, `opacity: 0.55`). **No animation** — busy boards must not strobe.

### Claiming

Click any colored dot in a pending line → the **longest** pending line through that dot is claimed. No menu. Cursor stays default (no claimability hover hint).

### Animations

- Dot pop: scale 0.5→1.08→1.0 over 380ms (overshoot), origin = dot center (`transform-box: fill-box`).
- Strike appear: ~360ms scale-fade-in.
- Active-panel breathe: 2.2s `panelBreathe`. AI thinking dots: 1.4s `dotsPulse`.
- **No infinite animations on board content.** Layout-shift sources reserved: `topbar-center { min-height: 44px }`, mobile `thinking-dots { position: absolute }`.

### Popovers & footer

Rules popover opens from menu footer OR in-game `?`. Closes on backdrop / ✕ / ESC. Body scrolls if overflowed. `AppFooter.tsx` is the only path to Settings mid-game (shown on menu AND in-game). Currently: `DotDuel © 2026 · Rules · Settings`. Privacy/Contact reserved for GDPR copy.

---

## AI design (`ai.ts`)

AI plays P2 in vs-AI mode. All levels use `availableActions` + `pointsIfPlayed` + `applyAction` from `game.ts`. All shuffle candidate lists before picking, so play isn't deterministic. `AI_DELAY_MS = 450` in `App.tsx`.

| Level | Strategy |
|-------|----------|
| **L1 Beginner** (`pickPureRandomAction`) | Uniform random over all actions. Will ignore a free 7-point completion. |
| **L2 Easy** (`pickEasyAction`) | "Obvious" moves (1-dot corners OR ≥5pt scores) else random. Ignores mid 2–4pt gains. |
| **L3 Medium** (`pickGreedyOrRandomAction`) | Picks highest immediate gain if any > 0; else random. No lookahead. |
| **L4 Hard** (`pickGreedyMinSetupAction`) | 1-ply minimax: `my_gain − opp_best_response`. Refuses small wins that gift larger opportunities. |
| **L5 Impossible** (`pickMinimaxAction`) | 2-ply minimax over top-K shortlist (K=16 if ≤16 actions, else 10). Leaf eval = `scores[me] − scores[opp]` + **pending prediction** (sort pending desc, alternate awarding length to me/opp starting with current turn, scaled by `PENDING_DISCOUNT = 0.5`). |

### AI avatars (SidePanel.tsx)

| Level | Visual |
|-------|--------|
| L1 | Chubby head, brightest mint, asymmetric eyes, open smile + tongue, big cheeks, antenna w/ star |
| L2 | Round head, light mint, symmetric sparkle eyes, wide smile, antenna w/ heart |
| L3 | Rounded square, mid-green, round eyes, gentle smile, chest indicator, antenna w/ circle |
| L4 | Squarer head, dark green, narrow rectangular eyes, neutral mouth, two green-tipped antennae, forehead sensor |
| L5 | Angular chamfered head, near-black, **glowing red eyes**, frown, **three sharp horns**, battle scar, metallic seam |

---

## Storage (`storage.ts`)

Three independent localStorage keys, each `:vN` versioned. **Bump the suffix when shape semantics change** so old data is silently re-defaulted instead of crash-parsing.

- **`dotduel:progress:v3`** — `{ unlocked: {triangle/square/rectangle/rhombus: 0..5}, wins: {"shape:diff": true} }`. Unlock rules: Triangle L1 unlocked at start; within shape, beating N unlocks N+1; across shapes, beating **L2+** unlocks the next shape at L1 (Triangle → Square → Rectangle → Rhombus). Hot-seat never touches progression.
- **`dotduel:settings:v1`** — `{ playerName, opponentName, hotseatColorSwap, tutorialSeen, gamesPlayed, claimsMade }`. Last two drive the learning-hint window.
- **`dotduel:stats:v4`** — per-name W/D/L keyed by `normKey(name)` (lowercased+trimmed). Split by difficulty × shape for AI, by shape for hot-seat. `byOpponent` map powers head-to-head. Totals/percentages **derived on read**, never stored.

All localStorage writes go via `saveProgress()` etc. — never `localStorage.setItem` directly.

---

## Modes & menu

- **Vs AI** — drives unlock progression.
- **Hot-seat** — two humans one device; all shapes immediately; no progression.
- **Multiplayer** — Google sign-in required; matchmaker pairs strangers; chess-clock time controls; ranked Elo.
- **Rankings** — opens `RankingsPopover.tsx`: leaderboard + head-to-head, AI difficulties counted as opponents. Profile delete behind a confirm dialog.

---

## MANDATORY: zero-cost, no-royalty stack

The user does not want to pay any licensing/patent/royalty/per-user fee when shipping. When introducing any dependency, asset, service, or algorithm:

1. **Permissive OSS only** (MIT / Apache-2.0 / BSD / ISC). Avoid GPL/AGPL. Avoid "non-commercial" / "evaluation" labels.
2. **No patented algorithms** (watch for codecs like H.264/H.265, "patent-pending" libs).
3. **No paid SaaS in the runtime path.** Free tiers OK *only if* they remain free at expected production scale.
4. **No proprietary fonts/icons/audio/images.** System fonts or self-hosted OSS (e.g., Inter via SIL OFL). Original or royalty-free assets only.
5. **No event-volume-billed analytics** without explicit user approval.
6. **When in doubt, surface it.** Always list new dep's license/cost terms in the same response that adds it.

Current runtime deps: React, React-DOM, Vite, TypeScript, @vitejs/plugin-react, Firebase JS SDK (Apache-2.0). Dev: tsx, sharp (Apache-2.0, build-time only). All free, all permissive OSS.

---

## Security — known accepted risks

Audit on 2026-05-26. Three low-severity findings **knowingly accepted**. Don't re-flag them:

- **L-1: `matches/{matchId}` readable by any signed-in user.** Match docs hold displayName, rating before/after, scores, shape, time control, finishedReason. Accepted: displayName + Elo are already on the public leaderboard; this only exposes "who played whom, how it ended" — chess-tournament-spectator data. Tighten to participant-only if anything sensitive (chat/IP/email) is added later.
- **L-2: Firebase Web API key is public.** Documented Firebase model — the key identifies the project, doesn't authenticate. Misuse prevented by security rules + App Check (enable if abuse appears).
- **L-4: Cookie banner is a client-only consent gate.** A user spoofing their own localStorage to load Analytics affects only their browser, not our GDPR posture against Google. Moves server-side if/when we add a server-side analytics ingest.

---

## Current status (2026-05-27)

Multiplayer is **live and ranked**. Up to and including Alpha 0.1.2.3 (see CHANGELOG):

- Phase D (server-authoritative multiplayer), E.1 (chess clocks + ready/countdown + timeout), E.2 (Elo finalize + match history) — **shipped**.
- Session lock (`gameSessions/{uid}`) prevents one user on two devices.
- Loading-screen auto-recovery on stale `watchGame`.
- Security audit fixes H-1, H-2, M-1, M-2, M-3, L-3, L-5 — **shipped**.
- CSP, Apple/Android PWA icons, OG share card, favicon — **shipped**.

For exact change list, read `CHANGELOG.md` or `src/changelog.ts`. The latter is the in-app footer changelog modal — keep `version` strings in lock-step with `src/version.ts`.

### Open threads

- **Move latency.** Clicks take ~300–500ms because of the `validateMove` round-trip. Fix is optimistic UI (apply locally, reconcile via `watchGame`). ~30 lines, deferred.
- **Bundle size.** ~930 KB raw / ~230 KB gzipped; Firebase SDKs dominate. Code-split `cloud/` + `auth/` behind sign-in for ~150 KB savings before public launch.
- **`clockTimeout` scheduled function (E.3).** Fallback sweep for the edge case where both clients crash mid-turn — the client-driven timeout claim doesn't cover that. Cloud Scheduler, 15s sweep.
- **Provisional badge** until 10 placement games played (UI only).

---

## Deferred — do not start without explicit ask

### Friend list / invites

Builds on matchmaker + Elo. Est. ~3 days. Sketch:

- Firestore: `friendships/{sortedUids.join('__')}` with `{uids, status: 'pending'|'accepted'|'blocked', requestedBy, requestedAt, acceptedAt}`. `friendInvites/{toUid}/{fromUid}` ephemeral (TTL 10 min) with `{timeControl, shape, ranked, sentAt}`.
- Callable functions: `sendFriendRequest(username)`, `accept/decline/removeFriendRequest(friendshipId)`, `inviteFriendToGame(uid, tc, shape, ranked)` (reuses `matchmake` pairing code path).
- Rules: friendships readable only by participants, function-only writes. Invites readable+deletable only by recipient.
- Client: `src/cloud/friends.ts` (`watchFriends` via `array-contains`), `FriendsPopover.tsx` (pending / friends / add-by-username), App.tsx subscribes to incoming invites for popup.
- Sub-feature: presence via RTDB `presence/{uid}` + `onDisconnect`. Mirrors `gameSessions/{uid}`.
- **Open question:** default invite to unranked? Recommended yes, with explicit "play for rating" toggle — friends play casually and surprise demotion is bad UX.

### Tutorial animations

Replace text-only `TutorialPopover` + enrich Rules popover. Est. ~2 days.

- **Format: SVG (NOT GIFs).** ~5KB each, themable, no asset pipeline, crisp at any size.
- **Five looped scenes:** place a dot · score a line (+3 pop) · biggest-only catch (4-line strikes, 2-line goes pending with ring) · claim a pending line · game end.
- **Implementation:** `src/components/tutorial/AnimatedScene.tsx` takes `frames: {action, pauseMs}[]`, reuses `Board.tsx` (disabled) + `applyAction` — no parallel engine, no drift.
- **Placement:** first-launch 5-card carousel (gated by existing `settings.tutorialSeen`); inline ~120×120 thumbnails in Rules popover sections.

### SEO refinements (post-launch)

Baseline (meta tags, OG, Twitter Card, VideoGame JSON-LD, robots.txt, sitemap.xml, `<noscript>`) is in place. Future when traffic justifies:

- Pre-render menu HTML via `vite-ssg` so Google sees populated DOM (biggest single win).
- `/blog` route for strategy / design / tournament long-tail.
- `Schema.org AggregateRating` once reviews > 50.
- Localized pages (`/es`, `/pt`) when non-English MAU justifies.
- Lighthouse pass + code-split to drop initial bundle < 500 KB gzipped.

### Monetization (TBD)

Likely options: cosmetic skins, optional consent-gated ad break, one-time "Pro" unlock. Constraint: must not pay a third party to ship (no Unity ads, no per-event-billed SDKs, no premium licenses).

### Legal footer

Replace stub anchors in `Menu.tsx` (Privacy/Terms/Contact) when GDPR copy is written.

### Production domain (www.dotduel.com)

On hold pending polish sign-off. Either keep GH Pages + custom-domain CNAME, or migrate to Cloudflare Pages / Netlify / Vercel free tier.

---

## Development conventions

- **Strict TS** — `noUnusedLocals`, `noUnusedParameters`. Use `void` or destructure-omit unused params.
- **No comments** unless the *why* is non-obvious (constraint, workaround). Identifier names beat narration.
- **Game state is immutable.** `applyMove`/`applyClaim`/`applyAction` return new `GameState`; don't mutate `colored`/`completed`/`pending`/`scores`.
- **Geometry computed once** via memoized `getBoards()`. Don't recompute per render.
- **localStorage writes via the `storage.ts` helpers**; bump `:vN` when shape semantics change.
- UI strings live in components (no i18n). Game UI is **English**; team communication is **Lithuanian**.
- **Bump `src/version.ts` `APP_VERSION` + add a `src/changelog.ts` entry** on user-visible changes. Keep them in lock-step.
- **HMR can stall** — if edits don't reach the browser, restart `npm run dev` and clear `node_modules/.vite`.
- **Firebase Google sign-in:** use `signInWithPopup` for web. `signInWithRedirect` breaks on localhost+Chrome. Capacitor uses the native plugin on mobile.

---

## Sanity checklist before shipping

1. `npm run build` succeeds (TS strict + Vite bundle).
2. Triangle L1 win unlocks L2; Triangle L2 win unlocks Square.
3. Hot-seat does not modify `dotduel:progress:v3` (per-name stats in `dotduel:stats:v4` DO update — intended).
4. Corner dot scores 1 point immediately and renders the corner strike.
5. Multi-line completion: longest strikes; rest go pending (no visual outside learning window). Clicking a pending dot later claims it.
6. Endgame: all dots colored, players continue claiming until pending pool is empty before GameOver.
7. iPhone-SE portrait stacks player cards above the board; landscape fits the three mode cards on one menu row.
8. Topbar/board don't shift vertically when pending badge appears or AI starts thinking.
9. Rules popover opens from menu footer AND in-game `?`; closes on backdrop / ✕ / ESC.
10. After AI changes: `npm run simulate:l4` — L5 vs L5 averages stay within ~3 points per shape.
11. After square / pending-flow changes: `npm run simulate:square` — must report 50/50 with integrity OK.
12. After push to `main`: `gh run list --limit 1` green and staging URL loads.
13. After multiplayer-touching changes: two-browser sanity — pair, ready, full game, GameOver, Elo delta on both sides, session lock releases on back-to-menu.
