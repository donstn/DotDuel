import { useState } from 'react';
import type { AppUser } from '../auth/AppUser';
import { availableDifficulties, isUnlocked } from '../storage';
import type { Settings } from '../storage';
import { DIFFICULTY_LABELS, PLAYABLE_SHAPE_META, SHAPE_META } from '../types';
import type { Difficulty, GameMode, Progress, ShapeId } from '../types';
import { FriendsButton } from './FriendsButton';
import { TellAFriendButton } from './TellAFriendButton';
import type { MyDailyAttempt } from '../cloud/dailyLeaderboard';
import { MAX_ATTEMPTS_PER_DAY } from '../cloud/dailyPuzzleResult';

interface Props {
  progress: Progress;
  settings: Settings;
  gameName: string | null;
  user: AppUser | null;
  onStart: (mode: GameMode, shape: ShapeId, difficulty?: Difficulty) => void;
  onSettingsUpdate: (next: Settings) => void;
  onOpenRankings: () => void;
  onOpenSignIn: () => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
  onOpenMultiplayer: () => void;
  onOpenThemes: () => void;
  mpLockedByOther: boolean;
  mpUnreachable: boolean;
  // Friends button (Alpha 0.2.0.0) — only meaningful when signed in.
  friendsOnlineCount?: number;
  friendsTotal?: number;
  friendsBadgeCount?: number;
  onOpenFriends?: () => void;
  // Phase 2b (Alpha 0.2.6.0+) — daily puzzle. Signed-in only; anonymous
  // visitors see the card but it routes to Sign-in. myDailyAttempt drives
  // the 3-state card (not started / in progress N/3 / done 3/3 with best).
  onStartDailyPuzzle?: () => void;
  myDailyAttempt?: MyDailyAttempt | null;
  // 2b-v2: open the public puzzle leaderboard popover.
  onOpenPuzzleLeaderboard?: () => void;
}

