extends Node
## Achievements (src/achievements/*): the catalogue from i18n/achievements.json,
## the unlocked set + pinned badge (dotduel:achievements:v1) and the counters
## (dotduel:ach-stats:v1) — the same localStorage the website uses — plus the
## player_achievements cloud sync. Toasts stay off, like the app.

signal changed

const KEY := "dotduel:achievements:v1"
const STATS := "dotduel:ach-stats:v1"
const PLAYABLE := ["triangle", "square", "rectangle"]
const ICONS := {
	"shape-triangle": "▲", "shape-square": "■", "shape-rectangle": "▬",
	"crown-triangle": "👑", "crown-square": "👑", "crown-rectangle": "👑", "crown-daily": "👑",
	"skull-triangle": "💀", "skull-square": "💀", "skull-rectangle": "💀",
	"spark": "✨", "trophy-s": "🏆", "claim": "🎯", "map": "🗺", "nightmare": "😈",
	"couch": "🛋", "calendar": "📅", "calendar-streak": "📆", "three": "③",
	"flame-day": "🔥", "calendar-dots": "🗓", "medal": "🏅", "sword": "⚔",
	"sword-win": "🗡", "fire": "🔥", "chevron": "⏫", "clock": "⏱", "upset": "🗿",
	"rematch": "🔁", "longline": "📏", "corner": "📐", "friend": "🤝", "refer": "📨",
	"share": "📤", "palette": "🎨", "fire-bot": "🤖",
}

var defs: Array = []
var tracks: Array = []
var by_id := {}
var _synced_uid := ""
var _backfilled := false


func _ready() -> void:
	var f := FileAccess.open("res://i18n/achievements.json", FileAccess.READ)
	if f:
		var d = JSON.parse_string(f.get_as_text())
		if d is Dictionary:
			defs = d.defs
			tracks = d.tracks
	for a in defs:
		by_id[a.id] = a
	Online.profile_changed.connect(_on_profile)
	Store.changed.connect(_queue_eval)
	Look.changed.connect(func(): record_theme(Look.id))
	record_theme.call_deferred(Look.id)


# ---------------------------------------------------------------- text

func title(id: String) -> String:
	var k := "achievements.byId.%s.title" % id
	return Lang.a(k) if Lang.has_key_in(k) else str(by_id.get(id, {}).get("title", id))


func desc(id: String) -> String:
	var k := "achievements.byId.%s.desc" % id
	return Lang.a(k) if Lang.has_key_in(k) else str(by_id.get(id, {}).get("desc", ""))


func track_label(label: String) -> String:
	var k := "achievements.tracks." + label
	return Lang.a(k) if Lang.has_key_in(k) else label


func icon(id: String) -> String:
	return ICONS.get(str(by_id.get(id, {}).get("icon", "")), "★")


# ---------------------------------------------------------------- unlocked set

func _load() -> Dictionary:
	var v = Store.read(KEY)
	var u = v.get("unlocked") if v is Dictionary else null
	var fe = v.get("featured") if v is Dictionary else null
	return {"unlocked": u if u is Dictionary else {}, "featured": fe}


func unlocked() -> Dictionary:
	return _load().unlocked


func is_unlocked(id: String) -> bool:
	return unlocked().has(id)


func unlocked_count() -> int:
	return unlocked().size()


## Adds ids not yet earned; returns the fresh ones.
func unlock(ids: Array) -> Array:
	var s := _load()
	var now := Time.get_datetime_string_from_system(true) + "Z"
	var fresh := []
	for id in ids:
		if by_id.has(id) and not s.unlocked.has(id):
			s.unlocked[id] = now
			fresh.append(id)
	if not fresh.is_empty():
		Store.write(KEY, s)
		changed.emit()
	return fresh


func featured() -> String:
	var s := _load()
	var f = s.featured
	return str(f) if f != null and s.unlocked.has(str(f)) else ""


func set_featured(id: String) -> void:
	var s := _load()
	s.featured = id if id != "" and s.unlocked.has(id) else null
	Store.write(KEY, s)
	changed.emit()
	if Supa.signed_in():
		Supa.update("profiles", "id=eq." + Online.me(), {"featured_achievement": s.featured})


# ---------------------------------------------------------------- counters

