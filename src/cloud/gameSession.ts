import {
  onDisconnect,
  onValue,
  ref,
  remove,
  set,
} from 'firebase/database';
import { rtdb } from '../firebase';

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

function sessionRef(uid: string) {
  return ref(rtdb, `gameSessions/${uid}`);
}

// Claim the multiplayer game-session lock for this tab. Also arms an
// onDisconnect handler so the lock auto-releases if the browser closes
// or the network drops mid-game.
export async function claimSession(
  uid: string,
  sessionId: string,
): Promise<void> {
  const r = sessionRef(uid);
  await set(r, { sessionId, claimedAt: Date.now() });
  try {
    await onDisconnect(r).remove();
  } catch (e) {
    console.warn('claimSession onDisconnect arm failed:', e);
  }
}

// Explicit release. Cancels the onDisconnect handler so a transient
// reconnect doesn't immediately re-fire it.
export async function releaseSession(uid: string): Promise<void> {
  const r = sessionRef(uid);
  try {
    await onDisconnect(r).cancel();
  } catch (e) {
    console.warn('releaseSession onDisconnect cancel failed:', e);
  }
  try {
    await remove(r);
  } catch (e) {
    console.warn('releaseSession remove failed:', e);
  }
}

export function watchSession(
  uid: string,
  onChange: (s: GameSession | null) => void,
): () => void {
  const r = sessionRef(uid);
  return onValue(
    r,
    (snap) => {
      const v = snap.val();
      if (!v) {
        onChange(null);
        return;
      }
      onChange({
        sessionId: String(v.sessionId ?? ''),
        claimedAt: Number(v.claimedAt ?? 0),
      });
    },
    (err) => {
      console.warn('watchSession error:', err);
      onChange(null);
    },
  );
}
