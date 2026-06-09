-- ⚠️ COPY THIS ENTIRE FILE INTO THE SUPABASE DASHBOARD → SQL EDITOR → RUN.
--
-- Phase 3 (coupled reads): put `profiles` on Realtime so the client's
-- watchProfile (rating / name / streak) updates live — the analog of the
-- Firebase users/{uid} onSnapshot. RLS still limits delivery to the owner
-- (profiles_select_own: auth.uid() = id), so a player only ever receives their
-- OWN profile changes (e.g. a new rating written by finalize_game).
--
-- Idempotent.

alter table public.profiles replica identity full;

do $$ begin
  if not exists (select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'profiles') then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;

notify pgrst, 'reload schema';
