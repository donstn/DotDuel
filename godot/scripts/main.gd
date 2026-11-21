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
var menu_ui: MenuScreens
var overlay: Control = null
var _decor: Array[Node] = []
var _fire: Node2D
var _guard := false
var _js_pop: JavaScriptObject


func _ready() -> void:
	UI.install_theme(get_window())
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	bg = TextureRect.new()
	bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bg)
	bg.resized.connect(_place_bg)
	_apply_skin()
	Sfx.ambience(true)
	Look.changed.connect(_on_skin)
	Lang.changed.connect(_refresh)
	_setup_back()
	online_ui = OnlineScreens.new(self)
	menu_ui = MenuScreens.new(self)
	Online.pairing_changed.connect(_on_pairing)
	Social.changed.connect(_refresh_invite_card)
	Online.profile_changed.connect(_on_account_change)
	Online.profile_changed.connect(_on_streak_check)
	Supa.auth_changed.connect(_on_account_change)
	Online.kicked.connect(_on_kicked)

	for a in OS.get_cmdline_user_args():
		if a.begins_with("--autotest="):
			_shot_dir = a.get_slice("=", 1)
		if a.begins_with("--shape="):
			shape = a.get_slice("=", 1)
	if _shot_dir != "":
		_autotest()
		return
	# Build the first screen once, after the saved sign-in and the profile are
	# known (each used to rebuild the menu right after it appeared); the web
	# loader stays up until then.
	where = "boot"
	var t0 := Time.get_ticks_msec()
	while Time.get_ticks_msec() - t0 < 5000 and not (Supa.is_ready and (not Supa.signed_in() or Online.profile_loaded)):
		await get_tree().process_frame
	var saved := Store.load_active()
	if not saved.is_empty():
		start_game(false, saved)
	else:
		show_menu()
		if not bool(Store.settings.tutorialSeen) and int(Store.settings.gamesPlayed) == 0:
			show_welcome()
	if OS.has_feature("web"):
		await get_tree().process_frame
		JavaScriptBridge.eval("window.ddBooted && window.ddBooted()", true)


# ---------------------------------------------------------------- theme decor

func _apply_skin() -> void:
	for n in _decor:
		n.queue_free()
	_decor.clear()
	_fire = null
	_place_bg()
	if Look.xmas():
		_fire = Campfire.new()
		bg.add_child(_fire)
	Look.fire = _fire
	if _fire:
		_decor.append(_fire)
		for i in 3:
			_snow(i)
	else:
		_fireflies()
	for n in _decor:
		if n != _fire:
			move_child(n, 1)
	_place_bg.call_deferred()


func _on_skin() -> void:
	_apply_skin()
	Sfx.ambience(true)
	_refresh()


## Rebuild the current screen (language or theme changed).
func _refresh() -> void:
	if where == "menu":
		show_menu()


## Background art for the window's orientation; the campfire follows the
## painted fire under the "cover" crop and the slow breathing zoom.
func _place_bg() -> void:
	var land := size.x > size.y * 1.15
	var file := "background-landscape.webp" if land else "background-portrait.webp"
	var tex := UI.tex(file)
	if bg.texture != tex:
		bg.texture = tex
	bg.pivot_offset = bg.size / 2.0
	if _fire and tex:
		var ts := tex.get_size()
		var k := maxf(bg.size.x / ts.x, bg.size.y / ts.y)
		var off := (bg.size - ts * k) / 2.0
		var at := Vector2(0.252, 0.845) if land else Vector2(0.283, 0.835)
		_fire.position = off + ts * at * k
		_fire.scale = Vector2.ONE * (ts.y * k / 1024.0) * (1.25 if land else 1.0)


func _snow(layer: int) -> void:
	var p := CPUParticles2D.new()
	p.texture = UI.tex("particle-snow-%d.webp" % (layer + 1))
	p.amount = [40, 26, 14][layer]
	p.lifetime = [16.0, 11.0, 8.0][layer]
	p.preprocess = p.lifetime
	p.emission_shape = CPUParticles2D.EMISSION_SHAPE_RECTANGLE
	p.direction = Vector2(0.15, 1)
	p.spread = 12
	p.gravity = Vector2.ZERO
	p.initial_velocity_min = [50.0, 80.0, 120.0][layer]
	p.initial_velocity_max = [80.0, 120.0, 170.0][layer]
	p.angular_velocity_min = -40
	p.angular_velocity_max = 40
	var base: float = [0.025, 0.045, 0.07][layer]
	p.scale_amount_min = base * 0.6
	p.scale_amount_max = base
	p.color = Color(1, 1, 1, [0.55, 0.75, 0.9][layer])
	add_child(p)
	_decor.append(p)
	var place := func():
		p.position = Vector2(size.x / 2.0, -40)
		p.emission_rect_extents = Vector2(size.x * 0.6, 10)
	resized.connect(place)
	place.call()


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
	ramp.add_point(0.7, Look.tone(Color(0.8, 1, 0.6, 0.5)))
	ramp.set_color(ramp.get_point_count() - 1, Color(1, 1, 0.7, 0))
	p.color_ramp = ramp
	var mat := CanvasItemMaterial.new()
	mat.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	p.material = mat
	add_child(p)
	_decor.append(p)
	var place := func():
		p.position = size / 2.0
		p.emission_rect_extents = size / 2.0
	resized.connect(place)
	place.call_deferred()


func _current_game() -> GameView:
	return screen as GameView if screen is GameView else null


func _swap(next: Control) -> void:
	var old := screen
	screen = next
	add_child(next)
	_refresh_invite_card.call_deferred()
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
	close_overlay()
	_sync_guard()


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

func show_menu(cat := "") -> void:
	menu_ui.show(cat)
	if cat == "single" and Supa.signed_in():
		_refresh_daily_card()


func _refresh_daily_card() -> void:
	var before := Daily.today_status().duplicate()
	await Daily.refresh()
	if where == "menu_single" and overlay == null and Daily.today_status() != before:
		menu_ui.show("single")


# ---------------------------------------------------------------- menu actions

func sign_in() -> void:
	online_ui.show()


func sign_out() -> void:
	Social.stop()
	await Social.mark_offline()
	await Supa.sign_out()
	show_menu()


func quick_ranked() -> void:
	online_ui.quick()


## The website's guide pages (English or Lithuanian), like guideLinks.ts.
func open_guide() -> void:
	OS.shell_open("https://www.dotduel.com" + ("/lt/kaip-zaisti/" if Lang.code == "lt" else "/how-to-play/"))


func friends_label() -> String:
	var n := Social.online_count()
	var label := Lang.a("friends.online", [n]) if n > 0 else Lang.a("friends.friends")
	if Social.incoming.size() > 0:
		label += " · " + Lang.a("friends.newBadge", [Social.incoming.size()])
	return label


## Share DotDuel (signed out, clean link) / Invite a friend (with ?ref= code).
func share_app() -> void:
	_share(Lang.a("share.textShare"), "https://www.dotduel.com/", "share")


func invite_friend() -> void:
	var code: String = Online.profile.get("referral_code", "")
	_share(Lang.a("share.textInvite"), "https://www.dotduel.com/" + ("?ref=" + code if code != "" else ""), "invite")


## variant: "share" (signed out, clean link) / "invite" (with ?ref=), as
## TellAFriendButton.tsx, for the tellafriend_* events.
func _share(text: String, url: String, variant := "share") -> void:
	Track.event("tellafriend_clicked", {"variant": variant})
	if OS.has_feature("web"):
		var js := "(async()=>{try{if(navigator.share){await navigator.share({title:%s,text:%s,url:%s});return 'native'}await navigator.clipboard.writeText(%s);return 'clipboard'}catch(e){return 'fail'}})().then(m=>{if(m!=='fail'&&window.ddTrack)window.ddTrack('tellafriend_share_completed',JSON.stringify({variant:%s,share_method:m}))})"
		JavaScriptBridge.eval(js % [JSON.stringify(Lang.a("share.title")), JSON.stringify(text), JSON.stringify(url), JSON.stringify(text + " " + url), JSON.stringify(variant)], true)
		toast(Lang.a("share.linkCopied"))
	else:
		DisplayServer.clipboard_set(text + " " + url)
		toast(Lang.a("share.linkCopied"))