export function Menu({
  progress,
  settings,
  gameName,
  user,
  onStart,
  onSettingsUpdate,
  onOpenRankings,
  onOpenSignIn,
  onOpenProfile,
  onSignOut,
  onOpenMultiplayer,
  onOpenThemes,
  mpLockedByOther,
  mpUnreachable,
  friendsOnlineCount = 0,
  friendsTotal = 0,
  friendsBadgeCount = 0,
  onOpenFriends,
  onStartDailyPuzzle,
  myDailyAttempt = null,
  onOpenPuzzleLeaderboard,
}: Props) {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [shape, setShape] = useState<ShapeId | null>(null);
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty | null>(null);

  if (!mode) {
    const welcomeName = gameName ?? user?.email?.split('@')[0] ?? null;
    return (
      <div className="menu">
        <button
          type="button"
          className="menu-theme-btn"
          onClick={onOpenThemes}
          aria-label="Change colour theme"
          title="Change colour theme"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
            <path
              fill="currentColor"
              d="M12 3a9 9 0 0 0 0 18 1.5 1.5 0 0 0 1.16-2.46 1.5 1.5 0 0 1 1.16-2.46H17a4 4 0 0 0 4-4c0-4.97-4.03-9-9-9zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
            />
          </svg>
        </button>
        <h1 className="title">
          <span className="title-dot title-dot-1">●</span>
          <span className="title-text">DotDuel</span>
          <span className="title-dot title-dot-2">●</span>
        </h1>
        <p className="subtitle">
          {user && welcomeName ? (
            <>
              Welcome, <strong className="menu-welcome-name">{welcomeName}</strong> —{' '}
              take turns placing dots, finish a line to score points for its length. Win by scoring most points while coloring the whole board.
            </>
          ) : (
            <>
              Take turns placing dots, finish a line to score points for its length. Win by scoring most points while coloring the whole board.
            </>
          )}
        </p>
        <div className="menu-auth-row">
          {user ? (
            <>
              <button
                type="button"
                className="menu-auth-btn"
                onClick={onOpenProfile}
              >
                Profile
              </button>
              {onOpenFriends && (
                <FriendsButton
                  onlineCount={friendsOnlineCount}
                  totalFriends={friendsTotal}
                  badgeCount={friendsBadgeCount}
                  onClick={onOpenFriends}
                />
              )}
              <TellAFriendButton
                variant="invite"
                myUid={user.uid}
                className="menu-auth-btn"
              />
              <button
                type="button"
                className="menu-auth-btn"
                onClick={onSignOut}
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              className="menu-auth-btn menu-auth-btn-cta"
              onClick={onOpenSignIn}
            >
              Sign in
            </button>
          )}
        </div>
        {!user && (
          <div className="menu-share-row">
            <TellAFriendButton variant="share" className="menu-share-link" />
          </div>
        )}
        <div className="menu-section">
          <div className="menu-grid">
            <button className="menu-card" onClick={() => setMode('ai')}>
              <strong>Vs AI</strong>
              <span>Play against the bot.</span>
            </button>
            <button className="menu-card" onClick={() => setMode('hotseat')}>
              <strong>Hot-seat</strong>
              <span>Two players, one device.</span>
            </button>
            {user ? (
              mpUnreachable ? (
                <button
                  className="menu-card disabled"
                  disabled
                  title="Your network is blocking the game server (likely an ad/tracker blocker or DNS filter)"
                >
                  <strong>Multiplayer</strong>
                  <span>Server unreachable — your network may be blocking it.</span>
                </button>
              ) : mpLockedByOther ? (
                <button
                  className="menu-card disabled"
                  disabled
                  title="You have a multiplayer session open on another tab or device"
                >
                  <strong>Multiplayer</strong>
                  <span>Active on another tab/device — finish or close it there.</span>
                </button>
              ) : (
                <button
                  className="menu-card"
                  onClick={onOpenMultiplayer}
                >
                  <strong>Multiplayer</strong>
                  <span>Find a ranked match.</span>
                </button>
              )
            ) : (
              <button
                className="menu-card disabled"
                disabled
                title="Sign in to play multiplayer"
              >
                <strong>Multiplayer</strong>
                <span>Sign in to play.</span>
              </button>
            )}
            {user && onStartDailyPuzzle ? (
              (() => {
                const attempts = myDailyAttempt?.attempts ?? 0;
                const best = myDailyAttempt?.best;
                const exhausted = attempts >= MAX_ATTEMPTS_PER_DAY;
                if (exhausted) {
                  return (
                    <button
                      className="menu-card disabled"
                      disabled
                      title="All 3 attempts used. Come back tomorrow."
                    >
                      <strong>Today&rsquo;s puzzle</strong>
                      <span>
                        ✓ Done · best {(best ?? 0) > 0 ? '+' : ''}
                        {best ?? 0} · resets midnight UTC
                      </span>
                    </button>
                  );
                }
                if (attempts > 0) {
                  return (
                    <button className="menu-card" onClick={onStartDailyPuzzle}>
                      <strong>Today&rsquo;s puzzle</strong>
                      <span>
                        Attempt {attempts + 1}/{MAX_ATTEMPTS_PER_DAY} · best{' '}
                        {(best ?? 0) > 0 ? '+' : ''}
                        {best ?? 0}
                      </span>
                    </button>
                  );
                }
                return (
                  <button className="menu-card" onClick={onStartDailyPuzzle}>
                    <strong>Today&rsquo;s puzzle</strong>
                    <span>
                      {MAX_ATTEMPTS_PER_DAY} attempts. Beat the AI by the biggest margin.
                    </span>
                  </button>
                );
              })()
            ) : (
              <button
                className="menu-card disabled"
                disabled
                title="Sign in to play today's puzzle"
              >
                <strong>Today&rsquo;s puzzle</strong>
                <span>Sign in to play.</span>
              </button>
            )}
            {onOpenPuzzleLeaderboard && (
              user ? (
                <button className="menu-card" onClick={onOpenPuzzleLeaderboard}>
                  <strong>Puzzle leaderboard</strong>
                  <span>Today&rsquo;s best margins.</span>
                </button>
              ) : (
                <button
                  className="menu-card disabled"
                  disabled
                  title="Sign in to view"
                >
                  <strong>Puzzle leaderboard</strong>
                  <span>Sign in to view.</span>
                </button>
              )
            )}
          </div>
          <button className="menu-card menu-card-rank" onClick={onOpenRankings}>
            <strong>Rankings</strong>
            <span>Your records and head-to-head.</span>
          </button>
        </div>      </div>
    );
  }

  if (mode === 'hotseat' && !shape) {
    return (
      <div className="menu">
        <button className="link-btn back-link" onClick={() => setMode(null)}>‹ Back</button>
        <h2>Choose shape</h2>
        <div className="menu-grid">
          {PLAYABLE_SHAPE_META.map((s) => (
            <button
              key={s.id}
              className="menu-card"
              onClick={() => setShape(s.id)}
            >
              <strong>{s.label}</strong>
              <span>{s.dots} dots</span>
            </button>
          ))}
        </div>      </div>
    );
  }

  if (mode === 'hotseat' && shape) {
    return (
      <HotseatSetup
        shape={shape}
        settings={settings}
        lockedP1Name={gameName}
        onBack={() => setShape(null)}
        onStart={(p1, p2, swap) => {
          const nextSettings: Settings = {
            ...settings,
            opponentName: p2,
            hotseatColorSwap: swap,
          };
          if (!gameName) nextSettings.playerName = p1;
          onSettingsUpdate(nextSettings);
          onStart('hotseat', shape);
        }}
      />
    );
  }

  if (mode === 'ai' && !shape) {
    return (
      <div className="menu">
        <button className="link-btn back-link" onClick={() => setMode(null)}>‹ Back</button>
        <h2>Choose shape</h2>
        <div className="menu-grid">
          {PLAYABLE_SHAPE_META.map((s) => {
            const unlockedAny = progress.unlocked[s.id] > 0;
            return (
              <button
                key={s.id}
                className={`menu-card ${unlockedAny ? '' : 'disabled'}`}
                disabled={!unlockedAny}
                onClick={() => setShape(s.id)}
                title={unlockedAny ? '' : 'Beat the previous shape on Hard to unlock'}
              >
                <strong>{s.label}</strong>
                <span>{unlockedAny ? `${s.dots} dots` : 'Locked'}</span>
              </button>
            );
          })}
        </div>      </div>
    );
  }

  if (mode === 'ai' && shape && aiDifficulty === null) {
    const all: Difficulty[] = [1, 2, 3, 4, 5];
    const available = availableDifficulties(progress, shape);
    return (
      <div className="menu">
        <button className="link-btn back-link" onClick={() => setShape(null)}>‹ Back</button>
        <h2>Choose difficulty</h2>
        <p className="hint">{SHAPE_META.find((s) => s.id === shape)!.label}</p>
        <div className="menu-grid">
          {all.map((d) => {
            const unlocked = isUnlocked(progress, shape, d) || available.includes(d);
            return (
              <button
                key={d}
                className={`menu-card ${unlocked ? '' : 'disabled'}`}
                disabled={!unlocked}
                onClick={() => {
                  if (gameName) {
                    onStart('ai', shape, d);
                  } else {
                    setAiDifficulty(d);
                  }
                }}
              >
                <strong>{DIFFICULTY_LABELS[d]}</strong>
                <span>{unlocked ? `Level ${d}` : 'Locked'}</span>
              </button>
            );
          })}
        </div>      </div>
    );
  }

  if (mode === 'ai' && shape && aiDifficulty !== null) {
    return (
      <VsAISetup
        shape={shape}
        difficulty={aiDifficulty}
        settings={settings}
        lockedName={gameName}
        onBack={() => setAiDifficulty(null)}
        onStart={(name) => {
          if (!gameName) {
            onSettingsUpdate({ ...settings, playerName: name });
          }
          onStart('ai', shape, aiDifficulty);
        }}
      />
    );
  }

  return null;
}

