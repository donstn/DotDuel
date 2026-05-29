import { useEffect, useRef } from 'react';
import { loadConsent } from '../consent';
import { ADSENSE_CLIENT, ADSENSE_SLOT, isAdsAllowedForThisUser } from '../ads';

declare global {
  interface Window {
    adsbygoogle?: object[];
  }
}

interface Props {
  // Optional override — defaults to the shared menu slot. Same Responsive
  // unit for every placement; AdSense differentiates impressions by URL.
  slot?: string;
}

/**
 * Renders a single AdSense ad unit. Triple-gated:
 *   - ADS_ENABLED master switch (in src/ads.ts).
 *   - Early-adopter grandfather (firstLoadMs < ADS_GRANDFATHER_BEFORE_MS).
 *   - GDPR consent === 'accepted'.
 * If any gate is closed, the component renders NOTHING — neither the
 * <ins> tag nor the reserved-space slot div ever enters the DOM.
 *
 * When mounted with all gates open, pushes to the adsbygoogle queue
 * once. Subsequent mounts of the same component (e.g. screen navigation)
 * are idempotent via the per-instance initializedRef.
 */
export function AdBanner({ slot = ADSENSE_SLOT }: Props) {
  const consent = loadConsent();
  const initializedRef = useRef(false);
  const allowed = isAdsAllowedForThisUser() && consent === 'accepted';

  useEffect(() => {
    if (!allowed) return;
    if (initializedRef.current) return;
    initializedRef.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn('AdBanner push failed:', e);
    }
  }, [allowed]);

  if (!allowed) return null;

  return (
    <div className="ad-slot" aria-label="Advertisement">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
