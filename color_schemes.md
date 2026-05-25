# DotDuel — Colour Schemes Audit

**Branch:** `app` (not merged to main yet — for your review)
**Audit date:** 2026-05-25
**Auditor role:** Brand Officer (10y experience), reviewing for readability + brand cohesion

## Methodology

Per palette, I checked five UI surfaces in order:

1. **Page body text on bg** — does the default body text colour contrast against the page gradient (WCAG AA ≥ 4.5:1)?
2. **Glass-card text** — text on the semi-transparent menu cards / popovers (glass-bg over the page bg).
3. **Accent on glass** — link hovers, headings, badge interiors — does the accent colour contrast against glass-tinted surfaces?
4. **Brand cohesion** — does the palette feel like its name, or does it look "borrowed from another theme"?
5. **Active-state pieces** — provisional badge, consent banner buttons, danger button — small text on pre-tinted backgrounds.

The pattern I found across themes 2–6 (all the non-default dark themes): they inherited Forest & Pearl's `--text: #eaf3e3` (cream-green) and `--title-grad-top → bottom: #ffffff → #b9d6c4` (white to pale-green). On a violet, oceanic, indigo, terracotta bg, that pale-green title and cream-green body text are *technically* readable but *visually borrowed* — they don't feel like they belong to the new palette. WCAG-wise they all pass 11:1+ contrast on their dark bgs, so this is a **brand-cohesion fix, not a readability fix** for the body text.

Where readability *did* fail was the **provisional badge on Vintage Press** — the global pale-gold pill is nearly invisible on cream parchment. Fixed with a per-theme override.

**Themes excluded from this audit (per user instruction):**
- **Forest & Pearl** (default — already the reference for the design)
- **Monochrome Pro** (marble / B&W on wood — already user-approved)

**Token reference.** Every theme defines these tokens. If not overridden, the value falls back to `:root` (which holds the Forest & Pearl defaults).

| Token | What it controls |
|---|---|
| `--p1`, `--p1-glow`, `--p1-bright`, `--p1-deep` | Player 1's dot gradient stops, side-panel active glow |
| `--p2`, `--p2-glow`, `--p2-bright`, `--p2-deep` | Player 2's equivalent |
| `--strike-p1-outer`, `--strike-p1-inner` | The 2-line strike rendered over a scored line (P1) |
| `--strike-p2-outer`, `--strike-p2-inner` | Same for P2 |
| `--avatar-p1-fg`, `--avatar-p2-fg` | Silhouette colour inside the human avatar SVG |
| `--bg-center`, `--bg-edge` | Page radial gradient stops |
| `--text` | Default body text colour |
| `--text-dim` | Secondary text (taglines, descriptions) |
| `--text-mute` | Tertiary text (separator dots, footer version) |
| `--text-bright` | Maximum-emphasis text (titles within cards) |
| `--title-grad-top`, `--title-grad-bottom` | The "DotDuel" wordmark gradient on the menu |
| `--accent` | Link hovers, headings inside popover sections, focus rings, primary CTAs |
| `--danger` | Destructive action colour (delete buttons, etc.) — unchanged from default in every theme; flagged at the end as a known cross-theme item |

---

## Theme 2 — Royal Court (violet + gold)

### Before audit

| Token | Value | Came from |
|---|---|---|
| `--bg-center` | `#1a0e2e` (deep velvet purple) | theme override |
| `--bg-edge` | `#02010a` (near black) | theme override |
| `--accent` | `#f5d76a` (bright gold) | theme override |
| `--text` | `#eaf3e3` (cream-green) | **inherited from Forest & Pearl** |
| `--text-dim` | `#93a89a` (greyish-cream) | **inherited** |
| `--text-mute` | `#5e7368` (deep greyish-cream) | **inherited** |
| `--text-bright` | `#ffffff` | inherited |
| `--title-grad-top` | `#ffffff` | inherited |
| `--title-grad-bottom` | `#b9d6c4` (pale green) | **inherited** |

### What I found

