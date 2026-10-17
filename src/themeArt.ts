import type { ThemeId } from './theme';
import type { ShapeId } from './types';

/**
 * Painted art per theme — the one contract that code, Gemini prompts and the
 * processing script share (docs/art/README.md). Geometry is in the image's own
 * pixels, exactly as printed by `node scripts/process-art.mjs`, so regenerated
 * art only needs its numbers re-pasted here. A theme without a slot falls back
 * to the plain CSS styling for that piece.
 */

/** Horizontally stretchable plate: end caps stay as painted, middle stretches. */
export interface StretchArt {
  url: string;
  width: number;
  height: number;
  capLeft: number;
  capRight: number;
}

/** Frame stretchable both ways (nine-slice): corners stay as painted. */
export interface NineArt {
  url: string;
  width: number;
  height: number;
  capLeft: number;
  capRight: number;
  capTop: number;
  capBottom: number;
}

/** Fixed panel with a text-safe box (fractions of width / height). */
export interface PanelArt {
  url: string;
  width: number;
  height: number;
  text: { left: number; top: number; right: number; bottom: number };
}

export interface ThemeArt {
  headerSign?: PanelArt;
  menuButton?: StretchArt;
  pillButton?: StretchArt;
  /** Main call to action (Start game, Play again). */
  primaryButton?: StretchArt;
  /** Sub-screen heading banner. */
  titleBanner?: StretchArt;
  /** Popovers, confirm dialogs, game-over card, language list. */
  cardFrame?: NineArt;
  shapeIcons?: Record<ShapeId, string>;
}

const ART: Partial<Record<ThemeId, ThemeArt>> = {
  'forest-pearl': {
    headerSign: {
      url: '/art/forest-pearl/header-combined.webp',
      width: 987,
      height: 456,
      text: { left: 0.09, top: 0.6, right: 0.09, bottom: 0.085 },
    },
    menuButton: {
      url: '/art/forest-pearl/menu-button.webp',
      width: 873,
      height: 187,
      capLeft: 167,
      capRight: 168,
    },
    pillButton: {
      url: '/art/forest-pearl/pill-button.webp',
      width: 475,
      height: 179,
      capLeft: 106,
      capRight: 108,
    },
    // primaryButton / titleBanner caps are set by eye at the end of the
    // ornament: the script's plain-detector also counts the button's soft
    // centre glow and the banner's arc, which would leave no room for text.
    primaryButton: {
      url: '/art/forest-pearl/primary-button.webp',
      width: 916,
      height: 201,
      capLeft: 165,
      capRight: 165,
    },
    titleBanner: {
      url: '/art/forest-pearl/title-banner.webp',
      width: 588,
      height: 178,
      capLeft: 115,
      capRight: 115,
    },
    cardFrame: {
      url: '/art/forest-pearl/card-frame.webp',
      width: 284,
      height: 371,
      capLeft: 30,
      capRight: 29,
      capTop: 33,
      capBottom: 36,
    },
    shapeIcons: {
      triangle: '/art/forest-pearl/menu-icon-shape-triangle.webp',
      square: '/art/forest-pearl/menu-icon-shape-square.webp',
      rectangle: '/art/forest-pearl/menu-icon-shape-rectangle.webp',
      rhombus: '/art/forest-pearl/menu-icon-shape-rhombus.webp',
    },
  },
};

export function themeArt(theme: ThemeId | undefined): ThemeArt {
  return (theme && ART[theme]) || {};
}

const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

function stretchVars(prefix: string, a: StretchArt): Record<string, string> {
  return {
    [`--${prefix}-img`]: `url("${a.url}")`,
    [`--${prefix}-slice`]: `0 ${a.capRight} 0 ${a.capLeft} fill`,
    // Cap widths as multiples of the rendered height, so caps keep their
    // painted proportions at any button size.
    [`--${prefix}-cap-l`]: String(a.capLeft / a.height),
    [`--${prefix}-cap-r`]: String(a.capRight / a.height),
  };
}

function themeArtVars(art: ThemeArt): { vars: Record<string, string>; slots: string[] } {
  const vars: Record<string, string> = {};
  const slots: string[] = [];
  if (art.menuButton) {
    Object.assign(vars, stretchVars('menu-btn', art.menuButton));
    slots.push('menu-button');
  }
  if (art.pillButton) {
    Object.assign(vars, stretchVars('pill-btn', art.pillButton));
    slots.push('pill-button');
  }
  if (art.primaryButton) {
    Object.assign(vars, stretchVars('primary-btn', art.primaryButton));
    slots.push('primary-button');
  }
  if (art.titleBanner) {
    Object.assign(vars, stretchVars('title-banner', art.titleBanner));
    slots.push('title-banner');
  }
  if (art.cardFrame) {
    const f = art.cardFrame;
    // Rendered at 80% of the painted pixels (crisp on 2–3× screens).
    const px = (v: number) => `${Math.round(v * 0.8)}px`;
    Object.assign(vars, {
      '--card-frame-img': `url("${f.url}")`,
      '--card-frame-slice': `${f.capTop} ${f.capRight} ${f.capBottom} ${f.capLeft} fill`,
      '--card-frame-width': `${px(f.capTop)} ${px(f.capRight)} ${px(f.capBottom)} ${px(f.capLeft)}`,
    });
    slots.push('card-frame');
  }
  if (art.headerSign) {
    const { width, height, text } = art.headerSign;
    Object.assign(vars, {
      '--sign-aspect': `${width} / ${height}`,
      '--sign-text-l': pct(text.left),
      '--sign-text-t': pct(text.top),
      '--sign-text-r': pct(text.right),
      '--sign-text-b': pct(text.bottom),
    });
    slots.push('header-sign');
  }
  return { vars, slots };
}

let appliedVars: string[] = [];

/**
 * Publishes the theme's art geometry on <html> as CSS custom properties plus a
 * `data-art` slot list. CSS keys plaque styling off `html[data-art~="menu-button"]`
 * etc. and reads all measurements from the variables, so styles.css never
 * hardcodes one theme's numbers.
 */
export function applyThemeArt(theme: ThemeId): void {
  const root = document.documentElement;
  const { vars, slots } = themeArtVars(themeArt(theme));
  for (const k of appliedVars) root.style.removeProperty(k);
  appliedVars = Object.keys(vars);
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  if (slots.length) root.setAttribute('data-art', slots.join(' '));
  else root.removeAttribute('data-art');
}
