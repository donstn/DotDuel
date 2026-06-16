/**
 * Achievement catalog — the single source of truth for every badge in DotDuel.
 *
 * Definitions live in code (versioned with the app); only a player's UNLOCKED
 * set syncs to Supabase (table `player_achievements`) so it follows them across
 * devices. Each def maps to an icon key (see AchievementIcon); the icon renders
 * lit in the active theme's two dot colours when earned and is greyed via CSS
 * when locked.
 *
 * `desc` is the tooltip / popup text. `tier` orders a family and drives the
 * badge frame (1 = bronze-ish … 5 = the brightest). Unlock CONDITIONS are kept
 * in achievements/conditions.ts (evaluated against a stats snapshot), so this
 * file stays a clean, reviewable list.
 */

export type AchievementCategory =
  | 'onboarding'
  | 'bots'
  | 'mastery'
  | 'skill'
  | 'hotseat'
  | 'daily'
  | 'streak'
  | 'volume'
  | 'ranked'
  | 'onfire'
  | 'elo'
  | 'lines'
  | 'social';

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  title: string;
  /** Tooltip / popup text — what it is and how to get it. */
  desc: string;
  /** Icon key (see AchievementIcon registry). */
  icon: string;
  /** 1..5 within a family — brighter frame at higher tiers. */
  tier?: number;
  /** Hidden (shown as "???") until earned. */
  secret?: boolean;
}

const SHAPES = [
  { id: 'triangle', label: 'Triangle' },
  { id: 'square', label: 'Square' },
  { id: 'rectangle', label: 'Rectangle' },
] as const;

const LEVELS = [
  { d: 1, label: 'Beginner' },
  { d: 2, label: 'Easy' },
  { d: 3, label: 'Medium' },
  { d: 4, label: 'Hard' },
  { d: 5, label: 'Impossible' },
] as const;

// ---- B/C/D: per-shape bot families (generated; 15 + 3 + 6 = 24) ----
const shapeFamilies: AchievementDef[] = SHAPES.flatMap((s) => [
  ...LEVELS.map<AchievementDef>((l) => ({
    id: `beat-${s.id}-${l.d}`,
    category: 'bots',
    title: `${s.label}: ${l.label} down`,
    desc: `Beat the ${l.label} Bot on the ${s.label} board.`,
    icon: `shape-${s.id}`,
    tier: l.d,
  })),
  {
    id: `grandmaster-${s.id}`,
    category: 'mastery',
    title: `${s.label} Grandmaster`,
    desc: `Beat every Bot level (Beginner → Impossible) on the ${s.label} board.`,
    icon: `crown-${s.id}`,
    tier: 5,
  },
  {
    id: `slayer-${s.id}-10`,
    category: 'bots',
    title: `${s.label} Executioner`,
    desc: `Beat the Impossible Bot 10 times on the ${s.label} board.`,
    icon: `skull-${s.id}`,
    tier: 3,
  },
  {
    id: `slayer-${s.id}-50`,
    category: 'bots',
    title: `${s.label} Reaper`,
    desc: `Beat the Impossible Bot 50 times on the ${s.label} board.`,
    icon: `skull-${s.id}`,
    tier: 5,
  },
]);

