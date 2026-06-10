import { supabase } from '../supabase';

// Daily-puzzle leaderboard reads (revamped).
//
// The board is now a single list: the WINNER of each of the last 30 *played*
// days (days with at least one finished attempt), newest first, shown with the
// date. Today appears as the top row once anyone has finished it. "Winner" =
// highest P1 score that day, ties broken by who finished first — computed
// server-side by the `recent_daily_winners` SQL function (DISTINCT ON date).
// Empty days are never returned.

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  best: number; // the player's P1 score
  firstCompletedAt: number | null; // epoch ms
}

export interface DailyWinner {
  date: string; // YYYY-MM-DD (UTC)
  winner: LeaderboardEntry;
}

interface WinnerRow {
  utc_date: string;
  uid: string;
  display_name: string | null;
  best: number | null;
  first_completed_at: string | null;
}

export async function fetchRecentDailyWinners(
  days: number = 30,
): Promise<DailyWinner[]> {
  const { data, error } = await supabase.rpc('recent_daily_winners', {
    p_limit: days,
  });
  if (error) {
    console.warn('fetchRecentDailyWinners error:', error.message);
    return [];
  }
  return (data as WinnerRow[]).map((r) => ({
    date: r.utc_date,
    winner: {
      uid: r.uid,
      displayName: r.display_name ?? 'Anonymous',
      best: typeof r.best === 'number' ? r.best : 0,
      firstCompletedAt: r.first_completed_at
        ? Date.parse(r.first_completed_at)
        : null,
    },
  }));
}

export interface MyDailyAttempt {
  puzzleId: number;
  attempts: number;
  best: number;
}

export function watchMyDailyAttempt(
  _uid: string, // ignored — RLS scopes the query to the session user
  utcDate: string,
  onChange: (attempt: MyDailyAttempt | null) => void,
): () => void {
  let alive = true;
  void supabase
    .from('daily_puzzles')
    .select('puzzle_id, attempts, best')
    .eq('utc_date', utcDate)
    .maybeSingle()
    .then(({ data, error }) => {
      if (!alive) return;
      if (error) {
        console.warn('watchMyDailyAttempt error:', error.message);
        onChange(null);
        return;
      }
      if (!data) {
        onChange(null);
        return;
      }
      onChange({
        puzzleId: typeof data.puzzle_id === 'number' ? data.puzzle_id : -1,
        attempts: typeof data.attempts === 'number' ? data.attempts : 0,
        best: typeof data.best === 'number' ? data.best : 0,
      });
    });
  return () => {
    alive = false;
  };
}
