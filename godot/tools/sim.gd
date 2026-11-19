extends SceneTree
## Headless check: godot --headless --path godot -s res://tools/sim.gd
## Bots play each other; verifies every point gets scored and times the bots.

func _init() -> void:
	var fails := 0
	for shape in BoardDef.SHAPES:
		var b := BoardDef.get_board(shape)
		for pair in [[1, 5], [3, 4], [4, 5], [5, 5]]:
			var wins := [0, 0, 0, 0]
			var slowest := 0
			var games := 6 if pair.has(5) else 20
			for g in games:
				var s := GState.create(b)
				while not s.finished:
					var t := Time.get_ticks_msec()
					var lvl: int = pair[s.current - 1]
					s = s.apply(b, AI.pick(s, b, lvl, s.current))
					slowest = max(slowest, Time.get_ticks_msec() - t)
				if s.scores[1] + s.scores[2] != b.total_points:
					fails += 1
					print("INTEGRITY FAIL ", shape, " ", s.scores)
				for li in b.lines.size():
					if s.line_state[li] != GState.SCORED:
						fails += 1
				wins[s.winner] += 1
			print("%-9s L%d vs L%d  P1 %2d  P2 %2d  draw %d   slowest move %d ms" % [shape, pair[0], pair[1], wins[1], wins[2], wins[3], slowest])
		print("%-9s dots %d lines %d points %d" % [shape, b.pos.size(), b.lines.size(), b.total_points])
	print("RESULT: ", "OK" if fails == 0 else "FAIL %d" % fails)
	quit()
