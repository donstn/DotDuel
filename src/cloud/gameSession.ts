import {
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

const STORAGE_KEY = 'dotduel:gameSessionId';

export interface GameSession {
  sessionId: string;
  claimedAt: number;
}

// Per-tab session id, generated once and stored in sessionStorage (cleared
// when the tab closes). Two tabs of the same browser get different ids.
export function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(STORAGE_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `s${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      sessionStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return `s${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  }
}

// Stale-session threshold. A claim is considered abandoned (other devices
// may take over) if claimedAt is older than this. Set well above the
// heartbeat interval so a brief tab-suspended state doesn't free the lock.
const STALE_MS = 90_000;
const HEARTBEAT_MS = 30_000;

let heartbeatTimer: number | null = null;
let heartbeatUid: string | null = null;

function stopHeartbeat() {
  if (heartbeatTimer !== null) {
    window.clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  heartbeatUid = null;
}

function startHeartbeat(uid: string) {
  stopHeartbeat();
  heartbeatUid = uid;
  heartbeatTimer = window.setInterval(() => {
    if (heartbeatUid !== uid) return;
    updateDoc(doc(db, 'sessions', uid), { claimedAt: Date.now() }).catch((e) => {
      console.warn('gameSession heartbeat failed:', e);
    });
  }, HEARTBEAT_MS);
}

// Claim the multiplayer game-session lock for this tab. Writes a Firestore
// doc at sessions/{uid} carrying our sessionId, then heartbeats every 30s
// so other tabs of the same account can tell the claim is still live.
export async function claimSession(
  uid: string,
  sessionId: string,
): Promise<void> {
  await setDoc(doc(db, 'sessions', uid), {
    sessionId,
    claimedAt: Date.now(),
  });
  startHeartbeat(uid);
}

// Explicit release. Cancels the heartbeat and deletes the doc so any
// other tab signed in as the same uid can claim immediately.
export async function releaseSession(uid: string): Promise<void> {
  stopHeartbeat();
  try {
    await deleteDoc(doc(db, 'sessions', uid));
  } catch (e) {
    console.warn('releaseSession deleteDoc failed:', e);
  }
}

export function watchSession(
  uid: string,
  onChange: (s: GameSession | null) => void,
): () => void {
  return onSnapshot(
    doc(db, 'sessions', uid),
    (snap) => {
      if (!snap.exists()) {
        onChange(null);
        return;
      }
      const v = snap.data() as { sessionId?: string; claimedAt?: number };
      const claimedAt = Number(v.claimedAt ?? 0);
      // Treat stale claims (older than STALE_MS) as released — covers the
      // case where the active tab crashed or lost connectivity without a
      // chance to call releaseSession. Without this we'd need an
      // onDisconnect equivalent, which Firestore does not provide.
      if (claimedAt > 0 && Date.now() - claimedAt > STALE_MS) {
        onChange(null);
        return;
      }
      onChange({
        sessionId: String(v.sessionId ?? ''),
        claimedAt,
      });
    },
    (err) => {
      console.warn('watchSession error:', err);
      onChange(null);
    },
  );
}
