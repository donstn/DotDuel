extends Node
## Sound: synthesized cues (pre-rendered to .ogg by tools/render_sfx.tscn) plus the
## game's CC0 recordings for win / loss / forest ambience. The Christmas theme
## swaps in its own synthesized set, ported from src/audioXmas.ts: glass
## bauble taps, glockenspiel, sleigh bells, a Jingle Bells win (public-domain
## melody) and a crackling campfire loop. Desert Sunset has its own set too:
## wooden marimba taps, kalimba arpeggios, a sand shaker, hand-drum stings,
## and the CC0 wind loop with a distant hawk cry now and then.

const RATE := 22050
const XRATE := 44100
const NOTES := [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98]

# [ratio, amp, decay seconds] partial sets (src/audioXmas.ts).
const GLOCK := [[1.0, 1.0, 1.4], [2.76, 0.32, 0.45], [5.4, 0.12, 0.18], [8.93, 0.05, 0.08]]
const TINE := [[1.0, 1.0, 1.1], [2.0, 0.18, 0.4], [3.0, 0.08, 0.25], [4.2, 0.04, 0.12]]
const GLASS := [[1.0, 1.0, 0.38], [2.32, 0.5, 0.24], [4.25, 0.28, 0.13], [6.63, 0.12, 0.07]]
const SLEIGH := [[1.0, 1.0, 0.16], [1.47, 0.5, 0.1], [2.13, 0.3, 0.06]]
# Desert: marimba bar (1 : 3.9 : 9.2) and kalimba tine.
const WOOD := [[1.0, 1.0, 0.32], [3.93, 0.28, 0.07], [9.2, 0.07, 0.025]]
const KALIMBA := [[1.0, 1.0, 0.9], [5.4, 0.16, 0.1], [2.0, 0.08, 0.35]]

var _players: Array[AudioStreamPlayer] = []
var _next := 0
var _cache := {}
var _xmas := {}
var _desert := {}
var _ambience: AudioStreamPlayer
var _hawk: AudioStreamPlayer
var _hawk_timer: Timer
## Autotest forces silence; otherwise the two Settings switches decide.
var muted := false


func sfx_on() -> bool:
	return not muted and bool(Store.settings.get("sfxEnabled", true))


func music_on() -> bool:
	return not muted and bool(Store.settings.get("musicEnabled", true))


func set_sfx(on: bool) -> void:
	Store.set_setting("sfxEnabled", on)


func set_music(on: bool) -> void:
	Store.set_setting("musicEnabled", on)
	ambience(on)


func _ready() -> void:
	for i in 10:
		var p := AudioStreamPlayer.new()
		add_child(p)
		_players.append(p)
	_ambience = AudioStreamPlayer.new()
	_ambience.volume_db = -16.0
	add_child(_ambience)
	_hawk = AudioStreamPlayer.new()
	add_child(_hawk)
	_hawk_timer = Timer.new()
	_hawk_timer.one_shot = true
	_hawk_timer.timeout.connect(_on_hawk)
	add_child(_hawk_timer)
	_cache = _load_set("forest")


## The cues are pre-rendered by tools/render_sfx.tscn from synth_forest() /
## synth_xmas() below: synthesizing them here took ~10 s on the web at start-up.
func _load_set(dir: String) -> Dictionary:
	var out := {}
	var base := "res://assets/audio/synth/%s/" % dir
	for f in ResourceLoader.list_directory(base):
		if f.ends_with(".ogg"):
			out[f.get_basename()] = load(base + f)
	return out


func synth_forest() -> Dictionary:
	var c := {}
	c["place1"] = _pluck([659.25], 0.22, 0.55)
	c["place2"] = _pluck([783.99], 0.22, 0.55)
	c["tick"] = _pluck([1760.0], 0.05, 0.25)
	c["pending"] = _pluck([1318.5, 1567.98], 0.5, 0.25)
	c["claim"] = _arp([783.99, 1174.66], 0.07, 0.45)
	c["whoosh"] = _noise(0.25, 0.25)
	for n in range(1, 10):
		var arp: Array = []
		for i in min(n, 6):
			arp.append(NOTES[min(i + int(n / 3.0), NOTES.size() - 1)])
		c["line%d" % n] = _arp(arp, 0.055, 0.5)
	return c


