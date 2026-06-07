-- Fixes:
-- (1) The profile guard trigger reverted EVERY non-service-role write to the
--     fn-only columns — including writes made by our own SECURITY DEFINER RPCs
--     (auth.role() is still 'authenticated' inside them), so streak updates were
--     silently undone. Switch to a transaction-local opt-in flag the RPCs set.
-- (2) finalize_daily now takes the caller's display name (and syncs it to the
--     profile), so the daily leaderboard shows the player's DotDuel name instead
--     of 'Anonymous' when the Supabase profile has no name yet.

create or replace function public.guard_profile_cols()
returns trigger
language plpgsql
as $$
begin
  -- RPCs that legitimately write fn-only columns set this transaction-local
  -- flag first; direct user updates never do, so theirs get reverted.
  if coalesce(current_setting('app.allow_protected_write', true), '') <> 'on' then
    new.rating                 := old.rating;
    new.placement_games_played := old.placement_games_played;
    new.streak_current         := old.streak_current;
    new.streak_longest         := old.streak_longest;
    new.streak_last_played_utc := old.streak_last_played_utc;
    new.email                  := old.email;
    new.created_at             := old.created_at;
  end if;
  return new;
end;
$$;

drop function if exists public.finalize_daily(date, integer, integer);

create or replace function public.finalize_daily(
  p_utc_date     date,
  p_puzzle_id    integer,
  p_margin       integer,
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
  v_best     := greatest(coalesce(v_prev_best, -2147483648), p_margin);
  v_improved := p_margin > coalesce(v_prev_best, -2147483648);
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
