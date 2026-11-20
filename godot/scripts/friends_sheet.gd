class_name FriendsSheet
extends VBoxContainer
## Friends (src/components/FriendsPopover.tsx): Online / All / Requests tabs,
## add by username, invite a friend who's on the menu, remove / block,
## incoming + sent requests, blocked list, "Invite a friend" share link.

const DOT := {"menu": Color("7bdb95"), "offline": Color(1, 1, 1, 0.25)}

var main
var tab := "online"
var _list: VBoxContainer
var _tabs: HBoxContainer
var _blocked: Array = []


func setup(m) -> void:
	main = m
	add_theme_constant_override("separation", 12)
	_tabs = HBoxContainer.new()
	_tabs.alignment = BoxContainer.ALIGNMENT_CENTER
	_tabs.add_theme_constant_override("separation", 8)
	add_child(_tabs)
	_list = VBoxContainer.new()
	_list.add_theme_constant_override("separation", 8)
	add_child(_list)

	add_child(UI.section(Lang.a("friends.addByUsername")))
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	var edit := UI.input("", Lang.a("friends.usernamePlaceholder"), 16)
	edit.custom_minimum_size = Vector2(0, 68)
	edit.add_theme_font_size_override("font_size", 24)
	row.add_child(edit)
	var send := UI.small_button(Lang.a("friends.send"), false, 22)
	row.add_child(send)
	add_child(row)
	var msg := UI.hint("")
	add_child(msg)
	send.pressed.connect(func():
		if edit.text.strip_edges() == "":
			return
		send.disabled = true
		send.text = (Lang.a("friends.sending")).to_upper()
		var err: String = await Social.send_request(edit.text)
		if not is_inside_tree():
			return
		send.disabled = false
		send.text = (Lang.a("friends.send")).to_upper()
		if err == "":
			edit.text = ""
			msg.text = Lang.a("friends.requestSent")
		else:
			msg.text = Lang.a("friends.tooManyPending") if err == "TOO_MANY_PENDING" else Lang.a("friends.requestFailed"))
	var tell := UI.plain_button(Lang.a("share.labelInvite"), false, 22)
	tell.pressed.connect(main.invite_friend)
	add_child(tell)

	Social.changed.connect(_paint)
	_paint()
	Social.load_friends()
	_load_blocked()


func _load_blocked() -> void:
	_blocked = await Social.blocked()
	if is_inside_tree():
		_paint()


func _paint() -> void:
	if not is_inside_tree() and _list.get_child_count() > 0:
		return
	for c in _tabs.get_children():
		c.queue_free()
	var req := Social.incoming.size()
	for t in [["online", Lang.a("friends.tabOnline") + " (%d)" % Social.online_count()], ["all", Lang.a("friends.tabAll") + " (%d)" % Social.friends.size()], ["requests", Lang.a("friends.tabRequests") + (" · " + Lang.a("friends.newBadge", [req]) if req > 0 else "")]]:
		var b := UI.small_button(t[1], false, 20)
		b.modulate = Color.WHITE if tab == t[0] else Color(1, 1, 1, 0.55)
		var id: String = t[0]
		b.pressed.connect(func():
			tab = id
			_paint())
		_tabs.add_child(b)
	for c in _list.get_children():
		c.queue_free()
	if tab == "requests":
		_requests()
		return
	var rows: Array = Social.friends if tab == "all" else Social.friends.filter(func(f): return Social.status_of(f.uid) != "offline")
	if rows.is_empty():
		_list.add_child(UI.hint(Lang.a("friends.emptyAll") if tab == "all" else Lang.a("friends.emptyOnline")))
	for f in rows:
		_list.add_child(_friend_row(f))
	if tab == "all" and not _blocked.is_empty():
		_list.add_child(UI.section(Lang.a("friends.blockedH")))
		for bl in _blocked:
			var r := _row(bl.name, "")
			var u := UI.small_button(Lang.a("friends.unblock"), false, 20)
			var who: Dictionary = bl
			u.pressed.connect(main.friend_unblock.bind(who))
			r.add_child(u)
			_list.add_child(r)


func _row(name: String, sub: String, dot := Color(0, 0, 0, 0)) -> HBoxContainer:
	var r := HBoxContainer.new()
	r.add_theme_constant_override("separation", 10)
	if dot.a > 0:
		var d := UI.label("●", 22, dot, true, 0)
		r.add_child(d)
	var col := VBoxContainer.new()
	col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	col.add_theme_constant_override("separation", 0)
	var n := UI.label(name, 24, UI.TEXT, true, 2)
	n.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	n.clip_text = true
	n.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	col.add_child(n)
	if sub != "":
		var s := UI.label(sub, 19, UI.TEXT_DIM, false, 2)
		s.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
		s.clip_text = true
		s.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
		col.add_child(s)
	r.add_child(col)
	return r


func _friend_row(f: Dictionary) -> Control:
	var st := Social.status_of(f.uid)
	var r := _row(f.name, Lang.a("friendStatus." + st), DOT.get(st, UI.GOLD))
	var inv := UI.small_button(Lang.a("friends.invite"), false, 20)
	inv.disabled = st != "menu"
	inv.tooltip_text = Lang.a("friends.inviteToGame") if st == "menu" else Lang.a("friends.friendMustBeOnMenu")
	inv.pressed.connect(func(): main.show_invite(f))
	r.add_child(inv)
	var more := UI.small_button("⋯", false, 22)
	more.pressed.connect(main.friend_more.bind(f))
	r.add_child(more)
	return r


func _requests() -> void:
	if Social.incoming.is_empty() and Social.outgoing.is_empty():
		_list.add_child(UI.hint(Lang.a("friends.noPending")))
		return
	if not Social.incoming.is_empty():
		_list.add_child(UI.section(Lang.a("friends.incomingH")))
		for q in Social.incoming:
			var r := _row(q.name, Lang.a("friends.wantsToBeFriends"))
			var acc := UI.small_button(Lang.a("friends.accept"), false, 20)
			var dec := UI.small_button(Lang.a("friends.decline"), true, 20)
			var id: String = q.id
			acc.pressed.connect(func():
				acc.disabled = true
				dec.disabled = true
				await Social.accept(id))
			dec.pressed.connect(func():
				acc.disabled = true
				dec.disabled = true
				await Social.decline(id))
			r.add_child(acc)
			r.add_child(dec)
			_list.add_child(r)
	if not Social.outgoing.is_empty():
		_list.add_child(UI.section(Lang.a("friends.sentH")))
		for q in Social.outgoing:
			var r := _row(q.name, Lang.a("friends.waitingForThem"))
			var c := UI.small_button(Lang.a("friends.cancel"), false, 20)
			var id: String = q.id
			c.pressed.connect(func():
				c.disabled = true
				await Social.decline(id))
			r.add_child(c)
			_list.add_child(r)
