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
