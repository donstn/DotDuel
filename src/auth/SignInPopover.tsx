import { useEffect, useState } from 'react';
import { isNativeApp } from '../nativeAds';
import { supabase } from '../supabase';
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
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

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
    setInfo(null);
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

  const onEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signin') {
      run(async () => {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      });
    } else {
      if (password !== confirmPassword) {
        setError(t.signIn.errPasswordsMatch);
        setInfo(null);
        return;
      }
      run(
        async () => {
          const { error: err } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: window.location.origin + window.location.pathname,
            },
          });
          if (err) throw err;
          setInfo(t.signIn.accountCreated(email));
        },
        { closeOnSuccess: false },
      );
    }
  };

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
          <h2>
            {mode === 'signin'
              ? gate
                ? t.signIn.titleGate
                : t.signIn.titleSignIn
              : t.signIn.titleSignUp}
          </h2>
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

          <div className="auth-divider"><span>{t.signIn.orEmail}</span></div>

          <form className="auth-form" onSubmit={onEmailSubmit}>
            <input
              type="email"
              className="settings-input"
              placeholder={t.signIn.emailPlaceholder}
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
            <input
              type="password"
              className="settings-input"
              placeholder={t.signIn.passwordPlaceholder}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
            />
            {mode === 'signup' && (
              <input
                type="password"
                className="settings-input"
                placeholder={t.signIn.confirmPlaceholder}
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={busy}
              />
            )}
            <button type="submit" className="rules-got-it auth-submit" disabled={busy}>
              {busy ? '…' : mode === 'signin' ? t.signIn.submitSignIn : t.signIn.submitSignUp}
            </button>
          </form>

          {error && <div className="auth-error" role="alert">{error}</div>}
          {info && <div className="auth-info">{info}</div>}

          <div className="auth-toggle">
            {mode === 'signin' ? (
              <span>
                {t.signIn.newHere}{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setMode('signup');
                    setConfirmPassword('');
                    setError(null);
                    setInfo(null);
                  }}
                >
                  {t.signIn.createAccount}
                </a>
              </span>
            ) : (
              <span>
                {t.signIn.haveOne}{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setMode('signin');
                    setConfirmPassword('');
                    setError(null);
                    setInfo(null);
                  }}
                >
                  {t.signIn.signInLink}
                </a>
              </span>
            )}
          </div>

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
