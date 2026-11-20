extends Node
## Current language + lookups. Lang.t("key", [args]) for plain strings,
## Lang.n("key", count) for plural forms. Choice order: saved here → the
## website's saved choice (same localStorage key as dotduel.com) → device
## language → Europe/Vilnius timezone → English. Never Russian.

signal changed

const CODES := ["en", "lt", "es", "pt", "pl", "cs"]
const NAMES := {"en": "English", "lt": "Lietuvių", "es": "Español", "pt": "Português (BR)", "pl": "Polski", "cs": "Čeština"}
const WEB_KEY := "dotduel:lang:v1"

var code := "en"


func _ready() -> void:
	code = _detect()


func _detect() -> String:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--lang="):
			return a.get_slice("=", 1)
	var saved := str(Prefs.read("lang", ""))
	if saved in CODES:
		return saved
	var web := Prefs.web_get(WEB_KEY)
	if web in CODES:
		return web
	var tags: Array = [OS.get_locale()]
	if OS.has_feature("web"):
		var j = JavaScriptBridge.eval("JSON.stringify(navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language])", true)
		var parsed = JSON.parse_string(str(j)) if j != null else null
		if parsed is Array:
			tags = parsed
		var tz = JavaScriptBridge.eval("(function(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){return ''}})()", true)
		if str(tz) == "Europe/Vilnius":
			tags.append("lt")
	# Same as detectLang() in src/i18n: first supported non-English tag wins,
	# the Vilnius timezone (appended above) catches en-US phones in Lithuania.
	for tag in tags:
		var l := str(tag).to_lower().left(2)
		if l in CODES and l != "en":
			return l
	return "en"


func set_code(c: String) -> void:
	if not c in CODES or c == code:
		return
	code = c
	Prefs.write("lang", c)
	Prefs.web_set(WEB_KEY, c)
	changed.emit()


func _raw(key: String) -> Variant:
	var own: Dictionary = I18nStrings.STRINGS.get(code, {})
	if own.has(key):
		return own[key]
	var shared: Dictionary = I18nShared.STRINGS.get(code, {})
	if shared.has(key):
		return shared[key]
	if I18nStrings.STRINGS.en.has(key):
		return I18nStrings.STRINGS.en[key]
	return I18nShared.STRINGS.en.get(key, key)


func t(key: String, args: Array = []) -> String:
	var v = _raw(key)
	if v is Array:
		v = v[2]
	var s := str(v)
	return s % args if args.size() > 0 else s


## Plural form for `count` (the count is also the first format argument).
func n(key: String, count: int, extra: Array = []) -> String:
	var v = _raw(key)
	var s := str(v[_form(count)]) if v is Array else str(v)
	return s % ([count] + extra)


## 0 = one, 1 = few, 2 = many/other.
func _form(c: int) -> int:
	var m10 := c % 10
	var m100 := c % 100
	match code:
		"lt":
			if m10 == 1 and m100 != 11:
				return 0
			if m10 >= 2 and (m100 < 12 or m100 > 19):
				return 1
			return 2
		"pl":
			if c == 1:
				return 0
			if m10 >= 2 and m10 <= 4 and (m100 < 12 or m100 > 14):
				return 1
			return 2
		"cs":
			if c == 1:
				return 0
			if c >= 2 and c <= 4:
				return 1
			return 2
		_:
			return 0 if c == 1 else 2


var _app := {}


func _catalogue(c: String) -> Dictionary:
	if not _app.has(c):
		var f := FileAccess.open("res://i18n/%s.json" % c, FileAccess.READ)
		_app[c] = JSON.parse_string(f.get_as_text()) if f else {}
	return _app[c]


func has_key_in(key: String) -> bool:
	return _catalogue(code).has(key)


func has_app(key: String) -> bool:
	return _catalogue("en").has(key)


## A message from the app's own catalogue (src/i18n, already reviewed), by its
## dotted key: Lang.a("howto.scenes.claim.title"). {0}, {1}… take `args`; a
## counted message picks its plural form from args[0].
func a(key: String, args: Array = []) -> String:
	var v = _catalogue(code).get(key, null)
	if v == null:
		v = _catalogue("en").get(key, key)
	if v is Array:
		v = v[_form(int(args[0])) if args.size() > 0 else 2]
	var s := str(v)
	for i in args.size():
		s = s.replace("{%d}" % i, str(args[i]))
	return s


## Every item of an array message ("coach.welcomeSteps") as dictionaries/strings.
func a_list(key: String) -> Array:
	var out := []
	var i := 0
	var cat := _catalogue(code)
	while true:
		var base := "%s.%d" % [key, i]
		if cat.has(base) or _catalogue("en").has(base):
			out.append(a(base))
		elif _catalogue("en").has(base + ".title"):
			out.append({"title": a(base + ".title"), "body": a(base + ".body")})
		else:
			break
		i += 1
	return out


func privacy_blocks() -> Array:
	return I18nShared.PRIVACY.get(code, I18nShared.PRIVACY.en)
