import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Player } from '../types';
import type { ThemeId } from '../theme';
import { useT } from '../i18n';
import { PlayerAvatar, effectiveColor, type AvatarSpec } from './SidePanel';
import { AchievementBadge } from '../achievements/AchievementBadge';

export interface StripPlayer {
  name: string;
  score: number;
  avatar: AvatarSpec;
  /** Shown under the name. Rating only — stats belong on the desktop player card. */
  rating?: ReactNode;
  clock?: ReactNode;
  thinking?: boolean;
  /** Featured achievement badge, shown on the rating line. */
  featured?: { icon: string; tier?: number; title: string } | null;
}

interface ScoreStripProps {
  p1: StripPlayer;
  p2: StripPlayer;
  /** Player to move, or null once the game is over. */
  current: Player | null;
  theme?: ThemeId;
  colorSwap?: boolean;
  onFeaturedClick?: () => void;
}

// Phone-only replacement for the two side panels: names on the outside, the
// score pair in the middle so the gap reads at a glance.
export function ScoreStrip({
  p1,
  p2,
  current,
  theme,
  colorSwap = false,
  onFeaturedClick,
}: ScoreStripProps) {
  const t = useT();
  const c1 = effectiveColor(1, colorSwap);
  const c2 = effectiveColor(2, colorSwap);
  const hasClocks = Boolean(p1.clock || p2.clock);
  return (
    <div className="score-strip">
      <StripSide
        side="left"
        p={p1}
        color={c1}
        active={current === 1}
        theme={theme}
        onFeaturedClick={onFeaturedClick}
      />
      <div className="ss-center">
        <div
          className="ss-score"
          role="img"
          aria-label={t.game.scoreAria(p1.name, p1.score, p2.name, p2.score)}
        >
          <StripScore value={p1.score} color={c1} align="end" />
          <span className="ss-sep" aria-hidden="true">:</span>
          <StripScore value={p2.score} color={c2} align="start" />
        </div>
        {hasClocks && (
          <div className="ss-clocks">
            <span>{p1.clock}</span>
            <span>{p2.clock}</span>
          </div>
        )}
      </div>
      <StripSide
        side="right"
        p={p2}
        color={c2}
        active={current === 2}
        theme={theme}
        onFeaturedClick={onFeaturedClick}
      />
    </div>
  );
}

function StripSide({
  side,
  p,
  color,
  active,
  theme,
  onFeaturedClick,
}: {
  side: 'left' | 'right';
  p: StripPlayer;
  color: 1 | 2;
  active: boolean;
  theme?: ThemeId;
  onFeaturedClick?: () => void;
}) {
  const tr = useT();
  return (
    <div className={`ss-side ss-${side} ss-p${color}${active ? ' active' : ''}`}>
      <div className="ss-avatar">
        <div className="avatar-frame">
          <PlayerAvatar avatar={p.avatar} color={color} theme={theme} />
        </div>
        {p.thinking && (
          <span className="ss-thinking" role="status" aria-label={tr.game.thinking}>···</span>
        )}
      </div>
      <div className="ss-who">
        <div className="ss-name" title={p.name}>{p.name}</div>
        {(p.rating || p.featured) && (
          <div className="ss-rating">
            {p.rating}
            {p.featured && (
              <AchievementBadge
                icon={p.featured.icon}
                tier={p.featured.tier}
                earned
                size={16}
                title={tr.sidePanel.featuredTitle(p.featured.title)}
                onClick={onFeaturedClick}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StripScore({ value, color, align }: { value: number; color: 1 | 2; align: 'start' | 'end' }) {
  const prev = useRef(value);
  const [bump, setBump] = useState(false);
  useEffect(() => {
    if (prev.current === value) return;
    const increased = value > prev.current;
    prev.current = value;
    if (!increased) {
      setBump(false);
      return;
    }
    setBump(true);
    const t = window.setTimeout(() => setBump(false), 400);
    return () => window.clearTimeout(t);
  }, [value]);
  return (
    <span className={`ss-n ss-n-p${color} ss-n-${align}${bump ? ' score-bump' : ''}`}>{value}</span>
  );
}
