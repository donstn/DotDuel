class_name UI
extends RefCounted
## Helpers for the painted Forest & Pearl art: 9-slice buttons scaled to a
## target height (caps keep their proportions), fonts, juicy press feedback.

const ART := "res://assets/art/"
const P1 := Color("0d4a23")
const P1_BRIGHT := Color("62cf90")
const P2 := Color("d3ecaa")
const P2_BRIGHT := Color("f0fbcf")
## Theme-dependent (Look sets them): Forest values here.
static var ACCENT := Color("7bdb95")
static var TEXT := Color("eaf3e3")
static var TEXT_DIM := Color("b3c4b6")
const GOLD := Color("f3d27a")

# [file, src_w, src_h, cap_left, cap_right]
const MENU_BTN := ["menu-button.webp", 873, 187, 167, 168]
const PRIMARY_BTN := ["primary-button.webp", 916, 201, 165, 165]
const PILL_BTN := ["pill-button.webp", 475, 179, 106, 108]
const BANNER := ["title-banner.webp", 588, 178, 115, 115]
const DANGER := ["danger-pill.webp", 215, 81, 54, 55]

## Community pages: [i18n key under "social.", url]. Same list as the app's
## src/social.ts; icons are Simple Icons (CC0), white, tinted in code.
const SOCIAL := [
	["discord", "https://discord.gg/mnfVHPdpU"],
	["facebook", "https://www.facebook.com/profile.php?id=61590580491938"],
	["tiktok", "https://www.tiktok.com/@dotduel.com"],
]

## Buttons: one font (Chakra Petch), always UPPERCASE; importance is shown by
## size only. Callers' sizes snap to these four.
const BTN_XL := 40  # the one main action of a screen (Start, Find match, Lobby)
const BTN_L := 32   # home menu plaques
const BTN_M := 26   # secondary actions: Back, Cancel, sheet buttons
const BTN_S := 21   # inline list actions, links, tabs in tight rows

static var _fonts := {}
static var _tex := {}


static func font(bold := true) -> Font:
	var key := "bold" if bold else "body"
	if not _fonts.has(key):
		if bold:
			_fonts[key] = _with_symbols(load("res://assets/fonts/chakra-petch-700.ttf"))
		else:
			# Outfit is a variable font; without an axis value it renders at its thinnest.
			var v := FontVariation.new()
			v.base_font = _with_symbols(load("res://assets/fonts/outfit-var.ttf"))
			v.variation_opentype = {TextServerManager.get_primary_interface().name_to_tag("wght"): 560}
			_fonts[key] = v
	return _fonts[key]


## The web export has no system fonts, so anything the game fonts lack would draw
## as Godot's hex box. Bundled fallbacks (built by tools/subset-symbol-fonts.py);
## catch-all turns whatever is still missing into a blank.
static func _with_symbols(f: Font) -> Font:
	if f.fallbacks.is_empty():
		var fb: Array[Font] = []
		for n in ["noto-sans-subset", "noto-math-subset", "noto-symbols-subset", "noto-emoji-subset", "catch-all"]:
			fb.append(load("res://assets/fonts/%s.ttf" % n))
		f.fallbacks = fb
	return f


static func tex(file: String) -> Texture2D:
	return load(Look.art(file))


## Texture resampled so its height is `h` px (keeps 9-slice caps in proportion).
static func scaled_tex(file: String, h: int) -> Texture2D:
	var key := "%s@%d" % [Look.art(file), h]
	if not _tex.has(key):
		var img: Image = tex(file).get_image()
		if img.is_compressed():
			img.decompress()
		var w := int(round(img.get_width() * float(h) / img.get_height()))
		img.resize(w, h, Image.INTERPOLATE_LANCZOS)
		_tex[key] = ImageTexture.create_from_image(img)
	return _tex[key]


static func art_box(spec: Array, h: int) -> StyleBoxTexture:
	spec = Look.plate(spec)
	var k: float = float(h) / spec[2]
	var sb := StyleBoxTexture.new()
	sb.texture = scaled_tex(spec[0], h)
	sb.texture_margin_left = spec[3] * k
	sb.texture_margin_right = spec[4] * k
	sb.content_margin_left = spec[3] * k * 0.7
	sb.content_margin_right = spec[4] * k * 0.7
	sb.axis_stretch_horizontal = StyleBoxTexture.AXIS_STRETCH_MODE_STRETCH
	return sb


