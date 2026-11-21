class_name RankingsSheet
extends VBoxContainer
## Rankings (src/components/RankingsPopover.tsx): "Global Elo" (top 50 from the
## `leaderboard` view) and "Local" (this device's per-name records from
## Store.stats, shape filter, sortable, tap a name for head-to-head, delete).

const PLACEMENT_TOTAL := 10
const AI_PREFIX := "ai:"

var main  # main.gd, for confirm()
var view := "local"
var shape := "all"
var sort_key := "games"
var sort_desc := true
var stack: Array = []  # [{kind: "player"|"ai", key, name, level}]
var _body: VBoxContainer
var _tagline: Label


func setup(m, start_view: String) -> void:
	main = m
	view = start_view
	add_theme_constant_override("separation", 12)
	_tagline = UI.hint("")
	add_child(_tagline)
	_body = VBoxContainer.new()
	_body.add_theme_constant_override("separation", 8)
	add_child(_body)
	_render()


## System back inside the sheet: pop the head-to-head stack first.
func back() -> bool:
	if stack.is_empty():
		return false
	stack.pop_back()
	_render()
	return true


func _render() -> void:
	for c in _body.get_children():
		c.queue_free()
	if not stack.is_empty():
		_h2h(stack[-1])
		return
	_tagline.text = Lang.a("rankings.globalTagline" if view == "global" else "rankings.localTagline")
	_pills(_body, [["global", Lang.a("rankings.globalElo")], ["local", Lang.a("rankings.local")]], view, func(v: String):
		view = v
		_render())
	if view == "global":
		_global()
	else:
		_local()


func _pills(parent: Control, items: Array, active: String, on_pick: Callable) -> void:
	var row := HFlowContainer.new()
	row.add_theme_constant_override("h_separation", 8)
	row.add_theme_constant_override("v_separation", 8)
	parent.add_child(row)
	for it in items:
		var b := UI.plain_button(it[1], false, 22)
		b.autowrap_mode = TextServer.AUTOWRAP_OFF
		b.custom_minimum_size = Vector2(0, 56)
		if it[0] == active:
			b.add_theme_color_override("font_color", UI.ACCENT)
			var sb := StyleBoxFlat.new()
			sb.bg_color = Look.tone(Color(0.08, 0.25, 0.14, 0.95))
			sb.border_color = UI.ACCENT
			sb.set_border_width_all(2)
			sb.set_corner_radius_all(16)
			sb.content_margin_left = 16
			sb.content_margin_right = 16
			for st in ["normal", "hover", "pressed"]:
				b.add_theme_stylebox_override(st, sb)
		b.pressed.connect(on_pick.bind(it[0]))
		row.add_child(b)


## A table: header cells (text or [text, sort_key]) then rows of cells; a cell
## can be a Callable-carrying [text, callable] to make it a link.
func _table(head: Array, rows: Array, widths: Array, on_sort := Callable(), active := "") -> void:
	var grid := GridContainer.new()
	grid.columns = head.size()
	grid.add_theme_constant_override("h_separation", 10)
	grid.add_theme_constant_override("v_separation", 6)
	_body.add_child(grid)
	for i in head.size():
		var h = head[i]
		if h is Array:
			var b := Button.new()
			b.flat = true
			b.focus_mode = Control.FOCUS_NONE
			b.text = ("%s %s" % [h[0], ("▼" if sort_desc else "▲") if h[1] == active else "↕"]).to_upper()
			b.add_theme_font_override("font", UI.font(true))
			b.add_theme_font_size_override("font_size", UI.BTN_S)
			b.add_theme_color_override("font_color", UI.ACCENT if h[1] == active else UI.TEXT_DIM)
			b.custom_minimum_size = Vector2(widths[i], 0)
			b.pressed.connect(on_sort.bind(h[1]))
			grid.add_child(b)
		else:
			var l := UI.label(str(h), 19, UI.TEXT_DIM, true, 2)
			l.custom_minimum_size = Vector2(widths[i], 0)
			grid.add_child(l)
	for r in rows:
		for i in r.size():
			var c = r[i]
			if c is Array:
				var b := Button.new()
				b.flat = true
				b.focus_mode = Control.FOCUS_NONE
				b.text = str(c[0])
				b.alignment = HORIZONTAL_ALIGNMENT_LEFT
				b.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
				b.clip_text = true
				b.add_theme_font_override("font", UI.font(false))
				b.add_theme_font_size_override("font_size", 22)
				b.add_theme_color_override("font_color", UI.ACCENT)
				b.custom_minimum_size = Vector2(widths[i], 0)
				b.size_flags_horizontal = Control.SIZE_EXPAND_FILL if i == 1 or widths[i] > 150 else 0
				b.pressed.connect(c[1])
				grid.add_child(b)
			else:
				var l := UI.label(str(c), 22, UI.TEXT if i != 0 else UI.TEXT_DIM, false, 2)
				l.custom_minimum_size = Vector2(widths[i], 0)
				l.clip_text = true
				l.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
				if widths[i] > 150:
					l.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
					l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
				grid.add_child(l)


