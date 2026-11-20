extends Node
## Local progression, settings and stats — a 1:1 port of src/storage.ts.
## On the web it uses the SAME localStorage keys and JSON shapes as the React
## site (same origin), so unlocks, names and stats carry over between the two;
## natively each key is a JSON file under user://store/.

const PROGRESS := "dotduel:progress:v3"
const SETTINGS := "dotduel:settings:v2"
const STATS := "dotduel:stats:v4"
const ACTIVE := "dotduel:activeGame:v1"
const ACTIVE_MAX_AGE_MS := 3 * 24 * 60 * 60 * 1000
const SHAPE_ORDER := ["triangle", "square", "rectangle", "rhombus"]
const DEFAULT_P1 := "Player 1"
const DEFAULT_P2 := "Player 2"

signal changed

var progress: Dictionary
var settings: Dictionary
var stats: Dictionary


var _dir := "user://store"


func _ready() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--autotest="):
			_dir = "user://store_autotest"  # tests never touch real progress
			DirAccess.remove_absolute(_dir + "/" + _path(ACTIVE).get_file())
	progress = load_progress()
	settings = load_settings()
	stats = load_stats()


# ---------------------------------------------------------------- raw io

func read(key: String) -> Variant:
	var raw := ""
	if OS.has_feature("web"):
		var v = JavaScriptBridge.eval("localStorage.getItem(%s)" % JSON.stringify(key), true)
		raw = v if v is String else ""
	else:
		var f := FileAccess.open(_path(key), FileAccess.READ)
		if f:
			raw = f.get_as_text()
	if raw == "":
		return null
	return JSON.parse_string(raw)


func write(key: String, value: Variant) -> void:
	var raw := JSON.stringify(value)
	if OS.has_feature("web"):
		JavaScriptBridge.eval("try{localStorage.setItem(%s,%s)}catch(e){}" % [JSON.stringify(key), JSON.stringify(raw)], true)
	else:
		DirAccess.make_dir_recursive_absolute(_dir)
		var f := FileAccess.open(_path(key), FileAccess.WRITE)
		if f:
			f.store_string(raw)


func remove(key: String) -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("try{localStorage.removeItem(%s)}catch(e){}" % JSON.stringify(key), true)
	else:
		DirAccess.remove_absolute(_path(key))


func _path(key: String) -> String:
	return _dir + "/" + key.replace(":", "_") + ".json"


# ---------------------------------------------------------------- progress

func _default_progress() -> Dictionary:
	return {"unlocked": {"triangle": 1, "square": 0, "rectangle": 0, "rhombus": 0}, "wins": {}}


func load_progress() -> Dictionary:
	var p = read(PROGRESS)
	var d := _default_progress()
	if p is Dictionary:
		if p.get("unlocked") is Dictionary:
			for k in p.unlocked:
				d.unlocked[k] = int(p.unlocked[k])
		if p.get("wins") is Dictionary:
			d.wins = p.wins
	return d


func is_unlocked(shape: String, level: int) -> bool:
	var u := int(progress.unlocked.get(shape, 0))
	return u > 0 and level <= u


func shape_unlocked(shape: String) -> bool:
	return int(progress.unlocked.get(shape, 0)) > 0


func prev_shape(shape: String) -> String:
	var i := SHAPE_ORDER.find(shape)
	return SHAPE_ORDER[i - 1] if i > 0 else ""


func next_shape(shape: String) -> String:
	var i := SHAPE_ORDER.find(shape)
	return SHAPE_ORDER[i + 1] if i >= 0 and i < SHAPE_ORDER.size() - 1 else ""


