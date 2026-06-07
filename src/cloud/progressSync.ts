import { supabase } from '../supabase';
import { loadProgress, saveProgress } from '../storage';
import type { Difficulty, Progress, ShapeId } from '../types';

// vs-AI unlock progression sync, now on Supabase `profiles.progress` (jsonb).
// The uid args are accepted for call-site compatibility but ignored — the row
// is the authenticated session user's, scoped by RLS.

const SHAPES: ShapeId[] = ['triangle', 'square', 'rectangle', 'rhombus'];

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

function normalise(p: Partial<Progress> | null | undefined): Progress | null {
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
}

async function sessionUid(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function loadCloudProgress(_uid: string): Promise<Progress | null> {
  const uid = await sessionUid();
  if (!uid) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('progress')
    .eq('id', uid)
    .maybeSingle();
  if (error) {
    console.warn('loadCloudProgress failed:', error.message);
    return null;
  }
  return normalise(data?.progress as Partial<Progress> | null);
}

export async function saveCloudProgress(
  _uid: string,
  p: Progress,
): Promise<void> {
  const uid = await sessionUid();
  if (!uid) return;
  const { error } = await supabase
    .from('profiles')
    .update({ progress: p })
    .eq('id', uid);
  if (error) console.warn('saveCloudProgress failed:', error.message);
}

export async function syncOnSignIn(_uid: string): Promise<Progress | null> {
  const uid = await sessionUid();
  if (!uid) return null;
  const local = loadProgress();
  const { data, error } = await supabase
    .from('profiles')
    .select('progress')
    .eq('id', uid)
    .maybeSingle();
  if (error) {
    console.warn('syncOnSignIn failed:', error.message);
    return null;
  }
  const cloud = normalise(data?.progress as Partial<Progress> | null);
  if (!cloud) {
    await saveCloudProgress(uid, local);
    return null;
  }
  const merged = mergeProgress(local, cloud);
  saveProgress(merged);
  await saveCloudProgress(uid, merged);
  return merged;
}