export const ACHIEVEMENTS: AchievementDef[] = [
  // ---- A: onboarding (4) ----
  { id: 'first-game', category: 'onboarding', title: 'First Steps', desc: 'Play your very first game.', icon: 'spark', tier: 1 },
  { id: 'first-win', category: 'onboarding', title: 'Winner', desc: 'Win your first game.', icon: 'trophy-s', tier: 1 },
  { id: 'first-claim', category: 'onboarding', title: 'Claim Jumper', desc: 'Claim your first pending line.', icon: 'claim', tier: 1 },
  { id: 'all-shapes', category: 'onboarding', title: 'Cartographer', desc: 'Unlock every playable board shape.', icon: 'map', tier: 2 },

  // ---- B/C/D: per-shape bot mastery (24, generated above) ----
  ...shapeFamilies,

  // ---- E: cross-shape nightmare (1) ----
  { id: 'triple-impossible', category: 'mastery', title: 'Nightmare Slayer', desc: 'Beat the Impossible Bot at least 3 times on every shape.', icon: 'nightmare', tier: 5 },

  // ---- G: hot-seat volume (6) ----
  { id: 'hotseat-5', category: 'hotseat', title: 'Couch Rivals', desc: 'Play 5 hot-seat games.', icon: 'couch', tier: 1 },
  { id: 'hotseat-10', category: 'hotseat', title: 'Pass the Phone', desc: 'Play 10 hot-seat games.', icon: 'couch', tier: 2 },
  { id: 'hotseat-50', category: 'hotseat', title: 'Living-room Legend', desc: 'Play 50 hot-seat games.', icon: 'couch', tier: 3 },
  { id: 'hotseat-100', category: 'hotseat', title: 'Tabletop Veteran', desc: 'Play 100 hot-seat games.', icon: 'couch', tier: 4 },
  { id: 'hotseat-500', category: 'hotseat', title: 'Hot-seat Hero', desc: 'Play 500 hot-seat games.', icon: 'couch', tier: 5 },
  { id: 'hotseat-1000', category: 'hotseat', title: 'Same-screen Sovereign', desc: 'Play 1,000 hot-seat games.', icon: 'couch', tier: 5 },

  // ---- H: daily puzzle (7) ----
  { id: 'daily-first', category: 'daily', title: 'Daily Dabbler', desc: 'Play your first daily puzzle.', icon: 'calendar', tier: 1 },
  { id: 'daily-streak-3', category: 'daily', title: 'On Schedule', desc: 'Play the daily puzzle 3 days in a row.', icon: 'calendar-streak', tier: 2 },
  { id: 'daily-streak-7', category: 'daily', title: 'Daily Habit', desc: 'Play the daily puzzle 7 days in a row.', icon: 'calendar-streak', tier: 3 },
  { id: 'daily-streak-30', category: 'daily', title: 'Calendar Keeper', desc: 'Play the daily puzzle 30 days in a row.', icon: 'calendar-streak', tier: 4 },
  { id: 'daily-streak-100', category: 'daily', title: 'Unbroken', desc: 'Play the daily puzzle 100 days in a row.', icon: 'calendar-streak', tier: 5 },
  { id: 'daily-all-attempts', category: 'daily', title: 'Persistent', desc: 'Use all 3 attempts on a single daily puzzle.', icon: 'three', tier: 1 },
  { id: 'daily-top', category: 'daily', title: 'Puzzle Champion', desc: 'Finish #1 on a daily puzzle leaderboard.', icon: 'crown-daily', tier: 5 },

  // ---- I: consecutive-day play streak (7) ----
  { id: 'streak-5', category: 'streak', title: 'Regular', desc: 'Play on 5 consecutive days.', icon: 'flame-day', tier: 1 },
  { id: 'streak-10', category: 'streak', title: 'Committed', desc: 'Play on 10 consecutive days.', icon: 'flame-day', tier: 2 },
  { id: 'streak-50', category: 'streak', title: 'Devoted', desc: 'Play on 50 consecutive days.', icon: 'flame-day', tier: 3 },
  { id: 'streak-100', category: 'streak', title: 'Centurion', desc: 'Play on 100 consecutive days.', icon: 'flame-day', tier: 4 },
  { id: 'streak-300', category: 'streak', title: 'Relentless', desc: 'Play on 300 consecutive days.', icon: 'flame-day', tier: 5 },
  { id: 'streak-500', category: 'streak', title: 'Unwavering', desc: 'Play on 500 consecutive days.', icon: 'flame-day', tier: 5 },
  { id: 'streak-1000', category: 'streak', title: 'Eternal Flame', desc: 'Play on 1,000 consecutive days.', icon: 'flame-day', tier: 5 },

  // ---- J: distinct days played (3) ----
  { id: 'days-7', category: 'streak', title: 'First Week', desc: 'Play on 7 different days.', icon: 'calendar-dots', tier: 1 },
  { id: 'days-30', category: 'streak', title: 'Monthly Regular', desc: 'Play on 30 different days.', icon: 'calendar-dots', tier: 2 },
  { id: 'days-100', category: 'streak', title: 'Hundred Days', desc: 'Play on 100 different days.', icon: 'calendar-dots', tier: 4 },

  // ---- K: total games played (5) ----
  { id: 'total-100', category: 'volume', title: 'Hundred Club', desc: 'Play 100 games in total (all modes).', icon: 'medal', tier: 1 },
  { id: 'total-500', category: 'volume', title: 'Five Hundred Strong', desc: 'Play 500 games in total.', icon: 'medal', tier: 2 },
  { id: 'total-1000', category: 'volume', title: 'Thousand Games', desc: 'Play 1,000 games in total.', icon: 'medal', tier: 3 },
  { id: 'total-10000', category: 'volume', title: 'Ten Thousand', desc: 'Play 10,000 games in total.', icon: 'medal', tier: 4 },
  { id: 'total-50000', category: 'volume', title: 'Living Legend', desc: 'Play 50,000 games in total.', icon: 'medal', tier: 5 },

  // ---- L: ranked volume (9) ----
  { id: 'ranked-first', category: 'ranked', title: 'Stepping In', desc: 'Play your first ranked online game.', icon: 'sword', tier: 1 },
  { id: 'ranked-first-win', category: 'ranked', title: 'First Blood', desc: 'Win your first ranked online game.', icon: 'sword', tier: 2 },
  { id: 'ranked-play-10', category: 'ranked', title: 'Contender', desc: 'Play 10 ranked games.', icon: 'sword', tier: 2 },
  { id: 'ranked-play-50', category: 'ranked', title: 'Challenger', desc: 'Play 50 ranked games.', icon: 'sword', tier: 3 },
  { id: 'ranked-play-100', category: 'ranked', title: 'Campaigner', desc: 'Play 100 ranked games.', icon: 'sword', tier: 4 },
  { id: 'ranked-play-500', category: 'ranked', title: 'Battle-hardened', desc: 'Play 500 ranked games.', icon: 'sword', tier: 5 },
  { id: 'ranked-win-10', category: 'ranked', title: 'Victor', desc: 'Win 10 ranked games.', icon: 'sword-win', tier: 2 },
  { id: 'ranked-win-50', category: 'ranked', title: 'Conqueror', desc: 'Win 50 ranked games.', icon: 'sword-win', tier: 4 },
  { id: 'ranked-win-100', category: 'ranked', title: 'Warlord', desc: 'Win 100 ranked games.', icon: 'sword-win', tier: 5 },

  // ---- M: "on fire" ranked win streak (8) ----
  { id: 'fire-3', category: 'onfire', title: 'Heating Up', desc: 'Win 3 ranked games in a row.', icon: 'fire', tier: 1 },
  { id: 'fire-5', category: 'onfire', title: 'On Fire', desc: 'Win 5 ranked games in a row.', icon: 'fire', tier: 2 },
  { id: 'fire-7', category: 'onfire', title: 'Blazing', desc: 'Win 7 ranked games in a row.', icon: 'fire', tier: 3 },
  { id: 'fire-10', category: 'onfire', title: 'Inferno', desc: 'Win 10 ranked games in a row.', icon: 'fire', tier: 4 },
  { id: 'fire-15', category: 'onfire', title: 'Unstoppable', desc: 'Win 15 ranked games in a row.', icon: 'fire', tier: 5 },
  { id: 'fire-20', category: 'onfire', title: 'Rampage', desc: 'Win 20 ranked games in a row.', icon: 'fire', tier: 5 },
  { id: 'fire-25', category: 'onfire', title: 'Untouchable', desc: 'Win 25 ranked games in a row.', icon: 'fire', tier: 5 },
  { id: 'fire-50', category: 'onfire', title: 'Legendary Run', desc: 'Win 50 ranked games in a row.', icon: 'fire', tier: 5, secret: true },

  // ---- N: Elo milestones (6) ----
  { id: 'elo-1100', category: 'elo', title: 'Rising', desc: 'Reach a rating of 1100.', icon: 'chevron', tier: 1 },
  { id: 'elo-1200', category: 'elo', title: 'Skilled', desc: 'Reach a rating of 1200.', icon: 'chevron', tier: 2 },
  { id: 'elo-1400', category: 'elo', title: 'Expert', desc: 'Reach a rating of 1400.', icon: 'chevron', tier: 3 },
  { id: 'elo-1600', category: 'elo', title: 'Master', desc: 'Reach a rating of 1600.', icon: 'chevron', tier: 4 },
  { id: 'elo-1800', category: 'elo', title: 'Grandmaster', desc: 'Reach a rating of 1800.', icon: 'chevron', tier: 5 },
  { id: 'elo-2000', category: 'elo', title: 'Elite', desc: 'Reach a rating of 2000.', icon: 'chevron', tier: 5 },

  // ---- O: ranked skill (3) ----
  { id: 'ranked-time-win', category: 'ranked', title: 'Beat the Clock', desc: 'Win a ranked game by running your opponent out of time.', icon: 'clock', tier: 3 },
  { id: 'ranked-upset', category: 'ranked', title: 'Giant Slayer', desc: 'Beat an opponent rated 100+ points above you.', icon: 'upset', tier: 4 },
  { id: 'ranked-rematch-win', category: 'ranked', title: 'No Doubt', desc: 'Win a rematch.', icon: 'rematch', tier: 2 },

  // ---- P: line / scoring mechanics (6) ----
  { id: 'line-8', category: 'lines', title: 'Full House', desc: 'Complete a line of 8 dots in one move.', icon: 'longline', tier: 4 },
  { id: 'corner', category: 'lines', title: 'Cornered', desc: 'Score a 1-point corner line.', icon: 'corner', tier: 1 },
  { id: 'biggest-line', category: 'lines', title: 'Big Score', desc: 'Score a single line worth 6 or more.', icon: 'longline', tier: 3 },
  { id: 'claim-10', category: 'lines', title: 'Opportunist', desc: 'Claim 10 pending lines in total.', icon: 'claim', tier: 2 },
  { id: 'claim-50', category: 'lines', title: 'Scavenger', desc: 'Claim 50 pending lines in total.', icon: 'claim', tier: 3 },
  { id: 'claim-100', category: 'lines', title: 'Vulture', desc: 'Claim 100 pending lines in total.', icon: 'claim', tier: 4 },

  // ---- Q: social / cosmetic (5) ----
  { id: 'add-friend', category: 'social', title: 'Making Friends', desc: 'Add your first friend.', icon: 'friend', tier: 1 },
  { id: 'play-friend', category: 'social', title: 'Friendly Rivalry', desc: 'Play a game against a friend you invited.', icon: 'friend', tier: 2 },
  { id: 'refer-friend', category: 'social', title: 'Recruiter', desc: 'Bring a brand-new player in through your invite link.', icon: 'refer', tier: 3 },
  { id: 'share-card', category: 'social', title: 'Show Off', desc: 'Share a victory card.', icon: 'share', tier: 1 },
  { id: 'all-themes', category: 'social', title: 'Decorator', desc: 'Try all eight colour themes.', icon: 'palette', tier: 2 },

  // ---- R: non-ranked win streaks (3) ----
  { id: 'botstreak-3', category: 'skill', title: 'Hot Hand', desc: 'Win 3 Bot games in a row.', icon: 'fire-bot', tier: 1 },
  { id: 'botstreak-5', category: 'skill', title: 'In the Zone', desc: 'Win 5 Bot games in a row.', icon: 'fire-bot', tier: 2 },
  { id: 'botstreak-10', category: 'skill', title: 'Machine Breaker', desc: 'Win 10 Bot games in a row.', icon: 'fire-bot', tier: 3 },
];

