-- DotDuel — initial Supabase schema (Phase 0)
-- Mirrors the Firebase data model (see functions/src/index.ts + firestore.rules).
-- RLS is enabled on every table. "fn-only" columns (rating, placement, streak)
-- are writable only by SECURITY DEFINER RPCs / the service role — never by the
-- owner's own UPDATE (enforced by guard triggers below).
--
-- Apply with:  supabase db reset   (local)  or  supabase db push  (linked).

-- gen_random_uuid() is built into Postgres 13+ (Supabase). No extension needed.

-- ─────────────────────────────────────────────────────────────────────────────
-- Identity / profile
-- ─────────────────────────────────────────────────────────────────────────────

create table public.profiles (
  id                     uuid primary key references auth.users (id) on delete cascade,
  display_name           text,
  email                  text,
  auth_provider          text,
  rating                 integer not null default 1000,   -- fn-only
  placement_games_played integer not null default 0,      -- fn-only
  challenge_policy       text default 'everyone' check (challenge_policy in ('everyone','friends-only','nobody')),
  show_presence          boolean default true,
  friend_list_hidden     boolean default false,
  streak_current         integer default 0,               -- fn-only
  streak_longest         integer default 0,               -- fn-only
  streak_last_played_utc date,                            -- fn-only
  created_at             timestamptz default now()
);

create table public.usernames (
  lower        text primary key,                          -- lowercased handle (atomic claim via PK)
  uid          uuid not null references public.profiles (id) on delete cascade,
  display_name text not null,
  created_at   timestamptz default now()
);
create index usernames_uid_idx on public.usernames (uid);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, auth_provider)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_app_meta_data ->> 'provider'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Revert fn-only columns on any non-service-role UPDATE.
create or replace function public.guard_profile_cols()
returns trigger
language plpgsql
as $$
begin
  if auth.role() is distinct from 'service_role' then
    new.rating                 := old.rating;
    new.placement_games_played := old.placement_games_played;
    new.streak_current         := old.streak_current;
    new.streak_longest         := old.streak_longest;
    new.streak_last_played_utc := old.streak_last_played_utc;
    new.email                  := old.email;
    new.created_at             := old.created_at;
  end if;
  return new;
end;
$$;

create trigger guard_profile_cols_trg
  before update on public.profiles
  for each row execute function public.guard_profile_cols();

-- ─────────────────────────────────────────────────────────────────────────────
-- Social
-- ─────────────────────────────────────────────────────────────────────────────

create table public.friendships (
  id            text primary key,                         -- sorted(uidA__uidB)
  uid_a         uuid not null references public.profiles (id) on delete cascade,
  uid_b         uuid not null references public.profiles (id) on delete cascade,
  status        text not null check (status in ('pending','accepted')),
  requested_by  uuid,
  requested_at  timestamptz,
  accepted_at   timestamptz,
  display_names jsonb,
  unique (uid_a, uid_b)
);
create index friendships_uid_a_idx on public.friendships (uid_a);
create index friendships_uid_b_idx on public.friendships (uid_b);

create table public.blocks (
  blocker    uuid not null references public.profiles (id) on delete cascade,
  blocked    uuid not null,
  created_at timestamptz default now(),
  primary key (blocker, blocked)
);

create table public.invites (
  id           uuid primary key default gen_random_uuid(),
  from_uid     uuid not null references public.profiles (id) on delete cascade,
  to_uid       uuid not null references public.profiles (id) on delete cascade,
  group_id     uuid,
  shape        text,
  time_control jsonb,
  from_ranked  boolean,
  status       text not null check (status in ('pending','accepted','declined','cancelled','expired')),
  match_id     uuid,
  created_at   timestamptz default now(),
  expires_at   timestamptz
);
create index invites_to_status_idx on public.invites (to_uid, status);
create index invites_group_idx     on public.invites (group_id);
create index invites_expires_idx   on public.invites (expires_at);

create table public.presence (
  uid               uuid primary key references public.profiles (id) on delete cascade,
  status            text,
  status_updated_at timestamptz,
  last_seen         timestamptz,
  friend_uids       uuid[] default '{}'                   -- fn-maintained
);

-- Keep friend_uids fn-only (owner may update status/last_seen freely).
create or replace function public.guard_presence_cols()
returns trigger
language plpgsql
as $$
begin
  if auth.role() is distinct from 'service_role' then
    new.friend_uids := old.friend_uids;
  end if;
  return new;
