// Single module owning all game audio — mirrors telemetry.ts/ads.ts (one
// concern, small function-call API) rather than spreading AudioContext
// handling across components. Two halves: synthesized SFX cues (below),
// and forest-ambiance playback (further down).

import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import type { ThemeId } from './theme';

export type SfxName = 'place' | 'lineComplete' | 'claim' | 'win' | 'loss' | 'draw' | 'click';

let ctx: AudioContext | null = null;
let primed = false;
let sfxEnabled = true;
let musicEnabled = true;
let activeTheme: ThemeId | null = null;
// All SFX route through this instead of straight to ctx.destination. The
// original short single-oscillator cues never needed it, but win/loss are
// now multi-voice compositions (chords of detuned-oscillator "brass" notes,
// stacked-partial "organ" notes) — several of those summing simultaneously
// can genuinely clip without a limiter riding the peaks down.
let sfxLimiter: DynamicsCompressorNode | null = null;

const AMBIANCE_FILES = {
  wind: '/audio/forest-pearl/ambience-wind.mp3',
  stream: '/audio/forest-pearl/ambience-stream.mp3',
  birds: '/audio/forest-pearl/ambience-birds.mp3',
} as const;

type AmbianceKey = keyof typeof AMBIANCE_FILES;

const ambianceBuffers: Partial<Record<AmbianceKey, AudioBuffer>> = {};
let ambianceBuffersRequested = false;
let ambianceBus: GainNode | null = null;
let birdTimer: number | null = null;
let ambiancePlaying = false;
let ambiancePausedForBackground = false;

// A crossfade-looped layer: instead of AudioBufferSourceNode.loop (which
// repeats the exact same buffer edges every cycle — audible as a dip if the
// clip fades near its edges, or a click if it doesn't), this schedules
// overlapping instances of the buffer that crossfade into each other, so
// the loop seam is always masked by two layers blending rather than one
// layer's volume dropping out and back in.
interface LoopLayer {
  layerGain: GainNode;
  timer: number | null;
  sources: AudioBufferSourceNode[];
}
let windLayer: LoopLayer | null = null;
let streamLayer: LoopLayer | null = null;

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
    return;
  }
  sfxLimiter = ctx.createDynamicsCompressor();
  sfxLimiter.threshold.value = -12;
  sfxLimiter.knee.value = 20;
  sfxLimiter.ratio.value = 6;
  sfxLimiter.attack.value = 0.02;
  sfxLimiter.release.value = 0.2;
  sfxLimiter.connect(ctx.destination);
  syncAmbiance();
}

export function setSfxEnabled(on: boolean): void {
  sfxEnabled = on;
}

export function setMusicEnabled(on: boolean): void {
  musicEnabled = on;
  syncAmbiance();
}

export function setAmbianceTheme(theme: ThemeId): void {
  activeTheme = theme;
  syncAmbiance();
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

// A single brass note for the win fanfare: several slightly detuned
// sawtooth oscillators (a real trumpet is harmonically rich, and a small
// ensemble detune reads as "section of brass" rather than one thin synth
// tone) through a lowpass filter that snaps open on attack and closes
// again toward the release, mimicking a brass instrument's bright,
// punchy onset. `peak` is deliberately conservative — see sfxLimiter
// above and the win/loss cases below for why.
function brassNote(freq: number, startAt: number, dur: number, peak: number, destination: AudioNode): void {
  if (!ctx) return;
  const audioCtx = ctx;
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.7;
  filter.frequency.setValueAtTime(freq * 2, startAt);
  filter.frequency.exponentialRampToValueAtTime(freq * 6, startAt + 0.04);
  filter.frequency.setValueAtTime(freq * 6, startAt + Math.max(0.05, dur * 0.6));
  filter.frequency.exponentialRampToValueAtTime(freq * 2.5, startAt + dur);
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peak, startAt + 0.02);
  gain.gain.setValueAtTime(peak, startAt + Math.max(0.02, dur - 0.12));
  gain.gain.exponentialRampToValueAtTime(0.0008, startAt + dur + 0.15);
  filter.connect(gain);
  gain.connect(destination);
  [1, 1.006, 0.994].forEach((detune) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq * detune, startAt);
    osc.connect(filter);
    osc.start(startAt);
    osc.stop(startAt + dur + 0.25);
  });
}

