import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { setGlobalOptions, logger } from 'firebase-functions/v2';
import { initializeApp } from 'firebase-admin/app';
import {
  getFirestore,
  FieldValue,
  Timestamp,
} from 'firebase-admin/firestore';

initializeApp();
setGlobalOptions({ region: 'europe-west1', maxInstances: 10 });

type TimeControl = '1min' | '3min' | '5min';

interface QueueEntry {
  uid: string;
  rating: number;
  timeControl: TimeControl;
  joinedAt: Timestamp;
  initialRange: number;
}

const RANGE_PER_SECOND = 25;
const MAX_RANGE = 500;

export const matchmake = onDocumentCreated(
  'matchmakingQueue/{uid}',
  async (event) => {
    const db = getFirestore();
    const newEntry = event.data?.data() as QueueEntry | undefined;
    if (!newEntry) return;
    const newUid = event.params.uid;

    const candidates = await db
      .collection('matchmakingQueue')
      .where('timeControl', '==', newEntry.timeControl)
      .get();

    let best: { uid: string; entry: QueueEntry } | null = null;
    let bestDelta = Infinity;
    const now = Date.now();

    for (const doc of candidates.docs) {
      if (doc.id === newUid) continue;
      const c = doc.data() as QueueEntry;
      const cJoined = c.joinedAt?.toMillis?.() ?? now;
      const waitedSec = Math.max(0, (now - cJoined) / 1000);
      const range = Math.min(MAX_RANGE, c.initialRange + RANGE_PER_SECOND * waitedSec);
      const delta = Math.abs(c.rating - newEntry.rating);
      if (delta > range) continue;
      if (delta < bestDelta) {
        bestDelta = delta;
        best = { uid: doc.id, entry: c };
      }
    }

    if (!best) {
      logger.info(`matchmake: no opponent for ${newUid} (rating ${newEntry.rating}, tc ${newEntry.timeControl})`);
      return;
    }

    // Denormalize opponent display name + rating into the pairing doc so the
    // client doesn't need to read the opponent's users/{uid} (blocked by rules).
    const [newUserSnap, oppUserSnap] = await Promise.all([
      db.doc(`users/${newUid}`).get(),
      db.doc(`users/${best.uid}`).get(),
    ]);
    const newDisplay = (newUserSnap.data()?.displayName as string | undefined) ?? 'Opponent';
    const oppDisplay = (oppUserSnap.data()?.displayName as string | undefined) ?? 'Opponent';

    const matchId = db.collection('matches').doc().id;
    const newRef = db.doc(`matchmakingQueue/${newUid}`);
    const oppRef = db.doc(`matchmakingQueue/${best.uid}`);
    const matchRef = db.doc(`matches/${matchId}`);
    const newPairRef = db.doc(`pairings/${newUid}`);
    const oppPairRef = db.doc(`pairings/${best.uid}`);

    try {
      await db.runTransaction(async (tx) => {
        const [newSnap, oppSnap] = await Promise.all([
          tx.get(newRef),
          tx.get(oppRef),
        ]);
        if (!newSnap.exists || !oppSnap.exists) {
          throw new Error('one or both queue entries already claimed');
        }
        const newJoinedAt = (newSnap.data() as QueueEntry).joinedAt?.toMillis?.() ?? 0;
        const oppJoinedAt = (oppSnap.data() as QueueEntry).joinedAt?.toMillis?.() ?? 0;
        const oppIsFirst = oppJoinedAt <= newJoinedAt;
        const p1Uid = oppIsFirst ? best!.uid : newUid;
        const p2Uid = oppIsFirst ? newUid : best!.uid;
        const p1Display = oppIsFirst ? oppDisplay : newDisplay;
        const p2Display = oppIsFirst ? newDisplay : oppDisplay;

        tx.delete(newRef);
        tx.delete(oppRef);
        tx.set(matchRef, {
          status: 'created',
          createdAt: FieldValue.serverTimestamp(),
          timeControl: newEntry.timeControl,
          p1Uid,
          p2Uid,
          p1Display,
          p2Display,
          ranked: true,
        });
        tx.set(newPairRef, {
          matchId,
          opponentUid: best!.uid,
          opponentDisplayName: oppDisplay,
          opponentRating: best!.entry.rating,
          player: oppIsFirst ? 2 : 1,
          createdAt: FieldValue.serverTimestamp(),
        });
        tx.set(oppPairRef, {
          matchId,
          opponentUid: newUid,
          opponentDisplayName: newDisplay,
          opponentRating: newEntry.rating,
          player: oppIsFirst ? 1 : 2,
          createdAt: FieldValue.serverTimestamp(),
        });
      });
      logger.info(`matchmake: paired ${newUid} (${newDisplay}) <-> ${best.uid} (${oppDisplay}) as match ${matchId}`);
    } catch (e) {
      logger.warn('matchmake: pairing transaction failed', e);
    }
  },
);
