import { useState } from 'react';
import { DIFFICULTY_LABELS, SHAPE_LABEL } from '../types';
import type { Difficulty, GameMode, GameState, Player, ShapeId } from '../types';
import { WinCelebration } from './WinCelebration';

interface UnlockResult {
  shape: ShapeId | null;
  difficulty: Difficulty | null;
}

export type FinishedReason = 'normal' | 'timeout' | 'resign' | 'disconnect' | 'aborted';

interface RatingChange {
  before: number;
  after: number;
  delta: number;
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
  onLobby?: () => void;
  myPlayer?: Player;
  finishedReason?: FinishedReason;
  rematchLabel?: string;
  ratingChange?: RatingChange;
  /** Multiplayer rematch flags from both sides (true = wants rematch). */
  rematchMine?: boolean;
  rematchOpp?: boolean;
  /** Cancel my pending rematch request. */
  onCancelRematch?: () => void;
  /** When true, suppress the rematch button (bot opponents don't accept
   *  rematches — only humans do). Menu + Lobby still render. */
  opponentIsBot?: boolean;
  /** Opponent's uid; used by the Add-as-friend affordance. Undefined for bots. */
  opponentUid?: string;
  /** True when the opponent is already in my friend list. Hides the
   *  Add-as-friend button when true. */
  opponentIsFriend?: boolean;
  /** Sends a friend request to the opponent. Undefined to suppress the
   *  button entirely (e.g., in vs-AI mode or when caller isn't signed in). */
  onAddOpponentAsFriend?: () => Promise<void>;
  /** Phase 2b-v2 — daily-puzzle finalize result. When present + mode='daily',
   *  renders the daily variant: margin, best, streak, attempts-remaining,
   *  Try-again / View-leaderboard CTAs. */
  dailyResult?: {
    margin: number;
    best: number;
    attempts: number;
    attemptsRemaining: number;
    current: number;
    longest: number;
  } | null;
  /** Phase 2b-v2 — start another daily-puzzle attempt (only when attempts
   *  remain). Tied to startDailyPuzzle in App.tsx. */
  onTryDailyAgain?: () => void;
  /** Phase 2b-v2 — open the public puzzle leaderboard from GameOver. */
  onOpenPuzzleLeaderboard?: () => void;
}

const SHAPE_NEXT: Record<ShapeId, ShapeId | null> = {
  triangle: 'square',
  square: 'rectangle',
  rectangle: null,
  rhombus: null,
};

