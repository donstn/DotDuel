class_name UI
extends RefCounted
## Helpers for the painted Forest & Pearl art: 9-slice buttons scaled to a
## target height (caps keep their proportions), fonts, juicy press feedback.

const ART := "res://assets/art/"
const P1 := Color("0d4a23")
const P1_BRIGHT := Color("62cf90")
const P2 := Color("d3ecaa")
const P2_BRIGHT := Color("f0fbcf")
const ACCENT := Color("7bdb95")
const TEXT := Color("eaf3e3")
const TEXT_DIM := Color("93a89a")
const GOLD := Color("f3d27a")

# [file, src_w, src_h, cap_left, cap_right]
const MENU_BTN := ["menu-button.webp", 873, 187, 167, 168]
const PRIMARY_BTN := ["primary-button.webp", 916, 201, 165, 165]
const PILL_BTN := ["pill-button.webp", 475, 179, 106, 108]
const BANNER := ["title-banner.webp", 588, 178, 115, 115]
const DANGER := ["danger-pill.webp", 215, 81, 54, 55]

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


## The web export has no system fonts, so emoji/symbols would draw as hex boxes
## without these bundled subsets (scripts in godot/tools/subset-symbol-fonts.py).
static func _with_symbols(f: Font) -> Font:
	if f.fallbacks.is_empty():
		var fb: Array[Font] = []
		for n in ["noto-emoji-subset", "noto-math-subset", "noto-symbols-subset"]:
			fb.append(load("res://assets/fonts/%s.ttf" % n))
		f.fallbacks = fb
		if ThemeDB.fallback_font and ThemeDB.fallback_font.fallbacks.is_empty():
			ThemeDB.fallback_font.fallbacks = fb
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
		l.add_theme_color_override("font_outline_color", Color(0, 0.06, 0.03, 0.85))
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	return l


static func art_button(text: String, spec: Array, w: int, h: int, font_size := 34, color := TEXT) -> Button:
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
	b.add_theme_color_override("font_outline_color", Color(0, 0.08, 0.03, 0.8))
	# Longer translations shrink to stay inside the painted caps.
	var room := w - sb.content_margin_left - sb.content_margin_right
	var fs := font_size
	while fs > 14 and font(true).get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, fs).x + 8 > room:
		fs -= 1
	b.add_theme_font_size_override("font_size", fs)
	juicy(b)
	return b


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
	n.draw_circle(at, rad * 0.36, Color(0.05, 0.12, 0.08))


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
	var l := label(text, 26, ACCENT, true, 4)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	return l


static func hint(text: String) -> Label:
	var l := label(text, 20, TEXT_DIM, false, 3)
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
	e.add_theme_stylebox_override("normal", _flat_box(Color(0.01, 0.05, 0.03, 0.9), Color(1, 1, 1, 0.18)))
	e.add_theme_stylebox_override("focus", _flat_box(Color(0.01, 0.05, 0.03, 0.9), ACCENT))
	e.add_theme_stylebox_override("read_only", _flat_box(Color(0.03, 0.08, 0.05, 0.6), Color(1, 1, 1, 0.08)))
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


static func plain_button(text: String, danger := false, font_size := 25) -> Button:
	var b := Button.new()
	b.text = text
	b.focus_mode = Control.FOCUS_NONE
	b.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	b.add_theme_font_override("font", font(true))
	b.add_theme_font_size_override("font_size", font_size)
	b.custom_minimum_size = Vector2(0, 68)
	# A shrink-centred wrapping button gets no width and breaks after every
	# letter: only those keep their text's width (up to a line). Fill/fixed
	# rows still wrap freely.
	b.ready.connect(func():
		if b.size_flags_horizontal == Control.SIZE_SHRINK_CENTER:
			var w := font(true).get_string_size(b.text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size).x + 48
			b.custom_minimum_size.x = minf(w, 560))
	var col := Color("ff8a7a") if danger else TEXT
	for k in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]:
		b.add_theme_color_override(k, col)
	var border := Color(1, 0.45, 0.4, 0.6) if danger else Color(1, 1, 1, 0.18)
	b.add_theme_stylebox_override("normal", _flat_box(Color(0.02, 0.07, 0.04, 0.9), border))
	b.add_theme_stylebox_override("hover", _flat_box(Color(0.05, 0.14, 0.08, 0.95), border))
	b.add_theme_stylebox_override("pressed", _flat_box(Color(0.08, 0.2, 0.12, 0.95), ACCENT))
	b.add_theme_stylebox_override("disabled", _flat_box(Color(0.02, 0.05, 0.03, 0.6), Color(1, 1, 1, 0.06)))
	b.add_theme_color_override("font_disabled_color", TEXT_DIM)
	return b
