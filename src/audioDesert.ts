// Desert Sunset game cues: the same sounds as the Godot game
// (godot/scripts/sfx.gd synth_desert, rendered by godot/tools/render_sfx.sh
// and converted to MP3 in public/audio/desert-sunset/). Wooden marimba taps,
// kalimba arpeggios, a sand shaker and hand-drum stings.
import type { SfxName } from './audio';

const BASE = '/audio/desert-sunset/';
const CUES = [
  'place1', 'place2', 'tick', 'claim', 'pending', 'd_win', 'd_draw', 'd_loss',
  'line1', 'line2', 'line3', 'line4', 'line5', 'line6', 'line7', 'line8', 'line9',
];

let buffers: Record<string, AudioBuffer> = {};
let loading: AudioContext | null = null;

function load(ctx: AudioContext): void {
  if (loading === ctx) return;
  loading = ctx;
  buffers = {};
  const into = buffers;
  for (const cue of CUES) {
    void fetch(`${BASE}${cue}.mp3`)
      .then((r) => r.arrayBuffer())
      .then((a) => ctx.decodeAudioData(a))
      .then((b) => {
        into[cue] = b;
      })
      .catch(() => {
        // Missing file: the default synthesized cue plays instead.
      });
  }
}

function cueFor(name: SfxName, player: 1 | 2, lineLength: number): string {
  switch (name) {
    case 'place':
      return `place${player}`;
    case 'lineComplete':
      return `line${Math.max(1, Math.min(9, lineLength))}`;
    case 'claim':
      return 'claim';
    case 'win':
      return 'd_win';
    case 'loss':
      return 'd_loss';
    case 'draw':
      return 'd_draw';
    case 'click':
      return 'tick';
  }
}

/** Plays the desert cue; false while its file is still loading (the caller
 *  then plays the default cue). */
export function playDesertSfx(
  ctx: AudioContext,
  dest: AudioNode,
  name: SfxName,
  player: 1 | 2,
  lineLength: number,
): boolean {
  load(ctx);
  const buf = buffers[cueFor(name, player, lineLength)];
  if (!buf) return false;
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  src.buffer = buf;
  gain.gain.value = 0.8;
  src.connect(gain);
  gain.connect(dest);
  src.start();
  return true;
}
