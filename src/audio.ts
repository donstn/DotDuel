// Single module owning all game audio — mirrors telemetry.ts/ads.ts (one
// concern, small function-call API) rather than spreading AudioContext
// handling across components. Ambiance playback lives in a second block
// appended by a later task; this file starts with just the context
// lifecycle and the seven short synthesized cues.

import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

export type SfxName = 'place' | 'lineComplete' | 'claim' | 'win' | 'loss' | 'draw' | 'click';

let ctx: AudioContext | null = null;
let primed = false;
let sfxEnabled = true;
let musicEnabled = true;
let activeTheme: string | null = null;

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
  void loadAmbianceBuffers();
}

export function setSfxEnabled(on: boolean): void {
  sfxEnabled = on;
}

export function setMusicEnabled(on: boolean): void {
  musicEnabled = on;
  syncAmbiance();
}

export function setAmbianceTheme(theme: string): void {
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
