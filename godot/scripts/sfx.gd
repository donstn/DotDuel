extends Node
## Sound: synthesized cues (generated once at start, no sample files) plus the
## game's CC0 recordings for win / loss / forest ambience.

const RATE := 22050
const NOTES := [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98]

var _players: Array[AudioStreamPlayer] = []
var _next := 0
var _cache := {}
var _ambience: AudioStreamPlayer
var muted := false


func _ready() -> void:
	for i in 10:
		var p := AudioStreamPlayer.new()
		add_child(p)
		_players.append(p)
	_ambience = AudioStreamPlayer.new()
	_ambience.volume_db = -16.0
	add_child(_ambience)
	_cache["place1"] = _pluck([659.25], 0.22, 0.55)
	_cache["place2"] = _pluck([783.99], 0.22, 0.55)
	_cache["tick"] = _pluck([1760.0], 0.05, 0.25)
	_cache["pending"] = _pluck([1318.5, 1567.98], 0.5, 0.25)
	_cache["claim"] = _arp([783.99, 1174.66], 0.07, 0.45)
	_cache["whoosh"] = _noise(0.25, 0.25)
	for n in range(1, 10):
		var arp: Array = []
		for i in min(n, 6):
			arp.append(NOTES[min(i + int(n / 3.0), NOTES.size() - 1)])
		_cache["line%d" % n] = _arp(arp, 0.055, 0.5)


func play(cue: String, pitch := 1.0, vol_db := 0.0) -> void:
	if muted or not _cache.has(cue):
		return
	_play_stream(_cache[cue], pitch, vol_db)


func play_file(path: String, vol_db := 0.0) -> void:
	if muted:
		return
	_play_stream(load(path), 1.0, vol_db)


func ambience(on: bool) -> void:
	if on and not muted:
		if not _ambience.playing:
			var s: AudioStreamMP3 = load("res://assets/audio/ambience-birds.mp3")
			s.loop = true
			_ambience.stream = s
			_ambience.play()
	else:
		_ambience.stop()


func _play_stream(stream: AudioStream, pitch: float, vol_db: float) -> void:
	var p := _players[_next]
	_next = (_next + 1) % _players.size()
	p.stream = stream
	p.pitch_scale = pitch
	p.volume_db = vol_db
	p.play()


func _wav(samples: PackedFloat32Array) -> AudioStreamWAV:
	var data := PackedByteArray()
	data.resize(samples.size() * 2)
	for i in samples.size():
		data.encode_s16(i * 2, int(clampf(samples[i], -1.0, 1.0) * 32000.0))
	var w := AudioStreamWAV.new()
	w.format = AudioStreamWAV.FORMAT_16_BITS
	w.mix_rate = RATE
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
