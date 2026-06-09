import { supabase } from '../supabase';

// Daily-puzzle leaderboard reads — Supabase `daily_leaderboard` (public read)
// and `daily_puzzles` (owner read via RLS). Fetch-based: the leaderboard popover
// and menu card are transient, and finalize updates the attempt state directly,
// so we don't need live subscriptions here (kept the watch* signatures so
// callers are unchanged).

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  best: number;
  firstCompletedAt: number | null; // epoch ms
  attempts: number;
  puzzleId: number;
}

interface LbRow {
  uid: string;
  display_name: string | null;
  best: number | null;
  first_completed_at: string | null;
  attempts: number | null;
  puzzle_id: number | null;
}

const LB_COLS = 'uid, display_name, best, first_completed_at, attempts, puzzle_id';

function shapeEntry(r: LbRow): LeaderboardEntry {
  return {
    uid: r.uid,
    displayName: r.display_name ?? 'Anonymous',
    best: typeof r.best === 'number' ? r.best : 0,
    firstCompletedAt: r.first_completed_at
      ? Date.parse(r.first_completed_at)
      : null,
    attempts: typeof r.attempts === 'number' ? r.attempts : 1,
    puzzleId: typeof r.puzzle_id === 'number' ? r.puzzle_id : -1,
  };
}

export function watchTodaysLeaderboard(
  utcDate: string,
  onChange: (entries: LeaderboardEntry[]) => void,
  topN: number = 50,
): () => void {
  let alive = true;
  void supabase
    .from('daily_leaderboard')
    .select(LB_COLS)
    .eq('utc_date', utcDate)
    .order('best', { ascending: false })
    .order('first_completed_at', { ascending: true })
    .limit(topN)
    .then(({ data, error }) => {
      if (!alive) return;
      if (error) {
        console.warn('watchTodaysLeaderboard error:', error.message);
        onChange([]);
        return;
      }
      onChange((data as LbRow[]).map(shapeEntry));
    });
  return () => {
    alive = false;
  };
}

export interface DailyWinner {
  date: string; // YYYY-MM-DD (UTC)
  winner: LeaderboardEntry | null;
}

export async function fetchRecentDailyWinners(
  days: number = 30,
): Promise<DailyWinner[]> {
  const now = new Date();
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i),
    );
    dates.push(d.toISOString().slice(0, 10));
  }
  const earliest = dates[dates.length - 1];

  const { data, error } = await supabase
    .from('daily_leaderboard')
    .select(`utc_date, ${LB_COLS}`)
    .gte('utc_date', earliest)
    .order('utc_date', { ascending: false })
    .order('best', { ascending: false })
    .order('first_completed_at', { ascending: true });

  if (error) {
    console.warn('fetchRecentDailyWinners error:', error.message);
    return dates.map((date) => ({ date, winner: null }));
  }

  // First (top) row per day wins.
  const topByDate = new Map<string, LeaderboardEntry>();
  for (const row of data as (LbRow & { utc_date: string })[]) {
    if (!topByDate.has(row.utc_date)) {
      topByDate.set(row.utc_date, shapeEntry(row));
    }
  }
  return dates.map((date) => ({ date, winner: topByDate.get(date) ?? null }));
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
