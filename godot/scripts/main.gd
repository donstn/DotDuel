extends Control
## Screen manager: living forest background + fireflies, menu, setup, game.
## Debug: `-- --autotest=<dir>` plays a bot-vs-bot game and saves screenshots.

var bg: TextureRect
var screen: Control
var shape := "triangle"
var level := 3
var hot_seat := false
var _shot_dir := ""
var where := ""
var online_ui: OnlineScreens


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	bg = TextureRect.new()
	bg.texture = UI.tex("background-portrait.webp")
	bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bg)
	bg.resized.connect(func(): bg.pivot_offset = bg.size / 2.0)
	var breathe := bg.create_tween().set_loops()
	breathe.tween_property(bg, "scale", Vector2(1.07, 1.07), 9.0).set_trans(Tween.TRANS_SINE)
	breathe.tween_property(bg, "scale", Vector2.ONE, 9.0).set_trans(Tween.TRANS_SINE)
	_fireflies()
	Sfx.ambience(true)
	online_ui = OnlineScreens.new(self)
	Online.pairing_changed.connect(_on_pairing)
	Online.profile_changed.connect(_on_account_change)
	Supa.auth_changed.connect(_on_account_change)
	Online.kicked.connect(_on_kicked)

	for a in OS.get_cmdline_user_args():
		if a.begins_with("--autotest="):
			_shot_dir = a.get_slice("=", 1)
		if a.begins_with("--shape="):
			shape = a.get_slice("=", 1)
	if _shot_dir != "":
		_autotest()
	else:
		show_menu()


func _fireflies() -> void:
	var p := CPUParticles2D.new()
	p.texture = UI.tex("particle-firefly.webp")
	p.amount = 28
	p.lifetime = 7.0
	p.preprocess = 7.0
	p.emission_shape = CPUParticles2D.EMISSION_SHAPE_RECTANGLE
	p.gravity = Vector2(0, -6)
	p.direction = Vector2.UP
	p.spread = 180
	p.initial_velocity_min = 6
	p.initial_velocity_max = 28
	p.scale_amount_min = 0.03
	p.scale_amount_max = 0.08
	var ramp := Gradient.new()
	ramp.set_color(0, Color(1, 1, 0.7, 0))
	ramp.add_point(0.3, Color(1, 1, 0.7, 0.9))
	ramp.add_point(0.7, Color(0.8, 1, 0.6, 0.5))
	ramp.set_color(ramp.get_point_count() - 1, Color(1, 1, 0.7, 0))
	p.color_ramp = ramp
	var mat := CanvasItemMaterial.new()
	mat.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	p.material = mat
	add_child(p)
	var place := func():
		p.position = size / 2.0
		p.emission_rect_extents = size / 2.0
	resized.connect(place)
	place.call_deferred()


func _swap(next: Control) -> void:
	var old := screen
	screen = next
	add_child(next)
	next.modulate.a = 0.0
	next.position.y = 40
	var tw := create_tween().set_parallel()
	tw.tween_property(next, "modulate:a", 1.0, 0.3)
	tw.tween_property(next, "position:y", 0.0, 0.4).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	if old:
		old.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var ot := create_tween()
		ot.tween_property(old, "modulate:a", 0.0, 0.2)
		ot.tween_callback(old.queue_free)
	Engine.time_scale = 1.0


func _page() -> VBoxContainer:
	var root := Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var vb := VBoxContainer.new()
	vb.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vb.offset_left = 30
	vb.offset_right = -30
	vb.offset_top = 40
	vb.offset_bottom = -40
	vb.alignment = BoxContainer.ALIGNMENT_CENTER
	vb.add_theme_constant_override("separation", 22)
	root.add_child(vb)
	_swap(root)
	return vb


func _center(c: Control) -> Control:
	c.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	return c


# ---------------------------------------------------------------- menu

func show_menu() -> void:
	where = "menu"
	var vb := _page()
	var sign := TextureRect.new()
	sign.texture = UI.tex("header-combined.webp")
	sign.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	sign.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	sign.custom_minimum_size = Vector2(660, 305)
	var tag := UI.label("Colour dots. Finish lines.\nOutscore your rival.", 28, UI.TEXT, false, 4)
	tag.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	tag.offset_top = 305 * 0.6
	tag.offset_bottom = -305 * 0.085
	sign.add_child(tag)
	vb.add_child(_center(sign))

	var spacer := Control.new()
	spacer.custom_minimum_size = Vector2(0, 30)
	vb.add_child(spacer)
	var vs_bot := UI.art_button("PLAY VS BOT", UI.MENU_BTN, 640, 137, 40)
	vs_bot.pressed.connect(_open_setup.bind(false))
	vb.add_child(_center(vs_bot))
	var hs := UI.art_button("HOT-SEAT", UI.MENU_BTN, 640, 137, 40)
	hs.pressed.connect(_open_setup.bind(true))
	vb.add_child(_center(hs))
	var on := UI.art_button("PLAY ONLINE", UI.MENU_BTN, 640, 137, 40)
	on.pressed.connect(func(): online_ui.show())
	vb.add_child(_center(on))
	if Supa.signed_in() and Online.profile_loaded and Online.display_name() != "":
		vb.add_child(UI.label("Signed in as %s · rating %d" % [Online.display_name(), Online.rating()], 24, UI.ACCENT, false, 4))
	var note := UI.label("Godot prototype · same rules & bots as dotduel.com", 20, UI.TEXT_DIM, false, 3)
	vb.add_child(note)
	_stagger(vb)


