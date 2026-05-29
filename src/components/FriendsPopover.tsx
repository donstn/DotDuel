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
import { statusLabel } from '../cloud/presence';
import { TellAFriendButton } from './TellAFriendButton';

interface Props {
  myUid: string;
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
  friends,
  statusMap,
  incoming,
  outgoing,
  onClose,
  onInvite,
}: Props) {
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
        (e as { message?: string } | undefined)?.message ?? 'Request failed.';
      setAddError(msg);
    } finally {
      setAddBusy(false);
    }
  };

  const onRemove = async (f: Friend) => {
    if (!window.confirm(`Remove ${f.displayName} from friends?`)) return;
    try {
      await removeFriend(f.friendshipId);
    } catch (e) {
      console.warn('removeFriend failed', e);
    }
  };

  const onBlock = async (f: Friend) => {
    if (
      !window.confirm(
        `Block ${f.displayName}? They won't be able to send you friend requests or game invites.`,
      )
    ) {
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
      aria-label="Friends"
    >
      <div className="rules-card friends-card">
        <button className="rules-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <header className="rules-header">
          <h2>Friends</h2>
        </header>

        <div className="friends-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'online'}
            className={`friends-tab${tab === 'online' ? ' is-active' : ''}`}
            onClick={() => setTab('online')}
          >
            Online {onlineFriends.length > 0 && `(${onlineFriends.length})`}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'all'}
            className={`friends-tab${tab === 'all' ? ' is-active' : ''}`}
            onClick={() => setTab('all')}
          >
            All {friends.length > 0 && `(${friends.length})`}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'requests'}
            className={`friends-tab${tab === 'requests' ? ' is-active' : ''}`}
            onClick={() => setTab('requests')}
          >
            Requests
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
              emptyText="No friends online right now."
            />
          )}
          {tab === 'all' && (
            <FriendList
              rows={friends}
              statusMap={statusMap}
              onInvite={onInvite}
              onRemove={onRemove}
              onBlock={onBlock}
              emptyText="No friends yet — add one below."
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
            Add a friend by username
          </label>
          <div className="friends-add-row">
            <input
              id="friend-add-input"
              type="text"
              className="friends-add-input"
              placeholder="username"
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
              {addBusy ? 'Sending…' : 'Send'}
            </button>
          </div>
          {addError && <p className="friends-add-error">{addError}</p>}
          {addSuccess && (
            <p className="friends-add-success">
              Request sent.
            </p>
          )}
        </div>

        <div className="friends-tell-a-friend">
          <TellAFriendButton myUid={myUid} />
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
                aria-label={`Status: ${statusLabel(status)}`}
              >
                {statusLabel(status)}
              </span>
            </div>
            <div className="friends-row-actions">
              <button
                type="button"
                className="friends-row-invite"
                onClick={() => onInvite(f)}
                disabled={!canInvite}
                title={canInvite ? 'Invite to a game' : 'Friend must be on menu'}
              >
                Invite
              </button>
              <button
                type="button"
                className="friends-row-more"
                onClick={() =>
                  setMenuOpenFor(menuOpenFor === f.friendshipId ? null : f.friendshipId)
                }
                aria-label="More"
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
                    Remove friend
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpenFor(null);
                      void onBlock(f);
                    }}
                  >
                    Block
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
  const [busy, setBusy] = useState<string | null>(null);

  if (incoming.length === 0 && outgoing.length === 0) {
    return <p className="friends-empty">No pending requests.</p>;
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
          <h3 className="friends-requests-heading">Incoming</h3>
          <ul className="friends-list">
            {incoming.map((r) => (
              <li key={r.friendshipId} className="friends-row">
                <div className="friends-row-main">
                  <strong className="friends-row-name">{r.otherDisplayName}</strong>
                  <span className="friends-row-status">wants to be friends</span>
                </div>
                <div className="friends-row-actions">
                  <button
                    type="button"
                    className="friends-row-accept"
                    onClick={() => onAccept(r)}
                    disabled={busy === r.friendshipId}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="friends-row-decline"
                    onClick={() => onDecline(r)}
                    disabled={busy === r.friendshipId}
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {outgoing.length > 0 && (
        <>
          <h3 className="friends-requests-heading">Sent</h3>
          <ul className="friends-list">
            {outgoing.map((r) => (
              <li key={r.friendshipId} className="friends-row">
                <div className="friends-row-main">
                  <strong className="friends-row-name">{r.otherDisplayName}</strong>
                  <span className="friends-row-status">waiting for them</span>
                </div>
                <div className="friends-row-actions">
                  <button
                    type="button"
                    className="friends-row-cancel"
                    onClick={() => onCancel(r)}
                    disabled={busy === r.friendshipId}
                  >
                    Cancel
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
