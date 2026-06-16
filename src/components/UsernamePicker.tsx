import { useEffect, useRef, useState } from 'react';
import {
  checkAvailability,
  claimUsername,
  renameUsername,
  validateUsername,
  type UsernameInvalidReason,
} from '../cloud/usernames';
import { useT } from '../i18n';

interface Props {
  mode: 'claim' | 'rename';
  uid: string;
  initialName?: string;
  seed?: { email: string | null; authProvider: string | null };
  onSuccess: (newName: string) => void;
  onCancel?: () => void;
  // Claim mode is non-dismissible by design — but if claim keeps failing
  // (e.g. a stale Firestore doc the user can't repair), this gives them
  // an escape hatch back to sign-in instead of being trapped on the picker.
  onSignOut?: () => void;
}

type AvailState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'available' }
  | { kind: 'taken' }
  | { kind: 'invalid'; reason: UsernameInvalidReason }
  | { kind: 'error'; message: string };

const CHECK_DEBOUNCE_MS = 450;

export function UsernamePicker({
  mode,
  uid,
  initialName = '',
  seed,
  onSuccess,
  onCancel,
  onSignOut,
}: Props) {
  const t = useT();
  const [name, setName] = useState(initialName);
  const [avail, setAvail] = useState<AvailState>({ kind: 'idle' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);
  const requestSeq = useRef(0);

  const dismissible = mode === 'rename';

  useEffect(() => {
    if (!dismissible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onCancel?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dismissible, submitting, onCancel]);

  useEffect(() => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      setAvail({ kind: 'idle' });
      return;
    }
    const reason = validateUsername(trimmed);
    if (reason) {
      setAvail({ kind: 'invalid', reason });
      return;
    }
    setAvail({ kind: 'checking' });
    const seq = ++requestSeq.current;
    debounceRef.current = window.setTimeout(() => {
      void checkAvailability(trimmed, uid).then((ok) => {
        if (seq !== requestSeq.current) return;
        setAvail(ok ? { kind: 'available' } : { kind: 'taken' });
      }).catch((e: unknown) => {
        if (seq !== requestSeq.current) return;
        setAvail({
          kind: 'error',
          message: (e as Error)?.message ?? t.username.checkFailed,
        });
      });
    }, CHECK_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [name, uid]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (avail.kind !== 'available') return;
    const trimmed = name.trim();
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (mode === 'claim') {
        await claimUsername(uid, trimmed, {
          email: seed?.email ?? null,
          authProvider: seed?.authProvider ?? null,
        });
      } else {
        await renameUsername(uid, initialName, trimmed);
      }
      onSuccess(trimmed);
    } catch (e) {
      const msg = (e as Error)?.message ?? '';
      if (msg === 'USERNAME_TAKEN') {
        setAvail({ kind: 'taken' });
      } else {
        setSubmitError(msg || t.username.genericError);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onBackdrop = (e: React.MouseEvent) => {
    if (!dismissible || submitting) return;
    if (e.target === e.currentTarget) onCancel?.();
  };

  const invalidMsg: Record<UsernameInvalidReason, string> = {
    short: t.username.invalidShort,
    long: t.username.invalidLong,
    chars: t.username.invalidChars,
  };

  const availMessage = (() => {
    switch (avail.kind) {
      case 'checking':
        return <span className="username-status checking">{t.username.checking}</span>;
      case 'available':
        return <span className="username-status available">{t.username.available}</span>;
      case 'taken':
        return <span className="username-status taken">{t.username.taken}</span>;
      case 'invalid':
        return <span className="username-status invalid">{invalidMsg[avail.reason]}</span>;
      case 'error':
        return <span className="username-status invalid">{avail.message}</span>;
      default:
        return <span className="username-status hint">{t.username.hint}</span>;
    }
  })();

  return (
    <div
      className="rules-overlay"
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'claim' ? t.username.ariaClaim : t.username.ariaRename}
    >
      <div className="rules-card username-card">
        {dismissible && (
          <button
            className="rules-close"
            onClick={onCancel}
            aria-label={t.username.cancel}
            disabled={submitting}
          >
            ✕
          </button>
        )}

        <header className="rules-header">
          <h2>{mode === 'claim' ? t.username.titleClaim : t.username.titleRename}</h2>
          <p className="rules-tagline">
            {mode === 'claim' ? t.username.taglineClaim : t.username.taglineRename}
          </p>
        </header>

        <div className="username-body">
          <form onSubmit={onSubmit} className="auth-form">
            <input
              type="text"
              className="settings-input"
              placeholder={t.username.placeholder}
              autoComplete="off"
              spellCheck={false}
              maxLength={16}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              autoFocus
            />
            <div className="username-status-row">{availMessage}</div>
            <button
              type="submit"
              className="rules-got-it auth-submit"
              disabled={submitting || avail.kind !== 'available'}
            >
              {submitting ? '…' : mode === 'claim' ? t.username.claim : t.username.save}
            </button>
          </form>

          {submitError && (
            <div className="auth-error" role="alert">
              {submitError}
            </div>
          )}

          {mode === 'claim' && onSignOut && (
            <button
              type="button"
              className="username-signout-link"
              onClick={onSignOut}
              disabled={submitting}
            >
              {t.username.signOut}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
