// Daily-puzzle generator/loader — one shared puzzle per UTC day.
//
// Returns today's puzzle def (cached in daily_puzzle_defs); generates it on the
// first request of the day if missing. Generation picks a random board
// (triangle/square/rectangle — no rhombus), a random opponent level (L3–L5), and
// plays out an AI-vs-AI OPENING using the SAME engine the client runs, so every
// player worldwide inherits the identical coloured-dot position before taking
// over as P1. Inserts on-conflict-do-nothing + re-selects, so concurrent first
// requests converge on one def.
//
// Auth required (daily is a signed-in feature). Run
//   node scripts/copy-engine-supabase.cjs
// before deploying so _shared/engine matches the client.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { createGame, applyAction } from '../_shared/engine/game.ts';
import { pickAIAction } from '../_shared/engine/ai.ts';
import type {
  Difficulty,
  GameAction,
  GameState,
  ShapeId,
} from '../_shared/engine/types.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

const SHAPES: ShapeId[] = ['triangle', 'square', 'rectangle'];

// AI levels: beginner=1, easy=2, hard=4, insane=5 (L3 medium is unused in the
// recipe; it's reserved for the player's live opponent level).
const BEGINNER: Difficulty = 1;
const EASY: Difficulty = 2;
const HARD: Difficulty = 4;
const INSANE: Difficulty = 5;

// Per-shape seeding recipe. Counts below are PER SIDE; turns strictly alternate
// P1/P2, so a "4 per side" phase is the next 8 moves at that level, etc.
const RECIPES: Record<ShapeId, { level: Difficulty; perSide: number }[]> = {
  triangle: [
    { level: BEGINNER, perSide: 4 },
    { level: EASY, perSide: 2 },
    { level: INSANE, perSide: 2 },
  ],
  square: [
    { level: BEGINNER, perSide: 2 },
    { level: EASY, perSide: 3 },
    { level: HARD, perSide: 3 },
    { level: INSANE, perSide: 2 },
  ],
  rectangle: [
    { level: BEGINNER, perSide: 4 },
    { level: EASY, perSide: 5 },
    { level: HARD, perSide: 5 },
    { level: INSANE, perSide: 2 },
  ],
  // Rhombus is excluded from the daily puzzle; present only to satisfy the type.
  rhombus: [],
};

function recipeLevels(shape: ShapeId): Difficulty[] {
  const levels: Difficulty[] = [];
  for (const phase of RECIPES[shape]) {
    for (let i = 0; i < phase.perSide * 2; i++) levels.push(phase.level);
  }
  return levels;
}

interface GeneratedDef {
  shape: ShapeId;
  aiLevel: Difficulty;
  opening: GameAction[];
  seedScores: { 1: number; 2: number };
}

function generate(): GeneratedDef {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const aiLevel = (3 + Math.floor(Math.random() * 3)) as Difficulty; // L3–L5
  const levels = recipeLevels(shape);

  let state: GameState = createGame(shape, 'ai', aiLevel);
  const opening: GameAction[] = [];
  for (const level of levels) {
    if (state.finished) break;
    const action = pickAIAction(state, level, state.current);
    if (action.kind === 'dot' && action.dotId < 0) break; // no legal move
    state = applyAction(state, action);
    opening.push(action);
  }

  return {
    shape,
    aiLevel,
    opening,
    seedScores: { 1: state.scores[1], 2: state.scores[2] },
  };
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

// deno-lint-ignore no-explicit-any
type Admin = any;

async function loadDef(admin: Admin, utcDate: string) {
  const { data } = await admin
    .from('daily_puzzle_defs')
    .select('utc_date, shape, ai_level, opening, seed_scores')
    .eq('utc_date', utcDate)
    .maybeSingle();
  return data;
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

    let body: { date?: string } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const utcDate =
      typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
        ? body.date
        : todayUtc();

    // Fast path: already generated.
    let row = await loadDef(admin, utcDate);
    if (!row) {
      const def = generate();
      // on-conflict-do-nothing: a racing request may have inserted first.
      await admin
        .from('daily_puzzle_defs')
        .upsert(
          {
            utc_date: utcDate,
            shape: def.shape,
            ai_level: def.aiLevel,
            opening: def.opening,
            seed_scores: def.seedScores,
          },
          { onConflict: 'utc_date', ignoreDuplicates: true },
        );
      // Re-select so everyone (including the racing loser) returns the canonical row.
      row = await loadDef(admin, utcDate);
    }
    if (!row) return json({ error: 'GENERATION_FAILED' }, 500);

    return json({
      utcDate: row.utc_date,
      shape: row.shape,
      aiLevel: row.ai_level,
      opening: row.opening,
      seedScores: row.seed_scores,
    });
  } catch (e) {
    return json({ error: 'INTERNAL', detail: String(e) }, 500);
  }
});
