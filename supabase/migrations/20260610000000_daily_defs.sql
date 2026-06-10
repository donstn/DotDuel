-- Daily-puzzle revamp — shared per-day puzzle definition + winners helper.
--
-- The old daily puzzle picked a shape from a static client library and started
-- the player on a blank board vs a fixed L4 AI. The revamp makes ONE puzzle per
-- UTC day, identical for everyone: a random board (triangle/square/rectangle, no
-- rhombus), a random opponent level (L3–L5), and an AI-vs-AI seeded opening so
-- every player inherits the exact same coloured-dot position before taking over
-- as P1. The opening is generated server-side ONCE (the `daily-puzzle` Edge
-- Function, which runs the same engine the client does) and cached here.
--
-- Apply via the dashboard SQL Editor (NOT db push — see SUPABASE_MIGRATION.md).

create table if not exists public.daily_puzzle_defs (
  utc_date    date primary key,
  shape       text not null check (shape in ('triangle', 'square', 'rectangle')),
  ai_level    integer not null check (ai_level between 3 and 5),
  -- Ordered GameAction[] — [{ "kind":"dot", "dotId":N } | { "kind":"claim", "lineId":"..." }].
  -- Replayed via applyAction() on the client before handing control to the player.
  opening     jsonb not null,
  -- P1/P2 score after the seeded opening, for display/debug: { "1": int, "2": int }.
  seed_scores jsonb,
  created_at  timestamptz default now()
);

alter table public.daily_puzzle_defs enable row level security;

-- Public read (clients normally receive the def from the Edge Function, but a
-- direct read is harmless — the position is identical for everyone anyway).
-- Writes are service-role only (the Edge Function), so no insert/update policy.
drop policy if exists daily_defs_select_all on public.daily_puzzle_defs;
create policy daily_defs_select_all on public.daily_puzzle_defs
  for select to authenticated, anon using (true);

-- Winner of each day for the last N played days (days with at least one finished
-- attempt). DISTINCT ON picks the top row per date under the ORDER BY, i.e. the
-- highest P1 score, ties broken by who finished first. Empty days never appear
-- because daily_leaderboard only has rows for days that were actually played.
create or replace function public.recent_daily_winners(p_limit integer default 30)
returns table (
  utc_date           date,
  uid                uuid,
  display_name       text,
  best               integer,
  first_completed_at timestamptz
)
language sql
stable
as $$
  select distinct on (dl.utc_date)
         dl.utc_date, dl.uid, dl.display_name, dl.best, dl.first_completed_at
  from public.daily_leaderboard dl
  order by dl.utc_date desc, dl.best desc nulls last, dl.first_completed_at asc
  limit greatest(1, p_limit);
$$;

grant execute on function public.recent_daily_winners(integer) to authenticated, anon;
