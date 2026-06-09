import { createClient } from '@supabase/supabase-js';

// Single Supabase client for the whole app — the Phase-1+ analog of
// `src/firebase.ts`. Only `src/cloud/*` and `src/auth/*` import this; never a
// component, so the backend stays swappable behind the cloud/ seam.
//
// The anon key is public by design — Row-Level Security enforces access, the
// same model as the public Firebase web key (security audit L-2).
// Public client config. The URL + publishable key are PUBLIC by design — they
// ship in the browser bundle and Row-Level Security enforces access (same model
// as the old Firebase web config, which was likewise hardcoded). Hardcoded as
// the default so production CI builds work without env secrets; `.env.local`
// overrides for local dev or pointing at a different project.
const url = import.meta.env.VITE_SUPABASE_URL ?? 'https://ggyjxayazxbjvjbeecxa.supabase.co';
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'sb_publishable_wV3b7zFPGVvPt6No3OnJRQ_S7tJA6iY';

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// The app identifies the local player by their FIREBASE uid, but Supabase tables
// (games.p1_uid/p2_uid, pairings.uid, …) key on the Supabase auth uuid — a
// different value for the same person (the dual-auth bridge mints a separate
// auth.users row). Cache it here so synchronous call sites (e.g. playerNumFor)
// can resolve "which Supabase uid am I" without an async round-trip.
let _supabaseUid: string | null = null;
void supabase.auth.getSession().then(({ data }) => {
  _supabaseUid = data.session?.user.id ?? null;
});
supabase.auth.onAuthStateChange((_event, session) => {
  _supabaseUid = session?.user.id ?? null;
});

export function currentSupabaseUid(): string | null {
  return _supabaseUid;
}
