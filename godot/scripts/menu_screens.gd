class_name MenuScreens
extends RefCounted
## The menu tree of src/components/Menu.tsx: home (Single player · Multiplayer ·
## Rankings · Quick ranked), each category one level down, plus the account
## row, share row and footer (How to play · Settings · Privacy · version).

var main  # main.gd
var category := ""


func _init(m) -> void:
	main = m


func show(cat := "") -> void:
	category = cat
	main.where = "menu" if cat == "" else "menu_" + cat
	var vb: VBoxContainer = main._page()
	var root := vb.get_parent() as Control
	vb.add_theme_constant_override("separation", 12)
	vb.offset_bottom = -96  # room for the footer
	if cat == "":
		_home(vb)
	else:
		vb.alignment = BoxContainer.ALIGNMENT_BEGIN
		var top := HBoxContainer.new()
		var back := UI.art_button("‹ " + Lang.a("common.back"), UI.PILL_BTN, 220, 76, 26)
		back.pressed.connect(show.bind(""))
		top.add_child(back)
		vb.add_child(top)
		var gap := Control.new()
		gap.custom_minimum_size = Vector2(0, 40)
		vb.add_child(gap)
		vb.add_child(main._banner(Lang.a({"single": "menu.singlePlayer", "multi": "menu.multiplayer", "rankings": "menu.rankings"}[cat])))
		match cat:
			"single":
				_shelf(vb, Lang.a("menu.bots"), "", main._open_setup.bind(false))
				_daily_card(vb)
			"multi":
				_shelf(vb, Lang.a("menu.hotseat"), "", main._open_setup.bind(true))
				_online_card(vb, Lang.a("menu.onlineRanked"), "", func(): main.online_ui.show(), true)
			"rankings":
				var signed := Supa.signed_in()
				var puzzle := func():
					_shelf(vb, Lang.a("menu.puzzleRankings"), "" if signed else Lang.a("common.signInToView"),
						main.show_puzzle_rankings if signed else main.sign_in, signed)
				if signed:
					puzzle.call()
				_shelf(vb, Lang.a("menu.localRankings"), "", main.show_rankings.bind("local"))
				_shelf(vb, Lang.a("menu.ratedRankings"), "", main.show_rankings.bind("global"))
				_shelf(vb, Lang.a("menu.achievements"), "", main.show_achievements)
				if not signed:
					puzzle.call()
	main._stagger(vb)
	_corner(root)
	_footer(root)


func _home(vb: VBoxContainer) -> void:
	var sign := TextureRect.new()
	sign.texture = UI.tex("header-combined.webp")
	sign.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	sign.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	sign.custom_minimum_size = Vector2(660, 305)
	var who := Online.display_name() if Supa.signed_in() and Online.profile_loaded else ""
	var greet := Lang.a("menu.tagline") if who == "" else "%s %s — %s" % [Lang.a("menu.welcomeLead"), who, Lang.a("menu.tagline")]
	var tag := UI.label(greet, 28, UI.TEXT, false, 4)
	tag.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	tag.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	tag.offset_left = 660 * 0.09
	tag.offset_right = -660 * 0.09
	tag.offset_top = 305 * 0.6
	tag.offset_bottom = -305 * 0.085
	UI.fit_label(tag, 28, Vector2(660 * 0.82, 305 * 0.315))
	sign.add_child(tag)
	vb.add_child(main._center(sign))

	var auth := HFlowContainer.new()
	auth.alignment = FlowContainer.ALIGNMENT_CENTER
	auth.add_theme_constant_override("h_separation", 10)
	auth.add_theme_constant_override("v_separation", 10)
	if Supa.signed_in():
		_small(auth, Lang.a("menu.profile"), main.show_profile)
		_small(auth, main.friends_label(), main.show_friends)
		_small(auth, Lang.a("share.labelInvite"), main.invite_friend)
		_small(auth, Lang.a("menu.signOut"), main.sign_out)
	else:
		_small(auth, Lang.a("menu.signIn"), main.sign_in)
	vb.add_child(auth)

	var quick := func():
		_online_card(vb, Lang.a("menu.quickRanked"), "", main.quick_ranked)
	if Supa.signed_in():
		quick.call()
	_shelf(vb, Lang.a("menu.singlePlayer"), "", main.show_menu.bind("single"))
	_shelf(vb, Lang.a("menu.multiplayer"), "", show.bind("multi"))
	_shelf(vb, Lang.a("menu.rankings"), "", show.bind("rankings"))
	if not Supa.signed_in():
		quick.call()

	# Each link on its own dark strip; a narrow screen moves whole strips to
	# the next row instead of breaking one box in two.
	var share := HFlowContainer.new()
	share.alignment = FlowContainer.ALIGNMENT_CENTER
	share.add_theme_constant_override("h_separation", 12)
	share.add_theme_constant_override("v_separation", 10)
	var links := [[Lang.a("menu.guide"), main.open_guide], [Lang.a("menu.lesson"), main.start_coach]]
	if not Supa.signed_in():
		links.push_front([Lang.a("share.labelShare"), main.share_app])
	for it in links:
		var one := HBoxContainer.new()
		_link(one, it[0], it[1])
		share.add_child(UI.scrim(one, true))
	vb.add_child(share)


