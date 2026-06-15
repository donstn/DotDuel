import { supabase, currentSupabaseUid } from '../supabase';

export type PresenceStatus =
  | 'menu'
  | 'in-ai'
  | 'in-hotseat'
  | 'in-ranked'
  | 'searching-ranked'
  | 'in-daily';

export type FriendStatus = PresenceStatus | 'offline';

interface PresenceRow {
  uid: string;
  status?: PresenceStatus | null;
  status_updated_at?: string | null;
  last_seen?: string | null;
}

// How long a presence record stays "fresh" before friends treat it as offline.
// Slightly above the heartbeat interval (60s) so a brief blip doesn't flicker.
const STALE_MS = 90_000;
const HEARTBEAT_MS = 60_000;

let lastWrittenStatus: PresenceStatus | null = null;
let heartbeatTimer: number | null = null;
let presenceEnabled = true;

async function sid(): Promise<string | null> {
  const cached = currentSupabaseUid();
  if (cached) return cached;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

function stopHeartbeat() {
  if (heartbeatTimer !== null) {
    window.clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

// Settings → Privacy → "Show my status to friends". When OFF, no presence
// writes happen and friends see this user as offline.
export function setPresenceEnabled(enabled: boolean): void {
  presenceEnabled = enabled;
  if (!enabled) {
    stopHeartbeat();
    lastWrittenStatus = null;
  }
}

export async function setPresenceStatus(
  _uid: string,
  status: PresenceStatus,
): Promise<void> {
  if (!presenceEnabled) return;
  if (lastWrittenStatus === status) return; // heartbeat keeps lastSeen alive
  lastWrittenStatus = status;
  const me = await sid();
  if (!me) return;
  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from('presence')
    .upsert({ uid: me, status, status_updated_at: nowIso, last_seen: nowIso });
  if (error) console.warn('setPresenceStatus failed:', error.message);

  if (heartbeatTimer === null) {
    heartbeatTimer = window.setInterval(() => {
      if (!presenceEnabled) return;
      void (async () => {
        const u = await sid();
        if (!u) return;
        const { error: e } = await supabase
          .from('presence')
          .update({ last_seen: new Date().toISOString() })
          .eq('uid', u);
        if (e) console.warn('presence heartbeat failed:', e.message);
      })();
    }, HEARTBEAT_MS);
  }
}

export function stopPresence(): void {
  stopHeartbeat();
  lastWrittenStatus = null;
}

// Explicitly mark offline NOW (before sign-out) so friends see it instantly
// instead of waiting out STALE_MS. Writes an epoch last_seen which immediately
// fails the staleness check. Must run BEFORE auth sign-out (owner-write RLS).
export async function markPresenceOffline(_uid: string): Promise<void> {
  stopHeartbeat();
  lastWrittenStatus = null;
  const me = await sid();
  if (!me) return;
  const { error } = await supabase
    .from('presence')
    .update({ last_seen: '1970-01-01T00:00:00Z' })
    .eq('uid', me);
  if (error) console.warn('markPresenceOffline failed:', error.message);
}

function effectiveStatus(row: PresenceRow | undefined): FriendStatus {
  if (!row?.status) return 'offline';
  const tsRaw = row.last_seen ?? row.status_updated_at;
  const ts = tsRaw ? new Date(tsRaw).getTime() : 0;
  if (Date.now() - ts > STALE_MS) return 'offline';
  return row.status;
}

// Live subscription to friends' presence rows (RLS lets us read rows that list
// us in friend_uids). Returns a map { uid → status }, refetched on any change.
export function subscribePresence(
  uidList: string[],
  cb: (map: Record<string, FriendStatus>) => void,
): () => void {
  if (uidList.length === 0) {
    cb({});
    return () => {};
  }
  let cancelled = false;

  const emit = async () => {
    const next: Record<string, FriendStatus> = {};
    for (const u of uidList) next[u] = 'offline';
    const { data, error } = await supabase
      .from('presence')
      .select('uid, status, status_updated_at, last_seen')
      .in('uid', uidList);
    if (cancelled) return;
    if (!error) {
      for (const row of (data ?? []) as PresenceRow[]) {
        next[row.uid] = effectiveStatus(row);
      }
    } else {
      console.warn('subscribePresence error:', error.message);
    }
    cb(next);
  };

  // Immediate load + catch-up on SUBSCRIBED (don't depend solely on SUBSCRIBED
  // firing) + refetch on every change.
  void emit();
  const channel = supabase
    .channel(`presence:${uidList.slice(0, 3).join('-')}:${uidList.length}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'presence' },
      () => {
        if (!cancelled) void emit();
      },
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED' && !cancelled) void emit();
    });

  return () => {
    cancelled = true;
    void supabase.removeChannel(channel);
  };
}

export function statusLabel(s: FriendStatus): string {
  switch (s) {
    case 'menu':
      return 'On menu';
    case 'in-ai':
      return 'Vs Bots';
    case 'in-hotseat':
      return 'Hot-seat';
    case 'in-ranked':
      return 'Ranked match';
    case 'searching-ranked':
      return 'Searching…';
    case 'in-daily':
      return "Today's puzzle";
    case 'offline':
      return 'Offline';
  }
}
