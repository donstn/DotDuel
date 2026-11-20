extends Node
## Friends, presence and game invites (src/cloud/friends.ts, presence.ts,
## invites.ts). Lists refresh on Realtime changes; friends' presence is polled.

signal changed  # friends / requests / statuses / invites updated

const STALE_MS := 90_000
const HEARTBEAT_S := 60.0
const POLL_S := 20.0

var friends: Array = []    # [{id, uid, name}] sorted by name
var incoming: Array = []   # requests sent to me [{id, uid, name}]
var outgoing: Array = []   # requests I sent
var status := {}           # uid -> "menu" | "in-ai" | … | "offline"
var invites_in: Array = [] # pending invites to me (rows)
var invites_out: Array = []

var _topics: Array = []
var _me := ""
var _written := ""
var _since_beat := 0.0
var _since_poll := 0.0
var _since_status := 0.0
var _stopped := false


func _ready() -> void:
	Supa.auth_changed.connect(_on_auth)
	Online.profile_changed.connect(_referral)
	_capture_ref()


func _on_auth() -> void:
	for t in _topics:
		Realtime.unsubscribe(t)
	_topics.clear()
	if not Supa.signed_in():
		if _me != "":
			_me = ""
			friends = []
			incoming = []
			outgoing = []
			invites_in = []
			invites_out = []
			status = {}
			_written = ""
			changed.emit()
		return
	_me = Supa.uid()
	_stopped = false
	# Unfiltered (RLS limits the rows): filtered channels never get DELETEs,
	# so a friend removing you would never show up. Refetch on join too.
	_topics.append(Realtime.subscribe("frienddata:" + _me, "friendships", "", func(_t, _r): load_friends(), load_friends))
	_topics.append(Realtime.subscribe("invites:" + _me, "invites", "", func(_t, _r): load_invites(), load_invites))
	await load_friends()
	load_invites()


func _process(delta: float) -> void:
	if _me == "":
		return
	_since_status += delta
	_since_beat += delta
	_since_poll += delta
	if _since_status >= 2.0:
		_since_status = 0.0
		_write_status()
	if _since_beat >= HEARTBEAT_S:
		_since_beat = 0.0
		if _written != "" and _presence_on() and not _stopped:
			Supa.update("presence", "uid=eq." + _me, {"last_seen": _iso_now()})
	if _since_poll >= POLL_S:
		_since_poll = 0.0
		load_friends()
		load_invites()


# ---------------------------------------------------------------- friends

func load_friends() -> void:
	if _me == "":
		return
	var res: Dictionary = await Supa.http(HTTPClient.METHOD_GET, "/rest/v1/friendships?select=*&or=(uid_a.eq.%s,uid_b.eq.%s)" % [_me, _me])
	if not res.ok or not res.data is Array:
		return  # keep the last good lists
	var f := []
	var i := []
	var o := []
	for r in res.data:
		var other := str(r.uid_b) if str(r.uid_a) == _me else str(r.uid_a)
		var names = r.get("display_names")
		var nm := str(names.get(other, "Player")) if names is Dictionary else "Player"
		var item := {"id": str(r.id), "uid": other, "name": nm}
		if r.status == "accepted":
			f.append(item)
		elif r.status == "pending":
			(i if str(r.requested_by) != _me else o).append(item)
	f.sort_custom(func(a, b): return a.name.naturalnocasecmp_to(b.name) < 0)
	friends = f
	incoming = i
	outgoing = o
	changed.emit()
	load_presence()


func online_count() -> int:
	var n := 0
	for f in friends:
		if status_of(f.uid) != "offline":
			n += 1
	return n


func status_of(uid: String) -> String:
	return str(status.get(uid, "offline"))


func load_presence() -> void:
	if friends.is_empty():
		return
	var ids := ",".join(friends.map(func(f): return f.uid))
	var rows := await Supa.select("presence", "select=uid,status,status_updated_at,last_seen&uid=in.(%s)" % ids)
	var next := {}
	for f in friends:
		next[f.uid] = "offline"
	var now := Time.get_unix_time_from_system() * 1000.0
	for r in rows:
		var ts_raw = r.get("last_seen") if r.get("last_seen") != null else r.get("status_updated_at")
		var ts := _ms(ts_raw)
		if r.get("status") != null and now - ts <= STALE_MS:
			next[str(r.uid)] = str(r.status)
	if next != status:
		status = next
		changed.emit()


