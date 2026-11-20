class_name AchievementsSheet
extends VBoxContainer
## Achievements (src/achievements/AchievementsPopover.tsx): "N / 97 unlocked",
## one row per track (first step → capstone), tap a badge for what it's for,
## pin an unlocked one to show beside your name in games.

const TIER := [Color(0.62, 0.45, 0.3), Color(0.62, 0.45, 0.3), Color(0.75, 0.78, 0.8), Color(0.95, 0.78, 0.3), Color(0.55, 0.85, 0.95), Color(1.0, 0.55, 0.85)]

var main
var _detail: VBoxContainer
var _selected := ""
var _rows: VBoxContainer


func setup(m) -> void:
	main = m
	add_theme_constant_override("separation", 12)
	var got := Ach.unlocked_count()
	var head := UI.label("%d / %d %s" % [got, Ach.defs.size(), Lang.a("achievements.unlocked")], 28, UI.ACCENT, true, 3)
	add_child(head)
	_detail = VBoxContainer.new()
	_detail.add_theme_constant_override("separation", 8)
	add_child(_detail)
	_rows = VBoxContainer.new()
	_rows.add_theme_constant_override("separation", 10)
	add_child(_rows)
	_paint()


func _paint() -> void:
	for c in _detail.get_children():
		c.queue_free()
	for c in _rows.get_children():
		c.queue_free()
	var got := Ach.unlocked()
	var pin := Ach.featured()
	# Detail of the tapped badge (or the hint).
	if _selected == "":
		_detail.add_child(UI.hint(Lang.a("achievements.detailHint")))
	else:
		var d: Dictionary = Ach.by_id[_selected]
		var earned := got.has(_selected)
		var hidden := bool(d.get("secret", false)) and not earned
		var t := UI.label("%s  %s" % [Ach.icon(_selected) if not hidden else "?", Ach.title(_selected) if not hidden else Lang.a("achievements.hidden")], 26, UI.TEXT, true, 3)
		t.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		_detail.add_child(t)
		_detail.add_child(UI.hint(Ach.desc(_selected) if not hidden else Lang.a("achievements.hiddenReveal")))
		var st := UI.label(Lang.a("achievements.statusUnlocked") if earned else Lang.a("achievements.statusLocked"), 22, UI.ACCENT if earned else UI.TEXT_DIM, true, 2)
		_detail.add_child(st)
		if earned:
			var b := UI.small_button(Lang.a("achievements.featured") if pin == _selected else Lang.a("achievements.pin"), false, 21)
			b.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
			b.tooltip_text = Lang.a("achievements.pinTitle")
			b.pressed.connect(func():
				Ach.set_featured("" if pin == _selected else _selected)
				_paint())
			_detail.add_child(b)
	for tr in Ach.tracks:
		var ids: Array = tr.ids
		var n := ids.filter(func(i): return got.has(i)).size()
		_rows.add_child(UI.section("%s  ·  %d/%d" % [Ach.track_label(str(tr.label)), n, ids.size()]))
		var flow := HFlowContainer.new()
		flow.add_theme_constant_override("h_separation", 8)
		flow.add_theme_constant_override("v_separation", 8)
		_rows.add_child(flow)
		for i in ids.size():
			flow.add_child(_badge(str(ids[i]), got.has(ids[i]), i == ids.size() - 1, pin))


func _badge(id: String, earned: bool, capstone: bool, pin: String) -> Button:
	var d: Dictionary = Ach.by_id.get(id, {})
	var hidden := bool(d.get("secret", false)) and not earned
	var b := Button.new()
	b.focus_mode = Control.FOCUS_NONE
	var d_px := 78 if capstone else 66
	b.custom_minimum_size = Vector2(d_px, d_px)
	b.text = "?" if hidden else Ach.icon(id)
	b.add_theme_font_size_override("font_size", 34 if capstone else 28)
	b.tooltip_text = Lang.a("achievements.nodeTitle", [Ach.title(id) if not hidden else Lang.a("achievements.secret"), Lang.a("achievements.statusUnlocked") if earned else Lang.a("achievements.statusLocked")])
	var sb := StyleBoxFlat.new()
	sb.set_corner_radius_all(int(d_px / 2.0))
	sb.bg_color = Color(0.06, 0.2, 0.11, 0.95) if earned else Color(0.02, 0.06, 0.04, 0.85)
	sb.set_border_width_all(4 if id == _selected or id == pin else 2)
	var tier := clampi(int(d.get("tier", 1)), 1, 5)
	sb.border_color = UI.ACCENT if id == _selected else (UI.GOLD if id == pin else (TIER[tier] if earned else Color(1, 1, 1, 0.15)))
	for st in ["normal", "hover", "pressed"]:
		b.add_theme_stylebox_override(st, sb)
	b.modulate = Color.WHITE if earned else Color(1, 1, 1, 0.35)
	b.pressed.connect(func():
		_selected = id
		_paint())
	return b
