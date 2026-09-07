#!/bin/bash
# Entrypoint for the Alpine "host" container: starts tailscaled, joins the
# tailnet, starts the app under gunicorn, then exposes it via Tailscale
# Funnel. Runs as PID 1 inside the container.
#
# Env vars (see ../alpine_instructions/.env.example):
#   TS_AUTHKEY                 - optional. Unattended join. Without it,
#                                 `tailscale up` prints a login URL to the
#                                 logs on first run and waits for you to
#                                 open it (docker compose logs -f).
#   TS_HOSTNAME                 - this container's name on your tailnet.
#   TS_USERSPACE                - "true" to fall back to userspace
#                                 networking (no /dev/net/tun needed).
#   DEFAULT_USER_PASSWORD        - passed straight through to the Flask app.
#   EXTRA_TRUSTED_ORIGIN_HOSTS   - passed straight through to the Flask app.

set -euo pipefail

TS_SOCKET=/var/run/tailscale/tailscaled.sock
TS_STATE_DIR=/var/lib/tailscale
TS_HOSTNAME="${TS_HOSTNAME:-electrical-bulletin-board}"

GUNICORN_PID=""
TAILSCALED_PID=""

cleanup() {
  echo "[entrypoint] Shutting down..."
  [ -n "$GUNICORN_PID" ] && kill "$GUNICORN_PID" 2>/dev/null || true
  # Funnel config is stored by tailscaled and persisted in the
  # tailscale-state volume, so it's simply re-applied on next startup -
  # no need to tear it down here, just stop the daemon cleanly.
  [ -n "$TAILSCALED_PID" ] && kill "$TAILSCALED_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup TERM INT

echo "[entrypoint] Starting tailscaled..."
mkdir -p "$TS_STATE_DIR" "$(dirname "$TS_SOCKET")"

TAILSCALED_EXTRA_ARGS=""
if [ "${TS_USERSPACE:-false}" = "true" ]; then
  echo "[entrypoint] TS_USERSPACE=true - using userspace networking (no /dev/net/tun)."
  TAILSCALED_EXTRA_ARGS="--tun=userspace-networking"
fi

# shellcheck disable=SC2086
tailscaled \
  --state="$TS_STATE_DIR/tailscaled.state" \
  --socket="$TS_SOCKET" \
  $TAILSCALED_EXTRA_ARGS \
  > /var/log/tailscaled.log 2>&1 &
TAILSCALED_PID=$!

echo "[entrypoint] Waiting for tailscaled to come up..."
until tailscale --socket="$TS_SOCKET" status --json >/dev/null 2>&1; do
  sleep 1
done

echo "[entrypoint] Bringing up the tailnet connection (hostname: $TS_HOSTNAME)..."
if [ -n "${TS_AUTHKEY:-}" ]; then
  tailscale --socket="$TS_SOCKET" up \
    --auth-key="$TS_AUTHKEY" \
    --hostname="$TS_HOSTNAME" \
    --accept-dns=true
else
  echo "[entrypoint] No TS_AUTHKEY set - if this is the first run, a login URL"
  echo "[entrypoint] will appear below. Open it in a browser to authenticate."
  tailscale --socket="$TS_SOCKET" up \
    --hostname="$TS_HOSTNAME" \
    --accept-dns=true
fi

echo "[entrypoint] Tailscale is up:"
tailscale --socket="$TS_SOCKET" status

echo "[entrypoint] Starting the app (gunicorn on 127.0.0.1:8000)..."
cd /app
.venv/bin/gunicorn \
  --workers 1 \
  --threads 4 \
  --bind 127.0.0.1:8000 \
  --access-logfile /var/log/gunicorn-access.log \
  --error-logfile /var/log/gunicorn-error.log \
  app:app &
GUNICORN_PID=$!

echo "[entrypoint] Waiting for the app to respond on 127.0.0.1:8000..."
until curl -sf http://127.0.0.1:8000/ -o /dev/null; do
  sleep 1
done

echo "[entrypoint] Enabling Tailscale Funnel (443 -> 127.0.0.1:8000)..."
tailscale --socket="$TS_SOCKET" funnel --bg --https=443 http://127.0.0.1:8000

echo "==============================================================="
echo " Funnel configuration (the URL below is where the app is live):"
tailscale --socket="$TS_SOCKET" funnel status
echo "==============================================================="

wait "$GUNICORN_PID"
