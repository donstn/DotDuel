import { DIFFICULTY_LABELS, SHAPE_LABEL } from '../types';
import type { Difficulty, GameMode, GameState, ShapeId } from '../types';

interface UnlockResult {
  shape: ShapeId | null;
  difficulty: Difficulty | null;
}

interface Props {
  state: GameState;
  mode: GameMode;
  shape: ShapeId;
  difficulty?: Difficulty;
  p1Name: string;
  p2Name: string;
  unlock: UnlockResult;
  onPlayAgain: () => void;
  onMenu: () => void;
  onStartShape: (shape: ShapeId, difficulty: Difficulty) => void;
}

const SHAPE_NEXT: Record<ShapeId, ShapeId | null> = {
  triangle: 'square',
  square: 'rectangle',
  rectangle: 'rhombus',
  rhombus: null,
};

function winText(name: string): string {
  // "You" is a pronoun ("You win"); everything else is a third-person noun ("Alice wins").
  if (name === 'You') return 'You win';
  return `${name} wins`;
}

export function GameOver({
  state,
  mode,
  shape,
  difficulty,
  p1Name,
  p2Name,
  unlock,
  onPlayAgain,
  onMenu,
  onStartShape,
}: Props) {
  const humanWon = mode === 'ai' && state.winner === 1;
  const beatImpossible = humanWon && difficulty === 5;
  const isFinalShape = shape === 'rhombus';
  const nextShape = SHAPE_NEXT[shape];

  let title = 'Draw';
  if (state.winner === 1) title = winText(p1Name);
  else if (state.winner === 2) title = winText(p2Name);

  let titleClass = '';
  if (humanWon && beatImpossible && isFinalShape) {
    title = 'DotDuel champion';
    titleClass = 'go-title-champion';
  } else if (beatImpossible) {
    title = 'Impossible — defeated';
    titleClass = 'go-title-impossible';
  }

  const suggestion = buildSuggestion({
    state,
    mode,
    shape,
    difficulty,
    unlock,
    humanWon,
    beatImpossible,
    isFinalShape,
    nextShape,
    onStartShape,
  });

  return (
    <div className="game-over">
      <div className="game-over-card">
        <h2 className={titleClass}>{title}</h2>
        <div className="final-scores">
          <div className="final-score final-p1">
            <span>{p1Name}</span>
            <strong>{state.scores[1]}</strong>
          </div>
          <div className="final-score final-p2">
            <span>{p2Name}</span>
            <strong>{state.scores[2]}</strong>
          </div>
        </div>
        {suggestion}
        <div className="game-over-buttons">
          <button className="primary" onClick={onPlayAgain}>Play again</button>
          <button onClick={onMenu}>Menu</button>
        </div>
      </div>
    </div>
  );
}

function buildSuggestion({
  mode,
  shape,
  difficulty,
  unlock,
  humanWon,
  beatImpossible,
  isFinalShape,
  nextShape,
  onStartShape,
}: {
  state: GameState;
  mode: GameMode;
  shape: ShapeId;
  difficulty?: Difficulty;
  unlock: UnlockResult;
  humanWon: boolean;
  beatImpossible: boolean;
  isFinalShape: boolean;
  nextShape: ShapeId | null;
  onStartShape: (shape: ShapeId, difficulty: Difficulty) => void;
}) {
  if (mode !== 'ai') return null;
  if (!humanWon) return null;

  // D) Full completion — Rhombus on Impossible
  if (beatImpossible && isFinalShape) {
    return (
      <div className="go-suggestion go-suggestion-champion">
        <div className="go-suggestion-headline">
          You've completed DotDuel single player!
        </div>
        <p className="go-suggestion-body">
          You've conquered every shape on every level. The toughest challenge
          left is real humans.
        </p>
        <button className="go-cta go-cta-primary" disabled title="Coming soon">
          Multiplayer · coming soon
        </button>
      </div>
    );
  }

  // C) Beat Impossible on a non-final shape → suggest moving to next shape
  if (beatImpossible && nextShape) {
    return (
      <div className="go-suggestion go-suggestion-impossible">
        <div className="go-suggestion-headline">
          You took down the toughest AI on {SHAPE_LABEL[shape]}.
        </div>
        <p className="go-suggestion-body">
          {SHAPE_LABEL[nextShape]} is your next mountain. Start from Beginner
          and work your way back up.
        </p>
        <button
          className="go-cta go-cta-primary"
          onClick={() => onStartShape(nextShape, 1)}
        >
          Try {SHAPE_LABEL[nextShape]}
        </button>
      </div>
    );
  }

  // A) New shape unlocked
  if (unlock.shape) {
    const newShape = unlock.shape;
    const sameShapeLevel = unlock.difficulty;
    return (
      <div className="go-suggestion go-suggestion-shape">
        <div className="go-suggestion-headline">
          {SHAPE_LABEL[newShape]} is now unlocked!
        </div>
        <p className="go-suggestion-body">
          A fresh board with new strategy. Or stick with {SHAPE_LABEL[shape]}
          and step up the difficulty.
        </p>
        <button
          className="go-cta go-cta-primary"
          onClick={() => onStartShape(newShape, 1)}
        >
          Try {SHAPE_LABEL[newShape]}
        </button>
        {sameShapeLevel && (
          <button
            className="go-cta go-cta-secondary"
            onClick={() => onStartShape(shape, sameShapeLevel)}
          >
            Or push to {DIFFICULTY_LABELS[sameShapeLevel]} on {SHAPE_LABEL[shape]}
          </button>
        )}
      </div>
    );
  }

  // B) Next level unlocked on the same shape
  if (unlock.difficulty) {
    const next = unlock.difficulty;
    return (
      <div className="go-suggestion go-suggestion-level">
        <div className="go-suggestion-headline">
          {DIFFICULTY_LABELS[next]} unlocked.
        </div>
        <p className="go-suggestion-body">
          The AI just got smarter. Ready to face it?
        </p>
        <button
          className="go-cta go-cta-primary"
          onClick={() => onStartShape(shape, next)}
        >
          Try {DIFFICULTY_LABELS[next]}
        </button>
      </div>
    );
  }

  // Won against AI but nothing new unlocked (e.g., replaying a level already cleared)
  // Offer to step up if not at the top yet.
  if (difficulty && difficulty < 5) {
    const stepUp = (difficulty + 1) as Difficulty;
    return (
      <div className="go-suggestion go-suggestion-level">
        <div className="go-suggestion-headline">Nice one.</div>
        <p className="go-suggestion-body">
          Already cleared this. Want a tougher fight?
        </p>
        <button
          className="go-cta go-cta-primary"
          onClick={() => onStartShape(shape, stepUp)}
        >
          Try {DIFFICULTY_LABELS[stepUp]}
        </button>
      </div>
    );
  }

  return null;
}
