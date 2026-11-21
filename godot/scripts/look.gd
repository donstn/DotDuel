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
## Painted plates whose geometry differs from Forest & Pearl's (UI.MENU_BTN …):
## file → [width, height, capLeft, capRight] in the theme's own pixels.
const PLATES := {"sunset-catan": {
	"menu-button.webp": [1118, 187, 200, 199],
	"primary-button.webp": [1117, 187, 338, 349],
	"pill-button.webp": [460, 138, 103, 104],
	"title-banner.webp": [920, 140, 111, 108],
	"danger-pill.webp": [290, 87, 61, 62],
}}
## Card frame: [corner px, height px] of the painted frame (Forest: 48 of 371).
const FRAMES := {"sunset-catan": [112.0, 635.0]}
## Header sign: [aspect, text box left/right, top, bottom as fractions].
const SIGNS := {"sunset-catan": [1081.0 / 601.0, 0.07, 0.61, 0.09]}
const FOREST_SIGN := [987.0 / 456.0, 0.09, 0.6, 0.085]

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
		UI.ACCENT = Color("7bdb95")
		UI.TEXT = Color("eaf3e3")
		UI.TEXT_DIM = Color("b3c4b6")
		holes = GREEN_HOLES
		rim_light = Color(0.75, 0.9, 0.6, 0.35)
	elif id == DESERT:
		bright = [Color.WHITE, Color("e07a3f"), Color("fffaf0")]
		strike_outer = [Color.WHITE, Color("9c3a14"), Color("c8a868")]
		strike_inner = [Color.WHITE, Color("e07a3f"), Color("fffaf0")]
		pending_col = UI.GOLD
		dot_scale = 1.0
		felt_tint = Color(1.15, 1.1, 1.05)
		UI.ACCENT = Color("e0a050")
		UI.TEXT = Color("fff3e0")
		UI.TEXT_DIM = Color("cbb8a2")
		holes = [Color(1.0, 0.82, 0.62, 0.14), Color(0.09, 0.05, 0.025), Color(0.2, 0.12, 0.07)]
		rim_light = Color(1.0, 0.82, 0.6, 0.3)
	else:
		bright = [Color.WHITE, UI.P1_BRIGHT, UI.P2_BRIGHT]
		strike_outer = [Color.WHITE, Color("2b8a4c"), Color("c8c878")]
		strike_inner = [Color.WHITE, Color("b8f5d3"), Color("ffffff")]
		pending_col = UI.GOLD
		dot_scale = 1.0
		felt_tint = Color(2.1, 2.3, 2.0)
		UI.ACCENT = Color("7bdb95")
		UI.TEXT = Color("eaf3e3")
		UI.TEXT_DIM = Color("b3c4b6")
		holes = GREEN_HOLES
		rim_light = Color(0.75, 0.9, 0.6, 0.35)


## Desert Sunset: the code-drawn UI greens (panels, selected tiles, borders)
## turned into the matching warm browns. Other themes keep them as they are.
func tone(c: Color) -> Color:
	if id != DESERT or c.g <= c.r:
		return c
	return Color(c.g, (c.r + c.g) * 0.42, minf(c.r, c.b) * 0.8, c.a)


## A plate spec ([file, w, h, capL, capR]) with the theme's own geometry.
func plate(spec: Array) -> Array:
	if PLATES.has(id) and PLATES[id].has(spec[0]):
		return [spec[0]] + PLATES[id][spec[0]]
	return spec


## Height to resample the card frame to so its corners match Forest's size at `h`.
func frame_h(h: int) -> int:
	if not FRAMES.has(id):
		return h
	return int(round(h * (48.0 / 371.0) / (FRAMES[id][0] / FRAMES[id][1])))


func sign_geo() -> Array:
	return SIGNS.get(id, FOREST_SIGN)


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
