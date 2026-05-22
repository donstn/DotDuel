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

type Screen = 'menu' | 'game';

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

  if (screen === 'menu' || !state || !config) {
    return (
      <>
        <Menu
          progress={progress}
          settings={settings}
          gameName={effectiveGameName}
          onStart={startGame}
          onSettingsUpdate={updateSettings}
          onOpenRankings={() => setRankingsOpen(true)}
        />
        <AppFooter
          onOpenRules={() => setRulesOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          user={user}
          onOpenSignIn={() => setSignInOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
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
        user={user}
        onOpenSignIn={() => setSignInOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
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
