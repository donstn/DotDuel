-- Guard against a duplicate bot game when the client fast-path (request-bot-match
-- or a human matchmake) pairs the user between the sweep's snapshot and its delete.
-- Without checking the delete rowcount, the sweep would still create a 2nd game.
create or replace function bot_fallback_sweep() returns void
language plpgsql security definer set search_path = public as $$
declare
  e record; bot record; tc text; total_ms int; st jsonb; ck jsonb; gid uuid; claimed int;
begin
  for e in
    select * from matchmaking_queue where joined_at < now() - interval '20 seconds'
  loop
    select b.uid as uid,
           coalesce(p.display_name, b.display_name, 'Bot') as display_name,
           coalesce(p.rating, 1000) as rating, b.bot_level as bot_level
      into bot
    from bots b left join profiles p on p.id = b.uid
    where b.active = true
    order by abs(coalesce(p.rating, 1000) - coalesce(e.rating, 1000)) asc, random()
    limit 1;
    if not found then continue; end if;

    -- Claim the slot FIRST and bail if it's already gone (paired meanwhile).
    delete from matchmaking_queue where uid = e.uid;
    get diagnostics claimed = row_count;
    if claimed = 0 then continue; end if;

    tc := coalesce(e.time_control #>> '{}', '3min');
    total_ms := case tc when '1min' then 60000 when '5min' then 300000 else 180000 end;
    st := jsonb_build_object(
      'shape', e.shape, 'mode', 'multiplayer', 'current', 1, 'turn', 0,
      'colored', '{}'::jsonb, 'completed', '[]'::jsonb, 'pending', '[]'::jsonb,
      'scores', jsonb_build_object('1', 0, '2', 0), 'finished', false, 'winner', null);
    ck := jsonb_build_object('p1RemainingMs', total_ms, 'p2RemainingMs', total_ms,
      'turnStartedAt', 0, 'current', 1, 'totalMs', total_ms);

    insert into games (p1_uid, p2_uid, shape, time_control, status, state, clock,
                       ready, board_loaded, rematch)
    values (e.uid, bot.uid, e.shape, e.time_control, 'active', st, ck,
            '{"2": true}'::jsonb, '{"2": true}'::jsonb, '{}'::jsonb)
    returning id into gid;

    insert into pairings (uid, match_id, shape, player, opponent_uid,
                          opponent_display_name, opponent_rating, opponent_is_bot, opponent_bot_level)
    values (e.uid, gid, e.shape, 1, bot.uid, bot.display_name, bot.rating, true, bot.bot_level)
    on conflict (uid) do update set
      match_id = excluded.match_id, shape = excluded.shape, player = excluded.player,
      opponent_uid = excluded.opponent_uid, opponent_display_name = excluded.opponent_display_name,
      opponent_rating = excluded.opponent_rating, opponent_is_bot = excluded.opponent_is_bot,
      opponent_bot_level = excluded.opponent_bot_level;
  end loop;
end;
$$;
