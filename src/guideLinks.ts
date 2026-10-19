import type { MouseEvent } from 'react';
import type { Lang } from './i18n';
import { hideNativeBanner, isNativeApp } from './nativeAds';

// Web guide pages (built by scripts/build-pages.ts) exist in English and
// Lithuanian; other languages get the English pages. The Android app ships the
// same pages inside its bundle, so there they open in the app (and offline)
// instead of in the browser.
export const SITE_ORIGIN = 'https://www.dotduel.com';

export function guidePath(lang: Lang, page: 'guide' | 'strategy'): string {
  if (lang === 'lt') return page === 'guide' ? '/lt/kaip-zaisti/' : '/lt/strategija/';
  return page === 'guide' ? '/how-to-play/' : '/strategy/';
}

/** Props for an <a> that opens a guide page. Web: a new tab (or the same tab
 *  with newTab=false). Android: the bundled page inside the app. */
export function guideLinkProps(lang: Lang, page: 'guide' | 'strategy', newTab = true) {
  const path = guidePath(lang, page);
  if (!isNativeApp()) {
    return newTab ? { href: SITE_ORIGIN + path, target: '_blank', rel: 'noopener' } : { href: path };
  }
  // Capacitor's local server answers folder URLs with the app itself, so point
  // at the page file (the --app page build links the same way).
  const file = `${path}index.html`;
  return {
    href: file,
    onClick: (e: MouseEvent) => {
      e.preventDefault();
      // The AdMob banner is a native view; it would stay on top of the page.
      void hideNativeBanner().finally(() => window.location.assign(file));
    },
  };
}