static func label(text: String, size: int, color := TEXT, bold := true, outline := 6) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_override("font", font(bold))
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	if outline > 0:
		l.add_theme_constant_override("outline_size", outline)
		l.add_theme_color_override("font_outline_color", Look.tone(Color(0, 0.06, 0.03, 0.85)))
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	return l


static func art_button(text: String, spec: Array, w: int, h: int, font_size := BTN_XL, color := TEXT) -> Button:
	text = text.to_upper()
	font_size = btn_size(font_size)
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(w, h)
	b.focus_mode = Control.FOCUS_NONE
	var sb := art_box(spec, h)
	for st in ["normal", "hover", "pressed", "disabled", "focus"]:
		b.add_theme_stylebox_override(st, sb)
	b.add_theme_font_override("font", font(true))
	b.add_theme_font_size_override("font_size", font_size)
	for c in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]:
		b.add_theme_color_override(c, color)
	b.add_theme_color_override("font_disabled_color", TEXT_DIM)
	b.add_theme_constant_override("outline_size", 8)
	b.add_theme_color_override("font_outline_color", Look.tone(Color(0, 0.08, 0.03, 0.8)))
	# Longer translations shrink to stay inside the painted caps.
	var room := w - sb.content_margin_left - sb.content_margin_right
	var fs := font_size
	while fs > 14 and font(true).get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x + 8 > room:
		fs -= 1
	b.add_theme_font_size_override("font_size", fs)
	juicy(b)
	return b


static func btn_size(fs: int) -> int:
	return BTN_XL if fs >= 34 else (BTN_L if fs >= 29 else (BTN_M if fs >= 24 else BTN_S))


## Shrinks a wrapping label's font until its text fits `box`.
static func fit_label(l: Label, font_size: int, box: Vector2) -> void:
	var f := l.get_theme_font("font")
	var fs := font_size
	while fs > 14 and f.get_multiline_string_size(l.text, HORIZONTAL_ALIGNMENT_CENTER, box.x, fs).y > box.y:
		fs -= 1
	l.add_theme_font_size_override("font_size", fs)


## Squash on press, spring back, grow a little on hover. Click tick sound.
static func juicy(c: Control) -> void:
	c.resized.connect(func(): c.pivot_offset = c.size / 2.0)
	var to := func(s: float, t: float, trans: int):
		var tw := c.create_tween()
		tw.tween_property(c, "scale", Vector2(s, s), t).set_trans(trans).set_ease(Tween.EASE_OUT)
	var down := func():
		to.call(0.92, 0.08, Tween.TRANS_QUAD)
		Sfx.play("tick", randf_range(0.9, 1.1), -6.0)
	if c is BaseButton:
		(c as BaseButton).button_down.connect(down)
		(c as BaseButton).button_up.connect(func(): to.call(1.0, 0.35, Tween.TRANS_BACK))
	c.mouse_entered.connect(func(): to.call(1.04, 0.2, Tween.TRANS_BACK))
	c.mouse_exited.connect(func(): to.call(1.0, 0.2, Tween.TRANS_BACK))


static func particles_burst(parent: Node, at: Vector2, color: Color, amount := 18, speed := 260.0, file := "particle-spark.webp", size := 0.35) -> CPUParticles2D:
	var p := CPUParticles2D.new()
	p.texture = tex(file)
	p.position = at
	p.one_shot = true
	p.explosiveness = 0.95
	p.amount = amount
	p.lifetime = 0.7
	p.direction = Vector2.UP
	p.spread = 180.0
	p.gravity = Vector2(0, 380)
	p.initial_velocity_min = speed * 0.4
	p.initial_velocity_max = speed
	p.angular_velocity_min = -360
	p.angular_velocity_max = 360
	p.scale_amount_min = size * 0.5
	p.scale_amount_max = size
	var ramp := Gradient.new()
	ramp.set_color(0, color)
	ramp.set_color(1, Color(color, 0.0))
	p.color_ramp = ramp
	var mat := CanvasItemMaterial.new()
	mat.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	p.material = mat
	parent.add_child(p)
	p.emitting = true
	p.finished.connect(p.queue_free)
	return p


static func rich(bb: String) -> RichTextLabel:
	var r := RichTextLabel.new()
	r.bbcode_enabled = true
	r.fit_content = true
	r.scroll_active = false
	r.mouse_filter = Control.MOUSE_FILTER_PASS
	r.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	r.add_theme_font_override("normal_font", font(false))
	r.add_theme_font_override("bold_font", font(true))
	r.add_theme_font_size_override("normal_font_size", 23)
	r.add_theme_font_size_override("bold_font_size", 23)
	r.add_theme_color_override("default_color", UI.TEXT)
	r.text = bb
	return r