func play(cue: String, pitch := 1.0, vol_db := 0.0) -> void:
	if not sfx_on():
		return
	var own := _theme_set()
	if own.has(cue):
		_play_stream(own[cue], pitch, vol_db)
		return
	if _cache.has(cue):
		_play_stream(_cache[cue], pitch, vol_db)


func play_file(path: String, vol_db := 0.0) -> void:
	if not sfx_on():
		return
	_play_stream(load(path), 1.0, vol_db)


## End-of-game sting: "win", "draw" or "loss".
func result(kind: String) -> void:
	if Look.xmas():
		play("x_" + kind, 1.0, -1.0)
	elif _is_desert():
		play("d_" + kind, 1.0, -1.0)
	elif kind == "loss":
		play_file("res://assets/audio/loss-rain.mp3")
		play("line3", 0.7, -4.0)
	else:
		play_file("res://assets/audio/win-stream.mp3")
		play("line8", 1.0, -2.0)


func ambience(on: bool) -> void:
	_ambience.stop()
	_hawk_timer.stop()
	if not on or not music_on():
		return
	if _is_desert():
		var w: AudioStreamMP3 = load("res://assets/audio/ambience-wind.mp3")
		w.loop = true
		_ambience.stream = w
		_ambience.volume_db = -12.0
		_hawk_timer.start(randf_range(8.0, 20.0))
	elif Look.xmas():
		_build_xmas()
		_ambience.stream = _xmas["fireside"]
		_ambience.volume_db = -8.0
	else:
		var s: AudioStreamMP3 = load("res://assets/audio/ambience-birds.mp3")
		s.loop = true
		_ambience.stream = s
		_ambience.volume_db = -16.0
	_ambience.play()


func _play_stream(stream: AudioStream, pitch: float, vol_db: float) -> void:
	var p := _players[_next]
	_next = (_next + 1) % _players.size()
	p.stream = stream
	p.pitch_scale = pitch
	p.volume_db = vol_db
	p.play()


func _wav(samples: PackedFloat32Array, rate := RATE) -> AudioStreamWAV:
	var data := PackedByteArray()
	data.resize(samples.size() * 2)
	for i in samples.size():
		data.encode_s16(i * 2, int(clampf(samples[i], -1.0, 1.0) * 32000.0))
	var w := AudioStreamWAV.new()
	w.format = AudioStreamWAV.FORMAT_16_BITS
	w.mix_rate = rate
	w.stereo = false
	w.data = data
	return w


## Glassy marimba-ish pluck: fundamental + soft octave/fifth partials.
func _voice(out: PackedFloat32Array, start: int, freq: float, dur: float, amp: float) -> void:
	var n := int(dur * RATE)
	for i in n:
		var idx := start + i
		if idx >= out.size():
			break
		var t := float(i) / RATE
		var env := minf(1.0, t / 0.004) * exp(-t * 7.0 / dur)
		var v := sin(TAU * freq * t) + 0.35 * sin(TAU * freq * 2.0 * t) * exp(-t * 18.0) + 0.12 * sin(TAU * freq * 3.01 * t) * exp(-t * 30.0)
		out[idx] += v * env * amp


func _pluck(freqs: Array, dur: float, amp: float) -> AudioStreamWAV:
	var out := PackedFloat32Array()
	out.resize(int(dur * RATE) + 64)
	for f in freqs:
		_voice(out, 0, f, dur, amp / freqs.size())
	return _wav(out)


