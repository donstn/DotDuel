-- COPY THIS ENTIRE FILE INTO THE SUPABASE DASHBOARD -> SQL EDITOR -> RUN.
--
-- 1) Which platform a signed-in player uses (Android app / installed web app /
--    browser), recorded by the client once per app load via record_client().
-- 2) admins + admin_stats(): the data behind the hidden admin dashboard.
--    Only accounts listed in public.admins can call it.

-- ---------------------------------------------------------------------------
-- 1) Client platform on the profile
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists last_platform    text
    check (last_platform in ('android', 'ios', 'web-installed', 'web')),
  add column if not exists platforms_seen   text[] not null default '{}',
  add column if not exists last_app_version text,
  add column if not exists last_client_at   timestamptz;

create or replace function public.record_client(p_platform text, p_version text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return; end if;
  if p_platform is null or p_platform not in ('android', 'ios', 'web-installed', 'web') then
    raise exception 'BAD_PLATFORM';
  end if;
  update public.profiles
     set last_platform    = p_platform,
         platforms_seen   = case when p_platform = any(platforms_seen)
                                 then platforms_seen
                                 else platforms_seen || p_platform end,
         last_app_version = left(p_version, 32),
         last_client_at   = now()
   where id = auth.uid();
end;
$$;

revoke execute on function public.record_client(text, text) from public, anon;
grant execute on function public.record_client(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2) Admin dashboard
-- ---------------------------------------------------------------------------
-- RLS on with NO policies: unreadable and unwritable from the client. Add
-- yourself in the SQL Editor (see the bottom of this file).
create table if not exists public.admins (
  uid        uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

-- Day-by-day counts (UTC days) for the last p_days days, plus current totals.
-- Online games only: vs-bot / hot-seat games never reach the server.
create or replace function public.admin_stats(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_days  integer := least(greatest(coalesce(p_days, 30), 1), 730);
  v_from  date    := (now() at time zone 'utc')::date - (v_days - 1);
  v_days_json jsonb;
  v_totals    jsonb;
begin
  if not exists (select 1 from public.admins where uid = auth.uid()) then
    raise exception 'NOT_ADMIN' using errcode = '42501';
  end if;

  with
  humans as (
    select p.* from public.profiles p
     where not exists (select 1 from public.bots b where b.uid = p.id)
  ),
  days as (
    select generate_series(v_from, (now() at time zone 'utc')::date, interval '1 day')::date as d
  ),
  reg as (
    select (created_at at time zone 'utc')::date as d, count(*) as n
      from humans
     where created_at >= v_from
     group by 1
  ),
  m as (
    select (finished_at at time zone 'utc')::date as d,
           count(*) filter (where finished_reason is distinct from 'aborted' and not is_bot) as vs_human,
           count(*) filter (where finished_reason is distinct from 'aborted' and is_bot)     as vs_bot,
           count(*) filter (where finished_reason = 'aborted')                               as aborted
      from (
        select mt.finished_at, mt.finished_reason,
               exists (select 1 from public.bots b where b.uid in (mt.p1_uid, mt.p2_uid)) as is_bot
          from public.matches mt
         where mt.finished_at >= v_from
      ) x
     group by 1
  ),
  pz as (
    select utc_date as d, count(*) as players, coalesce(sum(attempts), 0) as attempts
      from public.daily_leaderboard
     where utc_date >= v_from
     group by 1
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'date',           days.d,
           'registrations',  coalesce(reg.n, 0),
           'matchesVsHuman', coalesce(m.vs_human, 0),
           'matchesVsBot',   coalesce(m.vs_bot, 0),
           'matchesAborted', coalesce(m.aborted, 0),
           'puzzlePlayers',  coalesce(pz.players, 0),
           'puzzleAttempts', coalesce(pz.attempts, 0)
         ) order by days.d desc), '[]'::jsonb)
    into v_days_json
    from days
    left join reg on reg.d = days.d
    left join m   on m.d   = days.d
    left join pz  on pz.d  = days.d;

  with humans as (
    select p.* from public.profiles p
     where not exists (select 1 from public.bots b where b.uid = p.id)
  )
  select jsonb_build_object(
           'registered',        (select count(*) from humans),
           'onlineNow',         (select count(*) from public.presence pr
                                  where pr.last_seen > now() - interval '5 minutes'
                                    and not exists (select 1 from public.bots b where b.uid = pr.uid)),
           'matchesAllTime',    (select count(*) from public.matches where finished_reason is distinct from 'aborted'),
           'platformLastUsed',  (select coalesce(jsonb_object_agg(coalesce(last_platform, 'unknown'), n), '{}'::jsonb)
                                   from (select last_platform, count(*) as n from humans group by 1) s),
           'everUsedApp',       (select count(*) from humans where 'android' = any(platforms_seen) or 'ios' = any(platforms_seen)),
           'everUsedWeb',       (select count(*) from humans where 'web' = any(platforms_seen) or 'web-installed' = any(platforms_seen)),
           'usedBoth',          (select count(*) from humans
                                  where ('android' = any(platforms_seen) or 'ios' = any(platforms_seen))
                                    and ('web' = any(platforms_seen) or 'web-installed' = any(platforms_seen)))
         )
    into v_totals;

  return jsonb_build_object(
    'generatedAt', now(),
    'days',        v_days_json,
    'totals',      v_totals
  );
end;
$$;

revoke execute on function public.admin_stats(integer) from public, anon;
grant execute on function public.admin_stats(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Make yourself admin (run once, with your sign-in email):
--   insert into public.admins (uid)
--   select id from auth.users where email = '<your email>'
--   on conflict do nothing;
-- ---------------------------------------------------------------------------
