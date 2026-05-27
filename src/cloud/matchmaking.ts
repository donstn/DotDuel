import {
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Difficulty, ShapeId } from '../types';

export type TimeControl = '1min' | '3min' | '5min';

export const TIME_CONTROLS: { id: TimeControl; label: string; per: string; sub: string }[] = [
  { id: '1min', label: 'Bullet', per: '1 minute per player', sub: 'Fast and frantic.' },
  { id: '3min', label: 'Blitz', per: '3 minutes per player', sub: 'Balanced default.' },
  { id: '5min', label: 'Rapid', per: '5 minutes per player', sub: 'Time to think.' },
];

export interface PairingDoc {
  matchId: string;
  shape: ShapeId | null;
  opponentUid: string;
  opponentDisplayName: string;
  opponentRating: number;
  player: 1 | 2;
  opponentIsBot: boolean;
  opponentBotLevel: Difficulty | null;
}

export async function joinQueue(
  uid: string,
  rating: number,
  timeControl: TimeControl,
): Promise<void> {
  await setDoc(doc(db, 'matchmakingQueue', uid), {
    uid,
    rating,
    timeControl,
    joinedAt: serverTimestamp(),
    initialRange: 50,
  });
}

export async function cancelQueue(uid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'matchmakingQueue', uid));
  } catch (e) {
    console.warn('cancelQueue failed:', e);
  }
}

export async function clearPairing(uid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'pairings', uid));
  } catch (e) {
    console.warn('clearPairing failed:', e);
  }
}

export function watchPairing(
  uid: string,
  onPair: (p: PairingDoc | null) => void,
): () => void {
  return onSnapshot(
    doc(db, 'pairings', uid),
    (snap) => {
      if (!snap.exists()) {
        onPair(null);
        return;
      }
      const data = snap.data();
      onPair({
        matchId: data.matchId,
        shape: (data.shape ?? null) as ShapeId | null,
        opponentUid: data.opponentUid,
        opponentDisplayName: data.opponentDisplayName ?? 'Opponent',
        opponentRating: data.opponentRating ?? 1000,
        player: (data.player ?? 1) as 1 | 2,
        opponentIsBot: data.opponentIsBot === true,
        opponentBotLevel:
          data.opponentIsBot === true && typeof data.opponentBotLevel === 'number'
            ? (data.opponentBotLevel as Difficulty)
            : null,
      });
    },
    (err) => {
      console.warn('watchPairing error:', err);
      onPair(null);
    },
  );
}
