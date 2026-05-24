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

type WireAction = GameAction | { kind: 'timeout' } | { kind: 'resign' };

interface PendingMove {
  from: string;
  action: WireAction;
  clientTime?: number;
}

const RANGE_PER_SECOND = 25;
const MAX_RANGE = 500;
const SHAPES: ShapeId[] = ['triangle', 'square', 'rectangle'];
const TIME_CONTROL_MS: Record<TimeControl, number> = {
  '1min': 60_000,
  '3min': 180_000,
  '5min': 300_000,
};

// JSON round-trip strips undefined keys so RTDB accepts the payload.
function sanitize<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

type FinishedReason = 'normal' | 'timeout' | 'resign' | 'disconnect';

// Persist game outcome metadata to Firestore matches/{matchId} so we can
// count how games end (points / time / resign / disconnect). Match doc was
// created with status='created' by matchmake; we merge the final fields.
async function recordMatchFinished(
  matchId: string,
  winner: 1 | 2 | 'draw' | null,
  finishedReason: FinishedReason,
  finishedAt: number,
): Promise<void> {
  try {
    await getFirestore()
      .doc(`matches/${matchId}`)
      .set(
        {
          status: 'finished',
          winner,
          finishedReason,
          finishedAt,
        },
        { merge: true },
      );
  } catch (e) {
    logger.warn(`recordMatchFinished failed for ${matchId}`, e);
  }
}

// RTDB strips empty objects + arrays on write, so reads can come back with
// missing colored / completed / pending fields. Restore them before handing
// to the pure engine (applyAction).
function normalizeState(raw: Partial<GameState> & Record<string, unknown>): GameState {
  return {
    shape: raw.shape as GameState['shape'],
    mode: (raw.mode ?? 'multiplayer') as GameState['mode'],
    difficulty: raw.difficulty as GameState['difficulty'],
    current: (raw.current ?? 1) as GameState['current'],
    turn: (raw.turn ?? 1) as number,
    colored: (raw.colored ?? {}) as GameState['colored'],
    completed: (raw.completed ?? []) as GameState['completed'],
    pending: (raw.pending ?? []) as GameState['pending'],
    scores: (raw.scores ?? { 1: 0, 2: 0 }) as GameState['scores'],
    finished: (raw.finished ?? false) as boolean,
    winner: (raw.winner ?? null) as GameState['winner'],
  };
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
      const totalMs = TIME_CONTROL_MS[newEntry.timeControl];
      await rtdb.ref(`games/${matchId}`).set({
        state: sanitize(initialState),
        playerUids: { '1': p1Uid, '2': p2Uid },
        status: 'active',
        shape,
        timeControl: newEntry.timeControl,
        ready: { '1': false, '2': false },
        boardLoaded: { '1': false, '2': false },
        clock: {
          p1RemainingMs: totalMs,
          p2RemainingMs: totalMs,
          turnStartedAt: 0,
          current: 1,
          totalMs,
        },
        createdAt: Date.now(),
      });
      logger.info(`matchmake: RTDB game node ${matchId} created`);
    } catch (e) {
      logger.error(`matchmake: RTDB game node create failed for ${matchId}`, e);
    }
  },
);