end;
$$;

create trigger guard_presence_cols_trg
  before update on public.presence
  for each row execute function public.guard_presence_cols();

-- ─────────────────────────────────────────────────────────────────────────────
-- Matchmaking / live game / history / leaderboard
-- ─────────────────────────────────────────────────────────────────────────────

create table public.matchmaking_queue (
  uid           uuid primary key references public.profiles (id) on delete cascade,
  rating        integer,
  time_control  jsonb,
  joined_at     timestamptz default now(),
  initial_range integer
);

create table public.games (
  id              uuid primary key default gen_random_uuid(),
  p1_uid          uuid references public.profiles (id),
  p2_uid          uuid references public.profiles (id),
  shape           text,
  time_control    jsonb,
  status          text not null check (status in ('active','finished')),
  state           jsonb not null,                         -- colored/completed/pending/scores/winner/current
  clock           jsonb,                                  -- p1RemainingMs/p2RemainingMs/turnStartedAt/current/totalMs
  ready           jsonb default '{}'::jsonb,
  board_loaded    jsonb default '{}'::jsonb,
  rematch         jsonb default '{}'::jsonb,
  rematch_spawned_id uuid,
  winner          text,
  finished_reason text,
  finished_at     timestamptz,
  game_started_at timestamptz,
  created_at      timestamptz default now()
);
create index games_status_idx on public.games (status);
create index games_p1_idx     on public.games (p1_uid);
create index games_p2_idx     on public.games (p2_uid);

create table public.matches (
  id                uuid primary key default gen_random_uuid(),
  status            text,
  ranked            boolean,
  p1_uid            uuid, p2_uid uuid,
  p1_display        text, p2_display text,
  shape             text, time_control jsonb,
  p1_score_final    integer, p2_score_final integer,
  p1_rating_before  integer, p1_rating_after integer, p1_rating_delta integer,
  p2_rating_before  integer, p2_rating_after integer, p2_rating_delta integer,
  elo_finalized     boolean default false,
  winner            text, finished_reason text,
  finished_at       timestamptz, game_started_at timestamptz, duration_ms integer,
  player_uids       uuid[],
  created_at        timestamptz default now()
);
create index matches_p1_idx       on public.matches (p1_uid);
create index matches_p2_idx       on public.matches (p2_uid);
create index matches_players_idx  on public.matches using gin (player_uids);
create index matches_finished_idx on public.matches (finished_at desc);

create table public.leaderboard (
  uid                    uuid primary key references public.profiles (id) on delete cascade,
  display_name           text,
  rating                 integer,
  placement_games_played integer,
  last_played_at         timestamptz,
  is_bot                 boolean default false,
  bot_level              integer
);
create index leaderboard_rating_idx on public.leaderboard (rating desc);

