interface Props {
  onOpenRules: () => void;
  onOpenSettings: () => void;
}

export function AppFooter({ onOpenRules, onOpenSettings }: Props) {
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
      </div>
    </footer>
  );
}
