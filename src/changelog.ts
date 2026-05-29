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
