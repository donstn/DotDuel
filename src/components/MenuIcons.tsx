/**
 * Original line-art menu icons. All stroke = currentColor so they tint with the
 * active theme; a few accents pull brand-dot CSS vars (--p1/--p2/--accent) for
 * pop. viewBox 0 0 48 48; size comes from the parent (.menu-cat-ic svg). No
 * third-party icon set — these are hand-drawn to stay on the zero-cost stack.
 */

type IconProps = { className?: string };

const base = {
  viewBox: '0 0 48 48',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.3,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

// Single player — a squad of bots (one front, two behind = "an army").
export function BotSquadIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <g opacity="0.4">
        <rect x="3.5" y="18" width="12.5" height="12.5" rx="4.5" />
        <rect x="32" y="18" width="12.5" height="12.5" rx="4.5" />
      </g>
      <line x1="24" y1="6.5" x2="24" y2="11" />
      <circle cx="24" cy="5" r="1.7" fill="currentColor" stroke="none" />
      <rect x="13" y="11" width="22" height="20" rx="6.5" />
      <path d="M10.5 22 h2.5 M35 22 h2.5" />
      <circle cx="19.5" cy="20.5" r="2.1" fill="currentColor" stroke="none" />
      <circle cx="28.5" cy="20.5" r="2.1" fill="currentColor" stroke="none" />
      <path d="M20 26.5 h8" />
    </svg>
  );
}

// Multiplayer — two players (head + shoulders) facing off, brand-coloured, with
// a small accent "vs" bolt between them.
export function DuelIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="14" cy="17" r="6.2" fill="var(--p1-bright, #62cf90)" />
      <path d="M4.5 34 c0-6 4.3-9.2 9.5-9.2" />
      <circle cx="34" cy="17" r="6.2" fill="var(--p2-glow, #f0fbcf)" />
      <path d="M43.5 34 c0-6 -4.3-9.2 -9.5-9.2" />
      <path d="M25 12 l-2.4 5.6 h3.6 l-2.4 5.6" stroke="var(--accent, #7bdb95)" />
    </svg>
  );
}

// Rankings — a winners' podium with a star over the tallest step.
export function PodiumIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path
        d="M24 5 l1.9 3.9 4.3.6 -3.1 3 .7 4.3 -3.8-2 -3.8 2 .7-4.3 -3.1-3 4.3-.6z"
        fill="var(--accent, #7bdb95)"
        stroke="none"
      />
      <rect x="18.5" y="23" width="11" height="19" rx="1.5" fill="var(--accent, #7bdb95)" fillOpacity="0.16" />
      <rect x="6" y="30" width="11" height="12" rx="1.5" />
      <rect x="31" y="34" width="11" height="8" rx="1.5" />
    </svg>
  );
}

// Daily puzzle — a calendar with a clock face inside (daily + 3-minute timer).
export function DailyIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="8" y="11" width="32" height="29" rx="5" />
      <path d="M8 19 h32 M16 8 v6 M32 8 v6" />
      <circle cx="24" cy="29.5" r="5.5" fill="var(--accent, #7bdb95)" fillOpacity="0.18" />
      <path d="M24 29.5 v-3.2 M24 29.5 l2.8 1.7" />
    </svg>
  );
}

// Hot-seat — a single device passed between two players (two brand dots inside).
export function DeviceIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="13" y="5.5" width="22" height="37" rx="5.5" />
      <path d="M21 38.5 h6" />
      <circle cx="19.5" cy="21" r="3.4" fill="var(--p1-bright, #62cf90)" stroke="none" />
      <circle cx="28.5" cy="25" r="3.4" fill="var(--p2-glow, #f0fbcf)" stroke="none" />
    </svg>
  );
}

// Online ranked — a globe with a small ranked star badge.
export function GlobeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="21" cy="24" r="15" />
      <path d="M6 24 h30 M21 9 c5.5 4.5 5.5 25.5 0 30 M21 9 c-5.5 4.5 -5.5 25.5 0 30" />
      <path
        d="M38 7 l1.4 2.9 3.2.5 -2.3 2.2.5 3.2 -2.8-1.5 -2.8 1.5.5-3.2 -2.3-2.2 3.2-.5z"
        fill="var(--accent, #7bdb95)"
        stroke="none"
      />
    </svg>
  );
}