interface VsAISetupProps {
  shape: ShapeId;
  difficulty: Difficulty;
  settings: Settings;
  lockedName: string | null;
  onBack: () => void;
  onStart: (name: string) => void;
}

function VsAISetup({
  shape,
  difficulty,
  settings,
  lockedName,
  onBack,
  onStart,
}: VsAISetupProps) {
  const [name, setName] = useState(
    lockedName ?? (settings.playerName || 'Player 1'),
  );
  const meta = SHAPE_META.find((s) => s.id === shape)!;

  const start = () => {
    onStart((lockedName ?? name).trim() || 'Player 1');
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') start();
  };

  return (
    <div className="menu">
      <button className="link-btn back-link" onClick={onBack}>‹ Back</button>
      <h2>Who's playing?</h2>
      <p className="hint">
        {meta.label} · vs <strong>AI · {DIFFICULTY_LABELS[difficulty]}</strong>
      </p>
      <div className="hotseat-setup">
        <label className="hotseat-name">
          <span className="hotseat-name-label">
            <span className="dot-swatch dot-swatch-p1" data-swap="0" aria-hidden="true" />
            Your name — plays first
          </span>
          <input
            type="text"
            className="settings-input"
            value={lockedName ?? name}
            onChange={(e) => !lockedName && setName(e.target.value)}
            onKeyDown={onKey}
            maxLength={20}
            placeholder="Player 1"
            autoFocus={!lockedName}
            readOnly={!!lockedName}
            aria-readonly={!!lockedName}
          />
        </label>
        {lockedName && (
          <p className="settings-hint">
            Signed in as {lockedName}. Change in <strong>Profile</strong>.
          </p>
        )}
        <button className="hotseat-start" onClick={start}>
          Start game
        </button>
      </div>
    </div>
  );
}

