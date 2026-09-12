# Forest & Pearl Menu Polish — Implementation Notes

**Branch:** `sounds` (same branch as the game-audio feature, per user request — this is a second, unrelated batch of work landing on the same branch before it's reviewed/merged).

**Trigger:** user feedback on the live Forest & Pearl menu screenshot — subtitle/share-link text nearly unreadable, header "pearls" were flat CSS-colored bullet glyphs instead of the game's actual painted dot art, and the three menu-shelf icons (single-player/multiplayer/rankings) were still the original line-art icons shared by all 8 themes, reading as generic/"AI-app-ish" next to the painted Forest & Pearl art everywhere else.

**Decisions** (confirmed via AskUserQuestion): icon strategy = reuse existing painted art where a natural fit exists (single-player → `avatar-l1.png`) + new Gemini-generated icons for multiplayer and rankings, since nothing painted exists for those. Logo style = carved wood sign, matching the felt/avatar material language already established.

## Status

### Done, verified live via Playwright screenshots

1. **Subtitle + share-link contrast** — `src/styles.css` (`html[data-theme="forest-pearl"] .subtitle` / `.menu-share-link`, was around line 823-832). Root cause: the existing fix (a dark text-shadow only) can't guarantee contrast against this specific background photo, which has a bright glowing-mist patch directly behind this text — a dark shadow does nothing against a bright patch. Fixed by adding a solid backing scrim using the theme's own `--glass-bg-strong` token (already tuned dark/opaque for this art from an earlier contrast fix), kept the text-shadow as a second line of defense. Both elements now render as legible dark pills.

2. **Header "pearls"** — `src/components/Menu.tsx` (`title-dot-1`/`title-dot-2`, the `●` glyphs) + `src/styles.css` (new `.title-dot-art` class). Forest & Pearl now renders the actual `dot-p1.png`/`dot-p2.png` art (the same glossy emerald marble / iridescent pearl used on the board) instead of flat-colored Unicode bullets — this was the real "wrong colour" complaint: not a hex-value mismatch (the flat dots' colors were already theme-correct), but a style mismatch against the painted art everywhere else. Other 7 themes unaffected (still render the flat glyphs, gated by `theme === 'forest-pearl'`).

3. **Single-player shelf icon** — `src/components/Menu.tsx` + `.menu-shelf-ic.is-avatar img` rule added to `src/styles.css` (extending the existing `is-avatar` treatment already used elsewhere for bot-face icons). Reuses `avatar-l1.png` directly — no new art needed, zero cost, zero wait.

### Blocked on user-generated art

4. **Multiplayer shelf icon** — needs `menu-icon-multiplayer.png` (Prompt 1 of 3).
5. **Rankings shelf icon** — needs `menu-icon-rankings.png` (Prompt 2 of 3).
6. **"DotDuel" header wordmark** — needs `header-wordmark.png` (Prompt 3 of 3), replacing the current CSS-gradient `<span class="title-text">` treatment for Forest & Pearl specifically.

Prompts: `docs/superpowers/specs/2026-09-12-forest-pearl-menu-polish-gemini-prompts.txt`. Same manual process as the original reskin: user runs each prompt through Gemini (image-capable surface), saves the raw result, drops the 3 files in the project root — then this session crops/despills/verifies and wires them in the same way the original 10-asset batch was integrated.

## Integration plan once the 3 images land

- **Icons (multiplayer, rankings):** magenta chroma-key removal (same despill technique as the original dot/line assets — widen the alpha ramp so color-decontamination reaches every blended pixel, not just the fully-opaque core), auto-crop to content bounds via connected-component labeling, verify against the per-sound... per-*icon* intent (bold/simple/reads at 48×48px, the `.menu-shelf-ic.is-avatar` render size). Wire into `Menu.tsx`'s `CardInner` calls for the multiplayer and rankings shelves exactly like the single-player one (`theme === 'forest-pearl' ? <img .../> : <DuelIcon />` / `<PodiumIcon />`), with the matching `iconClass="is-avatar"`.
- **Wordmark:** same chroma-key + crop process. Wire into `Menu.tsx`'s `<h1 className="title">` block, replacing `<span className="title-text">DotDuel</span>` with an `<img>` for Forest & Pearl (keep accessible text — either visually-hidden text alongside the image, or an `alt="DotDuel"` on the image itself with `role="img"`), gated the same way as the pearls. CSS: size it to roughly match the current text's rendered height (`clamp(2.4rem, 7.5vw, 3.6rem)` line-height) so the header doesn't jump in size when switching themes.
- Verify at 320px width (iPhone-SE) per `CLAUDE.md`'s hard viewport rule — the wordmark image must scale down cleanly, not overflow.
- Commit each asset integration as its own small commit (same git-hygiene discipline as the rest of this branch — name files explicitly, never `git add -A`).
- No plan/spec self-review ceremony needed for this batch (3 assets, not 10) — direct implementation + Playwright-verified screenshots, same rigor the fixes above already used, without the full SDD dispatch machinery.
