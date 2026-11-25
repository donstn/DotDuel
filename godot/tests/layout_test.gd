## Layout check: the board never runs under the score cards, the lesson
## bubble or off screen, for every theme × screen × mode × language.
## Run: Godot --headless --path godot res://tests/layout_test.tscn
extends Node

const SIZES := {
	"iphone17": Vector2(720, 1565), "iphone17-safari": Vector2(720, 1343), "iphone-se": Vector2(720, 1281),
	"android-short": Vector2(720, 1280), "fold-cover": Vector2(720, 1846), "tablet": Vector2(960, 1280),
	"desktop": Vector2(2048, 1280), "phone-landscape": Vector2(2783, 1280),
}
const LONG := "Aleksandras Vyšniauskas-Žemaitis"
var fails := 0
var runs := 0


func _ready() -> void:
	await get_tree().process_frame
	for lang in ["lt", "en"]:
		Lang.set_code(lang)
		for theme in ["christmas", "sunset-catan", "forest-pearl"]:
			Look.set_id(theme)
			for sz in SIZES:
				for mode in ["coach", "online", "bot", "online-square"]:
					await _check(lang, theme, sz, SIZES[sz], mode)
	print("LAYOUT: %d runs, %d hidden" % [runs, fails])
	get_tree().quit(1 if fails else 0)


func _check(lang: String, theme: String, sz: String, s: Vector2, mode: String) -> void:
	var g := GameView.new()
	if mode == "coach":
		g.coach = Coach.new()
		g.setup("triangle", 1)
		g.mode = "coach"
		g.s = g.coach.opening()
	elif mode.begins_with("online"):
		var shape := "square" if mode == "online-square" else "triangle"
		g.names = ["", LONG, LONG]
		g.setup_online({"player": 1, "opponent_display_name": LONG, "time_control": "blitz", "shape": shape},
			{"shape": shape, "status": "active", "clock": {"p1RemainingMs": 180000, "p2RemainingMs": 180000, "turnStartedAt": 0, "current": 1}})
	else:
		g.setup("triangle", 3)
	# A stand-in campfire where the menu puts it (bottom left), so the tree's
	# fire-clearance fit runs like on a phone.
	var fire := Node2D.new()
	add_child(fire)
	fire.global_position = Vector2(s.x * 0.2, s.y * 0.86)
	Look.fire = fire
	var box := Control.new()
	box.size = s
	add_child(box)
	box.add_child(g)
	g.size = s
	var msgs: Array = [""]
	if mode == "coach":
		msgs = []
		for k in GameView.COACH_KEYS:
			msgs.append(Lang.a("coach." + k, [99]))
	for m in msgs:
		if mode == "coach":
			g._coach_text.text = m
			(g._coach_text.get_meta("card") as Control).visible = true
		for i in 4:
			await get_tree().process_frame
		runs += 1
		var row: Control = null
		for c in g.get_children():
			if c is HBoxContainer and is_equal_approx((c as Control).offset_top, 160.0):
				row = c
		var hud: float = row.get_global_rect().end.y
		for c in row.get_children():
			hud = maxf(hud, (c as Control).get_global_rect().end.y)
		if mode == "coach":
			hud = maxf(hud, (g._coach_text.get_meta("card") as Control).get_global_rect().end.y)
		if OS.has_environment("LAYOUT_VERBOSE") and m == msgs[0]:
			var top := INF
			for d in g.b.pos.size():
				top = minf(top, (g.board.global_position + g.px(d)).y - g.r)
			var cardh := (g._coach_text.get_meta("card") as Control).get_global_rect() if mode == "coach" else Rect2()
			print("INFO %s %s %s %s: hud=%.0f topdot=%.0f r=%.1f bubble=%s row=%s min=%s" % [lang, theme, sz, mode, hud, top, g.r, cardh, row.get_global_rect(), row.get_combined_minimum_size()])
		var bad := ""
		for d in g.b.pos.size():
			var p: Vector2 = g.board.global_position + g.px(d)
			if p.y - g.r * 1.25 < hud - 0.5:
				bad = "dot %d top %.0f under HUD bottom %.0f" % [d, p.y - g.r, hud]
			elif p.y + g.r > s.y or p.x - g.r < -g.r * 0.5 or p.x + g.r > s.x + g.r * 0.5:
				bad = "dot %d at %s off screen" % [d, p]
			if bad != "":
				break
		if bad != "":
			fails += 1
			print("HIDDEN %s %s %s %s [%s]: %s" % [lang, theme, sz, mode, m.left(30), bad])
	g.queue_free()
	box.queue_free()
	fire.queue_free()
	await get_tree().process_frame