## "" on success, else a short message.
func _rpc(fn: String, args: Dictionary) -> String:
	var res: Dictionary = await Supa.call_rpc(fn, args)
	if res.ok:
		load_friends()
		return ""
	return _err(res)


func send_request(username: String) -> String:
	return await _rpc("send_friend_request", {"target_username": username.strip_edges()})


func send_request_uid(uid: String) -> String:
	return await _rpc("send_friend_request", {"target_uid": uid})


func accept(id: String) -> String:
	return await _rpc("accept_friend_request", {"p_friendship_id": id})


func decline(id: String) -> String:
	return await _rpc("decline_friend_request", {"p_friendship_id": id})


func remove(id: String) -> String:
	return await _rpc("remove_friend", {"p_friendship_id": id})


func block(uid: String) -> String:
	return await _rpc("block_user", {"p_blocked": uid})


func unblock(uid: String) -> String:
	return await _rpc("unblock_user", {"p_blocked": uid})


func blocked() -> Array:
	var rows := await Supa.select("blocks", "select=blocked&blocker=eq." + _me)
	if rows.is_empty():
		return []
	var uids: Array = rows.map(func(r): return str(r.blocked))
	var names := await Supa.select("usernames", "select=uid,display_name&uid=in.(%s)" % ",".join(uids))
	var by := {}
	for n in names:
		by[str(n.uid)] = str(n.display_name)
	var out: Array = uids.map(func(u): return {"uid": u, "name": by.get(u, "Player")})
	out.sort_custom(func(a, b): return a.name.naturalnocasecmp_to(b.name) < 0)
	return out


# ---------------------------------------------------------------- presence

func _presence_on() -> bool:
	return Online.profile.get("show_presence") != false


## The screen we're on, as React's PresenceStatus.
func _current() -> String:
	var m = get_tree().current_scene
	if m == null or not "where" in m:
		return "menu"
	var w := str(m.where)
	if w == "searching":
		return "searching-ranked"
	if w == "online_game" and m.screen is GameView and m.screen.s.finished:
		return "menu"  # results screen: friends may invite again (App.tsx)
	if w in ["online_game", "found"]:
		return "in-ranked"
	if w == "game":
		var g = m.screen
		var mode := str(g.mode) if g is GameView else "ai"
		return {"hotseat": "in-hotseat", "daily": "in-daily"}.get(mode, "in-ai")
	return "menu"


## Signing out: no more status writes (one landing after the offline write
## would show us online for another 90 s).
func stop() -> void:
	_stopped = true


func _write_status() -> void:
	if _stopped:
		return
	if not _presence_on():
		_written = ""
		return
	var st := _current()
	if st == _written:
		return
	_written = st
	_since_beat = 0.0
	var now := _iso_now()
	Supa.upsert("presence", {"uid": _me, "status": st, "status_updated_at": now, "last_seen": now})


## Sign-out / privacy off: show as offline straight away.
func mark_offline() -> void:
	if _me == "":
		return
	_written = ""
	await Supa.update("presence", "uid=eq." + _me, {"last_seen": "1970-01-01T00:00:00Z"})


# ---------------------------------------------------------------- invites

func load_invites() -> void:
	if _me == "":
		return
	var now := Time.get_unix_time_from_system() * 1000.0
	var live := func(rows: Array) -> Array:
		var out := rows.filter(func(r): return r.get("expires_at") == null or _ms(r.expires_at) >= now)
		out.sort_custom(func(a, b): return _ms(a.get("created_at")) > _ms(b.get("created_at")))
		return out
	var a := await Supa.select("invites", "select=*&status=eq.pending&to_uid=eq." + _me)
	var b := await Supa.select("invites", "select=*&status=eq.pending&from_uid=eq." + _me)
	var na: Array = live.call(a)
	var nb: Array = live.call(b)
	if na != invites_in or nb != invites_out:
		invites_in = na
		invites_out = nb
		changed.emit()


func name_of(uid: String) -> String:
	for f in friends:
		if f.uid == uid:
			return f.name
	return ""


func send_invite(to_uid: String, shape: String, tc: String, ranked: bool) -> String:
	var res: Dictionary = await Supa.call_rpc("send_invite", {"p_to_uids": [to_uid], "p_shape": shape, "p_time_control": tc, "p_from_ranked": ranked})
	if not res.ok:
		return _err(res)
	await load_invites()
	return ""


