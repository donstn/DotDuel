# DotDuel

Two-player dot-coloring strategy game. Players alternate coloring dots on a geometric board; completed lines score under a **biggest-only + pending claims** rule (see Game rules). Game ends when all dots are colored AND all completed lines claimed; higher score wins.

- **Production: https://www.dotduel.com** (GH Pages, auto-deployed from `main` via `.github/workflows/deploy.yml`, Vite `base: '/'`). Also ships as a **Capacitor Android app** (Play Store submission in progress — see `PLAY_STORE_GUIDE.md`).
- Version: `src/version.ts` (`APP_VERSION`), in lock-step with `src/changelog.ts` (in-app modal) and `CHANGELOG.md`.
- **Check `bugs.md` first** when a familiar symptom recurs — diagnoses are recorded there.
- **Internal-testing UI bugs to fix in the next review pass are in `android_internal_testing_results.md`** (git-ignored, local). As of 2026-07-26: the 4 previously-marked bugs (language selector overlapping the logo, asymmetric player cards, back button/gesture exiting instead of navigating in-app, hot-seat colour swatches hardcoded to cream/green) are all fixed — check that file for anything newer before starting the next review pass.

## Tech stack

- **React 18 + Vite 5 + TypeScript (strict)**; SVG board (auto-scales via `viewBox`); no UI framework.
- **Supabase** (project ref `ggyjxayazxbjvjbeecxa`): Postgres + RLS, Auth (Google only — email sign-in was removed), Realtime, Edge Functions, pg_cron sweeps. The Firebase → Supabase migration **completed and cut over 2026-06-09 (0.4.0.0)** — client is 100% Firebase-free. `SUPABASE_MIGRATION.md` keeps the full schema/function inventory and conventions.
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
| Rhombus (1..6..1) — hidden from pickers (`BANNED_SHAPES`, `src/types.ts`) | 36 | horiz + 2 triangular diagonals | 23 | 108 |

## UI rules

**Accessibility — EU Accessibility Act (WCAG 2.1 AA), decided 2026-11-01.** Text must work at **200%** (browser font size and Android system font size) with nothing cut off or overlapping. At normal text size the one-screen/no-scroll rules below still hold; only when text is enlarged may a screen scroll vertically — never sideways. Don't fix overflow by capping text growth; let painted containers grow or wrap. Test at 130/160/200% in Lithuanian at 320–360px. A full EAA audit (contrast, labels, touch targets, focus, accessibility statement) follows the text-size work.

**Hard rule — nothing escapes the viewport.** `body { overflow: hidden }`; everything must fit at iPhone-SE (~320×568) — emulate 320px before merging layout changes. Recurring traps: inline-flex pill rows need `flex-wrap: wrap; max-width: 100%`; use the `100vh`/`100dvh`/`100svh` cascade (mobile URL-bar); flex columns need `min-height: 0` for scrollable children; `position: fixed` overlays need reserved space via `body:has(...)`.

**Hard rule — text must never overlap other text.** A multi-span flex row with `white-space: nowrap` on the children but no per-child overflow guard is the recurring cause: text ignores its shrunk flex-box width and spills into the next sibling instead of wrapping or clipping. Every fixed/short label in a tight row (a stats line, a badge, a compact HUD row) needs either `flex-shrink: 0` (reserve its full content width, let a neighboring flexible element absorb the squeeze) or its own `overflow: hidden; text-overflow: ellipsis;` — never leave a nowrap span unguarded next to another. Test with **Lithuanian**, not English — it's consistently the longest UI string in this app ("BOT" → "BOTAS", "avg" → "vid.") and is what actually breaks these rows in practice. Known offender found 2026-08-16: `.stats-line`/`.stats-mode` in `SidePanel.tsx` (side-panel per-difficulty stats row) — fixed 2026-11-01 on `android-v8` (panel max 184px).

**Theme art:** painted (Gemini) art per theme goes through `src/themeArt.ts` (URLs + pixel geometry → CSS vars + `html[data-art~=…]` slots); workflow, prompt blocks and `scripts/process-art.mjs` in `docs/art/`. Forest & Pearl has header sign, plaque/pill/primary buttons, card frame, title banner. Home menu must fit one screen (sign, pills, buttons share one fluid width).

**Theme:** Glass Orb — glassmorphism over dark green vignette + film grain. Multiple selectable color themes via CSS vars. Popovers keep `backdrop-filter`; **persistent game-screen surfaces don't** (GPU cost on cheap phones — 0.4.5.0 diet). CVD-safe palette, distinguishable by luminance alone: `--p1` `#0d4a23` (dark green) / `--p2` `#d3ecaa` (cream) + `-glow`/`-bright` variants, `--accent` `#7bdb95`.

