import { useState } from 'react';
import type { AppUser } from '../auth/AppUser';
import { availableDifficulties, isUnlocked } from '../storage';
import type { Settings } from '../storage';
import { PLAYABLE_SHAPE_META } from '../types';
import type { Difficulty, GameMode, Progress, ShapeId } from '../types';
import { LANGS, useLang, useT } from '../i18n';
import { FriendsButton } from './FriendsButton';
import { TellAFriendButton } from './TellAFriendButton';
import type { MyDailyAttempt } from '../cloud/dailyLeaderboard';
import { MAX_ATTEMPTS_PER_DAY } from '../cloud/dailyPuzzleResult';
import {
  AchievementsIcon,
  BotSquadIcon,
  DailyIcon,
  DeviceIcon,
  DuelIcon,
  GlobeIcon,
  HouseIcon,
  PodiumIcon,
  PuzzleIcon,
  RectangleShapeIcon,
  RhombusShapeIcon,
  SquareShapeIcon,
  TriangleShapeIcon,
  TrophyIcon,
} from './MenuIcons';
import { AIAvatar } from './SidePanel';

const SHAPE_ICON: Record<ShapeId, (p: { className?: string }) => JSX.Element> = {
  triangle: TriangleShapeIcon,
  square: SquareShapeIcon,
  rectangle: RectangleShapeIcon,
  rhombus: RhombusShapeIcon,
};

