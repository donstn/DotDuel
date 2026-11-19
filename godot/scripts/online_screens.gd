class_name OnlineScreens
extends RefCounted
## Online flow screens (sign-in, name, lobby, searching, match found), built on
## Main's page helpers. Kept apart from main.gd so that file stays readable.

const COUNTDOWN := 5

var main  # main.gd
var tc := "3min"


func _init(m) -> void:
	main = m


func show() -> void:
	main.where = "online"
	if not Supa.is_ready:
		_message("CONNECTING…", "")
		await Supa.auth_changed
		if main.where == "online":
			show()
		return
	if not Supa.signed_in():
		_sign_in()
	elif not Online.profile_loaded:
		_message("LOADING PROFILE…", "")
	elif not Online.has_username:
		_name_picker()
	else:
		_lobby()


func _message(title: String, text: String) -> VBoxContainer:
	var vb: VBoxContainer = main._page()
	vb.alignment = BoxContainer.ALIGNMENT_BEGIN
	vb.add_child(_back_row())
	var gap := Control.new()
	gap.custom_minimum_size = Vector2(0, 120)
	vb.add_child(gap)
	vb.add_child(main._banner(title))
	if text != "":
		var l := UI.label(text, 28, UI.TEXT, false, 4)
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		vb.add_child(l)
	return vb


func _back_row() -> Control:
	var top := HBoxContainer.new()
	var back := UI.art_button("‹ BACK", UI.PILL_BTN, 200, 76, 26)
	back.pressed.connect(main.show_menu)
	top.add_child(back)
	return top


func _sign_in() -> void:
	var vb := _message("PLAY ONLINE", "Ranked matches against players on dotduel.com and the DotDuel app.\nSign in with Google to play.")
	var gap := Control.new()
	gap.custom_minimum_size = Vector2(0, 30)
	vb.add_child(gap)
	var btn := UI.art_button("SIGN IN WITH GOOGLE", UI.PRIMARY_BTN, 620, 124, 34, Color("0c2416"))
	btn.pressed.connect(func(): Supa.sign_in_google())
	vb.add_child(main._center(btn))
	if Supa.auth_error != "":
		var e := UI.label(Supa.auth_error, 24, Color("ff8a7a"), false, 4)
		e.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		vb.add_child(e)
	main._stagger(vb)


func _name_picker() -> void:
	var vb := _message("PICK A GAME NAME", "This is the name other players see. 3–16 letters or numbers.")
	var edit := LineEdit.new()
	edit.text = Online.suggest_name()
	edit.max_length = 16
	edit.alignment = HORIZONTAL_ALIGNMENT_CENTER
	edit.custom_minimum_size = Vector2(520, 84)
	edit.add_theme_font_override("font", UI.font(true))
	edit.add_theme_font_size_override("font_size", 36)
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.02, 0.07, 0.04, 0.9)
	sb.set_corner_radius_all(20)
	sb.set_border_width_all(3)
	sb.border_color = UI.ACCENT
	edit.add_theme_stylebox_override("normal", sb)
	edit.add_theme_stylebox_override("focus", sb)
	vb.add_child(main._center(edit))
	var err := UI.label("", 24, Color("ff8a7a"), false, 4)
	var save := UI.art_button("SAVE NAME", UI.PRIMARY_BTN, 560, 120, 36, Color("0c2416"))
	var do_save := func():
		save.disabled = true
		err.text = ""
		var msg: String = await Online.claim_username(edit.text)
		save.disabled = false
		if msg != "":
			err.text = msg
		else:
			show()
	save.pressed.connect(do_save)
	vb.add_child(main._center(save))
	vb.add_child(err)


