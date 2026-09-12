# Game-outcome SFX — audio sources

Both files are derivative (trimmed/mixed + re-encoded to mono 64kbps mp3)
from CC0-licensed originals. CC0 places no restriction on derivative use,
but the source is recorded here for the paper trail per CLAUDE.md's
zero-cost/no-royalty rule. Unlike `public/audio/forest-pearl/`, these two
play under every theme (win/loss/draw are theme-agnostic cues), so they
live at the top level.

## win-stream.mp3
- Source: `public/audio/forest-pearl/ambience-stream.mp3` (already CC0,
  see that folder's own AUDIO_SOURCES.md — "Relaxing river stream running
  water seamless loop" by steaq, https://freesound.org/people/steaq/sounds/548767/)
- Retrieved: 2026-09-12
- Transform: trimmed to 3.5s, 0.3s fade in / 0.6s fade out, volume +30%.

## loss-rain.mp3
- Sources:
  - "Rain.wav" by idomusics, CC0 1.0 — https://freesound.org/s/518863/
    ("Peaceful rain sound recorded from my balcony")
  - "Wind Through Trees" by Yoyodaman234, CC0 1.0 —
    https://freesound.org/people/Yoyodaman234/sounds/335889/ (same source
    already used for `public/audio/forest-pearl/ambience-wind.mp3`)
- Retrieved: 2026-09-12
- Transform: 4.5s rain excerpt (fade in 0.4s / out 0.6s) mixed with a
  quieter (30%) wind excerpt of the same length (fade in 0.6s / out 0.6s),
  downmixed to mono, re-encoded at 64kbps.
