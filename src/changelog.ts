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
