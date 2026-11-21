extends Node
## Ranked online play against the SAME Supabase backend as the web/Android app
## (ports src/cloud/matchmaking.ts, onlineGame.ts, gameSession.ts, usernames.ts).

signal profile_changed
signal pairing_changed(pairing: Dictionary)
signal game_changed(row: Dictionary)
signal match_record(rec: Dictionary)
signal kicked  # another device took the game-session lock

const TIME_CONTROLS := [["1min", "BULLET", "1 minute each"], ["3min", "BLITZ", "3 minutes each"], ["5min", "RAPID", "5 minutes each"]]
const STALE_MS := 45000.0
const BOT_FALLBACK_S := 15.0
const NAME_RE := "^[A-Za-z0-9_À-ÖØ-öø-įĲ-ķĹ-ž-]{3,16}$"

var profile := {}
var has_username := false
var profile_loaded := false
var pairing := {}
var game := {}
var skew_ms := 0.0
var searching := false
var session_id := ""

var _search_gen := 0
var _pair_topic := ""
var _game_topic := ""
var _lock_topic := ""
var _hb: Timer
var _holding_lock := false


func _ready() -> void:
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	session_id = "godot.%x%x" % [rng.randi(), rng.randi()]
	_hb = Timer.new()
	_hb.wait_time = 15.0
	_hb.timeout.connect(_heartbeat)
	add_child(_hb)
	Supa.auth_changed.connect(_on_auth)


func me() -> String:
	return Supa.uid()


func my_slot() -> int:
	return int(pairing.get("player", 0))


func rating() -> int:
	return int(profile.get("rating", 1000))


func display_name() -> String:
	return str(profile.get("display_name", "")) if profile.get("display_name") != null else ""


func server_now_ms() -> float:
	return Supa.now_ms() + skew_ms


func _on_auth() -> void:
	if not Supa.signed_in():
		profile = {}
		profile_loaded = false
		Realtime.unsubscribe(_pair_topic)
		Realtime.unsubscribe(_lock_topic)
		_pair_topic = ""
		_lock_topic = ""
		profile_changed.emit()
		return
	Realtime.set_token(str(Supa.session.access_token))
	await load_profile()
	_watch_pairing()
	_watch_lock()


# ---------------------------------------------------------------- profile + username

func load_profile() -> void:
	profile = await Supa.select_one("profiles", "id=eq.%s&select=*" % me())
	var names := await Supa.select("usernames", "uid=eq.%s&select=lower&limit=1" % me())
	has_username = names.size() > 0 and display_name() != ""
	profile_loaded = true
	profile_changed.emit()
	Store.sync_cloud()


func suggest_name() -> String:
	var meta := Supa.user_meta()
	var full := str(meta.get("full_name", meta.get("name", "")))
	var first := full.strip_edges().split(" ")[0] if full != "" else ""
	var re := RegEx.create_from_string("[^A-Za-z0-9_À-ÖØ-öø-įĲ-ķĹ-ž-]")
	var s := re.sub(first, "", true).left(16)
	return s if s.length() >= 3 else ""


## Returns "" on success, else a short message.
func claim_username(desired: String) -> String:
	var name := desired.strip_edges()
	if not RegEx.create_from_string(NAME_RE).search(name):
		return Lang.t("name_rule")
	var lower := name.to_lower()
	var old_lower := display_name().strip_edges().to_lower()
	var existing := await Supa.select_one("usernames", "lower=eq.%s&select=uid" % lower.uri_encode())
	if not existing.is_empty() and existing.get("uid") != me():
		return Lang.t("name_taken")
	var res := await Supa.upsert("usernames", {"lower": lower, "uid": me(), "display_name": name})
	if not res.ok:
		var msg := str(res.data.get("message", res.code)) if res.data is Dictionary else str(res.code)
		Track.event("username_claim_failed", {"mode": "rename" if old_lower != "" else "claim", "error_code": msg})
		return Lang.t("name_taken") if res.code == 409 else Lang.t("name_failed", [res.code])
	# Rename (renameUsername in src/cloud/usernames.ts): free the old name.
	if old_lower != "" and old_lower != lower:
		await Supa.delete("usernames", "lower=eq.%s&uid=eq.%s" % [old_lower.uri_encode(), me()])
	await Supa.update("profiles", "id=eq.%s" % me(), {"display_name": name})
	await load_profile()
	return ""


# ---------------------------------------------------------------- one-device lock

