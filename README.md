# ShoppixStore

Shoppix is a multi-vendor e-commerce marketplace for the Nigerian market
(Jumia/Konga-style) — independent vendors list and sell products under a
single platform, with Paystack and Opay handling payment.

This is a monorepo with two independently-deployable apps:

```
ShoppixStore/
├── shoppix/           Next.js 16 frontend (customer + vendor-facing UI)
├── shoppix-backend/   Django REST API backend
├── .gitignore         Root-level, covers both apps (see below)
└── README.md          This file
```

For anything beyond the quick-start below — architecture decisions, feature
acceptance criteria, open gaps, and what's actually been verified vs. still
assumed — see **`project-context.md`** at the repo root. That file is the
source of truth for project status; keep it updated as things change rather
than letting this README drift out of sync with it.

## Quick start (local development)

You need both apps running at once — the frontend calls the backend directly,
there's no proxy layer between them in dev.

### 1. Backend (Django API — runs on :8000)

```bash
cd shoppix-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env — for local dev without Docker, set:
#   DATABASE_URL=sqlite:///db.sqlite3
#   CELERY_TASK_ALWAYS_EAGER=True

python manage.py migrate
python manage.py seed_demo_data   # creates admin/vendor/customer test accounts
python manage.py runserver
```

Demo accounts (from `seed_demo_data`):
- **Admin:** admin@shoppix.com / Admin@12345
- **Vendor:** vendor@shoppix.com / Vendor@12345 (pre-activated, "TechHub Nigeria")
- **Customer:** customer@shoppix.com / Customer@12345

API docs: `http://localhost:8000/api/docs/`. Every endpoint is also covered
in `shoppix-backend/requests.http` — open it with the VS Code "REST Client"
extension (or JetBrains' built-in HTTP client) to test the whole API without
touching the frontend.

### 2. Frontend (Next.js — runs on :3000)

```bash
cd shoppix
npm install
cp .env.example .env    # already points at http://localhost:8000 by default
npm run dev
```

Open `http://localhost:3000`.

### Full stack via Docker (backend only, production-shaped)

```bash
cd shoppix-backend
cp .env.example .env   # fill in real Paystack/Opay keys, secret key, etc.
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Brings up Postgres, Redis, the Django app, and Celery worker/beat together.
The frontend isn't containerized yet — run it separately with `npm run dev`
or `npm run build && npm start` against whichever backend URL is in `.env`.

## Environment files

Both apps follow the same pattern: `.env.example` is the only tracked
template; every real `.env*` variant is gitignored.

**`shoppix-backend/`**: `.env` (local secrets/config, gitignored), `.env.example` (tracked template).

**`shoppix/`**: `.env` (active local config), `.env.local` (personal overrides, highest precedence in Next.js's loading order), `.env.production` (filled in at deploy time), `.env.example` (tracked template). All but `.env.example` are gitignored.

## Repo-wide conventions

- **Commits**: conventional-commit style (`feat(scope): ...`, `fix(scope): ...`, `chore(scope): ...`), scoped to `backend` or `frontend` (or both, when a change genuinely spans them) since this is a monorepo with two independent apps sharing one git history.
- **Source of truth for status/decisions**: `project-context.md` at the repo root, not this README. Update it, not this file, when a real project decision changes.
- **Design system**: see `shoppix/src/app/globals.css` for the token system (palette, type scale, the signature price-tag component pattern) — this is the frontend's actual design system, not shadcn/ui defaults.

## What's built so far

- **Backend**: full REST API — accounts/auth (session+CSRF), vendor onboarding & approval, multi-vendor product catalog, cart, checkout with stock-locking, Paystack/Opay payment integration with webhook settlement, stale-order auto-cancellation, and verified-purchase-gated reviews. Verified against live HTTP requests, not just static checks — see `project-context.md` Section 4 for feature-by-feature status.
- **Frontend**: in progress — design system and data/API layer are being rebuilt against the new backend; UI pages are being rebuilt page by page. Check `project-context.md` for current status before assuming a given page is done.
