# Game Audio Design

**Status:** design approved via brainstorming 2026-09-11, ready for implementation planning.
**Branch:** `sounds` (branched from `main` after the Forest & Pearl visual reskin merged).

## Goal

Give DotDuel sound: short synthesized cues for the moves that make up a game (place a dot, complete a line, claim a pending line, win, lose, draw), plus a looping forest-ambiance background track for the Forest & Pearl theme, plus a soft click for general UI navigation. Addresses the long-standing backlog item in `CLAUDE.md` ("sounds — Settings toggle waits on it") and the "the elephant: silence" observation from the visual-reskin planning doc (`visualization_improvement.md` §5.6) — the game currently has zero audio feedback anywhere.

## Decisions made during brainstorming (2026-09-11)

1. **Hybrid audio approach.** The six short gameplay/UI cues (place, complete, claim, win, loss, draw, click) are synthesized live with the WebAudio API — zero files, zero licensing surface, matches the project's zero-cost/no-royalty rule cleanly. The forest ambiance (wind through leaves, a soft stream, occasional birdsong) is **real CC0/public-domain field recordings**, not synthesized — procedurally-generated wind/water reliably sounds synthetic next to a real recording, and authenticity was the explicit ask ("I want the player to feel like he is in the forest").
2. **Character, not just function.** The synthesized cues are meant to sound like natural materials (wood/pebble, wind-chime-like shimmer), not digital beeps — this is real sound-design work, not just wiring an oscillator to a click handler. See the per-sound table below for intent; exact envelope/frequency values are an implementation-time tuning pass, not fixed by this spec.
3. **Scope: Forest & Pearl only, for now.** The six synthesized cues are theme-agnostic and play under every theme (a dot placement sounds the same regardless of active theme). The looping ambiance is Forest & Pearl-specific — other themes get silence for the background bed until/unless this is revisited per-theme later, mirroring how the visual art rollout proved the mechanism on one theme before considering the rest.
4. **Event list**, confirmed during brainstorming — deliberately trimmed, not exhaustive:
   - Place a dot (empty cell → colored)
   - Complete a line (the instant, same-move scoring case)
   - Claim a pending line (a separate action — clicking a colored dot that completes a previously-pending line)
   - Win
   - Loss
   - Draw
   - Background ambiance loop (Forest & Pearl only)
   - General UI click (menu navigation, buttons, app-wide)
5. **Explicitly deferred, not part of this spec:** ambiance/music for the other 7 themes; a turn-change notification cue; a low-time warning cue for the daily puzzle's 3-minute clock. Noted so they aren't silently forgotten, not built now.

## Architecture

### New module: `src/audio.ts`

A single, self-contained module owning all audio playback — mirrors how `src/telemetry.ts` and `src/ads.ts` each own one concern with a small function-call API, rather than spreading `AudioContext` handling across components.

```ts
export type SfxName = 'place' | 'lineComplete' | 'claim' | 'win' | 'loss' | 'draw' | 'click';

export function playSfx(name: SfxName, opts?: { player?: 1 | 2; lineLength?: number }): void;
export function startAmbiance(): void;   // no-op if theme isn't forest-pearl or music is off
export function stopAmbiance(): void;
export function setSfxEnabled(on: boolean): void;
export function setMusicEnabled(on: boolean): void;
export function primeAudio(): void;      // call on first user gesture — see below
```

- **Lazy `AudioContext` creation.** Browsers refuse to start audio playback before a real user gesture (click/tap/keydown). `primeAudio()` creates the shared `AudioContext` (and, if music is enabled and the theme is Forest & Pearl, kicks off the ambiance loop) — called once, from the first pointerdown/keydown the app sees after mount. Every `playSfx` call is a no-op if the context hasn't been primed yet or if SFX are disabled, rather than throwing or queuing.
- **Enabled-state is read from `Settings`** (new fields, see below) at call time — `audio.ts` doesn't own the on/off state itself, it just respects whatever `setSfxEnabled`/`setMusicEnabled` were last told (called from the same place `Settings` changes are already committed, in `App.tsx`).
- **One shared `AudioContext`**, not one per sound — created once in `primeAudio()`, reused for every subsequent `playSfx` call and for the ambiance source. Standard WebAudio practice; avoids the real (if usually small) per-context overhead of spinning up a new context per sound.
- **Mobile/Capacitor:** ambiance pauses on the Capacitor `App` plugin's `pause`/background lifecycle event (the same category of hook the app likely already has zero of today — this is new wiring, not reusing an existing hook) and resumes on `resume` if music is still enabled and the game screen is still active. Short SFX don't need this — they're one-shot and finish in well under a second regardless of what happens after.

