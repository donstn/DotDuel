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
import { supabase, currentSupabaseUid } from '../supabase';
import { CLIENT_SUPABASE_TRANSPORT } from '../types';
import { syncProfileName } from './supabaseProfile';

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
  // Alpha 0.2.5.0 (Phase 2a) — daily-puzzle streak. Written by the daily
  // puzzle completion path (ships in Phase 2b). Optional because existing
  // profile docs predate this field; reader logic surfaces undefined when
  // the user has never completed a daily puzzle yet.
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

function userDoc(uid: string) {
  return doc(db, 'users', uid);
}

function usernameDoc(lower: string) {
  return doc(db, 'usernames', lower);
}

function shapeProfile(data: DocumentData | undefined): CloudProfile {
  const rawStreak = data?.streak;
  const streak =
    rawStreak &&
    typeof rawStreak.current === 'number' &&
    typeof rawStreak.longest === 'number' &&
    typeof rawStreak.lastPlayedUTC === 'string'
      ? {
          current: rawStreak.current,
          longest: rawStreak.longest,
          lastPlayedUTC: rawStreak.lastPlayedUTC,
        }
      : undefined;
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
    streak,
  };
}

// Map a Supabase `profiles` row (snake_case) to the CloudProfile the app
// consumes. The rating-bearing profile lives in Supabase under the transport;
// the read path used to point at the Firebase users/{uid} doc, so a Supabase
// Elo update never reached the UI (the "ratings don't update" bug).
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

export async function loadProfile(uid: string): Promise<CloudProfile | null> {
  if (CLIENT_SUPABASE_TRANSPORT) {
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
  if (CLIENT_SUPABASE_TRANSPORT) {
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

    // Same late-session resilience as watchPairing: the Supabase uuid may not be
    // ready at mount, so (re)attach when the session resolves. Subscribe first,
    // then fetch on SUBSCRIBED; re-fetch on any change (rating/name/streak).
    const attach = (sid: string | null) => {
      if (cancelled || !sid || sid === attachedSid) return;
      attachedSid = sid;
      if (channel) {
        void supabase.removeChannel(channel);
        channel = null;
      }
      // Fetch the current profile immediately — independent of Realtime — so
      // the rating loads even if the channel never reaches SUBSCRIBED (e.g.
      // profiles not yet in the publication). Realtime only adds live updates.
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
    // The profile read is Supabase-sourced under the transport; push the name
    // there directly so it doesn't wait on the (still-Firebase) username path.
    if (CLIENT_SUPABASE_TRANSPORT) await syncProfileName(display);
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
      if (CLIENT_SUPABASE_TRANSPORT) await syncProfileName(newDisplay);
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
    if (CLIENT_SUPABASE_TRANSPORT) await syncProfileName(newDisplay);
  } catch (e) {
    const code = (e as { code?: string; message?: string })?.code
      ?? (e as { message?: string })?.message
      ?? 'unknown';
    trackEvent('username_claim_failed', { mode: 'rename', error_code: code });
    throw e;
  }
}
