// GDPR Art. 17 erasure. Port of the Firebase deleteAccount callable, adapted to
// Supabase cascades: most rows (pairings, queue, presence, usernames,
// leaderboard, friendships, invites, level_*) CASCADE off profiles, and
// profiles cascades off auth.users — so deleting the auth user removes them.
// We must explicitly handle the two that DON'T cascade: live `games` rows
// (games.p?_uid -> profiles is NO ACTION, would block the delete) and `matches`
// history (kept, but anonymised). Self-delete only — uid comes from the JWT.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const DELETED_DISPLAY = 'Deleted player';

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
    const sentinel = `deleted_${uid.slice(0, 8)}`;

    // Step 1: remove live game state that references this user (NO ACTION FK
    // would otherwise block the profile cascade). The opponent's client sees
    // the row vanish; an in-progress game effectively aborts.
    await admin.from('games').delete().or(`p1_uid.eq.${uid},p2_uid.eq.${uid}`);

    // Step 2: anonymise match history (kept for the opponent's record).
    const { data: myMatches } = await admin
      .from('matches')
      .select('id, p1_uid, p2_uid')
      .or(`p1_uid.eq.${uid},p2_uid.eq.${uid}`)
      .limit(1000);
    for (const m of myMatches ?? []) {
      const updates: Record<string, unknown> = {};
      if (m.p1_uid === uid) {
        updates.p1_uid = null;
        updates.p1_display = DELETED_DISPLAY;
      }
      if (m.p2_uid === uid) {
        updates.p2_uid = null;
        updates.p2_display = DELETED_DISPLAY;
      }
      await admin.from('matches').update(updates).eq('id', m.id);
    }

    // Step 3: delete the auth user — cascades profile + all CASCADE children
    // (pairings, matchmaking_queue, presence, usernames, leaderboard,
    // friendships, invites, level_progress, level_leaderboard, game_sessions).
    const { error: dErr } = await admin.auth.admin.deleteUser(uid);
    if (dErr) return json({ error: 'AUTH_DELETE_FAILED', detail: dErr.message }, 500);

    return json({ ok: true, sentinel });
  } catch (e) {
    return json({ error: 'INTERNAL', detail: String(e) }, 500);
  }
});
