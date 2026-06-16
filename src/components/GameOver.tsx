import { useState } from 'react';
import type { Difficulty, GameMode, GameState, Player, ShapeId } from '../types';
import type { ShareResultData } from '../share/resultShareText';
import { GameResultShareButton } from './GameResultShareButton';
import { WinCelebration } from './WinCelebration';
import { useT, type Messages } from '../i18n';

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
  /** Daily-puzzle finalize result. When present + mode='daily', renders the
   *  daily variant: P1 score, best, streak, attempts-remaining, Try-again /
   *  View-leaderboard CTAs. */
  dailyResult?: {
    score: number;
    best: number;
    attempts: number;
    attemptsRemaining: number;
    current: number;
    longest: number;
  } | null;
  /** Daily revamp — true when the attempt ended because the 3-minute clock ran
   *  out (vs. the board finishing naturally). */
  dailyTimedOut?: boolean;
  /** Start another daily-puzzle attempt (only when attempts remain). Tied to
   *  startDailyPuzzle in App.tsx. */
  onTryDailyAgain?: () => void;
  /** Phase 2b-v2 — open the public puzzle leaderboard from GameOver. */
  onOpenPuzzleLeaderboard?: () => void;
  /** Signed-in player's referral code — the share-result link carries
   *  ?ref=<CODE> (random 6-char, never the account id). Null/undefined
   *  produces a clean URL (anonymous share). */
  refCode?: string | null;
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
  const t = useT();
  // Opponent already wants a rematch — show big "Accept" affordance.
  if (opp && !mine) {
    return (
      <button
        className="primary rematch-accept"
        onClick={onRequest}
        title={t.gameOver.oppWantsRematchTitle}
      >
        {t.gameOver.acceptRematch}
      </button>
    );
  }
  // I've already asked — show waiting state with a Cancel link.
  if (mine && !opp) {
    return (
      <span className="rematch-waiting">
        <button disabled className="rematch-waiting-btn">
          {t.gameOver.waitingForOpponent}
        </button>
        {onCancel && (
          <button
            type="button"
            className="rematch-cancel-link"
            onClick={onCancel}
          >
            {t.gameOver.cancel}
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

function winText(name: string, t: Messages): string {
  // "You" is a pronoun ("You win"); everything else is a third-person noun ("Alice wins").
  if (name === t.common.you) return t.gameOver.youWin;
  return t.gameOver.playerWins(name);
}

function multiplayerOutcome(
  me: Player,
  winner: GameState['winner'],
  reason: FinishedReason | undefined,
  t: Messages,
): { title: string; subtitle: string | null } {
  if (reason === 'aborted') {
    return { title: t.gameOver.aborted, subtitle: t.gameOver.abortedSub };
  }
  if (winner === 'draw' || winner == null) {
    return { title: t.gameOver.draw, subtitle: null };
  }
  if (winner === me) {
    // Tell the winner HOW they won — symmetric to the loss messaging.
    let subtitle = t.gameOver.onPoints;
    if (reason === 'timeout') subtitle = t.gameOver.onTime;
    else if (reason === 'resign') subtitle = t.gameOver.oppResigned;
    else if (reason === 'disconnect') subtitle = t.gameOver.oppDisconnected;
    return { title: t.gameOver.youWin, subtitle };
  }
  let subtitle = t.gameOver.onPoints;
  if (reason === 'timeout') subtitle = t.gameOver.onTime;
  else if (reason === 'resign') subtitle = t.gameOver.youResigned;
  else if (reason === 'disconnect') subtitle = t.gameOver.disconnected;
  return { title: t.gameOver.youLost, subtitle };
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
  dailyTimedOut,
  onTryDailyAgain,
  onOpenPuzzleLeaderboard,
  refCode,
}: Props) {
  const t = useT();
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

  let title = t.gameOver.drawTitle;
  let subtitle: string | null = null;
  if (myPlayer !== undefined && mode === 'multiplayer') {
    const m = multiplayerOutcome(myPlayer, state.winner, finishedReason, t);
    title = m.title;
    subtitle = m.subtitle;
  } else if (state.winner === 1) {
    title = winText(p1Name, t);
  } else if (state.winner === 2) {
    title = winText(p2Name, t);
  }

  let titleClass = '';
  if (humanWon && beatImpossible && isFinalShape) {
    title = t.gameOver.champion;
    titleClass = 'go-title-champion';
  } else if (beatImpossible) {
    title = t.gameOver.impossibleDefeated;
    titleClass = 'go-title-impossible';
  }

  // Share-a-result (strategic plan Phase 3): available on every mode and
  // outcome except aborted matches and daily attempts still being saved.
  const shareData: ShareResultData | null =
    finishedReason !== 'aborted' && (mode !== 'daily' || !!dailyResult)
      ? {
          mode,
          shape,
          difficulty,
          scores: state.scores,
          winner: state.winner,
          myPlayer,
          p1Name,
          p2Name,
          ratingDelta: ratingChange?.delta,
          dailyScore: dailyResult?.score,
          refCode,
        }
      : null;

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
    t,
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
            <span className="go-rating-label">{t.gameOver.rating}</span>
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
                {dailyTimedOut && (
                  <div className="go-daily-timeout">{t.gameOver.timesUp}</div>
                )}
                <div className="go-daily-margin">
                  {t.gameOver.yourScore} <strong>{dailyResult.score}</strong>
                </div>
                <div className="go-daily-best">
                  {t.gameOver.bestToday} <strong>{dailyResult.best}</strong>
                  <span className="go-daily-attempts">
                    {t.gameOver.attemptOf(dailyResult.attempts)}
                  </span>
                </div>
                {dailyResult.current > 0 && (
                  <div className="go-daily-streak">
                    {t.gameOver.streakLabel} <strong>{t.gameOver.dayN(dailyResult.current)}</strong>
                    {dailyResult.longest > dailyResult.current && (
                      <span className="go-daily-longest">
                        {' '}
                        {t.gameOver.bestDay(dailyResult.longest)}
                      </span>
                    )}
                  </div>
                )}
                {dailyResult.attemptsRemaining > 0 ? (
                  <p className="settings-hint">
                    {t.gameOver.attemptsLeft(dailyResult.attemptsRemaining)}
                  </p>
                ) : (
                  <p className="settings-hint">{t.gameOver.allAttemptsUsed}</p>
                )}
              </>
            ) : (
              <p className="settings-hint">{t.gameOver.savingResult}</p>
            )}
          </div>
        )}
        {mode === 'multiplayer' && onLobby ? (
          <>
            <div className="game-over-buttons">
              <button onClick={onMenu}>{t.gameOver.menu}</button>
              {!opponentIsBot && (
                <RematchButton
                  mine={!!rematchMine}
                  opp={!!rematchOpp}
                  label={rematchLabel ?? t.gameOver.rematch}
                  onRequest={onPlayAgain}
                  onCancel={onCancelRematch}
                />
              )}
              <button onClick={onLobby}>{t.gameOver.lobby}</button>
            </div>
            {canAddFriend && (
              <div className="go-add-friend-row">
                {addFriendState === 'idle' && (
                  <button
                    type="button"
                    className="go-add-friend-btn"
                    onClick={onAddFriendClick}
                  >
                    {t.gameOver.addAsFriend(p2Name === t.common.you ? p1Name : p2Name)}
                  </button>
                )}
                {addFriendState === 'sending' && (
                  <span className="go-add-friend-note">{t.gameOver.sendingRequest}</span>
                )}
                {addFriendState === 'sent' && (
                  <span className="go-add-friend-note">{t.gameOver.friendRequestSent}</span>
                )}
                {addFriendState === 'failed' && (
                  <button
                    type="button"
                    className="go-add-friend-btn"
                    onClick={onAddFriendClick}
                  >
                    {t.gameOver.couldntSend}
                  </button>
                )}
              </div>
            )}
          </>
        ) : mode === 'daily' ? (
          <div className="game-over-buttons">
            {dailyResult && dailyResult.attemptsRemaining > 0 && onTryDailyAgain && (
              <button className="primary" onClick={onTryDailyAgain}>
                {t.gameOver.tryAgainN(dailyResult.attemptsRemaining)}
              </button>
            )}
            {onOpenPuzzleLeaderboard && (
              <button onClick={onOpenPuzzleLeaderboard}>{t.gameOver.leaderboard}</button>
            )}
            <button onClick={onMenu}>{t.gameOver.menu}</button>
          </div>
        ) : (
          <div className="game-over-buttons">
            <button className="primary" onClick={onPlayAgain}>{t.gameOver.playAgain}</button>
            <button onClick={onMenu}>{t.gameOver.menu}</button>
          </div>
        )}
        {shareData && <GameResultShareButton data={shareData} state={state} />}
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
  t,
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
  t: Messages;
}) {
  if (mode !== 'ai') return null;
  if (!humanWon) return null;

  // D) Full completion — Rhombus on Impossible
  if (beatImpossible && isFinalShape) {
    return (
      <div className="go-suggestion go-suggestion-champion">
        <div className="go-suggestion-headline">{t.gameOver.champHeadline}</div>
        <p className="go-suggestion-body">{t.gameOver.champBody}</p>
        <button className="go-cta go-cta-primary" disabled title={t.gameOver.comingSoonTitle}>
          {t.gameOver.multiplayerComingSoon}
        </button>
      </div>
    );
  }

  // C) Beat Impossible on a non-final shape → suggest moving to next shape
  if (beatImpossible && nextShape) {
    return (
      <div className="go-suggestion go-suggestion-impossible">
        <div className="go-suggestion-headline">
          {t.gameOver.impossibleHeadline(t.shapes[shape])}
        </div>
        <p className="go-suggestion-body">
          {t.gameOver.impossibleBody(t.shapes[nextShape], t.difficulty[1])}
        </p>
        <button
          className="go-cta go-cta-primary"
          onClick={() => onStartShape(nextShape, 1)}
        >
          {t.gameOver.tryShape(t.shapes[nextShape])}
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
          {t.gameOver.shapeUnlockedHeadline(t.shapes[newShape])}
        </div>
        <p className="go-suggestion-body">
          {t.gameOver.shapeUnlockedBody(t.shapes[shape])}
        </p>
        <button
          className="go-cta go-cta-primary"
          onClick={() => onStartShape(newShape, 1)}
        >
          {t.gameOver.tryShape(t.shapes[newShape])}
        </button>
        {sameShapeLevel && (
          <button
            className="go-cta go-cta-secondary"
            onClick={() => onStartShape(shape, sameShapeLevel)}
          >
            {t.gameOver.pushTo(t.difficulty[sameShapeLevel], t.shapes[shape])}
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
          {t.gameOver.levelUnlockedHeadline(t.difficulty[next])}
        </div>
        <p className="go-suggestion-body">{t.gameOver.levelUnlockedBody}</p>
        <button
          className="go-cta go-cta-primary"
          onClick={() => onStartShape(shape, next)}
        >
          {t.gameOver.tryLevel(t.difficulty[next])}
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
        <div className="go-suggestion-headline">{t.gameOver.niceOne}</div>
        <p className="go-suggestion-body">{t.gameOver.niceOneBody}</p>
        <button
          className="go-cta go-cta-primary"
          onClick={() => onStartShape(shape, stepUp)}
        >
          {t.gameOver.tryLevel(t.difficulty[stepUp])}
        </button>
      </div>
    );
  }

  return null;
}
