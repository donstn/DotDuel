/**
 * Public-facing changelog. Shown to users via ChangelogPopover when they
 * click the version label in the footer.
 *
 * Conventions:
 * - Newest entry first (top of the array).
 * - `version` matches src/version.ts APP_VERSION exactly.
 * - `date` in ISO YYYY-MM-DD; the popover formats it for display.
 * - `changes` grouped by kind so the UI can render headings.
 * - Add a new entry every time we ship something users would notice. Bug
 *   fixes that users would not perceive don't need to be listed.
 * - Text additions to THIS FILE require explicit user confirmation
 *   before being written. The infrastructure is owned by the engineer;
 *   the wording is owned by the user.
 */

export type ChangeKind = 'added' | 'changed' | 'fixed';

export interface ChangelogChange {
  kind: ChangeKind;
  text: string;
}

export interface ChangelogEntry {
  version: string;
  date: string; // ISO YYYY-MM-DD
  highlight?: string; // optional one-line headline
  changes: ChangelogChange[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: 'Alpha 0.3.6.1',
    date: '2026-06-06',
    highlight: 'Mobile board position',
    changes: [
      {
        kind: 'fixed',
        text: 'The mobile board now actually pulls up near the player cards (the previous attempt didn’t take effect).',
      },
    ],
  },
  {
    version: 'Alpha 0.3.6.0',
    date: '2026-06-06',
    highlight: 'Sign in to play',
    changes: [
      {
        kind: 'added',
        text: 'First load now opens with a “Sign in to play” screen — sign in for multiplayer + cloud-synced progress, or pick “play anonymous” to jump straight in.',
      },
      {
        kind: 'fixed',
        text: 'On phones the board now sits up near the player cards instead of leaving a big gap above it.',
      },
    ],
  },
  {
    version: 'Alpha 0.3.5.0',
    date: '2026-06-06',
    highlight: 'Past puzzle winners + tidier rankings',
    changes: [
      {
        kind: 'added',
        text: 'Puzzle leaderboard now has a “Recent winners” tab — who won each of the last 30 days, with the date next to each name.',
      },
      {
        kind: 'changed',
        text: 'Global Elo rankings now lead with the rating: rank, Elo, then player name.',
      },
    ],
  },
  {
    version: 'Alpha 0.3.4.0',
    date: '2026-06-06',
    highlight: 'Win celebrations scale with difficulty',
    changes: [
      {
        kind: 'changed',
        text: 'Your win celebration now grows with the challenge — a small flurry for a Beginner win, building level by level up to the full gold show for defeating Impossible.',
      },
    ],
  },
  {
    version: 'Alpha 0.3.3.0',
    date: '2026-06-06',
    highlight: 'A cleaner, more polished board — beta-ready',
    changes: [
      {
        kind: 'changed',
        text: 'Redesigned the board frame: the felt now sits in an evenly-spaced, smooth rounded-corner bezel with a subtle recessed 3D look — and it frames every shape correctly, including the triangle’s sharp point (previously the outline looked uneven).',
      },
      {
        kind: 'fixed',
        text: 'Player cards in a game now sit fully on screen as rounded cards instead of bleeding off the edges.',
      },
      {
        kind: 'fixed',
        text: 'Fixed an in-game tip popup whose text could overflow the board.',
      },
    ],
  },
  {
    version: 'Alpha 0.3.2.0',
    date: '2026-06-06',
    highlight: 'A more premium look · win celebrations',
    changes: [
      {
        kind: 'changed',
        text: 'Visual polish pass — buttons and the Vs-AI / shape / difficulty cards now have real tactile 3D depth (they lift on hover and press in on click), and primary buttons match each theme’s colour instead of always being green.',
      },
      {
        kind: 'added',
        text: 'Win celebrations! Finishing a game with a win sets off fireworks and confetti — with an over-the-top gold show for defeating the Impossible AI.',
      },
    ],
  },
  {
    version: 'Alpha 0.3.1.0',
    date: '2026-06-06',
    highlight: 'Straight into the game · clearer home-screen how-to',
    changes: [
      {
        kind: 'changed',
        text: 'Removed the intro tutorial pop-up — the game now opens straight to the menu. The how-to-play is a single clear line right on the home screen, and the full rules are always one tap away via the ? button.',
      },
    ],
  },
  {
    version: 'Alpha 0.3.0.0',
    date: '2026-06-06',
    highlight: 'Ads support the free game · multiplayer no-show protection',
    changes: [
      {
        kind: 'added',
        text: 'Small ads now appear on the menu and free single-player screens (Vs-AI, Hot-seat, Daily) to keep DotDuel free to run. No ads during ranked multiplayer games. Consent is handled by a Google privacy prompt.',
      },
      {
        kind: 'added',
        text: 'Multiplayer no-show protection: if a player doesn’t make their first move within 10 seconds, the game aborts with no rating change for either side — so a disconnect or distraction at the start never costs you.',
      },
    ],
  },
  {
    version: 'Alpha 0.2.9.0',
    date: '2026-06-06',
    highlight: 'Visual revamp + readable on every theme',
    changes: [
      {
        kind: 'changed',
        text: 'Fresh look: new typography, a framed board that matches each shape (triangle, diamond, square), brighter pieces, and clearer scores.',
      },
      {
        kind: 'changed',
        text: 'Player panels scale down gracefully as the screen shrinks — on phones they collapse to a compact card with the avatar beside the name, giving the board more room.',
      },
      {
        kind: 'changed',
        text: 'Settings, Rules, and Privacy are tidied into clean cards that are easier to scan.',
      },
      {
        kind: 'fixed',
        text: 'Empty dots now read clearly on every theme instead of fading into the board — especially on the light themes.',
      },
      {
        kind: 'fixed',
        text: 'Buttons, the Game-Over screen, and popovers are no longer hard to read on the light themes (Monochrome Pro, Vintage Press) — text and backgrounds keep proper contrast everywhere now.',
      },
    ],
  },
  {
    version: 'Alpha 0.2.8.0',
    date: '2026-06-05',
    highlight: 'Full keyboard play',
    changes: [
      {
        kind: 'added',
        text: 'Full keyboard play: Tab to the board, arrow keys to move between dots, Enter or Space to place or claim a line.',
      },
      {
        kind: 'changed',
        text: 'Ranked matches now find you a bot opponent in about 15 seconds when no human is available, instead of up to a minute.',
      },
    ],
  },
  {
    version: 'Alpha 0.2.7.2',
    date: '2026-05-31',
    highlight: 'Fix: endgame flicker / black screen',
    changes: [
      {
        kind: 'fixed',
        text: "The mid-to-late game flicker (and occasional black screen) on busier boards is gone. Each completed line used to render with an additive blend effect for a brighter highlight; on Square and Rectangle this stacked dozens of GPU compositor layers, eventually overflowing mobile graphics memory. Lines now render with simple high-contrast colours instead — the bright \"ribbon\" look is preserved, the crash is not.",
      },
    ],
  },
  {
    version: 'Alpha 0.2.7.1',
    date: '2026-05-31',
    highlight: 'Fix: no more flicker on Square/Rectangle',
    changes: [
      {
        kind: 'fixed',
        text: "The \"See unclaimed lines\" highlight now only appears on the Triangle board. On Square and Rectangle it occasionally caused the screen to flicker and go dark when many lines were unclaimed. The toggle is hidden on those shapes until the underlying visual bug is fixed.",
      },
    ],
  },
  {
    version: 'Alpha 0.2.7.0',
    date: '2026-05-31',
    highlight: 'Daily puzzle: 3 tries + leaderboard',
    changes: [
      {
        kind: 'changed',
        text: "You now get 3 attempts at today's puzzle instead of 1. Your best margin is the one that counts — the streak still bumps after your first finish of the day.",
      },
      {
        kind: 'added',
        text: "New \"Puzzle leaderboard\" card on the menu. Today's top margins live, sorted from biggest to smallest. Ties broken by who finished first. Historical leaderboards (by day, month, name search) coming soon.",
      },
    ],
  },
  {
    version: 'Alpha 0.2.6.0',
    date: '2026-05-31',
    highlight: "Today's puzzle",
    changes: [
      {
        kind: 'added',
        text: "New \"Today's puzzle\" card on the menu. One try per day vs the Hard AI on a rotating shape. Score is your margin (you minus AI), and each win adds a day to your Profile streak. Tomorrow's puzzle unlocks at midnight UTC.",
      },
      {
        kind: 'changed',
        text: "Sign-in required to play the daily puzzle and build a streak — the streak lives on your account so it works across devices.",
      },
    ],
  },
  {
    version: 'Alpha 0.2.5.0',
    date: '2026-05-31',
    highlight: 'Daily streak plumbing',
    changes: [
      {
        kind: 'added',
        text: "New \"Daily streak\" section in your Profile, ready for the daily puzzle (coming next). Once the puzzle ships, completing it each day builds your streak across all your devices — stored on your account, not your browser, so it survives cache clears and device switches.",
      },
    ],
  },
  {
    version: 'Alpha 0.2.4.0',
    date: '2026-05-31',
    highlight: 'Share + invite from the menu',
    changes: [
      {
        kind: 'added',
        text: "You can now share DotDuel right from the main menu. Signed-in players get \"Invite a friend\" — links carry your referral so they auto-friend you when they sign up. Anyone not signed in sees a \"Share DotDuel\" link below sign-in for a quick clean share of the game.",
      },
    ],
  },
  {
    version: 'Alpha 0.2.3.0',
    date: '2026-05-31',
    highlight: 'Learning hints + claimable-lines toggle',
    changes: [
      {
        kind: 'added',
        text: "Contextual hints that appear once as you learn: first time you score, first time a single move closes two lines (biggest-only rule), first time a line is waiting to be claimed at the start of your turn, and near the end of the game.",
      },
      {
        kind: 'added',
        text: "New \"Show claimable lines\" eye-icon toggle next to the rules button in vs-AI Beginner/Easy/Medium/Hard. Defaults on for Beginner-Medium, off for Hard. Hidden in Impossible, hot-seat, and multiplayer — reading the board is part of the challenge.",
      },
      {
        kind: 'changed',
        text: "Internal settings storage was upgraded; you'll be asked to re-enter your name and will see the tutorial popover again on first load. Stats, unlocks, and account data are unaffected.",
      },
    ],
  },
  {
    version: 'Alpha 0.2.2.0',
    date: '2026-05-31',
    highlight: 'Visible scoring',
    changes: [
      {
        kind: 'added',
        text: "Scoring is now visible: a floating +N pops from the dot that completes the line in your colour, your score badge pulses when it changes, and the \"lines to claim\" badge flashes when a new line goes pending.",
      },
    ],
  },
  {
    version: 'Alpha 0.2.1.0',
    date: '2026-05-31',
    highlight: 'Behind-the-scenes telemetry',
    changes: [
      {
        kind: 'changed',
        text: "Internal: added anonymous funnel analytics for players who accepted the cookie banner — helps us see where the game frustrates new players so we can smooth them out. No personal data leaves the device.",
      },
    ],
  },
  {
    version: 'Alpha 0.2.0.0',
    date: '2026-05-29',
    highlight: 'Friends & invites',
    changes: [
      {
        kind: 'added',
        text: 'Friends list. Add a friend by username, see which friends are online and what they\'re doing (vs AI, hot-seat, ranked match), invite a friend to a specific game (your choice of shape, time control, ranked or casual). Invites you receive while you\'re in a game stay queued and appear the moment you\'re back on the menu. A ranked invite counts for Elo only if both sides chose Ranked; otherwise it\'s a casual match. After a multiplayer match you can add the opponent as a friend with one tap.',
      },
      {
        kind: 'added',
        text: 'Tell-a-friend: invite people to try DotDuel — they don\'t need an account yet. Uses your phone\'s share sheet or your email client; we never see their address. When they sign up, you get a friend request from them automatically.',
      },
      {
        kind: 'added',
        text: 'Settings → Privacy: choose who can challenge you (Everyone / Friends only / Nobody) and whether your live status is visible to friends.',
      },
    ],
  },
  {
    version: 'Alpha 0.1.5.0',
    date: '2026-05-29',
    highlight: 'Backend cleanup',
    changes: [
      {
        kind: 'changed',
        text: 'Internal: multiplayer game state migrated entirely to the new transport. The old Realtime Database path is no longer used for game data. No visible difference — if anything, slightly snappier.',
      },
    ],
  },
  {
    version: 'Alpha 0.1.4.4',
    date: '2026-05-29',
    highlight: 'Refresh goes home',
    changes: [
      {
        kind: 'fixed',
        text: "Hard-refreshing the page after a finished game now returns to the main menu instead of replaying the same Game Over screen on every reload.",
      },
    ],
  },
  {
    version: 'Alpha 0.1.4.3',
    date: '2026-05-29',
    highlight: 'Ready button + stale tab cleanup',
    changes: [
      {
        kind: 'fixed',
        text: 'Ready button now responds instantly when you tap it instead of waiting for the network round-trip, and vs AI the game starts the moment you press it (no waiting for the countdown).',
      },
      {
        kind: 'fixed',
        text: 'If you took over the multiplayer session on a second device, the first device no longer shows a phantom game over for the game you finished there.',
      },
    ],
  },
  {
    version: 'Alpha 0.1.4.2',
    date: '2026-05-29',
    highlight: 'Session lock recovery',
    changes: [
      {
        kind: 'fixed',
        text: 'If a previous session got stuck holding the multiplayer lock, you can now tap the Multiplayer button to take over here instead of waiting for it to clear.',
      },
      {
        kind: 'changed',
        text: 'Stuck session locks now clear themselves twice as fast (45s instead of 90s) when the holding tab is gone.',
      },
    ],
  },
  {
    version: 'Alpha 0.1.4.1',
    date: '2026-05-29',
    highlight: 'Multiplayer polish',
    changes: [
      {
        kind: 'fixed',
        text: 'Ready button now actually starts the game as soon as both sides press it (vs AI, that means as soon as you press it).',
      },
      {
        kind: 'fixed',
        text: 'First move of a match no longer takes 8-9 seconds before your opponent reacts.',
      },
      {
        kind: 'fixed',
        text: 'Signing in on a second device no longer accidentally drops it into your active game on the first.',
      },
      {
        kind: 'changed',
        text: 'Menu buttons aligned to the same size for a cleaner look.',
      },
    ],
  },
  {
    version: 'Alpha 0.1.4.0',
    date: '2026-05-29',
    highlight: 'Multiplayer now works on more networks',
    changes: [
      {
        kind: 'fixed',
        text: 'Multiplayer now connects on networks that previously blocked the game server (Whalebone, AdGuard, NextDNS, Brave Shields, and similar DNS-level filters). The game uses a new transport path that travels over standard HTTPS and is not blocked by tracker-blocking lists. If multiplayer used to get stuck on the loading screen for you, try again.',
      },
    ],
  },
  {
    version: 'Alpha 0.1.3.6',
    date: '2026-05-29',
    highlight: 'Clock display fix',
    changes: [
      {
        kind: 'fixed',
        text: 'Multiplayer clock display no longer flickers on each move.',
      },
    ],
  },
  {
    version: 'Alpha 0.1.3.5',
    date: '2026-05-28',
    highlight: 'Friendly offline message',
    changes: [
      {
        kind: 'added',
        text: "If your network blocks the game server (common with mobile ad/tracker blockers like AdGuard, NextDNS, or Whalebone), Multiplayer now shows a clear explanation with troubleshooting tips instead of getting stuck on a loading screen. Single-player vs AI works offline as usual.",
      },
    ],
  },
  {
    version: 'Alpha 0.1.3.1',
    date: '2026-05-27',
    highlight: 'Mobile button fix',
    changes: [
      {
        kind: 'fixed',
        text: 'Multiplayer and Sign-out buttons sometimes did nothing on privacy-strict mobile browsers (Brave, Firefox Focus). The UI now transitions immediately and cleanup happens in the background.',
      },
    ],
  },
  {
    version: 'Alpha 0.1.3.0',
    date: '2026-05-27',
    highlight: 'Bot Army — never wait alone',
    changes: [
      {
        kind: 'added',
        text: "If no human is found within ~15s, you'll be paired with a ranked AI opponent (Pip, Cricket, Ranger, Knight, or Voidstar). They count for Elo and appear on the leaderboard.",
      },
      {
        kind: 'changed',
        text: 'Searching screen now tells you when a bot might step in.',
      },
      {
        kind: 'fixed',
        text: "Rematch button now hides when your opponent was a bot (bots don't accept rematches).",
      },
    ],
  },
  {
    version: 'Alpha 0.1.2.5',
    date: '2026-05-27',
    highlight: 'Signup fix follow-up',
    changes: [
      {
        kind: 'fixed',
        text: 'Picking a username now works even if a previous signup attempt left a half-finished profile',
      },
      {
        kind: 'added',
        text: "Sign-out button on the pick-name screen so you're never stuck",
      },
    ],
  },
  {
    version: 'Alpha 0.1.2.4',
    date: '2026-05-27',
    highlight: 'Signup fix',
    changes: [
      {
        kind: 'fixed',
        text: "Signing up with a new account no longer fails with a 'missing permissions' error when picking a username",
      },
    ],
  },
  {
    version: 'Alpha 0.1.2.3',
    date: '2026-05-26',
    highlight: 'Sharable links + security hardening',
    changes: [
      {
        kind: 'added',
        text: 'Browser tab icon and home-screen icon — the two DotDuel dots show up wherever you bookmark or install the game',
      },
      {
        kind: 'added',
        text: 'Share previews — pasting the DotDuel link into Discord, Telegram, Slack, or Twitter now renders a card with the wordmark and tagline instead of a blank box',
      },
      {
        kind: 'changed',
        text: 'Username changes now happen atomically — the old name is released and the new one claimed in the same operation',
      },
      {
        kind: 'changed',
        text: 'Behind-the-scenes security hardening — stricter content-security policy, server-side rate limits on account deletion and username checks, scheduled cleanup of finished games (within ~24h per privacy policy), and hashed UIDs in server logs',
      },
    ],
  },
  {
    version: 'Alpha 0.1.2.2',
    date: '2026-05-26',
    highlight: 'Multiplayer pacing + readability',
    changes: [
      {
        kind: 'added',
        text: 'Multiplayer board shape unlocks at 50 and 100 ranked games (Square then Rectangle)',
      },
      {
        kind: 'changed',
        text: 'Bullet (1 min) and Rapid (5 min) temporarily locked — only Blitz (3 min) available while the player base grows',
      },
      {
        kind: 'changed',
        text: 'Rules popover now says multiplayer is live',
      },
      {
        kind: 'fixed',
        text: "'DotDuel champion' and 'Impossible — defeated' titles were invisible on light themes",
      },
    ],
  },
  {
    version: 'Alpha 0.1.2.1',
    date: '2026-05-25',
    highlight: 'Theme polish',
    changes: [
      {
        kind: 'changed',
        text: 'Each colour theme now has its own text and wordmark colours instead of borrowing the default green',
      },
      {
        kind: 'fixed',
        text: 'Provisional badge was invisible on the Vintage Press parchment theme',
      },
    ],
  },
  {
    version: 'Alpha 0.1.2',
    date: '2026-05-25',
    highlight: 'UX polish',
    changes: [
      {
        kind: 'added',
        text: 'Theme picker now reachable from every screen via the footer',
      },
      {
        kind: 'added',
        text: 'Clock visible on mobile in multiplayer',
      },
      {
        kind: 'changed',
        text: "Last-move highlight now shows the opponent's dot, not yours",
      },
      {
        kind: 'changed',
        text: 'Win screen now tells you HOW you won (on time / on points / opponent resigned)',
      },
      {
        kind: 'fixed',
        text: 'Mobile popovers were impossible to close — close button now reliably reachable',
      },
      {
        kind: 'fixed',
        text: 'Footer pill wraps to a second line on narrow phones instead of being cut off',
      },
      {
        kind: 'fixed',
        text: 'Theme picker and other popovers are now properly scrollable when content is taller than the screen',
      },
      {
        kind: 'fixed',
        text: 'Popovers were unreadable on desktop when the cookie banner was visible — popup sizing now reserves room properly',
      },
    ],
  },
  {
    version: 'Alpha 0.1',
    date: '2026-05-24',
    highlight: 'DotDuel goes live!',
    changes: [
      {
        kind: 'added',
        text: 'Public alpha launch — multiplayer, ranking, themes, sun-friendly mode',
      },
    ],
  },
];
