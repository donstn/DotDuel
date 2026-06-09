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
export interface FriendData {
  friends: Friend[];
  incoming: PendingRequest[]; // requests sent TO me
  outgoing: PendingRequest[]; // requests I sent
}

// ONE subscription on `friendships` that derives friends + incoming + outgoing
// from a single fetch/channel. Consolidated deliberately: opening three separate
// postgres_changes channels on the same table is unreliable in Supabase Realtime
// (some channels may never reach SUBSCRIBED, so their list silently stays empty —
// the "incoming friend request never appears" bug). Fetches immediately on attach
// (so the data loads even if the channel is slow/never subscribes), again on
// SUBSCRIBED (catch-up for the mount-gap race), and on every change.
export function subscribeFriendData(
  _myUid: string,
  cb: (data: FriendData) => void,
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
      console.warn('subscribeFriendData error:', error);
      return; // keep the last good lists rather than blanking them on a transient error
    }
    const rows = (data ?? []) as FriendshipRow[];
    const friends = rows
      .filter((r) => r.status === 'accepted')
      .map((r) => rowToFriend(r, me))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
    const incoming = rows
      .filter((r) => r.status === 'pending' && r.requested_by !== me)
      .map((r) => rowToPending(r, me));
    const outgoing = rows
      .filter((r) => r.status === 'pending' && r.requested_by === me)
      .map((r) => rowToPending(r, me));
    cb({ friends, incoming, outgoing });
  };

  const attach = (me: string | null) => {
    if (cancelled || !me || me === attached) return;
    attached = me;
    if (channel) {
      void supabase.removeChannel(channel);
      channel = null;
    }
    void emit(me); // immediate load — don't depend solely on SUBSCRIBED firing
    channel = supabase
      .channel(`frienddata:${me}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships' },
        () => {
          if (!cancelled) void emit(me);
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && !cancelled) void emit(me);
      });
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