func _open_setup(seat: bool) -> void:
	hot_seat = seat
	show_setup()


## Children slide in one after another.
func _stagger(vb: Control) -> void:
	var i := 0
	for c in vb.get_children():
		if c is Control:
			c.modulate.a = 0.0
			var tw := create_tween()
			tw.tween_interval(0.06 * i)
			tw.tween_property(c, "modulate:a", 1.0, 0.25)
			i += 1


# ---------------------------------------------------------------- setup

func show_setup() -> void:
	where = "setup"
	var vb := _page()
	vb.alignment = BoxContainer.ALIGNMENT_BEGIN
	var top := HBoxContainer.new()
	var back := UI.art_button("‹ BACK", UI.PILL_BTN, 200, 76, 26)
	back.pressed.connect(show_menu)
	top.add_child(back)
	vb.add_child(top)

	vb.add_child(_banner("CHOOSE A BOARD"))
	var shapes := HBoxContainer.new()
	shapes.alignment = BoxContainer.ALIGNMENT_CENTER
	shapes.add_theme_constant_override("separation", 18)
	vb.add_child(shapes)
	var shape_tiles := {}
	for sh in BoardDef.SHAPES:
		var t := _tile("menu-icon-shape-%s.webp" % sh, BoardDef.LABELS[sh], "%d dots" % BoardDef.get_board(sh).pos.size(), Vector2(200, 230))
		shapes.add_child(t)
		shape_tiles[sh] = t
	var pick_shape := func(sh: String):
		shape = sh
		for k in shape_tiles:
			_select(shape_tiles[k], k == sh)
	for sh in shape_tiles:
		shape_tiles[sh].pressed.connect(pick_shape.bind(sh))
	pick_shape.call(shape)

	if not hot_seat:
		vb.add_child(_banner("CHOOSE A BOT"))
		var bots := HBoxContainer.new()
		bots.alignment = BoxContainer.ALIGNMENT_CENTER
		bots.add_theme_constant_override("separation", 10)
		vb.add_child(bots)
		var lvl_label := UI.label("", 30, UI.ACCENT, true, 6)
		var bot_tiles := []
		for l in range(1, 6):
			var t := _tile("avatar-l%d.webp" % l, "", "", Vector2(124, 140))
			bots.add_child(t)
			bot_tiles.append(t)
		var pick_level := func(l: int):
			level = l
			lvl_label.text = "Level %d · %s" % [l, AI.LEVEL_NAMES[l]]
			for i in 5:
				_select(bot_tiles[i], i + 1 == l)
		for i in 5:
			bot_tiles[i].pressed.connect(pick_level.bind(i + 1))
		pick_level.call(level)
		vb.add_child(lvl_label)
	else:
		var info := UI.label("Two players, one phone.\nGreen starts.", 30, UI.TEXT, false, 4)
		vb.add_child(info)

	var gap := Control.new()
	gap.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vb.add_child(gap)
	var start := UI.art_button("START", UI.PRIMARY_BTN, 600, 130, 46, Color("0c2416"))
	start.pressed.connect(start_game)
	vb.add_child(_center(start))
	_stagger(vb)


func _banner(text: String) -> Control:
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", UI.art_box(UI.BANNER, 84))
	p.custom_minimum_size = Vector2(440, 84)
	p.add_child(UI.label(text, 28, UI.TEXT))
	return _center(p)


func _tile(icon: String, title: String, sub: String, sz: Vector2) -> Button:
	var t := Button.new()
	t.custom_minimum_size = sz
	t.focus_mode = Control.FOCUS_NONE
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.03, 0.09, 0.06, 0.78)
	sb.set_corner_radius_all(24)
	sb.set_border_width_all(3)
	sb.border_color = Color(1, 1, 1, 0.12)
	for st in ["normal", "hover", "pressed", "focus"]:
		t.add_theme_stylebox_override(st, sb)
	t.set_meta("sb", sb)
	var vb := VBoxContainer.new()
	vb.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vb.offset_top = 10
	vb.offset_bottom = -10
	vb.alignment = BoxContainer.ALIGNMENT_CENTER
	vb.mouse_filter = Control.MOUSE_FILTER_IGNORE
	t.add_child(vb)
	var tr := TextureRect.new()
	tr.texture = UI.tex(icon)
	tr.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	tr.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	tr.custom_minimum_size = Vector2(0, sz.y * (0.55 if title != "" else 0.8))
	tr.mouse_filter = Control.MOUSE_FILTER_IGNORE
	vb.add_child(tr)
	if title != "":
		vb.add_child(UI.label(title.to_upper(), 26, UI.TEXT))
		vb.add_child(UI.label(sub, 20, UI.TEXT_DIM, false, 3))
	UI.juicy(t)
	return t


