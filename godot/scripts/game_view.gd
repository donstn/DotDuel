class_name GameView
extends Control
## One match: HUD, painted board, input, bot turns and all the juice
## (dot pops, growing strikes, sparks, flying score, shake, callouts).

signal exit_requested
signal rematch_requested

const STRIKE_OUTER := [Color.WHITE, Color("2b8a4c"), Color("c8c878")]
const STRIKE_INNER := [Color.WHITE, Color("b8f5d3"), Color("ffffff")]
const BRIGHT := [Color.WHITE, UI.P1_BRIGHT, UI.P2_BRIGHT]
const CALLOUTS := {4: "NICE!", 5: "GREAT!", 6: "SUPERB!", 7: "AMAZING!", 8: "LEGENDARY!"}

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


class DrawLayer extends Node2D:
	var fn: Callable
	func _draw() -> void:
		fn.call(self)


func setup(p_shape: String, p_level: int) -> void:
	shape = p_shape
	level = p_level
	b = BoardDef.get_board(shape)
	s = GState.create(b)
	shown_left = b.total_points


func setup_online(pairing: Dictionary, row: Dictionary) -> void:
	online = true
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
	var mute := _round_button("")
	var spk := DrawLayer.new()
	spk.position = Vector2(42, 42)
	spk.fn = func(n: Node2D):
		var c := UI.TEXT
		n.draw_colored_polygon(PackedVector2Array([Vector2(-16, -6), Vector2(-8, -6), Vector2(2, -15), Vector2(2, 15), Vector2(-8, 6), Vector2(-16, 6)]), c)
		if Sfx.muted:
			n.draw_line(Vector2(7, -7), Vector2(19, 7), c, 4.0, true)
			n.draw_line(Vector2(19, -7), Vector2(7, 7), c, 4.0, true)
		else:
			n.draw_arc(Vector2(2, 0), 9, -0.9, 0.9, 12, c, 3.5, true)
			n.draw_arc(Vector2(2, 0), 16, -0.9, 0.9, 16, c, 3.5, true)
	mute.add_child(spk)
	mute.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	_offsets(mute, -108, 28, -24, 112)
	var toggle := func():
		Sfx.muted = not Sfx.muted
		Sfx.ambience(not Sfx.muted)
		spk.queue_redraw()
	mute.pressed.connect(toggle)
	add_child(mute)

	var banner := PanelContainer.new()
	banner.add_theme_stylebox_override("panel", UI.art_box(UI.BANNER, 92))
	banner.set_anchors_preset(Control.PRESET_CENTER_TOP)
	banner.custom_minimum_size = Vector2(380, 92)
	_offsets(banner, -190, 22, 190, 114)
	left_label = UI.label("", 30, UI.TEXT)
	banner.add_child(left_label)
	add_child(banner)
	waiting_label = UI.label("", 22, UI.GOLD, false, 5)
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


func _player_name(p: int) -> String:
	if online:
		if p == my_slot:
			return Online.display_name()
		return str(opp.get("opponent_display_name", "Opponent"))
	if level == 0:
		return "Green" if p == 1 else "Cream"
	if p == 1:
		return "Bot" if auto_p1 else "You"
	return "%s bot" % AI.LEVEL_NAMES[level]


func _make_card(p: int) -> Control:
	var wrap := Control.new()
	wrap.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	wrap.custom_minimum_size = Vector2(0, 150)
	wrap.mouse_filter = Control.MOUSE_FILTER_IGNORE

	var glow := Panel.new()
	var gsb := StyleBoxFlat.new()
	gsb.bg_color = Color(BRIGHT[p], 0.10)
	gsb.set_corner_radius_all(28)
	gsb.shadow_color = Color(BRIGHT[p], 0.55)
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
	sb.border_color = Color(BRIGHT[p], 0.55)
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
	var name_l := UI.label(_player_name(p), 26, UI.TEXT, false, 5)
	name_l.clip_text = true
	name_l.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	var score_l := UI.label("0", 64, BRIGHT[p], true, 10)
	score_l.resized.connect(func(): score_l.pivot_offset = score_l.size / 2.0)
	vb.add_child(name_l)
	vb.add_child(score_l)
	var clock_l := UI.label("", 26, UI.TEXT, true, 5)
	clock_l.visible = online
	clock_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT if p == 1 else HORIZONTAL_ALIGNMENT_RIGHT
	vb.add_child(clock_l)
	# Colour chip so each side's dot colour is obvious.
	var chip := TextureRect.new()
	chip.texture = UI.tex("dot-p%d.webp" % p)
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
		var d := UI.label("●", 22, BRIGHT[p], true, 4)
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
		left_label.text = "%d POINTS LEFT" % int(round(v))
	create_tween().tween_method(set_left, shown_left, float(left), 0.5)
	var n := s.pending.size()
	waiting_label.text = "" if n == 0 else ("%d line waiting — tap it to claim" % n if n == 1 else "%d lines waiting — tap to claim" % n)


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
	var top := 330.0
	var area := Rect2(24, top, size.x - 48, size.y - top - 40)
	var bw := b.bounds.size.x + 1.4
	var bh := b.bounds.size.y + 1.4
	unit = min(area.size.x / bw, area.size.y / bh, 130.0)
	r = unit * 0.36
	board.position = area.get_center()
	_rebuild_board()