function RematchButton({
  mine,
  opp,
  label,
  onRequest,
  onCancel,
}: {
  mine: boolean;
  opp: boolean;
  label: string;
  onRequest: () => void;
  onCancel?: () => void;
}) {
  // Opponent already wants a rematch — show big "Accept" affordance.
  if (opp && !mine) {
    return (
      <button
        className="primary rematch-accept"
        onClick={onRequest}
        title="Your opponent wants a rematch"
      >
        Accept rematch
      </button>
    );
  }
  // I've already asked — show waiting state with a Cancel link.
  if (mine && !opp) {
    return (
      <span className="rematch-waiting">
        <button disabled className="rematch-waiting-btn">
          Waiting for opponent…
        </button>
        {onCancel && (
          <button
            type="button"
            className="rematch-cancel-link"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </span>
    );
  }
  // Default — neither side has requested yet.
  return (
    <button className="primary" onClick={onRequest}>
      {label}
    </button>
  );
}

function winText(name: string): string {
  // "You" is a pronoun ("You win"); everything else is a third-person noun ("Alice wins").
  if (name === 'You') return 'You win';
  return `${name} wins`;
}

function multiplayerOutcome(
  me: Player,
  winner: GameState['winner'],
  reason: FinishedReason | undefined,
): { title: string; subtitle: string | null } {
  if (reason === 'aborted') {
    return { title: 'Game aborted', subtitle: 'no first move · no rating change' };
  }
  if (winner === 'draw' || winner == null) {
    return { title: 'Game ended in a draw', subtitle: null };
  }
  if (winner === me) {
    // Tell the winner HOW they won — symmetric to the loss messaging.
    let subtitle = 'on points';
    if (reason === 'timeout') subtitle = 'on time';
    else if (reason === 'resign') subtitle = 'opponent resigned';
    else if (reason === 'disconnect') subtitle = 'opponent disconnected';
    return { title: 'You win', subtitle };
  }
  let subtitle = 'on points';
  if (reason === 'timeout') subtitle = 'on time';
  else if (reason === 'resign') subtitle = 'you resigned';
  else if (reason === 'disconnect') subtitle = 'disconnected';
  return { title: 'You lost', subtitle };
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
  onLobby,
  myPlayer,
  finishedReason,
  rematchLabel,
  ratingChange,
  rematchMine,
  rematchOpp,
  onCancelRematch,
  opponentIsBot,
  opponentUid,
  opponentIsFriend,
  onAddOpponentAsFriend,
  dailyResult,
  onTryDailyAgain,
  onOpenPuzzleLeaderboard,
}: Props) {
  const [addFriendState, setAddFriendState] = useState<
    'idle' | 'sending' | 'sent' | 'failed'
  >('idle');
  const canAddFriend =
    mode === 'multiplayer' &&
    !opponentIsBot &&
    !opponentIsFriend &&
    !!opponentUid &&
    !!onAddOpponentAsFriend;
  const onAddFriendClick = async () => {
    if (!onAddOpponentAsFriend) return;
    setAddFriendState('sending');
    try {
      await onAddOpponentAsFriend();
      setAddFriendState('sent');
    } catch {
      setAddFriendState('failed');
    }
  };
  const humanWon = mode === 'ai' && state.winner === 1;
  const beatImpossible = humanWon && difficulty === 5;
  const isFinalShape = SHAPE_NEXT[shape] === null;
  const nextShape = SHAPE_NEXT[shape];

  // Win celebration: standard green show on any local win; the full gold show
  // when the Impossible AI is defeated. No celebration on a loss/draw/abort.
  const localWin =
    (mode === 'ai' && state.winner === 1) ||
    (mode === 'hotseat' && (state.winner === 1 || state.winner === 2)) ||
    (mode === 'daily' && state.winner === 1) ||
    (mode === 'multiplayer' &&
      myPlayer !== undefined &&
      state.winner === myPlayer &&
      finishedReason !== 'aborted');
  // Celebration scales with difficulty: a vs-AI win passes the level you beat
  // (1-5; L5 = the gold Impossible show). Hot-seat / multiplayer / daily wins
  // get a solid mid-level (3) celebration.
  const celebrationLevel: number | null = !localWin
    ? null
    : mode === 'ai'
      ? difficulty ?? 1
      : 3;

  let title = 'Draw';
  let subtitle: string | null = null;
  if (myPlayer !== undefined && mode === 'multiplayer') {
    const m = multiplayerOutcome(myPlayer, state.winner, finishedReason);
    title = m.title;
    subtitle = m.subtitle;
  } else if (state.winner === 1) {
    title = winText(p1Name);
  } else if (state.winner === 2) {
    title = winText(p2Name);
  }

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
      {celebrationLevel !== null && <WinCelebration level={celebrationLevel} />}
      <div className="game-over-card">
        <h2 className={titleClass}>{title}</h2>
        {subtitle && <p className="go-subtitle">{subtitle}</p>}
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
        {ratingChange && (
          <div className="go-rating-change">
            <span className="go-rating-label">Rating</span>
            <span className="go-rating-before">{ratingChange.before}</span>
            <span className="go-rating-arrow" aria-hidden="true">→</span>
            <span className="go-rating-after">{ratingChange.after}</span>
            <span
              className={`go-rating-delta go-rating-delta-${
                ratingChange.delta > 0
                  ? 'pos'
                  : ratingChange.delta < 0
                    ? 'neg'
                    : 'flat'
              }`}
            >
              {ratingChange.delta > 0 ? '+' : ''}
              {ratingChange.delta}
            </span>
          </div>
        )}
        {suggestion}
        {mode === 'daily' && (
          <div className="go-daily-result">
            {dailyResult ? (
              <>
                <div className="go-daily-margin">
                  This run:{' '}
                  <strong>
                    {dailyResult.margin > 0 ? '+' : ''}
                    {dailyResult.margin}
                  </strong>
                </div>
                <div className="go-daily-best">
                  Best today:{' '}
                  <strong>
                    {dailyResult.best > 0 ? '+' : ''}
                    {dailyResult.best}
                  </strong>
                  <span className="go-daily-attempts">
                    {' '}
                    · attempt {dailyResult.attempts}/3
                  </span>
                </div>
                {dailyResult.current > 0 && (
                  <div className="go-daily-streak">
                    Streak: <strong>Day {dailyResult.current}</strong>
                    {dailyResult.longest > dailyResult.current && (
                      <span className="go-daily-longest">
                        {' '}
                        (best: Day {dailyResult.longest})
                      </span>
                    )}
                  </div>
                )}
                {dailyResult.attemptsRemaining > 0 ? (
                  <p className="settings-hint">
                    {dailyResult.attemptsRemaining} attempt
                    {dailyResult.attemptsRemaining === 1 ? '' : 's'} left today.
                    Your best counts on the leaderboard.
                  </p>
                ) : (
                  <p className="settings-hint">
                    All 3 attempts used. Come back tomorrow at midnight UTC.
                  </p>
                )}
              </>
            ) : (
              <p className="settings-hint">Saving result…</p>
            )}
          </div>
        )}
        {mode === 'multiplayer' && onLobby ? (
          <>
            <div className="game-over-buttons">
              <button onClick={onMenu}>Menu</button>
              {!opponentIsBot && (
                <RematchButton
                  mine={!!rematchMine}
                  opp={!!rematchOpp}
                  label={rematchLabel ?? 'Rematch'}
                  onRequest={onPlayAgain}
                  onCancel={onCancelRematch}
                />
              )}
              <button onClick={onLobby}>Lobby</button>
            </div>
            {canAddFriend && (
              <div className="go-add-friend-row">
                {addFriendState === 'idle' && (
                  <button
                    type="button"
                    className="go-add-friend-btn"
                    onClick={onAddFriendClick}
                  >
                    ➕ Add {p2Name === 'You' ? p1Name : p2Name} as friend
                  </button>
                )}
                {addFriendState === 'sending' && (
                  <span className="go-add-friend-note">Sending request…</span>
                )}
                {addFriendState === 'sent' && (
                  <span className="go-add-friend-note">Friend request sent.</span>
                )}
                {addFriendState === 'failed' && (
                  <button
                    type="button"
                    className="go-add-friend-btn"
                    onClick={onAddFriendClick}
                  >
                    Couldn't send — try again
                  </button>
                )}
              </div>
            )}
          </>
        ) : mode === 'daily' ? (
          <div className="game-over-buttons">
            {dailyResult && dailyResult.attemptsRemaining > 0 && onTryDailyAgain && (
              <button className="primary" onClick={onTryDailyAgain}>
                Try again ({dailyResult.attemptsRemaining} left)
              </button>
            )}
            {onOpenPuzzleLeaderboard && (
              <button onClick={onOpenPuzzleLeaderboard}>Leaderboard</button>
            )}
            <button onClick={onMenu}>Menu</button>
          </div>
        ) : (
          <div className="game-over-buttons">
            <button className="primary" onClick={onPlayAgain}>Play again</button>
            <button onClick={onMenu}>Menu</button>
          </div>
        )}
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
