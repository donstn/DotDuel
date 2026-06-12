# DotDuel

Two-player dot-coloring strategy game. Players alternate coloring dots on a geometric board; completed lines score under a **biggest-only + pending claims** rule (see Game rules). Game ends when all dots are colored AND all completed lines claimed; higher score wins.

- **Production: https://www.dotduel.com** (GH Pages, auto-deployed from `main` via `.github/workflows/deploy.yml`, Vite `base: '/'`). Also ships as a **Capacitor Android app** (Play Store submission in progress — see `PLAY_STORE_GUIDE.md`).
- Version: `src/version.ts` (`APP_VERSION`), in lock-step with `src/changelog.ts` (in-app modal) and `CHANGELOG.md`.
- **Check `bugs.md` first** when a familiar symptom recurs — diagnoses are recorded there.

## Tech stack

- **React 18 + Vite 5 + TypeScript (strict)**; SVG board (auto-scales via `viewBox`); no UI framework.
- **Supabase** (project ref `ggyjxayazxbjvjbeecxa`): Postgres + RLS, Auth (Google + email), Realtime, Edge Functions, pg_cron sweeps. The Firebase → Supabase migration **completed and cut over 2026-06-09 (0.4.0.0)** — client is 100% Firebase-free. `SUPABASE_MIGRATION.md` keeps the full schema/function inventory and conventions.
- **Capacitor 8** for Android (AdMob via `@capacitor-community/admob`, native Google sign-in via `@capgo/capacitor-social-login`, MPL-2.0).
- **localStorage** for offline progression; **GA4 gtag.js** telemetry behind Google CMP/Consent Mode; `tsx` for headless simulation scripts.

### Supabase conventions (gotchas that bit us)

- App identifies players by the **legacy Firebase uid**, but Supabase tables key on the **Supabase auth uuid** — resolve via cached `currentSupabaseUid()` for any uid-keyed read/write.
- Apply SQL via the dashboard **SQL Editor** or `db query --linked` — NOT `db push` (CLI migration history intentionally out of sync).
- Any `SECURITY DEFINER` RPC writing protected cols (rating/streak/presence) must `perform set_config('app.allow_protected_write','on',true)` first or the guard trigger reverts it.
- `clock.turnStartedAt` is **epoch-ms**. Run `node scripts/copy-engine-supabase.cjs` before deploying engine-dependent Edge Functions.
- Pending: retire the Firebase cloud project, rotate the Supabase access token + service-role key (both non-expiring, were pasted in chat).

## Running it

```powershell
npm run dev                    # http://localhost:5173
npm run build                  # tsc -b + Vite bundle → dist/
npm run build:android-release  # ONLY build serving real AdMob ads (.env.androidrelease)
npm run simulate / simulate:l4 / simulate:square / simulate:tri8
```

Deploy: `git push origin main` → GH Pages. Android: `npx cap sync android`, then Android Studio / `gradlew bundleRelease` (signing via git-ignored `android/keystore.properties`; never commit keystores).

## File layout

```
src/
  App.tsx                  Screen state machine, AI scheduler, optimistic MP state, popovers
  types.ts / geometry.ts   GameState + board generation. geometry.ts is the ONLY definition of lines
  game.ts                  Pure logic: applyMove, applyClaim, applyAction, pointsIfPlayed (immutable)
  ai.ts                    5-tier AI (pickAIAction)
  storage.ts               localStorage (progression, settings, per-name W/D/L)
  telemetry.ts             GA4 trackEvent (PII strip, session cap)
  nativeAds.ts / ads.ts    AdMob (app) / AdSense (web), consent-gated
  share/                   Victory-card canvas renderer + share text
  components/ cloud/ auth/ Menu, Board, SidePanel, GameOver, popovers · Supabase wrappers · sign-in
supabase/functions/        Edge Functions (engine/ copied from src/ by script)
android/                   Capacitor project
scripts/                   simulate*.ts, build-assets.mjs, copy-engine-supabase.cjs
public/privacy.html        Public privacy policy (Play + AdSense requirement)
cloudflare/                Backlogged share-link unfurl setup docs
```

## Game rules (definitive)

- **Turn:** place a dot on any empty cell OR claim a pending line. Turn always passes; P1 starts.
- **Scoring — biggest-only + pending:** when a placement completes lines, score `length` of the **single longest**; other completed lines become **pending** (colored, unscored). Claiming a pending line scores its full length. Pending is a **shared pool** — either player may claim any pending line. (Naïve sum-all gave the last mover ~99% wins; pending claims rebalance to ~1–3 pts at L5 vs L5 — see `simulation-results.md`.)
- **Minimum line length 1** — corner apexes are 1-point lines drawn as a short stroke.
- **Game end:** all dots colored AND `pending.length === 0`; if dots fill first, remaining turns are forced claims. Equal scores = draw.

