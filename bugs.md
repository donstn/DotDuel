# DotDuel — Known bugs (fixed + accepted)

A running diagnostic log of bugs we've investigated, the **root cause** we found, the **fix** we applied, and **forward-looking notes** so future-us can revisit if the symptom recurs.

Entries are dated and grouped by symptom domain. Most recent first within each section.

> **Why this file exists**: CHANGELOG.md describes what users see; this file describes what was actually wrong and why the fix works. If a similar symptom appears later, start here.

---

## 🎨 Rendering / GPU

### Endgame flicker → black screen on Square / Rectangle (Alpha 0.2.7.2 — 2026-05-31)

**Symptom**
- Flicker began around 5–6 claims remaining (claim-only endgame, board mostly full).
- Sometimes escalated to a fully black board until refresh.
- Reproduced on 8 GB discrete GPU on PC, not just mobile — so it wasn't pure memory exhaustion, it was compositor layer churn.

**False lead (do not repeat)**
- Initially assumed `.dot-hint-ring` (the yellow pending-claim suggestion ring) was the culprit. Shipped 0.2.7.1 gating those rings to Triangle only — flicker persisted. The hint rings are static stroked circles with no animation, blend mode, or filter; they were never the issue. The 0.2.7.1 gate is still in place as a UX choice (rings only on Triangle for learning), not a bug fix.

**Actual root cause**
- `.crossline-inner` used `mix-blend-mode: screen` for an additive "ribbon highlight" on top of the base stroke (`src/styles.css:1730`, pre-fix).
- Every blended element forces the browser to create its own GPU compositor layer.
- By the claim-only endgame, the SVG contained 20–46 completed lines = 20–46 compositor layers, **plus** the SVG `feGaussianBlur` filter on every colored dot (36–63 filtered render passes).
- React re-renders the whole `<svg>` on every claim — every layer + filter pass re-evaluates from scratch. The combination overflows the compositor budget, the browser drops layers (flicker) or the driver bails out entirely (black screen).

**Fix**
- Removed `mix-blend-mode: screen` from `.crossline-inner`.
- Bumped opacity 0.92 → 1.0 to keep the highlight readable.
- The `--strike-*-inner` colour tokens are already bright enough (P1 `#b8f5d3`, P2 `#ffffff`) that the highlight reads clearly via plain compositing — slightly less "lift" than additive blending, no crash.

**Forward-looking notes if it returns**
1. **Next escalation:** the SVG `dot-shadow` filter on every colored dot (`Board.tsx:262`, `filter={owner ? 'url(#dot-shadow)' : undefined}`). `feGaussianBlur` forces an offscreen render target per dot. Strip it entirely (the radial gradient already looks 3D-ish) or apply only to `isLast` (one filtered element per turn). Saves 36–63 filter passes.
2. **Re-render avoidance:** React reconciles the whole `<svg>` on every state change. Memoizing the `state.completed.map(...)` block (each completed line is immutable once placed) would let React skip re-evaluating the bulk of the SVG. Implementation: wrap `<g className="crossline-group">` in `React.memo` keyed by `c.lineId`. The user suggested this approach explicitly.
3. **Avoid these CSS anti-patterns at scale** in DotDuel:
   - `mix-blend-mode: *` on N-many sibling SVG elements (any N over ~10 is risky on mobile)
   - SVG `filter="url(...)"` referencing `feGaussianBlur` on N-many sibling elements
   - Stacking `backdrop-filter` over filtered SVG
4. **General principle:** count compositor layers before adding blend modes / filters. A board can have dozens of small SVG elements; treat each blend/filter as a layer.

---

### Top-row +N score popup clipped by viewBox (Alpha 0.2.2.0 — 2026-05-31)

**Symptom**
- When a dot in the very top row of the board completed a line, the floating `+N` popup was almost invisible — clipped by the SVG's viewBox boundary (default `overflow: hidden` on SVG replaced elements).

**Root cause**
- Popup positioned at `y = dot.y - dotRadius * 1.1` with text extending upward from the baseline. For top-row dots, this overshoots `vb.y` and the SVG clips it.

**Fix**
- `Board.tsx`: compute `aboveRoom = anchor.y - vb.y` and flip popup BELOW the dot when `aboveRoom < dotRadius + fontSize`. Mirror the rise animation so it always animates *away* from the dot (`scoreFloatUp` vs `scoreFloatDown` keyframes).
- Same flip logic applies to the speech-bubble hints (`Board.tsx` `placeAbove` calculation in the hint-bubble render).

