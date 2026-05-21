# Changelog

All notable changes to DotDuel will be documented in this file. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Mobile-optimised game layout: on phone-sized viewports the two player
  panels stack as compact horizontal cards above the board so the board
  uses the full viewport width.
- Mobile-optimised menu: mode cards (Vs AI, Hot-seat, Multiplayer) fit on
  a single line in landscape; narrow portrait stacks them as a single
  column so 3 cards no longer wrap as 2 + 1.
- GitHub Pages deploy workflow (`.github/workflows/deploy.yml`) that
  builds and publishes `dist/` on every push to `main`.
- Rankings popover from the main menu — per-player stats and
  head-to-head records across vs-AI and hot-seat games.
- Delete-profile action in Rankings, gated by a confirmation dialog.
- Square-board stress simulation: `npm run simulate:square` runs 50
  games of L5 vs L5 on the square, reporting scoring integrity,
  double-turn anomalies, peak pending-line count, and per-game runtime.

### Changed

- Landscape phones shrink the on-top player cards by ~30% (smaller
  avatar, name, score) so the board gets more vertical room.
- Per-card stats / points-totals / rating are hidden on the compact
  mobile player cards (still available via the Rankings popover).
- Vite build sets `base: '/DotDuel/'` so production assets resolve on
  GitHub Pages; dev still serves from `/`.
- Mobile board area now has top/bottom padding so the dot-pop animation
  has visual buffer instead of sitting flush against the player cards.
- Hint ring is now fully static — no animation. New players still see
  a soft yellow ring around colored dots that belong to pending lines
  (during the learning window), but the board never strobes.
- Topbar reserves vertical space for the "lines to claim" badge instead
  of growing when it appears, so the board no longer shifts as pending
  lines come and go.
- On mobile, the AI thinking indicator (`···`) is now absolutely
  positioned inside the side card rather than flowing as a 4th flex
  item, so the player name and score don't reflow when the AI starts
  or finishes thinking.

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
