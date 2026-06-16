import { useEffect, useState } from 'react';
import type { AppUser } from '../auth/AppUser';
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
import { useT } from '../i18n';

const PLACEMENT_TOTAL = 10;

interface Props {
  user: AppUser;
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
  const t = useT();
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
    cloudDisplayName?.trim() || settings.playerName || t.profile.fallbackName;
  const row = getPlayerRow(localName);
  const aiTotal = vsAITotal(row);
  const hsTotal = hotseatTotal(row);
  const aiGames = totalGames(aiTotal);
  const hsGames = totalGames(hsTotal);
  const totalAll = aiGames + hsGames;
  const scored = totalPointsScored(row);
  const given = totalPointsGiven(row);

  const providerId = user.provider ?? '';
  const providerLabel =
    providerId === 'google'
      ? t.profile.providerGoogle
      : providerId === 'email'
        ? t.profile.providerEmail
        : providerId || t.profile.providerUnknown;

  const displayName =
    cloudDisplayName?.trim() ||
    user.displayName?.trim() ||
    user.email?.split('@')[0] ||
    t.profile.accountFallback;

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
      aria-label={t.profile.aria}
    >
      <div className="rules-card profile-card">
        <button className="rules-close" onClick={onClose} aria-label={t.profile.close}>
          ✕
        </button>

        <header className="rules-header">
          <h2>{t.profile.title}</h2>
          <p className="rules-tagline">{t.profile.tagline}</p>
        </header>

        <div className="profile-body">
          <section className="profile-section">
            <h3>{t.profile.accountH}</h3>
            <div className="profile-row">
              <span>{t.profile.gameName}</span>
              <span className="profile-name-row">
                <strong>{displayName}</strong>
                <button
                  type="button"
                  className="profile-rename-btn"
                  onClick={onRename}
                >
                  {t.profile.rename}
                </button>
              </span>
            </div>
            <div className="profile-row">
              <span>{t.profile.email}</span>
              <strong className="profile-email">{user.email}</strong>
            </div>
            <div className="profile-row">
              <span>{t.profile.signInMethod}</span>
              <strong>{providerLabel}</strong>
            </div>
            {!user.emailVerified && providerId === 'email' && (
              <p className="settings-hint">{t.profile.emailUnverified}</p>
            )}
          </section>

          <section className="profile-section">
            <h3>{t.profile.multiplayerH}</h3>
            <MultiplayerSection
              cloudProfile={cloudProfile}
              myUid={user.uid}
              matches={recentMatches}
            />
          </section>

          <section className="profile-section">
            <h3>{t.profile.streakH}</h3>
            <StreakSection cloudProfile={cloudProfile} />
          </section>

          <section className="profile-section">
            <h3>{t.profile.offlineHistoryH(localName)}</h3>
            {totalAll === 0 ? (
              <p className="settings-hint">{t.profile.offlineEmpty}</p>
            ) : (
              <>
                <div className="profile-row">
                  <span>{t.profile.totalGames}</span>
                  <strong>{totalAll}</strong>
                </div>
                <div className="profile-row">
                  <span>{t.profile.vsBotsWDL}</span>
                  <strong>
                    {aiTotal.wins} / {aiTotal.draws} / {aiTotal.losses}{' '}
                    <em>({safePercent(aiTotal.wins, aiGames)})</em>
                  </strong>
                </div>
                <div className="profile-row">
                  <span>{t.profile.hotseatWDL}</span>
                  <strong>
                    {hsTotal.wins} / {hsTotal.draws} / {hsTotal.losses}
                  </strong>
                </div>
                <div className="profile-row">
                  <span>{t.profile.pointsScored}</span>
                  <strong>
                    {scored} <em>({t.profile.avg(avgPerGame(scored, totalAll))})</em>
                  </strong>
                </div>
                <div className="profile-row">
                  <span>{t.profile.pointsGiven}</span>
                  <strong>
                    {given} <em>({t.profile.avg(avgPerGame(given, totalAll))})</em>
                  </strong>
                </div>
              </>
            )}
            <p className="settings-hint">{t.profile.offlineHint}</p>
          </section>

