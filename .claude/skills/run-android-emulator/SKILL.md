---
name: run-android-emulator
description: Use when asked to launch/run/start the Android emulator or the DotDuel app on Android — boots the dotduel_api35 AVD, builds, syncs, installs, and launches the app.
---

# Run DotDuel on the Android emulator

One script does the whole flow: boot emulator → `npm run build` → `npx cap sync android` → `gradlew installDebug` → launch via `adb monkey`.

```bash
bash scripts/run-android-emulator.sh                # full flow (build + install + launch)
bash scripts/run-android-emulator.sh --no-build      # skip web build/cap sync, just reinstall + launch (use if only android/ native code changed, or nothing changed and you just need it back on screen)
bash scripts/run-android-emulator.sh --boot-only     # just get the emulator running, no build/install
```

Run it with the `Bash` tool (Git Bash), not PowerShell.

## Key facts (so you don't have to re-derive them)

- SDK root: `$LOCALAPPDATA/Android/Sdk` (no `ANDROID_HOME` env var is set in this environment).
- Target AVD: **`dotduel_api35`** — the one with native Google sign-in configured (Play app-signing SHA-1 registered). Other AVDs exist (`dd_api24/28/30`, `dd_tab7/10`, `dd_tiny`) — don't use those unless asked.
- Acceleration: WHPX (not AEHD — AEHD was deleted after a 2026-06-12 crash, see `project_dotduel_android_workflow` memory). `emulator-check.exe accel` should report WHPX usable before launching.
- `JAVA_HOME` must be set for Gradle — nothing is set globally. Use the JBR bundled with Android Studio: `C:\Program Files\Android\Android Studio\jbr`.
- Package name: `com.dotduel.app`, launcher activity `MainActivity`.
- Boot takes ~40s from cold start; poll `adb shell getprop sys.boot_completed` rather than sleeping a fixed guess.
- Verify launch succeeded (not just that `monkey` returned) via `adb shell dumpsys window | grep mCurrentFocus` — should show `com.dotduel.app/.MainActivity`. Also worth checking `adb logcat -d | grep FATAL` if focus doesn't land on the app.

## When to use `--no-build`

If you already built+synced+installed in this session and just want the app back on screen (e.g. it was closed, or you're re-verifying), skip straight to install+launch. If any TS/React source changed since the last install, do the full flow.
