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

### Hard rule — nothing goes outside the viewport on a non-scrollable page

`body { overflow: hidden }` is in place — the game itself never scrolls, by design. The corollary, which has bitten us multiple times on mobile, is that **every interactive surface (popovers, footers, banners, modals) must fit within the visible viewport at the smallest target device size (iPhone SE class, ~320×568 effective)**. Things that can violate this:

- **Inline-flex rows without `flex-wrap`** — long pill rows like the AppFooter (`Rules · Settings · Privacy · Theme · version`) extend past the right edge silently. Always allow wrap with `flex-wrap: wrap; justify-content: center; max-width: 100%` on these.
- **Popover max-height using `100vh`** — on mobile Safari and Brave, `100vh` is the *largest* possible viewport (URL bar collapsed). When the URL bar is visible, content gets cut off the bottom. Use the cascade `max-height: 100vh; max-height: 100dvh; max-height: 100svh;` — `svh` (small viewport) is the safest target.
- **Flex columns that forget `min-height: 0`** — a flex child with `overflow-y: auto` will refuse to scroll if its `min-height` defaults to `auto`; the body's intrinsic content height "wins" and the parent's `overflow: hidden` clips the footer.
- **`position: fixed` overlays (e.g. the consent banner)** silently cover the bottom of unrelated content. Use `body:has(.banner-class) .other-thing { padding-bottom: ... }` to reserve space.

When a layout can't be reduced enough, the bottom row(s) of items must wrap, scroll, or proportionally shrink — but never disappear off-screen. If you find yourself thinking "this will fit on most phones," double-check on an emulated 320px-wide viewport before merging.

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

## Security — known accepted risks

The security audit on 2026-05-26 identified three low-severity findings that we are **knowingly accepting** rather than mitigating. They are documented here so future work doesn't re-flag them as bugs and so a reader can see the threat model.

### L-1: `matches/{matchId}` readable by any signed-in user

Firestore rule allows every signed-in account to read every match record. Match docs contain both players' displayNames, rating before/after, scores, shape, time control, and finishedReason. **Accepted because:** displayName and Elo are already advertised on the public leaderboard, so cross-referencing matches reveals only "who played whom and how it ended" — the same information any spectator at a chess tournament has. If a future feature stores anything more sensitive on the match doc (chat, IP, email), the rule must be tightened to a participant-only `allow read`.

### L-2: Firebase Web API key is public

The `apiKey` shipped in the JS bundle is by design not a secret — Firebase uses it to identify the project, not to authenticate. Every Firebase web app exposes it. Misuse is prevented by Firestore + RTDB security rules and App Check (when enabled). **Accepted because:** this is the documented Firebase model. The mitigation if we ever see abuse is to enable App Check (reCAPTCHA or Play Integrity), which is on the post-launch list, not a code change.

### L-4: Cookie banner is a client-only consent gate

The consent banner records `analyticsConsent` in `localStorage` and gates the Analytics init at the React layer. A user who tampers with their own localStorage could load Analytics without "consenting" — but that only affects their own browser, not the GDPR posture against Google. **Accepted because:** GDPR consent is between the data subject and the controller (us); a user spoofing their own consent harms nobody else. If we add a server-side analytics ingest later, the consent gate moves server-side.

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

### Friend list / add friend / invite friend

User-requested feature. Builds on the random matchmaker + the
ranked Elo system already in place. Estimated work: ~3 days (1 day
server, 1.5 days client, 0.5 days polish + tests).

**Data model** (Firestore):
```
friendships/{friendshipId}        // friendshipId = sortedUids.join('__')
  uids: [string, string]           // sorted alphabetically for array-contains queries
  status: 'pending' | 'accepted' | 'blocked'
  requestedBy: string              // uid of the requester
  requestedAt: timestamp
  acceptedAt: timestamp | null
  blockedAt: timestamp | null      // future

friendInvites/{toUid}/{fromUid}    // ephemeral, TTL 10 min, deleted on accept/decline
  timeControl: '1min' | '3min' | '5min'
  shape: ShapeId | null            // null = random
  ranked: boolean                  // false by default
  sentAt: timestamp
```