## Short message at the bottom of the screen (3.2 s, like the app's toasts).
func toast(text: String) -> void:
	var l := UI.label(text, 26, UI.TEXT, false, 6)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	l.offset_left = -320
	l.offset_right = 320
	l.offset_top = -230
	l.offset_bottom = -140
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(l)
	var tw := l.create_tween()
	tw.tween_interval(3.2)
	tw.tween_property(l, "modulate:a", 0.0, 0.3)
	tw.tween_callback(l.queue_free)


var _changelog := {}


func _load_changelog() -> Dictionary:
	if _changelog.is_empty():
		var f := FileAccess.open("res://i18n/changelog.json", FileAccess.READ)
		_changelog = JSON.parse_string(f.get_as_text()) if f else {"version": "", "entries": []}
	return _changelog


func app_version() -> String:
	return _load_changelog().version


## What's new (src/components/ChangelogPopover.tsx): English source, each
## language's translated bodies where it has them.
func show_changelog() -> void:
	var body := open_overlay(Lang.a("changelog.title"), true)
	body.add_child(UI.hint(Lang.a("changelog.tagline")))
	for e in _load_changelog().entries:
		var parts: PackedStringArray = str(e.date).split("-")
		var date := "%d %s %s" % [int(parts[2]), Lang.a("changelog.months.%d" % (int(parts[1]) - 1)), parts[0]] if parts.size() == 3 else str(e.date)
		body.add_child(UI.section("%s · %s" % [e.version, date]))
		var base := "changelog.entries.%s" % e.version
		if Lang.has_app(base + ".highlight") or e.has("highlight"):
			var hl := Lang.a(base + ".highlight") if Lang.code != "en" and Lang.has_key_in(base + ".highlight") else str(e.get("highlight", ""))
			if hl != "":
				body.add_child(UI.rich("[i]%s[/i]" % _esc(hl)))
		var kinds := {"added": [], "changed": [], "fixed": []}
		for i in e.changes.size():
			var ch: Dictionary = e.changes[i]
			var key := "%s.changes.%d" % [base, i]
			var txt: String = Lang.a(key) if Lang.code != "en" and Lang.has_key_in(key) else str(ch.text)
			kinds[ch.kind].append(txt)
		for k in ["added", "changed", "fixed"]:
			if kinds[k].is_empty():
				continue
			body.add_child(UI.rich("[b]%s[/b]" % Lang.a("changelog." + k)))
			for t in kinds[k]:
				body.add_child(UI.rich("•  " + _esc(t)))


# Placeholders replaced in later phases of the port.
func show_rankings(tab := "local") -> void:
	var body := open_overlay(Lang.a("rankings.title"), true)
	var sheet := RankingsSheet.new()
	sheet.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.add_child(sheet)
	sheet.setup(self, tab)
	overlay.set_meta("back", sheet.back)


func show_puzzle_rankings() -> void:
	var body := open_overlay(Lang.a("puzzleBoard.title"), true)
	var sheet := PuzzleSheet.new()
	sheet.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.add_child(sheet)
	sheet.setup()


func show_achievements() -> void:
	var body := open_overlay(Lang.a("achievements.title"), true)
	var sheet := AchievementsSheet.new()
	sheet.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.add_child(sheet)
	sheet.setup(self)


func show_profile() -> void:
	var body := open_overlay(Lang.a("profile.title"), true)
	var sheet := ProfileSheet.new()
	sheet.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.add_child(sheet)
	sheet.setup(self)


func show_friends() -> void:
	var body := open_overlay(Lang.a("friends.title"), true)
	var sheet := FriendsSheet.new()
	sheet.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.add_child(sheet)
	sheet.setup(self)


## Friend actions (main is never freed, so the confirm callbacks stay valid).
func friend_more(f: Dictionary) -> void:
	confirm(f.name, friend_block.bind(f), friend_remove.bind(f), Lang.a("friends.block"), Lang.a("friends.removeFriend"))


func friend_remove(f: Dictionary) -> void:
	confirm(Lang.a("friends.removeConfirm", [f.name]), func():
		await Social.remove(f.id)
		show_friends(), show_friends, Lang.a("friends.removeFriend"), Lang.a("friends.cancel"))


func friend_block(f: Dictionary) -> void:
	confirm(Lang.a("friends.blockConfirm", [f.name]), func():
		await Social.block(f.uid)
		show_friends(), show_friends, Lang.a("friends.block"), Lang.a("friends.cancel"))


func friend_unblock(b: Dictionary) -> void:
	confirm(Lang.a("friends.unblockConfirm", [b.name]), func():
		await Social.unblock(b.uid)
		show_friends(), show_friends)


## Send a game invite (SendInviteDialog.tsx): shape, time control, ranked;
## then wait — accepted opens Match found, declined/expired says so.
func show_invite(f: Dictionary) -> void:
	var body := open_overlay(Lang.a("invite.title", [f.name]), true)
	var pick := {"shape": "triangle", "tc": "3min", "ranked": false}
	var form := VBoxContainer.new()
	form.add_theme_constant_override("separation", 10)
	body.add_child(form)
	var shapes := []
	for sh in BoardDef.SHAPES:
		if sh != "rhombus":
			shapes.append([sh, Lang.a("shapes." + sh)])
	var tcs := []
	for t in ["1min", "3min", "5min"]:
		tcs.append([t, "%s · %s" % [Lang.a("timeControls.%s.label" % t), Lang.a("timeControls.%s.per" % t)]])
	for g in [["shape", Lang.a("invite.shapeH"), shapes], ["tc", Lang.a("invite.timeH"), tcs]]:
		form.add_child(UI.section(g[1]))
		var row := HFlowContainer.new()
		row.alignment = FlowContainer.ALIGNMENT_CENTER
		row.add_theme_constant_override("h_separation", 8)
		row.add_theme_constant_override("v_separation", 8)
		form.add_child(row)
		var btns := []
		for opt in g[2]:
			var b := UI.small_button(opt[1], false, 20)
			btns.append([b, opt[0]])
			row.add_child(b)
		var key: String = g[0]
		var paint := func():
			for pair in btns:
				pair[0].modulate = Color.WHITE if pick[key] == pair[1] else Color(1, 1, 1, 0.5)
		for pair in btns:
			var val: String = pair[1]
			pair[0].pressed.connect(func():
				pick[key] = val
				paint.call())
		paint.call()
	var ranked := CheckButton.new()
	ranked.text = Lang.a("invite.ranked")
	ranked.focus_mode = Control.FOCUS_NONE
	ranked.add_theme_font_override("font", UI.font(true))
	ranked.add_theme_font_size_override("font_size", 22)
	ranked.toggled.connect(func(on): pick.ranked = on)
	form.add_child(ranked)
	form.add_child(UI.hint(Lang.a("invite.rankedHint")))
	var err := UI.hint("")
	form.add_child(err)
	var send := UI.plain_button(Lang.a("invite.send"), false, 24)
	send.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	form.add_child(send)
	send.pressed.connect(func():
		var st := Social.status_of(f.uid)
		if st != "menu":
			var why := Lang.a("invite.reasonOffline") if st == "offline" else (Lang.a("invite.reasonSearching") if st == "searching-ranked" else Lang.a("invite.reasonInGame"))
			err.text = Lang.a("invite.cantInviteNow", [f.name, why])
			return
		send.disabled = true
		send.text = (Lang.a("invite.sending")).to_upper()
		var e: String = await Social.send_invite(f.uid, pick.shape, pick.tc, pick.ranked)
		if not is_instance_valid(form):
			return
		send.disabled = false
		send.text = (Lang.a("invite.send")).to_upper()
		if e != "":
			err.text = Lang.a("invite.tooManyPending") if e == "TOO_MANY_PENDING" else Lang.a("invite.inviteFailed")
			return
		_invite_wait(body, form, f))


