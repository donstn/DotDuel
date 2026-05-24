import { enableAnalyticsIfSupported } from './firebase';

/**
 * GDPR / ePrivacy analytics-consent gate.
 * Choice is stored per-device in localStorage. No third-party trackers
 * load until the user explicitly accepts.
 */

export type Consent = 'accepted' | 'declined';

const KEY = 'dotduel:consent:v1';

export function loadConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === 'accepted' || raw === 'declined') return raw;
  } catch {
    // private mode / storage disabled — treat as undecided
  }
  return null;
}

export function saveConsent(value: Consent): void {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // ignore
  }
}

/**
 * Apply the consent decision side-effect. If accepted, start Analytics
 * (in prod only — the helper itself is no-op in dev). If declined,
 * do nothing (Analytics never starts; if previously started a reload
 * is required to fully stop it — see PrivacyPopover).
 */
export function applyConsent(value: Consent | null): void {
  if (value === 'accepted') void enableAnalyticsIfSupported();
}
