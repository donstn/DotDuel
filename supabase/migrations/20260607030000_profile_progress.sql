-- vs-AI unlock progression on the profile (jsonb), mirroring the Firebase
-- users/{uid}.progress field. Owner-writable via the existing profiles RLS and
-- not in the guard trigger's fn-only list, so a plain client update works.
alter table public.profiles add column if not exists progress jsonb;
