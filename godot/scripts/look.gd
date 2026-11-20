extends Node
## Colour theme: Forest & Pearl (default) or the seasonal Christmas theme
## (red vs gold baubles, tree board, wreath, snow, campfire, bells). Christmas
## is offered 17 Nov – 15 Jan like on dotduel.com; the choice is shared with
## the website through its localStorage key.

signal changed

const WEB_KEY := "dotduel:theme:v1"
const PREVIEW_KEY := "dotduel:theme-preview:v1"
const XMAS := "christmas"
const FOREST := "forest-pearl"
const NAMES := {"forest-pearl": "Forest & Pearl", "christmas": "Christmas"}

var id := FOREST

# Player palette, index 1 / 2 (0 unused). Christmas values from src/styles.css.
var bright: Array = []
var strike_outer: Array = []
var strike_inner: Array = []
var pending_col := UI.GOLD
var dot_scale := 1.0
## The menu background's campfire; the Christmas tree board draws a copy of
## it in front of the tree (the fire stands nearer the viewer).
var fire: Node2D


func _ready() -> void:
	var want := str(Prefs.read("theme", ""))
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--theme="):
			want = a.get_slice("=", 1)
	if want == "":
		want = Prefs.web_get(WEB_KEY)
	if want == "" and offered(XMAS):
		want = XMAS
	id = want if offered(want) else FOREST
	_palette()


func offered(t: String) -> bool:
	if t == FOREST:
		return true
	if t != XMAS:
		return false
	if Prefs.web_get(PREVIEW_KEY) == XMAS or OS.get_cmdline_user_args().has("--xmas"):
		return true
	var d := Time.get_date_dict_from_system()
	var md: int = d.month * 100 + d.day
	return md >= 1117 or md <= 115


func available() -> Array:
	return [FOREST, XMAS] if offered(XMAS) else [FOREST]


func xmas() -> bool:
	return id == XMAS


func set_id(t: String) -> void:
	if t == id or not offered(t):
		return
	id = t
	Prefs.write("theme", t)
	Prefs.web_set(WEB_KEY, t)
	_palette()
	changed.emit()


func _palette() -> void:
	if xmas():
		bright = [Color.WHITE, Color("e8475c"), Color("fff3c4")]
		strike_outer = [Color.WHITE, Color("b3243a"), Color("d9a82e")]
		strike_inner = [Color.WHITE, Color("ffc2cb"), Color("fff8dc")]
		pending_col = Color("9fd8ff")
		dot_scale = 1.31
	else:
		bright = [Color.WHITE, UI.P1_BRIGHT, UI.P2_BRIGHT]
		strike_outer = [Color.WHITE, Color("2b8a4c"), Color("c8c878")]
		strike_inner = [Color.WHITE, Color("b8f5d3"), Color("ffffff")]
		pending_col = UI.GOLD
		dot_scale = 1.0


## Art path for the current theme: the Christmas copy when one exists.
func art(file: String) -> String:
	if xmas():
		var p := UI.ART + "christmas/" + file
		if ResourceLoader.exists(p):
			return p
	return UI.ART + file


## Hot-seat / demo player name: the dot colour.
func colour_name(p: int) -> String:
	if xmas():
		return Lang.t("col_red" if p == 1 else "col_gold")
	return Lang.t("col_green" if p == 1 else "col_cream")
