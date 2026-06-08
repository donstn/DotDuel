import { supabase, currentSupabaseUid } from '../supabase';
import { trackEvent } from '../firebase';
import type { ShapeId } from '../types';
import type { TimeControl } from './matchmaking';

export interface Invite {
  inviteId: string;
  from: string;
  to: string;
  groupId: string;
  shape: ShapeId;
  timeControl: TimeControl;
  fromRanked: boolean;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
  createdAt: Date | null;
  expiresAt: number;
  matchId?: string;
}

interface InviteRow {
  id: string;
  from_uid: string;
  to_uid: string;
  group_id: string;
  shape: ShapeId;
  time_control: TimeControl;
  from_ranked: boolean;
  status: Invite['status'];
  created_at: string | null;
  expires_at: string | null;
  match_id: string | null;
}

async function sid(): Promise<string | null> {
  const cached = currentSupabaseUid();
  if (cached) return cached;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

function rowToInvite(row: InviteRow): Invite {
  return {
    inviteId: row.id,
    from: row.from_uid,
    to: row.to_uid,
    groupId: row.group_id,
    shape: row.shape,
    timeControl: row.time_control,
    fromRanked: row.from_ranked,
    status: row.status,
    createdAt: row.created_at ? new Date(row.created_at) : null,
    expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : 0,
    matchId: row.match_id ?? undefined,
  };
}

// Shared subscription: initial select + Realtime refetch on any invites change.
// expiresAt is filtered client-side (the cutoff moves every render).
function watchInvites(
  tag: string,
  column: 'to_uid' | 'from_uid',
  cb: (invites: Invite[]) => void,
): () => void {
  let cancelled = false;
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let attached: string | null = null;

  const emit = async (me: string) => {
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq(column, me)
      .eq('status', 'pending');
    if (cancelled) return;
    if (error) {
      console.warn(`${tag} error:`, error);
      cb([]);
      return;
    }
    const now = Date.now();
    const rows = (data ?? [])
      .map((r) => rowToInvite(r as InviteRow))
      .filter((inv) => !inv.expiresAt || inv.expiresAt >= now)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
    cb(rows);
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
        { event: '*', schema: 'public', table: 'invites' },
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

export function subscribeIncomingInvites(
  _myUid: string,
  cb: (invites: Invite[]) => void,
): () => void {
  return watchInvites('invites-in', 'to_uid', cb);
}

export function subscribeOutgoingInvites(
  _myUid: string,
  cb: (invites: Invite[]) => void,
): () => void {
  return watchInvites('invites-out', 'from_uid', cb);
}

export async function sendInvite(args: {
  toUids: string[];
  shape: ShapeId;
  timeControl: TimeControl;
  fromRanked: boolean;
}): Promise<{ groupId: string; sent: number }> {
  const { data, error } = await supabase.rpc('send_invite', {
    p_to_uids: args.toUids,
    p_shape: args.shape,
    p_time_control: args.timeControl,
    p_from_ranked: args.fromRanked,
  });
  if (error) throw new Error(error.message);
  const res = data as { groupId: string; sent: number };
  trackEvent('friend_invite_sent', {
    shape: args.shape,
    time_control: args.timeControl,
    ranked: args.fromRanked ? 'true' : 'false',
    recipient_count: res.sent,
  });
  return { groupId: res.groupId, sent: res.sent };
}

export async function acceptInvite(
  inviteId: string,
  ranked: boolean,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('accept-invite', {
    body: { inviteId, ranked },
  });
  if (error) throw new Error(error.message);
  const res = data as { ok: boolean; matchId: string; error?: string };
  if (!res?.ok) throw new Error(res?.error ?? 'Accept failed.');
  trackEvent('friend_invite_accepted', { ranked: ranked ? 'true' : 'false' });
  return res.matchId;
}

export async function declineInvite(inviteId: string): Promise<void> {
  const { error } = await supabase.rpc('decline_invite', { p_invite_id: inviteId });
  if (error) throw new Error(error.message);
}

export async function cancelInvite(inviteId: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_invite', { p_invite_id: inviteId });
  if (error) throw new Error(error.message);
}
