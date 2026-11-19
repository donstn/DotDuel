# DotDuel — Godot prototype (branch `GODOT_TEST`)

Side project: the same game rebuilt in **Godot 4.7** (MIT licence, $0) to feel
"more like a game". Not shipped anywhere; the real app is still the React one.

## Run

Open `godot/project.godot` in Godot 4.7 (`C:\Users\onemu\Godot\Godot_v4.7.1-stable_win64.exe`)
and press F5, or:

```
Godot_v4.7.1-stable_win64.exe --path godot
```

## What's in it

- Vs bot (all 5 levels) and hot-seat, on Triangle / Square / Rectangle. Everything unlocked.
- Rules and bots ported 1:1 from `src/geometry.ts`, `src/game.ts`, `src/ai.ts`
  (`scripts/board_def.gd`, `game_state.gd`, `ai.gd`).
- Juice: dots pop with a ripple and sparks, strikes grow along the line, pearl bursts,
  "+N" flies into the score, score counters roll and bounce, screen shake scaled to the
  line, "GREAT!/AMAZING!" callouts, slow-motion on 6+ lines, bot aims before it plays,
  pending lines shimmer (always visible here), victory confetti, living background.
- Sound: cues synthesized at start-up (`scripts/sfx.gd`), plus the game's CC0 win/loss
  clips and forest ambience. Forest & Pearl art copied from `public/art/forest-pearl/`.

## Checks

```
godot --headless --path godot -s res://tools/sim.gd          # bots vs bots, scoring integrity
godot --path godot -- --autotest=<folder>                      # plays a demo game, saves screenshots, tests tapping
```

## Web build (www.dotduel.com/GodotV1)

Single-threaded export (GH Pages can't send COOP/COEP headers), copied into the
React site's `public/` so the normal deploy ships it:

```bash
Godot_v4.7.1-stable_win64_console.exe --headless --path godot --export-release "Web" build/web/index.html
rm -rf public/GodotV1 && mkdir -p public/GodotV1 && cp godot/build/web/* public/GodotV1/
```

The React service worker ignores `/GodotV1/` (see `vite.config.ts`).

## Online play

`scripts/net/` talks to the SAME Supabase project as the app (accounts, Elo,
matchmaking, bots): `supa.gd` (auth + REST), `realtime.gd` (Phoenix websocket),
`online.gd` (session lock, queue, pairing, moves, clocks, rematch). On the web the
session shares the app's localStorage key, so a dotduel.com sign-in carries over.
Google sign-in returns to `<origin>/GodotV1/` — that URL must be in Supabase
Auth → URL Configuration → Redirect URLs. Desktop runs catch the redirect on
`http://localhost:5173/godot-auth`.
