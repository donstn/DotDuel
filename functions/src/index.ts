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
          playerUids: [p1Uid, p2Uid],
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

// Phase E.2 — Elo + match history finalization.
//
// Per-player placement K-factor (games 1..10), then K=32 steady-state.
// Locked in docs/multiplayer-roadmap.md §6.2.
const PLACEMENT_K: readonly number[] = [50, 45, 40, 35, 30, 25, 20, 15, 10, 10];
const STEADY_K = 32;

function kForPlacement(gamesPlayed: number): number {
  if (gamesPlayed >= PLACEMENT_K.length) return STEADY_K;
  return PLACEMENT_K[gamesPlayed];
}

function expectedScore(myRating: number, oppRating: number): number {
  return 1 / (1 + Math.pow(10, (oppRating - myRating) / 400));
}

// Triggered when a game's top-level status flips to 'finished'. Reads the
// final state from RTDB, computes Elo deltas for both players using their
// own placement K, and writes the full match record + new user ratings
// in a single Firestore transaction. Idempotent via matches.eloFinalized.
export const finalizeGame = onValueWritten(
  'games/{gameId}/status',
  async (event) => {
    const after = event.data.after.val();
    const before = event.data.before.val();
    if (after !== 'finished') return;
    if (before === 'finished') return;

    const gameId = event.params.gameId;
    const rtdb = getDatabase();
    const db = getFirestore();

    const gameSnap = await rtdb.ref(`games/${gameId}`).get();
    const game = gameSnap.val();
    if (!game) {
      logger.warn(`finalizeGame: RTDB game ${gameId} not found`);
      return;
    }

    const matchRef = db.doc(`matches/${gameId}`);
    const matchOuter = await matchRef.get();
    const matchData = matchOuter.data();
    if (!matchData) {
      logger.warn(`finalizeGame: Firestore match ${gameId} not found`);
      return;
    }
    if (matchData.eloFinalized === true) {
      logger.info(`finalizeGame: ${gameId} already finalized`);
      return;
    }

    const p1Uid = matchData.p1Uid as string | undefined;
    const p2Uid = matchData.p2Uid as string | undefined;
    if (!p1Uid || !p2Uid) {
      logger.warn(`finalizeGame: missing player UIDs in match ${gameId}`);
      return;
    }

    const state = normalizeState(game.state ?? {});
    const winner = (game.winner ?? state.winner ?? null) as
      | 1
      | 2
      | 'draw'
      | null;
    const finishedReason = (game.finishedReason ?? 'normal') as FinishedReason;
    const finishedAt = (game.finishedAt ?? Date.now()) as number;
    const gameStartedAt = (game.gameStartedAt ?? finishedAt) as number;
    const durationMs = Math.max(0, finishedAt - gameStartedAt);
    const p1Score = (state.scores?.[1] ?? 0) as number;
    const p2Score = (state.scores?.[2] ?? 0) as number;
    const ranked = matchData.ranked !== false;

    try {
      await db.runTransaction(async (tx) => {
        const p1Ref = db.doc(`users/${p1Uid}`);
        const p2Ref = db.doc(`users/${p2Uid}`);
        const [p1Snap, p2Snap, mSnap] = await Promise.all([
          tx.get(p1Ref),
          tx.get(p2Ref),
          tx.get(matchRef),
        ]);

        if (mSnap.data()?.eloFinalized === true) return;

        const p1 = p1Snap.data() ?? {};
        const p2 = p2Snap.data() ?? {};
        const p1RatingBefore =
          typeof p1.rating === 'number' ? p1.rating : 1000;
        const p2RatingBefore =
          typeof p2.rating === 'number' ? p2.rating : 1000;
        const p1Placement =
          typeof p1.placementGamesPlayed === 'number'
            ? p1.placementGamesPlayed
            : 0;
        const p2Placement =
          typeof p2.placementGamesPlayed === 'number'
            ? p2.placementGamesPlayed
            : 0;

        let p1Actual = 0.5;
        let p2Actual = 0.5;
        if (winner === 1) {
          p1Actual = 1;
          p2Actual = 0;
        } else if (winner === 2) {
          p1Actual = 0;
          p2Actual = 1;
        }

        const p1Expected = expectedScore(p1RatingBefore, p2RatingBefore);
        const p2Expected = 1 - p1Expected;

        const p1K = kForPlacement(p1Placement);
        const p2K = kForPlacement(p2Placement);

        const p1Delta = ranked
          ? Math.round(p1K * (p1Actual - p1Expected))
          : 0;
        const p2Delta = ranked
          ? Math.round(p2K * (p2Actual - p2Expected))
          : 0;
        const p1RatingAfter = p1RatingBefore + p1Delta;
        const p2RatingAfter = p2RatingBefore + p2Delta;

        if (ranked) {
          tx.set(
            p1Ref,
            {
              rating: p1RatingAfter,
              placementGamesPlayed: p1Placement + 1,
            },
            { merge: true },
          );
          tx.set(
            p2Ref,
            {
              rating: p2RatingAfter,
              placementGamesPlayed: p2Placement + 1,
            },
            { merge: true },
          );
        }

        tx.set(
          matchRef,
          {
            status: 'finished',
            winner,
            finishedReason,
            finishedAt,
            gameStartedAt,
            durationMs,
            p1ScoreFinal: p1Score,
            p2ScoreFinal: p2Score,
            p1RatingBefore,
            p2RatingBefore,
            p1RatingAfter,
            p2RatingAfter,
            p1RatingDelta: p1Delta,
            p2RatingDelta: p2Delta,
            // Make sure the array exists for legacy matches written
            // before the matchmake change.
            playerUids: [p1Uid, p2Uid],
            eloFinalized: true,
          },
          { merge: true },
        );
      });
      logger.info(
        `finalizeGame: ${gameId} Elo applied (winner=${String(winner)}, reason=${finishedReason})`,
      );
    } catch (e) {
      logger.error(`finalizeGame: transaction failed for ${gameId}`, e);
    }
  },
);

