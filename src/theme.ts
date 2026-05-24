/**
 * Theme system. Each ThemeId maps to a [data-theme="…"] selector defined
 * in src/styles.css. Switching the attribute on <html> retints every
 * board piece, avatar, panel glow, and chrome surface in one paint.
 * Persists per-device in localStorage (intentionally not synced to cloud —
 * a player might want dark on phone + light on tablet).
 */

export type ThemeId =
  | 'forest-pearl'
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
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'forest-pearl',
    label: 'Forest & Pearl',
    tagline: 'The original. Emerald on jade vignette.',
    swatch: { p1: '#1c7a3d', p2: '#f0fbcf', bg: '#15291e' },
  },
  {
    id: 'royal-court',
    label: 'Royal Court',
    tagline: 'Violet velvet vs antique gold.',
    swatch: { p1: '#5e2c8e', p2: '#e8c452', bg: '#1a0e2e' },
  },
  {
    id: 'tempo-rivals',
    label: 'Tempo Rivals',
    tagline: 'Wine red vs sky blue. Classic.',
    swatch: { p1: '#a01a3e', p2: '#5fb3d4', bg: '#1a1f2a' },
  },
  {
    id: 'sunset-catan',
    label: 'Sunset Catan',
    tagline: 'Terracotta deserts, parchment pieces.',
    swatch: { p1: '#c25527', p2: '#f4e4bc', bg: '#3a2418' },
  },
  {
    id: 'coral-reef',
    label: 'Coral Reef',
    tagline: 'Deep teal water, coral playmates.',
    swatch: { p1: '#1a7585', p2: '#ff8c5a', bg: '#0a2030' },
  },
  {
    id: 'twilight-cosmos',
    label: 'Twilight Cosmos',
    tagline: 'Indigo void vs electric cyan.',
    swatch: { p1: '#4030a0', p2: '#67e8f9', bg: '#0c0a1a' },
  },
  {
    id: 'monochrome-pro',
    label: 'Monochrome Pro',
    tagline: 'Black & white pieces on wood. Maximum contrast.',
    swatch: { p1: '#1a1a1c', p2: '#ffffff', bg: '#e8d8c0' },
    isLight: true,
  },
  {
    id: 'vintage-press',
    label: 'Vintage Press',
    tagline: 'Burgundy & navy ink on parchment. Sun-friendly.',
    swatch: { p1: '#8b1a2b', p2: '#1a3a4a', bg: '#f4ecd6' },
    isLight: true,
  },
];

const KEY = 'dotduel:theme:v1';
const DEFAULT: ThemeId = 'forest-pearl';

function isThemeId(s: unknown): s is ThemeId {
  return typeof s === 'string' && THEMES.some((t) => t.id === s);
}

export function loadTheme(): ThemeId {
  try {
    const raw = localStorage.getItem(KEY);
    if (isThemeId(raw)) return raw;
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
