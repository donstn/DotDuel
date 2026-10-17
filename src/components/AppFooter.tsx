import { useState } from 'react';
import { LANGS, useLang, useT } from '../i18n';

interface Props {
  onOpenHowTo: () => void;
  onOpenRules: () => void;
  onOpenSettings: () => void;
  onOpenPrivacy: () => void;
  onOpenChangelog: () => void;
  /** Menu screens only: theme picker + language switcher live in the footer
   *  so they're always on screen without taking menu height. */
  onOpenThemes?: () => void;
  showLanguage?: boolean;
  version: string;
}

export function AppFooter({
  onOpenHowTo,
  onOpenRules,
  onOpenSettings,
  onOpenPrivacy,
  onOpenChangelog,
  onOpenThemes,
  showLanguage = false,
  version,
}: Props) {
  const t = useT();
  const { lang, setLang } = useLang();
  const [langOpen, setLangOpen] = useState(false);
  return (
    <footer className="app-footer">
      {langOpen && <div className="menu-lang-backdrop" onClick={() => setLangOpen(false)} />}
      <div className="app-footer-inner">
        {showLanguage && (
          <span className="menu-lang app-footer-lang">
            <button
              type="button"
              className="app-footer-ctl"
              onClick={() => setLangOpen((o) => !o)}
              aria-label={t.lang.label}
              title={t.lang.label}
              aria-haspopup="menu"
              aria-expanded={langOpen}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 0c2.5 2.6 2.5 15.4 0 18m0-18c-2.5 2.6-2.5 15.4 0 18M3.5 9h17M3.5 15h17"
                />
              </svg>
              {lang.toUpperCase()}
            </button>
            {langOpen && (
              <span className="menu-lang-pop" role="menu">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    role="menuitemradio"
                    aria-checked={l.code === lang}
                    className={`menu-lang-opt ${l.code === lang ? 'is-on' : ''}`}
                    onClick={() => {
                      setLang(l.code);
                      setLangOpen(false);
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </span>
            )}
          </span>
        )}
        {onOpenThemes && (
          <button
            type="button"
            className="app-footer-ctl"
            onClick={onOpenThemes}
            aria-label={t.menu.changeTheme}
            title={t.menu.changeTheme}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" width="15" height="15">
              <path
                fill="currentColor"
                d="M12 3a9 9 0 0 0 0 18 1.5 1.5 0 0 0 1.16-2.46 1.5 1.5 0 0 1 1.16-2.46H17a4 4 0 0 0 4-4c0-4.97-4.03-9-9-9zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
              />
            </svg>
          </button>
        )}
        {(showLanguage || onOpenThemes) && <span className="sep">·</span>}
        <span className="app-footer-brand" title={t.footer.brandTitle}>
          {t.footer.brand}
        </span>
        <span className="sep">·</span>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onOpenHowTo();
          }}
        >
          {t.footer.howToPlay}
        </a>
        <span className="sep">·</span>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onOpenRules();
          }}
        >
          {t.footer.rules}
        </a>
        <span className="sep">·</span>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onOpenSettings();
          }}
        >
          {t.footer.settings}
        </a>
        <span className="sep">·</span>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onOpenPrivacy();
          }}
        >
          {t.footer.privacy}
        </a>
        <span className="sep">·</span>
        <button
          type="button"
          className="app-footer-version app-footer-version-btn"
          onClick={onOpenChangelog}
          title={t.footer.versionTitle}
        >
          {version}
        </button>
      </div>
    </footer>
  );
}