func px(d: int) -> Vector2:
	return (b.pos[d] - b.bounds.get_center()) * unit


func line_ends(li: int) -> Array:
	var ids := b.lines[li]
	var a := px(ids[0])
	var e := px(ids[ids.size() - 1])
	if ids.size() == 1:
		var dir := b.line_dir[li] * r * 1.25
		return [a - dir, a + dir]
	var dir := (e - a).normalized() * r * 0.75
	return [a - dir, e + dir]


func _rebuild_board() -> void:
	for c in board.get_children():
		c.queue_free()
	dot_sprites.clear()

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
			sp.texture = UI.tex("dot-p%d.webp" % s.colored[d])
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


func _dot_scale(t: Texture2D) -> Vector2:
	var k := r * 2.25 / t.get_width()
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


func _draw_pending(n: Node2D) -> void:
	for li in s.pending:
		var ends := line_ends(li)
		var hot := hover_dot >= 0 and s.colored[hover_dot] != 0 and s.pending_through(b, hover_dot) == li
		var pulse := 0.5 + 0.5 * sin(_time * 4.0)
		n.draw_line(ends[0], ends[1], Color(UI.GOLD, 0.10 + 0.12 * pulse + (0.25 if hot else 0.0)), r * 0.9, true)
		_dash(n, ends[0], ends[1], Color(UI.GOLD, 0.95), r * 0.2, _time * r * 1.6)


func _draw_overlay(n: Node2D) -> void:
	var pulse := 0.5 + 0.5 * sin(_time * 6.0)
	if last_dot >= 0:
		n.draw_arc(px(last_dot), r * 1.18, 0, TAU, 48, Color(1, 1, 0.85, 0.35 + 0.25 * pulse), r * 0.08, true)
	if hover_dot >= 0 and s.colored[hover_dot] == 0:
		var c: Color = BRIGHT[s.current]
		n.draw_circle(px(hover_dot), r * (0.82 + 0.06 * pulse), Color(c, 0.28))
		n.draw_arc(px(hover_dot), r * 1.1, 0, TAU, 48, Color(c, 0.8), r * 0.1, true)
	if aim_dot >= 0:
		var c: Color = BRIGHT[s.current]
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


func _update_turn() -> void:
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
	var a := AI.pick(s, b, lvl, me)
	await get_tree().create_timer(randf_range(0.5, 0.85) / bot_speed).timeout
	if not is_inside_tree():
		return
	aim_dot = a if a >= 0 else b.lines[GState.claim_line(a)][0]
	await get_tree().create_timer(0.28 / bot_speed).timeout
	if not is_inside_tree():
		return
	aim_dot = -1
	thinking = false
	cards[me].think.visible = false
	_do(a)


