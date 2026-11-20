class_name GameView
extends Control
## One match: HUD, painted board, input, bot turns and all the juice
## (dot pops, growing strikes, sparks, flying score, shake, callouts).

signal exit_requested
signal back_requested
signal rematch_requested
signal settings_requested
signal howto_requested
signal play_requested(shape: String, level: int)

var BRIGHT: Array = Look.bright
## Hot-seat "swap colours": player 1 plays with player 2's dots and vice versa.
var swap := false
## Display names for players 1 and 2 (hot-seat / vs-AI); empty = defaults.
var names := ["", "", ""]
## "ai" | "hotseat" | "daily" | "online" | "coach"
var mode := "ai"
var finished_reason := ""
## The first-game lesson driving this board (mode "coach").
var coach: Coach
## Daily puzzle: the player's 3-minute clock (runs only on their turn).
var daily_left := Daily.CLOCK_S
var _clock_prev := 0
signal daily_again
signal lobby_requested
signal puzzle_board_requested
var _coach_text: Label
var claims := 0
var STRIKE_OUTER: Array = Look.strike_outer
var STRIKE_INNER: Array = Look.strike_inner
var WAIT_COL: Color = Look.pending_col

var shape := "triangle"
var level := 3  # 0 = hot-seat
var auto_p1 := false  # demo mode: a bot plays P1 too
var bot_speed := 1.0

var b: BoardDef
var s: GState
var busy := true
var unit := 80.0
var r := 28.0
var hover_dot := -1
var aim_dot := -1
var last_dot := -1
var thinking := false
var shake := 0.0
var shown_score := [0.0, 0.0, 0.0]
var shown_left := 0.0
var _time := 0.0

var holder: Control
var board: Node2D
var holes: Node2D
var pending_layer: Node2D
var strike_layer: Node2D
var dot_layer: Node2D
var overlay_layer: Node2D
var float_layer: Control
var dot_sprites: Array[Sprite2D] = []
var _front_fire: Node2D
const FLAME_TOP := 112.0  # visible flame tip above the fire's origin (campfire.gd)
var cards: Array = [null, {}, {}]
var left_label: Label
var waiting_label: Label
var think_dots: Array[Label] = []

# Online (ranked) mode: the server is authoritative, moves arrive via Online.
var online := false
var my_slot := 1
var opp := {}
var _clock := {}
var _status := "active"
var _latest := {}
var _loaded_marked := false
var _last_claim := 0.0
var _resign_armed := -10.0
var _result: Dictionary = {}
var _toast_label: Label
var tree := false  # Christmas Triangle: the painted tree is the board, apex up

# Painted Christmas board art, source pixels (src/themeArt.ts).
const TREE_SIZE := Vector2(883, 989)
const TREE_AXIS := 441.0
const TREE_TOP := 231.0
const TREE_BOTTOM := 806.0
const WREATH_W := 987.0
const WREATH_CAPS := [207.0, 203.0, 205.0, 207.0]  # left, top, right, bottom


class DrawLayer extends Node2D:
	var fn: Callable
	func _draw() -> void:
		fn.call(self)


func setup(p_shape: String, p_level: int) -> void:
	shape = p_shape
	level = p_level
	b = BoardDef.get_board(shape)
	tree = Look.xmas() and shape == "triangle"
	s = GState.create(b)
	shown_left = b.total_points


func setup_online(pairing: Dictionary, row: Dictionary) -> void:
	online = true
	mode = "online"
	opp = pairing
	my_slot = int(pairing.get("player", 1))
	level = -1
	setup(str(row.get("shape", pairing.get("shape", "triangle"))), -1)
	level = -1
	if row.get("state") is Dictionary:
		s = GState.from_json(b, row.state)
	_clock = row.get("clock", {}) if row.get("clock") is Dictionary else {}
	_status = str(row.get("status", "active"))
	shown_left = s.points_left(b)
	shown_score = [0.0, float(s.scores[1]), float(s.scores[2])]
	Online.game_changed.connect(_on_server)
	Online.match_record.connect(_on_match_record)


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	_build_hud()
	holder = Control.new()
	holder.mouse_filter = Control.MOUSE_FILTER_IGNORE
	holder.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(holder)
	move_child(holder, 0)
	board = Node2D.new()
	holder.add_child(board)
	float_layer = Control.new()
	float_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	float_layer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(float_layer)
	resized.connect(_layout)
	_layout.call_deferred()
	_intro.call_deferred()


# ---------------------------------------------------------------- HUD

func _build_hud() -> void:
	var back := _round_button("‹")
	back.position = Vector2(24, 28)
	back.pressed.connect(_on_back)
	add_child(back)
	# One settings button (How to play, sounds, language, theme) like most
	# mobile games; the sheet is the same one the menu opens.
	if coach:
		var skip := UI.art_button(Lang.a("coach.skip"), UI.PILL_BTN, 180, 76, 24)
		skip.set_anchors_preset(Control.PRESET_TOP_RIGHT)
		_offsets(skip, -204, 32, -24, 108)
		skip.pressed.connect(_on_back)
		add_child(skip)
		_build_coach_bubble()
	var gear := _round_button("")
	gear.visible = coach == null
	var cog := DrawLayer.new()
	cog.position = Vector2(42, 42)
	cog.fn = func(n: Node2D):
		UI.draw_gear(n, Vector2.ZERO, 17.0, UI.TEXT)
	gear.add_child(cog)
	gear.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	_offsets(gear, -108, 28, -24, 112)
	gear.pressed.connect(func(): settings_requested.emit())
	add_child(gear)
	var help := _round_button("?")
	help.visible = coach == null
	help.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	_offsets(help, -200, 28, -116, 112)
	help.pressed.connect(func(): howto_requested.emit())
	add_child(help)

	var banner := PanelContainer.new()
	banner.add_theme_stylebox_override("panel", UI.art_box(UI.BANNER, 92))
	banner.set_anchors_preset(Control.PRESET_CENTER_TOP)
	banner.custom_minimum_size = Vector2(300, 92)
	_offsets(banner, -150, 22, 150, 114)
	left_label = UI.label("", 30, UI.TEXT)
	left_label.clip_text = true
	banner.add_child(left_label)
	add_child(banner)
	banner.visible = coach == null  # one number too many while learning
	waiting_label = UI.label("", 22, WAIT_COL, false, 5)
	waiting_label.set_anchors_preset(Control.PRESET_CENTER_TOP)
	_offsets(waiting_label, -300, 118, 300, 150)
	add_child(waiting_label)

	var row := HBoxContainer.new()
	row.set_anchors_preset(Control.PRESET_TOP_WIDE)
	_offsets(row, 20, 160, -20, 310)
	row.add_theme_constant_override("separation", 16)
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(row)
	for p in [1, 2]:
		row.add_child(_make_card(p))


func _offsets(c: Control, l: float, t: float, r_: float, b_: float) -> void:
	c.offset_left = l
	c.offset_top = t
	c.offset_right = r_
	c.offset_bottom = b_


func _round_button(glyph: String) -> TextureButton:
	var t := TextureButton.new()
	t.texture_normal = UI.scaled_tex("icon-button.webp", 84)
	t.ignore_texture_size = true
	t.stretch_mode = TextureButton.STRETCH_KEEP_ASPECT_CENTERED
	t.custom_minimum_size = Vector2(84, 84)
	t.size = Vector2(84, 84)
	var l := UI.label(glyph, 40, UI.TEXT)
	l.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	t.add_child(l)
	UI.juicy(t)
	return t


func _sk(p) -> int:
	return (3 - int(p)) if swap and int(p) in [1, 2] else int(p)


func _player_name(p: int) -> String:
	if online:
		if p == my_slot:
			return Online.display_name()
		return str(opp.get("opponent_display_name", Lang.t("opponent")))
	if names[p] != "":
		return names[p]
	if level == 0:
		return Look.colour_name(_sk(p))
	if p == 1:
		return Lang.t("bot") if auto_p1 else Lang.t("you")
	return Lang.t("bot_named", [Lang.t("level_%d" % level)])


