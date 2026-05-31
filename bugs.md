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

## ☁️ Backend / sync

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