## Returns what the win unlocked: {"level": n or 0, "shape": id or ""}.
func record_win(shape: String, level: int) -> Dictionary:
	progress = load_progress()  # a website tab may have written since
	var out := {"level": 0, "shape": ""}
	progress.wins["%s:%d" % [shape, level]] = true
	if level < 5 and int(progress.unlocked.get(shape, 0)) < level + 1:
		progress.unlocked[shape] = level + 1
		out.level = level + 1
	if level >= 2:
		var after := next_shape(shape)
		if after != "" and int(progress.unlocked.get(after, 0)) == 0:
			progress.unlocked[after] = 1
			out.shape = after
	write(PROGRESS, progress)
	changed.emit()
	push_cloud()
	return out


## Signed in (src/cloud/progressSync.ts): merge with profiles.progress — the
## higher unlock per shape wins, wins are unioned — and save both ways.
func sync_cloud() -> void:
	if not Supa.signed_in():
		return
	var row: Dictionary = await Supa.select_one("profiles", "id=eq.%s&select=progress" % Online.me())
	var cloud = row.get("progress")
	progress = load_progress()
	if cloud is Dictionary:
		var cu: Dictionary = cloud.get("unlocked", {}) if cloud.get("unlocked") is Dictionary else {}
		for sh in SHAPE_ORDER:
			progress.unlocked[sh] = maxi(int(progress.unlocked.get(sh, 0)), int(cu.get(sh, 0)))
		progress.unlocked.triangle = maxi(1, int(progress.unlocked.triangle))
		if cloud.get("wins") is Dictionary:
			var w: Dictionary = cloud.wins.duplicate()
			w.merge(progress.wins, true)
			progress.wins = w
		write(PROGRESS, progress)
		changed.emit()
	push_cloud()


func push_cloud() -> void:
	if Supa.signed_in():
		await Supa.update("profiles", "id=eq.%s" % Online.me(), {"progress": progress})


func reset_progress() -> void:
	progress = _default_progress()
	write(PROGRESS, progress)
	changed.emit()
	push_cloud()


# ---------------------------------------------------------------- settings

func _default_settings() -> Dictionary:
	return {
		"playerName": DEFAULT_P1, "opponentName": DEFAULT_P2, "hotseatColorSwap": false,
		"tutorialSeen": false, "pendingTipSeen": false, "gamesPlayed": 0, "claimsMade": 0,
		"lastPlayedAt": 0, "sfxEnabled": true, "musicEnabled": true,
		"aiLossRun": {"key": "", "n": 0},
	}


func load_settings() -> Dictionary:
	var d := _default_settings()
	var s = read(SETTINGS)
	if s is Dictionary:
		d.merge(s, true)
	return d


func set_setting(key: String, value: Variant) -> void:
	settings = load_settings()
	settings[key] = value
	write(SETTINGS, settings)
	changed.emit()


func save_settings() -> void:
	write(SETTINGS, settings)
	changed.emit()


## Stored names stay English ("Player 1"); translate only for display.
func display_name(n: String) -> String:
	if n == DEFAULT_P1:
		return Lang.a("menu.player1Placeholder")
	if n == DEFAULT_P2:
		return Lang.a("menu.player2Placeholder")
	return n


## A finished vs-AI game: bump the learning counters and the loss run.
func note_game_played(claims: int) -> void:
	settings = load_settings()
	settings.gamesPlayed = int(settings.gamesPlayed) + 1
	settings.claimsMade = int(settings.claimsMade) + claims
	save_settings()


## Game start: lastPlayedAt moves only after an hour away (as App.tsx).
func note_game_started() -> void:
	var now := int(Time.get_unix_time_from_system() * 1000.0)
	settings = load_settings()
	if now - int(settings.get("lastPlayedAt", 0)) > 60 * 60 * 1000:
		settings.lastPlayedAt = now
		save_settings()


func note_ai_result(shape: String, level: int, outcome: String) -> int:
	var key := "%s:%d" % [shape, level]
	settings = load_settings()
	var run: Dictionary = settings.get("aiLossRun", {"key": "", "n": 0})
	if outcome == "loss":
		run = {"key": key, "n": (int(run.n) + 1) if run.key == key else 1}
	else:
		run = {"key": "", "n": 0}
	settings.aiLossRun = run
	save_settings()
	return int(run.n)


