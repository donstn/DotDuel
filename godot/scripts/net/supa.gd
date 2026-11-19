extends Node
## Minimal Supabase client: Google sign-in (PKCE), session refresh, PostgREST,
## RPC and Edge Function calls. On the web the session lives in the SAME
## localStorage key supabase-js uses, so signing in on dotduel.com carries over.

signal auth_changed

const URL := "https://ggyjxayazxbjvjbeecxa.supabase.co"
const KEY := "sb_publishable_wV3b7zFPGVvPt6No3OnJRQ_S7tJA6iY"
const STORAGE_KEY := "sb-ggyjxayazxbjvjbeecxa-auth-token"
const VERIFIER_KEY := "dotduel-godot-pkce-verifier"
const DESKTOP_PORT := 5173

var session := {}
var auth_error := ""
var is_ready := false
var _refreshing := false
var _server: TCPServer


func _ready() -> void:
	# Let every autoload and the main scene connect to auth_changed first.
	await get_tree().process_frame
	_load_session()
	if OS.has_feature("web"):
		await _finish_web_redirect()
	if signed_in():
		await ensure_fresh()
	is_ready = true
	auth_changed.emit()


func signed_in() -> bool:
	return session.has("access_token") and session.has("user")


func uid() -> String:
	return str(session.get("user", {}).get("id", "")) if signed_in() else ""


func user_meta() -> Dictionary:
	return session.get("user", {}).get("user_metadata", {}) if signed_in() else {}


func now_ms() -> float:
	return Time.get_unix_time_from_system() * 1000.0


# ---------------------------------------------------------------- session storage

func _load_session() -> void:
	var raw := ""
	if OS.has_feature("web"):
		var v = JavaScriptBridge.eval("localStorage.getItem('%s')" % STORAGE_KEY, true)
		raw = v if v is String else ""
	elif FileAccess.file_exists("user://session.json"):
		raw = FileAccess.get_file_as_string("user://session.json")
	var d = JSON.parse_string(raw) if raw != "" else null
	session = d if d is Dictionary else {}


func _save_session() -> void:
	var raw := JSON.stringify(session)
	if OS.has_feature("web"):
		if session.is_empty():
			JavaScriptBridge.eval("localStorage.removeItem('%s')" % STORAGE_KEY, true)
		else:
			JavaScriptBridge.eval("localStorage.setItem('%s', %s)" % [STORAGE_KEY, JSON.stringify(raw)], true)
	else:
		var f := FileAccess.open("user://session.json", FileAccess.WRITE)
		f.store_string(raw)


func _adopt(token_response: Dictionary) -> void:
	var s := token_response.duplicate()
	if not s.has("expires_at"):
		s["expires_at"] = int(Time.get_unix_time_from_system()) + int(s.get("expires_in", 3600))
	session = s
	_save_session()


func sign_out() -> void:
	if signed_in():
		await http(HTTPClient.METHOD_POST, "/auth/v1/logout?scope=local", {})
	session = {}
	_save_session()
	auth_changed.emit()


## Refresh the access token when it is about to expire. On the web, first pick
## up a token another dotduel.com tab may have rotated meanwhile.
func ensure_fresh() -> void:
	if not signed_in():
		return
	if OS.has_feature("web"):
		_load_session()
		if not signed_in():
			auth_changed.emit()
			return
	if float(session.get("expires_at", 0)) - Time.get_unix_time_from_system() > 90:
		return
	while _refreshing:
		await get_tree().process_frame
	if float(session.get("expires_at", 0)) - Time.get_unix_time_from_system() > 90:
		return
	_refreshing = true
	var res := await _raw(HTTPClient.METHOD_POST, "/auth/v1/token?grant_type=refresh_token", {"refresh_token": session.get("refresh_token", "")}, false)
	_refreshing = false
	if res.ok and res.data is Dictionary and res.data.has("access_token"):
		_adopt(res.data)
		Realtime.set_token(session.access_token)
	elif res.code >= 400 and res.code < 500:
		session = {}
		_save_session()
		auth_changed.emit()


# ---------------------------------------------------------------- Google sign-in (PKCE)

func _redirect_url() -> String:
	if OS.has_feature("web"):
		return str(JavaScriptBridge.eval("location.origin + location.pathname", true))
	return "http://localhost:%d/godot-auth" % DESKTOP_PORT


func sign_in_google() -> void:
	auth_error = ""
	var verifier := ""
	var chars := "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
	for i in 64:
		verifier += chars[randi() % chars.length()]
	var hc := HashingContext.new()
	hc.start(HashingContext.HASH_SHA256)
	hc.update(verifier.to_utf8_buffer())
	var challenge := Marshalls.raw_to_base64(hc.finish()).replace("+", "-").replace("/", "_").replace("=", "")
	var url := "%s/auth/v1/authorize?provider=google&redirect_to=%s&code_challenge=%s&code_challenge_method=s256" % [
		URL, _redirect_url().uri_encode(), challenge]
	if OS.has_feature("web"):
		JavaScriptBridge.eval("localStorage.setItem('%s', '%s'); location.href = %s;" % [VERIFIER_KEY, verifier, JSON.stringify(url)], true)
		return
	# Desktop: catch the redirect on a loopback port, then exchange the code.
	_server = TCPServer.new()
	if _server.listen(DESKTOP_PORT, "127.0.0.1") != OK:
		auth_error = "Port %d is busy (is the Vite dev server running?)" % DESKTOP_PORT
		auth_changed.emit()
		return
	OS.shell_open(url)
	var code := await _wait_desktop_code()
	_server.stop()
	if code != "":
		await _exchange(code, verifier)


