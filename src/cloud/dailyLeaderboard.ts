import { supabase } from '../supabase';
import type { Difficulty, ShapeId } from '../types';

// Daily-puzzle results calendar reads.
//
// Both tables are public-read under RLS (daily_lb_select_all,
// daily_defs_select_all), so the calendar queries them directly — one month at
// a time. Within a day, players are ranked by P1 score, ties broken by who
// finished first (the same rule the old recent_daily_winners RPC used).

export interface DailyResult {
  uid: string;
  displayName: string;
  best: number; // the player's P1 score
  attempts: number;
}

export interface DailyDayDef {
  shape: ShapeId;
  aiLevel: Difficulty;
}

export interface DailyMonth {
  // YYYY-MM-DD → players ranked best-first. Only days someone finished.
  results: Map<string, DailyResult[]>;
  defs: Map<string, DailyDayDef>;
}

interface ResultRow {
  utc_date: string;
  uid: string;
  display_name: string | null;
  best: number | null;
  attempts: number | null;
}

interface DefRow {
  utc_date: string;
  shape: ShapeId;
  ai_level: number;
}

// PostgREST caps a response at 1000 rows; page through busy months.
const PAGE = 1000;

function monthBounds(monthKey: string): { from: string; to: string } {
  const [y, m] = monthKey.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${monthKey}-01`, to: `${monthKey}-${String(last).padStart(2, '0')}` };
}

// null = network/RLS error (caller shows a retryable error, not "empty").
export async function fetchDailyMonth(monthKey: string): Promise<DailyMonth | null> {
  const { from, to } = monthBounds(monthKey);

  const defsReq = supabase
    .from('daily_puzzle_defs')
    .select('utc_date, shape, ai_level')
    .gte('utc_date', from)
    .lte('utc_date', to);

  const rows: ResultRow[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase
      .from('daily_leaderboard')
      .select('utc_date, uid, display_name, best, attempts')
      .gte('utc_date', from)
      .lte('utc_date', to)
      .not('best', 'is', null)
      .order('utc_date', { ascending: true })
      .order('best', { ascending: false })
      .order('first_completed_at', { ascending: true, nullsFirst: false })
      .order('uid', { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) {
      console.warn('fetchDailyMonth error:', error.message);
      return null;
    }
    rows.push(...(data as ResultRow[]));
    if (data.length < PAGE) break;
  }

  const results = new Map<string, DailyResult[]>();
  for (const r of rows) {
    let day = results.get(r.utc_date);
    if (!day) results.set(r.utc_date, (day = []));
    day.push({
      uid: r.uid,
      displayName: r.display_name ?? 'Anonymous',
      best: r.best ?? 0,
      attempts: r.attempts ?? 0,
    });
  }

  const defs = new Map<string, DailyDayDef>();
  const { data: defRows, error: defErr } = await defsReq;
  if (defErr) console.warn('fetchDailyMonth defs error:', defErr.message);
  for (const d of (defRows ?? []) as DefRow[]) {
    defs.set(d.utc_date, { shape: d.shape, aiLevel: d.ai_level as Difficulty });
  }

  return { results, defs };
}

// Earliest day anyone finished — the calendar's lower navigation bound.
export async function fetchFirstDailyDate(): Promise<string | null> {
  const { data, error } = await supabase
    .from('daily_leaderboard')
    .select('utc_date')
    .not('best', 'is', null)
    .order('utc_date', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn('fetchFirstDailyDate error:', error.message);
    return null;
  }
  return (data as { utc_date: string } | null)?.utc_date ?? null;
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
