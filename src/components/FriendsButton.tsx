import { useT } from '../i18n';

interface Props {
  onlineCount: number;
  totalFriends: number;
  badgeCount: number; // pending requests + incoming invites (not yet viewed)
  onClick: () => void;
}

export function FriendsButton({
  onlineCount,
  totalFriends,
  badgeCount,
  onClick,
}: Props) {
  const t = useT();
  // "3 online" if any are online, else "Friends" with the total count
  // implied — keeps the chip short on phones.
  const label = onlineCount > 0 ? t.friends.online(onlineCount) : t.friends.friends;

  return (
    <button
      type="button"
      className="menu-auth-btn friends-btn"
      onClick={onClick}
      title={
        totalFriends === 0
          ? t.friends.addFriendTitle
          : t.friends.onlineOfTotal(onlineCount, totalFriends)
      }
    >
      {label}
      {badgeCount > 0 && (
        <span className="friends-btn-badge" aria-label={t.friends.newBadge(badgeCount)}>
          {badgeCount > 9 ? '9+' : badgeCount}
        </span>
      )}
    </button>
  );
}
