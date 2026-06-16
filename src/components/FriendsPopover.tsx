import { useEffect, useState } from 'react';
import type { Friend, PendingRequest } from '../cloud/friends';
import {
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  blockUser,
  sendFriendRequestByUsername,
} from '../cloud/friends';
import type { FriendStatus } from '../cloud/presence';
import { TellAFriendButton } from './TellAFriendButton';
import { useT } from '../i18n';

interface Props {
  myUid: string;
  /** Referral code for the invite link (random 6-char, never the uid). */
  refCode?: string | null;
  friends: Friend[];
  statusMap: Record<string, FriendStatus>;
  incoming: PendingRequest[];
  outgoing: PendingRequest[];
  onClose: () => void;
  onInvite: (friend: Friend) => void;
}

type Tab = 'online' | 'all' | 'requests';

export function FriendsPopover({
  myUid,
  refCode = null,
  friends,
  statusMap,
  incoming,
  outgoing,
  onClose,
  onInvite,
}: Props) {
  const t = useT();
  const [tab, setTab] = useState<Tab>(
    incoming.length > 0 ? 'requests' : 'online',
  );
  const [addInput, setAddInput] = useState('');
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onlineFriends = friends.filter(
    (f) => statusMap[f.uid] && statusMap[f.uid] !== 'offline',
  );

  const onSendRequest = async () => {
    const name = addInput.trim();
    if (!name) return;
    setAddBusy(true);
    setAddError(null);
    setAddSuccess(false);
    try {
      await sendFriendRequestByUsername(name);
      setAddInput('');
      setAddSuccess(true);
      window.setTimeout(() => setAddSuccess(false), 2500);
    } catch (e) {
      const msg =
        (e as { message?: string } | undefined)?.message ?? t.friends.requestFailed;
      setAddError(msg);
    } finally {
      setAddBusy(false);
    }
  };

  const onRemove = async (f: Friend) => {
    if (!window.confirm(t.friends.removeConfirm(f.displayName))) return;
    try {
      await removeFriend(f.friendshipId);
    } catch (e) {
      console.warn('removeFriend failed', e);
    }
  };

  const onBlock = async (f: Friend) => {
    if (!window.confirm(t.friends.blockConfirm(f.displayName))) {
      return;
    }
    try {
      await blockUser(f.uid);
    } catch (e) {
      console.warn('blockUser failed', e);
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
      aria-label={t.friends.aria}
    >
      <div className="rules-card friends-card">
        <button className="rules-close" onClick={onClose} aria-label={t.friends.close}>
          ✕
        </button>
        <header className="rules-header">
          <h2>{t.friends.title}</h2>
        </header>

        <div className="friends-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'online'}
            className={`friends-tab${tab === 'online' ? ' is-active' : ''}`}
            onClick={() => setTab('online')}
          >
            {t.friends.tabOnline} {onlineFriends.length > 0 && `(${onlineFriends.length})`}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'all'}
            className={`friends-tab${tab === 'all' ? ' is-active' : ''}`}
            onClick={() => setTab('all')}
          >
            {t.friends.tabAll} {friends.length > 0 && `(${friends.length})`}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'requests'}
            className={`friends-tab${tab === 'requests' ? ' is-active' : ''}`}
            onClick={() => setTab('requests')}
          >
            {t.friends.tabRequests}
            {incoming.length > 0 && (
              <span className="friends-tab-badge">{incoming.length}</span>
            )}
          </button>
        </div>

        <div className="friends-tab-body">
          {tab === 'online' && (
            <FriendList
              rows={onlineFriends}
              statusMap={statusMap}
              onInvite={onInvite}
              onRemove={onRemove}
              onBlock={onBlock}
              emptyText={t.friends.emptyOnline}
            />
          )}
          {tab === 'all' && (
            <FriendList
              rows={friends}
              statusMap={statusMap}
              onInvite={onInvite}
              onRemove={onRemove}
              onBlock={onBlock}
              emptyText={t.friends.emptyAll}
            />
          )}
          {tab === 'requests' && (
            <RequestsList
              myUid={myUid}
              incoming={incoming}
              outgoing={outgoing}
            />
          )}
        </div>

        <div className="friends-add">
          <label htmlFor="friend-add-input" className="friends-add-label">
            {t.friends.addByUsername}
          </label>
          <div className="friends-add-row">
            <input
              id="friend-add-input"
              type="text"
              className="friends-add-input"
              placeholder={t.friends.usernamePlaceholder}
              value={addInput}
              onChange={(e) => {
                setAddInput(e.target.value);
                setAddError(null);
              }}
              disabled={addBusy}
              maxLength={16}
              autoComplete="off"
            />
            <button
              type="button"
              className="friends-add-btn"
              onClick={onSendRequest}
              disabled={addBusy || !addInput.trim()}
            >
              {addBusy ? t.friends.sending : t.friends.send}
            </button>
          </div>
          {addError && <p className="friends-add-error">{addError}</p>}
          {addSuccess && <p className="friends-add-success">{t.friends.requestSent}</p>}
        </div>

        <div className="friends-tell-a-friend">
          <TellAFriendButton variant="invite" refCode={refCode} />
        </div>
      </div>
    </div>
  );
}

