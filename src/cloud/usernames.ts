import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db, trackEvent } from '../firebase';

export interface CloudProfile {
  displayName: string | null;
  email: string | null;
  authProvider: string | null;
  rating: number;
  placementGamesPlayed: number;
  createdAt: unknown;
  // Alpha 0.2.0.0 — friends & invites privacy fields. Optional in the type
  // because existing pre-0.2 profile docs won't have them; reader logic
  // defaults them.
  challengePolicy?: 'everyone' | 'friends-only' | 'nobody';
  showPresence?: boolean;
  friendListHidden?: boolean;
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

function shapeProfile(data: DocumentData | undefined): CloudProfile {
  return {
    displayName: data?.displayName ?? null,
    email: data?.email ?? null,
    authProvider: data?.authProvider ?? null,
    rating: typeof data?.rating === 'number' ? data.rating : 1000,
    placementGamesPlayed:
      typeof data?.placementGamesPlayed === 'number'
        ? data.placementGamesPlayed
        : 0,
    createdAt: data?.createdAt ?? null,
  };
}

export async function loadProfile(uid: string): Promise<CloudProfile | null> {
  try {
    const snap = await getDoc(userDoc(uid));
    if (!snap.exists()) return null;
    return shapeProfile(snap.data());
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
      onChange(shapeProfile(snap.data()));
    },
    (err) => {
      console.warn('watchProfile error:', err);
      onChange(null);
    },
  );
}

// Calls the checkUsernameAvailable Cloud Function. Going through the
// function (rather than reading usernames/{lower} directly) lets us
// rate-limit availability checks server-side so the global usernames
// collection can't be cheaply enumerated. The transactional claim in
// claimUsername/renameUsername still does direct reads — those are
// inherently bounded by one read per claim attempt.
const functions = getFunctions(app, 'europe-west1');

export async function checkAvailability(
  desired: string,
  _ownUid: string,
): Promise<boolean> {
  const trimmed = desired.trim();
  if (!trimmed) return false;
  try {
    const fn = httpsCallable<
      { name: string },
      { available: boolean; reason?: string }
    >(functions, 'checkUsernameAvailable');
    const result = await fn({ name: trimmed });
    return result.data.available === true;
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
  try {
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
  } catch (e) {
    const code = (e as { code?: string; message?: string })?.code
      ?? (e as { message?: string })?.message
      ?? 'unknown';
    trackEvent('username_claim_failed', { mode: 'claim', error_code: code });
    throw e;
  }
}

export async function renameUsername(
  uid: string,
  oldName: string,
  newName: string,
): Promise<void> {
  const oldLower = normName(oldName);
  const newLower = normName(newName);
  const newDisplay = newName.trim();
  try {
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
      tx.delete(usernameDoc(oldLower));
      tx.set(userDoc(uid), { displayName: newDisplay }, { merge: true });
    });
  } catch (e) {
    const code = (e as { code?: string; message?: string })?.code
      ?? (e as { message?: string })?.message
      ?? 'unknown';
    trackEvent('username_claim_failed', { mode: 'rename', error_code: code });
    throw e;
  }
}
