extends Node
## Renders the synthesized cues (Sfx.synth_forest / synth_xmas / synth_desert) to WAV in
## user://sfx_render/; tools/render_sfx.sh turns them into the .ogg files the
## game loads. Run: godot --headless --path godot res://tools/render_sfx.tscn


func _ready() -> void:
	var root := ProjectSettings.globalize_path("user://sfx_render")
	for set_name in ["forest", "xmas", "desert"]:
		DirAccess.make_dir_recursive_absolute(root + "/" + set_name)
		var cues: Dictionary = {"forest": Sfx.synth_forest, "xmas": Sfx.synth_xmas, "desert": Sfx.synth_desert}[set_name].call()
		for k in cues:
			var w: AudioStreamWAV = cues[k]
			w.loop_mode = AudioStreamWAV.LOOP_DISABLED
			w.save_to_wav("%s/%s/%s.wav" % [root, set_name, k])
	print("RENDERED ", root)
	get_tree().quit()
