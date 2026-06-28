-- Security hardening pass (audit 2026-06-26). Findings #1–#3 from the
-- supabase-security-scanner report. Read-only-safe: no client RPC calls any of
-- these helpers directly (verified — they are internal SECURITY DEFINER helpers
-- called only from other SECURITY DEFINER functions or pg_cron), so revoking the
-- implicit PUBLIC EXECUTE grant changes no legitimate call path.
--
-- Apply via dashboard SQL Editor / `npx supabase db query --linked -f` (NOT
-- db push), per project convention.

-- ===========================================================================
-- #1 (HIGH) + #2 (MEDIUM) — lock internal/cron-only SECURITY DEFINER helpers.
-- Postgres grants EXECUTE to PUBLIC by default, which makes any signed-in user
-- able to call these over POST /rest/v1/rpc/<fn>. They are never called by the
-- client; revoke the public grant so only the function owner (used by the outer
-- SECURITY DEFINER callers and pg_cron) and service_role can run them.
-- ===========================================================================

-- #1: cross-user write to presence.friend_uids (bypasses RLS + guard trigger).
revoke execute on function public._presence_friend(uuid, uuid, boolean)
  from public, anon, authenticated;

-- #2: leaks the block relationship between two arbitrary uids.
revoke execute on function public._is_blocked_either_way(uuid, uuid)
  from public, anon, authenticated;

-- #2: cron-only invite expiry sweep.
revoke execute on function public.expire_stale_invites()
  from public, anon, authenticated;

-- #2: cron-only bot-fallback matchmaker.
revoke execute on function public.bot_fallback_sweep()
  from public, anon, authenticated;

-- #2: Elo finalize — already granted to service_role (submit-move calls it);
-- a GRANT does not remove the implicit PUBLIC grant, so revoke it explicitly.
revoke execute on function public.finalize_game(uuid)
  from public, anon, authenticated;

-- ===========================================================================
-- #3 (MEDIUM) — make the share_cards "<50/day" cap actually enforce.
-- The cap lived in the INSERT policy's WITH CHECK as a `select count(*) from
-- share_cards`, but the table has no SELECT policy, so under RLS that subquery
-- always counts 0 and the cap never engaged. Move it to a SECURITY DEFINER
-- BEFORE-INSERT trigger (which bypasses RLS as the owner, so the count is real)
-- and simplify the policy to the ownership check it can actually enforce.
-- ===========================================================================

create or replace function public.enforce_share_cards_daily_cap()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.share_cards
        where uid = new.uid
          and created_at > now() - interval '1 day') >= 50 then
    raise exception 'SHARE_CARD_DAILY_LIMIT';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_share_cards_daily_cap()
  from public, anon, authenticated;

drop trigger if exists share_cards_daily_cap on public.share_cards;
create trigger share_cards_daily_cap
  before insert on public.share_cards
  for each row execute function public.enforce_share_cards_daily_cap();

drop policy if exists share_cards_insert_own on public.share_cards;
create policy share_cards_insert_own on public.share_cards
  for insert to authenticated
  with check ((select auth.uid()) = uid);
