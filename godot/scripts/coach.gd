class_name Coach
extends RefCounted
## First-game lesson vs "Coach" (src/onboarding/coach.ts + CoachGame.tsx): a
## partly-filled Triangle, guided turns — corner → finish a line → two lines at
## once → claim the waiting one → find a line yourself — then free play with
## hints only when stuck. GameView asks this object what is allowed, what the
## Coach plays and what to mark on the board.

const OPENING_P1 := [2, 4, 6, 10, 13, 16, 18, 20, 22, 26, 29, 34]
const OPENING_P2 := [3, 5, 9, 11, 14, 17, 19, 21, 25, 27, 33]
const OPENING_LINES := [["d2:s4", 1], ["d1:c5", 1], ["d2:s3", 2], ["h:r6", 2], ["d1:c6", 2]]
const CORNER_DOT := 35
const FINISH_LINE := "h:r4"
const FINISH_DOT := 28
const DOUBLE_DOT := 15
const DOUBLE_LINES := ["h:r2", "d2:s2"]
const BOT_DELAY := 1.1
const BOT_DELAY_DOUBLE := 2.4
const BOT_DELAY_FREE := 0.65
const IDLE_HINT := 6.0

var b: BoardDef
var stage := "corner"
var misses := 0
var msg := ""
var idle := false
var bot_style := "quiet"
var next_stage := "finish"
var free_moves := 0
var _idle_t := 0.0


func _init() -> void:
	b = BoardDef.get_board("triangle")
	msg = Lang.a("coach.corner")


func opening() -> GState:
	var s := GState.create(b)
	for d in OPENING_P1:
		s.colored[d] = 1
	for d in OPENING_P2:
		s.colored[d] = 2
	s.empty = b.pos.size() - OPENING_P1.size() - OPENING_P2.size()
	for l in OPENING_LINES:
		var li: int = b.line_index[l[0]]
		s.line_state[li] = GState.SCORED
		s.line_owner[li] = l[1]
		s.scores[l[1]] += b.line_len[li]
	return s


func _li(id: String) -> int:
	return b.line_index[id]


func line_dots(li: int) -> Array:
	return Array(b.lines[li])


func _say(text: String) -> void:
	msg = text


# ---------------------------------------------------------------- helpers

func empty_dots(s: GState) -> Array:
	var out := []
	for d in b.pos.size():
		if s.colored[d] == 0:
			out.append(d)
	return out


func gain_at(s: GState, d: int) -> int:
	return s.points_if_played(b, d)


## Dots that would score now, best first.
func scoring_dots(s: GState) -> Array:
	var out := []
	for d in empty_dots(s):
		var g := gain_at(s, d)
		if g > 0:
			out.append([d, g])
	out.sort_custom(func(x, y): return x[1] > y[1])
	return out.map(func(x): return x[0])


## The longest line each given dot would finish (for the spotlight).
func lines_finished_by(s: GState, dots: Array) -> Array:
	var out := []
	for d in dots:
		var after := s.clone()
		after.current = 1
		after = after.apply(b, d)
		if after.last_scored >= 0:
			for x in b.lines[after.last_scored]:
				if not x in out:
					out.append(x)
	return out


func _pending_count_if(s: GState, d: int) -> int:
	var after := s.clone()
	after = after.apply(b, d)
	return after.last_new_pending.size()


func _lines_opened(s: GState, d: int) -> int:
	var n := 0
	for li in b.dot_lines[d]:
		var open := 0
		for x in b.lines[li]:
			if s.colored[x] == 0:
				open += 1
		if open == 2:
			n += 1
	return n


## A quiet move leaves every line that is already one dot short as it was.
func _keeps_gaps(s: GState, d: int) -> bool:
	var after := s.apply(b, d)
	for id in scoring_dots(s):
		if _pending_count_if(after, id) != _pending_count_if(s, id) or gain_at(after, id) != gain_at(s, id):
			return false
	return true


