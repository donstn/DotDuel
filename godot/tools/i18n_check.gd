extends SceneTree
## Headless check: godot --headless --path godot -s res://tools/i18n_check.gd
## Every language has every English key, plural entries have 3 forms, and the
## format placeholders match English (a wrong %d/%s crashes at runtime).

func _init() -> void:
	var fails := 0
	var en: Dictionary = I18nStrings.STRINGS.en
	for code in I18nStrings.STRINGS:
		var d: Dictionary = I18nStrings.STRINGS[code]
		for k in en:
			if not d.has(k):
				print("MISSING %s.%s" % [code, k])
				fails += 1
				continue
			var a = en[k]
			var b = d[k]
			if (a is Array) != (b is Array) or (b is Array and b.size() != 3):
				print("PLURAL SHAPE %s.%s" % [code, k])
				fails += 1
				continue
			var forms: Array = b if b is Array else [b]
			for f in forms:
				if _specs(str(f)) != _specs(str(a[0] if a is Array else a)):
					print("PLACEHOLDERS %s.%s: %s" % [code, k, f])
					fails += 1
		for k in d:
			if not en.has(k):
				print("EXTRA %s.%s" % [code, k])
				fails += 1
	for code in I18nShared.STRINGS:
		if not I18nShared.PRIVACY.has(code):
			print("NO PRIVACY ", code)
			fails += 1
	print("I18N: ", "OK" if fails == 0 else "FAIL %d" % fails)
	quit()


func _specs(s: String) -> Array:
	var out := []
	var i := 0
	while i < s.length() - 1:
		if s[i] == "%":
			out.append(s[i + 1])
			i += 2
		else:
			i += 1
	return out