### Settings integration

`src/storage.ts`'s `Settings` interface (`dotduel:settings:v2`) gets two new fields:

```ts
export interface Settings {
  // ...existing fields unchanged...
  sfxEnabled: boolean;
  musicEnabled: boolean;
}
```

Per this project's storage convention (`CLAUDE.md`: "bump `:vN` when shape semantics change"), this is a **new field addition, not a semantic change to existing fields** — existing `:v2` data re-defaults the two new booleans (both `true` by default: sound on, matching the visual reskin's own default-on choice for painted art) without needing a version bump or migration, the same way `showClaimableLinesL4` was presumably added at some point without a `:v3`. If that assumption turns out wrong once the implementer looks at `storage.ts`'s actual load/merge logic, a `:v3` bump is a one-line fix — noted here as a risk, not asserted as fact.

`SettingsPopover.tsx` gets two new toggles, following the exact existing `.settings-toggle` checkbox pattern already used for `hotseatColorSwap` and `showPresence` (see `SettingsPopover.tsx` lines ~127-136 for the pattern to copy) — likely in a new "Sound" section alongside the existing "Appearance" section, before or after the colour-theme row. New i18n keys needed (`t.settings.soundEffects`, `t.settings.backgroundMusic` or similar — exact English strings are the implementer's to draft, per the project's i18n convention of English source-of-truth reviewed before Lithuanian/Spanish translation).

### Integration points (conceptual — exact file:line detail is the implementation plan's job, not this spec's)

- **Place / complete / claim**: hooked into `App.tsx`'s existing move-result handling (the functions that call `game.ts`'s `applyMove`/`applyClaim` and then update state) — distinguishing "plain placement" from "placement that completed a line" from "claim" by inspecting the move's result (whether `state.completed` grew, whether the resulting `scoreEvent.points > 0`, which handler was called) rather than adding any new logic to `game.ts` itself, which stays pure and untouched.
- **Win / loss / draw**: hooked into `GameOver.tsx` (or wherever `state.finished`/`state.winner` is first read to decide which screen to show), firing once when the result becomes known — not on every render.
- **UI click**: a single shared handler (or a thin wrapper component) applied to the general-purpose button classes already used app-wide (`.menu-shelf`, `.btn-back`, `.menu-auth-btn`, etc.) rather than hand-adding a click handler to every individual button — exact mechanism (event delegation at a root level vs. a shared `<SoundButton>` wrapper) is an implementation decision, not fixed here.
- **Ambiance start/stop**: driven by the same theme-effect in `App.tsx` that already sets `data-theme` on mount/change (`App.tsx:951`-ish, per the visual-reskin work earlier this session) — start when the active theme is `forest-pearl` and music is enabled, stop otherwise. Also gated on `primeAudio()` having already run (no attempt to autoplay before the first user gesture).

## Per-sound design intent

Exact oscillator types/frequencies/envelope curves are a tuning pass during implementation (best done by ear, iterating in the browser, not decided on paper) — this table is the *intent* each sound needs to hit, which the implementer should keep re-checking against while tuning.

