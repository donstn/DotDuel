import { DIFFICULTY_LABELS } from './types';
import type { Difficulty, Progress, ShapeId } from './types';

const KEY = 'dotduel:progress:v3';

function defaultProgress(): Progress {
  return {
    unlocked: {
      triangle: 1,
      square: 0,
      rectangle: 0,
      rhombus: 0,
    },
    wins: {},
  };
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Progress;
    return {
      unlocked: { ...defaultProgress().unlocked, ...parsed.unlocked },
      wins: parsed.wins ?? {},
    };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // ignore quota / private-mode errors
  }
}

function winKey(shape: ShapeId, diff: Difficulty): string {
  return `${shape}:${diff}`;
}

export function isUnlocked(
  progress: Progress,
  shape: ShapeId,
  diff: Difficulty
): boolean {
  const unlocked = progress.unlocked[shape];
  if (unlocked === 0) return false;
  return diff <= unlocked;
}

export function availableDifficulties(
  progress: Progress,
  shape: ShapeId
): Difficulty[] {
  const all: Difficulty[] = [1, 2, 3, 4, 5];
  return all.filter((d) => isUnlocked(progress, shape, d));
}

const SHAPE_ORDER: ShapeId[] = ['triangle', 'square', 'rectangle', 'rhombus'];

function nextShape(current: ShapeId): ShapeId | null {
  const i = SHAPE_ORDER.indexOf(current);
  if (i < 0 || i >= SHAPE_ORDER.length - 1) return null;
  return SHAPE_ORDER[i + 1];
}

export function recordWin(
  progress: Progress,
  shape: ShapeId,
  diff: Difficulty
): Progress {
  const wins = { ...progress.wins, [winKey(shape, diff)]: true };
  const unlocked = { ...progress.unlocked };

  // Within-shape: beating any level unlocks the next one (capped at 5).
  if (diff < 5) {
    const next = (diff + 1) as Difficulty;
    if (unlocked[shape] < next) unlocked[shape] = next;
  }

  // Cross-shape: beating Easy (L2) or higher on the current shape
  // unlocks the next shape at Beginner (L1).
  if (diff >= 2) {
    const after = nextShape(shape);
    if (after && unlocked[after] === 0) {
      unlocked[after] = 1;
    }
  }

  return { unlocked, wins };
}

export function resetProgress(): Progress {
  const p = defaultProgress();
  saveProgress(p);
  return p;
}

// ---------------- Settings (names, color swap, tutorial, counters) ----------------
//
// :v2 bump (Phase 1b, 2026-05-31): adds showClaimableLines + per-concept hint
// flags + lastPlayedAt. Per the resolved Decision 1 in the strategy plan there
// is NO migration code — existing v1 alpha testers re-default to v2 (lose
// saved player name + tutorialSeen). Stats (v4) and progress (v3) live in
// separate keys and are untouched.

const SETTINGS_KEY = 'dotduel:settings:v2';

export interface Settings {
  playerName: string;
  opponentName: string;
  hotseatColorSwap: boolean;
  tutorialSeen: boolean;
  gamesPlayed: number;
  claimsMade: number;
  showClaimableLines: boolean;
  showClaimableLinesL4: boolean;
  lastPlayedAt: number;
}

function defaultSettings(): Settings {
  return {
    playerName: 'Player 1',
    opponentName: 'Player 2',
    hotseatColorSwap: false,
    tutorialSeen: false,
    gamesPlayed: 0,
    claimsMade: 0,
    showClaimableLines: true,
    showClaimableLinesL4: false,
    lastPlayedAt: 0,
  };
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const merged: Settings = { ...defaultSettings(), ...parsed };
    return merged;
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    // ignore quota / private-mode
  }
}

// ---------------- Per-name local stats (v4) ----------------
//
// Keyed by lowercased + trimmed name to avoid "Alice" vs "alice " duplicates.
// Display name (last-used casing) preserved separately.
// Percentages are NEVER stored — derived on read to avoid drift.
// Totals are NEVER stored — aggregated from breakdowns on read.
// Renaming "Alice" → "Alicia" creates a new player; old stats remain under "alice".
//
// Breakdowns:
//   vsAI:       by difficulty AND by shape (each game increments both)
//   hotseat:    by shape only (no difficulty in hot-seat)
//   byOpponent: per-opponent W/D/L for head-to-head views; opponent key is
//               normKey(human name) or aiOpponentKey(difficulty).

const STATS_KEY = 'dotduel:stats:v4';
const STATS_KEY_V3 = 'dotduel:stats:v3';

export const AI_OPPONENT_KEY_PREFIX = 'ai:';

export function aiOpponentKey(diff: Difficulty): string {
  return `${AI_OPPONENT_KEY_PREFIX}${diff}`;
}

export function aiOpponentDisplayName(diff: Difficulty): string {
  return `AI · ${DIFFICULTY_LABELS[diff]}`;
}

