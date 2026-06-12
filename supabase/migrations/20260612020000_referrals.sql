-- Referral codes + durable attribution.
--
-- Share links / QR codes carry ?ref=<CODE> — a random 6-char code, NOT the
-- account uuid, so nothing identifiable leaks into messenger logs. The code
-- maps to a profile server-side; when a brand-new account arrives via a ref
-- link, claim_referral records who brought them in (write-once), so future
-- monetization can grant referral reward months retroactively.
--
-- Apply via dashboard SQL Editor / `npx supabase db query --linked -f` per
-- project convention (NOT db push).

-- ── Columns ─────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by   uuid references public.profiles (id) on delete set null,
  add column if not exists referred_at   timestamptz;

create unique index if not exists profiles_referral_code_key on public.profiles (referral_code);
create index if not exists profiles_referred_by_idx on public.profiles (referred_by);

-- ── Code generator ──────────────────────────────────────────────────────────
-- 6 chars from a 31-char alphabet (no 0/O/1/I/L confusables) ≈ 887M combos —
-- unguessable in practice, retried on the rare collision.
create or replace function public.gen_referral_code()
returns text
language plpgsql
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
begin
  for attempt in 1..20 loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    if not exists (select 1 from public.profiles where referral_code = code) then
      return code;
    end if;
  end loop;
  raise exception 'REFERRAL_CODE_EXHAUSTED';
end;
$$;

-- Backfill every existing profile.
do $$
declare
  p record;
begin
  for p in select id from public.profiles where referral_code is null loop
    update public.profiles set referral_code = public.gen_referral_code() where id = p.id;
  end loop;
end;
$$;

-- New signups get a code at profile creation.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, auth_provider, referral_code)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_app_meta_data ->> 'provider',
    public.gen_referral_code()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ── Guard: the three new columns are fn-only ────────────────────────────────
create or replace function public.guard_profile_cols()
returns trigger
language plpgsql
as $$
begin
  -- RPCs that legitimately write fn-only columns set this transaction-local
  -- flag first; direct user updates never do, so theirs get reverted.
  if coalesce(current_setting('app.allow_protected_write', true), '') <> 'on' then
    new.rating                 := old.rating;
    new.placement_games_played := old.placement_games_played;
    new.streak_current         := old.streak_current;
    new.streak_longest         := old.streak_longest;
    new.streak_last_played_utc := old.streak_last_played_utc;
    new.email                  := old.email;
    new.created_at             := old.created_at;
    new.referral_code          := old.referral_code;
    new.referred_by            := old.referred_by;
    new.referred_at            := old.referred_at;
  end if;
  return new;
end;
$$;

-- ── RPCs ────────────────────────────────────────────────────────────────────
-- Code → uid, for the existing auto-friend-request flow (codes are random, so
-- this doesn't make accounts enumerable; display name + uid are already
-- visible on the public leaderboard anyway).
create or replace function public.resolve_referral_code(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid;
begin
  select id into v_uid from profiles where referral_code = upper(trim(p_code));
  if v_uid is null then raise exception 'CODE_NOT_FOUND'; end if;
  return v_uid;
end;
$$;
grant execute on function public.resolve_referral_code(text) to authenticated;

-- Write-once attribution. Only genuinely NEW accounts (created within the
-- last 48h, unforgeable — created_at is a guarded column) can be claimed, so
-- veterans clicking a friend's link never re-attribute.
create or replace function public.claim_referral(p_code text)
returns json language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  referrer uuid;
  my_created timestamptz;
begin
  if me is null then raise exception 'UNAUTHENTICATED'; end if;
  select id into referrer from profiles where referral_code = upper(trim(p_code));
  if referrer is null then raise exception 'CODE_NOT_FOUND'; end if;
  if referrer = me then raise exception 'CANNOT_REFER_SELF'; end if;
  if exists (select 1 from bots where uid = referrer) then
    raise exception 'CODE_NOT_FOUND';
  end if;
  select created_at into my_created from profiles where id = me;
  if my_created is null or my_created < now() - interval '48 hours' then
    raise exception 'ACCOUNT_TOO_OLD';
  end if;
  perform set_config('app.allow_protected_write', 'on', true);
  update profiles set referred_by = referrer, referred_at = now()
    where id = me and referred_by is null;
  if not found then raise exception 'ALREADY_REFERRED'; end if;
  return json_build_object('ok', true);
end;
$$;
grant execute on function public.claim_referral(text) to authenticated;