func _invite_wait(body: VBoxContainer, form: Control, f: Dictionary) -> void:
	form.visible = false
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 14)
	body.add_child(box)
	var msg := UI.label(Lang.a("invite.waiting", [f.name]), 26, UI.TEXT, false, 4)
	msg.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	box.add_child(msg)
	var cancel := UI.plain_button(Lang.a("invite.cancelInvite"), true, 22)
	cancel.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	box.add_child(cancel)
	var mine := func() -> Dictionary:
		for i in Social.invites_out:
			if str(i.to_uid) == f.uid:
				return i
		return {}
	var state := {"declined": false}
	var drop := func():
		var inv: Dictionary = mine.call()
		if not inv.is_empty():
			Social.cancel_invite(str(inv.id))
	cancel.pressed.connect(func():
		if state.declined:
			show_invite(f)
			return
		drop.call()
		close_overlay())
	if overlay:
		overlay.set_meta("back", func():
			if not state.declined:
				drop.call()
			return false)
		overlay.tree_exiting.connect(func():
			if not state.declined and Online.pairing.is_empty():
				drop.call())
	# Gone from the live list without a pairing = declined or expired.
	while is_instance_valid(box):
		await get_tree().create_timer(1.0).timeout
		if not is_instance_valid(box):
			return
		await Social.load_invites()
		if not is_instance_valid(box) or not Online.pairing.is_empty():
			return
		if mine.call().is_empty():
			await get_tree().create_timer(1.5).timeout
			if not is_instance_valid(box) or not Online.pairing.is_empty():
				return
			state.declined = true
			msg.text = Lang.a("invite.declined", [f.name])
			cancel.text = (Lang.a("invite.sendAgain")).to_upper()
			return


## "X invites you" card over the menus (IncomingInviteToast.tsx).
var _invite_card: Control


var _invite_busy := ""
var _invite_shown := ""


func _invite_card_allowed() -> bool:
	if overlay != null or Social.invites_in.is_empty():
		return false
	if where.begins_with("menu") or where == "online":
		return true
	return where == "online_game" and screen is GameView and screen._result.has("lines")


func _refresh_invite_card() -> void:
	var show := _invite_card_allowed()
	var want := str(Social.invites_in[0].id) if show else ""
	if want == _invite_shown and is_instance_valid(_invite_card) == show:
		return  # same invite already up — keep its buttons (and busy state)
	if is_instance_valid(_invite_card):
		_invite_card.queue_free()
	_invite_card = null
	_invite_shown = want
	if not show:
		return
	var inv: Dictionary = Social.invites_in[0]
	var from := Social.name_of(str(inv.from_uid))
	if from == "":
		from = Lang.a("invite.aFriend")
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", UI.small_frame())
	panel.anchor_left = 0.0
	panel.anchor_right = 1.0
	panel.anchor_top = 1.0
	panel.anchor_bottom = 1.0
	panel.offset_left = 24
	panel.offset_right = -24
	panel.offset_top = -110
	panel.offset_bottom = -110
	panel.grow_vertical = Control.GROW_DIRECTION_BEGIN
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 10)
	panel.add_child(vb)
	var ranked := bool(inv.get("from_ranked", false))
	var head := UI.label("%s %s" % [from, Lang.a("invite.invitesYou")], 26, UI.TEXT, true, 3)
	head.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vb.add_child(head)
	var tc := str(inv.get("time_control", "3min"))
	var tc_key := "timeControls.%s.label" % tc
	var sub := "%s · %s" % [Lang.a("shapes." + str(inv.get("shape", "triangle"))), Lang.a(tc_key) if Lang.has_key_in(tc_key) else tc]
	if ranked:
		sub += " · " + Lang.a("invite.theyPickedRanked")
	vb.add_child(UI.hint(sub))
	var row := HFlowContainer.new()
	row.alignment = FlowContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("h_separation", 8)
	row.add_theme_constant_override("v_separation", 8)
	vb.add_child(row)
	var id := str(inv.id)
	var btns := []
	var dec := UI.small_button(Lang.a("invite.decline"), true, 21)
	btns.append(dec)
	dec.pressed.connect(func():
		_invite_busy = id
		for b in btns:
			b.disabled = true
		await Social.decline_invite(id)
		_invite_busy = ""
		_invite_shown = ""
		_refresh_invite_card())
	row.add_child(dec)
	var accept := func(as_ranked: bool):
		_invite_busy = id
		for b in btns:
			b.disabled = true
		var e: String = await Social.accept_invite(id, as_ranked)
		_invite_busy = ""
		if e != "":
			toast(Lang.a("invite.inviteFailed"))
			_invite_shown = ""
			_refresh_invite_card()
	if ranked:
		var cas := UI.small_button(Lang.a("invite.acceptCasual"), false, 21)
		btns.append(cas)
		cas.pressed.connect(accept.bind(false))
		row.add_child(cas)
	var acc := UI.small_button(Lang.a("invite.acceptRanked") if ranked else Lang.a("invite.accept"), false, 21)
	btns.append(acc)
	acc.pressed.connect(accept.bind(ranked))
	row.add_child(acc)
	for b in btns:
		b.disabled = _invite_busy == id
	add_child(panel)
	_invite_card = panel


## Today's shared puzzle: fetch the board, replay the opening, play as P1.
func start_daily() -> void:
	if _daily_loading or not Supa.signed_in():
		return
	_daily_loading = true
	toast(Lang.a("game.dailyLoading"))
	var def: Dictionary = await Daily.fetch_def()
	_daily_loading = false
	if def.is_empty():
		toast(Lang.a("game.dailyLoadFailed"))
		return
	close_overlay()
	where = "game"
	var g := GameView.new()
	g.setup(def.shape, def.level)
	g.mode = "daily"
	g.s = Daily.opening_state(g.b, def.opening)
	g.shown_left = g.s.points_left(g.b)
	g.shown_score = [0.0, float(g.s.scores[1]), float(g.s.scores[2])]
	g.names[1] = Store.display_name(_player_one())
	Store.note_game_started()
	Track.event("daily_puzzle_started", {"puzzle_id": Daily.puzzle_id, "shape": def.shape, "difficulty": def.level})
	g.track_start()
	g.exit_requested.connect(_after_daily)
	g.back_requested.connect(_after_daily)
	g.settings_requested.connect(show_settings)
	g.howto_requested.connect(show_howto.bind("rules"))
	g.daily_again.connect(start_daily)
	g.puzzle_board_requested.connect(show_puzzle_rankings)
	_swap(g)


var _daily_loading := false


func _after_daily() -> void:
	show_menu("single")


## The first-game lesson (CoachGame.tsx) on a pre-filled Triangle.
func start_coach() -> void:
	close_overlay()
	where = "game"
	var g := GameView.new()
	g.coach = Coach.new()
	g.coach.replay = bool(Store.settings.tutorialSeen)
	Track.event("tutorial_start", {"replay": 1 if g.coach.replay else 0})
	g.setup("triangle", 1)
	g.mode = "coach"
	g.s = g.coach.opening()
	g.shown_left = g.s.points_left(g.b)
	g.shown_score = [0.0, float(g.s.scores[1]), float(g.s.scores[2])]
	g.names = ["", Store.display_name(_player_one()), Lang.a("coach.name")]
	g.back_requested.connect(_leave_coach)
	g.exit_requested.connect(_leave_coach)
	g.play_requested.connect(func(sh: String, lv: int):
		hot_seat = false
		shape = sh
		level = lv
		start_game())
	_swap(g)


func _leave_coach() -> void:
	var g := _current_game()
	if g and g.coach and not g.s.finished:
		Track.event("tutorial_skip", {"replay": 1 if g.coach.replay else 0})
	Store.set_setting("tutorialSeen", true)
	show_menu()


## First visit (WelcomeCard.tsx): what the game is, the four rules, then the
## lesson — or "I know how to play", which appears after 3 s.
var _welcome_t0 := -1


