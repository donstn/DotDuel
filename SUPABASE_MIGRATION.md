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
1. **Client `SUPABASE` transport** (the last core piece), behind a new `CLIENT_SUPABASE_TRANSPORT` flag (**default off**):
   - `src/cloud/onlineGame.ts`: `watchGame` → Realtime (Postgres Changes) on `games`; `sendMove`/`markReady`/`markBoardLoaded`/`claimTimeout`/`claimAbort`/`sendResign`/`requestRematch` → `supabase.functions.invoke('submit-move', …)` + the RPCs (`set_ready`/`set_board_loaded`/`set_rematch`). Preserve the exported signatures.
   - `src/cloud/matchmaking.ts`: `joinQueue` → insert `matchmaking_queue` row + `invoke('matchmake')` (and a short retry while waiting); `watchPairing` → Realtime on `pairings`; `cancelQueue` → delete queue row; `clearPairing` → delete pairing.
2. **2-browser test** (moment of truth): pair → ready → moves → clock → win → Elo in `matches`/`leaderboard`; resign; first-move abort; timeout claim; reconnect (refresh both tabs). Run with `CLIENT_SUPABASE_TRANSPORT = true`.
3. **Then**: bots (`bot-move` Edge Fn, `request-bot-match`, `spawnBotMatch`, `seedBots`), `spawn_rematch` (both-rematch → new game), `botFallbackSweep` (pg_cron), shape-unlock in `matchmake`, and the **coupled modules** onto Supabase (usernames/`watchProfile` = rating-bearing profile, friends, invites, presence, **global Elo leaderboard**, **match history**).

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