## A home card: painted plaque with the title; under it only a state line
## (sign in, attempts) — painted plaques drop the descriptions (Menu.tsx desc()).
func _shelf(vb: VBoxContainer, title: String, sub: String, action: Callable, enabled := true) -> Button:
	var b := UI.art_button(title.to_upper(), UI.MENU_BTN, 640, 108, 32)
	b.pressed.connect(action)
	b.modulate = Color.WHITE if enabled else Color(1, 1, 1, 0.6)
	vb.add_child(main._center(b))
	if sub != "":
		var s := UI.label(sub, 22, UI.TEXT, false, 5)
		s.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		s.custom_minimum_size = Vector2(minf(UI.font(false).get_string_size(sub, HORIZONTAL_ALIGNMENT_LEFT, -1, 22).x + 4, 560), 0)
		vb.add_child(main._center(UI.scrim(s)))
	return b


## Online cards (Quick ranked / Online ranked): sign in first. The one-device
## lock is checked when the search starts.
func _online_card(vb: VBoxContainer, title: String, sub: String, action: Callable, track := false) -> void:
	var go: Callable = action if Supa.signed_in() else main.sign_in
	if track:
		var inner := go
		go = func():
			Track.event("multiplayer_button_clicked", {"auth_state": Track.auth_state()})
			inner.call()
	if not Supa.signed_in():
		_shelf(vb, title, Lang.a("common.signInToPlay"), go, false)
		return
	_shelf(vb, title, sub, go)


func _daily_card(vb: VBoxContainer) -> void:
	var title := Lang.a("menu.dailyPuzzle")
	if not Supa.signed_in():
		_shelf(vb, title, Lang.a("common.signInToPlay"), main.sign_in, false)
		return
	var d: Dictionary = Daily.today_status()
	if d.get("left", 3) <= 0:
		var b := _shelf(vb, title, Lang.a("menu.dailyDoneSub", [d.get("best", 0)]), func(): pass, false)
		b.disabled = true
	elif d.get("attempts", 0) > 0:
		_shelf(vb, title, Lang.a("menu.dailyAttemptSub", [d.attempts + 1, 3, d.get("best", 0)]), main.start_daily)
	else:
		_shelf(vb, title, Lang.a("menu.dailyFreshSub", [3]), main.start_daily)


func _small(row: Container, text: String, action: Callable) -> void:
	var b := UI.plain_button(text, false, 22)
	b.autowrap_mode = TextServer.AUTOWRAP_OFF
	b.custom_minimum_size = Vector2(0, 60)
	b.pressed.connect(action)
	row.add_child(b)


func _link(row: Container, text: String, action: Callable) -> void:
	var b := Button.new()
	b.flat = true
	b.text = text.to_upper()
	b.focus_mode = Control.FOCUS_NONE
	b.add_theme_font_override("font", UI.font(true))
	b.add_theme_font_size_override("font_size", UI.BTN_S)
	b.add_theme_color_override("font_color", UI.ACCENT)
	b.add_theme_color_override("font_hover_color", UI.TEXT)
	b.add_theme_color_override("font_pressed_color", UI.TEXT)
	b.add_theme_constant_override("outline_size", 5)
	b.add_theme_color_override("font_outline_color", Color(0, 0.06, 0.03, 0.85))
	b.pressed.connect(action)
	row.add_child(b)


## Top-right: language and theme (menu screens only, like the app's footer).
func _corner(root: Control) -> void:
	var corner := HBoxContainer.new()
	corner.add_theme_constant_override("separation", 12)
	corner.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	corner.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	corner.offset_left = -20
	corner.offset_right = -20
	corner.offset_top = 20
	root.add_child(corner)
	var lang_btn: TextureButton = main.icon_button(Lang.code.to_upper())
	lang_btn.pressed.connect(main.show_language_picker)
	corner.add_child(lang_btn)
	if Look.available().size() > 1:
		var theme_btn: TextureButton = main.icon_button("")
		var chip := TextureRect.new()
		chip.texture = UI.tex("dot-p1.webp")
		chip.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		chip.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		chip.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		chip.offset_left = 20
		chip.offset_top = 20
		chip.offset_right = -20
		chip.offset_bottom = -20
		chip.mouse_filter = Control.MOUSE_FILTER_IGNORE
		theme_btn.add_child(chip)
		theme_btn.pressed.connect(main.show_theme_picker)
		corner.add_child(theme_btn)


## Footer: How to play · Settings · Privacy, then © and the version (changelog).
func _footer(root: Control) -> void:
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 0)
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	var strip := UI.scrim(box, true)
	strip.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	strip.grow_horizontal = Control.GROW_DIRECTION_BOTH
	strip.grow_vertical = Control.GROW_DIRECTION_BEGIN
	strip.offset_bottom = -12
	root.add_child(strip)
	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("separation", 6)
	box.add_child(row)
	_link(row, Lang.a("footer.howToPlay"), main.show_howto)
	row.add_child(UI.label("·", 22, UI.TEXT_DIM, false, 0))
	_link(row, Lang.a("footer.settings"), main.show_settings)
	row.add_child(UI.label("·", 22, UI.TEXT_DIM, false, 0))
	_link(row, Lang.a("footer.privacy"), main.show_privacy)
	var ver := Button.new()
	ver.flat = true
	ver.focus_mode = Control.FOCUS_NONE
	ver.text = "%s · %s" % [Lang.a("footer.brand"), main.app_version()]
	ver.add_theme_font_override("font", UI.font(false))
	ver.add_theme_font_size_override("font_size", 19)
	ver.add_theme_color_override("font_color", UI.TEXT_DIM)
	ver.add_theme_constant_override("outline_size", 4)
	ver.add_theme_color_override("font_outline_color", Color(0, 0.06, 0.03, 0.85))
	ver.pressed.connect(main.show_changelog)
	box.add_child(ver)
