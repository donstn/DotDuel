// Shared HTML shell for the static guide pages (built into dist/ by
// scripts/build-pages.ts). Plain HTML + one stylesheet, no JS — readable by
// search engines and the AdSense crawler without rendering the game.

import { LANGS, LANG_NAMES, SITE, type Lang, type PageName } from './langs';
import { faqJsonLd } from './faq';

export type { Lang };

export const ORIGIN = 'https://www.dotduel.com';

export const NAV_ORDER: PageName[] = ['howToPlay', 'strategy', 'faq', 'about', 'changelog'];

export interface PageInput {
  lang: Lang;
  key: PageName;
  title: string;
  description: string;
  h1: string;
  lead: string;
  body: string;
}

export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderPage(p: PageInput): string {
  const nav = SITE[p.lang].nav;
  const path = SITE[p.lang].paths[p.key];
  const links = NAV_ORDER.map(
    (k) => `<a href="${SITE[p.lang].paths[k]}"${k === p.key ? ' aria-current="page"' : ''}>${nav[k]}</a>`,
  ).join('');
  const alternates = LANGS.map(
    (l) => `  <link rel="alternate" hreflang="${l}" href="${ORIGIN}${SITE[l].paths[p.key]}" />`,
  ).join('\n');
  const langLinks = LANGS.map((l) =>
    l === p.lang
      ? `<span aria-current="true">${LANG_NAMES[l]}</span>`
      : `<a href="${SITE[l].paths[p.key]}" hreflang="${l}" lang="${l}">${LANG_NAMES[l]}</a>`,
  ).join('');
  return `<!doctype html>
<html lang="${p.lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>${esc(p.title)}</title>
  <meta name="description" content="${esc(p.description)}" />
  <link rel="canonical" href="${ORIGIN}${path}" />
${alternates}
  <link rel="alternate" hreflang="x-default" href="${ORIGIN}${SITE.en.paths[p.key]}" />
  <meta property="og:title" content="${esc(p.title)}" />
  <meta property="og:description" content="${esc(p.description)}" />
  <meta property="og:image" content="${ORIGIN}/og-card.png" />
  <meta property="og:url" content="${ORIGIN}${path}" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preload" href="/fonts/outfit-var.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="/pages.css" />
${p.key === 'faq' ? `  ${faqJsonLd(p.lang)}\n` : ''}</head>
<body>
  <header class="site-head">
    <div class="wrap head-row">
      <a class="brand" href="/">DotDuel</a>
      <a class="play-btn" href="/">${nav.play}</a>
    </div>
    <nav class="wrap site-nav" aria-label="DotDuel">${links}</nav>
  </header>
  <main class="wrap">
    <h1>${esc(p.h1)}</h1>
    <p class="lead">${p.lead}</p>
${p.body}
    <p class="cta"><a class="play-btn big" href="/">${nav.play}</a></p>
  </main>
  <footer class="wrap site-foot">
    <nav class="langs" aria-label="Language">${langLinks}</nav>
    <span>© 2026 DotDuel</span>
    <a href="/privacy.html">${nav.privacy}</a>
    <a href="mailto:donstn@gmail.com">donstn@gmail.com</a>
  </footer>
</body>
</html>
`;
}
