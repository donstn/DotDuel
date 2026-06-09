-- ⚠️ COPY THIS ENTIRE FILE INTO THE SUPABASE DASHBOARD → SQL EDITOR → RUN.
--
-- Phase 3 #2: put `leaderboard` + `matches` on Realtime so the client reads
-- (Rankings list, GameOver Elo delta, recent-match history) update live — the
-- analog of the Firebase onSnapshot queries. RLS still applies:
--   leaderboard_select_all  -> public read (anon + authenticated)
--   matches_select_all      -> authenticated read
-- so delivery respects those policies.
--
-- Idempotent.

alter table public.leaderboard replica identity full;
alter table public.matches     replica identity full;

do $$ begin
  if not exists (select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'leaderboard') then
    alter publication supabase_realtime add table public.leaderboard;
  end if;
  if not exists (select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'matches') then
    alter publication supabase_realtime add table public.matches;
  end if;
end $$;

notify pgrst, 'reload schema';