// Rematch — triggered when a player flips games/{gameId}/rematch/{slot} = true.
// When BOTH players have flipped their flag, spawn a fresh game node + new
// pairings using the same shape and time control. Slots swap so the previous
// P2 plays first this time (chess-style colour alternation). Idempotent via
// rematchSpawnedId on the old game node.
export const rematchGame = onValueWritten(
  'games/{gameId}/rematch/{slot}',
  async (event) => {
    const after = event.data.after.val();
    if (after !== true) return;

    const gameId = event.params.gameId;
    const rtdb = getDatabase();
    const db = getFirestore();

    const gameRef = rtdb.ref(`games/${gameId}`);
    const gameSnap = await gameRef.get();
    const game = gameSnap.val();
    if (!game) return;

    if (game.rematchSpawnedId) {
      // Already spawned a rematch from this game node.
      return;
    }

    const rematch = (game.rematch ?? {}) as { '1'?: boolean; '2'?: boolean };
    if (rematch['1'] !== true || rematch['2'] !== true) {
      // Only one side has agreed so far.
      return;
    }

    const oldMatchRef = db.doc(`matches/${gameId}`);
    const oldMatchSnap = await oldMatchRef.get();
    const oldMatch = oldMatchSnap.data();
    if (!oldMatch) {
      logger.warn(`rematchGame: ${gameId} has no Firestore match doc`);
      return;
    }

    const prevP1Uid = oldMatch.p1Uid as string | undefined;
    const prevP2Uid = oldMatch.p2Uid as string | undefined;
    const prevP1Display = (oldMatch.p1Display as string) ?? 'Player 1';
    const prevP2Display = (oldMatch.p2Display as string) ?? 'Player 2';
    const shape = oldMatch.shape as ShapeId | undefined;
    const tc = oldMatch.timeControl as TimeControl | undefined;
    if (!prevP1Uid || !prevP2Uid || !shape || !tc) {
      logger.warn(`rematchGame: ${gameId} match doc missing required fields`);
      return;
    }

    // Swap slots — previous P2 plays first in the rematch.
    const newP1Uid = prevP2Uid;
    const newP2Uid = prevP1Uid;
    const newP1Display = prevP2Display;
    const newP2Display = prevP1Display;

    const newMatchId = db.collection('matches').doc().id;

    // Mark idempotency on the OLD game node first so concurrent invocations
    // bail. set() of a missing parent path will create it; safe even if a
    // prior partial run already touched some fields.
    try {
      await gameRef.child('rematchSpawnedId').transaction((current) => {
        if (current) return; // already set — abort spawn
        return newMatchId;
      });
    } catch (e) {
      logger.error(`rematchGame: idempotency tx failed for ${gameId}`, e);
      return;
    }
    // Re-read to confirm we won the race.
    const confirmedId = (await gameRef.child('rematchSpawnedId').get()).val();
    if (confirmedId !== newMatchId) {
      // Another invocation won the spawn race.
      return;
    }

    // Read current ratings (snapshot, not transactional — best-effort).
    const [p1UserSnap, p2UserSnap] = await Promise.all([
      db.doc(`users/${newP1Uid}`).get(),
      db.doc(`users/${newP2Uid}`).get(),
    ]);
    const newP1Rating =
      typeof p1UserSnap.data()?.rating === 'number'
        ? (p1UserSnap.data()!.rating as number)
        : 1000;
    const newP2Rating =
      typeof p2UserSnap.data()?.rating === 'number'
        ? (p2UserSnap.data()!.rating as number)
        : 1000;

    const totalMs = TIME_CONTROL_MS[tc];
    const initialState = createGame(shape, 'multiplayer');

    // Create the RTDB game node for the rematch.
    try {
      await rtdb.ref(`games/${newMatchId}`).set({
        state: sanitize(initialState),
        playerUids: { '1': newP1Uid, '2': newP2Uid },
        status: 'active',
        shape,
        timeControl: tc,
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
        rematchOf: gameId,
      });
    } catch (e) {
      logger.error(`rematchGame: RTDB node create failed for ${newMatchId}`, e);
      return;
    }

    // Create Firestore match doc + pairings for both players (mirror matchmake).
    try {
      const batch = db.batch();
      batch.set(db.doc(`matches/${newMatchId}`), {
        status: 'created',
        createdAt: FieldValue.serverTimestamp(),
        timeControl: tc,
        shape,
        p1Uid: newP1Uid,
        p2Uid: newP2Uid,
        p1Display: newP1Display,
        p2Display: newP2Display,
        playerUids: [newP1Uid, newP2Uid],
        ranked: true,
        rematchOf: gameId,
      });
      batch.set(db.doc(`pairings/${newP1Uid}`), {
        matchId: newMatchId,
        shape,
        opponentUid: newP2Uid,
        opponentDisplayName: newP2Display,
        opponentRating: newP2Rating,
        player: 1,
        createdAt: FieldValue.serverTimestamp(),
      });
      batch.set(db.doc(`pairings/${newP2Uid}`), {
        matchId: newMatchId,
        shape,
        opponentUid: newP1Uid,
        opponentDisplayName: newP1Display,
        opponentRating: newP1Rating,
        player: 2,
        createdAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();
    } catch (e) {
      logger.error(
        `rematchGame: Firestore writes failed for ${newMatchId}`,
        e,
      );
      return;
    }

    logger.info(
      `rematchGame: ${gameId} → ${newMatchId} (rematch of ${prevP1Uid} vs ${prevP2Uid}, slots swapped)`,
    );
  },
);
