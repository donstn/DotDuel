import {
  collection,
  onSnapshot,
  query,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db } from '../firebase';
import type { ShapeId } from '../types';
import type { TimeControl } from './matchmaking';

const functionsEW1 = getFunctions(app, 'europe-west1');

export interface Invite {
  inviteId: string;
  from: string;
  to: string;
  groupId: string;
  shape: ShapeId;
  timeControl: TimeControl;
  fromRanked: boolean;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
  createdAt: Date | null;
  expiresAt: number;
  matchId?: string;
}

interface InviteDoc {
  from: string;
  to: string;
  groupId: string;
  shape: ShapeId;
  timeControl: TimeControl;
  fromRanked: boolean;
  status: Invite['status'];
  createdAt: Timestamp | null;
  expiresAt: number;
  matchId?: string;
}

function rowToInvite(id: string, data: InviteDoc): Invite {
  return {
    inviteId: id,
    from: data.from,
    to: data.to,
    groupId: data.groupId,
    shape: data.shape,
    timeControl: data.timeControl,
    fromRanked: data.fromRanked,
    status: data.status,
    createdAt: data.createdAt?.toDate?.() ?? null,
    expiresAt: data.expiresAt,
    matchId: data.matchId,
  };
}

// Live subscription to invites where `to == myUid` and the invite is still
// actionable (`pending` + not past expiresAt). The expiresAt filter is
// client-side because Firestore can't combine `to == X` AND `status == pending`
// AND `expiresAt > now` without a composite index AND the now value changes
// every render. Filtering in the snapshot handler is fine — small N.
export function subscribeIncomingInvites(
  myUid: string,
  cb: (invites: Invite[]) => void,
): () => void {
  const q = query(
    collection(db, 'invites'),
    where('to', '==', myUid),
    where('status', '==', 'pending'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const now = Date.now();
      const rows: Invite[] = [];
      for (const d of snap.docs) {
        const data = d.data() as InviteDoc;
        if (typeof data.expiresAt === 'number' && data.expiresAt < now) continue;
        rows.push(rowToInvite(d.id, data));
      }
      rows.sort((a, b) => {
        const at = a.createdAt?.getTime() ?? 0;
        const bt = b.createdAt?.getTime() ?? 0;
        return bt - at; // newest first
      });
      cb(rows);
    },
    (err) => {
      console.warn('subscribeIncomingInvites error:', err);
      cb([]);
    },
  );
}

export function subscribeOutgoingInvites(
  myUid: string,
  cb: (invites: Invite[]) => void,
): () => void {
  const q = query(
    collection(db, 'invites'),
    where('from', '==', myUid),
    where('status', '==', 'pending'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const now = Date.now();
      const rows: Invite[] = [];
      for (const d of snap.docs) {
        const data = d.data() as InviteDoc;
        if (typeof data.expiresAt === 'number' && data.expiresAt < now) continue;
        rows.push(rowToInvite(d.id, data));
      }
      rows.sort((a, b) => {
        const at = a.createdAt?.getTime() ?? 0;
        const bt = b.createdAt?.getTime() ?? 0;
        return bt - at;
      });
      cb(rows);
    },
    (err) => {
      console.warn('subscribeOutgoingInvites error:', err);
      cb([]);
    },
  );
}

// Callable wrappers
const callSendInvite = httpsCallable<
  {
    toUids: string[];
    shape: ShapeId;
    timeControl: TimeControl;
    fromRanked: boolean;
  },
  { ok: boolean; groupId: string; sent: number }
>(functionsEW1, 'sendInvite');

const callAcceptInvite = httpsCallable<
  { inviteId: string; ranked: boolean },
  { ok: boolean; matchId: string }
>(functionsEW1, 'acceptInvite');

const callDeclineInvite = httpsCallable<
  { inviteId: string },
  { ok: boolean }
>(functionsEW1, 'declineInvite');

const callCancelInvite = httpsCallable<
  { inviteId: string },
  { ok: boolean }
>(functionsEW1, 'cancelInvite');

export async function sendInvite(args: {
  toUids: string[];
  shape: ShapeId;
  timeControl: TimeControl;
  fromRanked: boolean;
}): Promise<{ groupId: string; sent: number }> {
  const res = await callSendInvite(args);
  return { groupId: res.data.groupId, sent: res.data.sent };
}

export async function acceptInvite(
  inviteId: string,
  ranked: boolean,
): Promise<string> {
  const res = await callAcceptInvite({ inviteId, ranked });
  return res.data.matchId;
}

export async function declineInvite(inviteId: string): Promise<void> {
  await callDeclineInvite({ inviteId });
}

export async function cancelInvite(inviteId: string): Promise<void> {
  await callCancelInvite({ inviteId });
}
