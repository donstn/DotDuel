/**
 * Theme system. Each ThemeId maps to a [data-theme="…"] selector defined
 * in src/styles.css. Switching the attribute on <html> retints every
 * board piece, avatar, panel glow, and chrome surface in one paint.
 * Persists per-device in localStorage (intentionally not synced to cloud —
 * a player might want dark on phone + light on tablet).
 */

export type ThemeId =
  | 'forest-pearl'
  | 'christmas'
  | 'royal-court'
  | 'tempo-rivals'
  | 'sunset-catan'
  | 'coral-reef'
  | 'twilight-cosmos'
  | 'monochrome-pro'
  | 'vintage-press';

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  tagline: string;
  swatch: { p1: string; p2: string; bg: string };
  isLight?: boolean;
  // Only Forest & Pearl has painted art (dots, lines, avatars, menu icons,
  // ambiance). The other 7 are still the original procedural CSS palette
  // swap and would look unfinished/unprofessional sitting next to it —
  // locked (visible but unselectable in ThemePopover, and loadTheme()
  // refuses to load one even from a pre-existing saved preference) until
  // each gets its own art pass. Flip to false per-theme as that happens.
  locked?: boolean;
  /** Seasonal theme: only offered between these dates (month 1–12, day),
   *  inclusive, wrapping over New Year. Out of season it is hidden from the
   *  picker and a saved choice falls back to the default. */
  season?: { from: [number, number]; to: [number, number] };
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'forest-pearl',
    label: 'Forest & Pearl',
    tagline: 'The original. Emerald on jade vignette.',
    swatch: { p1: '#1c7a3d', p2: '#f0fbcf', bg: '#15291e' },
  },
  {
    id: 'christmas',
    label: 'Christmas',
    tagline: 'Red and gold baubles on the tree.',
    swatch: { p1: '#a3162b', p2: '#f2c94c', bg: '#0b1f16' },
    season: { from: [12, 1], to: [1, 6] },
  },
  {
    id: 'royal-court',
    label: 'Royal Court',
    tagline: 'Violet velvet vs antique gold.',
    swatch: { p1: '#5e2c8e', p2: '#e8c452', bg: '#1a0e2e' },
    locked: true,
  },
  {
    id: 'tempo-rivals',
    label: 'Tempo Rivals',
    tagline: 'Wine red vs sky blue. Classic.',
    swatch: { p1: '#a01a3e', p2: '#5fb3d4', bg: '#1a1f2a' },
    locked: true,
  },
  {
    id: 'sunset-catan',
    label: 'Sunset Catan',
    tagline: 'Terracotta deserts, parchment pieces.',
    swatch: { p1: '#c25527', p2: '#f4e4bc', bg: '#3a2418' },
    locked: true,
  },
  {
    id: 'coral-reef',
    label: 'Coral Reef',
    tagline: 'Deep teal water, coral playmates.',
    swatch: { p1: '#1a7585', p2: '#ff8c5a', bg: '#0a2030' },
    locked: true,
  },
  {
    id: 'twilight-cosmos',
    label: 'Twilight Cosmos',
    tagline: 'Indigo void vs electric cyan.',
    swatch: { p1: '#4030a0', p2: '#67e8f9', bg: '#0c0a1a' },
    locked: true,
  },
  {
    id: 'monochrome-pro',
    label: 'Monochrome Pro',
    tagline: 'Black & white pieces on wood. Maximum contrast.',
    swatch: { p1: '#1a1a1c', p2: '#ffffff', bg: '#e8d8c0' },
    isLight: true,
    locked: true,
  },
  {
    id: 'vintage-press',
    label: 'Vintage Press',
    tagline: 'Burgundy & navy ink on parchment. Sun-friendly.',
    swatch: { p1: '#8b1a2b', p2: '#1a3a4a', bg: '#f4ecd6' },
    isLight: true,
    locked: true,
  },
];

const KEY = 'dotduel:theme:v1';
const DEFAULT: ThemeId = 'forest-pearl';

function isThemeId(s: unknown): s is ThemeId {
  return typeof s === 'string' && THEMES.some((t) => t.id === s);
}

/** Preview a seasonal theme out of season: open the site with
 *  `?theme-preview=christmas` (remembered on this device until cleared with
 *  `?theme-preview=off`). For checking art before the season starts. */
const PREVIEW_KEY = 'dotduel:theme-preview:v1';
function previewTheme(): string | null {
  try {
    const q = new URLSearchParams(window.location.search).get('theme-preview');
    if (q === 'off') localStorage.removeItem(PREVIEW_KEY);
    else if (q) localStorage.setItem(PREVIEW_KEY, q);
    return localStorage.getItem(PREVIEW_KEY);
  } catch {
    return null;
  }
}

function inSeason(season: NonNullable<ThemeMeta['season']>, now: Date): boolean {
  const md = (m: number, d: number) => m * 100 + d;
  const today = md(now.getMonth() + 1, now.getDate());
  const from = md(...season.from);
  const to = md(...season.to);
  return from <= to ? today >= from && today <= to : today >= from || today <= to;
}

/** Shown in the theme picker at all (seasonal themes only in season). */
export function isThemeOffered(meta: ThemeMeta, now = new Date()): boolean {
  if (!meta.season) return true;
  return inSeason(meta.season, now) || previewTheme() === meta.id;
}

/** Selectable: offered and not locked. */
export function isThemeSelectable(meta: ThemeMeta, now = new Date()): boolean {
  if (previewTheme() === meta.id) return true;
  return !meta.locked && isThemeOffered(meta, now);
}

export function loadTheme(): ThemeId {
  try {
    const raw = localStorage.getItem(KEY);
    if (isThemeId(raw) && isThemeSelectable(getThemeMeta(raw))) return raw;
  } catch {
    // localStorage may throw in private mode — fall through to default.
  }
  return DEFAULT;
}

export function saveTheme(id: ThemeId): void {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // ignore quota / private mode errors
  }
}

export function getThemeMeta(id: ThemeId): ThemeMeta {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
