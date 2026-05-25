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