func _make_card(p: int) -> Control:
	var wrap := Control.new()
	wrap.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	wrap.custom_minimum_size = Vector2(0, 150)
	wrap.mouse_filter = Control.MOUSE_FILTER_IGNORE

	var glow := Panel.new()
	var gsb := StyleBoxFlat.new()
	gsb.bg_color = Color(BRIGHT[_sk(p)], 0.10)
	gsb.set_corner_radius_all(28)
	gsb.shadow_color = Color(BRIGHT[_sk(p)], 0.55)
	gsb.shadow_size = 26
	glow.add_theme_stylebox_override("panel", gsb)
	glow.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	glow.mouse_filter = Control.MOUSE_FILTER_IGNORE
	wrap.add_child(glow)

	var card := PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.03, 0.09, 0.06, 0.82)
	sb.set_corner_radius_all(26)
	sb.set_border_width_all(3)
	sb.border_color = Color(BRIGHT[_sk(p)], 0.55)
	sb.content_margin_left = 14
	sb.content_margin_right = 14
	sb.content_margin_top = 10
	sb.content_margin_bottom = 10
	card.add_theme_stylebox_override("panel", sb)
	card.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	card.mouse_filter = Control.MOUSE_FILTER_IGNORE
	wrap.add_child(card)

	var hb := HBoxContainer.new()
	hb.add_theme_constant_override("separation", 10)
	hb.alignment = BoxContainer.ALIGNMENT_CENTER
	card.add_child(hb)
	var av := TextureRect.new()
	var bot := (p == 2 and level > 0) or (p == 1 and auto_p1)
	var bot_level := level if p == 2 else 3
	if online:
		bot = p != my_slot and opp.get("opponent_is_bot", false)
		bot_level = clampi(int(opp.get("opponent_bot_level", 3)) if opp.get("opponent_bot_level") != null else 3, 1, 5)
	av.texture = UI.tex("avatar-l%d.webp" % bot_level if bot else "avatar-human.webp")
	av.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	av.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	av.custom_minimum_size = Vector2(92, 92)
	var vb := VBoxContainer.new()
	vb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vb.add_theme_constant_override("separation", -6)
	# The pinned achievement sits beside the local player's name (App.tsx myFeatured).
	var mine := (online and p == my_slot) or (not online and not auto_p1 and mode != "coach" and p == 1)
	var pin := Ach.featured() if mine else ""
	var name_l := UI.label(_player_name(p) + ("  " + Ach.icon(pin) if pin != "" else ""), 26, UI.TEXT, false, 5)
	name_l.clip_text = true
	name_l.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	var score_l := UI.label("0", 64, BRIGHT[_sk(p)], true, 10)
	score_l.resized.connect(func(): score_l.pivot_offset = score_l.size / 2.0)
	vb.add_child(name_l)
	vb.add_child(score_l)
	var clock_l := UI.label("", 26, UI.TEXT, true, 5)
	clock_l.visible = online or (mode == "daily" and p == 1)
	clock_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT if p == 1 else HORIZONTAL_ALIGNMENT_RIGHT
	vb.add_child(clock_l)
	# Colour chip so each side's dot colour is obvious.
	var chip := TextureRect.new()
	chip.texture = UI.tex("dot-p%d.webp" % _sk(p))
	chip.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	chip.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	chip.custom_minimum_size = Vector2(30, 30)
	chip.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	if p == 1:
		hb.add_child(av)
		hb.add_child(vb)
		hb.add_child(chip)
		name_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
		score_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	else:
		hb.add_child(chip)
		hb.add_child(vb)
		hb.add_child(av)
		name_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		score_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT

	var think := HBoxContainer.new()
	think.alignment = BoxContainer.ALIGNMENT_CENTER
	think.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	_offsets(think, -50, 2, 50, 34)
	think.visible = false
	for i in 3:
		var d := UI.label("●", 22, BRIGHT[_sk(p)], true, 4)
		think.add_child(d)
		if p == 2 or auto_p1:
			think_dots.append(d)
	wrap.add_child(think)
	wrap.resized.connect(func(): wrap.pivot_offset = wrap.size / 2.0)
	score_l.text = str(s.scores[p])
	cards[p] = {"wrap": wrap, "glow": glow, "score": score_l, "think": think, "avatar": av, "clock": clock_l}
	return wrap


