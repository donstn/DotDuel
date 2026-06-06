import { useEffect, useRef, useState } from 'react';
import {
  ADSENSE_CLIENT,
  ADSENSE_SLOT,
  ADS_PREVIEW_PLACEHOLDER,
  isAdsAllowedForThisUser,
} from '../ads';

declare global {
  interface Window {
    adsbygoogle?: object[];
  }
}

// Monotonic counter so each ad LOAD (component mount) gets a visible id in the
// preview placeholder ("AD #N"). Lets you eyeball refresh-vs-persist: a banner
// that stays mounted keeps its number; a remounted one gets a fresh number.
// Preview-only; has no effect on real ad serving.
let adLoadSeq = 0;

interface Props {
  // Optional override — defaults to the shared menu slot. Same Responsive
  // unit for every placement; AdSense differentiates impressions by URL.
  slot?: string;
  // 'menu' (default) stacks in menu/list flow; 'ingame' is the band under
  // the board on untimed single-player screens.
  placement?: 'menu' | 'ingame';
}

/**
 * Renders a single AdSense ad unit. Gated by our own switches:
 *   - ADS_ENABLED master switch (in src/ads.ts).
 *   - Early-adopter grandfather (firstLoadMs < ADS_GRANDFATHER_BEFORE_MS).
 * GDPR/ePrivacy consent is handled by Google's certified CMP (loaded in
 * index.html), NOT our old homemade banner — so this component no longer
 * checks a local consent flag. If a gate is closed it renders NOTHING.
 *
 * EXCEPTION — ADS_PREVIEW_PLACEHOLDER (monetization branch): when the gates are
 * closed but the preview flag is on, render a visible, numbered mock box so the
 * placement + refresh behaviour can be eyeballed in dev. Real AdSense never
 * fills on localhost, so a mock is the only way to see it. Flag must be false
 * before merging to main.
 *
 * When mounted with all gates open, pushes to the adsbygoogle queue once.
 * Remounting the component (e.g. keyed by screen) yields a fresh ad.
 */
export function AdBanner({ slot = ADSENSE_SLOT, placement = 'menu' }: Props) {
  const initializedRef = useRef(false);
  const allowed = isAdsAllowedForThisUser();

  // One stable id per mounted instance (preview labelling only). The increment
  // lives in an effect, NOT a useState initializer: initializers are impure-
  // doubled by Strict Mode in dev, which ticked the counter twice (the
  // even-numbers-only bug). The ref guard makes Strict Mode's double effect-run
  // a no-op, exactly like initializedRef below, so numbers stay sequential.
  const numberedRef = useRef(0);
  const [adNum, setAdNum] = useState(0);
  useEffect(() => {
    if (!ADS_PREVIEW_PLACEHOLDER) return;
    if (numberedRef.current !== 0) return;
    numberedRef.current = ++adLoadSeq;
    setAdNum(numberedRef.current);
  }, []);

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

  const cls = `ad-slot${placement === 'ingame' ? ' ad-slot--ingame' : ''}`;

  if (!allowed) {
    if (!ADS_PREVIEW_PLACEHOLDER) return null;
    return (
      <div className={`${cls} ad-slot--preview`} aria-label="Advertisement (preview)">
        <span className="ad-slot-preview-id">AD&nbsp;#{adNum || '—'}</span>
        <span className="ad-slot-preview-text">{placement} placeholder</span>
      </div>
    );
  }

  return (
    <div className={cls} aria-label="Advertisement">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </div>
  );
}
