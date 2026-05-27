import { useEffect, useState } from 'react';
import { TIME_CONTROLS } from '../cloud/matchmaking';
import type { TimeControl } from '../cloud/matchmaking';

interface Props {
  timeControl: TimeControl;
  onCancel: () => void;
}

export function MatchmakingWaiting({ timeControl, onCancel }: Props) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const tc = TIME_CONTROLS.find((t) => t.id === timeControl);

  return (
    <div className="menu">
      <h2>Finding an opponent…</h2>
      <p className="hint">
        {tc?.label ?? timeControl} · {tc?.per ?? ''}
      </p>
      <div className="matchmaking-card">
        <div className="matchmaking-spinner" aria-hidden="true">
          <span>·</span>
          <span>·</span>
          <span>·</span>
        </div>
        <p className="matchmaking-status">
          {seconds < 15
            ? `Waiting for a player at your rating (${seconds}s)`
            : `Still searching — we may pair you with a ranked AI shortly (${seconds}s)`}
        </p>
        <button
          type="button"
          className="menu-auth-btn matchmaking-cancel-btn"
          onClick={onCancel}
        >
          Cancel search
        </button>
        <p className="settings-hint">
          Match range expands by ~25 Elo per second. We'll pair you with the closest opponent.
        </p>
      </div>
    </div>
  );
}
