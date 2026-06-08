// Accept a friend's game invite: validates the invite, spawns the game + both
// pairing rows, and cancels the other invites in the same group. Port of the
// Firebase acceptInvite callable. Inviter = P1 (moves first), accepter = P2 —
// same colour convention matchmake uses. Game is created status='active' with
// empty ready/board_loaded, exactly like matchmake, so the client's
// MatchFound → ready-up flow drives it identically to a queue match.
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

    const { inviteId, ranked } = (await req.json().catch(() => ({}))) as {
      inviteId?: string;
      ranked?: boolean;
    };
    if (!inviteId) return json({ error: 'INVITE_ID_REQUIRED' }, 400);

    const { data: inv } = await admin
      .from('invites')
      .select('*')
      .eq('id', inviteId)
      .maybeSingle();
    if (!inv) return json({ error: 'NOT_FOUND' }, 404);
    if (inv.to_uid !== uid) return json({ error: 'NOT_YOURS' }, 403);
    if (inv.status !== 'pending') return json({ error: 'NOT_PENDING' }, 409);
    if (inv.expires_at && new Date(inv.expires_at).getTime() < Date.now()) {
      return json({ error: 'EXPIRED' }, 409);
    }

    const fromUid = inv.from_uid as string;
    const shape = (inv.shape as string) ?? 'triangle';
    const timeControl = (inv.time_control as string) ?? '3min';
    void ranked; // ranked toggle parity deferred — games table has no ranked col yet
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
        p1_uid: fromUid,
        p2_uid: uid,
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

    // Accepted invite wins; siblings in the same group cancel so their
    // recipients' toasts disappear.
    await admin
      .from('invites')
      .update({ status: 'accepted', match_id: game.id })
      .eq('id', inviteId);
    await admin
      .from('invites')
      .update({ status: 'cancelled' })
      .eq('group_id', inv.group_id)
      .eq('status', 'pending');

    const { data: profs } = await admin
      .from('profiles')
      .select('id, display_name, rating')
      .in('id', [fromUid, uid]);
    const pm: Record<string, Row> = Object.fromEntries(
      (profs ?? []).map((p: Row) => [p.id, p]),
    );

    await admin.from('pairings').upsert([
      {
        uid: fromUid,
        match_id: game.id,
        shape,
        player: 1,
        opponent_uid: uid,
        opponent_display_name: pm[uid]?.display_name ?? 'Opponent',
        opponent_rating: pm[uid]?.rating ?? 1000,
        opponent_is_bot: false,
      },
      {
        uid,
        match_id: game.id,
        shape,
        player: 2,
        opponent_uid: fromUid,
        opponent_display_name: pm[fromUid]?.display_name ?? 'Opponent',
        opponent_rating: pm[fromUid]?.rating ?? 1000,
        opponent_is_bot: false,
      },
    ]);

    return json({ ok: true, matchId: game.id });
  } catch (e) {
    return json({ error: 'INTERNAL', detail: String(e) }, 500);
  }
});
