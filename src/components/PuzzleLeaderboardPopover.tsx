import { useEffect, useState } from 'react';
import { dateToUtcKey } from '../dailyPuzzles';
import {
  fetchRecentDailyWinners,
  type DailyWinner,
} from '../cloud/dailyLeaderboard';
import { useT, type Messages } from '../i18n';

interface Props {
  myUid: string | null;
  onClose: () => void;
}

// Parse the YYYY-MM-DD key directly (no Date — avoids local-timezone drift).
function fmtDate(date: string, todayKey: string, t: Messages): string {
  if (date === todayKey) return t.puzzleBoard.today;
  const parts = date.split('-');
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return t.puzzleBoard.date(t.changelog.months[m - 1] ?? '?', d);
}

// Daily-puzzle leaderboard — a single list of the WINNER of each of the last 30
// played days (newest first), shown with the date. Today is the top row once
// someone has finished today's puzzle. Ranked by P1 score.
export function PuzzleLeaderboardPopover({ myUid, onClose }: Props) {
  const t = useT();
  const today = dateToUtcKey();
  const [winners, setWinners] = useState<DailyWinner[] | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let alive = true;
    fetchRecentDailyWinners(30).then((w) => {
      if (alive) setWinners(w);
    });
    return () => {
      alive = false;
    };
  }, []);

  const onBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="rules-overlay"
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={t.puzzleBoard.aria}
    >
      <div className="rules-card puzzle-lb-card">
        <button className="rules-close" onClick={onClose} aria-label={t.puzzleBoard.close}>
          ✕
        </button>

        <header className="rules-header">
          <h2>{t.puzzleBoard.title}</h2>
          <p className="rules-tagline">{t.puzzleBoard.tagline}</p>
        </header>

        <div className="puzzle-lb-body">
          {winners === null ? (
            <p className="settings-hint">{t.puzzleBoard.loading}</p>
          ) : winners.length === 0 ? (
            <p className="settings-hint">{t.puzzleBoard.empty}</p>
          ) : (
            <ol className="puzzle-lb-list puzzle-lb-winners">
              {winners.map((d) => {
                const isMe = myUid !== null && d.winner.uid === myUid;
                return (
                  <li
                    key={d.date}
                    className={`puzzle-lb-row${isMe ? ' puzzle-lb-row-me' : ''}`}
                  >
                    <span className="puzzle-lb-date">{fmtDate(d.date, today, t)}</span>
                    <span className="puzzle-lb-name" title={d.winner.displayName}>
                      {d.winner.displayName}
                      {isMe && <span className="puzzle-lb-you">{t.puzzleBoard.you}</span>}
                    </span>
                    <span className="puzzle-lb-margin">{d.winner.best}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <footer className="rules-footer-bar">
          <button className="rules-got-it" onClick={onClose}>
            {t.puzzleBoard.done}
          </button>
        </footer>
      </div>
    </div>
  );
}
