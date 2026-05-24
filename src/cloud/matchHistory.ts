import {
  collection,
  doc,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { ShapeId } from '../types';
import type { TimeControl } from './matchmaking';

export type MatchFinishedReason =
  | 'normal'
  | 'timeout'
  | 'resign'
  | 'disconnect';

export interface MatchRecord {
  matchId: string;
  shape: ShapeId;
  timeControl: TimeControl;
  status: 'created' | 'finished';
  winner: 1 | 2 | 'draw' | null;
  finishedReason: MatchFinishedReason | null;
  finishedAt: number;
  gameStartedAt: number;
  durationMs: number;
  ranked: boolean;
  p1Uid: string;
  p2Uid: string;
  p1Display: string;
  p2Display: string;
  p1ScoreFinal: number;
  p2ScoreFinal: number;
  p1RatingBefore: number;
  p2RatingBefore: number;
  p1RatingAfter: number;
  p2RatingAfter: number;
  p1RatingDelta: number;
  p2RatingDelta: number;
  eloFinalized: boolean;
}

function shape(matchId: string, d: DocumentData): MatchRecord {
  return {
    matchId,
    shape: (d.shape ?? 'square') as ShapeId,
    timeControl: (d.timeControl ?? '3min') as TimeControl,
    status: (d.status ?? 'finished') as 'created' | 'finished',
    winner: (d.winner ?? null) as MatchRecord['winner'],
    finishedReason: (d.finishedReason ?? null) as MatchRecord['finishedReason'],
    finishedAt: typeof d.finishedAt === 'number' ? d.finishedAt : 0,
    gameStartedAt: typeof d.gameStartedAt === 'number' ? d.gameStartedAt : 0,
    durationMs: typeof d.durationMs === 'number' ? d.durationMs : 0,
    ranked: d.ranked !== false,
    p1Uid: d.p1Uid ?? '',
    p2Uid: d.p2Uid ?? '',
    p1Display: d.p1Display ?? 'Player 1',
    p2Display: d.p2Display ?? 'Player 2',
    p1ScoreFinal: typeof d.p1ScoreFinal === 'number' ? d.p1ScoreFinal : 0,
    p2ScoreFinal: typeof d.p2ScoreFinal === 'number' ? d.p2ScoreFinal : 0,
    p1RatingBefore:
      typeof d.p1RatingBefore === 'number' ? d.p1RatingBefore : 1000,
    p2RatingBefore:
      typeof d.p2RatingBefore === 'number' ? d.p2RatingBefore : 1000,
    p1RatingAfter:
      typeof d.p1RatingAfter === 'number' ? d.p1RatingAfter : 1000,
    p2RatingAfter:
      typeof d.p2RatingAfter === 'number' ? d.p2RatingAfter : 1000,
    p1RatingDelta:
      typeof d.p1RatingDelta === 'number' ? d.p1RatingDelta : 0,
    p2RatingDelta:
      typeof d.p2RatingDelta === 'number' ? d.p2RatingDelta : 0,
    eloFinalized: d.eloFinalized === true,
  };
}

export function watchMatch(
  matchId: string,
  onChange: (m: MatchRecord | null) => void,
): () => void {
  return onSnapshot(
    doc(db, 'matches', matchId),
    (snap) => {
      if (!snap.exists()) {
        onChange(null);
        return;
      }
      onChange(shape(snap.id, snap.data()));
    },
    (err) => {
      console.warn('watchMatch error:', err);
      onChange(null);
    },
  );
}

export function watchRecentMatches(
  uid: string,
  onChange: (matches: MatchRecord[]) => void,
  max: number = 5,
): () => void {
  const q = query(
    collection(db, 'matches'),
    where('playerUids', 'array-contains', uid),
    orderBy('finishedAt', 'desc'),
    fsLimit(max),
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows: MatchRecord[] = [];
      snap.forEach((doc) => rows.push(shape(doc.id, doc.data())));
      onChange(rows);
    },
    (err) => {
      console.warn('watchRecentMatches error:', err);
      onChange([]);
    },
  );
}

// Derived view from the perspective of `me`. Useful for rendering rows.
export interface MatchPerspective {
  opponentUid: string;
  opponentDisplay: string;
  myScore: number;
  opponentScore: number;
  myRatingBefore: number;
  myRatingAfter: number;
  myRatingDelta: number;
  result: 'win' | 'loss' | 'draw';
}

export function fromMyPerspective(
  m: MatchRecord,
  me: string,
): MatchPerspective {
  const iAmP1 = m.p1Uid === me;
  const opponentUid = iAmP1 ? m.p2Uid : m.p1Uid;
  const opponentDisplay = iAmP1 ? m.p2Display : m.p1Display;
  const myScore = iAmP1 ? m.p1ScoreFinal : m.p2ScoreFinal;
  const opponentScore = iAmP1 ? m.p2ScoreFinal : m.p1ScoreFinal;
  const myRatingBefore = iAmP1 ? m.p1RatingBefore : m.p2RatingBefore;
  const myRatingAfter = iAmP1 ? m.p1RatingAfter : m.p2RatingAfter;
  const myRatingDelta = iAmP1 ? m.p1RatingDelta : m.p2RatingDelta;
  let result: 'win' | 'loss' | 'draw' = 'draw';
  if (m.winner === 'draw' || m.winner == null) result = 'draw';
  else if ((iAmP1 && m.winner === 1) || (!iAmP1 && m.winner === 2)) {
    result = 'win';
  } else {
    result = 'loss';
  }
  return {
    opponentUid,
    opponentDisplay,
    myScore,
    opponentScore,
    myRatingBefore,
    myRatingAfter,
    myRatingDelta,
    result,
  };
}
