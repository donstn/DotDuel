import { useEffect } from 'react';
import type { User } from 'firebase/auth';
import {
  avgPerGame,
  getPlayerRow,
  hotseatTotal,
  safePercent,
  totalGames,
  totalPointsGiven,
  totalPointsScored,
  vsAITotal,
} from '../storage';
import type { Settings } from '../storage';

interface Props {
  user: User;
  settings: Settings;
  cloudDisplayName: string | null;
  onSignOut: () => void;
  onRename: () => void;
  onClose: () => void;
}

export function ProfilePopover({
  user,
  settings,
  cloudDisplayName,
  onSignOut,
  onRename,
  onClose,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const localName =
    cloudDisplayName?.trim() || settings.playerName || 'Player 1';
  const row = getPlayerRow(localName);
  const aiTotal = vsAITotal(row);
  const hsTotal = hotseatTotal(row);
  const aiGames = totalGames(aiTotal);
  const hsGames = totalGames(hsTotal);
  const totalAll = aiGames + hsGames;
  const scored = totalPointsScored(row);
  const given = totalPointsGiven(row);

  const providerId = user.providerData[0]?.providerId ?? '';
  const providerLabel =
    providerId === 'google.com'
      ? 'Google'
      : providerId === 'password'
        ? 'Email & password'
        : providerId || 'Unknown';

  const displayName =
    cloudDisplayName?.trim() ||
    user.displayName?.trim() ||
    user.email?.split('@')[0] ||
    'Account';

  const handleSignOut = () => {
    onSignOut();
    onClose();
  };

  return (
    <div
      className="rules-overlay"
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Profile"
    >
      <div className="rules-card profile-card">
        <button className="rules-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <header className="rules-header">
          <h2>Your profile</h2>
          <p className="rules-tagline">Account info + offline history.</p>
        </header>

        <div className="profile-body">
          <section className="profile-section">
            <h3>Account</h3>
            <div className="profile-row">
              <span>Game name</span>
              <span className="profile-name-row">
                <strong>{displayName}</strong>
                <button
                  type="button"
                  className="profile-rename-btn"
                  onClick={onRename}
                >
                  Rename
                </button>
              </span>
            </div>
            <div className="profile-row">
              <span>Email</span>
              <strong className="profile-email">{user.email}</strong>
            </div>
            <div className="profile-row">
              <span>Sign-in method</span>
              <strong>{providerLabel}</strong>
            </div>
            {!user.emailVerified && providerId === 'password' && (
              <p className="settings-hint">
                Email not yet verified. Check your inbox (and spam folder) for the
                link we sent.
              </p>
            )}
          </section>

          <section className="profile-section">
            <h3>Offline history — &ldquo;{localName}&rdquo;</h3>
            {totalAll === 0 ? (
              <p className="settings-hint">
                No games on this device yet. Start a Vs-AI or Hot-seat match to
                populate this.
              </p>
            ) : (
              <>
                <div className="profile-row">
                  <span>Total games</span>
                  <strong>{totalAll}</strong>
                </div>
                <div className="profile-row">
                  <span>Vs-AI · W/D/L</span>
                  <strong>
                    {aiTotal.wins} / {aiTotal.draws} / {aiTotal.losses}{' '}
                    <em>({safePercent(aiTotal.wins, aiGames)})</em>
                  </strong>
                </div>
                <div className="profile-row">
                  <span>Hot-seat · W/D/L</span>
                  <strong>
                    {hsTotal.wins} / {hsTotal.draws} / {hsTotal.losses}
                  </strong>
                </div>
                <div className="profile-row">
                  <span>Points scored</span>
                  <strong>
                    {scored} <em>(avg {avgPerGame(scored, totalAll)})</em>
                  </strong>
                </div>
                <div className="profile-row">
                  <span>Points given</span>
                  <strong>
                    {given} <em>(avg {avgPerGame(given, totalAll)})</em>
                  </strong>
                </div>
              </>
            )}
            <p className="settings-hint">
              Stored on this device under the name from Settings. Cloud sync
              comes next.
            </p>
          </section>
        </div>

        <footer className="rules-footer-bar profile-footer-bar">
          <button className="settings-danger-btn" onClick={handleSignOut}>
            Sign out
          </button>
          <button className="rules-got-it" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
