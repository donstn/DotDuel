import { useEffect, useState } from 'react';
import type { AppUser } from './AppUser';
import { onSupabaseAuthChange, signOutSupabase } from './supabaseAuth';

export interface AuthState {
  user: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// Sole identity provider after the Firebase cutover: Supabase Auth. Returns the
// provider-agnostic AppUser, so call sites keep using user.uid / displayName /
// email unchanged (uid is now the Supabase auth uuid).
export function useAuth(): AuthState {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onSupabaseAuthChange((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  return {
    user,
    loading,
    signOut: signOutSupabase,
  };
}