**Game screen:** topbar (back · "X pts left" + pending badge, always rendered `visibility:hidden` when empty so height never shifts · `?` rules). Desktop: panel · board · panel. Phone (`max-width: 720px` or short landscape): one `ScoreStrip` above the board — avatars with a ring in the player's dot colour, full names (2 lines; a name with an over-long word ellipsizes on 1), rating only (stats stay on the desktop card), large centred score, ranked clocks under it; the side panels are not rendered (`useMediaQuery(PHONE_GAME_LAYOUT)`). Active side/panel gets a breathing glow. **Orientation is never locked** (WCAG 1.3.4, 2026-11-01): short landscape (`orientation: landscape and max-height: 500px`) puts the strip's two halves on either side of the board (score + clock inside each card, `.ss-side-score`; both cards always equal size), "pts left" stays stacked over the pending badge and centred on the screen, menus/game-over go two-column, the lesson stacks both compact cards on the left so the coach bubble gets the right column — all fit 568×320 with no scroll. Rotation keeps the app running (no reload); on the emulator the switch looks jumpy (Android snapshot-rotate + late WebView redraw) — check on a real phone before "fixing" it.

**Rendering:** dots are glassy 3D spheres (radial gradient + specular); the SVG `dot-shadow` blur filter applies ONLY to the last-placed dot (perf). Strikes are two stacked strokes (outer base ×0.575 of `strokeWidth = r*0.42`, inner highlight ×0.22) with 5R/3 overshoot, after dots, `pointer-events: none`.

