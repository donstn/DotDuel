class_name BoardDef
extends RefCounted
## Board geometry, ported 1:1 from src/geometry.ts. Dot positions are in
## board units (1 = distance between neighbouring dots).

var id := ""
var label := ""
var pos := PackedVector2Array()
var lines: Array[PackedInt32Array] = []
var line_len := PackedInt32Array()
var line_dir := PackedVector2Array()
var line_id := PackedStringArray()  # same ids as src/geometry.ts ("h:r3")
var line_index := {}
var dot_lines: Array[PackedInt32Array] = []
var total_points := 0
var bounds := Rect2()
var outline := PackedVector2Array()

static var _cache := {}

const SHAPES := ["triangle", "square", "rectangle"]
const LABELS := {"triangle": "Triangle", "square": "Square", "rectangle": "Rectangle"}


static func get_board(shape: String) -> BoardDef:
	if not _cache.has(shape):
		_cache[shape] = _build(shape)
	return _cache[shape]


static func _build(shape: String) -> BoardDef:
	var b := BoardDef.new()
	b.id = shape
	b.label = LABELS.get(shape, shape)
	var rt := sqrt(3.0) / 2.0
	var spec: Array = []  # [row, col, x, y]
	var kinds: Array = []  # [key Callable(r, c) -> String, direction]
	match shape:
		"triangle":
			var rows := [8, 7, 6, 5, 4, 3, 2, 1]
			for r in rows.size():
				for c in rows[r]:
					spec.append([r, c, r / 2.0 + c, r * rt])
			kinds = [
				[func(r, _c): return "h:r%d" % r, Vector2(1, 0)],
				[func(_r, c): return "d1:c%d" % c, Vector2(0.5, rt)],
				[func(r, c): return "d2:s%d" % (r + c), Vector2(-0.5, rt)],
			]
		_:
			var nr := 7 if shape == "square" else 9
			for r in nr:
				for c in 7:
					spec.append([r, c, float(c), float(r)])
			kinds = [
				[func(r, _c): return "h:r%d" % r, Vector2(1, 0)],
				[func(_r, c): return "v:c%d" % c, Vector2(0, 1)],
				[func(r, c): return "d1:d%d" % (r - c), Vector2(1, 1).normalized()],
				[func(r, c): return "d2:s%d" % (r + c), Vector2(-1, 1).normalized()],
			]

	for s in spec:
		b.pos.append(Vector2(s[2], s[3]))
		b.dot_lines.append(PackedInt32Array())

	for k in kinds:
		var key_fn: Callable = k[0]
		var buckets := {}
		var order: Array = []
		for i in spec.size():
			var key: String = key_fn.call(spec[i][0], spec[i][1])
			if not buckets.has(key):
				buckets[key] = []
				order.append(key)
			buckets[key].append(i)
		for key in order:
			var ids: Array = buckets[key]
			ids.sort_custom(func(a, c):
				var pa: Vector2 = b.pos[a]
				var pc: Vector2 = b.pos[c]
				return pa.y < pc.y if pa.y != pc.y else pa.x < pc.x)
			var li := b.lines.size()
			b.lines.append(PackedInt32Array(ids))
			b.line_len.append(ids.size())
			b.line_dir.append(k[1])
			b.line_id.append(key)
			b.line_index[key] = li
			b.total_points += ids.size()
			for d in ids:
				b.dot_lines[d].append(li)

	var mn := b.pos[0]
	var mx := b.pos[0]
	for p in b.pos:
		mn = mn.min(p)
		mx = mx.max(p)
	b.bounds = Rect2(mn, mx - mn)
	b.outline = _rounded_hull(b.pos, 0.62)
	return b


## Convex hull grown by `pad` with smooth round corners. (Geometry2D.offset_polygon
## approximates arcs this small with one flat segment, which cut the corners off.)
static func _rounded_hull(points: PackedVector2Array, pad: float) -> PackedVector2Array:
	var hull := Geometry2D.convex_hull(points)
	if hull.size() > 1 and hull[0] == hull[hull.size() - 1]:
		hull.remove_at(hull.size() - 1)
	var centre := Vector2.ZERO
	for p in hull:
		centre += p
	centre /= hull.size()
	var n := hull.size()
	var normals: Array[Vector2] = []
	for i in n:
		var a := hull[i]
		var e := hull[(i + 1) % n]
		var nrm := Vector2(e.y - a.y, a.x - e.x).normalized()
		if nrm.dot((a + e) / 2.0 - centre) < 0:
			nrm = -nrm
		normals.append(nrm)
	var out := PackedVector2Array()
	for i in n:
		var a1 := normals[(i - 1 + n) % n].angle()
		var sweep := wrapf(normals[i].angle() - a1, -PI, PI)
		var steps := maxi(1, int(absf(sweep) / 0.12))
		for k in steps + 1:
			out.append(hull[i] + Vector2.from_angle(a1 + sweep * k / steps) * pad)
	return out