**Forward-looking notes**
- Any new SVG overlay anchored to a dot must implement the same flip — assume the SVG clips at its viewBox edge.
- The viewBox has 0.6 units of padding per shape (`geometry.ts:60`); calculate clearance against that.

---

## ⚙️ Layout / responsive

### Mobile player cards not actually mirrored — avatar/name/score land in different slots per card (Alpha 0.4.12.3 — 2026-08-01)

**Symptom**
- On phones, the two player cards could look wildly different from each other: one card's avatar+name on line 1 and score dropped to line 2, while the OTHER card showed its score+name on line 1 and its (much smaller-looking) avatar on line 2 — nothing lined up between the two cards. Screenshot from production: P1 "Doncikaz" card had a big avatar top-left + score bottom-right; the bot's card had its score top-left + a tiny avatar bottom-right. Reported the same day as (and looks related to) the digit-boundary board-shift bug above.

**Root cause**
- The mobile card was `display:flex; flex-wrap: wrap` with a *reversed visual `order`* on `.side-panel-right` to fake a left-right mirror (avatar outer edge, score inner edge, on both cards — see the now-deleted comment in `styles.css`). Flex-wrap doesn't guarantee where content breaks to a second line — it depends on each card's own content width (name length, badge presence). Once one card's content overflowed and wrapped, its second line took on whatever was next in that card's *own* `order`, which was the *opposite* item from the other card's second line (avatar vs. score), because the two cards use reversed `order` values. Two independently-wrapping flex rows with mirrored `order` will only ever look mirrored when NEITHER wraps — the moment either one does, they diverge completely.
- This is architecturally the same root cause as "Board shifts/shrinks..." below: a `flex-wrap` row whose overflow behavior is a side-effect of content length, not a designed state.

**Fix**
- Replaced the flex-wrap row with a `display: grid` layout: `grid-template-columns: auto minmax(0,1fr) auto; grid-template-rows: auto auto;`. Avatar is always `grid-column:1 / grid-row:1`, name always `grid-column:2 / grid-row:1`, rating always `grid-column:2 / grid-row:2`, score always `grid-column:3`, spanning both rows (vertically centered). This is the exact same CSS for `.side-panel-left` AND `.side-panel-right` — the entire `order`-reversal block for `.side-panel-right` was deleted. No more wrapping is possible: grid columns don't reflow on overflow the way flex-wrap does, so overflow in the name column just triggers its own `text-overflow: ellipsis` (already in place) instead of restructuring the whole card.
- Also shrank the score's mobile font-size to `clamp(1.3rem, 6vw, 1.7rem)` (was a fixed 1.8rem) and trimmed card gap/padding slightly — the fixed-slot grid reserves `min-width: 3ch` for the score column same as before, which combined with the old font-size left too little room for the name column and caused overly aggressive truncation.

**Forward-looking notes**
- **General principle, same lesson twice in one day**: `flex-wrap: wrap` inside a fixed-width container is fine ONLY if you can guarantee it never actually wraps (reserve worst-case width for every child) — the instant it might wrap, treat that as a real second layout state that needs its own explicit design, or better, avoid wrap-based layouts entirely in favor of CSS Grid with named/fixed template areas, which don't have an "overflow reflows arbitrarily" failure mode.
- If a future request asks for the two cards to be a true left-right MIRROR (avatar on the outer edge of each card, near the screen edge, score on the inner edge near the board) rather than identical twins, that's a deliberate design choice to make explicitly (e.g., via `.side-panel-right { direction: rtl }` + `direction: ltr` on children, which mirrors visually without needing per-child order overrides) — don't reintroduce it via `order` reversal on a wrap-capable container.

---

### Board shifts/shrinks on phones when a score crosses a digit boundary (Alpha 0.4.12.1 — 2026-08-01)

**Symptom**
- On phones (≤720px, the stacked-card layout), the board visibly jumped down and got shorter partway through a game — reported from production via screen recording. User pinpointed it to score digit-count changes: 1→2 digits, then 2→3 digits.

**Root cause**
- The mobile player card is a `flex-wrap: wrap` row (avatar · name · rating · score). `.player-score` had `min-width: 0` — its box width was purely driven by digit count.
- When a score crossed a digit boundary (verified by scripting a full Rectangle game: 99 → 106), the score text widened enough that the row no longer fit on one line and wrapped, growing that card's height from 54px to 87px.
- `.game-body` is a CSS Grid (`grid-template-rows: auto 1fr`, `align-items: stretch`) with both cards in the `auto` row. The row auto-sizes to the *tallest* card, and `align-items: stretch` forces the **other** card to match — even though only one side's score changed. The board sits in the sibling `1fr` row, so it got squeezed and pushed down to make room.
- Confirmed via a scripted Playwright run at 375×667: `board-wrap`'s `top`/`height` was byte-identical across dozens of score changes until the exact frame a digit boundary was crossed, then it jumped and never fully reverted in normal play (scores only increase).

