/**
 * Achievement engine — turns play into unlocks.
 *
 * Most conditions are derivable from data the app already keeps:
 *   - progress.wins['{shape}:{diff}']  → the "beat Bot X on shape" family
 *   - settings.claimsMade              → claim achievements
 *   - local PlayerRow                  → hot-seat / total game counts
 *   - cloud profile rating + streak    → Elo + consecutive-day achievements
 * The rest need a small counters store (impossible-win counts per shape, ranked
 * streaks, distinct days, themes tried, event flags) kept in localStorage here.
 *
 * Recorders update those counters then re-evaluate and return freshly-unlocked
 * ids (so callers can fire a toast). evaluate() is idempotent — store.unlock
 * skips already-earned ids.
 */
import type { Difficulty, Progress, ShapeId } from '../types';
import {
  getPlayerRow,
  hotseatTotal,
  loadProgress,
  loadSettings,
  totalGames,
  vsAITotal,
} from '../storage';
import { ACHIEVEMENTS } from './catalog';
import { unlock } from './store';

const PLAYABLE: ShapeId[] = ['triangle', 'square', 'rectangle'];
const IMPOSSIBLE: Difficulty = 5;

// ---- counters store ----
interface AchStats {
  impWins: Partial<Record<ShapeId, number>>;
  rankedPlayed: number;
  rankedWon: number;
  rankedStreak: number;
  rankedBest: number;
  botStreak: number;
  botBest: number;
  days: string[];
  dailyStreak: number;
  themes: string[];
  flags: string[];
}

const KEY = 'dotduel:ach-stats:v1';

function loadAch(): AchStats {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<AchStats>;
      return {
        impWins: p.impWins ?? {},
        rankedPlayed: p.rankedPlayed ?? 0,
        rankedWon: p.rankedWon ?? 0,
        rankedStreak: p.rankedStreak ?? 0,
        rankedBest: p.rankedBest ?? 0,
        botStreak: p.botStreak ?? 0,
        botBest: p.botBest ?? 0,
        days: p.days ?? [],
        dailyStreak: p.dailyStreak ?? 0,
        themes: p.themes ?? [],
        flags: p.flags ?? [],
      };
    }
  } catch {
    // ignore
  }
  return {
    impWins: {},
    rankedPlayed: 0,
    rankedWon: 0,
    rankedStreak: 0,
    rankedBest: 0,
    botStreak: 0,
    botBest: 0,
    days: [],
    dailyStreak: 0,
    themes: [],
    flags: [],
  };
}

function saveAch(s: AchStats) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---- context + condition evaluation ----
export interface EvalEnv {
  playerName: string;
  /** cloud Elo (0 if unknown / signed out). */
  rating: number;
  /** profiles.streak_current — consecutive days of play (0 if unknown). */
  dayStreakConsec: number;
}

interface Ctx {
  beat: (s: ShapeId, d: Difficulty) => boolean;
  shapesUnlocked: number;
  hotseatGames: number;
  totalGames: number;
  claims: number;
  imp: (s: ShapeId) => number;
  a: AchStats;
  rating: number;
  dayStreakConsec: number;
}

function buildCtx(env: EvalEnv): Ctx {
  const progress: Progress = loadProgress();
  const settings = loadSettings();
  const row = getPlayerRow(env.playerName);
  const a = loadAch();
  const localTotal = totalGames(vsAITotal(row)) + totalGames(hotseatTotal(row));
  return {
    beat: (s, d) => progress.wins[`${s}:${d}`] === true,
    shapesUnlocked: PLAYABLE.filter((s) => (progress.unlocked[s] ?? 0) > 0).length,
    hotseatGames: totalGames(hotseatTotal(row)),
    totalGames: localTotal + a.rankedPlayed,
    claims: settings.claimsMade,
    imp: (s) => a.impWins[s] ?? 0,
    a,
    rating: env.rating,
    dayStreakConsec: env.dayStreakConsec,
  };
}

function num(id: string, prefix: string): number {
  return Number(id.slice(prefix.length));
}

