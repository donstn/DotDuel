-- COPY THIS ENTIRE FILE INTO THE SUPABASE DASHBOARD -> SQL EDITOR -> RUN.
--
-- One-time catch-up: online games only count toward the day streak since
-- 20261121000000_streak_online_games.sql. Rebuild every player's streak from
-- the full history (finished non-aborted online games + daily puzzles, UTC
-- days), so games played before the change count too. Never lowers a streak:
-- longest only grows, and a newer stored last day is kept as is. Bots skipped.

begin;
select set_config('app.allow_protected_write', 'on', true);

with days as (
  select uid, d from (
    select unnest(player_uids) as uid, (finished_at at time zone 'UTC')::date as d
      from public.matches
     where status = 'finished' and finished_reason is distinct from 'aborted' and finished_at is not null
    union
    select uid, utc_date from public.daily_puzzles
  ) x
  where uid is not null
  group by uid, d
), runs as (
  select uid, d, d - (row_number() over (partition by uid order by d))::int as grp from days
), agg as (
  select uid, count(*)::int as len, max(d) as last from runs group by uid, grp
), best as (
  select uid, max(len) as longest, (array_agg(len order by last desc))[1] as cur, max(last) as last
    from agg group by uid
)
update public.profiles p
   set streak_current = case when p.streak_last_played_utc = b.last
                             then greatest(coalesce(p.streak_current, 0), b.cur) else b.cur end,
       streak_longest = greatest(coalesce(p.streak_longest, 0), b.longest,
                                 case when p.streak_last_played_utc = b.last
                                      then greatest(coalesce(p.streak_current, 0), b.cur) else b.cur end),
       streak_last_played_utc = b.last
  from best b
 where p.id = b.uid
   and not exists (select 1 from public.bots where uid = p.id)
   and (p.streak_last_played_utc is null or b.last >= p.streak_last_played_utc);

commit;
