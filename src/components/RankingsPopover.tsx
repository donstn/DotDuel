import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  aiOpponentDisplayName,
  aiOpponentKey,
  hotseatTotal,
  isAiOpponentKey,
  loadAllPlayerRows,
  normKey,
  parseAiOpponentKey,
  purgePlayer,
  vsAITotal,
  type ModeStats,
  type PlayerRow,
} from '../storage';
import { PLAYABLE_SHAPE_META, SHAPE_LABEL } from '../types';
import type { Difficulty, ShapeId } from '../types';
import {
  watchLeaderboard,
  type LeaderboardEntry,
} from '../cloud/leaderboard';

const PLACEMENT_TOTAL = 10;

type View = 'global' | 'local';

interface Props {
  onClose: () => void;
  user: User | null;
  onOpenSignIn?: () => void;
}

type ShapeFilter = 'all' | ShapeId;
type LeaderSortKey = 'games' | 'winPct';
type H2HSortKey =
  | 'name'
  | 'games'
  | 'wins'
  | 'losses'
  | 'draws'
  | 'winPct'
  | 'lossPct'
  | 'drawPct';
type SortDir = 'asc' | 'desc';

type Subject =
  | { kind: 'player'; key: string; name: string }
  | { kind: 'ai'; diff: Difficulty; name: string };

interface LeaderRow {
  key: string;
  name: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
}

interface H2HRow {
  key: string;
  display: string;
  isAI: boolean;
  diff?: Difficulty;
  wins: number;
  draws: number;
  losses: number;
  games: number;
}

function statsForShape(row: PlayerRow, shape: ShapeFilter): ModeStats {
  if (shape === 'all') {
    const a = vsAITotal(row);
    const h = hotseatTotal(row);
    return {
      wins: a.wins + h.wins,
      draws: a.draws + h.draws,
      losses: a.losses + h.losses,
    };
  }
  const a = row.vsAI.byShape[shape] ?? { wins: 0, draws: 0, losses: 0 };
  const h = row.hotseat.byShape[shape] ?? { wins: 0, draws: 0, losses: 0 };
  return {
    wins: a.wins + h.wins,
    draws: a.draws + h.draws,
    losses: a.losses + h.losses,
  };
}

function winPctValue(s: { wins: number; draws: number; losses: number }): number {
  const g = s.wins + s.draws + s.losses;
  if (g === 0) return -1;
  return s.wins / g;
}

function pctLabel(part: number, total: number): string {
  if (total <= 0) return '—';
  return `${Math.round((100 * part) / total)}%`;
}

function sortLeaderRows(rows: LeaderRow[], key: LeaderSortKey, dir: SortDir): LeaderRow[] {
  const sign = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (key === 'games') {
      const d = a.games - b.games;
      if (d !== 0) return sign * d;
      return a.name.localeCompare(b.name);
    }
    const d = winPctValue(a) - winPctValue(b);
    if (d !== 0) return sign * d;
    const gd = b.games - a.games;
    if (gd !== 0) return gd;
    return a.name.localeCompare(b.name);
  });
}

function sortH2HRows(rows: H2HRow[], key: H2HSortKey, dir: SortDir): H2HRow[] {
  const sign = dir === 'asc' ? 1 : -1;
  const valueOf = (r: H2HRow): number => {
    switch (key) {
      case 'games':
        return r.games;
      case 'wins':
        return r.wins;
      case 'losses':
        return r.losses;
      case 'draws':
        return r.draws;
      case 'winPct':
        return winPctValue(r);
      case 'lossPct':
        return r.games > 0 ? r.losses / r.games : -1;
      case 'drawPct':
        return r.games > 0 ? r.draws / r.games : -1;
      default:
        return 0;
    }
  };
  return [...rows].sort((a, b) => {
    if (key === 'name') {
      return sign * a.display.localeCompare(b.display);
    }
    const d = valueOf(a) - valueOf(b);
    if (d !== 0) return sign * d;
    const gd = b.games - a.games;
    if (gd !== 0) return gd;
    return a.display.localeCompare(b.display);
  });
}

