import { supabase, currentSupabaseUid } from '../supabase';

/**
 * GDPR Articles 17 (erasure) + 20 (portability).
 * Both flows are user-initiated from the Profile popover.
 */

async function sid(): Promise<string | null> {
  const cached = currentSupabaseUid();
  if (cached) return cached;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

interface ExportPayload {
  exportedAt: string;
  profile: Record<string, unknown> | null;
  leaderboardEntry: Record<string, unknown> | null;
  matches: Array<Record<string, unknown>>;
  localStorage: Record<string, string | null>;
}

/**
 * Collect every cloud + localStorage record that belongs to this user and
 * return it as a downloadable Blob.
 */
export async function exportMyData(_uid: string): Promise<Blob> {
  const payload: ExportPayload = {
    exportedAt: new Date().toISOString(),
    profile: null,
    leaderboardEntry: null,
    matches: [],
    localStorage: {},
  };

  const me = await sid();
  if (me) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', me).maybeSingle();
      if (data) payload.profile = data;
    } catch (e) {
      console.warn('exportMyData: profile read failed', e);
    }
    try {
      const { data } = await supabase.from('leaderboard').select('*').eq('uid', me).maybeSingle();
      if (data) payload.leaderboardEntry = data;
    } catch (e) {
      console.warn('exportMyData: leaderboard read failed', e);
    }
    try {
      const { data } = await supabase
        .from('matches')
        .select('*')
        .or(`p1_uid.eq.${me},p2_uid.eq.${me}`)
        .order('finished_at', { ascending: false })
        .limit(500);
      payload.matches = (data ?? []) as Array<Record<string, unknown>>;
    } catch (e) {
      console.warn('exportMyData: matches read failed', e);
    }
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

  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
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
  setTimeout(() => URL.revokeObjectURL(url), 4_000);
}

/**
 * Calls the account-delete Edge Function. Throws on failure so the UI can
 * show the error. On success the caller must sign out and leave any screens.
 */
export async function deleteMyAccount(): Promise<{ ok: boolean; sentinel: string }> {
  const { data, error } = await supabase.functions.invoke('account-delete', { body: {} });
  if (error) throw new Error(error.message);
  const res = data as { ok: boolean; sentinel: string; error?: string };
  if (!res?.ok) throw new Error(res?.error ?? 'Account deletion failed.');
  return res;
}