export const ACHIEVEMENT_COUNT = ACHIEVEMENTS.length;

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a]),
);

/**
 * Tracks — how the Achievements page is laid out (0.4.8.1 redesign).
 *
 * Each track is ONE progression line: badges read left → right from the first
 * step to the capstone, so `ids[ids.length - 1]` is always the most important /
 * hardest one in that family. The page renders each track as a single
 * horizontal "line you complete" (echoing DotDuel's scoring), with the capstone
 * emphasised at the end. Every achievement id belongs to exactly one track.
 */
export interface AchievementTrack {
  label: string;
  /** Ordered easiest → capstone. Last id is the headline achievement. */
  ids: string[];
}

const botTrack = (s: (typeof SHAPES)[number]): AchievementTrack => ({
  label: `${s.label} bots`,
  ids: [
    `beat-${s.id}-1`,
    `beat-${s.id}-2`,
    `beat-${s.id}-3`,
    `beat-${s.id}-4`,
    `beat-${s.id}-5`,
    `slayer-${s.id}-10`,
    `slayer-${s.id}-50`,
  ],
});

export const ACHIEVEMENT_TRACKS: AchievementTrack[] = [
  { label: 'Getting started', ids: ['first-game', 'first-win', 'first-claim', 'all-shapes'] },
  ...SHAPES.map(botTrack),
  {
    label: 'Mastery',
    ids: ['grandmaster-triangle', 'grandmaster-square', 'grandmaster-rectangle', 'triple-impossible'],
  },
  { label: 'Bot win streak', ids: ['botstreak-3', 'botstreak-5', 'botstreak-10'] },
  { label: 'Hot-seat', ids: ['hotseat-5', 'hotseat-10', 'hotseat-50', 'hotseat-100', 'hotseat-500', 'hotseat-1000'] },
  {
    label: 'Daily puzzle',
    ids: ['daily-first', 'daily-all-attempts', 'daily-streak-3', 'daily-streak-7', 'daily-streak-30', 'daily-streak-100', 'daily-top'],
  },
  { label: 'Play streak', ids: ['streak-5', 'streak-10', 'streak-50', 'streak-100', 'streak-300', 'streak-500', 'streak-1000'] },
  { label: 'Days played', ids: ['days-7', 'days-30', 'days-100'] },
  { label: 'Milestones', ids: ['total-100', 'total-500', 'total-1000', 'total-10000', 'total-50000'] },
  { label: 'Ranked play', ids: ['ranked-first', 'ranked-play-10', 'ranked-play-50', 'ranked-play-100', 'ranked-play-500'] },
  { label: 'Ranked wins', ids: ['ranked-first-win', 'ranked-win-10', 'ranked-win-50', 'ranked-win-100'] },
  { label: 'Ranked feats', ids: ['ranked-rematch-win', 'ranked-time-win', 'ranked-upset'] },
  { label: 'Win streak', ids: ['fire-3', 'fire-5', 'fire-7', 'fire-10', 'fire-15', 'fire-20', 'fire-25', 'fire-50'] },
  { label: 'Rating', ids: ['elo-1100', 'elo-1200', 'elo-1400', 'elo-1600', 'elo-1800', 'elo-2000'] },
  { label: 'Scoring', ids: ['corner', 'biggest-line', 'line-8'] },
  { label: 'Claims', ids: ['claim-10', 'claim-50', 'claim-100'] },
  { label: 'Social', ids: ['add-friend', 'share-card', 'play-friend', 'all-themes', 'refer-friend'] },
];

export const CATEGORY_LABEL: Record<AchievementCategory, string> = {
  onboarding: 'Getting started',
  bots: 'Bot battles',
  mastery: 'Mastery',
  skill: 'Skill',
  hotseat: 'Hot-seat',
  daily: 'Daily puzzle',
  streak: 'Day streaks',
  volume: 'Milestones',
  ranked: 'Ranked',
  onfire: 'On fire',
  elo: 'Rating',
  lines: 'Lines',
  social: 'Social',
};
