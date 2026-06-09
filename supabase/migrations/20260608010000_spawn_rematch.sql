-- ⚠️ COPY THIS ENTIRE FILE INTO THE SUPABASE DASHBOARD → SQL EDITOR → RUN.
--
-- Phase 3: rematch spawn. Port of the Firebase `rematchGame` Cloud Function
-- (functions/src/index.ts:856). Firebase used a Firestore onUpdate trigger;
-- Supabase has no equivalent, so we fold the spawn straight into set_rematch:
-- when BOTH sides have flagged rematch and none has spawned yet, create the new
-- game + both pairing rows here, atomically. The client routes into the new game
-- via watchPairing (App.tsx:1226 — "new pairing arrives via watchPairing").
--
-- Idempotency: SELECT ... FOR UPDATE row-locks the old game so two near-
-- simultaneous rematch clicks serialize; the second sees rematch_spawned_id set
-- and skips. Slots swap (previous P2 plays first), mirroring Firebase.
--
-- Replaces the set_rematch from 20260607060000_game_lifecycle_rpcs.sql.

create or replace function public.set_rematch(p_game_id uuid, p_value boolean)
returns void language plpgsql security definer set search_path = public as $$
declare
  g            record;
  v_uid        uuid := auth.uid();
  v_slot       text;
  v_rematch    jsonb;
  v_new_id     uuid;
  v_new_p1     uuid;
  v_new_p2     uuid;
  v_shape      text;
  v_tc         jsonb;
  v_total      integer;
  v_dn1 text; v_rt1 integer;
  v_dn2 text; v_rt2 integer;
  v_state      jsonb;
  v_clock      jsonb;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;

  -- Row-lock the old game so concurrent rematch clicks serialize (idempotency).
  select * into g from public.games where id = p_game_id for update;
  if not found then raise exception 'GAME_NOT_FOUND'; end if;

  v_slot := case when g.p1_uid = v_uid then '1' when g.p2_uid = v_uid then '2' end;
  if v_slot is null then raise exception 'NOT_PARTICIPANT'; end if;

  update public.games
     set rematch = coalesce(rematch, '{}'::jsonb) || jsonb_build_object(v_slot, p_value)
   where id = p_game_id
   returning rematch into v_rematch;

  -- Spawn only when both agreed and nothing spawned from this game yet.
  if not (p_value
          and coalesce((v_rematch->>'1')::boolean, false)
          and coalesce((v_rematch->>'2')::boolean, false)
          and g.rematch_spawned_id is null) then
    return;
  end if;

  -- Swap slots: previous P2 plays first in the rematch (chess-colour alternation).
  v_new_p1 := g.p2_uid;
  v_new_p2 := g.p1_uid;
  v_shape  := g.shape;
  v_tc     := g.time_control;
  v_total  := coalesce((g.clock->>'totalMs')::integer, 180000);

  v_state := jsonb_build_object(
    'shape', v_shape, 'mode', 'multiplayer', 'current', 1, 'turn', 0,
    'colored', '{}'::jsonb, 'completed', '[]'::jsonb, 'pending', '[]'::jsonb,
    'scores', jsonb_build_object('1', 0, '2', 0), 'finished', false, 'winner', null
  );
  v_clock := jsonb_build_object(
    'p1RemainingMs', v_total, 'p2RemainingMs', v_total,
    'turnStartedAt', 0, 'current', 1, 'totalMs', v_total
  );

  insert into public.games
    (p1_uid, p2_uid, shape, time_control, status, state, clock, ready, board_loaded, rematch)
  values
    (v_new_p1, v_new_p2, v_shape, v_tc, 'active', v_state, v_clock,
     '{}'::jsonb, '{}'::jsonb, '{}'::jsonb)
  returning id into v_new_id;

  update public.games set rematch_spawned_id = v_new_id where id = p_game_id;

  select display_name, rating into v_dn1, v_rt1 from public.profiles where id = v_new_p1;
  select display_name, rating into v_dn2, v_rt2 from public.profiles where id = v_new_p2;

  insert into public.pairings
    (uid, match_id, shape, player, opponent_uid, opponent_display_name, opponent_rating, opponent_is_bot)
  values
    (v_new_p1, v_new_id, v_shape, 1, v_new_p2, coalesce(v_dn2, 'Opponent'), coalesce(v_rt2, 1000), false),
    (v_new_p2, v_new_id, v_shape, 2, v_new_p1, coalesce(v_dn1, 'Opponent'), coalesce(v_rt1, 1000), false)
  on conflict (uid) do update set
    match_id              = excluded.match_id,
    shape                 = excluded.shape,
    player                = excluded.player,
    opponent_uid          = excluded.opponent_uid,
    opponent_display_name = excluded.opponent_display_name,
    opponent_rating       = excluded.opponent_rating,
    opponent_is_bot       = excluded.opponent_is_bot,
    created_at            = now();
end; $$;

grant execute on function public.set_rematch(uuid, boolean) to authenticated;
