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
## Desert Sunset keeps the app's id so a saved choice is shared. Locked like
## in the app: only offered with ?theme-preview=sunset-catan (or the
## --theme-preview=sunset-catan command-line arg) until it is released.
const DESERT := "sunset-catan"
const NAMES := {"forest-pearl": "Forest & Pearl", "christmas": "Christmas", "sunset-catan": "Desert Sunset"}
const ART_DIRS := {"christmas": "christmas/", "sunset-catan": "desert-sunset/"}

var id := FOREST

# Player palette, index 1 / 2 (0 unused). Christmas values from src/styles.css.
var bright: Array = []
var strike_outer: Array = []
var strike_inner: Array = []
var pending_col := UI.GOLD
var dot_scale := 1.0
## Brightness/tint multiplier for the board's felt texture.
var felt_tint := Color(2.1, 2.3, 2.0)
## Empty-hole shading [glow, core, inner] and the board rim's light edge.
const GREEN_HOLES := [Color(0.75, 0.95, 0.7, 0.16), Color(0.04, 0.1, 0.06), Color(0.1, 0.2, 0.12)]
var holes: Array = GREEN_HOLES
var rim_light := Color(0.75, 0.9, 0.6, 0.35)
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
	if t == DESERT:
		return Prefs.web_get(PREVIEW_KEY) == DESERT or OS.get_cmdline_user_args().has("--theme-preview=" + DESERT)
	if t != XMAS:
		return false
	if Prefs.web_get(PREVIEW_KEY) == XMAS or OS.get_cmdline_user_args().has("--xmas"):
		return true
	var d := Time.get_date_dict_from_system()
	var md: int = d.month * 100 + d.day
	return md >= 1117 or md <= 115


func available() -> Array:
	var out := [FOREST]
	for t in [XMAS, DESERT]:
		if offered(t):
			out.append(t)
	return out


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
		felt_tint = Color(2.1, 2.3, 2.0)
		holes = GREEN_HOLES
		rim_light = Color(0.75, 0.9, 0.6, 0.35)
	elif id == DESERT:
		bright = [Color.WHITE, Color("e07a3f"), Color("fffaf0")]
		strike_outer = [Color.WHITE, Color("9c3a14"), Color("c8a868")]
		strike_inner = [Color.WHITE, Color("e07a3f"), Color("fffaf0")]
		pending_col = UI.GOLD
		dot_scale = 1.0
		felt_tint = Color(1.15, 1.1, 1.05)
		holes = [Color(1.0, 0.82, 0.62, 0.14), Color(0.09, 0.05, 0.025), Color(0.2, 0.12, 0.07)]
		rim_light = Color(1.0, 0.82, 0.6, 0.3)
	else:
		bright = [Color.WHITE, UI.P1_BRIGHT, UI.P2_BRIGHT]
		strike_outer = [Color.WHITE, Color("2b8a4c"), Color("c8c878")]
		strike_inner = [Color.WHITE, Color("b8f5d3"), Color("ffffff")]
		pending_col = UI.GOLD
		dot_scale = 1.0
		felt_tint = Color(2.1, 2.3, 2.0)
		holes = GREEN_HOLES
		rim_light = Color(0.75, 0.9, 0.6, 0.35)


## Art path for the current theme: the theme's own copy when one exists.
func art(file: String) -> String:
	if ART_DIRS.has(id):
		var p: String = UI.ART + ART_DIRS[id] + file
		if ResourceLoader.exists(p):
			return p
	return UI.ART + file


## Hot-seat / demo player name: the dot colour.
func colour_name(p: int) -> String:
	if xmas():
		return Lang.t("col_red" if p == 1 else "col_gold")
	if id == DESERT:
		return Lang.t("col_terracotta" if p == 1 else "col_cream")
	return Lang.t("col_green" if p == 1 else "col_cream")