// Puzzle rankings — a puzzle piece.
export function PuzzleIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M14 14 h5.4 a2.9 2.9 0 1 1 5.8 0 H31 v5.4 a2.9 2.9 0 1 1 0 5.8 V31 H14 v-5.9 a2.9 2.9 0 1 0 0 -5.6 z" />
    </svg>
  );
}

// Local rankings — a house (your records on this device) with a dot inside.
export function HouseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 23 L24 10 L39 23" />
      <path d="M12.5 21 v16.5 h23 v-16.5" />
      <circle cx="24" cy="29" r="3.2" fill="var(--accent, #7bdb95)" stroke="none" />
    </svg>
  );
}

// Rated rankings — a trophy (global Elo).
export function TrophyIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M16 8 h16 v6.5 a8 8 0 0 1 -16 0 z" />
      <path d="M16 10.5 H10.5 a4 4 0 0 0 4.5 6 M32 10.5 h5.5 a4 4 0 0 1 -4.5 6" />
      <path d="M24 22.5 v5.5 M18.5 35 h11 M20.5 35 c0-3.5 7-3.5 7 0" />
    </svg>
  );
}

// Achievements — a rosette medal (star disc + ribbon tails).
export function AchievementsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M18 27 l-4 15 5-3 4 4 M30 27 l4 15 -5-3 -4 4" />
      <circle cx="24" cy="18" r="13" />
      <path
        d="M24 11 l2.2 4.5 5 .7 -3.6 3.5 .9 5 -4.5-2.4 -4.5 2.4 .9-5 -3.6-3.5 5-.7z"
        fill="var(--accent, #7bdb95)"
        stroke="none"
      />
    </svg>
  );
}

// ---- Board-shape icons: little dot clusters echoing each board. fill, not
// stroke (the game is made of dots), so they read as miniature boards. ----
const dotSvg = {
  viewBox: '0 0 48 48',
  fill: 'currentColor',
  'aria-hidden': true,
};

// Triangle — apex-down rows 3·2·1 (matches the in-game board).
export function TriangleShapeIcon({ className }: IconProps) {
  return (
    <svg {...dotSvg} className={className}>
      <circle cx="11" cy="14" r="4.1" />
      <circle cx="24" cy="14" r="4.1" />
      <circle cx="37" cy="14" r="4.1" />
      <circle cx="17.5" cy="26" r="4.1" />
      <circle cx="30.5" cy="26" r="4.1" />
      <circle cx="24" cy="38" r="4.1" />
    </svg>
  );
}

// Square — 3×3 grid.
export function SquareShapeIcon({ className }: IconProps) {
  return (
    <svg {...dotSvg} className={className}>
      {[12, 24, 36].map((y) =>
        [12, 24, 36].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3.9" />),
      )}
    </svg>
  );
}

// Rectangle — 3 wide × 4 tall (portrait, like the 7×9 board).
export function RectangleShapeIcon({ className }: IconProps) {
  return (
    <svg {...dotSvg} className={className}>
      {[8, 19, 30, 41].map((y) =>
        [14, 24, 34].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3.4" />),
      )}
    </svg>
  );
}

// Rhombus — diamond rows 1·2·3·2·1.
export function RhombusShapeIcon({ className }: IconProps) {
  return (
    <svg {...dotSvg} className={className}>
      <circle cx="24" cy="7" r="3.3" />
      <circle cx="16" cy="16" r="3.3" />
      <circle cx="32" cy="16" r="3.3" />
      <circle cx="9" cy="25" r="3.3" />
      <circle cx="24" cy="25" r="3.3" />
      <circle cx="39" cy="25" r="3.3" />
      <circle cx="16" cy="34" r="3.3" />
      <circle cx="32" cy="34" r="3.3" />
      <circle cx="24" cy="43" r="3.3" />
    </svg>
  );
}
