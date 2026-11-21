# Android: next release checklist

`npm run build:android-release` prints every open `- [ ]` line below, so
nothing here is skipped by the next app build. Tick (`- [x]`) or delete items
as they ship. **After every Play upload, copy any new Play Console warnings
("actions recommended", pre-launch report) in here.**

## For 1.17 (Play Console advisories on 18 / 1.16, 2026-11-21)

- [ ] Edge-to-edge on Android 15+: call `EdgeToEdge.enable(this)` in `MainActivity`, then test on the emulator (portrait, landscape, gesture and 3-button navigation): nothing hidden under the status or navigation bar.
- [ ] R8: set `minifyEnabled true` (+ `shrinkResources true`) for release, add keep rules if needed, then test a RELEASE build on the emulator: Google sign-in, online game, streak popup, reminder, share, app update prompt.
- [ ] Deprecated edge-to-edge APIs (setStatusBarColor/setNavigationBarColor, cutout mode): only inside libraries (AdMob SDK, androidbrowserhelper, Play Core). Nothing to fix in our code: update the Capacitor plugins when new versions are out, then recheck the Play warning.

## Shipped to the app code since 1.16 (mention in the 1.17 changelog)

- One-screen bot setup like the website (shape tiles + row of bots + name + Start), PR "Bot setup on one screen".
- Streak greeting always shows the state; streak lengths read "1 day" / "8 days".

## Every release (these stay unticked: printed on every build)

- [ ] Bump `versionCode` / `versionName` in `android/app/build.gradle`.
- [ ] Build with `npm run build:android-release` (never `npm run build`: that is the website layout), then `npx cap sync android`, then `gradlew bundleRelease`.
- [ ] Upload to the right track: Production for everyone, Internal testing to get it on your own phone first.
