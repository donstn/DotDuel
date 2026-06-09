import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { signInWithGoogleSupabase } from './supabaseAuth';

interface Props {
  onClose: () => void;
  /** Login-gate mode (shown on load when signed out): no backdrop/ESC/✕
   *  dismiss, "Sign in to play" framing, plus a "play anonymous" escape link. */
  gate?: boolean;
  onPlayAnonymous?: () => void;
}

// Map Supabase auth error messages to friendly copy (Supabase returns prose,
// not stable codes, so match on substrings).
function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email or password is incorrect.';
  if (m.includes('already registered')) return 'That email is already registered. Sign in instead.';
  if (m.includes('password should be') || m.includes('weak')) return 'Password must be at least 6 characters.';
  if (m.includes('invalid email') || m.includes('unable to validate email')) return "That email doesn't look right.";
  if (m.includes('email not confirmed')) return 'Please confirm your email first (check your inbox).';
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Try again in a minute.';
  if (m.includes('network')) return 'Network error. Check your connection and try again.';
  return message || 'Something went wrong.';
}

export function SignInPopover({ onClose, gate = false, onPlayAnonymous }: Props) {
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
      setError(friendlyError((e as { message?: string })?.message ?? ''));
    } finally {
      setBusy(false);
    }
  }

  // Google OAuth is a full-page redirect; it navigates away and returns with a
  // session (detectSessionInUrl). No onClose — the redirect handles it.
  const onGoogle = () =>
    run(() => signInWithGoogleSupabase(), { closeOnSuccess: false });

  const onEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signin') {
      run(async () => {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      });
    } else {
      if (password !== confirmPassword) {
        setError("Passwords don't match.");
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
          setInfo(
            `Account created. If email confirmation is on, check ${email} (and spam) to verify.`,
          );
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
      aria-label="Sign in"
    >
      <div className={`rules-card auth-card${gate ? ' is-gate' : ''}`}>
        {!gate && (
          <button className="rules-close" onClick={onClose} aria-label="Close" disabled={busy}>
            ✕
          </button>
        )}

        <header className="rules-header">
          <h2>
            {mode === 'signin' ? (gate ? 'Sign in to play' : 'Sign in') : 'Create account'}
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
            <span>Continue with Google</span>
          </button>

          <div className="auth-divider"><span>or with email</span></div>

          <form className="auth-form" onSubmit={onEmailSubmit}>
            <input
              type="email"
              className="settings-input"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
            <input
              type="password"
              className="settings-input"
              placeholder="Password (min 6 chars)"
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
                placeholder="Confirm password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={busy}
              />
            )}
            <button type="submit" className="rules-got-it auth-submit" disabled={busy}>
              {busy ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {error && <div className="auth-error" role="alert">{error}</div>}
          {info && <div className="auth-info">{info}</div>}

          <div className="auth-toggle">
            {mode === 'signin' ? (
              <span>
                New here?{' '}
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
                  Create an account
                </a>
              </span>
            ) : (
              <span>
                Already have one?{' '}
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
                  Sign in
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
              Want to try anonymous without signing in?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