## "free" | "mine" | "other"
func lock_state() -> String:
	var row := await Supa.select_one("game_sessions", "uid=eq.%s&select=session_id,claimed_at" % me())
	if row.is_empty():
		return "free"
	if str(row.get("session_id", "")) == session_id:
		return "mine"
	if Supa.now_ms() - float(row.get("claimed_at", 0)) > STALE_MS:
		return "free"
	return "other"


func claim_session() -> void:
	await Supa.upsert("game_sessions", {"uid": me(), "session_id": session_id, "claimed_at": int(Supa.now_ms())})
	_holding_lock = true
	_hb.start()


func release_session() -> void:
	_hb.stop()
	if _holding_lock:
		_holding_lock = false
		await Supa.delete("game_sessions", "uid=eq.%s&session_id=eq.%s" % [me(), session_id.uri_encode()])


func _heartbeat() -> void:
	if _holding_lock:
		await Supa.update("game_sessions", "uid=eq.%s&session_id=eq.%s" % [me(), session_id.uri_encode()], {"claimed_at": int(Supa.now_ms())})


func _watch_lock() -> void:
	_lock_topic = Realtime.subscribe("session:" + me(), "game_sessions", "uid=eq." + me(), _on_lock_change)


func _on_lock_change(type: String, rec: Dictionary) -> void:
	if _holding_lock and type != "DELETE" and str(rec.get("session_id", "")) != session_id:
		_holding_lock = false
		_hb.stop()
		_cleanup_match()
		kicked.emit()


# ---------------------------------------------------------------- matchmaking

func find_match(tc: String) -> bool:
	await claim_session()
	searching = true
	_search_gen += 1
	var gen := _search_gen
	var res := await Supa.upsert("matchmaking_queue", {"uid": me(), "rating": rating(), "time_control": tc, "shape": "triangle", "initial_range": 50}, "uid")
	if not res.ok:
		searching = false
		return false
	_pump(gen)
	_bot_fallback(gen)
	return true


func _pump(gen: int) -> void:
	for i in 8:
		if gen != _search_gen or not searching:
			return
		var res := await Supa.invoke("matchmake")
		if res.ok and res.data is Dictionary and (res.data.get("matched", false) or res.data.get("reason", "") == "not_in_queue"):
			return
		await get_tree().create_timer(2.0).timeout


func _bot_fallback(gen: int) -> void:
	await get_tree().create_timer(BOT_FALLBACK_S).timeout
	if gen == _search_gen and searching and pairing.is_empty():
		await Supa.invoke("request-bot-match")


func cancel_search() -> void:
	searching = false
	_search_gen += 1
	await Supa.delete("matchmaking_queue", "uid=eq.%s" % me())
	await release_session()


func _watch_pairing() -> void:
	_pair_topic = Realtime.subscribe("pairing:" + me(), "pairings", "uid=eq." + me(), _on_pair_change, _on_pair_ready)


func _on_pair_ready() -> void:
	var row := await Supa.select_one("pairings", "uid=eq.%s&select=*" % me())
	if not row.is_empty():
		_set_pairing(row)


func _on_pair_change(type: String, rec: Dictionary) -> void:
	if type == "DELETE":
		if not pairing.is_empty() and rec.get("match_id", pairing.match_id) == pairing.match_id:
			pairing = {}
			pairing_changed.emit({})
		return
	_set_pairing(rec)


func _set_pairing(row: Dictionary) -> void:
	if not pairing.is_empty() and row.get("match_id") == pairing.get("match_id"):
		return
	# A leftover pairing from a finished game (tab closed without leaving) is
	# cleared instead of dragging the player into an old result.
	var g := await Supa.select_one("games", "id=eq.%s&select=*" % str(row.get("match_id", "")))
	if g.is_empty() or (g.get("status") == "finished" and not searching and pairing.is_empty()):
		await Supa.delete("pairings", "uid=eq.%s" % me())
		return
	searching = false
	_search_gen += 1
	pairing = row
	game = g
	if not _holding_lock:
		await claim_session()
	_watch_game(str(row.match_id))
	_measure_skew()
	pairing_changed.emit(row)


# ---------------------------------------------------------------- game

func _watch_game(id: String) -> void:
	Realtime.unsubscribe(_game_topic)
	_game_topic = Realtime.subscribe("game:" + id, "games", "id=eq." + id, _on_game_change, _fetch_game.bind(id))


