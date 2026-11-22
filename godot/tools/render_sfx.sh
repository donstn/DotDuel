#!/bin/sh
# Re-render the synthesized sound cues after changing scripts/sfx.gd:
#   sh godot/tools/render_sfx.sh   (from the repo root; needs Godot + ffmpeg)
set -e
GODOT="${GODOT:-/c/Users/onemu/Godot/Godot_v4.7.1-stable_win64_console.exe}"
"$GODOT" --headless --path godot res://tools/render_sfx.tscn
SRC="$APPDATA/Godot/app_userdata/DotDuel/sfx_render"
for set in forest xmas desert; do
	mkdir -p "godot/assets/audio/synth/$set"
	for f in "$SRC/$set"/*.wav; do
		ffmpeg -loglevel error -y -i "$f" -c:a libvorbis -q:a 6 "godot/assets/audio/synth/$set/$(basename "${f%.wav}").ogg"
	done
done