- ✅ **Page text contrast:** cream-green on dark purple → ~14:1. Passes AA with room.
- ⚠️ **Brand cohesion:** the title gradient ends on pale green. On a velvet-purple backdrop this looks like the Forest & Pearl wordmark with a darker bg behind it. Worst offender for "borrowed identity".
- ✅ **Accent on glass:** gold `#f5d76a` on white-tinted glass over purple → ~7:1. Reads cleanly.
- ✅ **Provisional badge:** stays warm gold on warm-gold-tinted-purple pill. ~3.5:1 — passes AA-large for 12px+ text.
- ✅ **Active glow:** P1 violet glow / P2 gold glow — distinct.

### Changes applied (previous → now)

| Token | Previous (inherited) | Now (override) | Rationale |
|---|---|---|---|
| `--text` | `#eaf3e3` cream-green | **`#f0e6c8`** warm champagne | Harmonises with gold accent; reads on purple at ~13:1 |
| `--text-dim` | `#93a89a` greyish-cream | **`#b0a585`** muted champagne | Same family, weaker emphasis |
| `--text-mute` | `#5e7368` deep greyish-cream | **`#7d7458`** deep champagne | Tertiary text (footer dots etc.) |
| `--text-bright` | `#ffffff` | **`#fff8e0`** bright ivory | Pure white was OK; ivory pairs better with gold |
| `--title-grad-top` | `#ffffff` | **`#fff8e0`** bright ivory | Wordmark start |
| `--title-grad-bottom` | `#b9d6c4` pale green | **`#f5d76a`** gold (= accent) | Wordmark resolves to the theme's signature gold |

### Where these colours appear in the UI

- **`--text`**: menu subtitle, rules popover body, settings popover body, all section text, all helper hints (`.settings-hint`), modal body content.
- **`--text-dim`**: rules-tagline, secondary descriptions, footer brand text ("DotDuel © 2026"), opponent rating numbers, the "Last N matches" label.
- **`--text-mute`**: footer separator dots, version label, "no games yet" placeholder, tertiary inline hints.
- **`--text-bright`**: card headings, score numbers (some places), strong text in body copy.
- **`--title-grad-top/bottom`**: only the "DotDuel" wordmark on the menu screen, via `.title-text` background-clip.

---

## Theme 3 — Tempo Rivals (wine red + sky blue)

### Before audit

| Token | Value | Came from |
|---|---|---|
| `--bg-center` | `#1a1f2a` (charcoal blue) | theme override |
| `--bg-edge` | `#02060a` (near black) | theme override |
| `--accent` | `#5fb3d4` (sky blue) | theme override |
| `--text` | `#eaf3e3` (cream-green) | **inherited** |
| `--text-dim` | `#93a89a` | **inherited** |
| `--text-mute` | `#5e7368` | **inherited** |
| `--text-bright` | `#ffffff` | inherited |
| `--title-grad-top` | `#ffffff` | inherited |
| `--title-grad-bottom` | `#b9d6c4` (pale green) | **inherited** |

### What I found

- ✅ **Page text contrast:** cream-green on charcoal-blue → ~13:1. Fine.
- ⚠️ **Brand cohesion:** the cool blue palette had warm-green text. Felt mismatched — should be cool steel/silver tones.
- ✅ **Accent on glass:** sky blue on white-tinted glass over charcoal → ~7:1. Good.
- ✅ **Active glow:** P1 wine red / P2 sky blue — clear distinction.

### Changes applied

| Token | Previous (inherited) | Now (override) | Rationale |
|---|---|---|---|
| `--text` | `#eaf3e3` cream-green | **`#dfe7ee`** cool steel-blue-white | Matches the cool palette; ~13:1 on bg |
| `--text-dim` | `#93a89a` | **`#9aa7b3`** medium steel | Same family, weaker emphasis |
| `--text-mute` | `#5e7368` | **`#5f6975`** deep steel | Tertiary |
| `--text-bright` | `#ffffff` | **`#f5f8fb`** ice white | Subtle cool tint, still bright |
| `--title-grad-top` | `#ffffff` | **`#f5f8fb`** ice white | Wordmark start |
| `--title-grad-bottom` | `#b9d6c4` pale green | **`#a8d8ec`** pale sky blue (= P2 bright) | Locks wordmark to the theme's P2 family |

