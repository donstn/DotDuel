-- Caps on outgoing friend requests and game invites (anti-spam).
--
--   * send_friend_request: at most 10 of the caller's requests may be waiting
--     for an answer. An 11th raises TOO_MANY_PENDING. Accepting a request the
--     other side already sent (auto-accept) is never blocked.
--   * send_invite: at most 10 invites per caller in any 5-minute window. An
--     invite expires after 5 minutes, so this also means "at most 10 unanswered
--     invites"; counting by creation time (not status) stops a cancel-and-resend
--     loop from getting around the cap.
--
-- Both bodies are the live production definitions with only the cap added.
-- Idempotent: safe to run more than once.

create index if not exists friendships_pending_by_requester_idx
  on public.friendships (requested_by) where status = 'pending';

create index if not exists invites_from_created_idx
  on public.invites (from_uid, created_at);

create or replace function public.send_friend_request(
  target_username text default null,
  target_uid uuid default null
)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
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

  if (select count(*) from friendships
      where requested_by = me and status = 'pending') >= 10 then
    raise exception 'TOO_MANY_PENDING';
  end if;

  insert into friendships (id, uid_a, uid_b, status, requested_by, requested_at, accepted_at, display_names)
  values (fid, least(me, other), greatest(me, other), 'pending', me, now(), null,
          jsonb_build_object(me::text, coalesce(me_name,'Player'),
                             other::text, coalesce(other_name,'Player')));
  return json_build_object('ok', true);
end;
$function$;

create or replace function public.send_invite(
  p_to_uids uuid[],
  p_shape text,
  p_time_control text,
  p_from_ranked boolean
)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  me uuid := auth.uid();
  gid uuid := gen_random_uuid();
  t uuid;
  policy text;
  is_friend boolean;
  sent int := 0;
  recent int;
begin
  if me is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_shape not in ('triangle','square','rectangle','rhombus') then raise exception 'BAD_SHAPE'; end if;
  if p_time_control not in ('1min','3min','5min') then raise exception 'BAD_TC'; end if;
  if array_length(p_to_uids, 1) is null or array_length(p_to_uids, 1) > 10 then
    raise exception 'BAD_RECIPIENTS';
  end if;

  select count(*) into recent from invites
    where from_uid = me and created_at > now() - interval '5 minutes';

  foreach t in array p_to_uids loop
    if t = me then continue; end if;
    if _is_blocked_either_way(me, t) then continue; end if;
    select coalesce(challenge_policy, 'everyone') into policy from profiles where id = t;
    if policy = 'nobody' then continue; end if;
    if policy = 'friends-only' then
      select (status = 'accepted') into is_friend from friendships where id = friendship_id(me, t);
      if not coalesce(is_friend, false) then continue; end if;
    end if;
    if recent + sent >= 10 then raise exception 'TOO_MANY_PENDING'; end if;
    insert into invites (from_uid, to_uid, group_id, shape, time_control, from_ranked, status, expires_at)
    values (me, t, gid, p_shape, to_jsonb(p_time_control), p_from_ranked, 'pending', now() + interval '5 minutes');
    sent := sent + 1;
  end loop;

  if sent = 0 then raise exception 'NO_VALID_RECIPIENTS'; end if;
  return json_build_object('ok', true, 'groupId', gid, 'sent', sent);
end;
$function$;
