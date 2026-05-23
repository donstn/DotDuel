import { useEffect, useMemo, useRef, useState } from 'react';
import { AppFooter } from './components/AppFooter';
import { Board } from './components/Board';
import { GameOver } from './components/GameOver';
import { Menu } from './components/Menu';
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
  markReady,
  playerNumFor,
  sendMove,
  watchError,
  watchGame,
  type OnlineError,
  type OnlineGame,
} from './cloud/onlineGame';
import { MatchFoundScreen } from './components/MatchFoundScreen';
import { MatchmakingWaiting } from './components/MatchmakingWaiting';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { UsernamePicker } from './components/UsernamePicker';
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
  const [, setOnlineError] = useState<OnlineError | null>(null);
  const [moveInFlight, setMoveInFlight] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(() => !loadSettings().tutorialSeen);
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

  // Live subscription to pairings/{uid} — drives matchmaking → matchFound transition.
  useEffect(() => {
    if (!user) {
      setPairing(null);
      return;
    }
    return watchPairing(user.uid, (p) => setPairing(p));
  }, [user?.uid]);

  // When a pairing arrives while waiting (or even while on the menu — handles
  // reconnect mid-search), jump to matchFound.
  useEffect(() => {
    if (!pairing) return;
    if (screen === 'matchmaking' || screen === 'menu' || screen === 'lobby') {
      setScreen('matchFound');
    }
  }, [pairing, screen]);

  const openMultiplayer = () => {
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
    if (user) await clearPairing(user.uid);
    setPairing(null);
    setQueueTimeControl(null);
    setScreen('menu');
  };

  const onStartPlaying = () => {
    setMoveInFlight(false);
    setScreen('mpgame');
  };

  const onMarkReady = async () => {
    if (!pairing || !onlineGameId) return;
    try {
      await markReady(onlineGameId, pairing.player, true);
    } catch (e) {
      console.warn('markReady failed:', e);
    }
  };

  const onLeaveMpGame = async () => {
    if (user) await clearPairing(user.uid);
    setPairing(null);
    setOnlineGameId(null);
    setOnlineGame(null);
    setOnlineError(null);
    setMoveInFlight(false);
    setQueueTimeControl(null);
    setScreen('menu');
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

  // Server-confirmed state advance clears the in-flight flag.
  useEffect(() => {
    setMoveInFlight(false);
  }, [onlineGame?.state.turn]);

  const handleMpDotClick = async (dotId: number) => {
    if (!user || !onlineGameId || !onlineGame) return;
    const myNum = playerNumFor(onlineGame, user.uid);
    if (!myNum) return;
    if (onlineGame.state.current !== myNum) return;
    if (moveInFlight) return;
    if (onlineGame.state.colored[dotId]) return;
    setMoveInFlight(true);
    setLastDot(dotId);
    try {
      await sendMove(onlineGameId, user.uid, { kind: 'dot', dotId });
    } catch (e) {
      console.warn('sendMove failed:', e);
      setMoveInFlight(false);
    }
  };

  const handleMpClaimClick = async (lineId: string) => {
    if (!user || !onlineGameId || !onlineGame) return;
    const myNum = playerNumFor(onlineGame, user.uid);
    if (!myNum) return;
    if (onlineGame.state.current !== myNum) return;
    if (moveInFlight) return;
    if (!onlineGame.state.pending.includes(lineId)) return;
    setMoveInFlight(true);
    try {
      await sendMove(onlineGameId, user.uid, { kind: 'claim', lineId });
    } catch (e) {
      console.warn('sendMove failed:', e);
      setMoveInFlight(false);
    }
  };

  const handleDotClick = (dotId: number) => {
    if (!state || !config || state.finished) return;
    if (thinking) return;
    if (config.mode === 'ai' && state.current === 2) return;
    if (state.colored[dotId]) return;
    const result = applyMove(state, dotId);
    setLastDot(dotId);
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
    const mpState = onlineGame.state;
    const mpShape = onlineGame.shape;
    const myName = effectiveGameName ?? 'You';
    const oppName = pairing.opponentDisplayName;
    const mpP1Name = pairing.player === 1 ? oppName : myName;
    const mpP2Name = pairing.player === 1 ? myName : oppName;
    const mpTotalPoints = getBoard(mpShape).lines.reduce((sum, l) => sum + l.length, 0);
    const mpRemaining = mpTotalPoints - mpState.scores[1] - mpState.scores[2];
    const mpShowOver = mpState.finished;
    const mpDisabled =
      mpState.finished || moveInFlight || (myNum !== null && mpState.current !== myNum);

    return (
      <div className="game-screen">
        <div className="game-topbar">
          <button className="btn-back" onClick={onLeaveMpGame} aria-label="Leave match">
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
            onPlayAgain={onLeaveMpGame}
            onMenu={onLeaveMpGame}
            onStartShape={() => onLeaveMpGame()}
          />
        )}
        <AppFooter
          onOpenRules={() => setRulesOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          version={APP_VERSION}
        />
        {rulesOpen && <RulesPopover onClose={() => setRulesOpen(false)} />}
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
          onBack={() => setScreen('menu')}
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
          onSignOut={() => void signOut()}
          onOpenMultiplayer={openMultiplayer}
        />
      );
    }
    return (
      <>
        {mainContent}
        <AppFooter
          onOpenRules={() => setRulesOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          version={APP_VERSION}
        />
        {rulesOpen && <RulesPopover onClose={() => setRulesOpen(false)} />}
        {settingsOpen && (
          <SettingsPopover
            settings={settings}
            cloudDisplayName={effectiveGameName}
            onChange={updateSettings}
            onResetProgress={onProgressResetWiped}
            onClose={() => setSettingsOpen(false)}
          />
        )}
        {rankingsOpen && <RankingsPopover onClose={() => setRankingsOpen(false)} />}
        {signInOpen && <SignInPopover onClose={() => setSignInOpen(false)} />}
        {profileOpen && user && (
          <ProfilePopover
            user={user}
            settings={settings}
            cloudDisplayName={cloudProfile?.displayName ?? null}
            onSignOut={() => void signOut()}
            onRename={() => {
              setProfileOpen(false);
              setRenameOpen(true);
            }}
            onClose={() => setProfileOpen(false)}
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

  return (
    <div className="game-screen">
      <div className="game-topbar">
        <button className="btn-back" onClick={backToMenu} aria-label="Back to menu">
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
      <AppFooter
        onOpenRules={() => setRulesOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        version={APP_VERSION}
      />
      {rulesOpen && <RulesPopover onClose={() => setRulesOpen(false)} />}
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
          cloudDisplayName={cloudProfile?.displayName ?? null}
          onSignOut={() => void signOut()}
          onRename={() => {
            setProfileOpen(false);
            setRenameOpen(true);
          }}
          onClose={() => setProfileOpen(false)}
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
