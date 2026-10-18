import type { Lang } from './i18n';

// Web guide pages (built by scripts/build-pages.ts) exist in English and
// Lithuanian; other languages get the English pages.
export const SITE_ORIGIN = 'https://www.dotduel.com';

export function guidePath(lang: Lang, page: 'guide' | 'strategy'): string {
  if (lang === 'lt') return page === 'guide' ? '/lt/kaip-zaisti/' : '/lt/strategija/';
  return page === 'guide' ? '/how-to-play/' : '/strategy/';
}
