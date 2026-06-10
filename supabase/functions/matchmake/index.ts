// Pairs the caller with a compatible waiting player (rating-range expansion),
// creates the game + both pairing rows, clears the queue. Called by the client
// right after it joins the queue, and again on a short retry while waiting.
// (Bots / fallback sweep / shape-unlock come later — MVP is human-vs-human on
// triangle.)
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const TIME_CONTROL_MS: Record<string, number> = {
  '1min': 60000,
  '3min': 180000,
  '5min': 300000,
};
const RANGE_PER_SECOND = 25;
const MAX_RANGE = 500;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// deno-lint-ignore no-explicit-any
type Row = any;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const {
      data: { user },
      error: uErr,
    } = await admin.auth.getUser(jwt);
    if (uErr || !user) return json({ error: 'UNAUTHENTICATED' }, 401);
    const uid = user.id;

    const { data: me } = await admin
      .from('matchmaking_queue')
      .select('*')
      .eq('uid', uid)
      .maybeSingle();
    if (!me) return json({ matched: false, reason: 'not_in_queue' });

    // NOTE: filter time_control in JS, NOT via .eq(). time_control is a jsonb
    // column storing a bare string ("3min"); PostgREST's `eq.3min` tries to cast
    // `3min` to json and errors (22P02), silently emptying the candidate list.
    const { data: allOthers } = await admin
      .from('matchmaking_queue')
      .select('*')
      .neq('uid', uid);
    const others = (allOthers ?? []).filter(
      (o: Row) => o.time_control === me.time_control && o.shape === me.shape,
    );

    const now = Date.now();
    const rangeOf = (r: Row) => {
      const t = (now - new Date(r.joined_at).getTime()) / 1000;
      return Math.min(MAX_RANGE, (r.initial_range ?? 50) + RANGE_PER_SECOND * t);
    };
    const myRange = rangeOf(me);

    let best: Row | null = null;
    let bestDelta = Infinity;
    for (const o of others ?? []) {
      const delta = Math.abs((me.rating ?? 1000) - (o.rating ?? 1000));
      if (delta <= Math.max(myRange, rangeOf(o)) && delta < bestDelta) {
        best = o;
        bestDelta = delta;
      }
    }
    if (!best) return json({ matched: false });

    // P1 (first mover) is a coin flip, so over many matches each player is P1
    // ~50% of the time. This matters because a shape can favour the first or
    // second mover (e.g. triangle favours P2). Rematches then alternate from
    // here (see set_rematch / spawn_rematch), so a pair trades sides game to
    // game. Was previously join-order based, which skewed toward whoever waited
    // longer in the queue. Both clients read p1_uid/p2_uid off the created game
    // row, so they agree regardless of which side won the coin flip.
    const meFirst = Math.random() < 0.5;
    const p1 = meFirst ? me : best;
    const p2 = meFirst ? best : me;

    const timeControl = me.time_control;
    const totalMs = TIME_CONTROL_MS[timeControl] ?? 180000;
    const shape = me.shape ?? 'triangle';

    const initialState = {
      shape,
      mode: 'multiplayer',
      current: 1,
      turn: 0,
      colored: {},
      completed: [],
      pending: [],
      scores: { 1: 0, 2: 0 },
      finished: false,
      winner: null,
    };
    const clock = {
      p1RemainingMs: totalMs,
      p2RemainingMs: totalMs,
      turnStartedAt: 0,
      current: 1,
      totalMs,
    };

    const { data: game, error: gErr } = await admin
      .from('games')
      .insert({
        p1_uid: p1.uid,
        p2_uid: p2.uid,
        shape,
        time_control: timeControl,
        status: 'active',
        state: initialState,
        clock,
        ready: {},
        board_loaded: {},
        rematch: {},
      })
      .select('id')
      .single();
    if (gErr) return json({ error: 'CREATE_FAILED', detail: gErr.message }, 500);

    const { data: profs } = await admin
      .from('profiles')
      .select('id, display_name, rating')
      .in('id', [p1.uid, p2.uid]);
    const pm: Record<string, Row> = Object.fromEntries(
      (profs ?? []).map((p: Row) => [p.id, p]),
    );

    await admin.from('pairings').upsert([
      {
        uid: p1.uid,
        match_id: game.id,
        shape,
        player: 1,
        opponent_uid: p2.uid,
        opponent_display_name: pm[p2.uid]?.display_name ?? 'Opponent',
        opponent_rating: pm[p2.uid]?.rating ?? 1000,
        opponent_is_bot: false,
      },
      {
        uid: p2.uid,
        match_id: game.id,
        shape,
        player: 2,
        opponent_uid: p1.uid,
        opponent_display_name: pm[p1.uid]?.display_name ?? 'Opponent',
        opponent_rating: pm[p1.uid]?.rating ?? 1000,
        opponent_is_bot: false,
      },
    ]);

    await admin
      .from('matchmaking_queue')
      .delete()
      .in('uid', [p1.uid, p2.uid]);

    return json({ matched: true, matchId: game.id });
  } catch (e) {
    return json({ error: 'INTERNAL', detail: String(e) }, 500);
  }
});
