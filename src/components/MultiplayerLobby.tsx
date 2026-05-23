import { useState } from 'react';
import { TIME_CONTROLS } from '../cloud/matchmaking';
import type { TimeControl } from '../cloud/matchmaking';

interface Props {
  rating: number;
  onBack: () => void;
  onFindMatch: (tc: TimeControl) => void;
}

export function MultiplayerLobby({ rating, onBack, onFindMatch }: Props) {
  const [selected, setSelected] = useState<TimeControl>('3min');

  return (
    <div className="menu">
      <button className="link-btn back-link" onClick={onBack}>
        ‹ Back
      </button>
      <h2>Multiplayer</h2>
      <p className="hint">
        Pick a time control. We'll match you against another player at a similar rating (yours: <strong>{rating}</strong>).
      </p>
      <div className="menu-grid menu-grid-tc">
        {TIME_CONTROLS.map((tc) => (
          <button
            key={tc.id}
            type="button"
            className={`menu-card ${selected === tc.id ? 'menu-card-selected' : ''}`}
            onClick={() => setSelected(tc.id)}
          >
            <strong>{tc.label}</strong>
            <span>{tc.per}</span>
            <span className="menu-card-sub">{tc.sub}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="hotseat-start"
        onClick={() => onFindMatch(selected)}
      >
        Find ranked match
      </button>
    </div>
  );
}
