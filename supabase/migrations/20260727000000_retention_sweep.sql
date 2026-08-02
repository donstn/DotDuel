-- GDPR Art. 5(1)(e) storage-limitation fix (gdpr-compliance audit, 2026-07-27,
-- Critical #1 + #2). public/privacy.html promises two automated deletions that
-- were never implemented:
--   - "Live game state: deleted within ~24 hours of game end." finalize_game()
--     copies a finished game into `matches` but leaves the source `games` row
--     (full board/clock state, both players' uuids) with status='finished'
--     forever — the only place it was ever removed was account-delete, and
--     only for the deleting user's own games.
--   - "Match history: kept up to 24 months, then permanently deleted." No
--     cron/RPC implementing that purge existed anywhere.
-- This sweep enforces both. Apply via dashboard SQL Editor /
-- `npx supabase db query --linked -f` (NOT db push), per project convention.

create or replace function public.retention_sweep() returns void
language plpgsql security definer set search_path = public as $$
declare
  swept_game_ids uuid[];
  stuck_count integer;
  stuck_game record;
begin
  -- Live game state: purge finished games older than 24h, but ONLY once
  -- finalize_game has actually committed the permanent record (matches.id =
  -- games.id, elo_finalized = true). finalize_game runs as a follow-up RPC
  -- call after the games row is marked finished (see submit-move); a
  -- transient failure there (network blip, engine error) can leave a game
  -- 'finished' with no matches row at all. Purging by age alone would then
  -- destroy the only copy of that game forever with no way to retry
  -- finalization or reconstruct the result (codex adversarial review,
  -- 2026-08-02, high-severity finding). Also drop any leftover pairing rows
  -- pointing at the swept games — mirrors the cleanup account-delete already
  -- does for a single user's own games.
  select array_agg(g.id) into swept_game_ids
    from public.games g
    join public.matches m on m.id = g.id
   where g.status = 'finished'
     and g.finished_at < now() - interval '24 hours'
     and m.elo_finalized = true;

  if swept_game_ids is not null then
    delete from public.pairings where match_id = any(swept_game_ids);
    delete from public.games where id = any(swept_game_ids);
  end if;

  -- Finished-but-unfinalized games are retried, not purged. Log so a
  -- persistently stuck game is visible instead of silently piling up.
  select count(*) into stuck_count
    from public.games g
    left join public.matches m on m.id = g.id
   where g.status = 'finished'
     and g.finished_at < now() - interval '24 hours'
     and coalesce(m.elo_finalized, false) = false;

  if stuck_count > 0 then
    raise warning 'retention_sweep: % finished game(s) older than 24h still unfinalized, retrying finalize_game', stuck_count;
  end if;

  -- Retry finalize_game for every stuck game (any age, not just >24h — fix it
  -- as soon as possible), one at a time so a single persistently-broken game
  -- (e.g. a data problem finalize_game can't recover from) can't raise an
  -- exception that aborts the whole sweep and skips the match-history purge
  -- below.
  for stuck_game in
    select g.id
      from public.games g
      left join public.matches m on m.id = g.id
     where g.status = 'finished'
       and coalesce(m.elo_finalized, false) = false
  loop
    begin
      perform public.finalize_game(stuck_game.id);
    exception when others then
      raise warning 'retention_sweep: finalize_game retry failed for game %: %', stuck_game.id, sqlerrm;
    end;
  end loop;

  -- Match history: purge matches past the disclosed 24-month retention.
  delete from public.matches where finished_at < now() - interval '24 months';
end;
$$;

revoke execute on function public.retention_sweep()
  from public, anon, authenticated;

do $$
begin
  perform cron.unschedule('retention-sweep');
exception when others then null;
end $$;

-- Hourly, so the "~24h" claim stays accurate to within an hour.
select cron.schedule('retention-sweep', '7 * * * *', 'select public.retention_sweep();');
