import { enableAnalyticsIfSupported } from './telemetry';

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
 * AND AdSense (both are no-ops in dev — they only load in prod).
 * If declined, do nothing — neither has been loaded; if previously
 * loaded a reload is required to fully stop them, see PrivacyPopover.
 */
export function applyConsent(value: Consent | null): void {
  if (value === 'accepted') {
    void enableAnalyticsIfSupported();
  }
  // AdSense now loads via the tag in index.html and is gated by Google's CMP +
  // Consent Mode, not this homemade consent path.
}
