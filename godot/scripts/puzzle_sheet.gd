class_name PuzzleSheet
extends VBoxContainer
## Daily results (src/components/PuzzleLeaderboardPopover.tsx): a month grid
## with each day's winning score (👑 on days you won); tap a day for everyone
## who finished it, best first. Months and days are UTC.

var month := ""
var selected := ""
var first := ""
var _cache := {}
var _grid_box: VBoxContainer
var _detail: VBoxContainer
var _title: Label
var _prev: Button
var _next: Button


func setup() -> void:
	add_theme_constant_override("separation", 12)
	add_child(UI.hint(Lang.a("puzzleBoard.tagline")))
	var nav := HBoxContainer.new()
	nav.alignment = BoxContainer.ALIGNMENT_CENTER
	nav.add_theme_constant_override("separation", 20)
	add_child(nav)
	_prev = _arrow("‹", -1)
	nav.add_child(_prev)
	_title = UI.label("", 28, UI.TEXT, true, 3)
	_title.custom_minimum_size = Vector2(260, 0)
	nav.add_child(_title)
	_next = _arrow("›", 1)
	nav.add_child(_next)
	_grid_box = VBoxContainer.new()
	add_child(_grid_box)
	_detail = VBoxContainer.new()
	_detail.add_theme_constant_override("separation", 6)
	add_child(_detail)
	month = Daily.today_key().left(7)
	selected = Daily.today_key()
	_load()
	first = await Daily.first_month()
	if is_inside_tree():
		_paint()


func _arrow(t: String, delta: int) -> Button:
	var b := Button.new()
	b.flat = true
	b.text = t
	b.focus_mode = Control.FOCUS_NONE
	b.add_theme_font_override("font", UI.font(true))
	b.add_theme_font_size_override("font_size", 52)
	b.add_theme_color_override("font_color", UI.TEXT)
	b.add_theme_color_override("font_disabled_color", Color(1, 1, 1, 0.15))
	b.pressed.connect(func(): _go(delta))
	return b


func _go(delta: int) -> void:
	var y := int(month.left(4))
	var m := int(month.substr(5, 2)) + delta
	if m < 1:
		m = 12
		y -= 1
	elif m > 12:
		m = 1
		y += 1
	month = "%04d-%02d" % [y, m]
	selected = Daily.today_key() if month == Daily.today_key().left(7) else ""
	_load()


func _load() -> void:
	_paint()
	if _cache.has(month) and not _cache[month].is_empty():
		return
	var want := month
	_cache.erase(want)
	var data: Dictionary = await Daily.fetch_month(want)
	_cache[want] = data
	if is_inside_tree() and month == want:
		if selected == "" and not data.is_empty():
			var days: Array = data.results.keys()
			days.sort()
			if not days.is_empty():
				selected = days[-1]
		_paint()


static func _month_name(m: String) -> String:
	return "%s %s" % [Lang.a("changelog.months.%d" % (int(m.substr(5, 2)) - 1)), m.left(4)]


func _paint() -> void:
	var today := Daily.today_key()
	_title.text = _month_name(month)
	_prev.disabled = first == "" or month <= first
	_next.disabled = month >= today.left(7)
	for c in _grid_box.get_children():
		c.queue_free()
	for c in _detail.get_children():
		c.queue_free()
	var data: Dictionary = _cache.get(month, {})
	var loaded := _cache.has(month) and not data.is_empty()
	var me := Online.me() if Supa.signed_in() else ""
	var grid := GridContainer.new()
	grid.columns = 7
	grid.add_theme_constant_override("h_separation", 6)
	grid.add_theme_constant_override("v_separation", 6)
	_grid_box.add_child(grid)
	var y := int(month.left(4))
	var mo := int(month.substr(5, 2))
	var first_dow: int = Time.get_datetime_dict_from_datetime_string(month + "-01T00:00:00", true).weekday
	var lead := (first_dow + 6) % 7  # Monday first
	for i in lead:
		var sp := Control.new()
		sp.custom_minimum_size = Vector2(80, 70)
		grid.add_child(sp)
	for d in range(1, Daily._days_in(y, mo) + 1):
		var day := "%s-%02d" % [month, d]
		var res: Array = data.results.get(day, []) if loaded else []
		var winner: Dictionary = res[0] if not res.is_empty() else {}
		var mine: bool = res.any(func(r): return r.uid == me)
		var won: bool = not winner.is_empty() and winner.uid == me
		var b := Button.new()
		b.focus_mode = Control.FOCUS_NONE
		b.custom_minimum_size = Vector2(80, 70)
		b.disabled = day > today
		b.text = "%d\n%s" % [d, "👑" if won else (str(winner.best) if not winner.is_empty() else "")]
		b.add_theme_font_override("font", UI.font(true))
		b.add_theme_font_size_override("font_size", 19)
		var sb := StyleBoxFlat.new()
		sb.set_corner_radius_all(12)
		sb.bg_color = Look.tone(Color(0.08, 0.25, 0.14, 0.9)) if not res.is_empty() else Look.tone(Color(0.02, 0.07, 0.04, 0.8))
		sb.set_border_width_all(3 if day == selected else (2 if day == today or mine else 0))
		sb.border_color = UI.ACCENT if day == selected else (UI.GOLD if mine else Color(1, 1, 1, 0.35))
		for st in ["normal", "hover", "pressed", "disabled"]:
			b.add_theme_stylebox_override(st, sb)
		b.add_theme_color_override("font_color", UI.TEXT)
		b.add_theme_color_override("font_disabled_color", Color(1, 1, 1, 0.25))
		b.pressed.connect(func():
			selected = day
			_paint())
		grid.add_child(b)
	if not _cache.has(month):
		_detail.add_child(UI.hint(Lang.a("puzzleBoard.loading")))
		return
	if data.is_empty():
		_detail.add_child(UI.hint(Lang.a("puzzleBoard.loadError")))
		var retry := UI.plain_button(Lang.a("puzzleBoard.retry"), false, 22)
		retry.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		retry.pressed.connect(func():
			_cache.erase(month)
			_load())
		_detail.add_child(retry)
		return
	if selected == "":
		return
	var list: Array = data.results.get(selected, [])
	var head := Lang.a("puzzleBoard.today") + "  · " + Lang.a("puzzleBoard.live") if selected == today else "%d %s" % [int(selected.right(2)), _month_name(selected.left(7))]
	if not list.is_empty():
		head += "  ·  " + Lang.a("puzzleBoard.players", [list.size()])
	_detail.add_child(UI.section(head))
	if data.defs.has(selected):
		var df: Dictionary = data.defs[selected]
		_detail.add_child(UI.hint(Lang.a("puzzleBoard.dayInfo", [Lang.t("shape_" + df.shape), Lang.a("difficulty.%d" % df.level)])))
	if list.is_empty():
		_detail.add_child(UI.hint(Lang.a("puzzleBoard.todayEmpty") if selected == today else Lang.a("puzzleBoard.dayEmpty")))
		return
	for i in list.size():
		var r: Dictionary = list[i]
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 12)
		var rank := UI.label("👑" if i == 0 else str(i + 1), 22, UI.TEXT_DIM, true, 2)
		rank.custom_minimum_size = Vector2(44, 0)
		row.add_child(rank)
		var nm := UI.label(r.name + (Lang.a("puzzleBoard.you") if r.uid == me else ""), 22, UI.ACCENT if r.uid == me else UI.TEXT, false, 2)
		nm.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
		nm.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		nm.clip_text = true
		nm.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
		row.add_child(nm)
		row.add_child(UI.label(str(r.best), 24, UI.TEXT, true, 2))
		_detail.add_child(row)
