-- ⚠️ COPY THIS ENTIRE FILE INTO THE SUPABASE DASHBOARD → SQL EDITOR → RUN.
--
-- Phase 3: seed the 5 bot identities (port of Firebase seedBots + BOT_SEEDS).
-- Bots are REAL accounts: games.p1_uid/p2_uid -> profiles.id -> auth.users.id,
-- so each bot needs an auth.users row (which fires handle_new_user -> profiles),
-- plus a bots row (level + think delay) and a leaderboard row (is_bot=true).
--
-- Idempotent: on conflict do nothing / guarded updates. Safe to re-run.
-- Ratings/placement are fn-only columns, so we flip the protected-write flag
-- for this session before touching profiles (same mechanism finalize_game uses).
--
-- Bot UUIDs are fixed so the Edge Functions / future re-seeds stay stable.

-- Let this session write the fn-only profile columns (rating/placement).
select set_config('app.allow_protected_write', 'on', false);

-- 1) auth.users — minimal rows. Empty-string token columns avoid NOT NULL
--    violations on some Supabase versions. handle_new_user creates the profile.
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
   confirmation_token, recovery_token, email_change_token_new, email_change)
values
  ('00000000-0000-0000-0000-000000000000','b0000001-0000-4000-8000-000000000001','authenticated','authenticated','pip@bots.dotduel.local',     null, now(), now(), now(), '{"provider":"bot","providers":["bot"]}','{"full_name":"Pip"}','','','',''),
  ('00000000-0000-0000-0000-000000000000','b0000002-0000-4000-8000-000000000002','authenticated','authenticated','cricket@bots.dotduel.local', null, now(), now(), now(), '{"provider":"bot","providers":["bot"]}','{"full_name":"Cricket"}','','','',''),
  ('00000000-0000-0000-0000-000000000000','b0000003-0000-4000-8000-000000000003','authenticated','authenticated','ranger@bots.dotduel.local',  null, now(), now(), now(), '{"provider":"bot","providers":["bot"]}','{"full_name":"Ranger"}','','','',''),
  ('00000000-0000-0000-0000-000000000000','b0000004-0000-4000-8000-000000000004','authenticated','authenticated','knight@bots.dotduel.local',  null, now(), now(), now(), '{"provider":"bot","providers":["bot"]}','{"full_name":"Knight"}','','','',''),
  ('00000000-0000-0000-0000-000000000000','b0000005-0000-4000-8000-000000000005','authenticated','authenticated','voidstar@bots.dotduel.local',null, now(), now(), now(), '{"provider":"bot","providers":["bot"]}','{"full_name":"Voidstar"}','','','','')
on conflict (id) do nothing;

-- 2) profiles — set display_name + rating + placement (100 => steady K=32 and
--    all shapes unlocked). The auto-created row defaults rating=1000; override here.
update public.profiles set display_name = 'Pip',      rating = 500,  placement_games_played = 100 where id = 'b0000001-0000-4000-8000-000000000001';
update public.profiles set display_name = 'Cricket',  rating = 850,  placement_games_played = 100 where id = 'b0000002-0000-4000-8000-000000000002';
update public.profiles set display_name = 'Ranger',   rating = 1150, placement_games_played = 100 where id = 'b0000003-0000-4000-8000-000000000003';
update public.profiles set display_name = 'Knight',   rating = 1450, placement_games_played = 100 where id = 'b0000004-0000-4000-8000-000000000004';
update public.profiles set display_name = 'Voidstar', rating = 1750, placement_games_played = 100 where id = 'b0000005-0000-4000-8000-000000000005';

-- 3) bots — level + per-bot think-delay range (ms). Edge Functions read this.
insert into public.bots (uid, display_name, rating, bot_level, active, think_delay_range) values
  ('b0000001-0000-4000-8000-000000000001','Pip',     500, 1, true, '{"min":500,"max":1500}'::jsonb),
  ('b0000002-0000-4000-8000-000000000002','Cricket', 850, 2, true, '{"min":700,"max":1800}'::jsonb),
  ('b0000003-0000-4000-8000-000000000003','Ranger', 1150, 3, true, '{"min":800,"max":2200}'::jsonb),
  ('b0000004-0000-4000-8000-000000000004','Knight', 1450, 4, true, '{"min":1000,"max":2800}'::jsonb),
  ('b0000005-0000-4000-8000-000000000005','Voidstar',1750,5, true, '{"min":1200,"max":3500}'::jsonb)
on conflict (uid) do nothing;

-- 4) leaderboard — denorm so bots appear immediately; is_bot flag preserved by
--    finalize_game (see 20260608030000_finalize_game_bots.sql).
insert into public.leaderboard (uid, display_name, rating, placement_games_played, last_played_at, is_bot, bot_level) values
  ('b0000001-0000-4000-8000-000000000001','Pip',     500, 100, now(), true, 1),
  ('b0000002-0000-4000-8000-000000000002','Cricket', 850, 100, now(), true, 2),
  ('b0000003-0000-4000-8000-000000000003','Ranger', 1150, 100, now(), true, 3),
  ('b0000004-0000-4000-8000-000000000004','Knight', 1450, 100, now(), true, 4),
  ('b0000005-0000-4000-8000-000000000005','Voidstar',1750,100, now(), true, 5)
on conflict (uid) do nothing;
