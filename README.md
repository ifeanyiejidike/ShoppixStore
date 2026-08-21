# Shoppix

**Shoppix** is a multi-vendor e-commerce marketplace built for the Nigerian
market — think Jumia or Konga's model, purpose-built and open. Independent
vendors apply, get approved, and list products under one platform; customers
browse a single catalog spanning every vendor, check out once, and pay by
Paystack or Opay. The platform takes a configurable commission per sale.

This repository is a **monorepo** containing both halves of the product as
independently deployable applications:

| App | Path | Stack | Purpose |
|---|---|---|---|
| **Frontend** | [`shoppix/`](./shoppix) | Next.js 16, React 19, TypeScript, Tailwind v4 | Customer- and vendor-facing web app |
| **Backend** | [`shoppix_backend/`](./shoppix_backend) | Django 5.2, Django REST Framework | REST API, business logic, payments |

Each app has its own README with stack-specific detail. This file covers the
project as a whole: what it does, how the pieces fit together, and how to get
both halves running together locally.

---

## Table of contents

- [What Shoppix does](#what-shoppix-does)
- [Architecture](#architecture)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Running with Docker](#running-with-docker)
- [Testing the API without the frontend](#testing-the-api-without-the-frontend)
- [Security & dependency auditing](#security--dependency-auditing)
- [Project status & documentation](#project-status--documentation)
- [Conventions](#conventions)
- [Deployment notes](#deployment-notes)
- [Troubleshooting](#troubleshooting)

---

## What Shoppix does

**For customers:** browse a multi-vendor product catalog with search,
category/price/stock/flash-sale filters, and per-vendor storefronts; add to
cart; check out against a saved Nigerian shipping address (state/LGA); pay by
Paystack or Opay; track and cancel orders; leave reviews on products they've
actually purchased.

**For vendors:** apply to sell (subject to admin approval); manage a product
catalog (create, edit, deactivate, flash-sale pricing); track and fulfill
incoming orders through a status pipeline (`paid → processing → shipped →
delivered`); see running sales totals.

**For the platform:** every sale is split into per-vendor line items with a
configurable commission rate baked in at time of sale, so historical orders
stay accurate even if rates change later; abandoned checkouts auto-cancel and
restock after a timeout; payment settlement is verified server-to-server via
gateway webhooks, never trusted from a client-side redirect alone.

## Architecture

```
                    ┌─────────────────────┐
                    │   Paystack / Opay    │
                    │   (payment gateways) │
                    └──────────▲───────────┘
                               │ webhook + verify
┌──────────────┐   REST API   │  ┌────────────────────┐
│   shoppix/    │◄────────────┴──►│  shoppix_backend/   │
│   Next.js 16  │  session+CSRF   │  Django 5.2 + DRF   │
│   (port 3000) │  cookie auth    │  (port 8000)        │
└──────────────┘                 └─────────┬───────────┘
                                            │
                          ┌─────────────────┼─────────────────┐
                          ▼                 ▼                 ▼
                     PostgreSQL          Redis          Celery worker
                     (or SQLite           (cache +        + beat
                      in dev)             broker)        (async tasks,
                                                          scheduled jobs)
```

- **Auth**: Django session cookies + CSRF token header — not JWT. The
  frontend's axios client reads the CSRF cookie fresh on every unsafe
  request rather than caching a token, which matters because Django
  **rotates the CSRF token on login** (see the backend README's
  troubleshooting section if you're scripting API calls directly).
- **Async work**: email sending, the stale-order auto-cancel sweep, and
  vendor/customer notifications run through Celery, backed by Redis. In
  local dev without Docker, `CELERY_TASK_ALWAYS_EAGER=True` runs these
  synchronously in-process instead — fine for development, **not** how
  it runs in production.
- **Payments**: both gateways sit behind a shared interface
  (`initialize` / `verify` / `verify_webhook_signature`) so the view layer
  never branches on which one a payment used.

## Repository layout

```
ShoppixStore/
├── shoppix/                 Next.js frontend
│   ├── src/
│   │   ├── app/              App Router pages (route = folder)
│   │   ├── components/       ui/ (shadcn primitives), shared/, products/,
│   │   │                     account/, vendor/, home/, auth/
│   │   ├── context/           Auth + cart React context
│   │   ├── hooks/             useAuth, useCart
│   │   └── lib/                api/ (typed backend client per domain),
│   │                            types.ts, schema.ts (zod), utils.ts
│   └── README.md              Frontend-specific docs
│
├── shoppix_backend/         Django REST API
│   ├── apps/
│   │   ├── accounts/          Auth, users, shipping addresses
│   │   ├── vendors/           Vendor onboarding, approval, storefronts
│   │   ├── catalog/           Categories, products, flash sales
│   │   ├── cart/               Cart, cart items
│   │   ├── orders/            Checkout, order lifecycle, fulfillment
│   │   ├── payments/           Paystack/Opay integration, webhooks
│   │   ├── reviews/            Verified-purchase-gated reviews
│   │   └── common/             Shared base models, permissions, pagination
│   ├── config/                 Django settings (base/dev/prod), URLs, Celery
│   ├── requests.http           Every endpoint, ready to run in VS Code/JetBrains
│   └── README.md               Backend-specific docs
│
├── docs/
│   └── project-context.md   Living architecture/decision/status record —
│                              see "Project status" below
├── .gitignore                Root-level, covers both apps
└── README.md                 This file
```

## Prerequisites

| Tool | Version | Used for |
|---|---|---|
| Python | 3.12+ | Backend |
| Node.js | 20+ | Frontend |
| npm | 10+ | Frontend package manager |
| Docker + Docker Compose | recent | Optional: full production-shaped stack (Postgres, Redis, Celery) |
| PostgreSQL | 16 | Production database (SQLite is fine for local dev) |
| Redis | 7 | Cache + Celery broker (only needed if not using `CELERY_TASK_ALWAYS_EAGER`) |

You don't need Docker, Postgres, or Redis for local development — SQLite and
Celery's eager mode cover that. They matter once you're running something
closer to production.

## Getting started

Run both apps at once — the frontend talks to the backend directly over
HTTP, there's no proxy layer in dev.

### 1. Backend (Django API — `:8000`)

```bash
cd shoppix_backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env for local dev without Docker:
#   DATABASE_URL=sqlite:///db.sqlite3
#   CELERY_TASK_ALWAYS_EAGER=True

python manage.py migrate
python manage.py seed_demo_data   # creates demo admin/vendor/customer accounts
python manage.py runserver
```

Demo accounts created by `seed_demo_data`:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@shoppix.com` | `Admin@12345` |
| Vendor (pre-activated, "TechHub Nigeria") | `vendor@shoppix.com` | `Vendor@12345` |
| Customer | `customer@shoppix.com` | `Customer@12345` |

API docs (Swagger UI): `http://localhost:8000/api/docs/`. Every endpoint is
also covered in `shoppix_backend/requests.http` — see
[Testing the API without the frontend](#testing-the-api-without-the-frontend).

### 2. Frontend (Next.js — `:3000`)

```bash
cd shoppix
npm install
cp .env.example .env    # already points at http://localhost:8000 by default
npm run dev
```

Open `http://localhost:3000`. Log in with one of the demo accounts above.

### Verifying the setup

```bash
# Backend
cd shoppix_backend && python manage.py check

# Frontend
cd shoppix && npx tsc --noEmit && npx eslint src && npm run build
```

`npm run build` runs a full production build, which is stricter than `npm
run dev` and will surface things dev mode silently tolerates.

## Environment variables

Both apps follow the same pattern: `.env.example` is the only file tracked
in git; every real `.env*` variant is gitignored. See each app's own README
for the full variable reference — the short version:

**`shoppix_backend/.env`**: `DJANGO_SECRET_KEY`, `DATABASE_URL`, `REDIS_URL`,
`CORS_ALLOWED_ORIGINS`/`CSRF_TRUSTED_ORIGINS` (must match the frontend's
origin), `PAYSTACK_SECRET_KEY`/`OPAY_SECRET_KEY` (test keys are fine for
dev), plus email, commission-rate, and order-timeout settings.

**`shoppix/.env`**: `NEXT_PUBLIC_API_URL` (backend origin, **without** an
`/api` suffix — the client appends that itself) and `NEXT_PUBLIC_SITE_URL`.
The frontend additionally supports `.env.local` (personal overrides, highest
precedence) and `.env.production` (filled in at deploy time) — see the
frontend README.

## Running with Docker

The backend has a full production-shaped Docker setup (Postgres, Redis,
Django/gunicorn, Celery worker, Celery beat):

```bash
cd shoppix_backend
cp .env.example .env   # fill in real Paystack/Opay keys, a real secret key, etc.
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

The dev override (`docker-compose.dev.yml`) bind-mounts source for live
reload and runs Django's dev server instead of gunicorn. Drop it for a
production-shaped run:

```bash
docker compose up --build
```

The frontend isn't containerized yet (see `docs/project-context.md` → Open Gaps).
Run it separately with `npm run dev` or `npm run build && npm start` against
whichever backend URL is in `shoppix/.env`.

## Testing the API without the frontend

`shoppix_backend/requests.http` covers **every** endpoint in the API,
organized by domain, with realistic example payloads. Open it in VS Code
with the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
extension (or JetBrains' built-in HTTP client) and click "Send Request"
above any block.

**Read the note at the top of that file before scripting logins yourself**:
Django rotates the CSRF token on login as a security measure, so a token
fetched before login is stale immediately after — `requests.http` handles
this correctly (fetch → login → re-fetch → then write), but it's a common
gotcha if you're writing your own scripts against this API.

## Security & dependency auditing

Both apps are audited clean as of the last check:

```bash
cd shoppix && npm audit                              # 0 vulnerabilities
cd shoppix_backend && pip install pip-audit && pip-audit   # 0 vulnerabilities
```

Re-run both after any dependency bump. Two things worth knowing if you're
touching dependencies:

- **Backend runs Django 5.2 (LTS), not 5.1.** Django 5.1.x was found to have
  a CVE with no fix released anywhere in that branch — it had stopped
  receiving security patches. Don't downgrade without checking Django's
  supported-versions page first.
- **Frontend fonts are self-hosted** via `@fontsource`/`@fontsource-variable`
  packages, not `next/font/google`. `next/font/google` needs live network
  access to Google's font CDN at *build* time with no fallback — this broke
  `next build` outright in a network-restricted test environment during
  development. If you ever touch the font setup, keep it self-hosted, or at
  minimum verify `npm run build` still succeeds somewhere without internet
  access to Google's servers.

## Project status & documentation

**`docs/project-context.md`** is the living source of truth for
what's built, what's been verified (vs. still assumed), open product
decisions, and architecture rationale — organized by feature, with an
explicit "Open Gaps" section rather than letting unstated assumptions hide
in the code. If something here in the README and something in
`docs/project-context.md` disagree, **`docs/project-context.md` wins** — update it,
not this file, when a real project decision changes.

Highlights as of the last update:
- Backend: full REST API, verified against live HTTP requests (not just
  unit tests) — see `docs/project-context.md` §4 for feature-by-feature status.
- Frontend: feature-complete for the core marketplace flow (browse → vendor
  storefronts → cart → checkout → account/order management, plus the
  vendor apply → dashboard → fulfill flow), verified via `tsc`, `eslint`,
  a full production build, and live HTTP checks against the running dev
  server — **not** yet by a human looking at it in an actual browser
  (see `docs/project-context.md` §10).
- Open gaps needing your input before production: payout/vendor-disbursement
  automation, hosting target, SMTP provider, real payment gateway
  credentials, and a few explicit product-policy questions — all listed
  in `docs/project-context.md` §10.

## Conventions

- **Commits**: conventional-commit style (`feat(scope): ...`, `fix(scope):
  ...`, `chore(scope): ...`), scoped to `backend` or `frontend` (or both,
  when a change genuinely spans them), since this is a monorepo with two
  independent apps sharing one git history.
- **Design system**: `shoppix/src/app/globals.css` — a custom palette
  (Ink/Canvas/Marigold/Jade/Coral), a Fraunces/Inter/IBM Plex Mono type
  system, and a signature die-cut "price tag" component motif. Not default
  shadcn/ui styling — see the frontend README for the full rationale.
- **Business logic placement (backend)**: multi-step transactional logic
  (checkout, payment settlement) lives in `services.py` per app, not in
  views, so it's reusable from webhooks, admin actions, and scheduled tasks
  without duplication.

## Deployment notes

Nothing here is deployed anywhere yet. Before going further than local
development:

1. Choose a hosting target for both apps (not yet decided — see
   `docs/project-context.md` §10).
2. Provision real Postgres + Redis instances, an SMTP provider, an S3 bucket
   (or equivalent) for media, and real Paystack/Opay live keys.
3. Set `DEBUG=False`, a real `DJANGO_SECRET_KEY`, and run behind HTTPS —
   `config/settings/prod.py` already sets `SECURE_SSL_REDIRECT`,
   `SESSION_COOKIE_SECURE`, HSTS, etc., but only takes effect when
   `DJANGO_SETTINGS_MODULE=config.settings.prod`.
4. Decide on a CI/CD pipeline — none exists yet.
5. Review `docs/project-context.md` §8 (Constraints & Guardrails) and §10 (Open
   Gaps) — several of these are explicit blockers, not just nice-to-haves,
   for a production launch (e.g., no data-retention/privacy policy review
   has happened yet, and this app handles PII and payment references).

## Troubleshooting

**Frontend can't reach the backend / CORS errors**: check that
`NEXT_PUBLIC_API_URL` (frontend) and `CORS_ALLOWED_ORIGINS` /
`CSRF_TRUSTED_ORIGINS` (backend) actually match each other's origins.

**403 "CSRF token incorrect" when scripting API calls**: you're almost
certainly reusing a CSRF token fetched before login — Django rotates it on
login. Re-fetch `GET /api/accounts/csrf/` after logging in, before your next
write request. See `requests.http`'s header comment for the full pattern.

**`next build` fails with a font-related network error**: something
reintroduced a `next/font/google` dependency, or a font package didn't
install correctly. Fonts in this project are self-hosted specifically to
avoid this class of failure — see
[Security & dependency auditing](#security--dependency-auditing).

**Stale orders never get cancelled**: the auto-cancel sweep runs on Celery
Beat (`apps.orders.tasks.cancel_stale_orders`), which needs an actual
`celery beat` process running alongside a worker — it will not fire if
you're only running `manage.py runserver` without also running Celery.
