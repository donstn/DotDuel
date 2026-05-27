import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onValueWritten } from 'firebase-functions/v2/database';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { setGlobalOptions, logger } from 'firebase-functions/v2';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import {
  getFirestore,
  FieldValue,
  Timestamp,
} from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import { applyAction, createGame } from './engine/game';
import { pickAIAction } from './engine/ai';
import type { Difficulty, GameAction, GameState, Player, ShapeId } from './engine/types';
import { createHash } from 'crypto';

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
// Note: the playable shape pool is now derived per-pair via the
// unlockedShapes helper inside matchmake — see there. Rhombus
// stays paused (not in any returned set).
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
      logger.info(`matchmake: no opponent for ${hashUid(newUid)} (rating ${newEntry.rating}, tc ${newEntry.timeControl})`);
      return;
    }

    const [newUserSnap, oppUserSnap] = await Promise.all([
      db.doc(`users/${newUid}`).get(),
      db.doc(`users/${best.uid}`).get(),
    ]);
    const newDisplay = (newUserSnap.data()?.displayName as string | undefined) ?? 'Opponent';
    const oppDisplay = (oppUserSnap.data()?.displayName as string | undefined) ?? 'Opponent';

    // Shape progression — ranked-games gated.
    // Triangle  unlocked from game 1.
    // Square    unlocked at 50 ranked games (= 50 in placementGamesPlayed,
    //                                        which is "total ranked games played"
    //                                        post-finalize, not just placement).
    // Rectangle unlocked at 100 ranked games.
    // (Rhombus stays paused, not in SHAPES list.)
    // The shape picked is the intersection of both players' unlocked
    // sets, so a veteran matched with a beginner still plays Triangle.
    const newGames =
      (newUserSnap.data()?.placementGamesPlayed as number | undefined) ?? 0;
    const oppGames =
      (oppUserSnap.data()?.placementGamesPlayed as number | undefined) ?? 0;
    const unlockedShapes = (gamesPlayed: number): ShapeId[] => {
      const out: ShapeId[] = ['triangle'];
      if (gamesPlayed >= 50) out.push('square');
      if (gamesPlayed >= 100) out.push('rectangle');
      return out;
    };
    const newShapes = unlockedShapes(newGames);
    const oppShapes = unlockedShapes(oppGames);
    const allowedShapes = newShapes.filter((s) => oppShapes.includes(s));
    // allowedShapes is guaranteed non-empty (both have Triangle).
    const matchId = db.collection('matches').doc().id;
    const shape: ShapeId =
      allowedShapes[Math.floor(Math.random() * allowedShapes.length)];
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
      logger.info(`matchmake: paired ${hashUid(newUid)} <-> ${hashUid(best.uid)} as match ${matchId} on ${shape}`);
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
      logger.warn(`validateMove: ${hashUid(String(after.from))} is not a participant in ${gameId}`);
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
      logger.info(`validateMove: ${hashUid(String(after.from))} resigned in ${gameId}, winner=${winner}`);
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

          // Denormalised public leaderboard entries. Holds only fields that
          // are safe for any signed-in user to read (displayName + rating +
          // placement counter + last-played timestamp). Email / progress /
          // anything else stays in users/{uid} which is owner-only.
          // isBot / botLevel are surfaced here so RankingsPopover can render
          // bot avatars + the "BOT" tag without needing a second fetch.
          const p1IsBot = p1.isBot === true;
          const p2IsBot = p2.isBot === true;
          tx.set(
            db.doc(`leaderboard/${p1Uid}`),
            {
              uid: p1Uid,
              displayName: (matchData.p1Display as string) ?? 'Player 1',
              rating: p1RatingAfter,
              placementGamesPlayed: p1Placement + 1,
              lastPlayedAt: finishedAt,
              isBot: p1IsBot,
              botLevel: p1IsBot ? (p1.botLevel as Difficulty) : null,
            },
            { merge: true },
          );
          tx.set(
            db.doc(`leaderboard/${p2Uid}`),
            {
              uid: p2Uid,
              displayName: (matchData.p2Display as string) ?? 'Player 2',
              rating: p2RatingAfter,
              placementGamesPlayed: p2Placement + 1,
              lastPlayedAt: finishedAt,
              isBot: p2IsBot,
              botLevel: p2IsBot ? (p2.botLevel as Difficulty) : null,
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
      `rematchGame: ${gameId} → ${newMatchId} (rematch of ${hashUid(prevP1Uid)} vs ${hashUid(prevP2Uid)}, slots swapped)`,
    );
  },
);

// ===========================================================================
// GDPR Article 17 — right to erasure ("right to be forgotten")
// ===========================================================================
//
// deleteAccount is the user-callable Cloud Function that wipes the
// caller's account. Sequence:
//   1. Forfeit any active multiplayer game (synthetic resign so the
//      opponent gets their Elo and the match record persists).
//   2. Delete the user's own per-user docs (users, leaderboard, pairings,
//      matchmakingQueue, usernames, gameSessions).
//   3. Scrub the user's UID and displayName from every matches/{id}
//      doc they're a participant of — replace with the sentinel.
//      DO NOT touch ratings/scores/deltas; opponents keep their Elo
//      history intact ("rankings stay the same" — user decision).
//   4. Delete the Firebase Auth user.
//   5. Write a deletionLog/{shortHash} audit row.
//
// Idempotency: callable function; if called twice for the same uid,
// step 4 returns NOT_FOUND on the second call. Steps 2-3 are no-ops on
// the second call (writes to non-existent docs are a noop in admin SDK
// when using update; we use delete which is also safe to repeat).

