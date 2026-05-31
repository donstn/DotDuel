import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

// Phase 2b-v2 — daily-puzzle finalization (best-of-3 attempts + public
// leaderboard mirror).
//
// Per-user record at users/{uid}/dailyPuzzles/{utcDate}:
//   { puzzleId, attempts, best, firstCompletedAt, lastCompletedAt }
//
// Public leaderboard at dailyLeaderboard/{utcDate}/entries/{uid}:
//   { uid, displayName, best, firstCompletedAt, attempts, puzzleId }
// Denormalized displayName lets the leaderboard popover render without
// joining N user docs; renames don't backfill old entries (acceptable).
//
// v2 is still client-authoritative: clients write margin directly. Once a
// public leaderboard exists, a server-side validator (re-simulate the AI
// to confirm the margin) is the obvious follow-up if cheating shows up.

export const MAX_ATTEMPTS_PER_DAY = 3;

export interface FinalizeArgs {
  uid: string;
  displayName: string;
  utcDate: string; // 'YYYY-MM-DD'
  puzzleId: number;
  margin: number; // human score - AI score
}

export interface FinalizeResult {
  attempts: number; // 1..3 after this finalize
  best: number;
  improved: boolean; // true if this attempt beat the previous best
  streak: { current: number; longest: number };
  attemptsRemaining: number; // 3 - attempts (clamped to 0)
}

function nextStreak(
  prevCurrent: number,
  lastPlayedUTC: string | undefined,
  todayUTC: string,
): { current: number; alreadyCountedToday: boolean } {
  if (!lastPlayedUTC) return { current: 1, alreadyCountedToday: false };
  if (lastPlayedUTC === todayUTC) {
    return { current: prevCurrent, alreadyCountedToday: true };
  }
  const today = new Date(todayUTC + 'T00:00:00Z');
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  if (lastPlayedUTC === yesterdayKey) {
    return { current: prevCurrent + 1, alreadyCountedToday: false };
  }
  return { current: 1, alreadyCountedToday: false };
}

export async function finalizeDailyPuzzle(args: FinalizeArgs): Promise<FinalizeResult> {
  // 1. Load the existing per-user attempt doc (if any) to enforce the
  //    3-attempt cap and compute the new best.
  const attemptRef = doc(db, 'users', args.uid, 'dailyPuzzles', args.utcDate);
  const attemptSnap = await getDoc(attemptRef);
  const prevAttempt = attemptSnap.exists() ? attemptSnap.data() : undefined;
  const prevAttempts = (prevAttempt?.attempts as number | undefined) ?? 0;
  if (prevAttempts >= MAX_ATTEMPTS_PER_DAY) {
    throw new Error('DAILY_ATTEMPTS_EXHAUSTED');
  }
  const prevBest = (prevAttempt?.best as number | undefined) ?? -Infinity;
  const prevFirstCompletedAt =
    prevAttempt?.firstCompletedAt ?? serverTimestamp();
  const nextAttempts = prevAttempts + 1;
  const best = Math.max(prevBest, args.margin);
  const improved = args.margin > prevBest;

  // 2. Load profile to update streak (only on the FIRST attempt of the day).
  const profRef = doc(db, 'users', args.uid);
  const profSnap = await getDoc(profRef);
  const prevStreak = profSnap.exists()
    ? (profSnap.data().streak as
        | { current?: number; longest?: number; lastPlayedUTC?: string }
        | undefined)
    : undefined;
  const prevCurrent = prevStreak?.current ?? 0;
  const prevLongest = prevStreak?.longest ?? 0;
  const { current, alreadyCountedToday } = nextStreak(
    prevCurrent,
    prevStreak?.lastPlayedUTC,
    args.utcDate,
  );
  const longest = Math.max(prevLongest, current);

  // 3. Write the per-user attempt doc.
  await setDoc(
    attemptRef,
    {
      puzzleId: args.puzzleId,
      attempts: nextAttempts,
      best,
      firstCompletedAt: prevFirstCompletedAt,
      lastCompletedAt: serverTimestamp(),
    },
    { merge: true },
  );

  // 4. Mirror to the public leaderboard if this attempt improved the
  //    user's best for today (no need to write equivalent or worse runs).
  if (improved || nextAttempts === 1) {
    const lbRef = doc(db, 'dailyLeaderboard', args.utcDate, 'entries', args.uid);
    await setDoc(
      lbRef,
      {
        uid: args.uid,
        displayName: args.displayName,
        best,
        firstCompletedAt: prevFirstCompletedAt,
        attempts: nextAttempts,
        puzzleId: args.puzzleId,
      },
      { merge: true },
    );
  }

  // 5. Update streak only when this is the first counted attempt of the
  //    day (don't bump on 2nd or 3rd attempts).
  if (!alreadyCountedToday) {
    await setDoc(
      profRef,
      {
        streak: {
          current,
          longest,
          lastPlayedUTC: args.utcDate,
        },
      },
      { merge: true },
    );
  }

  return {
    attempts: nextAttempts,
    best,
    improved,
    streak: { current, longest },
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS_PER_DAY - nextAttempts),
  };
}
