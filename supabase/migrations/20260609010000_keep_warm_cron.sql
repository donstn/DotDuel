-- Keep submit-move warm to avoid ~2.6s cold starts on the first move of an idle
-- session. submit-move is deployed --no-verify-jwt — its internal getUser() still
-- guards real moves (returns 401 for any invalid/missing token), and the
-- {kind:'ping'} branch returns before any auth/DB work. So a keyless pg_cron job
-- can warm it directly via pg_net every 5 min. No secret is stored anywhere.
do $$
begin
  perform cron.unschedule('keep-warm');
exception when others then null;
end $$;

select cron.schedule(
  'keep-warm',
  '*/5 * * * *',
  $cmd$
    select net.http_post(
      url := 'https://ggyjxayazxbjvjbeecxa.supabase.co/functions/v1/submit-move',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{"action": {"kind": "ping"}}'::jsonb
    );
  $cmd$
);
