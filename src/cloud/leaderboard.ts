import type { Difficulty } from '../types';
import { supabase } from '../supabase';

/**
 * Global Elo leaderboard. Denormalised public view of profiles — displayName +
 * rating + placement counter + lastPlayedAt. Updated transactionally by the
 * finalize_game RPC on every ranked match-end. Bot rows carry is_bot + bot_level
 * so the UI can show a robot avatar + BOT tag inline.
 */
export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  rating: number;
  placementGamesPlayed: number;
  lastPlayedAt: number;
  isBot: boolean;
  botLevel: Difficulty | null;
}

// Supabase `leaderboard` row (snake_case) → LeaderboardEntry.
function shapeSupabase(d: Record<string, unknown>): LeaderboardEntry {
  const isBot = d.is_bot === true;
  return {
    uid: (d.uid ?? '') as string,
    displayName: (d.display_name ?? 'Player') as string,
    rating: typeof d.rating === 'number' ? d.rating : 1000,
    placementGamesPlayed:
      typeof d.placement_games_played === 'number' ? d.placement_games_played : 0,
    lastPlayedAt:
      typeof d.last_played_at === 'string' ? Date.parse(d.last_played_at) || 0 : 0,
    isBot,
    botLevel:
      isBot && typeof d.bot_level === 'number' ? (d.bot_level as Difficulty) : null,
  };
}

// Last list fetched this session, so reopening Rankings shows it at once while
// a fresh copy loads.
let cachedTop: LeaderboardEntry[] | null = null;

export function watchLeaderboard(
  onChange: (rows: LeaderboardEntry[]) => void,
  max: number = 50,
  onError?: () => void,
): () => void {
  let cancelled = false;
  let refetchTimer: ReturnType<typeof setTimeout> | null = null;
  if (cachedTop) onChange(cachedTop.slice(0, max));
  const fetchTop = async () => {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('rating', { ascending: false })
      .limit(max);
    if (cancelled) return;
    if (error) {
      console.warn('watchLeaderboard (supabase) error:', error);
      // Surface as an error, NOT an empty list — an empty list renders the
      // "no games yet" empty state, which lies about a network failure.
      // A cached list is still worth showing, though.
      if (!cachedTop) onError?.();
      return;
    }
    cachedTop = (data ?? []).map(shapeSupabase);
    onChange(cachedTop);
  };
  // Every finished ranked game changes rows; a burst becomes one refetch.
  const scheduleRefetch = () => {
    if (cancelled || refetchTimer) return;
    refetchTimer = setTimeout(() => {
      refetchTimer = null;
      void fetchTop();
    }, 800);
  };
  // Load right away: waiting for the Realtime handshake (the old trigger) kept
  // the list empty for seconds on phones. The SUBSCRIBED refetch still catches
  // anything that changed in between.
  void fetchTop();
  const channel = supabase
    .channel('leaderboard')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, scheduleRefetch)
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') scheduleRefetch();
    });
  return () => {
    cancelled = true;
    if (refetchTimer) clearTimeout(refetchTimer);
    void supabase.removeChannel(channel);
  };
}
