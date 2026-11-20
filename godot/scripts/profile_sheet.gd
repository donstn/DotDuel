class_name ProfileSheet
extends VBoxContainer
## Your profile (src/components/ProfilePopover.tsx): account + rename, rating
## and the last 5 ranked matches, daily streak, this device's offline history,
## GDPR download / delete, sign out.

const PLACEMENT_TOTAL := 10

var main


func setup(m) -> void:
	main = m
	add_theme_constant_override("separation", 10)
	add_child(UI.hint(Lang.a("profile.tagline")))
	var p: Dictionary = Online.profile
	var name := Online.display_name()

	add_child(UI.section(Lang.a("profile.accountH")))
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	var nm := UI.label("%s: %s" % [Lang.a("profile.gameName"), name], 24, UI.TEXT, false, 2)
	nm.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	nm.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	nm.clip_text = true
	nm.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	row.add_child(nm)
	var rename := UI.plain_button(Lang.a("profile.rename"), false, 21)
	rename.autowrap_mode = TextServer.AUTOWRAP_OFF
	rename.pressed.connect(func():
		main.close_overlay()
		main.online_ui.rename())
	row.add_child(rename)
	add_child(row)
	if str(p.get("email", "")) != "":
		add_child(_kv(Lang.a("profile.email"), str(p.email)))
	var prov := str(p.get("auth_provider", ""))
	add_child(_kv(Lang.a("profile.signInMethod"), Lang.a("profile.providerGoogle") if prov == "google" else (Lang.a("profile.providerEmail") if prov == "email" else Lang.a("profile.providerUnknown"))))

	add_child(UI.section(Lang.a("profile.multiplayerH")))
	var placed := int(p.get("placement_games_played", 0)) if p.get("placement_games_played") != null else 0
	var rt := str(Online.rating())
	if placed < PLACEMENT_TOTAL:
		rt += "  · " + Lang.a("profile.provisional", [placed, PLACEMENT_TOTAL])
	add_child(_kv(Lang.a("profile.rating"), rt))
	var matches := VBoxContainer.new()
	add_child(matches)
	_load_matches(matches)

	add_child(UI.section(Lang.a("profile.streakH")))
	var cur := int(p.get("streak_current", 0)) if p.get("streak_current") != null else 0
	if cur <= 0:
		add_child(UI.hint(Lang.a("profile.streakEmpty")))
	else:
		add_child(_kv(Lang.a("profile.currentStreak"), "🔥 " + Lang.a("profile.dayN", [cur])))
		add_child(_kv(Lang.a("profile.longest"), Lang.a("profile.dayN", [int(p.get("streak_longest", cur))])))
		add_child(UI.hint(Lang.a("profile.streakHint")))

	_offline(name)

	add_child(UI.section(Lang.a("profile.dataH")))
	add_child(UI.hint(Lang.a("profile.dataHint")))
	var dl := UI.plain_button(Lang.a("profile.downloadData"), false, 22)
	dl.pressed.connect(func():
		dl.disabled = true
		dl.text = Lang.a("profile.preparing")
		var ok: bool = await _download()
		dl.disabled = false
		dl.text = Lang.a("profile.downloadData")
		if not ok:
			main.toast(Lang.a("profile.exportFailed")))
	add_child(dl)
	var del := UI.plain_button(Lang.a("profile.deleteAccount"), true, 22)
	del.pressed.connect(_confirm_delete)
	add_child(del)
	var out := UI.plain_button(Lang.a("profile.signOut"), false, 22)
	out.pressed.connect(func():
		main.close_overlay()
		main.sign_out())
	add_child(out)


func _kv(k: String, v: String) -> Control:
	var row := HBoxContainer.new()
	var a := UI.label(k, 22, UI.TEXT_DIM, false, 2)
	a.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	a.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(a)
	var b := UI.label(v, 22, UI.TEXT, true, 2)
	b.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	b.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	b.custom_minimum_size = Vector2(260, 0)
	row.add_child(b)
	return row


func _load_matches(box: VBoxContainer) -> void:
	var me := Online.me()
	var res: Dictionary = await Supa.http(HTTPClient.METHOD_GET, "/rest/v1/matches?select=*&player_uids=cs.%7B" + me + "%7D&order=finished_at.desc&limit=5")
	if not is_inside_tree():
		return
	var rows: Array = res.data if res.ok and res.data is Array else []
	box.add_child(UI.hint(Lang.a("profile.lastMatches", [mini(rows.size(), 5)])))
	if rows.is_empty():
		box.add_child(UI.hint(Lang.a("profile.noMatches")))
		return
	for m in rows:
		var p1 := str(m.get("p1_uid", "")) == me
		var w = m.get("winner")
		var ws := str(w)
		var result := "d" if ws == "draw" or w == null else ("w" if (p1 and ws == "1") or (not p1 and ws == "2") else "l")
		var opp := str(m.get("p2_display" if p1 else "p1_display", ""))
		var mine := int(m.get("p1_score_final" if p1 else "p2_score_final", 0))
		var theirs := int(m.get("p2_score_final" if p1 else "p1_score_final", 0))
		var delta := int(m.get("p1_rating_delta" if p1 else "p2_rating_delta", 0)) if m.get("p1_rating_delta" if p1 else "p2_rating_delta") != null else 0
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 12)
		var col: Color = {"w": UI.ACCENT, "l": Color("ff8a7a"), "d": UI.TEXT_DIM}[result]
		row.add_child(UI.label(Lang.a("common." + result), 22, col, true, 2))
		var o := UI.label(opp, 22, UI.TEXT, false, 2)
		o.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
		o.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		o.clip_text = true
		o.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
		row.add_child(o)
		row.add_child(UI.label("%d–%d" % [mine, theirs], 22, UI.TEXT, true, 2))
		row.add_child(UI.label(("+" if delta > 0 else "") + str(delta), 22, col, true, 2))
		box.add_child(row)


