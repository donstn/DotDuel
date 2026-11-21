class_name HowTo
extends RefCounted
## "How to play": looping scenes built by the REAL engine (same scenes as
## src/components/howto/sceneBuilders.ts), drawn by HowTo.Mini, plus the rules
## text. Each frame = {s: GState, last: dot, score: {dot, pts, p} or {}, hold: ms}.

const HOLD_EMPTY := 650
const HOLD_STEP := 560
const HOLD_SCORE := 1500
const HOLD_END := 1300
const ORDER := ["corner", "lineScored", "claim", "triThreeWays", "sqFourWays", "finish"]

static var _scenes: Array = []


class Rec:
	var b: BoardDef
	var s: GState
	var frames: Array = []

	func _init(shape: String) -> void:
		b = BoardDef.get_board(shape)
		s = GState.create(b)

	func hold(ms: int) -> void:
		frames.append({"s": s, "last": -1, "score": {}, "hold": ms})

	func silent(action: int, by: int) -> void:
		var c := s.clone()
		c.current = by
		s = c.apply(b, action)

	## Colour dots without running the engine (staging only, never scores).
	func prefill(dots: Array, by: int) -> void:
		var c := s.clone()
		for d in dots:
			if c.colored[d] == 0:
				c.colored[d] = by
				c.empty -= 1
				c.turn += 1
		s = c

	func place(dot: int, by: int, ms := HOLD_STEP) -> void:
		var c := s.clone()
		c.current = by
		s = c.apply(b, dot)
		var sc := {}
		if s.last_points > 0 and s.last_scored >= 0:
			sc = {"dot": dot, "pts": s.last_points, "p": by}
		frames.append({"s": s, "last": dot, "score": sc, "hold": maxi(ms, HOLD_SCORE) if sc else ms})

	func claim(li: int, by: int) -> void:
		var c := s.clone()
		c.current = by
		s = c.apply(b, GState.claim_action(li))
		frames.append({"s": s, "last": -1, "score": {"dot": b.lines[li][0], "pts": s.last_points, "p": by}, "hold": HOLD_SCORE})


static func dot_id(shape: String, r: int, c: int) -> int:
	if shape == "triangle":
		var id := 0
		for i in r:
			id += 8 - i
		return id + c
	return r * 7 + c


static func _line(b: BoardDef, id: String) -> int:
	return b.line_index[id]


static func _corners(b: BoardDef) -> Dictionary:
	var out := {}
	for li in b.lines.size():
		if b.line_len[li] == 1:
			out[b.lines[li][0]] = true
	return out


## Build one line with the players alternating: whoever places the LAST dot
## scores the whole line. Corner dots on it are pre-filled silently.
static func _play_line(rec: Rec, id: String, start_by: int) -> void:
	var corners := _corners(rec.b)
	var todo: Array = []
	var pre: Array = []
	for d in rec.b.lines[_line(rec.b, id)]:
		if rec.s.colored[d] != 0:
			continue
		if corners.has(d):
			pre.append(d)
		else:
			todo.append(d)
	if pre.size() > 0:
		rec.prefill(pre, 2)
	for i in todo.size():
		rec.place(todo[i], start_by if i % 2 == 0 else 3 - start_by, HOLD_SCORE if i == todo.size() - 1 else HOLD_STEP)


static func _corner() -> Array:
	var rec := Rec.new("triangle")
	rec.hold(HOLD_EMPTY)
	rec.place(dot_id("triangle", 1, 2), 2, 850)
	rec.place(dot_id("triangle", 2, 3), 1, 850)
	rec.place(dot_id("triangle", 7, 0), 1, HOLD_SCORE)
	rec.hold(HOLD_END)
	return rec.frames


static func _line_scored() -> Array:
	var rec := Rec.new("triangle")
	rec.hold(HOLD_EMPTY)
	_play_line(rec, "h:r3", 1)
	rec.hold(HOLD_END)
	return rec.frames


