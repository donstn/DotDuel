// Analytics for the Godot page (the main game at /): a port of the React
// app's src/telemetry.ts and src/consent.ts, so both versions report the same
// GA4 events and share the same localStorage keys. Loaded after /consent-default.js (gtag shim with
// Consent Mode defaults = denied). GA4 itself loads only after the player
// accepts analytics in Privacy, exactly as before.
(function () {
	'use strict';
	var MEASUREMENT_ID = 'G-9H8DXGC34Z';
	var CONSENT_KEY = 'dotduel:consent:v1';
	var FIRST_LOAD_KEY = 'dotduel:firstLoad:v1';
	var LAST_SESSION_KEY = 'dotduel:lastSession:v1';
	var LIFETIME_GAMES_KEY = 'dotduel:lifetimeGames:v1';
	var RETURNING_MS = 12 * 60 * 60 * 1000;
	var SESSION_EVENT_CAP = 30;
	var h = location.hostname;
	var DEV = h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0' || /\.local$/.test(h);

	function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
	function set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }

	// --- session snapshot (first visit vs returning) -------------------------
	var firstVisit = !get(FIRST_LOAD_KEY);
	var sinceLast = 0;
	var last = parseInt(get(LAST_SESSION_KEY) || '', 10);
	if (last > 0) sinceLast = Date.now() - last;
	set(LAST_SESSION_KEY, String(Date.now()));
	if (firstVisit) set(FIRST_LOAD_KEY, String(Date.now()));

	var enabled = false;
	var bootFired = false;
	var sent = 0;

	function platform() {
		try {
			var standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
			return standalone ? 'web-installed' : 'web';
		} catch (e) { return 'web'; }
	}

	// PII firewall: never send uid / email / names as event params.
	var PII = /^(uid|email|user_?id|user_?name|display_?name|player_?name|opponent_?name)$/i;
	function isPii(k) {
		if (PII.test(k)) return true;
		var l = k.toLowerCase();
		if (/_email$/.test(l)) return true;
		if (/_uid$/.test(l) && !/_hash$/.test(l)) return true;
		if (/_name$/.test(l) && !/_name_hash$/.test(l)) return true;
		return false;
	}

	function track(name, params, priority) {
		if (priority === 'low' && sent >= SESSION_EVENT_CAP) return;
		var clean = {};
		if (params) {
			for (var k in params) {
				if (!Object.prototype.hasOwnProperty.call(params, k) || isPii(k)) continue;
				var v = params[k];
				if (typeof v === 'boolean') v = v ? 'true' : 'false';
				clean[k] = typeof v === 'string' ? v.slice(0, 100) : v;
			}
		}
		if (DEV) {
			console.log('[GA4] ' + name, clean);
			sent++;
			return;
		}
		if (!enabled || typeof window.gtag !== 'function') return;
		try { window.gtag('event', name, clean); sent++; } catch (e) { console.warn('track failed', e); }
	}

	function fireBoot() {
		if (bootFired) return;
		bootFired = true;
		if (firstVisit) { track('first_visit'); return; }
		if (sinceLast >= RETURNING_MS) track('session_start_returning', { hours_since_last: Math.round(sinceLast / 3600000) });
	}

	function enable() {
		if (enabled) return;
		if (DEV) { enabled = true; fireBoot(); return; }
		if (typeof window.gtag !== 'function') return;
		var s = document.createElement('script');
		s.async = true;
		s.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
		document.head.appendChild(s);
		window.gtag('js', new Date());
		window.gtag('set', 'user_properties', { app_platform: platform() });
		window.gtag('config', MEASUREMENT_ID, { send_page_view: true });
		enabled = true;
		fireBoot();
	}

	// SHA-256 first 8 hex chars: telemetry-safe referrer id.
	function hash8(input) {
		try {
			return crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)).then(function (buf) {
				return Array.prototype.map.call(new Uint8Array(buf, 0, 4), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
			}, function () { return 'nohash'; });
		} catch (e) { return Promise.resolve('nohash'); }
	}

	// --- consent (Privacy sheet: Accept / Decline analytics) -----------------
	function consent() {
		var v = get(CONSENT_KEY);
		return v === 'accepted' || v === 'declined' ? v : '';
	}
	function setConsent(v) {
		var was = consent();
		set(CONSENT_KEY, v);
		if (v === 'accepted') enable();
		// The GA4 tag can't be unloaded: reload so it stops.
		else if (was === 'accepted') setTimeout(function () { location.reload(); }, 60);
	}
	if (consent() === 'accepted') enable();

	// --- bridge for the game (scripts/net/track.gd) ---------------------------
	window.ddTrack = function (name, json, priority) {
		var p = null;
		try { p = json ? JSON.parse(json) : null; } catch (e) { p = null; }
		track(name, p, priority);
	};
	// Event with one param replaced by its SHA-256 prefix (referral codes, uids).
	window.ddTrackHashed = function (name, json, key, raw) {
		var p = {};
		try { p = json ? JSON.parse(json) : {}; } catch (e) { p = {}; }
		hash8(raw).then(function (x) { p[key] = x; track(name, p); });
	};
	window.ddConsent = function (v) { if (v === 'accepted' || v === 'declined') setConsent(v); };
	window.ddConsentGet = consent;
	window.ddGameIndex = function () {
		var cur = parseInt(get(LIFETIME_GAMES_KEY) || '0', 10);
		var next = (isNaN(cur) ? 0 : cur) + 1;
		set(LIFETIME_GAMES_KEY, String(next));
		return next > 10 ? 99 : next;
	};
}());