/** Is achievement `id` satisfied under context `c`? */
function satisfied(id: string, c: Ctx): boolean {
  const f = (name: string) => c.a.flags.includes(name);

  // generated "beat-{shape}-{d}"
  let m = /^beat-(triangle|square|rectangle)-(\d)$/.exec(id);
  if (m) return c.beat(m[1] as ShapeId, Number(m[2]) as Difficulty);
  m = /^grandmaster-(triangle|square|rectangle)$/.exec(id);
  if (m) return ([1, 2, 3, 4, 5] as Difficulty[]).every((d) => c.beat(m![1] as ShapeId, d));
  m = /^slayer-(triangle|square|rectangle)-(10|50)$/.exec(id);
  if (m) return c.imp(m[1] as ShapeId) >= Number(m[2]);

  switch (true) {
    case id === 'first-game':
      return c.totalGames >= 1;
    case id === 'first-win':
      return f('firstWin');
    case id === 'first-claim':
      return c.claims >= 1;
    case id === 'all-shapes':
      return c.shapesUnlocked >= PLAYABLE.length;
    case id === 'triple-impossible':
      return PLAYABLE.every((s) => c.beat(s, IMPOSSIBLE));
    case id === 'blowout-50':
      return f('blowout50');
    case id === 'blowout-100':
      return f('blowout100');
    case id === 'shutout':
      return f('shutout');
    case id.startsWith('hotseat-'):
      return c.hotseatGames >= num(id, 'hotseat-');
    case id === 'daily-first':
      return f('dailyFirst');
    case id.startsWith('daily-streak-'):
      return c.a.dailyStreak >= num(id, 'daily-streak-');
    case id === 'daily-all-attempts':
      return f('dailyAllAttempts');
    case id === 'daily-top':
      return f('dailyTop');
    case id.startsWith('streak-'):
      return c.dayStreakConsec >= num(id, 'streak-');
    case id.startsWith('days-'):
      return c.a.days.length >= num(id, 'days-');
    case id.startsWith('total-'):
      return c.totalGames >= num(id, 'total-');
    case id === 'ranked-first':
      return c.a.rankedPlayed >= 1;
    case id === 'ranked-first-win':
      return f('rankedFirstWin');
    case id.startsWith('ranked-play-'):
      return c.a.rankedPlayed >= num(id, 'ranked-play-');
    case id.startsWith('ranked-win-'):
      return c.a.rankedWon >= num(id, 'ranked-win-');
    case id.startsWith('fire-'):
      return c.a.rankedBest >= num(id, 'fire-');
    case id.startsWith('elo-'):
      return c.rating >= num(id, 'elo-');
    case id === 'ranked-time-win':
      return f('rankedTimeWin');
    case id === 'ranked-upset':
      return f('rankedUpset');
    case id === 'ranked-rematch-win':
      return f('rankedRematchWin');
    case id.startsWith('botstreak-'):
      return c.a.botBest >= num(id, 'botstreak-');
    case id === 'line-8':
      return c.a.flags.includes('line8');
    case id === 'biggest-line':
      return c.a.flags.includes('bigLine');
    case id === 'corner':
      return f('corner');
    case id.startsWith('claim-'):
      return c.claims >= num(id, 'claim-');
    case id === 'add-friend':
      return f('addFriend');
    case id === 'play-friend':
      return f('playFriend');
    case id === 'refer-friend':
      return f('refer');
    case id === 'share-card':
      return f('shareCard');
    case id === 'all-themes':
      return c.a.themes.length >= 8;
    default:
      return false;
  }
}

/** Evaluate every condition; unlock newly-true ones. Returns freshly-unlocked ids. */
export function evaluate(env: EvalEnv): string[] {
  const c = buildCtx(env);
  const hits = ACHIEVEMENTS.filter((a) => satisfied(a.id, c)).map((a) => a.id);
  return unlock(hits);
}

function addFlag(a: AchStats, name: string) {
  if (!a.flags.includes(name)) a.flags.push(name);
}

// ---- recorders (mutate counters, then evaluate) ----
export interface LocalGameResult {
  mode: 'ai' | 'hotseat' | 'daily';
  shape: ShapeId;
  difficulty?: Difficulty;
  won: boolean;
  draw: boolean;
  myScore: number;
  oppScore: number;
  /** longest single line the player scored this game (0 if unknown). */
  maxLine?: number;
  /** the player scored a 1-point corner line this game. */
  scoredCorner?: boolean;
}

export function recordLocalGame(g: LocalGameResult, env: EvalEnv): string[] {
  const a = loadAch();
  a.days = Array.from(new Set([...a.days, today()]));
  if (g.won) addFlag(a, 'firstWin');
  if (g.mode === 'ai') {
    a.botStreak = g.won ? a.botStreak + 1 : 0;
    a.botBest = Math.max(a.botBest, a.botStreak);
    if (g.won && g.difficulty === IMPOSSIBLE) {
      a.impWins[g.shape] = (a.impWins[g.shape] ?? 0) + 1;
    }
  }
  if (g.won && g.oppScore === 0) addFlag(a, 'shutout');
  if (g.won && g.myScore - g.oppScore >= 50) addFlag(a, 'blowout50');
  if (g.won && g.myScore - g.oppScore >= 100) addFlag(a, 'blowout100');
  if ((g.maxLine ?? 0) >= 8) addFlag(a, 'line8');
  if ((g.maxLine ?? 0) >= 6) addFlag(a, 'bigLine');
  if (g.scoredCorner) addFlag(a, 'corner');
  saveAch(a);
  return evaluate(env);
}

export interface RankedGameResult {
  won: boolean;
  draw: boolean;
  onTime: boolean;
  wasRematch: boolean;
  myRating: number;
  oppRating: number;
}

export function recordRankedGame(g: RankedGameResult, env: EvalEnv): string[] {
  const a = loadAch();
  a.days = Array.from(new Set([...a.days, today()]));
  a.rankedPlayed += 1;
  addFlag(a, 'rankedFirst');
  if (g.won) {
    a.rankedWon += 1;
    a.rankedStreak += 1;
    a.rankedBest = Math.max(a.rankedBest, a.rankedStreak);
    addFlag(a, 'firstWin');
    addFlag(a, 'rankedFirstWin');
    if (g.onTime) addFlag(a, 'rankedTimeWin');
    if (g.wasRematch) addFlag(a, 'rankedRematchWin');
    if (g.oppRating - g.myRating >= 100) addFlag(a, 'rankedUpset');
  } else {
    a.rankedStreak = 0;
  }
  saveAch(a);
  return evaluate({ ...env, rating: g.myRating || env.rating });
}

export function recordTheme(themeId: string, env: EvalEnv): string[] {
  const a = loadAch();
  if (!a.themes.includes(themeId)) {
    a.themes.push(themeId);
    saveAch(a);
  }
  return evaluate(env);
}

export function recordDaily(streakCurrent: number, allAttempts: boolean, env: EvalEnv): string[] {
  const a = loadAch();
  a.dailyStreak = Math.max(a.dailyStreak, streakCurrent);
  addFlag(a, 'dailyFirst');
  if (allAttempts) addFlag(a, 'dailyAllAttempts');
  saveAch(a);
  return evaluate(env);
}

/** Generic event flag (addFriend / playFriend / refer / shareCard / dailyTop). */
export function recordFlag(name: string, env: EvalEnv): string[] {
  const a = loadAch();
  addFlag(a, name);
  saveAch(a);
  return evaluate(env);
}
