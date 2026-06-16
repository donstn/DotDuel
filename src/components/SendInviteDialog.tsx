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
import { useT } from '../i18n';

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

type ReasonKey = 'offline' | 'searching' | 'inGame';

// The friend must be online AND not busy to receive an invite.
function availability(status: FriendStatus): { canInvite: boolean; reasonKey: ReasonKey | null } {
  switch (status) {
    case 'menu':
      return { canInvite: true, reasonKey: null };
    case 'offline':
      return { canInvite: false, reasonKey: 'offline' };
    case 'searching-ranked':
      return { canInvite: false, reasonKey: 'searching' };
    default:
      return { canInvite: false, reasonKey: 'inGame' };
  }
}

export function SendInviteDialog({ friend, friendStatus, hasActivePairing, onClose }: Props) {
  const t = useT();
  const [shape, setShape] = useState<ShapeId>('triangle');
  const [timeControl, setTimeControl] = useState<TimeControl>('3min');
  const [fromRanked, setFromRanked] = useState(false);
  const [phase, setPhase] = useState<Phase>('form');
  const [error, setError] = useState<string | null>(null);
  const [outgoing, setOutgoing] = useState<Invite[]>([]);
  // Once we've SEEN our pending invite in the live list, its later disappearance
  // (without a pairing) means the recipient declined / it expired.
  const seenPendingRef = useRef(false);

  const { canInvite, reasonKey } = availability(friendStatus);
  const reason = reasonKey
    ? reasonKey === 'offline'
      ? t.invite.reasonOffline
      : reasonKey === 'searching'
        ? t.invite.reasonSearching
        : t.invite.reasonInGame
    : '';

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
      setError((e as { message?: string } | undefined)?.message ?? t.invite.inviteFailed);
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
      aria-label={t.invite.aria}
    >
      <div className="rules-card invite-card">
        {phase !== 'sending' && (
          <button className="rules-close" onClick={onClose} aria-label={t.invite.close}>
            ✕
          </button>
        )}
        <header className="rules-header">
          <h2>{t.invite.title(friend.displayName)}</h2>
        </header>

        {phase === 'waiting' ? (
          <div className="invite-waiting">
            <p className="invite-waiting-text">{t.invite.waiting(friend.displayName)}</p>
            <div className="invite-actions">
              <button type="button" className="menu-auth-btn" onClick={onCancelInvite}>
                {t.invite.cancelInvite}
              </button>
            </div>
          </div>
        ) : phase === 'declined' ? (
          <div className="invite-waiting">
            <p className="invite-waiting-text">{t.invite.declined(friend.displayName)}</p>
            {!canInvite && (
              <p className="invite-ranked-hint">
                {t.invite.declinedReason(friend.displayName, reason)}
              </p>
            )}
            <div className="invite-actions">
              <button type="button" className="menu-auth-btn" onClick={onClose}>
                {t.invite.close}
              </button>
              <button
                type="button"
                className="hotseat-start"
                onClick={onSendAgain}
                disabled={!canInvite}
              >
                {t.invite.sendAgain}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="invite-section">
              <h3 className="invite-section-title">{t.invite.shapeH}</h3>
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
                    <span>{t.shapes[s.id]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="invite-section">
              <h3 className="invite-section-title">{t.invite.timeH}</h3>
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
                      {t.timeControls[tc.id].label} <small>· {t.timeControls[tc.id].per}</small>
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
                <span>{t.invite.ranked}</span>
              </label>
              <p className="invite-ranked-hint">{t.invite.rankedHint}</p>
            </div>

            {!canInvite && (
              <p className="invite-error">
                {t.invite.cantInviteNow(friend.displayName, reason)}
              </p>
            )}
            {error && <p className="invite-error">{error}</p>}

            <div className="invite-actions">
              <button
                type="button"
                className="menu-auth-btn"
                onClick={onClose}
                disabled={phase === 'sending'}
              >
                {t.invite.cancel}
              </button>
              <button
                type="button"
                className="hotseat-start"
                onClick={onSend}
                disabled={phase === 'sending' || !canInvite}
              >
                {phase === 'sending' ? t.invite.sending : t.invite.send}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
