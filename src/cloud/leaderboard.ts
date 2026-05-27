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

export function watchLeaderboard(
  onChange: (rows: LeaderboardEntry[]) => void,
  max: number = 50,
): () => void {
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
