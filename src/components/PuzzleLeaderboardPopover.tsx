import { useEffect, useState } from 'react';
import {
  dateToUtcKey,
} from '../dailyPuzzles';
import {
  watchTodaysLeaderboard,
  type LeaderboardEntry,
} from '../cloud/dailyLeaderboard';

interface Props {
  myUid: string | null;
  onClose: () => void;
}

// Phase 2b-v2 — daily-puzzle leaderboard popover.
// v2 scope: today only. Historical (date picker, month, name search) is
// deferred to v3 — keep the surface predictable so future sections slot
// in without a rebuild.
export function PuzzleLeaderboardPopover({ myUid, onClose }: Props) {
  const today = dateToUtcKey();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

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
            Today &middot; {today} (UTC). Highest margin wins. Ties broken by
            who finished first.
          </p>
        </header>

        <div className="puzzle-lb-body">
          {!loaded ? (
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
          )}
          <p className="settings-hint puzzle-lb-footnote">
            Historical leaderboards (by day, month, top performer) coming soon.
          </p>
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
