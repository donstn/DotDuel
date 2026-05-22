import { useEffect, useRef, useState } from 'react';
import {
  checkAvailability,
  claimUsername,
  renameUsername,
  validateUsername,
} from '../cloud/usernames';

interface Props {
  mode: 'claim' | 'rename';
  uid: string;
  initialName?: string;
  seed?: { email: string | null; authProvider: string | null };
  onSuccess: (newName: string) => void;
  onCancel?: () => void;
}

type AvailState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'available' }
  | { kind: 'taken' }
  | { kind: 'invalid'; reason: string }
  | { kind: 'error'; message: string };

const CHECK_DEBOUNCE_MS = 450;

export function UsernamePicker({
  mode,
  uid,
  initialName = '',
  seed,
  onSuccess,
  onCancel,
}: Props) {
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
          message: (e as Error)?.message ?? 'Check failed.',
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
        setSubmitError(msg || 'Something went wrong.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onBackdrop = (e: React.MouseEvent) => {
    if (!dismissible || submitting) return;
    if (e.target === e.currentTarget) onCancel?.();
  };

  const availMessage = (() => {
    switch (avail.kind) {
      case 'checking':
        return <span className="username-status checking">Checking…</span>;
      case 'available':
        return <span className="username-status available">Available</span>;
      case 'taken':
        return <span className="username-status taken">Taken — try another</span>;
      case 'invalid':
        return <span className="username-status invalid">{avail.reason}</span>;
      case 'error':
        return <span className="username-status invalid">{avail.message}</span>;
      default:
        return <span className="username-status hint">3–16 chars · letters, digits, _ or -</span>;
    }
  })();

  return (
    <div
      className="rules-overlay"
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'claim' ? 'Pick a game name' : 'Rename'}
    >
      <div className="rules-card username-card">
        {dismissible && (
          <button
            className="rules-close"
            onClick={onCancel}
            aria-label="Cancel"
            disabled={submitting}
          >
            ✕
          </button>
        )}

        <header className="rules-header">
          <h2>{mode === 'claim' ? 'Pick your game name' : 'Rename'}</h2>
          <p className="rules-tagline">
            {mode === 'claim'
              ? 'This is what other players will see. Unique to you. You can rename later.'
              : 'Stats follow your account, not the name — they carry over.'}
          </p>
        </header>

        <div className="username-body">
          <form onSubmit={onSubmit} className="auth-form">
            <input
              type="text"
              className="settings-input"
              placeholder="e.g. Donatas"
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
              {submitting ? '…' : mode === 'claim' ? 'Claim name' : 'Save'}
            </button>
          </form>

          {submitError && (
            <div className="auth-error" role="alert">
              {submitError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
