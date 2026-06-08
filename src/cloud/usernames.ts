import { supabase, currentSupabaseUid } from '../supabase';
import { trackEvent } from '../firebase';
import { syncProfileName } from './supabaseProfile';

export interface CloudProfile {
  displayName: string | null;
  email: string | null;
  authProvider: string | null;
  rating: number;
  placementGamesPlayed: number;
  createdAt: unknown;
  challengePolicy?: 'everyone' | 'friends-only' | 'nobody';
  showPresence?: boolean;
  friendListHidden?: boolean;
  streak?: {
    current: number;
    longest: number;
    lastPlayedUTC: string; // 'YYYY-MM-DD'
  };
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

// Map a Supabase `profiles` row (snake_case) to the CloudProfile the app
// consumes. The rating-bearing profile lives in Supabase.
function shapeSupabaseProfile(row: Record<string, unknown>): CloudProfile {
  const hasStreak =
    typeof row.streak_current === 'number' &&
    typeof row.streak_longest === 'number' &&
    typeof row.streak_last_played_utc === 'string';
  return {
    displayName: (row.display_name ?? null) as string | null,
    email: (row.email ?? null) as string | null,
    authProvider: (row.auth_provider ?? null) as string | null,
    rating: typeof row.rating === 'number' ? row.rating : 1000,
    placementGamesPlayed:
      typeof row.placement_games_played === 'number' ? row.placement_games_played : 0,
    createdAt: row.created_at ?? null,
    challengePolicy: (row.challenge_policy ?? undefined) as CloudProfile['challengePolicy'],
    showPresence: (row.show_presence ?? undefined) as boolean | undefined,
    friendListHidden: (row.friend_list_hidden ?? undefined) as boolean | undefined,
    streak: hasStreak
      ? {
          current: row.streak_current as number,
          longest: row.streak_longest as number,
          lastPlayedUTC: row.streak_last_played_utc as string,
        }
      : undefined,
  };
}

// The app's `user.uid` is the Firebase uid, but Supabase profiles key on the
// Supabase auth uuid. Resolve it from the session (cache first, then getSession).
async function profileSid(): Promise<string | null> {
  const cached = currentSupabaseUid();
  if (cached) return cached;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function loadProfile(_uid: string): Promise<CloudProfile | null> {
  const sid = await profileSid();
  if (!sid) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', sid)
    .maybeSingle();
  if (error) {
    console.warn('loadProfile (supabase) failed:', error);
    return null;
  }
  return data ? shapeSupabaseProfile(data) : null;
}

export function watchProfile(
  _uid: string,
  onChange: (p: CloudProfile | null) => void,
): () => void {
  let cancelled = false;
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let attachedSid: string | null = null;

  const emit = async (sid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sid)
      .maybeSingle();
    if (cancelled) return;
    if (error) {
      console.warn('watchProfile (supabase) error:', error);
      return;
    }
    onChange(data ? shapeSupabaseProfile(data) : null);
  };

  // The Supabase uuid may not be ready at mount, so (re)attach when the session
  // resolves. Fetch immediately (independent of Realtime) then live-update.
  const attach = (sid: string | null) => {
    if (cancelled || !sid || sid === attachedSid) return;
    attachedSid = sid;
    if (channel) {
      void supabase.removeChannel(channel);
      channel = null;
    }
    void emit(sid);
    channel = supabase
      .channel(`profile:${sid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${sid}` },
        () => {
          if (!cancelled) void emit(sid);
        },
      )
      .subscribe();
  };

  void profileSid().then(attach);
  const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
    attach(session?.user?.id ?? null);
  });

  return () => {
    cancelled = true;
    authSub.subscription.unsubscribe();
    if (channel) void supabase.removeChannel(channel);
  };
}

// Username availability. The usernames table is publicly selectable (RLS
// usernames_select_all = true) and rate-limiting moved to the DB layer; a
// name is available if no row holds it, or the row is already ours.
export async function checkAvailability(
  desired: string,
  _ownUid: string,
): Promise<boolean> {
  const trimmed = desired.trim();
  if (!USERNAME_RE.test(trimmed)) return false;
  const sid = await profileSid();
  const lower = normName(trimmed);
  const { data, error } = await supabase
    .from('usernames')
    .select('uid')
    .eq('lower', lower)
    .maybeSingle();
  if (error) {
    console.warn('checkAvailability failed:', error);
    return false;
  }
  return !data || data.uid === sid;
}

interface ClaimSeed {
  email: string | null;
  authProvider: string | null;
}

export async function claimUsername(
  _uid: string,
  desired: string,
  _seed: ClaimSeed,
): Promise<void> {
  const sid = await profileSid();
  if (!sid) throw new Error('NOT_SIGNED_IN');
  const lower = normName(desired);
  const display = desired.trim();
  try {
    const { data: existing } = await supabase
      .from('usernames')
      .select('uid')
      .eq('lower', lower)
      .maybeSingle();
    if (existing && existing.uid !== sid) throw new Error('USERNAME_TAKEN');
    const { error } = await supabase
      .from('usernames')
      .upsert({ lower, uid: sid, display_name: display });
    if (error) throw new Error(error.code === '23505' ? 'USERNAME_TAKEN' : error.message);
    await syncProfileName(display);
  } catch (e) {
    const code = (e as { message?: string })?.message ?? 'unknown';
    trackEvent('username_claim_failed', { mode: 'claim', error_code: code });
    throw e;
  }
}

export async function renameUsername(
  _uid: string,
  oldName: string,
  newName: string,
): Promise<void> {
  const sid = await profileSid();
  if (!sid) throw new Error('NOT_SIGNED_IN');
  const oldLower = normName(oldName);
  const newLower = normName(newName);
  const newDisplay = newName.trim();
  try {
    if (oldLower !== newLower) {
      const { data: existing } = await supabase
        .from('usernames')
        .select('uid')
        .eq('lower', newLower)
        .maybeSingle();
      if (existing && existing.uid !== sid) throw new Error('USERNAME_TAKEN');
    }
    const { error: upErr } = await supabase
      .from('usernames')
      .upsert({ lower: newLower, uid: sid, display_name: newDisplay });
    if (upErr) throw new Error(upErr.code === '23505' ? 'USERNAME_TAKEN' : upErr.message);
    if (oldLower !== newLower) {
      await supabase.from('usernames').delete().eq('lower', oldLower).eq('uid', sid);
    }
    await syncProfileName(newDisplay);
  } catch (e) {
    const code = (e as { message?: string })?.message ?? 'unknown';
    trackEvent('username_claim_failed', { mode: 'rename', error_code: code });
    throw e;
  }
}
