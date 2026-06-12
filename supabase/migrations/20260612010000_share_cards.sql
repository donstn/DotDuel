-- Share-card unfurl (v1.5 of result sharing): signed-in players upload their
-- rendered victory card; /functions/v1/r/<id> serves OG tags so the link
-- unfurls into the card on WhatsApp/X/Telegram/Discord/Facebook, then
-- redirects humans to www.dotduel.com/?ref=<uid> (existing referral flow).
-- Applied via `npx supabase db query --linked` per project convention
-- (file kept for the record; CLI migration history intentionally unused).

create table if not exists public.share_cards (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{8,32}$'),
  uid uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) <= 120),
  descr text not null check (char_length(descr) <= 400),
  created_at timestamptz not null default now()
);

alter table public.share_cards enable row level security;

-- Insert-only for owners, capped at 50 cards/day per user (anti-spam; the
-- Edge Function reads with service role, clients never select).
drop policy if exists share_cards_insert_own on public.share_cards;
create policy share_cards_insert_own on public.share_cards
  for insert to authenticated
  with check (
    (select auth.uid()) = uid
    and (
      select count(*) from public.share_cards sc
      where sc.uid = (select auth.uid())
        and sc.created_at > now() - interval '1 day'
    ) < 50
  );

create index if not exists share_cards_created_idx
  on public.share_cards (created_at);
create index if not exists share_cards_uid_created_idx
  on public.share_cards (uid, created_at);

-- Public bucket: anyone can READ via the public object URL (that's the point —
-- OG crawlers fetch the image); only owners can write, JPEG only, ≤400 KB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('share-cards', 'share-cards', true, 400000, array['image/jpeg'])
on conflict (id) do nothing;

drop policy if exists share_cards_owner_upload on storage.objects;
create policy share_cards_owner_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'share-cards'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and (
      select count(*) from storage.objects o
      where o.bucket_id = 'share-cards'
        and o.owner_id = (select auth.uid()::text)
        and o.created_at > now() - interval '1 day'
    ) < 50
  );
