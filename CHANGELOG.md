# Changelog

All notable changes to DotDuel will be documented in this file. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **Phase D — multiplayer is playable end-to-end.** After matchmaking
  pairs two players, the new "Start playing →" button on the
  Opponent-found screen transitions both clients into a synced board
  driven by Realtime Database. Every move is validated server-side
  via the `validateMove` Cloud Function using the shared engine
  (`functions/src/engine/` is auto-copied from `src/` on every
  functions build, so client and server run the exact same scoring
  logic — no drift possible). Out-of-turn submissions and invalid
  moves are rejected at the server. Game-over screen appears when
  both boards reach the same finished state.
- **Multiplayer lobby + matchmaking** (Phase C). New Multiplayer card on
  the menu (enabled when signed in) opens a lobby with three time
  controls: Bullet (1 min/player), Blitz (3 min/player), Rapid
  (5 min/player). "Find ranked match" queues you and shows a waiting
  screen with an animated spinner + elapsed-seconds counter; an
  event-driven Cloud Function (`matchmake`, region `europe-west1`)
  fires on every queue write, scans for the closest-rating opponent in
  the same time-control bucket (range expands ~25 Elo/sec, capped at
  500), and pairs them via a Firestore transaction. Both clients
  auto-transition to a "Opponent found!" screen showing each player's
  displayName + rating. Actual board sync ships in Phase D.
- **Cloud Functions Gen 2 deployment infrastructure** — `functions/`
  directory with TypeScript, `firebase-admin`, `firebase-functions`,
  and a build/deploy pipeline wired through `firebase.json`.
- **Unique game name + rename** (Phase A.2). Forced UsernamePicker on
  first sign-in claims a `usernames/{lower}` doc atomically via
  Firestore transaction; rename available from Profile with debounced
  availability check (450 ms). On rename, local stats migrate from the
  old name's row to the new name's so W/D/L history follows the
  account.
- **Cloud profile + progression sync** (Phase B). `users/{uid}` doc
  stores displayName + email + rating + unlock progression. On
  sign-in, local and cloud unlocks max-merge so unlocks travel between
  devices; every recorded win fire-and-forget saves to cloud.
- **Profile popover** opens from the Welcome line in the menu. Shows
  account info (display name, email, sign-in method, verification
  status) and offline W/D/L stats for the current game name. Includes
  inline Rename and Sign out buttons.
- **Firebase Authentication** (Phase A). Google sign-in via popup +
  Email/Password registration with confirm-password and verification
  email that redirects back to the app. The Google provider forces
  the account-chooser via `prompt=select_account` so users with
  multiple accounts can switch freely.
- **Firestore security rules** for `users/{uid}` (owner-only),
  `usernames/{lower}` (auth read for availability, owner-only write),
  `matchmakingQueue/{uid}` (own user), `pairings/{uid}` (own user
  read, function write), `matches/{id}` (auth read, function write),
  `inviteCodes/{code}` (auth read, function write).
- **Firebase Analytics** (production builds only) wired up via
  `getAnalytics` in `src/firebase.ts`, gated on `import.meta.env.PROD`
  so dev sessions don't pollute metrics.
- `docs/multiplayer-roadmap.md` — living architecture doc covering the
  Firebase stack, Elo system (50→10 placement K then 32 steady-state),
  matchmaking, chess-clock model, cost model (~$0.40/mo at 2k
  games/day), and the six-phase rollout.

### Added

- Match-found screen now shows a 5-second countdown plus a **Ready!**
  button on each side. The game auto-starts when both players are
  ready *or* when the countdown expires. Ready state syncs in real
  time via the RTDB game node so both players see the other's
  ready/not-ready chip.

### Fixed

- Multiplayer game screen rendered as a blank/black page on first
  load. Firebase RTDB strips empty objects and arrays on write, so
  the freshly-created game state's `colored: {}`, `completed: []`,
  and `pending: []` came back as `undefined` and the Board crashed
  trying to index into them. State is now normalized at the RTDB
  boundary in both the client (`watchGame`) and the server
  (`validateMove`).

### Changed

- Matchmaking waiting screen: "Cancel search" is now a glass-pill
  button centered inside the matchmaking card directly under the
  status line, instead of a small text link floating below the card.
- The menu welcome line is now integrated into the subtitle when
  signed in ("Welcome, *gameName* — take turns coloring dots…") and
  followed by small glass-pill Profile + Sign out buttons. Signed-out
  users see a Sign in CTA pill instead.
- Vs-AI difficulty selection now starts the game directly when signed
  in — the "Who's playing?" name screen is skipped because the cloud
  game name is the only valid input.
- Name input fields in Vs-AI / Hot-seat / Settings lock to the cloud
  game name when signed in with a hint pointing to Profile for
  renames.
- Side panel and `recordGameResult` use the cloud game name when
  signed in, falling back to `Settings.playerName` when signed out.
- Version badge moved from a menu subtitle to the footer alongside
  Rules / Settings, now read from a single `src/version.ts` constant
  used by both the footer and the `main.tsx` console banner.
- "Choose mode" menu header removed — the mode grid is self-evident
  with the auth row sitting directly above it.
- (Earlier in the cycle, pre-Phase A) Mobile-optimised game layout:
  on phone-sized viewports the two player panels stack as compact
  horizontal cards above the board so the board uses the full
  viewport width.
- (Earlier) Mobile-optimised menu: mode cards fit on a single line in
  landscape; narrow portrait stacks them as a single column.
- (Earlier) Vite build sets `base: '/DotDuel/'` for GitHub Pages.
- (Earlier) Hint ring is fully static — no animation.
- (Earlier) Topbar reserves vertical space for the "lines to claim"
  badge instead of growing when it appears.
- (Earlier) Mobile AI thinking indicator is absolutely positioned
  inside the side card so name/score don't reflow.

### Added (earlier in the cycle, pre-Phase A)

- GitHub Pages deploy workflow (`.github/workflows/deploy.yml`).
- Rankings popover from the main menu with per-player stats and
  head-to-head records.
- Delete-profile action in Rankings, gated by a confirmation dialog.
- Square-board stress simulation: `npm run simulate:square`.

## [0.1.0] - 2026-05-20

Initial public commit.

### Added

- Two-player dot-coloring strategy game on four boards: triangle (36 dots),
  square 7x7 (49), rectangle 7x9 (63), rhombus (36).
- "Biggest-only + pending claims" scoring rule (Variant F) — completing
  multiple lines on one move scores only the longest; the rest become
  pending and can be claimed by either player on a later turn.
- 5-tier AI (L1 Beginner -> L5 Impossible) with distinct robot avatars
  and a 450 ms move delay.
- Hot-seat and vs-AI game modes; cross-shape unlock ladder driven by
  vs-AI wins, stored in localStorage.
- Glassmorphism UI on a dark green vignette: 3D glass-orb dots,
  two-line crossline strikes, side player panels, slim top bar.
- Rules popover, settings, first-time tutorial, game-over screen with
  unlock banner.
- Headless simulation scripts (`npm run simulate`, `simulate:l4`,
  `simulate:f`, `simulate:tri8`) for AI balance research.
