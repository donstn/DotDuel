class_name Campfire
extends Node2D
## Burning campfire over the stone ring of the Christmas background (whose
## painted flame is removed: tools/remove_painted_fire.py). The flame is a
## shader: rising, swaying noise shaped into tongues, so it flows instead of
## flickering. Plus a slowly breathing light pool and drifting embers.
## Local units are pixels of the 1024-px-tall background art (main.gd scales it).

const FLAME := """
shader_type canvas_item;
render_mode blend_add;
uniform float seed = 0.0;
uniform float speed = 1.0;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
		mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
	float v = 0.0;
	float a = 0.5;
	for (int k = 0; k < 4; k++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
	return v;
}

void fragment() {
	float t = TIME * speed + seed;
	float y = 1.0 - UV.y;            // 0 at the logs, 1 at the tip
	float x = UV.x - 0.5;
	// Noise scrolls upward, so tongues rise and peel off; the whole flame
	// leans gently, more at the top.
	float lean = (fbm(vec2(seed, t * 0.35)) - 0.5) * 0.22 * y;
	float warp = (fbm(vec2(UV.x * 3.0 + seed, UV.y * 2.0 + t * 1.6)) - 0.5) * 0.28 * y;
	x += lean + warp;
	float w = 0.5 * pow(1.0 - y, 0.55);          // teardrop: wide base, thin tip
	float shape = 1.0 - smoothstep(w * 0.25, w, abs(x));
	float erode = fbm(vec2(UV.x * 5.0 - seed, UV.y * 3.5 + t * 2.4));
	float heat = shape * (1.15 - y * 0.75) - erode * (0.25 + 0.75 * y);
	heat *= smoothstep(0.0, 0.12, y);
	float a = smoothstep(0.0, 0.35, heat);
	vec3 col = mix(vec3(0.85, 0.22, 0.03), vec3(1.0, 0.55, 0.1), smoothstep(0.1, 0.45, heat));
	col = mix(col, vec3(1.0, 0.8, 0.38), smoothstep(0.45, 0.8, heat));
	col = mix(col, vec3(1.0, 0.95, 0.78), smoothstep(0.9, 1.15, heat));
	COLOR = vec4(col * a * 0.82, a);
}
"""

var _noise := FastNoiseLite.new()
var _t := 0.0
var _pool: Sprite2D
var _halo: Sprite2D


static func _soft(size: int, inner: Color, outer: Color) -> GradientTexture2D:
	var g := Gradient.new()
	g.set_color(0, inner)
	g.set_color(1, outer)
	var t := GradientTexture2D.new()
	t.gradient = g
	t.fill = GradientTexture2D.FILL_RADIAL
	t.fill_from = Vector2(0.5, 0.5)
	t.fill_to = Vector2(1.0, 0.5)
	t.width = size
	t.height = size
	return t


func _ready() -> void:
	_noise.frequency = 0.6
	var add := CanvasItemMaterial.new()
	add.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD

	_pool = Sprite2D.new()
	_pool.texture = _soft(128, Color(1.0, 0.55, 0.2, 0.4), Color(1.0, 0.4, 0.1, 0.0))
	_pool.material = add
	_pool.scale = Vector2(3.6, 1.5)
	_pool.position = Vector2(0, 10)
	add_child(_pool)

	_halo = Sprite2D.new()
	_halo.texture = _soft(128, Color(1.0, 0.7, 0.3, 0.35), Color(1.0, 0.45, 0.1, 0.0))
	_halo.material = add
	_halo.scale = Vector2(1.5, 1.7)
	_halo.position = Vector2(0, -40)
	add_child(_halo)

	# A tall centre flame plus two side tongues with their own seeds and pace,
	# so the fire never pulses as one shape.
	for spec in [[Vector2(-22, 0), Vector2(62, 96), 17.3, 1.1], [Vector2(22, 0), Vector2(60, 104), 41.7, 0.95], [Vector2(0, 0), Vector2(96, 150), 0.0, 1.0]]:
		var mat := ShaderMaterial.new()
		var sh := Shader.new()
		sh.code = FLAME
		mat.shader = sh
		mat.set_shader_parameter("seed", spec[2])
		mat.set_shader_parameter("speed", spec[3])
		var r := ColorRect.new()
		r.material = mat
		r.mouse_filter = Control.MOUSE_FILTER_IGNORE
		r.size = spec[1]
		r.position = spec[0] + Vector2(-spec[1].x / 2.0, -spec[1].y + 6)
		add_child(r)

	var dot := _soft(32, Color.WHITE, Color(1, 1, 1, 0))
	var embers := CPUParticles2D.new()
	embers.texture = dot
	embers.material = add
	embers.amount = 10
	embers.lifetime = 3.2
	embers.position = Vector2(0, -50)
	embers.emission_shape = CPUParticles2D.EMISSION_SHAPE_RECTANGLE
	embers.emission_rect_extents = Vector2(14, 10)
	embers.direction = Vector2.UP
	embers.spread = 22
	embers.gravity = Vector2(5, -8)
	embers.initial_velocity_min = 22
	embers.initial_velocity_max = 45
	embers.scale_amount_min = 0.1
	embers.scale_amount_max = 0.2
	var er := Gradient.new()
	er.set_color(0, Color(1.0, 0.85, 0.4, 1.0))
	er.set_color(1, Color(1.0, 0.35, 0.05, 0.0))
	embers.color_ramp = er
	add_child(embers)


func _process(delta: float) -> void:
	_t += delta
	# Slow breathing of the light, never a strobe.
	var g := _noise.get_noise_1d(_t * 1.5)
	_pool.modulate.a = 0.85 + 0.15 * g
	_halo.modulate.a = 0.8 + 0.2 * _noise.get_noise_1d(_t * 2.0 + 40.0)