interface FriendListProps {
  rows: Friend[];
  statusMap: Record<string, FriendStatus>;
  onInvite: (f: Friend) => void;
  onRemove: (f: Friend) => void;
  onBlock: (f: Friend) => void;
  emptyText: string;
}

function FriendList({
  rows,
  statusMap,
  onInvite,
  onRemove,
  onBlock,
  emptyText,
}: FriendListProps) {
  const t = useT();
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);

  if (rows.length === 0) {
    return <p className="friends-empty">{emptyText}</p>;
  }
  return (
    <ul className="friends-list">
      {rows.map((f) => {
        const status = statusMap[f.uid] ?? 'offline';
        const canInvite = status === 'menu';
        return (
          <li key={f.friendshipId} className="friends-row">
            <div className="friends-row-main">
              <strong className="friends-row-name">{f.displayName}</strong>
              <span
                className={`friends-row-status status-${status}`}
                aria-label={t.friends.statusAria(t.friendStatus[status])}
              >
                {t.friendStatus[status]}
              </span>
            </div>
            <div className="friends-row-actions">
              <button
                type="button"
                className="friends-row-invite"
                onClick={() => onInvite(f)}
                disabled={!canInvite}
                title={canInvite ? t.friends.inviteToGame : t.friends.friendMustBeOnMenu}
              >
                {t.friends.invite}
              </button>
              <button
                type="button"
                className="friends-row-more"
                onClick={() =>
                  setMenuOpenFor(menuOpenFor === f.friendshipId ? null : f.friendshipId)
                }
                aria-label={t.friends.more}
              >
                ⋯
              </button>
              {menuOpenFor === f.friendshipId && (
                <div className="friends-row-menu" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpenFor(null);
                      void onRemove(f);
                    }}
                  >
                    {t.friends.removeFriend}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpenFor(null);
                      void onBlock(f);
                    }}
                  >
                    {t.friends.block}
                  </button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

interface RequestsListProps {
  myUid: string;
  incoming: PendingRequest[];
  outgoing: PendingRequest[];
}

function RequestsList({ incoming, outgoing }: RequestsListProps) {
  const t = useT();
  const [busy, setBusy] = useState<string | null>(null);

  if (incoming.length === 0 && outgoing.length === 0) {
    return <p className="friends-empty">{t.friends.noPending}</p>;
  }

  const onAccept = async (r: PendingRequest) => {
    setBusy(r.friendshipId);
    try {
      await acceptFriendRequest(r.friendshipId);
    } catch (e) {
      console.warn('acceptFriendRequest failed', e);
    } finally {
      setBusy(null);
    }
  };
  const onDecline = async (r: PendingRequest) => {
    setBusy(r.friendshipId);
    try {
      await declineFriendRequest(r.friendshipId);
    } catch (e) {
      console.warn('declineFriendRequest failed', e);
    } finally {
      setBusy(null);
    }
  };
  const onCancel = async (r: PendingRequest) => {
    setBusy(r.friendshipId);
    try {
      await declineFriendRequest(r.friendshipId);
    } catch (e) {
      console.warn('cancelOutgoing failed', e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="friends-requests">
      {incoming.length > 0 && (
        <>
          <h3 className="friends-requests-heading">{t.friends.incomingH}</h3>
          <ul className="friends-list">
            {incoming.map((r) => (
              <li key={r.friendshipId} className="friends-row">
                <div className="friends-row-main">
                  <strong className="friends-row-name">{r.otherDisplayName}</strong>
                  <span className="friends-row-status">{t.friends.wantsToBeFriends}</span>
                </div>
                <div className="friends-row-actions">
                  <button
                    type="button"
                    className="friends-row-accept"
                    onClick={() => onAccept(r)}
                    disabled={busy === r.friendshipId}
                  >
                    {t.friends.accept}
                  </button>
                  <button
                    type="button"
                    className="friends-row-decline"
                    onClick={() => onDecline(r)}
                    disabled={busy === r.friendshipId}
                  >
                    {t.friends.decline}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {outgoing.length > 0 && (
        <>
          <h3 className="friends-requests-heading">{t.friends.sentH}</h3>
          <ul className="friends-list">
            {outgoing.map((r) => (
              <li key={r.friendshipId} className="friends-row">
                <div className="friends-row-main">
                  <strong className="friends-row-name">{r.otherDisplayName}</strong>
                  <span className="friends-row-status">{t.friends.waitingForThem}</span>
                </div>
                <div className="friends-row-actions">
                  <button
                    type="button"
                    className="friends-row-cancel"
                    onClick={() => onCancel(r)}
                    disabled={busy === r.friendshipId}
                  >
                    {t.friends.cancel}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
