// Builds the static guide pages (how to play, strategy, about, changelog — in
// English and Lithuanian) plus sitemap.xml into dist/, after `vite build`.
// Plain HTML so search engines and the AdSense crawler can read DotDuel
// without running the game. Content: site/content.ts; changelog text comes
// from src/changelog.ts (+ the Lithuanian translations in src/i18n/lt.ts).
//
//   tsx scripts/build-pages.ts
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHANGELOG, type ChangeKind } from '../src/changelog';
import { en } from '../src/i18n/en';
import { lt } from '../src/i18n/lt';
import { CHANGELOG_TEXT, CONTENT } from '../site/content';
import { ORIGIN, PATHS, esc, renderPage, type Lang } from '../site/template';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const MESSAGES = { en, lt };
const KINDS: ChangeKind[] = ['added', 'changed', 'fixed'];

function write(path: string, html: string) {
  const file = resolve(dist, `.${path}index.html`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

function formatDate(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split('-').map(Number);
  const month = MESSAGES[lang].changelog.months[m - 1];
  return lang === 'lt' ? `${y} m. ${month} ${d} d.` : `${d} ${month} ${y}`;
}

function changelogBody(lang: Lang): string {
  const t = MESSAGES[lang].changelog;
  return CHANGELOG.map((entry) => {
    const tr = lang === 'en' ? undefined : t.entries[entry.version];
    const texts = entry.changes.map((c, i) => tr?.changes[i] ?? c.text);
    const highlight = tr?.highlight ?? (lang === 'en' ? entry.highlight : undefined);
    const groups = KINDS.map((kind) => {
      const items = entry.changes
        .map((c, i) => (c.kind === kind ? texts[i] : null))
        .filter((x): x is string => x !== null);
      if (items.length === 0) return '';
      return `      <h3>${esc(t[kind])}</h3>\n      <ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    }).join('\n');
    return `    <section class="release">
      <h2>${esc(entry.version)}</h2>
      <time datetime="${entry.date}">${formatDate(entry.date, lang)}</time>
${highlight ? `      <p class="highlight">${esc(highlight)}</p>\n` : ''}${groups}
    </section>`;
  }).join('\n');
}

const urls: string[] = [];
for (const lang of ['en', 'lt'] as Lang[]) {
  for (const key of ['howToPlay', 'strategy', 'about'] as const) {
    write(PATHS[lang][key], renderPage({ lang, key, ...CONTENT[key][lang] }));
    urls.push(PATHS[lang][key]);
  }
  write(
    PATHS[lang].changelog,
    renderPage({ lang, key: 'changelog', ...CHANGELOG_TEXT[lang], body: changelogBody(lang) }),
  );
  urls.push(PATHS[lang].changelog);
}
copyFileSync(resolve(root, 'site/pages.css'), resolve(dist, 'pages.css'));

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${['/', ...urls, '/privacy.html']
  .map(
    (u) =>
      `  <url><loc>${ORIGIN}${u}</loc><lastmod>${today}</lastmod><priority>${u === '/' ? '1.0' : '0.7'}</priority></url>`,
  )
  .join('\n')}
</urlset>
`;
writeFileSync(resolve(dist, 'sitemap.xml'), sitemap);
console.log(`built ${urls.length} pages + sitemap.xml`);
