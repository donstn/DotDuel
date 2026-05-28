import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import {
  getAnalytics,
  isSupported,
  logEvent,
  type Analytics,
} from 'firebase/analytics';

// Firebase project configs. Default is production (dotduel). Setting
// VITE_FIREBASE_ENV=staging at build time switches to dotduel-staging for
// running localhost against a parallel isolated environment.
// .env.staging in the repo root is the canonical place to set this.
const PROD_CONFIG = {
  apiKey: 'AIzaSyBCg_LiK9S_jZ3CL0-H0-lpyldk5--RZHE',
  authDomain: 'dotduel.firebaseapp.com',
  databaseURL: 'https://dotduel-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'dotduel',
  storageBucket: 'dotduel.firebasestorage.app',
  messagingSenderId: '153943407637',
  appId: '1:153943407637:web:b949ade37f04170e2aa21c',
  measurementId: 'G-9H8DXGC34Z',
};

// Staging config — created via firebase apps:create web on dotduel-staging.
// databaseURL points at a non-existent RTDB instance (staging has no RTDB);
// dual-write code expects RTDB writes to fail on staging and logs them but
// doesn't throw, so Firestore-only operation works fine.
const STAGING_CONFIG = {
  apiKey: 'AIzaSyA1ZsLHm7nQodLXeSEEDEa2Gatxtiaqh7M',
  authDomain: 'dotduel-staging.firebaseapp.com',
  databaseURL: 'https://dotduel-staging-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'dotduel-staging',
  storageBucket: 'dotduel-staging.firebasestorage.app',
  messagingSenderId: '20053192504',
  appId: '1:20053192504:web:dc0d9b28dfc724916d9bcd',
};

const firebaseConfig =
  import.meta.env.VITE_FIREBASE_ENV === 'staging' ? STAGING_CONFIG : PROD_CONFIG;

if (import.meta.env.VITE_FIREBASE_ENV === 'staging') {
  // eslint-disable-next-line no-console
  console.log('%cDotDuel STAGING firebase config loaded', 'color:#f5d27a;font-weight:bold');
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// GDPR / ePrivacy: Analytics is NEVER initialised on import. It only
// starts after the user explicitly accepts via the consent banner.
// See src/consent.ts.
let analyticsInstance: Analytics | null = null;

export async function enableAnalyticsIfSupported(): Promise<void> {
  if (analyticsInstance) return;
  if (!import.meta.env.PROD) return;
  try {
    const ok = await isSupported();
    if (!ok) return;
    analyticsInstance = getAnalytics(app);
  } catch (e) {
    console.warn('enableAnalyticsIfSupported failed:', e);
  }
}

// Fire a custom GA4 event. No-op if analytics hasn't been started (i.e.,
// consent not granted or non-prod build), so it's safe to call from any
// path without guards. Param values are clamped to GA4's 100-char limit.
export function trackEvent(name: string, params?: Record<string, string | number>): void {
  if (!analyticsInstance) return;
  try {
    const clamped: Record<string, string | number> = {};
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        clamped[k] = typeof v === 'string' ? v.slice(0, 100) : v;
      }
    }
    logEvent(analyticsInstance, name, clamped);
  } catch (e) {
    console.warn('trackEvent failed:', e);
  }
}
