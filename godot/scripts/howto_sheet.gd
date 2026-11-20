class_name HowToSheet
extends VBoxContainer
## The "How to play" window (src/components/HowToPlayPopover.tsx): tab
## "Step by step" loops the engine-built scenes, tab "Rules" is the rules text.
## Tap the board to pause, swipe or ‹ › to change scene.

signal play_tutorial

var _tab := "steps"
var _idx := 0
var _frame := 0
var _paused := false
var _left := 0.0
var _body: VBoxContainer
var _tagline: Label
var _tabs: Array[Button] = []
var _with_tutorial := false

var _mini: HowTo.Mini
var _score: RichTextLabel
var _cap_title: Label
var _cap_body: Label
var _pips: HBoxContainer
var _swipe_x := -1.0


func setup(with_tutorial: bool, tab := "steps") -> void:
	_with_tutorial = with_tutorial
	_tab = tab
	add_theme_constant_override("separation", 14)
	_tagline = UI.label("", 23, UI.TEXT_DIM, false, 3)
	_tagline.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	add_child(_tagline)
	var tabs := HBoxContainer.new()
	tabs.alignment = BoxContainer.ALIGNMENT_CENTER
	tabs.add_theme_constant_override("separation", 12)
	add_child(tabs)
	for k in ["steps", "rules"]:
		var b := Button.new()
		b.focus_mode = Control.FOCUS_NONE
		b.custom_minimum_size = Vector2(0, 70)
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		b.add_theme_font_override("font", UI.font(true))
		b.add_theme_font_size_override("font_size", 26)
		b.text = (Lang.a("howto.tabSteps" if k == "steps" else "howto.tabRules")).to_upper()
		b.pressed.connect(_set_tab.bind(k))
		tabs.add_child(b)
		_tabs.append(b)
	_body = VBoxContainer.new()
	_body.add_theme_constant_override("separation", 14)
	_body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	add_child(_body)
	_set_tab(_tab)


func _style_tab(b: Button, on: bool) -> void:
	var sb := StyleBoxFlat.new()
	sb.set_corner_radius_all(20)
	sb.set_border_width_all(3)
	sb.bg_color = Color(0.08, 0.25, 0.14, 0.95) if on else Color(0.02, 0.07, 0.04, 0.9)
	sb.border_color = UI.ACCENT if on else Color(1, 1, 1, 0.12)
	for st in ["normal", "hover", "pressed", "focus"]:
		b.add_theme_stylebox_override(st, sb)
	b.add_theme_color_override("font_color", UI.ACCENT if on else UI.TEXT)
	b.add_theme_color_override("font_hover_color", UI.ACCENT if on else UI.TEXT)
	b.add_theme_color_override("font_pressed_color", UI.ACCENT)


func _set_tab(k: String) -> void:
	_tab = k
	_style_tab(_tabs[0], k == "steps")
	_style_tab(_tabs[1], k == "rules")
	_tagline.text = Lang.a("howto.tagline" if k == "steps" else "rules.tagline")
	for c in _body.get_children():
		c.queue_free()
	_mini = null
	if k == "steps":
		_build_steps()
	else:
		_build_rules()


# ---------------------------------------------------------------- steps

func _build_steps() -> void:
	_score = RichTextLabel.new()
	_score.bbcode_enabled = true
	_score.fit_content = true
	_score.scroll_active = false
	_score.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_score.add_theme_font_override("normal_font", UI.font(true))
	_score.add_theme_font_size_override("normal_font_size", 34)
	_score.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_body.add_child(_score)

	var stage := HBoxContainer.new()
	stage.size_flags_vertical = Control.SIZE_EXPAND_FILL
	stage.add_theme_constant_override("separation", 6)
	_body.add_child(stage)
	stage.add_child(_nav("‹", -1))
	_mini = HowTo.Mini.new()
	_mini.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_mini.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_mini.custom_minimum_size = Vector2(0, 340)
	_mini.mouse_filter = Control.MOUSE_FILTER_STOP
	_mini.gui_input.connect(_on_board_input)
	_mini.resized.connect(func(): _mini.queue_redraw())
	stage.add_child(_mini)
	stage.add_child(_nav("›", 1))

	_cap_title = UI.label("", 28, UI.ACCENT, true, 4)
	_cap_title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_body.add_child(_cap_title)
	_cap_body = UI.label("", 23, UI.TEXT, false, 3)
	_cap_body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_cap_body.custom_minimum_size = Vector2(0, 90)
	_body.add_child(_cap_body)

	_pips = HBoxContainer.new()
	_pips.alignment = BoxContainer.ALIGNMENT_CENTER
	_pips.add_theme_constant_override("separation", 6)
	_body.add_child(_pips)
	for n in HowTo.ORDER.size():
		var pip := Button.new()
		pip.focus_mode = Control.FOCUS_NONE
		pip.flat = true
		pip.custom_minimum_size = Vector2(48, 48)
		pip.pressed.connect(_go_to.bind(n))
		pip.draw.connect(func():
			var on := n == _idx
			pip.draw_circle(pip.size / 2.0, 9.0 if on else 6.0, UI.ACCENT if on else Color(1, 1, 1, 0.3)))
		_pips.add_child(pip)

	if _with_tutorial:
		var tut := UI.art_button("▶ " + Lang.a("coach.replay"), UI.PILL_BTN, 420, 76, 24)
		tut.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		tut.pressed.connect(func(): play_tutorial.emit())
		_body.add_child(tut)
	_go_to(_idx)


