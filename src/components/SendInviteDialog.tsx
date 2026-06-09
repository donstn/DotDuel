import { useEffect, useRef, useState } from 'react';
import type { Friend } from '../cloud/friends';
import {
  cancelInvite,
  sendInvite,
  subscribeOutgoingInvites,
  type Invite,
} from '../cloud/invites';
import { TIME_CONTROLS, type TimeControl } from '../cloud/matchmaking';
import type { FriendStatus } from '../cloud/presence';
import { PLAYABLE_SHAPE_META, type ShapeId } from '../types';

interface Props {
  friend: Friend;
  /** Live presence of the friend, so we only allow inviting when they're free. */
  friendStatus: FriendStatus;
  /** True once a pairing exists (the invite was accepted and we're navigating to
   *  the game) — guards against briefly flashing "declined" on accept. */
  hasActivePairing: boolean;
  onClose: () => void;
}

type Phase = 'form' | 'sending' | 'waiting' | 'declined';

// The friend must be online AND not busy to receive an invite.
function availability(status: FriendStatus): { canInvite: boolean; reason: string } {
  switch (status) {
    case 'menu':
      return { canInvite: true, reason: '' };
    case 'offline':
      return { canInvite: false, reason: 'is offline' };
    case 'searching-ranked':
      return { canInvite: false, reason: 'is searching for a match' };
    default:
      return { canInvite: false, reason: 'is in a game' };
  }
}

export function SendInviteDialog({ friend, friendStatus, hasActivePairing, onClose }: Props) {
  const [shape, setShape] = useState<ShapeId>('triangle');
  const [timeControl, setTimeControl] = useState<TimeControl>('3min');
  const [fromRanked, setFromRanked] = useState(false);
  const [phase, setPhase] = useState<Phase>('form');
  const [error, setError] = useState<string | null>(null);
  const [outgoing, setOutgoing] = useState<Invite[]>([]);
  // Once we've SEEN our pending invite in the live list, its later disappearance
  // (without a pairing) means the recipient declined / it expired.
  const seenPendingRef = useRef(false);

  const { canInvite, reason } = availability(friendStatus);

  // Live outgoing invites — used to detect accept (pairing) vs decline/expire.
  useEffect(() => subscribeOutgoingInvites('', setOutgoing), []);
  const myInvite = outgoing.find((i) => i.to === friend.uid && i.status === 'pending') ?? null;
  const hasMyInvite = !!myInvite;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Outcome detection while waiting.
  useEffect(() => {
    if (phase !== 'waiting') return;
    if (hasMyInvite) {
      seenPendingRef.current = true;
      return;
    }
    if (!seenPendingRef.current || hasActivePairing) return;
    // Our invite is no longer pending and no pairing yet. That's a decline/expire
    // — UNLESS this is an accept whose pairing event simply hasn't arrived yet
    // (the two realtime events race). Wait briefly: if a pairing shows up the
    // app navigates us into the game and this effect re-runs (clearing the
    // timeout); otherwise we conclude it was declined.
    const t = setTimeout(() => setPhase('declined'), 1500);
    return () => clearTimeout(t);
  }, [phase, hasMyInvite, hasActivePairing]);

  const onSend = async () => {
    setPhase('sending');
    setError(null);
    seenPendingRef.current = false;
    try {
      await sendInvite({ toUids: [friend.uid], shape, timeControl, fromRanked });
      setPhase('waiting');
    } catch (e) {
      setError((e as { message?: string } | undefined)?.message ?? 'Invite failed.');
      setPhase('form');
    }
  };

  const onCancelInvite = async () => {
    if (myInvite) {
      try {
        await cancelInvite(myInvite.inviteId);
      } catch {
        // best-effort; closing anyway
      }
    }
    onClose();
  };

  const onSendAgain = () => {
    seenPendingRef.current = false;
    setError(null);
    setPhase('form');
  };

  const backdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && phase !== 'waiting' && phase !== 'sending') onClose();
  };

  return (
    <div
      className="rules-overlay"
      onClick={backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Send invite"
    >
      <div className="rules-card invite-card">
        {phase !== 'sending' && (
          <button className="rules-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}
        <header className="rules-header">
          <h2>Invite {friend.displayName}</h2>
        </header>

        {phase === 'waiting' ? (
          <div className="invite-waiting">
            <p className="invite-waiting-text">
              Invite sent to <strong>{friend.displayName}</strong>. Waiting for them
              to accept…
            </p>
            <div className="invite-actions">
              <button type="button" className="menu-auth-btn" onClick={onCancelInvite}>
                Cancel invite
              </button>
            </div>
          </div>
        ) : phase === 'declined' ? (
          <div className="invite-waiting">
            <p className="invite-waiting-text">
              <strong>{friend.displayName}</strong> didn't accept the invite.
            </p>
            {!canInvite && (
              <p className="invite-ranked-hint">{friend.displayName} {reason}.</p>
            )}
            <div className="invite-actions">
              <button type="button" className="menu-auth-btn" onClick={onClose}>
                Close
              </button>
              <button
                type="button"
                className="hotseat-start"
                onClick={onSendAgain}
                disabled={!canInvite}
              >
                Send again
              </button>
            </div>
          </div>
        ) : (
          <>
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
                      disabled={phase === 'sending'}
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
                      disabled={phase === 'sending'}
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
                  disabled={phase === 'sending'}
                />
                <span>Ranked match</span>
              </label>
              <p className="invite-ranked-hint">
                Counts for Elo only if your opponent also accepts ranked.
                Otherwise it's a casual match.
              </p>
            </div>

            {!canInvite && (
              <p className="invite-error">{friend.displayName} {reason} — can't invite right now.</p>
            )}
            {error && <p className="invite-error">{error}</p>}

            <div className="invite-actions">
              <button
                type="button"
                className="menu-auth-btn"
                onClick={onClose}
                disabled={phase === 'sending'}
              >
                Cancel
              </button>
              <button
                type="button"
                className="hotseat-start"
                onClick={onSend}
                disabled={phase === 'sending' || !canInvite}
              >
                {phase === 'sending' ? 'Sending…' : 'Send invite'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