## The longest waiting line and a dot whose tap claims exactly it.
func claim_target(s: GState) -> Dictionary:
	if s.pending.is_empty():
		return {}
	var by_len := Array(s.pending)
	by_len.sort_custom(func(x, y): return b.line_len[x] > b.line_len[y])
	var li: int = by_len[0]
	for d in b.lines[li]:
		var only := true
		for other in by_len:
			if other != li and d in b.lines[other]:
				only = false
		if only:
			return {"line": li, "dot": d}
	return {"line": li, "dot": b.lines[li][0]}


func _best_reply(s: GState) -> int:
	var top := 0
	var sd := scoring_dots(s)
	if not sd.is_empty():
		top = gain_at(s, sd[0])
	for li in s.pending:
		top = maxi(top, b.line_len[li])
	return top


# ---------------------------------------------------------------- the Coach's move

func bot_action(s: GState) -> int:
	var empty := empty_dots(s)
	var style := bot_style
	if empty.is_empty():
		var by_len := Array(s.pending)
		by_len.sort_custom(func(x, y): return b.line_len[x] < b.line_len[y])
		return GState.claim_action(by_len[-1] if style == "greedy" else by_len[0])
	if style == "greedy":
		var sd := scoring_dots(s)
		if not sd.is_empty():
			return sd[0]
	if style == "easy":
		if s.pending.size() >= 1:
			var by_len := Array(s.pending)
			by_len.sort_custom(func(x, y): return b.line_len[x] < b.line_len[y])
			return GState.claim_action(by_len[0])
		var best_v := 1 << 30
		var pool := []
		for d in empty:
			var v := gain_at(s, d) - _best_reply(s.apply(b, d))
			if v < best_v:
				best_v = v
				pool = [d]
			elif v == best_v:
				pool.append(d)
		return pool.pick_random()
	var zero := empty.filter(func(d): return gain_at(s, d) == 0)
	if not zero.is_empty():
		var safe := zero.filter(func(d): return _keeps_gaps(s, d))
		var pool: Array = safe if not safe.is_empty() else zero
		var fewest := 1 << 30
		for d in pool:
			fewest = mini(fewest, _lines_opened(s, d))
		return pool.filter(func(d): return _lines_opened(s, d) == fewest).pick_random()
	empty.sort_custom(func(x, y): return gain_at(s, x) < gain_at(s, y))
	return empty[0]


func bot_delay() -> float:
	if next_stage == "claim":
		return BOT_DELAY_DOUBLE
	return BOT_DELAY_FREE if bot_style == "easy" else BOT_DELAY


func after_bot(gained: int) -> void:
	if bot_style == "quiet":
		_say(Lang.a({"finish": "coach.finish", "double": "coach.double", "claim": "coach.claim"}.get(next_stage, "coach.find")))
	elif bot_style == "greedy":
		_say(Lang.a("coach.botTook", [gained]) if gained > 0 else Lang.a("coach.free"))
	stage = next_stage
	_idle_t = 0.0


# ---------------------------------------------------------------- the player's move

func can_place(s: GState, d: int) -> bool:
	match stage:
		"corner":
			return d == CORNER_DOT
		"finish":
			return d == FINISH_DOT
		"double":
			return d == DOUBLE_DOT
		"claim":
			return false
		"find":
			return gain_at(s, d) > 0
	return true


func can_claim() -> bool:
	return stage == "claim" or stage == "free"


func refused() -> void:
	match stage:
		"corner":
			_say(Lang.a("coach.corner"))
		"finish":
			_say(Lang.a("coach.finishMiss"))
		"double":
			_say(Lang.a("coach.double"))
		"claim":
			_say(Lang.a("coach.claim"))
		"find":
			misses += 1
			_say(Lang.a("coach.findHelp") if misses >= 2 else Lang.a("coach.findMiss"))


