# Game Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give DotDuel sound — seven WebAudio-synthesized cues (place, complete a line, claim, win, loss, draw, UI click) plus a real CC0 forest-ambiance loop (wind, stream, occasional birds) that plays only under the Forest & Pearl theme.

**Architecture:** One new self-contained module, `src/audio.ts`, owns all playback (mirrors `telemetry.ts`/`ads.ts`). Two new `Settings` booleans (`sfxEnabled`, `musicEnabled`) gate it, with toggles in `SettingsPopover.tsx`. `App.tsx` primes the shared `AudioContext` on the first user gesture, syncs the module's enabled/theme state, delegates a single click listener for the generic UI sound, and calls `playSfx` from the four move-result handlers. `GameOver.tsx` plays win/loss/draw once per finished game, reusing its own existing `localWin` computation.

**Tech Stack:** Browser WebAudio API (`AudioContext`, `OscillatorNode`, `GainNode`, `AudioBufferSourceNode`) — no new npm dependency. `@capacitor/app` (already an installed dependency, currently unused) for background/foreground ambiance pause. Three CC0-licensed audio files from freesound.org, processed with `ffmpeg`.

**Spec:** `docs/superpowers/specs/2026-09-11-game-audio-design.md`

## Global Constraints

- **Zero-cost/no-royalty** (`CLAUDE.md`): no paid dependency, no proprietary/royalty audio. WebAudio is a browser built-in. The three ambiance source files must be CC0-licensed only — not CC-BY, not CC-BY-SA, not CC-BY-NC. Each one's source URL, author, and license confirmation must be recorded in `public/audio/forest-pearl/AUDIO_SOURCES.md`.
- **Strict TS** (`CLAUDE.md`): `noUnusedLocals`/`noUnusedParameters` — every declared symbol must be read somewhere, not just assigned. `npm run build` (`tsc -b && vite build`) must stay green after every task.
- **No test framework exists in this repo** (no jest/vitest — confirmed via `package.json`). Verification is `npm run build` for type-correctness plus **manual verification in a running dev server** (`npm run dev`), per the spec's own Testing section. Steps below say exactly what to click and what to listen for instead of a `pytest`/`jest`-style assertion.
- **Scope: Forest & Pearl only for the ambiance loop.** The seven synthesized cues are theme-agnostic and play under every theme.
- **`src/changelog.ts` wording is user-owned** (its own file header: "Text additions to THIS FILE require explicit user confirmation before being written"). This plan does **not** touch `version.ts`/`changelog.ts` — bumping those is a separate, manual step after this branch is reviewed, same as the Forest & Pearl visual reskin left it.
- **i18n type safety** (`src/i18n/index.tsx`): `Messages = typeof en`, and `MESSAGES: Record<Lang, Messages>` requires `lt.ts`, `es.ts`, `pt.ts`, `pl.ts`, `cs.ts` to each satisfy that exact shape — every new key added to `en.ts`'s `settings` block must be added to all five other language files too, or `tsc -b` fails.
- **API shape deviates from the spec's illustrative `startAmbiance()`/`stopAmbiance()` sketch on purpose.** The spec itself says exact file:line detail is the plan's call, not the spec's. This plan instead exposes `setAmbianceTheme(theme)` (Task 4), and both it and `setMusicEnabled` internally call a private `syncAmbiance()` that starts/stops based on `(primed && musicEnabled && activeTheme === 'forest-pearl' && !ambiancePausedForBackground)`. Behavior is identical to what the spec describes ("no-op if theme isn't forest-pearl or music is off"); this just avoids every call site independently re-deriving that same condition.
- **Known, accepted scope gap:** in multiplayer, only the acting player's own moves (via `handleMpDotClick`/`handleMpClaimClick`) get place/complete/claim sounds. The opponent's moves arriving over the network (picked up by the existing `prevMpColoredKeysRef` state-diff effect at `App.tsx:1716-1738`) stay silent in this plan — the spec's own "Integration points" section only names the move-result handlers, not that diff effect. Flagged here rather than silently dropped; a natural follow-up, not part of this plan.

---

### Task 1: Source and prepare the CC0 forest-ambiance audio assets

**Files:**
- Create: `public/audio/forest-pearl/ambience-wind.mp3`
- Create: `public/audio/forest-pearl/ambience-stream.mp3`
- Create: `public/audio/forest-pearl/ambience-birds.mp3`
- Create: `public/audio/forest-pearl/AUDIO_SOURCES.md`
- Modify: `vite.config.ts:34`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: three `.mp3` files at the paths above, fetched at runtime by Task 4's `loadAmbianceBuffers()` via `fetch('/audio/forest-pearl/ambience-wind.mp3')` etc. Later tasks assume these exact filenames and directory.

