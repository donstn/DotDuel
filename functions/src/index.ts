import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onValueWritten } from 'firebase-functions/v2/database';
import { setGlobalOptions, logger } from 'firebase-functions/v2';
import { initializeApp } from 'firebase-admin/app';
import {
  getFirestore,
  FieldValue,
  Timestamp,
} from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import { applyAction, createGame } from './engine/game';
import type { GameAction, GameState, ShapeId } from './engine/types';

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

interface PendingMove {
  from: string;
  action: GameAction;
  clientTime?: number;
}

const RANGE_PER_SECOND = 25;
const MAX_RANGE = 500;
const SHAPES: ShapeId[] = ['triangle', 'square', 'rectangle', 'rhombus'];

// JSON round-trip strips undefined keys so RTDB accepts the payload.
function sanitize<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export const matchmake = onDocumentCreated(
  'matchmakingQueue/{uid}',
  async (event) => {
    const db = getFirestore();
    const rtdb = getDatabase();
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

    const [newUserSnap, oppUserSnap] = await Promise.all([
      db.doc(`users/${newUid}`).get(),
      db.doc(`users/${best.uid}`).get(),
    ]);
    const newDisplay = (newUserSnap.data()?.displayName as string | undefined) ?? 'Opponent';
    const oppDisplay = (oppUserSnap.data()?.displayName as string | undefined) ?? 'Opponent';

    const matchId = db.collection('matches').doc().id;
    const shape: ShapeId = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const newRef = db.doc(`matchmakingQueue/${newUid}`);
    const oppRef = db.doc(`matchmakingQueue/${best.uid}`);
    const matchRef = db.doc(`matches/${matchId}`);
    const newPairRef = db.doc(`pairings/${newUid}`);
    const oppPairRef = db.doc(`pairings/${best.uid}`);

    let p1Uid = '';
    let p2Uid = '';

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
        p1Uid = oppIsFirst ? best!.uid : newUid;
        p2Uid = oppIsFirst ? newUid : best!.uid;
        const p1Display = oppIsFirst ? oppDisplay : newDisplay;
        const p2Display = oppIsFirst ? newDisplay : oppDisplay;

        tx.delete(newRef);
        tx.delete(oppRef);
        tx.set(matchRef, {
          status: 'created',
          createdAt: FieldValue.serverTimestamp(),
          timeControl: newEntry.timeControl,
          shape,
          p1Uid,
          p2Uid,
          p1Display,
          p2Display,
          ranked: true,
        });
        tx.set(newPairRef, {
          matchId,
          shape,
          opponentUid: best!.uid,
          opponentDisplayName: oppDisplay,
          opponentRating: best!.entry.rating,
          player: oppIsFirst ? 2 : 1,
          createdAt: FieldValue.serverTimestamp(),
        });
        tx.set(oppPairRef, {
          matchId,
          shape,
          opponentUid: newUid,
          opponentDisplayName: newDisplay,
          opponentRating: newEntry.rating,
          player: oppIsFirst ? 1 : 2,
          createdAt: FieldValue.serverTimestamp(),
        });
      });
      logger.info(`matchmake: paired ${newUid} (${newDisplay}) <-> ${best.uid} (${oppDisplay}) as match ${matchId} on ${shape}`);
    } catch (e) {
      logger.warn('matchmake: pairing transaction failed', e);
      return;
    }

    // Create the RTDB game node so both clients have a live state to subscribe to.
    try {
      const initialState = createGame(shape, 'multiplayer');
      await rtdb.ref(`games/${matchId}`).set({
        state: sanitize(initialState),
        playerUids: { '1': p1Uid, '2': p2Uid },
        status: 'active',
        shape,
        timeControl: newEntry.timeControl,
        createdAt: Date.now(),
      });
      logger.info(`matchmake: RTDB game node ${matchId} created`);
    } catch (e) {
      logger.error(`matchmake: RTDB game node create failed for ${matchId}`, e);
    }
  },
);

export const validateMove = onValueWritten(
  'games/{gameId}/pendingMove',
  async (event) => {
    const after = event.data.after.val() as PendingMove | null;
    if (!after) return; // we cleared it ourselves
    const gameId = event.params.gameId;
    const rtdb = getDatabase();
    const gameRef = rtdb.ref(`games/${gameId}`);
    const moveRef = rtdb.ref(`games/${gameId}/pendingMove`);
    const errorRef = rtdb.ref(`games/${gameId}/error`);

    const gameSnap = await gameRef.get();
    const game = gameSnap.val();
    if (!game || game.status !== 'active') {
      await moveRef.remove();
      return;
    }

    const state = game.state as GameState;
    const playerUids = game.playerUids as { '1': string; '2': string };

    let playerNum: 1 | 2 | 0 = 0;
    if (playerUids['1'] === after.from) playerNum = 1;
    else if (playerUids['2'] === after.from) playerNum = 2;

    if (!playerNum) {
      logger.warn(`validateMove: ${after.from} is not a participant in ${gameId}`);
      await moveRef.remove();
      return;
    }

    if (state.current !== playerNum) {
      await errorRef.set({
        code: 'not-your-turn',
        message: 'It is not your turn.',
        forUid: after.from,
        ts: Date.now(),
      });
      await moveRef.remove();
      return;
    }

    try {
      const newState = applyAction(state, after.action);
      const updates: Record<string, unknown> = {
        state: sanitize(newState),
        pendingMove: null,
      };
      if (newState.finished) {
        updates.status = 'finished';
        updates.winner = newState.winner;
        updates.finishedAt = Date.now();
      }
      await gameRef.update(updates);
      if (newState.finished) {
        logger.info(`validateMove: game ${gameId} finished, winner=${String(newState.winner)}`);
      }
    } catch (e) {
      await errorRef.set({
        code: 'invalid-move',
        message: (e as Error)?.message ?? 'Invalid move',
        forUid: after.from,
        ts: Date.now(),
      });
      await moveRef.remove();
    }
  },
);