func show_welcome() -> void:
	if _welcome_t0 < 0:
		_welcome_t0 = Time.get_ticks_msec()
	var body := open_overlay(Lang.a("coach.welcomeTitle"), true, false, true)
	overlay.set_meta("back", func():
		Store.set_setting("tutorialSeen", true)
		return false)
	var langs := HFlowContainer.new()
	langs.alignment = FlowContainer.ALIGNMENT_CENTER
	langs.add_theme_constant_override("h_separation", 8)
	for c in Lang.CODES:
		var b := UI.plain_button(c.to_upper(), false, 20)
		b.autowrap_mode = TextServer.AUTOWRAP_OFF
		b.custom_minimum_size = Vector2(64, 50)
		if c == Lang.code:
			b.add_theme_color_override("font_color", UI.ACCENT)
		b.pressed.connect(func():
			Lang.set_code(c)
			show_welcome())
		langs.add_child(b)
	body.add_child(langs)
	var intro := UI.label(Lang.a("coach.welcomeIntro"), 24, UI.TEXT, false, 3)
	intro.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.add_child(intro)
	for i in 4:
		body.add_child(UI.rich("[b]%d.  %s[/b] %s" % [i + 1, _esc(Lang.a("coach.welcomeSteps.%d.title" % i)), _esc(Lang.a("coach.welcomeSteps.%d.body" % i))]))
	var play := UI.art_button(Lang.a("coach.welcomePlay"), UI.PRIMARY_BTN, 520, 110, 34, Look.tone(Color("0c2416")))
	play.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	play.pressed.connect(start_coach)
	body.add_child(play)
	body.add_child(UI.label(Lang.a("coach.welcomeTime"), 20, UI.TEXT_DIM, false, 2))
	var skip := UI.plain_button(Lang.a("coach.welcomeSkip"), false, 22)
	skip.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	skip.modulate.a = 0.0
	skip.disabled = true
	skip.pressed.connect(func():
		Track.event("tutorial_declined")
		Store.set_setting("tutorialSeen", true)
		close_overlay())
	body.add_child(skip)
	var tw := skip.create_tween()
	tw.tween_interval(maxf(0.0, 3.0 - (Time.get_ticks_msec() - _welcome_t0) / 1000.0))
	tw.tween_callback(func(): skip.disabled = false)
	tw.tween_property(skip, "modulate:a", 1.0, 0.3)
	var guide := UI.plain_button(Lang.a("rules.moreGuide"), false, 20)
	guide.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	guide.pressed.connect(open_guide)
	body.add_child(guide)


func icon_button(glyph: String) -> TextureButton:
	var t := TextureButton.new()
	t.texture_normal = UI.scaled_tex("icon-button.webp", 84)
	t.ignore_texture_size = true
	t.stretch_mode = TextureButton.STRETCH_KEEP_ASPECT_CENTERED
	t.custom_minimum_size = Vector2(84, 84)
	t.focus_mode = Control.FOCUS_NONE
	if glyph != "":
		var l := UI.label(glyph, 28, UI.TEXT)
		l.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		l.mouse_filter = Control.MOUSE_FILTER_IGNORE
		t.add_child(l)
	UI.juicy(t)
	return t


# ---------------------------------------------------------------- overlays

## Sheet over the current screen: painted card frame, the title on the ribbon
## across its top edge, a round ✕ in the corner. Returns its content box.
## Back, ✕ or tapping the dimmed area closes it (modal: none of those).
func open_overlay(title: String, scroll := false, full := false, modal := false, show_x := true) -> VBoxContainer:
	close_overlay()
	var ov := Control.new()
	ov.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(ov)
	overlay = ov
	var dim := ColorRect.new()
	dim.color = Look.tone(Color(0, 0.02, 0.01, 0.0))
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	if not modal:
		dim.gui_input.connect(func(e: InputEvent):
			if e is InputEventMouseButton and e.pressed:
				close_overlay())
	dim.mouse_filter = Control.MOUSE_FILTER_STOP
	ov.add_child(dim)
	ov.create_tween().tween_property(dim, "color:a", 0.7, 0.25)
	# Panel, ribbon and ✕ move and fade together.
	var card := Control.new()
	card.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	card.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ov.add_child(card)
	var panel := PanelContainer.new()
	var has_title := title != ""
	panel.add_theme_stylebox_override("panel", UI.frame_box(has_title))
	card.add_child(panel)
	var body := VBoxContainer.new()
	body.add_theme_constant_override("separation", 14 if scroll or full else 22)
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	if scroll or full:
		panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		panel.offset_left = 22
		panel.offset_right = -22
		panel.offset_top = 64
		panel.offset_bottom = -34
	if full and not scroll:
		body.size_flags_vertical = Control.SIZE_EXPAND_FILL
		panel.add_child(body)
	elif scroll:
		var sc := ScrollContainer.new()
		sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
		sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
		sc.add_child(body)
		panel.add_child(sc)
	else:
		panel.custom_minimum_size = Vector2(minf(620, size.x - 44), 0)
		panel.add_child(body)
	var wreath: Control = UI.wreath() if Look.xmas() else null
	if wreath:
		card.add_child(wreath)
		if scroll or full:
			panel.offset_left = 40
			panel.offset_right = -40
			panel.offset_top = 70
			panel.offset_bottom = -44
		else:
			panel.custom_minimum_size.x = minf(620, size.x - 80)
	var ribbon: Control = UI.ribbon(title, minf(560, size.x - 120)) if has_title else null
	if ribbon:
		card.add_child(ribbon)
	var x: TextureButton = null
	if not modal and show_x:
		x = close_button()
		x.pressed.connect(close_overlay)
		card.add_child(x)
	var place := func():
		if not is_instance_valid(panel):
			return
		if wreath:
			UI.fit_wreath(wreath, panel)
		if ribbon:
			ribbon.position = panel.position + Vector2((panel.size.x - ribbon.size.x) / 2.0, -ribbon.size.y * 0.5)
		if x:
			x.position = panel.position + Vector2(panel.size.x - x.size.x * 1.05, -x.size.y * 0.35)
	panel.item_rect_changed.connect(place)
	if scroll and not full:
		# Only as tall as the content (centred), up to the full-height sheet;
		# scrolls only when the text really doesn't fit.
		var top0 := panel.offset_top
		var bottom0 := panel.offset_bottom
		var fit := func():
			if not is_instance_valid(panel):
				return
			var avail := size.y - top0 + bottom0
			var need := body.get_combined_minimum_size().y + panel.get_theme_stylebox("panel").get_minimum_size().y
			var h := minf(need, avail)
			panel.offset_top = top0 + (avail - h) / 2.0
			panel.offset_bottom = panel.offset_top + h - size.y
		body.minimum_size_changed.connect(fit)
		ov.resized.connect(fit)
		fit.call_deferred()
	if not scroll and not full:
		var center := func():
			if is_instance_valid(panel):
				panel.size = panel.get_combined_minimum_size()
				panel.position = (size - panel.size) / 2.0
		panel.resized.connect(center)
		center.call_deferred()
	place.call_deferred()
	card.pivot_offset = size / 2.0
	card.scale = Vector2.ONE * 0.94
	card.modulate.a = 0.0
	var tw := card.create_tween().set_parallel()
	tw.tween_property(card, "modulate:a", 1.0, 0.18)
	tw.tween_property(card, "scale", Vector2.ONE, 0.22).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	_sync_guard()
	return body


## Round painted ✕ (popups' close).
func close_button() -> TextureButton:
	var t := icon_button("")
	t.custom_minimum_size = Vector2(76, 76)
	t.size = Vector2(76, 76)
	var cross := Control.new()
	cross.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	cross.mouse_filter = Control.MOUSE_FILTER_IGNORE
	cross.draw.connect(func():
		var c := cross.size / 2.0
		for d in [Vector2(1, 1), Vector2(1, -1)]:
			cross.draw_line(c - d * 12, c + d * 12, Look.tone(Color(0, 0.06, 0.03, 0.8)), 9, true)
			cross.draw_line(c - d * 12, c + d * 12, UI.TEXT, 5, true))
	t.add_child(cross)
	return t