func _wait_desktop_code() -> String:
	var deadline := Time.get_ticks_msec() + 180000
	while Time.get_ticks_msec() < deadline:
		await get_tree().process_frame
		if not _server.is_connection_available():
			continue
		var peer := _server.take_connection()
		var req := ""
		var t := Time.get_ticks_msec()
		while Time.get_ticks_msec() - t < 3000:
			peer.poll()
			var n := peer.get_available_bytes()
			if n > 0:
				req += peer.get_utf8_string(n)
				if req.contains("\r\n\r\n"):
					break
			await get_tree().process_frame
		var first := req.get_slice("\r\n", 0)
		var path := first.get_slice(" ", 1)
		var q := _query(path.get_slice("?", 1)) if path.contains("?") else {}
		var html := "<html><body style='font-family:sans-serif;background:#0c1d14;color:#eaf3e3;text-align:center;padding-top:20vh'><h2>DotDuel: you can close this tab.</h2></body></html>"
		peer.put_data(("HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: %d\r\nConnection: close\r\n\r\n%s" % [html.to_utf8_buffer().size(), html]).to_utf8_buffer())
		peer.disconnect_from_host()
		if q.has("code"):
			return q.code
		if q.has("error_description"):
			auth_error = q.error_description
			return ""
	auth_error = "Sign-in timed out."
	return ""


func _finish_web_redirect() -> void:
	var search := str(JavaScriptBridge.eval("location.search", true))
	var hash := str(JavaScriptBridge.eval("location.hash", true))
	var q := _query(search.trim_prefix("?"))
	var h := _query(hash.trim_prefix("#"))
	if q.has("error_description") or h.has("error_description"):
		auth_error = q.get("error_description", h.get("error_description", ""))
	if q.has("code"):
		var verifier := str(JavaScriptBridge.eval("localStorage.getItem('%s')" % VERIFIER_KEY, true))
		await _exchange(q.code, verifier)
		JavaScriptBridge.eval("localStorage.removeItem('%s')" % VERIFIER_KEY, true)
	if q.size() > 0 or h.size() > 0:
		JavaScriptBridge.eval("history.replaceState(null, '', location.pathname)", true)


func _exchange(code: String, verifier: String) -> void:
	var res := await _raw(HTTPClient.METHOD_POST, "/auth/v1/token?grant_type=pkce", {"auth_code": code, "code_verifier": verifier}, false)
	if res.ok and res.data is Dictionary and res.data.has("access_token"):
		_adopt(res.data)
		Realtime.set_token(session.access_token)
	else:
		auth_error = "Sign-in failed (%s)." % str(res.data.get("msg", res.data.get("error_description", res.code)) if res.data is Dictionary else res.code)
	auth_changed.emit()


func _query(s: String) -> Dictionary:
	var out := {}
	for part in s.split("&", false):
		var kv := part.split("=", true, 1)
		out[kv[0].uri_decode()] = kv[1].uri_decode().replace("+", " ") if kv.size() > 1 else ""
	return out


# ---------------------------------------------------------------- HTTP

## Returns {ok, code, data}. Attaches the user's JWT when signed in.
func http(method: int, path: String, body = null, extra_headers: Array = []) -> Dictionary:
	await ensure_fresh()
	return await _raw(method, path, body, true, extra_headers)


func _raw(method: int, path: String, body, with_auth: bool, extra_headers: Array = []) -> Dictionary:
	var req := HTTPRequest.new()
	req.timeout = 20.0
	req.accept_gzip = not OS.has_feature("web")  # the browser already inflates
	add_child(req)
	var headers := PackedStringArray(["apikey: " + KEY, "Content-Type: application/json"])
	if with_auth and signed_in():
		headers.append("Authorization: Bearer " + str(session.access_token))
	for h in extra_headers:
		headers.append(h)
	var err := req.request(URL + path, headers, method, "" if body == null else JSON.stringify(body))
	if err != OK:
		req.queue_free()
		return {"ok": false, "code": 0, "data": null}
	var res: Array = await req.request_completed
	req.queue_free()
	var text: String = res[3].get_string_from_utf8()
	var data = JSON.parse_string(text) if text.strip_edges() != "" else null
	var code: int = res[1]
	return {"ok": res[0] == HTTPRequest.RESULT_SUCCESS and code >= 200 and code < 300, "code": code, "data": data}


func select(table: String, query: String) -> Array:
	var res := await http(HTTPClient.METHOD_GET, "/rest/v1/%s?%s" % [table, query])
	return res.data if res.ok and res.data is Array else []


func select_one(table: String, query: String) -> Dictionary:
	var rows := await select(table, query + "&limit=1")
	return rows[0] if rows.size() > 0 and rows[0] is Dictionary else {}


func upsert(table: String, row: Dictionary, on_conflict := "") -> Dictionary:
	var q := "?on_conflict=" + on_conflict if on_conflict != "" else ""
	return await http(HTTPClient.METHOD_POST, "/rest/v1/%s%s" % [table, q], row, ["Prefer: resolution=merge-duplicates,return=minimal"])


func update(table: String, query: String, patch: Dictionary) -> Dictionary:
	return await http(HTTPClient.METHOD_PATCH, "/rest/v1/%s?%s" % [table, query], patch, ["Prefer: return=minimal"])


func delete(table: String, query: String) -> Dictionary:
	return await http(HTTPClient.METHOD_DELETE, "/rest/v1/%s?%s" % [table, query])


func call_rpc(fn: String, params: Dictionary = {}) -> Dictionary:
	return await http(HTTPClient.METHOD_POST, "/rest/v1/rpc/" + fn, params)


func invoke(fn: String, body: Dictionary = {}) -> Dictionary:
	return await http(HTTPClient.METHOD_POST, "/functions/v1/" + fn, body)