func _update_hud() -> void:
	var left := s.points_left(b)
	var set_left := func(v: float):
		shown_left = v
		left_label.text = Lang.n("points_left", int(round(v)))
		var f := left_label.get_theme_font("font")
		var fs := 30
		while fs > 16 and f.get_string_size(left_label.text, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x > 215:
			fs -= 1
		left_label.add_theme_font_size_override("font_size", fs)
	create_tween().tween_method(set_left, shown_left, float(left), 0.5)
	var n := s.pending.size()
	waiting_label.text = "" if n == 0 else Lang.n("lines_waiting", n)


func _roll_score(p: int) -> void:
	var lbl: Label = cards[p].score
	var set_score := func(v: float):
		shown_score[p] = v
		lbl.text = str(int(round(v)))
	create_tween().tween_method(set_score, shown_score[p], float(s.scores[p]), 0.45)
	var pt := create_tween()
	lbl.scale = Vector2(1.45, 1.45)
	pt.tween_property(lbl, "scale", Vector2.ONE, 0.5).set_trans(Tween.TRANS_ELASTIC).set_ease(Tween.EASE_OUT)


# ---------------------------------------------------------------- layout

func _layout() -> void:
	if b == null or size.x <= 0:
		return
	var top := 250.0 if tree else 330.0
	var area := Rect2(24, top, size.x - 48, size.y - top - 40)
	var bw := b.bounds.size.x + 1.4
	var bh := b.bounds.size.y + 1.4
	var shift := 0.0
	if tree:
		var ku := b.bounds.size.y / (TREE_BOTTOM - TREE_TOP)
		# The outer branch tips may run a little past the screen edge, so the
		# tree (and its dots) can be bigger.
		bw = maxf(bw, TREE_SIZE.x * ku / 1.18)
		bh = TREE_SIZE.y * ku
		shift = -b.bounds.size.y / 2.0 + (TREE_SIZE.y / 2.0 - TREE_TOP) * ku
	elif _wreath():
		bw = b.bounds.size.x + 2.8
		bh = b.bounds.size.y + 2.8
	unit = min(area.size.x / bw, area.size.y / bh, 130.0)
	var cy := area.get_center().y
	# The campfire stays in its painted fireplace; the tree makes room instead,
	# so no flame ever reaches the bottom baubles (they'd hide the tips).
	if tree and is_instance_valid(Look.fire):
		var flame_top: float = Look.fire.global_position.y - global_position.y - FLAME_TOP * Look.fire.global_scale.y - 6.0
		var tree_top := cy - bh / 2.0 * unit
		var reach := bh / 2.0 + b.bounds.size.y / 2.0 + 0.36 - shift  # tree top → bottom of last row, in units
		if tree_top + reach * unit > flame_top:
			# First use the free space under the score cards, then shrink.
			var lift := minf(tree_top + reach * unit - flame_top, tree_top - (top - 50.0))
			tree_top -= maxf(lift, 0.0)
			if tree_top + reach * unit > flame_top and flame_top > tree_top:
				unit = maxf(unit * 0.7, (flame_top - tree_top) / reach)
			cy = tree_top + bh / 2.0 * unit
	r = unit * 0.36
	board.position = Vector2(area.get_center().x, cy) - Vector2(0, shift * unit)
	_rebuild_board()


func _wreath() -> bool:
	return Look.xmas() and shape != "triangle"


func px(d: int) -> Vector2:
	var v := (b.pos[d] - b.bounds.get_center()) * unit
	if tree:
		v.y = -v.y
	return v


func line_ends(li: int) -> Array:
	var ids := b.lines[li]
	var a := px(ids[0])
	var e := px(ids[ids.size() - 1])
	if ids.size() == 1:
		var dir := b.line_dir[li] * r * 1.25
		if tree:
			dir.y = -dir.y
		return [a - dir, a + dir]
	var dir := (e - a).normalized() * r * 0.75
	return [a - dir, e + dir]


func _rebuild_board() -> void:
	for c in board.get_children():
		c.queue_free()
	dot_sprites.clear()

	if tree:
		_add_tree()
	else:
		_add_felt()
	holes = DrawLayer.new()
	holes.fn = _draw_holes
	board.add_child(holes)
	dot_layer = Node2D.new()
	board.add_child(dot_layer)
	for d in b.pos.size():
		var sp := Sprite2D.new()
		sp.position = px(d)
		sp.visible = s.colored[d] != 0
		if sp.visible:
			sp.texture = UI.tex("dot-p%d.webp" % _sk(s.colored[d]))
			sp.scale = _dot_scale(sp.texture)
		dot_layer.add_child(sp)
		dot_sprites.append(sp)
	strike_layer = Node2D.new()
	board.add_child(strike_layer)
	for li in b.lines.size():
		if s.line_state[li] == GState.SCORED:
			_add_strike(li, s.line_owner[li], false)
	pending_layer = DrawLayer.new()
	pending_layer.fn = _draw_pending
	board.add_child(pending_layer)
	overlay_layer = DrawLayer.new()
	overlay_layer.fn = _draw_overlay
	board.add_child(overlay_layer)


## Christmas Triangle: the painted tree, its top dot and bottom row on the
## first and last rows of dots (same fit as treeBox in src/themeArt.ts).
func _add_tree() -> void:
	var sp := Sprite2D.new()
	sp.texture = UI.tex("tree-board.webp")
	sp.centered = false
	var k := b.bounds.size.y * unit / (TREE_BOTTOM - TREE_TOP)
	sp.scale = Vector2(k, k) * (TREE_SIZE.x / sp.texture.get_width())
	sp.position = Vector2(-TREE_AXIS * k, -b.bounds.size.y * unit / 2.0 - TREE_TOP * k)
	board.add_child(sp)
	if is_instance_valid(Look.fire):
		_front_fire = Campfire.new()
		board.add_child(_front_fire)
		_sync_fire()


func _sync_fire() -> void:
	if not is_instance_valid(_front_fire):
		return
	var bg_fire := Look.fire
	if not is_instance_valid(bg_fire) or not bg_fire.is_inside_tree():
		_front_fire.visible = false
		return
	bg_fire.visible = false
	_front_fire.visible = true
	_front_fire.global_transform = bg_fire.global_transform


func _exit_tree() -> void:
	if is_instance_valid(Look.fire):
		Look.fire.visible = true


func _add_felt() -> void:
	var outline := PackedVector2Array()
	for v in b.outline:
		outline.append((v - b.bounds.get_center()) * unit)
	var shadow := Polygon2D.new()
	shadow.polygon = outline
	shadow.color = Color(0, 0, 0, 0.45)
	shadow.position = Vector2(0, 16)
	board.add_child(shadow)
	var felt := Polygon2D.new()
	felt.polygon = outline
	felt.texture = UI.tex("felt-base.webp")
	felt.texture_repeat = CanvasItem.TEXTURE_REPEAT_MIRROR
	felt.texture_scale = Vector2(1.4, 1.4)
	felt.color = Color(2.1, 2.3, 2.0)
	board.add_child(felt)
	if _wreath():
		_add_wreath()
		return
	var closed := outline.duplicate()
	closed.append(outline[0])
	for spec in [[r * 0.55, Color("1f160c")], [r * 0.16, Color(0.75, 0.9, 0.6, 0.35)]]:
		var rim := Line2D.new()
		rim.points = closed
		rim.width = spec[0]
		rim.default_color = spec[1]
		rim.joint_mode = Line2D.LINE_JOINT_ROUND
		rim.antialiased = true
		board.add_child(rim)


## Christmas Square/Rectangle: painted wreath nine-slice hugging the dots
## (same pad and band as Board.tsx).
func _add_wreath() -> void:
	var band := r * 2.2
	var pad := r * 1.64 * 0.95 + band
	var half := b.bounds.size * unit / 2.0 + Vector2(pad, pad)
	var np := NinePatchRect.new()
	np.texture = UI.tex("wreath-frame.webp")
	var k := band / ((WREATH_CAPS[0] + WREATH_CAPS[1] + WREATH_CAPS[2] + WREATH_CAPS[3]) / 4.0) * (WREATH_W / np.texture.get_width())
	np.patch_margin_left = int(WREATH_CAPS[0] * np.texture.get_width() / WREATH_W)
	np.patch_margin_top = int(WREATH_CAPS[1] * np.texture.get_width() / WREATH_W)
	np.patch_margin_right = int(WREATH_CAPS[2] * np.texture.get_width() / WREATH_W)
	np.patch_margin_bottom = int(WREATH_CAPS[3] * np.texture.get_width() / WREATH_W)
	np.axis_stretch_horizontal = NinePatchRect.AXIS_STRETCH_MODE_TILE_FIT
	np.axis_stretch_vertical = NinePatchRect.AXIS_STRETCH_MODE_TILE_FIT
	np.mouse_filter = Control.MOUSE_FILTER_IGNORE
	np.size = half * 2.0 / k
	np.scale = Vector2(k, k)
	np.position = -half
	board.add_child(np)


func _dot_scale(t: Texture2D) -> Vector2:
	var k := r * 2.25 * Look.dot_scale / t.get_width()
	return Vector2(k, k)


func _draw_holes(n: Node2D) -> void:
	for d in b.pos.size():
		if s.colored[d] != 0:
			continue
		var p := px(d)
		n.draw_circle(p + Vector2(0, r * 0.08), r * 1.06, Color(0.75, 0.95, 0.7, 0.16))
		n.draw_circle(p, r, Color(0.04, 0.1, 0.06))
		n.draw_circle(p + Vector2(0, r * 0.22), r * 0.74, Color(0.1, 0.2, 0.12))
		n.draw_arc(p, r, 0, TAU, 40, Color(0, 0, 0, 0.7), r * 0.09, true)


func _dash(n: Node2D, a: Vector2, e: Vector2, col: Color, w: float, phase: float) -> void:
	var length := a.distance_to(e)
	var dir := (e - a) / length
	var dash := r * 0.55
	var gap := r * 0.38
	var t := fmod(phase, dash + gap) - (dash + gap)
	while t < length:
		var s0 := maxf(t, 0.0)
		var s1 := minf(t + dash, length)
		if s1 > s0:
			n.draw_line(a + dir * s0, a + dir * s1, col, w, true)
		t += dash + gap


## Unclaimed lines are hidden by design (spotting them is the skill), except
## vs the Beginner/Easy/Medium bots on Triangle: there each is a static dashed
## stroke (same rule as effectiveShowRings in App.tsx).
func show_rings() -> bool:
	if coach:
		return _coach_marks().get("waiting", false) or (coach.stage in ["claim", "free"] and _coach_turn())
	return mode in ["ai", "coach"] and shape == "triangle" and level >= 1 and level <= 3


func _draw_pending(n: Node2D) -> void:
	if not show_rings():
		return
	for li in s.pending:
		var ends := line_ends(li)
		_dash(n, ends[0], ends[1], Color(WAIT_COL, 0.95), r * 0.2, 0.0)


func _draw_overlay(n: Node2D) -> void:
	if coach:
		_draw_coach(n)
	var pulse := 0.5 + 0.5 * sin(_time * 6.0)
	if last_dot >= 0:
		n.draw_arc(px(last_dot), r * 1.18, 0, TAU, 48, Color(1, 1, 0.85, 0.5), r * 0.08, true)
	if hover_dot >= 0 and s.colored[hover_dot] == 0:
		var c: Color = BRIGHT[_sk(s.current)]
		n.draw_circle(px(hover_dot), r * (0.82 + 0.06 * pulse), Color(c, 0.28))
		n.draw_arc(px(hover_dot), r * 1.1, 0, TAU, 48, Color(c, 0.8), r * 0.1, true)
	if aim_dot >= 0:
		var c: Color = BRIGHT[_sk(s.current)]
		var rr := r * (1.6 - 0.4 * pulse)
		n.draw_arc(px(aim_dot), rr, 0, TAU, 48, Color(c, 0.9), r * 0.1, true)


# ---------------------------------------------------------------- flow

func _intro() -> void:
	board.scale = Vector2(0.6, 0.6)
	board.modulate.a = 0.0
	var tw := create_tween().set_parallel()
	tw.tween_property(board, "scale", Vector2.ONE, 0.6).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_property(board, "modulate:a", 1.0, 0.35)
	Sfx.play("whoosh", 0.8)
	_update_hud()
	_update_turn()
	await get_tree().create_timer(0.55).timeout
	_after_move(false)


func _is_bot(p: int) -> bool:
	if online:
		return false
	return (p == 2 and level > 0) or (p == 1 and auto_p1)


## Can the local player act right now?
func _can_act() -> bool:
	if busy or s.finished:
		return false
	if online:
		return _status == "active" and s.current == my_slot
	return not _is_bot(s.current)


var _act_since := 0.0
var _claim_hint_shown := false


func _update_turn() -> void:
	_act_since = _time
	if s.empty == 0 and s.pending.size() > 0 and not s.finished and not _claim_hint_shown and mode != "coach":
		_claim_hint_shown = true
		_toast(Lang.a("game.claimPhaseHint"))
	for p in [1, 2]:
		var active: bool = p == s.current and not s.finished
		var tw := create_tween().set_parallel()
		tw.tween_property(cards[p].wrap, "scale", Vector2.ONE * (1.04 if active else 0.94), 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		tw.tween_property(cards[p].wrap, "modulate", Color(1, 1, 1, 1.0 if active else 0.6), 0.3)
		cards[p].glow.visible = active


func _after_move(_moved := true) -> void:
	if online:
		busy = false
		_update_turn()
		if not _loaded_marked:
			_loaded_marked = true
			Online.mark_board_loaded(s.current)
		if not _latest.is_empty():
			_sync()
		elif _status == "finished":
			_online_over(Online.game)
		return
	if s.finished:
		_game_over()
		return
	_update_turn()
	if _is_bot(s.current):
		_bot_turn()
	else:
		busy = false


func _bot_turn() -> void:
	busy = true
	thinking = true
	cards[s.current].think.visible = true
	var me := s.current
	var lvl := level if me == 2 else 3
	var a := coach.bot_action(s) if coach else AI.pick(s, b, lvl, me)
	await get_tree().create_timer((coach.bot_delay() - 0.28) if coach else randf_range(0.5, 0.85) / bot_speed).timeout
	if not is_inside_tree():
		return
	aim_dot = a if a >= 0 else b.lines[GState.claim_line(a)][0]
	await get_tree().create_timer(0.28 / bot_speed).timeout
	if not is_inside_tree():
		return
	aim_dot = -1
	thinking = false
	cards[me].think.visible = false
	if s.finished:
		return  # resigned while the bot was thinking
	_do(a)


func _do(a: int, remote := false) -> void:
	busy = true
	var p := s.current
	var before := s
	s = s.apply(b, a)
	if online and not remote:
		_send(a, before)
	if coach:
		if p == 1:
			coach.after_player(s.last_points)
		else:
			coach.after_bot(s.last_points)
	hover_dot = -1
	var wait := 0.2
	if a >= 0:
		_place_fx(a, p)
		# Highlight the opponent's last dot: vs a bot only the bot's moves,
		# in hot-seat / online every move (as Board.tsx).
		if mode in ["hotseat", "online", "coach"] or _is_bot(p):
			last_dot = a
	else:
		claims += 1 if not _is_bot(p) else 0
	holes.queue_redraw()
	var ns := s
	if ns.last_scored >= 0:
		if a >= 0:
			await get_tree().create_timer(0.14).timeout
		_score_fx(ns.last_scored, p, ns.last_points, a < 0)
		wait = 0.5 + 0.05 * ns.last_points
	if s.last_new_pending.size() > 0:
		_pending_fx(s.last_new_pending)
		_maybe_pending_tip()
	_update_hud()
	_save()
	await get_tree().create_timer(wait / bot_speed).timeout
	if is_inside_tree():
		_after_move()


# ---------------------------------------------------------------- coach lesson

var _marks_key := []
var _marks := {}


## coach.marks() runs the lesson's rules (clones); recompute only on change.
func _coach_marks() -> Dictionary:
	var key := [s, coach.stage, coach.misses, coach.idle, _coach_turn()]
	if key != _marks_key:
		_marks_key = key
		_marks = coach.marks(s, _coach_turn())
	return _marks


func _coach_turn() -> bool:
	return s.current == 1 and not s.finished


func _build_coach_bubble() -> void:
	var card := PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.03, 0.1, 0.06, 0.95)
	sb.set_corner_radius_all(24)
	sb.set_border_width_all(3)
	sb.border_color = Color(UI.GOLD, 0.75)
	sb.set_content_margin_all(18)
	card.add_theme_stylebox_override("panel", sb)
	card.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	_offsets(card, 24, -24, -24, -24)
	card.grow_vertical = Control.GROW_DIRECTION_BEGIN
	card.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(card)
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 6)
	card.add_child(vb)
	var head := HBoxContainer.new()
	head.add_theme_constant_override("separation", 10)
	vb.add_child(head)
	head.add_child(UI.label(Lang.a("coach.name"), 24, UI.GOLD, true, 3))
	# "Your dots" swatch during the first step, so the colour is obvious.
	var you := HBoxContainer.new()
	you.add_theme_constant_override("separation", 6)
	var chip := TextureRect.new()
	chip.texture = UI.tex("dot-p%d.webp" % _sk(1))
	chip.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	chip.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	chip.custom_minimum_size = Vector2(26, 26)
	you.add_child(chip)
	you.add_child(UI.label(Lang.a("coach.yourDots"), 20, UI.TEXT_DIM, false, 2))
	head.add_child(you)
	_coach_text = UI.label("", 26, UI.TEXT, false, 3)
	_coach_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_coach_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	vb.add_child(_coach_text)
	_coach_text.set_meta("card", card)
	_coach_text.set_meta("you", you)


