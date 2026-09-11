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
// Read by Task 4's ambiance logic (appended later in this file); referenced
// here so the module type-checks standalone (noUnusedLocals) before that
// code lands.
void musicEnabled;
void activeTheme;

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
