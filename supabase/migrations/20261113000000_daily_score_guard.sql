-- Daily puzzle: reject impossible scores.
--
-- finalize_daily() trusts the score the client sends (p_p1_score) — any
-- signed-in player could post any number to the daily leaderboard. This is a
-- STOPGAP: a trigger on daily_puzzles refuses a `best` that no game on that
-- day's board could produce (below 0, or above the board's total points), and
-- refuses dates that have no puzzle. It does not stop a plausible fake score;
-- the real fix is to send the move list and replay it on the server with the
-- shared engine, the way submit-move does for ranked games.
--
-- finalize_daily writes daily_puzzles before it mirrors to daily_leaderboard,
-- and the exception rolls the whole call back, so the leaderboard is covered.
--
-- Apply via the dashboard SQL Editor.

create or replace function public.guard_daily_score()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_shape text;
  v_max   integer;
begin
  if new.best is null then
    return new;
  end if;
  select shape into v_shape from public.daily_puzzle_defs where utc_date = new.utc_date;
  if v_shape is null then
    raise exception 'DAILY_NO_PUZZLE';
  end if;
  -- Total points on each board (every line scored once).
  v_max := case v_shape
    when 'triangle'  then 108
    when 'square'    then 196
    when 'rectangle' then 252
  end;
  if new.best < 0 or new.best > v_max then
    raise exception 'DAILY_SCORE_OUT_OF_RANGE';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_daily_score on public.daily_puzzles;
create trigger guard_daily_score
  before insert or update of best on public.daily_puzzles
  for each row execute function public.guard_daily_score();
