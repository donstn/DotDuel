import { useEffect, useMemo, useRef, useState } from 'react';
import { AdBanner } from './components/AdBanner';
import { AppFooter } from './components/AppFooter';
import { Board } from './components/Board';
import { ChangelogPopover } from './components/ChangelogPopover';
import { ConsentBanner } from './components/ConsentBanner';
import { GameOver } from './components/GameOver';
import { Menu } from './components/Menu';
import { PrivacyPopover } from './components/PrivacyPopover';
import { ProfilePopover } from './components/ProfilePopover';
import { RankingsPopover } from './components/RankingsPopover';
import { RulesPopover } from './components/RulesPopover';
import { SettingsPopover } from './components/SettingsPopover';
import { SidePanel } from './components/SidePanel';
import { SignInPopover } from './auth/SignInPopover';
import { useAuth } from './auth/useAuth';
import { useSupabaseUser } from './auth/useSupabaseUser';
import { saveCloudProgress, syncOnSignIn } from './cloud/progressSync';
import {
  ensureUsername,
  suggestUsername,
  watchProfile,
  type CloudProfile,
} from './cloud/usernames';
import {
  cancelQueue,
  clearPairing,
  joinQueue,
  requestBotMatch,
  watchPairing,
  type PairingDoc,
  type TimeControl,
} from './cloud/matchmaking';
import {
  claimAbort,
  claimTimeout,
  markBoardLoaded,
  markReady,
  playerNumFor,
  requestRematch,
  sendMove,
  sendResign,
  subscribeConnectionDiag,
  watchConnection,
  watchError,
  watchGame,
  type ConnectionStatus,
  type GameClock,
  type OnlineError,
  type OnlineGame,
} from './cloud/onlineGame';
import { measureServerSkewMs } from './cloud/serverTime';
import {
  claimSession,
  getSessionId,
  releaseSession,
  watchSession,
  type GameSession,
} from './cloud/gameSession';
import {
  watchMatch,
  type MatchRecord,
} from './cloud/matchHistory';
import { ClockBadge } from './components/ClockBadge';
import { MatchFoundScreen } from './components/MatchFoundScreen';
import { MatchmakingWaiting } from './components/MatchmakingWaiting';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { ThemePopover } from './components/ThemePopover';
import { UsernamePicker } from './components/UsernamePicker';
import { FriendsPopover } from './components/FriendsPopover';
import { SendInviteDialog } from './components/SendInviteDialog';
import { IncomingInviteToast } from './components/IncomingInviteToast';
import { PuzzleLeaderboardPopover } from './components/PuzzleLeaderboardPopover';
import {
  watchMyDailyAttempt,
  type MyDailyAttempt,
} from './cloud/dailyLeaderboard';
import { dateToUtcKey, puzzleForDate } from './dailyPuzzles';
import { finalizeDailyPuzzle } from './cloud/dailyPuzzleResult';
import { syncProfileName } from './cloud/supabaseProfile';
import type { Friend, PendingRequest } from './cloud/friends';
import {
  subscribeFriends,
  subscribeIncomingRequests,
  subscribeOutgoingRequests,
  sendFriendRequestByUid,
} from './cloud/friends';
import type { Invite } from './cloud/invites';
import { subscribeIncomingInvites } from './cloud/invites';
import type { FriendStatus, PresenceStatus } from './cloud/presence';
import {
  markPresenceOffline,
  setPresenceEnabled,
  setPresenceStatus,
  stopPresence,
  subscribePresence,
} from './cloud/presence';
import { updatePrivacy } from './cloud/supabaseProfile';
import { loadTheme, saveTheme, type ThemeId } from './theme';
import {
  applyConsent,
  loadConsent,
  saveConsent,
  type Consent,
} from './consent';
import { pickAIAction } from './ai';
import { applyClaim, applyMove, createGame, pointsIfPlayed } from './game';
import { getBoard } from './geometry';
import {
  aiOpponentKey,
  getPlayerRow,
  loadProgress,
  loadSettings,
  migrateStatsKey,
  normKey,
  recordGameResult,
  recordWin,
  resetProgress,
  saveProgress,
  saveSettings,
  type HintKey,
  type Settings,
} from './storage';
import { DIFFICULTY_LABELS } from './types';
import type { Difficulty, GameMode, GameState, Progress, ShapeId } from './types';
import { APP_VERSION } from './version';
import { bumpAndGetGameIndex, IS_STAGING, sha256First8, trackEvent } from './telemetry';

type Screen = 'menu' | 'game' | 'lobby' | 'matchmaking' | 'matchFound' | 'mpgame';

interface SessionConfig {
  mode: GameMode;
  shape: ShapeId;
  difficulty?: Difficulty;
}

const AI_DELAY_MS = 450;

// Effective "show pending-claim rings" rule (Phase 1b — replaces the old
// universal gamesPlayed/claimsMade learning window). Tiered by mode AND
// shape:
//   vs AI L1/L2/L3 on triangle — respects settings.showClaimableLines (default ON)
//   vs AI L4 on triangle       — respects settings.showClaimableLinesL4 (default OFF)
//   vs AI L5 on triangle       — never
//   square / rectangle         — never (visual bug: many pending rings
//                                  trigger flicker / crash; deferred)
//   hot-seat / MP / daily      — never (perception is part of the game)
function effectiveShowRings(
  settings: Settings,
  mode: GameMode | undefined,
  difficulty: Difficulty | undefined,
  shape: ShapeId | undefined,
): boolean {
  if (mode !== 'ai') return false;
  if (shape !== 'triangle') return false;
  if (!difficulty) return false;
  if (difficulty === 5) return false;
  if (difficulty === 4) return settings.showClaimableLinesL4;
  return settings.showClaimableLines;
}

// Whether the eye-toggle button should be rendered for the current mode.
// Triangle-only for now — same flicker bug on square/rectangle gates it.
function ringToggleAvailable(
  mode: GameMode | undefined,
  difficulty: Difficulty | undefined,
  shape: ShapeId | undefined,
): boolean {
  return (
    mode === 'ai' &&
    shape === 'triangle' &&
    difficulty !== undefined &&
    difficulty <= 4
  );
}

