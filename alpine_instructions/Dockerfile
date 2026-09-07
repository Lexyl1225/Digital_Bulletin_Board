# WorkPulse / Engineers Bulletin Board — Alpine container image
#
# Build context is the REPO ROOT (see docker-compose.yml: `context: ..`),
# not this folder, because this needs app.py, requirements.txt and
# frontend/ from the project root.
#
# Two stages:
#   1. frontend-builder - throwaway Node/Alpine image that runs `vite build`
#   2. runtime          - the actual Alpine "host": Python + gunicorn +
#                          Tailscale + the built static frontend
#
# See ../alpine_instructions/README.md for the full deployment walkthrough.

# ---------------------------------------------------------------------------
# Stage 1: build the React/TypeScript frontend
# ---------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder

# Baked into the JS bundle at BUILD time (Vite env vars are compile-time,
# not runtime) - must match the public hostname this app will be served at.
ARG VITE_DEFAULT_PASSWORD
ARG VITE_EXTRA_ALLOWED_HOST

WORKDIR /build

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend/ ./

# frontend/.env is gitignored and never present in the build context - this
# recreates it at build time from the ARGs above (docker-compose.yml passes
# them in from alpine_instructions/.env).
RUN { \
      echo "VITE_DEFAULT_PASSWORD=${VITE_DEFAULT_PASSWORD}"; \
      echo "VITE_EXTRA_ALLOWED_HOST=${VITE_EXTRA_ALLOWED_HOST}"; \
    } > .env

RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: the Alpine runtime "host" - Python backend + Tailscale
# ---------------------------------------------------------------------------
FROM alpine:3.20 AS runtime

# `tailscale` ships in Alpine's community repository. Official alpine:3.20
# images normally already have it enabled, but uncomment it defensively so
# this build doesn't silently break on a slimmer base image.
#
# apk against dl-cdn.alpinelinux.org occasionally hits a transient
# "temporary error (try again later)" on fresh hosts (DNS/CDN blip, not a
# problem with this Dockerfile) - retry a few times with backoff instead of
# failing the whole build on the first hiccup.
RUN sed -i -E 's/^#\s*(.*\/community)$/\1/' /etc/apk/repositories \
    && ( for i in 1 2 3 4 5; do \
           apk update && exit 0; \
           echo ">>> apk update failed (attempt $i/5), retrying in 5s..."; \
           sleep 5; \
         done; \
         echo ">>> apk update failed after 5 attempts - giving up"; \
         exit 1 ) \
    && ( for i in 1 2 3 4 5; do \
           apk add --no-cache \
             python3 \
             py3-pip \
             tailscale \
             iptables \
             ip6tables \
             ca-certificates \
             curl \
             bash \
           && exit 0; \
           echo ">>> apk add failed (attempt $i/5), retrying in 5s..."; \
           sleep 5; \
         done; \
         echo ">>> apk add failed after 5 attempts - giving up"; \
         exit 1 ) \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# --- Python backend dependencies ---
COPY requirements.txt .
RUN python3 -m venv /app/.venv \
    && /app/.venv/bin/pip install --no-cache-dir --upgrade pip \
    && /app/.venv/bin/pip install --no-cache-dir -r requirements.txt

# --- Backend source ---
COPY app.py .

# --- Built frontend from stage 1 (app.py serves this as static_folder) ---
COPY --from=frontend-builder /build/dist ./frontend/dist

# --- Entrypoint: starts tailscaled, tailscale up, gunicorn, tailscale funnel ---
COPY alpine_instructions/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
    && mkdir -p /var/lib/tailscale /var/run/tailscale /app/instance

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
