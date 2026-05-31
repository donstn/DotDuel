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

export const IS_STAGING = import.meta.env.VITE_FIREBASE_ENV === 'staging';

const firebaseConfig = IS_STAGING ? STAGING_CONFIG : PROD_CONFIG;

if (IS_STAGING) {
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

// Session boot snapshot. Captured once via bootSession() at app startup
// (before anything else writes the firstLoad key) so first_visit can be
// distinguished from session_start_returning even though both events fire
// only AFTER consent is granted.
const FIRST_LOAD_KEY = 'dotduel:firstLoad:v1';
const LAST_SESSION_KEY = 'dotduel:lastSession:v1';
const RETURNING_SESSION_THRESHOLD_MS = 12 * 60 * 60 * 1000;

interface SessionSnapshot {
  isFirstVisit: boolean;
  msSinceLastSession: number;
}

let sessionSnapshot: SessionSnapshot | null = null;
let bootEventFired = false;

export function bootSession(): void {
  if (sessionSnapshot) return;
  let isFirstVisit = false;
  let msSinceLastSession = 0;
  try {
    isFirstVisit = !localStorage.getItem(FIRST_LOAD_KEY);
    const lastRaw = localStorage.getItem(LAST_SESSION_KEY);
    if (lastRaw) {
      const n = parseInt(lastRaw, 10);
      if (!Number.isNaN(n) && n > 0) msSinceLastSession = Date.now() - n;
    }
    localStorage.setItem(LAST_SESSION_KEY, String(Date.now()));
  } catch {
    // private mode / storage disabled — treat as first visit, no prior session
  }
  sessionSnapshot = { isFirstVisit, msSinceLastSession };
  if (!import.meta.env.PROD) {
    fireBootEvent();
  }
}

// SHA-256 first-8-hex-char digest. Used for telemetry-safe referrer
// identification (raw uid is PII per GA4 ToS once joinable to user docs).
// Async because WebCrypto is async; callers should await before firing.
export async function sha256First8(input: string): Promise<string> {
  try {
    const enc = new TextEncoder().encode(input);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    const bytes = new Uint8Array(buf, 0, 4);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return 'nohash';
  }
}

// Lifetime "games started" counter for the `game_index` param. Lets us
// slice funnel metrics by "is this the player's first game ever vs their
// Nth" without joining to backend state. Bucketed: 1..10 are exact, 11+
// collapses to 99 to keep GA4 cardinality bounded.
const LIFETIME_GAMES_KEY = 'dotduel:lifetimeGames:v1';

export function bumpAndGetGameIndex(): number {
  let next = 1;
  try {
    const raw = localStorage.getItem(LIFETIME_GAMES_KEY);
    const cur = raw ? parseInt(raw, 10) : 0;
    next = (Number.isNaN(cur) ? 0 : cur) + 1;
    localStorage.setItem(LIFETIME_GAMES_KEY, String(next));
  } catch {
    // ignore
  }
  return next > 10 ? 99 : next;
}

function fireBootEvent(): void {
  if (bootEventFired) return;
  if (!sessionSnapshot) return;
  bootEventFired = true;
  if (sessionSnapshot.isFirstVisit) {
    trackEvent('first_visit');
    return;
  }
  if (sessionSnapshot.msSinceLastSession >= RETURNING_SESSION_THRESHOLD_MS) {
    const hours = Math.round(sessionSnapshot.msSinceLastSession / (60 * 60 * 1000));
    trackEvent('session_start_returning', { hours_since_last: hours });
  }
}

export async function enableAnalyticsIfSupported(): Promise<void> {
  if (analyticsInstance) return;
  if (!import.meta.env.PROD) return;
  try {
    const ok = await isSupported();
    if (!ok) return;
    analyticsInstance = getAnalytics(app);
    fireBootEvent();
  } catch (e) {
    console.warn('enableAnalyticsIfSupported failed:', e);
  }
}

// Per-session event cap. Resets every pageload (GA4 also treats every load
// as a new session by default). When the cap is hit, events tagged 'low'
// are dropped; 'normal' events keep firing. Guards against runaway hint /
// score-pulse instrumentation at scale (GA4 free tier samples above ~50M
// events/month/property, which silently corrupts funnel ratios).
const SESSION_EVENT_CAP = 30;
let sessionEventCount = 0;

export type EventPriority = 'low' | 'normal';

// PII firewall. Per GA4 ToS we MUST NOT pass raw uid / email / displayName
// as event parameters — they become PII once joinable to Firestore user
// docs. Hashed forms (e.g. referrer_uid_hash) are explicitly allowed
// because they're keyed on a one-way digest.
const PII_KEY_RE = /^(uid|email|user_?id|user_?name|display_?name|player_?name|opponent_?name)$/i;

function isPiiKey(key: string): boolean {
  if (PII_KEY_RE.test(key)) return true;
  const lower = key.toLowerCase();
  if (lower.endsWith('_email')) return true;
  if (lower.endsWith('_uid') && !lower.endsWith('_hash')) return true;
  if (lower.endsWith('_name') && !lower.endsWith('_name_hash')) return true;
  return false;
}

// Fire a custom GA4 event. In prod: no-op until analytics has been started
// via consent. In dev: logs to console with a [GA4] prefix so the funnel
// is observable while building features. PII-shaped param keys are
// silently dropped before submission. Values are clamped to GA4's
// 100-char limit.
export function trackEvent(
  name: string,
  params?: Record<string, string | number>,
  priority: EventPriority = 'normal',
): void {
  if (priority === 'low' && sessionEventCount >= SESSION_EVENT_CAP) return;
  const clamped: Record<string, string | number> = {};
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (isPiiKey(k)) continue;
      clamped[k] = typeof v === 'string' ? v.slice(0, 100) : v;
    }
  }
  if (!import.meta.env.PROD) {
    // eslint-disable-next-line no-console
    console.log(`%c[GA4] ${name}`, 'color:#7bdb95;font-weight:bold', clamped);
    sessionEventCount++;
    return;
  }
  if (!analyticsInstance) return;
  try {
    logEvent(analyticsInstance, name, clamped);
    sessionEventCount++;
  } catch (e) {
    console.warn('trackEvent failed:', e);
  }
}
