#!/usr/bin/env bash
# Start the Vite dev server and expose it with a public, temporary HTTPS URL
# so it can be viewed from outside the local network (e.g. over a remote
# session where localhost/LAN isn't reachable).
#
# Prefers cloudflared's free "quick tunnel" (no account, no signup, a
# throwaway https://<random>.trycloudflare.com URL that's torn down when
# this script exits). Falls back to `npx localtunnel` if cloudflared isn't
# installed.
#
# SECURITY NOTE: the printed URL is unauthenticated and public for as long
# as this script keeps running — anyone with the link can open it. It's a
# random, hard-to-guess subdomain and stops working the moment you Ctrl+C
# this script, but don't leave it running unattended or share the link
# beyond who needs to see the preview.
#
# Usage: scripts/remote-preview.sh [dev-server-port-to-reuse]
#   If a port is given, assumes a dev server is ALREADY running there and
#   only starts the tunnel. Otherwise starts `npm run dev` itself first.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${1:-}"
DEV_PID=""

cleanup() {
  if [ -n "$DEV_PID" ]; then
    kill "$DEV_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

if [ -z "$PORT" ]; then
  echo "Starting dev server..."
  (cd "$REPO_ROOT" && npm run dev > "$REPO_ROOT/scripts/.dev-server.log" 2>&1) &
  DEV_PID=$!

  echo "Waiting for it to pick a port..."
  for _ in $(seq 1 30); do
    PORT=$(grep -oE 'localhost:[0-9]+' "$REPO_ROOT/scripts/.dev-server.log" 2>/dev/null | head -1 | grep -oE '[0-9]+' || true)
    [ -n "$PORT" ] && break
    sleep 1
  done
  if [ -z "$PORT" ]; then
    echo "ERROR: dev server didn't report a port within 30s — check scripts/.dev-server.log" >&2
    exit 1
  fi
  echo "Dev server up on port $PORT."
fi

CLOUDFLARED="$(command -v cloudflared 2>/dev/null || true)"
[ -z "$CLOUDFLARED" ] && [ -x "$REPO_ROOT/scripts/bin/cloudflared.exe" ] && CLOUDFLARED="$REPO_ROOT/scripts/bin/cloudflared.exe"

if [ -n "$CLOUDFLARED" ]; then
  echo "Starting cloudflared quick tunnel -> http://localhost:$PORT ..."
  echo "(Ctrl+C to stop both the tunnel and the dev server.)"
  "$CLOUDFLARED" tunnel --url "http://localhost:$PORT"
else
  echo "cloudflared not found — falling back to 'npx localtunnel' (no install needed, less reliable)."
  echo "Starting localtunnel -> http://localhost:$PORT ..."
  echo "(Ctrl+C to stop both the tunnel and the dev server.)"
  npx --yes localtunnel --port "$PORT"
fi
