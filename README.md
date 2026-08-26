# Bulletin Board - Multi-User Digital Bulletin Board Dashboard

A clean, modern, state-of-the-art web dashboard supporting multi-user personal and public bulletin boards organized into four distinct categories:
- 🔵 **Ongoing Works**: Active projects, operational tasks, and current focus items with completion percentage tracking.
- 🟡 **Upcoming Works**: Planned future initiatives, upcoming deadlines, and milestone targets.
- 🌸 **Holiday Works**: Scheduled coverage during leave, emergency on-call handovers, and vacation maintenance checklists.
- 🟢 **Completed Works**: Automatically captures tasks marked as `Completed`, with finished timestamps and one-click restore.

---

## 🌟 Key Features & Redesigned Public Homepage

### 1. Clean Public Homepage & Visibility Rules
- **Uncluttered Guest View**: When browsing without logging in, the public homepage displays a clean read-only view.
- **Hidden Modification Controls for Guests**:
  - `+ New Post` button in the Navbar is hidden.
  - `+ Add Item` buttons in Category columns are hidden.
  - `Edit`, `Delete`, and `Reopen` action buttons on cards are hidden.
  - Status badges render as clean, non-clickable indicators.
- **Board Switcher**: Public visitors can inspect any team member's bulletin board from a clean dropdown.
- **One-Click Sign In**: Prominent "Sign In to Post & Edit" CTA button to open the authentication modal.

### 2. User Authentication & Default Password
- **Default Password for All Users**: configurable via the `DEFAULT_USER_PASSWORD` environment variable (backend) and `VITE_DEFAULT_PASSWORD` (frontend) — see [Environment Configuration](#-environment-configuration) below. Never hardcoded in source.
  - All existing accounts and newly registered accounts use the configured default password unless changed.
  - Custom passwords can be set during registration or profile editing.
- **Login Modal**: Includes quick 1-click user selection chips, password show/hide toggle, and instant feedback.
- **Session Management**: Full support for logging in, switching accounts, and signing out.

### 3. Personal Dashboard & CRUD Operations (Authenticated)
- **Adding & Editing Posts**: Only visible and accessible after signing in.
- **Automatic Completed Card Movement**: Marking any task as `Completed` automatically transitions it into the **Completed Works** section with a completion timestamp.
- **One-Click Status Cycling**: Fast status progression (`Pending` ➔ `In Progress` ➔ `Under Review` ➔ `Completed`).
- **Team Overview Matrix**: Cross-organizational board showing workload distribution and a master team feed.

---

## 🔌 API Integration & Architecture

This application consumes the existing Flask REST API without inventing new endpoints:

- **`GET /users`**: Fetches all registered users.
- **`GET /users/<id>`**: Fetches a single user record.
- **`POST /users`**: Creates a new user record with `{"name": "...", "description": "..."}`.
- **`PUT /users/<id>`**: Updates user name and description payload.
- **`DELETE /users/<id>`**: Deletes a user record.

The bulletin posts, category assignments, statuses, tags, dates, and profile metadata (including password) are serialized into JSON format within the user's `description` field, maintaining 100% compatibility with the pre-existing Flask model and SQLite schema.

---

## 🔧 Environment Configuration

Neither the shared default password nor any deployment-specific public hostname is hardcoded in source — both are read from environment variables, since this is a version-controlled repo.

Create a `.env` file in the project root (gitignored, never committed):
```
DEFAULT_USER_PASSWORD=YourChosenDefaultPassword
EXTRA_TRUSTED_ORIGIN_HOSTS=your-public-hostname.example.com
```

And a `frontend/.env` file (also gitignored):
```
VITE_DEFAULT_PASSWORD=YourChosenDefaultPassword
VITE_EXTRA_ALLOWED_HOST=your-public-hostname.example.com
```

`VITE_DEFAULT_PASSWORD` should match `DEFAULT_USER_PASSWORD` exactly — the frontend copy is only used for UI hint text, never for actual authentication. `EXTRA_TRUSTED_ORIGIN_HOSTS` / `VITE_EXTRA_ALLOWED_HOST` are only needed if you're serving this behind a reverse proxy or tunnel (e.g. Tailscale Funnel) with its own public hostname — see `deployment.txt` for the full guide. Without a `.env` file, sensible local-dev placeholders are used instead.

---

## 🚀 Quick Start Instructions

### 1. Start the Flask Backend Server
```bash
# In project root D:\alex_api_profile
python app.py
```
The Flask API will run at `http://127.0.0.1:5000`.

### 2. Start the React Frontend Dev Server
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Default Login Credentials
- **Password**: whatever you set `DEFAULT_USER_PASSWORD` to in `.env` (see [Environment Configuration](#-environment-configuration) above).
- **Users**: Select any user (e.g. `Alexander`, `John Robert`) and enter that password.