func after_player(points: int) -> void:
	misses = 0
	idle = false
	_idle_t = 0.0
	match stage:
		"corner":
			_say(Lang.a("coach.cornerDone"))
			next_stage = "finish"
		"finish":
			_say(Lang.a("coach.finishDone"))
			next_stage = "double"
		"double":
			_say(Lang.a("coach.doubleDone", [points]))
			next_stage = "claim"
		"claim":
			_say(Lang.a("coach.claimDone", [points]))
			Store.set_setting("pendingTipSeen", true)
			next_stage = "find"
		"find":
			_say(Lang.a("coach.findDone", [points]))
			bot_style = "greedy"
			next_stage = "free"
			return
		_:
			free_moves += 1
			_say(Lang.a("coach.free") if free_moves == 1 else "")
			bot_style = "easy"
			return
	bot_style = "quiet"


func claim_only(s: GState, my_turn: bool) -> bool:
	return stage == "free" and my_turn and s.empty == 0 and s.pending.size() > 0


func shown_message(s: GState, my_turn: bool) -> String:
	return Lang.a("coach.claimEnd") if claim_only(s, my_turn) else msg


## Stuck in free play: after a while, show the best open line.
func tick(delta: float, s: GState, my_turn: bool) -> void:
	if stage != "free" or not my_turn or idle or claim_only(s, my_turn):
		return
	var can_score := not scoring_dots(s).is_empty()
	if not can_score and s.pending.is_empty():
		return
	_idle_t += delta
	if _idle_t >= IDLE_HINT:
		idle = true
		_say(Lang.a("coach.idleHint") if can_score else Lang.a("coach.claimHint"))


func show_waiting(s: GState) -> bool:
	return stage == "claim" or (stage == "double" and s.pending.size() > 0)


## What to mark: {spotlight: [dots], rings: [dots], bands: [lines], gap: dot,
## label: [dot, text], pointer: dot, waiting: bool}.
func marks(s: GState, my_turn: bool) -> Dictionary:
	var m := {}
	if show_waiting(s):
		m.waiting = true
		var sp := []
		var src: Array = DOUBLE_LINES.map(func(id): return _li(id)) if stage == "double" else Array(s.pending)
		for li in src:
			sp.append_array(line_dots(li))
		m.spotlight = sp
	if not my_turn:
		return m
	match stage:
		"corner":
			m.spotlight = [CORNER_DOT]
			m.rings = [CORNER_DOT]
			m.pointer = CORNER_DOT
		"finish":
			m.spotlight = line_dots(_li(FINISH_LINE))
			m.bands = [_li(FINISH_LINE)]
			m.gap = FINISH_DOT
			m.label = [FINISH_DOT, "+%d" % gain_at(s, FINISH_DOT)]
			m.pointer = FINISH_DOT
		"double":
			var sp := []
			for id in DOUBLE_LINES:
				sp.append_array(line_dots(_li(id)))
			m.spotlight = sp
			m.bands = DOUBLE_LINES.map(func(id): return _li(id))
			m.gap = DOUBLE_DOT
			m.pointer = DOUBLE_DOT
		"claim":
			var dots := []
			for li in s.pending:
				for d in b.lines[li]:
					if d != DOUBLE_DOT:
						dots.append(d)
			if not dots.is_empty():
				m.pointer = dots[0]
		"find":
			var open := scoring_dots(s)
			if misses >= 2:
				m.spotlight = lines_finished_by(s, open.slice(0, 2))
			if misses >= 3 and not open.is_empty():
				m.pointer = open[0]
		"free":
			if claim_only(s, my_turn) or (idle and scoring_dots(s).is_empty()):
				var t := claim_target(s)
				if not t.is_empty():
					m.waiting = true
					m.spotlight = line_dots(t.line)
					m.pointer = t.dot
			elif idle:
				m.spotlight = lines_finished_by(s, scoring_dots(s).slice(0, 1))
				m.rings = m.spotlight
	return m