func _stats() -> Dictionary:
	var v = Store.read(STATS)
	var p: Dictionary = v if v is Dictionary else {}
	return {
		"impWins": p.get("impWins", {}) if p.get("impWins") is Dictionary else {},
		"rankedPlayed": int(p.get("rankedPlayed", 0)),
		"rankedWon": int(p.get("rankedWon", 0)),
		"rankedStreak": int(p.get("rankedStreak", 0)),
		"rankedBest": int(p.get("rankedBest", 0)),
		"botStreak": int(p.get("botStreak", 0)),
		"botBest": int(p.get("botBest", 0)),
		"days": p.get("days", []) if p.get("days") is Array else [],
		"dailyStreak": int(p.get("dailyStreak", 0)),
		"themes": p.get("themes", []) if p.get("themes") is Array else [],
		"flags": p.get("flags", []) if p.get("flags") is Array else [],
	}


static func _today() -> String:
	return Time.get_date_string_from_system(true)


static func _flag(a: Dictionary, name: String) -> void:
	if not name in a.flags:
		a.flags.append(name)


func _add_day(a: Dictionary) -> void:
	if not _today() in a.days:
		a.days.append(_today())


# ---------------------------------------------------------------- evaluation

func _player_name() -> String:
	if Supa.signed_in() and Online.display_name() != "":
		return Online.display_name()
	var n := str(Store.settings.get("playerName", ""))
	return n if n != "" else "Player 1"


func _rating() -> int:
	return int(Online.profile.get("rating", 0)) if Online.profile.get("rating") != null else 0


func _satisfied(id: String, c: Dictionary) -> bool:
	var a: Dictionary = c.a
	var parts := id.split("-")
	if id.begins_with("beat-") and parts.size() == 3 and parts[1] in PLAYABLE:
		return c.wins.get("%s:%s" % [parts[1], parts[2]], false) == true
	if id.begins_with("grandmaster-"):
		for d in range(1, 6):
			if c.wins.get("%s:%d" % [parts[1], d], false) != true:
				return false
		return true
	if id.begins_with("slayer-"):
		return int(a.impWins.get(parts[1], 0)) >= int(parts[2])
	var n := int(parts[-1]) if parts[-1].is_valid_int() else 0
	match id:
		"first-game": return c.total >= 1
		"first-win": return "firstWin" in a.flags
		"first-claim": return c.claims >= 1
		"all-shapes": return c.shapes >= PLAYABLE.size()
		"triple-impossible":
			for sh in PLAYABLE:
				if int(a.impWins.get(sh, 0)) < 3:
					return false
			return true
		"daily-first": return "dailyFirst" in a.flags
		"daily-all-attempts": return "dailyAllAttempts" in a.flags
		"daily-top": return "dailyTop" in a.flags
		"ranked-first": return a.rankedPlayed >= 1
		"ranked-first-win": return "rankedFirstWin" in a.flags
		"ranked-time-win": return "rankedTimeWin" in a.flags
		"ranked-upset": return "rankedUpset" in a.flags
		"ranked-rematch-win": return "rankedRematchWin" in a.flags
		"line-8": return "line8" in a.flags
		"biggest-line": return "bigLine" in a.flags
		"corner": return "corner" in a.flags
		"add-friend": return "addFriend" in a.flags
		"play-friend": return "playFriend" in a.flags
		"refer-friend": return "refer" in a.flags
		"share-card": return "shareCard" in a.flags
		"all-themes": return a.themes.size() >= 8
	if id.begins_with("hotseat-"): return c.hotseat >= n
	if id.begins_with("daily-streak-"): return a.dailyStreak >= n
	if id.begins_with("streak-"): return c.day_streak >= n
	if id.begins_with("days-"): return a.days.size() >= n
	if id.begins_with("total-"): return c.total >= n
	if id.begins_with("ranked-play-"): return a.rankedPlayed >= n
	if id.begins_with("ranked-win-"): return a.rankedWon >= n
	if id.begins_with("fire-"): return a.rankedBest >= n
	if id.begins_with("elo-"): return c.rating >= n
	if id.begins_with("botstreak-"): return a.botBest >= n
	if id.begins_with("claim-"): return c.claims >= n
	return false


