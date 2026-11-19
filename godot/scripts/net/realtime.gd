extends Node
## Supabase Realtime (Phoenix channels over WebSocket), postgres_changes only.
## subscribe() -> topic; callbacks: on_change(type: String, record: Dictionary),
## on_ready() fires on every (re)join so the caller can fetch a fresh snapshot
## (Realtime only delivers changes, never the current row).

const HEARTBEAT_S := 25.0

var _ws := WebSocketPeer.new()
var _open := false
var _ref := 0
var _channels := {}  # topic -> {table, filter, on_change, on_ready, joined, join_ref}
var _hb := 0.0
var _retry_at := 0.0
var _token := ""


func set_token(t: String) -> void:
	_token = t
	if not _open:
		return
	for topic in _channels:
		if _channels[topic].joined:
			_send(topic, "access_token", {"access_token": t})


func subscribe(name: String, table: String, filter: String, on_change: Callable, on_ready := Callable()) -> String:
	var topic := "realtime:%s" % name
	if _channels.has(topic):
		unsubscribe(topic)
	_channels[topic] = {"table": table, "filter": filter, "on_change": on_change, "on_ready": on_ready, "joined": false, "join_ref": ""}
	if _open:
		_join(topic)
	elif _ws.get_ready_state() == WebSocketPeer.STATE_CLOSED:
		_connect()
	return topic


func unsubscribe(topic: String) -> void:
	if topic == "" or not _channels.has(topic):
		return
	if _open and _channels[topic].joined:
		_send(topic, "phx_leave", {})
	_channels.erase(topic)


func _connect() -> void:
	_token = str(Supa.session.get("access_token", ""))
	var url := Supa.URL.replace("https://", "wss://") + "/realtime/v1/websocket?apikey=%s&vsn=1.0.0" % Supa.KEY
	_ws = WebSocketPeer.new()
	if _ws.connect_to_url(url) != OK:
		_retry_at = Time.get_ticks_msec() / 1000.0 + 3.0


func _next_ref() -> String:
	_ref += 1
	return str(_ref)


func _send(topic: String, event: String, payload: Dictionary, ref := "") -> void:
	var msg := {"topic": topic, "event": event, "payload": payload, "ref": ref if ref != "" else _next_ref()}
	if _channels.has(topic) and _channels[topic].join_ref != "":
		msg["join_ref"] = _channels[topic].join_ref
	_ws.send_text(JSON.stringify(msg))


func _join(topic: String) -> void:
	var c: Dictionary = _channels[topic]
	var ref := _next_ref()
	c.join_ref = ref
	c.joined = false
	var change := {"event": "*", "schema": "public", "table": c.table}
	if c.filter != "":
		change["filter"] = c.filter
	var payload := {
		"config": {
			"broadcast": {"ack": false, "self": false},
			"presence": {"key": "", "enabled": false},
			"postgres_changes": [change],
			"private": false,
		},
		"access_token": _token if _token != "" else Supa.KEY,
	}
	_ws.send_text(JSON.stringify({"topic": topic, "event": "phx_join", "payload": payload, "ref": ref, "join_ref": ref}))


func _process(delta: float) -> void:
	if _channels.is_empty() and not _open:
		return
	_ws.poll()
	var st := _ws.get_ready_state()
	if st == WebSocketPeer.STATE_OPEN:
		if not _open:
			_open = true
			_hb = 0.0
			for topic in _channels:
				_join(topic)
		_hb += delta
		if _hb >= HEARTBEAT_S:
			_hb = 0.0
			_ws.send_text(JSON.stringify({"topic": "phoenix", "event": "heartbeat", "payload": {}, "ref": _next_ref()}))
		while _ws.get_available_packet_count() > 0:
			var msg = JSON.parse_string(_ws.get_packet().get_string_from_utf8())
			if msg is Dictionary:
				_handle(msg)
	elif st == WebSocketPeer.STATE_CLOSED:
		if _open:
			_open = false
			for topic in _channels:
				_channels[topic].joined = false
			_retry_at = Time.get_ticks_msec() / 1000.0 + 2.0
		if not _channels.is_empty() and Time.get_ticks_msec() / 1000.0 >= _retry_at:
			_retry_at = Time.get_ticks_msec() / 1000.0 + 5.0
			_connect()


func _handle(msg: Dictionary) -> void:
	var topic: String = msg.get("topic", "")
	if not _channels.has(topic):
		return
	var c: Dictionary = _channels[topic]
	var event: String = msg.get("event", "")
	var payload = msg.get("payload", {})
	match event:
		"phx_reply":
			if str(msg.get("ref", "")) == c.join_ref and payload is Dictionary:
				if payload.get("status", "") == "ok":
					c.joined = true
					if c.on_ready.is_valid():
						c.on_ready.call()
				else:
					push_warning("Realtime join failed for %s: %s" % [topic, str(payload)])
		"postgres_changes":
			var data = payload.get("data", {}) if payload is Dictionary else {}
			if data is Dictionary and c.on_change.is_valid():
				var rec = data.get("record", {})
				if data.get("type", "") == "DELETE":
					rec = data.get("old_record", {})
				c.on_change.call(str(data.get("type", "")), rec if rec is Dictionary else {})
		"phx_error", "phx_close":
			c.joined = false
			if _open:
				get_tree().create_timer(2.0).timeout.connect(_rejoin.bind(topic))


func _rejoin(topic: String) -> void:
	if _channels.has(topic) and _open and not _channels[topic].joined:
		_join(topic)
