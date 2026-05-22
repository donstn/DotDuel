import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface CloudProfile {
  displayName: string | null;
  email: string | null;
  authProvider: string | null;
  createdAt: unknown;
}

export const USERNAME_RE = /^[a-zA-Z0-9_-]{3,16}$/;

export function normName(name: string): string {
  return name.trim().toLowerCase();
}

export function sanitizeForUsername(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 16);
}

export function suggestUsername(
  authDisplayName: string | null,
  authEmail: string | null,
): string {
  if (authDisplayName) {
    const s = sanitizeForUsername(authDisplayName);
    if (s.length >= 3) return s;
  }
  if (authEmail) {
    const prefix = authEmail.split('@')[0] ?? '';
    const s = sanitizeForUsername(prefix);
    if (s.length >= 3) return s;
  }
  return '';
}

export function validateUsername(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 3) return 'At least 3 characters.';
  if (trimmed.length > 16) return 'Max 16 characters.';
  if (!USERNAME_RE.test(trimmed)) {
    return 'Letters, digits, _ or - only.';
  }
  return null;
}

function userDoc(uid: string) {
  return doc(db, 'users', uid);
}

function usernameDoc(lower: string) {
  return doc(db, 'usernames', lower);
}

export async function loadProfile(uid: string): Promise<CloudProfile | null> {
  try {
    const snap = await getDoc(userDoc(uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      displayName: data.displayName ?? null,
      email: data.email ?? null,
      authProvider: data.authProvider ?? null,
      createdAt: data.createdAt ?? null,
    };
  } catch (e) {
    console.warn('loadProfile failed:', e);
    return null;
  }
}

export function watchProfile(
  uid: string,
  onChange: (p: CloudProfile | null) => void,
): () => void {
  return onSnapshot(
    userDoc(uid),
    (snap) => {
      if (!snap.exists()) {
        onChange(null);
        return;
      }
      const data = snap.data();
      onChange({
        displayName: data.displayName ?? null,
        email: data.email ?? null,
        authProvider: data.authProvider ?? null,
        createdAt: data.createdAt ?? null,
      });
    },
    (err) => {
      console.warn('watchProfile error:', err);
      onChange(null);
    },
  );
}

export async function checkAvailability(
  desired: string,
  ownUid: string,
): Promise<boolean> {
  const lower = normName(desired);
  if (!lower) return false;
  try {
    const snap = await getDoc(usernameDoc(lower));
    if (!snap.exists()) return true;
    return snap.data().uid === ownUid;
  } catch (e) {
    console.warn('checkAvailability failed:', e);
    return false;
  }
}

interface ClaimSeed {
  email: string | null;
  authProvider: string | null;
}

export async function claimUsername(
  uid: string,
  desired: string,
  seed: ClaimSeed,
): Promise<void> {
  const lower = normName(desired);
  const display = desired.trim();
  await runTransaction(db, async (tx) => {
    const existing = await tx.get(usernameDoc(lower));
    if (existing.exists() && existing.data().uid !== uid) {
      throw new Error('USERNAME_TAKEN');
    }
    tx.set(usernameDoc(lower), {
      uid,
      displayName: display,
      createdAt: serverTimestamp(),
    });
    tx.set(
      userDoc(uid),
      {
        displayName: display,
        email: seed.email,
        authProvider: seed.authProvider,
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  });
}

export async function renameUsername(
  uid: string,
  oldName: string,
  newName: string,
): Promise<void> {
  const oldLower = normName(oldName);
  const newLower = normName(newName);
  const newDisplay = newName.trim();
  if (oldLower === newLower) {
    await runTransaction(db, async (tx) => {
      tx.set(usernameDoc(newLower), {
        uid,
        displayName: newDisplay,
        createdAt: serverTimestamp(),
      });
      tx.set(userDoc(uid), { displayName: newDisplay }, { merge: true });
    });
    return;
  }
  await runTransaction(db, async (tx) => {
    const existing = await tx.get(usernameDoc(newLower));
    if (existing.exists() && existing.data().uid !== uid) {
      throw new Error('USERNAME_TAKEN');
    }
    tx.set(usernameDoc(newLower), {
      uid,
      displayName: newDisplay,
      createdAt: serverTimestamp(),
    });
    tx.set(userDoc(uid), { displayName: newDisplay }, { merge: true });
  });
  // Best-effort: delete the old usernames doc outside the transaction.
  // Failure here just leaves a stale claim by us — harmless because the
  // new claim and users/{uid}.displayName are already the source of truth.
  try {
    await deleteDoc(usernameDoc(oldLower));
  } catch (e) {
    console.warn('failed to delete old username claim:', e);
  }
}
