from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.middleware.proxy_fix import ProxyFix
from datetime import datetime, timedelta
from functools import wraps
from urllib.parse import urlparse
import pymysql
import secrets
import hashlib
import json
import os
pymysql.install_as_MySQLdb()


def _load_dotenv(path=".env"):
    """Minimal, dependency-free .env loader — local/dev convenience only.
    Real deployments should set these as actual environment variables
    (see deployment.txt's systemd unit `Environment=` directives); this
    just saves re-exporting them by hand while developing. Never commit
    the .env file itself — it's gitignored."""
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())


_load_dotenv()

app = Flask(__name__, static_folder="frontend/dist", static_url_path="")

# Trust one hop of X-Forwarded-* headers — this app is normally reached
# through a reverse proxy (Tailscale Funnel terminates TLS and forwards to
# this process over plain HTTP on localhost). Without this, request.host and
# request.is_secure reflect the local hop (e.g. 127.0.0.1:5000 over http)
# instead of the real public host/scheme, which breaks both the CSRF
# same-origin check below and the session cookie's Secure flag.
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

# Database config
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///alex_prod.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# Set DEFAULT_USER_PASSWORD in the environment (or a local, gitignored
# .env file — see _load_dotenv above) rather than hardcoding a real shared
# password here, since this file is version-controlled.
DEFAULT_USER_PASSWORD = os.environ.get("DEFAULT_USER_PASSWORD", "ChangeMe123!")

# Fallback allow-list for the CSRF same-origin check below, in case the
# proxy in front of this app doesn't forward X-Forwarded-Host (so ProxyFix
# has nothing to correct request.host with). EXTRA_TRUSTED_ORIGIN_HOSTS is
# a comma-separated list of additional public hostnames this app gets
# served from (e.g. a Tailscale Funnel hostname) — keep it in sync with
# frontend/vite.config.ts's VITE_EXTRA_ALLOWED_HOST. Set via the
# environment / .env, not hardcoded here, since this file is
# version-controlled.
TRUSTED_ORIGIN_HOSTS = {
    "127.0.0.1:5000",
    "localhost:5000",
    "127.0.0.1:5173",
    "localhost:5173",
} | {h.strip() for h in os.environ.get("EXTRA_TRUSTED_ORIGIN_HOSTS", "").split(",") if h.strip()}

SESSION_COOKIE_NAME = "session_token"
SESSION_TTL = timedelta(days=14)
SESSION_RENEW_THRESHOLD = timedelta(days=1)  # lazily renew once expiry is within 1 day


def _hash_password_in_description(raw_description):
    """Before writing to disk: if the description JSON carries a plaintext
    'password' field, replace it with a salted hash so it's never stored
    (or later returned) in the clear. Also strips 'isAdmin' — that's a
    protected column now, never a client-writable JSON field."""
    if not raw_description:
        return raw_description
    try:
        data = json.loads(raw_description)
    except (TypeError, ValueError):
        return raw_description
    if not isinstance(data, dict):
        return raw_description
    data.pop("isAdmin", None)
    data.pop("isPrivate", None)
    if data.get("password"):
        data["password"] = generate_password_hash(str(data["password"]))
    return json.dumps(data)


def _merge_and_hash_description(existing_raw, incoming_raw):
    """Every GET/login response strips the password hash out of the
    description JSON before it ever reaches the client, so the client can
    no longer round-trip it back on an unrelated update (bio edit, admin
    action, post save, etc). If the incoming payload doesn't explicitly set
    a new password, carry the existing hash forward instead of losing it.
    Also strips 'isAdmin' — protected column, not writable through here."""
    if not incoming_raw:
        return incoming_raw
    try:
        incoming = json.loads(incoming_raw)
    except (TypeError, ValueError):
        return incoming_raw
    if not isinstance(incoming, dict):
        return incoming_raw

    incoming.pop("isAdmin", None)
    incoming.pop("isPrivate", None)

    if incoming.get("password"):
        incoming["password"] = generate_password_hash(str(incoming["password"]))
    else:
        existing_hash = None
        if existing_raw:
            try:
                existing = json.loads(existing_raw)
                if isinstance(existing, dict):
                    existing_hash = existing.get("password")
            except (TypeError, ValueError):
                existing_hash = None
        if existing_hash:
            incoming["password"] = existing_hash

    return json.dumps(incoming)


