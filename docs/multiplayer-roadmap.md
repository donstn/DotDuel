# DotDuel Multiplayer Roadmap

> **Purpose.** A living ideas + architecture doc to refer back to during multiplayer development so nothing is lost between sessions.

---

## 1. Context

DotDuel today is offline-first: React/Vite/TS, localStorage-only, no backend. The `CLAUDE.md` "Deferred" section already names the three pieces we need — multiplayer, Google auth, Elo rating — but no design has been committed. The Multiplayer card in `src/components/Menu.tsx:41` is a disabled stub. The side panel in `src/components/SidePanel.tsx:71` already renders a `rating` slot showing `—`.

**Goal of this phase:** ship online ranked play between two human players, identified by Google OR email/password account, with a custom Elo system and chess-clock time controls, on a Google-services backend that stays effectively free at "couple thousand games per day" scale.

**Hard constraint (from `CLAUDE.md`):** zero-cost, no-royalty stack. Everything below stays free at expected v1 traffic and never relies on a paid service that locks you in later.

---

## 2. Scope decisions (locked)

| Topic | Decision |
|---|---|
| Auth methods | Google OAuth + Email/Password registration |
| Elo K-factor (placement, games 1–10) | `50, 45, 40, 35, 30, 25, 20, 15, 10, 10` |
| Elo K-factor (steady-state, games 11+) | `32` (FIDE classic) |
| Starting Elo | `1000` |
| Time controls | `1 min / 3 min / 5 min` per player (sudden-death, no increment) |
| Matchmaking | Random ELO-closest pairing **AND** private invite codes — both v1 |
| Stored per game | winner, both scores, shape, time control, Elo deltas, timestamp |

---

## 3. Recommended stack — Firebase (Google's "Spark" free tier)

Everything sits inside one Firebase project, billed under the **Blaze pay-as-you-go** plan (required to use Cloud Functions outbound) but every component below stays inside the free quota at v1 traffic. License-wise these are all Google-provided SDKs (Apache 2.0 client SDKs) — no royalties, no per-user fees.

| Component | What it does | License/cost |
|---|---|---|
| **Firebase Authentication** | Google OAuth + Email/Password sign-in, JWT tokens, password reset emails | Free, unlimited for these providers |
| **Cloud Firestore** | Durable storage: user profiles, Elo, match history, leaderboard, matchmaking queue | 50k reads / 20k writes / 20k deletes / 1 GiB stored — per day free |
| **Realtime Database (RTDB)** | Live game-state sync during an active match (cheaper than Firestore for tiny rapid writes) | 1 GB stored, 10 GB / month egress free, 100 concurrent |
| **Cloud Functions (Gen 2)** | Server-authoritative move validation, matchmaking, Elo finalize, time-out forfeits | 2M invocations / month, 360k GB-sec, 180k vCPU-sec free |
| **Firebase Hosting** | Replaces (or supplements) GitHub Pages once you cut over to `www.dotduel.com` | 10 GB stored, 360 MB/day egress free |
| **Firebase Emulator Suite** | Local dev for Auth/Firestore/RTDB/Functions | Free |

**Alternative considered, deferred:** Cloud Run + WebSocket + Postgres. More control, cheaper at extreme scale (>1M games/day), but ~10× more code to write and operate. Revisit if/when we cross 100k games/day.

---

## 4. Architecture overview

