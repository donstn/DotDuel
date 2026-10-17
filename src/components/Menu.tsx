import { useEffect, useRef, useState } from 'react';
import type { AppUser } from '../auth/AppUser';
import { availableDifficulties, DEFAULT_P1_NAME, DEFAULT_P2_NAME, isUnlocked } from '../storage';
import type { Settings } from '../storage';
import { PLAYABLE_SHAPE_META } from '../types';
import type { Difficulty, GameMode, Progress, ShapeId } from '../types';
import type { ThemeId } from '../theme';
import { useT } from '../i18n';
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
import { themeArt } from '../themeArt';

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
  // In-app back navigation (hardware/browser back button — see App.tsx's
  // performInAppBack): App increments backSignal to ask the menu to pop one
  // level of its own category/mode/shape drill-down; the menu reports back
  // whether it CAN do that via onDepthChange, so App knows when the menu is
  // at its true root (nothing left to pop → the back press should exit/leave).
  backSignal?: number;
  onDepthChange?: (canGoBack: boolean) => void;
  theme?: ThemeId;
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
  icon?: React.ReactNode;
  title: string;
  sub?: string;
  /** Extra class on the icon slot (e.g. "is-avatar" for the bot faces). */
  iconClass?: string;
}) {
  return (
    <span className="menu-shelf-inner">
      {icon && <span className={`menu-shelf-ic ${iconClass}`}>{icon}</span>}
      <span className="menu-shelf-body">
        <strong>{title}</strong>
        {sub && <span className="menu-shelf-sub">{sub}</span>}
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
  backSignal,
  onDepthChange,
  theme,
}: Props) {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [shape, setShape] = useState<ShapeId | null>(null);
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty | null>(null);
  const t = useT();

  useEffect(() => {
    onDepthChange?.(category !== null || mode !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, mode, shape, aiDifficulty]);

  const prevBackSignal = useRef(backSignal);
  useEffect(() => {
    if (backSignal === undefined || prevBackSignal.current === backSignal) return;
    prevBackSignal.current = backSignal;
    if (aiDifficulty !== null) setAiDifficulty(null);
    else if (shape !== null) setShape(null);
    else if (mode !== null) setMode(null);
    else if (category !== null) setCategory(null);
  }, [backSignal, aiDifficulty, shape, mode, category]);

  // Painted plaque buttons (when the theme has them) are text-only: icons go,
  // and descriptive subtitles too — only state lines (locked, sign in,
  // attempts) fit between the plaque's decorated ends.
  const art = themeArt(theme);
  const plaque = Boolean(art.menuButton);
  const desc = (s: string) => (plaque ? undefined : s);
  const dailyIcon = plaque ? undefined : <DailyIcon />;
  const onlineIcon = plaque ? undefined : <GlobeIcon />;

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
              icon={dailyIcon}
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
          <CardInner icon={dailyIcon} title={t.menu.dailyPuzzle} sub={sub} />
        </button>
      );
    }
    return (
      <button className="menu-shelf disabled" disabled title={t.menu.dailySignInTitle}>
        <CardInner
          icon={dailyIcon}
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
            icon={onlineIcon}
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
            icon={onlineIcon}
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
            icon={onlineIcon}
            title={t.menu.onlineRanked}
            sub={t.menu.onlineLocked}
          />
        </button>
      );
    }
    return (
      <button className="menu-shelf" onClick={onOpenMultiplayer}>
        <CardInner
          icon={onlineIcon}
          title={t.menu.onlineRanked}
          sub={desc(t.menu.onlineFindMatch)}
        />
      </button>
    );
  };

  // ---- Level 0: home (three category shelves) ----
  if (!mode && !category) {
    const welcomeName = gameName ?? user?.email?.split('@')[0] ?? null;
    const greeting =
      user && welcomeName ? (
        <>
          {t.menu.welcomeLead}{' '}
          <strong className="menu-welcome-name">{welcomeName}</strong> — {t.menu.tagline}
        </>
      ) : (
        <>{t.menu.tagline}</>
      );
    return (
      <div className="menu">
        {art.headerSign ? (
          <div className="header-sign">
            <h1 className="header-sign-title">
              <img src={art.headerSign.url} alt="DotDuel" className="header-sign-art" />
            </h1>
            <p className="header-sign-text">
              <span>{greeting}</span>
            </p>
          </div>
        ) : (
          <>
            <h1 className="title">
              <span className="title-dot title-dot-1">●</span>
              <span className="title-text">DotDuel</span>
              <span className="title-dot title-dot-2">●</span>
            </h1>
            <p className="subtitle">{greeting}</p>
          </>
        )}
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
        <div className="menu-shelves">
          <button className="menu-shelf" onClick={() => setCategory('single')}>
            <CardInner
              icon={plaque ? undefined : <BotSquadIcon />}
              title={t.menu.singlePlayer}
              sub={desc(t.menu.singlePlayerSub)}
            />
          </button>
          <button className="menu-shelf" onClick={() => setCategory('multi')}>
            <CardInner
              icon={plaque ? undefined : <DuelIcon />}
              title={t.menu.multiplayer}
              sub={desc(t.menu.multiplayerSub)}
            />
          </button>
          <button className="menu-shelf" onClick={() => setCategory('rankings')}>
            <CardInner
              icon={plaque ? undefined : <PodiumIcon />}
              title={t.menu.rankings}
              sub={desc(t.menu.rankingsSub)}
            />
          </button>
        </div>
        {!user && (
          <div className="menu-share-row">
            <TellAFriendButton variant="share" className="menu-share-link" />
          </div>
        )}
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
            <CardInner
              icon={plaque ? undefined : <BotSquadIcon />}
              title={t.menu.bots}
              sub={desc(t.menu.botsSub)}
            />
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
            <CardInner
              icon={plaque ? undefined : <DeviceIcon />}
              title={t.menu.hotseat}
              sub={desc(t.menu.hotseatSub)}
            />
          </button>
          {onlineCard()}
        </div>
      </div>
    );
  }

  // ---- Level 1: Rankings ----
  if (!mode && category === 'rankings') {
    // Sign-in-only: first when available, last when locked (like the other screens).
    const puzzleCard = (
      <button
        className={`menu-shelf ${user ? '' : 'disabled'}`}
        disabled={!user || !onOpenPuzzleLeaderboard}
        onClick={() => onOpenPuzzleLeaderboard?.()}
        title={user ? '' : t.common.signInToView}
      >
        <CardInner
          icon={plaque ? undefined : <PuzzleIcon />}
          title={t.menu.puzzleRankings}
          sub={user ? desc(t.menu.puzzleRankingsSub) : t.common.signInToView}
        />
      </button>
    );
    return (
      <div className="menu">
        <button className="link-btn back-link" onClick={() => setCategory(null)}>
          ‹ {t.common.back}
        </button>
        <h2>{t.menu.rankings}</h2>
        <div className="menu-shelves">
          {user && puzzleCard}
          <button className="menu-shelf" onClick={() => onOpenRankings('local')}>
            <CardInner
              icon={plaque ? undefined : <HouseIcon />}
              title={t.menu.localRankings}
              sub={desc(t.menu.localRankingsSub)}
            />
          </button>
          <button className="menu-shelf" onClick={() => onOpenRankings('global')}>
            <CardInner
              icon={plaque ? undefined : <TrophyIcon />}
              title={t.menu.ratedRankings}
              sub={desc(t.menu.ratedRankingsSub)}
            />
          </button>
          <button className="menu-shelf" onClick={onOpenAchievements}>
            <CardInner
              icon={plaque ? undefined : <AchievementsIcon />}
              title={t.menu.achievements}
              sub={desc(t.menu.achievementsSub)}
            />
          </button>
          {!user && puzzleCard}
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
                  icon={
                    art.shapeIcons ? (
                      <img src={art.shapeIcons[s.id]} alt="" aria-hidden="true" />
                    ) : (
                      <ShapeIcon />
                    )
                  }
                  iconClass={art.shapeIcons ? 'is-avatar' : ''}
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
                  icon={
                    art.shapeIcons ? (
                      <img src={art.shapeIcons[s.id]} alt="" aria-hidden="true" />
                    ) : (
                      <ShapeIcon />
                    )
                  }
                  iconClass={art.shapeIcons ? 'is-avatar' : ''}
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
                  icon={<AIAvatar level={d} theme={theme} />}
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
    lockedName ?? (settings.playerName === DEFAULT_P1_NAME ? '' : settings.playerName),
  );

  const start = () => {
    onStart((lockedName ?? name).trim() || DEFAULT_P1_NAME);
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
    lockedP1Name ?? (settings.playerName === DEFAULT_P1_NAME ? '' : settings.playerName),
  );
  const [p2, setP2] = useState(
    settings.opponentName === DEFAULT_P2_NAME ? '' : settings.opponentName,
  );
  const [swap, setSwap] = useState(settings.hotseatColorSwap);

  const start = () => {
    const p1Final = (lockedP1Name ?? p1).trim() || DEFAULT_P1_NAME;
    onStart(p1Final, p2.trim() || DEFAULT_P2_NAME, swap);
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
