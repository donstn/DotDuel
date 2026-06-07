import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as fbSignOut, type User } from 'firebase/auth';
import { auth } from '../firebase';
import { signOutSupabase } from './supabaseAuth';

export interface AuthState {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  return {
    user,
    loading,
    // Dual-auth bridge: clear BOTH sessions on sign-out.
    signOut: async () => {
      await Promise.allSettled([fbSignOut(auth), signOutSupabase()]);
    },
  };
}
