// Bot move helpers shared by submit-move (bot replies, 'botStart') and
// request-bot-match (bot opens when it is P1). Same clock / finish / finalize
// logic as a human move.
import { applyAction } from './engine/game.ts';
import { pickAIAction } from './engine/ai.ts';
import type { GameState, Player } from './engine/types.ts';

// deno-lint-ignore no-explicit-any
type Admin = any;

// Per-time-control caps on bot think delay (ms) so Bullet bots don't burn their
// own clock. Mirrors Firebase BOT_THINK_CAP_MS.
const BOT_THINK_CAP_MS: Record<string, number> = {
  '1min': 1200,
  '3min': 2200,
  '5min': 3500,
};

export async function finish(
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
// delay (ms), level and the turn it is answering; otherwise null. Reached after
// a human move, via 'botStart', or from openForBotWhenReady when the bot is P1.
// A bot move always passes the turn back to the human — no chaining.
export async function botToMove(
  admin: Admin,
  game: Record<string, unknown>,
): Promise<{ uid: string; level: number; delayMs: number; turn: number } | null> {
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
  return { uid: bot.uid as string, level: bot.bot_level as number, delayMs, turn: state.turn };
}

// Background task: wait the think delay, re-read the game (it may have ended or
// the turn may have moved on), then apply the bot's move with the same clock /
// finish / finalize logic the human path uses. `expectedTurn` pins the task to
// the turn it was scheduled for, so a stale task (e.g. a duplicate 'botStart')
// can never play a later bot turn early.
export async function doBotMove(
  admin: Admin,
  gameId: string,
  level: number,
  delayMs: number,
  expectedTurn: number,
) {
  await new Promise((r) => setTimeout(r, delayMs));

  const { data: game, error } = await admin
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();
  if (error || !game || game.status !== 'active') return;

  const state = game.state as GameState;
  if (state.turn !== expectedTurn) return;
  const slot = state.current;

  // Safety: only ever apply a move on a BOT's turn. If the turn somehow advanced
  // during the think-delay (or this fires for a non-bot game), never move on a
  // human's slot.
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
  // Write guard: only into a still-active game on the same turn. Duplicate
  // tasks for one turn → only the first lands; a resign / abort / timeout that
  // finished the game during the think delay is never overwritten.
  const { error: upErr, data: written } = await admin
    .from('games')
    .update(updates)
    .eq('id', gameId)
    .eq('status', 'active')
    .eq('state->>turn', String(state.turn))
    .select('id');
  if (!upErr && (!written || written.length === 0)) return;
  if (upErr) {
    // Don't finalize against a state we failed to persist.
    console.error(`doBotMove update failed for game ${gameId}:`, upErr);
    return;
  }
  if (newState.finished) {
    await admin.rpc('finalize_game', { p_game_id: gameId });
  }
}

const OPEN_POLL_MS = 500;
const OPEN_TIMEOUT_MS = 60000;

// Bot is P1: wait until the human's board load starts the clock
// (set_board_loaded stamps clock.turnStartedAt), then play the bot's opening
// move. Server-side, so it works for every client version; clients that send
// 'botStart' too are deduped by doBotMove's turn/write guard.
export async function openForBotWhenReady(admin: Admin, gameId: string) {
  const deadline = Date.now() + OPEN_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const { data: game } = await admin.from('games').select('*').eq('id', gameId).single();
    if (!game || game.status !== 'active' || (game.state as GameState).turn !== 0) return;
    if ((game.clock?.turnStartedAt ?? 0) > 0) {
      const bot = await botToMove(admin, game);
      if (bot) await doBotMove(admin, gameId, bot.level, bot.delayMs, bot.turn);
      return;
    }
    await new Promise((r) => setTimeout(r, OPEN_POLL_MS));
  }
}
