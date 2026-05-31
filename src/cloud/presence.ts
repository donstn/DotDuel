import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
  documentId,
} from 'firebase/firestore';
import { db } from '../firebase';

export type PresenceStatus =
  | 'menu'
  | 'in-ai'
  | 'in-hotseat'
  | 'in-ranked'
  | 'searching-ranked'
  | 'in-daily';

export type FriendStatus = PresenceStatus | 'offline';

interface PresenceDoc {
  status?: PresenceStatus;
  statusUpdatedAt?: number;
  lastSeen?: number;
}

// How long a presence record stays "fresh" before friends should treat it
// as offline. Slightly above the heartbeat interval (60s) so a brief network
// blip doesn't flash users into offline state.
const STALE_MS = 90_000;

// How often the active client refreshes lastSeen on its own presence doc.
// Status itself is only written on screen transitions; this keeps "online"
// alive between transitions so a friend who's sat on the menu for 5 minutes
// is still shown as online.
const HEARTBEAT_MS = 60_000;

let lastWrittenStatus: PresenceStatus | null = null;
let heartbeatTimer: number | null = null;
let heartbeatUid: string | null = null;
let presenceEnabled = true;

function stopHeartbeat() {
  if (heartbeatTimer !== null) {
    window.clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  heartbeatUid = null;
}

// Settings → Privacy → "Show my status to friends". When OFF, no presence
// writes happen and friends see this user as offline. App.tsx calls this
// from the consent / settings load path.
export function setPresenceEnabled(enabled: boolean): void {
  presenceEnabled = enabled;
  if (!enabled) {
    stopHeartbeat();
    lastWrittenStatus = null;
  }
}

export async function setPresenceStatus(
  uid: string,
  status: PresenceStatus,
): Promise<void> {
  if (!presenceEnabled) return;
  if (lastWrittenStatus === status) {
    // Status hasn't changed; lastSeen heartbeat is enough.
    return;
  }
  lastWrittenStatus = status;
  try {
    await setDoc(
      doc(db, 'presence', uid),
      {
        status,
        statusUpdatedAt: Date.now(),
        lastSeen: Date.now(),
      },
      { merge: true },
    );
  } catch (e) {
    console.warn('setPresenceStatus failed:', e);
  }
  // Restart heartbeat tied to this uid so lastSeen keeps the status alive.
  if (heartbeatUid !== uid) {
    stopHeartbeat();
    heartbeatUid = uid;
    heartbeatTimer = window.setInterval(() => {
      if (heartbeatUid !== uid || !presenceEnabled) return;
      setDoc(
        doc(db, 'presence', uid),
        { lastSeen: Date.now() },
        { merge: true },
      ).catch((e) => console.warn('presence heartbeat failed:', e));
    }, HEARTBEAT_MS);
  }
}

export function stopPresence(): void {
  stopHeartbeat();
  lastWrittenStatus = null;
}

// Explicitly mark this user offline NOW (before sign-out) so friends see
// the change instantly instead of waiting up to STALE_MS for the heartbeat
// to time out. Writes `lastSeen: 0` which immediately fails the staleness
// check on friends' reads. Must be called BEFORE Firebase auth signs out —
// after sign-out the rule "owner write" no longer applies.
export async function markPresenceOffline(uid: string): Promise<void> {
  stopHeartbeat();
  lastWrittenStatus = null;
  try {
    await setDoc(
      doc(db, 'presence', uid),
      { lastSeen: 0 },
      { merge: true },
    );
  } catch (e) {
    console.warn('markPresenceOffline failed:', e);
  }
}

// Resolve a friend's presence doc to a status. Returns 'offline' when the
// doc is stale or missing.
function effectiveStatus(data: PresenceDoc | undefined): FriendStatus {
  if (!data?.status) return 'offline';
  const ts = data.lastSeen ?? data.statusUpdatedAt ?? 0;
  if (Date.now() - ts > STALE_MS) return 'offline';
  return data.status;
}

// Live subscription to the presence/{uid} docs of a friend list. Returns a
// map { uid → status } that updates whenever any friend's status changes
// or the list itself changes. Firestore's `where in` is limited to 30
// values per query so we chunk if necessary.
export function subscribePresence(
  uidList: string[],
  cb: (map: Record<string, FriendStatus>) => void,
): () => void {
  if (uidList.length === 0) {
    cb({});
    return () => {};
  }
  const chunks: string[][] = [];
  for (let i = 0; i < uidList.length; i += 30) {
    chunks.push(uidList.slice(i, i + 30));
  }
  const partials = chunks.map(() => ({}) as Record<string, FriendStatus>);
  const emit = () => {
    const merged: Record<string, FriendStatus> = {};
    for (const p of partials) Object.assign(merged, p);
    cb(merged);
  };
  const unsubs = chunks.map((chunk, idx) =>
    onSnapshot(
      query(collection(db, 'presence'), where(documentId(), 'in', chunk)),
      (snap) => {
        const next: Record<string, FriendStatus> = {};
        // Default all chunk uids to offline so absent docs surface correctly.
        for (const u of chunk) next[u] = 'offline';
        for (const d of snap.docs) {
          next[d.id] = effectiveStatus(d.data() as PresenceDoc);
        }
        partials[idx] = next;
        emit();
      },
      (err) => {
        console.warn('subscribePresence chunk error:', err);
        const next: Record<string, FriendStatus> = {};
        for (const u of chunk) next[u] = 'offline';
        partials[idx] = next;
        emit();
      },
    ),
  );
  return () => {
    for (const u of unsubs) u();
  };
}

export function statusLabel(s: FriendStatus): string {
  switch (s) {
    case 'menu':
      return 'On menu';
    case 'in-ai':
      return 'Vs AI';
    case 'in-hotseat':
      return 'Hot-seat';
    case 'in-ranked':
      return 'Ranked match';
    case 'searching-ranked':
      return 'Searching…';
    case 'in-daily':
      return "Today's puzzle";
    case 'offline':
      return 'Offline';
  }
}
