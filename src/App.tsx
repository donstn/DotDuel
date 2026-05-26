import { useEffect, useMemo, useRef, useState } from 'react';
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
import { TutorialPopover } from './components/TutorialPopover';
import { SignInPopover } from './auth/SignInPopover';
import { useAuth } from './auth/useAuth';
import { saveCloudProgress, syncOnSignIn } from './cloud/progressSync';
import {
  suggestUsername,
  watchProfile,
  type CloudProfile,
} from './cloud/usernames';
import {
  cancelQueue,
  clearPairing,
  joinQueue,
  watchPairing,
  type PairingDoc,
  type TimeControl,
} from './cloud/matchmaking';
import {
  claimTimeout,
  markBoardLoaded,
  markReady,
  playerNumFor,
  requestRematch,
  sendMove,
  sendResign,
  watchError,
  watchGame,
  type OnlineError,
  type OnlineGame,
} from './cloud/onlineGame';
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
import { loadTheme, saveTheme, type ThemeId } from './theme';
import {
  applyConsent,
  loadConsent,
  saveConsent,
  type Consent,
} from './consent';
import { pickAIAction } from './ai';
import { applyAction, applyClaim, applyMove, createGame } from './game';
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
  type Settings,
} from './storage';
import { DIFFICULTY_LABELS } from './types';
import type { Difficulty, GameMode, GameState, Progress, ShapeId } from './types';
import { APP_VERSION } from './version';

type Screen = 'menu' | 'game' | 'lobby' | 'matchmaking' | 'matchFound' | 'mpgame';

interface SessionConfig {
  mode: GameMode;
  shape: ShapeId;
  difficulty?: Difficulty;
}

