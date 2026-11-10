import { supabase } from '../supabase';
import { detectPlatform } from '../clientPlatform';
import { APP_VERSION } from '../version';

// Once per signed-in user per app load: note on their profile whether they're
// playing in the Android app, an installed web app or a browser (admin stats).
let recordedFor: string | null = null;

export function startClientRecord(): void {
  supabase.auth.onAuthStateChange((_event, session) => {
    const uid = session?.user.id ?? null;
    if (!uid || uid === recordedFor) return;
    recordedFor = uid;
    // Outside the auth callback: supabase-js deadlocks if it awaits its own
    // calls inside onAuthStateChange.
    setTimeout(() => {
      void supabase
        .rpc('record_client', { p_platform: detectPlatform(), p_version: APP_VERSION })
        .then(({ error }) => {
          if (error) console.warn('record_client failed:', error.message);
        });
    }, 0);
  });
}
