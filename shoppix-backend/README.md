# Shoppix Backend

Django REST API for Shoppix, a multi-vendor e-commerce marketplace (Nigeria-focused).

See `/mnt/user-data/outputs/project-context.md` (delivered alongside this backend) for
the full architecture writeup, feature-by-feature acceptance criteria, and — importantly —
the **Open Gaps** section: several real product decisions (abandoned-order cleanup,
product moderation policy, review gating, payout automation) are flagged there and
still need your input before this goes to production.

## Quick start (local dev, no Docker)

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env: at minimum set DATABASE_URL=sqlite:///db.sqlite3 for local dev

python manage.py migrate
python manage.py seed_demo_data   # creates admin/vendor/customer test accounts
python manage.py runserver
```

Demo accounts created by `seed_demo_data`:
- **Admin:** admin@shoppix.com / Admin@12345
- **Vendor:** vendor@shoppix.com / Vendor@12345 (pre-activated, "TechHub Nigeria")
- **Customer:** customer@shoppix.com / Customer@12345

API docs: `http://localhost:8000/api/docs/` (Swagger) once the server is running.

## Quick start (Docker, production-shaped)

```bash
cp .env.example .env   # fill in real Paystack/Opay keys, secret key, etc.
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

This brings up Postgres, Redis, the Django app, and Celery worker/beat together.

## Connecting the existing Next.js frontend

Your frontend's axios client is already configured correctly for this backend:
`withCredentials: true` + reading the `csrftoken` cookie into an `X-CSRFToken` header.
Just point `NEXT_PUBLIC_API_URL` (or wherever your axios `baseURL` is set) at
`http://localhost:8000/api`, and set `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS`
in the backend's `.env` to match your frontend's origin.

Call `GET /api/accounts/csrf/` once on app load before any POST/PUT/DELETE, so Django
sets the `csrftoken` cookie the frontend needs to read.

## What's been verified

Every endpoint below has been exercised against a live running server in this session
(not just unit-tested in isolation): registration, login/logout, vendor application +
approval, product listing (multi-vendor), cart add/view, checkout (with real stock
locking via `select_for_update`), order cancellation + restock, payment
initialization's error handling, the stale-order auto-cancel task, and review-gating
by verified purchase. See `project-context.md` Section 4 for the full feature-by-feature
status.

**Not yet exercised:** real Paystack/Opay sandbox transactions (needs real test API
keys), the email-sending paths beyond Celery's synchronous eager mode, and any load/
concurrency testing beyond the single-request logic checks.

## Product decisions locked in this session

- **Abandoned checkouts auto-cancel after 30 minutes** (`ORDER_PAYMENT_TIMEOUT_MINUTES`
  in `.env`), restocking the reserved items. Runs via a Celery Beat job
  (`apps.orders.tasks.cancel_stale_orders`, scheduled every 5 minutes in
  `CELERY_BEAT_SCHEDULE`) — this requires `celery_beat` actually running
  (see `docker-compose.yml`); it won't fire if you only run `runserver` locally
  without also running `celery -A config beat -l info` alongside a worker.
- **Products go live immediately once a vendor is activated** — no per-listing
  admin review step. Admins can still deactivate individual products via `is_active`.
- **Reviews require a verified purchase** — a customer can only review a product
  they have a paid/processing/shipped/delivered order for. This is enforced at
  the serializer level, not just shown as a badge.

