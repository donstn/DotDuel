-- Clean-slate reset of all REAL (non-bot) players' Elo for the Supabase cutover.
-- Bots keep their seeded ladder ratings (they define matchmaking spread + AI tiers).
-- Re-runnable; run again just before launch if more test games happen after.
do $$
begin
  perform set_config('app.allow_protected_write', 'on', true);
  update profiles  set rating = 1000, placement_games_played = 0
    where id  not in (select uid from bots);
  update leaderboard set rating = 1000, placement_games_played = 0
    where is_bot = false;
end $$;
