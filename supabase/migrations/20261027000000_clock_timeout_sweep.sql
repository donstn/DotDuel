-- Server backstop for chess-clock timeouts. Timeouts were only ever claimed by
-- a client (submit-move action 'timeout'); vs a bot only the human's phone can
-- claim, so a phone that claimed too early (clock drift → NOT_EXPIRED), was
-- backgrounded or was closed left the game sitting at 0:00 forever. This sweep
-- finishes any active game whose mover's clock has run out, the same way
-- submit-move's finish() does (columns + state.finished/winner mirror, then
-- finalize_game for Elo/history).
--
-- Only games that expired within the last 6 hours: older stuck rows predate the
-- sweep and are left alone rather than rewriting months-old ratings.

create or replace function public.clock_timeout_sweep()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  g record;
  v_now_ms bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_winner integer;
  v_count integer := 0;
begin
  for g in
    select id, state
      from public.games
     where status = 'active'
       and coalesce((clock->>'turnStartedAt')::bigint, 0) > 0
       and (clock->>'turnStartedAt')::bigint
           + (case when (state->>'current') = '1'
                   then (clock->>'p1RemainingMs')::numeric
                   else (clock->>'p2RemainingMs')::numeric end)
           between v_now_ms - 6 * 3600 * 1000 and v_now_ms - 1000
     for update skip locked
  loop
    v_winner := case when (g.state->>'current') = '1' then 2 else 1 end;
    update public.games
       set status = 'finished',
           state = g.state || jsonb_build_object('finished', true, 'winner', v_winner),
           winner = v_winner::text,
           finished_reason = 'timeout',
           finished_at = now()
     where id = g.id and status = 'active';
    begin
      perform public.finalize_game(g.id);
    exception when others then
      -- retention_sweep retries unfinalized games; don't block the rest.
      raise warning 'clock_timeout_sweep: finalize_game failed for %: %', g.id, sqlerrm;
    end;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke execute on function public.clock_timeout_sweep() from public, anon, authenticated;

select cron.schedule('clock-timeout-sweep', '20 seconds', 'select public.clock_timeout_sweep();');
