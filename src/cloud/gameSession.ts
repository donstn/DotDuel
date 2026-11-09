import { supabase, currentSupabaseUid, SUPABASE_URL, SUPABASE_ANON_KEY } from '../supabase';
import { getDeviceId } from '../storage';

export interface GameSession {
  sessionId: string;
  claimedAt: number;
}

// Per-page-load session id `<deviceId>.<random>`, generated ONCE in memory.
// Deliberately NOT sessionStorage: a duplicated tab COPIES sessionStorage, so
// both tabs would share the same id and the one-device lock couldn't tell them
// apart. A reload therefore gets a NEW id — the device prefix plus the tab
// liveness ping below is what lets a reloaded tab take its own lock back
// instead of being shut out as "another device" (bugs.md, 2026-11-09).
let _sessionId: string | null = null;
export function getSessionId(): string {
  if (_sessionId) return _sessionId;
  const tab =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `s${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  _sessionId = `${getDeviceId()}.${tab}`;
  listenForPings();
  return _sessionId;
}

function isThisDevice(sessionId: string): boolean {
  return sessionId.startsWith(`${getDeviceId()}.`);
}

// Tabs of this browser answer "are you <sessionId>?" so a lock left by a tab
// that no longer exists (reloaded, closed, crashed) can be told apart from one
// held by a second open tab, which must keep it.
const PING_CHANNEL = 'dotduel:session-lock';
const PING_WAIT_MS = 400;
let pingChannel: BroadcastChannel | null = null;

function listenForPings() {
  if (pingChannel || typeof BroadcastChannel === 'undefined') return;
  pingChannel = new BroadcastChannel(PING_CHANNEL);
  pingChannel.onmessage = (e: MessageEvent) => {
    const m = e.data as { type?: string; sessionId?: string } | null;
    if (m?.type === 'ping' && m.sessionId === _sessionId) {
      pingChannel?.postMessage({ type: 'pong', sessionId: m.sessionId });
    }
  };
}

function isTabAlive(sessionId: string): Promise<boolean> {
  // Without BroadcastChannel we can't tell, so keep the old hard lock.
  if (typeof BroadcastChannel === 'undefined') return Promise.resolve(true);
  return new Promise((resolve) => {
    const ch = new BroadcastChannel(PING_CHANNEL);
    const done = (alive: boolean) => {
      window.clearTimeout(timer);
      ch.close();
      resolve(alive);
    };
    const timer = window.setTimeout(() => done(false), PING_WAIT_MS);
    ch.onmessage = (e: MessageEvent) => {
      const m = e.data as { type?: string; sessionId?: string } | null;
      if (m?.type === 'pong' && m.sessionId === sessionId) done(true);
    };
    ch.postMessage({ type: 'ping', sessionId });
  });
}

// Access token cached for the synchronous pagehide release below.
let accessToken: string | null = null;
void supabase.auth.getSession().then(({ data }) => {
  accessToken = data.session?.access_token ?? null;
});
supabase.auth.onAuthStateChange((_e, session) => {
  accessToken = session?.access_token ?? null;
});

// Release our lock when the page goes away (reload, close, navigation) so the
// next page — here or on another device — isn't locked out for STALE_MS.
// keepalive lets the request outlive the page. Filtered on our own session_id
// so it can never delete a lock another tab has since taken. Backgrounding the
// app does NOT fire pagehide, so a phone switching apps keeps its lock.
let releasedOnHide = false;
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    const me = currentSupabaseUid();
    if (heartbeatTimer === null || !me || !accessToken || !_sessionId) return;
    stopHeartbeat();
    releasedOnHide = true;
    const q = `uid=eq.${me}&session_id=eq.${encodeURIComponent(_sessionId)}`;
    fetch(`${SUPABASE_URL}/rest/v1/game_sessions?${q}`, {
      method: 'DELETE',
      keepalive: true,
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
    }).catch(() => {});
  });
  // Restored from the back/forward cache: the page is still in multiplayer, so
  // take the lock again.
  window.addEventListener('pageshow', (e: PageTransitionEvent) => {
    if (!e.persisted || !releasedOnHide || !_sessionId) return;
    releasedOnHide = false;
    void claimSession('', _sessionId).catch((err) =>
      console.warn('claimSession after bfcache restore failed:', err),
    );
  });
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
  let pollTimer: number | null = null;

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
    const holder = String(data.session_id ?? '');
    // A lock from THIS browser whose tab no longer answers was left by a reload
    // or a closed tab whose pagehide release didn't land: clear it so this page
    // isn't locked out of its own game. Other devices stay hard-locked.
    if (holder !== _sessionId && isThisDevice(holder) && !(await isTabAlive(holder))) {
      if (cancelled) return;
      const { error: delError } = await supabase
        .from('game_sessions')
        .delete()
        .eq('uid', me)
        .eq('session_id', holder);
      if (cancelled) return;
      if (delError) console.warn('dead-tab lock release failed:', delError.message);
      else {
        onChange(null);
        return;
      }
    }
    onChange({ sessionId: holder, claimedAt });
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
    // Passive staleness recovery: a closed/crashed holder stops heartbeating and
    // emits no Realtime events, so re-check on a timer too — otherwise another
    // tab would stay locked forever. Re-evaluates the stale cutoff every 15s, so
    // a dead holder's lock clears within ~STALE_MS.
    if (pollTimer !== null) window.clearInterval(pollTimer);
    pollTimer = window.setInterval(() => {
      if (!cancelled) void emit(me);
    }, 15_000);
  };

  void sid().then(attach);
  const { data: authSub } = supabase.auth.onAuthStateChange((_e, session) => {
    attach(session?.user?.id ?? null);
  });

  return () => {
    cancelled = true;
    authSub.subscription.unsubscribe();
    if (pollTimer !== null) window.clearInterval(pollTimer);
    if (channel) void supabase.removeChannel(channel);
  };
}