func _arp(freqs: Array, step: float, amp: float) -> AudioStreamWAV:
	var tail := 0.45
	var out := PackedFloat32Array()
	out.resize(int((step * freqs.size() + tail) * RATE))
	for i in freqs.size():
		_voice(out, int(i * step * RATE), freqs[i], tail, amp * 0.7)
	return _wav(out)


func _noise(dur: float, amp: float) -> AudioStreamWAV:
	var out := PackedFloat32Array()
	out.resize(int(dur * RATE))
	var lp := 0.0
	for i in out.size():
		var t := float(i) / out.size()
		lp = lerpf(lp, randf_range(-1.0, 1.0), 0.08 + 0.3 * t)
		out[i] = lp * sin(PI * t) * amp
	return _wav(out)


# ---------------------------------------------------------------- theme sets

func _is_desert() -> bool:
	return Look.id == Look.DESERT


func _theme_set() -> Dictionary:
	if Look.xmas():
		_build_xmas()
		return _xmas
	if _is_desert():
		if _desert.is_empty():
			_desert = _load_set("desert")
		return _desert
	return {}


## A distant hawk over the canyon every 25-60 s (follows the music switch).
func _on_hawk() -> void:
	if not _is_desert() or not music_on() or not _ambience.playing:
		return
	var cues := _theme_set()
	if cues.has("hawk"):
		_hawk.stream = cues["hawk"]
		_hawk.pitch_scale = randf_range(0.94, 1.06)
		_hawk.volume_db = randf_range(-16.0, -11.0)
		_hawk.play()
	_hawk_timer.start(randf_range(25.0, 60.0))


# ---------------------------------------------------------------- Desert

func synth_desert() -> Dictionary:
	var x := {}
	# D minor pentatonic, kalimba register.
	var pent := []
	for semis in [5, 8, 10, 12, 15, 17, 20, 22, 24]:
		pent.append(_note(semis))
	for p in [1, 2]:
		var o := _buf(0.5)
		_partials(o, 0.0, _note(-2) if p == 1 else _note(1), 0.55, WOOD)
		_burst(o, 0.0, 0.01, 0.12, 1400.0, 1.5)
		x["place%d" % p] = _wav(o, XRATE)
	var tk := _buf(0.12)
	_partials(tk, 0.0, 1900.0, 0.2, WOOD, 0.25)
	_burst(tk, 0.0, 0.006, 0.12, 2600.0, 2.0)
	x["tick"] = _wav(tk, XRATE)
	var pend := _buf(1.0)
	_partials(pend, 0.0, pent[4], 0.28, KALIMBA)
	_partials(pend, 0.1, pent[6], 0.22, KALIMBA)
	x["pending"] = _wav(pend, XRATE)
	var cl := _buf(1.0)
	_shaker(cl, 0.0, 0.9)
	_partials(cl, 0.03, pent[3], 0.3, KALIMBA)
	_partials(cl, 0.1, pent[5], 0.3, KALIMBA)
	x["claim"] = _wav(cl, XRATE)
	x["whoosh"] = _sand_whoosh(0.35)
	for n in range(1, 10):
		var count := mini(pent.size(), maxi(2, 2 + n / 2))
		var lift := mini(n / 3, pent.size() - count)
		var o := _buf(1.5)
		for i in count:
			_partials(o, i * 0.06, pent[i + lift], 0.36, KALIMBA)
		if n >= 5:
			_shaker(o, count * 0.06, 0.7)
		x["line%d" % n] = _wav(o, XRATE)
	var d4 := _note(-7)
	var win := _buf(3.4)
	for i in 6:
		_drum(win, i * 0.16, 0.5 if i % 2 == 0 else 0.3, d4 if i % 2 == 0 else d4 * 1.5)
	var up := [0, 2, 3, 4, 6, 8]
	for i in up.size():
		_partials(win, 0.96 + i * 0.11, pent[up[i]], 0.38, KALIMBA, 1.4)
	_shaker(win, 0.96 + up.size() * 0.11, 1.0)
	_partials(win, 0.96 + up.size() * 0.11, d4, 0.3, WOOD, 4.0)
	x["d_win"] = _wav(win, XRATE)
	var draw := _buf(2.6)
	var dn := [3, 4, 3, 2, 3]
	for i in dn.size():
		_partials(draw, i * 0.2, pent[dn[i]], 0.32, KALIMBA, 1.2)
	_drum(draw, 0.0, 0.35, d4)
	_drum(draw, 0.8, 0.35, d4)
	x["d_draw"] = _wav(draw, XRATE)
	var loss := _buf(3.0)
	var fall := [6, 4, 3, 1, 0]
	for i in fall.size():
		_partials(loss, i * 0.28, pent[fall[i]], 0.32 - i * 0.03, KALIMBA, 1.3)
	_drum(loss, 1.4, 0.45, d4 * 0.75)
	x["d_loss"] = _wav(loss, XRATE)
	x["hawk"] = _hawk_cry()
	return x