```
                            ┌──────────────────────────┐
                            │   Firebase Hosting       │
                            │   (React PWA at          │
                            │   www.dotduel.com)       │
                            └────────────┬─────────────┘
                                         │
                  ┌──────────────────────┼──────────────────────┐
                  │                      │                      │
        ┌─────────▼─────────┐  ┌─────────▼─────────┐  ┌─────────▼──────────┐
        │ Firebase Auth     │  │ Cloud Firestore   │  │ Realtime Database  │
        │ (Google + Email)  │  │ - users           │  │ - games/{id}/state │
        │                   │  │ - matches         │  │ - games/{id}/clock │
        │                   │  │ - matchmakingQ    │  │ - games/{id}/move? │
        │                   │  │ - inviteCodes     │  │                    │
        └───────────────────┘  └─────────▲─────────┘  └─────────▲──────────┘
                                         │                      │
                                ┌────────┴───────────────┐      │
                                │ Cloud Functions Gen 2  │──────┘
                                │  - validateMove (RTDB) │
                                │  - matchmake (sched)   │
                                │  - finalizeGame        │
                                │  - clockTimeout        │
                                └────────────────────────┘
```

**Why split Firestore + RTDB?** Firestore is great for queries (leaderboard, profile, history) but billed per-document-read — expensive at 50 moves × 2 listeners per game. RTDB is bandwidth-billed and built for low-latency game state. Standard Firebase multiplayer pattern.

---

## 5. Authentication design

### 5.1 Providers
- **Google Sign-In** — `signInWithPopup(googleProvider)` on desktop, `signInWithRedirect` on mobile (popups blocked on iOS Safari).
- **Email/Password** — `createUserWithEmailAndPassword` + `sendEmailVerification` (built-in). Block ranked play until email is verified (anti-abuse).