func _do(a: int, remote := false) -> void:
	busy = true
	var p := s.current
	var before := s
	s = s.apply(b, a)
	if online and not remote:
		_send(a, before)
	hover_dot = -1
	var wait := 0.2
	if a >= 0:
		_place_fx(a, p)
		last_dot = a
	holes.queue_redraw()
	if s.last_scored >= 0:
		if a >= 0:
			await get_tree().create_timer(0.14).timeout
		_score_fx(s.last_scored, p, s.last_points, a < 0)
		wait = 0.5 + 0.05 * s.last_points
	if s.last_new_pending.size() > 0:
		_pending_fx(s.last_new_pending)
	_update_hud()
	await get_tree().create_timer(wait / bot_speed).timeout
	if is_inside_tree():
		_after_move()


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
		if not _can_act():
			return
		var d := _dot_at(e.position)
		if d < 0:
			return
		if s.colored[d] == 0:
			_do(d)
		else:
			var li := s.pending_through(b, d)
			if li >= 0:
				_do(GState.claim_action(li))
			else:
				_nope(d)


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
	sp.texture = UI.tex("dot-p%d.webp" % p)
	var full := _dot_scale(sp.texture)
	sp.visible = true
	sp.scale = full * 0.2
	var tw := create_tween()
	tw.tween_property(sp, "scale", full * 1.22, 0.12).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.tween_property(sp, "scale", full, 0.35).set_trans(Tween.TRANS_ELASTIC).set_ease(Tween.EASE_OUT)
	Sfx.play("place%d" % p, randf_range(0.94, 1.06))
	UI.particles_burst(board, px(d), BRIGHT[p], 10, r * 5.0, "particle-spark.webp", r / 260.0)
	var ring := _ring(px(d), BRIGHT[p])
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
	for spec in [[r * 1.1, Color(BRIGHT[p], 0.22)], [r * 0.5, STRIKE_OUTER[p]], [r * 0.2, Color(STRIKE_INNER[p], 0.9)]]:
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
				UI.particles_burst(board, at, BRIGHT[p], 8 + pts, r * 4.0, "particle-pearl.webp", r / 420.0)
		get_tree().create_timer(0.03 * i).timeout.connect(burst)
	var ends := line_ends(li)
	var mid: Vector2 = (ends[0] + ends[1]) / 2.0
	_fly_points(mid, p, ("CLAIMED +%d" if claimed else "+%d") % pts)
	shake = maxf(shake, 4.0 + pts * 1.8)
	if pts >= 4:
		_callout(CALLOUTS[mini(pts, 8)], BRIGHT[p])
	if pts >= 6:
		Engine.time_scale = 0.35
		var restore := func(): Engine.time_scale = 1.0
		get_tree().create_timer(0.14, true, false, true).timeout.connect(restore)


func _to_screen(local: Vector2) -> Vector2:
	return get_global_transform().affine_inverse() * (board.get_global_transform() * local)


func _fly_points(local: Vector2, p: int, text: String) -> void:
	var l := UI.label(text, 44, BRIGHT[p], true, 12)
	float_layer.add_child(l)
	l.size = Vector2(320, 60)
	l.pivot_offset = l.size / 2.0
	var start := _to_screen(local) - l.size / 2.0
	l.position = start
	l.scale = Vector2(0.3, 0.3)
	var score_l: Label = cards[p].score
	var target := score_l.get_global_rect().get_center() - get_global_position() - l.size / 2.0
	var tw := create_tween()
	tw.tween_property(l, "scale", Vector2(1.15, 1.15), 0.18).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_property(l, "position", start + Vector2(0, -50), 0.35).set_ease(Tween.EASE_OUT)
	tw.tween_interval(0.12)
	tw.tween_property(l, "position", target, 0.38).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tw.parallel().tween_property(l, "scale", Vector2(0.45, 0.45), 0.38)
	var land := func():
		_roll_score(p)
		Sfx.play("tick", 1.8, -6.0)
		UI.particles_burst(float_layer, target + l.size / 2.0, BRIGHT[p], 14, 220.0, "particle-spark.webp", 0.12)
		l.queue_free()
	tw.tween_callback(land)


func _callout(text: String, col: Color) -> void:
	var l := UI.label(text, 86, col, true, 16)
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
	for li in lines:
		var ends := line_ends(li)
		var mid: Vector2 = (ends[0] + ends[1]) / 2.0
		var l := UI.label("+%d WAITING" % b.line_len[li], 28, UI.GOLD, true, 8)
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


func _process(delta: float) -> void:
	_time += delta
	if overlay_layer:
		overlay_layer.queue_redraw()
	if pending_layer and s.pending.size() > 0:
		pending_layer.queue_redraw()
	if shake > 0.05:
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

func _game_over() -> void:
	busy = true
	_update_turn()
	await get_tree().create_timer(0.7).timeout
	if not is_inside_tree():
		return
	var human_won := level == 0 or s.winner == 1
	var title := ""
	var col := UI.TEXT
	match s.winner:
		3:
			title = "DRAW!"
		_:
			if level == 0:
				title = "%s WINS!" % _player_name(s.winner).to_upper()
			elif auto_p1:
				title = "%s WINS!" % ("GREEN" if s.winner == 1 else "CREAM")
			else:
				title = "VICTORY!" if s.winner == 1 else "DEFEAT"
			col = BRIGHT[s.winner]

	var subtitle := "%s vs %s · %s" % [_player_name(1), _player_name(2), b.label]
	var res: Dictionary = await _result_panel(title, col, human_won and s.winner != 3, s.winner == 3 or human_won, [subtitle], "PLAY AGAIN")
	res.primary.pressed.connect(func(): rematch_requested.emit())


