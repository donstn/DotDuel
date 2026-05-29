import { useEffect, useState } from 'react';
import type { Friend } from '../cloud/friends';
import { sendInvite } from '../cloud/invites';
import { TIME_CONTROLS, type TimeControl } from '../cloud/matchmaking';
import { PLAYABLE_SHAPE_META, type ShapeId } from '../types';

interface Props {
  friend: Friend;
  onClose: () => void;
  onSent: () => void;
}

export function SendInviteDialog({ friend, onClose, onSent }: Props) {
  const [shape, setShape] = useState<ShapeId>('triangle');
  const [timeControl, setTimeControl] = useState<TimeControl>('3min');
  const [fromRanked, setFromRanked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onSend = async () => {
    setBusy(true);
    setError(null);
    try {
      await sendInvite({
        toUids: [friend.uid],
        shape,
        timeControl,
        fromRanked,
      });
      onSent();
    } catch (e) {
      const msg =
        (e as { message?: string } | undefined)?.message ?? 'Invite failed.';
      setError(msg);
      setBusy(false);
    }
  };

  return (
    <div
      className="rules-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Send invite"
    >
      <div className="rules-card invite-card">
        <button className="rules-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <header className="rules-header">
          <h2>Invite {friend.displayName}</h2>
        </header>

        <div className="invite-section">
          <h3 className="invite-section-title">Shape</h3>
          <div className="invite-radio-row">
            {PLAYABLE_SHAPE_META.map((s) => (
              <label
                key={s.id}
                className={`invite-radio${shape === s.id ? ' is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="invite-shape"
                  value={s.id}
                  checked={shape === s.id}
                  onChange={() => setShape(s.id)}
                  disabled={busy}
                />
                <span>{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="invite-section">
          <h3 className="invite-section-title">Time control</h3>
          <div className="invite-radio-row">
            {TIME_CONTROLS.map((tc) => (
              <label
                key={tc.id}
                className={`invite-radio${timeControl === tc.id ? ' is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="invite-tc"
                  value={tc.id}
                  checked={timeControl === tc.id}
                  onChange={() => setTimeControl(tc.id)}
                  disabled={busy}
                />
                <span>
                  {tc.label} <small>· {tc.per}</small>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="invite-section">
          <label className="invite-ranked-toggle">
            <input
              type="checkbox"
              checked={fromRanked}
              onChange={(e) => setFromRanked(e.target.checked)}
              disabled={busy}
            />
            <span>Ranked match</span>
          </label>
          <p className="invite-ranked-hint">
            Counts for Elo only if your opponent also accepts ranked.
            Otherwise it's a casual match.
          </p>
        </div>

        {error && <p className="invite-error">{error}</p>}

        <div className="invite-actions">
          <button
            type="button"
            className="menu-auth-btn"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="hotseat-start"
            onClick={onSend}
            disabled={busy}
          >
            {busy ? 'Sending…' : 'Send invite'}
          </button>
        </div>
      </div>
    </div>
  );
}
