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
  re-encoded at 64kbps. No fade baked into the file — the loop seam is
  handled by a crossfade scheduler in audio.ts instead, so playback never
  dips in volume (a per-clip fade caused an audible dip on every loop, since
  `AudioBufferSourceNode.loop` just repeats the exact buffer verbatim).

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