func _sync_coach(delta: float) -> void:
	coach.tick(delta, s, _coach_turn())
	var t := coach.shown_message(s, _coach_turn())
	if _coach_text.text != t:
		_coach_text.text = t
	var card: Control = _coach_text.get_meta("card")
	card.visible = t != "" and not s.finished
	(_coach_text.get_meta("you") as Control).visible = coach.stage == "corner"


## Lesson marks — static, except the "tap here" ring, which breathes (the
## approved lesson exception): other dots dimmed, gold bands on the lines to
## finish, gold rings, a "+N" over the gap.
func _draw_coach(n: Node2D) -> void:
	var m := _coach_marks()
	if m.has("spotlight"):
		for d in b.pos.size():
			if not d in m.spotlight:
				n.draw_circle(px(d), r * 1.05, Color(0, 0.03, 0.01, 0.55))
	for li in m.get("bands", []):
		var e := line_ends(li)
		n.draw_line(e[0], e[1], Color(UI.GOLD, 0.28), r * 1.6, true)
	for d in m.get("rings", []):
		n.draw_arc(px(d), r * 1.25, 0, TAU, 48, Color(UI.GOLD, 0.85), r * 0.12, true)
	if m.has("gap"):
		n.draw_arc(px(m.gap), r * 1.05, 0, TAU, 48, Color(UI.GOLD, 0.9), r * 0.1, true)
	if m.has("label"):
		var f := UI.font(true)
		var fs := int(r * 1.3)
		var txt: String = m.label[1]
		var at: Vector2 = px(m.label[0]) + Vector2(-f.get_string_size(txt, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x / 2.0, -r * 1.6)
		n.draw_string_outline(f, at, txt, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, int(r * 0.35), Color(0, 0, 0, 0.8))
		n.draw_string(f, at, txt, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, UI.GOLD)
	if m.has("pointer"):
		var k := 0.5 + 0.5 * sin(_time * 5.0)
		n.draw_arc(px(m.pointer), r * (1.45 + 0.25 * k), 0, TAU, 48, Color(UI.GOLD, 0.55 + 0.4 * k), r * 0.14, true)


func _coach_over() -> void:
	Store.set_setting("tutorialSeen", true)
	await get_tree().create_timer(0.9).timeout
	if not is_inside_tree():
		return
	var won := s.winner == 1
	var title := Lang.a("coach.wonTitle") if won else Lang.a("coach.endTitle")
	var res: Dictionary = await _result_panel(title, BRIGHT[_sk(1)] if won else UI.TEXT, won, true, [Lang.a("coach.endBody")], Lang.a("coach.playBot"))
	res.primary.pressed.connect(func(): play_requested.emit("triangle", 1))


## Keep the game in progress (vs-bot / hot-seat) so a reload resumes it.
func _save() -> void:
	if online or auto_p1 or not mode in ["ai", "hotseat"]:
		return
	if s.finished:
		Store.clear_active()
		return
	var g := {"mode": mode, "shape": shape, "state": s.to_json(b, shape, mode, level),
		"lastDot": last_dot if last_dot >= 0 else null, "claims": claims}
	if mode == "ai":
		g.difficulty = level
	Store.save_active(g)


## Restore a saved game (Store.load_active()).
func restore(g: Dictionary) -> void:
	s = GState.from_json(b, g.state)
	claims = int(g.get("claims", 0))
	last_dot = int(g.lastDot) if g.get("lastDot") != null else -1
	shown_left = s.points_left(b)
	shown_score = [0.0, float(s.scores[1]), float(s.scores[2])]


func _gui_input(e: InputEvent) -> void:
	if e is InputEventMouseMotion:
		var d := _dot_at(e.position)
		var playable := d >= 0 and _can_act() and (s.colored[d] == 0 or s.pending_through(b, d) >= 0)
		var nd := d if playable else -1
		if nd != hover_dot:
			hover_dot = nd
			if nd >= 0:
				Sfx.play("tick", 1.4, -14.0)
	elif e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT:
		if not _can_act() or _time - _act_since < 0.35:  # no double-tap through the bot's reply
			return
		var d := _dot_at(e.position)
		if d < 0:
			return
		if s.colored[d] == 0:
			if coach and not coach.can_place(s, d):
				coach.refused()
				_nope(d)
				return
			_do(d)
		else:
			var li := s.pending_through(b, d)
			if li >= 0 and coach and not coach.can_claim():
				_nope(d)
			elif li >= 0:
				_do(GState.claim_action(li))
			else:
				_nope(d)
				if s.empty == 0:
					_toast(Lang.a("game.nothingToClaim"))


func _dot_at(pos: Vector2) -> int:
	var local := board.get_global_transform().affine_inverse() * (get_global_transform() * pos)
	var best := -1
	var best_d := r * 1.35
	for d in b.pos.size():
		var dist := local.distance_to(px(d))
		if dist < best_d:
			best_d = dist
			best = d
	return best


func _nope(d: int) -> void:
	var sp := dot_sprites[d]
	var tw := create_tween()
	for x in [0.25, -0.25, 0.15, 0.0]:
		tw.tween_property(sp, "rotation", x, 0.05)
	Sfx.play("tick", 0.6, -4.0)


# ---------------------------------------------------------------- juice

func _place_fx(d: int, p: int) -> void:
	var sp := dot_sprites[d]
	sp.texture = UI.tex("dot-p%d.webp" % _sk(p))
	var full := _dot_scale(sp.texture)
	sp.visible = true
	sp.scale = full * 0.2
	var tw := create_tween()
	tw.tween_property(sp, "scale", full * 1.22, 0.12).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.tween_property(sp, "scale", full, 0.35).set_trans(Tween.TRANS_ELASTIC).set_ease(Tween.EASE_OUT)
	Sfx.play("place%d" % p, randf_range(0.94, 1.06))
	UI.particles_burst(board, px(d), BRIGHT[_sk(p)], 10, r * 5.0, "particle-spark.webp", r / 260.0)
	var ring := _ring(px(d), BRIGHT[_sk(p)])
	var rt := create_tween().set_parallel()
	rt.tween_method(func(v: float): ring.set_meta("rad", v); ring.queue_redraw(), r, r * 2.4, 0.4)
	rt.tween_property(ring, "modulate:a", 0.0, 0.4)
	rt.chain().tween_callback(ring.queue_free)
	shake = maxf(shake, 2.0)


func _ring(at: Vector2, col: Color) -> Node2D:
	var ring := DrawLayer.new()
	ring.set_meta("rad", r)
	ring.fn = func(n: Node2D): n.draw_arc(at, n.get_meta("rad"), 0, TAU, 48, col, r * 0.12, true)
	board.add_child(ring)
	return ring


func _add_strike(li: int, p: int, animate: bool) -> void:
	var ends := line_ends(li)
	var root := Node2D.new()
	strike_layer.add_child(root)
	var parts: Array[Line2D] = []
	for spec in [[r * 1.1, Color(BRIGHT[_sk(p)], 0.22)], [r * 0.5, STRIKE_OUTER[_sk(p)]], [r * 0.2, Color(STRIKE_INNER[_sk(p)], 0.9)]]:
		var l := Line2D.new()
		l.width = spec[0]
		l.default_color = spec[1]
		l.begin_cap_mode = Line2D.LINE_CAP_ROUND
		l.end_cap_mode = Line2D.LINE_CAP_ROUND
		l.antialiased = true
		l.points = PackedVector2Array([ends[0], ends[1]])
		root.add_child(l)
		parts.append(l)
	if animate:
		var grow := func(t: float):
			for l in parts:
				l.points = PackedVector2Array([ends[0], ends[0].lerp(ends[1], t)])
		grow.call(0.0)
		create_tween().tween_method(grow, 0.0, 1.0, 0.22 + 0.03 * b.line_len[li]).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)


