import { supabase } from '../supabase';

// Daily-puzzle finalization — now via the Supabase `finalize_daily` RPC
// (SECURITY DEFINER), which is server-authoritative: the user id comes from
// auth.uid() and the display name from the profile, so the client can't spoof
// either. Enforces 3 attempts/day, best-of-3, leaderboard mirror, streak bump.

export const MAX_ATTEMPTS_PER_DAY = 3;

export interface FinalizeArgs {
  // uid is accepted for call-site compatibility but ignored — the RPC derives it
  // from the authenticated Supabase session. displayName IS used (synced to the
  // profile + shown on the leaderboard).
  uid: string;
  displayName: string;
  utcDate: string; // 'YYYY-MM-DD'
  puzzleId: number;
  p1Score: number; // the player's raw P1 score (ranking metric)
}

export interface FinalizeResult {
  attempts: number;
  best: number;
  improved: boolean;
  streak: { current: number; longest: number };
  attemptsRemaining: number;
}

interface RpcResult {
  attempts: number;
  best: number;
  improved: boolean;
  streak: { current: number; longest: number };
  attemptsRemaining: number;
}

export async function finalizeDailyPuzzle(
  args: FinalizeArgs,
): Promise<FinalizeResult> {
  const { data, error } = await supabase.rpc('finalize_daily', {
    p_utc_date: args.utcDate,
    p_puzzle_id: args.puzzleId,
    p_p1_score: args.p1Score,
    p_display_name: args.displayName,
  });
  if (error) throw new Error(error.message);
  const r = data as RpcResult;
  return {
    attempts: r.attempts,
    best: r.best,
    improved: r.improved,
    streak: { current: r.streak.current, longest: r.streak.longest },
    attemptsRemaining: r.attemptsRemaining,
  };
}
