import { useEffect, useState } from 'react';
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
import type { CloudProfile } from '../cloud/usernames';
import {
  fromMyPerspective,
  watchRecentMatches,
  type MatchRecord,
} from '../cloud/matchHistory';
import { deleteMyAccount, downloadMyData } from '../cloud/account';

const PLACEMENT_TOTAL = 10;

interface Props {
  user: User;
  settings: Settings;
  cloudProfile: CloudProfile | null;
  onSignOut: () => void;
  onRename: () => void;
  onClose: () => void;
  onAccountDeleted?: () => void;
}

export function ProfilePopover({
  user,
  settings,
  cloudProfile,
  onSignOut,
  onRename,
  onClose,
  onAccountDeleted,
}: Props) {
  const [exporting, setExporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const cloudDisplayName = cloudProfile?.displayName ?? null;
  const [recentMatches, setRecentMatches] = useState<MatchRecord[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    return watchRecentMatches(user.uid, setRecentMatches, 5);
  }, [user.uid]);

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
            <h3>Multiplayer</h3>
            <MultiplayerSection
              cloudProfile={cloudProfile}
              myUid={user.uid}
              matches={recentMatches}
            />
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

          <section className="profile-section">
            <h3>Your data</h3>
            <p className="settings-hint">
              Under GDPR you can download everything we hold about you, or
              delete your account entirely. Deletion is immediate and
              cannot be undone.
            </p>
            <div className="profile-gdpr-actions">
              <button
                type="button"
                className="profile-rename-btn"
                disabled={exporting}
                onClick={async () => {
                  setExporting(true);
                  try {
                    await downloadMyData(user.uid);
                  } catch (e) {
                    console.warn('export failed:', e);
                  } finally {
                    setExporting(false);
                  }
                }}
              >
                {exporting ? 'Preparing…' : 'Download my data'}
              </button>
              <button
                type="button"
                className="settings-danger-btn"
                onClick={() => setConfirmDelete(true)}
              >
                Delete my account
              </button>
            </div>
            {deleteError && (
              <p className="profile-delete-error">{deleteError}</p>
            )}
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
      {confirmDelete && (
        <div
          className="confirm-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) {
              setConfirmDelete(false);
            }
          }}
        >
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <h3>Delete your account?</h3>
            <p>
              This permanently removes your account, sign-in, leaderboard
              entry, and scrubs your name from past matches. Opponents
              keep their rating history. If you're in a live game it will
              forfeit. This cannot be undone.
            </p>
            <div className="confirm-actions">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="danger"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  setDeleteError(null);
                  try {
                    await deleteMyAccount();
                    setConfirmDelete(false);
                    onClose();
                    if (onAccountDeleted) onAccountDeleted();
                    else onSignOut();
                  } catch (e) {
                    const msg =
                      (e as { message?: string })?.message ??
                      'Deletion failed. Please try again.';
                    setDeleteError(msg);
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                {deleting ? 'Deleting…' : 'Delete forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MultiplayerSection({
  cloudProfile,
  myUid,
  matches,
}: {
  cloudProfile: CloudProfile | null;
  myUid: string;
  matches: MatchRecord[];
}) {
  const rating = cloudProfile?.rating ?? 1000;
  const placement = cloudProfile?.placementGamesPlayed ?? 0;
  const provisional = placement < PLACEMENT_TOTAL;

  return (
    <>
      <div className="profile-row">
        <span>Rating</span>
        <strong className="profile-rating">
          {rating}
          {provisional && (
            <span className="provisional-badge" title="Rating stabilises after 10 ranked games">
              Provisional {placement}/{PLACEMENT_TOTAL}
            </span>
          )}
        </strong>
      </div>
      <div className="match-history">
        <div className="match-history-label">Last {Math.min(matches.length, 5) || ''} matches</div>
        {matches.length === 0 ? (
          <p className="settings-hint">No ranked matches yet. Queue up from the menu.</p>
        ) : (
          <ul className="match-history-list">
            {matches.map((m) => {
              const v = fromMyPerspective(m, myUid);
              const sign = v.myRatingDelta > 0 ? '+' : '';
              return (
                <li key={m.matchId} className={`match-row match-row-${v.result}`}>
                  <span className={`match-result match-result-${v.result}`}>
                    {v.result === 'win' ? 'W' : v.result === 'loss' ? 'L' : 'D'}
                  </span>
                  <span className="match-opponent" title={v.opponentDisplay}>
                    {v.opponentDisplay}
                  </span>
                  <span className="match-score">
                    {v.myScore}–{v.opponentScore}
                  </span>
                  <span
                    className={`match-delta match-delta-${v.myRatingDelta > 0 ? 'up' : v.myRatingDelta < 0 ? 'down' : 'flat'}`}
                  >
                    {sign}
                    {v.myRatingDelta}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
