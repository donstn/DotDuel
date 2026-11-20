# Godot port — parity checklist with the React app

User ask (2026-11-20): "build everything as it was on the main game, just with Godot as the engine".
Source inventory: React app as of Beta 0.5.1.0. Skip: ads (off), admin `#admin`, `?diag`, login gate (off),
share-card OG links (off), rhombus (banned), achievement toasts (off).

Legend: [x] done · [~] partial · [ ] todo

**Status 2026-11-20 (evening):** all phases built and reviewed by agents (3 review rounds, findings fixed).
Partial items are marked [~] below with what differs. Signed-in flows (daily save, profile, friends, invites,
achievement cloud sync, referrals) are written against the same Supabase calls as React but were NOT tested
end-to-end — the test browser is never signed in.

## Phase 1 — help, settings, footer
- [x] How to play: 6 engine-built scenes (tabs Step by step / Rules), pause, swipe, ‹ ›, pips
- [x] "▶ Play the tutorial" in How to play (menu only) → needs coach (Phase 4)
- [x] Settings sheet: how to play, sounds, language, theme — still: SFX + music separate toggles (persisted),
      your name, hot-seat P2 name + swap colours, reset progress / reset stats (confirm), privacy toggles [AUTH]
- [x] Menu footer: How to play · Settings · Privacy · version → changelog popover
- [x] In-game cog (done) — game topbar `?` opens How to play on Rules tab

## Phase 2 — progression, names, stats, resume
- [x] progress: unlocks (beat d → d+1; beat ≥2 → next shape L1), locked tiles + hints
- [x] vs-AI name screen (signed out) / username (signed in); hot-seat names + swap colours
- [x] settings store: tutorialSeen, pendingTipSeen, gamesPlayed, claimsMade, aiLossRun, sfx/music
- [~] stats per name (W/D/L by level × shape, hot-seat, points) — stored and shown in Profile/Rankings; no wide-screen side panels (Godot layout is phone-only)
- [x] resume saved vs-AI / hot-seat game (3-day expiry, not at turn 0)

## Phase 3 — game screen + game over parity
- [x] pending lines invisible except vs L1–L3 on Triangle (static dashed, no animation on board content)
- [x] no pulsing last-dot ring; opponent's last dot highlight (vs-AI bot moves only; hot-seat every move)
- [x] toasts: "All dots placed — tap an unclaimed line", "No unclaimed line through that dot"; 350ms input guard
- [x] resign: AI/daily only, not in first game, confirm dialog; hot-seat "leave game?" confirm (skip at turn 0)
- [x] pending-tip bubble (first pending, gamesPlayed<10, not daily)
- [x] game over: titles (Impossible defeated, champion, you resigned), celebration levels, suggestion card
      (loss streak ≥3 → one level lower; unlocked shape/level → try it; next level), Play again / Menu
- [x] pending badge flashes when it grows

## Phase 4 — onboarding
- [x] welcome card (first run): 4 steps, Learn by playing, I know how to play (after 3 s), language buttons
- [x] coach lesson: 6 stages on pre-filled Triangle vs Coach, end card, skip, replay from menu/how-to

## Phase 5 — daily puzzle [AUTH]
- [x] menu card states, `daily-puzzle` fn, opening replay, 3:00 clock, 3 attempts, `finalize_daily`, game over
- [x] puzzle leaderboard popover (month calendar, per-day list)

## Phase 6 — rankings + achievements
- [x] Rankings: local (shape filter, sort, head-to-head, delete), global Elo (top 50, BOT/provisional), puzzle
- [x] achievements: catalogue, unlock tracking, popover, pin featured (profiles.featured_achievement), cloud sync

## Phase 7 — account
- [x] profile popover: name + rename, rating/provisional, last 5 matches, streak, totals, download data,
      delete account (`account-delete`), sign out
- [~] username picker (claim after first sign-in / rename): 3–16 chars; availability checked on Save, not live while typing
- [x] cloud progress merge (profiles.progress)

## Phase 8 — multiplayer extras [AUTH]
- [x] quick ranked card; lobby: 3min only, shape gating text; match found ready (`set_ready`), BOT tag
- [x] game over MP: outcome subtitles, Elo before→after, rematch (hidden vs bots), Lobby, add friend
- [x] friends popover (online/all/requests, add by username, invite, remove/block), friends chip on menu
- [~] invites: send dialog, incoming card (accept ranked/casual), `accept-invite` — one invite card at a time (React stacks them)
- [x] presence heartbeat (statuses), privacy toggles
- [x] one-device session lock; offline/unreachable states

## Phase 9 — sharing
- [~] share result: website share text + a screenshot of the finished board (not the painted victory card); share sheet on web, download + copied text otherwise; tell-a-friend ?ref= links; referral claim + friend request

## Phase 10 — misc
- [~] changelog popover; Android back parity for every screen/overlay. No error screen: GDScript errors do not crash the app, so there is no crash state to catch