export function parseAiOpponentKey(key: string): Difficulty | null {
  if (!key.startsWith(AI_OPPONENT_KEY_PREFIX)) return null;
  const n = Number(key.slice(AI_OPPONENT_KEY_PREFIX.length));
  if (!Number.isInteger(n) || n < 1 || n > 5) return null;
  return n as Difficulty;
}

export function isAiOpponentKey(key: string): boolean {
  return parseAiOpponentKey(key) !== null;
}

export interface ModeStats {
  wins: number;
  draws: number;
  losses: number;
}

export interface PlayerRow {
  name: string;
  vsAI: {
    byDifficulty: Partial<Record<Difficulty, ModeStats>>;
    byShape: Partial<Record<ShapeId, ModeStats>>;
    pointsScored: number;
    pointsGiven: number;
  };
  hotseat: {
    byShape: Partial<Record<ShapeId, ModeStats>>;
    pointsScored: number;
    pointsGiven: number;
  };
  byOpponent: Record<string, ModeStats>;
}

export interface StatsStore {
  players: Record<string, PlayerRow>;
}

export type Outcome = 'win' | 'draw' | 'loss';
export type StatsMode = 'ai' | 'hotseat';

const EMPTY_MODE: ModeStats = { wins: 0, draws: 0, losses: 0 };

function emptyRow(name: string): PlayerRow {
  return {
    name,
    vsAI: { byDifficulty: {}, byShape: {}, pointsScored: 0, pointsGiven: 0 },
    hotseat: { byShape: {}, pointsScored: 0, pointsGiven: 0 },
    byOpponent: {},
  };
}

export function normKey(name: string): string {
  return name.trim().toLowerCase();
}

function bumpBucket(
  buckets: Record<string, ModeStats | undefined>,
  key: string,
  outcome: Outcome
): void {
  const cur = buckets[key] ?? { ...EMPTY_MODE };
  if (outcome === 'win') cur.wins += 1;
  else if (outcome === 'draw') cur.draws += 1;
  else cur.losses += 1;
  buckets[key] = cur;
}

type LegacyV3Row = Omit<PlayerRow, 'byOpponent'> & { byOpponent?: Record<string, ModeStats> };

function backfillOpponentBuckets(row: LegacyV3Row): PlayerRow {
  const byOpponent: Record<string, ModeStats> = { ...(row.byOpponent ?? {}) };
  for (const [diffStr, bucket] of Object.entries(row.vsAI.byDifficulty)) {
    if (!bucket) continue;
    const diff = Number(diffStr);
    if (!Number.isInteger(diff) || diff < 1 || diff > 5) continue;
    const key = aiOpponentKey(diff as Difficulty);
    if (byOpponent[key]) continue;
    byOpponent[key] = { wins: bucket.wins, draws: bucket.draws, losses: bucket.losses };
  }
  return { ...row, byOpponent } as PlayerRow;
}

function migrateV3IfPresent(): StatsStore | null {
  try {
    const raw = localStorage.getItem(STATS_KEY_V3);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { players?: Record<string, LegacyV3Row> };
    const players = parsed.players ?? {};
    const migrated: Record<string, PlayerRow> = {};
    for (const [key, row] of Object.entries(players)) {
      migrated[key] = backfillOpponentBuckets(row);
    }
    const store: StatsStore = { players: migrated };
    saveStats(store);
    return store;
  } catch {
    return null;
  }
}

export function loadStats(): StatsStore {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { players?: Record<string, LegacyV3Row> };
      const players = parsed.players ?? {};
      const normalized: Record<string, PlayerRow> = {};
      for (const [key, row] of Object.entries(players)) {
        normalized[key] = row.byOpponent ? (row as PlayerRow) : backfillOpponentBuckets(row);
      }
      return { players: normalized };
    }
    const fromV3 = migrateV3IfPresent();
    if (fromV3) return fromV3;
    return { players: {} };
  } catch {
    return { players: {} };
  }
}

export function loadAllPlayerRows(): PlayerRow[] {
  return Object.values(loadStats().players);
}

export function saveStats(s: StatsStore): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
  } catch {
    // ignore quota / private-mode
  }
}

export function getPlayerRow(name: string): PlayerRow {
  if (!name || !name.trim()) return emptyRow(name);
  const key = normKey(name);
  const row = loadStats().players[key];
  return row ?? emptyRow(name);
}

export function recordGameResult(
  name: string,
  mode: StatsMode,
  outcome: Outcome,
  shape: ShapeId,
  myScore: number,
  oppScore: number,
  difficulty?: Difficulty,
  opponentKey?: string
): void {
  if (!name || !name.trim()) return;
  const key = normKey(name);
  const store = loadStats();
  const existing = store.players[key] ?? emptyRow(name);
  existing.name = name;
  if (!existing.byOpponent) existing.byOpponent = {};
  if (mode === 'ai') {
    if (difficulty !== undefined) {
      bumpBucket(existing.vsAI.byDifficulty, String(difficulty), outcome);
    }
    bumpBucket(existing.vsAI.byShape, shape, outcome);
    existing.vsAI.pointsScored += myScore;
    existing.vsAI.pointsGiven += oppScore;
  } else {
    bumpBucket(existing.hotseat.byShape, shape, outcome);
    existing.hotseat.pointsScored += myScore;
    existing.hotseat.pointsGiven += oppScore;
  }
  if (opponentKey && opponentKey !== key) {
    bumpBucket(existing.byOpponent, opponentKey, outcome);
  }
  store.players[key] = existing;
  saveStats(store);
}