### Where these colours appear in the UI

Same list as Theme 2. The `--title-grad-bottom` shift is the most visible — the wordmark now reads "DotDuel" in white-to-pale-sky-blue instead of white-to-pale-green.

---

## Theme 4 — Sunset Catan (terracotta + parchment)

### Before audit

| Token | Value | Came from |
|---|---|---|
| `--bg-center` | `#3a2418` (dusk brown) | theme override |
| `--bg-edge` | `#0d0604` (near black) | theme override |
| `--accent` | `#e0a050` (warm amber) | theme override |
| `--text` | `#eaf3e3` (cream-green) | **inherited** |
| `--text-dim` | `#93a89a` | **inherited** |
| `--text-mute` | `#5e7368` | **inherited** |
| `--text-bright` | `#ffffff` | inherited |
| `--title-grad-top` | `#ffffff` | inherited |
| `--title-grad-bottom` | `#b9d6c4` (pale green) | **inherited** |

### What I found

- ✅ **Page text contrast:** cream-green on warm brown → ~11:1. Passes AA.
- ⚠️ **Brand cohesion:** warm-earth bg + cool-green text was the most jarring inheritance of the audit — felt like two themes glued together.
- ✅ **Accent on glass:** amber on white-tinted glass over brown → ~5:1. Reads, but the white-glass tint over warm brown is itself slightly cool. Will look more native after the text fix.
- ✅ **Active glow:** P1 terracotta / P2 parchment — distinct and on-brand.

### Changes applied

| Token | Previous (inherited) | Now (override) | Rationale |
|---|---|---|---|
| `--text` | `#eaf3e3` cream-green | **`#f0e0c0`** warm cream / parchment | Mirrors the P2 parchment family; ~10:1 on bg |
| `--text-dim` | `#93a89a` | **`#c4b08c`** warm tan | Same family |
| `--text-mute` | `#5e7368` | **`#8b7656`** deep tan | Tertiary |
| `--text-bright` | `#ffffff` | **`#fff5e0`** bright ivory | Removes the harsh pure-white |
| `--title-grad-top` | `#ffffff` | **`#fff5e0`** bright ivory | Wordmark start |
| `--title-grad-bottom` | `#b9d6c4` pale green | **`#e0a050`** amber (= accent) | Wordmark resolves to theme's signature amber |

### Where these colours appear

Same surfaces as Themes 2–3.

---

## Theme 5 — Coral Reef (deep teal + coral pink)

### Before audit

| Token | Value | Came from |
|---|---|---|
| `--bg-center` | `#0a2030` (deep ocean blue) | theme override |
| `--bg-edge` | `#01060a` (near black) | theme override |
| `--accent` | `#ff8c5a` (bright coral) | theme override |
| `--text` | `#eaf3e3` (cream-green) | **inherited** |
| `--text-dim` | `#93a89a` | **inherited** |
| `--text-mute` | `#5e7368` | **inherited** |
| `--text-bright` | `#ffffff` | inherited |
| `--title-grad-top` | `#ffffff` | inherited |
| `--title-grad-bottom` | `#b9d6c4` (pale green) | **inherited** |

### What I found

- ✅ **Page text contrast:** cream-green on deep ocean → ~14:1.
- ⚠️ **Brand cohesion:** ocean palette wanted aqua / sea-foam text, got cream-green. Felt like Forest & Pearl with a blue bg.
- ✅ **Accent on glass:** coral on white-tinted glass over ocean → ~6:1.
- ✅ **Active glow:** P1 dark teal / P2 coral — strong distinction.

### Changes applied

| Token | Previous (inherited) | Now (override) | Rationale |
|---|---|---|---|
| `--text` | `#eaf3e3` cream-green | **`#d8eef0`** sea-foam white | Matches the teal P1 family + ocean bg; ~13:1 |
| `--text-dim` | `#93a89a` | **`#8ca6b0`** steel teal | Same family |
| `--text-mute` | `#5e7368` | **`#4a5e68`** deep teal | Tertiary |
| `--text-bright` | `#ffffff` | **`#f0fafc`** ice cyan-white | Subtle aqua tint |
| `--title-grad-top` | `#ffffff` | **`#f0fafc`** ice cyan-white | Wordmark start |
| `--title-grad-bottom` | `#b9d6c4` pale green | **`#ffb088`** pale coral | Wordmark resolves to the theme's coral P2/accent family |

