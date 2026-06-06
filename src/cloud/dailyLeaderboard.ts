import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// Phase 2b-v2 — daily-puzzle leaderboard reader.
//
// Entries are public-readable per Firestore rules; we sort by best margin
// descending, then by firstCompletedAt ascending (first-to-tie wins).
// The composite ordering needs a Firestore index (best DESC, firstCompletedAt
// ASC) — added in firestore.indexes.json when this ships.

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  best: number;
  firstCompletedAt: number | null; // epoch ms, null until server timestamp resolves
  attempts: number;
  puzzleId: number;
}

interface RawEntry {
  uid?: string;
  displayName?: string;
  best?: number;
  firstCompletedAt?: Timestamp | { seconds: number; nanoseconds: number } | null;
  attempts?: number;
  puzzleId?: number;
}

function tsToMs(t: RawEntry['firstCompletedAt']): number | null {
  if (!t) return null;
  if (typeof (t as Timestamp).toMillis === 'function') {
    return (t as Timestamp).toMillis();
  }
  const obj = t as { seconds?: number };
  if (typeof obj.seconds === 'number') return obj.seconds * 1000;
  return null;
}

function shapeEntry(uid: string, raw: RawEntry): LeaderboardEntry {
  return {
    uid: raw.uid ?? uid,
    displayName: raw.displayName ?? 'Anonymous',
    best: typeof raw.best === 'number' ? raw.best : 0,
    firstCompletedAt: tsToMs(raw.firstCompletedAt),
    attempts: typeof raw.attempts === 'number' ? raw.attempts : 1,
    puzzleId: typeof raw.puzzleId === 'number' ? raw.puzzleId : -1,
  };
}

export function watchTodaysLeaderboard(
  utcDate: string,
  onChange: (entries: LeaderboardEntry[]) => void,
  topN: number = 50,
): () => void {
  const q = query(
    collection(db, 'dailyLeaderboard', utcDate, 'entries'),
    orderBy('best', 'desc'),
    orderBy('firstCompletedAt', 'asc'),
    limit(topN),
  );
  return onSnapshot(
    q,
    (snap) => {
      const entries = snap.docs.map((d) => shapeEntry(d.id, d.data() as RawEntry));
      onChange(entries);
    },
    (err) => {
      console.warn('watchTodaysLeaderboard error:', err);
      onChange([]);
    },
  );
}

// Daily winners history — the top entry (winner) for each of the last `days`
// UTC dates. One getDocs per day (top-1 by the same best DESC / firstCompletedAt
// ASC ordering as the live board), fired only when the history tab is opened.
export interface DailyWinner {
  date: string; // YYYY-MM-DD (UTC)
  winner: LeaderboardEntry | null; // null = nobody played that day
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
  return Promise.all(
    dates.map(async (date): Promise<DailyWinner> => {
      try {
        const q = query(
          collection(db, 'dailyLeaderboard', date, 'entries'),
          orderBy('best', 'desc'),
          orderBy('firstCompletedAt', 'asc'),
          limit(1),
        );
        const snap = await getDocs(q);
        const top = snap.docs[0];
        return {
          date,
          winner: top ? shapeEntry(top.id, top.data() as RawEntry) : null,
        };
      } catch (err) {
        console.warn('fetchRecentDailyWinners error for', date, err);
        return { date, winner: null };
      }
    }),
  );
}

// Watch the current user's per-day attempt doc to know how many attempts
// they've used + their best so far. Drives the menu card 3-state UI.
export interface MyDailyAttempt {
  puzzleId: number;
  attempts: number;
  best: number;
}

export function watchMyDailyAttempt(
  uid: string,
  utcDate: string,
  onChange: (attempt: MyDailyAttempt | null) => void,
): () => void {
  const ref = doc(db, 'users', uid, 'dailyPuzzles', utcDate);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onChange(null);
        return;
      }
      const d = snap.data();
      onChange({
        puzzleId: typeof d.puzzleId === 'number' ? d.puzzleId : -1,
        attempts: typeof d.attempts === 'number' ? d.attempts : 0,
        best: typeof d.best === 'number' ? d.best : 0,
      });
    },
    (err) => {
      console.warn('watchMyDailyAttempt error:', err);
      onChange(null);
    },
  );
}
