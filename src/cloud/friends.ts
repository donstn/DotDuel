import { supabase, currentSupabaseUid } from '../supabase';

export interface Friend {
  friendshipId: string;
  uid: string; // the OTHER user's uid
  displayName: string;
}

export interface PendingRequest {
  friendshipId: string;
  otherUid: string; // the other party (requester for incoming, target for outgoing)
  otherDisplayName: string;
  requestedAt: Date | null;
}

interface FriendshipRow {
  id: string;
  uid_a: string;
  uid_b: string;
  status: string;
  requested_by: string;
  requested_at: string | null;
  accepted_at: string | null;
  display_names: Record<string, string> | null;
}

// Resolve the Supabase auth uuid (tables key on it, not the Firebase uid).
async function sid(): Promise<string | null> {
  const cached = currentSupabaseUid();
  if (cached) return cached;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

function otherOf(row: FriendshipRow, me: string): string {
  return row.uid_a === me ? row.uid_b : row.uid_a;
}

function rowToFriend(row: FriendshipRow, me: string): Friend {
  const other = otherOf(row, me);
  return {
    friendshipId: row.id,
    uid: other,
    displayName: row.display_names?.[other] ?? 'Player',
  };
}

function rowToPending(row: FriendshipRow, me: string): PendingRequest {
  const other = otherOf(row, me);
  return {
    friendshipId: row.id,
    otherUid: other,
    otherDisplayName: row.display_names?.[other] ?? 'Player',
    requestedAt: row.requested_at ? new Date(row.requested_at) : null,
  };
}

// Shared subscription: initial select + Realtime refetch on any friendships
// change (RLS limits delivered rows to the user's own friendships). The
// Supabase uuid may not be ready at mount, so (re)attach on auth state.
function watchFriendships<T>(
  tag: string,
  build: (me: string, rows: FriendshipRow[]) => T[],
  cb: (rows: T[]) => void,
): () => void {
  let cancelled = false;
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let attached: string | null = null;

  const emit = async (me: string) => {
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`uid_a.eq.${me},uid_b.eq.${me}`);
    if (cancelled) return;
    if (error) {
      console.warn(`${tag} error:`, error);
      cb([]);
      return;
    }
    cb(build(me, (data ?? []) as FriendshipRow[]));
  };

  const attach = (me: string | null) => {
    if (cancelled || !me || me === attached) return;
    attached = me;
    if (channel) {
      void supabase.removeChannel(channel);
      channel = null;
    }
    void emit(me);
    channel = supabase
      .channel(`${tag}:${me}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships' },
        () => {
          if (!cancelled) void emit(me);
        },
      )
      .subscribe();
  };

  void sid().then(attach);
  const { data: authSub } = supabase.auth.onAuthStateChange((_e, session) => {
    attach(session?.user?.id ?? null);
  });

  return () => {
    cancelled = true;
    authSub.subscription.unsubscribe();
    if (channel) void supabase.removeChannel(channel);
  };
}

export function subscribeFriends(
  _myUid: string,
  cb: (friends: Friend[]) => void,
): () => void {
  return watchFriendships(
    'friends',
    (me, rows) => {
      const arr = rows
        .filter((r) => r.status === 'accepted')
        .map((r) => rowToFriend(r, me));
      arr.sort((a, b) => a.displayName.localeCompare(b.displayName));
      return arr;
    },
    cb,
  );
}

export function subscribeIncomingRequests(
  _myUid: string,
  cb: (rows: PendingRequest[]) => void,
): () => void {
  return watchFriendships(
    'friends-in',
    (me, rows) =>
      rows
        .filter((r) => r.status === 'pending' && r.requested_by !== me)
        .map((r) => rowToPending(r, me)),
    cb,
  );
}

export function subscribeOutgoingRequests(
  _myUid: string,
  cb: (rows: PendingRequest[]) => void,
): () => void {
  return watchFriendships(
    'friends-out',
    (me, rows) =>
      rows
        .filter((r) => r.status === 'pending' && r.requested_by === me)
        .map((r) => rowToPending(r, me)),
    cb,
  );
}

async function rpc(fn: string, args: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
}

export async function sendFriendRequestByUsername(username: string): Promise<void> {
  await rpc('send_friend_request', { target_username: username });
}

export async function sendFriendRequestByUid(uid: string): Promise<void> {
  await rpc('send_friend_request', { target_uid: uid });
}

export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  await rpc('accept_friend_request', { p_friendship_id: friendshipId });
}

export async function declineFriendRequest(friendshipId: string): Promise<void> {
  await rpc('decline_friend_request', { p_friendship_id: friendshipId });
}

export async function removeFriend(friendshipId: string): Promise<void> {
  await rpc('remove_friend', { p_friendship_id: friendshipId });
}

export async function blockUser(blockedUid: string): Promise<void> {
  await rpc('block_user', { p_blocked: blockedUid });
}

export async function unblockUser(blockedUid: string): Promise<void> {
  await rpc('unblock_user', { p_blocked: blockedUid });
}