def _description_has_new_password(raw_description):
    if not raw_description:
        return False
    try:
        data = json.loads(raw_description)
    except (TypeError, ValueError):
        return False
    return isinstance(data, dict) and bool(data.get("password"))


def _sanitize_description_for_read(raw_description, can_view_archive=False):
    """Before sending to any client: strip the password hash out entirely
    and replace it with a boolean the UI can safely use to nudge users off
    the shared default password. Also strips 'archivedPosts' unless the
    caller is allowed to see this account's archive (see
    _can_view_archive) — archived posts are otherwise as visible as the
    rest of the account's JSON blob, which isn't what "archive" is
    supposed to mean."""
    if not raw_description:
        return raw_description
    try:
        data = json.loads(raw_description)
    except (TypeError, ValueError):
        return raw_description
    if not isinstance(data, dict):
        return raw_description

    if "password" in data:
        stored_hash = data.pop("password")
        try:
            data["usingDefaultPassword"] = bool(stored_hash) and check_password_hash(
                stored_hash, DEFAULT_USER_PASSWORD
            )
        except Exception:
            data["usingDefaultPassword"] = False

    if not can_view_archive:
        data.pop("archivedPosts", None)

    return json.dumps(data)


def _can_view_archive(target_user, viewer):
    """Who may see a given account's archived posts: the account's own
    owner always; an administrator only for a non-private account (a
    private account's archive is off-limits to everyone but its owner,
    same as the rest of that account)."""
    if not viewer:
        return False
    if viewer.id == target_user.id:
        return True
    if target_user.is_private:
        return False
    return bool(viewer.is_admin)


# -----------------------------------------------------------------------
# Session helpers — opaque server-side tokens in an httpOnly cookie. Only a
# hash of the token is stored, so a DB dump alone can't be replayed as a
# live session.
# -----------------------------------------------------------------------

