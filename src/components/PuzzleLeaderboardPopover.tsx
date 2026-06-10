import { useEffect, useState } from 'react';
import { dateToUtcKey } from '../dailyPuzzles';
import {
  fetchRecentDailyWinners,
  type DailyWinner,
} from '../cloud/dailyLeaderboard';

interface Props {
  myUid: string | null;
  onClose: () => void;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Parse the YYYY-MM-DD key directly (no Date — avoids local-timezone drift).
function fmtDate(date: string, todayKey: string): string {
  if (date === todayKey) return 'Today';
  const parts = date.split('-');
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return `${MONTHS[m - 1] ?? '?'} ${d}`;
}

// Daily-puzzle leaderboard — a single list of the WINNER of each of the last 30
// played days (newest first), shown with the date. Today is the top row once
// someone has finished today's puzzle. Ranked by P1 score.
export function PuzzleLeaderboardPopover({ myUid, onClose }: Props) {
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
      aria-label="Puzzle leaderboard"
    >
      <div className="rules-card puzzle-lb-card">
        <button className="rules-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <header className="rules-header">
          <h2>Daily winners</h2>
          <p className="rules-tagline">
            Highest score takes the day. Ties broken by who finished first.
            Resets at midnight UTC.
          </p>
        </header>

        <div className="puzzle-lb-body">
          {winners === null ? (
            <p className="settings-hint">Loading…</p>
          ) : winners.length === 0 ? (
            <p className="settings-hint">
              No one has finished a daily puzzle yet. Be the first.
            </p>
          ) : (
            <ol className="puzzle-lb-list puzzle-lb-winners">
              {winners.map((d) => {
                const isMe = myUid !== null && d.winner.uid === myUid;
                return (
                  <li
                    key={d.date}
                    className={`puzzle-lb-row${isMe ? ' puzzle-lb-row-me' : ''}`}
                  >
                    <span className="puzzle-lb-date">{fmtDate(d.date, today)}</span>
                    <span className="puzzle-lb-name" title={d.winner.displayName}>
                      {d.winner.displayName}
                      {isMe && <span className="puzzle-lb-you"> (you)</span>}
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
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
