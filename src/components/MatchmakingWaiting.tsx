import { useEffect, useState } from 'react';
import { TIME_CONTROLS } from '../cloud/matchmaking';
import type { TimeControl } from '../cloud/matchmaking';
import { useT } from '../i18n';

interface Props {
  timeControl: TimeControl;
  onCancel: () => void;
}

export function MatchmakingWaiting({ timeControl, onCancel }: Props) {
  const t = useT();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const hasTc = TIME_CONTROLS.some((tc) => tc.id === timeControl);

  return (
    <div className="menu">
      <h2>{t.matchmaking.finding}</h2>
      <p className="hint">
        {hasTc ? `${t.timeControls[timeControl].label} · ${t.timeControls[timeControl].per}` : timeControl}
      </p>
      <div className="matchmaking-card">
        <div className="matchmaking-spinner" aria-hidden="true">
          <span>·</span>
          <span>·</span>
          <span>·</span>
        </div>
        <p className="matchmaking-status">
          {seconds < 15
            ? t.matchmaking.waitingAtRating(seconds)
            : t.matchmaking.stillSearching(seconds)}
        </p>
        <button
          type="button"
          className="menu-auth-btn matchmaking-cancel-btn"
          onClick={onCancel}
        >
          {t.matchmaking.cancelSearch}
        </button>
        <p className="settings-hint">{t.matchmaking.rangeHint}</p>
      </div>
    </div>
  );
}