func close_overlay() -> void:
	if overlay:
		overlay.queue_free()
		overlay = null
	_refresh_invite_card.call_deferred()


func _choice(text: String, sub: String, on: bool) -> Button:
	var b := Button.new()
	b.focus_mode = Control.FOCUS_NONE
	b.custom_minimum_size = Vector2(0, 88 if sub == "" else 118)
	var sb := StyleBoxFlat.new()
	sb.set_corner_radius_all(22)
	sb.set_border_width_all(3)
	sb.bg_color = Look.tone(Color(0.08, 0.25, 0.14, 0.95)) if on else Look.tone(Color(0.02, 0.07, 0.04, 0.9))
	sb.border_color = UI.ACCENT if on else Color(1, 1, 1, 0.12)
	for st in ["normal", "hover", "pressed", "focus"]:
		b.add_theme_stylebox_override(st, sb)
	var vb := VBoxContainer.new()
	vb.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vb.alignment = BoxContainer.ALIGNMENT_CENTER
	vb.mouse_filter = Control.MOUSE_FILTER_IGNORE
	vb.add_theme_constant_override("separation", 0)
	b.add_child(vb)
	vb.add_child(UI.label(text.to_upper(), UI.BTN_M, UI.ACCENT if on else UI.TEXT, true, 4))
	if sub != "":
		var s := UI.label(sub, 21, UI.TEXT_DIM, false, 3)
		s.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		vb.add_child(s)
	return b


func show_language_picker() -> void:
	var body := open_overlay(Lang.t("choose_language"))
	for c in Lang.CODES:
		var b := _choice(Lang.NAMES[c], "", c == Lang.code)
		b.pressed.connect(func():
			close_overlay()
			Lang.set_code(c))
		body.add_child(b)


func show_theme_picker() -> void:
	var body := open_overlay(Lang.t("choose_theme"))
	for id in Look.available():
		var tagline := Lang.t("theme_tagline_christmas" if id == Look.XMAS else "theme_tagline_forest")
		var b := _choice(Look.NAMES[id], tagline, id == Look.id)
		b.pressed.connect(func():
			close_overlay()
			Look.set_id(id))
		body.add_child(b)


func show_howto(tab := "steps") -> void:
	var body := open_overlay(Lang.a("howto.title"), false, true)
	var sh := HowToSheet.new()
	sh.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_child(sh)
	# "Play the tutorial" only from the menu (mid-game it would drop the game).
	sh.setup(where.begins_with("menu"), tab)
	sh.play_tutorial.connect(start_coach)


## Settings (src/components/SettingsPopover.tsx). Changes save as you make
## them. How to play sits on top so the game screen's cog reaches it too.
func show_settings() -> void:
	var body := open_overlay(Lang.a("settings.title"), true)
	body.add_child(UI.hint(Lang.a("settings.tagline")))
	var help := UI.plain_button(Lang.a("howto.title"))
	help.pressed.connect(show_howto)
	body.add_child(help)

	var cloud := Online.display_name() if Supa.signed_in() else ""
	body.add_child(UI.section(Lang.a("settings.yourName")))
	var me := UI.input(cloud if cloud != "" else _shown_name(Store.settings.playerName, Store.DEFAULT_P1), Lang.a("menu.player1Placeholder"))
	me.editable = cloud == ""
	me.text_changed.connect(func(t: String): Store.set_setting("playerName", t.strip_edges() if t.strip_edges() != "" else Store.DEFAULT_P1))
	body.add_child(me)
	body.add_child(UI.hint(Lang.a("settings.yourNameHintSignedIn", [cloud]) if cloud != "" else Lang.a("settings.yourNameHint")))

	body.add_child(UI.section(Lang.a("settings.hotseatOpponent")))
	var p2 := UI.input(_shown_name(Store.settings.opponentName, Store.DEFAULT_P2), Lang.a("menu.player2Placeholder"))
	p2.text_changed.connect(func(t: String): Store.set_setting("opponentName", t.strip_edges() if t.strip_edges() != "" else Store.DEFAULT_P2))
	body.add_child(p2)
	body.add_child(UI.toggle(Lang.a("settings.swapColours"), bool(Store.settings.hotseatColorSwap), func(on: bool): Store.set_setting("hotseatColorSwap", on)))

	body.add_child(UI.section(Lang.a("settings.appearanceH")))
	var lang := UI.plain_button("%s: %s" % [Lang.t("language"), Lang.NAMES[Lang.code]])
	lang.pressed.connect(show_language_picker)
	body.add_child(lang)
	if Look.available().size() > 1:
		var th := UI.plain_button("%s: %s" % [Lang.a("settings.colourTheme"), Look.NAMES[Look.id]])
		th.pressed.connect(show_theme_picker)
		body.add_child(th)

	body.add_child(UI.section(Lang.a("settings.soundH")))
	body.add_child(UI.toggle(Lang.a("settings.soundEffects"), bool(Store.settings.sfxEnabled), func(on: bool): Sfx.set_sfx(on)))
	body.add_child(UI.toggle(Lang.a("settings.backgroundMusic"), bool(Store.settings.musicEnabled), func(on: bool): Sfx.set_music(on)))

	# Privacy toggles only from the menu screens, like the app.
	if Supa.signed_in() and Online.profile_loaded and not where in ["game", "online_game"]:
		body.add_child(UI.section(Lang.a("settings.privacyH")))
		body.add_child(UI.hint(Lang.a("settings.whoCanChallenge")))
		var pol: String = Online.profile.get("challenge_policy", "everyone")
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 8)
		for opt in [["everyone", "settings.everyone"], ["friends-only", "settings.friendsOnly"], ["nobody", "settings.nobody"]]:
			var ob := UI.plain_button(Lang.a(opt[1]), false, 21)
			ob.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			ob.toggle_mode = true
			ob.button_pressed = pol == opt[0]
			ob.pressed.connect(func():
				Online.update_privacy({"challenge_policy": opt[0]})
				show_settings())
			row.add_child(ob)
		body.add_child(row)
		body.add_child(UI.toggle(Lang.a("settings.showStatus"), bool(Online.profile.get("show_presence", true)), func(on: bool): Online.update_privacy({"show_presence": on})))
		body.add_child(UI.hint(Lang.a("settings.showStatusHint")))

	body.add_child(UI.section(""))
	var reset_p := UI.plain_button(Lang.a("settings.resetProgress"), true)
	reset_p.pressed.connect(func(): confirm(Lang.a("settings.resetProgressConfirm"), func():
		Store.reset_progress()
		show_settings(), show_settings))
	body.add_child(reset_p)
	var reset_s := UI.plain_button(Lang.a("settings.resetStats"), true)
	reset_s.pressed.connect(func(): confirm(Lang.a("settings.resetStatsConfirm"), func():
		Store.reset_stats()
		show_settings(), show_settings))
	body.add_child(reset_s)
	body.add_child(UI.hint(Lang.a("settings.renameNote")))


## Settings fields show empty for the stored English defaults (placeholder shows).
func _shown_name(n: String, default: String) -> String:
	return "" if n == default else n


## Yes/No sheet. `on_no` runs on No/back (e.g. reopen the sheet it came from).
func confirm(text: String, on_yes: Callable, on_no := Callable(), yes_text := "", no_text := "") -> void:
	# "Question?\nWhat happens": the question goes on the ribbon.
	var parts := text.split("\n", false, 1)
	var title := parts[0].strip_edges() if parts.size() > 1 else ""
	var rest := parts[1].strip_edges() if parts.size() > 1 else text
	var body := open_overlay(title, false, false, false, false)
	var l := UI.label(rest, 27, UI.TEXT, false, 4)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size = Vector2(480, 0)
	body.add_child(l)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 14)
	body.add_child(row)
	var no := UI.plain_button(no_text if no_text != "" else Lang.a("common.cancel"))
	no.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	no.pressed.connect(func():
		close_overlay()
		if on_no.is_valid():
			on_no.call())
	row.add_child(no)
	var yes := UI.plain_button(yes_text if yes_text != "" else Lang.a("common.ok"), true)
	yes.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	yes.pressed.connect(func():
		close_overlay()
		on_yes.call())
	row.add_child(yes)


