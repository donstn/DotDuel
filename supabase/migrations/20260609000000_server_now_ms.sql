-- Lightweight server clock source for client clock-skew correction. The online
-- game clock extrapolates the active player's time as (clientNow - turnStartedAt)
-- where turnStartedAt is server epoch-ms; if the client's wall clock is skewed
-- vs the server, every active clock drifts and snaps on each turn. Clients call
-- this once per game (with RTT measurement) to compute the offset.
create or replace function server_now_ms() returns bigint
language sql stable as $$
  select (extract(epoch from clock_timestamp()) * 1000)::bigint;
$$;
grant execute on function server_now_ms() to anon, authenticated;