static func _pct(part: int, total: int) -> String:
	return "—" if total <= 0 else "%d%%" % roundi(100.0 * part / total)


static func _win_pct(r: Dictionary) -> float:
	return -1.0 if r.games == 0 else float(r.wins) / r.games


# ---------------------------------------------------------------- local

func _stats_for(row: Dictionary) -> Dictionary:
	var out := {"wins": 0, "draws": 0, "losses": 0}
	for m in [row.get("vsAI", {}), row.get("hotseat", {})]:
		var by: Dictionary = m.get("byShape", {}) if m is Dictionary else {}
		var src: Dictionary = Store.total(by) if shape == "all" else by.get(shape, {})
		for f in out:
			out[f] += int(src.get(f, 0))
	return out


func _local() -> void:
	var items := [["all", Lang.a("rankings.all")]]
	for sh in BoardDef.SHAPES:
		items.append([sh, Lang.t("shape_" + sh)])
	_pills(_body, items, shape, func(v: String):
		shape = v
		_render())
	var rows := []
	for key in Store.stats.players:
		var row: Dictionary = Store.stats.players[key]
		var st := _stats_for(row)
		var games: int = st.wins + st.draws + st.losses
		if games > 0:
			rows.append({"key": key, "name": str(row.get("name", key)), "games": games, "wins": st.wins, "draws": st.draws, "losses": st.losses})
	if rows.is_empty():
		_body.add_child(UI.hint(Lang.a("rankings.emptyLocalAll") if shape == "all" else Lang.a("rankings.emptyLocalShape", [Lang.t("shape_" + shape)])))
		return
	rows.sort_custom(func(a, b):
		var va: float = a.games if sort_key == "games" else _win_pct(a)
		var vb: float = b.games if sort_key == "games" else _win_pct(b)
		if va != vb:
			return va > vb if sort_desc else va < vb
		if a.games != b.games:
			return a.games > b.games
		return a.name < b.name)
	var cells := []
	for i in rows.size():
		var r: Dictionary = rows[i]
		cells.append([i + 1, [Store.display_name(r.name), _open.bind({"kind": "player", "key": r.key, "name": r.name})],
			r.games, r.wins, r.losses, r.draws, _pct(r.wins, r.games)])
	_table([Lang.a("rankings.colRank"), Lang.a("rankings.colPlayer"), [Lang.a("rankings.colGames"), "games"],
		Lang.a("common.w"), Lang.a("common.l"), Lang.a("common.d"), [Lang.a("rankings.colWinPct"), "winPct"]],
		cells, [34, 180, 90, 40, 40, 40, 100], _sort, sort_key)


func _sort(key: String) -> void:
	sort_desc = not sort_desc if sort_key == key else true
	sort_key = key
	_render()


func _open(subject: Dictionary) -> void:
	stack.append(subject)
	sort_key = "games"
	sort_desc = true
	_render()


func _bot_name(level: int) -> String:
	return Lang.a("sidePanel.botLabel", [Lang.a("difficulty.%d" % level)])


