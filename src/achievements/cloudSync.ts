/**
 * Cloud mirror for achievements (Supabase `player_achievements` + the
 * profiles.featured_achievement column). Best-effort: every call is wrapped so
 * that a missing table (migration not yet applied) or offline state degrades to
 * a no-op — the local store stays the source of truth.
 *
 * Keyed by the SUPABASE auth uuid (currentSupabaseUid), which is what the table
 * + RLS use — NOT the Firebase uid the rest of the app threads around.
 */
import { currentSupabaseUid, supabase } from '../supabase';
import { getFeatured, unlock, unlockedIds } from './store';

export async function pushUnlocks(ids: string[]): Promise<void> {
  const uid = currentSupabaseUid();
  if (!uid || !ids.length) return;
  try {
    await supabase
      .from('player_achievements')
      .upsert(
        ids.map((achievement_id) => ({ uid, achievement_id })),
        { onConflict: 'uid,achievement_id', ignoreDuplicates: true },
      );
  } catch {
    // table may not exist yet / offline — local store is authoritative
  }
}

export async function pushFeatured(id: string | null): Promise<void> {
  const uid = currentSupabaseUid();
  if (!uid) return;
  try {
    await supabase.from('profiles').update({ featured_achievement: id }).eq('id', uid);
  } catch {
    // ignore
  }
}

/** On sign-in: union cloud → local, then push any local-only unlocks up.
 *  Returns ids newly brought down from the cloud (so the caller can refresh). */
export async function syncAchievementsOnSignIn(): Promise<string[]> {
  const uid = currentSupabaseUid();
  if (!uid) return [];
  try {
    const { data, error } = await supabase
      .from('player_achievements')
      .select('achievement_id')
      .eq('uid', uid);
    if (error) return [];
    const cloud = (data ?? []).map((r) => r.achievement_id as string);
    const cloudSet = new Set(cloud);
    const fresh = unlock(cloud);
    const localOnly = [...unlockedIds()].filter((id) => !cloudSet.has(id));
    if (localOnly.length) await pushUnlocks(localOnly);
    const featured = getFeatured();
    if (featured) await pushFeatured(featured);
    return fresh;
  } catch {
    return [];
  }
}

/** Another player's unlocked badge ids (opponent display, public profiles). */
export async function loadAchievementsFor(uid: string): Promise<Set<string>> {
  try {
    const { data } = await supabase
      .from('player_achievements')
      .select('achievement_id')
      .eq('uid', uid);
    return new Set((data ?? []).map((r) => r.achievement_id as string));
  } catch {
    return new Set();
  }
}
