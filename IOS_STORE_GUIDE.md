# Apple App Store — step-by-step guide (for Donatas)

Plain-language path from "Android app already works" to "DotDuel is on the App
Store", same style as `PLAY_STORE_GUIDE.md`. Claude does the code/build; you do
the clicking in App Store Connect and the identity checks Apple requires from
a human. Ask Claude at any step.

**This is new ground, unlike Android:** iOS has never been added to this repo
(`npx cap add ios` has not been run), there's no Mac in the loop yet, and
Apple requires "Sign in with Apple" as new engineering work — Android had no
equivalent step. Read Part 0 before anything else; it explains the two
Apple-specific requirements that don't exist on Play.

**One-time / recurring costs:**
- **$99/year** — Apple Developer Program (mandatory, no way around it)
- **$0** — build pipeline (Codemagic free tier covers this at our volume, see Part 4)
- **$0** until real revenue — RevenueCat billing (free under $2.5k/month subscription revenue, then 1%)
- Apple's cut of subscription revenue: **15%** once you join the (free) Small Business Program — see Part 3

---

## Part 0 — The two things Apple requires that Android didn't

**1. You need a Mac (or a stand-in) to build/sign the app.** Xcode only runs
on macOS — there is no Windows equivalent. You don't need to buy one:
**Codemagic** (a build service) spins up a macOS machine in the cloud, builds
and signs the app, and hands back a signed `.ipa` — free tier is 500
build-minutes/month, more than enough for occasional releases. Claude sets
this up once (a config file in the repo); after that, triggering a build is
one click on Codemagic's website, no Mac ownership needed. (Details in Part 4.)

**2. "Sign in with Apple" is legally required, not optional, given the app
already offers Google sign-in.** Apple's App Store Review Guideline 4.8 says:
if your app offers any third-party/social login, it must also offer an
equivalent Apple-run login. There's no way to ship multiplayer/daily-puzzle
sign-in on iOS with Google-only, the way it works on Android today — Apple
review will reject it. This is genuine new engineering work (a native Apple
sign-in button + a Supabase Auth wire-up next to the existing Google one),
not just a form to fill in. Scoped in Part 2.

**Your question — "how does the demo part work, is it needed at all":** this
splits into two separate things, and it's worth being precise about which one
you're asking:

- **Can Apple's reviewer actually play the game to test it?** Yes, without
  any special "demo mode" — vs-AI and hot-seat already work with zero sign-in
  (same as today on Android/web), so the reviewer can play immediately. For
  multiplayer/daily-puzzle (which need an account), App Store Connect has a
  "App Review Information" section — same purpose as Play Console's "App
  access" note you already fill in for Android — where you either say sign-in
  isn't required to review the core app, or provide a demo account. Once Sign
  in with Apple exists, Apple's own reviewers can typically just use their
  own Apple ID — no demo account needed at all.
- **Does Sign in with Apple itself need to exist before you can submit?**
  Yes — that's not a review-access question, it's a compliance requirement
  (4.8, above) independent of whether reviewers can get in. A demo account
  solves reviewer *access*; it does not solve 4.8. Both are handled below,
  but they're different problems — worth not conflating them going forward.

---

## Part 1 — Apple Developer Program (you, ~30 minutes + Apple's approval wait)

1. **Enroll:** https://developer.apple.com/programs/ → sign in with (or
   create) an Apple ID → pay **$99/year**. Individual enrollment is fine (no
   need for the "Organization" tier / D-U-N-S number unless you want the App
   Store listing to show a company name instead of your own).
2. **Join the Small Business Program** (free, separate step, do it right
   after enrolling): https://developer.apple.com/app-store/small-business-program/
   — cuts Apple's commission from 30% to **15%** on all your revenue (you
   will qualify easily under the $1M/year threshold). Skipping this step
   costs you real money for no reason.
3. Apple's identity verification can take a day or two, same as Play
   Console's did.

## Part 2 — Sign in with Apple (Claude builds this, ~1 session of work)

Why: covered in Part 0. What it involves, concretely:

- `@capgo/capacitor-social-login` (already installed and already used for
  Google) also supports Apple — add the Apple provider config alongside the
  existing Google one in `src/auth/supabaseAuth.ts`.
- Supabase Auth already supports Apple as a provider (same dashboard section
  as Google: **Authentication → Providers → Apple**) — needs your Apple
  Developer account's Services ID + a signing key generated in the Apple
  Developer dashboard (Claude will walk you through exactly where to click
  when we get here).
- UI: an "Sign in with Apple" button next to the existing Google button,
  styled per Apple's (strict, checked-in-review) branding guidelines — black
  or white pill button, their logo, their wording. Not a place to improvise
  the design.
