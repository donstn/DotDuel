# Supabase migration — status & handoff

Branch: **`supabase-migration`** (production `main` is untouched, still 100% Firebase).
Supabase project ref: **`ggyjxayazxbjvjbeecxa`** · URL `https://ggyjxayazxbjvjbeecxa.supabase.co`

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
