import { useT } from '../i18n';

interface Props {
  onOpenRules: () => void;
  onOpenSettings: () => void;
  onOpenPrivacy: () => void;
  onOpenChangelog: () => void;
  onOpenThemes: () => void;
  version: string;
}

export function AppFooter({
  onOpenRules,
  onOpenSettings,
  onOpenPrivacy,
  onOpenChangelog,
  onOpenThemes,
  version,
}: Props) {
  const t = useT();
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <span className="app-footer-brand" title={t.footer.brandTitle}>
          {t.footer.brand}
        </span>
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
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onOpenThemes();
          }}
        >
          {t.footer.theme}
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
