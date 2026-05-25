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
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <span className="app-footer-brand">DotDuel © 2026</span>
        <span className="sep">·</span>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onOpenRules();
          }}
        >
          Rules
        </a>
        <span className="sep">·</span>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onOpenSettings();
          }}
        >
          Settings
        </a>
        <span className="sep">·</span>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onOpenPrivacy();
          }}
        >
          Privacy
        </a>
        <span className="sep">·</span>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onOpenThemes();
          }}
        >
          Theme
        </a>
        <span className="sep">·</span>
        <button
          type="button"
          className="app-footer-version app-footer-version-btn"
          onClick={onOpenChangelog}
          title="See what's new"
        >
          {version}
        </button>
      </div>
    </footer>
  );
}
