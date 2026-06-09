-- ⚠️ COPY THIS ENTIRE FILE INTO THE SUPABASE DASHBOARD → SQL EDITOR → RUN.
--
-- Why: the original pairings migration (20260607070000_pairings.sql) was never
-- actually applied to the live DB — PostgREST returns PGRST205 "Could not find
-- the table 'public.pairings'", which blocks watchPairing/matchmake. Verified
-- 2026-06-08: every other table + all Phase-3 RPCs + both Edge Functions exist;
-- only `pairings` is missing.
--
-- This version is idempotent (safe to run more than once) and also guards the
-- realtime publication adds + reloads the PostgREST schema cache.

-- pairings table: matchmaker (service role) writes one row per player; each
-- player reads only their own and learns matchId + opponent via Realtime.
create table if not exists public.pairings (
  uid                   uuid primary key references public.profiles (id) on delete cascade,
  match_id              uuid,
  shape                 text,
  player                integer,
  opponent_uid          uuid,
  opponent_display_name text,
  opponent_rating       integer,
  opponent_is_bot       boolean default false,
  opponent_bot_level    integer,
  created_at            timestamptz default now()
);

alter table public.pairings enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'pairings'
      and policyname = 'pairings_select_own') then
    create policy pairings_select_own on public.pairings
      for select using (auth.uid() = uid);
  end if;
  if not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'pairings'
      and policyname = 'pairings_delete_own') then
    create policy pairings_delete_own on public.pairings
      for delete using (auth.uid() = uid);
  end if;
end $$;
-- inserts/updates via the matchmake Edge Function (service role) only.

-- Realtime: REPLICA IDENTITY FULL makes UPDATE/DELETE events carry the full row;
-- RLS still limits delivery to the owning participant.
alter table public.pairings replica identity full;
alter table public.games    replica identity full;

do $$ begin
  if not exists (select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'pairings') then
    alter publication supabase_realtime add table public.pairings;
  end if;
  if not exists (select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'games') then
    alter publication supabase_realtime add table public.games;
  end if;
end $$;

-- Push the new table into PostgREST's schema cache immediately (otherwise it can
-- take a minute, or need a manual API restart).
notify pgrst, 'reload schema';
