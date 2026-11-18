// Christmas sound set, fully synthesized: bell/glass/sleigh-bell voices built
// from additive partials, plus a procedural fireside ambience. Nothing is
// sampled, and the jingle phrases are our own renditions of public-domain
// carols (Jingle Bells — Pierpont d.1893; We Wish You a Merry Christmas —
// traditional), so the whole set carries no licence of any kind.

import type { SfxName } from './audio';

type Partial3 = [ratio: number, amp: number, dur: number];

// Free-bar glockenspiel: the classic 1 : 2.76 : 5.40 : 8.93 inharmonic modes.
const GLOCK: Partial3[] = [
  [1, 1, 1.4],
  [2.76, 0.32, 0.45],
  [5.4, 0.12, 0.18],
  [8.93, 0.05, 0.08],
];
// Softer, rounder music-box tine for the draw phrase.
const TINE: Partial3[] = [
  [1, 1, 1.1],
  [2, 0.18, 0.4],
  [3, 0.08, 0.25],
  [4.2, 0.04, 0.12],
];
// Thin glass shell (a bauble being tapped).
const GLASS: Partial3[] = [
  [1, 1, 0.38],
  [2.32, 0.5, 0.24],
  [4.25, 0.28, 0.13],
  [6.63, 0.12, 0.07],
];

let noiseBuf: AudioBuffer | null = null;
function noise(ctx: AudioContext): AudioBuffer {
  if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf;
  const len = ctx.sampleRate * 2;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

function voice(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  t: number,
  peak: number,
  partials: Partial3[],
  durScale = 1,
): void {
  for (const [ratio, amp, dur] of partials) {
    const f = freq * ratio;
    if (f > ctx.sampleRate / 2.2) continue;
    const d = dur * durScale;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak * amp, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + d + 0.02);
  }
}

function noiseBurst(
  ctx: AudioContext,
  dest: AudioNode,
  t: number,
  dur: number,
  peak: number,
  freq: number,
  q: number,
): void {
  const src = ctx.createBufferSource();
  src.buffer = noise(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp);
  bp.connect(g);
  g.connect(dest);
  src.start(t, Math.random() * 1.5);
  src.stop(t + dur + 0.02);
}

const jitter = (amount: number) => 1 + (Math.random() * 2 - 1) * amount;

// One shake: a handful of tiny inharmonic jingle bells hit in a quick
// cluster, each with a breathy metallic noise tick.
function sleighShake(ctx: AudioContext, dest: AudioNode, t: number, peak: number, hits = 5): void {
  for (let h = 0; h < hits; h++) {
    const ht = t + h * 0.022 * jitter(0.4);
    const p = peak * (h === 0 ? 1 : 0.55 + Math.random() * 0.35);
    for (let b = 0; b < 3; b++) {
      const f = 2600 + Math.random() * 3400;
      voice(ctx, dest, f, ht, p * 0.22, [
        [1, 1, 0.16],
        [1.47, 0.5, 0.1],
        [2.13, 0.3, 0.06],
      ]);
    }
    noiseBurst(ctx, dest, ht, 0.035, p * 0.35, 7000, 1.2);
  }
}

const note = (semisFromA4: number) => 440 * Math.pow(2, semisFromA4 / 12);
const C5 = note(3), D5 = note(5), E5 = note(7), G5 = note(10), B4 = note(2), A4 = note(0), G4 = note(-2), C4 = note(-9);

// [freq, length in quarter beats]
const JINGLE_BELLS: [number, number][] = [
  [E5, 1], [E5, 1], [E5, 2],
  [E5, 1], [E5, 1], [E5, 2],
  [E5, 1], [G5, 1], [C5, 1.5], [D5, 0.5],
  [E5, 4],
];
// Pickup + first bar, stopping unresolved on A — fits a draw.
const WE_WISH: [number, number][] = [
  [G4, 1],
  [C5, 1], [C5, 0.5], [D5, 0.5], [C5, 0.5], [B4, 0.5],
  [A4, 1], [A4, 2],
];

function phrase(
  ctx: AudioContext,
  dest: AudioNode,
  t0: number,
  notes: [number, number][],
  beat: number,
  peak: number,
  partials: Partial3[],
  octave = 1,
): number {
  let t = t0;
  for (const [f, len] of notes) {
    voice(ctx, dest, f * octave, t, peak, partials, Math.max(1, len * 0.6));
    t += len * beat;
  }
  return t;
}