## A cog: 8 teeth around a ring.
static func draw_gear(n: CanvasItem, at: Vector2, rad: float, col: Color) -> void:
	for i in 8:
		var ang := TAU * i / 8.0
		var dir := Vector2.from_angle(ang)
		n.draw_line(at + dir * rad * 0.7, at + dir * rad * 1.12, col, rad * 0.42)
	n.draw_circle(at, rad * 0.82, col)
	n.draw_circle(at, rad * 0.36, Look.tone(Color(0.05, 0.12, 0.08)))


## App-wide theme so no control falls back to Godot's grey editor look
## (switches, scrollbars, tooltips, text fields and their right-click menu).
static func install_theme(window: Window) -> void:
	var t := Theme.new()
	t.default_font = font(false)
	t.default_font_size = 25
	var panel := _flat_box(Look.tone(Color(0.02, 0.07, 0.04, 0.97)), Color(1, 1, 1, 0.18), 14, 12)
	t.set_stylebox("panel", "TooltipPanel", panel)
	t.set_color("font_color", "TooltipLabel", TEXT)
	t.set_font_size("font_size", "TooltipLabel", 22)
	t.set_stylebox("panel", "PopupMenu", panel)
	t.set_stylebox("hover", "PopupMenu", _flat_box(Look.tone(Color(0.08, 0.2, 0.12, 0.95)), Color(0, 0, 0, 0), 10, 8))
	for k in ["font_color", "font_hover_color", "font_accelerator_color"]:
		t.set_color(k, "PopupMenu", TEXT)
	t.set_color("font_disabled_color", "PopupMenu", TEXT_DIM)
	t.set_stylebox("separator", "PopupMenu", StyleBoxEmpty.new())
	for k in ["normal", "focus", "read_only"]:
		var on: bool = k == "focus"
		t.set_stylebox(k, "LineEdit", _flat_box(Look.tone(Color(0.01, 0.05, 0.03, 0.9)), ACCENT if on else Color(1, 1, 1, 0.18)))
	t.set_color("font_color", "LineEdit", TEXT)
	t.set_color("font_placeholder_color", "LineEdit", TEXT_DIM)
	t.set_color("caret_color", "LineEdit", ACCENT)
	t.set_color("selection_color", "LineEdit", Color(ACCENT, 0.35))
	t.set_color("clear_button_color", "LineEdit", TEXT_DIM)
	for sb_type in ["VScrollBar", "HScrollBar"]:
		var track := StyleBoxFlat.new()
		track.bg_color = Color(0, 0, 0, 0.25)
		track.set_corner_radius_all(6)
		track.content_margin_left = 6
		track.content_margin_right = 6
		track.content_margin_top = 6
		track.content_margin_bottom = 6
		t.set_stylebox("scroll", sb_type, track)
		t.set_stylebox("scroll_focus", sb_type, track)
		for g in ["grabber", "grabber_highlight", "grabber_pressed"]:
			var grab := StyleBoxFlat.new()
			grab.bg_color = Color(ACCENT, 0.55 if g == "grabber" else 0.85)
			grab.set_corner_radius_all(6)
			t.set_stylebox(g, sb_type, grab)
	t.set_icon("checked", "CheckButton", _switch_icon(true))
	t.set_icon("unchecked", "CheckButton", _switch_icon(false))
	t.set_icon("checked_disabled", "CheckButton", _switch_icon(true))
	t.set_icon("unchecked_disabled", "CheckButton", _switch_icon(false))
	var ring := StyleBoxFlat.new()
	ring.draw_center = false
	ring.border_color = ACCENT
	ring.set_border_width_all(3)
	ring.set_corner_radius_all(18)
	ring.set_expand_margin_all(3)
	for c in ["Button", "CheckButton", "LinkButton", "TextureButton"]:
		t.set_stylebox("focus", c, ring)
	window.theme = t


