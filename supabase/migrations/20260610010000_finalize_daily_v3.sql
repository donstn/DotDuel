-- Daily-puzzle revamp — finalize metric changes from MARGIN to P1 SCORE.
--
-- The revamped daily ranks players by their raw P1 (player) score, not by the
-- score margin vs the AI. `best` (in both daily_puzzles and daily_leaderboard)
-- now stores the highest P1 score across the day's 3 attempts. Everything else
-- (attempt cap, best-of-3, streak bump, leaderboard mirror) is unchanged from v2.
--
-- The function identity (arg types) is unchanged, so the named param rename
-- p_margin -> p_p1_score requires callers to update the key they pass.
--
-- Apply via the dashboard SQL Editor.

-- Postgres won't rename an input parameter (p_margin -> p_p1_score) via
-- CREATE OR REPLACE, so drop the v2 function first. Arg types are unchanged.
drop function if exists public.finalize_daily(date, integer, integer, text);

create or replace function public.finalize_daily(
  p_utc_date     date,
  p_puzzle_id    integer,
  p_p1_score     integer,
  p_display_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid            uuid := auth.uid();
  v_display        text;
  v_prev_attempts  integer;
  v_prev_best      integer;
  v_first          timestamptz;
  v_next_attempts  integer;
  v_best           integer;
  v_improved       boolean;
  v_streak_current integer;
  v_streak_longest integer;
  v_streak_last    date;
  v_new_current    integer;
  v_new_longest    integer;
  v_already_today  boolean := false;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- Let this RPC's writes to fn-only profile columns (streak) past the guard.
  perform set_config('app.allow_protected_write', 'on', true);

  -- Prefer the caller's display name; fall back to the stored profile name.
  v_display := nullif(trim(p_display_name), '');
  if v_display is null then
    select display_name into v_display from public.profiles where id = v_uid;
  end if;
  v_display := coalesce(v_display, 'Anonymous');

  -- Keep the profile name current with what the player goes by.
  update public.profiles
     set display_name = coalesce(nullif(trim(p_display_name), ''), display_name)
   where id = v_uid;

  select attempts, best, first_completed_at
    into v_prev_attempts, v_prev_best, v_first
    from public.daily_puzzles
   where uid = v_uid and utc_date = p_utc_date;
  v_prev_attempts := coalesce(v_prev_attempts, 0);

  if v_prev_attempts >= 3 then
    raise exception 'DAILY_ATTEMPTS_EXHAUSTED';
  end if;

  v_next_attempts := v_prev_attempts + 1;
  v_best     := greatest(coalesce(v_prev_best, -2147483648), p_p1_score);
  v_improved := p_p1_score > coalesce(v_prev_best, -2147483648);
  v_first    := coalesce(v_first, now());

  select streak_current, streak_longest, streak_last_played_utc
    into v_streak_current, v_streak_longest, v_streak_last
    from public.profiles where id = v_uid;
  v_streak_current := coalesce(v_streak_current, 0);
  v_streak_longest := coalesce(v_streak_longest, 0);

  if v_streak_last is null then
    v_new_current := 1;
  elsif v_streak_last = p_utc_date then
    v_new_current := v_streak_current; v_already_today := true;
  elsif v_streak_last = p_utc_date - 1 then
    v_new_current := v_streak_current + 1;
  else
    v_new_current := 1;
  end if;
  v_new_longest := greatest(v_streak_longest, v_new_current);

  insert into public.daily_puzzles
    (uid, utc_date, puzzle_id, attempts, best, first_completed_at, last_completed_at)
  values
    (v_uid, p_utc_date, p_puzzle_id, v_next_attempts, v_best, v_first, now())
  on conflict (uid, utc_date) do update
    set puzzle_id         = excluded.puzzle_id,
        attempts          = excluded.attempts,
        best              = excluded.best,
        last_completed_at = excluded.last_completed_at;

  if v_improved or v_next_attempts = 1 then
    insert into public.daily_leaderboard
      (utc_date, uid, display_name, best, first_completed_at, attempts, puzzle_id)
    values
      (p_utc_date, v_uid, v_display, v_best, v_first, v_next_attempts, p_puzzle_id)
    on conflict (utc_date, uid) do update
      set display_name = excluded.display_name,
          best         = excluded.best,
          attempts     = excluded.attempts,
          puzzle_id    = excluded.puzzle_id;
  end if;

  if not v_already_today then
    update public.profiles
       set streak_current         = v_new_current,
           streak_longest         = v_new_longest,
           streak_last_played_utc = p_utc_date
     where id = v_uid;
  end if;

  return jsonb_build_object(
    'attempts', v_next_attempts,
    'best', v_best,
    'improved', v_improved,
    'streak', jsonb_build_object('current', v_new_current, 'longest', v_new_longest),
    'attemptsRemaining', greatest(0, 3 - v_next_attempts)
  );
end;
$$;

grant execute on function public.finalize_daily(date, integer, integer, text) to authenticated;