func _fetch_game(id: String) -> void:
	var row := await Supa.select_one("games", "id=eq.%s&select=*" % id)
	if not row.is_empty() and id == str(pairing.get("match_id", "")):
		_set_game(row)


func _on_game_change(type: String, rec: Dictionary) -> void:
	if type != "DELETE" and str(rec.get("id", "")) == str(pairing.get("match_id", "")):
		_set_game(rec)


func _set_game(row: Dictionary) -> void:
	var was_finished := str(game.get("status", "")) == "finished"
	game = row
	game_changed.emit(row)
	if row.get("status") == "finished" and not was_finished:
		_fetch_match_record(str(row.id))


func _fetch_match_record(id: String) -> void:
	for i in 12:
		var rec := await Supa.select_one("matches", "id=eq.%s&select=*" % id)
		if not rec.is_empty() and (rec.get("elo_finalized", false) or i >= 11):
			if id == str(pairing.get("match_id", "")):
				_record_achievements(rec)
				match_record.emit(rec)
				load_profile()
			return
		await get_tree().create_timer(1.0).timeout


## Ranked counters for achievements, here so they count even if the player
## left the results screen before the record arrived (App.tsx records on finish).
func _record_achievements(rec: Dictionary) -> void:
	if str(rec.get("finished_reason", "")) == "aborted":
		return
	var slot := 1 if str(rec.get("p1_uid", "")) == me() else 2
	var won := str(rec.get("winner", "")) == str(slot)
	var after = rec.get("p%d_rating_after" % slot)
	Ach.record_ranked(won, won and str(rec.get("finished_reason", "")) == "timeout", int(after) if after != null else 0)


func _measure_skew() -> void:
	var best := 0.0
	var best_rtt := INF
	for i in 3:
		var t0 := Supa.now_ms()
		var res := await Supa.call_rpc("server_now_ms")
		var t1 := Supa.now_ms()
		if not res.ok or res.data == null:
			continue
		if t1 - t0 < best_rtt:
			best_rtt = t1 - t0
			best = float(res.data) - (t0 + (t1 - t0) / 2.0)
	skew_ms = best


func mark_ready() -> void:
	await Supa.call_rpc("set_ready", {"p_game_id": pairing.match_id, "p_value": true})


func mark_board_loaded(state_current: int) -> void:
	if pairing.is_empty():
		return
	await Supa.call_rpc("set_board_loaded", {"p_game_id": pairing.match_id})
	if pairing.get("opponent_is_bot", false) and state_current != my_slot():
		var res := await Supa.invoke("submit-move", {"gameId": pairing.match_id, "action": {"kind": "botStart"}})
		if not res.ok and res.code >= 500:
			await get_tree().create_timer(1.5).timeout
			await Supa.invoke("submit-move", {"gameId": pairing.match_id, "action": {"kind": "botStart"}})


## Returns true when the server accepted the move.
func send_move(action: Dictionary) -> bool:
	var id := str(pairing.get("match_id", ""))
	for attempt in 3:
		var res := await Supa.invoke("submit-move", {"gameId": id, "action": action, "clientSentAt": int(server_now_ms())})
		if res.ok:
			return true
		if res.code >= 400 and res.code < 500:
			return false
		await get_tree().create_timer(0.35 * (attempt + 1)).timeout
	return false


func send_special(kind: String) -> void:
	await Supa.invoke("submit-move", {"gameId": pairing.get("match_id", ""), "action": {"kind": kind}})


func request_rematch(value: bool) -> void:
	await Supa.call_rpc("set_rematch", {"p_game_id": pairing.match_id, "p_value": value})


func leave_match() -> void:
	if not pairing.is_empty() and str(game.get("status", "")) == "finished":
		Supa.call_rpc("set_rematch", {"p_game_id": pairing.match_id, "p_value": false})
	_cleanup_match()
	await Supa.delete("pairings", "uid=eq.%s" % me())
	await release_session()


func _cleanup_match() -> void:
	Realtime.unsubscribe(_game_topic)
	_game_topic = ""
	pairing = {}
	game = {}
	searching = false
	_search_gen += 1


## Settings → Privacy (challenge_policy / show_presence), same columns as the app.
func update_privacy(patch: Dictionary) -> void:
	if not Supa.signed_in():
		return
	profile.merge(patch, true)
	if patch.get("show_presence") == false:
		Social.mark_offline()
	await Supa.update("profiles", "id=eq.%s" % me(), patch)
	profile_changed.emit()
