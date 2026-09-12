# Forest & Pearl Menu Polish — Implementation Notes

**Branch:** `sounds` (same branch as the game-audio feature, per user request — this is a second, unrelated batch of work landing on the same branch before it's reviewed/merged).

**Trigger:** user feedback on the live Forest & Pearl menu screenshot — subtitle/share-link text nearly unreadable, header "pearls" were flat CSS-colored bullet glyphs instead of the game's actual painted dot art, and the three menu-shelf icons (single-player/multiplayer/rankings) were still the original line-art icons shared by all 8 themes, reading as generic/"AI-app-ish" next to the painted Forest & Pearl art everywhere else.

**Decisions** (confirmed via AskUserQuestion): icon strategy = reuse existing painted art where a natural fit exists (single-player → `avatar-l1.png`) + new Gemini-generated icons for multiplayer and rankings, since nothing painted exists for those. Logo style = carved wood sign, matching the felt/avatar material language already established.

## Status

### Done, verified live via Playwright screenshots

1. **Subtitle + share-link contrast** — `src/styles.css` (`html[data-theme="forest-pearl"] .subtitle` / `.menu-share-link`, was around line 823-832). Root cause: the existing fix (a dark text-shadow only) can't guarantee contrast against this specific background photo, which has a bright glowing-mist patch directly behind this text — a dark shadow does nothing against a bright patch. Fixed by adding a solid backing scrim using the theme's own `--glass-bg-strong` token (already tuned dark/opaque for this art from an earlier contrast fix), kept the text-shadow as a second line of defense. Both elements now render as legible dark pills.

2. **Header "pearls"** — `src/components/Menu.tsx` (`title-dot-1`/`title-dot-2`, the `●` glyphs) + `src/styles.css` (new `.title-dot-art` class). Forest & Pearl now renders the actual `dot-p1.png`/`dot-p2.png` art (the same glossy emerald marble / iridescent pearl used on the board) instead of flat-colored Unicode bullets — this was the real "wrong colour" complaint: not a hex-value mismatch (the flat dots' colors were already theme-correct), but a style mismatch against the painted art everywhere else. Other 7 themes unaffected (still render the flat glyphs, gated by `theme === 'forest-pearl'`).

3. **Single-player shelf icon** — `src/components/Menu.tsx` + `.menu-shelf-ic.is-avatar img` rule added to `src/styles.css` (extending the existing `is-avatar` treatment already used elsewhere for bot-face icons). Reuses `avatar-l1.png` directly — no new art needed, zero cost, zero wait.

4. **"DotDuel" header wordmark** — DONE. User generated two options directly (not via the prompt below — their own prompt) and picked the carved-wood/gem-bordered version. Despilled (chroma-keyed against its actual muted-magenta background, ~rgb(208,139,193), not pure #FF00FF) and auto-cropped via `scripts` in the session scratchpad, saved as `public/art/forest-pearl/header-wordmark.png`. Wired into `Menu.tsx`'s `<h1 className="title">` — for Forest & Pearl this now renders a single `<img>` (both flanking pearl dots and the gradient text span are dropped; the sign's own corner gems already do that job). Verified at both 960px and 320px width.

### Blocked on user-generated art

5. **Multiplayer shelf icon** — needs `menu-icon-multiplayer.png` (Prompt 1 of 3 in the prompts file).
6. **Rankings shelf icon** — needs `menu-icon-rankings.png` (Prompt 2 of 3 in the prompts file).

(Prompt 3 of 3, the wordmark prompt, is now moot — superseded by the user's own generated art above. Left in the prompts file for reference/history, not to be re-run.)

### Also done this round (user feedback after first pass)

7. **Subtitle contrast, take 2** — the first fix (a `--glass-bg-strong` pill behind the subtitle) worked but the user disliked the pill look and asked for themed dark text directly against the photo instead. Switched to `color: var(--p1)` (dark forest green) with a near-solid white outline (`-webkit-text-stroke` + stacked `text-shadow`, not just a soft glow) — a soft glow alone tested fine at desktop width but failed at 320px, where `background-size: cover` crops the photo differently and lands the text over darker tree canopy instead of the bright mist patch. The outline is opaque enough to hold up regardless of what's behind it. Share link keeps its pill (per the user's own distinction — only the subtitle was "the pill" they meant) and moved to below the Rankings shelf, at the bottom of `.menu-shelves`.
8. **Ambiance loop-seam dip, fixed.** The wind clip had a 1.5s fade baked into the file at both edges (from Task 1), so `AudioBufferSourceNode.loop = true` repeated that exact dip every ~30s — audible as the ambiance "stopping and restarting." Regenerated `ambience-wind.mp3` as a raw trim (no fade), and replaced the single-looping-source approach in `src/audio.ts` with a scheduled crossfade loop (`startLoopLayer`/`stopLoopLayer`): two overlapping buffer instances per layer (wind, stream), each with its own gain envelope that ramps in as the previous instance ramps out over a 2.5s window, so the combined volume never dips. Verified via an instrumented `AudioParam` prototype patch in a live browser session — captured the actual scheduled gain-ramp timestamps for both layers across several cycles and confirmed the ramps overlap exactly (one hits 0 at the same instant the other hits 1).

Prompts: `docs/superpowers/specs/2026-09-12-forest-pearl-menu-polish-gemini-prompts.txt`. Same manual process as the original reskin: user runs each prompt through Gemini (image-capable surface), saves the raw result, drops the 3 files in the project root — then this session crops/despills/verifies and wires them in the same way the original 10-asset batch was integrated.

## Integration plan once the 3 images land

- **Icons (multiplayer, rankings):** magenta chroma-key removal (same despill technique as the original dot/line assets — widen the alpha ramp so color-decontamination reaches every blended pixel, not just the fully-opaque core), auto-crop to content bounds via connected-component labeling, verify against the per-sound... per-*icon* intent (bold/simple/reads at 48×48px, the `.menu-shelf-ic.is-avatar` render size). Wire into `Menu.tsx`'s `CardInner` calls for the multiplayer and rankings shelves exactly like the single-player one (`theme === 'forest-pearl' ? <img .../> : <DuelIcon />` / `<PodiumIcon />`), with the matching `iconClass="is-avatar"`.
- **Wordmark:** same chroma-key + crop process. Wire into `Menu.tsx`'s `<h1 className="title">` block, replacing `<span className="title-text">DotDuel</span>` with an `<img>` for Forest & Pearl (keep accessible text — either visually-hidden text alongside the image, or an `alt="DotDuel"` on the image itself with `role="img"`), gated the same way as the pearls. CSS: size it to roughly match the current text's rendered height (`clamp(2.4rem, 7.5vw, 3.6rem)` line-height) so the header doesn't jump in size when switching themes.
- Verify at 320px width (iPhone-SE) per `CLAUDE.md`'s hard viewport rule — the wordmark image must scale down cleanly, not overflow.
- Commit each asset integration as its own small commit (same git-hygiene discipline as the rest of this branch — name files explicitly, never `git add -A`).
- No plan/spec self-review ceremony needed for this batch (3 assets, not 10) — direct implementation + Playwright-verified screenshots, same rigor the fixes above already used, without the full SDD dispatch machinery.
