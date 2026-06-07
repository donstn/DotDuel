-- DotDuel — authoritative RPCs (Phase 1 daily puzzle + Phase 2 campaign).
-- SECURITY DEFINER so they can write fn-only columns (streak) and the
-- public leaderboards that clients can't write directly. search_path pinned
-- to public to prevent search-path hijacking. uid always comes from auth.uid()
-- — never trusted from the client.

-- ─────────────────────────────────────────────────────────────────────────────
-- finalize_daily — port of src/cloud/dailyPuzzleResult.ts (finalizeDailyPuzzle)
--   3 attempts/day max, best-of-3 margin, leaderboard mirror on improve/first,
--   streak bump only on the first counted attempt of the day.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.finalize_daily(
  p_utc_date  date,
  p_puzzle_id integer,
  p_margin    integer
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

  select display_name into v_display from public.profiles where id = v_uid;
  v_display := coalesce(v_display, 'Anonymous');

  select attempts, best, first_completed_at
    into v_prev_attempts, v_prev_best, v_first
    from public.daily_puzzles
   where uid = v_uid and utc_date = p_utc_date;
  v_prev_attempts := coalesce(v_prev_attempts, 0);

  if v_prev_attempts >= 3 then
    raise exception 'DAILY_ATTEMPTS_EXHAUSTED';
  end if;

  v_next_attempts := v_prev_attempts + 1;
  v_best     := greatest(coalesce(v_prev_best, -2147483648), p_margin);
  v_improved := p_margin > coalesce(v_prev_best, -2147483648);
  v_first    := coalesce(v_first, now());

  -- streak
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

grant execute on function public.finalize_daily(date, integer, integer) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- complete_level — campaign level finalize (Phase 2).
--   Records an attempt, keeps best margin, derives stars from par_margin,
--   marks completed on a win (margin > 0), mirrors to the per-level board.
--   Unlock of level N+1 is DERIVED at read time (level_progress(N).completed),
--   so nothing to write here for gating.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.complete_level(
  p_level_id uuid,
  p_margin   integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid           uuid := auth.uid();
  v_display       text;
  v_par           integer;
  v_par_found     boolean;
  v_prev_attempts integer;
  v_prev_best     integer;
  v_next_attempts integer;
  v_best          integer;
  v_stars         integer;
  v_completed     boolean;
  v_first         timestamptz;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select par_margin, true into v_par, v_par_found
    from public.levels where id = p_level_id;
  if not coalesce(v_par_found, false) then
    raise exception 'LEVEL_NOT_FOUND';
  end if;

  select display_name into v_display from public.profiles where id = v_uid;
  v_display := coalesce(v_display, 'Anonymous');

  select attempts, best_margin, first_completed_at
    into v_prev_attempts, v_prev_best, v_first
    from public.level_progress where uid = v_uid and level_id = p_level_id;
  v_prev_attempts := coalesce(v_prev_attempts, 0);

  v_next_attempts := v_prev_attempts + 1;
  v_best      := greatest(coalesce(v_prev_best, -2147483648), p_margin);
  v_completed := v_best > 0;

  if v_best <= 0 then
    v_stars := 0;
  elsif v_par is null then
    v_stars := 1;                       -- no par set: any win = 1 star
  elsif v_best >= v_par then
    v_stars := 3;
  elsif v_best >= v_par / 2 then
    v_stars := 2;
  else
    v_stars := 1;
  end if;

  if v_completed and v_first is null then
    v_first := now();
  end if;

  insert into public.level_progress
    (uid, level_id, attempts, best_margin, completed, stars, first_completed_at, last_attempt_at)
  values
    (v_uid, p_level_id, v_next_attempts, v_best, v_completed, v_stars, v_first, now())
  on conflict (uid, level_id) do update
    set attempts           = excluded.attempts,
        best_margin        = excluded.best_margin,
        completed          = level_progress.completed or excluded.completed,
        stars              = greatest(level_progress.stars, excluded.stars),
        first_completed_at = coalesce(level_progress.first_completed_at, excluded.first_completed_at),
        last_attempt_at    = excluded.last_attempt_at;

  if v_completed then
    insert into public.level_leaderboard
      (level_id, uid, display_name, best_margin, stars, completed_at)
    values
      (p_level_id, v_uid, v_display, v_best, v_stars, coalesce(v_first, now()))
    on conflict (level_id, uid) do update
      set display_name = excluded.display_name,
          best_margin  = greatest(level_leaderboard.best_margin, excluded.best_margin),
          stars        = greatest(level_leaderboard.stars, excluded.stars);
  end if;

  return jsonb_build_object(
    'attempts', v_next_attempts,
    'best', v_best,
    'stars', v_stars,
    'completed', v_completed
  );
end;
$$;

grant execute on function public.complete_level(uuid, integer) to authenticated;
