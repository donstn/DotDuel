import { supabase, currentSupabaseUid } from '../supabase';

const STORAGE_KEY = 'dotduel:gameSessionId';

export interface GameSession {
  sessionId: string;
  claimedAt: number;
}

// Per-tab session id, generated once and stored in sessionStorage (cleared
// when the tab closes). Two tabs of the same browser get different ids.
export function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(STORAGE_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `s${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      sessionStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return `s${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  }
}

// Stale-session threshold. A claim is abandoned (other devices may take over)
// if claimedAt is older than this. Above the heartbeat so a brief tab-suspend
// doesn't free the lock, but short enough that a closed tab clears within ~45s.
const STALE_MS = 45_000;
const HEARTBEAT_MS = 15_000;

let heartbeatTimer: number | null = null;

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

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = window.setInterval(() => {
    void (async () => {
      const u = await sid();
      if (!u) return;
      const { error } = await supabase
        .from('game_sessions')
        .update({ claimed_at: Date.now() })
        .eq('uid', u);
      if (error) console.warn('gameSession heartbeat failed:', error.message);
    })();
  }, HEARTBEAT_MS);
}

// Claim the multiplayer game-session lock for this tab. Upserts game_sessions/
// {uid} with our sessionId, then heartbeats so other tabs can tell it's live.
export async function claimSession(_uid: string, sessionId: string): Promise<void> {
  const me = await sid();
  if (!me) throw new Error('claimSession: no Supabase session');
  const { error } = await supabase
    .from('game_sessions')
    .upsert({ uid: me, session_id: sessionId, claimed_at: Date.now() });
  if (error) throw new Error(error.message);
  startHeartbeat();
}

// Explicit release. Cancels the heartbeat and deletes the row so any other tab
// signed in as the same uid can claim immediately.
export async function releaseSession(_uid: string): Promise<void> {
  stopHeartbeat();
  const me = await sid();
  if (!me) return;
  const { error } = await supabase.from('game_sessions').delete().eq('uid', me);
  if (error) console.warn('releaseSession delete failed:', error.message);
}

export function watchSession(
  _uid: string,
  onChange: (s: GameSession | null) => void,
): () => void {
  let cancelled = false;
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let attached: string | null = null;

  const emit = async (me: string) => {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('session_id, claimed_at')
      .eq('uid', me)
      .maybeSingle();
    if (cancelled) return;
    if (error) {
      console.warn('watchSession error:', error.message);
      onChange(null);
      return;
    }
    if (!data) {
      onChange(null);
      return;
    }
    const claimedAt = Number(data.claimed_at ?? 0);
    // Treat stale claims as released — covers a crashed/disconnected tab that
    // never called releaseSession (no onDisconnect equivalent in Postgres).
    if (claimedAt > 0 && Date.now() - claimedAt > STALE_MS) {
      onChange(null);
      return;
    }
    onChange({ sessionId: String(data.session_id ?? ''), claimedAt });
  };

  const attach = (me: string | null) => {
    if (cancelled || !me || me === attached) return;
    attached = me;
    if (channel) {
      void supabase.removeChannel(channel);
      channel = null;
    }
    // Subscribe FIRST, then run the catch-up fetch on SUBSCRIBED so a takeover
    // that lands in the mount gap still bumps this tab.
    channel = supabase
      .channel(`session:${me}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_sessions', filter: `uid=eq.${me}` },
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
