-- COPY THIS ENTIRE FILE INTO THE SUPABASE DASHBOARD -> SQL EDITOR -> RUN.
--
-- Streak reminder check (Android app). Before showing the daily reminder, the
-- phone's background task asks "has this player already played today?" so a
-- game on the website or another phone cancels it. The phone has no sign-in
-- session in the background, so it sends a random per-player key instead of
-- an account id: 122 random bits (a v4 uuid without dashes), unguessable, says nothing about who it is.
--
-- reminder_keys: owner-only data, RLS on with NO policies (only these two
-- SECURITY DEFINER functions touch it). Deleted with the profile (cascade).

create table if not exists public.reminder_keys (
  uid        uuid primary key references public.profiles (id) on delete cascade,
  key        text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now()
);
alter table public.reminder_keys enable row level security;

-- Signed-in app: my key (created on first call).
create or replace function public.my_reminder_key()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_key text;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  insert into public.reminder_keys (uid) values (v_uid) on conflict (uid) do nothing;
  select key into v_key from public.reminder_keys where uid = v_uid;
  return v_key;
end;
$$;

revoke execute on function public.my_reminder_key() from public, anon;
grant execute on function public.my_reminder_key() to authenticated;

-- Background task (no session): the streak's last UTC day for a key, or null.
create or replace function public.reminder_status(p_key text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object('last', p.streak_last_played_utc, 'current', coalesce(p.streak_current, 0))
    from public.reminder_keys k
    join public.profiles p on p.id = k.uid
   where k.key = p_key
     and length(p_key) = 32;
$$;

revoke execute on function public.reminder_status(text) from public;
grant execute on function public.reminder_status(text) to anon, authenticated;
