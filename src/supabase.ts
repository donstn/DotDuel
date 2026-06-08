import { createClient } from '@supabase/supabase-js';

// Single Supabase client for the whole app — the Phase-1+ analog of
// `src/firebase.ts`. Only `src/cloud/*` and `src/auth/*` import this; never a
// component, so the backend stays swappable behind the cloud/ seam.
//
// The anon key is public by design — Row-Level Security enforces access, the
// same model as the public Firebase web key (security audit L-2).
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to ' +
      '.env.local and fill them in (Supabase dashboard → Settings → API).',
  );
}

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