func _select(t: Button, on: bool) -> void:
	var sb: StyleBoxFlat = t.get_meta("sb")
	sb.border_color = UI.ACCENT if on else Color(1, 1, 1, 0.12)
	sb.bg_color = Color(0.08, 0.25, 0.14, 0.9) if on else Color(0.03, 0.09, 0.06, 0.78)
	sb.shadow_color = Color(UI.ACCENT, 0.45) if on else Color(0, 0, 0, 0)
	sb.shadow_size = 18 if on else 0
	t.modulate = Color.WHITE if on else Color(1, 1, 1, 0.7)


# ---------------------------------------------------------------- game

# ---------------------------------------------------------------- online

func _on_account_change() -> void:
	if where == "online":
		online_ui.show()
	elif where == "menu":
		show_menu()


func _on_pairing(p: Dictionary) -> void:
	if p.is_empty():
		return
	# A game that's already under way (reload / rejoin) goes straight to the board.
	var st = Online.game.get("state", {})
	var bl = Online.game.get("board_loaded", {})
	var started: bool = (st is Dictionary and int(st.get("turn", 0)) > 0) or (bl is Dictionary and bool(bl.get(str(int(p.get("player", 1))), false)))
	if started:
		start_online_game()
	else:
		online_ui.match_found()


func _on_kicked() -> void:
	if where in ["online", "searching", "found", "online_game"]:
		online_ui.show()


func start_online_game() -> void:
	where = "online_game"
	var g := GameView.new()
	g.setup_online(Online.pairing, Online.game)
	g.exit_requested.connect(_leave_online)
	_swap(g)


func _leave_online() -> void:
	await Online.leave_match()
	online_ui.show()


func start_game(auto := false) -> void:
	where = "game"
	var g := GameView.new()
	g.setup(shape, 0 if hot_seat else level)
	g.auto_p1 = auto
	if auto:
		g.bot_speed = 3.0
	g.exit_requested.connect(show_menu)
	g.rematch_requested.connect(start_game.bind(auto))
	_swap(g)


# ---------------------------------------------------------------- autotest

func _shot(name: String) -> void:
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("%s/%s.png" % [_shot_dir, name])


func _autotest() -> void:
	Sfx.muted = true
	if OS.get_cmdline_user_args().has("--online-only"):
		online_ui.show()
		await get_tree().create_timer(1.5).timeout
		await _shot("8-online-signin")
		get_tree().quit()
		return
	show_menu()
	await get_tree().create_timer(1.2).timeout
	await _shot("1-menu")
	hot_seat = false
	level = 4
	show_setup()
	await get_tree().create_timer(1.0).timeout
	await _shot("2-setup")
	start_game(true)
	var g := screen as GameView
	await get_tree().create_timer(1.0).timeout
	await _shot("3-game-start")
	var taken_mid := false
	while not g.s.finished:
		await get_tree().create_timer(0.05).timeout
		if not taken_mid and g.s.empty < g.b.pos.size() / 2 and g.s.last_scored >= 0:
			await get_tree().create_timer(0.25).timeout
			await _shot("4-game-mid")
			taken_mid = true
	await get_tree().create_timer(2.2).timeout
	await _shot("5-game-over")
	# Human input path: hot-seat, click two dots through the real event pipeline.
	hot_seat = true
	start_game()
	var h := screen as GameView
	await get_tree().create_timer(1.6).timeout
	for d in [0, 1]:
		_click(h.board.get_global_transform() * h.px(d))
		await get_tree().create_timer(1.2).timeout
	print("INPUT TEST: ", "OK" if h.s.colored[0] == 1 and h.s.colored[1] == 2 else "FAIL")
	await _shot("6-hotseat")
	# Network smoke test (no sign-in): server clock RPC + a Realtime join.
	var res := await Supa.call_rpc("server_now_ms")
	print("NET RPC server_now_ms: code=%d data=%s" % [res.code, str(res.data)])
	var joined := [false]
	var topic := Realtime.subscribe("autotest", "leaderboard", "", func(_t, _r): pass, func(): joined[0] = true)
	for i in 50:
		if joined[0]:
			break
		await get_tree().create_timer(0.2).timeout
	print("NET REALTIME join: ", "OK" if joined[0] else "FAIL")
	Realtime.unsubscribe(topic)
	show_menu()
	await get_tree().create_timer(1.0).timeout
	await _shot("7-menu-online")
	online_ui.show()
	await get_tree().create_timer(1.5).timeout
	await _shot("8-online-signin")
	get_tree().quit()


func _click(at: Vector2) -> void:
	var vp_pos := get_viewport().get_canvas_transform() * at
	for pressed in [true, false]:
		var e := InputEventMouseButton.new()
		e.button_index = MOUSE_BUTTON_LEFT
		e.pressed = pressed
		e.position = vp_pos
		e.global_position = vp_pos
		get_viewport().push_input(e)
