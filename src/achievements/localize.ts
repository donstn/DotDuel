/**
 * Localized accessors for the achievement catalog. `catalog.ts` holds the
 * English source of truth (titles/descs/track labels); each language file may
 * supply overrides under `t.achievements.byId` / `t.achievements.tracks`. These
 * helpers prefer the override and fall back to the catalog, so a missing
 * translation degrades to English rather than breaking.
 */
import { ACHIEVEMENT_BY_ID } from './catalog';
import type { Messages } from '../i18n';

export function achTitle(id: string, t: Messages): string {
  return t.achievements.byId[id]?.title ?? ACHIEVEMENT_BY_ID[id]?.title ?? id;
}

export function achDesc(id: string, t: Messages): string {
  return t.achievements.byId[id]?.desc ?? ACHIEVEMENT_BY_ID[id]?.desc ?? '';
}

/** Track labels are keyed by their English label (the catalog's `track.label`). */
export function trackLabel(label: string, t: Messages): string {
  return t.achievements.tracks[label] ?? label;
}
