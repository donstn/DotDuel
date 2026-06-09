-- Realtime postgres_changes evaluates RLS against the changed row; for UPDATE/
-- DELETE it needs the policy's columns, which default replica identity (PK only)
-- doesn't carry. The originally-realtime tables (games/pairings/profiles/…) were
-- set FULL; the social tables added in 20260608060000 were not, so invite/friend/
-- presence/session UPDATE+DELETE events were delivered unreliably (e.g. an invite
-- arriving only registered intermittently). Match the working tables.
alter table invites       replica identity full;
alter table friendships   replica identity full;
alter table presence      replica identity full;
alter table game_sessions replica identity full;
