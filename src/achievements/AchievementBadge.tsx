/**
 * AchievementBadge — a faceted medallion holding one of 38 glyphs.
 *
 * The glyph is drawn in the active theme's two dot colours (--p1/--p2) + accent.
 * Locked badges aren't redrawn — CSS desaturates the same art (.is-locked), so
 * "greyed until earned, then lit in the dot colours" is automatic and follows
 * the theme. `tier` (1..5) adds that many pips along the base and brightens the
 * ring. The full glyph set keeps to 38 keys; tiered families share a glyph.
 */
import type { ReactNode } from 'react';

const P1 = 'var(--p1-bright, #62cf90)';
const P1D = 'var(--p1-glow, #1c7a3d)';
const P2 = 'var(--p2-glow, #f0fbcf)';
const AC = 'var(--accent, #7bdb95)';

// Mini dot-clusters echoing each board shape (used by shape/crown/skull glyphs).
const triDots = (
  <g>
    {[[10, 13], [24, 13], [38, 13], [17, 26], [31, 26], [24, 39]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r="3.7" fill={i % 2 ? P2 : P1} />
    ))}
  </g>
);
const sqDots = (
  <g>
    {[12, 24, 36].map((y) =>
      [12, 24, 36].map((x) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3.4" fill={(x + y) % 24 ? P1 : P2} />
      )),
    )}
  </g>
);
const rectDots = (
  <g>
    {[8, 19, 30, 41].map((y) =>
      [14, 24, 34].map((x) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3.1" fill={(x + y) % 21 ? P1 : P2} />
      )),
    )}
  </g>
);
const miniShape = (which: 'tri' | 'sq' | 'rect') => {
  if (which === 'tri')
    return (
      <g>
        <circle cx="18" cy="38" r="2.4" fill={P1} />
        <circle cx="24" cy="38" r="2.4" fill={P2} />
        <circle cx="30" cy="38" r="2.4" fill={P1} />
        <circle cx="24" cy="44" r="2.4" fill={P2} />
      </g>
    );
  if (which === 'sq')
    return (
      <g>
        {[20, 28].map((y) =>
          [20, 28].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y + 16} r="2.4" fill={P1} />),
        )}
      </g>
    );
  return (
    <g>
      {[18, 24, 30].map((x) => (
        <circle key={x} cx={x} cy="40" r="2.4" fill={P1} />
      ))}
      {[18, 24, 30].map((x) => (
        <circle key={`b${x}`} cx={x} cy="45" r="2.4" fill={P2} />
      ))}
    </g>
  );
};

const crown = (
  <path d="M9 28 l3-13 7 7 5-9 5 9 7-7 3 13z M9 28 h30 v4 h-30z" fill={P2} stroke={P1D} strokeWidth="0.6" />
);
const skull = (
  <g>
    <path d="M24 6 c-10 0 -15 7 -15 15 c0 5 2 8 5 10 v6 h20 v-6 c3-2 5-5 5-10 c0-8-5-15-15-15z" fill={P2} />
    <circle cx="18" cy="21" r="3.6" fill={P1D} />
    <circle cx="30" cy="21" r="3.6" fill={P1D} />
    <path d="M21 30 l1.5-4 1.5 4 1.5-4 1.5 4" stroke={P1D} strokeWidth="1.4" fill="none" />
  </g>
);
const flame = (extra?: ReactNode) => (
  <g>
    <path d="M24 4 c6 8 11 11 11 20 a11 11 0 0 1 -22 0 c0-5 3-8 5-11 c1 3 3 4 5 4 c-2-5-4-8-4-13z" fill={P1} />
    <path d="M24 20 c3 3 5 5 5 9 a5 5 0 0 1 -10 0 c0-3 2-5 5-9z" fill={P2} />
    {extra}
  </g>
);
const sword = (
  <g>
    <path d="M34 8 l4 4 -16 16 -4-4z" fill={P2} />
    <path d="M18 24 l6 6 -3 3 -3-1 -1-3z" fill={P1} />
    <path d="M14 30 l5 5 M16 40 l6-6" stroke={P1} strokeWidth="2.4" strokeLinecap="round" />
  </g>
);

