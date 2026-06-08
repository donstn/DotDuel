import {
  collection,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Difficulty } from '../types';
import { CLIENT_SUPABASE_TRANSPORT } from '../types';
import { supabase } from '../supabase';

/**
 * Global Elo leaderboard. Denormalised public view of users/{uid} —
 * only displayName + rating + placement counter + lastPlayedAt are
 * exposed here. Updated transactionally by finalizeGame on every
 * ranked match-end. Bot rows additionally carry isBot + botLevel so
 * the UI can show a robot avatar + BOT tag inline.
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

function shape(uid: string, d: DocumentData): LeaderboardEntry {
  const isBot = d.isBot === true;
  return {
    uid: (d.uid as string) ?? uid,
    displayName: (d.displayName as string) ?? 'Player',
    rating: typeof d.rating === 'number' ? d.rating : 1000,
    placementGamesPlayed:
      typeof d.placementGamesPlayed === 'number' ? d.placementGamesPlayed : 0,
    lastPlayedAt:
      typeof d.lastPlayedAt === 'number' ? d.lastPlayedAt : 0,
    isBot,
    botLevel:
      isBot && typeof d.botLevel === 'number' ? (d.botLevel as Difficulty) : null,
  };
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

export function watchLeaderboard(
  onChange: (rows: LeaderboardEntry[]) => void,
  max: number = 50,
): () => void {
  if (CLIENT_SUPABASE_TRANSPORT) {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const fetchTop = async () => {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('rating', { ascending: false })
        .limit(max);
      if (cancelled) return;
      if (error) {
        console.warn('watchLeaderboard (supabase) error:', error);
        onChange([]);
        return;
      }
      onChange((data ?? []).map(shapeSupabase));
    };
    void fetchTop();
    channel = supabase
      .channel('leaderboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leaderboard' },
        () => {
          if (!cancelled) void fetchTop();
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }
  const q = query(
    collection(db, 'leaderboard'),
    orderBy('rating', 'desc'),
    fsLimit(max),
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows: LeaderboardEntry[] = [];
      snap.forEach((doc) => rows.push(shape(doc.id, doc.data())));
      onChange(rows);
    },
    (err) => {
      console.warn('watchLeaderboard error:', err);
      onChange([]);
    },
  );
}
