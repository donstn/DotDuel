// Spawns a bot match on demand for a human waiting in the queue (the client's
// ~15s "no human found" fallback). Port of Firebase spawnBotMatch: picks the
// rating-closest active bot, creates the game with HUMAN = P1 / BOT = P2 (so the
// human always moves first and the bot only ever moves in response — no
// "bot moves first" trigger needed), pre-marks the bot ready + board-loaded so
// the clock starts as soon as the human's board loads, and writes the human's
// pairing row (opponent_is_bot = true). MVP shape: triangle, matching matchmake.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const TIME_CONTROL_MS: Record<string, number> = {
  '1min': 60000,
  '3min': 180000,
  '5min': 300000,
};

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

    // Must still be queued (else they were paired with a human, or cancelled).
    const { data: me } = await admin
      .from('matchmaking_queue')
      .select('*')
      .eq('uid', uid)
      .maybeSingle();
    if (!me) return json({ matched: 'skip', reason: 'not_in_queue' });

    const humanRating = me.rating ?? 1000;
    const timeControl = me.time_control;

    // Active bots + their live ratings (ratings float in profiles).
    const { data: bots } = await admin
      .from('bots')
      .select('uid, display_name, bot_level, active')
      .eq('active', true);
    if (!bots || bots.length === 0) return json({ matched: 'skip', reason: 'no_bots' });

    const { data: botProfiles } = await admin
      .from('profiles')
      .select('id, display_name, rating')
      .in('id', bots.map((b: Row) => b.uid));
    const profById: Record<string, Row> = Object.fromEntries(
      (botProfiles ?? []).map((p: Row) => [p.id, p]),
    );

    const candidates = bots.map((b: Row) => ({
      uid: b.uid,
      level: b.bot_level,
      displayName: profById[b.uid]?.display_name ?? b.display_name ?? 'Bot',
      rating: profById[b.uid]?.rating ?? 1000,
    }));
    candidates.sort(
      (a: Row, c: Row) =>
        Math.abs(a.rating - humanRating) - Math.abs(c.rating - humanRating),
    );
    // Pick uniformly among bots within 100 Elo of the closest, so the same user
    // doesn't always face the same bot.
    const bestDelta = Math.abs(candidates[0].rating - humanRating);
    const pool = candidates.filter(
      (c: Row) => Math.abs(Math.abs(c.rating - humanRating) - bestDelta) <= 100,
    );
    const bot = pool[Math.floor(Math.random() * pool.length)];

    // Claim the queue slot atomically: if the delete affects no row, a human
    // matchmake already paired this player — bail.
    const { data: claimed } = await admin
      .from('matchmaking_queue')
      .delete()
      .eq('uid', uid)
      .select('uid');
    if (!claimed || claimed.length === 0) {
      return json({ matched: 'skip', reason: 'already_paired' });
    }

    const shape = 'triangle'; // MVP, matches matchmake
    const totalMs = TIME_CONTROL_MS[timeControl] ?? 180000;

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
        p1_uid: uid,
        p2_uid: bot.uid,
        shape,
        time_control: timeControl,
        status: 'active',
        state: initialState,
        clock,
        // Bot is pre-readied AND pre-board-loaded: the clock starts as soon as
        // the human's client acks board_loaded[1] = true (set_board_loaded).
        ready: { '2': true },
        board_loaded: { '2': true },
        rematch: {},
      })
      .select('id')
      .single();
    if (gErr) return json({ error: 'CREATE_FAILED', detail: gErr.message }, 500);

    await admin.from('pairings').upsert({
      uid,
      match_id: game.id,
      shape,
      player: 1,
      opponent_uid: bot.uid,
      opponent_display_name: bot.displayName,
      opponent_rating: bot.rating,
      opponent_is_bot: true,
      opponent_bot_level: bot.level,
    });

    return json({ matched: 'bot', matchId: game.id });
  } catch (e) {
    return json({ error: 'INTERNAL', detail: String(e) }, 500);
  }
});
