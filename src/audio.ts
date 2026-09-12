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
// All SFX route through this instead of straight to ctx.destination —
// win/loss layer a real audio clip under a couple of soft synthesized
// notes, and a limiter keeps that combination from ever clipping.
let sfxLimiter: DynamicsCompressorNode | null = null;

const AMBIANCE_FILES = {
  wind: '/audio/forest-pearl/ambience-wind.mp3',
  stream: '/audio/forest-pearl/ambience-stream.mp3',
  birds: '/audio/forest-pearl/ambience-birds.mp3',
} as const;

type AmbianceKey = keyof typeof AMBIANCE_FILES;

const ambianceBuffers: Partial<Record<AmbianceKey, AudioBuffer>> = {};
let ambianceBuffersRequested = false;

// Real CC0 field-recording clips for the win/loss outcome cues (a short
// spring-stream burst, a short autumn rain-and-wind gust) — these play
// under every theme, unlike the ambiance loop above, so they're loaded
// eagerly in primeAudio() rather than gated behind a theme check. They're
// small (well under the ambiance trio) and needed by essentially every
// session eventually, so eager loading here isn't the same waste the
// ambiance buffers would be for a player who never enables music.
const OUTCOME_FILES = {
  win: '/audio/win-stream.mp3',
  loss: '/audio/loss-rain.mp3',
} as const;

type OutcomeKey = keyof typeof OUTCOME_FILES;

const outcomeBuffers: Partial<Record<OutcomeKey, AudioBuffer>> = {};
let outcomeBuffersRequested = false;
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
  void loadOutcomeBuffers();
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

async function loadOutcomeBuffers(): Promise<void> {
  if (!ctx || outcomeBuffersRequested) return;
  outcomeBuffersRequested = true;
  const entries = Object.entries(OUTCOME_FILES) as [OutcomeKey, string][];
  await Promise.all(
    entries.map(async ([key, url]) => {
      try {
        const res = await fetch(url);
        const arr = await res.arrayBuffer();
        if (!ctx) return;
        outcomeBuffers[key] = await ctx.decodeAudioData(arr);
      } catch {
        // Missing/failed fetch: that cue's real-audio layer stays silent;
        // the short synthesized accent notes still play on their own.
      }
    }),
  );
}

// One-shot playback of a loaded outcome clip — no loop, no envelope beyond
// what's already baked into the file's own fades.
function playOutcomeClip(key: OutcomeKey, startAt: number, peak: number, destination: AudioNode): void {
  const buf = outcomeBuffers[key];
  if (!ctx || !buf) return;
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  src.buffer = buf;
  gain.gain.value = peak;
  src.connect(gain);
  gain.connect(destination);
  src.start(startAt);
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
      // A short (~3.9s) burst of real spring-stream water, plus two quick
      // soft chime notes — just enough sparkle to register as "you won,"
      // not a fanfare. Replaces an earlier 18s trumpet-fanfare synthesis
      // that read as long and flat rather than celebratory.
      playOutcomeClip('win', t0, 0.55, dest);
      [659.25, 783.99].forEach((f, i) => tone(f, f, 0.14, 'sine', 0.07, t0 + i * 0.12, dest));
      break;
    }
    case 'loss': {
      // A short (~4.9s) burst of real autumn rain-and-wind, plus one soft
      // descending note tucked into the middle — a quiet, gentle "aww,"
      // not the 19s organ dirge this replaces (which read as long and
      // flat rather than merely gentle).
      playOutcomeClip('loss', t0, 0.6, dest);
      tone(220, 174.61, 0.6, 'sine', 0.06, t0 + 0.35, dest);
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
