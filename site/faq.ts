// Question/answer pairs read out of each language's FAQ page body, so the
// FAQPage structured data (and the short FAQ on the home page) always match
// the visible, reviewed text.
import type { Lang } from './langs';
import { SITE } from './langs';

export interface Faq {
  q: string;
  /** Answer as HTML (links kept). */
  a: string;
}

export function faqs(lang: Lang): Faq[] {
  const out: Faq[] = [];
  for (const m of SITE[lang].faq.body.matchAll(/<h2>([\s\S]*?)<\/h2>\s*<p>([\s\S]*?)<\/p>/g)) {
    out.push({ q: m[1].trim(), a: m[2].trim() });
  }
  return out;
}

const text = (html: string) =>
  html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export function faqJsonLd(lang: Lang): string {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: lang,
    mainEntity: faqs(lang).map((f) => ({
      '@type': 'Question',
      name: text(f.q),
      acceptedAnswer: { '@type': 'Answer', text: text(f.a) },
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\u003c')}</script>`;
}