static func _claim() -> Array:
	var rec := Rec.new("square")
	var center := dot_id("square", 3, 3)
	var setup: Array = []
	for id in ["h:r3", "v:c3", "d1:d0", "d2:s6"]:
		for d in rec.b.lines[_line(rec.b, id)]:
			if d != center and not d in setup:
				setup.append(d)
	rec.prefill(setup, 2)
	rec.hold(HOLD_EMPTY + 300)
	rec.place(center, 1, HOLD_SCORE)
	rec.hold(800)
	var claimers := [2, 1, 2]
	var pend := Array(rec.s.pending)
	for i in pend.size():
		rec.claim(pend[i], claimers[i % 3])
	rec.hold(HOLD_END)
	return rec.frames


static func _ways(shape: String, ids: Array, gap: int, after: int) -> Array:
	var rec := Rec.new(shape)
	rec.hold(HOLD_EMPTY)
	for wi in ids.size():
		if wi > 0:
			rec.hold(gap)
		_play_line(rec, ids[wi], wi % 2 + 1)
		rec.hold(after)
	rec.hold(HOLD_END)
	return rec.frames


## A full greedy game; the scene replays its last 6 placements and the claims.
static func _finish() -> Array:
	var b := BoardDef.get_board("triangle")
	var actions: Array = []
	var st := GState.create(b)
	while not st.finished:
		var best_claim := -1
		var claim_val := -1
		for li in st.pending:
			if b.line_len[li] > claim_val:
				claim_val = b.line_len[li]
				best_claim = li
		var best_dot := -1
		var gain := -1
		for d in b.pos.size():
			if st.colored[d] != 0:
				continue
			var g := st.points_if_played(b, d)
			if g > gain:
				gain = g
				best_dot = d
		var act: int
		if best_dot < 0 or (best_claim >= 0 and claim_val >= gain and claim_val > 0):
			act = GState.claim_action(best_claim)
		else:
			act = best_dot
		actions.append([act, st.current])
		st = st.apply(b, act)
	var placed := 0
	var split := actions.size()
	for i in actions.size():
		if actions[i][0] >= 0:
			placed += 1
			if placed == b.pos.size() - 6:
				split = i + 1
				break
	var rec := Rec.new("triangle")
	for i in split:
		rec.silent(actions[i][0], actions[i][1])
	rec.hold(1500)
	for i in range(split, actions.size()):
		var act: int = actions[i][0]
		if act >= 0:
			rec.place(act, actions[i][1])
		else:
			rec.claim(GState.claim_line(act), actions[i][1])
	rec.hold(2600)
	return rec.frames


static func scenes() -> Array:
	if _scenes.is_empty():
		_scenes = [
			{"id": "corner", "shape": "triangle", "frames": _corner()},
			{"id": "lineScored", "shape": "triangle", "frames": _line_scored()},
			{"id": "claim", "shape": "square", "frames": _claim()},
			{"id": "triThreeWays", "shape": "triangle", "frames": _ways("triangle", ["h:r3", "d1:c2", "d2:s4"], 500, 700)},
			{"id": "sqFourWays", "shape": "square", "frames": _ways("square", ["h:r3", "v:c3", "d1:d0", "d2:s6"], 450, 650)},
			{"id": "finish", "shape": "triangle", "frames": _finish()},
		]
	return _scenes


