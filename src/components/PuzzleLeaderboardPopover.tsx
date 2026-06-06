import { useEffect, useState } from 'react';
import { dateToUtcKey } from '../dailyPuzzles';
import {
  watchTodaysLeaderboard,
  fetchRecentDailyWinners,
  type LeaderboardEntry,
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

// Phase 2b-v3 — daily-puzzle leaderboard popover. Two tabs: today's full board
// and the winner of each of the last 30 days.
export function PuzzleLeaderboardPopover({ myUid, onClose }: Props) {
  const today = dateToUtcKey();
  const [tab, setTab] = useState<'today' | 'recent'>('today');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [recent, setRecent] = useState<DailyWinner[] | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    return watchTodaysLeaderboard(today, (next) => {
      setEntries(next);
      setLoaded(true);
    });
  }, [today]);

  // Lazily load the 30-day winner history the first time the tab is opened.
  useEffect(() => {
    if (tab !== 'recent' || recent !== null) return;
    let alive = true;
    fetchRecentDailyWinners(30).then((w) => {
      if (alive) setRecent(w);
    });
    return () => {
      alive = false;
    };
  }, [tab, recent]);

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
          <h2>Puzzle leaderboard</h2>
          <p className="rules-tagline">
            Highest margin wins. Ties broken by who finished first. Resets at
            midnight UTC.
          </p>
        </header>

        <div className="rankings-view-toggle puzzle-lb-tabs">
          <button
            type="button"
            className={`rankings-pill ${tab === 'today' ? 'active' : ''}`}
            onClick={() => setTab('today')}
          >
            Today
          </button>
          <button
            type="button"
            className={`rankings-pill ${tab === 'recent' ? 'active' : ''}`}
            onClick={() => setTab('recent')}
          >
            Recent winners
          </button>
        </div>

        <div className="puzzle-lb-body">
          {tab === 'today' ? (
            !loaded ? (
              <p className="settings-hint">Loading…</p>
            ) : entries.length === 0 ? (
              <p className="settings-hint">
                No entries yet today. Be the first to play today&rsquo;s puzzle.
              </p>
            ) : (
              <ol className="puzzle-lb-list">
                {entries.map((e, i) => {
                  const isMe = myUid !== null && e.uid === myUid;
                  return (
                    <li
                      key={e.uid}
                      className={`puzzle-lb-row${isMe ? ' puzzle-lb-row-me' : ''}`}
                    >
                      <span className="puzzle-lb-rank">{i + 1}</span>
                      <span className="puzzle-lb-name" title={e.displayName}>
                        {e.displayName}
                        {isMe && <span className="puzzle-lb-you"> (you)</span>}
                      </span>
                      <span className="puzzle-lb-margin">
                        {e.best > 0 ? '+' : ''}
                        {e.best}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )
          ) : recent === null ? (
            <p className="settings-hint">Loading…</p>
          ) : (
            <ol className="puzzle-lb-list puzzle-lb-winners">
              {recent.map((d) => {
                const isMe =
                  d.winner !== null && myUid !== null && d.winner.uid === myUid;
                return (
                  <li
                    key={d.date}
                    className={`puzzle-lb-row${isMe ? ' puzzle-lb-row-me' : ''}`}
                  >
                    <span className="puzzle-lb-date">{fmtDate(d.date, today)}</span>
                    <span
                      className="puzzle-lb-name"
                      title={d.winner?.displayName ?? undefined}
                    >
                      {d.winner ? (
                        d.winner.displayName
                      ) : (
                        <span className="puzzle-lb-empty">No entries</span>
                      )}
                      {isMe && <span className="puzzle-lb-you"> (you)</span>}
                    </span>
                    <span className="puzzle-lb-margin">
                      {d.winner ? `${d.winner.best > 0 ? '+' : ''}${d.winner.best}` : ''}
                    </span>
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
