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
  // "3 online" if any are online, else "Friends" with the total count
  // implied — keeps the chip short on phones.
  const label =
    onlineCount > 0
      ? `👥 ${onlineCount} online`
      : totalFriends > 0
        ? `👥 Friends`
        : `👥 Friends`;

  return (
    <button
      type="button"
      className="menu-auth-btn friends-btn"
      onClick={onClick}
      title={
        totalFriends === 0
          ? 'Add a friend'
          : `${onlineCount} of ${totalFriends} online`
      }
    >
      {label}
      {badgeCount > 0 && (
        <span className="friends-btn-badge" aria-label={`${badgeCount} new`}>
          {badgeCount > 9 ? '9+' : badgeCount}
        </span>
      )}
    </button>
  );
}
