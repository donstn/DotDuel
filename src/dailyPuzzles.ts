import { supabase } from './supabase';
import type { Difficulty, GameAction, ShapeId } from './types';

// Daily-puzzle loader (revamped).
//
// One shared puzzle per UTC day, generated SERVER-SIDE by the `daily-puzzle`
// Edge Function: a random board (triangle/square/rectangle — no rhombus), a
// random opponent level (L3–L5), and an AI-vs-AI seeded opening. Every player
// worldwide receives the identical opening (the exact same coloured dots) and
// takes over as P1 for the rest of the game against the AI at the day's level.
//
// The static client library is gone — generation/randomness lives on the server
// so the position is guaranteed identical for everyone without shipping a seeded
// RNG into the engine.

export interface DailyPuzzleDef {
  utcDate: string; // 'YYYY-MM-DD' (UTC)
  shape: ShapeId;
  aiLevel: Difficulty; // the player's live opponent (P2) level, L3–L5
  opening: GameAction[]; // seeded AI-vs-AI moves, replayed via applyAction()
  seedScores: { 1: number; 2: number }; // P1/P2 score after the opening
  puzzleId: number; // stable integer per UTC date (days since epoch)
}

// 'YYYY-MM-DD' in UTC. Stable for the whole UTC calendar day regardless of the
// player's local time zone — prevents the "travel across time zones to play the
// same puzzle twice" attack on the streak.
export function dateToUtcKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

// Stable integer id for a UTC date = whole days since the epoch. Used for the
// attempt doc / telemetry (the leaderboard keys on utc_date directly).
export function puzzleIdForUtcKey(utcKey: string): number {
  return Math.floor(Date.parse(`${utcKey}T00:00:00Z`) / 86_400_000);
}

interface DefResponse {
  utcDate?: string;
  shape?: ShapeId;
  aiLevel?: Difficulty;
  opening?: GameAction[];
  seedScores?: { 1: number; 2: number };
  error?: string;
}

export async function fetchDailyPuzzleDef(
  date: string = dateToUtcKey(),
): Promise<DailyPuzzleDef> {
  const { data, error } = await supabase.functions.invoke('daily-puzzle', {
    body: { date },
  });
  if (error) throw new Error(error.message);
  const res = (data ?? {}) as DefResponse;
  if (res.error || !res.shape) {
    throw new Error(res.error ?? 'Failed to load the daily puzzle.');
  }
  const utcDate = res.utcDate ?? date;
  return {
    utcDate,
    shape: res.shape,
    aiLevel: (res.aiLevel ?? 4) as Difficulty,
    opening: res.opening ?? [],
    seedScores: res.seedScores ?? { 1: 0, 2: 0 },
    puzzleId: puzzleIdForUtcKey(utcDate),
  };
}