### Where these colours appear

Same surfaces as previous themes.

---

## Theme 6 — Twilight Cosmos (indigo + electric cyan)

### Before audit

| Token | Value | Came from |
|---|---|---|
| `--bg-center` | `#0c0a1a` (deep indigo) | theme override |
| `--bg-edge` | `#02010a` (near black) | theme override |
| `--accent` | `#67e8f9` (electric cyan) | theme override |
| `--text` | `#eaf3e3` (cream-green) | **inherited** |
| `--text-dim` | `#93a89a` | **inherited** |
| `--text-mute` | `#5e7368` | **inherited** |
| `--text-bright` | `#ffffff` | inherited |
| `--title-grad-top` | `#ffffff` | inherited |
| `--title-grad-bottom` | `#b9d6c4` (pale green) | **inherited** |

### What I found

- ✅ **Page text contrast:** cream-green on near-black indigo → ~15:1.
- ⚠️ **Brand cohesion:** synthwave palette had cream-green text instead of icy lavender or pale cyan. Felt off-brand.
- ✅ **Accent on glass:** cyan on white-tinted glass over indigo → ~11:1. Strongest accent contrast of any theme.
- ✅ **Active glow:** P1 indigo / P2 cyan — bright distinction.

### Changes applied

| Token | Previous (inherited) | Now (override) | Rationale |
|---|---|---|---|
| `--text` | `#eaf3e3` cream-green | **`#e0e0f5`** icy lavender-white | Cool tone that lives in the indigo/cyan family; ~14:1 |
| `--text-dim` | `#9090b8` | **`#9090b8`** muted lavender | Same family |
| `--text-mute` | `#5e7368` | **`#555578`** deep purple-grey | Tertiary |
| `--text-bright` | `#ffffff` | `#ffffff` | Kept pure white — fits the sci-fi feel |
| `--title-grad-top` | `#ffffff` | `#ffffff` | Wordmark start kept |
| `--title-grad-bottom` | `#b9d6c4` pale green | **`#67e8f9`** electric cyan (= accent) | Wordmark resolves to the theme's signature cyan |

### Where these colours appear

Same surfaces as previous themes.

---

## Theme 8 — Vintage Press (burgundy + navy on parchment) — LIGHT

### Before audit

Vintage Press already has dark-on-light overrides:

| Token | Value | Came from |
|---|---|---|
| `--text` | `#2a1a14` (dark warm brown) | theme override (light bg) |
| `--text-dim` | `#5a4838` | theme override |
| `--text-mute` | `#8a7868` | theme override |
| `--text-bright` | `#1a0a04` | theme override |
| `--title-grad-top` | `#8b1a2b` (burgundy) | theme override |
| `--title-grad-bottom` | `#1a3a4a` (navy) | theme override |
| `--accent` | `#8b1a2b` (burgundy) | theme override |

### What I found

- ✅ **Page text contrast:** dark warm brown on cream parchment → ~12:1.
- ✅ **Glass card text:** dark-tinted glass over cream darkens slightly; text contrast preserved.
- ✅ **Accent on glass:** burgundy on cream-tinted glass → ~9:1.
- ✅ **Brand cohesion:** already coherent — burgundy + navy ink wordmark feels native to the parchment.
- ❌ **Provisional badge — readability fail:** the global `.provisional-badge` uses `background: rgba(255,200,90,0.14); color: #f5d27a`. On the cream parchment bg, the pale-gold pill blends in and the pale-gold text is invisible. Contrast roughly 1.6:1 — fails AA badly.

### Changes applied