// Shown on any mp-flow screen when Firebase RTDB has been unreachable for
// >15s — typically a DNS-level ad/tracker blocker (Whalebone, AdGuard,
// NextDNS, etc.) or a restrictive Wi-Fi blocking *.firebasedatabase.app.
// Replaces matchmaking/matchFound/mpgame-loading with a clear explanation
// + Back to menu escape, instead of letting the user stare at a frozen
// "Searching for opponent" screen.
function renderMpUnreachable({ onLeave }: { onLeave: () => void }) {
  return (
    <div className="menu mp-offline">
      <h2>Multiplayer unavailable</h2>
      <p className="hint">
        Your network is blocking the game server. The most common cause is
        an ad/tracker blocker (Whalebone, AdGuard, NextDNS, Pi-hole) or a
        DNS filter on your phone or router.
      </p>
      <p className="hint">
        <strong>Try:</strong>
        <br />· another Wi-Fi network or mobile data
        <br />· another browser
        <br />· disabling DNS filters / VPN for a moment
        <br />· whitelisting <code>*.firebasedatabase.app</code> in your blocker
      </p>
      <p className="hint">
        Single-player vs the bot works offline — open Menu and pick Vs AI.
      </p>
      <button type="button" className="menu-auth-btn" onClick={onLeave}>
        Back to menu
      </button>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [config, setConfig] = useState<SessionConfig | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [thinking, setThinking] = useState(false);
  const [lastDot, setLastDot] = useState<number | null>(null);
  const [unlockInfo, setUnlockInfo] = useState<{
    shape: ShapeId | null;
    difficulty: Difficulty | null;
  }>({ shape: null, difficulty: null });
  const [rulesOpen, setRulesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rankingsOpen, setRankingsOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  // Login gate shown on first load while signed out, until the user signs in
  // or explicitly chooses to play anonymously (session-scoped).
  const [gateDismissed, setGateDismissed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [cloudProfile, setCloudProfile] = useState<CloudProfile | null>(null);
  const [cloudProfileLoaded, setCloudProfileLoaded] = useState(false);
  const [pairing, setPairing] = useState<PairingDoc | null>(null);
  const [queueTimeControl, setQueueTimeControl] = useState<TimeControl | null>(null);
  const [onlineGameId, setOnlineGameId] = useState<string | null>(null);
  const [onlineGame, setOnlineGame] = useState<OnlineGame | null>(null);
  const [onlineError, setOnlineError] = useState<OnlineError | null>(null);
  const [moveInFlight, setMoveInFlight] = useState(false);
  const [optimisticMpState, setOptimisticMpState] = useState<{
    baseTurn: number;
    state: GameState;
  } | null>(null);
  // Optimistic clock, synthesized when the local player moves (mirrors the
  // optimistic board): freezes the mover's time and starts the opponent with a
  // FRESH turnStartedAt, so the clock stays consistent with the optimistic board
  // and doesn't snap back ~1 RTT when the server confirms. Dropped on the same
  // turn-caught-up / rejection signals as optimisticMpState.
  const [optimisticClock, setOptimisticClock] = useState<GameClock | null>(null);
  // Client↔server wall-clock offset (serverNow ≈ Date.now() + skew), measured
  // once per match so clock extrapolation is accurate on skewed devices.
  const [serverSkewMs, setServerSkewMs] = useState(0);
  const [mpMatchRecord, setMpMatchRecord] = useState<MatchRecord | null>(null);
  const mySessionIdRef = useRef<string>(getSessionId());
  const [activeGameSession, setActiveGameSession] =
    useState<GameSession | null>(null);
  const [resignConfirmOpen, setResignConfirmOpen] = useState(false);
  const [theme, setThemeState] = useState<ThemeId>(loadTheme);
  const [themeOpen, setThemeOpen] = useState(false);
  const [consent, setConsentState] = useState<Consent | null>(loadConsent);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);

  // --- Friends & invites (Alpha 0.2.0.0) ---
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendStatusMap, setFriendStatusMap] = useState<
    Record<string, FriendStatus>
  >({});
  const [incomingRequests, setIncomingRequests] = useState<PendingRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<PendingRequest[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<Invite[]>([]);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [sendInviteFor, setSendInviteFor] = useState<Friend | null>(null);

  const { user, loading: authLoading, signOut } = useAuth();
  // Supabase identity (established by the dual-auth bridge). Migrated features
  // key off this, not the Firebase uid.
  const { user: sbUser } = useSupabaseUser();
  const aiTimer = useRef<number | null>(null);
  const winRecorded = useRef(false);
  const gameEndCounted = useRef(false);
  const claimsInGame = useRef(0);
  const gameStartedAtRef = useRef<number>(0);
  const gameStartedFiredRef = useRef(false);
  const firstScoreFiredRef = useRef(false);
  const gameFinishedFiredRef = useRef(false);
  const gameIndexRef = useRef<number>(0);
  const [scoreEvent, setScoreEvent] = useState<{
    dotId: number;
    points: number;
    player: 1 | 2;
    seq: number;
  } | null>(null);
  const [pendingFlash, setPendingFlash] = useState(false);
  const prevPendingLenRef = useRef<number>(0);
  const [activeHint, setActiveHint] = useState<{ text: string; anchorDotId: number } | null>(null);
  // Phase 2b — daily puzzle. dailyPuzzleIdRef carries today's puzzle id
  // through the gameplay so the finalize useEffect can pass it back to
  // Firestore. dailyPuzzleResult holds the post-finalize streak info for
  // the GameOver variant to display.
  const dailyPuzzleIdRef = useRef<number | null>(null);
  const [dailyPuzzleResult, setDailyPuzzleResult] = useState<
    { margin: number; best: number; attempts: number; attemptsRemaining: number; current: number; longest: number } | null
  >(null);
  // 2b-v2: subscribed view of today's per-user attempt doc + popover state.
  const [myDailyAttempt, setMyDailyAttempt] = useState<MyDailyAttempt | null>(null);
  const [puzzleLbOpen, setPuzzleLbOpen] = useState(false);

  const updateSettings = (next: Settings) => {
    setSettings(next);
    saveSettings(next);
  };

  // Phase 1b helper: fires a contextual hint if its per-concept "shown"
  // flag is unset. Marks the flag immediately so reloads / re-triggers in
  // the same game don't re-show. trackEvent fires for funnel analysis.
  // anchorDotId is the dot the speech bubble will point at — the
  // pedagogical referent (the just-scored dot, the missed empty, the
  // claimable line's midpoint, etc.).
  const tryFireHint = (key: HintKey, text: string, anchorDotId: number) => {
    if (settings[key]) return;
    const next: Settings = { ...settings, [key]: true };
    setSettings(next);
    saveSettings(next);
    setActiveHint({ text, anchorDotId });
    trackEvent('hint_shown', { hint_id: key }, 'low');
  };


  const startGame = (
    mode: GameMode,
    shape: ShapeId,
    difficulty?: Difficulty,
    openingMoves?: number[],
  ) => {
    if (aiTimer.current !== null) {
      clearTimeout(aiTimer.current);
      aiTimer.current = null;
    }
    // Clear transient visual state from the previous game so the new
    // board mounts clean. Without this, the stale scoreEvent from the
    // last scoring move re-fires Board's float-mount useEffect and a
    // ghost +N drifts up over the fresh empty board.
    setScoreEvent(null);
    setActiveHint(null);
    setPendingFlash(false);
    prevPendingLenRef.current = 0;
    winRecorded.current = false;
    gameEndCounted.current = false;
    claimsInGame.current = 0;
    gameStartedAtRef.current = Date.now();
    gameStartedFiredRef.current = true;
    firstScoreFiredRef.current = false;
    gameFinishedFiredRef.current = false;
    gameIndexRef.current = bumpAndGetGameIndex();
    trackEvent('game_started', {
      mode,
      shape,
      difficulty: difficulty ?? 0,
      game_index: gameIndexRef.current,
      auth_state: user ? 'signed_in' : 'anon',
    });
    if (Date.now() - settings.lastPlayedAt > 60 * 60 * 1000) {
      const nextSettings: Settings = { ...settings, lastPlayedAt: Date.now() };
      setSettings(nextSettings);
      saveSettings(nextSettings);
    }
    setConfig({ mode, shape, difficulty });
    let initial = createGame(shape, mode, difficulty);
    // Daily-puzzle opening moves get applied here so the player starts
    // mid-game on a pre-positioned board. applyMove enforces turn-passing
    // so the player who's "up" after the opening alternates naturally.
    if (mode === 'daily' && openingMoves && openingMoves.length > 0) {
      for (const dotId of openingMoves) {
        try {
          initial = applyMove(initial, dotId).state;
        } catch (e) {
          console.warn('daily-puzzle opening move failed:', e);
        }
      }
    }
    setState(initial);
    setLastDot(null);
    setUnlockInfo({ shape: null, difficulty: null });
    setThinking(false);
    setScreen('game');
  };

  // Phase 2b — load today's puzzle (lazy import keeps the library out of
  // the initial bundle) and hand off to startGame with the puzzle's
  // configured opening moves. Signed-in only — anonymous callers will see
  // the disabled "Sign in to play" card on the menu instead.
  const startDailyPuzzle = () => {
    if (!user) return;
    const puzzle = puzzleForDate();
    dailyPuzzleIdRef.current = puzzle.id;
    setDailyPuzzleResult(null);
    trackEvent('daily_puzzle_started', { puzzle_id: puzzle.id, shape: puzzle.shape });
    startGame('daily', puzzle.shape, puzzle.aiDifficulty, puzzle.openingMoves);
  };

  const backToMenu = () => {
    if (aiTimer.current !== null) {
      clearTimeout(aiTimer.current);
      aiTimer.current = null;
    }
    winRecorded.current = false;
    gameEndCounted.current = false;
    setDailyPuzzleResult(null);
    dailyPuzzleIdRef.current = null;
    setScoreEvent(null);
    setActiveHint(null);
    setPendingFlash(false);
    prevPendingLenRef.current = 0;
    setScreen('menu');
    setState(null);
    setConfig(null);
    setThinking(false);
  };

  const playAgain = () => {
    if (!config) return;
    startGame(config.mode, config.shape, config.difficulty);
  };

  useEffect(() => {
    if (!state || !config) return;
    if (state.finished) return;
    if (!((config.mode === 'ai' || config.mode === 'daily') && state.current === 2 && config.difficulty)) return;

    setThinking(true);
    const diff = config.difficulty;
    const snapshot = state;
    const shape = config.shape;
    aiTimer.current = window.setTimeout(() => {
      aiTimer.current = null;
      if (snapshot.finished || snapshot.current !== 2) {
        setThinking(false);
        return;
      }
      const action = pickAIAction(snapshot, diff, 2);
      if (action.kind === 'dot' && action.dotId < 0) {
        setThinking(false);
        return;
      }
      if (action.kind === 'dot') {
        const result = applyMove(snapshot, action.dotId);
        if (result.pointsGained > 0 || result.newlyPending.length > 0) {
          setScoreEvent({
            dotId: action.dotId,
            points: result.pointsGained,
            player: 2,
            seq: Date.now(),
          });
        }
        setLastDot(action.dotId);
        setState(result.state);
      } else {
        const result = applyClaim(snapshot, action.lineId);
        const line = getBoard(shape).lines.find((l) => l.id === action.lineId);
        if (line && result.pointsGained > 0) {
          const midDot = line.dotIds[Math.floor(line.dotIds.length / 2)];
          setScoreEvent({
            dotId: midDot,
            points: result.pointsGained,
            player: 2,
            seq: Date.now(),
          });
        }
        setState(result.state);
      }
      setThinking(false);
    }, AI_DELAY_MS);

    return () => {
      if (aiTimer.current !== null) {
        clearTimeout(aiTimer.current);
        aiTimer.current = null;
      }
    };
  }, [state, config]);

  // game_first_score telemetry. Fires the first time either player's score
  // moves above 0 in the local (AI/hotseat) game. Captures time-to-first-
  // score so we can see how fast the moment-of-truth arrives.
  useEffect(() => {
    if (!state || !config) return;
    if (firstScoreFiredRef.current) return;
    if (state.scores[1] === 0 && state.scores[2] === 0) return;
    firstScoreFiredRef.current = true;
    trackEvent('game_first_score', {
      mode: config.mode,
      shape: config.shape,
      difficulty: config.difficulty ?? 0,
      game_index: gameIndexRef.current,
      auth_state: user ? 'signed_in' : 'anon',
      time_to_first_score_ms: Date.now() - gameStartedAtRef.current,
      scoring_player: state.scores[1] > 0 ? 1 : 2,
    });
  }, [state, config, user]);

  // Phase 1b hint: "first pending-claim opportunity at start of turn".
  // Anchors the speech bubble to the midpoint dot of the first pending
  // line — the bubble visually points AT a claimable dot.
  useEffect(() => {
    if (!state || !config || state.finished) return;
    if (config.mode !== 'ai' && config.mode !== 'hotseat') return;
    if (config.mode === 'ai' && state.current !== 1) return;
    if (state.pending.length === 0) return;
    const firstPendingId = state.pending[0];
    const line = getBoard(config.shape).lines.find((l) => l.id === firstPendingId);
    if (!line) return;
    const anchor = line.dotIds[Math.floor(line.dotIds.length / 2)];
    tryFireHint(
      'hintPendingClaim',
      "It's your turn — there's a free line waiting. Tap any of its coloured dots to claim it instead of placing.",
      anchor,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.current, state?.pending.length, state?.finished, config?.mode]);

  // Phase 1b hint: "near-end" — fires once when ≥90% of dots are coloured
  // and the game isn't over yet. Anchor: midpoint of first remaining
  // pending line if any, else any empty dot, else first colored dot.
  useEffect(() => {
    if (!state || !config || state.finished) return;
    if (config.mode !== 'ai' && config.mode !== 'hotseat') return;
    const board = getBoard(config.shape);
    const totalDots = board.dots.length;
    const filled = Object.keys(state.colored).length;
    if (totalDots === 0) return;
    if (filled / totalDots < 0.9) return;
    let anchor = 0;
    if (state.pending.length > 0) {
      const line = board.lines.find((l) => l.id === state.pending[0]);
      if (line) anchor = line.dotIds[Math.floor(line.dotIds.length / 2)];
    } else {
      const empty = board.dots.find((d) => !state.colored[d.id]);
      anchor = empty ? empty.id : 0;
    }
    tryFireHint(
      'hintNearEnd',
      'Game ends when every line is claimed. Keep claiming.',
      anchor,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.colored, state?.finished, config?.mode, config?.shape]);

  // pending-flash: one-shot ~600ms class toggle whenever the pending pool
  // grows. Sources: biggest-only triggers from my move (scoreEvent path),
  // AI/hotseat opponent moves (also via scoreEvent), and MP opponent moves
  // (via watchGame state replacement — diff-based detection covers it).
  const effectivePendingLen =
    screen === 'mpgame'
      ? (optimisticMpState?.state.pending.length ?? onlineGame?.state.pending.length ?? 0)
      : (state?.pending.length ?? 0);
  useEffect(() => {
    if (effectivePendingLen > prevPendingLenRef.current) {
      prevPendingLenRef.current = effectivePendingLen;
      setPendingFlash(true);
      const t = window.setTimeout(() => setPendingFlash(false), 600);
      return () => window.clearTimeout(t);
    }
    prevPendingLenRef.current = effectivePendingLen;
  }, [effectivePendingLen]);

  // Increment gamesPlayed exactly once per finished game (any mode, any winner).
  // Also record per-name win/draw/loss stats for active human players.
  useEffect(() => {
    if (!state || !state.finished || !config) return;
    if (gameEndCounted.current) return;
    gameEndCounted.current = true;
    updateSettings({
      ...settings,
      gamesPlayed: settings.gamesPlayed + 1,
      claimsMade: settings.claimsMade + claimsInGame.current,
    });

    // Record W/D/L for the human player(s), tagged by shape (always)
    // and difficulty (vs-AI only).
    const winnerSide = state.winner;
    const outcomeFor = (player: 1 | 2): 'win' | 'draw' | 'loss' => {
      if (winnerSide === 'draw' || winnerSide === null) return 'draw';
      return winnerSide === player ? 'win' : 'loss';
    };
    const s1 = state.scores[1];
    const s2 = state.scores[2];
    const liveGameName =
      user && cloudProfile?.displayName
        ? cloudProfile.displayName
        : settings.playerName || 'Player 1';
    if (config.mode === 'ai') {
      const oppKey = config.difficulty ? aiOpponentKey(config.difficulty) : undefined;
      recordGameResult(liveGameName, 'ai', outcomeFor(1), config.shape, s1, s2, config.difficulty, oppKey);
    } else if (config.mode === 'hotseat') {
      const p1 = liveGameName;
      const p2 = settings.opponentName || 'Player 2';
      const k1 = normKey(p1);
      const k2 = normKey(p2);
      recordGameResult(p1, 'hotseat', outcomeFor(1), config.shape, s1, s2, undefined, k2);
      if (k1 !== k2) {
        recordGameResult(p2, 'hotseat', outcomeFor(2), config.shape, s2, s1, undefined, k1);
      }
    }
    if (!gameFinishedFiredRef.current) {
      gameFinishedFiredRef.current = true;
      const winnerLabel =
        winnerSide === 'draw' ? 'draw' : winnerSide === null ? 'none' : `p${winnerSide}`;
      trackEvent('game_finished', {
        mode: config.mode,
        shape: config.shape,
        difficulty: config.difficulty ?? 0,
        game_index: gameIndexRef.current,
        auth_state: user ? 'signed_in' : 'anon',
        winner: winnerLabel,
        score_self: s1,
        score_opp: s2,
        duration_ms: gameStartedAtRef.current > 0 ? Date.now() - gameStartedAtRef.current : 0,
      });
    }

    // Phase 2b — daily-puzzle finalization. Writes the attempt doc + bumps
    // the streak. Fires only for vs-AI puzzle wins/losses (signed-in by
    // construction of the entry point). Result drives the GameOver variant.
    if (config.mode === 'daily' && user) {
      const puzzleId = dailyPuzzleIdRef.current ?? -1;
      const margin = s1 - s2;
      const dispName =
        cloudProfile?.displayName ??
        settings.playerName ??
        user.displayName ??
        user.email?.split('@')[0] ??
        'Anonymous';
      void (async () => {
        try {
          const utcDate = dateToUtcKey();
          const result = await finalizeDailyPuzzle({
            uid: user.uid,
            displayName: dispName,
            utcDate,
            puzzleId,
            margin,
          });
          setDailyPuzzleResult({
            margin,
            best: result.best,
            attempts: result.attempts,
            attemptsRemaining: result.attemptsRemaining,
            current: result.streak.current,
            longest: result.streak.longest,
          });
          setMyDailyAttempt({
            puzzleId,
            attempts: result.attempts,
            best: result.best,
          });
          trackEvent('daily_puzzle_solved', {
            puzzle_id: puzzleId,
            margin,
            best: result.best,
            attempts: result.attempts,
            streak_current: result.streak.current,
          });
        } catch (e) {
          console.warn('finalizeDailyPuzzle failed:', e);
          setDailyPuzzleResult({
            margin,
            best: margin,
            attempts: 0,
            attemptsRemaining: 0,
            current: 0,
            longest: 0,
          });
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.finished]);

  // Win-recording effect (vs-AI only, human wins only)
  useEffect(() => {
    if (!state || !config) return;
    if (!state.finished) return;
    if (winRecorded.current) return;
    winRecorded.current = true;
    if (config.mode !== 'ai' || !config.difficulty) return;
    if (state.winner !== 1) return;

    const prev = progress;
    const next = recordWin(prev, config.shape, config.difficulty);

    const newShape =
      (['square', 'rectangle', 'rhombus'] as const).find(
        (s) => prev.unlocked[s] === 0 && next.unlocked[s] > 0
      ) ?? null;

    const newDifficulty: Difficulty | null =
      next.unlocked[config.shape] > prev.unlocked[config.shape]
        ? (next.unlocked[config.shape] as Difficulty)
        : null;

    setUnlockInfo({ shape: newShape, difficulty: newDifficulty });
    setProgress(next);
    saveProgress(next);
    if (user) void saveCloudProgress(user.uid, next);
  }, [state, config, progress, user]);

  // On sign-in: merge cloud progress with local (max-union), save back.
  useEffect(() => {
    if (!sbUser) return;
    let cancelled = false;
    void syncOnSignIn(sbUser.uid).then((merged) => {
      if (cancelled || !merged) return;
      setProgress(merged);
    });
    return () => {
      cancelled = true;
    };
  }, [sbUser?.uid]);

  // Live subscription to the profile — auto-updates display name across tabs.
  useEffect(() => {
    if (!user) {
      setCloudProfile(null);
      setCloudProfileLoaded(false);
      return;
    }
    setCloudProfileLoaded(false);
    const unsub = watchProfile(user.uid, (p) => {
      setCloudProfile(p);
      setCloudProfileLoaded(true);
    });
    return unsub;
  }, [user?.uid]);

  // Auto-provision a username for sign-ups that have a display name but never
  // claimed a handle (Google), so they're findable by friends. No-op otherwise.
  // watchProfile above picks up any resulting display_name change live.
  useEffect(() => {
    if (!user) return;
    void ensureUsername();
  }, [user?.uid]);

  // 2b-v2 — subscribe to today's per-user daily-puzzle attempt doc so the
  // menu card can render the right state (not started / N/3 / 3/3 done)
  // and finalize can read attempt count without a fresh getDoc.
  useEffect(() => {
    if (!sbUser) {
      setMyDailyAttempt(null);
      return;
    }
    return watchMyDailyAttempt(sbUser.uid, dateToUtcKey(), setMyDailyAttempt);
  }, [sbUser?.uid]);

  // Keep the Supabase profile name aligned with the player's DotDuel name once
  // the Supabase session + cloud name are both available.
  useEffect(() => {
    if (sbUser && cloudProfile?.displayName) {
      void syncProfileName(cloudProfile.displayName);
    }
  }, [sbUser?.uid, cloudProfile?.displayName]);

  // Apply colour theme to <html data-theme> and persist on every change.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  const setTheme = (id: ThemeId) => setThemeState(id);

  // GDPR / ePrivacy: on boot, apply whatever consent decision exists
  // (no decision = no analytics, banner shows up). On every change,
  // persist + apply the side effect.
  useEffect(() => {
    applyConsent(consent);
    if (consent) saveConsent(consent);
  }, [consent]);

  // Diagnostic: log Firebase RTDB connection state changes for the lifetime
  // of the page. Lets us see (via Chrome USB inspect) whether the
  // WebSocket-level connection is even establishing on mobile browsers.
  useEffect(() => {
    return subscribeConnectionDiag();
  }, []);

  // React-facing connection state. Disconnected = persistent (>15s) failure
  // to reach Firebase RTDB. Drives the offline UI: greys-out the Multiplayer
  // button on the menu and surfaces a clear explanation on the mp screens
  // so users with strict DNS / ad-blocker setups know what's wrong instead
  // of staring at a frozen "Connecting…" screen.
  const [connStatus, setConnStatus] = useState<ConnectionStatus>('connecting');
  useEffect(() => {
    return watchConnection(setConnStatus);
  }, []);
  // Suppress the offline UI on staging: staging intentionally has no RTDB
  // instance, so .info/connected is always false there — that's by design
  // (we're testing the Firestore migration), NOT a real network problem.
  // The offline UI is still active on production.
  const mpUnreachable = !IS_STAGING && connStatus === 'disconnected';

  const acceptAnalytics = () => setConsentState('accepted');
  const declineAnalytics = () => setConsentState('declined');
  // Used by PrivacyPopover when the user changes their mind.
  // Switching from accepted -> declined requires a reload because the
  // Analytics SDK can't be unloaded at runtime.
  const changeAnalyticsConsent = (value: Consent) => {
    const wasAccepted = consent === 'accepted';
    setConsentState(value);
    if (wasAccepted && value === 'declined') {
      // Reload so the already-loaded Analytics SDK stops firing.
      window.setTimeout(() => window.location.reload(), 60);
    }
  };

  // Live subscription to pairings/{uid} — drives matchmaking → matchFound transition.
  useEffect(() => {
    if (!user) {
      setPairing(null);
      return;
    }
    return watchPairing(user.uid, (p) => setPairing(p));
  }, [user?.uid]);

  // Fast bot fallback. botFallbackSweep only ticks once a minute (Cloud
  // Scheduler's floor), so a lone player can wait ~60s for a bot. Once we've
  // searched 15s with no pairing, ask the server to spawn one now. Re-running
  // on `pairing` clears the timer the moment a real match arrives; the sweep
  // stays as the backstop for clients that close the tab before this fires.
  useEffect(() => {
    if (screen !== 'matchmaking' || pairing || !user) return;
    const t = window.setTimeout(() => {
      void requestBotMatch().catch((e) => console.warn('requestBotMatch failed:', e));
    }, 15_000);
    return () => window.clearTimeout(t);
  }, [screen, pairing, user?.uid]);

  // Live subscription to gameSessions/{uid} — drives the "active on another
  // device" lockout state. The lock auto-releases on disconnect (see
  // claimSession) so a closed phone tab doesn't strand the laptop forever.
  useEffect(() => {
    if (!user) {
      setActiveGameSession(null);
      return;
    }
    return watchSession(user.uid, setActiveGameSession);
  }, [user?.uid]);

  // --- Friends & invites subscriptions ---
  useEffect(() => {
    if (!user) {
      setFriends([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setIncomingInvites([]);
      setFriendStatusMap({});
      return;
    }
    const unsubFriends = subscribeFriends(user.uid, setFriends);
    const unsubIn = subscribeIncomingRequests(user.uid, setIncomingRequests);
    const unsubOut = subscribeOutgoingRequests(user.uid, setOutgoingRequests);
    const unsubInvites = subscribeIncomingInvites(user.uid, setIncomingInvites);
    return () => {
      unsubFriends();
      unsubIn();
      unsubOut();
      unsubInvites();
    };
  }, [user?.uid]);

  // Re-subscribe to presence whenever the friend uid list changes.
  useEffect(() => {
    if (friends.length === 0) {
      setFriendStatusMap({});
      return;
    }
    return subscribePresence(
      friends.map((f) => f.uid),
      setFriendStatusMap,
    );
  }, [friends]);

  // Presence opt-out — Settings → Privacy → "Show my status to friends".
  // Default ON if the cloud profile doesn't carry the field yet (existing
  // pre-0.2.0 accounts). When OFF, the presence module short-circuits all
  // writes; friends see this user as offline.
  useEffect(() => {
    if (!user) {
      setPresenceEnabled(false);
      return;
    }
    setPresenceEnabled(cloudProfile?.showPresence !== false);
  }, [user?.uid, cloudProfile?.showPresence]);

  // Status push: mirror local screen + mode to presence/{me}.status so
  // friends can see what we're doing. Cleaned up on sign-out via stopPresence.
  useEffect(() => {
    if (!user) {
      stopPresence();
      return;
    }
    let status: PresenceStatus;
    if (screen === 'matchmaking') status = 'searching-ranked';
    // On the results (GameOver) screen the screen is still 'mpgame' but the game
    // is over — report 'menu' (available) so friends can invite us again.
    else if (screen === 'mpgame' && onlineGame?.state.finished) status = 'menu';
    else if (screen === 'matchFound' || screen === 'mpgame') status = 'in-ranked';
    else if (screen === 'game' && config?.mode === 'ai') status = 'in-ai';
    else if (screen === 'game' && config?.mode === 'hotseat') status = 'in-hotseat';
    else if (screen === 'game' && config?.mode === 'daily') status = 'in-daily';
    else status = 'menu'; // menu, lobby, fallback
    void setPresenceStatus(user.uid, status);
  }, [user?.uid, screen, config?.mode, onlineGame?.state.finished]);

  // Tell-a-friend: pick up ?ref=<uid> on first load, hold it in sessionStorage,
  // consume it once the user has signed up + claimed a username (post-signup
  // auto-friend-request). The pickup runs unconditionally; the consume waits
  // for cloudProfile.displayName to be present so it fires after username claim.
  // Also mirrors to localStorage with 30-day TTL purely for telemetry
  // attribution of ref_friend_request_sent — does NOT gate the auto-add.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref && /^[a-zA-Z0-9_-]{1,128}$/.test(ref)) {
        if (!sessionStorage.getItem('dotduel:pendingFriendRef')) {
          sessionStorage.setItem('dotduel:pendingFriendRef', ref);
          localStorage.setItem(
            'dotduel:referrer:v1',
            JSON.stringify({ uid: ref, landedAt: Date.now() }),
          );
          void sha256First8(ref).then((hash) => {
            trackEvent('ref_param_landed', { referrer_uid_hash: hash });
          });
        }
      }
    } catch {
      // ignore — private mode etc.
    }
  }, []);

  useEffect(() => {
    if (!user || !cloudProfile?.displayName) return;
    let ref: string | null = null;
    try {
      ref = sessionStorage.getItem('dotduel:pendingFriendRef');
    } catch {
      return;
    }
    if (!ref || ref === user.uid) return;
    sessionStorage.removeItem('dotduel:pendingFriendRef');
    const refUid = ref;
    sendFriendRequestByUid(refUid)
      .then(() => {
        let daysSinceLanding = 0;
        try {
          const raw = localStorage.getItem('dotduel:referrer:v1');
          if (raw) {
            const parsed = JSON.parse(raw) as { uid?: string; landedAt?: number };
            if (typeof parsed.landedAt === 'number' && parsed.landedAt > 0) {
              daysSinceLanding = Math.floor((Date.now() - parsed.landedAt) / (24 * 60 * 60 * 1000));
            }
          }
        } catch {
          // ignore
        }
        void sha256First8(refUid).then((hash) => {
          trackEvent('ref_friend_request_sent', {
            referrer_uid_hash: hash,
            days_since_landing: daysSinceLanding,
          });
        });
      })
      .catch((e) => console.warn('referral friend-request failed:', e));
  }, [user?.uid, cloudProfile?.displayName]);

  // When a pairing arrives while waiting (or even while on the menu — handles
  // reconnect mid-search), jump to matchFound.
  useEffect(() => {
    if (!pairing) return;
    if (screen === 'matchmaking' || screen === 'menu' || screen === 'lobby') {
      setScreen('matchFound');
    }
  }, [pairing, screen]);

  // Stale-pairing guard. After a hard refresh on the GameOver screen,
  // watchPairing surfaces the prior pairing (Firestore never cleaned it up
  // because the tab closed without going through onLeaveMpGame). watchGame
  // then resolves to a game whose status is already 'finished' and whose
  // ready/boardLoaded maps are both true from the prior session — so the
  // MatchFound auto-start fires immediately, pushes us into mpgame, and
  // GameOver renders for a match the user already finished. Detect that
  // case here and route back to menu instead. Natural in-game GameOver
  // (status flips while screen is already 'mpgame') is preserved.
  useEffect(() => {
    if (!pairing || !onlineGame || !user) return;
    if (onlineGame.status !== 'finished') return;
    if (screen === 'mpgame') return;
    void clearPairing(user.uid).catch((e) =>
      console.warn('clearPairing on stale finished pairing failed:', e),
    );
    void releaseSession(user.uid).catch((e) =>
      console.warn('releaseSession on stale finished pairing failed:', e),
    );
    setPairing(null);
    setOnlineGameId(null);
    setOnlineGame(null);
    setOnlineError(null);
    setScreen('menu');
  }, [pairing, onlineGame, user, screen]);

  const mySessionId = mySessionIdRef.current;
  const mpLockedByOther =
    !!activeGameSession && activeGameSession.sessionId !== mySessionId;

  // Defensive teardown for the simultaneous-claim race: if two tabs of the same
  // account claim at nearly the same instant, the loser sees the winner's
  // sessionId via watchSession and must drop off any multiplayer screen + stop
  // watching a game it no longer owns. (In the normal case a second tab can't
  // take over a live session — see the hard lock in openMultiplayer — so the
  // holder's active game is never torn down by this.)
  useEffect(() => {
    if (!mpLockedByOther) return;
    setPairing(null);
    setOnlineGameId(null);
    setOnlineGame(null);
    setOnlineError(null);
    setOptimisticMpState(null);
    setQueueTimeControl(null);
    setMpMatchRecord(null);
    setResignConfirmOpen(false);
    setMoveInFlight(false);
    if (
      screen === 'mpgame' ||
      screen === 'matchFound' ||
      screen === 'matchmaking' ||
      screen === 'lobby'
    ) {
      setScreen('menu');
    }
  }, [mpLockedByOther, screen]);

  const openMultiplayer = () => {
    trackEvent('multiplayer_button_clicked', {
      auth_state: user ? 'signed_in' : 'anon',
      session_locked: mpLockedByOther ? 'true' : 'false',
    });
    if (!user) return;
    // HARD LOCK: never steal a live session from another tab/device — the active
    // game stays where it started; this tab stays locked out until the holder
    // leaves multiplayer (releaseSession) or its claim goes stale (~45s if the
    // holding tab was closed/crashed). The menu's Multiplayer card is already
    // disabled when locked; this guards any other entry path.
    if (mpLockedByOther) return;
    void claimSession(user.uid, mySessionId).catch((e) =>
      console.warn('claimSession failed:', e),
    );
    setScreen('lobby');
  };

  const onFindMatch = async (tc: TimeControl) => {
    if (!user) return;
    const rating = cloudProfile?.rating ?? 1000;
    setQueueTimeControl(tc);
    setScreen('matchmaking');
    try {
      await joinQueue(user.uid, rating, tc);
    } catch (e) {
      console.warn('joinQueue failed:', e);
      setQueueTimeControl(null);
      setScreen('lobby');
    }
  };

  const onCancelMatch = () => {
    if (user) {
      void cancelQueue(user.uid).catch((e) =>
        console.warn('cancelQueue failed:', e),
      );
    }
    setQueueTimeControl(null);
    setScreen('lobby');
  };

  const onLeaveMatch = () => {
    if (user) {
      void clearPairing(user.uid).catch((e) =>
        console.warn('clearPairing failed:', e),
      );
      void releaseSession(user.uid).catch((e) =>
        console.warn('releaseSession failed:', e),
      );
    }
    setPairing(null);
    setQueueTimeControl(null);
    setScreen('menu');
  };

  const onLeaveLobby = () => {
    if (user) {
      void releaseSession(user.uid).catch((e) =>
        console.warn('releaseSession failed:', e),
      );
    }
    setScreen('menu');
  };

  const onSignOutSafe = async () => {
    if (user) {
      // Stop the heartbeat and announce offline NOW, BEFORE signOut() clears the
      // session — presence/session RLS only lets the owner write, so these must
      // land while still authenticated (otherwise friends see a ghost-online
      // state for up to 90s). Awaited via allSettled so both complete first but
      // a single failure/slow write can't wedge sign-out.
      stopPresence();
      await Promise.allSettled([
        releaseSession(user.uid),
        markPresenceOffline(user.uid),
      ]);
    }
    await signOut();
  };

  // Clear transient visual state whenever the multiplayer game INSTANCE changes
  // (new match, rematch, post-abort game). Without this a stale +N popup from
  // the previous game ghosts over the fresh board — the multiplayer analog of
  // the startGame/backToMenu cleanup. startGame/backToMenu only covered the
  // vs-AI paths; MP enters via onStartPlaying and swaps onlineGameId on rematch,
  // so keying on onlineGameId catches them all. See bugs.md "Ghost +N popup".
  useEffect(() => {
    setScoreEvent(null);
    setActiveHint(null);
    setPendingFlash(false);
    prevPendingLenRef.current = 0;
  }, [onlineGameId]);

  const onStartPlaying = () => {
    setMoveInFlight(false);
    setScreen('mpgame');
  };

  const onMarkReady = async () => {
    if (!pairing || !onlineGameId) return;
    console.log('markReady: writing', { gameId: onlineGameId, slot: pairing.player });
    try {
      await markReady(onlineGameId, pairing.player, true);
      console.log('markReady: write OK');
    } catch (e) {
      console.warn('markReady failed:', e);
    }
  };

  const onLeaveMpGame = () => {
    // Clear any pending rematch flag so we're not pulled into a spawn
    // after we've decided to leave. All cleanup is fire-and-forget so
    // a hung RTDB write can't freeze the back-to-menu transition.
    if (onlineGame && onlineGameId && user) {
      const slot = playerNumFor(onlineGame, user.uid);
      if (slot) {
        void requestRematch(onlineGameId, slot, false).catch((e) =>
          console.warn('rematch flag clear failed on leave:', e),
        );
      }
    }
    if (user) {
      void clearPairing(user.uid).catch((e) =>
        console.warn('clearPairing failed:', e),
      );
      void releaseSession(user.uid).catch((e) =>
        console.warn('releaseSession failed:', e),
      );
    }
    setPairing(null);
    setOnlineGameId(null);
    setOnlineGame(null);
    setOnlineError(null);
    setMoveInFlight(false);
    setOptimisticMpState(null);
    setQueueTimeControl(null);
    setResignConfirmOpen(false);
    setScreen('menu');
  };

  // Back button while a match is live: prompt before resigning. After the
  // game has finished, the back arrow just exits to the menu (no resign).
  const onMpBackPressed = () => {
    if (!onlineGame || onlineGame.state.finished) {
      void onLeaveMpGame();
      return;
    }
    setResignConfirmOpen(true);
  };

  const onConfirmResign = async () => {
    setResignConfirmOpen(false);
    // vs-AI resign: flip state to finished with AI as winner. The existing
    // state.finished effect will record the loss for the human.
    if (
      screen === 'game' &&
      (config?.mode === 'ai' || config?.mode === 'daily') &&
      state &&
      !state.finished
    ) {
      setState({ ...state, finished: true, winner: 2 });
      return;
    }
    // Multiplayer resign: send to server.
    if (!onlineGameId || !user) return;
    try {
      await sendResign(onlineGameId, user.uid);
    } catch (e) {
      console.warn('sendResign failed:', e);
    }
  };

  const onAiBackPressed = () => {
    if (!state || state.finished) {
      backToMenu();
      return;
    }
    setResignConfirmOpen(true);
  };

  // Same-opponent rematch: flag this player as wanting one. The server's
  // rematchGame Cloud Function spawns a new game + pairing when BOTH sides
  // have flagged true. The new pairing arrives via watchPairing and the
  // mpgame view automatically re-renders against the new game node.
  const onMpRematch = async () => {
    if (!user || !onlineGame || !onlineGameId) return;
    const myNum = playerNumFor(onlineGame, user.uid);
    if (!myNum) return;
    try {
      await requestRematch(onlineGameId, myNum, true);
    } catch (e) {
      console.warn('requestRematch failed:', e);
    }
  };

  // Withdraw a pending rematch request.
  const onCancelMpRematch = async () => {
    if (!user || !onlineGame || !onlineGameId) return;
    const myNum = playerNumFor(onlineGame, user.uid);
    if (!myNum) return;
    try {
      await requestRematch(onlineGameId, myNum, false);
    } catch (e) {
      console.warn('requestRematch cancel failed:', e);
    }
  };

  // Back to the time-control picker. Session lock stays claimed.
  const onMpBackToLobby = async () => {
    if (onlineGame && onlineGameId && user) {
      const slot = playerNumFor(onlineGame, user.uid);
      if (slot) {
        try {
          await requestRematch(onlineGameId, slot, false);
        } catch (e) {
          console.warn('rematch flag clear failed on lobby:', e);
        }
      }
    }
    if (user) {
      try {
        await clearPairing(user.uid);
      } catch (e) {
        console.warn('clearPairing failed:', e);
      }
    }
    setPairing(null);
    setOnlineGameId(null);
    setOnlineGame(null);
    setOnlineError(null);
    setMoveInFlight(false);
    setOptimisticMpState(null);
    setQueueTimeControl(null);
    setResignConfirmOpen(false);
    setScreen('lobby');
  };

  // Mirror pairing.matchId into onlineGameId so the RTDB subscription
  // is active during both matchFound and mpgame screens.
  useEffect(() => {
    if (!pairing) {
      setOnlineGameId(null);
      setOnlineGame(null);
      return;
    }
    setOnlineGameId(pairing.matchId);
  }, [pairing?.matchId]);

  // Whenever the match ID flips (rematch spawned a new game, or matchmaker
  // paired a fresh opponent), reset all per-game ephemeral state so the new
  // game starts clean even though we never left the mpgame screen.
  useEffect(() => {
    setOptimisticMpState(null);
    setMoveInFlight(false);
    setMpMatchRecord(null);
    setResignConfirmOpen(false);
    setLastDot(null);
    prevMpColoredKeysRef.current = null;
  }, [onlineGameId]);

  // Subscribe to the RTDB game node whenever we have a matchId.
  useEffect(() => {
    if (!onlineGameId) return;
    const unsubGame = watchGame(onlineGameId, setOnlineGame);
    const unsubErr = watchError(onlineGameId, setOnlineError);
    return () => {
      unsubGame();
      unsubErr();
    };
  }, [onlineGameId]);

  // Subscribe to the Firestore match doc so we can read the Elo deltas
  // written by finalizeGame after the game ends.
  useEffect(() => {
    if (!onlineGameId) {
      setMpMatchRecord(null);
      return;
    }
    return watchMatch(onlineGameId, setMpMatchRecord);
  }, [onlineGameId]);

  // Server-confirmed state advance clears the in-flight flag.
  useEffect(() => {
    setMoveInFlight(false);
  }, [onlineGame?.state.turn]);

  // Track the OPPONENT's most recently placed dot in MP. We don't
  // highlight the user's own moves — only their opponent's. State-diff
  // approach: every time the game state changes, look for newly
  // coloured dots that don't belong to us and flag the latest.
  const prevMpColoredKeysRef = useRef<Set<number> | null>(null);
  useEffect(() => {
    const game = onlineGame;
    if (!game || !user) {
      prevMpColoredKeysRef.current = null;
      return;
    }
    const myNum = playerNumFor(game, user.uid);
    if (!myNum) return;
    const colored = game.state.colored ?? {};
    const prev = prevMpColoredKeysRef.current;
    if (prev !== null) {
      let newestOpp: number | null = null;
      for (const [idStr, dot] of Object.entries(colored)) {
        const id = Number(idStr);
        if (prev.has(id)) continue;
        if (dot.player !== myNum) newestOpp = id;
      }
      if (newestOpp !== null) setLastDot(newestOpp);
    }
    const nextKeys = new Set<number>();
    for (const idStr of Object.keys(colored)) nextKeys.add(Number(idStr));
    prevMpColoredKeysRef.current = nextKeys;
  }, [onlineGame?.state.colored, onlineGame?.state.turn, user]);

  // Drop optimistic state once the server's confirmed turn catches up.
  useEffect(() => {
    if (!optimisticMpState || !onlineGame) return;
    if (onlineGame.state.turn >= optimisticMpState.state.turn) {
      setOptimisticMpState(null);
      setOptimisticClock(null);
    }
  }, [onlineGame?.state.turn, optimisticMpState]);

  // Server-side rejection of a move: revert optimistic state and unlock board.
  useEffect(() => {
    if (!onlineError) return;
    setOptimisticMpState(null);
    setOptimisticClock(null);
    setMoveInFlight(false);
  }, [onlineError?.ts]);

  // Measure the client↔server clock offset once per match so the clock badges
  // extrapolate against the server's turnStartedAt accurately.
  useEffect(() => {
    if (!onlineGameId) {
      setServerSkewMs(0);
      return;
    }
    let cancelled = false;
    void measureServerSkewMs().then((skew) => {
      if (!cancelled) setServerSkewMs(skew);
    });
    return () => {
      cancelled = true;
    };
  }, [onlineGameId]);

  // Defensive recovery: if the mpgame screen is showing the loading guard
  // for more than 2 seconds (onlineGame is null even though we have a
  // matchId), force a fresh RTDB subscription by bouncing onlineGameId.
  // The data is in RTDB - the client just got into a stale-state window
  // during the matchFound -> mpgame transition.
  useEffect(() => {
    if (screen !== 'mpgame' || onlineGame || !onlineGameId) return;
    const stuckId = onlineGameId;
    const timer = window.setTimeout(() => {
      console.warn('mpgame: onlineGame null for 2s, bouncing subscription');
      setOnlineGameId(null);
      window.setTimeout(() => setOnlineGameId(stuckId), 80);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [screen, onlineGameId, onlineGame]);

  // Schedule an automatic timeout claim at the moment the current player's
  // clock will hit 0. Both clients run this; whichever fires first wins, the
  // other becomes a no-op (server rejects once status='finished').
  useEffect(() => {
    if (
      screen !== 'mpgame' ||
      !onlineGame ||
      !onlineGameId ||
      !user ||
      onlineGame.state.finished
    )
      return;
    const clock = onlineGame.clock;
    if (!clock || clock.turnStartedAt <= 0) return;
    const current = onlineGame.state.current;
    const baseMs =
      current === 1 ? clock.p1RemainingMs : clock.p2RemainingMs;
    if (typeof baseMs !== 'number') return;
    const expiryAt = clock.turnStartedAt + baseMs;
    const msToExpire = expiryAt - Date.now();
    if (msToExpire <= 0) {
      void claimTimeout(onlineGameId, user.uid);
      return;
    }
    const timer = window.setTimeout(() => {
      void claimTimeout(onlineGameId!, user.uid);
    }, msToExpire + 500);
    return () => window.clearTimeout(timer);
  }, [screen, onlineGame, onlineGameId, user]);

  // First-move abort timer. While a multiplayer game is still on someone's
  // FIRST move, schedule a claim 10s after that turn began. Both clients run
  // it; the present player's fires (a backgrounded/left player's setTimeout is
  // throttled). The server only accepts it if still first-move + >10s
  // (ABORT_FIRST_MOVE_MS) — no winner, no rating change for either side.
  useEffect(() => {
    if (
      screen !== 'mpgame' ||
      !onlineGame ||
      !onlineGameId ||
      !user ||
      onlineGame.state.finished
    )
      return;
    const movesPlaced = Object.keys(onlineGame.state.colored ?? {}).length;
    if (movesPlaced > 1) return; // past the first-move window for both players
    const startedAt =
      (onlineGame.clock?.turnStartedAt ?? 0) || (onlineGame.gameStartedAt ?? 0);
    if (startedAt <= 0) return; // clock not started yet
    const claim = () =>
      void claimAbort(onlineGameId!, user.uid).catch((e) =>
        console.warn('claimAbort failed:', e),
      );
    const msToFire = startedAt + 10_000 - Date.now();
    if (msToFire <= 0) {
      claim();
      return;
    }
    const timer = window.setTimeout(claim, msToFire + 300);
    return () => window.clearTimeout(timer);
  }, [screen, onlineGame, onlineGameId, user]);

  // When the mpgame board first renders successfully (state available),
  // tell the server we're ready. The clock won't actually start until both
  // players' boardLoaded flips true.
  const boardLoadedMarkedRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      screen !== 'mpgame' ||
      !onlineGameId ||
      !pairing ||
      !onlineGame ||
      !user
    )
      return;
    if (boardLoadedMarkedRef.current === onlineGameId) return;
    boardLoadedMarkedRef.current = onlineGameId;
    void markBoardLoaded(onlineGameId, pairing.player);
    gameStartedAtRef.current = Date.now();
    firstScoreFiredRef.current = false;
    gameFinishedFiredRef.current = false;
    gameIndexRef.current = bumpAndGetGameIndex();
    trackEvent('game_started', {
      mode: 'multiplayer',
      shape: onlineGame.shape,
      time_control: onlineGame.timeControl,
      game_index: gameIndexRef.current,
      auth_state: 'signed_in',
    });
  }, [screen, onlineGameId, onlineGame, pairing, user]);

  // game_first_score for multiplayer: watch onlineGame.state.scores
  // transition from 0/0 to >0.
  useEffect(() => {
    if (screen !== 'mpgame' || !onlineGame || !user) return;
    if (firstScoreFiredRef.current) return;
    const s = onlineGame.state.scores;
    if (s[1] === 0 && s[2] === 0) return;
    firstScoreFiredRef.current = true;
    trackEvent('game_first_score', {
      mode: 'multiplayer',
      shape: onlineGame.shape,
      time_control: onlineGame.timeControl,
      game_index: gameIndexRef.current,
      auth_state: 'signed_in',
      time_to_first_score_ms: Date.now() - gameStartedAtRef.current,
      scoring_player: s[1] > 0 ? 1 : 2,
    });
  }, [screen, onlineGame, user]);

  // game_finished for multiplayer: fire when onlineGame.state.finished
  // flips true. Includes the server-reported finishedReason for slicing.
  useEffect(() => {
    if (screen !== 'mpgame' || !onlineGame || !user) return;
    if (!onlineGame.state.finished) return;
    if (gameFinishedFiredRef.current) return;
    gameFinishedFiredRef.current = true;
    const myNum = playerNumFor(onlineGame, user.uid);
    const winnerSide = onlineGame.state.winner;
    const winnerLabel =
      winnerSide === 'draw'
        ? 'draw'
        : winnerSide == null
          ? 'none'
          : winnerSide === myNum
            ? 'self'
            : 'opp';
    const myScore = myNum ? onlineGame.state.scores[myNum] : 0;
    const oppScore = myNum ? onlineGame.state.scores[myNum === 1 ? 2 : 1] : 0;
    trackEvent('game_finished', {
      mode: 'multiplayer',
      shape: onlineGame.shape,
      time_control: onlineGame.timeControl,
      game_index: gameIndexRef.current,
      auth_state: 'signed_in',
      winner: winnerLabel,
      score_self: myScore,
      score_opp: oppScore,
      finished_reason: onlineGame.finishedReason ?? 'normal',
      duration_ms: gameStartedAtRef.current > 0 ? Date.now() - gameStartedAtRef.current : 0,
    });
  }, [screen, onlineGame, user]);

  // Optimistic clock for the instant AFTER the local player's move: freeze the
  // mover at its move-time value AND start the opponent ticking from `sentAt`
  // (the move's send time in server time — the SAME value handed to sendMove, so
  // the server can stamp turnStartedAt = now - credit ≈ sentAt). Because the
  // optimistic and authoritative turn-starts reference the same instant, the
  // opponent's clock starts immediately and reconciles with no snap and no pause.
  // `sentAt` is also the reference for the mover's frozen value, so its freeze
  // matches the last displayed value. Returns null if it isn't our ticking turn.
  const buildOptimisticClock = (myNum: 1 | 2, sentAt: number): GameClock | null => {
    const clock = onlineGame?.clock;
    if (!clock || clock.turnStartedAt <= 0 || clock.current !== myNum) return null;
    const elapsed = Math.max(0, sentAt - clock.turnStartedAt);
    return {
      ...clock,
      p1RemainingMs: myNum === 1 ? Math.max(0, clock.p1RemainingMs - elapsed) : clock.p1RemainingMs,
      p2RemainingMs: myNum === 2 ? Math.max(0, clock.p2RemainingMs - elapsed) : clock.p2RemainingMs,
      turnStartedAt: sentAt,
      current: myNum === 1 ? 2 : 1,
    };
  };

  const handleMpDotClick = async (dotId: number) => {
    if (!user || !onlineGameId || !onlineGame) return;
    const myNum = playerNumFor(onlineGame, user.uid);
    if (!myNum) return;
    const baseState = optimisticMpState?.state ?? onlineGame.state;
    if (baseState.current !== myNum) return;
    if (moveInFlight) return;
    if (baseState.colored[dotId]) return;
    setActiveHint(null);
    setMoveInFlight(true);
    // One send-time (in server time) shared by the optimistic clock and sendMove
    // so the optimistic and authoritative turn-starts reference the same instant.
    const sentAt = Date.now() + serverSkewMs;
    // Note: we do NOT setLastDot here. The "last move" highlight is
    // reserved for the OPPONENT's most recent placement, picked up by
    // the state-diff effect below.
    try {
      const result = applyMove(baseState, dotId);
      setOptimisticMpState({ baseTurn: baseState.turn, state: result.state });
      setOptimisticClock(buildOptimisticClock(myNum, sentAt));
      if (result.pointsGained > 0 || result.newlyPending.length > 0) {
        setScoreEvent({
          dotId,
          points: result.pointsGained,
          player: myNum,
          seq: Date.now(),
        });
      }
    } catch (e) {
      console.warn('local applyAction failed:', e);
      setMoveInFlight(false);
      return;
    }
    try {
      await sendMove(onlineGameId, user.uid, { kind: 'dot', dotId }, sentAt);
    } catch (e) {
      console.warn('sendMove failed:', e);
      setMoveInFlight(false);
      setOptimisticMpState(null);
      setOptimisticClock(null);
    }
  };

  const handleMpClaimClick = async (lineId: string) => {
    if (!user || !onlineGameId || !onlineGame) return;
    const myNum = playerNumFor(onlineGame, user.uid);
    if (!myNum) return;
    const baseState = optimisticMpState?.state ?? onlineGame.state;
    if (baseState.current !== myNum) return;
    if (moveInFlight) return;
    if (!baseState.pending.includes(lineId)) return;
    setActiveHint(null);
    setMoveInFlight(true);
    const sentAt = Date.now() + serverSkewMs;
    try {
      const result = applyClaim(baseState, lineId);
      setOptimisticMpState({ baseTurn: baseState.turn, state: result.state });
      setOptimisticClock(buildOptimisticClock(myNum, sentAt));
      const line = getBoard(onlineGame.shape).lines.find((l) => l.id === lineId);
      if (line && result.pointsGained > 0) {
        const midDot = line.dotIds[Math.floor(line.dotIds.length / 2)];
        setScoreEvent({
          dotId: midDot,
          points: result.pointsGained,
          player: myNum,
          seq: Date.now(),
        });
      }
    } catch (e) {
      console.warn('local applyAction failed:', e);
      setMoveInFlight(false);
      return;
    }
    try {
      await sendMove(onlineGameId, user.uid, { kind: 'claim', lineId }, sentAt);
    } catch (e) {
      console.warn('sendMove failed:', e);
      setMoveInFlight(false);
      setOptimisticMpState(null);
      setOptimisticClock(null);
    }
  };

  const handleDotClick = (dotId: number) => {
    if (!state || !config || state.finished) return;
    if (thinking) return;
    if ((config.mode === 'ai' || config.mode === 'daily') && state.current === 2) return;
    if (state.colored[dotId]) return;
    setActiveHint(null);
    const movingPlayer = state.current;
    const result = applyMove(state, dotId);
    if (result.pointsGained > 0 || result.newlyPending.length > 0) {
      setScoreEvent({
        dotId,
        points: result.pointsGained,
        player: movingPlayer,
        seq: Date.now(),
      });
    }
    // Phase 1b hint triggers from a human dot placement.
    if (result.pointsGained > 0 && result.newlyPending.length === 0) {
      tryFireHint(
        'hintFirstScore',
        `+${result.pointsGained} — you completed a line.`,
        dotId,
      );
    } else if (result.pointsGained > 0 && result.newlyPending.length > 0) {
      tryFireHint(
        'hintBiggestOnly',
        `Two lines closed — only the longest (+${result.pointsGained}) scored. The other becomes pending: anyone can claim it on their turn for free points. Wait too long and your opponent will.`,
        dotId,
      );
    } else if (result.pointsGained === 0 && !settings.hintOverlapMiss) {
      // Overlap-miss detection: any other empty dot that WOULD have scored?
      const board = getBoard(config.shape);
      for (const d of board.dots) {
        if (d.id === dotId) continue;
        if (state.colored[d.id]) continue;
        if (pointsIfPlayed(state, board, d.id).gained > 0) {
          tryFireHint(
            'hintOverlapMiss',
            'That empty dot would have scored — scan for almost-full lines before placing.',
            d.id,
          );
          break;
        }
      }
    }
    // Hot-seat both players share the screen, so still flag the last
    // dot. In vs-AI we ONLY highlight the AI's moves (set by the AI
    // scheduler effect), not the user's — opponent-last-move UX.
    if (config.mode === 'hotseat') {
      setLastDot(dotId);
    }
    setState(result.state);
  };

  const handleClaimClick = (lineId: string) => {
    if (!state || !config || state.finished) return;
    if (thinking) return;
    if ((config.mode === 'ai' || config.mode === 'daily') && state.current === 2) return;
    if (!state.pending.includes(lineId)) return;
    setActiveHint(null);
    const movingPlayer = state.current;
    const result = applyClaim(state, lineId);
    claimsInGame.current += 1;
    const line = getBoard(config.shape).lines.find((l) => l.id === lineId);
    if (line && result.pointsGained > 0) {
      const midDot = line.dotIds[Math.floor(line.dotIds.length / 2)];
      setScoreEvent({
        dotId: midDot,
        points: result.pointsGained,
        player: movingPlayer,
        seq: Date.now(),
      });
    }
    setState(result.state);
  };

  const totalPoints = useMemo(() => {
    if (!config) return 0;
    return getBoard(config.shape).lines.reduce((sum, l) => sum + l.length, 0);
  }, [config]);

  const ringsVisible = effectiveShowRings(settings, config?.mode, config?.difficulty, config?.shape);
  const showRingsToggle = ringToggleAvailable(config?.mode, config?.difficulty, config?.shape);

  const onToggleRings = () => {
    const next: Settings =
      config?.difficulty === 4
        ? { ...settings, showClaimableLinesL4: !settings.showClaimableLinesL4 }
        : { ...settings, showClaimableLines: !settings.showClaimableLines };
    setSettings(next);
    saveSettings(next);
  };

  const onProgressResetWiped = () => {
    setProgress(resetProgress());
  };

  const effectiveGameName =
    user && cloudProfile?.displayName ? cloudProfile.displayName : null;

  if (screen === 'mpgame') {
    if (!onlineGame || !onlineGameId || !user || !pairing) {
      console.warn('mpgame loading guard hit:', {
        hasOnlineGame: !!onlineGame,
        hasOnlineGameId: !!onlineGameId,
        hasUser: !!user,
        hasPairing: !!pairing,
        onlineGameId,
        pairingMatchId: pairing?.matchId,
      });
      if (mpUnreachable) {
        return renderMpUnreachable({ onLeave: () => onLeaveMpGame() });
      }
      return (
        <div className="menu">
          <h2>Connecting to match…</h2>
          <p className="hint">
            Linking up with the game server. If this hangs for more than ~10
            seconds, something's wrong — back out and try again.
          </p>
          <button
            type="button"
            className="menu-auth-btn"
            onClick={onLeaveMpGame}
          >
            Back to menu
          </button>
        </div>
      );
    }
    const myNum = playerNumFor(onlineGame, user.uid);
    const mpState = optimisticMpState?.state ?? onlineGame.state;
    const mpShape = onlineGame.shape;
    const myName = effectiveGameName ?? 'You';
    const oppName = pairing.opponentDisplayName;
    // pairing.player is THIS user's slot. P1 panel shows whoever holds slot 1.
    const mpP1Name = pairing.player === 1 ? myName : oppName;
    const mpP2Name = pairing.player === 2 ? myName : oppName;
    const myRating = cloudProfile?.rating ?? 1000;
    const oppRating = pairing.opponentRating;
    const mpP1Elo = pairing.player === 1 ? myRating : oppRating;
    const mpP2Elo = pairing.player === 2 ? myRating : oppRating;
    // When opponent is a bot, render the matching RobotL{level} avatar in
    // their slot. Human always shows the human silhouette.
    const opponentSlot: 1 | 2 = pairing.player === 1 ? 2 : 1;
    const oppAvatar: 'human' | { kind: 'ai'; level: Difficulty } =
      pairing.opponentIsBot && pairing.opponentBotLevel
        ? { kind: 'ai', level: pairing.opponentBotLevel }
        : 'human';
    const mpP1Avatar = opponentSlot === 1 ? oppAvatar : 'human';
    const mpP2Avatar = opponentSlot === 2 ? oppAvatar : 'human';
    const mpTotalPoints = getBoard(mpShape).lines.reduce((sum, l) => sum + l.length, 0);
    const mpRemaining = mpTotalPoints - mpState.scores[1] - mpState.scores[2];
    const mpShowOver = mpState.finished;
    const mpDisabled =
      mpState.finished || moveInFlight || (myNum !== null && mpState.current !== myNum);
    // Prefer the optimistic clock when the local player has a move in flight: it
    // freezes the mover's time and hands the turn to the opponent with a FRESH
    // turnStartedAt, so display stays consistent with the optimistic board and
    // doesn't snap ~1 RTT when the server confirms. (The old approach used the
    // server clock + server state.current to dodge the "opponent clock
    // extrapolates from the previous turn's start = wildly wrong low value" bug;
    // the optimistic clock avoids that by carrying its own correct turnStartedAt.)
    // The timeout-claim path below still keys off the authoritative server clock.
    // Prefer the optimistic clock while a local move is in flight: it freezes the
    // mover and starts the opponent from `sentAt`. Because submit-move stamps the
    // authoritative turnStartedAt at the same instant (now - credit ≈ sentAt), the
    // opponent ticks immediately and reconciles with no snap/pause/flicker.
    const clock = optimisticClock ?? onlineGame.clock;
    const clockRunning = !mpState.finished && (clock?.turnStartedAt ?? 0) > 0;
    const activeCurrent = clock?.current ?? onlineGame.state.current;
    const p1Clock = clock ? (
      <ClockBadge
        remainingAtRefMs={clock.p1RemainingMs}
        refTime={clock.turnStartedAt}
        isRunning={clockRunning && activeCurrent === 1}
        skewMs={serverSkewMs}
      />
    ) : null;
    const p2Clock = clock ? (
      <ClockBadge
        remainingAtRefMs={clock.p2RemainingMs}
        refTime={clock.turnStartedAt}
        isRunning={clockRunning && activeCurrent === 2}
        skewMs={serverSkewMs}
      />
    ) : null;

    return (
      <div className="game-screen">
        <div className="game-topbar">
          <button className="btn-back" onClick={onMpBackPressed} aria-label="Leave match">
            ‹
          </button>
          <div className="topbar-center">
            <div className="remaining-points">
              <span className="remaining-value">{mpRemaining}</span>
              <span className="remaining-label">pts left</span>
            </div>
            <div
              className={`pending-indicator${mpState.pending.length === 0 ? ' pending-indicator-hidden' : ''}${pendingFlash ? ' pending-flash' : ''}`}
              aria-hidden={mpState.pending.length === 0}
            >
              <span className="pending-icon" aria-hidden="true">◌</span>
              <span className="pending-value">{Math.max(mpState.pending.length, 1)}</span>
              <span className="pending-label">
                {mpState.pending.length === 1 ? 'line to claim' : 'lines to claim'}
              </span>
            </div>
          </div>
          <button
            className="btn-rules"
            onClick={() => setRulesOpen(true)}
            aria-label="Show rules"
            title="How to play"
          >
            ?
          </button>
        </div>
        <div className="game-body">
          <SidePanel
            side="left"
            player={1}
            active={!mpState.finished && mpState.current === 1}
            name={mpP1Name}
            score={mpState.scores[1]}
            avatar={mpP1Avatar}
            stats={null}
            ratingSlot={p1Clock}
            belowAvatar={
              <span className="player-elo">
                {mpP1Elo}
                {opponentSlot === 1 && pairing.opponentIsBot && (
                  <span className="bot-tag" aria-label="AI opponent">BOT</span>
                )}
              </span>
            }
            actionSlot={
              myNum === 1 && !mpState.finished ? (
                <button
                  className="btn-resign-inline"
                  onClick={() => setResignConfirmOpen(true)}
                  title="Resign and end the game"
                >
                  Resign
                </button>
              ) : null
            }
          />
          <Board
            state={mpState}
            onDotClick={handleMpDotClick}
            onClaimClick={handleMpClaimClick}
            disabled={mpDisabled}
            lastDot={lastDot}
            showHints={false}
            scoreEvent={scoreEvent}
            hint={activeHint}
            onDismissHint={() => setActiveHint(null)}
          />
          <SidePanel
            side="right"
            player={2}
            active={!mpState.finished && mpState.current === 2}
            name={mpP2Name}
            score={mpState.scores[2]}
            avatar={mpP2Avatar}
            stats={null}
            ratingSlot={p2Clock}
            belowAvatar={
              <span className="player-elo">
                {mpP2Elo}
                {opponentSlot === 2 && pairing.opponentIsBot && (
                  <span className="bot-tag" aria-label="AI opponent">BOT</span>
                )}
              </span>
            }
            actionSlot={
              myNum === 2 && !mpState.finished ? (
                <button
                  className="btn-resign-inline"
                  onClick={() => setResignConfirmOpen(true)}
                  title="Resign and end the game"
                >
                  Resign
                </button>
              ) : null
            }
          />
        </div>
        {mpShowOver && (
          <GameOver
            state={mpState}
            mode="multiplayer"
            shape={mpShape}
            p1Name={mpP1Name}
            p2Name={mpP2Name}
            unlock={{ shape: null, difficulty: null }}
            onPlayAgain={onMpRematch}
            onCancelRematch={onCancelMpRematch}
            onMenu={onLeaveMpGame}
            onLobby={onMpBackToLobby}
            onStartShape={() => onLeaveMpGame()}
            myPlayer={myNum ?? undefined}
            finishedReason={onlineGame.finishedReason}
            opponentIsBot={pairing.opponentIsBot}
            opponentUid={pairing.opponentUid}
            opponentIsFriend={friends.some(
              (f) => f.uid === pairing.opponentUid,
            )}
            onAddOpponentAsFriend={
              !pairing.opponentIsBot
                ? () => sendFriendRequestByUid(pairing.opponentUid)
                : undefined
            }
            rematchLabel="Rematch"
            rematchMine={
              myNum
                ? onlineGame.rematch?.[String(myNum) as '1' | '2'] === true
                : false
            }
            rematchOpp={
              myNum
                ? onlineGame.rematch?.[
                    String(myNum === 1 ? 2 : 1) as '1' | '2'
                  ] === true
                : false
            }
            ratingChange={
              myNum && mpMatchRecord?.eloFinalized && mpMatchRecord.ranked
                ? {
                    before:
                      myNum === 1
                        ? mpMatchRecord.p1RatingBefore
                        : mpMatchRecord.p2RatingBefore,
                    after:
                      myNum === 1
                        ? mpMatchRecord.p1RatingAfter
                        : mpMatchRecord.p2RatingAfter,
                    delta:
                      myNum === 1
                        ? mpMatchRecord.p1RatingDelta
                        : mpMatchRecord.p2RatingDelta,
                  }
                : undefined
            }
          />
        )}
        {/* Invites are actionable from the results screen too (game is over, so
            it's not a distraction) — accepting routes via watchPairing like a
            rematch. Hidden during active play. */}
        {mpShowOver && user && (
          <IncomingInviteToast
            invites={incomingInvites}
            fromNames={Object.fromEntries(
              friends.map((f) => [f.uid, f.displayName]),
            )}
            onAccepted={() => {
              setFriendsOpen(false);
              setSendInviteFor(null);
            }}
          />
        )}
        {resignConfirmOpen && !mpState.finished && (
          <div
            className="confirm-overlay"
            role="dialog"
            aria-modal="true"
            onClick={() => setResignConfirmOpen(false)}
          >
            <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
              <h3>Resign?</h3>
              <p>You'll lose this game.</p>
              <div className="confirm-actions">
                <button onClick={() => setResignConfirmOpen(false)}>Cancel</button>
                <button className="danger" onClick={onConfirmResign}>Resign</button>
              </div>
            </div>
          </div>
        )}
        <AppFooter
          onOpenRules={() => setRulesOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenPrivacy={() => setPrivacyOpen(true)}
          onOpenChangelog={() => setChangelogOpen(true)}
          onOpenThemes={() => setThemeOpen(true)}
          version={APP_VERSION}
        />
        {rulesOpen && <RulesPopover onClose={() => setRulesOpen(false)} />}
        {privacyOpen && (
          <PrivacyPopover
            onClose={() => setPrivacyOpen(false)}
            consent={consent}
            onChangeConsent={changeAnalyticsConsent}
          />
        )}
        {changelogOpen && (
          <ChangelogPopover onClose={() => setChangelogOpen(false)} />
        )}
        {themeOpen && (
          <ThemePopover
            current={theme}
            onSelect={setTheme}
            onClose={() => setThemeOpen(false)}
          />
        )}
        {consent === null && (
          <ConsentBanner
            onAccept={acceptAnalytics}
            onDecline={declineAnalytics}
            onOpenPrivacy={() => setPrivacyOpen(true)}
          />
        )}
      </div>
    );
  }

  const isMenuScreen =
    screen === 'menu' ||
    screen === 'lobby' ||
    screen === 'matchmaking' ||
    screen === 'matchFound' ||
    !state ||
    !config;

  if (isMenuScreen) {
    let mainContent;
    if (screen === 'lobby') {
      mainContent = (
        <MultiplayerLobby
          rating={cloudProfile?.rating ?? 1000}
          rankedGamesPlayed={cloudProfile?.placementGamesPlayed ?? 0}
          onBack={onLeaveLobby}
          onFindMatch={onFindMatch}
        />
      );
    } else if (mpUnreachable && (screen === 'matchmaking' || screen === 'matchFound')) {
      // The server is unreachable from this network. Drop the user from
      // the matchmaking/matchFound flow and explain why instead of letting
      // them stare at a frozen "Searching for opponent" forever.
      mainContent = renderMpUnreachable({
        onLeave: () => {
          if (screen === 'matchmaking') void onCancelMatch();
          else void onLeaveMatch();
        },
      });
    } else if (screen === 'matchmaking' && queueTimeControl) {
      mainContent = (
        <MatchmakingWaiting
          timeControl={queueTimeControl}
          onCancel={onCancelMatch}
        />
      );
    } else if (screen === 'matchFound' && pairing) {
      mainContent = (
        <MatchFoundScreen
          pairing={pairing}
          myDisplayName={effectiveGameName ?? 'You'}
          myRating={cloudProfile?.rating ?? 1000}
          myReady={
            onlineGame?.ready?.[String(pairing.player) as '1' | '2'] === true
          }
          oppReady={
            onlineGame?.ready?.[
              String(pairing.player === 1 ? 2 : 1) as '1' | '2'
            ] === true
          }
          onMarkReady={onMarkReady}
          onStartPlaying={onStartPlaying}
          onLeave={onLeaveMatch}
        />
      );
    } else {
      const friendsOnlineCount = friends.filter(
        (f) => friendStatusMap[f.uid] && friendStatusMap[f.uid] !== 'offline',
      ).length;
      const friendsBadgeCount =
        incomingRequests.length + incomingInvites.length;
      mainContent = (
        <Menu
          progress={progress}
          settings={settings}
          gameName={effectiveGameName}
          user={user}
          onStart={startGame}
          onSettingsUpdate={updateSettings}
          onOpenRankings={() => setRankingsOpen(true)}
          onOpenSignIn={() => setSignInOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
          onSignOut={() => void onSignOutSafe()}
          onOpenMultiplayer={openMultiplayer}
          onOpenThemes={() => setThemeOpen(true)}
          mpLockedByOther={mpLockedByOther}
          mpUnreachable={mpUnreachable}
          friendsOnlineCount={friendsOnlineCount}
          friendsTotal={friends.length}
          friendsBadgeCount={friendsBadgeCount}
          onOpenFriends={() => setFriendsOpen(true)}
          onStartDailyPuzzle={startDailyPuzzle}
          myDailyAttempt={myDailyAttempt}
          onOpenPuzzleLeaderboard={user ? () => setPuzzleLbOpen(true) : undefined}
        />
      );
    }
    return (
      <>
        {mainContent}
        {(screen === 'menu' || screen === 'lobby' || screen === 'matchmaking') && (
          <AdBanner placement="menu" />
        )}
        <AppFooter
          onOpenRules={() => setRulesOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenPrivacy={() => setPrivacyOpen(true)}
          onOpenChangelog={() => setChangelogOpen(true)}
          onOpenThemes={() => setThemeOpen(true)}
          version={APP_VERSION}
        />
        {rulesOpen && <RulesPopover onClose={() => setRulesOpen(false)} />}
        {privacyOpen && (
          <PrivacyPopover
            onClose={() => setPrivacyOpen(false)}
            consent={consent}
            onChangeConsent={changeAnalyticsConsent}
          />
        )}
        {changelogOpen && (
          <ChangelogPopover onClose={() => setChangelogOpen(false)} />
        )}
        {themeOpen && (
          <ThemePopover
            current={theme}
            onSelect={setTheme}
            onClose={() => setThemeOpen(false)}
          />
        )}
        {consent === null && (
          <ConsentBanner
            onAccept={acceptAnalytics}
            onDecline={declineAnalytics}
            onOpenPrivacy={() => setPrivacyOpen(true)}
          />
        )}
        {settingsOpen && (
          <SettingsPopover
            settings={settings}
            cloudDisplayName={effectiveGameName}
            onChange={updateSettings}
            onResetProgress={onProgressResetWiped}
            onClose={() => setSettingsOpen(false)}
            challengePolicy={user ? cloudProfile?.challengePolicy : undefined}
            showPresence={user ? cloudProfile?.showPresence ?? true : undefined}
            onChangePrivacy={
              user && cloudProfile
                ? (next) => {
                    // Optimistic UI: update local state, write to Firestore in
                    // the background. If the write fails, log; revert is more
                    // trouble than it's worth for a non-critical preference.
                    setCloudProfile((prev) =>
                      prev ? { ...prev, ...next } : prev,
                    );
                    if (next.showPresence !== undefined) {
                      setPresenceEnabled(next.showPresence);
                    }
                    void updatePrivacy(next).catch((e) =>
                      console.warn('privacy update failed', e),
                    );
                  }
                : undefined
            }
          />
        )}
        {themeOpen && (
          <ThemePopover
            current={theme}
            onSelect={setTheme}
            onClose={() => setThemeOpen(false)}
          />
        )}
        {rankingsOpen && (
          <RankingsPopover
            onClose={() => setRankingsOpen(false)}
            user={user}
            onOpenSignIn={() => {
              setRankingsOpen(false);
              setSignInOpen(true);
            }}
          />
        )}
        {puzzleLbOpen && (
          <PuzzleLeaderboardPopover
            myUid={sbUser?.uid ?? null}
            onClose={() => setPuzzleLbOpen(false)}
          />
        )}
        {signInOpen && <SignInPopover onClose={() => setSignInOpen(false)} />}
        {!authLoading && !user && !gateDismissed && (
          <SignInPopover
            gate
            onClose={() => setGateDismissed(true)}
            onPlayAnonymous={() => setGateDismissed(true)}
          />
        )}
        {profileOpen && user && (
          <ProfilePopover
            user={user}
            settings={settings}
            cloudProfile={cloudProfile}
            onSignOut={() => void onSignOutSafe()}
            onRename={() => {
              setProfileOpen(false);
              setRenameOpen(true);
            }}
            onClose={() => setProfileOpen(false)}
            onAccountDeleted={() => {
              setProfileOpen(false);
              setScreen('menu');
              void onSignOutSafe();
            }}
          />
        )}
        {user && cloudProfileLoaded && !cloudProfile?.displayName && (
          <UsernamePicker
            mode="claim"
            uid={user.uid}
            initialName={suggestUsername(user.displayName, user.email)}
            seed={{
              email: user.email,
              authProvider: user.provider ?? null,
            }}
            onSuccess={(newName) => {
              setCloudProfile((prev) => ({
                email: prev?.email ?? user.email,
                authProvider:
                  prev?.authProvider ?? user.provider ?? null,
                createdAt: prev?.createdAt ?? null,
                displayName: newName,
                rating: prev?.rating ?? 1000,
                placementGamesPlayed: prev?.placementGamesPlayed ?? 0,
              }));
              void saveCloudProgress(user.uid, progress);
            }}
            onSignOut={() => void onSignOutSafe()}
          />
        )}
        {renameOpen && user && cloudProfile?.displayName && (
          <UsernamePicker
            mode="rename"
            uid={user.uid}
            initialName={cloudProfile.displayName}
            onSuccess={(newName) => {
              const oldName = cloudProfile.displayName ?? '';
              if (oldName && oldName !== newName) {
                migrateStatsKey(oldName, newName);
              }
              setCloudProfile((prev) =>
                prev ? { ...prev, displayName: newName } : prev,
              );
              setRenameOpen(false);
            }}
            onCancel={() => setRenameOpen(false)}
          />
        )}
        {/* IncomingInviteToast shows on menu/lobby (and on the results screen —
            see the mpgame branch). NOT during active gameplay or matchmaking, so
            it doesn't distract. The server delivers invites immediately; we just
            hold off displaying until the user is on a non-playing screen. */}
        {user && (screen === 'menu' || screen === 'lobby') && (
          <IncomingInviteToast
            invites={incomingInvites}
            fromNames={Object.fromEntries(
              friends.map((f) => [f.uid, f.displayName]),
            )}
            onAccepted={() => {
              // The acceptInvite callable already wrote the pairing doc; the
              // existing watchPairing subscription will fire and route us to
              // matchFound. Nothing to do here beyond closing surfaces.
              setFriendsOpen(false);
              setSendInviteFor(null);
            }}
          />
        )}
        {friendsOpen && user && (
          <FriendsPopover
            myUid={user.uid}
            friends={friends}
            statusMap={friendStatusMap}
            incoming={incomingRequests}
            outgoing={outgoingRequests}
            onClose={() => setFriendsOpen(false)}
            onInvite={(f) => {
              setFriendsOpen(false);
              setSendInviteFor(f);
            }}
          />
        )}
        {sendInviteFor && user && (
          <SendInviteDialog
            friend={sendInviteFor}
            friendStatus={friendStatusMap[sendInviteFor.uid] ?? 'offline'}
            hasActivePairing={pairing != null}
            onClose={() => setSendInviteFor(null)}
          />
        )}
      </>
    );
  }

  const hotseat = config.mode === 'hotseat';
  const colorSwap = hotseat && settings.hotseatColorSwap;

  const p1Name =
    user && cloudProfile?.displayName
      ? cloudProfile.displayName
      : settings.playerName || 'Player 1';
  const p2Name =
    config.mode === 'ai' || config.mode === 'daily'
      ? `AI · ${DIFFICULTY_LABELS[config.difficulty ?? 1]}`
      : settings.opponentName || 'Player 2';

  const p1Avatar: 'human' | { kind: 'guest'; label: string } = hotseat
    ? { kind: 'guest', label: p1Name.slice(0, 1).toUpperCase() }
    : 'human';
  const p2Avatar: { kind: 'ai'; level: Difficulty } | { kind: 'guest'; label: string } =
    (config.mode === 'ai' || config.mode === 'daily') && config.difficulty
      ? { kind: 'ai', level: config.difficulty }
      : { kind: 'guest', label: p2Name.slice(0, 1).toUpperCase() };

  const showOver = state.finished;
  const disabled =
    state.finished ||
    thinking ||
    ((config.mode === 'ai' || config.mode === 'daily') && state.current === 2);

  const remaining = totalPoints - state.scores[1] - state.scores[2];
  const p1Stats = getPlayerRow(p1Name);
  const p2StatsRow = config.mode === 'hotseat' ? getPlayerRow(p2Name) : null;

  const aiResignAvailable = (config.mode === 'ai' || config.mode === 'daily') && !state.finished;
  const backHandler = config.mode === 'ai' || config.mode === 'daily' ? onAiBackPressed : backToMenu;

  return (
    <div className="game-screen">
      <div className="game-topbar">
        <button className="btn-back" onClick={backHandler} aria-label="Back to menu">
          ‹
        </button>
        <div className="topbar-center">
          <div className="remaining-points">
            <span className="remaining-value">{remaining}</span>
            <span className="remaining-label">pts left</span>
          </div>
          <div
            className={`pending-indicator${state.pending.length === 0 ? ' pending-indicator-hidden' : ''}${pendingFlash ? ' pending-flash' : ''}`}
            title={state.pending.length > 0 ? 'Lines waiting to be claimed — tap a coloured dot on one to claim it.' : undefined}
            aria-hidden={state.pending.length === 0}
          >
            <span className="pending-icon" aria-hidden="true">◌</span>
            <span className="pending-value">{Math.max(state.pending.length, 1)}</span>
            <span className="pending-label">
              {state.pending.length === 1 ? 'line to claim' : 'lines to claim'}
            </span>
          </div>
          {showRingsToggle && (
            <button
              type="button"
              className={`btn-claim-toggle${ringsVisible ? ' on' : ' off'}`}
              onClick={onToggleRings}
              aria-pressed={ringsVisible}
              title={`See unclaimed lines: ${ringsVisible ? 'on' : 'off'}`}
            >
              <span className="claim-toggle-label">See unclaimed lines</span>
              <span className="claim-toggle-switch" aria-hidden="true">
                <span className="claim-toggle-knob" />
              </span>
            </button>
          )}
        </div>
        <button
          className="btn-rules"
          onClick={() => setRulesOpen(true)}
          aria-label="Show rules"
          title="How to play"
        >
          ?
        </button>
      </div>
      <div className="game-body">
        <SidePanel
          side="left"
          player={1}
          active={!state.finished && state.current === 1}
          name={p1Name}
          score={state.scores[1]}
          avatar={p1Avatar}
          colorSwap={colorSwap}
          stats={p1Stats}
          actionSlot={
            aiResignAvailable ? (
              <button
                className="btn-resign-inline"
                onClick={() => setResignConfirmOpen(true)}
                title="Resign and end the game"
              >
                Resign
              </button>
            ) : null
          }
        />
        <Board
          state={state}
          onDotClick={handleDotClick}
          onClaimClick={handleClaimClick}
          disabled={disabled}
          lastDot={lastDot}
          colorSwap={colorSwap}
          showHints={ringsVisible && !disabled}
          scoreEvent={scoreEvent}
          hint={activeHint}
          onDismissHint={() => setActiveHint(null)}
        />
        <SidePanel
          side="right"
          player={2}
          active={!state.finished && state.current === 2}
          thinking={thinking}
          name={p2Name}
          score={state.scores[2]}
          avatar={p2Avatar}
          colorSwap={colorSwap}
          stats={p2StatsRow}
        />
      </div>
      <AdBanner placement="ingame" />
      {showOver && (
        <GameOver
          state={state}
          mode={config.mode}
          shape={config.shape}
          difficulty={config.difficulty}
          p1Name={p1Name}
          p2Name={p2Name}
          unlock={unlockInfo}
          onPlayAgain={playAgain}
          onMenu={backToMenu}
          onStartShape={(s, d) => startGame('ai', s, d)}
          dailyResult={dailyPuzzleResult}
          onTryDailyAgain={startDailyPuzzle}
          onOpenPuzzleLeaderboard={() => setPuzzleLbOpen(true)}
        />
      )}
      {puzzleLbOpen && (
        <PuzzleLeaderboardPopover
          myUid={sbUser?.uid ?? null}
          onClose={() => setPuzzleLbOpen(false)}
        />
      )}
      {resignConfirmOpen && (config.mode === 'ai' || config.mode === 'daily') && !state.finished && (
        <div
          className="confirm-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setResignConfirmOpen(false)}
        >
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <h3>Resign?</h3>
            <p>You'll lose this game.</p>
            <div className="confirm-actions">
              <button onClick={() => setResignConfirmOpen(false)}>Cancel</button>
              <button className="danger" onClick={onConfirmResign}>Resign</button>
            </div>
          </div>
        </div>
      )}
      <AppFooter
        onOpenRules={() => setRulesOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenPrivacy={() => setPrivacyOpen(true)}
        onOpenChangelog={() => setChangelogOpen(true)}
        onOpenThemes={() => setThemeOpen(true)}
        version={APP_VERSION}
      />
      {rulesOpen && <RulesPopover onClose={() => setRulesOpen(false)} />}
      {privacyOpen && (
        <PrivacyPopover
          onClose={() => setPrivacyOpen(false)}
          consent={consent}
          onChangeConsent={changeAnalyticsConsent}
        />
      )}
      {changelogOpen && (
        <ChangelogPopover onClose={() => setChangelogOpen(false)} />
      )}
      {themeOpen && (
        <ThemePopover
          current={theme}
          onSelect={setTheme}
          onClose={() => setThemeOpen(false)}
        />
      )}
      {consent === null && (
        <ConsentBanner
          onAccept={acceptAnalytics}
          onDecline={declineAnalytics}
          onOpenPrivacy={() => setPrivacyOpen(true)}
        />
      )}
      {settingsOpen && (
        <SettingsPopover
          settings={settings}
          cloudDisplayName={effectiveGameName}
          onChange={updateSettings}
          onResetProgress={onProgressResetWiped}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {signInOpen && <SignInPopover onClose={() => setSignInOpen(false)} />}
      {profileOpen && user && (
        <ProfilePopover
          user={user}
          settings={settings}
          cloudProfile={cloudProfile}
          onSignOut={() => void onSignOutSafe()}
          onRename={() => {
            setProfileOpen(false);
            setRenameOpen(true);
          }}
          onClose={() => setProfileOpen(false)}
          onAccountDeleted={() => {
            setProfileOpen(false);
            setScreen('menu');
            void onSignOutSafe();
          }}
        />
      )}
      {user && cloudProfileLoaded && !cloudProfile?.displayName && (
        <UsernamePicker
          mode="claim"
          uid={user.uid}
          initialName={suggestUsername(user.displayName, user.email)}
          seed={{
            email: user.email,
            authProvider: user.provider ?? null,
          }}
          onSuccess={(newName) => {
            setCloudProfile((prev) => ({
              email: prev?.email ?? user.email,
              authProvider:
                prev?.authProvider ?? user.provider ?? null,
              createdAt: prev?.createdAt ?? null,
              displayName: newName,
              rating: prev?.rating ?? 1000,
              placementGamesPlayed: prev?.placementGamesPlayed ?? 0,
            }));
            void saveCloudProgress(user.uid, progress);
          }}
          onSignOut={() => void onSignOutSafe()}
        />
      )}
      {renameOpen && user && cloudProfile?.displayName && (
        <UsernamePicker
          mode="rename"
          uid={user.uid}
          initialName={cloudProfile.displayName}
          onSuccess={(newName) => {
            const oldName = cloudProfile.displayName ?? '';
            if (oldName && oldName !== newName) {
              migrateStatsKey(oldName, newName);
            }
            setCloudProfile((prev) =>
              prev ? { ...prev, displayName: newName } : prev,
            );
            setRenameOpen(false);
          }}
          onCancel={() => setRenameOpen(false)}
        />
      )}
    </div>
  );
}