function buildPlayerH2H(row: PlayerRow): H2HRow[] {
  const all = loadAllPlayerRows();
  const nameByKey = new Map<string, string>();
  for (const r of all) nameByKey.set(normKey(r.name), r.name);
  const out: H2HRow[] = [];
  for (const [key, bucket] of Object.entries(row.byOpponent)) {
    if (!bucket) continue;
    const games = bucket.wins + bucket.draws + bucket.losses;
    if (games === 0) continue;
    if (isAiOpponentKey(key)) {
      const diff = parseAiOpponentKey(key)!;
      out.push({
        key,
        display: aiOpponentDisplayName(diff),
        isAI: true,
        diff,
        wins: bucket.wins,
        draws: bucket.draws,
        losses: bucket.losses,
        games,
      });
    } else {
      out.push({
        key,
        display: nameByKey.get(key) ?? key,
        isAI: false,
        wins: bucket.wins,
        draws: bucket.draws,
        losses: bucket.losses,
        games,
      });
    }
  }
  return out;
}

function buildAiH2H(diff: Difficulty): H2HRow[] {
  const key = aiOpponentKey(diff);
  const all = loadAllPlayerRows();
  const out: H2HRow[] = [];
  for (const row of all) {
    const b = row.byOpponent[key];
    if (!b) continue;
    const games = b.wins + b.draws + b.losses;
    if (games === 0) continue;
    out.push({
      key: normKey(row.name),
      display: row.name,
      isAI: false,
      wins: b.losses,
      draws: b.draws,
      losses: b.wins,
      games,
    });
  }
  return out;
}