func _score_fx(li: int, p: int, pts: int, claimed: bool) -> void:
	_add_strike(li, p, true)
	Sfx.play("line%d" % clampi(pts, 1, 9), 1.0 + (0.08 if p == 2 else 0.0))
	if claimed:
		Sfx.play("claim", 1.0, -3.0)
	for i in b.lines[li].size():
		var d := b.lines[li][i]
		var at := px(d)
		var burst := func():
			if is_inside_tree():
				UI.particles_burst(board, at, BRIGHT[_sk(p)], 8 + pts, r * 4.0, "particle-pearl.webp", r / 420.0)
		get_tree().create_timer(0.03 * i).timeout.connect(burst)
	var ends := line_ends(li)
	var mid: Vector2 = (ends[0] + ends[1]) / 2.0
	_fly_points(mid, p, Lang.t("claimed_plus", [pts]) if claimed else "+%d" % pts)
	shake = maxf(shake, 4.0 + pts * 1.8)
	if pts >= 4:
		_callout(Lang.t("callout_%d" % mini(pts, 8)), BRIGHT[_sk(p)])
	if pts >= 6:
		Engine.time_scale = 0.35
		var restore := func(): Engine.time_scale = 1.0
		get_tree().create_timer(0.14, true, false, true).timeout.connect(restore)


func _to_screen(local: Vector2) -> Vector2:
	return get_global_transform().affine_inverse() * (board.get_global_transform() * local)


func _fly_points(local: Vector2, p: int, text: String) -> void:
	var l := UI.label(text, 44, BRIGHT[_sk(p)], true, 12)
	float_layer.add_child(l)
	l.size = Vector2(320, 60)
	l.pivot_offset = l.size / 2.0
	var start := _to_screen(local) - l.size / 2.0
	l.position = start
	l.scale = Vector2(0.3, 0.3)
	# The score counts up at once; the "+N" rises and fades over the line.
	_roll_score(p)
	Sfx.play("tick", 1.8, -6.0)
	var score_l: Label = cards[p].score
	var spark_at := score_l.get_global_rect().get_center() - get_global_position()
	UI.particles_burst(float_layer, spark_at, BRIGHT[_sk(p)], 14, 220.0, "particle-spark.webp", 0.12)
	var tw := create_tween()
	tw.tween_property(l, "scale", Vector2(1.15, 1.15), 0.18).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_property(l, "position", start + Vector2(0, -70), 0.9).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_property(l, "modulate:a", 0.0, 0.4).set_delay(0.5)
	tw.tween_callback(l.queue_free)


func _callout(text: String, col: Color) -> void:
	# Long words (LT "NEPAKARTOJAMA!") shrink to fit the screen width.
	var fs := 86
	var w := UI.font(true).get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x + 2 * 16 + 24
	if w > size.x:
		fs = int(fs * size.x / w)
	var l := UI.label(text, fs, col, true, 16)
	float_layer.add_child(l)
	l.size = Vector2(size.x, 120)
	l.pivot_offset = l.size / 2.0
	l.position = Vector2(0, _to_screen(Vector2.ZERO).y - 60)
	l.scale = Vector2(0.2, 0.2)
	l.rotation = -0.12
	var tw := create_tween()
	tw.tween_property(l, "scale", Vector2(1.0, 1.0), 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_property(l, "rotation", 0.0, 0.35)
	tw.tween_interval(0.35)
	tw.tween_property(l, "position:y", l.position.y - 80, 0.4).set_ease(Tween.EASE_IN)
	tw.parallel().tween_property(l, "modulate:a", 0.0, 0.4)
	tw.tween_callback(l.queue_free)


func _pending_fx(lines: PackedInt32Array) -> void:
	Sfx.play("pending", 1.0, -2.0)
	_flash_waiting()
	if not show_rings():
		return  # where lines are hidden, don't point at them either
	for li in lines:
		var ends := line_ends(li)
		var mid: Vector2 = (ends[0] + ends[1]) / 2.0
		var l := UI.label(Lang.t("waiting_plus", [b.line_len[li]]), 28, WAIT_COL, true, 8)
		float_layer.add_child(l)
		l.size = Vector2(260, 40)
		l.position = _to_screen(mid) - l.size / 2.0 + Vector2(0, 34)
		l.modulate.a = 0.0
		var tw := create_tween()
		tw.tween_interval(0.25)
		tw.tween_property(l, "modulate:a", 1.0, 0.15)
		tw.tween_property(l, "position:y", l.position.y - 30, 0.9)
		tw.parallel().tween_property(l, "modulate:a", 0.0, 0.9).set_delay(0.4)
		tw.tween_callback(l.queue_free)


## First time two lines finish at once (newer players, not on the daily clock).
func _maybe_pending_tip() -> void:
	if online or auto_p1 or mode in ["daily", "coach"] or bool(Store.settings.pendingTipSeen) or int(Store.settings.gamesPlayed) >= 10:
		return
	Store.set_setting("pendingTipSeen", true)
	var card := PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.03, 0.1, 0.06, 0.96)
	sb.set_corner_radius_all(24)
	sb.set_border_width_all(3)
	sb.border_color = Color(UI.GOLD, 0.8)
	sb.set_content_margin_all(20)
	card.add_theme_stylebox_override("panel", sb)
	card.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	_offsets(card, 30, -330, -30, -60)
	card.grow_vertical = Control.GROW_DIRECTION_BEGIN
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 12)
	card.add_child(vb)
	var l := UI.label(Lang.a("coach.pendingTip"), 24, UI.TEXT, false, 3)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vb.add_child(l)
	var ok := UI.plain_button(Lang.a("coach.gotIt"))
	ok.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	ok.pressed.connect(card.queue_free)
	vb.add_child(ok)
	float_layer.add_child(card)
	card.mouse_filter = Control.MOUSE_FILTER_STOP


## The "N lines waiting" badge brightens for a moment (colour only — the
## header never moves).
func _flash_waiting() -> void:
	if waiting_label == null:
		return
	waiting_label.modulate = Color(1.6, 1.6, 1.2)
	create_tween().tween_property(waiting_label, "modulate", Color.WHITE, 0.6)


func _process(delta: float) -> void:
	_time += delta
	if mode == "daily" and not s.finished and not _over and not cards[1].is_empty():
		var now := Time.get_ticks_msec()
		if s.current == 1 and not thinking and _time > 1.0 and _clock_prev > 0:
			daily_left = maxf(0.0, daily_left - (now - _clock_prev) / 1000.0)
		_clock_prev = now
		var secs := int(ceil(daily_left))
		cards[1].clock.text = "⏱ %d:%02d" % [secs / 60, secs % 60]
		if daily_left <= 0.0:
			_daily_timeout()
	if coach and _coach_text:
		_sync_coach(delta)
	_sync_fire()
	if overlay_layer:
		overlay_layer.queue_redraw()
	if pending_layer and s.pending.size() > 0 and show_rings():
		pending_layer.queue_redraw()
	if shake > 0.05 and not tree:  # a tree doesn't shake when a bauble goes on
		holder.position = Vector2(randf_range(-1, 1), randf_range(-1, 1)) * shake
		shake = lerpf(shake, 0.0, minf(1.0, delta * 12.0))
	elif holder:
		holder.position = Vector2.ZERO
	for p in [1, 2]:
		if cards[p] and cards[p].glow.visible:
			cards[p].glow.modulate.a = 0.55 + 0.45 * sin(_time * 3.2)
	if online:
		_tick_clocks()
	for i in think_dots.size():
		think_dots[i].position.y = -absf(sin(_time * 7.0 - i * 0.6)) * 10.0


# ---------------------------------------------------------------- end

const FINAL_SHAPE := "rectangle"


var _over := false


