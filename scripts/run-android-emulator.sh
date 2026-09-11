#!/usr/bin/env bash
# Build, sync, install, and launch DotDuel on the dotduel_api35 emulator.
# Run from anywhere; paths below are resolved relative to repo root and $LOCALAPPDATA.
#
# Usage:
#   scripts/run-android-emulator.sh            # build + sync + install + launch
#   scripts/run-android-emulator.sh --no-build # skip npm build + cap sync (just reinstall/launch)
#   scripts/run-android-emulator.sh --boot-only # only ensure emulator is running, skip everything else

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SDK="$LOCALAPPDATA/Android/Sdk"
AVD_NAME="dotduel_api35"
PACKAGE="com.dotduel.app"
JAVA_HOME_ANDROID_STUDIO="/c/Program Files/Android/Android Studio/jbr"

MODE="${1:-full}"

emulator_running() {
  "$SDK/platform-tools/adb.exe" devices | grep -q "^emulator-.*device$"
}

boot_emulator() {
  if emulator_running; then
    echo "Emulator already running."
    return
  fi

  echo "Checking hardware acceleration..."
  "$SDK/emulator/emulator-check.exe" accel

  echo "Launching $AVD_NAME..."
  "$SDK/emulator/emulator.exe" -avd "$AVD_NAME" -no-snapshot-load \
    > "$REPO_ROOT/scripts/.emulator.log" 2>&1 &

  echo "Waiting for device..."
  "$SDK/platform-tools/adb.exe" wait-for-device

  echo "Waiting for boot_completed..."
  for _ in $(seq 1 60); do
    boot=$("$SDK/platform-tools/adb.exe" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
    [ "$boot" = "1" ] && { echo "Boot complete."; return; }
    sleep 5
  done
  echo "WARNING: boot_completed not confirmed after 5 min, continuing anyway." >&2
}

boot_emulator
[ "$MODE" = "--boot-only" ] && exit 0

if [ "$MODE" != "--no-build" ]; then
  echo "Building web assets..."
  (cd "$REPO_ROOT" && npm run build)

  echo "Syncing Capacitor Android project..."
  (cd "$REPO_ROOT" && npx cap sync android)
fi

echo "Building + installing debug APK..."
export JAVA_HOME="$JAVA_HOME_ANDROID_STUDIO"
(cd "$REPO_ROOT/android" && ./gradlew.bat installDebug)

echo "Launching app..."
"$SDK/platform-tools/adb.exe" shell monkey -p "$PACKAGE" -c android.intent.category.LAUNCHER 1

sleep 3
focus=$("$SDK/platform-tools/adb.exe" shell dumpsys window | grep -m1 "mCurrentFocus")
echo "Focused window: $focus"
if echo "$focus" | grep -q "$PACKAGE"; then
  echo "DotDuel is running."
else
  echo "WARNING: $PACKAGE does not appear to be the focused window — check for a crash." >&2
fi
