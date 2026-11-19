class_name AI
extends RefCounted
## The 5 bot levels, ported from src/ai.ts. Pure functions: safe on a thread.

const PENDING_DISCOUNT := 0.5
const BEGINNER_SCORE_RATE := 0.35
const EASY_SCORE_RATE := 0.6
const MEDIUM_SAFE_RATE := 0.1

const LEVEL_NAMES := ["", "Beginner", "Easy", "Medium", "Hard", "Impossible"]


static func pick(s: GState, b: BoardDef, level: int, me: int) -> int:
	match level:
		1: return _beginner(s, b)
		2: return _easy(s, b)
		3: return _medium(s, b)
		4: return _greedy_min_setup(s, b)
		_: return _deep(s, b, me)


static func _rand(arr: Array):
	return arr[randi() % arr.size()]


static func _shuffled(a: PackedInt32Array) -> Array:
	var arr := Array(a)
	arr.shuffle()
	return arr


static func _scoring(s: GState, b: BoardDef) -> Array:
	var out: Array = []
	for a in s.actions(b):
		var g := s.gain_of(b, a)
		if g > 0:
			out.append([a, g])
	return out


static func _biggest_of(scoring: Array) -> int:
	var top := 0
	for x in scoring:
		top = max(top, x[1])
	var best: Array = []
	for x in scoring:
		if x[1] == top:
			best.append(x[0])
	return _rand(best)


static func _fallback(s: GState, b: BoardDef) -> int:
	var dots: Array = []
	for d in b.pos.size():
		if s.colored[d] == 0:
			dots.append(d)
	if dots.size() > 0:
		return _rand(dots)
	return GState.claim_action(_rand(Array(s.pending)))


static func _beginner(s: GState, b: BoardDef) -> int:
	var sc := _scoring(s, b)
	if sc.size() > 0 and randf() < BEGINNER_SCORE_RATE:
		return _rand(sc)[0]
	return _fallback(s, b)


static func _easy(s: GState, b: BoardDef) -> int:
	var sc := _scoring(s, b)
	if sc.size() > 0 and randf() < EASY_SCORE_RATE:
		return _biggest_of(sc)
	return _fallback(s, b)


static func _medium(s: GState, b: BoardDef) -> int:
	var sc := _scoring(s, b)
	if sc.size() > 0:
		return _biggest_of(sc)
	if randf() < MEDIUM_SAFE_RATE:
		var before := _opp_best(s, b)
		var safe: Array = []
		for d in b.pos.size():
			if s.colored[d] == 0 and _opp_best(s.apply(b, d), b) <= before:
				safe.append(d)
		if safe.size() > 0:
			return _rand(safe)
	return _fallback(s, b)


## Gap dot -> points it would score right now.
static func _gap_gains(s: GState, b: BoardDef) -> Dictionary:
	var gains := {}
	for li in b.lines.size():
		if s.line_state[li] != GState.OPEN:
			continue
		var gap := -1
		var empties := 0
		for d in b.lines[li]:
			if s.colored[d] != 0:
				continue
			gap = d
			empties += 1
			if empties > 1:
				break
		if empties == 1 and b.line_len[li] > gains.get(gap, 0):
			gains[gap] = b.line_len[li]
	return gains


## Best immediate gain for whoever moves in `s` (claim or finish a line).
static func _opp_best(s: GState, b: BoardDef) -> int:
	var best := 0
	for li in s.pending:
		best = max(best, b.line_len[li])
	for g in _gap_gains(s, b).values():
		best = max(best, g)
	return best


static func _greedy_min_setup(s: GState, b: BoardDef) -> int:
	var acts := _shuffled(s.actions(b))
	var best: int = acts[0]
	var best_score := -INF
	for a in acts:
		var my_gain := s.gain_of(b, a)
		var after := s.apply(b, a)
		var opp := 0 if after.finished else _opp_best(after, b)
		var score := float(my_gain - opp)
		if score > best_score:
			best_score = score
			best = a
	return best


static func _pending_share(s: GState, me: int, b: BoardDef, leader: int) -> float:
	var lens: Array = []
	for li in s.pending:
		lens.append(b.line_len[li])
	lens.sort()
	lens.reverse()
	var v := 0.0
	var cur := leader
	for l in lens:
		v += (l if cur == me else -l) * PENDING_DISCOUNT
		cur = 3 - cur
	return v


static func _diff(s: GState, me: int) -> float:
	return float(s.scores[me] - s.scores[3 - me])


static func _follow_up(s: GState, me: int, b: BoardDef) -> float:
	if s.finished:
		return _diff(s, me)
	var best := _diff(s, me) + _pending_share(s, me, b, me)
	for dot in _gap_gains(s, b).keys():
		var after := s.apply(b, dot)
		best = max(best, _diff(after, me) + _pending_share(after, me, b, 3 - me))
	return best


static func _by_threat(s: GState, b: BoardDef, acts: Array) -> Array:
	var gains := _gap_gains(s, b)
	var keyed: Array = []
	for a in acts:
		keyed.append([1000 if a < 0 else gains.get(a, 0), a])
	keyed.sort_custom(func(x, y): return x[0] > y[0])
	var out: Array = []
	for k in keyed:
		out.append(k[1])
	return out


static func _deep(s: GState, b: BoardDef, me: int) -> int:
	var acts := _by_threat(s, b, _shuffled(s.actions(b)))
	var best: int = acts[0]
	var best_value := -INF
	for a in acts:
		var after := s.apply(b, a)
		var worst := INF
		if after.finished:
			worst = _diff(after, me)
		else:
			for reply in _by_threat(after, b, Array(after.actions(b))):
				worst = min(worst, _follow_up(after.apply(b, reply), me, b))
				if worst <= best_value:
					break
		if worst > best_value:
			best_value = worst
			best = a
	return best
