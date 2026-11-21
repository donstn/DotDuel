import { useEffect, useRef, useState } from 'react';
import type { AppUser } from '../auth/AppUser';
import { DEFAULT_P1_NAME, DEFAULT_P2_NAME, isUnlocked } from '../storage';
import type { Settings } from '../storage';
import { PLAYABLE_SHAPE_META } from '../types';
import type { Difficulty, GameMode, Progress, ShapeId } from '../types';
import type { ThemeId } from '../theme';
import { useLang, useT } from '../i18n';
import { guideLinkProps } from '../guideLinks';
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
  /** Alive day streak (0 when broken) and whether today is already played; shown in the signed-in greeting. */
  streakDays?: number;
  streakToday?: boolean;
  user: AppUser | null;
  onStart: (mode: GameMode, shape: ShapeId, difficulty?: Difficulty) => void;
  onSettingsUpdate: (next: Settings) => void;
  onOpenRankings: (view?: 'global' | 'local') => void;
  onOpenAchievements: () => void;
  onOpenSignIn: () => void;
  /** Start the first-game lesson again. */
  onPlayTutorial: () => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
  onOpenMultiplayer: () => void;
  /** Straight into the 3-minute Triangle ranked search, skipping the lobby. */
  onQuickRanked: () => void;
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
      {icon && (
        <span className={`menu-shelf-ic ${iconClass}`} aria-hidden="true">
          {icon}
        </span>
      )}
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
  streakDays = 0,
  streakToday = false,
  user,
  onStart,
  onSettingsUpdate,
  onOpenRankings,
  onOpenAchievements,
  onOpenSignIn,
  onPlayTutorial,
  onOpenProfile,
  onSignOut,
  onOpenMultiplayer,
  onQuickRanked,
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
  const t = useT();
  const { lang } = useLang();

  useEffect(() => {
    onDepthChange?.(category !== null || mode !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, mode, shape]);

  const prevBackSignal = useRef(backSignal);
  useEffect(() => {
    if (backSignal === undefined || prevBackSignal.current === backSignal) return;
    prevBackSignal.current = backSignal;
    if (shape !== null) setShape(null);
    else if (mode !== null) setMode(null);
    else if (category !== null) setCategory(null);
  }, [backSignal, shape, mode, category]);

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
      <button className="menu-shelf disabled needs-signin" onClick={onOpenSignIn} title={t.menu.dailySignInTitle}>
        <CardInner
          icon={dailyIcon}
          title={t.menu.dailyPuzzle}
          sub={t.common.signInToPlay}
        />
      </button>
    );
  };

  // ---- Online-ranked shelf card (sign-in / network gated) ----
  const onlineCard = (
    title: string = t.menu.onlineRanked,
    sub: string = t.menu.onlineFindMatch,
    onClick: () => void = onOpenMultiplayer,
  ) => {
    if (!user) {
      return (
        <button className="menu-shelf disabled needs-signin" onClick={onOpenSignIn} title={t.menu.onlineSignInTitle}>
          <CardInner
            icon={onlineIcon}
            title={title}
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
            title={title}
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
            title={title}
            sub={t.menu.onlineLocked}
          />
        </button>
      );
    }
    return (
      <button className="menu-shelf" onClick={onClick}>
        <CardInner
          icon={onlineIcon}
          title={title}
          sub={desc(sub)}
        />
      </button>
    );
  };

  // ---- Level 0: home (three category shelves) ----
  if (!mode && !category) {
    const quickCard = onlineCard(t.menu.quickRanked, t.menu.quickRankedSub, onQuickRanked);
    const welcomeName = gameName ?? user?.email?.split('@')[0] ?? null;
    const greeting =
      user && welcomeName ? (
        <>
          {t.menu.welcomeLead}{' '}
          <strong className="menu-welcome-name">{welcomeName}</strong> —{' '}
          {streakToday
            ? t.streak.menuToday(streakDays)
            : streakDays > 0
              ? t.streak.menuKeep(streakDays)
              : t.streak.menuStart}
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
          {user && quickCard}
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
          {!user && quickCard}
        </div>
        <div className="menu-share-row">
          {!user && <TellAFriendButton variant="share" className="menu-share-link" />}
          <a className="menu-share-link" {...guideLinkProps(lang, 'guide', false)}>
            {t.menu.guide}
          </a>
          <button type="button" className="menu-share-link" onClick={onPlayTutorial}>
            {t.menu.lesson}
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
        className={`menu-shelf ${user ? '' : 'disabled needs-signin'}`}
        disabled={!!user && !onOpenPuzzleLeaderboard}
        onClick={() => (user ? onOpenPuzzleLeaderboard?.() : onOpenSignIn())}
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

  if (mode === 'ai') {
    return (
      <VsAISetup
        progress={progress}
        theme={theme}
        settings={settings}
        lockedName={gameName}
        onBack={() => setMode(null)}
        onStart={(name, sh, d) => {
          if (!gameName) {
            onSettingsUpdate({ ...settings, playerName: name });
          }
          onStart('ai', sh, d);
        }}
      />
    );
  }

  return null;
}

interface VsAISetupProps {
  progress: Progress;
  theme?: ThemeId;
  settings: Settings;
  lockedName: string | null;
  onBack: () => void;
  onStart: (name: string, shape: ShapeId, difficulty: Difficulty) => void;
}

const ALL_LEVELS: Difficulty[] = [1, 2, 3, 4, 5];

// Vs-bot setup on one screen, like the website: shape tiles, a row of the five
// bots, the chosen level, your name, Start.
function VsAISetup({ progress, theme, settings, lockedName, onBack, onStart }: VsAISetupProps) {
  const t = useT();
  const art = themeArt(theme);
  const [shape, setShape] = useState<ShapeId>('triangle');
  const [level, setLevel] = useState<Difficulty>(() => Math.min(3, Math.max(1, progress.unlocked.triangle)) as Difficulty);
  const [hint, setHint] = useState<string | null>(null);
  const [name, setName] = useState(
    lockedName ?? (settings.playerName === DEFAULT_P1_NAME ? '' : settings.playerName),
  );

  const pickShape = (sh: ShapeId) => {
    if (progress.unlocked[sh] === 0) {
      const i = PLAYABLE_SHAPE_META.findIndex((m) => m.id === sh);
      const prev = PLAYABLE_SHAPE_META[Math.max(0, i - 1)].id;
      setHint(t.menu.unlockHint(t.shapes[sh], t.difficulty[2], t.shapes[prev]));
      return;
    }
    setHint(null);
    setShape(sh);
    if (!isUnlocked(progress, sh, level)) setLevel(Math.max(1, progress.unlocked[sh]) as Difficulty);
  };

  const pickLevel = (d: Difficulty) => {
    if (!isUnlocked(progress, shape, d)) {
      setHint(t.menu.unlockHint(t.difficulty[d], t.difficulty[(d - 1) as Difficulty], t.shapes[shape]));
      return;
    }
    setHint(null);
    setLevel(d);
  };

  const start = () => onStart((lockedName ?? name).trim() || DEFAULT_P1_NAME, shape, level);

  return (
    <div className="menu ai-setup">
      <button className="link-btn back-link" onClick={onBack}>‹ {t.common.back}</button>
      <h2>{t.menu.chooseShape}</h2>
      <div className="ai-tiles ai-shape-tiles" role="radiogroup" aria-label={t.menu.chooseShape}>
        {PLAYABLE_SHAPE_META.map((m) => {
          const locked = progress.unlocked[m.id] === 0;
          const ShapeIcon = SHAPE_ICON[m.id];
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={shape === m.id}
              aria-disabled={locked}
              className={`ai-tile ${shape === m.id ? 'selected' : ''} ${locked ? 'locked' : ''}`}
              onClick={() => pickShape(m.id)}
            >
              <span className="ai-tile-icon" aria-hidden="true">
                {art.shapeIcons ? <img src={art.shapeIcons[m.id]} alt="" /> : <ShapeIcon />}
              </span>
              <span className="ai-tile-title">{t.shapes[m.id]}</span>
              <span className="ai-tile-sub">{locked ? `🔒 ${t.common.locked}` : t.menu.dots(m.dots)}</span>
            </button>
          );
        })}
      </div>
      <h2>{t.menu.chooseDifficulty}</h2>
      <div className="ai-tiles ai-bot-tiles" role="radiogroup" aria-label={t.menu.chooseDifficulty}>
        {ALL_LEVELS.map((d) => {
          const locked = !isUnlocked(progress, shape, d);
          return (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={level === d}
              aria-disabled={locked}
              aria-label={`${t.menu.level(d)} · ${t.difficulty[d]}${locked ? ` (${t.common.locked})` : ''}`}
              className={`ai-tile ai-bot-tile ${level === d ? 'selected' : ''} ${locked ? 'locked' : ''}`}
              onClick={() => pickLevel(d)}
            >
              <span className="ai-tile-icon" aria-hidden="true">
                <AIAvatar level={d} theme={theme} />
              </span>
            </button>
          );
        })}
      </div>
      {hint ? (
        <p className="hint unlock-hint ai-level-hint" role="status">{hint}</p>
      ) : (
        <p className="ai-level-line">
          {t.menu.level(level)} · {t.difficulty[level]}
        </p>
      )}
      <div className="hotseat-setup ai-name-card">
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
            onKeyDown={(e) => e.key === 'Enter' && start()}
            maxLength={20}
            placeholder={t.menu.player1Placeholder}
            readOnly={!!lockedName}
            aria-readonly={!!lockedName}
          />
        </label>
        {lockedName && <p className="settings-hint">{t.menu.signedInAs(lockedName)}</p>}
      </div>
      <button className="hotseat-start ai-start" onClick={start}>
        {t.menu.startGame}
      </button>
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