func show_privacy() -> void:
	var body := open_overlay(Lang.t("privacy_title"), true)
	var tag := UI.label(Lang.t("privacy_tagline"), 24, UI.TEXT_DIM, false, 3)
	tag.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.add_child(tag)
	var cookies_h := Lang.a("privacy.cookiesH")
	var in_cookies := false
	var placed := not OS.has_feature("web")
	for blk in Lang.privacy_blocks():
		match blk[0]:
			"h":
				var h := UI.label(blk[1], 28, UI.ACCENT, true, 4)
				h.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
				h.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
				body.add_child(h)
				in_cookies = blk[1] == cookies_h
			"p":
				body.add_child(UI.rich(_esc(blk[1])))
				if in_cookies and not placed:
					_consent_block(body)
					placed = true
			"li":
				body.add_child(UI.rich("•  [b]%s[/b] %s" % [_esc(blk[1]), _esc(blk[2])]))
	if not placed:
		_consent_block(body, true)


## Analytics choice (PrivacyPopover.tsx): GA4 loads only after "Accept".
func _consent_block(body: Control, heading := false) -> void:
	var cur := Track.consent()
	if heading:
		var h := UI.label(Lang.a("privacy.cookiesH"), 28, UI.ACCENT, true, 4)
		h.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		h.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
		body.add_child(h)
	var state := Lang.a("privacy.choiceAccepted") if cur == "accepted" else (Lang.a("privacy.choiceDeclined") if cur == "declined" else Lang.a("privacy.choiceUndecided"))
	body.add_child(UI.rich("%s [b]%s[/b]" % [_esc(Lang.a("privacy.currentChoice")), _esc(state)]))
	var row := HFlowContainer.new()
	row.alignment = FlowContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("h_separation", 12)
	row.add_theme_constant_override("v_separation", 10)
	for opt in [["accepted", "privacy.acceptAnalytics"], ["declined", "privacy.declineAnalytics"]]:
		var b := UI.plain_button(Lang.a(opt[1]), false, UI.BTN_S)
		b.autowrap_mode = TextServer.AUTOWRAP_OFF
		b.custom_minimum_size = Vector2(0, 60)
		b.disabled = cur == opt[0]
		if b.disabled:
			b.modulate.a = 0.5
		var v: String = opt[0]
		b.pressed.connect(func():
			Track.set_consent(v)
			close_overlay()
			show_privacy())
		row.add_child(b)
	body.add_child(row)
	var hint := UI.label(Lang.a("privacy.consentReloadHint"), 20, UI.TEXT_DIM, false, 3)
	hint.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.add_child(hint)


func _esc(t: String) -> String:
	return t.replace("[", "[lb]")


# ---------------------------------------------------------------- back

## Phone back button / gesture, browser back, Esc: one step back in the game.
## On the web one guard entry sits on the browser history while there is
## somewhere to go back to (same pattern as the React app), so the gesture
## stays inside the game; on the main menu it leaves the page as usual.
func _setup_back() -> void:
	if OS.has_feature("web"):
		_js_pop = JavaScriptBridge.create_callback(_on_popstate)
		JavaScriptBridge.get_interface("window").addEventListener("popstate", _js_pop)


func _at_root() -> bool:
	return where == "menu" and overlay == null


func _sync_guard() -> void:
	if OS.has_feature("web") and not _guard and not _at_root():
		JavaScriptBridge.eval("history.pushState({dotduelGuard: true}, '')", true)
		_guard = true


func _on_popstate(_args: Array) -> void:
	_guard = false
	if _at_root():
		JavaScriptBridge.eval("history.back()", true)
		return
	go_back()
	_sync_guard()


func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_GO_BACK_REQUEST:
		if _at_root():
			get_tree().quit()
		else:
			go_back()


func _input(e: InputEvent) -> void:
	if e is InputEventKey and e.pressed and not e.echo and e.keycode == KEY_ESCAPE:
		go_back()
		get_viewport().set_input_as_handled()
	elif e is InputEventMouseButton and e.pressed:
		# Re-arm from a real tap: browsers skip history entries added
		# without any user interaction.
		_sync_guard.call_deferred()


func go_back() -> void:
	if overlay:
		# A sheet with its own levels (Rankings head-to-head) steps back first.
		if overlay.has_meta("back") and overlay.get_meta("back").call():
			return
		close_overlay()
		return
	match where:
		"menu_single", "menu_multi", "menu_rankings", "online":
			show_menu()
		"setup":
			show_menu("multi" if hot_seat else "single")
		"searching":
			online_ui.cancel()
		"game", "online_game":
			(screen as GameView).back_pressed()


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
	if not hot_seat and not Store.shape_unlocked(shape):
		shape = "triangle"
	if not hot_seat and not Store.is_unlocked(shape, level):
		level = int(Store.progress.unlocked.get(shape, 1))
	var vb := _page()
	vb.alignment = BoxContainer.ALIGNMENT_BEGIN
	vb.add_theme_constant_override("separation", 12)
	var top := HBoxContainer.new()
	var back := UI.art_button(Lang.t("back"), UI.PILL_BTN, 220, 76, 26)
	back.pressed.connect(show_menu.bind("multi" if hot_seat else "single"))
	top.add_child(back)
	vb.add_child(top)

	var hint := UI.label("", 22, UI.GOLD, false, 4)
	hint.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	var show_hint := func(text: String):
		hint.text = text
		Sfx.play("tick", 0.6, -4.0)

	vb.add_child(_banner(Lang.a("menu.chooseShape")))
	var shapes := HBoxContainer.new()
	shapes.alignment = BoxContainer.ALIGNMENT_CENTER
	shapes.add_theme_constant_override("separation", 18)
	vb.add_child(shapes)
	var shape_tiles := {}
	var refresh_levels := []  # lambdas capture by value: hold the callback in an array
	for sh in BoardDef.SHAPES:
		var locked: bool = not hot_seat and not Store.shape_unlocked(sh)
		var t := _tile("menu-icon-shape-%s.webp" % sh, Lang.t("shape_" + sh), "🔒 " + Lang.a("common.locked") if locked else Lang.a("menu.dots", [BoardDef.get_board(sh).pos.size()]), Vector2(200, 230))
		t.set_meta("locked", locked)
		shapes.add_child(t)
		shape_tiles[sh] = t
	var pick_shape := func(sh: String):
		if shape_tiles[sh].get_meta("locked"):
			var prev := Store.prev_shape(sh)
			show_hint.call(Lang.a("menu.unlockHint", [Lang.t("shape_" + sh), Lang.t("level_2"), Lang.t("shape_" + prev)]))
			return
		hint.text = ""
		shape = sh
		for k in shape_tiles:
			_select(shape_tiles[k], k == sh)
			if shape_tiles[k].get_meta("locked"):
				shape_tiles[k].modulate = Color(0.62, 0.62, 0.62)
		for f in refresh_levels:
			f.call()
	for sh in shape_tiles:
		shape_tiles[sh].pressed.connect(pick_shape.bind(sh))

	if not hot_seat:
		vb.add_child(_banner(Lang.a("menu.chooseDifficulty")))
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
		var paint := func():
			if not Store.is_unlocked(shape, level):
				level = int(Store.progress.unlocked.get(shape, 1))
			lvl_label.text = Lang.t("level_line", [level, Lang.t("level_%d" % level)])
			for i in 5:
				_select(bot_tiles[i], i + 1 == level)
				if not Store.is_unlocked(shape, i + 1):
					bot_tiles[i].modulate = Color(0.4, 0.4, 0.4)
		var pick_level := func(l: int):
			if not Store.is_unlocked(shape, l):
				show_hint.call(Lang.a("menu.unlockHint", [Lang.t("level_%d" % l), Lang.t("level_%d" % (l - 1)), Lang.t("shape_" + shape)]))
				return
			hint.text = ""
			level = l
			paint.call()
		for i in 5:
			bot_tiles[i].pressed.connect(pick_level.bind(i + 1))
		refresh_levels.append(paint)
		vb.add_child(lvl_label)
	pick_shape.call(shape)
	vb.add_child(hint)

	_names_block(vb)

	var gap := Control.new()
	gap.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vb.add_child(gap)
	var start := UI.art_button(Lang.a("menu.startGame"), UI.PRIMARY_BTN, 600, 130, 46, Look.tone(Color("0c2416")))
	start.pressed.connect(start_game)
	vb.add_child(_center(start))
	_stagger(vb)


