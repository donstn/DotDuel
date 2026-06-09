-- Onboarding fix: Google sign-ups get profiles.display_name (handle_new_user)
-- but NO usernames row, so they can't be found by username (friend requests).
-- Auto-provision a username from the display name (sanitized to the username
-- charset, 3-16 chars, de-duplicated). In DotDuel the username IS the display
-- name (claimUsername syncs both), so we set display_name to the final handle to
-- keep "what friends type" == "what's shown". No-op if display_name is empty
-- (email sign-ups with no name still get the claim picker) or already has a row.

-- Internal worker (per uid). REVOKEd from PUBLIC so it can't be called for
-- arbitrary uids; only ensure_username() (auth.uid()-scoped) and privileged
-- backfill may use it.
create or replace function _ensure_username_for(p_uid uuid) returns text
language plpgsql security definer set search_path = public as $$
declare dn text; base text; candidate text; n int := 0;
begin
  if exists (select 1 from usernames where uid = p_uid) then
    return (select lower from usernames where uid = p_uid limit 1);
  end if;
  select display_name into dn from profiles where id = p_uid;
  if dn is null or btrim(dn) = '' then return null; end if;
  base := left(regexp_replace(dn, '[^a-zA-Z0-9_-]', '', 'g'), 16);
  if length(base) < 3 then
    base := left(base || replace(p_uid::text, '-', ''), 16);
  end if;
  candidate := base;
  loop
    begin
      insert into usernames (lower, uid, display_name) values (lower(candidate), p_uid, candidate);
      update profiles set display_name = candidate where id = p_uid;
      return lower(candidate);
    exception when unique_violation then
      n := n + 1;
      if n > 99 then
        candidate := left(base, 9) || right(replace(p_uid::text, '-', ''), 6);
        insert into usernames (lower, uid, display_name) values (lower(candidate), p_uid, candidate)
          on conflict do nothing;
        update profiles set display_name = candidate where id = p_uid;
        return lower(candidate);
      end if;
      candidate := left(base, 15 - length(n::text)) || '-' || n::text;
    end;
  end loop;
end;
$$;
revoke execute on function _ensure_username_for(uuid) from public;

create or replace function ensure_username() returns text
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  return _ensure_username_for(auth.uid());
end;
$$;
grant execute on function ensure_username() to authenticated;

-- One-time backfill for existing real (non-bot) accounts.
do $$
declare r record;
begin
  for r in select id from profiles where id not in (select uid from bots) loop
    perform _ensure_username_for(r.id);
  end loop;
end $$;
