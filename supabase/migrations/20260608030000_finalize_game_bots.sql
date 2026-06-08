-- ⚠️ COPY THIS ENTIRE FILE INTO THE SUPABASE DASHBOARD → SQL EDITOR → RUN.
--
-- Phase 3 (bots): make finalize_game bot-aware. Bots are real profiles, so the
-- Elo math + rating writes already work — but the leaderboard upsert hard-coded
-- is_bot=false, which would flip a bot's leaderboard row to "human" after its
-- first ranked game. Preserve is_bot (+ bot_level) by checking the bots table.
--
-- Replaces finalize_game from 20260607050000_finalize_game.sql. Bot games are
-- ranked (matches Firebase spawnBotMatch ranked:true); the bot's rating floats.

create or replace function public.finalize_game(p_game_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  g          record;
  v_r1 integer; v_r2 integer; v_pg1 integer; v_pg2 integer;
  v_dn1 text;  v_dn2 text;
  v_exp1 double precision; v_act1 double precision; v_act2 double precision;
  v_k1 integer; v_k2 integer; v_d1 integer; v_d2 integer;
  v_new1 integer; v_new2 integer; v_s1 integer; v_s2 integer;
  v_ranked boolean;
  v_bot1 boolean; v_bot2 boolean; v_lvl1 integer; v_lvl2 integer;
  v_k constant integer[] := array[50,45,40,35,30,25,20,15,10,10];
  v_already boolean;
begin
  select elo_finalized into v_already from public.matches where id = p_game_id;
  if coalesce(v_already, false) then
    return jsonb_build_object('alreadyFinalized', true);
  end if;

  select p1_uid, p2_uid, status, winner, finished_reason, shape, time_control,
         state, game_started_at, finished_at
    into g
    from public.games where id = p_game_id;
  if not found then raise exception 'GAME_NOT_FOUND'; end if;
  if g.status is distinct from 'finished' then raise exception 'GAME_NOT_FINISHED'; end if;

  v_ranked := g.finished_reason is distinct from 'aborted';
  perform set_config('app.allow_protected_write', 'on', true);

  select rating, placement_games_played, display_name into v_r1, v_pg1, v_dn1
    from public.profiles where id = g.p1_uid;
  select rating, placement_games_played, display_name into v_r2, v_pg2, v_dn2
    from public.profiles where id = g.p2_uid;
  v_r1 := coalesce(v_r1, 1000);  v_r2 := coalesce(v_r2, 1000);
  v_pg1 := coalesce(v_pg1, 0);   v_pg2 := coalesce(v_pg2, 0);

  -- Bot flags for the leaderboard upsert (preserve is_bot/bot_level).
  select true, bot_level into v_bot1, v_lvl1 from public.bots where uid = g.p1_uid;
  select true, bot_level into v_bot2, v_lvl2 from public.bots where uid = g.p2_uid;
  v_bot1 := coalesce(v_bot1, false);  v_bot2 := coalesce(v_bot2, false);

  v_s1 := coalesce((g.state->'scores'->>'1')::integer, 0);
  v_s2 := coalesce((g.state->'scores'->>'2')::integer, 0);

  v_exp1 := 1.0 / (1.0 + power(10.0, (v_r2 - v_r1) / 400.0));

  if g.winner = '1' then v_act1 := 1; v_act2 := 0;
  elsif g.winner = '2' then v_act1 := 0; v_act2 := 1;
  else v_act1 := 0.5; v_act2 := 0.5;
  end if;

  v_k1 := case when v_pg1 >= 10 then 32 else v_k[v_pg1 + 1] end;
  v_k2 := case when v_pg2 >= 10 then 32 else v_k[v_pg2 + 1] end;

  v_d1 := round(v_k1 * (v_act1 - v_exp1))::integer;
  v_d2 := round(v_k2 * (v_act2 - (1.0 - v_exp1)))::integer;
  if not v_ranked then v_d1 := 0; v_d2 := 0; end if;

  v_new1 := v_r1 + v_d1;  v_new2 := v_r2 + v_d2;

  if v_ranked then
    update public.profiles set rating = v_new1, placement_games_played = v_pg1 + 1 where id = g.p1_uid;
    update public.profiles set rating = v_new2, placement_games_played = v_pg2 + 1 where id = g.p2_uid;

    insert into public.leaderboard (uid, display_name, rating, placement_games_played, last_played_at, is_bot, bot_level)
    values (g.p1_uid, v_dn1, v_new1, v_pg1 + 1, now(), v_bot1, v_lvl1)
    on conflict (uid) do update set display_name = excluded.display_name, rating = excluded.rating,
      placement_games_played = excluded.placement_games_played, last_played_at = excluded.last_played_at,
      is_bot = excluded.is_bot, bot_level = excluded.bot_level;
    insert into public.leaderboard (uid, display_name, rating, placement_games_played, last_played_at, is_bot, bot_level)
    values (g.p2_uid, v_dn2, v_new2, v_pg2 + 1, now(), v_bot2, v_lvl2)
    on conflict (uid) do update set display_name = excluded.display_name, rating = excluded.rating,
      placement_games_played = excluded.placement_games_played, last_played_at = excluded.last_played_at,
      is_bot = excluded.is_bot, bot_level = excluded.bot_level;
  end if;

  insert into public.matches (id, status, ranked, p1_uid, p2_uid, p1_display, p2_display,
      shape, time_control, p1_score_final, p2_score_final,
      p1_rating_before, p1_rating_after, p1_rating_delta,
      p2_rating_before, p2_rating_after, p2_rating_delta,
      elo_finalized, winner, finished_reason, finished_at, game_started_at, duration_ms, player_uids)
  values (p_game_id, 'finished', v_ranked, g.p1_uid, g.p2_uid, v_dn1, v_dn2,
      g.shape, g.time_control, v_s1, v_s2,
      v_r1, v_new1, v_d1, v_r2, v_new2, v_d2,
      true, g.winner, g.finished_reason, g.finished_at, g.game_started_at,
      case when g.game_started_at is not null and g.finished_at is not null
           then (extract(epoch from (g.finished_at - g.game_started_at)) * 1000)::integer end,
      array[g.p1_uid, g.p2_uid])
  on conflict (id) do update set
    status = 'finished', ranked = excluded.ranked,
    p1_score_final = excluded.p1_score_final, p2_score_final = excluded.p2_score_final,
    p1_rating_after = excluded.p1_rating_after, p1_rating_delta = excluded.p1_rating_delta,
    p2_rating_after = excluded.p2_rating_after, p2_rating_delta = excluded.p2_rating_delta,
    elo_finalized = true, winner = excluded.winner,
    finished_reason = excluded.finished_reason, finished_at = excluded.finished_at;

  return jsonb_build_object('p1Delta', v_d1, 'p2Delta', v_d2,
    'p1After', v_new1, 'p2After', v_new2, 'ranked', v_ranked);
end;
$$;

grant execute on function public.finalize_game(uuid) to service_role;
