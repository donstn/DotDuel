import { useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../firebase';

interface Props {
  onClose: () => void;
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const FRIENDLY_ERRORS: Record<string, string> = {
  'auth/email-already-in-use': 'That email is already registered. Sign in instead.',
  'auth/invalid-email': "That email doesn't look right.",
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/user-not-found': 'No account with that email. Create one below.',
  'auth/wrong-password': "That password doesn't match.",
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/popup-closed-by-user': 'Google sign-in cancelled.',
  'auth/popup-blocked': 'Your browser blocked the Google popup. Allow popups and try again.',
  'auth/cancelled-popup-request': 'Another sign-in is already in progress.',
  'auth/too-many-requests': 'Too many attempts. Try again in a minute.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
};

export function SignInPopover({ onClose }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const onBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !busy) onClose();
  };

  async function run(fn: () => Promise<unknown>, { closeOnSuccess = true } = {}) {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await fn();
      if (closeOnSuccess) onClose();
    } catch (e) {
      const code = (e as { code?: string })?.code ?? '';
      const fallback = (e as { message?: string })?.message ?? 'Something went wrong.';
      setError(FRIENDLY_ERRORS[code] ?? fallback);
    } finally {
      setBusy(false);
    }
  }

  const onGoogle = () => run(() => signInWithPopup(auth, googleProvider));

  const onEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signin') {
      run(() => signInWithEmailAndPassword(auth, email, password));
    } else {
      if (password !== confirmPassword) {
        setError("Passwords don't match.");
        setInfo(null);
        return;
      }
      run(
        async () => {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          await sendEmailVerification(cred.user, {
            url: window.location.origin + window.location.pathname,
            handleCodeInApp: false,
          });
          setInfo(`Account created. We sent a verification email to ${cred.user.email}. (Check spam if you don't see it.)`);
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
      <div className="rules-card auth-card">
        <button className="rules-close" onClick={onClose} aria-label="Close" disabled={busy}>
          ✕
        </button>

        <header className="rules-header">
          <h2>{mode === 'signin' ? 'Sign in' : 'Create account'}</h2>
          <p className="rules-tagline">For multiplayer + cloud-synced progress.</p>
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
        </div>
      </div>
    </div>
  );
}