## "Who's playing?": your name (or the account name), and in hot-seat
## player 2's name + swap colours. Saved as you type, like the app.
func _names_block(outer: VBoxContainer) -> void:
	# On a dark card: the painted forest behind it is too bright for small text.
	var card := PanelContainer.new()
	card.add_theme_stylebox_override("panel", UI._flat_box(Look.tone(Color(0.03, 0.09, 0.06, 0.82)), Color(1, 1, 1, 0.12), 24, 18))
	outer.add_child(card)
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", outer.get_theme_constant("separation"))
	card.add_child(vb)
	vb.add_child(UI.section(Lang.a("menu.whosPlaying")))
	if Supa.signed_in() and Online.display_name() != "":
		vb.add_child(UI.hint(Lang.a("menu.signedInAs", [Online.display_name()])))
	else:
		vb.add_child(UI.hint(Lang.a("menu.yourNameFirst") if not hot_seat else Lang.a("menu.player1First")))
		var e1 := UI.input(_shown_name(Store.settings.playerName, Store.DEFAULT_P1), Lang.a("menu.player1Placeholder"))
		e1.text_changed.connect(func(t: String):
			Store.set_setting("playerName", t.strip_edges() if t.strip_edges() != "" else Store.DEFAULT_P1))
		vb.add_child(e1)
	if hot_seat:
		vb.add_child(UI.hint(Lang.a("menu.player2")))
		var e2 := UI.input(_shown_name(Store.settings.opponentName, Store.DEFAULT_P2), Lang.a("menu.player2Placeholder"))
		e2.text_changed.connect(func(t: String):
			Store.set_setting("opponentName", t.strip_edges() if t.strip_edges() != "" else Store.DEFAULT_P2))
		vb.add_child(e2)
		vb.add_child(UI.toggle(Lang.a("menu.swapColours"), bool(Store.settings.hotseatColorSwap), func(on: bool):
			Store.set_setting("hotseatColorSwap", on)))


func _banner(text: String) -> Control:
	var p := PanelContainer.new()
	var sb := UI.art_box(UI.BANNER, 84)
	sb.content_margin_left = sb.texture_margin_left
	sb.content_margin_right = sb.texture_margin_right
	p.add_theme_stylebox_override("panel", sb)
	p.custom_minimum_size = Vector2(440, 84)
	p.add_child(UI.label(text, 28, UI.TEXT))
	return _center(p)


func _tile(icon: String, title: String, sub: String, sz: Vector2) -> Button:
	var t := Button.new()
	t.custom_minimum_size = sz
	t.focus_mode = Control.FOCUS_NONE
	var sb := StyleBoxFlat.new()
	sb.bg_color = Look.tone(Color(0.03, 0.09, 0.06, 0.78))
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
		vb.add_child(UI.label(sub, 20, UI.TEXT_DIM, false, 5))
	UI.juicy(t)
	return t


func _select(t: Button, on: bool) -> void:
	var sb: StyleBoxFlat = t.get_meta("sb")
	sb.border_color = UI.ACCENT if on else Color(1, 1, 1, 0.12)
	sb.bg_color = Look.tone(Color(0.08, 0.25, 0.14, 0.9)) if on else Look.tone(Color(0.03, 0.09, 0.06, 0.78))
	sb.shadow_color = Color(UI.ACCENT, 0.45) if on else Color(0, 0, 0, 0)
	sb.shadow_size = 18 if on else 0
	t.modulate = Color.WHITE if on else Color(0.82, 0.82, 0.82)


# ---------------------------------------------------------------- game

# ---------------------------------------------------------------- online

func _on_account_change() -> void:
	if overlay:
		return  # e.g. a privacy toggle in Settings: don't rebuild under the sheet
	if where == "online":
		online_ui.show()
	elif where == "menu":
		show_menu()


# ---------------------------------------------------------------- day streak
# Popup after the day's first finished online game or daily puzzle, from day 2
# (once a day; the same localStorage key as the React app).

const STREAK_POPUP_KEY := "dotduel:streakPopup:v1"
var _streak_seen := {}


func _on_streak_check() -> void:
	if not Supa.signed_in() or not Online.profile_loaded or Online.profile.is_empty():
		return
	var v = Online.profile.get("streak_last_played_utc")
	var day := str(v) if v != null else ""
	var prev := _streak_seen
	_streak_seen = {"uid": Online.me(), "day": day}
	if prev.is_empty() or prev.uid != Online.me() or prev.day == day:
		return
	var today := Online.utc_day()
	var n := Online.streak_alive()
	if day != today or n < 2 or _streak_popup_day() == today:
		return
	_set_streak_popup_day(today)
	await get_tree().create_timer(1.2).timeout
	for i in 120:  # don't close another sheet (rematch, share…): wait for it
		if not overlay:
			break
		await get_tree().create_timer(0.5).timeout
	if not overlay:
		_show_streak(n)


func _streak_popup_day() -> String:
	if not OS.has_feature("web"):
		return str(Store.read(STREAK_POPUP_KEY)) if Store.read(STREAK_POPUP_KEY) != null else ""
	var v = JavaScriptBridge.eval("(function(){try{return localStorage.getItem(%s)||''}catch(e){return ''}})()" % JSON.stringify(STREAK_POPUP_KEY), true)
	return str(v) if v != null else ""


func _set_streak_popup_day(day: String) -> void:
	if not OS.has_feature("web"):
		Store.write(STREAK_POPUP_KEY, day)
		return
	JavaScriptBridge.eval("try{localStorage.setItem(%s,%s)}catch(e){}" % [JSON.stringify(STREAK_POPUP_KEY), JSON.stringify(day)], true)


func _show_streak(n: int) -> void:
	var body := open_overlay(Lang.a("streak.popupTitle", [n]))
	var flame := UI.label("🔥", 96, UI.TEXT, false, 0)
	flame.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	body.add_child(flame)
	var l := UI.label(Lang.a("streak.popupBody", [n]), 28, UI.TEXT, false, 4)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.custom_minimum_size = Vector2(480, 0)
	body.add_child(l)
	var ok := UI.plain_button(Lang.a("streak.popupOk"))
	ok.pressed.connect(close_overlay)
	body.add_child(ok)
	Track.event("streak_popup_shown", {"days": n})


func _on_pairing(p: Dictionary) -> void:
	if p.is_empty():
		return
	close_overlay()  # an invite dialog / friends list
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
	g.track_start()
	g.exit_requested.connect(_leave_online.bind(true))
	g.lobby_requested.connect(_leave_online)
	g.settings_requested.connect(show_settings)
	g.howto_requested.connect(show_howto.bind("rules"))
	_swap(g)


func _leave_online(to_menu := false) -> void:
	await Online.leave_match()
	if to_menu:
		show_menu()
	else:
		online_ui.show()


func start_game(auto := false, resume := {}) -> void:
	where = "game"
	var g := GameView.new()
	if not resume.is_empty():
		hot_seat = resume.mode == "hotseat"
		shape = resume.shape
		level = int(resume.get("difficulty", 3)) if not hot_seat else level
	g.setup(shape, 0 if hot_seat else level)
	g.mode = "hotseat" if hot_seat else "ai"
	if not auto and resume.is_empty():
		Store.note_game_started()
		g.track_start()
	g.auto_p1 = auto
	if not resume.is_empty():
		g.restore(resume)
	g.names[1] = Store.display_name(_player_one())
	if hot_seat:
		g.swap = bool(Store.settings.hotseatColorSwap)
		g.names[2] = Store.display_name(str(Store.settings.opponentName))
	if auto:
		g.bot_speed = 3.0
	g.exit_requested.connect(show_menu)
	g.back_requested.connect(show_setup)
	g.settings_requested.connect(show_settings)
	g.howto_requested.connect(show_howto.bind("rules"))
	g.rematch_requested.connect(start_game.bind(auto))
	g.play_requested.connect(func(sh: String, lv: int):
		shape = sh
		level = lv
		start_game())
	_swap(g)


