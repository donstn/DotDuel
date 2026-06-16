import { useState } from 'react';
import type { Invite } from '../cloud/invites';
import { acceptInvite, declineInvite } from '../cloud/invites';
import { TIME_CONTROLS } from '../cloud/matchmaking';
import { useT } from '../i18n';

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
  const t = useT();
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
    <div className="invite-toast-stack" role="region" aria-label={t.invite.toastAria}>
      {invites.map((invite) => {
        const tcLabel = TIME_CONTROLS.find((tc) => tc.id === invite.timeControl)
          ? t.timeControls[invite.timeControl].label
          : invite.timeControl;
        const fromName = fromNames[invite.from] ?? t.invite.aFriend;
        const isBusy = busyId === invite.inviteId;
        return (
          <div key={invite.inviteId} className="invite-toast">
            <div className="invite-toast-text">
              <strong>{fromName}</strong> {t.invite.invitesYou}
              <div className="invite-toast-meta">
                {t.shapes[invite.shape]} · {tcLabel}
                {invite.fromRanked && ` · ${t.invite.theyPickedRanked}`}
              </div>
            </div>
            <div className="invite-toast-actions">
              <button
                type="button"
                className="invite-toast-decline"
                onClick={() => onDecline(invite)}
                disabled={isBusy}
                aria-label={t.invite.declineFrom(fromName)}
              >
                {t.invite.decline}
              </button>
              {invite.fromRanked && (
                <button
                  type="button"
                  className="invite-toast-accept-casual"
                  onClick={() => onAccept(invite, false)}
                  disabled={isBusy}
                >
                  {t.invite.acceptCasual}
                </button>
              )}
              <button
                type="button"
                className="invite-toast-accept"
                onClick={() => onAccept(invite, invite.fromRanked)}
                disabled={isBusy}
              >
                {isBusy ? '…' : invite.fromRanked ? t.invite.acceptRanked : t.invite.accept}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