## Builds the end-of-game panel. Returns {panel, lines: Array[Label], primary}.
func _result_panel(title: String, col: Color, celebrate: bool, happy: bool, lines: Array, primary_text: String) -> Dictionary:
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
	var again := UI.art_button(primary_text, UI.PRIMARY_BTN, 520, 114, 36, Color("0c2416"))
	vb.add_child(again)
	var menu := UI.art_button("MENU", UI.PILL_BTN, 260, 92, 28)
	menu.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	menu.pressed.connect(func(): exit_requested.emit())
	vb.add_child(menu)

	await get_tree().process_frame
	panel.size = panel.get_combined_minimum_size()
	var final_pos := (size - panel.size) / 2.0
	panel.position = Vector2(final_pos.x, -panel.size.y - 40)
	var tw := create_tween()
	tw.tween_property(panel, "position", final_pos, 0.7).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	if happy:
		Sfx.play_file("res://assets/audio/win-stream.mp3")
		Sfx.play("line8", 1.0, -2.0)
	else:
		Sfx.play_file("res://assets/audio/loss-rain.mp3")
		Sfx.play("line3", 0.7, -4.0)
	return {"panel": panel, "lines": labels, "primary": again}


func _confetti(parent: Control) -> void:
	var colors := [UI.P1_BRIGHT, UI.P2_BRIGHT, UI.GOLD]
	var files := ["particle-pearl.webp", "particle-leaf.webp", "particle-spark.webp"]
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

func _on_back() -> void:
	if not online or _status != "active":
		exit_requested.emit()
		return
	if _time - _resign_armed < 2.5:
		_toast("Resigning…")
		Online.send_special("resign")
	else:
		_resign_armed = _time
		_toast("Tap ‹ again to resign")


func _toast(text: String) -> void:
	if _toast_label:
		_toast_label.queue_free()
	var l := UI.label(text, 30, UI.GOLD, true, 8)
	float_layer.add_child(l)
	l.size = Vector2(size.x, 50)
	l.position = Vector2(0, size.y - 120)
	_toast_label = l
	var tw := l.create_tween()
	tw.tween_interval(2.2)
	tw.tween_property(l, "modulate:a", 0.0, 0.4)
	tw.tween_callback(l.queue_free)


func _send(a: int, before: GState) -> void:
	var ok := await Online.send_move(GState.action_json(b, a))
	if ok or not is_inside_tree():
		return
	_toast("Move didn't go through, try again")
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
	var title := "DRAW!"
	var col := UI.TEXT
	if reason == "aborted":
		title = "ABORTED"
	elif winner == my_slot:
		title = "VICTORY!"
		col = BRIGHT[my_slot]
	elif winner == 3 - my_slot:
		title = "DEFEAT"
		col = BRIGHT[3 - my_slot]
	var why: String = {"timeout": "on time", "resign": "by resignation", "aborted": "nobody moved in time · no rating change", "normal": "", "disconnect": "opponent left"}.get(reason, "")
	var lines := ["%s vs %s%s" % [_player_name(1), _player_name(2), "" if why == "" else " · " + why], "Rating…"]
	_result = await _result_panel(title, col, title == "VICTORY!", title != "DEFEAT", lines, "REMATCH")
	_result.primary.pressed.connect(_toggle_rematch)
	_update_rematch(row)


var _rematch_on := false


func _toggle_rematch() -> void:
	_rematch_on = not _rematch_on
	_result.primary.text = "WAITING…" if _rematch_on else "REMATCH"
	Online.request_rematch(_rematch_on)


func _update_rematch(row: Dictionary) -> void:
	if not _result.has("lines"):
		return
	var rm = row.get("rematch", {})
	var opp_wants := rm is Dictionary and bool(rm.get(str(3 - my_slot), false))
	if opp_wants and not _rematch_on:
		_result.primary.text = "ACCEPT REMATCH"
	elif not _rematch_on:
		_result.primary.text = "REMATCH"


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
	var l: Label = _result.lines[1]
	if rec.get("ranked", true) == false or str(rec.get("finished_reason", "")) == "aborted":
		l.text = "Unrated game"
	else:
		l.text = "Rating %d  (%s%d)" % [after, "+" if delta >= 0 else "", delta]
		l.add_theme_color_override("font_color", UI.ACCENT if delta >= 0 else Color("ff8a7a"))
