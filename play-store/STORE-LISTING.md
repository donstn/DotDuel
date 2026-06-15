# DotDuel — Play Store listing copy (for review)

Generated assets live alongside this file in `play-store/`:
- `app-icon-512.png` — 512×512 hi-res icon (full-bleed, no baked rounding; Play masks it)
- `feature-graphic-1024x500.png` — feature graphic
- `sources/` — the editable SVGs; re-run `node scripts/build-play-assets.mjs` after edits

Screenshots: DONE — `play-store/screenshots/` (5 × 1080×2160, captured on the emulator across different themes):
- `01-triangle-forest-pearl.png` — midgame Triangle, green theme
- `02-square-twilight-cosmos.png` — midgame Square, indigo/cyan theme
- `03-rectangle-sunset-catan.png` — midgame Rectangle, terracotta theme
- `04-win-celebration-royal-court.png` — win screen with confetti, violet/gold theme
- `05-theme-picker-vintage-press.png` — the theme chooser, parchment light theme
- `06-vs-ai-beginner-coral-reef.png` — Vs AI Beginner (cute robot avatar), teal/coral theme
- `07-vs-ai-impossible-forest-pearl.png` — Vs AI Impossible (menacing bot avatar), green theme

(1080×2160 = exactly 2:1, Play's max ratio; raw 1080×2400 captures are in `.android-test-shots/`. Re-crop via `node scripts/crop-screenshots.mjs`.)

---

## App name (30 char max)
**DotDuel**  *(7 chars)*

---

## Short description (80 char max)

**Primary (recommended):**
> Outsmart a friend or the AI in a fast dot-coloring strategy duel.

*(64 chars)*

**Alternatives:**
- `Place dots, finish lines, outscore your rival — a quick strategy duel.` *(69)*
- `A two-player strategy duel: take turns, complete the most lines, win.` *(68)*

---

## Full description (4000 char max)

> **DotDuel is a fast, elegant two-player strategy game. Take turns coloring dots on a board — complete a line and you score its length. Whoever has the most points when the board fills wins. Simple to pick up, surprisingly deep to master.**
>
> No timers to stress over in single-player. No clutter. Just you, your opponent, and a board that rewards thinking one move ahead.
>
> **▸ Play your way**
> • **Vs AI** — five difficulty levels, from a gentle first game to an opponent that plans two moves ahead. Win to unlock the next level and new board shapes.
> • **Pass-and-play** — one phone, two players. Hand it back and forth, no account needed.
> • **Online multiplayer** — get matched with a ranked opponent, climb the Elo leaderboard, add friends, send invites, and rematch.
> • **Daily puzzle** — everyone gets the same board each day. Chase the best score and compare on the leaderboard.
>
> **▸ Four board shapes**
> Triangle, Square, Rectangle, and Rhombus — each plays differently. Unlock them as you beat the AI.
>
> **▸ How it works**
> On your turn, color any empty dot — or claim a finished line. Completing a line scores its length, but only the longest counts immediately; the rest become "pending" for either player to grab. That one rule turns a simple coloring game into a real tug-of-war.
>
> **▸ Built to respect you**
> • Free to play.
> • Colorblind-friendly palette — pieces are distinguishable by brightness, not just hue.
> • Works great on small screens.
> • Delete your account and data anytime, right from your profile.
>
> Place a dot. Finish a line. Outsmart your rival. Welcome to DotDuel.

*(~1,560 chars — well under the 4,000 limit; trim or expand any section as you like)*

---

## Other listing fields (already prepared in PLAY_STORE_GUIDE.md — repeated here for one-stop review)

- **App / Game:** Game · **Category:** Board · **Price:** Free
- **Privacy policy URL:** https://www.dotduel.com/privacy.html
- **Contains ads:** Yes (AdMob banners on menu + free single-player; none in ranked play)
- **Target audience:** 13+
- **Content rating (IARC):** expected Everyone / PEGI 3–7

---

## Still owed (kept in the plan)
1. Items 3 & 4 from the session plan (Google Cloud debug-SHA-1 OAuth client + real-device sign-in test; fresh signed `.aab`) — blocked on nothing, just not started.
2. **Identity verification CONFIRMED 2026-06-15** → the Play Console upload path (create app → Internal testing → Production) is now unblocked.