**Server functions** (callable, in `functions/src/index.ts`):
- `sendFriendRequest(targetUsername)` — looks up target uid via
  `usernames/{lower}`, creates `friendships/{id}` with status
  `'pending'`. Rejects if already friends or already pending.
- `acceptFriendRequest(friendshipId)` — flips to `'accepted'`,
  sets `acceptedAt`. Only the non-requester can accept.
- `declineFriendRequest(friendshipId)` — deletes the doc.
- `removeFriend(friendshipId)` — deletes the doc.
- `inviteFriendToGame(friendUid, timeControl, shape, ranked)` —
  writes `friendInvites/{toUid}/{fromUid}`. Both must already be
  friends (status='accepted'). Recipient sees a popup; accept
  spawns a pairing doc via the same code path as `matchmake`
  (just skipping the queue lookup since both UIDs are known).

**Firestore rules**:
```
match /friendships/{id} {
  allow read: if request.auth.uid in resource.data.uids;
  allow write: if false;  // function-only
}
match /friendInvites/{toUid}/{fromUid} {
  allow read, delete: if request.auth.uid == toUid;
  allow write: if false;  // function-only
}
```

**Client**:
- New `src/cloud/friends.ts` — `watchFriends(uid, cb)` using
  `query(collection(db, 'friendships'), where('uids', 'array-contains', uid))`.
- New `src/components/FriendsPopover.tsx` — opens from Profile.
  Three sections: pending requests (accept/decline buttons),
  friends list (Invite to play / Remove buttons + online dot if
  presence shipped), "Add by username" input at the bottom.
- Recipient-side: new effect in `App.tsx` subscribes to
  `friendInvites/{user.uid}` and renders an in-game friend-invite
  popup when one arrives.

**Online presence** (sub-feature, deferable further): RTDB
`presence/{uid}` with `onDisconnect` → null. Friends list shows
green dot when friend is online. Mirrors the existing
`gameSessions/{uid}` lock pattern.

