-- Phase 4 prep: port the remaining Firebase-backed modules to Supabase.
-- Covers #4 friends/invites/presence, #5 session-lock, #6 backstops.
-- Usernames (#3) need no SQL — RLS already allows owner insert/delete + public
-- select, and the PK on usernames.lower enforces uniqueness.
-- accept-invite + account-delete are Edge Functions (engine / admin API).

-- ===========================================================================
-- friend_uids guard: honor the documented protected-write flag, so the
-- SECURITY DEFINER friend RPCs below can maintain presence.friend_uids
-- (required by presence_select's friends-only visibility), exactly like the
-- profile guard already does for rating/streak.
-- ===========================================================================
create or replace function guard_presence_cols() returns trigger
language plpgsql as $$
begin
  if auth.role() is distinct from 'service_role'
     and current_setting('app.allow_protected_write', true) is distinct from 'on' then
    new.friend_uids := old.friend_uids;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------
create or replace function friendship_id(a uuid, b uuid) returns text
language sql immutable as $$
  select case when a < b then a::text || '_' || b::text
              else b::text || '_' || a::text end;
$$;

-- Add/remove a friend uid on someone's presence row (service-definer; sets the
-- protected-write flag). Upserts the presence row if it doesn't exist yet.
create or replace function _presence_friend(p_uid uuid, p_friend uuid, p_add boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform set_config('app.allow_protected_write', 'on', true);
  insert into presence (uid, friend_uids)
  values (p_uid, case when p_add then array[p_friend] else array[]::uuid[] end)
  on conflict (uid) do update set friend_uids = (
    select coalesce(array_agg(distinct x), array[]::uuid[])
    from unnest(
      case when p_add
        then array_append(coalesce(presence.friend_uids, array[]::uuid[]), p_friend)
        else array_remove(coalesce(presence.friend_uids, array[]::uuid[]), p_friend)
      end
    ) x
  );
end;
$$;

create or replace function _is_blocked_either_way(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from blocks
    where (blocker = a and blocked = b) or (blocker = b and blocked = a)
  );
$$;

-- ===========================================================================
-- #4 FRIENDS
-- ===========================================================================
create or replace function send_friend_request(
  target_username text default null,
  target_uid uuid default null
) returns json language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  other uuid;
  fid text;
  existing friendships%rowtype;
  me_name text;
  other_name text;
begin
  if me is null then raise exception 'UNAUTHENTICATED'; end if;
  if target_uid is not null then
    other := target_uid;
  elsif target_username is not null then
    select uid into other from usernames where lower = lower(trim(target_username));
    if other is null then raise exception 'USER_NOT_FOUND'; end if;
  else
    raise exception 'TARGET_REQUIRED';
  end if;
  if other = me then raise exception 'CANNOT_FRIEND_SELF'; end if;
  if _is_blocked_either_way(me, other) then raise exception 'BLOCKED'; end if;

  fid := friendship_id(me, other);
  select display_name into me_name from profiles where id = me;
  select display_name into other_name from profiles where id = other;

  select * into existing from friendships where id = fid;
  if found then
    if existing.status = 'accepted' then raise exception 'ALREADY_FRIENDS'; end if;
    if existing.status = 'pending' then
      if existing.requested_by = me then raise exception 'ALREADY_SENT'; end if;
      -- other side already asked us -> auto-accept
      update friendships set status = 'accepted', accepted_at = now(),
        display_names = jsonb_build_object(me::text, coalesce(me_name,'Player'),
                                           other::text, coalesce(other_name,'Player'))
        where id = fid;
      perform _presence_friend(me, other, true);
      perform _presence_friend(other, me, true);
      return json_build_object('ok', true, 'autoAccepted', true);
    end if;
  end if;

  insert into friendships (id, uid_a, uid_b, status, requested_by, requested_at, accepted_at, display_names)
  values (fid, least(me, other), greatest(me, other), 'pending', me, now(), null,
          jsonb_build_object(me::text, coalesce(me_name,'Player'),
                             other::text, coalesce(other_name,'Player')));
  return json_build_object('ok', true);
end;
$$;

create or replace function accept_friend_request(p_friendship_id text)
returns json language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  f friendships%rowtype;
  other uuid;
begin
  if me is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into f from friendships where id = p_friendship_id;
  if not found then raise exception 'NOT_FOUND'; end if;
  if me not in (f.uid_a, f.uid_b) then raise exception 'NOT_YOURS'; end if;
  if f.status <> 'pending' then raise exception 'NOT_PENDING'; end if;
  if f.requested_by = me then raise exception 'CANNOT_ACCEPT_OWN'; end if;
  other := case when f.uid_a = me then f.uid_b else f.uid_a end;
  update friendships set status = 'accepted', accepted_at = now() where id = p_friendship_id;
  perform _presence_friend(me, other, true);
  perform _presence_friend(other, me, true);
  return json_build_object('ok', true);
end;
$$;

create or replace function decline_friend_request(p_friendship_id text)
returns json language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); f friendships%rowtype;
begin
  if me is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into f from friendships where id = p_friendship_id;
  if not found then return json_build_object('ok', true); end if;
  if me not in (f.uid_a, f.uid_b) then raise exception 'NOT_YOURS'; end if;
  if f.status <> 'pending' then raise exception 'NOT_PENDING'; end if;
  delete from friendships where id = p_friendship_id;
  return json_build_object('ok', true);
end;
$$;

create or replace function remove_friend(p_friendship_id text)
returns json language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); f friendships%rowtype; other uuid;
begin
  if me is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into f from friendships where id = p_friendship_id;
  if not found then return json_build_object('ok', true); end if;
  if me not in (f.uid_a, f.uid_b) then raise exception 'NOT_YOURS'; end if;
  other := case when f.uid_a = me then f.uid_b else f.uid_a end;
  delete from friendships where id = p_friendship_id;
  perform _presence_friend(me, other, false);
  perform _presence_friend(other, me, false);
  return json_build_object('ok', true);
