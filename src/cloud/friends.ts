import {
  collection,
  onSnapshot,
  query,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db } from '../firebase';

const functionsEW1 = getFunctions(app, 'europe-west1');

export interface Friend {
  friendshipId: string;
  uid: string;            // the OTHER user's uid
  displayName: string;
}

export interface PendingRequest {
  friendshipId: string;
  otherUid: string;       // the other party (requester for incoming, target for outgoing)
  otherDisplayName: string;
  requestedAt: Date | null;
}

interface FriendshipDoc {
  uids: string[];
  status: 'pending' | 'accepted';
  requestedBy: string;
  requestedAt: Timestamp | null;
  acceptedAt: Timestamp | null;
  displayNames?: Record<string, string>;
}

function rowToFriend(id: string, data: FriendshipDoc, myUid: string): Friend {
  const otherUid = data.uids.find((u) => u !== myUid) ?? '';
  return {
    friendshipId: id,
    uid: otherUid,
    displayName: data.displayNames?.[otherUid] ?? 'Player',
  };
}

function rowToPending(
  id: string,
  data: FriendshipDoc,
  myUid: string,
): PendingRequest {
  const otherUid = data.uids.find((u) => u !== myUid) ?? '';
  return {
    friendshipId: id,
    otherUid,
    otherDisplayName: data.displayNames?.[otherUid] ?? 'Player',
    requestedAt: data.requestedAt?.toDate?.() ?? null,
  };
}

export function subscribeFriends(
  myUid: string,
  cb: (friends: Friend[]) => void,
): () => void {
  const q = query(
    collection(db, 'friendships'),
    where('uids', 'array-contains', myUid),
    where('status', '==', 'accepted'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const arr = snap.docs.map((d) =>
        rowToFriend(d.id, d.data() as FriendshipDoc, myUid),
      );
      arr.sort((a, b) => a.displayName.localeCompare(b.displayName));
      cb(arr);
    },
    (err) => {
      console.warn('subscribeFriends error:', err);
      cb([]);
    },
  );
}

export function subscribeIncomingRequests(
  myUid: string,
  cb: (rows: PendingRequest[]) => void,
): () => void {
  const q = query(
    collection(db, 'friendships'),
    where('uids', 'array-contains', myUid),
    where('status', '==', 'pending'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows: PendingRequest[] = [];
      for (const d of snap.docs) {
        const data = d.data() as FriendshipDoc;
        if (data.requestedBy === myUid) continue; // outgoing — filtered out
        rows.push(rowToPending(d.id, data, myUid));
      }
      cb(rows);
    },
    (err) => {
      console.warn('subscribeIncomingRequests error:', err);
      cb([]);
    },
  );
}

export function subscribeOutgoingRequests(
  myUid: string,
  cb: (rows: PendingRequest[]) => void,
): () => void {
  const q = query(
    collection(db, 'friendships'),
    where('uids', 'array-contains', myUid),
    where('status', '==', 'pending'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows: PendingRequest[] = [];
      for (const d of snap.docs) {
        const data = d.data() as FriendshipDoc;
        if (data.requestedBy !== myUid) continue;
        rows.push(rowToPending(d.id, data, myUid));
      }
      cb(rows);
    },
    (err) => {
      console.warn('subscribeOutgoingRequests error:', err);
      cb([]);
    },
  );
}

// Callable wrappers
const callSendFriendRequest = httpsCallable<
  { targetUsername?: string; targetUid?: string },
  { ok: boolean }
>(functionsEW1, 'sendFriendRequest');
const callAcceptFriendRequest = httpsCallable<
  { friendshipId: string },
  { ok: boolean }
>(functionsEW1, 'acceptFriendRequest');
const callDeclineFriendRequest = httpsCallable<
  { friendshipId: string },
  { ok: boolean }
>(functionsEW1, 'declineFriendRequest');
const callRemoveFriend = httpsCallable<
  { friendshipId: string },
  { ok: boolean }
>(functionsEW1, 'removeFriend');
const callBlockUser = httpsCallable<
  { blockedUid: string },
  { ok: boolean }
>(functionsEW1, 'blockUser');
const callUnblockUser = httpsCallable<
  { blockedUid: string },
  { ok: boolean }
>(functionsEW1, 'unblockUser');

export async function sendFriendRequestByUsername(
  username: string,
): Promise<void> {
  await callSendFriendRequest({ targetUsername: username });
}

export async function sendFriendRequestByUid(uid: string): Promise<void> {
  await callSendFriendRequest({ targetUid: uid });
}

export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  await callAcceptFriendRequest({ friendshipId });
}

export async function declineFriendRequest(friendshipId: string): Promise<void> {
  await callDeclineFriendRequest({ friendshipId });
}

export async function removeFriend(friendshipId: string): Promise<void> {
  await callRemoveFriend({ friendshipId });
}

export async function blockUser(blockedUid: string): Promise<void> {
  await callBlockUser({ blockedUid });
}

export async function unblockUser(blockedUid: string): Promise<void> {
  await callUnblockUser({ blockedUid });
}
