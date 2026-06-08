import {
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db } from '../firebase';
import type { Difficulty, ShapeId } from '../types';
import { CLIENT_SUPABASE_TRANSPORT } from '../types';
import { supabase, currentSupabaseUid } from '../supabase';

const functionsEW1 = getFunctions(app, 'europe-west1');
const callRequestBotMatch = httpsCallable<
  void,
  { matched: 'human' | 'bot' | 'skip' }
>(functionsEW1, 'requestBotMatch');

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

// The app's `user.uid` is the FIREBASE uid (28-char), but Supabase tables key
// on the Supabase auth uuid — a different identifier even for the same person
// (the dual-auth bridge mints a separate auth.users row). So every uid-keyed
// Supabase write/read must resolve the uuid from the active session, NOT trust
// the Firebase uid passed by callers. (Edge Functions derive it from the JWT, so
// invoke/RPC calls are unaffected; only direct table access needs this.)
async function supaUid(): Promise<string | null> {
  const cached = currentSupabaseUid();
  if (cached) return cached;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

// Supabase has no DB trigger on queue inserts (unlike Firebase's onQueueWrite),
// so the client drives matchmaking: invoke `matchmake` after joining, then a
// short retry while waiting. The pump self-terminates when it pairs OR when the
// queue row is gone (`not_in_queue` — cancelled, or already paired by the
// opponent's pump). watchPairing delivers the actual match via Realtime.
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
  uid: string,
  rating: number,
  timeControl: TimeControl,
): Promise<void> {
  if (CLIENT_SUPABASE_TRANSPORT) {
    const sid = await supaUid();
    if (!sid) throw new Error('joinQueue: no Supabase session');
    const { error } = await supabase
      .from('matchmaking_queue')
      .upsert(
        { uid: sid, rating, time_control: timeControl, initial_range: 50 },
        { onConflict: 'uid' },
      );
    if (error) throw error;
    void pumpMatchmake();
    return;
  }
  await setDoc(doc(db, 'matchmakingQueue', uid), {
    uid,
    rating,
    timeControl,
    joinedAt: serverTimestamp(),
    initialRange: 50,
  });
}

// Ask the server to spawn a bot match for the caller now (they've waited long
// enough on the matchmaking screen). Idempotent server-side: no-ops if the
// caller has already been paired. Returns who they got matched with, or 'skip'.
export async function requestBotMatch(): Promise<'human' | 'bot' | 'skip'> {
  if (CLIENT_SUPABASE_TRANSPORT) {
    // Bots aren't wired server-side yet (deferred). Use this 15s-mark fallback
    // as one more human-pairing attempt; report 'human' if it paired, else
    // 'skip' (never claim a bot we can't actually spawn).
    const { data, error } = await supabase.functions.invoke('matchmake');
    if (error) {
      console.warn('matchmake (bot fallback) failed:', error);
      return 'skip';
    }
    return (data as { matched?: boolean } | null)?.matched ? 'human' : 'skip';
  }
  const res = await callRequestBotMatch();
  return res.data.matched;
}

export async function cancelQueue(uid: string): Promise<void> {
  if (CLIENT_SUPABASE_TRANSPORT) {
    const sid = await supaUid();
    if (!sid) return;
    const { error } = await supabase.from('matchmaking_queue').delete().eq('uid', sid);
    if (error) console.warn('cancelQueue failed:', error);
    return;
  }
  try {
    await deleteDoc(doc(db, 'matchmakingQueue', uid));
  } catch (e) {
    console.warn('cancelQueue failed:', e);
  }
}

export async function clearPairing(uid: string): Promise<void> {
  if (CLIENT_SUPABASE_TRANSPORT) {
    const sid = await supaUid();
    if (!sid) return;
    const { error } = await supabase.from('pairings').delete().eq('uid', sid);
    if (error) console.warn('clearPairing failed:', error);
    return;
  }
  try {
    await deleteDoc(doc(db, 'pairings', uid));
  } catch (e) {
    console.warn('clearPairing failed:', e);
  }
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
  uid: string,
  onPair: (p: PairingDoc | null) => void,
): () => void {
  if (CLIENT_SUPABASE_TRANSPORT) {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    // The Supabase uuid must be resolved from the session (the `uid` arg is the
    // Firebase uid). Do it async, then attach the initial select + Realtime sub.
    void (async () => {
      const sid = await supaUid();
      if (!sid || cancelled) return;

      // Realtime delivers only changes; fetch the current pairing once first
      // (covers a pairing written before this subscription attached).
      const { data, error } = await supabase
        .from('pairings')
        .select('*')
        .eq('uid', sid)
        .maybeSingle();
      if (cancelled) return;
      if (error) console.warn('watchPairing initial select error:', error);
      else onPair(data ? rowToPairing(data) : null);

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
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }
  return onSnapshot(
    doc(db, 'pairings', uid),
    (snap) => {
      if (!snap.exists()) {
        onPair(null);
        return;
      }
      const data = snap.data();
      onPair({
        matchId: data.matchId,
        shape: (data.shape ?? null) as ShapeId | null,
        opponentUid: data.opponentUid,
        opponentDisplayName: data.opponentDisplayName ?? 'Opponent',
        opponentRating: data.opponentRating ?? 1000,
        player: (data.player ?? 1) as 1 | 2,
        opponentIsBot: data.opponentIsBot === true,
        opponentBotLevel:
          data.opponentIsBot === true && typeof data.opponentBotLevel === 'number'
            ? (data.opponentBotLevel as Difficulty)
            : null,
      });
    },
    (err) => {
      console.warn('watchPairing error:', err);
      onPair(null);
    },
  );
}
