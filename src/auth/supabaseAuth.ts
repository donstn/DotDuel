import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import type { AppUser } from './AppUser';

// Map a Supabase auth user into the app-owned AppUser shape.
export function mapSupabaseUser(u: User | null): AppUser | null {
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  return {
    uid: u.id,
    displayName:
      (meta.full_name as string | undefined) ??
      (meta.name as string | undefined) ??
      null,
    email: u.email ?? null,
    provider: (u.app_metadata?.provider as string | undefined) ?? 'supabase',
  };
}

// Standard Supabase Google OAuth (redirect flow). Used directly when Supabase
// is the sole identity; during the dual-auth bridge the SignInPopover instead
// drives one Google popup through Firebase and feeds the id-token to Supabase
// via signInWithIdToken (no second redirect).
export async function signInWithGoogleSupabase(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname },
  });
  if (error) throw error;
}

// Dual-auth bridge: exchange a Google id-token (from the Firebase popup) for a
// Supabase session — no second redirect. The token's audience (the Firebase
// Google client ID) must match the Client ID set on Supabase's Google provider.
export async function signInWithGoogleIdToken(idToken: string): Promise<void> {
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  if (error) throw error;
}

export async function signOutSupabase(): Promise<void> {
  await supabase.auth.signOut();
}

// Emit the current user immediately, then on every auth change. Returns an
// unsubscribe.
export function onSupabaseAuthChange(
  cb: (user: AppUser | null) => void,
): () => void {
  void supabase.auth
    .getSession()
    .then(({ data }) => cb(mapSupabaseUser(data.session?.user ?? null)));
  const { data } = supabase.auth.onAuthStateChange(
    (_event, session: Session | null) => {
      cb(mapSupabaseUser(session?.user ?? null));
    },
  );
  return () => data.subscription.unsubscribe();
}