func _offline(name: String) -> void:
	add_child(UI.section(Lang.a("profile.offlineHistoryH", [name])))
	var r := Store.row(name)
	var ai := Store.total(r.vsAI.byShape)
	var hs := Store.total(r.hotseat.byShape)
	var games: int = ai.wins + ai.draws + ai.losses + hs.wins + hs.draws + hs.losses
	if games == 0:
		add_child(UI.hint(Lang.a("profile.offlineEmpty")))
		return
	add_child(_kv(Lang.a("profile.totalGames"), str(games)))
	add_child(_kv(Lang.a("profile.vsBotsWDL"), "%d / %d / %d" % [ai.wins, ai.draws, ai.losses]))
	add_child(_kv(Lang.a("profile.hotseatWDL"), "%d / %d / %d" % [hs.wins, hs.draws, hs.losses]))
	var scored := int(r.vsAI.pointsScored) + int(r.hotseat.pointsScored)
	var given := int(r.vsAI.pointsGiven) + int(r.hotseat.pointsGiven)
	add_child(_kv(Lang.a("profile.pointsScored"), "%d  (%s)" % [scored, Lang.a("profile.avg", [snappedf(float(scored) / games, 0.1)])]))
	add_child(_kv(Lang.a("profile.pointsGiven"), "%d  (%s)" % [given, Lang.a("profile.avg", [snappedf(float(given) / games, 0.1)])]))
	add_child(UI.hint(Lang.a("profile.offlineHint")))


## GDPR Art. 20 (src/cloud/account.ts exportMyData): profile, leaderboard row,
## matches, this device's dotduel:* storage — as a JSON download.
func _download() -> bool:
	var me := Online.me()
	var prof: Dictionary = await Supa.http(HTTPClient.METHOD_GET, "/rest/v1/profiles?select=*&id=eq." + me)
	var lb: Dictionary = await Supa.http(HTTPClient.METHOD_GET, "/rest/v1/leaderboard?select=*&uid=eq." + me)
	var mt: Dictionary = await Supa.http(HTTPClient.METHOD_GET, "/rest/v1/matches?select=*&or=(p1_uid.eq.%s,p2_uid.eq.%s)&order=finished_at.desc&limit=500" % [me, me])
	if not (prof.ok and lb.ok and mt.ok):
		return false
	var local := {}
	for k in [Store.PROGRESS, Store.SETTINGS, Store.STATS, Store.ACTIVE]:
		var v = Store.read(k)
		local[k] = JSON.stringify(v) if v != null else null
	var payload := {
		"exportedAt": Time.get_datetime_string_from_system(true) + "Z",
		"profile": prof.data[0] if prof.data is Array and not prof.data.is_empty() else null,
		"leaderboardEntry": lb.data[0] if lb.data is Array and not lb.data.is_empty() else null,
		"matches": mt.data if mt.data is Array else [],
		"localStorage": local,
	}
	var text := JSON.stringify(payload, "  ")
	var file := "dotduel-export-%s.json" % Time.get_date_string_from_system(true)
	if OS.has_feature("web"):
		JavaScriptBridge.download_buffer(text.to_utf8_buffer(), file, "application/json")
	else:
		var path := OS.get_user_data_dir().path_join(file)
		var f := FileAccess.open(path, FileAccess.WRITE)
		if f == null:
			return false
		f.store_string(text)
		main.toast(path)
	return true


## GDPR Art. 17: `account-delete` Edge Function, then sign out.
func _confirm_delete() -> void:
	main.confirm("%s\n\n%s" % [Lang.a("profile.deleteConfirmTitle"), Lang.a("profile.deleteConfirmBody")], func():
		main.toast(Lang.a("profile.deleting"))
		var res: Dictionary = await Supa.invoke("account-delete", {})
		if res.ok and res.data is Dictionary and res.data.get("ok") == true:
			await main.sign_out()
		else:
			main.toast(Lang.a("profile.deleteFailed")), main.show_profile, Lang.a("profile.deleteForever"), Lang.a("profile.cancel"))
