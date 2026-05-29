/**
 * Google AdSense loader + activation policy. Mirrors the analytics
 * pattern in firebase.ts: nothing loads until the consent gate runs,
 * and even after consent nothing renders until the ads feature itself
 * is enabled.
 *
 * Three gates protect users:
 *   1. ADS_ENABLED — master kill switch. While false: AdBanner returns
 *      null, the AdSense script never loads, and the consent banner /
 *      privacy popover text doesn't mention AdSense. Flipping to true
 *      is the only thing needed to roll ads out.
 *   2. ADS_GRANDFATHER_BEFORE_MS — once ADS_ENABLED is true, anyone
 *      whose first app load was BEFORE this timestamp keeps seeing no
 *      ads forever. Update this constant to the current date when you
 *      flip ADS_ENABLED so the existing playerbase is grandfathered out.
 *   3. dotduel:firstLoad:v1 localStorage — written on every fresh load
 *      via getFirstLoadMs() (called from main.tsx). Stable per-device
 *      timestamp used for the grandfather check; works for both
 *      signed-in AND anonymous users (vs-AI and hot-seat don't require
 *      an account).
 *
 * To activate ads on live (future me):
 *   - Set ADS_ENABLED = true below.
 *   - Set ADS_GRANDFATHER_BEFORE_MS = Date.UTC(<flip year>, <month - 1>, <day>).
 *   - Bump consent key version in src/consent.ts (KEY = 'dotduel:consent:v2')
 *     so anyone who already accepted analytics-only is re-prompted.
 *   - Bump APP_VERSION + add a changelog entry.
 *   - Make sure Auto Ads is OFF in the AdSense console — we place
 *     units manually so they only appear on menu screens.
 */

// ----------------------------------------------------------------------
// Activation gates
// ----------------------------------------------------------------------

/** Master kill switch. When false, NO AdSense code runs anywhere. */
export const ADS_ENABLED: boolean = false;

/**
 * Cutoff for the early-adopter grandfather rule. When ADS_ENABLED flips
 * to true, anyone with firstLoadMs < this value is exempt from ads.
 *
 * Default: a far-future date, so if a developer flips ADS_ENABLED
 * without updating this value, EVERYONE is grandfathered — the safe
 * silent-failure direction.
 */
export const ADS_GRANDFATHER_BEFORE_MS: number = Date.UTC(2099, 0, 1);

// ----------------------------------------------------------------------
// AdSense account credentials (active once ADS_ENABLED is true)
// ----------------------------------------------------------------------

export const ADSENSE_CLIENT = 'ca-pub-1268043579532481';

/**
 * Slot ID of the single Responsive Display ad unit ("DotDuelMenuBanner")
 * registered in the AdSense console. Same unit is reused for all four
 * menu placements — AdSense differentiates impressions by URL.
 */
export const ADSENSE_SLOT = '5003827504';

// ----------------------------------------------------------------------
// First-load timestamp tracking
// ----------------------------------------------------------------------

const FIRST_LOAD_KEY = 'dotduel:firstLoad:v1';

/**
 * Returns the per-device "first ever load" timestamp, writing it on
 * the very first call. Call this once at app boot (main.tsx) so the
 * timestamp is established long before anyone could be shown an ad.
 *
 * Stable across reloads and sessions; clears only if the user wipes
 * localStorage. Per-device: a player on two devices has two separate
 * first-load times — acceptable; same constraint applies to other
 * per-device settings in this app.
 */
export function getFirstLoadMs(): number {
  try {
    const raw = localStorage.getItem(FIRST_LOAD_KEY);
    if (raw) {
      const n = parseInt(raw, 10);
      if (!Number.isNaN(n) && n > 0) return n;
    }
    const now = Date.now();
    localStorage.setItem(FIRST_LOAD_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

// ----------------------------------------------------------------------
// Public policy check
// ----------------------------------------------------------------------

/**
 * Single source of truth for whether THIS user / THIS device should see
 * ads. Combines all three gates.
 */
export function isAdsAllowedForThisUser(): boolean {
  if (!ADS_ENABLED) return false;
  if (getFirstLoadMs() < ADS_GRANDFATHER_BEFORE_MS) return false;
  return true;
}

// ----------------------------------------------------------------------
// AdSense script injection
// ----------------------------------------------------------------------

let scriptInjected = false;

/**
 * Called by applyConsent('accepted') in src/consent.ts. No-op unless
 * ADS_ENABLED is true AND we're in a prod build (matches the
 * enableAnalyticsIfSupported policy so dev never hits the production
 * AdSense account). Idempotent — only injects once.
 */
export function enableAdSenseIfAccepted(): void {
  if (!ADS_ENABLED) return;
  if (scriptInjected) return;
  if (!import.meta.env.PROD) return;
  if (typeof document === 'undefined') return;
  try {
    const s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    document.head.appendChild(s);
    scriptInjected = true;
  } catch (e) {
    console.warn('enableAdSenseIfAccepted failed:', e);
  }
}