export function RankingsPopover({ onClose, user, onOpenSignIn }: Props) {
  // Signed-in users get Global by default (the more interesting view).
  // Signed-out users get Local so they don't bounce off a sign-in CTA.
  const [view, setView] = useState<View>(user ? 'global' : 'local');
  const [stack, setStack] = useState<Subject[]>([]);
  const [shape, setShape] = useState<ShapeFilter>('all');
  const [lbSort, setLbSort] = useState<{ key: LeaderSortKey; dir: SortDir }>({
    key: 'games',
    dir: 'desc',
  });
  const [h2hSort, setH2HSort] = useState<{ key: H2HSortKey; dir: SortDir }>({
    key: 'games',
    dir: 'desc',
  });
  const [confirmDelete, setConfirmDelete] = useState<{ key: string; name: string } | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [globalRows, setGlobalRows] = useState<LeaderboardEntry[]>([]);
  const [globalLoading, setGlobalLoading] = useState(true);

  // Subscribe to global leaderboard whenever the popover is open with a
  // signed-in user. Only active in the global view (saves Firestore reads
  // when the user is browsing local data).
  useEffect(() => {
    if (view !== 'global' || !user) {
      setGlobalLoading(false);
      return;
    }
    setGlobalLoading(true);
    const unsub = watchLeaderboard((rows) => {
      setGlobalRows(rows);
      setGlobalLoading(false);
    }, 50);
    return unsub;
  }, [view, user?.uid]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmDelete) {
        setConfirmDelete(null);
        return;
      }
      if (stack.length > 0) {
        setStack((s) => s.slice(0, -1));
      } else {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stack.length, onClose, confirmDelete]);

  const onBackdrop = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    if (confirmDelete) {
      setConfirmDelete(null);
      return;
    }
    if (stack.length > 0) {
      setStack((s) => s.slice(0, -1));
    } else {
      onClose();
    }
  };

  const playerRows = useMemo(
    () => loadAllPlayerRows(),
    [stack, shape, lbSort, h2hSort, dataVersion]
  );

  const leaderRows = useMemo<LeaderRow[]>(() => {
    const rows: LeaderRow[] = [];
    for (const row of playerRows) {
      const s = statsForShape(row, shape);
      const games = s.wins + s.draws + s.losses;
      if (games === 0) continue;
      rows.push({
        key: normKey(row.name),
        name: row.name,
        games,
        wins: s.wins,
        draws: s.draws,
        losses: s.losses,
      });
    }
    return sortLeaderRows(rows, lbSort.key, lbSort.dir);
  }, [playerRows, shape, lbSort]);

  const current = stack[stack.length - 1];

  const h2hRows = useMemo<H2HRow[]>(() => {
    if (!current) return [];
    const base =
      current.kind === 'player'
        ? (() => {
            const row = playerRows.find((r) => normKey(r.name) === current.key);
            return row ? buildPlayerH2H(row) : [];
          })()
        : buildAiH2H(current.diff);
    return sortH2HRows(base, h2hSort.key, h2hSort.dir);
  }, [current, playerRows, h2hSort]);

  const openSubject = (next: Subject) => {
    setStack((s) => [...s, next]);
    setH2HSort({ key: 'games', dir: 'desc' });
  };

  const goBack = () => setStack((s) => s.slice(0, -1));

  const doDelete = () => {
    if (!confirmDelete) return;
    purgePlayer(confirmDelete.name);
    setConfirmDelete(null);
    setStack([]);
    setDataVersion((v) => v + 1);
  };

  const toggleLbSort = (key: LeaderSortKey) => {
    setLbSort((cur) => {
      if (cur.key === key) {
        return { key, dir: cur.dir === 'desc' ? 'asc' : 'desc' };
      }
      return { key, dir: key === 'games' ? 'desc' : 'desc' };
    });
  };

  const toggleH2HSort = (key: H2HSortKey) => {
    setH2HSort((cur) => {
      if (cur.key === key) {
        return { key, dir: cur.dir === 'desc' ? 'asc' : 'desc' };
      }
      const initial: SortDir = key === 'name' ? 'asc' : 'desc';
      return { key, dir: initial };
    });
  };

  const sortGlyph = (active: boolean, dir: SortDir) => {
    if (!active) return '↕';
    return dir === 'asc' ? '▲' : '▼';
  };

  return (
    <>
    <div
      className="rules-overlay"
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Rankings"
    >
      <div className="rules-card rankings-card">
        <button
          className="rules-close"
          onClick={() => (stack.length > 0 ? goBack() : onClose())}
          aria-label={stack.length > 0 ? 'Back to rankings' : 'Close rankings'}
          title={stack.length > 0 ? 'Back' : 'Close'}
        >
          {stack.length > 0 ? '‹' : '✕'}
        </button>

        <header className="rules-header">
          {current ? (
            <>
              <h2>
                <span className="rankings-subject-name">{current.name}</span>
                <span className="rankings-subject-tag">
                  {current.kind === 'ai' ? 'AI opponent' : 'Player'}
                </span>
              </h2>
              <p className="rules-tagline">Head-to-head record by opponent.</p>
            </>
          ) : (
            <>
              <h2>Rankings</h2>
              <p className="rules-tagline">
                {view === 'global'
                  ? 'Global Elo across all multiplayer players.'
                  : 'Local profiles on this device — vs-AI and hot-seat history.'}
              </p>
            </>
          )}
        </header>

        <div className="rankings-body">
          {!current && (
            <div className="rankings-view-toggle">
              <button
                type="button"
                className={`rankings-pill ${view === 'global' ? 'active' : ''}`}
                onClick={() => {
                  setView('global');
                  setStack([]);
                }}
              >
                Global Elo
              </button>
              <button
                type="button"
                className={`rankings-pill ${view === 'local' ? 'active' : ''}`}
                onClick={() => {
                  setView('local');
                  setStack([]);
                }}
              >
                Local
              </button>
            </div>
          )}

          {!current && view === 'global' && (
            <GlobalLeaderboard
              rows={globalRows}
              loading={globalLoading}
              signedIn={!!user}
              myUid={user?.uid ?? null}
              onSignIn={onOpenSignIn}
            />
          )}

          {!current && view === 'local' && (
            <>
              <div className="rankings-toolbar">
                <span className="rankings-toolbar-label">Shape:</span>
                <div className="rankings-pills">
                  <button
                    className={`rankings-pill ${shape === 'all' ? 'active' : ''}`}
                    onClick={() => setShape('all')}
                  >
                    All
                  </button>
                  {PLAYABLE_SHAPE_META.map((s) => (
                    <button
                      key={s.id}
                      className={`rankings-pill ${shape === s.id ? 'active' : ''}`}
                      onClick={() => setShape(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {leaderRows.length === 0 ? (
                <p className="rankings-empty">
                  {shape === 'all'
                    ? 'No games recorded yet on this device.'
                    : `No games on ${SHAPE_LABEL[shape as ShapeId]} yet.`}
                </p>
              ) : (
                <div className="rankings-table-wrap">
                  <table className="rankings-table">
                    <thead>
                      <tr>
                        <th className="col-rank">#</th>
                        <th className="col-name">Player</th>
                        <th
                          className={`col-num sortable ${lbSort.key === 'games' ? 'active' : ''}`}
                          onClick={() => toggleLbSort('games')}
                        >
                          Games <span className="sort-glyph">{sortGlyph(lbSort.key === 'games', lbSort.dir)}</span>
                        </th>
                        <th className="col-num">W</th>
                        <th className="col-num">L</th>
                        <th className="col-num">D</th>
                        <th
                          className={`col-num sortable ${lbSort.key === 'winPct' ? 'active' : ''}`}
                          onClick={() => toggleLbSort('winPct')}
                        >
                          Win % <span className="sort-glyph">{sortGlyph(lbSort.key === 'winPct', lbSort.dir)}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderRows.map((r, i) => (
                        <tr key={r.key}>
                          <td className="col-rank">{i + 1}</td>
                          <td className="col-name">
                            <button
                              className="rankings-name-link"
                              onClick={() =>
                                openSubject({ kind: 'player', key: r.key, name: r.name })
                              }
                            >
                              {r.name}
                            </button>
                          </td>
                          <td className="col-num">{r.games}</td>
                          <td className="col-num">{r.wins}</td>
                          <td className="col-num">{r.losses}</td>
                          <td className="col-num">{r.draws}</td>
                          <td className="col-num">{pctLabel(r.wins, r.games)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {current && (
            <>
              <H2HSummary rows={h2hRows} />
              {current.kind === 'player' && (
                <div className="rankings-actions">
                  <button
                    className="settings-danger-btn"
                    onClick={() =>
                      setConfirmDelete({ key: current.key, name: current.name })
                    }
                  >
                    Delete profile
                  </button>
                </div>
              )}
              {h2hRows.length === 0 ? (
                <p className="rankings-empty">No head-to-head games recorded.</p>
              ) : (
                <div className="rankings-table-wrap">
                  <table className="rankings-table h2h-table">
                    <thead>
                      <tr>
                        <th
                          className={`col-name sortable ${h2hSort.key === 'name' ? 'active' : ''}`}
                          onClick={() => toggleH2HSort('name')}
                        >
                          Opponent <span className="sort-glyph">{sortGlyph(h2hSort.key === 'name', h2hSort.dir)}</span>
                        </th>
                        <th
                          className={`col-num sortable ${h2hSort.key === 'games' ? 'active' : ''}`}
                          onClick={() => toggleH2HSort('games')}
                        >
                          Games <span className="sort-glyph">{sortGlyph(h2hSort.key === 'games', h2hSort.dir)}</span>
                        </th>
                        <th
                          className={`col-num sortable ${h2hSort.key === 'wins' ? 'active' : ''}`}
                          onClick={() => toggleH2HSort('wins')}
                        >
                          W <span className="sort-glyph">{sortGlyph(h2hSort.key === 'wins', h2hSort.dir)}</span>
                        </th>
                        <th
                          className={`col-num sortable ${h2hSort.key === 'losses' ? 'active' : ''}`}
                          onClick={() => toggleH2HSort('losses')}
                        >
                          L <span className="sort-glyph">{sortGlyph(h2hSort.key === 'losses', h2hSort.dir)}</span>
                        </th>
                        <th
                          className={`col-num sortable ${h2hSort.key === 'draws' ? 'active' : ''}`}
                          onClick={() => toggleH2HSort('draws')}
                        >
                          D <span className="sort-glyph">{sortGlyph(h2hSort.key === 'draws', h2hSort.dir)}</span>
                        </th>
                        <th
                          className={`col-num sortable ${h2hSort.key === 'winPct' ? 'active' : ''}`}
                          onClick={() => toggleH2HSort('winPct')}
                        >
                          W % <span className="sort-glyph">{sortGlyph(h2hSort.key === 'winPct', h2hSort.dir)}</span>
                        </th>
                        <th
                          className={`col-num sortable ${h2hSort.key === 'lossPct' ? 'active' : ''}`}
                          onClick={() => toggleH2HSort('lossPct')}
                        >
                          L % <span className="sort-glyph">{sortGlyph(h2hSort.key === 'lossPct', h2hSort.dir)}</span>
                        </th>
                        <th
                          className={`col-num sortable ${h2hSort.key === 'drawPct' ? 'active' : ''}`}
                          onClick={() => toggleH2HSort('drawPct')}
                        >
                          D % <span className="sort-glyph">{sortGlyph(h2hSort.key === 'drawPct', h2hSort.dir)}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {h2hRows.map((r) => (
                        <tr key={r.key}>
                          <td className="col-name">
                            <button
                              className={`rankings-name-link ${r.isAI ? 'is-ai' : ''}`}
                              onClick={() =>
                                openSubject(
                                  r.isAI && r.diff
                                    ? { kind: 'ai', diff: r.diff, name: r.display }
                                    : { kind: 'player', key: r.key, name: r.display }
                                )
                              }
                            >
                              {r.display}
                            </button>
                          </td>
                          <td className="col-num">{r.games}</td>
                          <td className="col-num">{r.wins}</td>
                          <td className="col-num">{r.losses}</td>
                          <td className="col-num">{r.draws}</td>
                          <td className="col-num">{pctLabel(r.wins, r.games)}</td>
                          <td className="col-num">{pctLabel(r.losses, r.games)}</td>
                          <td className="col-num">{pctLabel(r.draws, r.games)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <footer className="rules-footer-bar">
          <button className="rules-got-it" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
    {confirmDelete && (
      <div
        className="rules-overlay rankings-confirm-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) setConfirmDelete(null);
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Confirm delete profile"
      >
        <div className="rules-card rankings-confirm-card">
          <header className="rules-header">
            <h2>Delete profile?</h2>
            <p className="rules-tagline">
              <strong className="rankings-confirm-name">{confirmDelete.name}</strong> will be
              removed from the rankings and from every head-to-head record on this device.
            </p>
          </header>
          <div className="rankings-confirm-body">
            <p>Do you really want to delete this? Data will be unrecoverable.</p>
          </div>
          <footer className="rules-footer-bar rankings-confirm-footer">
            <button className="rankings-confirm-cancel" onClick={() => setConfirmDelete(null)}>
              Cancel
            </button>
            <button className="settings-danger-btn rankings-confirm-delete" onClick={doDelete}>
              Delete profile
            </button>
          </footer>
        </div>
      </div>
    )}
    </>
  );
}

function GlobalLeaderboard({
  rows,
  loading,
  signedIn,
  myUid,
  onSignIn,
}: {
  rows: LeaderboardEntry[];
  loading: boolean;
  signedIn: boolean;
  myUid: string | null;
  onSignIn?: () => void;
}) {
  if (!signedIn) {
    return (
      <div className="rankings-global-signin">
        <p className="rankings-empty">
          Sign in to see the global Elo leaderboard.
        </p>
        {onSignIn && (
          <button
            type="button"
            className="rules-got-it"
            onClick={onSignIn}
          >
            Sign in
          </button>
        )}
      </div>
    );
  }
  if (loading) {
    return <p className="rankings-empty">Loading leaderboard…</p>;
  }
  if (rows.length === 0) {
    return (
      <p className="rankings-empty">
        No ranked multiplayer games played yet. Be the first to top the chart.
      </p>
    );
  }
  return (
    <div className="rankings-table-wrap">
      <table className="rankings-table">
        <thead>
          <tr>
            <th className="col-rank">#</th>
            <th className="col-num">Elo</th>
            <th className="col-name">Player</th>
            <th className="col-num">Games</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const provisional = r.placementGamesPlayed < PLACEMENT_TOTAL;
            const isMe = myUid && r.uid === myUid;
            return (
              <tr key={r.uid} className={isMe ? 'rankings-row-me' : ''}>
                <td className="col-rank">{i + 1}</td>
                <td className="col-num rankings-rating-cell">{r.rating}</td>
                <td className="col-name">
                  <span className="rankings-global-name">
                    {r.displayName}
                    {r.isBot && (
                      <span
                        className="bot-tag"
                        title="AI opponent"
                        aria-label="AI opponent"
                      >
                        BOT
                      </span>
                    )}
                    {isMe && <span className="rankings-global-me-tag">you</span>}
                    {provisional && !r.isBot && (
                      <span
                        className="provisional-badge"
                        title="Rating stabilises after 10 ranked games"
                      >
                        Provisional {r.placementGamesPlayed}/{PLACEMENT_TOTAL}
                      </span>
                    )}
                  </span>
                </td>
                <td className="col-num">{r.placementGamesPlayed}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function H2HSummary({ rows }: { rows: H2HRow[] }) {
  if (rows.length === 0) return null;
  let games = 0;
  let wins = 0;
  let losses = 0;
  let draws = 0;
  for (const r of rows) {
    games += r.games;
    wins += r.wins;
    losses += r.losses;
    draws += r.draws;
  }
  return (
    <div className="rankings-summary">
      <span className="rankings-summary-item">
        <strong>{games}</strong> games
      </span>
      <span className="rankings-summary-sep">·</span>
      <span className="rankings-summary-item">
        <strong>{wins}</strong>W / <strong>{losses}</strong>L / <strong>{draws}</strong>D
      </span>
      <span className="rankings-summary-sep">·</span>
      <span className="rankings-summary-item">
        <strong>{pctLabel(wins, games)}</strong> win rate
      </span>
    </div>
  );
}
