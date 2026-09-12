import { useEffect, useState } from 'react';
import { isNativeApp } from '../nativeAds';
import { useT, type Messages } from '../i18n';
import {
  signInWithGoogleNative,
  signInWithGoogleSupabase,
} from './supabaseAuth';

interface Props {
  onClose: () => void;
  /** Login-gate mode (shown on load when signed out): no backdrop/ESC/✕
   *  dismiss, "Sign in to play" framing, plus a "play anonymous" escape link. */
  gate?: boolean;
  onPlayAnonymous?: () => void;
}

// Map Supabase auth error messages to friendly copy (Supabase returns prose,
// not stable codes, so match on substrings). `s` = the localized signIn strings.
// Email/password-specific cases (invalid creds, already registered, weak
// password, etc.) are unreachable while email sign-in is hidden below, but
// left in place rather than pruned — cheap to keep, and this function goes
// back to being fully exercised the moment email sign-in returns.
function friendlyError(message: string, s: Messages['signIn']): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return s.errInvalidCreds;
  if (m.includes('already registered')) return s.errAlreadyRegistered;
  if (m.includes('password should be') || m.includes('weak')) return s.errWeakPassword;
  if (m.includes('invalid email') || m.includes('unable to validate email')) return s.errInvalidEmail;
  if (m.includes('email not confirmed')) return s.errNotConfirmed;
  if (m.includes('rate limit') || m.includes('too many')) return s.errRateLimit;
  if (m.includes('network')) return s.errNetwork;
  return message || s.errGeneric;
}

export function SignInPopover({ onClose, gate = false, onPlayAnonymous }: Props) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy && !gate) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose, gate]);

  const onBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !busy && !gate) onClose();
  };

  async function run(fn: () => Promise<unknown>, { closeOnSuccess = true } = {}) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      if (closeOnSuccess) onClose();
    } catch (e) {
      setError(friendlyError((e as { message?: string })?.message ?? '', t.signIn));
    } finally {
      setBusy(false);
    }
  }

  // Native app: OS account picker (Credential Manager) — the session arrives
  // in-place, so the popover closes on success. Web: full-page OAuth redirect;
  // it navigates away and returns with a session (detectSessionInUrl), so no
  // onClose — the redirect handles it.
  const onGoogle = () =>
    isNativeApp()
      ? run(() => signInWithGoogleNative())
      : run(() => signInWithGoogleSupabase(), { closeOnSuccess: false });

  return (
    <div
      className="rules-overlay"
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={t.signIn.aria}
    >
      <div className={`rules-card auth-card${gate ? ' is-gate' : ''}`}>
        {!gate && (
          <button className="rules-close" onClick={onClose} aria-label={t.signIn.close} disabled={busy}>
            ✕
          </button>
        )}

        <header className="rules-header">
          <h2>{gate ? t.signIn.titleGate : t.signIn.titleSignIn}</h2>
        </header>

        <div className="auth-body">
          <button
            type="button"
            className="auth-google"
            onClick={onGoogle}
            disabled={busy}
          >
            <span className="auth-google-g" aria-hidden="true">G</span>
            <span>{t.signIn.google}</span>
          </button>

          {error && <div className="auth-error" role="alert">{error}</div>}

          {gate && onPlayAnonymous && (
            <button
              type="button"
              className="auth-anon"
              onClick={onPlayAnonymous}
              disabled={busy}
            >
              {t.signIn.tryAnon}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
