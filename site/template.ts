// Shared HTML shell for the static guide pages (built into dist/ by
// scripts/build-pages.ts). Plain HTML + one stylesheet, no JS — readable by
// search engines and the AdSense crawler without rendering the game.

export type Lang = 'en' | 'lt';

export interface PageKey {
  key: 'howToPlay' | 'strategy' | 'about' | 'changelog';
}

export const ORIGIN = 'https://www.dotduel.com';

export const PATHS: Record<Lang, Record<PageKey['key'], string>> = {
  en: {
    howToPlay: '/how-to-play/',
    strategy: '/strategy/',
    about: '/about/',
    changelog: '/changelog/',
  },
  lt: {
    howToPlay: '/lt/kaip-zaisti/',
    strategy: '/lt/strategija/',
    about: '/lt/apie/',
    changelog: '/lt/naujienos/',
  },
};

const NAV: Record<Lang, Record<PageKey['key'], string> & { play: string; privacy: string; other: string }> = {
  en: {
    howToPlay: 'Guide',
    strategy: 'Strategy',
    about: 'About',
    changelog: 'Changelog',
    play: 'Play now',
    privacy: 'Privacy',
    other: 'Lietuviškai',
  },
  lt: {
    howToPlay: 'Vadovas',
    strategy: 'Strategija',
    about: 'Apie',
    changelog: 'Naujienos',
    play: 'Žaisti',
    privacy: 'Privatumas',
    other: 'English',
  },
};

export interface PageInput {
  lang: Lang;
  key: PageKey['key'];
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
  const other: Lang = p.lang === 'en' ? 'lt' : 'en';
  const nav = NAV[p.lang];
  const path = PATHS[p.lang][p.key];
  const links = (Object.keys(PATHS[p.lang]) as PageKey['key'][])
    .map(
      (k) =>
        `<a href="${PATHS[p.lang][k]}"${k === p.key ? ' aria-current="page"' : ''}>${nav[k]}</a>`,
    )
    .join('');
  return `<!doctype html>
<html lang="${p.lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>${esc(p.title)}</title>
  <meta name="description" content="${esc(p.description)}" />
  <link rel="canonical" href="${ORIGIN}${path}" />
  <link rel="alternate" hreflang="${p.lang}" href="${ORIGIN}${path}" />
  <link rel="alternate" hreflang="${other}" href="${ORIGIN}${PATHS[other][p.key]}" />
  <link rel="alternate" hreflang="x-default" href="${ORIGIN}${PATHS.en[p.key]}" />
  <meta property="og:title" content="${esc(p.title)}" />
  <meta property="og:description" content="${esc(p.description)}" />
  <meta property="og:image" content="${ORIGIN}/og-card.png" />
  <meta property="og:url" content="${ORIGIN}${path}" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preload" href="/fonts/outfit-var.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="/pages.css" />
</head>
<body>
  <header class="site-head">
    <div class="wrap head-row">
      <a class="brand" href="/">DotDuel</a>
      <a class="play-btn" href="/">${nav.play}</a>
    </div>
    <nav class="wrap site-nav" aria-label="DotDuel">${links}<a class="lang" href="${PATHS[other][p.key]}" hreflang="${other}" lang="${other}">${nav.other}</a></nav>
  </header>
  <main class="wrap">
    <h1>${esc(p.h1)}</h1>
    <p class="lead">${p.lead}</p>
${p.body}
    <p class="cta"><a class="play-btn big" href="/">${nav.play}</a></p>
  </main>
  <footer class="wrap site-foot">
    <span>© 2026 DotDuel</span>
    <a href="/privacy.html">${nav.privacy}</a>
    <a href="mailto:donstn@gmail.com">donstn@gmail.com</a>
  </footer>
</body>
</html>
`;
}