## Small read-only board for the scenes (static strikes, no board animation;
## only the "+N" float rises, like the app).
class Mini:
	extends Control
	var b: BoardDef
	var frame: Dictionary = {}
	var _age := 0.0
	var _unit := 40.0
	var _r := 14.0
	var _dots := Node2D.new()
	var _top := Top.new()

	class Top:
		extends Node2D
		var fn: Callable

		func _draw() -> void:
			fn.call(self)

	func _ready() -> void:
		add_child(_dots)
		_top.fn = _draw_top
		add_child(_top)

	func show_frame(board: BoardDef, f: Dictionary) -> void:
		var new_score: bool = f.get("score", {}) != frame.get("score", {}) and not f.get("score", {}).is_empty()
		b = board
		frame = f
		if new_score:
			_age = 0.0
		queue_redraw()
		_top.queue_redraw()

	func _process(delta: float) -> void:
		_age += delta
		if not frame.get("score", {}).is_empty() and _age < 1.4:
			_top.queue_redraw()

	func _px(d: int) -> Vector2:
		return size / 2.0 + (b.pos[d] - b.bounds.get_center()) * _unit

	func _ends(li: int) -> Array:
		var ids := b.lines[li]
		var a := _px(ids[0])
		if ids.size() == 1:
			var dir := b.line_dir[li] * _r * 1.25
			return [a - dir, a + dir]
		var e := _px(ids[ids.size() - 1])
		var dir := (e - a).normalized() * _r * 0.75
		return [a - dir, e + dir]

	func _draw() -> void:
		if b == null or frame.is_empty():
			return
		_unit = minf(size.x / (b.bounds.size.x + 1.4), size.y / (b.bounds.size.y + 1.4))
		_r = _unit * 0.36
		var s: GState = frame.s
		var outline := PackedVector2Array()
		for v in b.outline:
			outline.append(size / 2.0 + (v - b.bounds.get_center()) * _unit)
		draw_colored_polygon(outline, Look.tone(Color(0.04, 0.14, 0.08, 0.95)))
		var closed := outline.duplicate()
		closed.append(outline[0])
		draw_polyline(closed, Look.tone(Color(0.75, 0.9, 0.6, 0.3)), maxf(2.0, _r * 0.16), true)
		for d in b.pos.size():
			if s.colored[d] == 0:
				draw_circle(_px(d), _r, Look.tone(Color(0.03, 0.08, 0.05)))
				draw_arc(_px(d), _r, 0, TAU, 32, Color(0, 0, 0, 0.6), _r * 0.09, true)
		for li in s.pending:
			var e := _ends(li)
			draw_line(e[0], e[1], Color(Look.pending_col, 0.85), _r * 0.22, true)
		var n := 0
		for d in b.pos.size():
			var p := s.colored[d]
			if p == 0:
				continue
			var sp: Sprite2D
			if n < _dots.get_child_count():
				sp = _dots.get_child(n)
			else:
				sp = Sprite2D.new()
				_dots.add_child(sp)
			sp.visible = true
			sp.texture = UI.tex("dot-p%d.webp" % p)
			sp.position = _px(d)
			var k := _r * 2.25 * Look.dot_scale / sp.texture.get_width()
			sp.scale = Vector2(k, k)
			n += 1
		for i in range(n, _dots.get_child_count()):
			_dots.get_child(i).visible = false
		_top.queue_redraw()

	func _draw_top(c: Node2D) -> void:
		if b == null or frame.is_empty():
			return
		var s: GState = frame.s
		for li in b.lines.size():
			if s.line_state[li] == GState.SCORED:
				var e := _ends(li)
				var p := s.line_owner[li]
				c.draw_line(e[0], e[1], Look.strike_outer[p], _r * 0.5, true)
				c.draw_line(e[0], e[1], Color(Look.strike_inner[p], 0.9), _r * 0.2, true)
		if frame.last >= 0:
			c.draw_arc(_px(frame.last), _r * 1.2, 0, TAU, 40, Color(1, 1, 0.85, 0.55), _r * 0.1, true)
		var sc: Dictionary = frame.score
		if not sc.is_empty() and _age < 1.4:
			var a := clampf(1.4 - _age, 0.0, 1.0)
			var at := _px(sc.dot) + Vector2(0, -_r * 1.6 - _age * _r * 2.0)
			var f := UI.font(true)
			var fs := int(_r * 1.7)
			var txt := "+%d" % sc.pts
			var wdt := f.get_string_size(txt, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x
			c.draw_string_outline(f, at - Vector2(wdt / 2.0, 0), txt, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, int(_r * 0.4), Color(0, 0, 0, 0.8 * a))
			c.draw_string(f, at - Vector2(wdt / 2.0, 0), txt, HORIZONTAL_ALIGNMENT_LEFT, -1, fs, Color(Look.bright[sc.p], a))