**Pending lines are invisible by design** except vs Beginner/Easy/Medium bots on Triangle — hardcoded in `effectiveShowRings` (`App.tsx`), no toggle; there each one is a static cream dashed stroke (gold is reserved for the lesson's "tap here"); every strike stays at full strength (the 0.4.23.0 fade of older strikes was removed 2026-10-23: it hid who took a line) — **no animation on board content, ever**. **Claiming:** click any colored dot in a pending line → longest pending line through it is claimed. Animations: dot pop 380ms, strike fade ~360ms; no infinite board animations; topbar `min-height` and absolute thinking-dots prevent layout shift.

Rules popover opens from menu footer AND in-game `?`; `AppFooter.tsx` is the only path to Settings mid-game.

## AI (`ai.ts`)

AI plays P2; all levels shuffle candidates (non-deterministic); `AI_DELAY_MS = 250`.

| Level | Strategy |
|---|---|
| L1 | Finishes some line ~35% of the time, else random |
| L2 | Biggest line ~60% of the time, else random |
| L3 | Greedy; when nothing scores, ~10% avoids setting the opponent up (`npm run simulate:ladder`) |
| L4 | 1-ply minimax: `my_gain − opp_best_response` |
| L5 | 3-ply search (my move → every reply → my best follow-up), threat-ordered with cut-offs; pending split "next mover takes biggest" × `PENDING_DISCOUNT = 0.5` |

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

## Production rules

- Never commit directly to main. Make changes on a new branch and open a pull
  request for me to review.
- Never merge a pull request yourself. I will check the preview and merge it.
- Never run commands that could delete or overwrite the production database.

## Current status (2026-10-20) — Alpha 0.4.23.0 (PR #29 open)

2026-10-20: onboarding batch 2 in PR #29; Android 1.3 (versionCode 4) signed .aab built from that branch at `Documents/dotduel-release-v4.aab` for the closed test (start 2026-10-26, ≥12 testers × 14 consecutive days).

### Earlier (2026-10-17) — Alpha 0.4.14.0

2026-10-17: ranked bot matches coin-flip the first mover (server opens for the bot — see `supabase/functions/_shared/bot.ts`); phone ScoreStrip; painted menu (header sign, plaque buttons, footer language/theme); theme art system (`docs/art/`); Android 1.2 (versionCode 3) for closed testing. Achievement pop-ups paused (`SHOW_ACHIEVEMENT_TOASTS`).

### Earlier (2026-06-12) — Alpha 0.4.5.3

Live and ranked on www.dotduel.com. Arc since 0.3.0.0: **ads** (AdSense web + AdMob app, Google CMP — AdSense approval still pending review, requested 2026-06-06) → **0.4.0.0 Supabase cutover + prod domain** → server daily puzzle (0.4.2.0) → onboarding simplification (0.4.3.0) → **victory-card sharing** (0.4.4.0, redesigned 0.4.5.1–3: in-game felt board, 2× render, JPEG share path) → **0.4.5.0 perf GPU-diet + Play Store readiness + native Google sign-in** (Credential Manager → `signInWithIdToken`).

**Open / user-action items:**
- Play Store: keystore creation, Play Console account + Data Safety + listing — walkthrough in `PLAY_STORE_GUIDE.md` (incl. Android OAuth client SHA-1 steps).
- Native Google sign-in needs full e2e on a device with a Google account; iPhone-browser Google 403 still open (the native pattern applies).
- Google consent-screen brand verification (free) before launch.

## Backlog / deferred — don't start without explicit ask

- **Share-link unfurl** — fully built, gated OFF (`ENABLE_SHARE_CARD_LINKS = false` in `src/cloud/shareCards.ts`); Supabase side (table/bucket/`r` fn) is live and harmless. Revive = flip flag + Cloudflare DNS per `cloudflare/SETUP-STEPS.md` (must preserve Namecheap email forwarding). Decision: TBD.
- **Admin dashboard (built 2026-11-10, branch `fix-review-errors`)** — `dotduel.com/#admin` (`src/admin/`, lazy chunk) reads `admin_stats(p_days)`, callable only by uids in `public.admins` (RLS, no policies; add rows in SQL Editor). Shows registrations, online matches (vs people/bots/aborted), daily-puzzle players/attempts per UTC day, online now, app-vs-web split. **Online games only** — user chose not to send local vs-AI/hot-seat games to the server. Platform: `profiles.last_platform/platforms_seen/last_app_version` via `record_client()` once per load (`src/cloud/clientRecord.ts`); GA4 user property `app_platform` (register it as a user-scoped custom dimension in GA4 to report on it).
- **Solana prize wallet (requested 2026-11-10) — ON HOLD for a legal check** (giveaway of SOL at 10k registrations: lottery/sweepstakes rules LT/EU, Google Play contest + crypto policies, privacy-policy line, tax). Planned design when cleared: separate owner-only table (not `profiles`), base58 32–44 char check server-side, "we never ask for your recovery phrase" note, included in data export/delete; ask web/app scope again (web-only was the recommendation).
- **Player counters (requested 2026-10-18, extended 2026-11-02)** — counting now lives in `admin_stats` (see Admin dashboard); a public counter is still **hidden** until the user says to show it. Two numbers: (1) **registered players** — `profiles` count excluding seeded bots `b000000…`; (2) **players online now** — from existing presence data (signed-in players seen in the last few minutes; anonymous web/app visitors can't be counted without new tracking — ask before adding any). Optional third: matches played (online ranked/friend matches + daily puzzle runs; local vs-AI/hot-seat can't be counted). Expose via one cached, read-only RPC or a pg_cron-refreshed stats row (cheap, no per-visit COUNT). Placement + wording TBD with user.
- **Donations page (requested 2026-11-02)** — page listing crypto addresses for donations (Solana and other coins; **user will provide the addresses**). Addresses + QR codes only: no payment processor, no wallet SDK, no new dependency, $0. Ask web/app/both before building: Google Play's payments policy restricts in-app donations, so the app likely links out to the web page or omits it — verify the current policy first. Also check whether donations need a line in the privacy policy / any tax note.
- **Onboarding review leftovers** — all shipped in PR #29 (Alpha 0.4.23.0, branch `onboarding-batch-2`, awaiting merge): dashed unclaimed lines (vs-AI Triangle L1–L3 only, hardcoded, no toggle), faded old strikes, losing-streak tip + "one level lower" button (bot itself unchanged), "Your dots" swatch, no ads in first 3 games, no empty ad box, (f) lesson polish, no Resign in game one. Dropped by user: gap lesson step, desktop bubble move, name on end card, bigger phone board.
- **Rankings at scale (requested 2026-11-03)** — review how the Rankings popover behaves if players jump to ~100,000: query cost (RPC/RLS, indexes on rating), payload size, render time on cheap phones. Likely answer: popover shows top 100 + the player's own rank/neighbours; full list paginated (or a separate web page — ties into SEO discoverable pages). Review only, then propose to user.
- **Embeddable no-ads/no-analytics page (requested 2026-11-04)** — iframe embed for other sites, always on the latest build. Proposed: second Vite entry `embed.html` (`/embed/`) in the same build/deploy, NOT separate hosting and NOT a `?embed=1` param (`index.html` loads `consent-default.js` → AdSense/CMP before JS runs). The embed page skips `consent-default.js`; its CSP allows no Google analytics/ad domains (a code bug still can't load them); an embed flag short-circuits `telemetry.ts`/`ads.ts`; no consent banner needed; add it to the SW `navigateFallbackDenylist`. Caveats: Google sign-in is blocked inside iframes → online/ranked/friends/rankings off (show "Play online at dotduel.com ↗"); iframe localStorage is partitioned per embedding site (separate progress); `frame-ancestors` in a meta CSP is ignored and GH Pages can't set headers → anyone can frame it (allow-listing needs the Cloudflare move). Web only. **Open questions for the user before building:** (1) one partner site or a public embed snippet? (2) modes: vs-AI + hot-seat only, or also the daily puzzle/online? (3) "DotDuel.com" link-back badge?
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
4. iPhone-SE portrait: score strip above board; home menu fits with no scroll; nothing scrolls or shifts when badges/thinking appear.
5. Rules popover from menu footer AND in-game `?`.
6. After AI changes: `npm run simulate:l4` (~3 pts max gap); after square/pending changes: `npm run simulate:square` (50/50 + integrity OK).
7. After push to `main`: `gh run list --limit 1` green, prod loads.
8. After multiplayer changes: two-browser sanity (pair, ready, game, GameOver, Elo both sides, session lock releases).
9. After Android-touching changes: `npx cap sync android` + emulator boot (AVD `dotduel_api35`, WHPX accel).
10. After audio changes: place a dot as each player, complete a line, claim a pending line, finish a game each way (win/loss/draw), toggle both new Settings sound switches and confirm they're respected, and switch away from Forest & Pearl to confirm the ambiance stops.