function deletedSentinelFor(uid: string): string {
  const hash = createHash('sha256').update(uid).digest('hex').slice(0, 8);
  return `deleted-${hash}`;
}

const DELETED_DISPLAY = 'Deleted player';

function normNameForUsername(name: string): string {
  return name.trim().toLowerCase();
}

// ===========================================================================
// M-3: Per-uid rate limiter for callable functions
// ===========================================================================
// Lightweight Firestore-backed token bucket. Each call updates a doc at
// rateLimits/{uid}__{bucket} with a sliding-window counter. Above the
// cap, throws RESOURCE_EXHAUSTED.
//
// Bucket strategy: we use a per-minute floor as the bucket id, so the
// counter resets implicitly each minute. Cheap (one doc read/write per
// call), no scheduled cleanup needed (docs naturally rotate; old ones
// are unused).

interface RateLimitConfig {
  perMinute: number;  // calls allowed per uid per 60-second window
  bucket: string;     // function identifier, e.g. 'deleteAccount'
}

async function enforceRateLimit(
  uid: string,
  config: RateLimitConfig,
): Promise<void> {
  const db = getFirestore();
  const minuteFloor = Math.floor(Date.now() / 60_000);
  const docId = `${uid}__${config.bucket}__${minuteFloor}`;
  const ref = db.doc(`rateLimits/${docId}`);
  try {
    const newCount = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const current = (snap.data()?.count as number | undefined) ?? 0;
      const next = current + 1;
      tx.set(ref, {
        count: next,
        bucket: config.bucket,
        uid,
        windowStartMinute: minuteFloor,
        updatedAt: Timestamp.now(),
      });
      return next;
    });
    if (newCount > config.perMinute) {
      logger.warn(
        `rateLimit: ${config.bucket} exceeded for ${hashUid(uid)} (${newCount}/${config.perMinute})`,
      );
      throw new HttpsError(
        'resource-exhausted',
        'Too many requests. Try again in a minute.',
      );
    }
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    // If the rate-limit infrastructure itself fails (Firestore outage),
    // don't block the user — log and let the call proceed.
    logger.error('rateLimit: storage failed, allowing call', e);
  }
}

// L-5: hash UIDs in Cloud Logging so raw pseudonymous identifiers don't
// sit in log indexes. The first 8 hex chars are enough to correlate
// without exposing the full token.
function hashUid(uid: string): string {
  return 'u_' + createHash('sha256').update(uid).digest('hex').slice(0, 8);
}

// M-1: server-side username availability check. Used by the
// UsernamePicker debounced lookup so we have a single throttleable
// chokepoint instead of letting clients hit usernames/{lower} freely
// for enumeration. The transactional claim in usernames.ts still
// hits the docs directly (necessary for atomic uniqueness), but a
// flood of availability checks now goes through this function which
// the rate limiter (M-3) wraps.
const USERNAME_RE = /^[a-zA-Z0-9_-]{3,16}$/;

export const checkUsernameAvailable = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError(
        'unauthenticated',
        'Sign in required.',
      );
    }
    await enforceRateLimit(uid, { perMinute: 30, bucket: 'checkUsernameAvailable' });
    const raw = (request.data as { name?: unknown })?.name;
    if (typeof raw !== 'string') {
      throw new HttpsError('invalid-argument', 'name must be a string');
    }
    const trimmed = raw.trim();
    if (!USERNAME_RE.test(trimmed)) {
      // Don't reveal whether it's taken or invalid format — just say
      // unavailable for any bad format input.
      return { available: false, reason: 'format' as const };
    }
    const lower = trimmed.toLowerCase();
    const db = getFirestore();
    try {
      const snap = await db.doc(`usernames/${lower}`).get();
      if (!snap.exists) return { available: true };
      const ownerUid = snap.data()?.uid as string | undefined;
      // If the requester already owns this name, it's "available" to them.
      return { available: ownerUid === uid };
    } catch (e) {
      logger.warn('checkUsernameAvailable read failed', e);
      throw new HttpsError('internal', 'availability check failed');
    }
  },
);

