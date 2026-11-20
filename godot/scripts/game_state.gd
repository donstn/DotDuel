class_name GState
extends RefCounted
## Game state + rules, ported from src/game.ts (biggest-only + pending claims).
## An action is an int: >= 0 places a dot, < 0 claims pending line (-a - 1).

const OPEN := 0
const SCORED := 1
const PENDING := 2

var colored := PackedByteArray()
var line_state := PackedByteArray()
var line_owner := PackedByteArray()
var pending := PackedInt32Array()
var scores := PackedInt32Array([0, 0, 0])
var current := 1
var turn := 0
var empty := 0
var finished := false
var winner := 0  # 1, 2, or 3 = draw

# What the last action did (for the view).
var last_scored := -1
var last_points := 0
var last_new_pending := PackedInt32Array()


static func create(b: BoardDef) -> GState:
	var s := GState.new()
	s.colored.resize(b.pos.size())
	s.line_state.resize(b.lines.size())
	s.line_owner.resize(b.lines.size())
	s.empty = b.pos.size()
	return s


static func claim_action(line: int) -> int:
	return -line - 1


static func claim_line(action: int) -> int:
	return -action - 1


func clone() -> GState:
	var s := GState.new()
	s.colored = colored.duplicate()
	s.line_state = line_state.duplicate()
	s.line_owner = line_owner.duplicate()
	s.pending = pending.duplicate()
	s.scores = scores.duplicate()
	s.current = current
	s.turn = turn
	s.empty = empty
	s.finished = finished
	s.winner = winner
	return s


func apply(b: BoardDef, action: int) -> GState:
	assert(not finished)
	var n := clone()
	var p := current
	n.turn += 1
	if action >= 0:
		assert(colored[action] == 0)
		n.colored[action] = p
		n.empty -= 1
		var completing: Array[int] = []
		for li in b.dot_lines[action]:
			if n.line_state[li] != OPEN:
				continue
			var full := true
			for d in b.lines[li]:
				if n.colored[d] == 0:
					full = false
					break
			if full:
				completing.append(li)
		if completing.size() > 0:
			# Stable sort: longest first, ties keep board order (same as JS).
			var best := completing[0]
			for li in completing:
				if b.line_len[li] > b.line_len[best]:
					best = li
			n.line_state[best] = SCORED
			n.line_owner[best] = p
			n.last_scored = best
			n.last_points = b.line_len[best]
			for li in completing:
				if li != best:
					n.line_state[li] = PENDING
					n.pending.append(li)
					n.last_new_pending.append(li)
	else:
		var li := claim_line(action)
		var idx := n.pending.find(li)
		assert(idx >= 0)
		n.pending.remove_at(idx)
		n.line_state[li] = SCORED
		n.line_owner[li] = p
		n.last_scored = li
		n.last_points = b.line_len[li]
	n.scores[p] += n.last_points
	n.current = 3 - p
	if n.empty == 0 and n.pending.is_empty():
		n.finished = true
		n.winner = 1 if n.scores[1] > n.scores[2] else (2 if n.scores[2] > n.scores[1] else 3)
	return n


func actions(b: BoardDef) -> PackedInt32Array:
	var out := PackedInt32Array()
	for d in b.pos.size():
		if colored[d] == 0:
			out.append(d)
	for li in pending:
		out.append(claim_action(li))
	return out


func points_if_played(b: BoardDef, dot: int) -> int:
	if colored[dot] != 0:
		return 0
	var best := 0
	for li in b.dot_lines[dot]:
		if line_state[li] != OPEN or b.line_len[li] <= best:
			continue
		var ok := true
		for d in b.lines[li]:
			if d != dot and colored[d] == 0:
				ok = false
				break
		if ok:
			best = b.line_len[li]
	return best


func gain_of(b: BoardDef, action: int) -> int:
	if action < 0:
		return b.line_len[claim_line(action)]
	return points_if_played(b, action)


func points_left(b: BoardDef) -> int:
	return b.total_points - scores[1] - scores[2]


## Longest pending line through a coloured dot, or -1.
func pending_through(b: BoardDef, dot: int) -> int:
	var best := -1
	for li in b.dot_lines[dot]:
		if line_state[li] == PENDING and (best < 0 or b.line_len[li] > b.line_len[best]):
			best = li
	return best


# ---- server (src/types.ts GameState JSON) <-> GState ----

static func from_json(b: BoardDef, d: Dictionary) -> GState:
	var s := create(b)
	var colored: Dictionary = d.get("colored", {}) if d.get("colored") is Dictionary else {}
	for k in colored:
		var dot := int(k)
		if dot >= 0 and dot < s.colored.size() and s.colored[dot] == 0:
			s.colored[dot] = int(colored[k].get("player", 1))
			s.empty -= 1
	var completed = d.get("completed", [])
	if completed is Array:
		for c in completed:
			var li: int = b.line_index.get(str(c.get("lineId", "")), -1)
			if li >= 0:
				s.line_state[li] = SCORED
				s.line_owner[li] = int(c.get("player", 1))
	var pend = d.get("pending", [])
	if pend is Array:
		for id in pend:
			var li: int = b.line_index.get(str(id), -1)
			if li >= 0:
				s.line_state[li] = PENDING
				s.pending.append(li)
	var sc = d.get("scores", {})
	if sc is Dictionary:
		s.scores[1] = int(sc.get("1", 0))
		s.scores[2] = int(sc.get("2", 0))
	s.current = int(d.get("current", 1))
	s.turn = int(d.get("turn", 0))
	s.finished = bool(d.get("finished", false))
	var w = d.get("winner")
	if w is String and w == "draw":
		s.winner = 3
	elif w != null:
		s.winner = int(w)
	return s


## The website's GameState JSON (src/types.ts) — for the shared saved game.
## Per-dot/line turn numbers aren't tracked here; the order isn't shown anywhere.
func to_json(b: BoardDef, shape: String, mode: String, level: int) -> Dictionary:
	var col := {}
	for d in colored.size():
		if colored[d] != 0:
			col[str(d)] = {"player": colored[d], "turn": 0}
	var done := []
	for li in line_state.size():
		if line_state[li] == SCORED:
			done.append({"lineId": b.line_id[li], "player": line_owner[li], "turn": 0})
	var pend := []
	for li in pending:
		pend.append(b.line_id[li])
	var d := {"shape": shape, "mode": mode, "current": current, "turn": turn, "colored": col,
		"completed": done, "pending": pend, "scores": {"1": scores[1], "2": scores[2]},
		"finished": finished, "winner": null if winner == 0 else ("draw" if winner == 3 else winner)}
	if level > 0:
		d.difficulty = level
	return d


static func action_json(b: BoardDef, a: int) -> Dictionary:
	if a >= 0:
		return {"kind": "dot", "dotId": a}
	return {"kind": "claim", "lineId": b.line_id[claim_line(a)]}


## The single action that turns `self` into `next`, or 0x7fffffff if they are
## not exactly one move apart (then the caller resyncs without animation).
func action_to(b: BoardDef, next: GState) -> int:
	const NONE := 0x7fffffff
	if next.turn != turn + 1:
		return NONE
	for d in colored.size():
		if colored[d] == 0 and next.colored[d] != 0:
			return d
	for li in line_state.size():
		if line_state[li] == PENDING and next.line_state[li] == SCORED:
			return claim_action(li)
	return NONE