**Fix**
- `.player-score` (mobile block, `src/styles.css`): `min-width: 3ch` (DotDuel's max shape total is 252, so 3 digits covers every real score) + `font-variant-numeric: tabular-nums`. Reserves the score's width up front so digit-count changes never alter row width, which removes the wrap trigger entirely.
- Re-ran the same scripted game after the fix (fill all 63 Rectangle dots + claim all pending lines, scores reaching 127/125): `board-wrap` rect never changed once.

**Forward-looking notes**
- Any element inside a `flex-wrap` row that sits in a CSS Grid `auto`-height row with `align-items: stretch` can silently resize *sibling* grid cells the moment its content width changes — even content in a cell that itself didn't grow. Audit for this pattern before adding new dynamic-width content (badges, counters, live text) to the mobile card row.
- General principle for "nothing may reflow" surfaces: reserve width/height for the *maximum* value a dynamic number can take (`ch` units + `tabular-nums`), don't rely on `min-width: 0` + wrap to "just work."

---

### Eye-toggle button invisible on iPhone-SE topbar (Alpha 0.2.3.0 — 2026-05-31)

**Symptom**
- The "See unclaimed lines" eye-toggle in the in-game topbar didn't render in vs-AI L1–L4 despite the prop being passed correctly.

**Root cause**
- `.game-topbar` used `grid-template-columns: 40px 1fr 40px`. The cluster I added (eye 28 + gap 4 + `?` 28 = 60px) overflowed the fixed 40px right cell and got clipped.

**Fix**
- Changed right column to `minmax(40px, auto)` (and `minmax(34px, auto)` in landscape). Single-button topbars still sit at the 40px floor; multi-icon clusters grow naturally.

**Forward-looking notes**
- Any new topbar content must either fit in 40px OR be added via the `topbar-side-cluster` flex pattern.
- Phase 1b later replaced the cluster with a labeled toggle pill inside `.topbar-center` (user feedback: "the icon was unreadable") — but the `minmax` fix on the grid is retained for any future right-side additions.

---

### Menu cards left-aligned when wrapped (Alpha 0.2.6.0 — 2026-05-31)

**Symptom**
- After adding the "Today's puzzle" card (4th mode card), a 4-card row on a narrow desktop window would wrap to 3+1 and the lone card on the second row stuck to the left edge.

**Root cause**
- `.menu-grid` used CSS Grid with `grid-template-columns: repeat(auto-fit, minmax(140px, 1fr))`. Grid columns are equal-width — the wrapped card filled one column-width column from the left, with no way to centre it.

**Fix**
- Switched `.menu-grid` to flexbox: `display: flex; flex-wrap: wrap; justify-content: center; gap: 12px;`.
- Capped each `.menu-card` at `max-width: 220px` so the lone wrapped card doesn't stretch to full row width — instead the empty space is split via `justify-content: center`.

**Forward-looking notes**
- Don't reach for CSS Grid for layouts where wrap-centering matters. Flex + max-width on children is the right tool.

---

## 🧠 UX timing

### Ghost +N popup on fresh game after a finished one (2026-06-01)

**Symptom**
- Finish a game → start a new one (Play again or Menu → new mode) → the previous game's final `+N` scoring popup briefly drifts up over the empty board. Scores in the SidePanel are correctly 0; only the floating popup is stale.

**Root cause**
- The Board component renders floating `+N` popups in a `useEffect([scoreEvent])` that mounts a float to local state when `scoreEvent` changes. `scoreEvent` is App-level React state.
- `startGame` (and `backToMenu`) only reset `state`, `config`, and a handful of refs — they did **not** clear `scoreEvent`, `activeHint`, `pendingFlash`, or `prevPendingLenRef`.
- React unmounts the old Board and mounts a new one when the screen state changes. The new Board's `useEffect` runs with the still-set `scoreEvent`, sees it as a "new" event from its perspective, and re-creates the float.
- The score number in the SidePanel was unaffected because it reads `state.scores[player]` directly (and `state` IS reset on new-game).

**Fix**
- In `startGame` and `backToMenu` (`src/App.tsx`), clear all transient visual state explicitly:
  ```ts
  setScoreEvent(null);
  setActiveHint(null);
  setPendingFlash(false);
  prevPendingLenRef.current = 0;
  ```
- Added an explanatory comment in `startGame` so the cleanup block doesn't get pruned later.

**Forward-looking notes**
- **General pattern to watch:** any App-level state that drives a `useEffect` inside a child component is at risk of "stale event on next mount". If you add a new transient prop to Board (or any child that mounts/unmounts on screen transitions), reset it in `startGame` AND `backToMenu`.
- **Affected transient state to track on future cleanup audits:** `scoreEvent`, `activeHint`, `pendingFlash`, `dailyPuzzleResult`, plus the `prevPendingLenRef` diff baseline.
- **If a similar ghost UI ever appears:** grep for `useEffect(() => { ... }, [propName])` in the relevant child component and check whether `propName` survives screen transitions in the parent.

**Recurrence — multiplayer (monetization branch, 2026-06-06)**
- The 2026-06-01 fix only patched `startGame` + `backToMenu`, i.e. the **vs-AI/hot-seat/daily** paths. **Multiplayer never entered through those** — it enters via `onStartPlaying` → `mpgame` and swaps `onlineGameId` on rematch — so a stale `+N` ghosted onto a fresh MP board (surfaced while rapidly starting/aborting MP games during first-move-abort testing).
- **Fix:** a single `useEffect(() => { clear transient state }, [onlineGameId])` in `App.tsx` so EVERY new MP game instance (new match, rematch, post-abort) clears `scoreEvent`/`activeHint`/`pendingFlash`/`prevPendingLenRef` — more robust than patching each handler.
- **Lesson:** when fixing "stale transient state on new game," cover **all** game-entry paths, not just the one that reproduced. Keying the reset on the game-instance id is bulletproof vs. per-handler resets.

---

### Hint stomping during AI turns (KNOWN, not fixed — diagnosed 2026-05-31)

**Status:** **accepted-known**. Diagnosis done; user opted to defer the fix.

**Symptom**
- Vs-AI: hint A appears → AI takes its 450 ms turn → hint trigger B fires → `setActiveHint(B)` overwrites A before the player could read it.
- Worst with the biggest-only caption (~180 chars) being stomped by the pending-claim caption when the AI doesn't claim.

**Root cause**
- `tryFireHint` (in `App.tsx`) always replaces `activeHint`; there's no min-display-time gate or queue. The AI scheduler fires `applyMove` 450 ms after the human's move, and the resulting state change re-triggers hint useEffects.

**Recommended fix (when prioritised)**
- **Option 1 from the QA review** (min-display-time gate): track `activeHintShownAt` (ref). `tryFireHint` early-returns if a hint is on screen and < 2500 ms since it was shown. The "lost" hint keeps its flag unclaimed so it re-qualifies on the next turn. ~15 LOC in `App.tsx`. No AI changes.

**Alternative fixes considered**
- Pause AI scheduler while hint active (~25 LOC; affects vs-AI cadence)
- FIFO hint queue (~50 LOC; future-proof for 3+ stacked triggers)

---

## ⌨️ Input / focus

### Stray focus ring ("egg") on mouse-claim (Alpha 0.2.8.0 — 2026-06-05)

**Symptom**
- A round accent outline (the "egg") appeared around a dot on a plain mouse click — no keyboard involved. Reproduced specifically in the Square endgame (~43–44 points left), the claim-heavy phase; not on early-game dot placement.

**Root cause**
- The accessibility branch added `:focus-visible` rings and made every dot a focusable `role="button"` circle.
- Empty dots carry a transparent hit-area circle layered on top (`Board.tsx`, rendered only for `!cd`) which is **not** focusable — so placing a dot never focuses anything, no ring.
- Claimable colored dots have **no** such overlay, so a mouse click to *claim* lands directly on the focusable visible `<circle>` and focuses it. The browser then paints the `:focus-visible` ring. Only the claim path clicks a focusable dot directly, which is why it correlated with "late-game square" (most pending lines, claim-heavy).

**Fix**
- `onMouseDown={(e) => e.preventDefault()}` on the dot circle (`Board.tsx`). `preventDefault` on mousedown blocks the focus without canceling the `click`, so claiming still fires and keyboard focus (Tab / arrow-key roving nav) is unaffected — those focus programmatically, not via mousedown.

**Forward-looking notes**
- Any focusable SVG element that is *directly* clickable (no non-focusable hit-layer on top) will flash a `:focus-visible` ring on mouse click. Either layer a non-focusable hit target over it, or `preventDefault` on its mousedown.
- The ring CSS itself is correct and intended (WCAG 2.4.7 keyboard focus). The bug was unintended focus-on-pointer, not the ring.

---

## ☁️ Backend / sync

### Retention sweep could permanently delete a finished game before Elo finalization (found by Codex adversarial review, 2026-08-02)

**Symptom**
- Not yet observed in the wild — caught by an adversarial code review of `supabase/migrations/20260727000000_retention_sweep.sql` before/shortly after it shipped, not a user report.

**Root cause**
- `retention_sweep()` purged `public.games` rows by age alone: `status = 'finished' and finished_at < now() - interval '24 hours'`, on the assumption that `finalize_game()` had already copied the permanent record into `public.matches` (same `id` as the game).
- `finalize_game` runs as a **separate follow-up RPC call** from `submit-move` (`supabase/functions/submit-move/index.ts`), after the `games` row is already written with `status='finished'`. A transient failure in that RPC (network blip, engine exception) leaves the game finished with **no `matches` row at all** — and since `finalize_game`'s insert is one statement, a failure partway through leaves nothing, not a partial row.
- The sweep had no check for this: it would delete the finished game 24h later regardless, destroying the only copy of the game (board/clock/score state) with no way to retry finalization or reconstruct the result.

**Fix**
- Purge query now joins `public.matches` and requires `m.elo_finalized = true` before a game is eligible for deletion.
- Finished-but-unfinalized games are never deleted. Instead, `retention_sweep()` retries `finalize_game(id)` for each of them every run (any age, so it self-heals within the hour), one at a time in a `begin/exception when others` block so one permanently-broken game can't raise an exception and abort the rest of the sweep (including the unrelated 24-month match-history purge).
- Logs a `raise warning` with the count whenever a game has been stuck unfinalized for >24h, so a persistently-failing case is visible (e.g. via Supabase log alerts) instead of silently accumulating forever.

**Forward-looking notes**
- General pattern: any retention/purge job that assumes "a permanent copy already exists elsewhere" must verify that copy actually committed (a join + status flag), never infer it from age/status on the source row alone — the write that creates the copy can fail independently of the write that marks the source "done".
- If `finalize_game`'s signature or the `matches.elo_finalized` column ever changes, update both the purge join and the retry loop here.

---

### `acceptInvite` 500 error (Alpha 0.2.0.0 polish, commit ff9dda7)

**Symptom**
- Accepting a friend's game invite occasionally failed with a 500 from the Cloud Function.

**Root cause**
- Firestore transaction violated the read-after-write rule (a `tx.get` happened after a `tx.set` for the same doc reference).

**Fix**
- Reordered the transaction to do all reads before any writes.

**Forward-looking notes**
- Any callable Cloud Function using `runTransaction` must batch reads at the top of the lambda. If you see "read-after-write" errors, audit the transaction body for interleaved get/set.

---

### Presence stuck "online" after sign-out (commit 23ae76f)

**Symptom**
- Friends saw a signed-out user as still "online" for up to 90 s after they signed out.

**Root cause**
- RTDB presence heartbeat continued briefly post sign-out; the disconnect hook didn't explicitly mark offline.

**Fix**
- `markPresenceOffline(uid)` now fires explicitly BEFORE `signOut()` in `onSignOutSafe` (`App.tsx`). The presence rule only allows the owner to write, so it must happen pre-sign-out.

**Forward-looking notes**
- Any code path that ends a session (sign-out, account deletion, session takeover) must call `markPresenceOffline` BEFORE clearing auth.

---

## 🔧 Build / deploy

### Firestore composite index required for puzzle leaderboard (Alpha 0.2.7.0 — 2026-05-31)

**Symptom**
- The puzzle leaderboard popover would error in prod with `The query requires an index` after deploying the code.

**Root cause**
- `watchTodaysLeaderboard` uses `orderBy('best', 'desc'), orderBy('firstCompletedAt', 'asc')` on `dailyLeaderboard/{utcDate}/entries`. Firestore requires a composite index for any multi-field orderBy.

**Fix**
- Added the index to `firestore.indexes.json` and deployed via `firebase deploy --only firestore:indexes`.

**Forward-looking notes**
- Any new multi-field `orderBy` or `where + orderBy` combination needs an index entry. Vite / GH Pages deploy doesn't push Firestore config — `firebase deploy --only firestore:rules,firestore:indexes` is a **separate manual step** that must accompany the code push.

---

## Conventions for adding entries

When a new bug is fixed:

1. Add a section under the right category with the **version it was fixed in**.
2. Include all four fields: **Symptom**, **Root cause**, **Fix**, **Forward-looking notes**.
3. If you previously misdiagnosed it (shipped a wrong fix first), document the false lead in its own subsection so future-you doesn't go down the same rabbit hole.
4. Cross-reference any related entries (e.g. "see also: SVG filter notes in [Endgame flicker]").
