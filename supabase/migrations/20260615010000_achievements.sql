-- Achievements: a player's UNLOCKED set + the one badge they choose to feature.
-- Definitions live in client code (src/achievements/catalog.ts); only unlocks
-- sync, so they follow the player across devices and are visible on opponents.
--
-- Apply via dashboard SQL Editor / `npx supabase db query --linked -f` (NOT
-- db push), per project convention.

-- ── Unlocked badges: one row per (uid, achievement_id) ──────────────────────
create table if not exists public.player_achievements (
  uid            uuid        not null references auth.users (id) on delete cascade,
  achievement_id text        not null,
  unlocked_at    timestamptz not null default now(),
  primary key (uid, achievement_id)
);

alter table public.player_achievements enable row level security;

-- Readable by anyone (badges are public — shown on opponents + profiles, same
-- visibility model as the leaderboard/display name). Accepted risk: a client
-- can insert its own unlocks unvalidated (offline-first, client-trusted) — the
-- same trust model as local single-player stats. Harden with a SECURITY DEFINER
-- validator before any prize/economy hangs off achievements.
create policy player_achievements_select_all
  on public.player_achievements for select
  to authenticated, anon
  using (true);

create policy player_achievements_insert_own
  on public.player_achievements for insert
  to authenticated
  with check ((select auth.uid()) = uid);

-- Achievements are permanent: no update/delete policy on purpose.

-- ── Featured badge: the one a player pins next to their name in-game ─────────
-- Plain text (an achievement id) the owner sets via the existing
-- profiles_update_own policy. NOT in guard_profile_cols' protected list, so a
-- normal self-update goes through without the protected-write flag.
alter table public.profiles
  add column if not exists featured_achievement text;