interface HotseatSetupProps {
  shape: ShapeId;
  settings: Settings;
  lockedP1Name: string | null;
  onBack: () => void;
  onStart: (p1Name: string, p2Name: string, colorSwap: boolean) => void;
}

function HotseatSetup({
  shape,
  settings,
  lockedP1Name,
  onBack,
  onStart,
}: HotseatSetupProps) {
  const [p1, setP1] = useState(
    lockedP1Name ?? (settings.playerName || 'Player 1'),
  );
  const [p2, setP2] = useState(settings.opponentName || 'Player 2');
  const [swap, setSwap] = useState(settings.hotseatColorSwap);

  const meta = SHAPE_META.find((s) => s.id === shape)!;

  const start = () => {
    const p1Final = (lockedP1Name ?? p1).trim() || 'Player 1';
    onStart(p1Final, p2.trim() || 'Player 2', swap);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') start();
  };

  return (
    <div className="menu">
      <button className="link-btn back-link" onClick={onBack}>‹ Back</button>
      <h2>Who's playing?</h2>
      <p className="hint">{meta.label} · confirm or change names before starting</p>
      <div className="hotseat-setup">
        <label className="hotseat-name">
          <span className="hotseat-name-label">
            <span className="dot-swatch dot-swatch-p1" data-swap={swap ? '1' : '0'} aria-hidden="true" />
            Player 1 — plays first
          </span>
          <input
            type="text"
            className="settings-input"
            value={lockedP1Name ?? p1}
            onChange={(e) => !lockedP1Name && setP1(e.target.value)}
            onKeyDown={onKey}
            maxLength={20}
            placeholder="Player 1"
            autoFocus={!lockedP1Name}
            readOnly={!!lockedP1Name}
            aria-readonly={!!lockedP1Name}
          />
        </label>
        <label className="hotseat-name">
          <span className="hotseat-name-label">
            <span className="dot-swatch dot-swatch-p2" data-swap={swap ? '1' : '0'} aria-hidden="true" />
            Player 2
          </span>
          <input
            type="text"
            className="settings-input"
            value={p2}
            onChange={(e) => setP2(e.target.value)}
            onKeyDown={onKey}
            maxLength={20}
            placeholder="Player 2"
          />
        </label>
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={swap}
            onChange={(e) => setSwap(e.target.checked)}
          />
          <span>Swap colours (Player 1 cream · Player 2 green)</span>
        </label>
        <button className="hotseat-start" onClick={start}>
          Start game
        </button>
      </div>
    </div>
  );
}
