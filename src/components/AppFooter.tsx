import { useT } from '../i18n';

interface Props {
  onOpenHowTo: () => void;
  onOpenRules: () => void;
  onOpenSettings: () => void;
  onOpenPrivacy: () => void;
  onOpenChangelog: () => void;
  version: string;
}

export function AppFooter({
  onOpenHowTo,
  onOpenRules,
  onOpenSettings,
  onOpenPrivacy,
  onOpenChangelog,
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