| Element | Previous | Now | Rationale |
|---|---|---|---|
| `[data-theme="vintage-press"] .provisional-badge` background | `rgba(255,200,90,0.14)` (very pale gold film) | **`rgba(160,110,30,0.22)`** (deeper amber film) | Visible pill outline on cream |
| `[data-theme="vintage-press"] .provisional-badge` border | `rgba(255,200,90,0.35)` | **`rgba(160,110,30,0.45)`** | Stronger border |
| `[data-theme="vintage-press"] .provisional-badge` color | `#f5d27a` pale gold | **`#6b4708`** deep tobacco | ~6:1 contrast inside the pill |

### Where this colour appears

- `.provisional-badge` is rendered in two places:
  1. **Profile popover** → Multiplayer section → next to the rating, while the player has < 10 ranked games.
  2. **Rankings popover** → Global Elo list → next to any player still in placement.

---

## Cross-theme items I did NOT change (flagged for your review)

### `--danger: #d97565` (red-coral) — used unchanged across all themes

- Used by: the "Delete profile" / "Delete my account" / "Resign" confirm-dialog primary button text colour cue (via `.confirm-actions button.danger { background: rgba(200,50,50,0.85); }` — actually that hardcodes the red, doesn't reference --danger).
- The `--danger` token itself is referenced in `.rules-cancel-link:hover` etc.
- On **Tempo Rivals** (wine red P1) and **Coral Reef** (coral P2) the danger red might visually blend with the player colour. Not yet a contrast problem; flagged in case you want a theme-aware override later (e.g. Tempo Rivals danger → bright orange).

### Hardcoded button gradients

- `.consent-accept`, `.game-over-buttons .primary`, `.hotseat-start` all use hardcoded `linear-gradient(180deg, #2a8e4a, #0f5a28)` (forest green).
- On **Vintage Press** (cream parchment) and **Royal Court** (purple + gold) and **Sunset Catan** (warm dusk) these green CTAs feel off-brand.
- Fix would be: replace hardcoded green with a `--cta-bg-top` / `--cta-bg-bottom` token pair, and have each theme override.
- Did NOT apply — beyond the scope of "text + readability" and would change the entire CTA aesthetic. Worth a follow-up pass if you want full button theming.

### `.match-result-win` / `.match-result-loss` / `.match-result-draw` pills

- In the Profile popover's recent-matches list. Currently `rgba(70,175,105,…)` green and `rgba(200,70,70,…)` red. Hardcoded — not theme-aware.
- Worked correctly on every theme tested. Skip for now unless you want them branded.

### `.title-dot-1` / `.title-dot-2` (the ● dots in the menu title)

- Use `var(--p1-bright)` and `var(--p2-glow)` — already theme-aware. No action needed.

---

## Summary table

| Theme | Body text changed | Title gradient changed | Other fixes | Status |
|---|---|---|---|---|
| Forest & Pearl | — | — | — | reference (excluded from audit) |
| Royal Court | ✅ cream-green → champagne | ✅ pale-green → gold | — | re-tuned |
| Tempo Rivals | ✅ cream-green → cool steel | ✅ pale-green → pale sky | — | re-tuned |
| Sunset Catan | ✅ cream-green → warm cream | ✅ pale-green → amber | — | re-tuned |
| Coral Reef | ✅ cream-green → sea-foam | ✅ pale-green → pale coral | — | re-tuned |
| Twilight Cosmos | ✅ cream-green → icy lavender | ✅ pale-green → cyan | — | re-tuned |
| Monochrome Pro | — | — | — | excluded per user |
| Vintage Press | — | — | ✅ provisional badge legibility | bug-fixed |

---

## What to do next

This branch is `app` — **not merged to main**. After you have a chance to look at each theme on staging (or locally via `npm run dev`):

- If you like everything → merge `app` into `main`, push, deploy.
- If a specific theme's text colour feels wrong → just update the relevant `--text` / `--title-grad-*` line in `src/styles.css` under that theme's `[data-theme="…"]` block. The mapping above tells you exactly what each token drives.
- If you want me to take a follow-up pass on the items I flagged (theming the green CTA buttons, theme-aware danger colour) — say the word.

Per the standing rule: **`src/changelog.ts` was NOT touched.** When you decide to merge, we can add an Alpha 0.1.x entry then with your sign-off.
