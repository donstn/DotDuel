// One-off Supabase connection smoke test (dev-only).
//   npx tsx scripts/supabase-smoke.ts
// Reads .env.local (tsx doesn't auto-load it), then exercises: public read,
// RLS denial on profiles, and an auth signup that should fire the
// auto-create-profile trigger.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
console.log('URL :', url);
console.log('Key :', key ? key.slice(0, 16) + '…' : '(missing)');

const supabase = createClient(url, key);

async function main() {
  // [1] Public read — campaigns has a public SELECT policy.
  const pub = await supabase.from('campaigns').select('*');
  console.log(
    '\n[1] public read campaigns :',
    pub.error ? `ERROR ${pub.error.message}` : `OK (${pub.data.length} rows)`,
  );

  // [2] RLS should block anon from profiles (expect 0 rows, no error).
  const prof = await supabase.from('profiles').select('*');
  console.log(
    '[2] anon read profiles    :',
    prof.error
      ? `ERROR ${prof.error.message}`
      : `OK (${prof.data.length} rows — RLS active)`,
  );

  // [3] Sign up a throwaway user — the trigger should create a profile row.
  const email = `smoke-${Date.now()}@gmail.com`;
  const { data: su, error: suErr } = await supabase.auth.signUp({
    email,
    password: 'smoke-test-123456',
  });
  if (suErr) {
    console.log('[3] signUp                 :', `ERROR ${suErr.message}`);
  } else {
    console.log(
      '[3] signUp                 :',
      `user ${su.user?.id} | session ${su.session ? 'ACTIVE (email-confirm OFF)' : 'none (email-confirm ON)'}`,
    );
    // [4] If we got a session, read our own profile — proves trigger + owner RLS.
    if (su.session) {
      const me = await supabase
        .from('profiles')
        .select('*')
        .eq('id', su.user!.id);
      console.log(
        '[4] read own profile       :',
        me.error
          ? `ERROR ${me.error.message}`
          : `OK (${me.data.length} row) ${JSON.stringify(me.data[0])}`,
      );
    }
  }
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