### 5.2 Username & display name
- On first sign-in, prompt for a unique `displayName`. Validate uniqueness via a transactional check on a `usernames/{lower}` document (Firestore can't natively enforce unique fields, this is the standard workaround).
- Display name is what shows in the side panel + leaderboard. Length 3–16, `[a-zA-Z0-9_-]`.

### 5.3 LocalStorage migration on first sign-in
- The `Settings.playerName` becomes the suggested `displayName`.
- `dotduel:stats:v4` is uploaded as the user's "offline history" tab inside their cloud profile (kept separate from Elo / multiplayer stats so unranked + ranked never mix).
- `dotduel:progress:v3` syncs to cloud — vs-AI unlocks should travel with the account.

---

## 6. Elo system

### 6.1 Formulas
```
expected_A = 1 / (1 + 10^((rating_B - rating_A) / 400))
delta_A    = K * (actual_A - expected_A)         // actual: 1 win / 0.5 draw / 0 loss
rating_A'  = round(rating_A + delta_A)
```
Both players' updates are computed in a single Cloud Function transaction post-game.

### 6.2 K-factor table (per individual player)
| Game # for that player | K |
|---|---|
| 1 | 50 |
| 2 | 45 |
| 3 | 40 |
| 4 | 35 |
| 5 | 30 |
| 6 | 25 |
| 7 | 20 |
| 8 | 15 |
| 9 | 10 |
| 10 | 10 |
| 11+ | 32 |

K is **per player**, not per game — a veteran (K=32) paired against a placement player (K=50) is normal. Each side uses their own K.

### 6.3 Placement / "provisional" UX
- Profile shows `Elo: 1100 (provisional, 3/10)` until placement finishes.
- Leaderboard hides provisional players (they sort, but don't appear in the public top-N until placement is done — prevents the "newcomer wins 1 game and tops the chart at 1050" weirdness).

### 6.4 Anti-snipe / sandbagging notes
- Elo only mutates for ranked queue matches. Private invite-code games are unranked by default, with a toggle to opt both into ranked.
- Disconnect = loss on timeout (handled by clock-timeout Function below).

---

## 7. Matchmaking

### 7.1 Queue model
- Player clicks `Find ranked match` → client writes to `matchmakingQueue/{userId}`:
  ```
  {
    elo: 1234,
    timeControl: '3min',
    joinedAt: serverTimestamp(),
    initialRange: 50      // expands over time
  }
  ```
- A Cloud Function `matchmake` runs on a 2s schedule (Cloud Scheduler → Pub/Sub → Function). It:
  1. Reads everyone in the queue grouped by `timeControl`.
  2. For each waiting player, finds the closest-Elo other waiting player within `currentRange = initialRange + 25 * secondsWaiting` (expands ~25 Elo/sec, capped at 500).
  3. On pairing: creates `matches/{matchId}` doc + `games/{gameId}` RTDB node, removes both from queue, writes pairing-found notification.
- Both clients have a listener on `matchmakingQueue/{myId}` and on a `pairings/{myId}` doc — second one tells them which game to join.

**Cost note:** Scheduled functions are cheap. 1 invocation every 2s = ~1.3M/month — within free 2M. Each run reads queue snapshot (a few docs).

### 7.2 Private invite codes
- `Create private game` → Cloud Function generates a 6-char base32 code (e.g. `XK4F2A`), writes `inviteCodes/{code} = {hostId, timeControl, ranked: bool, createdAt}`.
- Host gets a shareable URL: `https://www.dotduel.com/join/XK4F2A`.
- Guest opens link, signs in if needed, clicks Join → Function pairs them and creates the game.
- Code is single-use, 1-hour TTL.
- Ranked toggle: off by default; turning it on requires the host be past placement.

---

## 8. Time controls — chess-clock model

### 8.1 State stored
For each active game, in RTDB at `games/{id}/clock`:
```
{
  p1RemainingMs: 180000,
  p2RemainingMs: 180000,
  turnStartedAt: 1730000000000,   // server timestamp at start of current turn
  current: 1,
  totalMs: 180000                 // for display / forfeit threshold
}
```

### 8.2 How time decrements
- Clock is **never** decremented on a tick. Server only updates on move:
  1. Player N submits move.
  2. `validateMove` Function reads `turnStartedAt`, computes `elapsed = serverTime - turnStartedAt`.
  3. `pN.remainingMs -= elapsed`. If now ≤ 0 → forfeit (other player wins).
  4. Otherwise apply move, swap `current`, set new `turnStartedAt = serverTime`.
- Client locally extrapolates remaining time from `(turnStartedAt, p1RemainingMs)` for the live countdown UI. No client → server clock writes ever.

### 8.3 Forfeit on idle
- A scheduled Function `clockTimeout` every 15s scans active games where `current` player's projected `remainingMs - (now - turnStartedAt) ≤ 0`, declares forfeit, finalizes.

### 8.4 Modes shown to player
| Mode | Per player | Total possible game length |
|---|---|---|
| Bullet | 1 minute | up to 2 min |
| Blitz | 3 minutes | up to 6 min |
| Rapid | 5 minutes | up to 10 min |

---

## 9. Server-authoritative game flow (anti-cheat)

The crucial insight from the codebase exploration: `src/game.ts` is **already pure**. `applyMove`, `applyClaim`, `applyAction`, `availableActions`, `pointsIfPlayed` have no I/O, no globals, no DOM. Geometry (`src/geometry.ts`) is also pure data.

→ **Move both files into a shared `packages/dotduel-engine/` workspace** (or just symlink/copy into a `functions/src/engine/` folder during build) so the Cloud Function runs the *exact same code* the client runs. No drift, no second implementation.

### 9.1 Move submission protocol
- Client → RTDB write at `games/{id}/pendingMove`:
  ```
  { from: userId, action: { kind: 'dot', dotId: 17 }, clientTime: ... }
  ```
- RTDB trigger Function `validateMove`:
  1. Reads `games/{id}/state` (current `GameState`).
  2. Reads `games/{id}/clock`.
  3. Checks `state.current === playerSlotFor(from)`.
  4. Calls `applyAction(state, action)`.
  5. If invalid → writes rejection back to `games/{id}/error`, clears pendingMove.
  6. If valid → updates state + clock atomically, clears pendingMove.
- Other client gets pushed the new state via their listener.

### 9.2 Game finalize
- When `newState.finished === true`, Function `finalizeGame`:
  1. Computes Elo deltas (using each player's current K).
  2. Transactionally updates both `users/{id}` docs (rating, placementGamesPlayed, W/D/L counters).
  3. Writes `matches/{matchId}` with full result (both scores, winner, shape, timeControl, ratingsBefore, ratingsAfter, deltas, durationMs, moves[] if we want replays).
  4. Sends the game-over event to clients via RTDB.

### 9.3 Reconnection
- A signed-in user on app load checks `users/{me}/activeGameId`. If set, jump straight back into that game with current state from RTDB.
- Clock kept running on the absent player — bullet/blitz incentives players to come back fast.

---

## 10. Database schema

### 10.1 Firestore (durable)
```
users/{uid}
  displayName: string                 // unique
  email: string
  authProvider: 'google' | 'password'
  rating: number                       // current Elo
  placementGamesPlayed: number         // 0..10
  totalGames: number
  wins: number
  losses: number
  draws: number
  byTimeControl: { '1min': {w,l,d}, '3min': {w,l,d}, '5min': {w,l,d} }
  byShape: { triangle: {w,l,d}, square: {w,l,d}, rectangle: {w,l,d}, rhombus: {w,l,d} }
  activeGameId: string | null
  createdAt: timestamp
  lastSeenAt: timestamp

usernames/{lowercaseDisplayName}
  uid: string                           // enforces uniqueness

matches/{matchId}
  p1: { uid, displayName, ratingBefore, ratingAfter, score, delta }
  p2: { uid, displayName, ratingBefore, ratingAfter, score, delta }
  shape: ShapeId
  timeControl: '1min' | '3min' | '5min'
  ranked: boolean
  winner: 1 | 2 | 'draw'
  durationMs: number
  finishedAt: timestamp
  // optional: moves: GameAction[]    // enables replays; small (~50 actions × ~16 bytes)

matchmakingQueue/{uid}                  // ephemeral, deleted on pairing
  rating: number
  timeControl: string
  joinedAt: timestamp

inviteCodes/{code}                       // ephemeral, TTL 1 hour
  hostUid: string
  timeControl: string
  ranked: boolean
  createdAt: timestamp
```

### 10.2 Realtime Database (live game)
```
games/{gameId}
  /state          // GameState (full)
  /clock          // see §8.1
  /pendingMove    // client-writable, function-cleared
  /error          // function-written, client-listened
  /chat?          // deferred
```

### 10.3 Security rules sketch
- `users/{uid}`: read = signed-in user, write = own uid OR cloud function only (for rating).
- `matches/{*}`: read = anyone signed in, write = cloud function only.
- `matchmakingQueue/{uid}`: read+write own uid only.
- `games/{id}/pendingMove`: write = participants only; everything else read-only to participants, write Function-only.

---

## 11. Cost model

### 11.1 Per-game cost components (back-of-envelope)

Assumed average ranked game on the 3-min control:
- ~50 actions (placements + claims)
- 50 RTDB writes by client (`pendingMove`)
- 50 Function invocations (`validateMove`)
- ~50 RTDB writes by Function (state + clock updates)
- ~10 KB total egress per player via RTDB listener (200 bytes × 50 pushes)
- 5 Firestore writes post-game (2 user updates, 1 match record, 2 secondary)
- ~10 Firestore reads (lobby load, profile open, leaderboard touch)

### 11.2 Free tier vs. your traffic

| Daily traffic | Functions invocations / mo | RTDB egress / mo | Firestore writes/day | Estimated bill |
|---|---|---|---|---|
| **2,000 games/day** (≈ user's target) | ~3M | ~1.2 GB | ~10k | **~$0.40 / mo** (≈ $0.000007 / game — essentially free) |
| 10,000 games/day | ~15M | ~6 GB | ~50k | **~$7 / mo** (≈ $0.00002 / game) |
| 100,000 games/day | ~150M | ~60 GB | ~500k | **~$150 / mo** (≈ $0.00005 / game) |

### 11.3 Free quotas as of 2026
- Auth: free unlimited for Google + Email/Password
- Cloud Functions Gen 2: 2M invocations / 360k GB-sec / 180k vCPU-sec per month free
- Cloud Functions over-quota: $0.40 per million invocations
- Firestore: 50k reads / 20k writes / 20k deletes per **day** free; over: $0.06/100k reads, $0.18/100k writes
- Realtime Database: 10 GB egress / month free; over: $1 / GB
- Hosting: 10 GB stored, 360 MB/day egress free
- **Auth (above 50k MAU)**: $0.0055 per MAU — won't bite us at v1 traffic

### 11.4 Cost ceilings — when to reconsider stack
- If Functions invocations are dominating: shard `validateMove` into `validateBatch` (queue up moves, validate in 5s batches) — cuts invocations ~5×.
- If RTDB egress exceeds 50 GB/mo (~$50): migrate game-state transport to a Cloud Run WebSocket service, billed by CPU-second not bandwidth.
- If Firestore writes get expensive (>$50/mo): collapse per-player update + match record into a single sharded counter per day.

---

## 12. Phased rollout

Don't try to ship all of this in one PR. Six phases, each independently testable.

### Phase A — Firebase project + Auth (no game changes)
- Create Firebase project, enable Spark→Blaze, register web app, drop config into `src/firebase.ts`.
- Build `<AuthGate>` wrapper, Google + Email/Password sign-in screens.
- Unique-username flow with `usernames/` doc.
- Profile screen showing current localStorage stats as "offline history."
- **Acceptance:** can sign in with Google AND register/log in with email; refresh keeps you signed in; sign-out works.

### Phase B — Cloud profile sync
- Migrate `Settings.playerName` → `users/{uid}.displayName`.
- Migrate `dotduel:progress:v3` → `users/{uid}.unlockedByShape` (sync both ways with last-write-wins).
- LocalStorage stays as offline fallback when signed out.
- **Acceptance:** sign in on a fresh browser, see your unlocks; play vs-AI offline, sign in, unlocks merge correctly.

### Phase C — Multiplayer lobby + matchmaking (no game yet)
- Enable the Menu.tsx multiplayer card.
- New `<MultiplayerLobby>` screen — time control picker, "Find ranked match" + "Create private game" + "Join with code" buttons.
- Build matchmaking queue + scheduled `matchmake` function.
- Build invite-code create + join flow.
- Server creates an empty RTDB game node and routes both clients to a "waiting room" — no actual play yet.
- **Acceptance:** two devices/browsers can be paired; private codes work; cancel-queue works.

### Phase D — Server-authoritative game with realtime sync
- Move `game.ts` + `geometry.ts` into a shared module consumable by both client and Functions.
- Wire `validateMove` Function.
- Client renders `state` from RTDB instead of local React state when in multiplayer mode.
- **Acceptance:** play a full game end-to-end; cheating attempts (invalid move) get rejected; disconnect/reconnect resumes correctly.

### Phase E — Elo, time controls, match history
- Add the K-table from §6.2 to `finalizeGame`.
- Add chess-clock (§8) with the three modes.
- Add `clockTimeout` scheduled function.
- Surface Elo + rank in `SidePanel.tsx` (the slot already exists at line 71).
- Profile page: match history list, per-time-control W/D/L, byShape breakdown.
- **Acceptance:** 10 placement games promote a new account out of "provisional"; running out of time on the clock is a loss; match history is correct.

### Phase F — Leaderboard, polish, polish
- Global top-100 (non-provisional only).
- Friend list (deferred; nice-to-have).
- Replays from stored `moves[]` (deferred).
- Production domain cutover (`www.dotduel.com`).

---

## 13. Critical files in the current codebase

These are what implementation will touch (don't refactor preemptively — listed so the future agent knows where to start):

| File | Touch type | Why |
|---|---|---|
| `src/components/Menu.tsx:41` | Edit | Enable the disabled Multiplayer card; route to new lobby screen |
| `src/App.tsx:30` | Edit | Extend `Screen` union with `'lobby' \| 'matchmaking' \| 'mpGame'` |
| `src/App.tsx:109` | Edit | AI scheduler must NOT run in multiplayer mode — gate on `config.mode` |
| `src/storage.ts` | Edit | Add cloud-sync layer; keep localStorage as offline fallback |
| `src/components/SidePanel.tsx:22,71` | Edit | Wire real Elo string into the existing `rating` slot |
| `src/game.ts` + `src/geometry.ts` | Move/share | Become shared module between client and Cloud Functions |
| `src/types.ts:43` | Extend | `GameState` may need `gameId`, `players: { p1, p2 }` |
| `src/firebase.ts` | **New** | SDK init |
| `src/auth/` | **New** | Sign-in screens, AuthGate, useUser hook |
| `src/mp/` | **New** | Lobby, matchmaking client, game-state hook |
| `functions/` | **New** | Cloud Functions root (validateMove, matchmake, finalizeGame, clockTimeout) |
| `firestore.rules`, `database.rules.json` | **New** | Security rules |
| `firebase.json` | **New** | Project config |

---

## 14. Open questions (to resolve when implementation begins)

- **Email verification gating** — do we block ranked play until email is verified, or just lock the leaderboard? Default plan: block ranked, allow vs-AI.
- **Anonymous play** — should there be a "play as guest" option that doesn't create an account but still allows private-code matches? Likely yes, but no Elo.
- **Account deletion / GDPR** — needs to be wired before we open EU sign-ups. Cloud Function that nukes `users/{uid}`, `matches/{*}.p?.uid`, etc. Connect to existing Rankings "delete profile" flow.
- **Mobile push notifications for invites** — out of scope for v1; revisit when PWA install adoption is real.
- **Cheating via two accounts to farm Elo** — basic mitigations only at first: IP rate-limit on account creation, flag suspicious win patterns. Not building a full anti-fraud system in v1.
- **Replays / spectating** — store `moves[]` in `matches/{id}` from day one (cheap), build the viewer later.
- **Server region** — pick `europe-west1` (Belgium) since user is Lithuania-based; latency to US players will be ~120ms which is fine for turn-based.

---

## 15. Verification (when implementation lands)

End-to-end smoke test, in order:

1. Create two fresh accounts (one via Google, one via Email/Password) in two different browsers.
2. Both queue for a 3-min ranked match → matched within ~10 seconds, both land in the same game.
3. Play a full game — corner placement scores a 1-point line, double-completion parks one as pending, claim flow works (same as offline rules).
4. Game ends → both players' Elo updates by ±K (K=50 on first game) → match appears in both profiles' history.
5. Repeat 10 games on one account → confirm K-factor steps down `50, 45, 40, 35, 30, 25, 20, 15, 10, 10` then jumps to 32 on game 11. Profile loses "provisional" label after game 10.
6. Create a private invite code, share URL, second account joins via URL → unranked game by default; toggle "ranked" off both, confirm Elo unchanged after.
7. Mid-game disconnect on one client (close tab) → other client's clock keeps running → forfeit fires at 0:00 → other player wins.
8. Try to submit an invalid move via direct RTDB write (devtools) → Function rejects it; legitimate gameplay unaffected.
9. Run `npm run simulate:square` — offline vs-AI sim still passes (Phase A–F must not regress single-player).
10. Open Firebase Console → confirm daily Function invocations + Firestore writes are well within free tier after a day of light playtesting.

---

## 16. Next session

When you come back to start implementation, the natural first step is **Phase A**: create the Firebase project, set up the Auth screens, get `signInWithPopup` working. Do not start with the game logic — auth is the gate everything else hangs on, and the rest of the plan presumes a signed-in `users/{uid}` doc exists.
