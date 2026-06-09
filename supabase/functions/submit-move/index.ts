// Server-authoritative move handler — the Supabase analog of validateMove.
// Validates with the SAME engine the client runs, advances the clock, detects
// game end, and triggers Elo finalize. Clients never write `games` directly.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { applyAction } from '../_shared/engine/game.ts';
import { pickAIAction } from '../_shared/engine/ai.ts';
import type { GameState, Player } from '../_shared/engine/types.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ABORT_FIRST_MOVE_MS = 10000;

// Per-time-control caps on bot think delay (ms) so Bullet bots don't burn their
// own clock. Mirrors Firebase BOT_THINK_CAP_MS.
const BOT_THINK_CAP_MS: Record<string, number> = {
  '1min': 1200,
  '3min': 2200,
  '5min': 3500,
};

// Supabase Edge runtime: keep the instance alive for a fire-and-forget task
// (the bot's delayed move) after the HTTP response has been sent.
declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

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

// If the player whose turn it now is happens to be a bot, return its think
// delay (ms) and level; otherwise null. Bot moves are NEVER the first move
// (request-bot-match makes the human P1), so this is only reached after a human
// move, and a bot move always passes the turn back to the human — no chaining.
async function botToMove(
  admin: Admin,
  game: Record<string, unknown>,
): Promise<{ uid: string; level: number; delayMs: number } | null> {
  const state = game.state as GameState;
  const slot = state.current;
  const botUid = slot === 1 ? game.p1_uid : game.p2_uid;
  const { data: bot } = await admin
    .from('bots')
    .select('uid, bot_level, active, think_delay_range')
    .eq('uid', botUid)
    .eq('active', true)
    .maybeSingle();
  if (!bot) return null;

  const clock = game.clock as { p1RemainingMs: number; p2RemainingMs: number };
  const remaining = slot === 1 ? clock.p1RemainingMs : clock.p2RemainingMs;
  const range = (bot.think_delay_range ?? { min: 800, max: 2500 }) as {
    min: number;
    max: number;
  };
  const tc = String(game.time_control);
  // Cap by time-control AND never spend >25% of the bot's remaining clock.
  const safeCap = Math.min(BOT_THINK_CAP_MS[tc] ?? range.max, range.max, Math.floor(remaining * 0.25));
  const safeMin = Math.min(range.min, safeCap);
  const delayMs = safeMin + Math.random() * Math.max(0, safeCap - safeMin);
  return { uid: bot.uid as string, level: bot.bot_level as number, delayMs };
}

// Background task: wait the think delay, re-read the game (it may have ended or
// the turn may have moved on), then apply the bot's move with the same clock /
// finish / finalize logic the human path uses.
async function doBotMove(admin: Admin, gameId: string, level: number, delayMs: number) {
  await new Promise((r) => setTimeout(r, delayMs));

  const { data: game, error } = await admin
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();
  if (error || !game || game.status !== 'active') return;

  const state = game.state as GameState;
  const slot = state.current;

  // Safety: only ever apply a move on a BOT's turn. The MVP has the bot as P2,
  // but if the turn somehow advanced during the think-delay (or this fires for a
  // non-bot game), never move on a human's slot.
  const turnUid = slot === 1 ? game.p1_uid : game.p2_uid;
  const { data: botRow } = await admin
    .from('bots')
    .select('uid')
    .eq('uid', turnUid)
    .maybeSingle();
  if (!botRow) return;

  const clock = game.clock as {
    p1RemainingMs: number;
    p2RemainingMs: number;
    turnStartedAt: number;
    current: 1 | 2;
    totalMs: number;
  };
  const now = Date.now();
  const curKey = slot === 1 ? 'p1RemainingMs' : 'p2RemainingMs';
  const elapsed = clock.turnStartedAt > 0 ? now - clock.turnStartedAt : 0;
  const newRemaining = clock[curKey] - elapsed;
  if (newRemaining <= 0) {
    await finish(admin, gameId, state, slot === 1 ? 2 : 1, 'timeout', now);
    return;
  }

  let newState: GameState;
  try {
    const action = pickAIAction(state, level as Parameters<typeof pickAIAction>[1], slot as Player);
    newState = applyAction(state, action);
  } catch (e) {
    // The bot engine failed on this state. Rather than strand the human (who'd
    // otherwise wait out their own clock against a bot that never moves), end
    // the game rating-neutral (aborted ⇒ finalize_game applies no Elo change).
    console.error(`doBotMove engine failure for game ${gameId}:`, e);
    await finish(admin, gameId, state, null, 'aborted', now);
    return;
  }

  const newClock = {
    ...clock,
    [curKey]: newRemaining,
    turnStartedAt: now,
    current: newState.current,
  };
  const updates: Record<string, unknown> = { state: newState, clock: newClock };
  if (newState.finished) {
    updates.status = 'finished';
    updates.winner = newState.winner === null ? null : String(newState.winner);
    updates.finished_reason = 'normal';
    updates.finished_at = new Date(now).toISOString();
  }
  const { error: upErr } = await admin.from('games').update(updates).eq('id', gameId);
  if (upErr) {
    // Don't finalize against a state we failed to persist.
    console.error(`doBotMove update failed for game ${gameId}:`, upErr);
    return;
  }
  if (newState.finished) {
    await admin.rpc('finalize_game', { p_game_id: gameId });
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    // Stamp the move at request ENTRY — before auth + DB reads — so the player
    // isn't charged clock time for the server's own auth/query/processing
    // latency. (Was previously captured after getUser + the games select, which
    // billed ~200–400ms of server round-trips to the mover on every move.)
    const now = Date.now();
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const {
      data: { user },
      error: uErr,
    } = await admin.auth.getUser(jwt);
    if (uErr || !user) return json({ error: 'UNAUTHENTICATED' }, 401);
    const uid = user.id;

    const { gameId, action, clientSentAt } = await req.json();
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

    // Lag compensation: credit back the move's network/boot transit so the mover
    // is billed for thinking time only, not for the move travelling to the
    // server. `clientSentAt` is the client's send time in SERVER time (it adds
    // its measured skew); transit = now − clientSentAt. It's client-influenced,
    // so clamp to [0, CAP] — worst-case abuse is CAP per move. Applied only to
    // the normal move deduction; the timeout/abort checks above stay strict.
    const LAG_COMP_CAP_MS = 1000;
    const transitCredit =
      typeof clientSentAt === 'number'
        ? Math.min(Math.max(0, now - clientSentAt), LAG_COMP_CAP_MS)
        : 0;
    const moveElapsed = Math.max(0, elapsed - transitCredit);
    const newRemaining = clock[curKey] - moveElapsed;
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
    } else {
      // If it's now a bot's turn, schedule its (delayed) reply as a background
      // task so this response returns immediately and the human sees their own
      // move land without waiting for the bot to "think".
      const updatedGame = { ...game, state: newState, clock: newClock };
      const bot = await botToMove(admin, updatedGame);
      if (bot) {
        EdgeRuntime.waitUntil(doBotMove(admin, gameId, bot.level, bot.delayMs));
      }
    }
    return json({ ok: true });
  } catch (e) {
    return json({ error: 'INTERNAL', detail: String(e) }, 500);
  }
});