## Sand shaker: a quick run of bright band-passed noise grains.
func _shaker(out: PackedFloat32Array, at: float, peak: float) -> void:
	var t := at
	for h in 7:
		_burst(out, t, randf_range(0.02, 0.045), peak * randf_range(0.05, 0.09), randf_range(5500.0, 8500.0), 0.8)
		t += randf_range(0.018, 0.035)


## Hand drum: pitched thump with a falling pitch and a skin slap.
func _drum(out: PackedFloat32Array, at: float, peak: float, freq: float) -> void:
	var start := int(at * XRATE)
	var n := mini(int(0.45 * XRATE), out.size() - start)
	var ph := 0.0
	for i in n:
		var t := float(i) / XRATE
		ph += TAU * freq * (1.0 + 0.6 * exp(-t * 30.0)) / XRATE
		out[start + i] += sin(ph) * peak * exp(-t * 9.0) * minf(1.0, i / 40.0)
	_burst(out, at, 0.015, peak * 0.25, 900.0, 1.2)


func _sand_whoosh(dur: float) -> AudioStreamWAV:
	var o := _buf(dur)
	var y := 0.0
	for i in o.size():
		var t := float(i) / o.size()
		var hp := randf_range(-1.0, 1.0)
		y = lerpf(y, hp, 0.25 + 0.5 * t)
		o[i] = (hp - y) * sin(PI * t) * 0.22
	return _wav(o, XRATE)


## Distant red-tail hawk: a raspy "kee-eeer" falling in pitch, low-passed and
## echoed off the canyon walls.
func _hawk_cry() -> AudioStreamWAV:
	var dur := 1.6
	var o := _buf(dur + 1.4, RATE)
	var ph := 0.0
	var lp := 0.0
	var n := int(dur * RATE)
	for i in n:
		var t := float(i) / RATE
		var k := t / dur
		var f := lerpf(3000.0, 2050.0, k * k) * (1.0 + 0.02 * sin(TAU * 26.0 * t))
		ph += TAU * f / RATE
		var env := minf(1.0, t / 0.12) * pow(1.0 - k, 1.6)
		var v := sin(ph) + 0.5 * sin(2.0 * ph) + 0.25 * sin(3.0 * ph)
		v *= 0.75 + 0.25 * randf_range(-1.0, 1.0)
		lp += 0.35 * (v - lp)
		o[i] = lp * env * 0.28
	var dry := o.duplicate()
	for e in [[0.32, 0.35], [0.7, 0.18], [1.1, 0.08]]:
		var d := int(e[0] * RATE)
		for i in range(d, o.size()):
			o[i] += dry[i - d] * e[1]
	return _wav(o, RATE)


# ---------------------------------------------------------------- Christmas

func _build_xmas() -> void:
	if not _xmas.is_empty():
		return
	_xmas = _load_set("xmas")
	if _xmas.has("fireside"):
		_xmas["fireside"].loop = true