# ---------------------------------------------------------------- stats

func load_stats() -> Dictionary:
	var s = read(STATS)
	if s is Dictionary and s.get("players") is Dictionary:
		return s
	return {"players": {}}


static func norm_key(n: String) -> String:
	return n.strip_edges().to_lower()


func _empty_row(n: String) -> Dictionary:
	return {
		"name": n,
		"vsAI": {"byDifficulty": {}, "byShape": {}, "pointsScored": 0, "pointsGiven": 0},
		"hotseat": {"byShape": {}, "pointsScored": 0, "pointsGiven": 0},
		"byOpponent": {},
	}


func row(n: String) -> Dictionary:
	if n.strip_edges() == "":
		return _empty_row(n)
	return stats.players.get(norm_key(n), _empty_row(n))


func _bump(buckets: Dictionary, key: String, outcome: String) -> void:
	var cur: Dictionary = buckets.get(key, {"wins": 0, "draws": 0, "losses": 0})
	var f: String = {"win": "wins", "draw": "draws", "loss": "losses"}[outcome]
	cur[f] = int(cur.get(f, 0)) + 1
	buckets[key] = cur


## mode "ai" | "hotseat"; outcome "win" | "draw" | "loss".
func record_result(n: String, mode: String, outcome: String, shape: String, mine: int, theirs: int, level := 0, opp_key := "") -> void:
	if n.strip_edges() == "":
		return
	var key := norm_key(n)
	stats = load_stats()
	var r: Dictionary = stats.players.get(key, _empty_row(n))
	r.name = n
	if not r.has("byOpponent"):
		r.byOpponent = {}
	var m: Dictionary = r.vsAI if mode == "ai" else r.hotseat
	if mode == "ai" and level > 0:
		_bump(m.byDifficulty, str(level), outcome)
	_bump(m.byShape, shape, outcome)
	m.pointsScored = int(m.pointsScored) + mine
	m.pointsGiven = int(m.pointsGiven) + theirs
	if opp_key != "" and opp_key != key:
		_bump(r.byOpponent, opp_key, outcome)
	stats.players[key] = r
	write(STATS, stats)
	changed.emit()


static func total(buckets: Dictionary) -> Dictionary:
	var t := {"wins": 0, "draws": 0, "losses": 0}
	for v in buckets.values():
		if v is Dictionary:
			for f in t:
				t[f] += int(v.get(f, 0))
	return t


func reset_stats() -> void:
	stats = {"players": {}}
	remove(STATS)
	changed.emit()


func delete_player(n: String) -> void:
	stats = load_stats()
	var key := norm_key(n)
	stats.players.erase(key)
	for r in stats.players.values():
		if r.get("byOpponent") is Dictionary:
			r.byOpponent.erase(key)
	write(STATS, stats)
	changed.emit()


# ---------------------------------------------------------------- saved game

func save_active(g: Dictionary) -> void:
	g.savedAt = int(Time.get_unix_time_from_system() * 1000.0)
	write(ACTIVE, g)


func clear_active() -> void:
	remove(ACTIVE)


func load_active() -> Dictionary:
	var g = read(ACTIVE)
	if not g is Dictionary:
		return {}
	var now := int(Time.get_unix_time_from_system() * 1000.0)
	var ok: bool = g.get("mode") in ["ai", "hotseat"] and g.get("shape") is String \
		and (g.get("savedAt") is float or g.get("savedAt") is int) and now - int(g.savedAt) < ACTIVE_MAX_AGE_MS \
		and g.get("state") is Dictionary and not g.state.get("finished", true) 		and g.state.get("shape") == g.shape and g.shape in BoardDef.SHAPES 		and (g.mode == "hotseat" or (g.get("difficulty") is float and int(g.difficulty) >= 1 and int(g.difficulty) <= 5))
	if not ok:
		clear_active()
		return {}
	return g
