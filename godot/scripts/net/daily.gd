extends Node
## Daily puzzle (src/dailyPuzzles.ts, src/cloud/daily*.ts): one shared board per
## UTC day from the `daily-puzzle` Edge Function, 3 attempts, best score counts
## (`finalize_daily` RPC), results calendar from `daily_leaderboard`.

signal saved(seq: int)

const MAX_ATTEMPTS := 3
const CLOCK_S := 180.0

var status := {}  # {"attempts": n, "best": n, "left": n} for today, {} = unknown/none
var puzzle_id := -1
var _seq := 0
var _results := {}


func today_key() -> String:
	return Time.get_date_string_from_unix_time(int(Time.get_unix_time_from_system()))


static func puzzle_id_for(key: String) -> int:
	return int(Time.get_unix_time_from_datetime_string(key + "T00:00:00") / 86400)


func today_status() -> Dictionary:
	return status


## My attempts today (RLS scopes `daily_puzzles` to the signed-in player).
func refresh() -> void:
	if not Supa.signed_in():
		status = {}
		return
	var res: Dictionary = await Supa.http(HTTPClient.METHOD_GET, "/rest/v1/daily_puzzles?utc_date=eq.%s&select=puzzle_id,attempts,best&limit=1" % today_key())
	if not res.ok or not res.data is Array:
		return  # keep what we knew
	var row: Dictionary = res.data[0] if not res.data.is_empty() else {}
	var n := int(row.get("attempts", 0)) if row.get("attempts") != null else 0
	status = {"attempts": n, "best": int(row.get("best", 0)) if row.get("best") != null else 0, "left": MAX_ATTEMPTS - n}


## Today's puzzle: {shape, level, opening: [actions], key} or {} on failure.
func fetch_def() -> Dictionary:
	var key := today_key()
	var res: Dictionary = await Supa.invoke("daily-puzzle", {"date": key})
	if not res.ok or not res.data is Dictionary or not str(res.data.get("shape", "")) in BoardDef.SHAPES:
		return {}
	var d: Dictionary = res.data
	var b := BoardDef.get_board(d.shape)
	var actions := []
	for a in d.get("opening", []):
		if not a is Dictionary:
			continue
		if a.get("kind") == "dot":
			actions.append(int(a.dotId))
		elif a.get("kind") == "claim" and b.line_index.has(str(a.lineId)):
			actions.append(GState.claim_action(b.line_index[str(a.lineId)]))
	puzzle_id = puzzle_id_for(str(d.get("utcDate", key)))
	return {"shape": d.shape, "level": clampi(int(d.get("aiLevel", 4)), 1, 5), "opening": actions}


## The board after the shared opening (the player takes over as P1).
static func opening_state(b: BoardDef, actions: Array) -> GState:
	var s := GState.create(b)
	for a in actions:
		if s.finished:
			break
		if a >= 0 and (a >= b.pos.size() or s.colored[a] != 0):
			continue
		if a < 0 and not GState.claim_line(a) in s.pending:
			continue
		s = s.apply(b, a)
	return s


## Record an attempt. Returns {attempts, best, attemptsRemaining, streak:{current,longest}} or {}.
func finalize(score: int, display_name: String, latest := true) -> Dictionary:
	var res: Dictionary = await Supa.call_rpc("finalize_daily", {
		"p_utc_date": today_key(), "p_puzzle_id": puzzle_id, "p_p1_score": score, "p_display_name": display_name})
	if not res.ok or not res.data is Dictionary:
		return {}
	var r: Dictionary = res.data
	if latest:
		status = {"attempts": int(r.get("attempts", 0)), "best": int(r.get("best", score)), "left": int(r.get("attemptsRemaining", 0))}
	return r


## Fire-and-forget finalize, owned here so it completes even if the game
## screen is gone. Returns a ticket; `saved(ticket)` fires when result(ticket)
## is ready, so two quick attempts never swap results.
func save(score: int, display_name: String) -> int:
	_seq += 1
	_run_save(_seq, score, display_name)
	return _seq


func has_result(seq: int) -> bool:
	return _results.has(seq)


func result(seq: int) -> Dictionary:
	return _results.get(seq, {})


func _run_save(seq: int, score: int, display_name: String) -> void:
	var r := await finalize(score, display_name, seq == _seq)
	_results[seq] = r
	if not r.is_empty():
		var st = r.get("streak")
		Ach.record_daily(int(st.get("current", 0)) if st is Dictionary else 0, int(r.get("attempts", 0)) >= MAX_ATTEMPTS)
	saved.emit(seq)


## One month of results: {"results": {day: [{uid, name, best}]}, "defs": {day: {shape, level}}} or {} on error.
func fetch_month(month: String) -> Dictionary:
	var parts := month.split("-")
	var last := _days_in(int(parts[0]), int(parts[1]))
	var from := month + "-01"
	var to := "%s-%02d" % [month, last]
	var rows := []
	var offset := 0
	while true:
		var q := "/rest/v1/daily_leaderboard?select=utc_date,uid,display_name,best,attempts&utc_date=gte.%s&utc_date=lte.%s&best=not.is.null&order=utc_date.asc,best.desc,first_completed_at.asc.nullslast,uid.asc&offset=%d&limit=1000" % [from, to, offset]
		var res: Dictionary = await Supa.http(HTTPClient.METHOD_GET, q)
		if not res.ok or not res.data is Array:
			return {}
		rows.append_array(res.data)
		if res.data.size() < 1000:
			break
		offset += 1000
	var results := {}
	for r in rows:
		var day := str(r.utc_date)
		if not results.has(day):
			results[day] = []
		results[day].append({"uid": str(r.uid), "name": str(r.display_name) if r.display_name != null else "Anonymous", "best": int(r.best)})
	var defs := {}
	var dr: Dictionary = await Supa.http(HTTPClient.METHOD_GET, "/rest/v1/daily_puzzle_defs?select=utc_date,shape,ai_level&utc_date=gte.%s&utc_date=lte.%s" % [from, to])
	if dr.ok and dr.data is Array:
		for d in dr.data:
			defs[str(d.utc_date)] = {"shape": str(d.shape), "level": int(d.ai_level)}
	return {"results": results, "defs": defs}


func first_month() -> String:
	var row := await Supa.select_one("daily_leaderboard", "select=utc_date&best=not.is.null&order=utc_date.asc")
	return str(row.utc_date).left(7) if row.has("utc_date") else ""


static func _days_in(y: int, m: int) -> int:
	if m == 2:
		return 29 if (y % 4 == 0 and y % 100 != 0) or y % 400 == 0 else 28
	return 30 if m in [4, 6, 9, 11] else 31
