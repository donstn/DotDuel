import type { Difficulty, ShapeId } from '../types';
import { supabase, currentSupabaseUid } from '../supabase';

export type TimeControl = '1min' | '3min' | '5min';

export const TIME_CONTROLS: { id: TimeControl; label: string; per: string; sub: string }[] = [
  { id: '1min', label: 'Bullet', per: '1 minute per player', sub: 'Fast and frantic.' },
  { id: '3min', label: 'Blitz', per: '3 minutes per player', sub: 'Balanced default.' },
  { id: '5min', label: 'Rapid', per: '5 minutes per player', sub: 'Time to think.' },
];

export interface PairingDoc {
  matchId: string;
  shape: ShapeId | null;
  opponentUid: string;
  opponentDisplayName: string;
  opponentRating: number;
  player: 1 | 2;
  opponentIsBot: boolean;
  opponentBotLevel: Difficulty | null;
}

// Supabase tables key on the Supabase auth uuid; resolve it from the active
// session rather than trusting the uid passed by callers. (Edge Functions derive
// it from the JWT, so invoke/RPC calls are unaffected; only direct table access
// needs this.)
async function supaUid(): Promise<string | null> {
  const cached = currentSupabaseUid();
  if (cached) return cached;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

// No DB trigger on queue inserts, so the client drives matchmaking: invoke
// `matchmake` after joining, then a short retry while waiting. The pump
// self-terminates when it pairs OR when the queue row is gone (`not_in_queue`).
// watchPairing delivers the actual match via Realtime.
async function pumpMatchmake(): Promise<void> {
  const MAX_ATTEMPTS = 8;
  const INTERVAL_MS = 2000;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const { data, error } = await supabase.functions.invoke('matchmake');
    if (error) {
      console.warn('matchmake invoke failed:', error);
    } else {
      const res = data as { matched?: boolean; reason?: string } | null;
      if (res?.matched) return;
      if (res?.reason === 'not_in_queue') return;
    }
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
}

export async function joinQueue(
  _uid: string,
  rating: number,
  timeControl: TimeControl,
  shape: ShapeId = 'triangle',
): Promise<void> {
  const sid = await supaUid();
  if (!sid) throw new Error('joinQueue: no Supabase session');
  const { error } = await supabase
    .from('matchmaking_queue')
    .upsert(
      { uid: sid, rating, time_control: timeControl, shape, initial_range: 50 },
      { onConflict: 'uid' },
    );
  if (error) throw error;
  void pumpMatchmake();
}

// Ask the server to spawn a bot match for the caller now (they've waited long
// enough). Idempotent server-side: no-ops if already paired. request-bot-match
// picks the rating-closest bot, makes the human P1, writes the pairing — the
// client routes in via watchPairing exactly like a human match.
export async function requestBotMatch(): Promise<'human' | 'bot' | 'skip'> {
  const { data, error } = await supabase.functions.invoke('request-bot-match');
  if (error) {
    console.warn('request-bot-match failed:', error);
    return 'skip';
  }
  const matched = (data as { matched?: string } | null)?.matched;
  return matched === 'bot' ? 'bot' : matched === 'human' ? 'human' : 'skip';
}

export async function cancelQueue(_uid: string): Promise<void> {
  const sid = await supaUid();
  if (!sid) return;
  const { error } = await supabase.from('matchmaking_queue').delete().eq('uid', sid);
  if (error) console.warn('cancelQueue failed:', error);
}

export async function clearPairing(_uid: string): Promise<void> {
  const sid = await supaUid();
  if (!sid) return;
  const { error } = await supabase.from('pairings').delete().eq('uid', sid);
  if (error) console.warn('clearPairing failed:', error);
}

// Map a Postgres `pairings` row (snake_case) to the PairingDoc the app consumes.
function rowToPairing(row: Record<string, unknown>): PairingDoc {
  const isBot = row.opponent_is_bot === true;
  return {
    matchId: row.match_id as string,
    shape: (row.shape ?? null) as ShapeId | null,
    opponentUid: row.opponent_uid as string,
    opponentDisplayName: (row.opponent_display_name ?? 'Opponent') as string,
    opponentRating: (row.opponent_rating ?? 1000) as number,
    player: (row.player ?? 1) as 1 | 2,
    opponentIsBot: isBot,
    opponentBotLevel:
      isBot && typeof row.opponent_bot_level === 'number'
        ? (row.opponent_bot_level as Difficulty)
        : null,
  };
}

export function watchPairing(
  _uid: string,
  onPair: (p: PairingDoc | null) => void,
): () => void {
  let cancelled = false;
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let attachedSid: string | null = null;

  // The Supabase uuid may not be resolved when this mounts (the auth bridge can
  // finish after mount). Re-attach whenever the session resolves/changes so the
  // tab never sits on "searching" with no pairing subscription.
  const attach = (sid: string | null) => {
    if (cancelled || !sid || sid === attachedSid) return;
    attachedSid = sid;
    if (channel) {
      void supabase.removeChannel(channel);
      channel = null;
    }
    // Subscribe FIRST, then run the catch-up select once the channel is live —
    // closes the race where a pairing INSERT lands between an initial select and
    // the subscription attaching. The select only delivers a positive; "no row"
    // stays the default null, and clears come from DELETE events.
    channel = supabase
      .channel(`pairing:${sid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pairings', filter: `uid=eq.${sid}` },
        (payload) => {
          if (cancelled) return;
          if (payload.eventType === 'DELETE') {
            onPair(null);
            return;
          }
          onPair(rowToPairing(payload.new as Record<string, unknown>));
        },
      )
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED' || cancelled) return;
        void supabase
          .from('pairings')
          .select('*')
          .eq('uid', sid)
          .maybeSingle()
          .then(({ data, error }) => {
            if (cancelled) return;
            if (error) console.warn('watchPairing initial select error:', error);
            else if (data) onPair(rowToPairing(data));
          });
      });
  };

  void supaUid().then(attach);
  const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
    attach(session?.user?.id ?? null);
  });

  return () => {
    cancelled = true;
    authSub.subscription.unsubscribe();
    if (channel) void supabase.removeChannel(channel);
  };
}