          <section className="profile-section">
            <h3>{t.profile.dataH}</h3>
            <p className="settings-hint">{t.profile.dataHint}</p>
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
                {exporting ? t.profile.preparing : t.profile.downloadData}
              </button>
              <button
                type="button"
                className="settings-danger-btn"
                onClick={() => setConfirmDelete(true)}
              >
                {t.profile.deleteAccount}
              </button>
            </div>
            {deleteError && (
              <p className="profile-delete-error">{deleteError}</p>
            )}
          </section>
        </div>

        <footer className="rules-footer-bar profile-footer-bar">
          <button className="settings-danger-btn" onClick={handleSignOut}>
            {t.profile.signOut}
          </button>
          <button className="rules-got-it" onClick={onClose}>
            {t.profile.done}
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
            <h3>{t.profile.deleteConfirmTitle}</h3>
            <p>{t.profile.deleteConfirmBody}</p>
            <div className="confirm-actions">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                {t.profile.cancel}
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
                      (e as { message?: string })?.message ?? t.profile.deleteFailed;
                    setDeleteError(msg);
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                {deleting ? t.profile.deleting : t.profile.deleteForever}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StreakSection({ cloudProfile }: { cloudProfile: CloudProfile | null }) {
  const t = useT();
  const streak = cloudProfile?.streak;
  if (!streak || streak.current <= 0) {
    return <p className="settings-hint">{t.profile.streakEmpty}</p>;
  }
  return (
    <>
      <div className="profile-row">
        <span>{t.profile.currentStreak}</span>
        <strong className="profile-streak-current">
          <Flame /> {t.profile.dayN(streak.current)}
        </strong>
      </div>
      <div className="profile-row">
        <span>{t.profile.longest}</span>
        <strong>{t.profile.dayN(streak.longest)}</strong>
      </div>
      <p className="settings-hint">{t.profile.streakHint}</p>
    </>
  );
}

function Flame() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      className="profile-streak-flame"
      aria-hidden="true"
    >
      <path
        d="M12 2c.6 3-1.2 5-2.5 6.5-1.4 1.6-2.5 3.1-2.5 5.3 0 3.7 2.9 6.7 6.5 6.7s6.5-3 6.5-6.7c0-2.5-1.4-4.4-3-6.1.5 1.4-.1 2.6-1 3.1.7-3-1.1-6.4-4-8.8z"
        fill="currentColor"
      />
    </svg>
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
  const t = useT();
  const rating = cloudProfile?.rating ?? 1000;
  const placement = cloudProfile?.placementGamesPlayed ?? 0;
  const provisional = placement < PLACEMENT_TOTAL;

  return (
    <>
      <div className="profile-row">
        <span>{t.profile.rating}</span>
        <strong className="profile-rating">
          {rating}
          {provisional && (
            <span className="provisional-badge" title={t.profile.provisionalTitle}>
              {t.profile.provisional(placement, PLACEMENT_TOTAL)}
            </span>
          )}
        </strong>
      </div>
      <div className="match-history">
        <div className="match-history-label">
          {t.profile.lastMatches(Math.min(matches.length, 5))}
        </div>
        {matches.length === 0 ? (
          <p className="settings-hint">{t.profile.noMatches}</p>
        ) : (
          <ul className="match-history-list">
            {matches.map((m) => {
              const v = fromMyPerspective(m, myUid);
              const sign = v.myRatingDelta > 0 ? '+' : '';
              return (
                <li key={m.matchId} className={`match-row match-row-${v.result}`}>
                  <span className={`match-result match-result-${v.result}`}>
                    {v.result === 'win' ? t.common.w : v.result === 'loss' ? t.common.l : t.common.d}
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