// Clock starts only after BOTH clients confirm they've mounted the mpgame
// board (boardLoaded/{slot} flips true). Pressing Ready alone isn't enough -
// the screen-transition + render time would otherwise eat into the player's
// budget before the board is even visible.
export const startClockWhenBoardsLoaded = onValueWritten(
  'games/{gameId}/boardLoaded/{slot}',
  async (event) => {
    const after = event.data.after.val();
    if (after !== true) return;
    const gameId = event.params.gameId;
    const rtdb = getDatabase();
    const gameRef = rtdb.ref(`games/${gameId}`);
    const snap = await gameRef.get();
    const game = snap.val();
    if (!game) return;
    const loaded = game.boardLoaded ?? {};
    if (loaded['1'] !== true || loaded['2'] !== true) return;
    if (game.gameStartedAt) return; // already started
    const now = Date.now();
    await gameRef.update({
      gameStartedAt: now,
      'clock/turnStartedAt': now,
    });
    logger.info(`startClockWhenBoardsLoaded: game ${gameId} clock started at ${now}`);
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

    const state = normalizeState(game.state ?? {});
    const playerUids = game.playerUids as { '1': string; '2': string };

    let playerNum: 1 | 2 | 0 = 0;
    if (playerUids['1'] === after.from) playerNum = 1;
    else if (playerUids['2'] === after.from) playerNum = 2;

    if (!playerNum) {
      logger.warn(`validateMove: ${after.from} is not a participant in ${gameId}`);
      await moveRef.remove();
      return;
    }

    // Resign: the submitting player concedes; opponent wins immediately.
    if (after.action.kind === 'resign') {
      const winner: 1 | 2 = playerNum === 1 ? 2 : 1;
      const finishedAt = Date.now();
      await gameRef.update({
        'state/finished': true,
        'state/winner': winner,
        status: 'finished',
        winner,
        finishedAt,
        finishedReason: 'resign',
        pendingMove: null,
      });
      await recordMatchFinished(gameId, winner, 'resign', finishedAt);
      logger.info(`validateMove: ${after.from} resigned in ${gameId}, winner=${winner}`);
      return;
    }

    // Timeout claim: either participant can submit. Server verifies the
    // current player's clock is actually expired before forfeiting.
    if (after.action.kind === 'timeout') {
      const clock = (game.clock ?? {}) as Record<string, number | undefined>;
      const turnStartedAt = clock.turnStartedAt ?? 0;
      const currentSlot = (state.current ?? 1) as 1 | 2;
      const currentKey = currentSlot === 1 ? 'p1RemainingMs' : 'p2RemainingMs';
      const totalMs = clock.totalMs ?? 0;
      const baseMs = clock[currentKey] ?? totalMs;
      const realRemaining =
        turnStartedAt > 0 ? baseMs - (Date.now() - turnStartedAt) : baseMs;
      if (realRemaining > 0) {
        // Not actually timed out yet; reject silently.
        await moveRef.remove();
        return;
      }
      const winner: 1 | 2 = currentSlot === 1 ? 2 : 1;
      const finishedAt = Date.now();
      await gameRef.update({
        [`clock/${currentKey}`]: 0,
        'state/finished': true,
        'state/winner': winner,
        status: 'finished',
        winner,
        finishedAt,
        finishedReason: 'timeout',
        pendingMove: null,
      });
      await recordMatchFinished(gameId, winner, 'timeout', finishedAt);
      logger.info(`validateMove: timeout claim accepted in ${gameId}, winner=${winner}`);
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

    // Clock bookkeeping: deduct elapsed since turn started from the current
    // player's remaining time. turnStartedAt === 0 means the clock hasn't
    // been started by startClockWhenReady yet — happens only if the function
    // hasn't fired before the first move arrives; treat it as "now".
    const clock = (game.clock ?? {}) as Record<string, number | undefined>;
    const now = Date.now();
    const turnStartedAt = clock.turnStartedAt ?? 0;
    const elapsedMs = turnStartedAt > 0 ? now - turnStartedAt : 0;
    const currentKey = playerNum === 1 ? 'p1RemainingMs' : 'p2RemainingMs';
    const totalMs = clock.totalMs ?? 0;
    const currentRemainingMs = clock[currentKey] ?? totalMs;
    const newRemainingMs = currentRemainingMs - elapsedMs;

    if (newRemainingMs <= 0) {
      // Flag fall — current player loses on time.
      const winner: 1 | 2 = playerNum === 1 ? 2 : 1;
      await gameRef.update({
        [`clock/${currentKey}`]: 0,
        'state/finished': true,
        'state/winner': winner,
        status: 'finished',
        winner,
        finishedAt: now,
        finishedReason: 'timeout',
        pendingMove: null,
      });
      await recordMatchFinished(gameId, winner, 'timeout', now);
      logger.info(`validateMove: game ${gameId} timeout, winner=${winner}`);
      return;
    }

    try {
      const newState = applyAction(state, after.action);
      const otherKey = playerNum === 1 ? 'p2RemainingMs' : 'p1RemainingMs';
      const updates: Record<string, unknown> = {
        state: sanitize(newState),
        pendingMove: null,
        [`clock/${currentKey}`]: newRemainingMs,
        [`clock/${otherKey}`]: clock[otherKey] ?? totalMs,
        'clock/turnStartedAt': now,
        'clock/current': newState.current,
      };
      if (newState.finished) {
        updates.status = 'finished';
        updates.winner = newState.winner;
        updates.finishedAt = now;
        updates.finishedReason = 'normal';
      }
      await gameRef.update(updates);
      if (newState.finished) {
        const w = newState.winner as 1 | 2 | 'draw' | null;
        await recordMatchFinished(gameId, w, 'normal', now);
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