const AI_DELAY_MS = 450;
const HINT_GAME_LIMIT = 10;
const HINT_CLAIM_LIMIT = 3;

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
  const [mpMatchRecord, setMpMatchRecord] = useState<MatchRecord | null>(null);
  const mySessionIdRef = useRef<string>(getSessionId());
  const [activeGameSession, setActiveGameSession] =
    useState<GameSession | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(() => !loadSettings().tutorialSeen);
  const [resignConfirmOpen, setResignConfirmOpen] = useState(false);
  const [theme, setThemeState] = useState<ThemeId>(loadTheme);
  const [themeOpen, setThemeOpen] = useState(false);
  const [consent, setConsentState] = useState<Consent | null>(loadConsent);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const { user, signOut } = useAuth();
  const aiTimer = useRef<number | null>(null);
  const winRecorded = useRef(false);
  const gameEndCounted = useRef(false);
  const claimsInGame = useRef(0);

  const updateSettings = (next: Settings) => {
    setSettings(next);
    saveSettings(next);
  };

  const dismissTutorial = () => {
    setTutorialOpen(false);
    if (!settings.tutorialSeen) {
      updateSettings({ ...settings, tutorialSeen: true });
    }
  };

  const startGame = (mode: GameMode, shape: ShapeId, difficulty?: Difficulty) => {
    if (aiTimer.current !== null) {
      clearTimeout(aiTimer.current);
      aiTimer.current = null;
    }
    winRecorded.current = false;
    gameEndCounted.current = false;
    claimsInGame.current = 0;
    setConfig({ mode, shape, difficulty });
    setState(createGame(shape, mode, difficulty));
    setLastDot(null);
    setUnlockInfo({ shape: null, difficulty: null });
    setThinking(false);
    setScreen('game');
  };

  const backToMenu = () => {
    if (aiTimer.current !== null) {
      clearTimeout(aiTimer.current);
      aiTimer.current = null;
    }
    winRecorded.current = false;
    gameEndCounted.current = false;
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
    if (!(config.mode === 'ai' && state.current === 2 && config.difficulty)) return;

    setThinking(true);
    const diff = config.difficulty;
    const snapshot = state;
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
      const next = applyAction(snapshot, action);
      if (action.kind === 'dot') setLastDot(action.dotId);
      setState(next);
      setThinking(false);
    }, AI_DELAY_MS);

    return () => {
      if (aiTimer.current !== null) {
        clearTimeout(aiTimer.current);
        aiTimer.current = null;
      }
    };
  }, [state, config]);

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
    if (!user) return;
    let cancelled = false;
    void syncOnSignIn(user.uid).then((merged) => {
      if (cancelled || !merged) return;
      setProgress(merged);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  // Live subscription to users/{uid} — auto-updates display name across tabs.
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

  // When a pairing arrives while waiting (or even while on the menu — handles
  // reconnect mid-search), jump to matchFound.
  useEffect(() => {
    if (!pairing) return;
    if (screen === 'matchmaking' || screen === 'menu' || screen === 'lobby') {
      setScreen('matchFound');
    }
  }, [pairing, screen]);

  const mySessionId = mySessionIdRef.current;
  const mpLockedByOther =
    !!activeGameSession && activeGameSession.sessionId !== mySessionId;

  const openMultiplayer = async () => {
    if (!user || mpLockedByOther) return;
    try {
      await claimSession(user.uid, mySessionId);
    } catch (e) {
      console.warn('claimSession failed:', e);
    }
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

  const onCancelMatch = async () => {
    if (user) await cancelQueue(user.uid);
    setQueueTimeControl(null);
    setScreen('lobby');
  };

  const onLeaveMatch = async () => {
    if (user) {
      await clearPairing(user.uid);
      await releaseSession(user.uid);
    }
    setPairing(null);
    setQueueTimeControl(null);
    setScreen('menu');
  };

  const onLeaveLobby = async () => {
    if (user) await releaseSession(user.uid);
    setScreen('menu');
  };

  const onSignOutSafe = async () => {
    if (user) {
      try {
        await releaseSession(user.uid);
      } catch (e) {
        console.warn('releaseSession on sign-out failed:', e);
      }
    }
    await signOut();
  };

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

  const onLeaveMpGame = async () => {
    // Clear any pending rematch flag so we're not pulled into a spawn
    // after we've decided to leave.
    if (onlineGame && onlineGameId && user) {
      const slot = playerNumFor(onlineGame, user.uid);
      if (slot) {
        try {
          await requestRematch(onlineGameId, slot, false);
        } catch (e) {
          console.warn('rematch flag clear failed on leave:', e);
        }
      }
    }
    if (user) {
      await clearPairing(user.uid);
      await releaseSession(user.uid);
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
      config?.mode === 'ai' &&
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
    }
  }, [onlineGame?.state.turn, optimisticMpState]);

  // Server-side rejection of a move: revert optimistic state and unlock board.
  useEffect(() => {
    if (!onlineError) return;
    setOptimisticMpState(null);
    setMoveInFlight(false);
  }, [onlineError?.ts]);

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
  }, [screen, onlineGameId, onlineGame, pairing, user]);

  const handleMpDotClick = async (dotId: number) => {
    if (!user || !onlineGameId || !onlineGame) return;
    const myNum = playerNumFor(onlineGame, user.uid);
    if (!myNum) return;
    const baseState = optimisticMpState?.state ?? onlineGame.state;
    if (baseState.current !== myNum) return;
    if (moveInFlight) return;
    if (baseState.colored[dotId]) return;
    setMoveInFlight(true);
    // Note: we do NOT setLastDot here. The "last move" highlight is
    // reserved for the OPPONENT's most recent placement, picked up by
    // the state-diff effect below.
    try {
      const next = applyAction(baseState, { kind: 'dot', dotId });
      setOptimisticMpState({ baseTurn: baseState.turn, state: next });
    } catch (e) {
      console.warn('local applyAction failed:', e);
      setMoveInFlight(false);
      return;
    }
    try {
      await sendMove(onlineGameId, user.uid, { kind: 'dot', dotId });
    } catch (e) {
      console.warn('sendMove failed:', e);
      setMoveInFlight(false);
      setOptimisticMpState(null);
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
    setMoveInFlight(true);
    try {
      const next = applyAction(baseState, { kind: 'claim', lineId });
      setOptimisticMpState({ baseTurn: baseState.turn, state: next });
    } catch (e) {
      console.warn('local applyAction failed:', e);
      setMoveInFlight(false);
      return;
    }
    try {
      await sendMove(onlineGameId, user.uid, { kind: 'claim', lineId });
    } catch (e) {
      console.warn('sendMove failed:', e);
      setMoveInFlight(false);
      setOptimisticMpState(null);
    }
  };

  const handleDotClick = (dotId: number) => {
    if (!state || !config || state.finished) return;
    if (thinking) return;
    if (config.mode === 'ai' && state.current === 2) return;
    if (state.colored[dotId]) return;
    const result = applyMove(state, dotId);
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
    if (config.mode === 'ai' && state.current === 2) return;
    if (!state.pending.includes(lineId)) return;
    const result = applyClaim(state, lineId);
    claimsInGame.current += 1;
    setState(result.state);
  };

  const totalPoints = useMemo(() => {
    if (!config) return 0;
    return getBoard(config.shape).lines.reduce((sum, l) => sum + l.length, 0);
  }, [config]);

  const showLearningHints =
    settings.gamesPlayed < HINT_GAME_LIMIT || settings.claimsMade < HINT_CLAIM_LIMIT;

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
    const mpTotalPoints = getBoard(mpShape).lines.reduce((sum, l) => sum + l.length, 0);
    const mpRemaining = mpTotalPoints - mpState.scores[1] - mpState.scores[2];
    const mpShowOver = mpState.finished;
    const mpDisabled =
      mpState.finished || moveInFlight || (myNum !== null && mpState.current !== myNum);
    const clock = onlineGame.clock;
    const clockRunning = !mpState.finished && (clock?.turnStartedAt ?? 0) > 0;
    const p1Clock = clock ? (
      <ClockBadge
        remainingAtRefMs={clock.p1RemainingMs}
        refTime={clock.turnStartedAt}
        isRunning={clockRunning && mpState.current === 1}
      />
    ) : null;
    const p2Clock = clock ? (
      <ClockBadge
        remainingAtRefMs={clock.p2RemainingMs}
        refTime={clock.turnStartedAt}
        isRunning={clockRunning && mpState.current === 2}
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
              className={`pending-indicator${mpState.pending.length === 0 ? ' pending-indicator-hidden' : ''}`}
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
            avatar="human"
            stats={null}
            ratingSlot={p1Clock}
            belowAvatar={<span className="player-elo">{mpP1Elo}</span>}
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
          />
          <SidePanel
            side="right"
            player={2}
            active={!mpState.finished && mpState.current === 2}
            name={mpP2Name}
            score={mpState.scores[2]}
            avatar="human"
            stats={null}
            ratingSlot={p2Clock}
            belowAvatar={<span className="player-elo">{mpP2Elo}</span>}
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
              myNum && mpMatchRecord?.eloFinalized
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
        />
      );
    }
    return (
      <>
        {mainContent}
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
              authProvider: user.providerData[0]?.providerId ?? null,
            }}
            onSuccess={(newName) => {
              setCloudProfile((prev) => ({
                email: prev?.email ?? user.email,
                authProvider:
                  prev?.authProvider ?? user.providerData[0]?.providerId ?? null,
                createdAt: prev?.createdAt ?? null,
                displayName: newName,
                rating: prev?.rating ?? 1000,
                placementGamesPlayed: prev?.placementGamesPlayed ?? 0,
              }));
            }}
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
        {tutorialOpen && <TutorialPopover onDismiss={dismissTutorial} />}
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
    config.mode === 'ai'
      ? `AI · ${DIFFICULTY_LABELS[config.difficulty ?? 1]}`
      : settings.opponentName || 'Player 2';

  const p1Avatar: 'human' | { kind: 'guest'; label: string } = hotseat
    ? { kind: 'guest', label: p1Name.slice(0, 1).toUpperCase() }
    : 'human';
  const p2Avatar: { kind: 'ai'; level: Difficulty } | { kind: 'guest'; label: string } =
    config.mode === 'ai' && config.difficulty
      ? { kind: 'ai', level: config.difficulty }
      : { kind: 'guest', label: p2Name.slice(0, 1).toUpperCase() };

  const showOver = state.finished;
  const disabled =
    state.finished ||
    thinking ||
    (config.mode === 'ai' && state.current === 2);

  const remaining = totalPoints - state.scores[1] - state.scores[2];
  const p1Stats = getPlayerRow(p1Name);
  const p2StatsRow = config.mode === 'hotseat' ? getPlayerRow(p2Name) : null;

  const aiResignAvailable = config.mode === 'ai' && !state.finished;
  const backHandler = config.mode === 'ai' ? onAiBackPressed : backToMenu;

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
            className={`pending-indicator${state.pending.length === 0 ? ' pending-indicator-hidden' : ''}`}
            title={state.pending.length > 0 ? 'Lines waiting to be claimed — tap a coloured dot on one to claim it.' : undefined}
            aria-hidden={state.pending.length === 0}
          >
            <span className="pending-icon" aria-hidden="true">◌</span>
            <span className="pending-value">{Math.max(state.pending.length, 1)}</span>
            <span className="pending-label">
              {state.pending.length === 1 ? 'line to claim' : 'lines to claim'}
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
          showHints={showLearningHints && !disabled}
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
        />
      )}
      {resignConfirmOpen && config.mode === 'ai' && !state.finished && (
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
            authProvider: user.providerData[0]?.providerId ?? null,
          }}
          onSuccess={(newName) => {
            setCloudProfile((prev) => ({
              email: prev?.email ?? user.email,
              authProvider:
                prev?.authProvider ?? user.providerData[0]?.providerId ?? null,
              createdAt: prev?.createdAt ?? null,
              displayName: newName,
              rating: prev?.rating ?? 1000,
              placementGamesPlayed: prev?.placementGamesPlayed ?? 0,
            }));
          }}
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