func synth_xmas() -> Dictionary:
	var x := {}
	var c5 := _note(3)
	var d5 := _note(5)
	var e5 := _note(7)
	var g5 := _note(10)
	var b4 := _note(2)
	var a4 := _note(0)
	var g4 := _note(-2)
	var c4 := _note(-9)
	for p in [1, 2]:
		var o := _buf(0.45)
		_partials(o, 0.0, 1650.0 if p == 1 else 2050.0, 0.5, GLASS)
		_burst(o, 0.0, 0.012, 0.18, 6000.0, 2.0)
		x["place%d" % p] = _wav(o, XRATE)
	var tk := _buf(0.2)
	_partials(tk, 0.0, 3200.0, 0.14, GLASS, 0.4)
	x["tick"] = _wav(tk, XRATE)
	var pend := _buf(0.9)
	_partials(pend, 0.0, _note(22), 0.25, GLOCK, 0.5)
	_partials(pend, 0.09, _note(26), 0.2, GLOCK, 0.5)
	x["pending"] = _wav(pend, XRATE)
	var cl := _buf(0.9)
	_sleigh(cl, 0.0, 1.0, 6)
	_partials(cl, 0.04, _note(19), 0.32, GLOCK, 0.6)
	x["claim"] = _wav(cl, XRATE)
	var scale := []
	for r in [1.0, 9.0 / 8.0, 5.0 / 4.0, 3.0 / 2.0, 5.0 / 3.0, 2.0]:
		scale.append(r * _note(15))
	for n in range(1, 10):
		var count := mini(scale.size(), maxi(2, 2 + n / 2))
		var o := _buf(1.4)
		for i in count:
			_partials(o, i * 0.055, scale[i], 0.38, GLOCK, 0.6)
		if n >= 5:
			_sleigh(o, count * 0.055, 0.8, 5)
		x["line%d" % n] = _wav(o, XRATE)
	# Jingle Bells / We Wish You a Merry Christmas: public-domain carols.
	var jingle := [[e5, 1], [e5, 1], [e5, 2], [e5, 1], [e5, 1], [e5, 2], [e5, 1], [g5, 1], [c5, 1.5], [d5, 0.5], [e5, 4]]
	var beat := 0.17
	var win := _buf(4.6)
	var end := _phrase(win, 0.0, jingle, beat, 0.42, GLOCK)
	for bt in range(0, 12, 2):
		_sleigh(win, bt * beat, 0.5, 4)
	_partials(win, end - 4 * beat, c4, 0.26, TINE, 2.0)
	_partials(win, end - 4 * beat, c4 * 1.5, 0.2, TINE, 2.0)
	_sleigh(win, end - 4 * beat, 0.9, 8)
	x["x_win"] = _wav(win, XRATE)
	var draw := _buf(3.4)
	_phrase(draw, 0.0, [[g4, 1], [c5, 1], [c5, 0.5], [d5, 0.5], [c5, 0.5], [b4, 0.5], [a4, 1], [a4, 2]], 0.2, 0.4, TINE)
	x["x_draw"] = _wav(draw, XRATE)
	var loss := _buf(3.6)
	var fall := [g5, e5, d5, c5]
	for i in 4:
		_partials(loss, i * 0.32, fall[i], 0.3 - i * 0.04, TINE, 1.4)
	_partials(loss, 0.96, c4, 0.17, TINE, 2.5)
	x["x_loss"] = _wav(loss, XRATE)
	x["fireside"] = _fireside(12.0)
	return x


func _note(semis_from_a4: float) -> float:
	return 440.0 * pow(2.0, semis_from_a4 / 12.0)


func _buf(sec: float, rate := XRATE) -> PackedFloat32Array:
	var o := PackedFloat32Array()
	o.resize(int(sec * rate))
	return o