// A single organ note for the loss dirge: drawbar-style additive synthesis
// (a real organ's voice is a fundamental plus a stack of quieter harmonic
// partials — octave, twelfth, double-octave — not a pure sine), with a
// slow attack/release for a sustained, dignified pad rather than a comedic
// "wah-wah" slide.
function organNote(freq: number, startAt: number, dur: number, peak: number, destination: AudioNode): void {
  if (!ctx) return;
  const audioCtx = ctx;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peak, startAt + 0.45);
  gain.gain.setValueAtTime(peak, startAt + Math.max(0.45, dur - 0.6));
  gain.gain.exponentialRampToValueAtTime(0.0008, startAt + dur + 0.8);
  gain.connect(destination);
  const partials: [number, number][] = [
    [1, 1],
    [2, 0.5],
    [3, 0.28],
    [4, 0.14],
  ];
  partials.forEach(([mult, amp]) => {
    const osc = audioCtx.createOscillator();
    const partialGain = audioCtx.createGain();
    partialGain.gain.value = amp;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * mult, startAt);
    osc.connect(partialGain);
    partialGain.connect(gain);
    osc.start(startAt);
    osc.stop(startAt + dur + 0.9);
  });
}

// Exact frequencies/durations/gains below are a first pass — not yet
// verified by ear; tune by listening in-browser before shipping.
export function playSfx(name: SfxName, opts?: { player?: 1 | 2; lineLength?: number }): void {
  if (!primed || !sfxEnabled || !ctx) return;
  const t0 = ctx.currentTime;
  const dest = sfxLimiter ?? ctx.destination;
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
      // ~18s ceremonial trumpet fanfare: a rising call, a soft echo, the
      // same call transposed up a step, three punches, a sustained
      // "tutti" chord, a reprise of the whole thing, and a final grand
      // chord to close. Per-note peaks are kept low deliberately — each
      // note is 3 unison-detuned oscillators, and up to 5 notes stack at
      // once in the chords, so the real combined level is much higher
      // than a single `peak` value suggests (the sfxLimiter above is the
      // second line of defense, not the only one).
      const C5 = 523.25;
      const D5 = 587.33;
      const E5 = 659.25;
      const G5 = 783.99;
      const B4 = 493.88;
      const G4 = 392.0;
      const C6 = 1046.5;
      const E6 = 1318.51;
      // Phrase 1: rising call.
      [C5, E5, G5, C6].forEach((f, i) => brassNote(f, t0 + i * 0.2, 0.22, 0.06, dest));
      // Echo, softer, descending.
      [G5, E5, C5].forEach((f, i) => brassNote(f, t0 + 1.1 + i * 0.25, 0.3, 0.04, dest));
      // Phrase 2: the same call, transposed up to G.
      [G4, B4, D5, G5].forEach((f, i) => brassNote(f, t0 + 2.5 + i * 0.2, 0.22, 0.06, dest));
      // Three rhythmic punches.
      [
        [3.5, 0.2],
        [3.75, 0.2],
        [4.1, 0.35],
      ].forEach(([at, d]) => brassNote(G5, t0 + at, d, 0.065, dest));
      // Sustained tutti chord.
      [C5, E5, G5, C6].forEach((f) => brassNote(f, t0 + 4.9, 4.6, 0.05, dest));
      // Reprise of the opening call, brighter.
      [C5, E5, G5, C6].forEach((f, i) => brassNote(f, t0 + 9.7 + i * 0.2, 0.24, 0.065, dest));
      [
        [10.6, 0.2],
        [10.85, 0.2],
        [11.15, 0.35],
      ].forEach(([at, d]) => brassNote(C6, t0 + at, d, 0.07, dest));
      // Final grand chord — the ~18s mark lands inside this note's tail.
      [C5, E5, G5, C6, E6].forEach((f) => brassNote(f, t0 + 12.0, 6.0, 0.05, dest));
      break;
    }
    case 'loss': {
      // ~19s dignified organ passage: a slow i-VII-VI-v descending-bass
      // progression in A natural minor (a classical "lament bass" shape —
      // the same device behind centuries of solemn, respectful music, not
      // a comedic trombone slide). Each chord's release rings into the
      // next chord's attack for a smooth, legato feel.
      const chords: [number, number, number][] = [
        [220.0, 261.63, 329.63], // A3 C4 E4 — i (Am)
        [196.0, 246.94, 293.66], // G3 B3 D4 — VII (G)
        [174.61, 220.0, 261.63], // F3 A3 C4 — VI (F)
        [164.81, 196.0, 246.94], // E3 G3 B3 — v (Em)
      ];
      const starts = [0.0, 4.3, 8.6, 12.9];
      const durs = [4.5, 4.5, 4.5, 5.5];
      chords.forEach((chord, i) => {
        chord.forEach((f) => organNote(f, t0 + starts[i], durs[i], 0.09, dest));
      });
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

// Crossfade window: each instance ramps in over this long at its start and
// ramps out over this long before it ends, overlapping with the next
// instance's ramp-in so the combined volume never dips — one rises exactly
// as the other falls. Capped at half the buffer's own length so two
// instances never both target the same moment from opposite directions.
const AMBIANCE_CROSSFADE_SEC = 2.5;

function startLoopLayer(
  audioCtx: AudioContext,
  buffer: AudioBuffer,
  targetGain: number,
  bus: GainNode,
): LoopLayer {
  const layerGain = audioCtx.createGain();
  layerGain.gain.value = targetGain;
  layerGain.connect(bus);
  const layer: LoopLayer = { layerGain, timer: null, sources: [] };

  const dur = buffer.duration;
  const cf = Math.min(AMBIANCE_CROSSFADE_SEC, dur / 2);

  const playOnce = (startAt: number) => {
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    const instGain = audioCtx.createGain();
    instGain.gain.setValueAtTime(0, startAt);
    instGain.gain.linearRampToValueAtTime(1, startAt + cf);
    instGain.gain.setValueAtTime(1, startAt + dur - cf);
    instGain.gain.linearRampToValueAtTime(0, startAt + dur);
    src.connect(instGain);
    instGain.connect(layerGain);
    src.start(startAt);
    src.stop(startAt + dur + 0.05);
    layer.sources.push(src);
    src.onended = () => {
      layer.sources = layer.sources.filter((s) => s !== src);
    };

    // The next instance starts exactly where this one begins its fade-out,
    // so the two overlap for the full crossfade window. Schedule it
    // ~1s before that moment (not right away) so a layer that gets
    // stopped mid-cycle doesn't leave a far-future orphan queued.
    const nextStart = startAt + dur - cf;
    const msUntilSchedule = Math.max(0, (nextStart - audioCtx.currentTime - 1) * 1000);
    layer.timer = window.setTimeout(() => playOnce(nextStart), msUntilSchedule);
  };

  playOnce(audioCtx.currentTime + 0.05);
  return layer;
}

function stopLoopLayer(layer: LoopLayer | null): void {
  if (!layer) return;
  if (layer.timer !== null) window.clearTimeout(layer.timer);
  for (const src of layer.sources) {
    try {
      src.stop();
    } catch {
      // Already stopped/ended — fine.
    }
  }
  layer.layerGain.disconnect();
}

function startAmbianceInternal(): void {
  if (!ctx || ambiancePlaying) return;
  if (!ambianceBuffers.wind && !ambianceBuffers.stream) return;
  const audioCtx = ctx;
  ambianceBus = audioCtx.createGain();
  ambianceBus.gain.value = 0.5;
  ambianceBus.connect(audioCtx.destination);

  if (ambianceBuffers.wind) {
    windLayer = startLoopLayer(audioCtx, ambianceBuffers.wind, 0.7, ambianceBus);
  }
  if (ambianceBuffers.stream) {
    streamLayer = startLoopLayer(audioCtx, ambianceBuffers.stream, 0.5, ambianceBus);
  }
  ambiancePlaying = true;
  scheduleNextBird();
}

function stopAmbianceInternal(): void {
  if (!ambiancePlaying) return;
  stopLoopLayer(windLayer);
  stopLoopLayer(streamLayer);
  windLayer = null;
  streamLayer = null;
  ambianceBus?.disconnect();
  ambianceBus = null;
  if (birdTimer !== null) {
    window.clearTimeout(birdTimer);
    birdTimer = null;
  }
  ambiancePlaying = false;
}

function syncAmbiance(): void {
  if (ctx && ctx.state === 'suspended') void ctx.resume();
  const shouldPlay =
    primed && musicEnabled && activeTheme === 'forest-pearl' && !ambiancePausedForBackground;
  if (shouldPlay) {
    void loadAmbianceBuffers();
    startAmbianceInternal();
  } else {
    stopAmbianceInternal();
  }
}

// Pause ambiance while the app is backgrounded on Android; resume it (if
// still wanted) on foreground. @capacitor/app is already an installed
// dependency (package.json), unused until now — no new cost.
if (Capacitor.isNativePlatform()) {
  void CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    ambiancePausedForBackground = !isActive;
    if (isActive && ctx && ctx.state === 'suspended') void ctx.resume();
    syncAmbiance();
  });
}