def _hash_token(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _create_session(user):
    token = secrets.token_urlsafe(32)
    row = Session(
        token_hash=_hash_token(token),
        user_id=user.id,
        expires_at=datetime.utcnow() + SESSION_TTL,
    )
    db.session.add(row)
    db.session.commit()
    return token


def _get_session_user():
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        return None
    row = Session.query.filter_by(token_hash=_hash_token(token)).first()
    if not row:
        return None

    now = datetime.utcnow()
    if row.expires_at < now:
        db.session.delete(row)
        db.session.commit()
        return None

    # Lazy sliding renewal — only write to the DB once we're getting close to
    # expiry, not on every single request.
    if row.expires_at - now < SESSION_TTL - SESSION_RENEW_THRESHOLD:
        row.expires_at = now + SESSION_TTL
        db.session.commit()

    return User.query.get(row.user_id)


def _set_session_cookie(response, token):
    response.set_cookie(
        SESSION_COOKIE_NAME,
        token,
        max_age=int(SESSION_TTL.total_seconds()),
        httponly=True,
        secure=request.is_secure,
        samesite="Lax",
        path="/",
    )


def _clear_session_cookie(response):
    response.delete_cookie(SESSION_COOKIE_NAME, path="/")


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        user = _get_session_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        request.current_user = user
        return f(*args, **kwargs)
    return wrapper


def admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        user = _get_session_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        if not user.is_admin:
            return jsonify({"error": "Administrator access required"}), 403
        request.current_user = user
        return f(*args, **kwargs)
    return wrapper


# -----------------------------------------------------------------------
# CSRF guard — the session cookie rides along automatically on any request
# a browser makes, so state-changing requests must prove they actually
# originated from this app's own origin. Requests with no Origin/Referer at
# all (plain curl/Postman) are allowed through here; the login/admin
# decorators above are the real gate for those.
# -----------------------------------------------------------------------

@app.before_request
def csrf_guard():
    if request.method in ("POST", "PUT", "DELETE"):
        source = request.headers.get("Origin") or request.headers.get("Referer")
        if source:
            try:
                host = urlparse(source).netloc
            except Exception:
                host = None
            if host != request.host and host not in TRUSTED_ORIGIN_HOSTS:
                return jsonify({"error": "Cross-origin request blocked"}), 403


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response

@app.route("/users/<path:dummy>", methods=["OPTIONS"])
@app.route("/users", methods=["OPTIONS"])
@app.route("/login", methods=["OPTIONS"])
@app.route("/logout", methods=["OPTIONS"])
@app.route("/me", methods=["OPTIONS"])
def handle_options(dummy=None):
    return "", 200

# Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    gender = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(200), nullable=True)
    is_admin = db.Column(db.Boolean, nullable=False, default=False)
    # Private/personal accounts: never returned by GET /users (the public
    # directory backing Team Overview, board switching, and the standard
    # login list), and never editable by anyone but the account owner —
    # regardless of admin status. They sign in through a dedicated login
    # flow, not the shared user list.
    is_private = db.Column(db.Boolean, nullable=False, default=False)


class Session(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    token_hash = db.Column(db.String(64), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)


with app.app_context():
    db.create_all()

@app.route("/")
def index():
    if os.path.exists(os.path.join(app.static_folder, "index.html")):
        return send_from_directory(app.static_folder, "index.html")
    return jsonify({"message": "Flask API is running", "endpoints": ["/users", "/users/<user_id>", "/login", "/logout", "/me"]})

# -----------------------------
# LOG IN (verifies password server-side; never echoes it back)
# -----------------------------
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    name = data.get("name")
    password = data.get("password")

    if not name or not password:
        return jsonify({"error": "Username and password are required"}), 400

    user = User.query.filter_by(name=name).first()
    if not user:
        return jsonify({"error": "Invalid username or password"}), 401

    try:
        stored = json.loads(user.description) if user.description else {}
    except (TypeError, ValueError):
        stored = {}

    stored_hash = stored.get("password") if isinstance(stored, dict) else None
    valid = False
    if stored_hash:
        try:
            valid = check_password_hash(stored_hash, password)
        except Exception:
            valid = False

    if not valid:
        return jsonify({"error": "Invalid username or password"}), 401

    token = _create_session(user)
    resp = jsonify({
        "id": user.id,
        "name": user.name,
        "gender": user.gender,
        "isAdmin": user.is_admin,
        "isPrivate": user.is_private,
        "description": _sanitize_description_for_read(user.description, can_view_archive=True),
    })
    _set_session_cookie(resp, token)
    return resp

# -----------------------------
# LOG OUT
# -----------------------------
@app.route("/logout", methods=["POST"])
def logout():
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if token:
        Session.query.filter_by(token_hash=_hash_token(token)).delete()
        db.session.commit()
    resp = jsonify({"message": "Logged out"})
    _clear_session_cookie(resp)
    return resp

# -----------------------------
# CURRENT SESSION
# -----------------------------
@app.route("/me", methods=["GET"])
def me():
    user = _get_session_user()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    return jsonify({
        "id": user.id,
        "name": user.name,
        "gender": user.gender,
        "isAdmin": user.is_admin,
        "isPrivate": user.is_private,
        "description": _sanitize_description_for_read(user.description, can_view_archive=True),
    })

# -----------------------------
# GET ALL USERS — the public directory backing Team Overview, the board
# switcher, the admin dashboard, and the standard login list. Private/
# personal accounts are deliberately excluded here unconditionally (even
# from admins) — their board is only ever reachable through their own
# session via /me.
# -----------------------------
@app.route("/users", methods=["GET"])
def get_users():
    actor = _get_session_user()
    users = User.query.filter_by(is_private=False).all()
    return jsonify([
        {
            "id": u.id,
            "name": u.name,
            "gender": u.gender,
            "isAdmin": u.is_admin,
            "isPrivate": u.is_private,
            "description": _sanitize_description_for_read(
                u.description, can_view_archive=_can_view_archive(u, actor)
            ),
        }
        for u in users
    ])

# -----------------------------
# GET ONE USER — a private account 404s for anyone but its own session, so
# it can't be discovered or read by guessing/iterating ids either.
# -----------------------------
@app.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    actor = _get_session_user()
    if user.is_private and (not actor or actor.id != user.id):
        return jsonify({"error": "User not found"}), 404
    return jsonify({
        "id": user.id,
        "name": user.name,
        "gender": user.gender,
        "isAdmin": user.is_admin,
        "isPrivate": user.is_private,
        "description": _sanitize_description_for_read(
            user.description, can_view_archive=_can_view_archive(user, actor)
        ),
    })

# -----------------------------
# CREATE USER (POST) — registration stays open to anyone; auto-signs the
# new account in the same way /login does.
# -----------------------------
@app.route("/users", methods=["POST"])
def create_user():
    data = request.get_json() or {}

    if not data.get("name"):
        return jsonify({"error": "Field 'name' is required"}), 400

    if not data.get("gender"):
        return jsonify({"error": "Field 'gender' is required"}), 400

    is_first_user = User.query.count() == 0

    new_user = User(
        name=data.get("name"),
        gender=data.get("gender"),
        description=_hash_password_in_description(data.get("description")),
        is_admin=is_first_user,
        is_private=bool(data.get("isPrivate", False)),
    )

    db.session.add(new_user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": f"A user named '{data.get('name')}' already exists"}), 400

    token = _create_session(new_user)
    resp = jsonify({
        "message": "User created",
        "id": new_user.id,
        "isAdmin": new_user.is_admin,
        "isPrivate": new_user.is_private,
    })
    _set_session_cookie(resp, token)
    return resp, 201

# -----------------------------
# UPDATE USER (PUT) — only the account owner or an admin may edit it, and
# 'isAdmin' is never a field this endpoint reads — see /users/<id>/admin.
# -----------------------------
@app.route("/users/<int:user_id>", methods=["PUT"])
@login_required
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    actor = request.current_user
    if user.is_private:
        # Private accounts are off-limits to everyone but their own owner —
        # not even an admin override, unlike normal accounts.
        if actor.id != user.id:
            return jsonify({"error": "User not found"}), 404
    elif actor.id != user.id and not actor.is_admin:
        return jsonify({"error": "You can only edit your own account"}), 403

    data = request.get_json() or {}

    if not data.get("name"):
        return jsonify({"error": "Field 'name' is required"}), 400

    incoming_description = data.get("description")
    changing_password = _description_has_new_password(incoming_description)

    user.name = data.get("name")
    user.gender = data.get("gender")
    user.description = _merge_and_hash_description(user.description, incoming_description)

    db.session.commit()

    if changing_password:
        # Setting a new password logs out every other session on this
        # account — the classic "kick out anyone who had it before" step.
        current_token = request.cookies.get(SESSION_COOKIE_NAME)
        current_hash = _hash_token(current_token) if current_token else None
        q = Session.query.filter_by(user_id=user.id)
        if current_hash:
            q = q.filter(Session.token_hash != current_hash)
        q.delete(synchronize_session=False)
        db.session.commit()

    return jsonify({"message": "User updated"})

# -----------------------------
# GRANT / REVOKE ADMIN — the only route that may change is_admin, and only
# an existing admin may call it.
# -----------------------------
@app.route("/users/<int:user_id>/admin", methods=["POST"])
@admin_required
def set_admin_status(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}
    if "isAdmin" not in data:
        return jsonify({"error": "Field 'isAdmin' is required"}), 400
    new_status = bool(data["isAdmin"])

    if user.is_admin and not new_status:
        remaining_admins = User.query.filter_by(is_admin=True).count()
        if remaining_admins <= 1:
            return jsonify({"error": "At least one administrator must remain"}), 400

    user.is_admin = new_status
    db.session.commit()
    return jsonify({"message": "Admin status updated", "id": user.id, "isAdmin": user.is_admin})

# -----------------------------
# DELETE USER — admin-only, enforced server-side.
# -----------------------------
@app.route("/users/<int:user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    user = User.query.get_or_404(user_id)

    if user.is_admin:
        remaining_admins = User.query.filter_by(is_admin=True).count()
        if remaining_admins <= 1:
            return jsonify({"error": "Cannot delete the last remaining administrator"}), 400

    Session.query.filter_by(user_id=user.id).delete()
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted"})

if __name__ == "__main__":
    app.run(debug=True)
