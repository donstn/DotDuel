// GA4 telemetry via gtag.js — the Firebase-free replacement for the analytics
// layer that used to live in firebase.ts. The Google Consent Mode shim
// (window.gtag / dataLayer) is installed in public/consent-default.js at the
// top of <head>, so window.gtag always exists; we only load the GA4 config tag
// after the user consents (enableAnalyticsIfSupported), and gtag respects
// Consent Mode for cookieless behaviour pre-consent.

const MEASUREMENT_ID = 'G-9H8DXGC34Z';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// Single Supabase environment — no separate staging project (the Firebase
// staging split is retired). Kept as a named export so call sites are stable.
export const IS_STAGING = false;

let analyticsEnabled = false;

// --- session-boot snapshot (first_visit vs returning) ---------------------
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
  if (!import.meta.env.PROD) fireBootEvent();
}

// SHA-256 first-8-hex-char digest. Telemetry-safe referrer identification (raw
// uid is PII once joinable to user rows).
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

// Lifetime "games started" counter for the game_index param (1..10 exact, 11+
// collapses to 99 to keep GA4 cardinality bounded).
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
  if (bootEventFired || !sessionSnapshot) return;
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

// Load the GA4 config tag once the user has consented. Idempotent.
export async function enableAnalyticsIfSupported(): Promise<void> {
  if (analyticsEnabled) return;
  if (!import.meta.env.PROD) return;
  try {
    if (typeof window.gtag !== 'function') return;
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.appendChild(s);
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, { send_page_view: true });
    analyticsEnabled = true;
    fireBootEvent();
  } catch (e) {
    console.warn('enableAnalyticsIfSupported failed:', e);
  }
}

// --- event firing ---------------------------------------------------------
const SESSION_EVENT_CAP = 30;
let sessionEventCount = 0;

export type EventPriority = 'low' | 'normal';

// PII firewall — never pass raw uid / email / displayName as event params.
const PII_KEY_RE = /^(uid|email|user_?id|user_?name|display_?name|player_?name|opponent_?name)$/i;

function isPiiKey(key: string): boolean {
  if (PII_KEY_RE.test(key)) return true;
  const lower = key.toLowerCase();
  if (lower.endsWith('_email')) return true;
  if (lower.endsWith('_uid') && !lower.endsWith('_hash')) return true;
  if (lower.endsWith('_name') && !lower.endsWith('_name_hash')) return true;
  return false;
}

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
  if (!analyticsEnabled || typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', name, clamped);
    sessionEventCount++;
  } catch (e) {
    console.warn('trackEvent failed:', e);
  }
}
