import { useEffect, useRef, useState, type ReactNode } from 'react';
import { DIFFICULTY_LABELS } from '../types';
import type { Difficulty, Player } from '../types';
import {
  avgPerGame,
  hotseatTotal,
  safePercent,
  totalGames,
  totalGamesForRow,
  totalPointsGiven,
  totalPointsScored,
  type ModeStats,
  type PlayerRow,
} from '../storage';

interface SidePanelProps {
  side: 'left' | 'right';
  player: Player;
  active: boolean;
  thinking?: boolean;
  name: string;
  score: number;
  rating?: string;
  /** Optional live element (e.g. a clock) rendered in the rating slot. */
  ratingSlot?: ReactNode;
  avatar: 'human' | { kind: 'ai'; level: Difficulty } | { kind: 'guest'; label: string };
  colorSwap?: boolean;
  /** Per-name stats. Pass `null` for AI panel (no stats tracked). */
  stats?: PlayerRow | null;
  /** Optional control rendered directly under the player name (e.g. Resign). */
  actionSlot?: ReactNode;
  /** Optional content rendered directly under the avatar (e.g. Elo). */
  belowAvatar?: ReactNode;
}

function effectiveColor(player: Player, swap: boolean): 1 | 2 {
  if (!swap) return player;
  return player === 1 ? 2 : 1;
}