func _h2h(subj: Dictionary) -> void:
	_tagline.text = Lang.a("rankings.h2hTagline")
	var head := UI.label("%s  ·  %s" % [Store.display_name(subj.name), Lang.a("rankings.aiOpponent") if subj.kind == "ai" else Lang.a("rankings.player")], 28, UI.ACCENT, true, 4)
	head.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_body.add_child(head)
	var back_btn := UI.plain_button("‹ " + Lang.a("rankings.back"), false, 22)
	back_btn.autowrap_mode = TextServer.AUTOWRAP_OFF
	back_btn.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	back_btn.pressed.connect(back)
	_body.add_child(back_btn)
	var rows := []
	if subj.kind == "player":
		var row: Dictionary = Store.stats.players.get(subj.key, {})
		var opp: Dictionary = row.get("byOpponent", {})
		for k in opp:
			var bk: Dictionary = opp[k]
			var g := int(bk.get("wins", 0)) + int(bk.get("draws", 0)) + int(bk.get("losses", 0))
			if g == 0:
				continue
			var is_ai := str(k).begins_with(AI_PREFIX)
			var lvl := str(k).trim_prefix(AI_PREFIX).to_int() if is_ai else 0
			var nm: String = _bot_name(lvl) if is_ai else str(Store.stats.players.get(k, {}).get("name", k))
			rows.append({"key": k, "name": nm, "ai": is_ai, "level": lvl, "games": g,
				"wins": int(bk.get("wins", 0)), "draws": int(bk.get("draws", 0)), "losses": int(bk.get("losses", 0))})
	else:
		var key := AI_PREFIX + str(subj.level)
		for k in Store.stats.players:
			var r: Dictionary = Store.stats.players[k]
			var bk: Dictionary = r.get("byOpponent", {}).get(key, {})
			var g := int(bk.get("wins", 0)) + int(bk.get("draws", 0)) + int(bk.get("losses", 0))
			if g > 0:
				# Seen from the bot's side: the player's wins are its losses.
				rows.append({"key": k, "name": str(r.get("name", k)), "ai": false, "level": 0, "games": g,
					"wins": int(bk.get("losses", 0)), "draws": int(bk.get("draws", 0)), "losses": int(bk.get("wins", 0))})
	if not rows.is_empty():
		var t := {"games": 0, "wins": 0, "losses": 0, "draws": 0}
		for r in rows:
			for f in t:
				t[f] += r[f]
		_body.add_child(UI.rich("[b]%d[/b] %s  ·  [b]%d[/b]%s / [b]%d[/b]%s / [b]%d[/b]%s  ·  [b]%s[/b] %s" % [
			t.games, Lang.a("rankings.summaryGames"), t.wins, Lang.a("common.w"), t.losses, Lang.a("common.l"),
			t.draws, Lang.a("common.d"), _pct(t.wins, t.games), Lang.a("rankings.winRate")]))
	if subj.kind == "player":
		var del := UI.plain_button(Lang.a("rankings.deleteProfile"), true, 22)
		del.autowrap_mode = TextServer.AUTOWRAP_OFF
		del.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
		del.pressed.connect(_confirm_delete.bind(subj.name))
		_body.add_child(del)
	if rows.is_empty():
		_body.add_child(UI.hint(Lang.a("rankings.noH2H")))
		return
	rows.sort_custom(func(a, b):
		if a.games != b.games:
			return a.games > b.games
		return a.name < b.name)
	var cells := []
	for r in rows:
		var subj2 := {"kind": "ai", "key": r.key, "name": r.name, "level": r.level} if r.ai else {"kind": "player", "key": r.key, "name": r.name}
		cells.append([[Store.display_name(r.name), _open.bind(subj2)], r.games, r.wins, r.losses, r.draws, _pct(r.wins, r.games)])
	_table([Lang.a("rankings.colOpponent"), Lang.a("rankings.colGames"), Lang.a("common.w"), Lang.a("common.l"),
		Lang.a("common.d"), Lang.a("rankings.colWinPctShort")], cells, [200, 90, 40, 40, 40, 80])


func _confirm_delete(n: String) -> void:
	var text := "%s\n%s\n\n%s" % [Lang.a("rankings.deleteTitle"), Lang.a("rankings.deleteBody", [Store.display_name(n)]), Lang.a("rankings.deleteConfirm2")]
	main.confirm(text, func():
		Store.delete_player(n)
		main.show_rankings(view), func(): main.show_rankings(view), Lang.a("rankings.deleteProfile"), Lang.a("rankings.cancel"))


# ---------------------------------------------------------------- global

func _global() -> void:
	if not Supa.signed_in():
		_body.add_child(UI.hint(Lang.a("rankings.signInPrompt")))
		var b := UI.plain_button(Lang.a("rankings.signIn"))
		b.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		b.pressed.connect(main.sign_in)
		_body.add_child(b)
		return
	var loading := UI.hint("…")
	_body.add_child(loading)
	var res: Dictionary = await Supa.http(HTTPClient.METHOD_GET, "/rest/v1/leaderboard?select=*&order=rating.desc&limit=50")
	if not is_inside_tree() or view != "global" or not stack.is_empty():
		return
	loading.queue_free()
	if not res.ok or not res.data is Array:
		_body.add_child(UI.hint(Lang.a("rankings.loadError")))
		var retry := UI.plain_button(Lang.a("rankings.tryAgain"))
		retry.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		retry.pressed.connect(_render)
		_body.add_child(retry)
		return
	if res.data.is_empty():
		_body.add_child(UI.hint(Lang.a("rankings.emptyGlobal")))
		return
	var me := Online.me()
	var cells := []
	for i in res.data.size():
		var r: Dictionary = res.data[i]
		var nm := str(r.get("display_name", "Player"))
		var placed := int(r.get("placement_games_played", 0)) if r.get("placement_games_played") != null else 0
		var bot: bool = r.get("is_bot") == true
		if bot:
			nm += "  [" + Lang.a("matchFound.bot") + "]"
		elif placed < PLACEMENT_TOTAL:
			nm += "  · " + Lang.a("profile.provisional", [placed, PLACEMENT_TOTAL])
		if str(r.get("uid", "")) == me:
			nm += "  (" + Lang.a("rankings.you") + ")"
		cells.append([i + 1, int(r.get("rating", 1000)) if r.get("rating") != null else 1000, nm, placed])
	_table([Lang.a("rankings.colRank"), Lang.a("rankings.colElo"), Lang.a("rankings.colPlayer"), Lang.a("rankings.colGames")],
		cells, [40, 80, 300, 80])
