import { useState } from 'react';
import { TIME_CONTROLS } from '../cloud/matchmaking';
import type { TimeControl } from '../cloud/matchmaking';
import type { ShapeId } from '../types';
import { useT } from '../i18n';

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
const SHAPE_UNLOCKS: { games: number; id: ShapeId }[] = [
  { games: 0, id: 'triangle' },
  { games: 50, id: 'square' },
  { games: 100, id: 'rectangle' },
];

function shapesUnlockedSummary(games: number): {
  unlocked: ShapeId[];
  nextId: ShapeId | null;
  nextAt: number | null;
} {
  const unlocked: ShapeId[] = [];
  let nextId: ShapeId | null = null;
  let nextAt: number | null = null;
  for (const tier of SHAPE_UNLOCKS) {
    if (games >= tier.games) {
      unlocked.push(tier.id);
    } else if (nextId === null) {
      nextId = tier.id;
      nextAt = tier.games;
    }
  }
  return { unlocked, nextId, nextAt };
}

export function MultiplayerLobby({
  rating,
  rankedGamesPlayed,
  onBack,
  onFindMatch,
}: Props) {
  const t = useT();
  const [selected, setSelected] = useState<TimeControl>('3min');
  const shapes = shapesUnlockedSummary(rankedGamesPlayed);
  const remainingToNext =
    shapes.nextAt !== null ? shapes.nextAt - rankedGamesPlayed : null;

  return (
    <div className="menu">
      <button className="link-btn back-link" onClick={onBack}>
        {t.lobby.back}
      </button>
      <h2>{t.lobby.title}</h2>
      <p className="hint">{t.lobby.intro(rating)}</p>
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
              title={locked ? t.lobby.lockedTitle : ''}
            >
              <strong>{t.timeControls[tc.id].label}</strong>
              <span>{t.timeControls[tc.id].per}</span>
              <span className="menu-card-sub">
                {locked ? t.lobby.comingBackSoon : t.timeControls[tc.id].sub}
              </span>
            </button>
          );
        })}
      </div>
      <p className="hint mp-shape-hint">
        {t.lobby.board}{' '}
        <strong>
          {shapes.unlocked.map((id) => t.shapes[id]).join(' · ') || t.shapes.triangle}
        </strong>
        {shapes.nextId && remainingToNext !== null ? (
          <> {t.lobby.unlockHint(t.shapes[shapes.nextId], remainingToNext)}</>
        ) : null}
      </p>
      <button
        type="button"
        className="hotseat-start"
        onClick={() => onFindMatch(selected)}
      >
        {t.lobby.findMatch}
      </button>
    </div>
  );
}
