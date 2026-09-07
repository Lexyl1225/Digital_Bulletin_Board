# Deploying on Alpine (in Docker) + Tailscale Funnel

This is a complete, from-scratch guide to running the WorkPulse / Engineers
Bulletin Board on an **Alpine Linux container acting as the host** — Alpine
itself runs inside Docker (via `docker compose`), and Tailscale runs
**inside that same Alpine container** (not a separate sidecar), exposing
the app to the internet through **Tailscale Funnel**.

Target public URL for this guide's defaults:

```
https://electrical-bulletin-board.ratfish-regulus.ts.net
```

Everything needed lives in this folder (`alpine_instructions/`):

| File                | Purpose                                                        |
|----------------------|------------------------------------------------------------------|
| `Dockerfile`          | Builds the frontend, then the Alpine runtime image              |
| `docker-compose.yml`  | Orchestrates the container: volumes, capabilities, env vars     |
| `entrypoint.sh`       | Runs inside the container: starts tailscaled, the app, Funnel   |
| `.env.example`        | Template for the secrets/config you provide (copy to `.env`)    |
| `README.md`           | This file                                                        |

Architecture recap (so the steps below make sense):

- **Backend**: Flask + Flask-SQLAlchemy + SQLite, single process (`app.py`),
  served in production by gunicorn on `127.0.0.1:8000` **inside** the
  container.
- **Frontend**: React/TypeScript, built by Vite into static files
  (`frontend/dist/`) at **image build time** and served by the same Flask
  process — no separate frontend server, no nginx.
- **Tailscale**: `tailscaled` runs as a background process inside the
  container (there's no systemd/OpenRC init system in this setup — the
  container's own `entrypoint.sh` plays that role). `tailscale funnel`
  terminates HTTPS for you and forwards straight to `127.0.0.1:8000`. You
  do not need nginx, certbot, or any TLS setup of your own, and you do
  **not** need to open any inbound port on your Docker host's firewall —
  Funnel works by tailscaled making an *outbound* connection to Tailscale's
  relay infrastructure.

---

## Section 1 — Prerequisites

On the machine that will run the container (this is your actual Docker
host — it can be Linux, macOS, or Windows with Docker Desktop; it does
**not** need to be Alpine itself, since Alpine only exists inside the
container image):

- Docker Engine with the Compose v2 plugin (`docker compose version` should
  print something, not "command not found"). If you only have the older
  standalone `docker-compose`, replace `docker compose` with
  `docker-compose` everywhere below.
- A Tailscale account, and this Docker host's network able to reach
  `login.tailscale.com` and Tailscale's relay/DERP servers outbound (no
  inbound access needed).

One-time Tailscale admin console setup (only needed once per tailnet — skip
if you already funnel other devices on this tailnet):

1. **HTTPS Certificates**: Tailscale admin console → **DNS** → enable
   **"HTTPS Certificates"**.
2. **Funnel access**: on a personal tailnet this is on by default; on a
   business/org tailnet, check the admin console's Funnel settings, or your
   ACL policy needs a `"funnel"` node attribute grant for this node (or its
   tag, if you use a tagged auth key — see the next step).
3. **Generate an auth key** (recommended, for unattended container
   startup): admin console → **Settings → Keys → Generate auth key**.
   - Reusable: **on** (so rebuilding the container doesn't burn a new key
     every time)
   - Ephemeral: **off** (so the node identity and Funnel config survive
     container restarts — an ephemeral key's node gets deleted from your
     tailnet as soon as it disconnects)
   - Tags: only if your tailnet's ACLs require a tag to grant Funnel access

   You can skip this and authenticate interactively instead (Section 4
   covers both paths), but the auth key is what makes `docker compose up
   -d` fully unattended on every future rebuild.

---

## Section 2 — Get the code

```bash
git clone https://github.com/Lexyl1225/Digital_Bulletin_Board.git
cd Digital_Bulletin_Board/alpine_instructions
```

Everything from here on is run **from inside this `alpine_instructions/`
folder** unless a step says otherwise.

---

## Section 3 — Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in real values. At minimum, change:

- `DEFAULT_USER_PASSWORD` / `VITE_DEFAULT_PASSWORD` — pick a real shared
  default password (keep both the same).
- `TS_AUTHKEY` — paste the auth key from Section 1, or leave blank for
  interactive login (Section 5 explains what happens either way).

