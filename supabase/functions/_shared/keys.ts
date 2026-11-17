// Server key for the admin client. Prefers the new secret key (`sb_secret_…`,
// injected as the SUPABASE_SECRET_KEYS JSON dictionary keyed by key name) so
// the legacy service_role JWT can be disabled in the dashboard. The legacy
// key is only a fallback for an environment without secret keys.
export function serverKey(): string {
  try {
    const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}') as Record<string, unknown>;
    const pick = keys['default'] ?? Object.values(keys).find((v) => typeof v === 'string');
    if (typeof pick === 'string' && pick.startsWith('sb_secret_')) return pick;
  } catch {
    // fall through to the legacy key
  }
  console.warn('serverKey: no sb_secret key found, using legacy service_role key');
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
}
