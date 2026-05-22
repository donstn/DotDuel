import type { User } from 'firebase/auth';

interface Props {
  onOpenRules: () => void;
  onOpenSettings: () => void;
  user: User | null;
  onOpenSignIn: () => void;
  onSignOut: () => void;
}

export function AppFooter({
  onOpenRules,
  onOpenSettings,
  user,
  onOpenSignIn,
  onSignOut,
}: Props) {
  const displayName =
    user?.displayName?.trim() || user?.email?.split('@')[0] || 'Account';

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
        {user ? (
          <>
            <span className="app-footer-account" title={user.email ?? ''}>
              {displayName}
            </span>
            <span className="sep">·</span>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSignOut();
              }}
            >
              Sign out
            </a>
          </>
        ) : (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onOpenSignIn();
            }}
          >
            Sign in
          </a>
        )}
      </div>
    </footer>
  );
}
