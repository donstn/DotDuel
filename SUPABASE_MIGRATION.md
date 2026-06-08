# Supabase migration — status & handoff

Branch: **`supabase-migration`** (production `main` is untouched, still 100% Firebase).
Supabase project ref: **`ggyjxayazxbjvjbeecxa`** · URL `https://ggyjxayazxbjvjbeecxa.supabase.co`

## ⚡ SESSION 2 (2026-06-08 pm) — THE CLIENT IS NOW 100% FIREBASE-FREE

Everything that imported Firebase has been ported to Supabase or removed. `src/firebase.ts` is deleted, the `firebase` npm package is uninstalled, and the Firebase deploy configs (`.firebaserc`, `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `database.rules.json`) are removed. **`npm run build` passes; bundle dropped 262 KB → 161 KB gzipped.**

### Done & verified this session
- **#3 usernames** → Supabase `usernames` table (RLS owner-insert/delete + public select; PK enforces uniqueness; no RPC needed). `claim/rename/checkAvailability` rewritten. `username_claim_failed` telemetry kept.
- **#4 friends / invites / presence** → ported. Friends/invites writes go through new **SECURITY DEFINER RPCs** (`send_friend_request`, `accept_friend_request`, `decline_friend_request`, `remove_friend`, `block_user`, `unblock_user`, `send_invite`, `decline_invite`, `cancel_invite`). Subscriptions = initial select + Realtime refetch. Presence = heartbeat upsert (`timestamptz`, not epoch-ms). Friends-only presence visibility preserved via `presence.friend_uids`, maintained by the RPCs (the `guard_presence_cols` trigger was extended to honor `app.allow_protected_write`, matching the profile-guard convention).
- **accept-invite** Edge Function (spawns game + pairings, cancels sibling invites) — deployed.
- **#5 session-lock** → new `game_sessions` table (owner RLS, Realtime); `gameSession.ts` ported. **account-delete** Edge Function (service-role: deletes live `games`, anonymises `matches`, deletes auth user → cascades the rest) — deployed; `account.ts` export reads now Supabase.
- **#6 backstops** → `pg_cron` + `pg_net` enabled. Crons live: **`bot-fallback-sweep`** (every 1 min, pure-SQL closed-tab bot backstop — bot is P2 so no engine needed) and **`expire-stale-invites`** (every 5 min). **Shape-unlock**: `matchmaking_queue.shape` column added; `matchmake` + `request-bot-match` + the sweep now use the queue's shape; `joinQueue` takes an optional `shape` (defaults `triangle`).
- **Auth (#5b)** → `useAuth`/`SignInPopover` now pure Supabase Auth (`AppUser`, native Google `signInWithOAuth` redirect + email/password). Dual-auth Firebase bridge removed. Components use `AppUser` instead of Firebase `User`.
- **Telemetry** → relocated `firebase.ts` analytics to **`src/telemetry.ts`** using **gtag.js GA4** (measurement id `G-9H8DXGC34Z`, Consent Mode shim already in `public/consent-default.js`). Same API (`trackEvent`/`bootSession`/`sha256First8`/`bumpAndGetGameIndex`/`enableAnalyticsIfSupported`/`IS_STAGING`).
- **Strip** → dead Firebase branches removed from `leaderboard/matchHistory/matchmaking/onlineGame`; `App.tsx` privacy write → `updatePrivacy` RPC; Firebase admin dev tools removed; CSP pruned to Supabase + Google Analytics/Ads.
- **Headless verification done:** guard+protected-write flag mechanism; full friend cycle (request → accept → presence friend_uids both ways → remove) simulating two users via JWT claims; invite send/cancel + `expire_stale_invites`. All pass.

### ⚠️ MANUAL LAST-MILE — only you can do these (need browser/dashboards)
1. **Supabase Auth → URL Configuration** (dashboard): set **Site URL** = `https://donstn.github.io/DotDuel/` and add to **Redirect allow-list**: `https://donstn.github.io/DotDuel/**` and `http://localhost:5173/**`. (Required for the native OAuth redirect to return.)
2. **Supabase Auth → Providers → Google**: ensure a **Client ID + Client Secret** are set (the id-token bridge only needed a client ID in the allow-list; native `signInWithOAuth` needs the standard client + secret). **Google Cloud Console → that OAuth client → Authorized redirect URIs**: confirm `https://ggyjxayazxbjvjbeecxa.supabase.co/auth/v1/callback` is present.
3. **2-browser test** (flag is already ON): native Google sign-in, then friends add/accept, invite→accept (a game spawns), presence online/offline, session-lock (two tabs), account-delete (use a throwaway account — it's irreversible), and a **non-triangle** queue match (pass a shape into `joinQueue` or add a shape-picker — server already supports it).
4. **Data migration at cutover**: fill in the 2 players' email/Elo in `scripts/migrate-players.sql` (read from the Firebase console) and run `npx supabase db query --linked -f scripts/migrate-players.sql` AFTER they've each signed into the Supabase build once. Verified-correct mechanism (protected-write flag).
5. **Retire Firebase** (after cutover confirmed): delete Cloud Functions / RTDB / Firestore in the Firebase console; delete the `functions/` dir from the repo; remove `VITE_FIREBASE_*` from `.env.local` / `.env.staging` (inert now, app ignores them); **rotate the Supabase access token + service-role key** (non-expiring, pasted in chat earlier).

### Consciously deferred (not blockers)
- **clock-timeout sweep** — the only #6 item not built. It was deferred on Firebase too (no original to port). The client-driven timeout claim covers the normal case; only the both-clients-crash-mid-turn edge leaves a game stuck `active` (no Elo, harmless). Building it blind risks wrongly finalizing live games. Revisit with finalize_game's exact clock semantics.
- **Shape-picker UI** for multiplayer — server fully supports any shape now; client sends `triangle` until a picker is added.
- **Invite ranked-flag parity** — `games` has no `ranked` column, so invite games follow the same Elo path as queue games (the recipient's ranked toggle isn't honored). Add a `ranked` column + finalize_game read if needed.
- **Rate-limiting on social RPCs** — the Firebase callables had per-minute limits; the Supabase RPCs don't yet (fine for alpha/2 users; add a token-bucket table before public launch).

---

## Decisions
- **Keep Vite** (no Next.js). Move backend Firebase → Supabase (Postgres + Auth + Realtime + Edge Functions). Drivers: SQL preference, portability, predictable pricing.
- **Dual-auth bridge**: one Google login authenticates **both** Firebase (keeps live multiplayer alive) and Supabase (new stack), until cutover. Email/password not bridged (real players use Google).
- **Campaign (Phase 2) is DEFERRED** — user has other ideas; needs a dedicated planning session.
- Sequence: Phase 0 ✅ → Phase 1 ✅ → **Phase 3 (in progress)** → Phase 4 (cutover) → Phase 2 (campaign, later).

## Done & live on Supabase (tested)
- **Phase 0** — full schema (17 tables), RLS on all, auto-create-profile trigger, profile **guard trigger** (fn-only cols: rating/placement/streak), client seam (`src/supabase.ts`), env (`.env.local`).
- **Auth** — `src/auth/supabaseAuth.ts` + `useSupabaseUser.ts` + `AppUser`; `SignInPopover` Google button bridges Firebase popup → `supabase.auth.signInWithIdToken`; `useAuth.signOut` clears both.
- **Phase 1** — **daily puzzle** (`finalize_daily` RPC + Supabase reads), **profile name-sync** (`supabaseProfile.syncProfileName`), **cloud-progress** (`profiles.progress` jsonb).
- **Phase 3 server side** — Deno engine copy; `finalize_game` (Elo) RPC; **`submit-move` Edge Function (deployed)**; `set_ready`/`set_board_loaded`/`set_rematch` RPCs; **`matchmake` Edge Function (deployed)** + `pairings` table; Realtime enabled on `games` + `pairings`.

## Deployed Edge Functions
`submit-move`, `matchmake`. Deploy with `npx supabase functions deploy <name>` (CLI is logged-in + linked; **no Docker needed** — the warning is harmless). **Run `node scripts/copy-engine-supabase.cjs` before deploying engine-dependent functions** (submit-move, future bot-move).

## Migrations applied (via SQL Editor — NOT `db push`)
init schema · rpcs (finalize_daily/complete_level) · finalize_daily_v2 · profile_progress · games_realtime · finalize_game · game_lifecycle_rpcs · pairings.
> We apply SQL through the **dashboard SQL Editor**, not `supabase db push` (CLI migration history is intentionally out of sync). Keep doing that for new SQL.

## NEXT SESSION — finish Phase 3
1. **Client `SUPABASE` transport** — ✅ **DONE** (2026-06-08), behind `CLIENT_SUPABASE_TRANSPORT` in `src/types.ts` (**default off**; checked FIRST in every cloud/ fn, before the Firestore/RTDB branches):
   - `src/cloud/onlineGame.ts`: `watchGame` → initial `select` + Realtime (Postgres Changes) on `games`; `sendMove`/`claimTimeout`/`claimAbort`/`sendResign` → `invoke('submit-move')`; `markReady`/`markBoardLoaded`/`requestRematch` → `set_ready`/`set_board_loaded`/`set_rematch` RPCs. `watchConnection`/`subscribeConnectionDiag`/`watchError` short-circuit (no RTDB). Snake_case→OnlineGame mapper `supabaseRowToOnlineGame`.
   - `src/cloud/matchmaking.ts`: `joinQueue` → upsert `matchmaking_queue` + `pumpMatchmake()` (invoke `matchmake` ×8 @ 2s, self-terminates on `matched`/`not_in_queue`); `watchPairing` → initial select + Realtime on `pairings`; `cancelQueue`/`clearPairing` → delete row; `requestBotMatch` → one more `matchmake` attempt (bots still server-side TODO, returns 'human'|'skip' only).
2. **2-browser test** — ✅ **PASSED** (2026-06-08, flag flipped to `true`): pair, ready, moves+clock, **resign**, **timeout**, **first-move abort** (rating-neutral, confirmed), **normal end**, **reconnect** (mid-game refresh), and **server-side Elo** to `leaderboard` (verified via REST). Fixes found & shipped: matchmake jsonb `time_control` compare (filter in JS, not `.eq`); `submit-move` finish() now writes `state.finished`+winner (client keys GameOver off `state.finished`); `pairings` table re-applied (was never live → PGRST205); `watchPairing` late-session resilience (auth re-attach + subscribe-first). Commits `eb56964`, `24a1ef5`.
3. **Rematch** — ✅ **DONE** (`set_rematch` spawns new game + pairings on both-agree, slots swapped, row-locked idempotent; migration `20260608010000_spawn_rematch.sql`). Client routes via `watchPairing`. Tested.
4. **Bots** — ✅ **DONE** (2026-06-08): 5 bot identities seeded as real `auth.users`+`profiles`+`bots`+`leaderboard` (`20260608020000_seed_bots.sql`); `request-bot-match` Edge Fn (human=P1, bot=P2, bot pre-ready/board-loaded, rating-closest pick); `submit-move` chains `doBotMove` via `EdgeRuntime.waitUntil` (think-delay capped 1.2/2.2/3.5s, `pickAIAction`); `finalize_game` bot-aware `is_bot` (`20260608030000_finalize_game_bots.sql`); client `requestBotMatch` → `request-bot-match`. Bot spawn + moves confirmed by user.

## COUPLED-MODULE AUDIT (2026-06-08) — what's left for Phase 4
Live games are fully Supabase + verified. The remaining gaps are **coupled read modules + social**, which still read from Firebase even though their data now writes to Supabase (so updates render stale). Status: ✅ done · 🟡 needs check · 🔴 still Firebase.
- **Rating display** (`watchProfile`/`loadProfile` in `usernames.ts`) — ✅ **#1 DONE** (2026-06-08): now reads Supabase `profiles` + Realtime (migration `20260608040000_profiles_realtime.sql`); `claimUsername`/`renameUsername` push name via `syncProfileName` so renames propagate while usernames stay Firebase. **NOTE:** new users now keep their Google name (handle_new_user sets `display_name`) instead of being forced to claim — revisit when usernames migrate. **Needs 2-browser check** that rating updates live post-game.
- **Global Elo leaderboard** (`leaderboard.ts`) — ✅ **#2 DONE** (2026-06-08): `watchLeaderboard` reads Supabase `leaderboard` + Realtime. Rankings shows Supabase ratings + bots (user-confirmed).
- **Match history + GameOver Elo delta** (`matchHistory.ts`) — ✅ **#2 DONE**: `watchMatch`/`watchRecentMatches` read Supabase `matches` + Realtime (migration `20260608050000_leaderboard_matches_realtime.sql`).
- **Usernames** claim/availability (`usernames.ts` writes) — 🔴 Firebase. (#3)
- **Friends** (`friends.ts`), **Invites** (`invites.ts` → needs `accept-invite` Edge Fn so invite-to-match works), **Presence** (`presence.ts`) — 🔴 Firebase. (#4)
- **Session lock** (`gameSession.ts`, one-device) — 🔴 Firebase; still *works* via Firebase, migrate for cutover. **Account delete** (`account.ts`) — 🔴 Firebase. (#5)
- **Server backstops not built:** `botFallbackSweep` (pg_cron, closed-tab bot backstop), shape-unlock in `matchmake` (currently triangle-only MVP), `clockTimeout` sweep (both-crash edge — deferred on Firebase too). (#6)

### ▶ RESUME HERE next session
Suggested order: **#3 usernames** (claim/availability → Supabase; also resolves the #1 onboarding note — new Google users currently skip the claim prompt) → **#4 friends/invites/presence** (the big social chunk; build an `accept-invite` Edge Fn so "invite a friend to match" works again) → **#5 session-lock + account-delete** → **#6 backstops** → **Phase 4 cutover**. Scope each against its Firebase original in `functions/src/index.ts` first. The flag is ON, all SQL migrations through `20260608050000` are applied to the live DB, Edge Functions `submit-move`/`matchmake`/`request-bot-match` are deployed. `npm run dev` (Supabase transport active). 2 test accounts: ArV3eikiaTikrai + Donce3 (Google). Session-end commit: `52f2fdd` on branch `supabase-migration`.

## Phase 4 — cutover (after Phase 3 passes the gauntlet)
- Hand-migrate the 2 real players' `display_name` + Elo + leaderboard (map by email).
- Flip `CLIENT_SUPABASE_TRANSPORT` (and retire Firebase MP). Quiet window (no active games) is the target.
- Launch checklist: **custom SMTP** (Resend/Brevo/SES) + **Apple sign-in** (required by App Store) before public launch.
- **Rotate the Supabase access token** (it's non-expiring + was pasted in chat).

## Gotchas / conventions
- **Protected-write flag**: any SECURITY DEFINER RPC writing fn-only cols (rating/streak) must `perform set_config('app.allow_protected_write','on',true)` first — else the guard trigger reverts it.
- **Edge Functions**: `verify_jwt` on by default; client sends the user session JWT via `functions.invoke`. The publishable key (`sb_publishable_…`) is the client key, NOT a JWT (gateway rejects it directly).
- **Clock**: `clock.turnStartedAt` is **epoch-ms** (matches submit-move's `Date.now()`).
- **CSP** (`index.html`) already allows `https://*.supabase.co` + `wss://*.supabase.co`.
- Supabase Google provider needs the **Firebase web client ID** in its "Client IDs" list + **"Skip nonce checks" ON** for the id-token bridge.
