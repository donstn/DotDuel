export const LANGS = ['en', 'lt', 'es', 'pt', 'pl', 'cs'] as const;
export type Lang = (typeof LANGS)[number];

export type PageName = 'howToPlay' | 'strategy' | 'faq' | 'about' | 'changelog';

/** One page's text. `lead` and `body` are HTML. */
export interface Content {
  title: string;
  description: string;
  h1: string;
  lead: string;
  body: string;
}

/** Everything one language needs for the website pages. */
export interface SiteText {
  /** URL of each page, e.g. '/es/como-jugar/' (English has no prefix). */
  paths: Record<PageName, string>;
  /** Short nav labels, plus the "Play" button and the footer privacy link. */
  nav: Record<PageName, string> & { play: string; privacy: string };
  howToPlay: Content;
  strategy: Content;
  faq: Content;
  about: Content;
  /** Changelog page chrome; the entries come from src/changelog.ts. */
  changelog: Omit<Content, 'body'>;
}

/** Each language's own name, for the language switcher. */
export const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  lt: 'Lietuvių',
  es: 'Español',
  pt: 'Português',
  pl: 'Polski',
  cs: 'Čeština',
};