func cancel_invite(id: String) -> void:
	await Supa.call_rpc("cancel_invite", {"p_invite_id": id})
	load_invites()


func decline_invite(id: String) -> void:
	await Supa.call_rpc("decline_invite", {"p_invite_id": id})
	load_invites()


## Accept (accept-invite Edge Function writes both pairings; Online's pairing
## watch then opens Match found). "" on success.
func accept_invite(id: String, ranked: bool) -> String:
	var res: Dictionary = await Supa.invoke("accept-invite", {"inviteId": id, "ranked": ranked})
	load_invites()
	if res.ok and res.data is Dictionary and res.data.get("ok") == true:
		return ""
	return str(res.data.get("error", "")) if res.data is Dictionary and res.data.get("error") else _err(res)


# ---------------------------------------------------------------- referrals

const REFERRER := "dotduel:referrer:v1"
const REF_CODE := "^[A-Za-z2-9]{6}$"


## Web landing with ?ref=<code> (App.tsx): remember it for the friend request
## (this tab) and for attribution (30 days), same keys as the website.
func _capture_ref() -> void:
	if not OS.has_feature("web"):
		return
	var ref = JavaScriptBridge.eval("new URLSearchParams(location.search).get('ref') || ''", true)
	var code := str(ref) if ref != null else ""
	if code == "" or not RegEx.create_from_string("^[a-zA-Z0-9_-]{1,128}$").search(code):
		return
	var pending = JavaScriptBridge.eval("sessionStorage.getItem('dotduel:pendingFriendRef') || ''", true)
	if str(pending) != "":
		return
	JavaScriptBridge.eval("sessionStorage.setItem('dotduel:pendingFriendRef', %s)" % JSON.stringify(code), true)
	Store.write(REFERRER, {"uid": code, "landedAt": Time.get_unix_time_from_system() * 1000.0})


func _referral() -> void:
	if not Supa.signed_in() or not Online.profile_loaded:
		return
	var me := Online.me()
	var is_code := RegEx.create_from_string(REF_CODE)
	# 1) Friend request to whoever shared the link (needs a game name first).
	if OS.has_feature("web") and Online.display_name() != "":
		var ref = JavaScriptBridge.eval("sessionStorage.getItem('dotduel:pendingFriendRef') || ''", true)
		var code := str(ref) if ref != null else ""
		if code != "" and code != me:
			JavaScriptBridge.eval("sessionStorage.removeItem('dotduel:pendingFriendRef')", true)
			var uid := code
			if is_code.search(code):
				var res: Dictionary = await Supa.call_rpc("resolve_referral_code", {"p_code": code})
				uid = str(res.data) if res.ok and res.data is String else ""
			if uid != "" and uid != me:
				send_request_uid(uid)
	# 2) Attribution: once per account, codes only, within 30 days of landing.
	var stored = Store.read(REFERRER)
	if not stored is Dictionary:
		return
	var c := str(stored.get("uid", ""))
	var landed = stored.get("landedAt")
	if not is_code.search(c) or not (landed is float or landed is int):
		return
	if Time.get_unix_time_from_system() * 1000.0 - float(landed) > 30.0 * 24 * 3600 * 1000:
		return
	var guard := "dotduel:refClaimAttempted:" + me
	if Store.read(guard) != null:
		return
	Store.write(guard, "1")
	Supa.call_rpc("claim_referral", {"p_code": c})


# ---------------------------------------------------------------- helpers

func _err(res: Dictionary) -> String:
	var d = res.get("data")
	var msg := str(d.get("message", "")) if d is Dictionary else str(d)
	return "TOO_MANY_PENDING" if "TOO_MANY_PENDING" in msg else (msg if msg != "" else "error")


static func _ms(v) -> float:
	if v == null or str(v) == "":
		return 0.0
	var s := str(v).replace(" ", "T")
	var plus := s.find("+", 10)
	if plus > 0:
		s = s.left(plus)
	s = s.trim_suffix("Z")
	var dot := s.find(".")
	var frac := 0.0
	if dot > 0:
		frac = float("0" + s.substr(dot))
		s = s.left(dot)
	return (Time.get_unix_time_from_datetime_string(s) + frac) * 1000.0


static func _iso_now() -> String:
	return Time.get_datetime_string_from_system(true) + "Z"
