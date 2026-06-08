import type { ShapeId } from '../types';
import type { TimeControl } from './matchmaking';
import { supabase, currentSupabaseUid } from '../supabase';

export type MatchFinishedReason =
  | 'normal'
  | 'timeout'
  | 'resign'
  | 'disconnect'
  | 'aborted';

export interface MatchRecord {
  matchId: string;
  shape: ShapeId;
  timeControl: TimeControl;
  status: 'created' | 'finished';
  winner: 1 | 2 | 'draw' | null;
  finishedReason: MatchFinishedReason | null;
  finishedAt: number;
  gameStartedAt: number;
  durationMs: number;
  ranked: boolean;
  p1Uid: string;
  p2Uid: string;
  p1Display: string;
  p2Display: string;
  p1ScoreFinal: number;
  p2ScoreFinal: number;
  p1RatingBefore: number;
  p2RatingBefore: number;
  p1RatingAfter: number;
  p2RatingAfter: number;
  p1RatingDelta: number;
  p2RatingDelta: number;
  eloFinalized: boolean;
}

// Supabase `matches` row (snake_case) → MatchRecord. winner is stored as text
// ('1'|'2'|'draw'|null); map back to the numeric union the UI expects.
function shapeSupabase(d: Record<string, unknown>): MatchRecord {
  const w = d.winner;
  const winner: MatchRecord['winner'] =
    w === '1' || w === 1 ? 1 : w === '2' || w === 2 ? 2 : w === 'draw' ? 'draw' : null;
  const ms = (v: unknown) =>
    typeof v === 'string' ? Date.parse(v) || 0 : typeof v === 'number' ? v : 0;
  return {
    matchId: (d.id ?? '') as string,
    shape: (d.shape ?? 'square') as ShapeId,
    timeControl: (d.time_control ?? '3min') as TimeControl,
    status: (d.status ?? 'finished') as 'created' | 'finished',
    winner,
    finishedReason: (d.finished_reason ?? null) as MatchRecord['finishedReason'],
    finishedAt: ms(d.finished_at),
    gameStartedAt: ms(d.game_started_at),
    durationMs: typeof d.duration_ms === 'number' ? d.duration_ms : 0,
    ranked: d.ranked !== false,
    p1Uid: (d.p1_uid ?? '') as string,
    p2Uid: (d.p2_uid ?? '') as string,
    p1Display: (d.p1_display ?? 'Player 1') as string,
    p2Display: (d.p2_display ?? 'Player 2') as string,
    p1ScoreFinal: typeof d.p1_score_final === 'number' ? d.p1_score_final : 0,
    p2ScoreFinal: typeof d.p2_score_final === 'number' ? d.p2_score_final : 0,
    p1RatingBefore: typeof d.p1_rating_before === 'number' ? d.p1_rating_before : 1000,
    p2RatingBefore: typeof d.p2_rating_before === 'number' ? d.p2_rating_before : 1000,
    p1RatingAfter: typeof d.p1_rating_after === 'number' ? d.p1_rating_after : 1000,
    p2RatingAfter: typeof d.p2_rating_after === 'number' ? d.p2_rating_after : 1000,
    p1RatingDelta: typeof d.p1_rating_delta === 'number' ? d.p1_rating_delta : 0,
    p2RatingDelta: typeof d.p2_rating_delta === 'number' ? d.p2_rating_delta : 0,
    eloFinalized: d.elo_finalized === true,
  };
}

async function matchesSid(): Promise<string | null> {
  const cached = currentSupabaseUid();
  if (cached) return cached;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export function watchMatch(
  matchId: string,
  onChange: (m: MatchRecord | null) => void,
): () => void {
  let cancelled = false;
  const fetchOne = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .maybeSingle();
    if (cancelled) return;
    if (error) {
      console.warn('watchMatch (supabase) error:', error);
      return;
    }
    onChange(data ? shapeSupabase(data) : null);
  };
  void fetchOne();
  const channel = supabase
    .channel(`match:${matchId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
      () => {
        if (!cancelled) void fetchOne();
      },
    )
    .subscribe();
  return () => {
    cancelled = true;
    void supabase.removeChannel(channel);
  };
}

export function watchRecentMatches(
  _uid: string,
  onChange: (matches: MatchRecord[]) => void,
  max: number = 5,
): () => void {
  let cancelled = false;
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let attachedSid: string | null = null;
  const fetchMine = async (sid: string) => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .contains('player_uids', [sid])
      .order('finished_at', { ascending: false })
      .limit(max);
    if (cancelled) return;
    if (error) {
      console.warn('watchRecentMatches (supabase) error:', error);
      onChange([]);
      return;
    }
    onChange((data ?? []).map(shapeSupabase));
  };
  const attach = (sid: string | null) => {
    if (cancelled || !sid || sid === attachedSid) return;
    attachedSid = sid;
    void fetchMine(sid);
    if (!channel) {
      // No array-contains filter in Realtime; subscribe broadly and re-run the
      // query (match volume is low). RLS still limits what the re-query reads.
      channel = supabase
        .channel('my-matches')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'matches' },
          () => {
            if (!cancelled && attachedSid) void fetchMine(attachedSid);
          },
        )
        .subscribe();
    }
  };
  void matchesSid().then(attach);
  const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
    attach(session?.user?.id ?? null);
  });
  return () => {
    cancelled = true;
    authSub.subscription.unsubscribe();
    if (channel) void supabase.removeChannel(channel);
  };
}

// Derived view from the perspective of `me`. Useful for rendering rows.
export interface MatchPerspective {
  opponentUid: string;
  opponentDisplay: string;
  myScore: number;
  opponentScore: number;
  myRatingBefore: number;
  myRatingAfter: number;
  myRatingDelta: number;
  result: 'win' | 'loss' | 'draw';
}

export function fromMyPerspective(m: MatchRecord, me: string): MatchPerspective {
  const iAmP1 = m.p1Uid === me;
  const opponentUid = iAmP1 ? m.p2Uid : m.p1Uid;
  const opponentDisplay = iAmP1 ? m.p2Display : m.p1Display;
  const myScore = iAmP1 ? m.p1ScoreFinal : m.p2ScoreFinal;
  const opponentScore = iAmP1 ? m.p2ScoreFinal : m.p1ScoreFinal;
  const myRatingBefore = iAmP1 ? m.p1RatingBefore : m.p2RatingBefore;
  const myRatingAfter = iAmP1 ? m.p1RatingAfter : m.p2RatingAfter;
  const myRatingDelta = iAmP1 ? m.p1RatingDelta : m.p2RatingDelta;
  let result: 'win' | 'loss' | 'draw' = 'draw';
  if (m.winner === 'draw' || m.winner == null) result = 'draw';
  else if ((iAmP1 && m.winner === 1) || (!iAmP1 && m.winner === 2)) result = 'win';
  else result = 'loss';
  return {
    opponentUid,
    opponentDisplay,
    myScore,
    opponentScore,
    myRatingBefore,
    myRatingAfter,
    myRatingDelta,
    result,
  };
}