Leave `TS_HOSTNAME`, `EXTRA_TRUSTED_ORIGIN_HOSTS`, and
`VITE_EXTRA_ALLOWED_HOST` as-is if you want the
`electrical-bulletin-board.ratfish-regulus.ts.net` hostname from the top of
this guide. If you use a different hostname or a different tailnet, all
three of those values must stay in sync with each other (see Section 9 if
you get "Cross-origin request blocked" later — it means one of them drifted
out of sync).

`.env` is already covered by this repo's root `.gitignore` — it will never
be committed.

---

## Section 4 — Build and start

```bash
docker compose up -d --build
```

First build takes a few minutes (installs Node + npm packages, runs `vite
build`, then installs Python + Alpine packages for the runtime image).
Subsequent builds are much faster thanks to Docker's layer cache, unless
`requirements.txt` or `frontend/package.json` changed.

Watch the startup logs:

```bash
docker compose logs -f
```

You should see, in order: `tailscaled` starting, Tailscale coming up,
gunicorn starting, then a banner with the final public URL. Leave this
running in a second terminal while you go through Section 5.

---

## Section 5 — First-time Tailscale authentication

**If you set `TS_AUTHKEY`** in `.env`: nothing to do — the container
authenticates itself automatically on startup. Skip to Section 6.

**If you left `TS_AUTHKEY` blank**: the `docker compose logs -f` output
will pause and print something like:

```
[entrypoint] No TS_AUTHKEY set - if this is the first run, a login URL
[entrypoint] will appear below. Open it in a browser to authenticate.
To authenticate, visit:

        https://login.tailscale.com/a/xxxxxxxxxxxx
```

Open that URL in any browser (on any device — it doesn't need to be the
Docker host), sign in, and approve the new device. The `entrypoint.sh`
script is blocked waiting for this — as soon as you approve it, the logs
will continue automatically into starting gunicorn and enabling Funnel.

This only happens once per named volume — the `tailscale-state` Docker
volume persists this device's identity, so `docker compose restart` or a
rebuild afterward won't ask you to log in again. (It **will** ask again if
you run `docker compose down -v`, which deletes volumes — see Section 8.)

---

## Section 6 — Verify it's live

Find the container's own device name and confirm Funnel is on:

```bash
docker compose exec bulletin-board tailscale status
docker compose exec bulletin-board tailscale funnel status
```

The hostname should match `TS_HOSTNAME` from your `.env`
(`electrical-bulletin-board` by default). From **your own laptop or
phone** (not the Docker host), visit:

```
https://electrical-bulletin-board.ratfish-regulus.ts.net/
```

Checklist:

- [ ] The actual app loads (not a bare JSON message, not a connection error)
- [ ] Registering a new test account works
- [ ] Logging in with that test account works
- [ ] Logging out works
- [ ] An unauthenticated request to the API is rejected:
      ```bash
      curl -i https://electrical-bulletin-board.ratfish-regulus.ts.net/me
      ```
      → expect **HTTP 401**
- [ ] A non-admin cannot self-promote:
      ```bash
      curl -i -X PUT https://electrical-bulletin-board.ratfish-regulus.ts.net/users/1 \
        -H "Content-Type: application/json" \
        -d '{"name":"x","gender":"x","description":"{\"isAdmin\":true}"}'
      ```
      → expect **HTTP 401** (no session cookie sent)

If anything fails, see Section 9 (Troubleshooting) before changing code.

---

## Section 7 — Day-2 operations

**View logs:**
```bash
docker compose logs -f
docker compose exec bulletin-board tail -f /var/log/gunicorn-error.log
docker compose exec bulletin-board tail -f /var/log/tailscaled.log
```

**Restart the app** (e.g. after editing `.env`):
```bash
docker compose restart
```

**Stop it** (container removed, volumes — and therefore your data and
Tailscale identity — kept):
```bash
docker compose down
```

**Redeploy after a code change:**
```bash
cd Digital_Bulletin_Board
git pull
cd alpine_instructions
docker compose up -d --build
```
The `tailscale-state` and `app-db` volumes are untouched by a rebuild, so
this picks up new code without re-authenticating Tailscale or losing data.

