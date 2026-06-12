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
    emailVerified: Boolean(u.email_confirmed_at),
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

// The WEB OAuth client ID (Google Cloud Console) — the SAME one configured on
// Supabase's Google provider, so the native id-token's audience passes
// signInWithIdToken. Public by design (ships in every client). The native
// Credential Manager flow ALSO requires an Android OAuth client (package
// com.dotduel.app + signing SHA-1) to exist in the same Google Cloud project —
// that client's id is never referenced in code, it just has to exist.
const GOOGLE_WEB_CLIENT_ID = '';

// Native (Capacitor) Google sign-in: the OS account picker via Credential
// Manager — no browser page, no supabase.co domain shown, immune to Google's
// disallowed_useragent webview block. Token goes through the same
// signInWithIdToken bridge the dual-auth era used.
let socialLoginReady = false;
export async function signInWithGoogleNative(): Promise<void> {
  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new Error('Google sign-in is not configured yet for the app.');
  }
  const { SocialLogin } = await import('@capgo/capacitor-social-login');
  if (!socialLoginReady) {
    await SocialLogin.initialize({
      google: { webClientId: GOOGLE_WEB_CLIENT_ID },
    });
    socialLoginReady = true;
  }
  const { result } = await SocialLogin.login({
    provider: 'google',
    options: {},
  });
  if (result.responseType !== 'online' || !result.idToken) {
    throw new Error('Google sign-in did not return an identity token.');
  }
  await signInWithGoogleIdToken(result.idToken);
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