func _lobby() -> void:
	var vb: VBoxContainer = main._page()
	vb.alignment = BoxContainer.ALIGNMENT_BEGIN
	vb.add_child(_back_row())
	vb.add_child(main._banner("RANKED"))

	var card := PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.03, 0.09, 0.06, 0.82)
	sb.set_corner_radius_all(26)
	sb.set_border_width_all(3)
	sb.border_color = Color(UI.ACCENT, 0.5)
	sb.content_margin_left = 20
	sb.content_margin_right = 20
	sb.content_margin_top = 12
	sb.content_margin_bottom = 12
	card.add_theme_stylebox_override("panel", sb)
	var hb := HBoxContainer.new()
	hb.add_theme_constant_override("separation", 16)
	card.add_child(hb)
	var av := TextureRect.new()
	av.texture = UI.tex("avatar-human.webp")
	av.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	av.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	av.custom_minimum_size = Vector2(96, 96)
	hb.add_child(av)
	var info := VBoxContainer.new()
	info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var n := UI.label(Online.display_name(), 36, UI.TEXT)
	n.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	var rt := UI.label("Rating %d" % Online.rating(), 28, UI.ACCENT, false, 4)
	rt.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	info.add_child(n)
	info.add_child(rt)
	hb.add_child(info)
	var out := UI.art_button("SIGN OUT", UI.PILL_BTN, 190, 70, 22)
	out.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	out.pressed.connect(func():
		await Supa.sign_out()
		main.show_menu())
	hb.add_child(out)
	vb.add_child(card)

	vb.add_child(main._banner("TIME CONTROL"))
	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("separation", 16)
	vb.add_child(row)
	var tiles := {}
	for spec in Online.TIME_CONTROLS:
		var t: Button = main._tile("dot-p1.webp", spec[1], spec[2], Vector2(200, 200))
		row.add_child(t)
		tiles[spec[0]] = t
	var pick := func(id: String):
		tc = id
		for k in tiles:
			main._select(tiles[k], k == id)
	for k in tiles:
		tiles[k].pressed.connect(pick.bind(k))
	pick.call(tc)

	var status := UI.label("", 26, UI.GOLD, false, 4)
	status.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vb.add_child(status)
	var gap := Control.new()
	gap.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vb.add_child(gap)
	var find := UI.art_button("FIND MATCH", UI.PRIMARY_BTN, 600, 130, 44, Color("0c2416"))
	vb.add_child(main._center(find))
	var go := func():
		find.disabled = true
		var lock: String = await Online.lock_state()
		if lock == "other":
			status.text = "You're playing on another device or tab. Finish that game first (or wait a minute if you closed it)."
			find.disabled = false
			return
		if await Online.find_match(tc):
			_searching()
		else:
			status.text = "Couldn't join the queue. Check your connection."
			find.disabled = false
	find.pressed.connect(go)
	main._stagger(vb)


func _searching() -> void:
	main.where = "searching"
	var vb: VBoxContainer = main._page()
	vb.add_child(main._banner("FINDING OPPONENT"))
	var orbit := Control.new()
	orbit.custom_minimum_size = Vector2(300, 300)
	vb.add_child(main._center(orbit))
	var spin := Node2D.new()
	spin.position = Vector2(150, 150)
	orbit.add_child(spin)
	for i in 6:
		var sp := Sprite2D.new()
		sp.texture = UI.tex("dot-p%d.webp" % (1 + i % 2))
		sp.scale = Vector2.ONE * (60.0 / sp.texture.get_width())
		sp.position = Vector2.from_angle(TAU * i / 6.0) * 110
		spin.add_child(sp)
	var tw := spin.create_tween().set_loops()
	tw.tween_property(spin, "rotation", TAU, 3.0).from(0.0)
	var t0 := Time.get_ticks_msec()
	var elapsed := UI.label("0:00", 44, UI.TEXT)
	vb.add_child(elapsed)
	var hint := UI.label("Looking for a player near your rating…", 26, UI.TEXT_DIM, false, 4)
	hint.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vb.add_child(hint)
	var cancel := UI.art_button("CANCEL", UI.PILL_BTN, 260, 92, 28)
	cancel.pressed.connect(func():
		await Online.cancel_search()
		show())
	vb.add_child(main._center(cancel))
	var tick := Timer.new()
	tick.wait_time = 0.5
	tick.autostart = true
	elapsed.add_child(tick)
	tick.timeout.connect(func():
		var s := int((Time.get_ticks_msec() - t0) / 1000)
		elapsed.text = "%d:%02d" % [s / 60, s % 60]
		if s >= Online.BOT_FALLBACK_S:
			hint.text = "No one free right now, finding you a bot opponent…")