create table public.bots (
  uid               uuid primary key,
  display_name      text,
  rating            integer,
  bot_level         integer,
  active            boolean default true,
  think_delay_range jsonb
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Daily puzzle
-- ─────────────────────────────────────────────────────────────────────────────

create table public.daily_puzzles (
  uid                uuid not null references public.profiles (id) on delete cascade,
  utc_date           date not null,
  puzzle_id          integer,
  attempts           integer default 0 check (attempts between 0 and 3),
  best               integer,
  first_completed_at timestamptz,
  last_completed_at  timestamptz,
  primary key (uid, utc_date)
);

create table public.daily_leaderboard (
  utc_date           date not null,
  uid                uuid not null references public.profiles (id) on delete cascade,
  display_name       text,
  best               integer,
  first_completed_at timestamptz,
  attempts           integer,
  puzzle_id          integer,
  primary key (utc_date, uid)
);
create index daily_lb_rank_idx on public.daily_leaderboard (utc_date, best desc, first_completed_at asc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Campaign (NEW)
-- ─────────────────────────────────────────────────────────────────────────────

create table public.campaigns (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique,
  title       text,
  description text,
  ordering    integer,
  active      boolean default true
);

create table public.levels (
  id                uuid primary key default gen_random_uuid(),
  campaign_id       uuid not null references public.campaigns (id) on delete cascade,
  sequence_index    integer not null,
  shape             text not null,
  opening_moves     integer[] not null default '{}',
  ai_difficulty     integer not null check (ai_difficulty between 1 and 5),
  par_margin        integer,
  theme             text,
  tags              text[],
  seed              bigint,
  generator_version integer default 1,
  unique (campaign_id, sequence_index)
);
create index levels_campaign_seq_idx on public.levels (campaign_id, sequence_index);

create table public.level_progress (
  uid                uuid not null references public.profiles (id) on delete cascade,
  level_id           uuid not null references public.levels (id) on delete cascade,
  attempts           integer default 0,
  best_margin        integer,
  completed          boolean default false,
  stars              integer default 0 check (stars between 0 and 3),
  first_completed_at timestamptz,
  last_attempt_at    timestamptz,
  primary key (uid, level_id)
);
create index level_progress_uid_idx on public.level_progress (uid);

create table public.level_leaderboard (
  level_id     uuid not null references public.levels (id) on delete cascade,
  uid          uuid not null references public.profiles (id) on delete cascade,
  display_name text,
  best_margin  integer,
  stars        integer,
  completed_at timestamptz,
  primary key (level_id, uid)
);
create index level_lb_rank_idx on public.level_leaderboard (level_id, best_margin desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security
--   Pattern: enable RLS on all tables; add only the policies below. Anything
--   without a matching policy is denied for authenticated/anon. The service
--   role (Edge Functions / RPCs marked SECURITY DEFINER) bypasses RLS, so all
--   authoritative writes (Elo, game state, claims) go through those.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles          enable row level security;
alter table public.usernames         enable row level security;
alter table public.friendships       enable row level security;
alter table public.blocks            enable row level security;
alter table public.invites           enable row level security;
alter table public.presence          enable row level security;
alter table public.matchmaking_queue enable row level security;
alter table public.games             enable row level security;
alter table public.matches           enable row level security;
alter table public.leaderboard       enable row level security;
alter table public.bots              enable row level security;
alter table public.daily_puzzles     enable row level security;
alter table public.daily_leaderboard enable row level security;
alter table public.campaigns         enable row level security;
alter table public.levels            enable row level security;
alter table public.level_progress    enable row level security;
alter table public.level_leaderboard enable row level security;

-- profiles: read/update own row only (fn-only cols reverted by guard trigger).
create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- usernames: any authenticated may read (availability check); own rows writable.
create policy usernames_select_all on public.usernames for select to authenticated using (true);
create policy usernames_write_own  on public.usernames for all using (auth.uid() = uid) with check (auth.uid() = uid);

-- friendships: visible to participants; writes via RPC (service role) only.
create policy friendships_select on public.friendships for select using (auth.uid() in (uid_a, uid_b));

-- blocks: full access to own block list.
create policy blocks_own on public.blocks for all using (auth.uid() = blocker) with check (auth.uid() = blocker);

-- invites: visible to sender/recipient; writes via RPC only.
create policy invites_select on public.invites for select using (auth.uid() in (from_uid, to_uid));

-- presence: visible to self + friends; owner updates own row (friend_uids guarded).
create policy presence_select on public.presence for select
  using (auth.uid() = uid or auth.uid() = any (friend_uids));
create policy presence_upsert on public.presence for insert with check (auth.uid() = uid);
create policy presence_update on public.presence for update using (auth.uid() = uid) with check (auth.uid() = uid);

-- matchmaking_queue: own entry only (matchmaker reads all via service role).
create policy queue_own on public.matchmaking_queue for all using (auth.uid() = uid) with check (auth.uid() = uid);

-- games: participants may read; no client writes (Edge Function/service role only).
create policy games_select on public.games for select using (auth.uid() in (p1_uid, p2_uid));

-- matches / leaderboard: public read; writes via Elo RPC only.
create policy matches_select_all     on public.matches     for select to authenticated using (true);
create policy leaderboard_select_all on public.leaderboard for select to authenticated, anon using (true);

-- bots: no client access (service role only — no policies).

-- daily puzzle: owner reads own attempts; writes via finalize_daily RPC.
create policy daily_puzzles_select_own on public.daily_puzzles for select using (auth.uid() = uid);
create policy daily_lb_select_all      on public.daily_leaderboard for select to authenticated, anon using (true);

-- campaign catalog: public read; writes via importer/service role.
create policy campaigns_select_all on public.campaigns for select to authenticated, anon using (true);
create policy levels_select_all    on public.levels    for select to authenticated, anon using (true);

-- campaign progress: owner reads own; writes via complete_level RPC.
create policy level_progress_select_own on public.level_progress for select using (auth.uid() = uid);
create policy level_lb_select_all       on public.level_leaderboard for select to authenticated, anon using (true);
