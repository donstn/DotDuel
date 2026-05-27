import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { loadProgress, saveProgress } from '../storage';
import type { Difficulty, Progress, ShapeId } from '../types';

const SHAPES: ShapeId[] = ['triangle', 'square', 'rectangle', 'rhombus'];

function userDoc(uid: string) {
  return doc(db, 'users', uid);
}

function mergeProgress(local: Progress, cloud: Progress): Progress {
  const unlocked = { ...local.unlocked };
  for (const s of SHAPES) {
    const a = (local.unlocked[s] ?? 0) as number;
    const b = (cloud.unlocked[s] ?? 0) as number;
    const max = Math.max(a, b);
    if (s === 'triangle') {
      unlocked.triangle = (max < 1 ? 1 : max) as Difficulty;
    } else {
      unlocked[s] = max as Difficulty | 0;
    }
  }
  const wins = { ...cloud.wins, ...local.wins };
  return { unlocked, wins };
}

export async function loadCloudProgress(uid: string): Promise<Progress | null> {
  try {
    const snap = await getDoc(userDoc(uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    const p = data?.progress as Progress | undefined;
    if (!p) return null;
    const u = p.unlocked ?? ({} as Partial<Progress['unlocked']>);
    return {
      unlocked: {
        triangle: u.triangle ?? 1,
        square: u.square ?? 0,
        rectangle: u.rectangle ?? 0,
        rhombus: u.rhombus ?? 0,
      },
      wins: p.wins ?? {},
    };
  } catch (e) {
    console.warn('loadCloudProgress failed:', e);
    return null;
  }
}

export async function saveCloudProgress(
  uid: string,
  p: Progress,
): Promise<void> {
  try {
    await setDoc(userDoc(uid), { progress: p }, { merge: true });
  } catch (e) {
    console.warn('saveCloudProgress failed:', e);
  }
}

export async function syncOnSignIn(uid: string): Promise<Progress | null> {
  const local = loadProgress();
  // Read users/{uid} directly so we can distinguish "no doc yet" (user
  // hasn't claimed a username) from "doc exists but no progress field".
  // In the no-doc case we must NOT pre-create the doc here — claimUsername
  // creates it with required server-only fields (email, authProvider,
  // createdAt). If we wrote {progress} first, claimUsername's later write
  // would hit allow update (not allow create) and be rejected because the
  // update rule restricts fields to ['displayName', 'progress'].
  try {
    const snap = await getDoc(userDoc(uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    const cloud = data?.progress as Progress | undefined;
    if (!cloud) {
      await saveCloudProgress(uid, local);
      return null;
    }
    const p = cloud;
    const u = p.unlocked ?? ({} as Partial<Progress['unlocked']>);
    const normalised: Progress = {
      unlocked: {
        triangle: u.triangle ?? 1,
        square: u.square ?? 0,
        rectangle: u.rectangle ?? 0,
        rhombus: u.rhombus ?? 0,
      },
      wins: p.wins ?? {},
    };
    const merged = mergeProgress(local, normalised);
    saveProgress(merged);
    await saveCloudProgress(uid, merged);
    return merged;
  } catch (e) {
    console.warn('syncOnSignIn failed:', e);
    return null;
  }
}