func match_found() -> void:
	main.where = "found"
	var p := Online.pairing
	var g := Online.game
	var vb: VBoxContainer = main._page()
	vb.add_child(main._banner("MATCH FOUND"))
	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("separation", 24)
	vb.add_child(row)
	var opp_bot: bool = p.get("opponent_is_bot", false)
	var lvl := clampi(int(p.get("opponent_bot_level", 3)) if p.get("opponent_bot_level") != null else 3, 1, 5)
	row.add_child(_fighter("avatar-human.webp", Online.display_name(), Online.rating(), int(p.get("player", 1))))
	row.add_child(UI.label("VS", 64, UI.GOLD, true, 12))
	row.add_child(_fighter("avatar-l%d.webp" % lvl if opp_bot else "avatar-human.webp", str(p.get("opponent_display_name", "Opponent")), int(p.get("opponent_rating", 1000)), 3 - int(p.get("player", 1))))
	var tc_name: String = {"1min": "Bullet · 1 min", "3min": "Blitz · 3 min", "5min": "Rapid · 5 min"}.get(str(g.get("time_control", "3min")), "")
	var first := "You move first" if int(g.get("state", {}).get("current", 1)) == int(p.get("player", 1)) else "Opponent moves first"
	vb.add_child(UI.label("Triangle · %s · %s" % [tc_name, first], 26, UI.TEXT_DIM, false, 4))
	var count := UI.label(str(COUNTDOWN), 72, UI.TEXT)
	vb.add_child(count)
	var ready_btn := UI.art_button("READY", UI.PRIMARY_BTN, 560, 124, 44, Color("0c2416"))
	vb.add_child(main._center(ready_btn))
	Sfx.play("line6")
	var state := {"left": COUNTDOWN, "me": false, "started": false}
	var start := func():
		if state.started or main.where != "found":
			return
		state.started = true
		main.start_online_game()
	ready_btn.pressed.connect(func():
		if state.me:
			return
		state.me = true
		ready_btn.text = "WAITING…"
		Online.mark_ready())
	var tick := Timer.new()
	tick.wait_time = 0.25
	tick.autostart = true
	count.add_child(tick)
	var acc := [0.0]
	tick.timeout.connect(func():
		acc[0] += 0.25
		if acc[0] >= 1.0:
			acc[0] = 0.0
			state.left -= 1
			count.text = str(maxi(state.left, 0))
			Sfx.play("tick", 1.2, -6.0)
		var rd = Online.game.get("ready", {})
		var opp_ready: bool = opp_bot or (rd is Dictionary and bool(rd.get(str(3 - int(p.get("player", 1))), false)))
		if (state.me and opp_ready) or state.left <= 0:
			start.call())


func _fighter(avatar: String, name: String, rating: int, slot: int) -> Control:
	var v := VBoxContainer.new()
	v.custom_minimum_size = Vector2(250, 0)
	var av := TextureRect.new()
	av.texture = UI.tex(avatar)
	av.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	av.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	av.custom_minimum_size = Vector2(0, 180)
	v.add_child(av)
	var chip := TextureRect.new()
	chip.texture = UI.tex("dot-p%d.webp" % slot)
	chip.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	chip.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	chip.custom_minimum_size = Vector2(0, 40)
	v.add_child(chip)
	var n := UI.label(name, 30, UI.TEXT)
	n.clip_text = true
	n.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	v.add_child(n)
	v.add_child(UI.label(str(rating), 28, UI.ACCENT, false, 4))
	return v