export const deleteAccount = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError(
        'unauthenticated',
        'Sign in required to delete your account.',
      );
    }
    // We don't accept a target uid argument — you can only delete yourself.
    // Future admin-purge path would be a separate function with claim check.

    await enforceRateLimit(uid, { perMinute: 3, bucket: 'deleteAccount' });

    // H-1: Re-auth gate. Account deletion is permanent and irreversible.
    // Require the user to have signed in within the last 5 minutes so a
    // session-theft attacker can't quietly nuke the account. Client catches
    // the FAILED_PRECONDITION and prompts a fresh sign-in.
    const authTimeSec = (request.auth?.token.auth_time as number | undefined) ?? 0;
    const ageSec = Date.now() / 1000 - authTimeSec;
    const REAUTH_WINDOW_SEC = 5 * 60;
    if (ageSec > REAUTH_WINDOW_SEC) {
      throw new HttpsError(
        'failed-precondition',
        'For security, please sign out and back in within the last 5 minutes, then try again.',
      );
    }

    const db = getFirestore();
    const rtdb = getDatabase();
    const sentinelUid = deletedSentinelFor(uid);
    let oldDisplayName: string | null = null;

    // --- Step 1: forfeit any active MP game ---
    try {
      const pairingSnap = await db.doc(`pairings/${uid}`).get();
      if (pairingSnap.exists) {
        const pairing = pairingSnap.data();
        const matchId = pairing?.matchId as string | undefined;
        if (matchId) {
          const gameRef = rtdb.ref(`games/${matchId}`);
          const gameSnap = await gameRef.get();
          const game = gameSnap.val();
          if (game && game.status === 'active') {
            // Submit a synthetic resign action through pendingMove. The
            // existing validateMove trigger will accept it, finalizeGame
            // will fire on status='finished', the opponent gets their
            // Elo gain via the standard resign code path.
            await rtdb.ref(`games/${matchId}/pendingMove`).set({
              from: uid,
              action: { kind: 'resign' },
              clientTime: Date.now(),
            });
            // Give the trigger a beat to settle.
            await new Promise((r) => setTimeout(r, 1500));
          }
        }
      }
    } catch (e) {
      logger.warn(`deleteAccount: pre-forfeit failed for ${hashUid(uid)}`, e);
      // Continue regardless — erasure must complete.
    }

    // --- Step 2: scrub direct child docs ---
    try {
      const userSnap = await db.doc(`users/${uid}`).get();
      oldDisplayName = (userSnap.data()?.displayName as string) ?? null;

      const batch = db.batch();
      batch.delete(db.doc(`users/${uid}`));
      batch.delete(db.doc(`leaderboard/${uid}`));
      batch.delete(db.doc(`pairings/${uid}`));
      batch.delete(db.doc(`matchmakingQueue/${uid}`));
      if (oldDisplayName) {
        batch.delete(
          db.doc(`usernames/${normNameForUsername(oldDisplayName)}`),
        );
      }
      await batch.commit();

      // RTDB session lock
      await rtdb.ref(`gameSessions/${uid}`).remove();
    } catch (e) {
      logger.error(`deleteAccount: scrub direct docs failed for ${hashUid(uid)}`, e);
      throw new HttpsError('internal', 'Failed to delete account data.');
    }

    // --- Step 3: anonymise match references ---
    // Paginated query — most users have <100 matches; cap at 1000 for
    // safety. If anyone exceeds that we'd add cursor pagination, but
    // 1000 ranked games is more than current production traffic.
    try {
      const matchesSnap = await db
        .collection('matches')
        .where('playerUids', 'array-contains', uid)
        .limit(1000)
        .get();

      if (!matchesSnap.empty) {
        // Firestore batched write supports up to 500 ops. Chunk.
        const docs = matchesSnap.docs;
        for (let i = 0; i < docs.length; i += 400) {
          const chunk = docs.slice(i, i + 400);
          const batch = db.batch();
          for (const doc of chunk) {
            const data = doc.data();
            const updates: Record<string, unknown> = {};
            if (data.p1Uid === uid) {
              updates.p1Uid = sentinelUid;
              updates.p1Display = DELETED_DISPLAY;
            }
            if (data.p2Uid === uid) {
              updates.p2Uid = sentinelUid;
              updates.p2Display = DELETED_DISPLAY;
            }
            // Rebuild playerUids array to reflect the swap. Don't trust
            // existing array contents — derive from the (possibly just
            // updated) p1Uid/p2Uid.
            const newP1 =
              updates.p1Uid !== undefined
                ? (updates.p1Uid as string)
                : (data.p1Uid as string);
            const newP2 =
              updates.p2Uid !== undefined
                ? (updates.p2Uid as string)
                : (data.p2Uid as string);
            updates.playerUids = [newP1, newP2];
            batch.update(doc.ref, updates);
          }
          await batch.commit();
        }
        logger.info(
          `deleteAccount: anonymised ${docs.length} match records for ${hashUid(uid)}`,
        );
      }
    } catch (e) {
      logger.error(`deleteAccount: anonymise matches failed for ${hashUid(uid)}`, e);
      // Don't throw — Auth user removal in step 4 is the highest-stakes
      // step; partial completion is better than rolling back step 2.
    }

    // --- Step 4: delete the Firebase Auth user ---
    try {
      await getAuth().deleteUser(uid);
    } catch (e) {
      const code = (e as { code?: string })?.code ?? '';
      if (code === 'auth/user-not-found') {
        // Already gone — fine.
      } else {
        logger.error(`deleteAccount: Auth delete failed for ${hashUid(uid)}`, e);
        throw new HttpsError(
          'internal',
          'Failed to remove your sign-in credentials.',
        );
      }
    }

    // --- Step 5: audit log ---
    try {
      await db.doc(`deletionLog/${sentinelUid}`).set({
        originalUidHashed: sentinelUid,
        deletedAt: Timestamp.now(),
        reason: 'user-request',
      });
    } catch (e) {
      logger.warn(`deleteAccount: audit log write failed for ${hashUid(uid)}`, e);
    }

    logger.info(
      `deleteAccount: completed for ${hashUid(uid)} (sentinel=${sentinelUid})`,
    );

    return { ok: true, sentinel: sentinelUid };
  },
);

// ===========================================================================
// M-2: scheduled cleanup of finished RTDB games
// ===========================================================================
// PRIVACY.md promises live-game state is deleted "within ~24 hours of game
// end". This cron honours that. Runs every 6 hours; scans games/* for
// status='finished' AND finishedAt < (now - 24h); deletes them.
// Removes both the privacy commitment risk and the unbounded RTDB storage
// growth (each game node carries playerUids + state + move history).
const CLEANUP_AGE_MS = 24 * 60 * 60 * 1000;
const CLEANUP_BATCH_CAP = 200;