func _player_one() -> String:
	if Supa.signed_in() and Online.display_name() != "":
		return Online.display_name()
	return str(Store.settings.playerName)


# ---------------------------------------------------------------- autotest

func _shot(name: String) -> void:
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("%s/%s.png" % [_shot_dir, name])


func _autotest() -> void:
	Sfx.muted = true
	if OS.get_cmdline_user_args().has("--streak-only"):
		await get_tree().create_timer(2.0).timeout  # let the session restore finish first
		Supa.session = {"access_token": "x", "user": {"id": "autotest"}}
		Online.profile = {"display_name": "Donce", "streak_current": 5, "streak_longest": 7, "streak_last_played_utc": Online.utc_day()}
		Online.profile_loaded = true
		show_menu()
		await get_tree().create_timer(1.2).timeout
		await _shot("9-streak-menu")
		_show_streak(5)
		await get_tree().create_timer(0.8).timeout
		await _shot("9b-streak-popup")
		Supa.session = {}
		get_tree().quit()
		return
	if OS.get_cmdline_user_args().has("--online-only"):
		online_ui.show()
		await get_tree().create_timer(1.5).timeout
		await _shot("8-online-signin")
		get_tree().quit()
		return
	show_menu()
	await get_tree().create_timer(1.2).timeout
	await _shot("1-menu")
	show_privacy()
	await get_tree().create_timer(0.6).timeout
	await _shot("1b-privacy")
	show_language_picker()
	await get_tree().create_timer(0.6).timeout
	await _shot("1c-language")
	show_howto()
	await get_tree().create_timer(2.6).timeout
	await _shot("1d-howto")
	show_howto("rules")
	await get_tree().create_timer(0.6).timeout
	await _shot("1e-rules")
	show_settings()
	await get_tree().create_timer(0.6).timeout
	await _shot("1f-settings")
	show_welcome()
	await get_tree().create_timer(3.6).timeout
	await _shot("1i-welcome")
	start_coach()
	await get_tree().create_timer(1.2).timeout
	await _shot("1j-coach")
	var cg := screen as GameView
	for d in [Coach.CORNER_DOT, Coach.FINISH_DOT, Coach.DOUBLE_DOT]:
		while not cg._can_act():
			await get_tree().create_timer(0.1).timeout
		await get_tree().create_timer(0.4).timeout
		_click(cg.board.get_global_transform() * cg.px(d))
		await get_tree().create_timer(0.3).timeout
	while not cg._can_act():
		await get_tree().create_timer(0.1).timeout
	await get_tree().create_timer(0.5).timeout
	await _shot("1k-coach-claim")
	print("COACH TEST: ", "OK" if cg.coach.stage == "claim" and cg.s.pending.size() == 1 else "FAIL stage=%s" % cg.coach.stage)
	# Daily: fetched board if the function answers signed-out, else a local one;
	# clock forced to 2 s so the timeout path runs.
	var def: Dictionary = await Daily.fetch_def()
	print("DAILY DEF: ", "server" if not def.is_empty() else "none (signed out)")
	var dg := GameView.new()
	dg.setup(def.get("shape", "triangle"), def.get("level", 3))
	dg.mode = "daily"
	dg.s = Daily.opening_state(dg.b, def.get("opening", []))
	dg.shown_left = dg.s.points_left(dg.b)
	dg.shown_score = [0.0, float(dg.s.scores[1]), float(dg.s.scores[2])]
	dg.daily_left = 3.0
	where = "game"
	_swap(dg)
	await get_tree().create_timer(2.0).timeout
	await _shot("1l-daily")
	await get_tree().create_timer(4.0).timeout
	await _shot("1m-daily-over")
	print("DAILY TIMEOUT TEST: ", "OK" if dg.s.finished and dg.finished_reason == "timeout" else "FAIL")
	show_puzzle_rankings()
	await get_tree().create_timer(3.0).timeout
	await _shot("1n-puzzle-board")
	Online.profile = {"display_name": "Testas", "rating": 1043, "placement_games_played": 4, "auth_provider": "google", "streak_current": 3, "streak_longest": 7}
	show_profile()
	await get_tree().create_timer(1.5).timeout
	await _shot("1o-profile")
	Social.friends = [{"id": "f1", "uid": "u1", "name": "Rūta"}, {"id": "f2", "uid": "u2", "name": "Mindaugas_Ilgasvardas"}, {"id": "f3", "uid": "u3", "name": "Jonas"}]
	Social.status = {"u1": "menu", "u2": "in-ranked", "u3": "offline"}
	Social.incoming = [{"id": "r1", "uid": "u9", "name": "Eglė"}]
	show_friends()
	await get_tree().create_timer(0.8).timeout
	await _shot("1p-friends")
	show_invite(Social.friends[0])
	await get_tree().create_timer(0.8).timeout
	await _shot("1q-invite")
	close_overlay()
	where = "menu"
	Social.invites_in = [{"id": "i1", "from_uid": "u1", "shape": "square", "time_control": "3min", "from_ranked": true}]
	_refresh_invite_card()
	await get_tree().create_timer(0.8).timeout
	await _shot("1r-invite-card")
	Social.invites_in = []
	_refresh_invite_card()
	var og := GameView.new()
	og.setup_online({"player": 1, "match_id": "m1", "opponent_uid": "u7", "opponent_display_name": "Gintarė", "opponent_rating": 1012, "opponent_is_bot": false}, {"shape": "triangle", "status": "active"})
	where = "online_game"
	_swap(og)
	await get_tree().create_timer(0.6).timeout
	og._online_over({"finished_reason": "timeout", "winner": 1})
	await get_tree().create_timer(1.4).timeout
	og._on_match_record({"id": "m1", "p1_rating_before": 1043, "p1_rating_after": 1059, "p1_rating_delta": 16})
	await get_tree().create_timer(0.6).timeout
	await _shot("1s-online-over")
	show_achievements()
	await get_tree().create_timer(0.8).timeout
	await _shot("1t-achievements")
	close_overlay()
	Social.friends = []
	Social.status = {}
	Social.incoming = []
	Online.profile = {}
	show_rankings("local")
	await get_tree().create_timer(0.6).timeout
	await _shot("1g-rankings")
	(overlay.find_children("*", "RankingsSheet", true, false)[0] as RankingsSheet)._open({"kind": "player", "key": "player 1", "name": "Player 1"})
	await get_tree().create_timer(0.4).timeout
	await _shot("1h-h2h")
	close_overlay()
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
	var saved := Store.load_active()
	start_game(false, saved)
	var rs := screen as GameView
	await get_tree().create_timer(1.2).timeout
	print("RESUME TEST: ", "OK" if rs.s.colored[0] == 1 and rs.s.colored[1] == 2 and rs.mode == "hotseat" else "FAIL")
	rs.back_pressed()
	await get_tree().create_timer(0.6).timeout
	await _shot("6b-leave-confirm")
	close_overlay()
	Store.clear_active()
	# vs bot: one move, then resign through the confirm → result card.
	hot_seat = false
	shape = "triangle"
	level = 1
	start_game()
	var rb := screen as GameView
	await get_tree().create_timer(1.6).timeout
	_click(rb.board.get_global_transform() * rb.px(3))
	await get_tree().create_timer(2.0).timeout
	print("VS-BOT TAP TEST: ", "OK" if rb.s.colored[3] == 1 else "FAIL busy=%s cur=%d" % [rb.busy, rb.s.current])
	rb.resign()
	await get_tree().create_timer(2.0).timeout
	await _shot("6c-resigned")
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
		get_viewport().push_input(e, true)
