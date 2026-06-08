-- ===========================================================================
-- Phase 4 cutover: migrate the real players' Elo from Firebase to Supabase.
-- ===========================================================================
-- Run ONCE, at cutover, AFTER each real player has signed into the Supabase
-- build at least once with Google (that creates their auth.users row + profile;
-- this script matches them by email and backfills their rating + leaderboard).
--
-- HOW TO RUN:
--   1. In the Firebase console (project `dotduel`), read each player's current
--      values from  users/{uid}  and  leaderboard/{uid}:
--        - email, displayName, rating, placementGamesPlayed
--   2. Fill the `targets` array below with those values.
--   3. Apply:  npx supabase db query --linked -f scripts/migrate-players.sql
--      (or paste into the dashboard SQL Editor).
--   4. Re-run is safe — it's idempotent (upsert + overwrite).
--
-- The single DO block runs as one transaction so the protected-write flag
-- (required because profiles.rating is guarded by guard_profile_cols) stays in
-- effect for the rating writes. It does NOT persist any callable, so there is
-- no lingering "set my own rating" endpoint.
-- ===========================================================================
do $$
declare
  targets jsonb := '[
    {"email":"REPLACE_PLAYER1@example.com","rating":1000,"pg":0,"name":"Player1"},
    {"email":"REPLACE_PLAYER2@example.com","rating":1000,"pg":0,"name":"Player2"}
  ]'::jsonb;
  t jsonb;
  pid uuid;
begin
  perform set_config('app.allow_protected_write', 'on', true);
  for t in select * from jsonb_array_elements(targets) loop
    select p.id into pid
      from profiles p
      join auth.users u on u.id = p.id
      where lower(u.email) = lower(t->>'email');
    if pid is null then
      raise notice 'SKIP % — no Supabase user yet (have they signed in?)', t->>'email';
      continue;
    end if;

    update profiles set
      rating = (t->>'rating')::int,
      placement_games_played = (t->>'pg')::int,
      display_name = coalesce(t->>'name', display_name)
      where id = pid;

    insert into leaderboard (uid, display_name, rating, placement_games_played, last_played_at, is_bot)
      values (pid, coalesce(t->>'name', 'Player'), (t->>'rating')::int, (t->>'pg')::int, now(), false)
      on conflict (uid) do update set
        rating = excluded.rating,
        placement_games_played = excluded.placement_games_played,
        display_name = excluded.display_name;

    raise notice 'MIGRATED % -> rating % (% placement games)', t->>'email', t->>'rating', t->>'pg';
  end loop;
end $$;