export const cleanupFinishedGames = onSchedule(
  {
    schedule: 'every 6 hours',
    timeZone: 'UTC',
    region: 'europe-west1',
  },
  async () => {
    const rtdb = getDatabase();
    const cutoff = Date.now() - CLEANUP_AGE_MS;
    const gamesRef = rtdb.ref('games');
    const snap = await gamesRef.get();
    if (!snap.exists()) {
      logger.info('cleanupFinishedGames: no games to consider');
      return;
    }
    const games = snap.val() as Record<string, { status?: string; finishedAt?: number }>;
    const toDelete: string[] = [];
    for (const [gameId, game] of Object.entries(games)) {
      if (!game) continue;
      if (game.status !== 'finished') continue;
      const finishedAt = typeof game.finishedAt === 'number' ? game.finishedAt : 0;
      if (finishedAt > 0 && finishedAt < cutoff) {
        toDelete.push(gameId);
      }
      if (toDelete.length >= CLEANUP_BATCH_CAP) break;
    }
    if (toDelete.length === 0) {
      logger.info('cleanupFinishedGames: no expired games');
      return;
    }
    // Multi-path delete in one update call for atomicity.
    const updates: Record<string, null> = {};
    for (const gameId of toDelete) {
      updates[`games/${gameId}`] = null;
    }
    try {
      await rtdb.ref().update(updates);
      logger.info(
        `cleanupFinishedGames: deleted ${toDelete.length} expired finished games`,
      );
    } catch (e) {
      logger.error('cleanupFinishedGames: bulk delete failed', e);
    }
  },
);

// ===========================================================================
// Admin debug: count accounts stuck mid-signup
// ===========================================================================
//
// One-shot diagnostic to measure the impact of the 0.1.2.3 → 0.1.2.5
// signup permission regression. Counts users/{uid} docs that have NO
// displayName field (these never completed claimUsername). Cross-references
// Firebase Auth metadata to bucket them by hour of account creation so we
// can see when the impact peaked.
//
// Admin-gated by email. Keep it in the codebase — same shape is useful any
// time a future regression looks like it left users in a partial state.
const ADMIN_EMAILS = new Set(['donstn@gmail.com']);

interface StuckReport {
  totalUsers: number;
  stuckCount: number;
  claimedCount: number;
  hourlyBuckets: Record<string, number>; // ISO hour → count
  sampleUids: string[];                  // first 5 for sanity checking
}

export const countStuckSignups = onCall(
  { region: 'europe-west1' },
  async (request): Promise<StuckReport> => {
    const callerEmail = request.auth?.token.email;
    if (!callerEmail || !ADMIN_EMAILS.has(callerEmail)) {
      throw new HttpsError('permission-denied', 'Admin only.');
    }
    const db = getFirestore();
    const auth = getAuth();

    const all = await db.collection('users').get();
    const stuck: string[] = [];
    let claimed = 0;
    for (const doc of all.docs) {
      const data = doc.data();
      if (typeof data.displayName === 'string' && data.displayName.length > 0) {
        claimed++;
      } else {
        stuck.push(doc.id);
      }
    }

    // Bucket stuck accounts by hour of Auth-user creation. getUsers takes
    // up to 100 uids per call.
    const hourlyBuckets: Record<string, number> = {};
    for (let i = 0; i < stuck.length; i += 100) {
      const chunk = stuck.slice(i, i + 100).map((uid) => ({ uid }));
      const { users } = await auth.getUsers(chunk);
      for (const u of users) {
        const createdAt = new Date(u.metadata.creationTime);
        // ISO hour: 'YYYY-MM-DDTHH:00:00Z'
        const iso = createdAt.toISOString();
        const hourKey = iso.slice(0, 13) + ':00:00Z';
        hourlyBuckets[hourKey] = (hourlyBuckets[hourKey] ?? 0) + 1;
      }
    }

    const report: StuckReport = {
      totalUsers: all.size,
      stuckCount: stuck.length,
      claimedCount: claimed,
      hourlyBuckets,
      sampleUids: stuck.slice(0, 5),
    };
    logger.info('countStuckSignups report', report);
    return report;
  },
);

// ===========================================================================
// Bot Army — ranked AI opponents that fill in when the human matchmaker queue
// is empty. See plans/multiplayer_bots.md for the full design.
//
// Bots live as real Firestore users/{botUid} docs (isBot: true, botLevel,
// rating that floats with results). One bot per AI level — Pip (L1), Cricket
// (L2), Ranger (L3), Knight (L4), Voidstar (L5). Private metadata (think
// delay range, active flag) lives in bots/{botUid}.
//
// Three new entry points:
//   - botFallbackSweep: scheduled, picks up queue entries waiting > 30s and
//     spawns a bot match.
//   - botMove: RTDB trigger on games/{id}/state/current; when it's a bot's
//     turn, sleeps briefly then submits a move via pendingMove (same path
//     humans use, so validateMove handles it unchanged).
//   - seedBots: admin-gated one-shot to provision the 5 bot identities.
// ===========================================================================

interface BotMeta {
  level: Difficulty;
  thinkMsMin: number;
  thinkMsMax: number;
  active: boolean;
  displayName: string;
}