## A pill switch drawn at runtime (accent track + cream knob when on).
static func _switch_icon(on: bool) -> Texture2D:
	var w := 76
	var h := 42
	var img := Image.create(w, h, false, Image.FORMAT_RGBA8)
	var track := ACCENT if on else Look.tone(Color(0.13, 0.22, 0.16))
	var knob := P2_BRIGHT if on else TEXT_DIM
	var r := h / 2.0
	var kx := w - r if on else r
	for y in h:
		for x in w:
			var px := Vector2(x + 0.5, y + 0.5)
			var cx := clampf(px.x, r, w - r)
			var d_track := px.distance_to(Vector2(cx, r)) - (r - 1)
			var d_knob := px.distance_to(Vector2(kx, r)) - (r - 5)
			var c := Color(track, clampf(0.5 - d_track, 0, 1))
			var a_knob := clampf(0.5 - d_knob, 0, 1)
			if a_knob > 0:
				c = c.lerp(knob, a_knob) if c.a > 0 else Color(knob, a_knob)
			img.set_pixel(x, y, c)
	return ImageTexture.create_from_image(img)


## Popup background: the painted card frame (9-slice). With a title the top
## margin leaves room for the ribbon that sits across the frame's top edge.
static func frame_box(titled := true) -> StyleBoxTexture:
	var sb := StyleBoxTexture.new()
	sb.texture = scaled_tex("card-frame.webp", Look.frame_h(520))
	var m := 66.0  # painted corner ornaments (48 px in the 371 px source)
	sb.texture_margin_left = m
	sb.texture_margin_right = m
	sb.texture_margin_top = m
	sb.texture_margin_bottom = m
	sb.content_margin_left = 46
	sb.content_margin_right = 46
	# Text keeps clear of the corner ornaments and the ribbon's lower half.
	sb.content_margin_top = 80 if titled else 66
	sb.content_margin_bottom = 66
	return sb


## The same painted frame at a smaller scale, for in-game cards and banners
## (lesson bubble, tips, invites, long toasts).
static func small_frame() -> StyleBoxTexture:
	var sb := StyleBoxTexture.new()
	sb.texture = scaled_tex("card-frame.webp", Look.frame_h(360))
	var m := 47.0
	sb.texture_margin_left = m
	sb.texture_margin_right = m
	sb.texture_margin_top = m
	sb.texture_margin_bottom = m
	sb.content_margin_left = 34
	sb.content_margin_right = 34
	sb.content_margin_top = 46
	sb.content_margin_bottom = 46
	return sb


## Christmas: the painted wreath laid over a popup's frame edge (see fit_wreath).
static func wreath() -> NinePatchRect:
	var n := NinePatchRect.new()
	n.texture = scaled_tex("wreath-frame.webp", 360)
	var m := int(210.0 * 360.0 / 990.0)
	n.patch_margin_left = m
	n.patch_margin_right = m
	n.patch_margin_top = m
	n.patch_margin_bottom = m
	n.draw_center = false
	n.axis_stretch_horizontal = NinePatchRect.AXIS_STRETCH_MODE_TILE_FIT
	n.axis_stretch_vertical = NinePatchRect.AXIS_STRETCH_MODE_TILE_FIT
	n.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return n


## The wreath reaches 38 px outside the panel, so its inner edge stays outside
## the frame's content margin (46 px): it never covers text.
static func fit_wreath(n: Control, panel: Control) -> void:
	n.position = panel.position - Vector2(38, 38)
	n.size = panel.size + Vector2(76, 76)


## The painted title ribbon with `text` on it, at most `max_w` wide.
static func ribbon(text: String, max_w: float) -> PanelContainer:
	var h := 92
	var p := PanelContainer.new()
	var sb := art_box(BANNER, h)
	# Text only on the ribbon's flat middle, never over the curled ends.
	sb.content_margin_left = sb.texture_margin_left
	sb.content_margin_right = sb.texture_margin_right
	p.add_theme_stylebox_override("panel", sb)
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var l := label(text, 30, TEXT, true, 6)
	l.clip_text = true
	l.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	var room := max_w - sb.content_margin_left - sb.content_margin_right
	var fs := 30
	while fs > 16 and font(true).get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x > room:
		fs -= 1
	l.add_theme_font_size_override("font_size", fs)
	var w := font(true).get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x
	p.custom_minimum_size = Vector2(clampf(w + sb.content_margin_left + sb.content_margin_right + 24, 300, max_w), h)
	p.size = p.custom_minimum_size
	p.add_child(l)
	return p


