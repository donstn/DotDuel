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

const SETTINGS_KEY = 'dotduel:settings:v1';

export interface Settings {
  playerName: string;
  opponentName: string;
  hotseatColorSwap: boolean;
  tutorialSeen: boolean;
  gamesPlayed: number;
  claimsMade: number;
}

function defaultSettings(): Settings {
  return {
    playerName: 'Player 1',
    opponentName: 'Player 2',
    hotseatColorSwap: false,
    tutorialSeen: false,
    gamesPlayed: 0,
    claimsMade: 0,
  };
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    const parsed = JSON.parse(raw) as Partial<Settings> & {
      hotseatP1Name?: string;
      hotseatP2Name?: string;
    };
    const migrated: Settings = { ...defaultSettings(), ...parsed };
    // Migrate v1 legacy fields (hotseatP1Name / hotseatP2Name) into the unified fields.
    if (!parsed.playerName && parsed.hotseatP1Name) {
      migrated.playerName = parsed.hotseatP1Name;
    }
    if (!parsed.opponentName && parsed.hotseatP2Name) {
      migrated.opponentName = parsed.hotseatP2Name;
    }
    return migrated;
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

// ---------------- Per-name local stats (v2) ----------------
//
// Keyed by lowercased + trimmed name to avoid "Alice" vs "alice " duplicates.
// Display name (last-used casing) preserved separately.
// Percentages are NEVER stored — derived on read to avoid drift.
// Totals are NEVER stored — aggregated from breakdowns on read.
// Renaming "Alice" → "Alicia" creates a new player; old stats remain under "alice".
//
// Breakdowns:
//   vsAI:    by difficulty AND by shape (each game increments both)
//   hotseat: by shape only (no difficulty in hot-seat)

const STATS_KEY = 'dotduel:stats:v3';

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
  };
}

function normKey(name: string): string {
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

export function loadStats(): StatsStore {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { players: {} };
    const parsed = JSON.parse(raw) as StatsStore;
    return { players: parsed.players ?? {} };
  } catch {
    return { players: {} };
  }
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
  difficulty?: Difficulty
): void {
  if (!name || !name.trim()) return;
  const key = normKey(name);
  const store = loadStats();
  const existing = store.players[key] ?? emptyRow(name);
  existing.name = name;
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
