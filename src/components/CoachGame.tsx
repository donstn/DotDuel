import { useEffect, useRef, useState } from 'react';
import { applyClaim, applyMove } from '../game';
import { getBoard } from '../geometry';
import { useT } from '../i18n';
import {
  COACH_CORNER_DOT,
  COACH_DOUBLE_DOT,
  COACH_DOUBLE_LINES,
  COACH_FINISH_DOT,
  COACH_FINISH_LINE,
  claimTarget,
  coachBotAction,
  coachOpening,
  emptyDots,
  gainAt,
  lineDots,
  linesFinishedBy,
  scoringDots,
} from '../onboarding/coach';
import { trackEvent } from '../telemetry';
import type { ThemeId } from '../theme';
import type { GameState, Player } from '../types';
import { Board, type CoachMarks } from './Board';
import { ScoreStrip } from './ScoreStrip';
import { SidePanel } from './SidePanel';

// First-game tutorial: a real Triangle game, already under way, against the
// Coach. Guided turns — tap a corner → finish a line → finish two lines at
// once (only the longest scores) → claim the waiting one → find a line on
// your own — then the player plays it out with hints only when stuck.

type Stage = 'corner' | 'finish' | 'double' | 'claim' | 'find' | 'free';
type BotStyle = 'quiet' | 'greedy' | 'easy';

// Long enough to read the "+N" line before the Coach answers.
const BOT_DELAY_MS = 1100;
// After "two lines at once" there is more to read.
const BOT_DELAY_DOUBLE_MS = 2400;
const BOT_DELAY_FREE_MS = 650;
const IDLE_HINT_MS = 6000;
const END_CARD_DELAY_MS = 900;

interface Props {
  theme: ThemeId;
  phoneLayout: boolean;
  playerName: string;
  /** Called once the lesson has taught waiting lines (the in-game tip is then redundant). */
  onPendingTipSeen: () => void;
  /** Started again from the menu / How to play (kept apart in analytics). */
  replay: boolean;
  onFinished: () => void;
  onSkip: () => void;
  onDone: (next: 'bot' | 'menu') => void;
}