All three source clips below were verified during planning: fetched, confirmed CC0-licensed on their freesound.org pages (the page's own license badge reads "Creative Commons 0"), and probed with `ffprobe` for real duration.

- [ ] **Step 1: Create the target directory**

```bash
mkdir -p public/audio/forest-pearl
```

- [ ] **Step 2: Download, trim, and compress the wind bed**

Source: "Wind Through Trees" by Yoyodaman234, CC0 — <https://freesound.org/people/Yoyodaman234/sounds/335889/> (284.85s original; trimming to a 30s slice starting at 60s, away from the clip's start/end). `-af afade` adds a 1.5s fade at each end of the 30s slice so the WebAudio loop point (Task 4 loops this file with `AudioBufferSourceNode.loop = true`) reads as a gentle dip rather than a hard click.

```bash
curl -sL -A "Mozilla/5.0" -o wind-raw.mp3 "https://cdn.freesound.org/previews/335/335889_2792951-hq.mp3"
ffmpeg -y -ss 60 -t 30 -i wind-raw.mp3 -ac 1 -b:a 64k \
  -af "afade=t=in:st=0:d=1.5,afade=t=out:st=28.5:d=1.5" \
  public/audio/forest-pearl/ambience-wind.mp3
rm wind-raw.mp3
```

- [ ] **Step 3: Download and compress the stream loop**

Source: sound by steaq, titled "Relaxing river stream running water seamless loop", CC0 — <https://freesound.org/people/steaq/sounds/548767/> (10.0s, author-authored as a seamless loop — kept whole, no trimming).

```bash
curl -sL -A "Mozilla/5.0" -o stream-raw.mp3 "https://cdn.freesound.org/previews/548/548767_1474204-hq.mp3"
ffmpeg -y -i stream-raw.mp3 -ac 1 -b:a 64k public/audio/forest-pearl/ambience-stream.mp3
rm stream-raw.mp3
```

- [ ] **Step 4: Download, trim, and compress the bird-call clip**

Source: "bird chirps.wav" by keweldog, CC0 — <https://freesound.org/people/keweldog/sounds/181132/> (41.26s original; trimming a 10s slice starting at 12s — the description "a couple of birds chirping early in the morning at the park" means chirping runs through the clip, so this window reliably contains audible calls). Short 0.3s fades since this plays as a one-shot, not a loop.

```bash
curl -sL -A "Mozilla/5.0" -o birds-raw.mp3 "https://cdn.freesound.org/previews/181/181132_3153523-hq.mp3"
ffmpeg -y -ss 12 -t 10 -i birds-raw.mp3 -ac 1 -b:a 64k \
  -af "afade=t=in:st=0:d=0.3,afade=t=out:st=9.5:d=0.3" \
  public/audio/forest-pearl/ambience-birds.mp3
rm birds-raw.mp3
```

- [ ] **Step 5: Verify the three output files**

```bash
ls -la public/audio/forest-pearl/*.mp3
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 public/audio/forest-pearl/ambience-wind.mp3
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 public/audio/forest-pearl/ambience-stream.mp3
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 public/audio/forest-pearl/ambience-birds.mp3
```

Expected: `ambience-wind.mp3` duration ≈30s and well under 500KB; `ambience-stream.mp3` duration ≈10s and under 150KB; `ambience-birds.mp3` duration ≈10s and under 150KB. If `ffmpeg`/`ffprobe`/`curl` aren't on PATH, install/locate them first — do not skip this step or hand-wave the sizes.

- [ ] **Step 6: Write the source/license paper trail**

Create `public/audio/forest-pearl/AUDIO_SOURCES.md`:

```markdown
# Forest & Pearl ambiance — audio sources

All three files are derivative (trimmed + re-encoded to mono 64kbps mp3)
from CC0-licensed originals. CC0 places no restriction on derivative use,
but the source is recorded here for the paper trail per CLAUDE.md's
zero-cost/no-royalty rule.

## ambience-wind.mp3
- Source: "Wind Through Trees" by Yoyodaman234
- URL: https://freesound.org/people/Yoyodaman234/sounds/335889/
- License: CC0 1.0 (Creative Commons Zero)
- Retrieved: 2026-09-11
- Transform: trimmed to 30s (60s-90s of the original), downmixed to mono,
  re-encoded at 64kbps, 1.5s fade in/out added at the loop seam.

## ambience-stream.mp3
- Source: "Relaxing river stream running water seamless loop" by steaq
- URL: https://freesound.org/people/steaq/sounds/548767/
- License: CC0 1.0 (Creative Commons Zero)
- Retrieved: 2026-09-11
- Transform: downmixed to mono, re-encoded at 64kbps. Not trimmed — the
  10s original is already an author-authored seamless loop.

## ambience-birds.mp3
- Source: "bird chirps.wav" by keweldog
- URL: https://freesound.org/people/keweldog/sounds/181132/
- License: CC0 1.0 (Creative Commons Zero)
- Retrieved: 2026-09-11
- Transform: trimmed to a 10s slice (12s-22s of the original), downmixed
  to mono, re-encoded at 64kbps, 0.3s fade in/out (one-shot playback, not
  looped).
```

- [ ] **Step 7: Make the PWA service worker precache the new files**

`vite.config.ts`'s `workbox.globPatterns` (line 34) currently lists file extensions to precache for offline/installed use and does not include `mp3` — without this change, the new audio files would work online but silently fail to be available offline on an installed PWA/Android build, unlike every other asset in the app.

Read `vite.config.ts` before editing — the exact current line is:

```ts
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2,json,txt}'],
```

Change it to:

```ts
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2,json,txt,mp3}'],
```

- [ ] **Step 8: Build check**

```bash
npm run build
```

Expected: succeeds (this task touches no TypeScript, so this just confirms the `vite.config.ts` edit didn't break the config).

- [ ] **Step 9: Commit**

```bash
git add public/audio/forest-pearl/ambience-wind.mp3 public/audio/forest-pearl/ambience-stream.mp3 public/audio/forest-pearl/ambience-birds.mp3 public/audio/forest-pearl/AUDIO_SOURCES.md vite.config.ts
git commit -m "feat(audio): add CC0 forest-ambiance assets (wind, stream, birds)"
```

---

### Task 2: Settings fields, SettingsPopover toggles, and i18n strings

**Files:**
- Modify: `src/storage.ts:112-136`
- Modify: `src/components/SettingsPopover.tsx:139-154`
- Modify: `src/i18n/en.ts` (settings block, currently lines 237-266)
- Modify: `src/i18n/lt.ts`, `src/i18n/es.ts`, `src/i18n/pt.ts`, `src/i18n/pl.ts`, `src/i18n/cs.ts` (each file's own `settings` block)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `Settings.sfxEnabled: boolean` and `Settings.musicEnabled: boolean`, both default `true`, read by loadSettings()/updateSettings() call sites already in `App.tsx`. Task 5 reads `settings.sfxEnabled`/`settings.musicEnabled` by name — these exact field names are load-bearing for that task.

- [ ] **Step 1: Add the two Settings fields**

In `src/storage.ts`, the `Settings` interface (lines 112-122) currently ends:

```ts
export interface Settings {
  playerName: string;
  opponentName: string;
  hotseatColorSwap: boolean;
  tutorialSeen: boolean;
  gamesPlayed: number;
  claimsMade: number;
  showClaimableLines: boolean;
  showClaimableLinesL4: boolean;
  lastPlayedAt: number;
}
```

Change to:

```ts
export interface Settings {
  playerName: string;
  opponentName: string;
  hotseatColorSwap: boolean;
  tutorialSeen: boolean;
  gamesPlayed: number;
  claimsMade: number;
  showClaimableLines: boolean;
  showClaimableLinesL4: boolean;
  lastPlayedAt: number;
  sfxEnabled: boolean;
  musicEnabled: boolean;
}
```

And `defaultSettings()` (lines 124-136) currently ends:

```ts
function defaultSettings(): Settings {
  return {
    playerName: 'Player 1',
    opponentName: 'Player 2',
    hotseatColorSwap: false,
    tutorialSeen: false,
    gamesPlayed: 0,
    claimsMade: 0,
    showClaimableLines: true,
    showClaimableLinesL4: false,
    lastPlayedAt: 0,
  };
}
```

Change to:

```ts
function defaultSettings(): Settings {
  return {
    playerName: 'Player 1',
    opponentName: 'Player 2',
    hotseatColorSwap: false,
    tutorialSeen: false,
    gamesPlayed: 0,
    claimsMade: 0,
    showClaimableLines: true,
    showClaimableLinesL4: false,
    lastPlayedAt: 0,
    sfxEnabled: true,
    musicEnabled: true,
  };
}
```

`loadSettings()` (lines 138-148) already does `{ ...defaultSettings(), ...parsed }` — existing `dotduel:settings:v2` data re-defaults the two new booleans to `true` with no version bump needed. No change required there.

- [ ] **Step 2: Add the three i18n keys to English**

In `src/i18n/en.ts`, the `settings` block currently has (around line 262-265):

```ts
    appearanceH: 'Appearance',
    colourTheme: 'Colour theme',
    changeTheme: 'Change',
    done: 'Done',
  },
```

Change to:

```ts
    appearanceH: 'Appearance',
    colourTheme: 'Colour theme',
    changeTheme: 'Change',
    soundH: 'Sound',
    soundEffects: 'Sound effects',
    backgroundMusic: 'Background music',
    done: 'Done',
  },
```

- [ ] **Step 3: Add the matching keys to the other five languages**

`Messages = typeof en` means every language file must define the same keys or `tsc -b` fails. Add the three new keys to each file's `settings` block, in the same position (immediately before `done: '...'` inside that block). First-pass translations — reasonable but not run through the project's usual translation review cycle; flag as a known follow-up rather than blocking on it:

`src/i18n/lt.ts`:
```ts
    soundH: 'Garsas',
    soundEffects: 'Garso efektai',
    backgroundMusic: 'Fono muzika',
```

`src/i18n/es.ts`:
```ts
    soundH: 'Sonido',
    soundEffects: 'Efectos de sonido',
    backgroundMusic: 'Música de fondo',
```

`src/i18n/pt.ts`:
```ts
    soundH: 'Som',
    soundEffects: 'Efeitos sonoros',
    backgroundMusic: 'Música de fundo',
```

`src/i18n/pl.ts`:
```ts
    soundH: 'Dźwięk',
    soundEffects: 'Efekty dźwiękowe',
    backgroundMusic: 'Muzyka w tle',
```

`src/i18n/cs.ts`:
```ts
    soundH: 'Zvuk',
    soundEffects: 'Zvukové efekty',
    backgroundMusic: 'Hudba na pozadí',
```

- [ ] **Step 4: Add the Sound section to SettingsPopover**

In `src/components/SettingsPopover.tsx`, the Appearance section ends and the (conditional) Privacy section begins at lines 139-156:

```tsx
          <section className="settings-section">
            <h3>{t.settings.appearanceH}</h3>
            <div className="settings-theme-row">
              <span>{t.settings.colourTheme}</span>
              <button
                type="button"
                className="settings-theme-btn"
                onClick={() => {
                  done();
                  onOpenThemes();
                }}
              >
                {t.settings.changeTheme}
              </button>
            </div>
          </section>

          {onChangePrivacy && (
```

Insert a new section between them (same `.settings-toggle` pattern as the existing `hotseatColorSwap` toggle at lines 127-136):

```tsx
          <section className="settings-section">
            <h3>{t.settings.appearanceH}</h3>
            <div className="settings-theme-row">
              <span>{t.settings.colourTheme}</span>
              <button
                type="button"
                className="settings-theme-btn"
                onClick={() => {
                  done();
                  onOpenThemes();
                }}
              >
                {t.settings.changeTheme}
              </button>
            </div>
          </section>

          <section className="settings-section">
            <h3>{t.settings.soundH}</h3>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={local.sfxEnabled}
                onChange={(e) =>
                  setLocal((s) => ({ ...s, sfxEnabled: e.target.checked }))
                }
              />
              <span>{t.settings.soundEffects}</span>
            </label>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={local.musicEnabled}
                onChange={(e) =>
                  setLocal((s) => ({ ...s, musicEnabled: e.target.checked }))
                }
              />
              <span>{t.settings.backgroundMusic}</span>
            </label>
          </section>

          {onChangePrivacy && (
```

- [ ] **Step 5: Build check**

```bash
npm run build
```

Expected: succeeds. If it fails with a type error naming a missing key on one of the five non-English `Messages` objects, that language file is missing one of the three new keys — go back and add it.

- [ ] **Step 6: Manual verification**

```bash
npm run dev
```

Open the app, open Settings (footer → Settings). Confirm a new "Sound" section appears between "Appearance" and (if signed in) "Privacy", with two checked-by-default toggles: "Sound effects" and "Background music". Toggle each off and on, close Settings, reopen it — confirm the state persisted (this exercises the existing `onChange={updateSettings}` → `saveSettings` path, unchanged by this task).

- [ ] **Step 7: Commit**

```bash
git add src/storage.ts src/components/SettingsPopover.tsx src/i18n/en.ts src/i18n/lt.ts src/i18n/es.ts src/i18n/pt.ts src/i18n/pl.ts src/i18n/cs.ts
git commit -m "feat(audio): add sfxEnabled/musicEnabled settings + Sound toggle section"
```

---

### Task 3: `src/audio.ts` — module scaffold and the seven synthesized cues

**Files:**
- Create: `src/audio.ts`

**Interfaces:**
- Consumes: nothing from other tasks (this task is self-contained; Task 1's asset files and Task 2's Settings fields are not referenced here).
- Produces: `export type SfxName = 'place' | 'lineComplete' | 'claim' | 'win' | 'loss' | 'draw' | 'click';`, `export function primeAudio(): void`, `export function playSfx(name: SfxName, opts?: { player?: 1 | 2; lineLength?: number }): void`, `export function setSfxEnabled(on: boolean): void`, `export function setMusicEnabled(on: boolean): void`, `export function setAmbianceTheme(theme: string): void`. Task 4 extends this same file (adds ambiance logic, and edits `primeAudio`/`setMusicEnabled`/`setAmbianceTheme`'s bodies). Task 5/6/7 import `primeAudio`, `playSfx`, `setSfxEnabled`, `setMusicEnabled`, `setAmbianceTheme` by these exact names.

- [ ] **Step 1: Write `src/audio.ts`**

```ts
// Single module owning all game audio — mirrors telemetry.ts/ads.ts (one
// concern, small function-call API) rather than spreading AudioContext
// handling across components. Ambiance playback lives in a second block
// appended by a later task; this file starts with just the context
// lifecycle and the seven short synthesized cues.

export type SfxName = 'place' | 'lineComplete' | 'claim' | 'win' | 'loss' | 'draw' | 'click';

let ctx: AudioContext | null = null;
let primed = false;
let sfxEnabled = true;
let musicEnabled = true;
let activeTheme: string | null = null;

// Browsers refuse to start audio before a real user gesture. Call this once,
// synchronously, from the first pointerdown/click/keydown the app sees.
export function primeAudio(): void {
  if (primed) return;
  primed = true;
  try {
    ctx = new AudioContext();
    void ctx.resume();
  } catch {
    ctx = null;
  }
}

export function setSfxEnabled(on: boolean): void {
  sfxEnabled = on;
}

export function setMusicEnabled(on: boolean): void {
  musicEnabled = on;
}

export function setAmbianceTheme(theme: string): void {
  activeTheme = theme;
}

// One short tone: linear attack, exponential decay, optional pitch glide.
// Shared by every synthesized cue below.
function tone(
  freqStart: number,
  freqEnd: number,
  duration: number,
  type: OscillatorType,
  peak: number,
  startAt: number,
  destination: AudioNode,
): void {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, startAt);
  if (freqEnd !== freqStart) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), startAt + duration);
  }
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peak, startAt + Math.min(0.01, duration * 0.2));
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
}

// Exact frequencies/durations/gains below are a first pass tuned by ear
// against the design spec's per-sound intent table — refine in Step 3 by
// actually listening, not by re-deriving these from first principles.
export function playSfx(name: SfxName, opts?: { player?: 1 | 2; lineLength?: number }): void {
  if (!primed || !sfxEnabled || !ctx) return;
  const t0 = ctx.currentTime;
  const dest = ctx.destination;
  const player = opts?.player ?? 1;
  const lineLength = opts?.lineLength ?? 1;

  switch (name) {
    case 'place': {
      const base = player === 1 ? 210 : 250;
      tone(base * 1.6, base, 0.09, 'triangle', 0.22, t0, dest);
      break;
    }
    case 'lineComplete': {
      const root = 440;
      const semis = lineLength >= 5 ? [0, 4, 7, 12] : [0, 4, 7];
      semis.forEach((semi, i) => {
        const f = root * Math.pow(2, semi / 12);
        tone(f, f, 0.22, 'sine', 0.16, t0 + i * 0.05, dest);
      });
      break;
    }
    case 'claim': {
      const root = 349;
      [0, 4].forEach((semi, i) => {
        const f = root * Math.pow(2, semi / 12);
        tone(f, f, 0.28, 'triangle', 0.13, t0 + i * 0.06, dest);
      });
      break;
    }
    case 'win': {
      const root = 261.63;
      [0, 4, 7, 12].forEach((semi) => {
        const f = root * Math.pow(2, semi / 12);
        tone(f, f, 1.4, 'sine', 0.14, t0, dest);
      });
      break;
    }
    case 'loss': {
      tone(300, 180, 0.9, 'sine', 0.18, t0, dest);
      break;
    }
    case 'draw': {
      [0, 7].forEach((semi, i) => {
        const f = 330 * Math.pow(2, semi / 12);
        tone(f, f, 0.35, 'triangle', 0.14, t0 + i * 0.04, dest);
      });
      break;
    }
    case 'click': {
      tone(900, 700, 0.04, 'sine', 0.06, t0, dest);
      break;
    }
  }
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: succeeds — this file isn't imported anywhere yet, so this only confirms `audio.ts` itself type-checks cleanly (no unused-local errors, etc).

- [ ] **Step 3: Manual verification and tuning pass**

```bash
npm run dev
```

Open the app in a browser. Open the browser's DevTools console. Since `audio.ts` isn't wired into the UI until Task 5/6/7, exercise it directly from the console using dynamic import:

```js
const audio = await import('/src/audio.ts');
audio.primeAudio();
audio.setSfxEnabled(true);
audio.playSfx('place', { player: 1 });
audio.playSfx('place', { player: 2 });
audio.playSfx('lineComplete', { lineLength: 3 });
audio.playSfx('lineComplete', { lineLength: 9 });
audio.playSfx('claim', { lineLength: 5 });
audio.playSfx('win');
audio.playSfx('loss');
audio.playSfx('draw');
audio.playSfx('click');
```

Listen to each against the spec's intent (place = soft wood/pebble tok, distinguishable per player; lineComplete = upward chime, richer for length ≥5; claim = softer/warmer variant; win = warm major chord swell; loss = gentle descending minor tone; draw = short neutral tone; click = very soft tap). If something reads as a harsh digital beep rather than the intended character, adjust that case's frequencies/gains/durations directly in `src/audio.ts` and re-run — this is the "tune by ear" pass the spec calls for. Also confirm `audio.setSfxEnabled(false)` makes every `playSfx` call silent, and that `audio.playSfx('place')` called before `audio.primeAudio()` is a silent no-op (no thrown error).

- [ ] **Step 4: Commit**

```bash
git add src/audio.ts
git commit -m "feat(audio): add audio.ts with WebAudio-synthesized SFX (place/complete/claim/win/loss/draw/click)"
```

---

### Task 4: `src/audio.ts` — forest ambiance (wind + stream loop, occasional birds)

**Files:**
- Modify: `src/audio.ts` (appends new code; also edits `primeAudio`, `setMusicEnabled`, `setAmbianceTheme` from Task 3)

**Interfaces:**
- Consumes: `public/audio/forest-pearl/ambience-{wind,stream,birds}.mp3` from Task 1 (fetched by URL at runtime); Task 3's `ctx`, `primed`, `musicEnabled`, `activeTheme` module state.
- Produces: no new public exports — ambiance is entirely driven by the existing `primeAudio()`/`setMusicEnabled()`/`setAmbianceTheme()` surface from Task 3, which this task makes functional.

- [ ] **Step 1: Add `@capacitor/app` import and the ambiance module state**

At the top of `src/audio.ts`, add after the file's opening comment block:

```ts
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
```

After the existing `let activeTheme: string | null = null;` line, add:

```ts
const AMBIANCE_FILES = {
  wind: '/audio/forest-pearl/ambience-wind.mp3',
  stream: '/audio/forest-pearl/ambience-stream.mp3',
  birds: '/audio/forest-pearl/ambience-birds.mp3',
} as const;

type AmbianceKey = keyof typeof AMBIANCE_FILES;

const ambianceBuffers: Partial<Record<AmbianceKey, AudioBuffer>> = {};
let ambianceBuffersRequested = false;
let ambianceBus: GainNode | null = null;
let windSource: AudioBufferSourceNode | null = null;
let streamSource: AudioBufferSourceNode | null = null;
let birdTimer: number | null = null;
let ambiancePlaying = false;
let ambiancePausedForBackground = false;
```

- [ ] **Step 2: Modify `primeAudio` to load ambiance buffers**

Current (from Task 3):

```ts
export function primeAudio(): void {
  if (primed) return;
  primed = true;
  try {
    ctx = new AudioContext();
    void ctx.resume();
  } catch {
    ctx = null;
  }
}
```

Change to:

```ts
export function primeAudio(): void {
  if (primed) return;
  primed = true;
  try {
    ctx = new AudioContext();
    void ctx.resume();
  } catch {
    ctx = null;
    return;
  }
  void loadAmbianceBuffers();
}
```

- [ ] **Step 3: Modify `setMusicEnabled` and `setAmbianceTheme` to resync ambiance**

Current (from Task 3):

```ts
export function setMusicEnabled(on: boolean): void {
  musicEnabled = on;
}
```

Change to:

```ts
export function setMusicEnabled(on: boolean): void {
  musicEnabled = on;
  syncAmbiance();
}
```

Current (from Task 3):

```ts
export function setAmbianceTheme(theme: string): void {
  activeTheme = theme;
}
```

Change to:

```ts
export function setAmbianceTheme(theme: string): void {
  activeTheme = theme;
  syncAmbiance();
}
```

- [ ] **Step 4: Add the ambiance implementation**

Append after `playSfx` (end of file):

```ts
async function loadAmbianceBuffers(): Promise<void> {
  if (!ctx || ambianceBuffersRequested) return;
  ambianceBuffersRequested = true;
  const entries = Object.entries(AMBIANCE_FILES) as [AmbianceKey, string][];
  await Promise.all(
    entries.map(async ([key, url]) => {
      try {
        const res = await fetch(url);
        const arr = await res.arrayBuffer();
        if (!ctx) return;
        ambianceBuffers[key] = await ctx.decodeAudioData(arr);
      } catch {
        // Missing/failed fetch: that layer just stays silent, others still play.
      }
    }),
  );
  syncAmbiance();
}

function scheduleNextBird(): void {
  if (birdTimer !== null) window.clearTimeout(birdTimer);
  const delayMs = 40000 + Math.random() * 60000;
  birdTimer = window.setTimeout(() => {
    playBirdCall();
    scheduleNextBird();
  }, delayMs);
}

function playBirdCall(): void {
  const buf = ambianceBuffers.birds;
  if (!ctx || !ambianceBus || !buf) return;
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  src.buffer = buf;
  gain.gain.value = 0.5;
  src.connect(gain);
  gain.connect(ambianceBus);
  src.start();
}

function startAmbianceInternal(): void {
  if (!ctx || ambiancePlaying) return;
  if (!ambianceBuffers.wind && !ambianceBuffers.stream) return;
  ambianceBus = ctx.createGain();
  ambianceBus.gain.value = 0.5;
  ambianceBus.connect(ctx.destination);

  if (ambianceBuffers.wind) {
    windSource = ctx.createBufferSource();
    windSource.buffer = ambianceBuffers.wind;
    windSource.loop = true;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.7;
    windSource.connect(windGain);
    windGain.connect(ambianceBus);
    windSource.start();
  }
  if (ambianceBuffers.stream) {
    streamSource = ctx.createBufferSource();
    streamSource.buffer = ambianceBuffers.stream;
    streamSource.loop = true;
    const streamGain = ctx.createGain();
    streamGain.gain.value = 0.5;
    streamSource.connect(streamGain);
    streamGain.connect(ambianceBus);
    streamSource.start();
  }
  ambiancePlaying = true;
  scheduleNextBird();
}

function stopAmbianceInternal(): void {
  if (!ambiancePlaying) return;
  windSource?.stop();
  streamSource?.stop();
  windSource = null;
  streamSource = null;
  ambianceBus?.disconnect();
  ambianceBus = null;
  if (birdTimer !== null) {
    window.clearTimeout(birdTimer);
    birdTimer = null;
  }
  ambiancePlaying = false;
}

function syncAmbiance(): void {
  const shouldPlay =
    primed && musicEnabled && activeTheme === 'forest-pearl' && !ambiancePausedForBackground;
  if (shouldPlay) startAmbianceInternal();
  else stopAmbianceInternal();
}

// Pause ambiance while the app is backgrounded on Android; resume it (if
// still wanted) on foreground. @capacitor/app is already an installed
// dependency (package.json), unused until now — no new cost.
if (Capacitor.isNativePlatform()) {
  void CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    ambiancePausedForBackground = !isActive;
    syncAmbiance();
  });
}
```

- [ ] **Step 5: Build check**

```bash
npm run build
```

Expected: succeeds.

- [ ] **Step 6: Manual verification**

```bash
npm run dev
```

In the browser console:

```js
const audio = await import('/src/audio.ts');
audio.setMusicEnabled(true);
audio.setAmbianceTheme('forest-pearl');
audio.primeAudio();
```

Wait a couple of seconds for the fetch+decode to finish. Confirm you hear the wind+stream bed start automatically (no further call needed — `loadAmbianceBuffers` calls `syncAmbiance()` when done). Then:

```js
audio.setAmbianceTheme('royal-court'); // any non-forest-pearl theme id
```

Confirm the ambiance stops. Then:

```js
audio.setAmbianceTheme('forest-pearl');
```

Confirm it resumes. Leave it running for a couple of minutes and confirm you hear at least one bird call layered in on top, and that the wind/stream loop doesn't produce a jarring click at its seam (a soft dip is expected and fine — see Task 1 Step 2's fade rationale). If Android/Capacitor background-pause is testable in this environment (emulator or device), background the app and confirm the ambiance stops, then foreground it and confirm it resumes; if not testable here, leave this specific check for the Android sanity pass already in `CLAUDE.md`'s checklist.

- [ ] **Step 7: Commit**

```bash
git add src/audio.ts
git commit -m "feat(audio): add forest ambiance playback (wind+stream loop, occasional birds)"
```

---

### Task 5: Wire audio priming, settings sync, theme sync, and UI-click sound into App.tsx

**Files:**
- Modify: `src/App.tsx` (import block ~line 125; `updateSettings` at lines 363-366; theme effect at lines 950-956)

**Interfaces:**
- Consumes: `primeAudio`, `playSfx`, `setSfxEnabled`, `setMusicEnabled`, `setAmbianceTheme` from `src/audio.ts` (Tasks 3-4); `settings.sfxEnabled`/`settings.musicEnabled` from Task 2's `Settings` type; the existing `theme` state (`ThemeId`) already in `App.tsx`.
- Produces: nothing new consumed by other tasks — Task 6/7 import from `src/audio.ts` directly, not from anything this task adds.

- [ ] **Step 1: Add the import**

In `src/App.tsx`, current lines 119-126:

```ts
import { loadTheme, saveTheme, type ThemeId } from './theme';
import {
  applyConsent,
  loadConsent,
  saveConsent,
  type Consent,
} from './consent';
import { pickAIAction } from './ai';
```

Change to:

```ts
import { loadTheme, saveTheme, type ThemeId } from './theme';
import {
  applyConsent,
  loadConsent,
  saveConsent,
  type Consent,
} from './consent';
import { primeAudio, playSfx, setSfxEnabled, setMusicEnabled, setAmbianceTheme } from './audio';
import { pickAIAction } from './ai';
```

- [ ] **Step 2: Sync the theme into audio.ts**

Current (lines 950-956):

```tsx
  // Apply colour theme to <html data-theme>, persist, and count "themes tried".
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
    fireAch(recordTheme(theme, achEnv()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
```

Change to:

```tsx
  // Apply colour theme to <html data-theme>, persist, and count "themes tried".
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
    fireAch(recordTheme(theme, achEnv()));
    setAmbianceTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
```

- [ ] **Step 3: Sync settings + prime audio on first gesture + delegate the UI click sound**

Current (lines 363-366):

```tsx
  const updateSettings = (next: Settings) => {
    setSettings(next);
    saveSettings(next);
  };
```

Change to:

```tsx
  const updateSettings = (next: Settings) => {
    setSettings(next);
    saveSettings(next);
  };

  // Keep audio.ts's enabled-flags in sync with Settings, from whichever path
  // changed them (updateSettings above, or the direct setSettings/saveSettings
  // call in onToggleRings further down — neither of which touch these two
  // fields, but this effect is correct regardless of which path fired).
  useEffect(() => {
    setSfxEnabled(settings.sfxEnabled);
    setMusicEnabled(settings.musicEnabled);
  }, [settings.sfxEnabled, settings.musicEnabled]);

  // Prime the shared AudioContext on the first real user gesture (browsers
  // refuse autoplay before one). The capturing click listener also plays the
  // generic UI-click cue for any <button> press, app-wide, without touching
  // every individual component.
  useEffect(() => {
    const onFirstGesture = () => primeAudio();
    const onClickCapture = (e: MouseEvent) => {
      primeAudio();
      const target = e.target as HTMLElement | null;
      if (target?.closest('button')) playSfx('click');
    };
    window.addEventListener('pointerdown', onFirstGesture, { once: true });
    window.addEventListener('click', onClickCapture, true);
    return () => {
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('click', onClickCapture, true);
    };
  }, []);
```

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: succeeds.

- [ ] **Step 5: Manual verification**

```bash
npm run dev
```

Open the app (default theme is Forest & Pearl). Click any button (e.g. a menu item) — confirm you hear the soft UI-click sound. Open Settings → Appearance → switch to a different theme — confirm no console errors. Switch back to Forest & Pearl and wait a few seconds — confirm the wind/stream ambiance starts (this is the same behavior verified directly in Task 4 Step 6, now exercised through the real theme-picker UI instead of the console). Open Settings, toggle "Background music" off — confirm the ambiance stops; toggle it back on — confirm it resumes. Toggle "Sound effects" off — confirm button clicks go silent; toggle back on — confirm they return.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat(audio): wire audio priming, settings sync, theme sync, and UI-click sound into App"
```

---

### Task 6: Play place/complete/claim sounds from the four move-result handlers

**Files:**
- Modify: `src/App.tsx` (`handleMpDotClick` lines 1970-2011; `handleMpClaimClick` lines 2013-2051; `handleDotClick` lines 2053-2075; `handleClaimClick` lines 2077-2096)

**Interfaces:**
- Consumes: `playSfx` from `src/audio.ts` (already imported by Task 5's Step 1 — this task adds no new import). `MoveResult`/`ClaimResult` shapes from `src/game.ts` (`scoredLine: CompletedLine | null`, `pointsGained: number`) — unchanged, pre-existing.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: `handleMpDotClick`**

Current (inside the function, lines 1985-1996):

```tsx
    try {
      const result = applyMove(baseState, dotId);
      setOptimisticMpState({ baseTurn: baseState.turn, state: result.state });
      setOptimisticClock(buildOptimisticClock(myNum, sentAt));
      if (result.pointsGained > 0 || result.newlyPending.length > 0) {
        setScoreEvent({
          dotId,
          points: result.pointsGained,
          player: myNum,
          seq: Date.now(),
        });
      }
    } catch (e) {
```

Change to:

```tsx
    try {
      const result = applyMove(baseState, dotId);
      playSfx('place', { player: myNum });
      if (result.scoredLine) {
        playSfx('lineComplete', { player: myNum, lineLength: result.pointsGained });
      }
      setOptimisticMpState({ baseTurn: baseState.turn, state: result.state });
      setOptimisticClock(buildOptimisticClock(myNum, sentAt));
      if (result.pointsGained > 0 || result.newlyPending.length > 0) {
        setScoreEvent({
          dotId,
          points: result.pointsGained,
          player: myNum,
          seq: Date.now(),
        });
      }
    } catch (e) {
```

- [ ] **Step 2: `handleMpClaimClick`**

Current (lines 2022-2036):

```tsx
    try {
      const result = applyClaim(baseState, lineId);
      setOptimisticMpState({ baseTurn: baseState.turn, state: result.state });
      setOptimisticClock(buildOptimisticClock(myNum, sentAt));
      const line = getBoard(onlineGame.shape).lines.find((l) => l.id === lineId);
      if (line && result.pointsGained > 0) {
        const midDot = line.dotIds[Math.floor(line.dotIds.length / 2)];
        setScoreEvent({
          dotId: midDot,
          points: result.pointsGained,
          player: myNum,
          seq: Date.now(),
        });
      }
    } catch (e) {
```

Change to:

```tsx
    try {
      const result = applyClaim(baseState, lineId);
      playSfx('claim', { player: myNum, lineLength: result.pointsGained });
      setOptimisticMpState({ baseTurn: baseState.turn, state: result.state });
      setOptimisticClock(buildOptimisticClock(myNum, sentAt));
      const line = getBoard(onlineGame.shape).lines.find((l) => l.id === lineId);
      if (line && result.pointsGained > 0) {
        const midDot = line.dotIds[Math.floor(line.dotIds.length / 2)];
        setScoreEvent({
          dotId: midDot,
          points: result.pointsGained,
          player: myNum,
          seq: Date.now(),
        });
      }
    } catch (e) {
```

- [ ] **Step 3: `handleDotClick`**

Current (lines 2053-2067):

```tsx
  const handleDotClick = (dotId: number) => {
    if (!state || !config || state.finished) return;
    if (thinking) return;
    if ((config.mode === 'ai' || config.mode === 'daily') && state.current === 2) return;
    if (state.colored[dotId]) return;
    const movingPlayer = state.current;
    const result = applyMove(state, dotId);
    if (result.pointsGained > 0 || result.newlyPending.length > 0) {
      setScoreEvent({
        dotId,
        points: result.pointsGained,
        player: movingPlayer,
        seq: Date.now(),
      });
    }
```

Change to:

```tsx
  const handleDotClick = (dotId: number) => {
    if (!state || !config || state.finished) return;
    if (thinking) return;
    if ((config.mode === 'ai' || config.mode === 'daily') && state.current === 2) return;
    if (state.colored[dotId]) return;
    const movingPlayer = state.current;
    const result = applyMove(state, dotId);
    playSfx('place', { player: movingPlayer });
    if (result.scoredLine) {
      playSfx('lineComplete', { player: movingPlayer, lineLength: result.pointsGained });
    }
    if (result.pointsGained > 0 || result.newlyPending.length > 0) {
      setScoreEvent({
        dotId,
        points: result.pointsGained,
        player: movingPlayer,
        seq: Date.now(),
      });
    }
```

- [ ] **Step 4: `handleClaimClick`**

Current (lines 2077-2085):

```tsx
  const handleClaimClick = (lineId: string) => {
    if (!state || !config || state.finished) return;
    if (thinking) return;
    if ((config.mode === 'ai' || config.mode === 'daily') && state.current === 2) return;
    if (!state.pending.includes(lineId)) return;
    const movingPlayer = state.current;
    const result = applyClaim(state, lineId);
    claimsInGame.current += 1;
```

Change to:

```tsx
  const handleClaimClick = (lineId: string) => {
    if (!state || !config || state.finished) return;
    if (thinking) return;
    if ((config.mode === 'ai' || config.mode === 'daily') && state.current === 2) return;
    if (!state.pending.includes(lineId)) return;
    const movingPlayer = state.current;
    const result = applyClaim(state, lineId);
    playSfx('claim', { player: movingPlayer, lineLength: result.pointsGained });
    claimsInGame.current += 1;
```

- [ ] **Step 5: Build check**

```bash
npm run build
```

Expected: succeeds.

- [ ] **Step 6: Manual verification**

```bash
npm run dev
```

Start a hot-seat game (simplest mode to exercise both players locally). Place a dot as Player 1 — confirm the "place" tok. Keep placing until a line completes — confirm the upward "lineComplete" chime plays instead of/in addition to the place sound landing on the same click. Get a multi-line completion (two lines complete on one placement) so a line goes pending, then click a colored dot in that pending line to claim it — confirm the distinct "claim" sound. Start a vs-AI game and confirm your own placements still sound correct (AI's own placements are out of this plan's scope — silence for the bot's moves is expected, not a bug, since only the four local move-result handlers were wired).

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "feat(audio): play place/lineComplete/claim sounds from move-result handlers"
```

---

### Task 7: Play win/loss/draw sound once per finished game

**Files:**
- Modify: `src/components/GameOver.tsx` (imports at top; component body after `localWin` is computed, currently lines 227-234)

**Interfaces:**
- Consumes: `playSfx` from `src/audio.ts` (Task 3); the component's own existing `localWin: boolean`, `state.winner: GameState['winner']`, `finishedReason?: FinishedReason` — all pre-existing, computed for the celebration/title logic already in this file.
- Produces: nothing consumed by other tasks. This is the last task in the plan.

- [ ] **Step 1: Add the import**

`src/components/GameOver.tsx` currently starts:

```tsx
import { useState } from 'react';
import type { Difficulty, GameMode, GameState, Player, ShapeId } from '../types';
import type { ShareResultData } from '../share/resultShareText';
import { GameResultShareButton } from './GameResultShareButton';
import { WinCelebration } from './WinCelebration';
import { useT, type Messages } from '../i18n';
```

Change to:

```tsx
import { useEffect, useState } from 'react';
import type { Difficulty, GameMode, GameState, Player, ShapeId } from '../types';
import type { ShareResultData } from '../share/resultShareText';
import { GameResultShareButton } from './GameResultShareButton';
import { WinCelebration } from './WinCelebration';
import { useT, type Messages } from '../i18n';
import { playSfx } from '../audio';
```

- [ ] **Step 2: Play the outcome sound once, on mount**

Current (lines 227-242, computing `localWin` and `celebrationLevel`):

```tsx
  const localWin =
    (mode === 'ai' && state.winner === 1) ||
    (mode === 'hotseat' && (state.winner === 1 || state.winner === 2)) ||
    (mode === 'daily' && state.winner === 1) ||
    (mode === 'multiplayer' &&
      myPlayer !== undefined &&
      state.winner === myPlayer &&
      finishedReason !== 'aborted');
  // Celebration scales with difficulty: a vs-AI win passes the level you beat
  // (1-5; L5 = the gold Impossible show). Hot-seat / multiplayer / daily wins
  // get a solid mid-level (3) celebration.
  const celebrationLevel: number | null = !localWin
    ? null
    : mode === 'ai'
      ? difficulty ?? 1
      : 3;
```

Add directly after that block (still inside the component function, before `let title = ...`):

```tsx
  // Once per mount — GameOver mounts exactly once when a game finishes, same
  // assumption WinCelebration above already relies on. No sound for an
  // aborted match (no clear win/loss to voice).
  useEffect(() => {
    if (finishedReason === 'aborted') return;
    if (state.winner === 'draw' || state.winner === null) {
      playSfx('draw');
    } else if (localWin) {
      playSfx('win');
    } else {
      playSfx('loss');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: succeeds.

- [ ] **Step 4: Manual verification**

```bash
npm run dev
```

Play a hot-seat game to a decisive finish — confirm the "win" chord swell plays once when the GameOver screen appears (not repeatedly, not on every render). Force a draw (equal scores) — confirm the neutral "draw" tone instead. Play vs-AI and lose on purpose — confirm the descending "loss" tone. If multiplayer is testable in this environment, finish one match and confirm the winner hears "win" and the loser hears "loss" on their own respective screens (each client renders its own `GameOver` with its own `myPlayer`).

- [ ] **Step 5: Commit**

```bash
git add src/components/GameOver.tsx
git commit -m "feat(audio): play win/loss/draw sound once per finished game"
```

---

## After all tasks: final review

Once all seven tasks are committed, this plan's SDD workspace should run the final whole-branch review (per `superpowers:subagent-driven-development`) before this is handed back for a PR. Known, accepted gaps to carry into that review rather than treat as findings:

- Opponent's moves in multiplayer stay silent (see Global Constraints).
- `src/version.ts`/`src/changelog.ts` are untouched — a manual step after review, changelog wording pending the user.
- The six i18n translations in Task 2 are a first pass, not run through the project's usual reviewer-agent translation cycle.