**Open question** to resolve when starting: should friend-invite
matches default to **unranked** (Elo doesn't move) or **ranked**?
Recommended: unranked default with an explicit "play for rating"
toggle in the invite dialog. Reason: friends often play casually
and getting demoted by a friend who tries hard once is bad UX.

### Tutorial animations (first launch + Rules popover)

User-requested feature. Replaces the current text-only
TutorialPopover and enriches the Rules popover with visual
demonstrations. Estimated work: ~2 days.

**Format decision: SVG animations, NOT GIFs.** Reasons:
- SVGs are ~5KB each vs 50–200KB for GIF
- Themable (the animation adapts to whichever active theme)
- No external asset pipeline — authored as TypeScript components
- Crisp at every viewport size

**Five animations needed** (each loops indefinitely):

| # | Title | What it shows |
|---|---|---|
| 1 | Place a dot | Empty dot → click effect → dot fills with player colour → pop animation |
| 2 | Score a line | Three empty dots in a row → P1 places dots one by one (slow) → on the 3rd dot the strike line draws + `+3` floats up |
| 3 | The catch — biggest scores, rest go pending | A two-line completion: 4-dot horizontal AND 2-dot vertical share the last placement. Horizontal (4) strikes immediately. The vertical (2) is coloured but un-struck. A yellow ring pulses around it. `+4 only` indicator |
| 4 | Claim a pending line | Opponent's turn, they tap a coloured dot in the pending vertical line. Strike draws in opponent's colour. `+2` floats up |
| 5 | Game end | Board fills, all pending claims drained, final score displays (`You 14 — AI 11`) |

**Implementation pattern**:
- New `src/components/tutorial/AnimatedScene.tsx` that accepts a
  `frames: { action: GameAction; pauseMs: number }[]` array and
  animates by stepping through frames at intervals.
- Reuse the existing `Board.tsx` (without click handlers and
  with `disabled` to prevent interaction).
- Use `applyAction` from the existing engine to compute the next
  state from each frame's action — no parallel implementation,
  no drift.

**Placement**:
- **First launch**: replace the current text-only
  `TutorialPopover.tsx` with a 5-card carousel (one animation
  per card + a 1-sentence caption). Carousel state stored in
  `settings.tutorialSeen` (existing flag, no schema change).
- **Rules popover**: alongside the relevant sections (Scoring,
  The catch — one move one score, Watch the board, Game end)
  embed the matching animation inline at small size (~120×120 px).

### SEO refinements (after the basics in §B of the launch plan)

The current `index.html` (post-Alpha 0.1.2.x) has full meta tags
+ Open Graph + Twitter Card + JSON-LD VideoGame schema +
robots.txt + sitemap.xml + a `<noscript>` content block. That's
the baseline. Future refinements when traffic justifies the work:

- **Pre-render the menu HTML** via `vite-ssg` or
  `@vitejs/plugin-react-pages` so Google sees a populated DOM
  instead of a JS shell. Bigger win than meta tags.
- **`/blog` route** with long-form posts about strategy, game
  design notes, weekly tournament recaps — SEO long-tail content.
  Could host on the same domain via a sub-route, or `blog.dotduel.com`.
- **Schema.org `AggregateRating`** block once review count > 50.
- **Real social card image** — `public/og-card.png` (1200×630)
  with the DotDuel wordmark, a fragment of the board with a
  strike across it, the URL at the bottom. Currently referenced in
  meta tags but the file itself is a TODO — graphic-design task.
- **Localised pages** (`/es`, `/pt`) once we have non-English MAU
  to justify.
- **Performance** — Lighthouse audit, code-split the
  `cloud/` + `auth/` surface so initial JS bundle drops below
  500 KB gzipped.

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

---

## Session handoff — 2026-05-23 (Phases D + E.1 work in progress)

**Current local version:** `v50 · timeout ends the game` (uncommitted; last pushed commit is `52aa1e3` which is v45).

**Deployed live right now:**
- GitHub Pages serves **v45** (stale until you push the v46–v50 commit)
- Firebase Cloud Functions (region `europe-west1`): `matchmake`, `validateMove`, `startClockWhenBoardsLoaded` — all on the **v50 code** (deployed during the session)
- Firestore + RTDB rules: latest committed/deployed
- Artifact Registry: 7-day cleanup policy active

Because of that mismatch, **the phone (GitHub Pages) is currently running v45 client code talking to v50 server**. Functionally OK for vs-AI; multiplayer flow will misbehave because v45 client doesn't know about `clock`, `boardLoaded`, `ready`, or `gameSessions`. Resolution = `git push` the local commit so GitHub Pages catches up, OR just test on localhost until then.

### What shipped this session (locally, not yet pushed)

- **Phase D — server-authoritative multiplayer (v43–v44):** Shared engine (`functions/src/engine/` auto-copied from `src/` on every functions build). RTDB rules for `games/{id}` deny-by-default. `matchmake` creates the live RTDB game node on pairing. `validateMove` enforces turn order, applies moves via `applyAction`, rejects invalid moves and not-your-turn. Client subscribes via `watchGame`, sends moves via `sendMove → pendingMove`. State-normalization at the RTDB boundary fixes empty-`{}`-stripping (`colored`, `completed`, `pending`).
- **Ready + 5s countdown (v45):** RTDB `ready/{slot}` field; MatchFoundScreen shows the countdown and per-side ready chips; auto-start on both-ready OR countdown expiry.
- **Chess clocks (v46–v47):** RTDB `clock: {p1RemainingMs, p2RemainingMs, turnStartedAt, current, totalMs}`. `startClockWhenBoardsLoaded` sets `turnStartedAt` only when BOTH clients confirm via `boardLoaded/{slot}` (so the screen-transition + render time doesn't eat into the active player's budget). `ClockBadge` component self-ticks at 200ms, red-pulses under 10s. `validateMove` deducts elapsed per move and forfeits if remaining ≤ 0.
- **One game session per user (v48):** RTDB `gameSessions/{uid}` lock with `onDisconnect` auto-release. Menu Multiplayer card disables with "Active on another device" when locked-by-other. Released on back-to-menu, sign-out, game-over, and browser disconnect.
- **Loading screen auto-recovery (v49):** If `mpgame` shows the "Connecting to match…" guard for >2s, bounces `onlineGameId` to force a fresh `watchGame` subscription. Defensive — root cause of the stale-state window not fully diagnosed.
- **Timeout actually ends the game (v50):** New wire-action `{kind:'timeout'}` accepted by `validateMove`. Either client schedules a `setTimeout` to fire `claimTimeout` at the moment the active clock will hit 0; server re-verifies the clock state before forfeiting.

### What's still pending (Phase E.2 / E.3)

- **Elo updates** on game-end. K-factor sequence from the multiplayer roadmap §6.2: `50, 45, 40, 35, 30, 25, 20, 15, 10, 10` for placement games 1–10, then `K=32` steady-state. Implement as new `finalizeGame` Cloud Function triggered on `games/{id}/status` flipping to `'finished'`. Update `users/{uid}.rating + placementGamesPlayed` transactionally for both players.
- **Match history persistence** to Firestore `matches/{matchId}`: both player uids/displayNames/ratings before+after, scores, shape, time control, durationMs, finishedReason. Tightly coupled to the Elo finalize — same function.
- **Profile shows Elo + recent matches.** Side panel rating slot currently shows the clock in mpgame and `'—'` everywhere else. Profile popover needs an Elo line + a small "last 5 matches" list once match history exists.
- **`clockTimeout` scheduled function (Phase E.3).** Fallback for the edge case where both clients have crashed/lost connection mid-turn — the v50 client-driven timeout claim doesn't cover that. 1 Cloud Scheduler job, every 15s sweep of active games.
- **Provisional badge** until 10 games played (UI only).

### Specific things to test tomorrow

1. **v50 timeout actually fires GameOver.** Two browsers, Bullet (1 min). Player 1 stalls. At 0:00 + 500ms, both clients should see GameOver with player 2 as winner.
2. **v49 loading-screen recovery.** Pair + Ready a few times. If loading screen appears, watch DevTools console for `mpgame: onlineGame null for 2s, bouncing subscription`. Should recover within ~2s instead of needing a refresh.
3. **Second-game flow.** Finish a game, back to menu, queue again. No stale session lock, no leftover pairing doc.
4. **Cross-tab session lock.** Tab A enters Multiplayer → Tab B sees the card go disabled. Tab A clicks Back → Tab B re-enables within a second. (Verified working at end of session.)

### Open UX threads

- **Move latency.** User has flagged that clicks take ~300–500ms to render the new state because of the validateMove round-trip. Fix is optimistic UI: apply the move locally on click, reconcile via `watchGame` confirmation. ~30 lines, deferred until Elo lands.
- **Bundle size.** 930 KB raw / 230 KB gzipped — Firestore + RTDB SDKs dominate. Code-splitting (dynamic-import the entire `cloud/` + `auth/` surface behind sign-in) would shave ~150 KB off the initial bundle. Real concern before public launch; not yet urgent.

### How to resume tomorrow

1. `git status` to confirm v46–v50 changes are still on disk.
2. `npm run dev` and sanity-test multiplayer via two browser profiles.
3. If everything looks right: commit the bundle (Phase D + Phase E.1 + Phase A.2 session lock + v49 loading-screen recovery + v50 timeout), push.
4. Next: **start Phase E.2** — write the `finalizeGame` function with the K-table and match-history persistence.