interface Props {
  progress: Progress;
  settings: Settings;
  gameName: string | null;
  user: AppUser | null;
  onStart: (mode: GameMode, shape: ShapeId, difficulty?: Difficulty) => void;
  onSettingsUpdate: (next: Settings) => void;
  onOpenRankings: (view?: 'global' | 'local') => void;
  onOpenAchievements: () => void;
  onOpenSignIn: () => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
  onOpenMultiplayer: () => void;
  onOpenThemes: () => void;
  mpLockedByOther: boolean;
  mpUnreachable: boolean;
  /** Signed-in player's referral code — invite links carry ?ref=<CODE>. */
  refCode?: string | null;
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

/** Top-level grouping of the home menu (0.4.7 redesign). */
type Category = 'single' | 'multi' | 'rankings';

/** Shared shelf-card chrome: icon · (title + subtitle) · chevron. */
function CardInner({
  icon,
  title,
  sub,
  iconClass = '',
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  /** Extra class on the icon slot (e.g. "is-avatar" for the bot faces). */
  iconClass?: string;
}) {
  return (
    <span className="menu-shelf-inner">
      <span className={`menu-shelf-ic ${iconClass}`}>{icon}</span>
      <span className="menu-shelf-body">
        <strong>{title}</strong>
        <span className="menu-shelf-sub">{sub}</span>
      </span>
    </span>
  );
}

export function Menu({
  progress,
  settings,
  gameName,
  user,
  onStart,
  onSettingsUpdate,
  onOpenRankings,
  onOpenAchievements,
  onOpenSignIn,
  onOpenProfile,
  onSignOut,
  onOpenMultiplayer,
  onOpenThemes,
  mpLockedByOther,
  mpUnreachable,
  refCode = null,
  friendsOnlineCount = 0,
  friendsTotal = 0,
  friendsBadgeCount = 0,
  onOpenFriends,
  onStartDailyPuzzle,
  myDailyAttempt = null,
  onOpenPuzzleLeaderboard,
}: Props) {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [shape, setShape] = useState<ShapeId | null>(null);
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty | null>(null);
  const t = useT();
  const { lang, setLang } = useLang();
  const [langOpen, setLangOpen] = useState(false);

  // ---- Daily-puzzle shelf card (3-state, sign-in gated) ----
  const dailyCard = () => {
    if (user && onStartDailyPuzzle) {
      const attempts = myDailyAttempt?.attempts ?? 0;
      const best = myDailyAttempt?.best;
      const exhausted = attempts >= MAX_ATTEMPTS_PER_DAY;
      if (exhausted) {
        return (
          <button className="menu-shelf disabled" disabled title={t.menu.dailyDoneTitle}>
            <CardInner
              icon={<DailyIcon />}
              title={t.menu.dailyPuzzle}
              sub={t.menu.dailyDoneSub(best ?? 0)}
            />
          </button>
        );
      }
      const sub =
        attempts > 0
          ? t.menu.dailyAttemptSub(attempts + 1, MAX_ATTEMPTS_PER_DAY, best ?? 0)
          : t.menu.dailyFreshSub(MAX_ATTEMPTS_PER_DAY);
      return (
        <button className="menu-shelf" onClick={onStartDailyPuzzle}>
          <CardInner icon={<DailyIcon />} title={t.menu.dailyPuzzle} sub={sub} />
        </button>
      );
    }
    return (
      <button className="menu-shelf disabled" disabled title={t.menu.dailySignInTitle}>
        <CardInner
          icon={<DailyIcon />}
          title={t.menu.dailyPuzzle}
          sub={t.common.signInToPlay}
        />
      </button>
    );
  };

  // ---- Online-ranked shelf card (sign-in / network gated) ----
  const onlineCard = () => {
    if (!user) {
      return (
        <button className="menu-shelf disabled" disabled title={t.menu.onlineSignInTitle}>
          <CardInner
            icon={<GlobeIcon />}
            title={t.menu.onlineRanked}
            sub={t.common.signInToPlay}
          />
        </button>
      );
    }
    if (mpUnreachable) {
      return (
        <button
          className="menu-shelf disabled"
          disabled
          title={t.menu.onlineUnreachableTitle}
        >
          <CardInner
            icon={<GlobeIcon />}
            title={t.menu.onlineRanked}
            sub={t.menu.onlineUnreachable}
          />
        </button>
      );
    }
    if (mpLockedByOther) {
      return (
        <button className="menu-shelf disabled" disabled title={t.menu.onlineLockedTitle}>
          <CardInner
            icon={<GlobeIcon />}
            title={t.menu.onlineRanked}
            sub={t.menu.onlineLocked}
          />
        </button>
      );
    }
    return (
      <button className="menu-shelf" onClick={onOpenMultiplayer}>
        <CardInner
          icon={<GlobeIcon />}
          title={t.menu.onlineRanked}
          sub={t.menu.onlineFindMatch}
        />
      </button>
    );
  };

  // ---- Level 0: home (three category shelves) ----
  if (!mode && !category) {
    const welcomeName = gameName ?? user?.email?.split('@')[0] ?? null;
    return (
      <div className="menu">
        {langOpen && (
          <div className="menu-lang-backdrop" onClick={() => setLangOpen(false)} />
        )}
        <div className="menu-topright">
          <div className="menu-lang">
            <button
              type="button"
              className="menu-lang-btn"
              onClick={() => setLangOpen((o) => !o)}
              aria-label={t.lang.label}
              title={t.lang.label}
              aria-haspopup="menu"
              aria-expanded={langOpen}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 0c2.5 2.6 2.5 15.4 0 18m0-18c-2.5 2.6-2.5 15.4 0 18M3.5 9h17M3.5 15h17"
                />
              </svg>
              <span className="menu-lang-code">{lang.toUpperCase()}</span>
            </button>
            {langOpen && (
              <div className="menu-lang-pop" role="menu">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    role="menuitemradio"
                    aria-checked={l.code === lang}
                    className={`menu-lang-opt ${l.code === lang ? 'is-on' : ''}`}
                    onClick={() => {
                      setLang(l.code);
                      setLangOpen(false);
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            className="menu-theme-btn"
            onClick={onOpenThemes}
            aria-label={t.menu.changeTheme}
            title={t.menu.changeTheme}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
              <path
                fill="currentColor"
                d="M12 3a9 9 0 0 0 0 18 1.5 1.5 0 0 0 1.16-2.46 1.5 1.5 0 0 1 1.16-2.46H17a4 4 0 0 0 4-4c0-4.97-4.03-9-9-9zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
              />
            </svg>
          </button>
        </div>
        <h1 className="title">
          <span className="title-dot title-dot-1">●</span>
          <span className="title-text">DotDuel</span>
          <span className="title-dot title-dot-2">●</span>
        </h1>
        <p className="subtitle">
          {user && welcomeName ? (
            <>
              {t.menu.welcomeLead}{' '}
              <strong className="menu-welcome-name">{welcomeName}</strong> — {t.menu.tagline}
            </>
          ) : (
            <>{t.menu.tagline}</>
          )}
        </p>
        <div className="menu-auth-row">
          {user ? (
            <>
              <button type="button" className="menu-auth-btn" onClick={onOpenProfile}>
                {t.menu.profile}
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
                refCode={refCode}
                className="menu-auth-btn"
              />
              <button type="button" className="menu-auth-btn" onClick={onSignOut}>
                {t.menu.signOut}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="menu-auth-btn menu-auth-btn-cta"
              onClick={onOpenSignIn}
            >
              {t.menu.signIn}
            </button>
          )}
        </div>
        {!user && (
          <div className="menu-share-row">
            <TellAFriendButton variant="share" className="menu-share-link" />
          </div>
        )}
        <div className="menu-shelves">
          <button className="menu-shelf" onClick={() => setCategory('single')}>
            <CardInner
              icon={<BotSquadIcon />}
              title={t.menu.singlePlayer}
              sub={t.menu.singlePlayerSub}
            />
          </button>
          <button className="menu-shelf" onClick={() => setCategory('multi')}>
            <CardInner
              icon={<DuelIcon />}
              title={t.menu.multiplayer}
              sub={t.menu.multiplayerSub}
            />
          </button>
          <button className="menu-shelf" onClick={() => setCategory('rankings')}>
            <CardInner
              icon={<PodiumIcon />}
              title={t.menu.rankings}
              sub={t.menu.rankingsSub}
            />
          </button>
        </div>
      </div>
    );
  }

  // ---- Level 1: Single player ----
  if (!mode && category === 'single') {
    return (
      <div className="menu">
        <button className="link-btn back-link" onClick={() => setCategory(null)}>
          ‹ {t.common.back}
        </button>
        <h2>{t.menu.singlePlayer}</h2>
        <div className="menu-shelves">
          <button className="menu-shelf" onClick={() => setMode('ai')}>
            <CardInner icon={<BotSquadIcon />} title={t.menu.bots} sub={t.menu.botsSub} />
          </button>
          {dailyCard()}
        </div>
      </div>
    );
  }

  // ---- Level 1: Multiplayer ----
  if (!mode && category === 'multi') {
    return (
      <div className="menu">
        <button className="link-btn back-link" onClick={() => setCategory(null)}>
          ‹ {t.common.back}
        </button>
        <h2>{t.menu.multiplayer}</h2>
        <div className="menu-shelves">
          <button className="menu-shelf" onClick={() => setMode('hotseat')}>
            <CardInner icon={<DeviceIcon />} title={t.menu.hotseat} sub={t.menu.hotseatSub} />
          </button>
          {onlineCard()}
        </div>
      </div>
    );
  }

  // ---- Level 1: Rankings ----
  if (!mode && category === 'rankings') {
    return (
      <div className="menu">
        <button className="link-btn back-link" onClick={() => setCategory(null)}>
          ‹ {t.common.back}
        </button>
        <h2>{t.menu.rankings}</h2>
        <div className="menu-shelves">
          <button
            className={`menu-shelf ${user ? '' : 'disabled'}`}
            disabled={!user || !onOpenPuzzleLeaderboard}
            onClick={() => onOpenPuzzleLeaderboard?.()}
            title={user ? '' : t.common.signInToView}
          >
            <CardInner
              icon={<PuzzleIcon />}
              title={t.menu.puzzleRankings}
              sub={user ? t.menu.puzzleRankingsSub : t.common.signInToView}
            />
          </button>
          <button className="menu-shelf" onClick={() => onOpenRankings('local')}>
            <CardInner
              icon={<HouseIcon />}
              title={t.menu.localRankings}
              sub={t.menu.localRankingsSub}
            />
          </button>
          <button className="menu-shelf" onClick={() => onOpenRankings('global')}>
            <CardInner
              icon={<TrophyIcon />}
              title={t.menu.ratedRankings}
              sub={t.menu.ratedRankingsSub}
            />
          </button>
          <button className="menu-shelf" onClick={onOpenAchievements}>
            <CardInner
              icon={<AchievementsIcon />}
              title={t.menu.achievements}
              sub={t.menu.achievementsSub}
            />
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'hotseat' && !shape) {
    return (
      <div className="menu">
        <button className="link-btn back-link" onClick={() => setMode(null)}>‹ {t.common.back}</button>
        <h2>{t.menu.chooseShape}</h2>
        <div className="menu-shelves">
          {PLAYABLE_SHAPE_META.map((s) => {
            const ShapeIcon = SHAPE_ICON[s.id];
            return (
              <button key={s.id} className="menu-shelf" onClick={() => setShape(s.id)}>
                <CardInner
                  icon={<ShapeIcon />}
                  title={t.shapes[s.id]}
                  sub={t.menu.dots(s.dots)}
                />
              </button>
            );
          })}
        </div>
      </div>
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
        <button className="link-btn back-link" onClick={() => setMode(null)}>‹ {t.common.back}</button>
        <h2>{t.menu.chooseShape}</h2>
        <div className="menu-shelves">
          {PLAYABLE_SHAPE_META.map((s) => {
            const unlockedAny = progress.unlocked[s.id] > 0;
            const ShapeIcon = SHAPE_ICON[s.id];
            return (
              <button
                key={s.id}
                className={`menu-shelf ${unlockedAny ? '' : 'disabled'}`}
                disabled={!unlockedAny}
                onClick={() => setShape(s.id)}
                title={unlockedAny ? '' : t.menu.shapeLockedTitle}
              >
                <CardInner
                  icon={<ShapeIcon />}
                  title={t.shapes[s.id]}
                  sub={unlockedAny ? t.menu.dots(s.dots) : t.common.locked}
                />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (mode === 'ai' && shape && aiDifficulty === null) {
    const all: Difficulty[] = [1, 2, 3, 4, 5];
    const available = availableDifficulties(progress, shape);
    return (
      <div className="menu">
        <button className="link-btn back-link" onClick={() => setShape(null)}>‹ {t.common.back}</button>
        <h2>{t.menu.chooseDifficulty}</h2>
        <p className="hint">{t.shapes[shape]}</p>
        <div className="menu-shelves">
          {all.map((d) => {
            const unlocked = isUnlocked(progress, shape, d) || available.includes(d);
            return (
              <button
                key={d}
                className={`menu-shelf ${unlocked ? '' : 'disabled'}`}
                disabled={!unlocked}
                onClick={() => {
                  if (gameName) {
                    onStart('ai', shape, d);
                  } else {
                    setAiDifficulty(d);
                  }
                }}
              >
                <CardInner
                  iconClass="is-avatar"
                  icon={<AIAvatar level={d} />}
                  title={t.difficulty[d]}
                  sub={unlocked ? t.menu.level(d) : t.common.locked}
                />
              </button>
            );
          })}
        </div>
      </div>
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
  const t = useT();
  const [name, setName] = useState(
    lockedName ?? (settings.playerName || 'Player 1'),
  );

  const start = () => {
    onStart((lockedName ?? name).trim() || 'Player 1');
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') start();
  };

  return (
    <div className="menu">
      <button className="link-btn back-link" onClick={onBack}>‹ {t.common.back}</button>
      <h2>{t.menu.whosPlaying}</h2>
      <p className="hint">{t.menu.vsBot(t.shapes[shape], t.difficulty[difficulty])}</p>
      <div className="hotseat-setup">
        <label className="hotseat-name">
          <span className="hotseat-name-label">
            <span className="dot-swatch dot-swatch-p1" data-swap="0" aria-hidden="true" />
            {t.menu.yourNameFirst}
          </span>
          <input
            type="text"
            className="settings-input"
            value={lockedName ?? name}
            onChange={(e) => !lockedName && setName(e.target.value)}
            onKeyDown={onKey}
            maxLength={20}
            placeholder={t.menu.player1Placeholder}
            autoFocus={!lockedName}
            readOnly={!!lockedName}
            aria-readonly={!!lockedName}
          />
        </label>
        {lockedName && <p className="settings-hint">{t.menu.signedInAs(lockedName)}</p>}
        <button className="hotseat-start" onClick={start}>
          {t.menu.startGame}
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
  const t = useT();
  const [p1, setP1] = useState(
    lockedP1Name ?? (settings.playerName || 'Player 1'),
  );
  const [p2, setP2] = useState(settings.opponentName || 'Player 2');
  const [swap, setSwap] = useState(settings.hotseatColorSwap);

  const start = () => {
    const p1Final = (lockedP1Name ?? p1).trim() || 'Player 1';
    onStart(p1Final, p2.trim() || 'Player 2', swap);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') start();
  };

  return (
    <div className="menu">
      <button className="link-btn back-link" onClick={onBack}>‹ {t.common.back}</button>
      <h2>{t.menu.whosPlaying}</h2>
      <p className="hint">{t.menu.hotseatHint(t.shapes[shape])}</p>
      <div className="hotseat-setup">
        <label className="hotseat-name">
          <span className="hotseat-name-label">
            <span className="dot-swatch dot-swatch-p1" data-swap={swap ? '1' : '0'} aria-hidden="true" />
            {t.menu.player1First}
          </span>
          <input
            type="text"
            className="settings-input"
            value={lockedP1Name ?? p1}
            onChange={(e) => !lockedP1Name && setP1(e.target.value)}
            onKeyDown={onKey}
            maxLength={20}
            placeholder={t.menu.player1Placeholder}
            autoFocus={!lockedP1Name}
            readOnly={!!lockedP1Name}
            aria-readonly={!!lockedP1Name}
          />
        </label>
        <label className="hotseat-name">
          <span className="hotseat-name-label">
            <span className="dot-swatch dot-swatch-p2" data-swap={swap ? '1' : '0'} aria-hidden="true" />
            {t.menu.player2}
          </span>
          <input
            type="text"
            className="settings-input"
            value={p2}
            onChange={(e) => setP2(e.target.value)}
            onKeyDown={onKey}
            maxLength={20}
            placeholder={t.menu.player2Placeholder}
          />
        </label>
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={swap}
            onChange={(e) => setSwap(e.target.checked)}
          />
          <span>{t.menu.swapColours}</span>
        </label>
        <button className="hotseat-start" onClick={start}>
          {t.menu.startGame}
        </button>
      </div>
    </div>
  );
}