| Shape | Dots | Directions | Lines | Total pts |
|---|---|---|---|---|
| Triangle (rows 8→1) | 36 | horiz + 2 triangular diagonals | 24 | 108 |
| Square 7×7 | 49 | horiz + vert + 2 diagonals | 40 | 196 |
| Rectangle 7×9 | 63 | horiz + vert + 2 diagonals | 46 | 252 |
| Rhombus (1..6..1) | 36 | horiz + 2 triangular diagonals | 23 | 108 |

## UI rules

**Hard rule — nothing escapes the viewport.** `body { overflow: hidden }`; everything must fit at iPhone-SE (~320×568) — emulate 320px before merging layout changes. Recurring traps: inline-flex pill rows need `flex-wrap: wrap; max-width: 100%`; use the `100vh`/`100dvh`/`100svh` cascade (mobile URL-bar); flex columns need `min-height: 0` for scrollable children; `position: fixed` overlays need reserved space via `body:has(...)`.

**Theme:** Glass Orb — glassmorphism over dark green vignette + film grain. Multiple selectable color themes via CSS vars. Popovers keep `backdrop-filter`; **persistent game-screen surfaces don't** (GPU cost on cheap phones — 0.4.5.0 diet). CVD-safe palette, distinguishable by luminance alone: `--p1` `#0d4a23` (dark green) / `--p2` `#d3ecaa` (cream) + `-glow`/`-bright` variants, `--accent` `#7bdb95`.

**Game screen:** topbar (back · "X pts left" + pending badge, always rendered `visibility:hidden` when empty so height never shifts · `?` rules). Desktop: panel · board · panel; phone (`max-width: 720px`): player cards stack as rows above the board. Active panel gets a breathing glow.

**Rendering:** dots are glassy 3D spheres (radial gradient + specular); the SVG `dot-shadow` blur filter applies ONLY to the last-placed dot (perf). Strikes are two stacked strokes (outer base ×0.575 of `strokeWidth = r*0.42`, inner highlight ×0.22) with 5R/3 overshoot, after dots, `pointer-events: none`.

**Pending lines are invisible by design** past the learning window (`gamesPlayed < 10 || claimsMade < 3`); during it, a static soft yellow ring on Triangle only — **no animation on board content, ever**. **Claiming:** click any colored dot in a pending line → longest pending line through it is claimed. Animations: dot pop 380ms, strike fade ~360ms; no infinite board animations; topbar `min-height` and absolute thinking-dots prevent layout shift.

Rules popover opens from menu footer AND in-game `?`; `AppFooter.tsx` is the only path to Settings mid-game.

## AI (`ai.ts`)

AI plays P2; all levels shuffle candidates (non-deterministic); `AI_DELAY_MS = 450`.

| Level | Strategy |
|---|---|
| L1 | Uniform random |
| L2 | "Obvious" moves (1-dot corners or ≥5 pts), else random |
| L3 | Greedy best immediate gain, else random |
| L4 | 1-ply minimax: `my_gain − opp_best_response` |
| L5 | 2-ply minimax over top-K (16/10), leaf = score diff + pending prediction (alternating award, `PENDING_DISCOUNT = 0.5`) |

Avatars in `SidePanel.tsx` escalate from cute round mint robot (L1) to angular near-black horned bot with glowing red eyes (L5).

## Storage (`storage.ts`)

Three versioned localStorage keys — **bump `:vN` when shape semantics change** (old data re-defaults instead of crash-parsing). All writes via `storage.ts` helpers, never raw `localStorage.setItem`.

- `dotduel:progress:v3` — unlocks: Triangle L1 at start; beating N unlocks N+1; beating **L2+** unlocks next shape (Triangle → Square → Rectangle → Rhombus). Hot-seat never touches it.
- `dotduel:settings:v1` — names, color swap, tutorialSeen, gamesPlayed/claimsMade (learning window).
- `dotduel:stats:v4` — per-name W/D/L by `normKey(name)`, split by difficulty × shape; totals derived on read.

**Modes:** Vs AI (drives unlocks) · Hot-seat (all shapes, no progression) · Multiplayer (Google sign-in, matchmaker + bots fallback, chess clocks, ranked Elo, friends/invites/presence, rematch) · Daily puzzle (server-generated shared board, 3-min clock, score leaderboard) · Rankings popover.

## MANDATORY: zero-cost, no-royalty stack

