import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { app, db } from '../firebase';

/**
 * GDPR Articles 17 (erasure) + 20 (portability).
 * Both flows are user-initiated from the Profile popover.
 */

const functions = getFunctions(app, 'europe-west1');

interface ExportPayload {
  exportedAt: string;
  user: Record<string, unknown> | null;
  leaderboardEntry: Record<string, unknown> | null;
  matches: Array<Record<string, unknown>>;
  localStorage: Record<string, string | null>;
}

/**
 * Collect every cloud + localStorage record that belongs to this uid and
 * return it as a downloadable Blob. Caller is expected to trigger a
 * browser download via an anchor element.
 */
export async function exportMyData(uid: string): Promise<Blob> {
  const payload: ExportPayload = {
    exportedAt: new Date().toISOString(),
    user: null,
    leaderboardEntry: null,
    matches: [],
    localStorage: {},
  };

  try {
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (userSnap.exists()) payload.user = { id: userSnap.id, ...userSnap.data() };
  } catch (e) {
    console.warn('exportMyData: users read failed', e);
  }

  try {
    const lbSnap = await getDoc(doc(db, 'leaderboard', uid));
    if (lbSnap.exists()) {
      payload.leaderboardEntry = { id: lbSnap.id, ...lbSnap.data() };
    }
  } catch (e) {
    console.warn('exportMyData: leaderboard read failed', e);
  }

  try {
    const matchesSnap = await getDocs(
      query(
        collection(db, 'matches'),
        where('playerUids', 'array-contains', uid),
        orderBy('finishedAt', 'desc'),
        limit(500),
      ),
    );
    matchesSnap.forEach((d) => {
      payload.matches.push({ id: d.id, ...d.data() });
    });
  } catch (e) {
    console.warn('exportMyData: matches read failed', e);
  }

  // Device-side data (also belongs to the user under GDPR).
  try {
    for (const key of [
      'dotduel:progress:v3',
      'dotduel:settings:v1',
      'dotduel:stats:v4',
      'dotduel:theme:v1',
      'dotduel:consent:v1',
    ]) {
      payload.localStorage[key] = localStorage.getItem(key);
    }
  } catch {
    // ignore
  }

  return new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
}

/** Trigger a browser download of the export. */
export async function downloadMyData(uid: string): Promise<void> {
  const blob = await exportMyData(uid);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const stamp = new Date().toISOString().slice(0, 10);
  a.download = `dotduel-export-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Defer revoke; browsers will hold the blob URL for the active download.
  setTimeout(() => URL.revokeObjectURL(url), 4_000);
}

/**
 * Calls the deleteAccount Cloud Function. Throws on failure so the
 * UI can show the error. On success, the caller must sign out and
 * leave any active screens.
 */
export async function deleteMyAccount(): Promise<{
  ok: boolean;
  sentinel: string;
}> {
  const fn = httpsCallable<unknown, { ok: boolean; sentinel: string }>(
    functions,
    'deleteAccount',
  );
  const result = await fn({});
  return result.data;
}
