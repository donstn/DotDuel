extends SceneTree
## Close-up frames of the Christmas campfire for judging its motion:
## godot --path godot --resolution 600x700 -s res://tools/fire_test.gd -- --out=<folder>

var _out := ""
var _n := 0
var _t := 0.0


func _initialize() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--out="):
			_out = a.substr(6)
	var tex: Texture2D = load("res://assets/art/christmas/background-portrait.webp")
	var bg := Sprite2D.new()
	bg.texture = tex
	bg.centered = false
	var k := 3.2
	bg.scale = Vector2(k, k)
	var at := Vector2(0.283, 0.835) * tex.get_size()
	bg.position = Vector2(300, 520) - at * k
	root.add_child(bg)
	var f := Campfire.new()
	f.position = at
	bg.add_child(f)


func _process(delta: float) -> bool:
	_t += delta
	if _t > 1.0 + _n * 0.2:
		root.get_texture().get_image().save_png("%s/f%02d.png" % [_out, _n])
		_n += 1
	return _n >= 8