No licensing/patent/royalty/per-user fees ever. For any new dependency, asset, service, or algorithm: permissive OSS only (MIT/Apache-2.0/BSD/ISC; avoid GPL/AGPL); no patented algorithms; no paid SaaS in the runtime path (free tiers OK only if free at production scale); no proprietary fonts/icons/audio; no event-volume-billed analytics without approval. **Always state a new dep's license/cost in the same response that adds it.** Current exception consciously accepted: `@capgo/capacitor-social-login` is MPL-2.0 (file-level copyleft, dependency-use OK, $0).

## Security — accepted risks (don't re-flag)

- Match docs readable by any signed-in user (displayName/Elo already public on leaderboard; tighten if chat/IP/email ever added).
- Supabase anon key + GA measurement id are public by design (same model as the old Firebase web key); RLS is the gate.
- Cookie/consent gate is client-side only; moves server-side if we add server-side analytics ingest.
- Social RPCs have no rate-limiting yet — add a token-bucket before public launch.

## Current status (2026-06-12) — Alpha 0.4.5.3

Live and ranked on www.dotduel.com. Arc since 0.3.0.0: **ads** (AdSense web + AdMob app, Google CMP — AdSense approval still pending review, requested 2026-06-06) → **0.4.0.0 Supabase cutover + prod domain** → server daily puzzle (0.4.2.0) → onboarding simplification (0.4.3.0) → **victory-card sharing** (0.4.4.0, redesigned 0.4.5.1–3: in-game felt board, 2× render, JPEG share path) → **0.4.5.0 perf GPU-diet + Play Store readiness + native Google sign-in** (Credential Manager → `signInWithIdToken`).

**Open / user-action items:**
- Play Store: keystore creation, Play Console account + Data Safety + listing — walkthrough in `PLAY_STORE_GUIDE.md` (incl. Android OAuth client SHA-1 steps).
- Native Google sign-in needs full e2e on a device with a Google account; iPhone-browser Google 403 still open (the native pattern applies).
- Google consent-screen brand verification (free) before launch.

## Backlog / deferred — don't start without explicit ask

- **Share-link unfurl** — fully built, gated OFF (`ENABLE_SHARE_CARD_LINKS = false` in `src/cloud/shareCards.ts`); Supabase side (table/bucket/`r` fn) is live and harmless. Revive = flip flag + Cloudflare DNS per `cloudflare/SETUP-STEPS.md` (must preserve Namecheap email forwarding). Decision: TBD.
- **Firebase retirement** — delete the cloud project, remove `VITE_FIREBASE_*` from env files, rotate Supabase keys. (`functions/` dir already removed from repo.)
- Tutorial animations (SVG scenes reusing Board + `applyAction` — full spec in git history of this file), sounds (Settings toggle waits on it), game replay, monetization (cosmetics/ad-break/Pro — zero-cost constraint), trademark filing (EUIPO ~€850 / LT ~€180 / USPTO later; patent ruled out), legal footer (Privacy/Terms/Contact GDPR copy), SEO discoverable pages (rankings/changelog as real URLs; vite-ssg vs Next.js discussion pending), multiplayer shape-picker (server ready), clock-timeout sweep, GH Actions Node 24 bump (deploy.yml, warned for June 16).

## Conventions

- Strict TS (`noUnusedLocals`/`noUnusedParameters`). No comments unless the *why* is non-obvious. Game state immutable; geometry computed once (`getBoards()`).
- **Bump `src/version.ts` + `src/changelog.ts` on user-visible changes** (changelog wording is user-owned — flag drafts for review).
- UI strings English, in components; team communication Lithuanian.
- Supabase Auth: web uses the browser OAuth flow, Capacitor uses the native plugin. HMR stalls → restart dev + clear `node_modules/.vite`.
- Production pushes to `main` and prod-data writes need explicit user authorization.

## Sanity checklist before shipping

1. `npm run build` green.
2. Triangle L1 win unlocks L2; Triangle L2 win unlocks Square. Hot-seat doesn't touch progress (stats DO update).
3. Corner dot scores 1 + corner strike; multi-line completion: longest strikes, rest pending; clicking a pending dot claims it; endgame drains pending before GameOver.
4. iPhone-SE portrait: cards stack above board; nothing scrolls or shifts when badges/thinking appear.
5. Rules popover from menu footer AND in-game `?`.
6. After AI changes: `npm run simulate:l4` (~3 pts max gap); after square/pending changes: `npm run simulate:square` (50/50 + integrity OK).
7. After push to `main`: `gh run list --limit 1` green, prod loads.
8. After multiplayer changes: two-browser sanity (pair, ready, game, GameOver, Elo both sides, session lock releases).
9. After Android-touching changes: `npx cap sync android` + emulator boot (AVD `dotduel_api35`, WHPX accel).
