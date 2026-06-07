-- Phase 3: enable Supabase Realtime (Postgres Changes) on the live game row so
-- both clients receive the new state on every server write — the analog of the
-- Firestore onSnapshot in watchGame. REPLICA IDENTITY FULL makes UPDATE events
-- carry the full new row; RLS still limits delivery to the two participants.
alter table public.games replica identity full;
alter publication supabase_realtime add table public.games;