export function playXmasSfx(
  ctx: AudioContext,
  dest: AudioNode,
  name: SfxName,
  player: 1 | 2,
  lineLength: number,
): void {
  const t0 = ctx.currentTime;
  switch (name) {
    case 'place': {
      const base = (player === 1 ? 1650 : 2050) * jitter(0.04);
      voice(ctx, dest, base, t0, 0.13, GLASS);
      noiseBurst(ctx, dest, t0, 0.012, 0.05, 6000, 2);
      break;
    }
    case 'lineComplete': {
      const scale = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2].map((r) => r * note(15));
      const count = Math.min(scale.length, Math.max(2, 2 + Math.floor(lineLength / 2)));
      for (let i = 0; i < count; i++) voice(ctx, dest, scale[i], t0 + i * 0.055, 0.1, GLOCK, 0.6);
      if (lineLength >= 5) sleighShake(ctx, dest, t0 + count * 0.055, 0.25);
      break;
    }
    case 'claim': {
      sleighShake(ctx, dest, t0, 0.3, 6);
      voice(ctx, dest, note(19), t0 + 0.04, 0.08, GLOCK, 0.6);
      break;
    }
    case 'win': {
      const beat = 0.17;
      const end = phrase(ctx, dest, t0, JINGLE_BELLS, beat, 0.13, GLOCK);
      for (let b = 0; b < 12; b += 2) sleighShake(ctx, dest, t0 + b * beat, 0.16, 4);
      voice(ctx, dest, C4, end - 4 * beat, 0.08, TINE, 2);
      voice(ctx, dest, C4 * 1.5, end - 4 * beat, 0.06, TINE, 2);
      sleighShake(ctx, dest, end - 4 * beat, 0.28, 8);
      break;
    }
    case 'draw': {
      phrase(ctx, dest, t0, WE_WISH, 0.2, 0.12, TINE);
      break;
    }
    case 'loss': {
      [G5, E5, D5, C5].forEach((f, i) => voice(ctx, dest, f, t0 + i * 0.32, 0.09 - i * 0.012, TINE, 1.4));
      voice(ctx, dest, C4, t0 + 0.96, 0.05, TINE, 2.5);
      break;
    }
    case 'click': {
      voice(ctx, dest, 3200 * jitter(0.03), t0, 0.035, GLASS, 0.4);
      break;
    }
  }
}

// Fireside ambience: a low fire roar, a slowly gusting winter wind, random
// wood crackles and pops, and a distant sleigh going by now and then.
// Returns a stop function.
export function startFireside(ctx: AudioContext, bus: AudioNode): () => void {
  const nodes: AudioScheduledSourceNode[] = [];
  const out = ctx.createGain();
  out.gain.setValueAtTime(0, ctx.currentTime);
  out.gain.linearRampToValueAtTime(1, ctx.currentTime + 2);
  out.connect(bus);

  const loopNoise = (): AudioBufferSourceNode => {
    const s = ctx.createBufferSource();
    s.buffer = noise(ctx);
    s.loop = true;
    nodes.push(s);
    return s;
  };
  const lfo = (freq: number, depth: number, target: AudioParam): void => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = freq;
    g.gain.value = depth;
    o.connect(g);
    g.connect(target);
    o.start();
    nodes.push(o);
  };

  // Fire roar.
  const roar = loopNoise();
  const roarLp = ctx.createBiquadFilter();
  roarLp.type = 'lowpass';
  roarLp.frequency.value = 180;
  const roarG = ctx.createGain();
  roarG.gain.value = 0.35;
  lfo(0.23, 0.08, roarG.gain);
  roar.connect(roarLp);
  roarLp.connect(roarG);
  roarG.connect(out);
  roar.start();

  // Wind.
  const wind = loopNoise();
  const windBp = ctx.createBiquadFilter();
  windBp.type = 'bandpass';
  windBp.frequency.value = 520;
  windBp.Q.value = 2.2;
  lfo(0.061, 220, windBp.frequency);
  lfo(0.137, 90, windBp.frequency);
  const windG = ctx.createGain();
  windG.gain.value = 0.11;
  lfo(0.043, 0.07, windG.gain);
  wind.connect(windBp);
  windBp.connect(windG);
  windG.connect(out);
  wind.start(ctx.currentTime, 0.7);

  // Crackles, scheduled one second ahead at a time.
  let crackleTimer: number | null = null;
  let scheduledUntil = ctx.currentTime + 0.1;
  const scheduleCrackles = () => {
    const horizon = ctx.currentTime + 1.2;
    while (scheduledUntil < horizon) {
      scheduledUntil += 0.04 + Math.random() * Math.random() * 0.6;
      const pop = Math.random() < 0.08;
      noiseBurst(
        ctx,
        out,
        scheduledUntil,
        pop ? 0.03 + Math.random() * 0.03 : 0.004 + Math.random() * 0.014,
        pop ? 0.5 : 0.12 + Math.random() * 0.25,
        pop ? 900 + Math.random() * 900 : 1800 + Math.random() * 3500,
        pop ? 1.5 : 0.9,
      );
    }
    crackleTimer = window.setTimeout(scheduleCrackles, 500);
  };
  scheduleCrackles();

  // Distant sleigh bells: a slow train of shakes swelling and fading.
  let sleighTimer: number | null = null;
  const scheduleSleigh = () => {
    sleighTimer = window.setTimeout(() => {
      const t = ctx.currentTime + 0.05;
      const n = 10 + Math.floor(Math.random() * 6);
      for (let i = 0; i < n; i++) {
        const swell = Math.sin((Math.PI * (i + 0.5)) / n);
        sleighShake(ctx, out, t + i * 0.3 * jitter(0.08), 0.07 * swell, 4);
      }
      scheduleSleigh();
    }, 35000 + Math.random() * 55000);
  };
  scheduleSleigh();

  return () => {
    if (crackleTimer !== null) window.clearTimeout(crackleTimer);
    if (sleighTimer !== null) window.clearTimeout(sleighTimer);
    for (const n of nodes) {
      try {
        n.stop();
      } catch {
        // Already stopped.
      }
    }
    out.disconnect();
  };
}
