import type { ThemeId } from './theme';
import type { Difficulty, ShapeId } from './types';

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
  /** Round plate with an empty centre: back / ? / close (glyph is code). */
  iconButton?: string;
  /** Destructive pill: resign, reset, delete. */
  dangerPill?: StretchArt;
  /** Segmented tabs (inactive doubles as the toggle track) + top tabs. */
  tabOff?: StretchArt;
  tabOn?: StretchArt;
  tabTopOff?: StretchArt;
  tabTopOn?: StretchArt;
  inputField?: StretchArt;
  toggleKnob?: string;
  /** Small selection tiles (lobby time controls). */
  choiceTile?: NineArt;
  /** Coach / tip bubble, tail painted in its bottom-left corner. */
  speechBubble?: NineArt;
  shapeIcons?: Record<ShapeId, string>;
  /** Painted board: felt texture, dot sprites, line-stroke sprites (length 2–9). */
  board?: {
    felt: string;
    dot: (color: 1 | 2) => string;
    line: (len: number, color: 1 | 2) => string;
  };
  avatars?: { human: string; bot: (level: Difficulty) => string };
  /** Win-celebration sprites. */
  particles?: string[];
  /** Full-screen scenery behind the vignette. */
  background?: { portrait: string; landscape: string };
  /** Menu ambience loops (played when music is on). */
  ambience?: { wind: string; stream: string; birds: string };
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
    // UI renewal sheet (docs/art/sheet-ui-renewal.md). Pill caps cover the
    // whole rounded end (≈ height / 2) so the curve never stretches.
    iconButton: '/art/forest-pearl/icon-button.webp',
    dangerPill: {
      url: '/art/forest-pearl/danger-pill.webp',
      width: 215,
      height: 81,
      capLeft: 54,
      capRight: 55,
    },
    tabOff: {
      url: '/art/forest-pearl/tab-off.webp',
      width: 230,
      height: 112,
      capLeft: 58,
      capRight: 58,
    },
    tabOn: {
      url: '/art/forest-pearl/tab-on.webp',
      width: 275,
      height: 113,
      capLeft: 64,
      capRight: 64,
    },
    tabTopOff: {
      url: '/art/forest-pearl/tab-top-off.webp',
      width: 231,
      height: 118,
      capLeft: 58,
      capRight: 58,
    },
    tabTopOn: {
      url: '/art/forest-pearl/tab-top-on.webp',
      width: 279,
      height: 122,
      capLeft: 64,
      capRight: 64,
    },
    inputField: {
      url: '/art/forest-pearl/input-field.webp',
      width: 387,
      height: 73,
      capLeft: 25,
      capRight: 26,
    },
    toggleKnob: '/art/forest-pearl/toggle-knob.webp',
    choiceTile: {
      url: '/art/forest-pearl/choice-tile.webp',
      width: 207,
      height: 209,
      capLeft: 65,
      capRight: 65,
      capTop: 57,
      capBottom: 53,
    },
    speechBubble: {
      url: '/art/forest-pearl/speech-bubble.webp',
      width: 247,
      height: 229,
      capLeft: 91,
      capRight: 77,
      capTop: 51,
      capBottom: 89,
    },
    board: {
      felt: '/art/forest-pearl/felt-base.webp',
      dot: (c) => `/art/forest-pearl/dot-p${c}.webp`,
      line: (len, c) => `/art/forest-pearl/line-${len}-p${c}.webp`,
    },
    avatars: {
      human: '/art/forest-pearl/avatar-human.webp',
      bot: (level) => `/art/forest-pearl/avatar-l${level}.webp`,
    },
    particles: [
      '/art/forest-pearl/particle-spark.webp',
      '/art/forest-pearl/particle-leaf.webp',
      '/art/forest-pearl/particle-pearl.webp',
      '/art/forest-pearl/particle-firefly.webp',
    ],
    background: {
      portrait: '/art/forest-pearl/background-portrait.webp',
      landscape: '/art/forest-pearl/background-landscape.webp',
    },
    ambience: {
      wind: '/audio/forest-pearl/ambience-wind.mp3',
      stream: '/audio/forest-pearl/ambience-stream.mp3',
      birds: '/audio/forest-pearl/ambience-birds.mp3',
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

/** Nine-slice frame vars; `scale` = rendered px per painted px. */
function nineVars(prefix: string, f: NineArt, scale: number): Record<string, string> {
  const px = (v: number) => `${Math.round(v * scale)}px`;
  return {
    [`--${prefix}-img`]: `url("${f.url}")`,
    [`--${prefix}-slice`]: `${f.capTop} ${f.capRight} ${f.capBottom} ${f.capLeft} fill`,
    [`--${prefix}-width`]: `${px(f.capTop)} ${px(f.capRight)} ${px(f.capBottom)} ${px(f.capLeft)}`,
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
    // Rendered at 80% of the painted pixels (crisp on 2–3× screens).
    Object.assign(vars, nineVars('card-frame', art.cardFrame, 0.8));
    slots.push('card-frame');
  }
  const stretches: [string, StretchArt | undefined][] = [
    ['danger-pill', art.dangerPill],
    ['tab-off', art.tabOff],
    ['tab-on', art.tabOn],
    ['tab-top-off', art.tabTopOff],
    ['tab-top-on', art.tabTopOn],
    ['input-field', art.inputField],
  ];
  for (const [slot, a] of stretches) {
    if (!a) continue;
    Object.assign(vars, stretchVars(slot, a));
    slots.push(slot);
  }
  if (art.choiceTile) {
    Object.assign(vars, nineVars('choice-tile', art.choiceTile, 0.45));
    slots.push('choice-tile');
  }
  if (art.speechBubble) {
    Object.assign(vars, nineVars('speech-bubble', art.speechBubble, 0.42));
    slots.push('speech-bubble');
  }
  if (art.iconButton) {
    vars['--icon-btn-img'] = `url("${art.iconButton}")`;
    slots.push('icon-button');
  }
  if (art.toggleKnob) {
    vars['--toggle-knob-img'] = `url("${art.toggleKnob}")`;
    slots.push('toggle-knob');
  }
  if (art.background) {
    vars['--bg-art-portrait'] = `url("${art.background.portrait}")`;
    vars['--bg-art-landscape'] = `url("${art.background.landscape}")`;
    slots.push('background');
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
