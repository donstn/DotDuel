import { useState } from 'react';
import type { Invite } from '../cloud/invites';
import { acceptInvite, declineInvite } from '../cloud/invites';
import { SHAPE_LABEL } from '../types';
import { TIME_CONTROLS } from '../cloud/matchmaking';

interface Props {
  invites: Invite[];
  // displayName for each `from` uid in invites; the parent (App.tsx) maintains
  // this map from its friend subscription so we don't have to fetch.
  fromNames: Record<string, string>;
  onAccepted: (matchId: string) => void;
}

export function IncomingInviteToast({
  invites,
  fromNames,
  onAccepted,
}: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);

  if (invites.length === 0) return null;

  const onAccept = async (invite: Invite, ranked: boolean) => {
    setBusyId(invite.inviteId);
    try {
      const matchId = await acceptInvite(invite.inviteId, ranked);
      onAccepted(matchId);
    } catch (e) {
      console.warn('acceptInvite failed', e);
      setBusyId(null);
    }
  };

  const onDecline = async (invite: Invite) => {
    setBusyId(invite.inviteId);
    try {
      await declineInvite(invite.inviteId);
    } catch (e) {
      console.warn('declineInvite failed', e);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="invite-toast-stack" role="region" aria-label="Game invites">
      {invites.map((invite) => {
        const tcLabel =
          TIME_CONTROLS.find((t) => t.id === invite.timeControl)?.label ??
          invite.timeControl;
        const fromName = fromNames[invite.from] ?? 'A friend';
        const isBusy = busyId === invite.inviteId;
        return (
          <div key={invite.inviteId} className="invite-toast">
            <div className="invite-toast-text">
              <strong>{fromName}</strong> invites you
              <div className="invite-toast-meta">
                {SHAPE_LABEL[invite.shape]} · {tcLabel}
                {invite.fromRanked && ' · They picked Ranked'}
              </div>
            </div>
            <div className="invite-toast-actions">
              <button
                type="button"
                className="invite-toast-decline"
                onClick={() => onDecline(invite)}
                disabled={isBusy}
                aria-label={`Decline invite from ${fromName}`}
              >
                Decline
              </button>
              {invite.fromRanked && (
                <button
                  type="button"
                  className="invite-toast-accept-casual"
                  onClick={() => onAccept(invite, false)}
                  disabled={isBusy}
                >
                  Accept casual
                </button>
              )}
              <button
                type="button"
                className="invite-toast-accept"
                onClick={() => onAccept(invite, invite.fromRanked)}
                disabled={isBusy}
              >
                {isBusy
                  ? '…'
                  : invite.fromRanked
                    ? 'Accept ranked'
                    : 'Accept'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
