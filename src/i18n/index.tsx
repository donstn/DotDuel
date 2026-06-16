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
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { en, type Messages } from './en';
import { lt } from './lt';
import { es } from './es';
import { pt } from './pt';
import { pl } from './pl';
import { cs } from './cs';

export type Lang = 'en' | 'lt' | 'es' | 'pt' | 'pl' | 'cs';

/** Order here = order in the language picker. `label` is shown in its own language. */
export const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'lt', label: 'Lietuvių' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'pl', label: 'Polski' },
  { code: 'cs', label: 'Čeština' },
];

const MESSAGES: Record<Lang, Messages> = { en, lt, es, pt, pl, cs };

const STORAGE_KEY = 'dotduel:lang:v1';

function isLang(v: unknown): v is Lang {
  return (
    v === 'en' || v === 'lt' || v === 'es' || v === 'pt' || v === 'pl' || v === 'cs'
  );
}

/** Explicit saved choice, if any. A user pick always wins over auto-detect. */
function savedLang(): Lang | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    // localStorage may be unavailable (private mode).
  }
  return null;
}

/**
 * Map BCP-47 language tags (in preference order) to a supported `Lang`, or null
 * if none match. Tags look like `cs`, `pt-BR`, `es-419` — we match on prefix.
 */
function matchTag(tags: readonly (string | undefined)[]): Lang | null {
  for (const raw of tags) {
    const l = raw?.toLowerCase() ?? '';
    if (l.startsWith('lt')) return 'lt';
    if (l.startsWith('es')) return 'es';
    if (l.startsWith('pt')) return 'pt';
    if (l.startsWith('pl')) return 'pl';
    if (l.startsWith('cs')) return 'cs';
  }
  return null;
}

/**
 * First-load language, resolved SYNCHRONOUSLY for instant first paint. Priority:
 * explicit saved choice → browser/OS language(s) → Europe/Vilnius timezone →
 * English. On the native app, `navigator.language` in the WebView can be
 * unreliable, so `LanguageProvider` refines this asynchronously from the real
 * device locale (`Device.getLanguageTag()`). All client-side, no network.
 */
export function detectLang(): Lang {
  const saved = savedLang();
  if (saved) return saved;
  try {
    const tags = navigator.languages?.length ? navigator.languages : [navigator.language];
    // Honour the user's ORDER of preference: first matching supported language wins.
    const m = matchTag(tags);
    if (m) return m;
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

  // Native app: the WebView's navigator.language often defaults to en-US
  // regardless of the device's chosen language/region, so read the real device
  // locale (set via the system / store region) and apply it — unless the user
  // has already made an explicit pick, which always wins. Not persisted: this is
  // auto-detection, so changing the device language later re-detects.
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || savedLang()) return;
    let cancelled = false;
    Device.getLanguageTag()
      .then(({ value }) => {
        const m = matchTag([value]);
        if (m && !cancelled) setLangState(m);
      })
      .catch(() => {
        // ignore — keep the synchronously-detected language.
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
