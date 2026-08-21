# Shoppix — Backend

Django REST API for Shoppix, a multi-vendor e-commerce marketplace for the
Nigerian market. Handles auth, vendor onboarding, the product catalog, cart/
checkout, Paystack/Opay payments, and order fulfillment.

For what the project *is* as a whole, see the [root README](../README.md).
For architecture decisions, feature-by-feature status, and open product
decisions, see [`project-context.md`](../project-context.md) at the repo
root — read its **Open Gaps** section before assuming any policy question
(commission handling, moderation, review gating, etc.) is settled.

## Table of contents

- [Tech stack](#tech-stack)
- [App structure](#app-structure)
- [Prerequisites](#prerequisites)
- [Setup — local dev, no Docker](#setup--local-dev-no-docker)
- [Setup — Docker](#setup--docker)
- [Environment variables](#environment-variables)
- [Database & migrations](#database--migrations)
- [Demo data](#demo-data)
- [Running Celery](#running-celery)
- [API documentation](#api-documentation)
- [Testing](#testing)
- [Security & dependencies](#security--dependencies)
- [Business rules & product decisions](#business-rules--product-decisions)
- [Connecting the frontend](#connecting-the-frontend)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Django 5.2 (LTS) + Django REST Framework |
| Database | PostgreSQL 16 (prod/Docker), SQLite (local dev) |
| Cache / broker | Redis, via `django-redis` and Celery |
| Async tasks | Celery + Celery Beat (scheduled jobs) |
| API docs | drf-spectacular (OpenAPI, Swagger UI, Redoc) |
| Payments | Paystack + Opay, behind a shared gateway interface |
| Auth | Django session cookies + CSRF header (not JWT) |
| Static/media | Whitenoise (static), django-storages + S3 (prod media) |
| Error monitoring | Sentry (wired, inactive until `SENTRY_DSN` is set) |

## App structure

Each Django app owns one domain. Business logic that spans multiple steps
(checkout, payment settlement) lives in a `services.py` module per app
rather than in views, so it's reusable from webhooks, admin actions, and
scheduled tasks without duplicating transaction/locking logic.

| App | Owns |
|---|---|
| `accounts` | Custom `User` model (email-based), auth (register/login/logout/password reset/email verification), `ShippingAddress` |
| `vendors` | `Vendor` model, onboarding application, admin approval, public storefronts |
| `catalog` | `Category`, `Product`, flash-sale logic, vendor-scoped product management |
| `cart` | `Cart`, `CartItem` |
| `orders` | Checkout (stock-locked via `select_for_update`), `Order`/`OrderItem`, fulfillment status, stale-order auto-cancel |
| `payments` | `Payment`, Paystack/Opay gateway clients, webhook settlement |
| `reviews` | Verified-purchase-gated product reviews |
| `common` | Shared abstract base model, pagination, permissions, exception handling, request-ID logging middleware |

## Prerequisites

- Python 3.12+
- pip
- (Optional, for Docker) Docker + Docker Compose
- (Optional, for non-eager Celery) Redis 7

## Setup — local dev, no Docker

```bash
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Minimum edits for local dev:
#   DATABASE_URL=sqlite:///db.sqlite3
#   CELERY_TASK_ALWAYS_EAGER=True   (runs async tasks synchronously —
#                                     no Redis/worker needed for dev)

python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver
```

Server runs at `http://localhost:8000`.

## Setup — Docker

Production-shaped: Postgres, Redis, Django (gunicorn), Celery worker, Celery
beat, all together.

```bash
cp .env.example .env   # fill in real secret key, Paystack/Opay keys, etc.

# Dev-shaped (live reload, Django dev server):
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Production-shaped (gunicorn, no bind mounts):
docker compose up --build
```

## Environment variables

`.env.example` is the tracked template; `.env` (your real values) is
gitignored.

| Variable | Example | Notes |
|---|---|---|
| `DJANGO_SECRET_KEY` | *(random 50 chars)* | **Must** be a real random value in production — never reuse the example. |
| `DEBUG` | `True` / `False` | `False` in production, no exceptions. |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated. |
| `DATABASE_URL` | `sqlite:///db.sqlite3` or `postgres://user:pass@host:5432/db` | `django-environ` DSN format. |
| `REDIS_URL` | `redis://localhost:6379/0` | Cache + Celery broker. |
| `CELERY_TASK_ALWAYS_EAGER` | `True` (dev) / `False` (prod) | `True` runs tasks synchronously — no worker needed, but not representative of production behavior. |
| `FRONTEND_URL` | `http://localhost:3000` | Used to build links in emails. |
| `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` | `http://localhost:3000` | Must match the frontend's actual origin, or the browser will reject requests. |
| `EMAIL_BACKEND` | `django.core.mail.backends.console.EmailBackend` | Console backend prints emails to stdout — fine for dev, replace for prod. |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` / `EMAIL_USE_TLS` | — | SMTP provider config. Not yet chosen — see `project-context.md` §10. |
| `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` | `sk_test_...` / `pk_test_...` | Test keys work fine for dev; payment flows haven't been exercised against real sandbox transactions yet. |
| `OPAY_SECRET_KEY` / `OPAY_PUBLIC_KEY` / `OPAY_MERCHANT_ID` | — | Same caveat as Paystack. |
| `PAYMENT_CALLBACK_URL` | `http://localhost:3000/orders/callback` | Where the gateway redirects the user after payment. |
| `DEFAULT_VENDOR_COMMISSION_RATE` | `10.0` | Percent, applied to new vendors unless overridden per-vendor. |
| `ORDER_PAYMENT_TIMEOUT_MINUTES` | `30` | How long a `pending_payment` order can sit before the auto-cancel sweep restocks it. |
| `AWS_STORAGE_BUCKET_NAME` / `AWS_S3_REGION_NAME` | — | Production media storage. Not yet provisioned. |
| `SENTRY_DSN` | — | Error monitoring. Wired but inactive until set. |

## Database & migrations

```bash
python manage.py makemigrations   # after any model change
python manage.py migrate
```

SQLite is fine for local development. Production uses Postgres — the
`DATABASE_URL` env var is the only thing that needs to change (via
`django-environ`'s DSN parsing).

## Demo data

```bash
python manage.py seed_demo_data
```

Creates:

| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | `admin@shoppix.com` | `Admin@12345` | Superuser |
| Vendor | `vendor@shoppix.com` | `Vendor@12345` | Pre-activated, brand "TechHub Nigeria", 2 seeded products |
| Customer | `customer@shoppix.com` | `Customer@12345` | Plain customer account |

Safe to re-run — uses `get_or_create`, won't duplicate data.

## Running Celery

Needed for anything beyond `CELERY_TASK_ALWAYS_EAGER=True` dev mode —
notably the **stale-order auto-cancel sweep**, which will silently never run
if you're only running `manage.py runserver`:

```bash
celery -A config worker -l info      # processes tasks
celery -A config beat -l info        # triggers scheduled tasks (run alongside the worker)
```

Both need Redis running and reachable at `REDIS_URL`.

## API documentation

- **Swagger UI**: `http://localhost:8000/api/docs/`
- **Redoc**: `http://localhost:8000/api/redoc/`
- **Raw OpenAPI schema**: `http://localhost:8000/api/schema/`
- **`requests.http`**: every endpoint, with realistic payloads, organized by
  domain — open in VS Code with the
  [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
  extension or JetBrains' built-in HTTP client.

**Read the note at the top of `requests.http` before writing your own API
scripts**: Django rotates the CSRF token on login. A token fetched before
login is stale immediately after — every section in that file fetches CSRF,
logs in, then **re-fetches CSRF** before the first write request. Skipping
that second fetch is the single most common way to get a confusing 403 from
this API.

## Testing

```bash
pytest
```

`pytest-django` is configured (`pytest.ini` points at
`config.settings.dev`), but no test suite has been written yet — see
`project-context.md` §10. Verification so far has relied on:

```bash
python manage.py check          # system check
python manage.py makemigrations  # should report "No changes detected" if
                                  # models and migrations are in sync
```

...plus live functional testing against a running server (the pattern used
throughout this project's development: start the server, exercise real
endpoints with curl/`requests.http`, verify the actual response, not just
that the code looks right).

## Security & dependencies

```bash
pip install pip-audit
pip-audit
```

0 known vulnerabilities as of the last check. Two things worth knowing:

- **This project runs Django 5.2 (LTS), not 5.1.** Django 5.1.x was found to
  have a CVE with no fix released anywhere in that branch during
  development — it had stopped receiving security patches. Don't downgrade
  without checking Django's currently-supported-versions page first.
- `django-celery-beat` must stay at `>=2.8` for Django 5.2 compatibility —
  `2.7.0` explicitly caps `Django<5.2` and will fail to install.

## Business rules & product decisions

A few policies are enforced in code and worth knowing explicitly rather than
reverse-engineering from the models:

- **Stale checkouts auto-cancel** after `ORDER_PAYMENT_TIMEOUT_MINUTES`
  (default 30), restocking the reserved items. Runs via Celery Beat
  (`apps.orders.tasks.cancel_stale_orders`) — requires `celery beat` to
  actually be running (see [Running Celery](#running-celery)).
- **Products go live immediately** once a vendor is activated — no
  per-listing admin review step. Admins can still deactivate individual
  products via `is_active`.
- **Reviews require a verified purchase.** A customer can only review a
  product they have a paid/processing/shipped/delivered order for — enforced
  in `ReviewSerializer.validate()`, not just shown as a UI badge.
- **Commission is snapshotted per order line item** at time of sale
  (`OrderItem.commission_rate`), so changing a vendor's rate later never
  retroactively changes historical order math.
- **Payment settlement never trusts a client-side redirect alone** —
  `mark_order_paid()` is only called after gateway verification (webhook
  signature check, or the manual `/payments/verify/<reference>/` endpoint),
  and is idempotent (safe if a webhook fires more than once).
- **Payout/vendor-disbursement automation is explicitly out of scope** for
  now — commission is tracked (`Vendor.commission_rate`, `OrderItem.vendor_earning`)
  but no money-movement logic to vendors exists.

## Connecting the frontend

The Next.js frontend's axios client is already built for this backend's
auth pattern: `withCredentials: true` + reading the `csrftoken` cookie into
an `X-CSRFToken` header on every unsafe request. To connect a frontend to
this API:

1. Point its API base URL at `http://localhost:8000/api` (or wherever this
   is deployed).
2. Set `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` here to match the
   frontend's actual origin.
3. Have the frontend call `GET /api/accounts/csrf/` once on load, before any
   POST/PUT/DELETE — this is what makes Django set the `csrftoken` cookie in
   the first place.

## Deployment

`config/settings/prod.py` sets `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`,
HSTS, and S3-backed media storage — but only takes effect when
`DJANGO_SETTINGS_MODULE=config.settings.prod` (the Docker production compose
file already sets this). Before an actual production deploy:

1. Real `DJANGO_SECRET_KEY`, `DEBUG=False`, real `ALLOWED_HOSTS`.
2. Real Postgres + Redis instances (not the SQLite/eager-Celery dev setup).
3. Real Paystack/Opay live keys, and register the real webhook URLs with
   both gateways.
4. An SMTP provider (`EMAIL_BACKEND` currently defaults to console-only).
5. An S3 bucket (or equivalent) for media — `AWS_STORAGE_BUCKET_NAME` /
   `AWS_S3_REGION_NAME`.
6. A Sentry DSN, if you want the already-wired error monitoring active.
7. Review `project-context.md` §8 (Constraints & Guardrails) — data
   retention / privacy policy (NDPR) has not been reviewed, and this app
   handles PII and payment references.

## Troubleshooting

**403 "CSRF token ... incorrect" on a write request**: you're reusing a
CSRF token fetched before login. Django rotates it on login — fetch it
again after logging in. See `requests.http`'s header comment for the exact
pattern.

**Stale orders never auto-cancel**: `celery beat` isn't running. `runserver`
alone does not trigger scheduled tasks — see [Running Celery](#running-celery).

**`pip install` fails with a dependency conflict involving Django**: check
`django-celery-beat`'s version — anything below `2.8` caps `Django<5.2` and
will conflict with this project's pinned Django 5.2.

**A DRF `UserWarning` about `min_value should be a Decimal instance`**: this
was a real bug (Python `int` passed to `MinValueValidator` on a
`DecimalField`) that's already fixed in `apps/catalog/models.py`. If you see
it again, you've likely introduced the same pattern on a new field —
validators on `DecimalField`s need `Decimal(...)` bounds, not plain `int`s.
