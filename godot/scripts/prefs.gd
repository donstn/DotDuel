class_name Prefs
extends RefCounted
## Small on-device settings store (user://prefs.cfg). On the web, language and
## theme are also mirrored to the site's localStorage keys, so a choice made on
## dotduel.com carries over to /GodotV1 and back.

const PATH := "user://prefs.cfg"

static var _cfg: ConfigFile


static func _file() -> ConfigFile:
	if _cfg == null:
		_cfg = ConfigFile.new()
		_cfg.load(PATH)
	return _cfg


static func read(key: String, fallback: Variant = null) -> Variant:
	return _file().get_value("prefs", key, fallback)


static func write(key: String, value: Variant) -> void:
	_file().set_value("prefs", key, value)
	_file().save(PATH)


## localStorage value on the web ("" when missing, blocked or not on the web).
static func web_get(key: String) -> String:
	if not OS.has_feature("web"):
		return ""
	var v = JavaScriptBridge.eval("(function(){try{return localStorage.getItem(%s)||''}catch(e){return ''}})()" % JSON.stringify(key), true)
	return str(v) if v != null else ""


static func web_set(key: String, value: String) -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("(function(){try{localStorage.setItem(%s,%s)}catch(e){}})()" % [JSON.stringify(key), JSON.stringify(value)], true)
