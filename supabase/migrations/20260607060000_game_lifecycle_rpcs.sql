-- Phase 3: lifecycle RPCs. Clients can't write `games` directly (no RLS write
-- policy), so these SECURITY DEFINER fns set the handshake/rematch flags after a
-- participant check. set_board_loaded also starts the clock once both boards are
-- in (turnStartedAt is epoch-ms to match the submit-move Edge Function's now()).

create or replace function public.set_ready(p_game_id uuid, p_value boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_slot text;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select case when p1_uid = v_uid then '1' when p2_uid = v_uid then '2' end
    into v_slot from public.games where id = p_game_id;
  if v_slot is null then raise exception 'NOT_PARTICIPANT'; end if;
  update public.games
     set ready = coalesce(ready, '{}'::jsonb) || jsonb_build_object(v_slot, p_value)
   where id = p_game_id;
end; $$;
grant execute on function public.set_ready(uuid, boolean) to authenticated;

create or replace function public.set_rematch(p_game_id uuid, p_value boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_slot text;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select case when p1_uid = v_uid then '1' when p2_uid = v_uid then '2' end
    into v_slot from public.games where id = p_game_id;
  if v_slot is null then raise exception 'NOT_PARTICIPANT'; end if;
  update public.games
     set rematch = coalesce(rematch, '{}'::jsonb) || jsonb_build_object(v_slot, p_value)
   where id = p_game_id;
end; $$;
grant execute on function public.set_rematch(uuid, boolean) to authenticated;

create or replace function public.set_board_loaded(p_game_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_slot text;
  v_started timestamptz;
  v_loaded jsonb;
  v_now_ms bigint := (extract(epoch from now()) * 1000)::bigint;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select case when p1_uid = v_uid then '1' when p2_uid = v_uid then '2' end,
         game_started_at
    into v_slot, v_started
    from public.games where id = p_game_id;
  if v_slot is null then raise exception 'NOT_PARTICIPANT'; end if;

  update public.games
     set board_loaded = coalesce(board_loaded, '{}'::jsonb) || jsonb_build_object(v_slot, true)
   where id = p_game_id
   returning board_loaded into v_loaded;

  -- Start the clock once both boards are loaded (idempotent on game_started_at).
  if v_started is null
     and coalesce((v_loaded->>'1')::boolean, false)
     and coalesce((v_loaded->>'2')::boolean, false) then
    update public.games
       set game_started_at = now(),
           clock = coalesce(clock, '{}'::jsonb)
                   || jsonb_build_object('turnStartedAt', v_now_ms)
     where id = p_game_id and game_started_at is null;
  end if;
end; $$;
grant execute on function public.set_board_loaded(uuid) to authenticated;