// Per-time-control hard caps on bot think delay so Bullet bots don't burn
// their own clock too aggressively. min..max is sampled uniformly per move.
const BOT_THINK_CAP_MS: Record<TimeControl, number> = {
  '1min': 1200,
  '3min': 2200,
  '5min': 3500,
};

const BOT_FALLBACK_THRESHOLD_MS = 15_000;

// Module-scope cache for bot metadata — 5 docs total, change rarely. The
// 5-min TTL is enough for botMove to avoid a Firestore read per move while
// staying responsive to seedBots updates.
const BOT_CACHE_TTL_MS = 5 * 60 * 1000;
let botCache: { byUid: Record<string, BotMeta>; loadedAt: number } | null = null;

async function loadActiveBots(): Promise<Record<string, BotMeta>> {
  if (botCache && Date.now() - botCache.loadedAt < BOT_CACHE_TTL_MS) {
    return botCache.byUid;
  }
  const db = getFirestore();
  const snap = await db.collection('bots').where('active', '==', true).get();
  const byUid: Record<string, BotMeta> = {};
  for (const doc of snap.docs) {
    const d = doc.data();
    byUid[doc.id] = {
      level: d.level as Difficulty,
      thinkMsMin: typeof d.thinkMsMin === 'number' ? d.thinkMsMin : 800,
      thinkMsMax: typeof d.thinkMsMax === 'number' ? d.thinkMsMax : 2500,
      active: d.active === true,
      displayName: (d.displayName as string) ?? doc.id,
    };
  }
  botCache = { byUid, loadedAt: Date.now() };
  return byUid;
}

// Returns null if uid is not a registered bot.
async function getBotMeta(uid: string): Promise<BotMeta | null> {
  const bots = await loadActiveBots();
  return bots[uid] ?? null;
}

// Picks the bot whose CURRENT rating is closest to the user's, with a small
// random shuffle when several are within 100 Elo so the same user doesn't
// always see the same bot.
async function pickBotForRating(
  userRating: number,
): Promise<{ uid: string; meta: BotMeta; rating: number; displayName: string } | null> {
  const db = getFirestore();
  const bots = await loadActiveBots();
  const botUids = Object.keys(bots);
  if (botUids.length === 0) return null;

  // Live-read bot ratings (they float). 5 reads total.
  const userSnaps = await Promise.all(
    botUids.map((uid) => db.doc(`users/${uid}`).get()),
  );
  const candidates = userSnaps.map((snap, i) => {
    const data = snap.data() ?? {};
    return {
      uid: botUids[i],
      meta: bots[botUids[i]],
      rating: typeof data.rating === 'number' ? data.rating : 1000,
      displayName: (data.displayName as string) ?? bots[botUids[i]].displayName,
    };
  });

  candidates.sort(
    (a, b) => Math.abs(a.rating - userRating) - Math.abs(b.rating - userRating),
  );
  // Pick uniformly from those within 100 Elo of the best match.
  const bestDelta = Math.abs(candidates[0].rating - userRating);
  const tiebreak = candidates.filter(
    (c) => Math.abs(Math.abs(c.rating - userRating) - bestDelta) <= 100,
  );
  return tiebreak[Math.floor(Math.random() * tiebreak.length)];
}