## Additive struck voice: each partial a decaying sine (dur scaled by `stretch`).
func _partials(out: PackedFloat32Array, at: float, freq: float, peak: float, parts: Array, stretch := 1.0) -> void:
	var start := int(at * XRATE)
	for pt in parts:
		var f: float = freq * pt[0]
		if f > XRATE / 2.2:
			continue
		var dur: float = pt[2] * stretch
		var n := mini(int(dur * XRATE), out.size() - start)
		var k := TAU * f / XRATE
		var decay := log(0.0001) / (dur * XRATE)
		var a: float = peak * pt[1]
		for i in n:
			out[start + i] += sin(k * i) * a * exp(decay * i) * minf(1.0, i / 88.0)


## Band-passed noise tick (two-pole resonator).
func _burst(out: PackedFloat32Array, at: float, dur: float, peak: float, freq: float, q: float, rate := XRATE) -> void:
	var start := int(at * rate)
	var n := mini(int(dur * rate), out.size() - start)
	var w := TAU * freq / rate
	var r := 1.0 - w / (2.0 * q)
	var c := 2.0 * r * cos(w)
	var y1 := 0.0
	var y2 := 0.0
	var decay := log(0.0001) / maxf(1.0, dur * rate)
	for i in n:
		var y := randf_range(-1.0, 1.0) * (1.0 - r) + c * y1 - r * r * y2
		y2 = y1
		y1 = y
		out[start + i] += y * peak * 3.0 * exp(decay * i)


func _sleigh(out: PackedFloat32Array, at: float, peak: float, hits: int) -> void:
	var t := at
	for h in hits:
		var p := peak * (1.0 if h == 0 else randf_range(0.55, 0.9))
		for bell in 3:
			_partials(out, t, randf_range(2600.0, 6000.0), p * 0.07, SLEIGH)
		_burst(out, t, 0.035, p * 0.12, 7000.0, 1.2)
		t += 0.022 * randf_range(0.6, 1.4)


func _phrase(out: PackedFloat32Array, at: float, notes: Array, beat: float, peak: float, parts: Array) -> float:
	var t := at
	for nt in notes:
		_partials(out, t, nt[0], peak, parts, maxf(1.0, nt[1] * 0.6))
		t += nt[1] * beat
	return t


## Seamless campfire loop: low roar, soft wind and random crackles/pops.
func _fireside(sec: float) -> AudioStreamWAV:
	var o := _buf(sec, RATE)
	var n := o.size()
	var lp := 0.0
	var lp2 := 0.0
	var a := 1.0 - exp(-TAU * 180.0 / RATE)
	var b := 1.0 - exp(-TAU * 520.0 / RATE)
	# Run the filters one extra pass so the loop seam has settled state.
	for pass_i in 2:
		for i in n:
			var x := randf_range(-1.0, 1.0)
			lp += a * (x - lp)
			lp2 += b * (x - lp2)
			if pass_i == 1:
				var t := float(i) / RATE
				var roar := lp * (0.9 + 0.2 * sin(TAU * t * 2.0 / sec))
				var wind := (lp2 - lp) * 0.18 * (0.6 + 0.4 * sin(TAU * t / sec))
				o[i] = roar * 1.4 + wind
	var t2 := 0.1
	while t2 < sec - 0.1:
		t2 += 0.04 + randf() * randf() * 0.6
		var pop := randf() < 0.08
		if pop:
			_burst(o, t2, randf_range(0.03, 0.06), 0.6, randf_range(900.0, 1800.0), 1.5, RATE)
		else:
			_burst(o, t2, randf_range(0.004, 0.018), randf_range(0.15, 0.4), randf_range(1800.0, 5300.0), 0.9, RATE)
	# Fade the ends into each other so the loop point is silent of clicks.
	var fade := int(0.25 * RATE)
	for i in fade:
		var k := float(i) / fade
		o[i] = o[i] * k + o[n - fade + i] * (1.0 - k)
	o.resize(n - fade)
	var w := _wav(o, RATE)
	w.loop_mode = AudioStreamWAV.LOOP_FORWARD
	w.loop_end = o.size()
	return w