func _game_over() -> void:
	if _over:
		return  # a resign confirmed while a move was still settling
	_over = true
	if coach:
		busy = true
		_update_turn()
		_coach_over()
		return
	busy = true
	_update_turn()
	Store.clear_active()
	if mode == "daily":
		# Saved straight away — leaving during the result's entrance can't drop it.
		_daily_ticket = Daily.save(s.scores[1], Online.display_name() if Online.display_name() != "" else str(Store.settings.playerName))
	var unlock := _bookkeeping()
	await get_tree().create_timer(0.7).timeout
	if not is_inside_tree():
		return
	var human_won := s.winner == 1 if mode == "ai" else s.winner != 3
	var title := Lang.a("gameOver.drawTitle")
	var col := UI.TEXT
	if s.winner != 3:
		col = BRIGHT[_sk(s.winner)]
		var who := _player_name(s.winner)
		title = Lang.a("gameOver.youWin") if who == Lang.t("you") else Lang.a("gameOver.playerWins", [who])
	var beat_impossible := mode == "ai" and s.winner == 1 and level == 5
	if beat_impossible:
		title = Lang.a("gameOver.champion") if shape == FINAL_SHAPE else Lang.a("gameOver.impossibleDefeated")
	var lines := ["%s vs %s · %s" % [_player_name(1), _player_name(2), Lang.t("shape_" + shape)]]
	if finished_reason == "resign":
		lines.push_front(Lang.a("gameOver.youResigned"))
	if mode == "daily":
		await _daily_over(title, col, lines)
		return
	var extra := _suggestion(unlock, beat_impossible)
	var celebrate := s.winner != 3 and (mode == "hotseat" or s.winner == 1)
	var res: Dictionary = await _result_panel(title, col, celebrate, s.winner == 3 or human_won, lines, Lang.a("gameOver.playAgain"), extra)
	res.primary.pressed.connect(func(): rematch_requested.emit())


## Time's up: the attempt ends on the current scores.
func _daily_timeout() -> void:
	var n := s.clone()
	n.finished = true
	n.winner = 1 if s.scores[1] > s.scores[2] else (2 if s.scores[2] > s.scores[1] else 3)
	s = n
	finished_reason = "timeout"
	busy = true
	_game_over()


## Stats, learning counters and unlocks for a finished local game (App.tsx).
func _bookkeeping() -> Dictionary:
	if auto_p1 or mode == "coach" or online:
		return {}
	if mode == "daily":
		Store.note_game_played(claims)
		return {}
	var outcome := func(p: int) -> String:
		return "draw" if s.winner == 3 else ("win" if s.winner == p else "loss")
	Store.note_game_played(claims)
	var me := _human_name()
	var unlock := {}
	if mode == "ai":
		loss_run = Store.note_ai_result(shape, level, outcome.call(1))
		Store.record_result(me, "ai", outcome.call(1), shape, s.scores[1], s.scores[2], level, "ai:%d" % level)
		if s.winner == 1:
			unlock = Store.record_win(shape, level)
	elif mode == "hotseat":
		var p2 := str(Store.settings.opponentName)
		Store.record_result(me, "hotseat", outcome.call(1), shape, s.scores[1], s.scores[2], 0, Store.norm_key(p2))
		if Store.norm_key(me) != Store.norm_key(p2):
			Store.record_result(p2, "hotseat", outcome.call(2), shape, s.scores[2], s.scores[1], 0, Store.norm_key(me))
	# Achievements: P1's biggest scored line and any 1-point corner (App.tsx).
	var max_line := 0
	var corner := false
	for li in b.lines.size():
		if s.line_state[li] == GState.SCORED and s.line_owner[li] == 1:
			max_line = maxi(max_line, b.lines[li].size())
			corner = corner or b.lines[li].size() == 1
	Ach.record_local(mode, shape, level, s.winner == 1, max_line, corner)
	return unlock


var loss_run := 0
var _daily_ticket := 0


## Daily result (GameOver.tsx daily block): saved via finalize_daily, then
## score, best today, attempt n/3, streak, Try again / Leaderboard / Menu.
func _daily_over(title: String, col: Color, lines: Array) -> void:
	if not Daily.has_result(_daily_ticket):
		_toast(Lang.a("gameOver.savingResult"))
		while not Daily.has_result(_daily_ticket):
			await Daily.saved
	if not is_inside_tree():
		return
	var res: Dictionary = Daily.result(_daily_ticket)
	if finished_reason == "timeout":
		lines.push_front(Lang.a("gameOver.timesUp"))
	lines.append("%s %d" % [Lang.a("gameOver.yourScore"), s.scores[1]])
	var left := 0
	if res.is_empty():
		lines.append(Lang.a("game.moveFailed"))
	else:
		left = int(res.get("attemptsRemaining", 0))
		lines.append("%s %d%s" % [Lang.a("gameOver.bestToday"), int(res.get("best", 0)), Lang.a("gameOver.attemptOf", [int(res.get("attempts", 0))])])
		var st: Dictionary = res.get("streak", {}) if res.get("streak") is Dictionary else {}
		var cur := int(st.get("current", 0))
		if cur > 0:
			var sl := "%s %s" % [Lang.a("gameOver.streakLabel"), Lang.a("gameOver.dayN", [cur])]
			if int(st.get("longest", 0)) > cur:
				sl += " " + Lang.a("gameOver.bestDay", [int(st.get("longest", 0))])
			lines.append(sl)
		lines.append(Lang.a("gameOver.attemptsLeft", [left]) if left > 0 else Lang.a("gameOver.allAttemptsUsed"))
	var extra: Control = null
	if left > 0:
		var lb := UI.plain_button(Lang.a("gameOver.leaderboard"))
		lb.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		lb.pressed.connect(func(): puzzle_board_requested.emit())
		extra = lb
	var primary := Lang.a("gameOver.tryAgainN", [left]) if left > 0 else Lang.a("gameOver.leaderboard")
	var panel: Dictionary = await _result_panel(title, col, s.winner == 1, s.winner != 2, lines, primary, extra)
	panel.primary.pressed.connect(func(): daily_again.emit() if left > 0 else puzzle_board_requested.emit())


## Name the stats are kept under: the account name when signed in.
func _human_name() -> String:
	if Supa.signed_in() and Online.display_name() != "":
		return Online.display_name()
	return str(Store.settings.playerName)


## The "what next" card under a vs-bot result (GameOver.tsx buildSuggestion).
func _suggestion(unlock: Dictionary, beat_impossible: bool) -> Control:
	if mode != "ai" or auto_p1:
		return null
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 10)
	var head := func(t: String, body: String):
		var h := UI.label(t, 30, UI.ACCENT, true, 5)
		h.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		h.custom_minimum_size = Vector2(520, 0)
		box.add_child(h)
		if body != "":
			var l := UI.label(body, 22, UI.TEXT, false, 3)
			l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			l.custom_minimum_size = Vector2(520, 0)
			box.add_child(l)
	var go := func(t: String, sh: String, lv: int):
		var btn := UI.plain_button(t)
		btn.pressed.connect(func(): play_requested.emit(sh, lv))
		box.add_child(btn)
	var next_shape := Store.next_shape(shape)
	if next_shape == "rhombus":
		next_shape = ""
	if s.winner != 1:
		if loss_run < 3:
			return null
		head.call(Lang.a("gameOver.lossRunHeadline"), Lang.a("gameOver.lossRunTip"))
		if level > 1:
			go.call(Lang.a("gameOver.stepDown", [Lang.t("level_%d" % (level - 1))]), shape, level - 1)
		return box
	if beat_impossible and shape == FINAL_SHAPE:
		head.call(Lang.a("gameOver.champHeadline"), Lang.a("gameOver.champBody"))
		return box
	if beat_impossible and next_shape != "":
		head.call(Lang.a("gameOver.impossibleHeadline", [Lang.t("shape_" + shape)]), Lang.a("gameOver.impossibleBody", [Lang.t("shape_" + next_shape), Lang.t("level_1")]))
		go.call(Lang.a("gameOver.tryShape", [Lang.t("shape_" + next_shape)]), next_shape, 1)
		return box
	if not str(unlock.get("shape", "")) in ["", "rhombus"]:
		var ns: String = unlock.shape
		head.call(Lang.a("gameOver.shapeUnlockedHeadline", [Lang.t("shape_" + ns)]), Lang.a("gameOver.shapeUnlockedBody", [Lang.t("shape_" + shape)]))
		go.call(Lang.a("gameOver.tryShape", [Lang.t("shape_" + ns)]), ns, 1)
		if int(unlock.get("level", 0)) > 0:
			go.call(Lang.a("gameOver.pushTo", [Lang.t("level_%d" % unlock.level), Lang.t("shape_" + shape)]), shape, unlock.level)
		return box
	if int(unlock.get("level", 0)) > 0:
		head.call(Lang.a("gameOver.levelUnlockedHeadline", [Lang.t("level_%d" % unlock.level)]), Lang.a("gameOver.levelUnlockedBody"))
		go.call(Lang.a("gameOver.tryLevel", [Lang.t("level_%d" % unlock.level)]), shape, unlock.level)
		return box
	if level < 5:
		head.call(Lang.a("gameOver.niceOne"), Lang.a("gameOver.niceOneBody"))
		go.call(Lang.a("gameOver.tryLevel", [Lang.t("level_%d" % (level + 1))]), shape, level + 1)
		return box
	return null