## Dark rounded strip behind text that sits straight on the painted background
## (menu links, footer, card state lines) — the web app's glass pill.
static func scrim(child: Control, link := false) -> PanelContainer:
	var p := PanelContainer.new()
	# Links get a thin accent edge (tappable); info lines have none.
	var sb := _flat_box(Look.tone(Color(0.02, 0.08, 0.04, 0.78)), Color(ACCENT, 0.5) if link else Color(0, 0, 0, 0), 40, 22)
	sb.content_margin_top = 4
	sb.content_margin_bottom = 4
	p.add_theme_stylebox_override("panel", sb)
	p.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	p.add_child(child)
	return p


static func _flat_box(bg: Color, border: Color, radius := 18, pad := 16) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.border_color = border
	sb.set_border_width_all(2)
	sb.set_corner_radius_all(radius)
	sb.content_margin_left = pad
	sb.content_margin_right = pad
	sb.content_margin_top = 10
	sb.content_margin_bottom = 10
	return sb


static func section(text: String) -> Label:
	var l := label(text, 26, ACCENT, true, 8)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	return l


static func hint(text: String) -> Label:
	var l := label(text, 21, TEXT_DIM, false, 8)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	return l


static func input(value: String, placeholder: String, max_len := 20) -> LineEdit:
	var e := LineEdit.new()
	e.text = value
	e.placeholder_text = placeholder
	e.max_length = max_len
	e.custom_minimum_size = Vector2(0, 72)
	e.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	e.add_theme_font_override("font", font(false))
	e.add_theme_font_size_override("font_size", 28)
	e.add_theme_color_override("font_color", TEXT)
	e.add_theme_color_override("font_placeholder_color", TEXT_DIM)
	e.add_theme_stylebox_override("normal", _flat_box(Look.tone(Color(0.01, 0.05, 0.03, 0.9)), Color(1, 1, 1, 0.18)))
	e.add_theme_stylebox_override("focus", _flat_box(Look.tone(Color(0.01, 0.05, 0.03, 0.9)), ACCENT))
	e.add_theme_stylebox_override("read_only", _flat_box(Look.tone(Color(0.03, 0.08, 0.05, 0.6)), Color(1, 1, 1, 0.08)))
	return e


## A full-width checkbox row; `on_change(bool)` fires on every flip.
static func toggle(text: String, on: bool, on_change: Callable) -> CheckButton:
	var c := CheckButton.new()
	c.text = text
	c.button_pressed = on
	c.focus_mode = Control.FOCUS_NONE
	c.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	c.custom_minimum_size = Vector2(0, 64)
	c.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	c.add_theme_font_override("font", font(false))
	c.add_theme_font_size_override("font_size", 25)
	for k in ["font_color", "font_hover_color", "font_pressed_color", "font_hover_pressed_color", "font_focus_color"]:
		c.add_theme_color_override(k, TEXT)
	c.toggled.connect(on_change)
	return c


## Plain rounded button (lists, secondary actions). danger = red outline.
## A plain button sized to its text (no wrapping), for tight rows and pills.
static func small_button(text: String, danger := false, font_size := 22) -> Button:
	var b := plain_button(text, danger, font_size)
	b.autowrap_mode = TextServer.AUTOWRAP_OFF
	return b


static func plain_button(text: String, danger := false, font_size := BTN_M) -> Button:
	var fs := btn_size(font_size)
	var b := Button.new()
	b.text = text.to_upper()
	b.focus_mode = Control.FOCUS_NONE
	b.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	b.add_theme_font_override("font", font(true))
	b.add_theme_font_size_override("font_size", fs)
	b.custom_minimum_size = Vector2(0, 68)
	var sb := art_box(DANGER if danger else PILL_BTN, 68)
	sb.content_margin_top = 8
	sb.content_margin_bottom = 8
	for st in ["normal", "hover", "pressed", "disabled", "focus"]:
		b.add_theme_stylebox_override(st, sb)
	# A shrink-centred wrapping button gets no width and breaks after every
	# letter: only those keep their text's width (up to a line). Fill/fixed
	# rows still wrap freely.
	b.ready.connect(func():
		if b.size_flags_horizontal == Control.SIZE_SHRINK_CENTER:
			var w := font(true).get_string_size(b.text, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x + sb.content_margin_left + sb.content_margin_right + 12
			b.custom_minimum_size.x = minf(w, 560))
	for k in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]:
		b.add_theme_color_override(k, TEXT)
	b.add_theme_color_override("font_disabled_color", TEXT_DIM)
	b.add_theme_constant_override("outline_size", 6)
	b.add_theme_color_override("font_outline_color", Look.tone(Color(0, 0.08, 0.03, 0.8)))
	juicy(b)
	return b
