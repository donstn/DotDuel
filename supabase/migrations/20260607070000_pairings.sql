-- Phase 3: pairing notifications. The matchmaker (service role) writes a row per
-- player; each player reads only their own and learns the matchId + opponent via
-- Realtime (the analog of watchPairing on pairings/{uid}).
create table public.pairings (
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
create policy pairings_select_own on public.pairings for select using (auth.uid() = uid);
create policy pairings_delete_own on public.pairings for delete using (auth.uid() = uid);
-- inserts/updates via the matchmake Edge Function (service role) only.

alter table public.pairings replica identity full;
alter publication supabase_realtime add table public.pairings;
