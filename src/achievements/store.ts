/**
 * Local achievement state — the offline-first source of truth for which badges
 * a player has earned. Single-player achievements unlock with no network; the
 * cloud sync layer (Supabase player_achievements) mirrors this set when signed
 * in so it follows the player across devices (wired in a later phase).
 */
import { ACHIEVEMENT_BY_ID } from './catalog';

const KEY = 'dotduel:achievements:v1';

interface Store {
  /** achievement id -> ISO unlock timestamp */
  unlocked: Record<string, string>;
  /** the badge the player pins next to their name in-game (id or null) */
  featured: string | null;
}

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Store>;
      return { unlocked: p.unlocked ?? {}, featured: p.featured ?? null };
    }
  } catch {
    // ignore parse / private-mode errors
  }
  return { unlocked: {}, featured: null };
}

function save(s: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // ignore quota / private-mode errors
  }
}

const listeners = new Set<() => void>();
export function onAchievementsChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit() {
  listeners.forEach((fn) => fn());
}

export function unlockedIds(): Set<string> {
  return new Set(Object.keys(load().unlocked));
}

export function isUnlocked(id: string): boolean {
  return id in load().unlocked;
}

export function unlockedCount(): number {
  return Object.keys(load().unlocked).length;
}

/** Unlock ids that aren't earned yet (and exist in the catalog). Returns the
 *  freshly-unlocked ids so the caller can fire a congrats toast. */
export function unlock(ids: string[]): string[] {
  const s = load();
  const now = new Date().toISOString();
  const fresh: string[] = [];
  for (const id of ids) {
    if (id && ACHIEVEMENT_BY_ID[id] && !(id in s.unlocked)) {
      s.unlocked[id] = now;
      fresh.push(id);
    }
  }
  if (fresh.length) {
    save(s);
    emit();
  }
  return fresh;
}

export function getFeatured(): string | null {
  const f = load().featured;
  return f && f in load().unlocked ? f : null;
}

export function setFeatured(id: string | null) {
  const s = load();
  s.featured = id && id in s.unlocked ? id : null;
  save(s);
  emit();
}