- One nuance specific to Apple: it lets the user **hide their real email**
  (a relay address instead). Supabase Auth handles this transparently, but
  worth knowing if you ever look at a new iOS user's row and see an
  `@privaterelay.appleid.com` address — that's expected, not a bug.

## Part 3 — The subscription: $0.99/month or $9.99/year, ad-free

**Confirms and answers an open question from `monetization_plan.md` §H.3**
("Yearly plan? $9.99/year — recommended") — yes, both tiers, decided.

**Recommended simplification for iOS specifically** (your "let's make it
simple" — flagging this as a real decision, not a foregone conclusion):
`monetization_plan.md`'s existing model runs AdMob ads on Android for
everyone, subscription removes them. Shipping that same model on iOS means
also building iOS AdMob (no iOS ad unit exists yet), plus Apple's mandatory
**App Tracking Transparency (ATT)** prompt (a permission dialog Apple forces
for any ad SDK that touches the IDFA — Google's ad SDK does, even if we never
call it directly) — real extra work with a real UX cost (a permission popup
before ads even start).

**Simpler alternative for iOS v1, matching "let's make it simple":** ship iOS
with **no ads at all** — everyone plays free, the $0.99/$9.99 subscription is
framed purely as "support the developer" (a small "Plus" badge, matching
`monetization_plan.md`'s existing non-ad perks), not "remove ads that don't
exist." This skips iOS AdMob and ATT entirely for launch. You can add iOS ads
later if the no-ads version undersells. **Recommend this path** — say so if
you'd rather match Android exactly instead.

Either way, the subscription mechanics are the same:

1. **App Store Connect → Subscriptions:** create one Subscription Group
   (e.g. "DotDuel Plus"), two products inside it:
   - `dotduel_plus_monthly` — $0.99/month
   - `dotduel_plus_annual` — $9.99/year
   Apple's server handles the trial, proration, and family-sharing options —
   you just fill in the price and description.
2. **RevenueCat** (`@revenuecat/purchases-capacitor`, MIT-licensed, free
   under $2.5k/month) is the plumbing between Apple's StoreKit and our
   Supabase `profiles.subscription_active` flag — this is already fully
   designed in `monetization_plan.md` §C.1/C.3 (the `profiles` columns, the
   `billing` table, the `revenuecat-webhook` Edge Function, the
   `hasActiveSubscription()` ad-gate seam). Building it once covers Android
   and iOS together — RevenueCat is the same plugin/webhook on both, no
   iOS-specific billing code needed beyond registering the App Store
   Connect API key in the RevenueCat dashboard.
3. **What NOT to do:** never accept payment for the subscription through
   Stripe or any non-Apple processor **from inside the iOS app** — Apple
   Store Review Guideline 3.1.1 requires all in-app digital purchases go
   through their In-App Purchase system, full stop. (Stripe on the *web*
   version stays exactly as planned — this only applies to purchases made
   from inside the iOS app itself.)

## Part 4 — Build pipeline: Codemagic (no Mac needed)

1. `npx cap add ios` — Claude runs this once, adds the `ios/` Xcode project
   to the repo (parallel to the existing `android/`).
2. Codemagic (https://codemagic.io) — free account, connect the GitHub repo.
   Claude writes the `codemagic.yaml` build config (mirrors what
   `android/build.gradle` + `keystore.properties` do for Android: which
   scheme to build, where the signing certificate comes from).
3. **Signing certificate + provisioning profile:** generated once via your
   Apple Developer account (Certificates, Identifiers & Profiles section) —
   Codemagic can auto-manage this for you (recommended, it renews itself)
   once you connect your Apple Developer account to it.
4. Each release: push to the repo, trigger a Codemagic build (one click or
   automatic on a tag), it hands back a signed `.ipa`, which you upload to
   App Store Connect either from Codemagic directly or via Apple's
   Transporter app... except Transporter is Mac/Windows-both actually — worth
   double-checking at the time, Apple's tooling changes. Codemagic can also
   push straight to App Store Connect / TestFlight itself, which is the
   simpler path — ask Claude to wire that in when we get there.

## Part 5 — App Store Connect setup (you + Claude, ~1-2 hours of forms)

1. **Create the app:** App Store Connect → My Apps → "+" → same bundle ID
   already set in `capacitor.config.ts` (`com.dotduel.app`) → category
   **Games → Board**.
2. **App icon:** one 1024×1024 PNG, no transparency — Apple generates every
   other size itself (unlike Android's manual adaptive-icon set). Can reuse
   the existing icon pipeline (`scripts/build-assets.mjs`).
3. **Screenshots:** only the largest iPhone size is technically required now
   (6.9" — 1290×2796 or 1320×2868 depending on source device; Apple
   downscales for older phones automatically). **No iPad screenshots needed**
   if the Xcode project is restricted to iPhone-only, matching the existing
   phone-only posture on Android.
4. **App Privacy questionnaire** ("nutrition label") — same honest answers as
   the Play Data Safety form already drafted in `PLAY_STORE_GUIDE.md`, just a
   different form: collects email+name (Supabase auth, required for
   multiplayer), gameplay telemetry (GA4), and — only if you keep AdMob on
   iOS — advertising ID (see Part 3's ads decision).
5. **Privacy Manifest file (`PrivacyInfo.xcprivacy`)** — mandatory since May
   2024, checked automatically at upload (before a human ever reviews it).
   Declares which "sensitive" APIs the app's third-party SDKs touch. Most
   SDKs (Google Sign-In, RevenueCat) ship their own manifest bundled in;
   Claude confirms nothing's missing before the first submission.
6. **App Review Information:** this is where the "demo account" question from
   Part 0 actually gets answered in the form — either "no demo account
   needed, sign-in isn't required to use the core app" (true for vs-AI/hot-
   seat) plus a note that multiplayer needs sign-in, or a demo Apple ID if
   you'd rather hand reviewers one directly. Same idea as the Play Console
   "App access" section you already filled in for Android.
7. **Subscription review**: Apple reviews the two subscription products
   alongside the app binary the first time — make sure Part 3's App Store
   Connect subscription setup is done *before* your first submission, not
   after, or the app gets rejected for referencing IAP products that don't
   exist yet.

## Part 6 — TestFlight (before going live to everyone)

Same $99/year covers this, no extra fee. Internal testers (up to 100, your
own App Store Connect account) get a build with zero review, live within
minutes — good for your own first real-device test. External testers (up to
10,000) need a quick "Beta App Review" pass first (lighter than full review).
**Builds expire 90 days after upload** — if beta-testing runs long, you'll
need to push a fresh build before then.

## Part 7 — After submission

- First review typically **1–7 days**, similar to Play's first review.
- **Apple-specific rejection risks to know about ahead of time:**
  - **"Bare web-wrapper" rejection** — Apple sometimes rejects Capacitor/
    Ionic apps that feel like an unmodified website in a frame. Mitigation
    already flagged in `monetization_plan.md` §G.1: ship at least one real
    native touch — haptic feedback on dot placement is the cheapest one to
    add and genuinely improves the game feel anyway.
  - **Guideline 4.8** (Sign in with Apple missing) — covered in Part 2, make
    sure it ships in the *same* build as Google sign-in, not a follow-up.
  - **Guideline 3.1.1** (non-Apple payment inside the app) — covered in
    Part 3, make sure the subscription purchase flow only ever calls
    RevenueCat/StoreKit from inside the iOS binary, never a Stripe checkout
    URL.

---

## Already true, nothing to redo

- Capacitor 8.4.0 is current enough for iOS — no version bump needed.
- `capacitor.config.ts`'s `appId`/`appName` (`com.dotduel.app` / `DotDuel`)
  carry over unchanged to iOS — same bundle identity as Android.
- The RevenueCat + Supabase billing design (`profiles` columns, guard
  trigger, webhook, ad-gate seam) is already fully specified in
  `monetization_plan.md` §C — building it once serves Android and iOS both,
  nothing iOS-specific needed there beyond registering the App Store Connect
  API key with RevenueCat.
- `public/privacy.html` already exists and just needs the same
  payment-processor disclosure update `monetization_plan.md` §G.8 already
  calls for (applies to both platforms, not iOS-specific new work).

## Open items only you can decide

1. **Ads on iOS v1: yes (match Android, more setup) or no (simpler, "support
   the dev" framing only)?** Recommend no — see Part 3.
2. **Subscription product naming** — same open question as
   `monetization_plan.md` §H.1 (Plus / Pro / Ad-Free / Supporter), applies
   identically to the App Store Connect product names.
3. **Individual vs Organization Apple Developer enrollment** — Organization
   needs a D-U-N-S number (free, but takes time to obtain) and shows a
   company name on the listing instead of your personal name. Individual is
   faster to start with; can't easily be changed later without losing app
   ownership continuity, so worth deciding once rather than switching.

**Estimated calendar time:** 2-4 weeks focused (Sign in with Apple + iOS
Capacitor setup + Codemagic pipeline + App Store Connect forms + Apple's
review queue), assuming the RevenueCat/Supabase billing plumbing from
`monetization_plan.md` §C is built once and shared with Android rather than
redone.