const GLYPHS: Record<string, ReactNode> = {
  spark: (
    <>
      <path d="M24 3 l3.6 16.8 L45 24 l-17.4 4.2 L24 45 l-3.6-16.8 L3 24 l17.4-4.2z" fill={P1} />
      <circle cx="24" cy="24" r="3.6" fill={P2} />
    </>
  ),
  'trophy-s': (
    <g>
      <path d="M15 8 h18 v6 a9 9 0 0 1 -18 0z" fill={P2} />
      <path d="M15 10 h-5 a4 4 0 0 0 5 6 M33 10 h5 a4 4 0 0 1 -5 6" stroke={P1} strokeWidth="2.4" fill="none" />
      <rect x="21.5" y="22" width="5" height="6" fill={P1} />
      <rect x="17" y="33" width="14" height="4" rx="1" fill={P1} />
      <rect x="19.5" y="28" width="9" height="5" rx="1" fill={P1} />
    </g>
  ),
  claim: (
    <g>
      <rect x="13" y="6" width="2.6" height="35" rx="1.2" fill={P1} />
      <path d="M15.6 8 h19 l-4.5 5 4.5 5 h-19z" fill={P2} />
    </g>
  ),
  map: (
    <g>
      <circle cx="24" cy="24" r="17" fill="none" stroke={P1} strokeWidth="2.6" />
      <polygon points="24,10 28,24 24,38 20,24" fill={P2} />
      <polygon points="24,24 28,24 24,38 20,24" fill={P1} />
    </g>
  ),
  'shape-triangle': triDots,
  'shape-square': sqDots,
  'shape-rectangle': rectDots,
  'crown-triangle': (<g>{crown}{miniShape('tri')}</g>),
  'crown-square': (<g>{crown}{miniShape('sq')}</g>),
  'crown-rectangle': (<g>{crown}{miniShape('rect')}</g>),
  'skull-triangle': (<g><g transform="scale(0.8) translate(6 2)">{skull}</g>{miniShape('tri')}</g>),
  'skull-square': (<g><g transform="scale(0.8) translate(6 2)">{skull}</g>{miniShape('sq')}</g>),
  'skull-rectangle': (<g><g transform="scale(0.8) translate(6 2)">{skull}</g>{miniShape('rect')}</g>),
  nightmare: (
    <g>
      <path d="M9 13 l5 6 -1 -8z M39 13 l-5 6 1 -8z" fill={P1} />
      {skull}
    </g>
  ),
  blowout: (
    <g>
      <path d="M24 4 l4 13 13-7 -7 13 13 4 -13 4 7 13 -13-7 -4 13 -4-13 -13 7 7-13 -13-4 13-4 -7-13 13 7z" fill={P1} />
      <circle cx="24" cy="24" r="6" fill={P2} />
    </g>
  ),
  shield: (
    <g>
      <path d="M24 5 l16 5 v11 c0 11-8 17-16 21 c-8-4-16-10-16-21 V10z" fill={P1} />
      <path d="M16 24 l5 6 11-12" stroke={P2} strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  couch: (
    <g>
      <rect x="6" y="20" width="36" height="16" rx="5" fill={P1} />
      <rect x="9" y="14" width="13" height="12" rx="4" fill={P2} />
      <rect x="26" y="14" width="13" height="12" rx="4" fill={P2} />
      <rect x="8" y="34" width="4" height="6" fill={P1} />
      <rect x="36" y="34" width="4" height="6" fill={P1} />
    </g>
  ),
  calendar: (
    <g>
      <rect x="7" y="10" width="34" height="31" rx="5" fill="none" stroke={P1} strokeWidth="2.6" />
      <path d="M7 19 h34" stroke={P1} strokeWidth="2.6" />
      <path d="M15 6 v7 M33 6 v7" stroke={P1} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="24" cy="30" r="5" fill={P2} />
    </g>
  ),
  'calendar-streak': (
    <g>
      <rect x="7" y="10" width="34" height="31" rx="5" fill="none" stroke={P1} strokeWidth="2.6" />
      <path d="M7 19 h34" stroke={P1} strokeWidth="2.6" />
      <path d="M24 23 c3 3 5 5 5 9 a5 5 0 0 1 -10 0 c0-3 2-5 5-9z" fill={P2} />
    </g>
  ),
  three: (
    <g>
      <circle cx="11" cy="24" r="6" fill={P1} />
      <circle cx="24" cy="24" r="6" fill={P2} />
      <circle cx="37" cy="24" r="6" fill={P1} />
    </g>
  ),
  'crown-daily': (
    <g>
      {crown}
      <circle cx="24" cy="40" r="4" fill={P1} />
    </g>
  ),
  'flame-day': flame(),
  'calendar-dots': (
    <g>
      <rect x="7" y="9" width="34" height="32" rx="5" fill="none" stroke={P1} strokeWidth="2.4" />
      <path d="M7 18 h34" stroke={P1} strokeWidth="2.4" />
      {[[15, 26], [24, 26], [33, 33], [15, 33], [24, 33]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.6" fill={i % 2 ? P2 : P1} />
      ))}
    </g>
  ),
  medal: (
    <g>
      <path d="M16 6 l4 14 -8 0z M32 6 l-4 14 8 0z" fill={P1} />
      <circle cx="24" cy="30" r="12" fill={P1D} stroke={P1} strokeWidth="2" />
      <path d="M24 23 l2.2 4.5 5 .7 -3.6 3.5 .9 5 -4.5-2.4 -4.5 2.4 .9-5 -3.6-3.5 5-.7z" fill={P2} />
    </g>
  ),
  sword,
  'sword-win': (
    <g>
      <g transform="rotate(-12 24 24)">{sword}</g>
      <g transform="rotate(90 24 24)">{sword}</g>
    </g>
  ),
  fire: flame(),
  'fire-bot': flame(<circle cx="24" cy="30" r="2" fill={P1D} />),
  chevron: (
    <g>
      <path d="M10 30 l14-12 14 12" fill="none" stroke={P2} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 40 l14-12 14 12" fill="none" stroke={P1} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  clock: (
    <g>
      <circle cx="24" cy="25" r="16" fill="none" stroke={P1} strokeWidth="2.8" />
      <path d="M24 25 v-9 M24 25 l7 4" stroke={P2} strokeWidth="2.8" strokeLinecap="round" />
      <path d="M19 5 h10" stroke={P1} strokeWidth="2.8" strokeLinecap="round" />
    </g>
  ),
  upset: (
    <g>
      <circle cx="33" cy="28" r="10" fill={P2} opacity="0.55" />
      <circle cx="16" cy="26" r="7" fill={P1} />
      <path d="M16 17 l4 5 h-3 v4 h-2 v-4 h-3z" fill={P2} />
    </g>
  ),
  rematch: (
    <g>
      <path d="M38 24 a14 14 0 1 1 -4-10" fill="none" stroke={P1} strokeWidth="3" strokeLinecap="round" />
      <path d="M34 6 l1 9 -9-2z" fill={P2} />
    </g>
  ),
  longline: (
    <g>
      {[10, 19, 28, 37].map((x, i) => (
        <circle key={x} cx={x} cy="24" r="4.2" fill={i % 2 ? P2 : P1} />
      ))}
      <path d="M8 24 h31" stroke={AC} strokeWidth="2.4" strokeLinecap="round" opacity="0.9" />
    </g>
  ),
  corner: (
    <g>
      <path d="M12 12 v9 M12 12 h9" stroke={P1} strokeWidth="3" strokeLinecap="round" />
      <circle cx="30" cy="30" r="7" fill={P2} />
      <path d="M22 30 l8 0" stroke={P1} strokeWidth="2.6" strokeLinecap="round" />
    </g>
  ),
  friend: (
    <g>
      <circle cx="19" cy="17" r="7" fill={P1} />
      <path d="M7 39 c0-8 6-12 12-12 s12 4 12 12z" fill={P1} />
      <path d="M36 14 v10 M31 19 h10" stroke={P2} strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  refer: (
    <g>
      <circle cx="17" cy="16" r="6.5" fill={P1} />
      <path d="M6 38 c0-7 5-11 11-11 s11 4 11 11z" fill={P1} />
      <path d="M30 22 h10 m-4-4 4 4 -4 4" fill="none" stroke={P2} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  share: (
    <g>
      {[[14, 14], [14, 34], [34, 24]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5.5" fill={i === 2 ? P2 : P1} />
      ))}
      <path d="M16 16 l16 7 M16 32 l16-7" stroke={AC} strokeWidth="2.2" />
    </g>
  ),
  palette: (
    <g>
      <path d="M24 8 a16 16 0 1 0 0 32 c3 0 4-2 3-4 -1-2 0-4 3-4 h3 a7 7 0 0 0 7-7 c0-9-8-13-19-13z" fill={P1} />
      <circle cx="17" cy="18" r="2.6" fill={P2} />
      <circle cx="27" cy="15" r="2.6" fill={AC} />
      <circle cx="32" cy="24" r="2.6" fill={P2} />
    </g>
  ),
};

const FRAME_PTS = '34,7 66,7 93,34 93,66 66,93 34,93 7,66 7,34';

export function AchievementBadge({
  icon,
  tier = 1,
  earned,
  size = 72,
  title,
  onClick,
}: {
  icon: string;
  tier?: number;
  earned: boolean;
  size?: number;
  title?: string;
  onClick?: () => void;
}) {
  const glyph = GLYPHS[icon] ?? GLYPHS.medal;
  const t = Math.max(1, Math.min(5, tier));
  const pipW = (t - 1) * 8;
  return (
    <span
      className={`ach-badge tier-${t} ${earned ? 'is-earned' : 'is-locked'}`}
      style={{ width: size, height: size }}
      title={title}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <polygon className="ach-frame" points={FRAME_PTS} />
        <g transform="translate(26 22)">{glyph}</g>
        {t > 1 && (
          <g className="ach-pips">
            {Array.from({ length: t }, (_, i) => (
              <circle key={i} cx={50 - pipW / 2 + i * 8} cy="86" r="2.4" />
            ))}
          </g>
        )}
      </svg>
    </span>
  );
}