end;
$$;

create or replace function block_user(p_blocked uuid)
returns json language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_blocked = me then raise exception 'CANNOT_BLOCK_SELF'; end if;
  insert into blocks (blocker, blocked) values (me, p_blocked)
    on conflict do nothing;
  delete from friendships where id = friendship_id(me, p_blocked);
  perform _presence_friend(me, p_blocked, false);
  perform _presence_friend(p_blocked, me, false);
  update invites set status = 'cancelled'
    where status = 'pending'
      and ((from_uid = me and to_uid = p_blocked) or (from_uid = p_blocked and to_uid = me));
  return json_build_object('ok', true);
end;
$$;

create or replace function unblock_user(p_blocked uuid)
returns json language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'UNAUTHENTICATED'; end if;
  delete from blocks where blocker = me and blocked = p_blocked;
  return json_build_object('ok', true);
end;
$$;

-- ===========================================================================
-- #4 INVITES (accept-invite is an Edge Function — it needs the engine)
-- ===========================================================================
create or replace function send_invite(
  p_to_uids uuid[],
  p_shape text,
  p_time_control text,
  p_from_ranked boolean
) returns json language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  gid uuid := gen_random_uuid();
  t uuid;
  policy text;
  is_friend boolean;
  sent int := 0;
begin
  if me is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_shape not in ('triangle','square','rectangle','rhombus') then raise exception 'BAD_SHAPE'; end if;
  if p_time_control not in ('1min','3min','5min') then raise exception 'BAD_TC'; end if;
  if array_length(p_to_uids, 1) is null or array_length(p_to_uids, 1) > 10 then
    raise exception 'BAD_RECIPIENTS';
  end if;

  foreach t in array p_to_uids loop
    if t = me then continue; end if;
    if _is_blocked_either_way(me, t) then continue; end if;
    select coalesce(challenge_policy, 'everyone') into policy from profiles where id = t;
    if policy = 'nobody' then continue; end if;
    if policy = 'friends-only' then
      select (status = 'accepted') into is_friend from friendships where id = friendship_id(me, t);
      if not coalesce(is_friend, false) then continue; end if;
    end if;
    insert into invites (from_uid, to_uid, group_id, shape, time_control, from_ranked, status, expires_at)
    values (me, t, gid, p_shape, to_jsonb(p_time_control), p_from_ranked, 'pending', now() + interval '5 minutes');
    sent := sent + 1;
  end loop;

  if sent = 0 then raise exception 'NO_VALID_RECIPIENTS'; end if;
  return json_build_object('ok', true, 'groupId', gid, 'sent', sent);
end;
$$;

create or replace function decline_invite(p_invite_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); inv invites%rowtype;
begin
  if me is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into inv from invites where id = p_invite_id;
  if not found then return json_build_object('ok', true); end if;
  if inv.to_uid <> me then raise exception 'NOT_YOURS'; end if;
  if inv.status = 'pending' then update invites set status = 'declined' where id = p_invite_id; end if;
  return json_build_object('ok', true);
end;
$$;

create or replace function cancel_invite(p_invite_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); inv invites%rowtype;
begin
  if me is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into inv from invites where id = p_invite_id;
  if not found then return json_build_object('ok', true); end if;
  if inv.from_uid <> me then raise exception 'NOT_YOURS'; end if;
  update invites set status = 'cancelled' where group_id = inv.group_id and status = 'pending';
  return json_build_object('ok', true);
end;
$$;

-- ===========================================================================
-- #5 SESSION LOCK (one device). Owner-only RLS; client reads its own row and
-- Realtime tells it when another tab overwrites the claim.
-- ===========================================================================
create table if not exists game_sessions (
  uid uuid primary key references auth.users(id) on delete cascade,
  session_id text not null,
  claimed_at bigint not null
);
alter table game_sessions enable row level security;
drop policy if exists game_sessions_own on game_sessions;
create policy game_sessions_own on game_sessions
  for all to authenticated using (auth.uid() = uid) with check (auth.uid() = uid);

-- ===========================================================================
-- #6 BACKSTOPS — shape column on the queue (shape-unlock), invite expiry cron.
-- bot-fallback-sweep + clock-timeout sweeps are Edge Functions called by cron
-- (added below once pg_cron/pg_net are enabled).
-- ===========================================================================
alter table matchmaking_queue add column if not exists shape text not null default 'triangle';

create or replace function expire_stale_invites() returns void
language sql security definer set search_path = public as $$
  update invites set status = 'expired'
   where status = 'pending' and expires_at < now();
$$;

-- ===========================================================================
-- Realtime: the client subscribe* paths refetch on any change to these tables.
-- ===========================================================================
do $$
begin
  alter publication supabase_realtime add table friendships;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table invites;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table presence;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table game_sessions;
exception when duplicate_object then null; end $$;