## Builds the end-of-game panel. Returns {panel, lines: Array[Label], primary}.
func _result_panel(title: String, col: Color, celebrate: bool, happy: bool, lines: Array, primary_text: String, extra: Control = null) -> Dictionary:
	var ov := Control.new()
	ov.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(ov)
	var dim := ColorRect.new()
	dim.color = Color(0, 0.02, 0.01, 0.0)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	ov.add_child(dim)
	create_tween().tween_property(dim, "color:a", 0.62, 0.4)

	if celebrate:
		_confetti(ov)

	var panel := PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.03, 0.1, 0.06, 0.95)
	sb.set_corner_radius_all(36)
	sb.set_border_width_all(4)
	sb.border_color = Color(col, 0.8)
	sb.shadow_color = Color(col, 0.35)
	sb.shadow_size = 40
	sb.content_margin_left = 36
	sb.content_margin_right = 36
	sb.content_margin_top = 34
	sb.content_margin_bottom = 34
	panel.add_theme_stylebox_override("panel", sb)
	ov.add_child(panel)
	var vb := VBoxContainer.new()
	vb.add_theme_constant_override("separation", 18)
	panel.add_child(vb)
	var t := UI.label(title, 92, col, true, 16)
	UI.fit_label(t, 92, Vector2(560, 120))
	t.resized.connect(func(): t.pivot_offset = t.size / 2.0)
	vb.add_child(t)
	var sc := UI.label("%d  :  %d" % [s.scores[1], s.scores[2]], 64, UI.TEXT, true, 10)
	vb.add_child(sc)
	var labels: Array[Label] = []
	for line in lines:
		var l := UI.label(line, 24, UI.TEXT_DIM, false, 4)
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.custom_minimum_size = Vector2(520, 0)
		vb.add_child(l)
		labels.append(l)
	if extra:
		vb.add_child(extra)
	var again := UI.art_button(primary_text, UI.PRIMARY_BTN, 520, 114, 36, Color("0c2416"))
	vb.add_child(again)
	var menu := UI.art_button(Lang.a("gameOver.menu"), UI.PILL_BTN, 260, 92, 28)
	menu.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	menu.pressed.connect(func(): exit_requested.emit())
	vb.add_child(menu)
	if _can_share():
		var share := UI.small_button(Lang.a("share.shareResult"), false, 22)
		share.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		share.pressed.connect(func(): _share_result(share))
		vb.add_child(share)

	await get_tree().process_frame
	panel.size = panel.get_combined_minimum_size()
	var final_pos := (size - panel.size) / 2.0
	panel.position = Vector2(final_pos.x, -panel.size.y - 40)
	var tw := create_tween()
	tw.tween_property(panel, "position", final_pos, 0.7).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	Sfx.result("win" if celebrate else ("draw" if happy else "loss"))
	return {"panel": panel, "lines": labels, "primary": again}


func _confetti(parent: Control) -> void:
	var colors := [BRIGHT[_sk(1)], BRIGHT[_sk(2)], UI.GOLD]
	var files := ["particle-pearl.webp", "particle-snow-2.webp" if Look.xmas() else "particle-leaf.webp", "particle-spark.webp"]
	for i in 3:
		var p := CPUParticles2D.new()
		p.texture = UI.tex(files[i])
		p.position = Vector2(size.x / 2.0, -30)
		p.emission_shape = CPUParticles2D.EMISSION_SHAPE_RECTANGLE
		p.emission_rect_extents = Vector2(size.x / 2.0, 10)
		p.amount = 40
		p.lifetime = 3.5
		p.direction = Vector2.DOWN
		p.spread = 25
		p.gravity = Vector2(0, 220)
		p.initial_velocity_min = 80
		p.initial_velocity_max = 260
		p.angular_velocity_min = -280
		p.angular_velocity_max = 280
		p.scale_amount_min = 0.08
		p.scale_amount_max = 0.2
		p.color = colors[i]
		parent.add_child(p)
		p.emitting = true


# ---------------------------------------------------------------- online

## System back (phone gesture, browser back, Esc) = the ‹ button.
func back_pressed() -> void:
	_on_back()


## ‹ : online → double-press resign; vs bot / daily → "Resign?" confirm;
## hot-seat → "Leave this game?" (no question before the first move).
func _on_back() -> void:
	if online:
		if _status != "active":
			exit_requested.emit()
		elif _time - _resign_armed < 2.5:
			_toast(Lang.t("resigning"))
			Online.send_special("resign")
		else:
			_resign_armed = _time
			_toast(Lang.t("again_to_resign"))
		return
	if s.finished or not _result.is_empty() or s.turn == 0 or mode == "coach":
		back_requested.emit()
		return
	var host := get_parent()
	if mode == "hotseat":
		host.confirm("%s
%s" % [Lang.a("game.hotseatLeaveTitle"), Lang.a("game.hotseatLeaveBody")],
			func():
				Store.clear_active()
				back_requested.emit(), Callable(), Lang.a("game.hotseatLeaveConfirm"))
	elif mode == "daily":
		var left: int = maxi(0, int(Daily.today_status().get("left", 3)) - 1)
		host.confirm("%s
%s" % [Lang.a("game.dailyForfeitTitle"), Lang.a("game.dailyForfeitBody", [left, 3])],
			resign, Callable(), Lang.a("game.dailyForfeitConfirm"))
	else:
		host.confirm("%s
%s" % [Lang.a("game.resignConfirmTitle"), Lang.a("game.resignConfirmBody")],
			resign, Callable(), Lang.a("game.resign"))


## Offline resign: only the human (player 1) can; it counts as a loss.
func resign() -> void:
	if s.finished or online:
		return
	var n := s.clone()
	n.finished = true
	n.winner = 2
	s = n
	finished_reason = "resign"
	busy = true
	_game_over()


func _toast(text: String) -> void:
	if _toast_label:
		_toast_label.queue_free()
	var l := UI.label(text, 30, UI.GOLD, true, 8)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	float_layer.add_child(l)
	l.size = Vector2(size.x - 40, 50)
	l.position = Vector2(20, size.y - 150)
	_toast_label = l
	var tw := l.create_tween()
	tw.tween_interval(2.2)
	tw.tween_property(l, "modulate:a", 0.0, 0.4)
	tw.tween_callback(l.queue_free)


func _send(a: int, before: GState) -> void:
	var ok := await Online.send_move(GState.action_json(b, a))
	if ok or not is_inside_tree():
		return
	_toast(Lang.t("move_failed"))
	# Server never accepted it: fall back to the last server state.
	var row := Online.game
	if row.get("state") is Dictionary:
		var server := GState.from_json(b, row.state)
		if server.turn <= before.turn:
			_resync(server)


func _on_server(row: Dictionary) -> void:
	_latest = row
	if not busy:
		_sync()


## Apply the newest server row: animate a single new move, resync otherwise.
func _sync() -> void:
	var row := _latest
	_latest = {}
	if row.is_empty():
		return
	_clock = row.get("clock", {}) if row.get("clock") is Dictionary else {}
	_status = str(row.get("status", "active"))
	if not _result.is_empty():
		_update_rematch(row)
		return
	if row.get("state") is Dictionary:
		var ns := GState.from_json(b, row.state)
		if ns.turn == s.turn + 1:
			var a := s.action_to(b, ns)
			if a != 0x7fffffff:
				_do(a, true)
				return
			_resync(ns)
		elif ns.turn > s.turn + 1:
			_resync(ns)
		elif ns.turn == s.turn and ns.colored != s.colored:
			_resync(ns)
	if _status == "finished":
		_online_over(row)
	else:
		_update_turn()


func _resync(ns: GState) -> void:
	s = ns
	_rebuild_board()
	for p in [1, 2]:
		shown_score[p] = float(s.scores[p])
		cards[p].score.text = str(s.scores[p])
	_update_hud()
	_update_turn()


func _fmt_ms(ms: float) -> String:
	var secs := int(ceil(maxf(ms, 0.0) / 1000.0))
	return "%d:%02d" % [secs / 60, secs % 60]


func _tick_clocks() -> void:
	if _clock.is_empty():
		return
	var started := float(_clock.get("turnStartedAt", 0)) > 0
	var cur := int(_clock.get("current", s.current))
	var now := Online.server_now_ms()
	for p in [1, 2]:
		var ms := float(_clock.get("p%dRemainingMs" % p, 0))
		if started and p == cur and _status == "active":
			ms -= now - float(_clock.turnStartedAt)
		var l: Label = cards[p].clock
		l.text = _fmt_ms(ms)
		l.add_theme_color_override("font_color", Color("ff8a7a") if ms < 20000 and _status == "active" else UI.TEXT)
		# Either side may claim a flag-fall; the server checks it is real.
		if p == cur and started and _status == "active" and ms < -500 and _time - _last_claim > 1.5:
			_last_claim = _time
			Online.send_special("timeout")
	# First-move abort: nobody moved within 10 s of the clock starting.
	var moved := b.pos.size() - s.empty
	if started and _status == "active" and moved <= 1 and now - float(_clock.turnStartedAt) > 10300 and _time - _last_claim > 1.5:
		_last_claim = _time
		Online.send_special("abort")


