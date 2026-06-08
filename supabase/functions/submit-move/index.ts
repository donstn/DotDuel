// Server-authoritative move handler — the Supabase analog of validateMove.
// Validates with the SAME engine the client runs, advances the clock, detects
// game end, and triggers Elo finalize. Clients never write `games` directly.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { applyAction } from '../_shared/engine/game.ts';
import type { GameState } from '../_shared/engine/types.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ABORT_FIRST_MOVE_MS = 10000;

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
type Admin = any;

async function finish(
  admin: Admin,
  gameId: string,
  state: GameState,
  winner: 1 | 2 | null,
  reason: string,
  now: number,
) {
  // Mirror the top-level finish into the `state` jsonb too. The client keys
  // GameOver off state.finished (App.tsx: showOver = state.finished), so a
  // timeout/resign/abort that only flipped the columns would leave both boards
  // stuck. (applyAction already sets these on a normal end.)
  const finishedState = { ...state, finished: true, winner };
  await admin
    .from('games')
    .update({
      status: 'finished',
      state: finishedState,
      winner: winner === null ? null : String(winner),
      finished_reason: reason,
      finished_at: new Date(now).toISOString(),
    })
    .eq('id', gameId);
  await admin.rpc('finalize_game', { p_game_id: gameId });
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

    const { gameId, action } = await req.json();
    if (!gameId || !action?.kind) return json({ error: 'BAD_REQUEST' }, 400);

    const { data: game, error: gErr } = await admin
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();
    if (gErr || !game) return json({ error: 'GAME_NOT_FOUND' }, 404);
    if (game.status !== 'active') return json({ error: 'GAME_NOT_ACTIVE' }, 409);

    const playerNum = game.p1_uid === uid ? 1 : game.p2_uid === uid ? 2 : null;
    if (!playerNum) return json({ error: 'NOT_PARTICIPANT' }, 403);

    const state = game.state as GameState;
    const clock = game.clock as {
      p1RemainingMs: number;
      p2RemainingMs: number;
      turnStartedAt: number;
      current: 1 | 2;
      totalMs: number;
    };
    const now = Date.now();
    const curKey = state.current === 1 ? 'p1RemainingMs' : 'p2RemainingMs';
    const elapsed = clock.turnStartedAt > 0 ? now - clock.turnStartedAt : 0;

    // ---- special actions ----
    if (action.kind === 'resign') {
      await finish(admin, gameId, state, playerNum === 1 ? 2 : 1, 'resign', now);
      return json({ ok: true });
    }
    if (action.kind === 'timeout') {
      if (clock[curKey] - elapsed > 0) return json({ error: 'NOT_EXPIRED' }, 409);
      await finish(admin, gameId, state, state.current === 1 ? 2 : 1, 'timeout', now);
      return json({ ok: true });
    }
    if (action.kind === 'abort') {
      const moves = Object.keys(state.colored ?? {}).length;
      const ok =
        moves <= 1 &&
        clock.turnStartedAt > 0 &&
        now - clock.turnStartedAt >= ABORT_FIRST_MOVE_MS;
      if (!ok) return json({ error: 'ABORT_NOT_ALLOWED' }, 409);
      await finish(admin, gameId, state, null, 'aborted', now);
      return json({ ok: true });
    }

    // ---- normal move ----
    if (state.current !== playerNum) return json({ error: 'NOT_YOUR_TURN' }, 409);

    const newRemaining = clock[curKey] - elapsed;
    if (newRemaining <= 0) {
      await finish(admin, gameId, state, state.current === 1 ? 2 : 1, 'timeout', now);
      return json({ ok: true });
    }

    let newState: GameState;
    try {
      newState = applyAction(state, action);
    } catch (e) {
      return json({ error: 'INVALID_MOVE', detail: String(e) }, 422);
    }

    const newClock = {
      ...clock,
      [curKey]: newRemaining,
      turnStartedAt: now,
      current: newState.current,
    };
    const updates: Record<string, unknown> = {
      state: newState,
      clock: newClock,
    };
    if (newState.finished) {
      updates.status = 'finished';
      updates.winner =
        newState.winner === null ? null : String(newState.winner);
      updates.finished_reason = 'normal';
      updates.finished_at = new Date(now).toISOString();
    }
    const { error: upErr } = await admin
      .from('games')
      .update(updates)
      .eq('id', gameId);
    if (upErr) return json({ error: 'WRITE_FAILED', detail: upErr.message }, 500);

    if (newState.finished) {
      await admin.rpc('finalize_game', { p_game_id: gameId });
    }
    return json({ ok: true });
  } catch (e) {
    return json({ error: 'INTERNAL', detail: String(e) }, 500);
  }
});