func _nav(glyph: String, delta: int) -> Button:
	var b := Button.new()
	b.text = glyph
	b.flat = true
	b.focus_mode = Control.FOCUS_NONE
	b.custom_minimum_size = Vector2(56, 0)
	b.add_theme_font_override("font", UI.font(true))
	b.add_theme_font_size_override("font_size", 64)
	b.add_theme_color_override("font_color", UI.TEXT)
	b.add_theme_color_override("font_hover_color", UI.ACCENT)
	b.pressed.connect(func(): _go_to(_idx + delta))
	return b


func _go_to(n: int) -> void:
	var count := HowTo.ORDER.size()
	_idx = (n + count) % count
	_frame = 0
	_paused = false
	_show()
	for p in _pips.get_children():
		p.queue_redraw()


func _scene() -> Dictionary:
	return HowTo.scenes()[_idx]


func _show() -> void:
	if _mini == null:
		return
	var sc := _scene()
	var f: Dictionary = sc.frames[_frame]
	_left = f.hold / 1000.0
	_mini.show_frame(BoardDef.get_board(sc.shape), f)
	var s: GState = f.s
	var c1: String = Look.bright[1].to_html(false)
	var c2: String = Look.bright[2].to_html(false)
	var w1 := s.finished and s.winner == 1
	var w2 := s.finished and s.winner == 2
	_score.text = "[center][color=#%s]●[/color] [color=#%s]%s%d%s[/color]  –  [color=#%s]%s%d%s[/color] [color=#%s]●[/color][/center]" % [
		c1, "ffffff" if w1 else c1, "[u]" if w1 else "", s.scores[1], "[/u]" if w1 else "",
		"ffffff" if w2 else c2, "[u]" if w2 else "", s.scores[2], "[/u]" if w2 else "", c2]
	_cap_title.text = Lang.a("howto.scenes.%s.title" % sc.id)
	_cap_body.text = Lang.a("howto.scenes.%s.body" % sc.id)


func _process(delta: float) -> void:
	if _mini == null or _paused:
		return
	_left -= delta
	if _left <= 0.0:
		_frame = (_frame + 1) % _scene().frames.size()
		_show()


func _on_board_input(e: InputEvent) -> void:
	if e is InputEventMouseButton and e.button_index == MOUSE_BUTTON_LEFT:
		if e.pressed:
			_swipe_x = e.position.x
		elif _swipe_x >= 0.0:
			var dx: float = e.position.x - _swipe_x
			_swipe_x = -1.0
			if absf(dx) > 40.0:
				_go_to(_idx + (1 if dx < 0 else -1))
			else:
				_paused = not _paused


func step(delta: int) -> void:
	if _tab == "steps":
		_go_to(_idx + delta)


# ---------------------------------------------------------------- rules

func _build_rules() -> void:
	var sc := ScrollContainer.new()
	sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	_body.add_child(sc)
	var vb := VBoxContainer.new()
	vb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vb.add_theme_constant_override("separation", 10)
	sc.add_child(vb)
	var sections := [
		["goalH", ["p", "goalP"]],
		["turnH", ["p", "turnP"], ["ol", "turnTapEmpty", "turnTapClaim"]],
		["scoringH", ["p", "scoringP"], ["ul", "score3", "score5", "score8", "scoreCorner"]],
		["catchH", ["p", "catchP"]],
		["watchH", ["p", "watchP"]],
		["endH", ["p", "endP"]],
		["tipsH", ["ul", "tip1", "tip2", "tip3", "tip4"]],
	]
	for sec in sections:
		var h := UI.label(Lang.a("rules." + sec[0]), 27, UI.ACCENT, true, 4)
		h.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
		h.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		vb.add_child(h)
		for part in sec.slice(1):
			if part[0] == "p":
				vb.add_child(UI.rich(_esc(Lang.a("rules." + part[1]))))
			else:
				for i in range(1, part.size()):
					var mark := "%d." % i if part[0] == "ol" else "•"
					vb.add_child(UI.rich("%s  %s" % [mark, _esc(Lang.a("rules." + part[i]))]))
	var mh := UI.label(Lang.a("rules.modesH"), 27, UI.ACCENT, true, 4)
	mh.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	vb.add_child(mh)
	for m in [["modeBotsLead", "modeBots"], ["modeHotseatLead", "modeHotseat"], ["modeMpLead", "modeMp"]]:
		vb.add_child(UI.rich("•  [b]%s[/b] %s" % [_esc(Lang.a("rules." + m[0])), _esc(Lang.a("rules." + m[1]))]))


static func _esc(t: String) -> String:
	return t.replace("[", "[lb]")