export function CoachGame({
  theme,
  phoneLayout,
  playerName,
  onPendingTipSeen,
  replay,
  onFinished,
  onSkip,
  onDone,
}: Props) {
  const t = useT();
  const [state, setState] = useState<GameState>(coachOpening);
  const [stage, setStage] = useState<Stage>('corner');
  const [misses, setMisses] = useState(0);
  const [msg, setMsg] = useState<string>(t.coach.corner);
  const [lastDot, setLastDot] = useState<number | null>(null);
  const [scoreEvent, setScoreEvent] = useState<{
    dotId: number;
    points: number;
    player: Player;
    seq: number;
  } | null>(null);
  const [idle, setIdle] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const botStyle = useRef<BotStyle>('quiet');
  const nextStage = useRef<Stage>('finish');
  const freeMoves = useRef(0);

  useEffect(() => {
    trackEvent('tutorial_start', { replay: replay ? 1 : 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPoints = getBoard('triangle').lines.reduce((s, l) => s + l.length, 0);
  const remaining = totalPoints - state.scores[1] - state.scores[2];
  const myTurn = state.current === 1 && !state.finished;
  // The Coach's turn right after "two lines at once": the waiting line stays marked.
  const showWaiting = stage === 'claim' || (stage === 'double' && state.pending.length > 0);
  // Endgame: no empty dots, only waiting lines left to claim.
  const claimOnly = stage === 'free' && myTurn && emptyDots(state).length === 0 && state.pending.length > 0;

  // What the player's move means for the script: message, Coach style, next step.
  const afterPlayer = (points: number) => {
    setMisses(0);
    setIdle(false);
    if (stage === 'corner') {
      setMsg(t.coach.cornerDone);
      botStyle.current = 'quiet';
      nextStage.current = 'finish';
    } else if (stage === 'finish') {
      setMsg(t.coach.finishDone);
      botStyle.current = 'quiet';
      nextStage.current = 'double';
    } else if (stage === 'double') {
      setMsg(t.coach.doubleDone(points));
      botStyle.current = 'quiet';
      nextStage.current = 'claim';
    } else if (stage === 'claim') {
      setMsg(t.coach.claimDone(points));
      onPendingTipSeen();
      botStyle.current = 'quiet';
      nextStage.current = 'find';
    } else if (stage === 'find') {
      setMsg(t.coach.findDone(points));
      botStyle.current = 'greedy';
      nextStage.current = 'free';
    } else {
      freeMoves.current += 1;
      setMsg(freeMoves.current === 1 ? t.coach.free : '');
      botStyle.current = 'easy';
    }
    if (stage !== 'free') trackEvent('tutorial_step', { step: stage, replay: replay ? 1 : 0 });
  };

  const claimFloat = (lineId: string, points: number, player: Player) => {
    const line = getBoard('triangle').lines.find((l) => l.id === lineId);
    if (!line) return;
    const mid = line.dotIds[Math.floor(line.dotIds.length / 2)];
    setScoreEvent({ dotId: mid, points, player, seq: Date.now() });
  };

  const onDot = (dotId: number) => {
    if (!myTurn) return;
    const r = applyMove(state, dotId);
    if (r.pointsGained > 0 || r.newlyPending.length > 0) {
      setScoreEvent({ dotId, points: r.pointsGained, player: 1, seq: Date.now() });
    }
    setLastDot(dotId);
    setState(r.state);
    afterPlayer(r.pointsGained);
  };

  const onClaim = (lineId: string) => {
    if (!myTurn) return;
    const r = applyClaim(state, lineId);
    claimFloat(lineId, r.pointsGained, 1);
    setState(r.state);
    afterPlayer(r.pointsGained);
  };

  // The Coach's turn.
  useEffect(() => {
    if (state.finished || state.current !== 2) return;
    const style = botStyle.current;
    const delay =
      nextStage.current === 'claim'
        ? BOT_DELAY_DOUBLE_MS
        : style === 'easy'
          ? BOT_DELAY_FREE_MS
          : BOT_DELAY_MS;
    const id = window.setTimeout(() => {
      const action = coachBotAction(state, style);
      let gained = 0;
      if (action.kind === 'dot') {
        const r = applyMove(state, action.dotId);
        gained = r.pointsGained;
        if (gained > 0 || r.newlyPending.length > 0) {
          setScoreEvent({ dotId: action.dotId, points: gained, player: 2, seq: Date.now() });
        }
        setLastDot(action.dotId);
        setState(r.state);
      } else {
        const r = applyClaim(state, action.lineId);
        gained = r.pointsGained;
        claimFloat(action.lineId, gained, 2);
        setState(r.state);
      }
      const ns = nextStage.current;
      if (style === 'quiet') {
        setMsg(
          ns === 'finish'
            ? t.coach.finish
            : ns === 'double'
              ? t.coach.double
              : ns === 'claim'
                ? t.coach.claim
                : t.coach.find,
        );
      } else if (style === 'greedy') {
        setMsg(gained > 0 ? t.coach.botTook(gained) : t.coach.free);
      }
      setStage(ns);
    }, delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Stuck in free play: after a while, show the best open line.
  useEffect(() => {
    if (stage !== 'free' || !myTurn || idle || claimOnly) return;
    const canScore = scoringDots(state).length > 0;
    if (!canScore && state.pending.length === 0) return;
    const id = window.setTimeout(() => {
      setIdle(true);
      setMsg(canScore ? t.coach.idleHint : t.coach.claimHint);
    }, IDLE_HINT_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, stage, idle]);

  useEffect(() => {
    if (!state.finished) return;
    onFinished();
    trackEvent('tutorial_complete', {
      result: state.winner === 1 ? 'win' : state.winner === 2 ? 'loss' : 'draw',
      replay: replay ? 1 : 0,
    });
    const id = window.setTimeout(() => setEndOpen(true), END_CARD_DELAY_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.finished, state.winner]);

  const marks: CoachMarks = {};
  if (showWaiting) {
    marks.waiting = state.pending;
    // Right after the double, keep the line that scored lit too.
    marks.spotlight =
      stage === 'double' ? COACH_DOUBLE_LINES.flatMap(lineDots) : state.pending.flatMap(lineDots);
  }
  if (myTurn) {
    if (stage === 'corner') {
      marks.spotlight = [COACH_CORNER_DOT];
      marks.rings = [COACH_CORNER_DOT];
      marks.pointer = COACH_CORNER_DOT;
      marks.canPlace = (id) => id === COACH_CORNER_DOT;
      marks.onRefused = () => setMsg(t.coach.corner);
    } else if (stage === 'finish') {
      marks.spotlight = lineDots(COACH_FINISH_LINE);
      marks.bands = [COACH_FINISH_LINE];
      marks.gap = COACH_FINISH_DOT;
      marks.label = { dot: COACH_FINISH_DOT, text: `+${gainAt(state, COACH_FINISH_DOT)}` };
      marks.pointer = COACH_FINISH_DOT;
      marks.canPlace = (id) => id === COACH_FINISH_DOT;
      marks.onRefused = () => setMsg(t.coach.finishMiss);
    } else if (stage === 'double') {
      marks.spotlight = COACH_DOUBLE_LINES.flatMap(lineDots);
      marks.bands = COACH_DOUBLE_LINES;
      marks.gap = COACH_DOUBLE_DOT;
      marks.pointer = COACH_DOUBLE_DOT;
      marks.canPlace = (id) => id === COACH_DOUBLE_DOT;
      marks.onRefused = () => setMsg(t.coach.double);
    } else if (stage === 'claim') {
      // Point at the waiting line's dot farthest from where the two lines met.
      const dots = state.pending.flatMap(lineDots).filter((id) => id !== COACH_DOUBLE_DOT);
      marks.pointer = dots[0] ?? null;
      marks.canPlace = () => false;
      marks.onRefused = () => setMsg(t.coach.claim);
    } else if (stage === 'find') {
      const open = scoringDots(state);
      if (misses >= 2) marks.spotlight = linesFinishedBy(state, open.slice(0, 2));
      if (misses >= 3) marks.pointer = open[0];
      marks.canPlace = (id) => gainAt(state, id) > 0;
      marks.onRefused = () => {
        setMisses((m) => m + 1);
        setMsg(misses + 1 >= 2 ? t.coach.findHelp : t.coach.findMiss);
      };
    } else if (claimOnly || (idle && scoringDots(state).length === 0)) {
      const target = claimTarget(state);
      if (target) {
        marks.waiting = state.pending;
        marks.spotlight = lineDots(target.lineId);
        marks.pointer = target.dot;
      }
    } else if (idle) {
      marks.spotlight = linesFinishedBy(state, scoringDots(state).slice(0, 1));
      marks.rings = marks.spotlight;
    }
  }

  const shownMsg = claimOnly ? t.coach.claimEnd : msg;
  const won = state.winner === 1;
  const p1 = { name: playerName, score: state.scores[1], avatar: 'human' as const };
  const p2 = {
    name: t.coach.name,
    score: state.scores[2],
    avatar: { kind: 'ai' as const, level: 1 as const },
    thinking: !state.finished && state.current === 2,
  };

  const bubble = (
    <div className="coach-slot">
      {shownMsg && (
        <div className="coach-bubble" role="status" aria-live="polite">
          <span className="coach-bubble-name">{t.coach.name}</span>
          <span className="coach-bubble-text">{shownMsg}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="game-screen coach-screen">
      <div className="game-topbar">
        <button className="btn-back" onClick={onSkip} aria-label={t.coach.skip}>
          ‹
        </button>
        <div className="topbar-center">
          <div className="remaining-points">
            <span className="remaining-value">{remaining}</span>
            <span className="remaining-label">{t.game.ptsLeft}</span>
          </div>
          <div
            className={`pending-indicator${state.pending.length === 0 ? ' pending-indicator-hidden' : ''}`}
            aria-hidden={state.pending.length === 0}
          >
            <span className="pending-icon" aria-hidden="true">◌</span>
            <span className="pending-value">{Math.max(state.pending.length, 1)}</span>
            <span className="pending-label">{t.game.linesToClaim(state.pending.length)}</span>
          </div>
        </div>
        <button type="button" className="btn-coach-skip" onClick={onSkip}>
          {t.coach.skip}
        </button>
      </div>
      <div className="game-body">
        {phoneLayout && (
          <ScoreStrip current={state.finished ? null : state.current} theme={theme} p1={p1} p2={p2} />
        )}
        {!phoneLayout && (
          <SidePanel
            side="left"
            player={1}
            active={!state.finished && state.current === 1}
            name={p1.name}
            score={p1.score}
            avatar={p1.avatar}
            theme={theme}
          />
        )}
        <Board
          state={state}
          onDotClick={onDot}
          onClaimClick={stage === 'claim' || stage === 'free' ? onClaim : undefined}
          disabled={!myTurn}
          lastDot={lastDot}
          theme={theme}
          showHints={(stage === 'claim' || stage === 'free') && myTurn}
          scoreEvent={scoreEvent}
          coach={marks}
        />
        {!phoneLayout && (
          <SidePanel
            side="right"
            player={2}
            active={!state.finished && state.current === 2}
            thinking={p2.thinking}
            name={p2.name}
            score={p2.score}
            avatar={p2.avatar}
            theme={theme}
            stats={null}
          />
        )}
        {phoneLayout && bubble}
      </div>
      {!phoneLayout && bubble}
      {endOpen && (
        <div className="confirm-overlay coach-end-overlay" role="dialog" aria-modal="true">
          <div className="confirm-card coach-end-card">
            <h3>{won ? t.coach.wonTitle : t.coach.endTitle}</h3>
            <p className="coach-end-score">
              {state.scores[1]} – {state.scores[2]}
            </p>
            <p>{t.coach.endBody}</p>
            <button type="button" className="hotseat-start" onClick={() => onDone('bot')}>
              {t.coach.playBot}
            </button>
            <button type="button" className="link-btn coach-end-menu" onClick={() => onDone('menu')}>
              {t.coach.menu}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