**Back up the database** (everything — every user, post, and password
hash — lives in the `app-db` volume, at `/app/instance/alex_prod.db`
inside the container):
```bash
docker compose exec bulletin-board \
  cp /app/instance/alex_prod.db /app/instance/alex_prod.db.bak

docker cp bulletin-board-alpine:/app/instance/alex_prod.db \
  ./alex_prod-$(date +%Y%m%d-%H%M%S).db
```
The second command copies it out onto your Docker host — do this
periodically if this app holds real data you care about.

**Import an existing database from another deployment** (e.g. migrating
from the systemd/Debian setup in `deployment.txt`, or another server
entirely):

1. Get `alex_prod.db` onto this Docker host. If the source server is
   already on the same tailnet (likely, if you're reading this), you can
   `scp` straight over Tailscale — no public access or port-forwarding
   needed:
   ```bash
   scp youruser@source-hostname.your-tailnet.ts.net:/path/to/instance/alex_prod.db .
   ```
2. Stop the app first, so nothing writes to the database mid-copy:
   ```bash
   docker compose stop
   ```
3. Copy the file straight into the `app-db` volume using a disposable
   Alpine container that mounts it — this works whether the app container
   is running or stopped, and needs no shell access inside it:
   ```bash
   docker run --rm \
     -v alpine_instructions_app-db:/data \
     -v "$PWD":/backup \
     alpine cp /backup/alex_prod.db /data/alex_prod.db
   ```
   (Volume name may differ — check `docker volume ls`; Compose prefixes it
   with the project folder name, e.g. `alpine_instructions_app-db`.)
4. If the migrated accounts' actual shared password differs from this
   deployment's `DEFAULT_USER_PASSWORD` in `.env`, update `.env` to match —
   otherwise only the "using default password" UI nudge banner will be
   wrong for those accounts (their real login still works either way,
   since that's checked against the actual per-account password hash
   already in the database, not this env var).
5. Restart and verify:
   ```bash
   docker compose up -d
   docker compose logs -f
   curl -s https://electrical-bulletin-board.ratfish-regulus.ts.net/users
   ```
   The last command should list the real migrated usernames instead of
   an empty `[]`.

**Fully wipe and start over** (deletes the database AND de-registers this
node from your tailnet — you'll need to re-authenticate per Section 5
afterward):
```bash
docker compose down -v
```

---

## Section 8 — Important: keep the CSRF/allowed-host list in sync

This app has a same-origin CSRF check (`app.py`,
`EXTRA_TRUSTED_ORIGIN_HOSTS`) and a Vite dev-server host allow-list
(`frontend/vite.config.ts`, only relevant if you ever run `npm run dev`
directly, which this Docker setup doesn't). Both must know the real public
hostname, or logins/registration will fail with "Cross-origin request
blocked" once traffic starts arriving through Funnel with a `Host` header
that doesn't match what the backend expects.

If you change `TS_HOSTNAME` in `.env` (or use a different tailnet), update
`EXTRA_TRUSTED_ORIGIN_HOSTS` and `VITE_EXTRA_ALLOWED_HOST` to match the new
`<hostname>.<your-tailnet>.ts.net`, then:

```bash
docker compose up -d --build   # VITE_EXTRA_ALLOWED_HOST is build-time, needs a rebuild
```

(`EXTRA_TRUSTED_ORIGIN_HOSTS` alone would only need `docker compose
restart`, but `VITE_EXTRA_ALLOWED_HOST` is baked into the JS bundle at
build time, so change both together and rebuild.)

---

## Section 9 — Troubleshooting

**`docker compose build` fails during `apk update`/`apk add` with
`temporary error (try again later)` on both `main` and `community`:**
→ A network/DNS blip reaching `dl-cdn.alpinelinux.org` from your Docker
host — common on fresh VPS/cloud instances. The `Dockerfile` already
retries this step 5 times with backoff before giving up, so a truly
transient blip resolves itself; if it still fails after 5 attempts:
```bash
# Confirm the host itself can reach Alpine's CDN:
curl -I https://dl-cdn.alpinelinux.org/alpine/v3.20/main/x86_64/APKINDEX.tar.gz

# If that also fails/hangs, it's your Docker host's DNS, not Alpine's CDN.
# Check what DNS the daemon is actually using containers with:
docker run --rm alpine:3.20 cat /etc/resolv.conf

# If it points at a resolver your containers can't actually reach (common
# with systemd-resolved's 127.0.0.53 stub), pin real DNS servers for
# Docker itself:
sudo tee /etc/docker/daemon.json <<'EOF'
{ "dns": ["1.1.1.1", "8.8.8.8"] }
EOF
sudo systemctl restart docker
```
Then just re-run `docker compose up -d --build`.

**Container exits immediately / `docker compose logs` shows a tailscaled
error about `/dev/net/tun`:**
→ Your Docker host won't grant the container a real TUN device (common on
some rootless Docker setups, certain managed platforms, or restrictive
CI runners). Set `TS_USERSPACE=true` in `.env` and re-run
`docker compose up -d --build`. This makes tailscaled use userspace
networking instead of a kernel TUN device — Funnel still works fine
since it only needs to reach `127.0.0.1:8000` inside the same container,
which doesn't require the tailscale0 interface.

**`docker compose logs -f` shows the login URL but never proceeds, even
after you visited it:**
→ Confirm you approved the *new device* in the Tailscale admin console
(Machines list) — some tailnets require manual approval for new devices
even after the login flow completes. Check **Settings → Device
management** for pending approvals.

**"Cross-origin request blocked" on login/register/any POST-PUT-DELETE:**
→ `EXTRA_TRUSTED_ORIGIN_HOSTS` (backend, restart is enough) or
`VITE_EXTRA_ALLOWED_HOST` (frontend, needs a rebuild) doesn't match the
hostname you're actually visiting. See Section 8.

**Site loads but shows raw JSON instead of the app:**
→ `frontend/dist/index.html` didn't get built into the image. Check the
`docker compose build` output for errors in the `frontend-builder` stage
(commonly a `frontend/package-lock.json` mismatch — try `docker compose
build --no-cache`).

**`tailscale funnel status` shows nothing, or the public URL 404s /
connection-refuses even though `tailscale status` shows the node
connected:**
→ Funnel isn't enabled for this node/tailnet yet — revisit Section 1,
steps 1–2 (HTTPS Certificates + Funnel access in the admin console), then:
```bash
docker compose exec bulletin-board \
  tailscale funnel --bg --https=443 http://127.0.0.1:8000
```

**"database is locked" errors under load:**
→ `entrypoint.sh` runs gunicorn with `--workers 1 --threads 4` on purpose —
SQLite only safely supports one writer at a time. Don't add more worker
*processes* (more threads is fine). If you outgrow SQLite, migrating to
Postgres is a separate, bigger change.

**Rebuilding after a `git pull` seems to reuse old code:**
→ Docker's layer cache can reuse the `COPY app.py .` / `COPY frontend/`
layers if it thinks nothing changed (rare, but happens with some
filesystem/mtime quirks). Force it with:
```bash
docker compose build --no-cache
docker compose up -d
```

---

## Section 10 — Security posture summary

This is a recap, not new setup — all of this is already built into
`app.py`, and applies the same way whether deployed via systemd
(`deployment.txt`) or this Docker/Alpine setup:

- Passwords are hashed (Werkzeug scrypt), never stored or returned in the
  clear.
- Sessions are opaque server-side tokens in an httpOnly cookie — not
  readable by JavaScript, not forgeable by editing localStorage.
- `isAdmin` is a protected database column — only the dedicated,
  admin-only endpoint can change it, and it refuses to demote the last
  remaining admin.
- `isPrivate` accounts (personal-use boards) are excluded from the public
  user list, 404 on direct lookup by id, and never editable by an admin.
- A same-origin check blocks state-changing requests whose Origin/Referer
  doesn't match a trusted host (Section 8).
- gunicorn binds to `127.0.0.1` **inside the container only** — there is
  no `ports:` mapping in `docker-compose.yml` exposing it to the Docker
  host's network, and Tailscale Funnel is the sole public entry point. No
  inbound firewall rule is needed on your Docker host for any of this to
  work.
- The container only receives `NET_ADMIN` / `NET_RAW` capabilities (needed
  for Tailscale to manage its own interface) — not full `--privileged`.

What this guide adds on top of the code's own protections: don't run the
Flask debug server in production (this setup always uses gunicorn), and
keep `EXTRA_TRUSTED_ORIGIN_HOSTS` / `VITE_EXTRA_ALLOWED_HOST` in sync with
wherever this app is actually reachable (Section 8).
