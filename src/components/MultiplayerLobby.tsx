import { useState } from 'react';
import { TIME_CONTROLS } from '../cloud/matchmaking';
import type { TimeControl } from '../cloud/matchmaking';

interface Props {
  rating: number;
  rankedGamesPlayed: number;
  onBack: () => void;
  onFindMatch: (tc: TimeControl) => void;
}

// While the player base is small we concentrate ranked queueing into a
// single time control to keep wait times short. Bullet (1min) and Rapid
// (5min) are visible but locked. Flip these to UNLOCKED to allow them.
const UNLOCKED_TIME_CONTROLS: TimeControl[] = ['3min'];

// Per-player shape unlocks gated by ranked games played. Must match the
// server-side gate in functions/src/index.ts matchmake() — keep in sync.
const SHAPE_UNLOCKS: { games: number; label: string }[] = [
  { games: 0, label: 'Triangle' },
  { games: 50, label: 'Square' },
  { games: 100, label: 'Rectangle' },
];

function shapesUnlockedSummary(games: number): {
  unlocked: string[];
  nextLabel: string | null;
  nextAt: number | null;
} {
  const unlocked: string[] = [];
  let nextLabel: string | null = null;
  let nextAt: number | null = null;
  for (const tier of SHAPE_UNLOCKS) {
    if (games >= tier.games) {
      unlocked.push(tier.label);
    } else if (nextLabel === null) {
      nextLabel = tier.label;
      nextAt = tier.games;
    }
  }
  return { unlocked, nextLabel, nextAt };
}

export function MultiplayerLobby({
  rating,
  rankedGamesPlayed,
  onBack,
  onFindMatch,
}: Props) {
  const [selected, setSelected] = useState<TimeControl>('3min');
  const shapes = shapesUnlockedSummary(rankedGamesPlayed);
  const remainingToNext =
    shapes.nextAt !== null ? shapes.nextAt - rankedGamesPlayed : null;

  return (
    <div className="menu">
      <button className="link-btn back-link" onClick={onBack}>
        ‹ Back
      </button>
      <h2>Multiplayer</h2>
      <p className="hint">
        Pick a time control. We'll match you against another player at a
        similar rating (yours: <strong>{rating}</strong>).
      </p>
      <div className="menu-grid menu-grid-tc">
        {TIME_CONTROLS.map((tc) => {
          const locked = !UNLOCKED_TIME_CONTROLS.includes(tc.id);
          const isSelected = selected === tc.id;
          return (
            <button
              key={tc.id}
              type="button"
              className={`menu-card ${isSelected ? 'menu-card-selected' : ''} ${locked ? 'disabled' : ''}`}
              disabled={locked}
              onClick={() => !locked && setSelected(tc.id)}
              title={
                locked
                  ? 'Locked while the player base grows — only Blitz is open for now to keep matchmaking fast.'
                  : ''
              }
            >
              <strong>{tc.label}</strong>
              <span>{tc.per}</span>
              <span className="menu-card-sub">
                {locked ? 'Coming back soon' : tc.sub}
              </span>
            </button>
          );
        })}
      </div>
      <p className="hint mp-shape-hint">
        Board:{' '}
        <strong>{shapes.unlocked.join(' · ') || 'Triangle'}</strong>
        {shapes.nextLabel && remainingToNext !== null ? (
          <>
            {' '}— {shapes.nextLabel} unlocks in {remainingToNext} more
            ranked {remainingToNext === 1 ? 'game' : 'games'}.
          </>
        ) : null}
      </p>
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
