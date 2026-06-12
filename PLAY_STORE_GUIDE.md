# Google Play — step-by-step guide (for Donatas)

Plain-language path from "code is ready" (it is — everything below the line is
already done in the repo) to "DotDuel is on Google Play". Claude does the
builds; you do the clicking in Play Console. Ask Claude at any step.

**One-time costs:** $25 Play developer account. Nothing else.

---

## Part 1 — The signing key (one time, ~5 minutes, IMPORTANT)

The key is the app's signature. **If you lose the file or its passwords you can
never update the app on Play again.** Make it once, back it up twice.

1. Open PowerShell and run (one line; pick your own password when asked):

   ```
   & "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkey -v -keystore C:\Users\onemu\Documents\dotduel-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```

   It asks for a password (twice), then name/org/city — for those you can just
   press Enter or type your name; only the password matters. Finally type
   `yes` to confirm.

2. Copy `android\keystore.properties.example` to `android\keystore.properties`
   and fill in the two passwords you chose. (Both files paths are already
   git-ignored — they can never be committed.)

3. **Back up `dotduel-upload.jks` + the passwords** to two places (USB stick,
   password manager / cloud drive). Seriously.

## Part 2 — Build the upload file (Claude does this)

Tell Claude **"build the release bundle"**. Claude runs:

```
npm run build:android-release     # web assets with REAL ads (the only build that does)
npx cap sync android
cd android && ./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab` — that's the
file you upload. (Verified working 2026-06-12; with keystore.properties present
it comes out signed.)

Before each future upload, the version must go up: tell Claude "bump the
Android version" (`versionCode` +1 in `android/app/build.gradle`).

## Part 2.5 — Google sign-in for the app (one time, ~10 minutes)

The app uses the native Google account picker (no browser page, no
supabase.co link shown). It needs two things in **Google Cloud Console →
APIs & Services → Credentials** (same project where the existing OAuth
client lives):

1. **Find the existing "Web" OAuth client** and copy its **Client ID**
   (`…apps.googleusercontent.com`) — paste it to Claude, who puts it in
   `GOOGLE_WEB_CLIENT_ID` in `src/auth/supabaseAuth.ts`. It must be the same
   client ID that is set on Supabase → Authentication → Providers → Google.
2. **Create an Android OAuth client**: Create credentials → OAuth client ID →
   Android →
   - Package name: `com.dotduel.app`
   - SHA-1: `D8:61:55:7C:76:D2:6D:8F:D6:10:F6:CE:2C:50:09:E8:DD:72:AD:79`
     (this machine's debug key — makes sign-in work on the emulator/dev builds)

   Later, after Play Console onboarding, **add one more Android client** the
   same way with the SHA-1 shown under Play Console → Test and release →
   Setup → App signing (Google re-signs your app, so its certificate differs).
   Without that, Google sign-in works in testing but fails for Play users.

## Part 3 — Play Console setup (you, ~1 hour of forms)

1. **Account:** https://play.google.com/console → sign in with your Google
   account → pay the one-time $25 → identity verification (ID photo; takes a
   day or two for them to approve).
2. **Create app:** "Create app" → Name `DotDuel`, language English, type
   **Game**, free. Category: **Board**.
3. **Upload:** Testing → **Internal testing** → Create release → upload the
   `.aab` → add your own email as a tester → roll out. Install it on your phone
   from the link they give you and play a game. Only after that promote the
   same build to **Production**.

### The forms (answers prepared for you)

**Privacy policy URL:** `https://www.dotduel.com/privacy.html` (live, updated
2026-06-12 with the Android/AdMob disclosures).

**Data safety form** — answer "Does your app collect or share data?" → **Yes**:

| Question | Answer |
|---|---|
| Data encrypted in transit? | Yes |
| Can users request deletion? | Yes (in-app: Profile → Delete my account) |
| **Personal info → Email + Name** | Collected. Required for app functionality (multiplayer account). Not shared. |
| **App activity → In-app actions** | Collected (gameplay telemetry: funnel events, matches played). App functionality + analytics. Not shared. |
| **Device or other IDs** | Collected by AdMob + Google Analytics (advertising ID). Purpose: advertising, analytics. Shared with Google. Optional (consent-gated). |

(That's the complete honest list: the app has no location, contacts, photos,
files, camera, mic, health, financial or browsing data.)

**Ads declaration:** Yes, the app contains ads (AdMob banners on menu and free
single-player screens; none in ranked play).

**Content rating questionnaire (IARC):** category Game → answer **No** to
everything (no violence, sexuality, language, drugs, gambling, user-generated
content visible to others*, no location sharing). *Player display names ARE
user-entered and visible on leaderboards — answer "Yes" to "users can interact
/ exchange content" if asked about user interaction; the result will still be
Everyone / PEGI 3-7.

**Target audience:** 13+ (do NOT tick under-13 — that triggers Families policy
and a stricter ads regime).

**App access:** "All functionality is available without special access" — but
add a note that multiplayer needs Google sign-in, and provide a test Google
account if they ask (your own is fine for review).

### Store listing (can ask Claude to draft)

- **Short description** (80 chars): e.g. `Outsmart a friend or the AI in this
  fast dot-coloring strategy duel.`
- **Full description**: ask Claude — the SEO text in index.html is a good base.
- **Screenshots:** at least 2 phone screenshots (1080×1920ish). Take them on
  the emulator (Claude can capture: menu, mid-game triangle, game-over, daily
  puzzle). Optional 7-inch/10-inch tablet shots improve the listing.
- **App icon** 512×512 + **feature graphic** 1024×500 — Claude can generate
  both from the existing icon pipeline (`scripts/build-assets.mjs`).

## Part 4 — After submission

- First review typically takes **1–7 days** (new developer accounts trend
  slower; same as AdSense, silence is normal).
- Common first-time rejections and our cover: privacy policy URL (✅ live),
  Data safety mismatch (use the table above verbatim), ads in a "designed for
  families" app (✅ we target 13+), debuggable/unsigned build (✅ Part 1).

---

## Already handled in the repo (don't redo)

- `targetSdk 36`, minimal permissions (INTERNET only), adaptive icons, splash
  screens — compliant.
- Release signing wiring reads `android/keystore.properties` (git-ignored).
- AdMob: **test ads everywhere by default**; real ads ONLY via
  `npm run build:android-release` (`.env.androidrelease`). Never set
  `VITE_ADMOB_REAL` in `.env`/`.env.local`.
- AdSense correctly never loads in the native app (Play policy) — AdMob only.
- Android hardware back button: closes open dialogs, exits only from the menu,
  ignored mid-game.
- Public privacy policy: `public/privacy.html` (Supabase + AdMob disclosures,
  updated 2026-06-12).
