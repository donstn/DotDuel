-- Daily puzzle results retention (2026-10-11). public/privacy.html now
-- discloses "Daily puzzle results: up to 24 months after the puzzle date, then
-- permanently deleted." This enforces it. Kept as its own function + cron job
-- rather than editing retention_sweep(), so it can't clobber a newer prod
-- version of that function. daily_puzzle_defs (the shared board/opening, no
-- personal data) is intentionally kept.
-- Apply via dashboard SQL Editor / `npx supabase db query --linked -f`
-- (NOT db push), per project convention.

create or replace function public.daily_results_retention_sweep() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.daily_leaderboard where utc_date < (current_date - interval '24 months');
  delete from public.daily_puzzles     where utc_date < (current_date - interval '24 months');
end;
$$;

revoke execute on function public.daily_results_retention_sweep()
  from public, anon, authenticated;

do $$
begin
  perform cron.unschedule('daily-results-retention');
exception when others then null;
end $$;

select cron.schedule('daily-results-retention', '23 3 * * *', 'select public.daily_results_retention_sweep();');
