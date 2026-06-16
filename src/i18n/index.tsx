/**
 * i18n runtime — a tiny, dependency-free layer over the per-language message
 * files. `useT()` returns the current language's `Messages` object directly, so
 * components read `t.menu.play` (type-checked) or call `t.menu.dots(36)` for
 * interpolated/grammatical strings. Switching language re-renders via context.
 *
 * Add a language: create `<code>.ts` exporting a `Messages`, then add it to
 * `MESSAGES` and `LANGS` below. Nothing else needs to change.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { en, type Messages } from './en';
import { lt } from './lt';
import { es } from './es';
import { pt } from './pt';

export type Lang = 'en' | 'lt' | 'es' | 'pt';

/** Order here = order in the language picker. `label` is shown in its own language. */
export const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'lt', label: 'Lietuvių' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
];

const MESSAGES: Record<Lang, Messages> = { en, lt, es, pt };

const STORAGE_KEY = 'dotduel:lang:v1';

function isLang(v: unknown): v is Lang {
  return v === 'en' || v === 'lt' || v === 'es' || v === 'pt';
}

/**
 * First-load language. Priority: explicit saved choice → browser/OS language →
 * Europe/Vilnius timezone → English. All client-side, no network (zero-cost).
 */
export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    // localStorage may be unavailable (private mode) — fall through to auto-detect.
  }
  try {
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
    // Honour the user's ORDER of preference: first matching supported language wins.
    for (const raw of langs) {
      const l = raw?.toLowerCase() ?? '';
      if (l.startsWith('lt')) return 'lt';
      if (l.startsWith('es')) return 'es';
      if (l.startsWith('pt')) return 'pt';
    }
    if (Intl.DateTimeFormat().resolvedOptions().timeZone === 'Europe/Vilnius') return 'lt';
  } catch {
    // ignore — default below.
  }
  return 'en';
}

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Messages;
}

const Ctx = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore persistence failures
    }
  }, []);

  const value = useMemo<LangCtx>(
    () => ({ lang, setLang, t: MESSAGES[lang] }),
    [lang, setLang],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function useCtx(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useT/useLang must be used inside <LanguageProvider>');
  return ctx;
}

/** The current language's messages: `const t = useT(); t.menu.signIn`. */
export function useT(): Messages {
  return useCtx().t;
}

/** Current language + setter, for the language picker. */
export function useLang(): { lang: Lang; setLang: (l: Lang) => void } {
  const { lang, setLang } = useCtx();
  return { lang, setLang };
}
