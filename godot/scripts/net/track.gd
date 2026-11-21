extends Node
## GA4 events and the analytics consent, through the web page's bridge
## (public/dd-telemetry.js, a port of src/telemetry.ts). The same event names
## and params as the React app. Off the web every call is a no-op.

func _web() -> bool:
	return OS.has_feature("web")


func event(name: String, params := {}, low := false) -> void:
	if not _web():
		return
	JavaScriptBridge.eval("window.ddTrack && window.ddTrack(%s, %s, %s)" % [
		JSON.stringify(name), JSON.stringify(JSON.stringify(params)), JSON.stringify("low" if low else "normal")], true)


## The event with params[key] = first 8 hex chars of sha256(raw) (no raw ids).
func hashed(name: String, params: Dictionary, key: String, raw: String) -> void:
	if not _web():
		return
	JavaScriptBridge.eval("window.ddTrackHashed && window.ddTrackHashed(%s, %s, %s, %s)" % [
		JSON.stringify(name), JSON.stringify(JSON.stringify(params)), JSON.stringify(key), JSON.stringify(raw)], true)


func auth_state() -> String:
	return "signed_in" if Supa.signed_in() else "anon"


## Lifetime "games started" (1..10, then 99), shared with the React app.
func game_index() -> int:
	if not _web():
		return 0
	var v = JavaScriptBridge.eval("window.ddGameIndex ? window.ddGameIndex() : 0", true)
	return int(v) if v != null else 0


## "accepted" | "declined" | "" (not decided yet).
func consent() -> String:
	if not _web():
		return ""
	var v = JavaScriptBridge.eval("window.ddConsentGet ? window.ddConsentGet() : ''", true)
	return str(v) if v != null else ""


func set_consent(value: String) -> void:
	if _web():
		JavaScriptBridge.eval("window.ddConsent && window.ddConsent(%s)" % JSON.stringify(value), true)
