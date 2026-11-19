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
			_fonts[key] = load("res://assets/fonts/chakra-petch-700.woff2")
		else:
			# Outfit is a variable font; without an axis value it renders at its thinnest.
			var v := FontVariation.new()
			v.base_font = load("res://assets/fonts/outfit-var.woff2")
			v.variation_opentype = {TextServerManager.get_primary_interface().name_to_tag("wght"): 560}
			_fonts[key] = v
	return _fonts[key]


static func tex(file: String) -> Texture2D:
	return load(ART + file)


## Texture resampled so its height is `h` px (keeps 9-slice caps in proportion).
static func scaled_tex(file: String, h: int) -> Texture2D:
	var key := "%s@%d" % [file, h]
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
	juicy(b)
	return b


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