| Sound | Intent | Notes |
|---|---|---|
| **Place** | A soft wood/pebble "tok" — short, percussive, materially quiet | Pitched subtly differently per player (`opts.player`) so P1 and P2 placements are distinguishable by ear without being jarring |
| **Line complete** | A short upward chime/shimmer, like a small wind-chime catching a breeze | Scale loudness/richness slightly with `opts.lineLength` — a 9-dot row completing should feel a little more rewarding than a 1-dot corner, echoing how the scoring itself rewards longer lines |
| **Claim** | A softer, warmer variant of the same chime family as "line complete" | Related but audibly distinct — a claim is a different action from completing a line in the same move, per the game's own rules, and should sound like it |
| **Win** | A warm major chord swell | "Can be music" per the brainstorming answer — a short chord progression (multiple simultaneous/sequenced oscillator notes), not a single tone |
| **Loss** | A gentle descending minor tone | Deliberately soft, not harsh or punishing — matches the game's existing non-punishing tone (no loss screen shaming, etc.) |
| **Draw** | A short, neutral resolving tone | Distinct from both win and loss — a draw shouldn't sound like either outcome |
| **UI click** | A very soft tap/rustle | Used app-wide; must stay unobtrusive under rapid menu navigation — this is the one sound a player will hear most often, so it needs to tolerate repetition without becoming annoying |

## Ambiance sourcing plan

Real CC0/public-domain field recordings, not synthesized. Concrete sourcing criteria for the implementation step:

- **Source:** freesound.org filtered strictly to the CC0 license (Creative Commons Zero / public domain dedication) — no other license tier, per the project's zero-cost/no-royalty rule. Other CC0-only archives (e.g. Wikimedia Commons audio) are acceptable alternates if freesound.org doesn't have a good match.
- **What's needed:** a wind-through-leaves loop, a soft flowing-stream loop (these two likely get layered/mixed together as the base bed), and a small handful of individual bird-call clips triggered occasionally and randomly rather than looped audibly (avoids the "obviously looping" bird-chirp problem that immediately breaks ambiance immersion).
- **License documentation:** each selected clip gets its source URL, author/uploader, and explicit CC0 confirmation recorded in the implementation plan or a short `AUDIO_SOURCES.md` — same paper-trail discipline the zero-cost rule already requires for other assets.
- **File weight:** keep clips short (loop points matter more than raw length — a well-chosen 15-30s loop beats a longer file) and compress reasonably (this ships inside the Android AAB too, per the visual-reskin final review's asset-size finding — worth not repeating that mistake here).
- **Who does the actual sourcing:** unlike the Gemini art prompts (which the user ran manually), this session's tools include web search/fetch — the implementation plan should have the sourcing as an early, explicit task rather than assuming files simply appear, and can attempt to identify real candidate clips directly rather than only describing the search criteria.

## Testing / verification

This codebase has no audio-specific test tooling and (per the visual-reskin session) Playwright MCP browser automation was unreliable for live verification during that work — this feature should default to **manual verification in a running dev server**, on both desktop and, ideally, a real mobile device given the Capacitor background/foreground behavior specifically needs a device or emulator to exercise (an emulator's "background" state doesn't always behave like a real device). Per `CLAUDE.md`'s existing sanity-checklist convention, add to it for this feature: place a dot as each player, complete a line of several different lengths, claim a pending line, finish a game each way (win/loss/draw), toggle both new Settings switches and confirm they're respected immediately (not just on next launch), and switch away from Forest & Pearl to confirm the ambiance stops and no other theme suddenly has a background track.

## Zero-cost / licensing statement

Per `CLAUDE.md`'s mandatory zero-cost stack rule: the WebAudio API is a browser built-in (no dependency, no cost, no license). The ambiance recordings are CC0/public-domain only, each individually verified and documented, per the sourcing plan above. No paid audio libraries, no royalty sample packs, no proprietary sound fonts. Stated here explicitly per the rule's own requirement to report a new dependency's cost/license in the same response that adds it — in this case, "no new dependency at all."

## Open items for implementation

- Exact synthesis parameters (oscillator types, envelope ADSR shapes, frequencies) for the 7 synthesized sounds — tune by ear in-browser, using the intent table above as the target, not fixed numbers to hit blindly.
- Actual CC0 ambiance clip selection — identify real candidates against the sourcing criteria above as an early implementation task.
- Whether `Settings`'s new fields need a storage version bump — check `storage.ts`'s actual load/default-merge logic before assuming the additive-field-no-bump approach holds (stated as a risk above, not a fact).
- `src/version.ts` / `src/changelog.ts` bump once this ships — changelog wording is the user's to draft, per existing project convention.