func _online_over(row: Dictionary) -> void:
	if not _result.is_empty():
		return
	busy = true
	_result = {"pending": true}
	_update_turn()
	await get_tree().create_timer(0.6).timeout
	if not is_inside_tree():
		return
	var reason := str(row.get("finished_reason", "normal"))
	var w = row.get("winner")
	var winner := 0
	if w is String and w == "draw":
		winner = 3
	elif w != null:
		winner = int(w)
	finished_reason = reason
	# multiplayerOutcome (GameOver.tsx): title + how it was decided.
	var title := Lang.a("gameOver.draw")
	var sub := ""
	var col := UI.TEXT
	var won := false
	var lost := false
	if reason == "aborted":
		title = Lang.a("gameOver.aborted")
		sub = Lang.a("gameOver.abortedSub")
	elif winner == my_slot:
		title = Lang.a("gameOver.youWin")
		col = BRIGHT[_sk(my_slot)]
		won = true
		sub = {"timeout": "gameOver.onTime", "resign": "gameOver.oppResigned", "disconnect": "gameOver.oppDisconnected"}.get(reason, "gameOver.onPoints")
		sub = Lang.a(sub)
	elif winner == 3 - my_slot:
		title = Lang.a("gameOver.youLost")
		col = BRIGHT[_sk(3 - my_slot)]
		lost = true
		sub = Lang.a({"timeout": "gameOver.onTime", "resign": "gameOver.youResigned", "disconnect": "gameOver.disconnected"}.get(reason, "gameOver.onPoints"))
	var lines := ["%s vs %s" % [_player_name(1), _player_name(2)], Lang.t("rating_pending")]
	if sub != "":
		lines.push_front(sub)
	var bot: bool = opp.get("opponent_is_bot", false)
	var extra := VBoxContainer.new()
	extra.add_theme_constant_override("separation", 10)
	var lobby := UI.small_button(Lang.a("gameOver.lobby"), false, 24)
	lobby.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	lobby.pressed.connect(func(): lobby_requested.emit())
	extra.add_child(lobby)
	var opp_uid := str(opp.get("opponent_uid", ""))
	var is_friend := Social.friends.any(func(f): return f.uid == opp_uid)
	if not bot and opp_uid != "" and not is_friend and reason != "aborted":
		var add := UI.small_button(Lang.a("gameOver.addAsFriend", [_player_name(3 - my_slot)]), false, 21)
		add.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		add.pressed.connect(func():
			add.disabled = true
			add.text = Lang.a("gameOver.sendingRequest")
			var e: String = await Social.send_request_uid(opp_uid)
			if not is_instance_valid(add):
				return
			if e == "":
				add.text = Lang.a("gameOver.friendRequestSent")
			else:
				add.disabled = false
				add.text = Lang.a("gameOver.couldntSend"))
		extra.add_child(add)
	# No rematch against a bot: the primary button goes back to the lobby.
	if bot:
		extra.queue_free()
	_result = await _result_panel(title, col, won, not lost, lines, Lang.a("gameOver.lobby") if bot else Lang.a("gameOver.rematch"), null if bot else extra)
	get_parent()._refresh_invite_card.call_deferred()
	if bot:
		_result.primary.pressed.connect(func(): lobby_requested.emit())
	else:
		_result.primary.pressed.connect(_toggle_rematch)
		_update_rematch(row)


var _rematch_on := false


func _toggle_rematch() -> void:
	_rematch_on = not _rematch_on
	_result.primary.text = Lang.a("gameOver.waitingForOpponent") if _rematch_on else Lang.a("gameOver.rematch")
	Online.request_rematch(_rematch_on)


func _update_rematch(row: Dictionary) -> void:
	if not _result.has("lines") or opp.get("opponent_is_bot", false):
		return
	var rm = row.get("rematch", {})
	var opp_wants := rm is Dictionary and bool(rm.get(str(3 - my_slot), false))
	if opp_wants and not _rematch_on:
		_result.primary.text = Lang.a("gameOver.acceptRematch")
	elif not _rematch_on:
		_result.primary.text = Lang.a("gameOver.rematch")


func _on_match_record(rec: Dictionary) -> void:
	if str(rec.get("id", "")) != str(opp.get("match_id", "")):
		return
	while not _result.has("lines"):
		if not is_inside_tree():
			return
		await get_tree().create_timer(0.2).timeout
	var before := int(rec.get("p%d_rating_before" % my_slot, 0))
	var after := int(rec.get("p%d_rating_after" % my_slot, 0))
	var delta := int(rec.get("p%d_rating_delta" % my_slot, after - before))
	_rating_delta = delta
	var l: Label = _result.lines[-1]
	if rec.get("ranked", true) == false or str(rec.get("finished_reason", "")) == "aborted":
		l.text = Lang.t("unrated")
	else:
		l.text = "%s  %d → %d  (%s%d)" % [Lang.a("gameOver.rating"), before, after, "+" if delta > 0 else "", delta]
		l.add_theme_color_override("font_color", UI.ACCENT if delta >= 0 else Color("ff8a7a"))


# ---------------------------------------------------------------- share result

var _rating_delta := 0
var _share_cb: JavaScriptObject


func _on_share_done(args: Array) -> void:
	var r := str(args[0]) if args.size() > 0 else "fail"
	if r == "saved+copied":
		_toast(Lang.a("share.imageSaved") + " · " + Lang.a("share.textCopied"))
	elif r == "saved":
		_toast(Lang.a("share.imageSaved"))
	elif r == "fail":
		_toast(Lang.a("share.couldNotShare"))


## Share-a-result (GameResultShareButton.tsx): every mode and outcome except
## aborted / resigned games and the lesson.
func _can_share() -> bool:
	return mode != "coach" and not auto_p1 and not finished_reason in ["aborted", "resign"]


## resultShareText.ts: the sharer's words + link (?ref=<code> when signed in).
func _share_text() -> String:
	var code := str(Online.profile.get("referral_code", "")) if Supa.signed_in() and Online.profile.get("referral_code") != null else ""
	var url := "https://www.dotduel.com/" + ("?ref=" + code.uri_encode() if code != "" else "")
	var r := "share.result."
	var sh := Lang.a("shapes." + shape)
	var s1: int = s.scores[1]
	var s2: int = s.scores[2]
	match mode:
		"daily":
			return Lang.a(r + "dailyShareText", [s1, url])
		"ai":
			var lv := Lang.a("difficulty.%d" % level) if level >= 1 else Lang.a(r + "genericBot")
			if s.winner == 1:
				return Lang.a(r + "aiShareTextWin", [lv, s1, s2, sh, url])
			if s.winner == 2:
				return Lang.a(r + "aiShareTextLoss", [lv, s2, s1, url])
			return Lang.a(r + "aiShareTextDraw", [lv, s1, s2, url])
		"online":
			var me: int = s.scores[my_slot]
			var them: int = s.scores[3 - my_slot]
			if s.winner == my_slot:
				var elo := " (+%d Elo)" % _rating_delta if _rating_delta > 0 else ""
				return Lang.a(r + "rankedShareTextWin", [me, them, elo, url])
			if s.winner == 3 - my_slot:
				return Lang.a(r + "rankedShareTextLoss", [me, them, url])
			return Lang.a(r + "rankedShareTextDraw", [me, them, url])
	if s.winner == 1 or s.winner == 2:
		var w := s.winner
		return Lang.a(r + "hotseatShareTextWin", [_player_name(w), _player_name(3 - w), s.scores[w], s.scores[3 - w], url])
	return Lang.a(r + "hotseatShareTextDraw", [_player_name(1), _player_name(2), s1, s2, url])


## The finished board + result panel as a JPEG, through the share sheet when
## the browser has one; otherwise the picture downloads and the text is copied.
func _share_result(btn: Button) -> void:
	btn.disabled = true
	btn.modulate.a = 0.0  # keep the button out of the picture
	await RenderingServer.frame_post_draw
	if not is_inside_tree():
		return
	var img := get_viewport().get_texture().get_image()
	btn.modulate.a = 1.0
	btn.text = Lang.a("share.preparing")
	var jpg := img.save_jpg_to_buffer(0.9)
	var text := _share_text()
	if OS.has_feature("web"):
		var js := """(async () => {
			const b = Uint8Array.from(atob(%s), c => c.charCodeAt(0));
			const file = new File([b], 'dotduel-result.jpg', {type: 'image/jpeg'});
			const text = %s;
			try {
				if (navigator.canShare && navigator.canShare({files: [file]})) {
					await navigator.share({title: %s, text, files: [file]});
					return 'shared';
				}
			} catch (e) { if (e && e.name === 'AbortError') return 'cancel'; }
			const u = URL.createObjectURL(file);
			const a = document.createElement('a');
			a.href = u; a.download = 'dotduel-result.jpg';
			document.body.appendChild(a); a.click(); a.remove();
			setTimeout(() => URL.revokeObjectURL(u), 5000);
			try { await navigator.clipboard.writeText(text); return 'saved+copied'; } catch (e) { return 'saved'; }
		})().then(r => window.__ddShareDone && window.__ddShareDone(r), () => window.__ddShareDone && window.__ddShareDone('fail'))"""
		_share_cb = JavaScriptBridge.create_callback(_on_share_done)
		JavaScriptBridge.get_interface("window").__ddShareDone = _share_cb
		JavaScriptBridge.eval(js % [JSON.stringify(Marshalls.raw_to_base64(jpg)), JSON.stringify(text), JSON.stringify(Lang.a("share.title"))], true)
	else:
		DisplayServer.clipboard_set(text)
		_toast(Lang.a("share.textCopied"))
	if is_instance_valid(btn):
		btn.disabled = false
		btn.text = Lang.a("share.shareResult")