// Spawns a bot match for a single human in the matchmaking queue. Mirrors
// the pair-creation block of `matchmake` so downstream code (validateMove,
// finalizeGame, watchGame on the client) treats it identically.
async function spawnBotMatch(args: {
  humanUid: string;
  humanRating: number;
  humanDisplayName: string;
  humanPlacementGames: number;
  timeControl: TimeControl;
}): Promise<void> {
  const db = getFirestore();
  const rtdb = getDatabase();
  const { humanUid, humanRating, humanDisplayName, humanPlacementGames, timeControl } = args;

  const bot = await pickBotForRating(humanRating);
  if (!bot) {
    logger.warn(`spawnBotMatch: no active bots for ${hashUid(humanUid)}`);
    return;
  }

  // Shape selection: intersection of human's unlocked + bot's unlocked.
  // Bots are seeded with placementGamesPlayed >= 100 so they have all
  // shapes unlocked, but we still compute the intersection for symmetry.
  const unlockedShapes = (gamesPlayed: number): ShapeId[] => {
    const out: ShapeId[] = ['triangle'];
    if (gamesPlayed >= 50) out.push('square');
    if (gamesPlayed >= 100) out.push('rectangle');
    return out;
  };
  const allowedShapes = unlockedShapes(humanPlacementGames);
  const shape: ShapeId =
    allowedShapes[Math.floor(Math.random() * allowedShapes.length)];

  const matchId = db.collection('matches').doc().id;
  const queueRef = db.doc(`matchmakingQueue/${humanUid}`);
  const matchRef = db.doc(`matches/${matchId}`);
  const humanPairRef = db.doc(`pairings/${humanUid}`);

  // Human is always P1 (joined the queue first; bot is the responder).
  const p1Uid = humanUid;
  const p2Uid = bot.uid;
  const p1Display = humanDisplayName;
  const p2Display = bot.displayName;

  try {
    await db.runTransaction(async (tx) => {
      const queueSnap = await tx.get(queueRef);
      if (!queueSnap.exists) {
        throw new Error('queue entry already claimed (likely paired with a human)');
      }
      tx.delete(queueRef);
      tx.set(matchRef, {
        status: 'created',
        createdAt: FieldValue.serverTimestamp(),
        timeControl,
        shape,
        p1Uid,
        p2Uid,
        p1Display,
        p2Display,
        playerUids: [p1Uid, p2Uid],
        ranked: true,
      });
      tx.set(humanPairRef, {
        matchId,
        shape,
        opponentUid: bot.uid,
        opponentDisplayName: bot.displayName,
        opponentRating: bot.rating,
        opponentIsBot: true,
        opponentBotLevel: bot.meta.level,
        player: 1,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
  } catch (e) {
    logger.warn(`spawnBotMatch: pairing tx failed for ${hashUid(humanUid)}`, e);
    return;
  }

  // Create the RTDB game node. Bot is pre-readied AND pre-board-loaded so
  // startClockWhenBoardsLoaded fires as soon as the human's client mounts
  // and acks boardLoaded[1] = true.
  try {
    const initialState = createGame(shape, 'multiplayer');
    const totalMs = TIME_CONTROL_MS[timeControl];
    await rtdb.ref(`games/${matchId}`).set({
      state: sanitize(initialState),
      playerUids: { '1': p1Uid, '2': p2Uid },
      status: 'active',
      shape,
      timeControl,
      ready: { '1': false, '2': true },
      boardLoaded: { '1': false, '2': true },
      clock: {
        p1RemainingMs: totalMs,
        p2RemainingMs: totalMs,
        turnStartedAt: 0,
        current: 1,
        totalMs,
      },
      createdAt: Date.now(),
    });
    logger.info(
      `spawnBotMatch: ${hashUid(humanUid)} (${humanRating}) <-> bot ${bot.uid} (${bot.rating}) on ${shape}, match=${matchId}`,
    );
  } catch (e) {
    logger.error(`spawnBotMatch: RTDB game create failed for ${matchId}`, e);
  }
}

// Pair two stale queue entries as a human-vs-human match. Mirrors the
// match-write block of `matchmake` so downstream pipelines (validateMove,
// finalizeGame, watchGame) treat the result identically. Earlier joiner
// becomes P1. Returns true on success, false if either queue entry was
// already claimed mid-transaction.
async function pairTwoHumans(args: {
  a: { uid: string; rating: number; displayName: string; placementGames: number; joinedAtMs: number };
  b: { uid: string; rating: number; displayName: string; placementGames: number; joinedAtMs: number };
  timeControl: TimeControl;
}): Promise<boolean> {
  const db = getFirestore();
  const rtdb = getDatabase();
  const { a, b, timeControl } = args;

  // Earlier-joined player gets slot 1 (chess colour convention; matches
  // matchmake behaviour).
  const aIsFirst = a.joinedAtMs <= b.joinedAtMs;
  const p1 = aIsFirst ? a : b;
  const p2 = aIsFirst ? b : a;

  // Shape: intersection of both players' unlocked sets (same gate matchmake uses).
  const unlockedShapes = (gamesPlayed: number): ShapeId[] => {
    const out: ShapeId[] = ['triangle'];
    if (gamesPlayed >= 50) out.push('square');
    if (gamesPlayed >= 100) out.push('rectangle');
    return out;
  };
  const allowed = unlockedShapes(p1.placementGames).filter((s) =>
    unlockedShapes(p2.placementGames).includes(s),
  );
  const shape: ShapeId = allowed[Math.floor(Math.random() * allowed.length)];

  const matchId = db.collection('matches').doc().id;
  const p1Ref = db.doc(`matchmakingQueue/${p1.uid}`);
  const p2Ref = db.doc(`matchmakingQueue/${p2.uid}`);
  const matchRef = db.doc(`matches/${matchId}`);
  const p1PairRef = db.doc(`pairings/${p1.uid}`);
  const p2PairRef = db.doc(`pairings/${p2.uid}`);

  try {
    await db.runTransaction(async (tx) => {
      const [p1Snap, p2Snap] = await Promise.all([tx.get(p1Ref), tx.get(p2Ref)]);
      if (!p1Snap.exists || !p2Snap.exists) {
        throw new Error('queue entry already claimed by another pairing');
      }
      tx.delete(p1Ref);
      tx.delete(p2Ref);
      tx.set(matchRef, {
        status: 'created',
        createdAt: FieldValue.serverTimestamp(),
        timeControl,
        shape,
        p1Uid: p1.uid,
        p2Uid: p2.uid,
        p1Display: p1.displayName,
        p2Display: p2.displayName,
        playerUids: [p1.uid, p2.uid],
        ranked: true,
      });
      tx.set(p1PairRef, {
        matchId,
        shape,
        opponentUid: p2.uid,
        opponentDisplayName: p2.displayName,
        opponentRating: p2.rating,
        player: 1,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.set(p2PairRef, {
        matchId,
        shape,
        opponentUid: p1.uid,
        opponentDisplayName: p1.displayName,
        opponentRating: p1.rating,
        player: 2,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
  } catch (e) {
    logger.warn(`pairTwoHumans: tx failed (${hashUid(p1.uid)} <-> ${hashUid(p2.uid)})`, e);
    return false;
  }

  try {
    const initialState = createGame(shape, 'multiplayer');
    const totalMs = TIME_CONTROL_MS[timeControl];
    await rtdb.ref(`games/${matchId}`).set({
      state: sanitize(initialState),
      playerUids: { '1': p1.uid, '2': p2.uid },
      status: 'active',
      shape,
      timeControl,
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
    logger.info(
      `pairTwoHumans: ${hashUid(p1.uid)} <-> ${hashUid(p2.uid)} match ${matchId} on ${shape}`,
    );
  } catch (e) {
    logger.error(`pairTwoHumans: RTDB game create failed for ${matchId}`, e);
  }
  return true;
}

export const botFallbackSweep = onSchedule(
  {
    schedule: 'every 1 minutes',
    timeZone: 'UTC',
    region: 'europe-west1',
  },
  async () => {
    const db = getFirestore();
    const cutoff = Date.now() - BOT_FALLBACK_THRESHOLD_MS;
    const staleSnap = await db
      .collection('matchmakingQueue')
      .where('joinedAt', '<', Timestamp.fromMillis(cutoff))
      .get();
    if (staleSnap.empty) {
      return;
    }
    logger.info(`botFallbackSweep: ${staleSnap.size} stale queue entries`);

    // Pull the entire queue once; we need full visibility to do human-first
    // matching (a "fresh" entry may also be compatible with a stale one and
    // wins priority over bots).
    const allSnap = await db.collection('matchmakingQueue').get();
    type QE = QueueEntry & { uid: string };
    const allEntries: QE[] = allSnap.docs.map((d) => ({
      ...(d.data() as QueueEntry),
      uid: d.id,
    }));
    const processed = new Set<string>();
    const now = Date.now();

    for (const staleDoc of staleSnap.docs) {
      if (processed.has(staleDoc.id)) continue;
      const target = allEntries.find((e) => e.uid === staleDoc.id);
      if (!target) continue;
      const targetJoinedMs = target.joinedAt?.toMillis?.() ?? now;
      const targetWaitedSec = Math.max(0, (now - targetJoinedMs) / 1000);
      const targetRange = Math.min(
        MAX_RANGE,
        target.initialRange + RANGE_PER_SECOND * targetWaitedSec,
      );

      // HUMAN PRIORITY: scan the rest of the queue for a compatible
      // partner. Match if delta is within EITHER side's grown range — the
      // wait-time tolerance is supposed to be symmetric, so being within
      // the more patient side's range is enough.
      let bestPartner: QE | null = null;
      let bestPartnerDelta = Infinity;
      for (const cand of allEntries) {
        if (cand.uid === target.uid) continue;
        if (cand.timeControl !== target.timeControl) continue;
        if (processed.has(cand.uid)) continue;
        const candJoinedMs = cand.joinedAt?.toMillis?.() ?? now;
        const candWaitedSec = Math.max(0, (now - candJoinedMs) / 1000);
        const candRange = Math.min(
          MAX_RANGE,
          cand.initialRange + RANGE_PER_SECOND * candWaitedSec,
        );
        const delta = Math.abs(cand.rating - target.rating);
        if (delta > Math.max(targetRange, candRange)) continue;
        if (delta < bestPartnerDelta) {
          bestPartnerDelta = delta;
          bestPartner = cand;
        }
      }

      if (bestPartner) {
        const [aUserSnap, bUserSnap] = await Promise.all([
          db.doc(`users/${target.uid}`).get(),
          db.doc(`users/${bestPartner.uid}`).get(),
        ]);
        const aData = aUserSnap.data() ?? {};
        const bData = bUserSnap.data() ?? {};
        const partner: QE = bestPartner;
        const paired = await pairTwoHumans({
          a: {
            uid: target.uid,
            rating: target.rating,
            displayName: (aData.displayName as string) ?? 'Player',
            placementGames:
              typeof aData.placementGamesPlayed === 'number'
                ? aData.placementGamesPlayed
                : 0,
            joinedAtMs: targetJoinedMs,
          },
          b: {
            uid: partner.uid,
            rating: partner.rating,
            displayName: (bData.displayName as string) ?? 'Player',
            placementGames:
              typeof bData.placementGamesPlayed === 'number'
                ? bData.placementGamesPlayed
                : 0,
            joinedAtMs: partner.joinedAt?.toMillis?.() ?? now,
          },
          timeControl: target.timeControl,
        });
        if (paired) {
          processed.add(target.uid);
          processed.add(partner.uid);
          continue;
        }
        // Fall through to bot fallback if human pairing failed.
      }

      // No compatible human → spawn bot match.
      const userSnap = await db.doc(`users/${target.uid}`).get();
      const userData = userSnap.data() ?? {};
      await spawnBotMatch({
        humanUid: target.uid,
        humanRating: target.rating,
        humanDisplayName: (userData.displayName as string) ?? 'Player',
        humanPlacementGames:
          typeof userData.placementGamesPlayed === 'number'
            ? userData.placementGamesPlayed
            : 0,
        timeControl: target.timeControl,
      });
      processed.add(target.uid);
    }
  },
);

// Trigger on state.current changing — i.e., a turn handoff. If the new
// active player is a bot, sleep a "thinking" delay then submit a move via
// pendingMove. validateMove handles it from there (same path as a human).
export const botMove = onValueWritten(
  'games/{gameId}/state/current',
  async (event) => {
    const after = event.data.after.val();
    if (after !== 1 && after !== 2) return;
    const gameId = event.params.gameId;
    const rtdb = getDatabase();
    const gameRef = rtdb.ref(`games/${gameId}`);

    const initialSnap = await gameRef.get();
    const initial = initialSnap.val();
    if (!initial || initial.status !== 'active') return;
    const currentSlot = String(after);
    const currentUid = initial.playerUids?.[currentSlot];
    if (typeof currentUid !== 'string') return;

    const botMeta = await getBotMeta(currentUid);
    if (!botMeta) return; // human turn — nothing to do

    // Clock-aware think delay: never spend more than the time-control cap,
    // and never spend more than 25% of the bot's remaining clock.
    const tc = initial.timeControl as TimeControl;
    const cap = BOT_THINK_CAP_MS[tc] ?? botMeta.thinkMsMax;
    const remaining =
      currentSlot === '1'
        ? Number(initial.clock?.p1RemainingMs ?? cap)
        : Number(initial.clock?.p2RemainingMs ?? cap);
    const safeCap = Math.min(cap, botMeta.thinkMsMax, Math.floor(remaining * 0.25));
    const safeMin = Math.min(botMeta.thinkMsMin, safeCap);
    const delay = safeMin + Math.random() * Math.max(0, safeCap - safeMin);
    await new Promise((r) => setTimeout(r, delay));

    // Re-read after the sleep: game may have ended, opponent may have
    // resigned, turn may have changed (shouldn't, but be defensive).
    const freshSnap = await gameRef.get();
    const fresh = freshSnap.val();
    if (!fresh || fresh.status !== 'active') return;
    if (String(fresh.state?.current) !== currentSlot) return;
    if (fresh.pendingMove) return; // a move is already being processed

    const state = normalizeState(fresh.state ?? {});
    let action: GameAction;
    try {
      action = pickAIAction(state, botMeta.level, state.current as Player);
    } catch (e) {
      logger.error(`botMove: pickAIAction failed for game ${gameId}`, e);
      return;
    }

    try {
      await rtdb.ref(`games/${gameId}/pendingMove`).set({
        from: currentUid,
        action,
        clientTime: Date.now(),
      });
    } catch (e) {
      logger.error(`botMove: pendingMove write failed for game ${gameId}`, e);
    }
  },
);

// One-shot seeding callable — admin-gated. Creates the 5 bot identities
// (users/, usernames/, bots/, leaderboard/) idempotently. Re-running it is
// safe: existing docs are merged, never overwritten with default fields.
interface BotSeed {
  uid: string;
  displayName: string;
  level: Difficulty;
  rating: number;
  thinkMsMin: number;
  thinkMsMax: number;
}

const BOT_SEEDS: BotSeed[] = [
  { uid: 'bot_pip',       displayName: 'Pip',       level: 1, rating: 500,  thinkMsMin: 500,  thinkMsMax: 1500 },
  { uid: 'bot_cricket',   displayName: 'Cricket',   level: 2, rating: 850,  thinkMsMin: 700,  thinkMsMax: 1800 },
  { uid: 'bot_ranger',    displayName: 'Ranger',    level: 3, rating: 1150, thinkMsMin: 800,  thinkMsMax: 2200 },
  { uid: 'bot_knight',    displayName: 'Knight',    level: 4, rating: 1450, thinkMsMin: 1000, thinkMsMax: 2800 },
  { uid: 'bot_voidstar',  displayName: 'Voidstar',  level: 5, rating: 1750, thinkMsMin: 1200, thinkMsMax: 3500 },
];

export const seedBots = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const callerEmail = request.auth?.token.email;
    if (!callerEmail || !ADMIN_EMAILS.has(callerEmail)) {
      throw new HttpsError('permission-denied', 'Admin only.');
    }
    const db = getFirestore();
    const results: { uid: string; created: boolean }[] = [];
    for (const seed of BOT_SEEDS) {
      const userRef = db.doc(`users/${seed.uid}`);
      const usernameRef = db.doc(`usernames/${seed.displayName.toLowerCase()}`);
      const botRef = db.doc(`bots/${seed.uid}`);
      const leaderRef = db.doc(`leaderboard/${seed.uid}`);

      const existing = await userRef.get();
      const isNew = !existing.exists;

      // users/{botUid}: same shape as humans + isBot/botLevel. Seeded
      // placementGamesPlayed = 100 so K-factor uses STEADY_K (32) AND all
      // multiplayer shapes are unlocked. rating only set if absent so a
      // re-run doesn't undo Elo drift.
      await userRef.set(
        {
          displayName: seed.displayName,
          isBot: true,
          botLevel: seed.level,
          placementGamesPlayed: 100,
          ...(isNew ? { rating: seed.rating, createdAt: FieldValue.serverTimestamp() } : {}),
        },
        { merge: true },
      );
      await usernameRef.set(
        {
          uid: seed.uid,
          displayName: seed.displayName,
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      await botRef.set(
        {
          level: seed.level,
          thinkMsMin: seed.thinkMsMin,
          thinkMsMax: seed.thinkMsMax,
          active: true,
          displayName: seed.displayName,
        },
        { merge: true },
      );
      // Leaderboard denorm so bots appear immediately even before their
      // first ranked game.
      await leaderRef.set(
        {
          uid: seed.uid,
          displayName: seed.displayName,
          rating: isNew ? seed.rating : ((existing.data()?.rating as number | undefined) ?? seed.rating),
          placementGamesPlayed: 100,
          lastPlayedAt: Date.now(),
          isBot: true,
          botLevel: seed.level,
        },
        { merge: true },
      );

      results.push({ uid: seed.uid, created: isNew });
    }
    // Invalidate cache so the next botMove / pickBotForRating sees the
    // freshly-seeded set.
    botCache = null;
    logger.info('seedBots completed', results);
    return { results };
  },
);

