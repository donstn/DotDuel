// Day streak (profiles.streak_*): grows by one for each UTC day with a
// finished online game or daily puzzle (server: bump_streak / finalize_daily).
// The stored value only changes when the player plays, so a streak whose last
// day is older than yesterday is already broken.

export interface DayStreak {
  current: number;
  longest: number;
  lastPlayedUTC: string; // 'YYYY-MM-DD'
}

const DAY_MS = 86_400_000;

/** UTC calendar day, 'YYYY-MM-DD', `offset` days from today. */
export function utcDay(offset = 0, now = Date.now()): string {
  return new Date(now + offset * DAY_MS).toISOString().slice(0, 10);
}

/** Days in the streak if it is still alive (played today or yesterday), else 0. */
export function aliveStreak(s: DayStreak | null | undefined, now = Date.now()): number {
  if (!s) return 0;
  return s.lastPlayedUTC === utcDay(0, now) || s.lastPlayedUTC === utcDay(-1, now) ? s.current : 0;
}

export function playedToday(s: DayStreak | null | undefined, now = Date.now()): boolean {
  return !!s && s.lastPlayedUTC === utcDay(0, now);
}
