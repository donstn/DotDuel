# DotDuel Privacy Policy

**Effective date:** 25 May 2026.

This is the long-form, git-tracked copy of the in-app Privacy Policy.
The version users see lives in
`src/components/PrivacyPopover.tsx`. Both stay in sync; if they
drift, the in-app text is the canonical one shown to data subjects.

---

## Who we are

DotDuel is an independent two-player dot-coloring game built and
operated by a single developer. The data controller under GDPR is
the developer. Contact: **donstn@gmail.com**.

There is no company, no employees, no third-party data processors
beyond Google (Firebase) and the registrar (Namecheap, DNS only).

---

## What we collect

| Surface | Field | Source | Lawful basis | Retention |
|---|---|---|---|---|
| Firebase Auth | uid, email, emailVerified, providerData | Sign-up | Contract (Art. 6.1.b) | Until account deletion |
| Firestore `users/{uid}` | displayName, email, authProvider, rating, placementGamesPlayed, createdAt | Sign-up + finalizeGame | Contract | Until account deletion |
| Firestore `usernames/{lower}` | uid, displayName, createdAt | Username claim | Contract (uniqueness) | Until rename or account deletion |
| Firestore `leaderboard/{uid}` | uid, displayName, rating, placementGamesPlayed, lastPlayedAt | finalizeGame | Legitimate interest (competitive fairness) | Until account deletion |
| Firestore `matches/{matchId}` | p1Uid, p2Uid, p1Display, p2Display, scores, ratings before/after/delta, shape, time control, finishedReason, durationMs | matchmake + finalizeGame | Contract + Legitimate interest | **24 months** after match end, then permanent deletion |
| Firestore `matchmakingQueue/{uid}` | uid, rating, timeControl, joinedAt | Queue join | Contract | Seconds (deleted on pair) |
| Firestore `pairings/{uid}` | matchId, opponent details | Function write | Contract | Seconds (deleted on game end) |
| RTDB `games/{id}` | playerUids, state, clock | Function/client | Contract | Deleted ~24h after `status='finished'` |
| RTDB `gameSessions/{uid}` | Session lock marker | Client | Contract | onDisconnect auto-release |
| Google Analytics | Page views, device model, locale, screen size, anonymous session ID | Analytics SDK | **Consent (Art. 6.1.a)** | Per Google's defaults (currently 14 months) |

### Device-only (never transmitted to our servers)

| localStorage key | Contents |
|---|---|
| `dotduel:progress:v3` | Unlock ladder + per-shape/level wins |
| `dotduel:settings:v1` | Name, opponent name, hot-seat swap, tutorialSeen, gamesPlayed, claimsMade |
| `dotduel:stats:v4` | Per-name local W/D/L, head-to-head, points scored/given |
| `dotduel:theme:v1` | Theme preference |
| `dotduel:consent:v1` | Your analytics consent choice |

---

## Who it's shared with

- **Google LLC** — Firebase Authentication, Firestore, Realtime
  Database, Cloud Functions, Hosting, and (with your consent) Google
  Analytics. Subject to Google's standard Cloud Terms / Data
  Processing Addendum.
- **Namecheap** — DNS provider only. Does not see user data.
- **GitHub** — Source-code hosting and (during the staging window)
  GitHub Pages. Does not see authenticated user data; only raw asset
  traffic.

We do **not** use third-party ad networks, social-media trackers, or
analytics other than Google Analytics. We do not sell data to anyone.

> **Future change.** Google AdSense may be added to the menu screens
> in a future release. When that happens this policy and the consent
> banner will be updated to disclose it, and existing players will
> not see ads. The current release does not load AdSense.

---

## How long we keep it

- **Account + leaderboard:** Until you delete your account.
- **Match history:** Up to 24 months after the match ended, then
  permanently deleted by a scheduled job. (Track:
  `docs/multiplayer-roadmap.md` §17.x.)
- **Live game state:** Deleted within ~24 hours of game end.
- **Analytics:** Per Google's defaults — currently 14 months for
  event data.
- **Device-only data:** Stays until you clear your browser data.

---

## Your rights under GDPR

You have the right to:

1. **Access** the data we hold (Article 15) — use *Download my data*
   in your Profile. You get a JSON file with everything we know about
   you.
2. **Rectify** inaccurate data (Article 16) — use the *Rename* button
   in your Profile to change your display name.
3. **Erase** your account, the "right to be forgotten" (Article 17)
   — use *Delete my account* in your Profile. Effect is immediate.
4. **Port** your data (Article 20) — same as Access; the export is
   machine-readable.
5. **Object** to analytics processing (Article 21) — Decline the
   consent banner at first launch, or toggle it off later in the
   Privacy Policy popover.
6. **Lodge a complaint** with your national data-protection authority
   if you believe we've mishandled your data.

To exercise any of these rights without using the in-app controls,
email **donstn@gmail.com**.

---

## Important note on rankings (deletion behaviour)

When you delete your account (whether at your own request under
Article 17, or for any other reason — terms-of-service violation,
admin action, etc.):

- Your **display name** and **account identifier** are scrubbed from
  every public record.
- Past matches you played in are **kept** with your name replaced by
  "Deleted player" and your UID replaced by a non-reversible hashed
  sentinel.
- The **rating changes you caused on other players' Elo are NOT
  reversed**. Past matches are immutable. Opponents you played
  against keep their rating gains and losses.
- Your own Elo, leaderboard entry, account doc, and Firebase Auth
  user are all permanently deleted.
- Your reserved username is freed — another player could later claim
  the same display name.
- If you re-register with the same email, you start as a fresh
  account at rating 1000.
- If you delete your account in the middle of a live ranked game, the
  game is forfeited and your opponent receives the standard
  resignation-win Elo gain.

This policy applies to every deletion path, not only GDPR erasure
requests. It exists to protect the integrity of opponents'
competitive history — a single user choosing to leave should not
retroactively change anyone else's ranking.

---

## Cookies and analytics consent

We do not set tracking cookies. Firebase Authentication uses
first-party session storage to keep you signed in. Google Analytics
uses cookies, but only if you accept analytics on the consent banner.

The consent banner appears on your first visit. Your choice is
stored in `dotduel:consent:v1` in your browser. You can change your
mind anytime from the Privacy Policy popover (footer → Privacy).
Switching from Accepted to Declined reloads the page so the
Analytics SDK fully stops.

---

## Effective date and changes

This policy is effective from **25 May 2026**. If anything material
changes (new sub-processors, new fields collected, longer retention),
the in-app text + this file are updated together and the effective
date moves forward.

---

## Implementation references

For auditors / engineers, the GDPR plumbing lives at:

- `functions/src/index.ts` — `deleteAccount` Cloud Function (Article 17)
- `src/cloud/account.ts` — client-side `downloadMyData` (Article 20) +
  `deleteMyAccount` wrapper
- `src/consent.ts` + `src/components/ConsentBanner.tsx` — Article 7
  consent gate for Analytics
- `src/components/PrivacyPopover.tsx` — the user-facing version of
  this document
- `firestore.rules` — `deletionLog/{sentinel}` audit collection
  (function-only)