export function aggregateMode(
  buckets: Partial<Record<string, ModeStats>>
): ModeStats {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  for (const v of Object.values(buckets)) {
    if (!v) continue;
    wins += v.wins;
    draws += v.draws;
    losses += v.losses;
  }
  return { wins, draws, losses };
}

export function vsAITotal(row: PlayerRow): ModeStats {
  return aggregateMode(row.vsAI.byDifficulty);
}

export function hotseatTotal(row: PlayerRow): ModeStats {
  return aggregateMode(row.hotseat.byShape);
}

export function totalGames(s: ModeStats): number {
  return s.wins + s.draws + s.losses;
}

export function totalGamesForRow(row: PlayerRow): number {
  return totalGames(vsAITotal(row)) + totalGames(hotseatTotal(row));
}

export function totalPointsScored(row: PlayerRow): number {
  return row.vsAI.pointsScored + row.hotseat.pointsScored;
}

export function totalPointsGiven(row: PlayerRow): number {
  return row.vsAI.pointsGiven + row.hotseat.pointsGiven;
}

export function avgPerGame(value: number, games: number): string {
  if (games <= 0) return '—';
  return (value / games).toFixed(1);
}

export function safePercent(n: number, total: number): string {
  if (total <= 0) return '—';
  return `${Math.round((100 * n) / total)}%`;
}

export function resetStats(): void {
  try {
    localStorage.removeItem(STATS_KEY);
  } catch {
    // ignore
  }
}

export function deletePlayerStats(name: string): void {
  if (!name || !name.trim()) return;
  const key = normKey(name);
  const store = loadStats();
  delete store.players[key];
  saveStats(store);
}

// Move a player's stats row from oldName to newName so stats survive a rename.
// If there's already a row at the new key, the old row's W/D/L and points are
// added on top of it. If oldName has no row, this is a no-op.
export function migrateStatsKey(oldName: string, newName: string): void {
  if (!oldName?.trim() || !newName?.trim()) return;
  const oldKey = normKey(oldName);
  const newKey = normKey(newName);
  if (oldKey === newKey) return;
  const store = loadStats();
  const oldRow = store.players[oldKey];
  if (!oldRow) return;
  const existing = store.players[newKey];
  if (!existing) {
    store.players[newKey] = { ...oldRow, name: newName };
  } else {
    existing.name = newName;
    mergeModeBuckets(existing.vsAI.byDifficulty, oldRow.vsAI.byDifficulty);
    mergeModeBuckets(existing.vsAI.byShape, oldRow.vsAI.byShape);
    existing.vsAI.pointsScored += oldRow.vsAI.pointsScored;
    existing.vsAI.pointsGiven += oldRow.vsAI.pointsGiven;
    mergeModeBuckets(existing.hotseat.byShape, oldRow.hotseat.byShape);
    existing.hotseat.pointsScored += oldRow.hotseat.pointsScored;
    existing.hotseat.pointsGiven += oldRow.hotseat.pointsGiven;
    mergeModeBuckets(existing.byOpponent, oldRow.byOpponent);
  }
  delete store.players[oldKey];
  for (const row of Object.values(store.players)) {
    if (row.byOpponent?.[oldKey]) {
      const incoming = row.byOpponent[oldKey];
      const cur = row.byOpponent[newKey] ?? { ...EMPTY_MODE };
      cur.wins += incoming.wins;
      cur.draws += incoming.draws;
      cur.losses += incoming.losses;
      row.byOpponent[newKey] = cur;
      delete row.byOpponent[oldKey];
    }
  }
  saveStats(store);
}

function mergeModeBuckets(
  target: Partial<Record<string, ModeStats>>,
  source: Partial<Record<string, ModeStats>>,
): void {
  for (const [k, v] of Object.entries(source)) {
    if (!v) continue;
    const cur = target[k] ?? { ...EMPTY_MODE };
    cur.wins += v.wins;
    cur.draws += v.draws;
    cur.losses += v.losses;
    target[k] = cur;
  }
}

// Fully remove a player from the local stats store. Their row is dropped AND
// their key is scrubbed from every other player's byOpponent, so they vanish
// from leaderboards and head-to-head views. Other players' aggregate W/D/L
// totals are left untouched — those reflect games they actually played.
export function purgePlayer(name: string): void {
  if (!name || !name.trim()) return;
  const key = normKey(name);
  const store = loadStats();
  delete store.players[key];
  for (const row of Object.values(store.players)) {
    if (row.byOpponent && row.byOpponent[key]) {
      delete row.byOpponent[key];
    }
  }
  saveStats(store);
}