## Evaluates every condition; unlocks (and pushes) the newly true ones.
func evaluate(rating_override := 0) -> Array:
	var p := Store.load_progress()
	var r := Store.row(_player_name())
	var ai := Store.total(r.vsAI.byShape)
	var hs := Store.total(r.hotseat.byShape)
	var a := _stats()
	var hot: int = hs.wins + hs.draws + hs.losses
	var shapes := 0
	for sh in PLAYABLE:
		if int(p.unlocked.get(sh, 0)) > 0:
			shapes += 1
	var c := {
		"wins": p.wins, "shapes": shapes, "hotseat": hot,
		"total": ai.wins + ai.draws + ai.losses + hot + a.rankedPlayed,
		"claims": int(Store.settings.get("claimsMade", 0)), "a": a,
		"rating": rating_override if rating_override > 0 else _rating(),
		"day_streak": int(Online.profile.get("streak_current", 0)) if Online.profile.get("streak_current") != null else 0,
	}
	var hits := []
	for d in defs:
		if _satisfied(d.id, c):
			hits.append(d.id)
	var fresh := unlock(hits)
	_push(fresh)
	return fresh


var _queued := false


## Game end changes the store several times; evaluate once afterwards.
func _queue_eval() -> void:
	if not _queued:
		_queued = true
		_reevaluate.call_deferred()


func _reevaluate() -> void:
	_queued = false
	if Supa.signed_in() and _synced_uid != Online.me():
		return  # wait for the cloud set first (no double work, like the app)
	evaluate()


# ---------------------------------------------------------------- recorders

## Local vs-AI / hot-seat game. max_line / corner: P1's biggest scored line and
## whether P1 scored a 1-point corner (App.tsx).
func record_local(mode: String, shape: String, level: int, won: bool, max_line: int, corner: bool) -> void:
	var a := _stats()
	_add_day(a)
	if won:
		_flag(a, "firstWin")
	if mode == "ai":
		a.botStreak = a.botStreak + 1 if won else 0
		a.botBest = maxi(a.botBest, a.botStreak)
		if won and level == 5:
			a.impWins[shape] = int(a.impWins.get(shape, 0)) + 1
	if max_line >= 8:
		_flag(a, "line8")
	if max_line >= 6:
		_flag(a, "bigLine")
	if corner:
		_flag(a, "corner")
	Store.write(STATS, a)
	evaluate()


func record_ranked(won: bool, on_time: bool, my_rating: int) -> void:
	var a := _stats()
	_add_day(a)
	a.rankedPlayed += 1
	_flag(a, "rankedFirst")
	if won:
		a.rankedWon += 1
		a.rankedStreak += 1
		a.rankedBest = maxi(a.rankedBest, a.rankedStreak)
		_flag(a, "firstWin")
		_flag(a, "rankedFirstWin")
		if on_time:
			_flag(a, "rankedTimeWin")
	else:
		a.rankedStreak = 0
	Store.write(STATS, a)
	evaluate(my_rating)


func record_daily(streak_current: int, all_attempts: bool) -> void:
	var a := _stats()
	a.dailyStreak = maxi(a.dailyStreak, streak_current)
	_flag(a, "dailyFirst")
	if all_attempts:
		_flag(a, "dailyAllAttempts")
	Store.write(STATS, a)
	evaluate()


func record_theme(theme: String) -> void:
	var a := _stats()
	if not theme in a.themes:
		a.themes.append(theme)
		Store.write(STATS, a)
	_reevaluate()  # waits for the sign-in sync, like the other stat checks


# ---------------------------------------------------------------- cloud

func _push(ids: Array) -> void:
	if ids.is_empty() or not Supa.signed_in():
		return
	var rows := ids.map(func(id): return {"uid": Online.me(), "achievement_id": id})
	Supa.http(HTTPClient.METHOD_POST, "/rest/v1/player_achievements?on_conflict=uid,achievement_id", rows, ["Prefer: resolution=ignore-duplicates,return=minimal"])


## On sign-in: union the cloud set into local, push local-only ones and the pin.
func _on_profile() -> void:
	if not Supa.signed_in():
		_synced_uid = ""  # signing back in re-syncs, like the app
		return
	if not Online.profile_loaded:
		return
	var me := Online.me()
	if _synced_uid == me:
		evaluate()  # rating / streak may have changed
		return
	_synced_uid = me
	var rows := await Supa.select("player_achievements", "select=achievement_id&uid=eq." + me)
	var cloud := rows.map(func(r): return str(r.achievement_id))
	unlock(cloud)
	var local_only := unlocked().keys().filter(func(id): return not id in cloud)
	_push(local_only)
	if featured() != "":
		Supa.update("profiles", "id=eq." + me, {"featured_achievement": featured()})
	evaluate()