export function SidePanel({
  side,
  player,
  active,
  thinking,
  name,
  score,
  rating,
  ratingSlot,
  avatar,
  colorSwap = false,
  stats,
  actionSlot,
  belowAvatar,
}: SidePanelProps) {
  const color = effectiveColor(player, colorSwap);
  const cls = [
    'side-panel',
    `side-panel-${side}`,
    `side-panel-p${color}`,
    active ? 'active' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const prevScoreRef = useRef(score);
  const [scoreBump, setScoreBump] = useState(false);
  useEffect(() => {
    if (prevScoreRef.current === score) return;
    const increased = score > prevScoreRef.current;
    prevScoreRef.current = score;
    if (!increased) return;
    setScoreBump(true);
    const t = window.setTimeout(() => setScoreBump(false), 400);
    return () => window.clearTimeout(t);
  }, [score]);

  return (
    <aside className={cls}>
      <div className="avatar-frame">
        {avatar === 'human' ? (
          <HumanAvatar player={color} />
        ) : avatar.kind === 'guest' ? (
          <GuestAvatar label={avatar.label} player={color} />
        ) : (
          <AIAvatar level={avatar.level} />
        )}
      </div>
      {belowAvatar && <div className="player-below-avatar">{belowAvatar}</div>}
      <div className="player-name" title={name}>
        {name}
      </div>
      {actionSlot && <div className="player-action-slot">{actionSlot}</div>}
      {stats && <StatsPanel stats={stats} />}
      {(ratingSlot || rating) && (
        <div className="player-rating">{ratingSlot ?? rating}</div>
      )}
      <div className={`player-score${scoreBump ? ' score-bump' : ''}`}>{score}</div>
      {stats && <PointsTotals stats={stats} />}
      {thinking && <div className="thinking-dots" aria-label="Thinking">···</div>}
    </aside>
  );
}

function PointsTotals({ stats }: { stats: PlayerRow }) {
  const games = totalGamesForRow(stats);
  if (games === 0) return null;
  const scored = totalPointsScored(stats);
  const given = totalPointsGiven(stats);
  return (
    <div
      className="player-points-totals"
      title={`Across ${games} games: ${scored} pts scored, ${given} pts given. Averages ${avgPerGame(
        scored,
        games
      )} / ${avgPerGame(given, games)} per game.`}
    >
      <div className="pt-row pt-scored">
        <span className="pt-arrow" aria-hidden="true">↑</span>
        <span className="pt-value">{scored}</span>
        <span className="pt-avg">avg {avgPerGame(scored, games)}</span>
      </div>
      <div className="pt-row pt-given">
        <span className="pt-arrow" aria-hidden="true">↓</span>
        <span className="pt-value">{given}</span>
        <span className="pt-avg">avg {avgPerGame(given, games)}</span>
      </div>
    </div>
  );
}

function StatsPanel({ stats }: { stats: PlayerRow }) {
  // Per-difficulty AI rows (only non-empty), then aggregated HS row.
  const aiDiffEntries: { difficulty: Difficulty; stats: ModeStats; total: number }[] = [];
  for (const d of [1, 2, 3, 4, 5] as Difficulty[]) {
    const s = stats.vsAI.byDifficulty[d];
    if (!s) continue;
    const total = totalGames(s);
    if (total === 0) continue;
    aiDiffEntries.push({ difficulty: d, stats: s, total });
  }

  const hs = hotseatTotal(stats);
  const hsTotal = totalGames(hs);

  if (aiDiffEntries.length === 0 && hsTotal === 0) {
    return (
      <div className="player-stats">
        <div className="stats-line stats-line-empty">
          <span className="stats-empty">no games yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="player-stats">
      {aiDiffEntries.map((e) => (
        <StatsLine
          key={`ai-${e.difficulty}`}
          label={`AI · ${DIFFICULTY_LABELS[e.difficulty]}`}
          short={`AI L${e.difficulty}`}
          mode={e.stats}
          total={e.total}
        />
      ))}
      {hsTotal > 0 && (
        <StatsLine label="Hot-seat" short="HS" mode={hs} total={hsTotal} />
      )}
    </div>
  );
}

function StatsLine({
  label,
  short,
  mode,
  total,
}: {
  label: string;
  short: string;
  mode: ModeStats;
  total: number;
}) {
  return (
    <div
      className="stats-line"
      title={`${label}: ${total} games · ${mode.wins}W ${mode.draws}D ${mode.losses}L · ${safePercent(mode.wins, total)} wins`}
    >
      <span className="stats-mode">{short}</span>
      <span className="stats-counts">
        <span className="stats-w">{mode.wins}W</span>
        <span className="stats-d">{mode.draws}D</span>
        <span className="stats-l">{mode.losses}L</span>
      </span>
      <span className="stats-pct">{safePercent(mode.wins, total)}</span>
    </div>
  );
}

function HumanAvatar({ player }: { player: Player }) {
  const fg = player === 1 ? 'var(--avatar-p1-fg)' : 'var(--avatar-p2-fg)';
  const bgGrad = player === 1 ? 'avbg-p1' : 'avbg-p2';
  return (
    <svg viewBox="0 0 100 100" className="avatar-svg" aria-hidden="true">
      <defs>
        <radialGradient id={bgGrad} cx="35%" cy="30%" r="80%">
          {player === 1 ? (
            <>
              <stop offset="0%" stopColor="var(--p1-glow)" />
              <stop offset="65%" stopColor="var(--p1)" />
              <stop offset="100%" stopColor="var(--p1-deep)" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="var(--p2-bright)" />
              <stop offset="55%" stopColor="var(--p2)" />
              <stop offset="100%" stopColor="var(--p2-deep)" />
            </>
          )}
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill={`url(#${bgGrad})`} />
      {/* Generic person silhouette */}
      <circle cx="50" cy="40" r="13" fill={fg} opacity="0.9" />
      <path
        d="M 22 82 Q 22 60 50 60 Q 78 60 78 82 Z"
        fill={fg}
        opacity="0.9"
      />
    </svg>
  );
}

function GuestAvatar({ label, player }: { label: string; player: Player }) {
  const fg = player === 1 ? 'var(--avatar-p1-fg)' : 'var(--avatar-p2-fg)';
  const bgGrad = player === 1 ? 'gv-p1' : 'gv-p2';
  return (
    <svg viewBox="0 0 100 100" className="avatar-svg" aria-hidden="true">
      <defs>
        <radialGradient id={bgGrad} cx="35%" cy="30%" r="80%">
          {player === 1 ? (
            <>
              <stop offset="0%" stopColor="var(--p1-glow)" />
              <stop offset="65%" stopColor="var(--p1)" />
              <stop offset="100%" stopColor="var(--p1-deep)" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="var(--p2-bright)" />
              <stop offset="55%" stopColor="var(--p2)" />
              <stop offset="100%" stopColor="var(--p2-deep)" />
            </>
          )}
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill={`url(#${bgGrad})`} />
      <text
        x="50"
        y="64"
        textAnchor="middle"
        fontSize="42"
        fontWeight="700"
        fill={fg}
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {label}
      </text>
    </svg>
  );
}

function AIAvatar({ level }: { level: Difficulty }) {
  const label = `AI opponent, ${DIFFICULTY_LABELS[level]} difficulty`;
  switch (level) {
    case 1:
      return <RobotL1 label={label} />;
    case 2:
      return <RobotL2 label={label} />;
    case 3:
      return <RobotL3 label={label} />;
    case 4:
      return <RobotL4 label={label} />;
    case 5:
      return <RobotL5 label={label} />;
  }
}

/* L1 Beginner — silliest, asymmetric, drooly smile, biggest cheeks */
function RobotL1({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 100 100" className="avatar-svg" role="img" aria-label={label}>
      <defs>
        <radialGradient id="rb1-head" cx="40%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#bff7d3" />
          <stop offset="55%" stopColor="#62cf90" />
          <stop offset="100%" stopColor="#1c5e35" />
        </radialGradient>
      </defs>
      {/* floppy antenna with star */}
      <path
        d="M 50 22 Q 56 14 52 8"
        stroke="#5cd089"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 52 8 l 1.3 -2.6 l 2.7 -0.2 l -2.1 1.9 l 0.7 2.7 l -2.6 -1.4 l -2.6 1.4 l 0.7 -2.7 l -2.1 -1.9 l 2.7 0.2 z"
        fill="#ffd680"
        stroke="#7a5012"
        strokeWidth="0.5"
      />
      {/* round chubby head */}
      <rect
        x="13"
        y="24"
        width="74"
        height="60"
        rx="26"
        fill="url(#rb1-head)"
        stroke="#0a3318"
        strokeWidth="1.2"
      />
      {/* asymmetric big eyes */}
      <ellipse cx="34" cy="45" rx="8" ry="9" fill="#ffffff" />
      <ellipse cx="66" cy="45" rx="7" ry="7.5" fill="#ffffff" />
      <circle cx="35.5" cy="46.5" r="3.4" fill="#0a2818" />
      <circle cx="67" cy="46" r="3" fill="#0a2818" />
      <circle cx="37" cy="44.6" r="1.3" fill="#ffffff" />
      <circle cx="68.4" cy="44.6" r="1.1" fill="#ffffff" />
      {/* huge open-mouth smile w/ tongue */}
      <path
        d="M 28 58 Q 50 80 72 58 Q 64 70 50 70 Q 36 70 28 58 Z"
        fill="#0a2818"
        stroke="#0a2818"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <ellipse cx="50" cy="69" rx="6" ry="3" fill="#ff8e8e" />
      {/* big rosy cheeks */}
      <circle cx="21" cy="58" r="4.6" fill="#ff8e8e" opacity="0.6" />
      <circle cx="79" cy="58" r="4.6" fill="#ff8e8e" opacity="0.6" />
    </svg>
  );
}

/* L2 Easy — round happy, symmetric eyes, big smile, heart antenna */
function RobotL2({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 100 100" className="avatar-svg" role="img" aria-label={label}>
      <defs>
        <radialGradient id="rb2-head" cx="40%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#9bf5b8" />
          <stop offset="60%" stopColor="#3aa86b" />
          <stop offset="100%" stopColor="#0d4a23" />
        </radialGradient>
      </defs>
      {/* straight antenna with heart */}
      <line
        x1="50"
        y1="24"
        x2="50"
        y2="11"
        stroke="#5cd089"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M 50 6 c -2 -3 -6 -1 -6 2 c 0 2.5 3 4.5 6 6 c 3 -1.5 6 -3.5 6 -6 c 0 -3 -4 -5 -6 -2 z"
        fill="#ff8e8e"
        stroke="#9a3030"
        strokeWidth="0.6"
      />
      {/* rounded head */}
      <rect
        x="15"
        y="24"
        width="70"
        height="58"
        rx="20"
        fill="url(#rb2-head)"
        stroke="#0a3318"
        strokeWidth="1.2"
      />
      {/* symmetric big eyes */}
      <ellipse cx="35" cy="44" rx="7" ry="7.5" fill="#ffffff" />
      <ellipse cx="65" cy="44" rx="7" ry="7.5" fill="#ffffff" />
      <circle cx="36" cy="45" r="3" fill="#0a2818" />
      <circle cx="66" cy="45" r="3" fill="#0a2818" />
      <circle cx="37" cy="43.6" r="1" fill="#ffffff" />
      <circle cx="67" cy="43.6" r="1" fill="#ffffff" />
      {/* curved smile */}
      <path
        d="M 30 60 Q 50 74 70 60"
        stroke="#0a2818"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
      {/* subtle cheeks */}
      <circle cx="23" cy="56" r="3.2" fill="#ff8e8e" opacity="0.45" />
      <circle cx="77" cy="56" r="3.2" fill="#ff8e8e" opacity="0.45" />
    </svg>
  );
}

/* L3 Medium — calmer, rounded square, closed-mouth smile, chest indicator */
function RobotL3({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 100 100" className="avatar-svg" role="img" aria-label={label}>
      <defs>
        <radialGradient id="rb3-head" cx="40%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#7bd49d" />
          <stop offset="60%" stopColor="#2a8e4a" />
          <stop offset="100%" stopColor="#072e15" />
        </radialGradient>
      </defs>
      <line
        x1="50"
        y1="22"
        x2="50"
        y2="10"
        stroke="#4a9e6e"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="50" cy="8" r="2.8" fill="#d3ecaa" stroke="#3a6e3a" strokeWidth="0.6" />
      <rect
        x="14"
        y="22"
        width="72"
        height="60"
        rx="14"
        fill="url(#rb3-head)"
        stroke="#072e15"
        strokeWidth="1.2"
      />
      <ellipse cx="35" cy="44" rx="6" ry="6.5" fill="#ffffff" />
      <ellipse cx="65" cy="44" rx="6" ry="6.5" fill="#ffffff" />
      <circle cx="35" cy="44.5" r="2.6" fill="#0a2818" />
      <circle cx="65" cy="44.5" r="2.6" fill="#0a2818" />
      <circle cx="36" cy="43.4" r="0.8" fill="#ffffff" />
      <circle cx="66" cy="43.4" r="0.8" fill="#ffffff" />
      {/* gentle closed-mouth smile */}
      <path
        d="M 34 62 Q 50 68 66 62"
        stroke="#0a2818"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      {/* chest indicator light */}
      <circle cx="50" cy="76" r="2.4" fill="#62cf90" stroke="#0a2818" strokeWidth="0.5" />
    </svg>
  );
}

/* L4 Hard — square head, narrow eyes, two antennae, slight frown */
function RobotL4({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 100 100" className="avatar-svg" role="img" aria-label={label}>
      <defs>
        <radialGradient id="rb4-head" cx="40%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#4a8068" />
          <stop offset="60%" stopColor="#143c22" />
          <stop offset="100%" stopColor="#02160a" />
        </radialGradient>
      </defs>
      {/* two antennae */}
      <line x1="32" y1="22" x2="29" y2="10" stroke="#2a4838" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="68" y1="22" x2="71" y2="10" stroke="#2a4838" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="29" cy="9" r="1.8" fill="#7adb95" />
      <circle cx="71" cy="9" r="1.8" fill="#7adb95" />
      <rect
        x="15"
        y="22"
        width="70"
        height="60"
        rx="6"
        fill="url(#rb4-head)"
        stroke="#02160a"
        strokeWidth="1.4"
      />
      {/* narrow rect eyes */}
      <rect x="25" y="41" width="20" height="8" rx="2" fill="#ffffff" />
      <rect x="55" y="41" width="20" height="8" rx="2" fill="#ffffff" />
      <rect x="32" y="43" width="7" height="4" rx="1" fill="#0a2818" />
      <rect x="62" y="43" width="7" height="4" rx="1" fill="#0a2818" />
      {/* slight frown */}
      <path
        d="M 32 66 Q 50 62 68 66"
        stroke="#0a2818"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      {/* forehead sensor */}
      <circle cx="50" cy="29" r="1.8" fill="#7adb95" />
    </svg>
  );
}

/* L5 Impossible — angular, glowing red eyes, frown, sharp horns + scar */
function RobotL5({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 100 100" className="avatar-svg" role="img" aria-label={label}>
      <defs>
        <radialGradient id="rb5-head" cx="40%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#2e3a32" />
          <stop offset="55%" stopColor="#0a1410" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
        <radialGradient id="rb5-eye" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#ffb097" />
          <stop offset="35%" stopColor="#ff4040" />
          <stop offset="75%" stopColor="#a01818" />
          <stop offset="100%" stopColor="#3a0808" />
        </radialGradient>
        <filter id="rb5-eyeglow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* sharp horns */}
      <line x1="28" y1="22" x2="22" y2="3" stroke="#3a4a40" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="50" y1="20" x2="50" y2="2" stroke="#3a4a40" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="72" y1="22" x2="78" y2="3" stroke="#3a4a40" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="22" cy="2" r="1.8" fill="#ff4040" filter="url(#rb5-eyeglow)" />
      <circle cx="50" cy="1.5" r="1.8" fill="#ff4040" filter="url(#rb5-eyeglow)" />
      <circle cx="78" cy="2" r="1.8" fill="#ff4040" filter="url(#rb5-eyeglow)" />
      {/* angular head w/ chamfered top */}
      <path
        d="M 20 22 L 30 14 L 70 14 L 80 22 L 80 78 Q 80 82 76 82 L 24 82 Q 20 82 20 78 Z"
        fill="url(#rb5-head)"
        stroke="#02080a"
        strokeWidth="1.5"
      />
      {/* eye sockets */}
      <rect x="25" y="39" width="20" height="7" rx="1.5" fill="#0a0606" />
      <rect x="55" y="39" width="20" height="7" rx="1.5" fill="#0a0606" />
      {/* glowing red eyes */}
      <circle cx="35" cy="42.5" r="2.8" fill="url(#rb5-eye)" filter="url(#rb5-eyeglow)" />
      <circle cx="65" cy="42.5" r="2.8" fill="url(#rb5-eye)" filter="url(#rb5-eyeglow)" />
      {/* frown */}
      <path
        d="M 30 70 Q 50 60 70 70"
        stroke="#9a3030"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
      {/* battle scar across forehead */}
      <path
        d="M 32 26 L 38 32 L 34 36 L 40 40"
        stroke="#5a6a60"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      {/* metallic seam */}
      <line x1="50" y1="46" x2="50" y2="60" stroke="#3a4a40" strokeWidth="0.8" opacity="0.6" />
    </svg>
  );
}
