import { useEffect, useState } from 'react';
import type { AppUser } from './AppUser';
import { onSupabaseAuthChange } from './supabaseAuth';

// Tracks the Supabase session user. The dual-auth bridge establishes this from
// the same Google login that drives Firebase, so migrated (Supabase-backed)
// features key off THIS identity — not the Firebase uid.
export function useSupabaseUser(): { user: AppUser | null; loading: boolean } {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onSupabaseAuthChange((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}
