---
document_type: project_context
project: Shoppix
version: 1.0
last_reviewed: 2026-08-17
schema_version: 3
---

# Shoppix — Project Context

## 0. Quick-Scan Header
```
PROJECT: Shoppix
STAGE: active build
LAST UPDATED: 2026-08-17 (0 days ago) — Resolved 3 open product decisions (order auto-cancel, product moderation policy, review gating); all changes tested live against the database
LIVE BLOCKER: none
NEXT ACTION: Provision real infrastructure decisions from Section 10 (hosting target, SMTP, S3, Sentry, payment gateway test keys) when ready to move toward a staging/production deploy — owner: user, trigger: when ready to deploy
```

## 1. Project Overview
**Name:** Shoppix
**One-line description:** A multi-vendor e-commerce marketplace for the Nigerian market (Jumia/Konga-style), where independent vendors list and sell products under a single platform.
**Problem solved:** Gives independent sellers a storefront and checkout/payment infrastructure without building their own, while giving buyers one place to shop across many vendors.
**End users:** Customers (buyers), Vendors (sellers, subject to admin approval), Admins/platform operators.
**Business context:** Nigeria-specific — NGN currency, State/LGA address fields, Paystack and Opay as the payment rails. Commission-based marketplace model (platform takes a percentage per sale); payout automation is explicitly deferred (see Section 10).
**Build stage tier:** Active build. Frontend (Next.js) existed before this session with auth forms, types, and an axios client already wired for session+CSRF auth. Backend (Django) is being built from scratch in this session.
**Complexity/scale tier:** Moderate–complex, multi-service — REST API backend, async task queue, relational DB, containerized deployment, separate frontend app.
**Staleness flag:** None — this is the first pass, generated same-day as the described work.
**Definition of "done and working" for this project:** A customer can register, verify email, browse products across multiple vendors, add items to a cart, check out against a saved shipping address, and pay via Paystack or Opay with the order correctly marked paid via webhook. A customer can apply to become a vendor; an admin can approve them; once approved they can list products and see/fulfill their own orders through defined status transitions. None of this has been confirmed working end-to-end via live HTTP requests yet — only via Django's static checks and migrations.

## 2. Engineering Standard & Acceptance Criteria

- **Functional correctness:** Defined per feature in Section 4. No blanket claim of correctness — the backend has passed `manage.py check` and clean migrations, but has not yet completed an end-to-end live request smoke test in this environment.
- **Reliability:** Order stock decrements use `select_for_update` row locking at checkout to prevent overselling under concurrent requests (confirmed in code, not yet load-tested). Payment settlement (`mark_order_paid`) is written to be idempotent — safe to call multiple times if a webhook fires more than once. Celery email tasks retry up to 3 times with a 30s delay. **Gap:** no retry/backoff is implemented around the Paystack/Opay HTTP calls themselves (a single gateway timeout currently surfaces as a hard failure to the user).
- **Security:** Session-cookie + CSRF-header auth (not JWT), matching the frontend's existing axios config. Custom password validator enforces upper/lower/digit/special-char, mirrored from the frontend's zod schema intent. All model primary keys are UUIDs (no sequential-ID enumeration). Payment webhooks are authenticated via HMAC signature verification, not CSRF/session (correctly exempted from CSRF since they're server-to-server). Secrets are read from `.env`, never committed. **Gap:** no security audit or penetration test has been performed; NDPR (Nigeria Data Protection Act) compliance has not been discussed despite the app handling PII and payment references.
- **Performance:** No budgets have been set (page load, API response time, etc.). **Open gap** — flagged in Section 10 rather than invented.
- **Scalability:** No expected traffic/data volume has been discussed. **Open gap.**
- **Maintainability:** Backend is organized by domain app (`accounts`, `vendors`, `catalog`, `cart`, `orders`, `payments`, `reviews`, `common`), with business logic for checkout/payment settlement pulled into a `services.py` layer rather than left in views, specifically so it can be reused by admin actions/management commands later.
- **Testing & verification:** `pytest-django` is configured (`pytest.ini` points at `config.settings.dev`), but **no automated tests have been written yet** — verification so far is `manage.py check`, `makemigrations`/`migrate`, and a partial manual HTTP smoke test.
- **Observability:** A `RequestIDMiddleware` tags every request/response with a correlation ID for log tracing. A Sentry integration is wired into `prod.py` but inactive until a DSN is supplied. **Gap:** no metrics/alerting has been discussed.
- **Delivery health trend:** Improving — session 1 landed foundational scaffolding cleanly (one bug found and fixed: dev cache config). Session 2 resolved three deferred product decisions with working, tested code rather than leaving them as open questions, and caught/fixed a second real bug along the way (an uncaught `JSONDecodeError` when a payment gateway returns a non-JSON response, now handled as a clean `GatewayError`).

## 3. Technical Context

**Frontend:** Next.js 16 (App Router) `[confirmed]`, React 19.2, TypeScript, Tailwind CSS v4 + shadcn/ui (Radix primitives), react-hook-form + zod v4 for forms/validation, axios v1.13 configured with `withCredentials: true` and an `X-CSRFToken` header (session-cookie auth pattern) `[confirmed]`. Package manager: npm (`package-lock.json` present) `[confirmed]`.

**Backend:** Django 5.1.4 + Django REST Framework 3.15.2 `[confirmed — built this session]`. Session + CSRF auth (`SessionAuthentication`, `CSRF_HEADER_NAME=HTTP_X_CSRFTOKEN`, `CSRF_COOKIE_HTTPONLY=False` so the frontend JS can read it) to match the pre-existing frontend client. Database: SQLite for local dev, Postgres 16 for Docker/production (`django-environ` `DATABASE_URL` switch). Cache/broker: Redis, via `django-redis` and Celery 5.4 + `django-celery-beat`. API docs: `drf-spectacular` (Swagger/Redoc at `/api/docs/`, `/api/redoc/`). Static/media: Whitenoise for static in all environments; `django-storages` + S3 wired for prod media but **no bucket/credentials provisioned yet**.

**Payments:** Paystack and Opay, both implemented behind a shared `BaseGateway` interface (`initialize`, `verify`, `verify_webhook_signature`) so the view layer doesn't care which gateway a payment used `[confirmed — user's explicit choice]`.

**Hosting/infra:** Docker + `docker-compose.yml` (db, redis, web/gunicorn, celery_worker, celery_beat) scaffolded for production; `docker-compose.dev.yml` override for local live-reload. **Gap:** actual hosting target (AWS/Render/DigitalOcean/Fly/etc.) has not been chosen.

**Repo structure:** Monorepo at `ShoppixStore/` — `shoppix/` (Next.js frontend), `shoppix-backend/` (Django backend: `apps/{accounts,vendors,catalog,cart,orders,payments,reviews,common}` + `config/settings/{base,dev,prod}.py` + `config/{urls,wsgi,asgi,celery}.py`), with a shared root `.gitignore`, root `README.md`, and this `project-context.md` at the repo root (not nested inside either app, since it now describes both). `requests.http` (every backend endpoint, for the VS Code REST Client / JetBrains HTTP Client) lives in `shoppix-backend/`.

**Environments:** Local dev (SQLite + in-memory cache, `runserver`, `CELERY_TASK_ALWAYS_EAGER=True`) and prod (Postgres + Redis + Docker + gunicorn) are scaffolded and differentiated via `DJANGO_SETTINGS_MODULE`. **Gap:** no staging environment defined.

**CI/CD:** Not set up. **Gap.**

**Coding conventions:** UUID primary keys on every model; service-layer functions for multi-step business logic (checkout, payment settlement) instead of fat views; DRF `ViewSet`+`DefaultRouter` for CRUD resources, plain `APIView` for single-purpose actions (checkout, webhooks); `ScopedRateThrottle` applied to `auth`, `checkout`, and `webhook` endpoint groups.

**Browser/device support targets:** Not specified. **Gap.**

### 3a. Dependency & Integration Map
| Service/dependency | Purpose | Status | Owner of credentials |
|---|---|---|---|
| Paystack | Primary payment gateway | Integrated (code complete), test keys not yet supplied | Not yet assigned |
| Opay | Secondary payment gateway | Integrated (code complete), test keys not yet supplied | Not yet assigned |
| Postgres | Production database | Docker service defined, not yet deployed anywhere | Not yet assigned |
| Redis | Cache + Celery broker | Docker service defined, not yet deployed anywhere | Not yet assigned |
| SMTP provider | Transactional email (verification, password reset, order/vendor notifications) | Not chosen — dev uses console backend only | Not yet assigned |
| AWS S3 | Production media storage | Wired in code, bucket not provisioned | Not yet assigned |
| Sentry | Error monitoring | Wired in code, DSN not supplied | Not yet assigned |

## 4. Features & Functionality

### Auth & Account Management
- **What it does / who uses it:** Email/password registration with email verification, login/logout, password change, password reset, shipping address CRUD. Used by all users (customers and vendors share the same `User` model).
- **User flow:** Register → verification email sent (async via Celery) → user clicks link → `is_email_verified=True` → login sets an httpOnly session cookie → subsequent requests carry the session cookie + CSRF header.
- **Acceptance criteria:** Registration rejects duplicate emails and weak passwords (must contain upper/lower/digit/special char, min 8 chars) with field-level errors. Password reset never reveals whether an email is registered (always returns 200). Login fails cleanly with a generic "Invalid email or password" message (no user-enumeration).
- **Known edge cases:** Expired/tampered verification or reset tokens are rejected explicitly. Deactivated accounts (`is_active=False`) cannot log in. *Anticipated, not yet confirmed:* behavior when a user tries to verify an already-verified email; rate-limiting has a `10/min` scope on auth endpoints but hasn't been tested against a burst.
- **Dependencies:** Celery + Redis for async email sending; console email backend in dev.
- **Status:** Built (code complete, migrations verified); HTTP smoke test in progress.

### Vendor Onboarding & Storefront
- **What it does / who uses it:** A logged-in customer can apply to become a vendor (creates a `Vendor` profile with `is_activated=False`). An admin approves/suspends via a dedicated admin API or Django admin. Approved vendors manage their own storefront profile and see public vendor listings.
- **User flow:** Customer applies with brand name + description → pending → admin approves (`is_activated=True`, `activated_at` set, notification email queued) → vendor can now list products.
- **Acceptance criteria:** A user cannot apply twice (one `Vendor` per `User`, enforced via `OneToOneField`). Brand names must be unique. Only `is_activated=True` vendors appear in public vendor listings or can create products.
- **Known edge cases:** *Anticipated, not yet confirmed:* what happens to a vendor's already-live products if an admin suspends them mid-sale (currently: products remain queryable by ID but drop out of the public product list filter, since that filter checks `vendor__is_activated=True`) — this should be explicitly confirmed as intended behavior.
- **Dependencies:** Admin approval action; commission rate defaults to `DEFAULT_VENDOR_COMMISSION_RATE` (10%) per vendor, editable per-vendor.
- **Status:** Built; not yet smoke-tested end-to-end.

### Product Catalog
- **What it does / who uses it:** Vendors create/manage their own products (name, price, stock, category, images, flash-sale flag with an expiry timestamp). Public users browse/filter/search across all vendors.
- **User flow:** Vendor creates product → public catalog list filters to `is_active=True` + `vendor__is_activated=True` + (flash sale not expired) → customer filters by category/vendor/price range/in-stock/flash-sale, searches by name/description/vendor name.
- **Acceptance criteria:** A vendor can only edit/delete their own products (object-level permission). Flash-sale discount percentage is computed server-side from `old_price`/`current_price`, not trusted from the client. Expired flash sales (`flash_sale_ends_at` in the past) are automatically excluded from the public flash-sale filter without requiring the vendor to manually toggle it off.
- **Known edge cases:** *Anticipated, not yet confirmed:* what happens when a vendor sets `old_price` lower than `current_price` (currently rejected at the serializer level with a validation error); category deletion behavior when products reference it (`SET_NULL`, confirmed in model).
- **Dependencies:** Vendor must be `is_activated`.
- **Status:** Built; not yet smoke-tested end-to-end.

### Cart
- **What it does / who uses it:** Authenticated customers add/update/remove products in a persistent, server-side cart (one cart per user).
- **User flow:** Add product → if already in cart, quantity increments rather than erroring → update quantity → checkout empties the cart.
- **Acceptance criteria:** Quantity cannot exceed live product stock at add/update time (validated server-side). A user can only ever act on their own cart items (ownership check on update/delete).
- **Known edge cases:** *Anticipated, not yet confirmed:* stock changing between "add to cart" and "checkout" — this is handled at checkout time (see Orders below), not at cart-add time, so a cart can technically hold more than is available by the time of checkout; this is treated as expected and re-validated at checkout.
- **Dependencies:** Live `Product.stock`.
- **Status:** Built; not yet smoke-tested end-to-end.
- **Open gap:** Guest (non-authenticated) cart/checkout has not been decided — currently cart requires login.

### Checkout & Orders
- **What it does / who uses it:** Converts a cart into an `Order`, split into per-vendor `OrderItem`s with snapshotted price/name/commission-rate so later product or vendor-rate changes never retroactively alter historical orders. Vendors track fulfillment status per line item (`paid → processing → shipped → delivered`), independent of the overall order/payment status.
- **User flow:** Customer selects a saved shipping address → checkout → stock is row-locked (`select_for_update`) and re-validated → `Order` created in `pending_payment` → stock decremented immediately (reserved at order-creation, not at payment-confirmation) → cart cleared → customer proceeds to payment.
- **Acceptance criteria:** Checkout fails cleanly with a specific message if any item's stock is now insufficient or the product was deactivated, without partially creating the order. Two simultaneous checkouts against the same limited-stock item cannot both succeed if there isn't enough stock for both (enforced by the row lock).
- **Known edge cases:** Order cancellation (only allowed while `pending_payment`) restocks the reserved items. Orders abandoned mid-checkout are auto-cancelled and restocked after `ORDER_PAYMENT_TIMEOUT_MINUTES` (default 30) by a scheduled Celery Beat task (`apps.orders.tasks.cancel_stale_orders`, runs every 5 minutes) — confirmed working via a direct functional test (backdated a pending order, ran the task, verified both status and stock). **Requires `celery beat` to actually be running** (see `docker-compose.yml`); it will not fire on a bare `manage.py runserver` without a beat process alongside a worker.
- **Dependencies:** Cart, ShippingAddress, Product stock, Celery Beat (for auto-cancellation).
- **Status:** Built and functionally verified, including the auto-cancel task. HTTP smoke test of the checkout endpoint itself passed end-to-end in this session.

### Payments
- **What it does / who uses it:** Initializes a Paystack or Opay transaction against a `pending_payment` order, verifies it (via webhook and/or a manual verify endpoint the frontend can poll on redirect-back), and settles the order (marks paid, credits vendor sales totals, sends confirmation/notification emails).
- **User flow:** Frontend calls `/api/payments/initialize/` with an order + chosen gateway → gets an `authorization_url` to redirect the user to → gateway redirects back to `PAYMENT_CALLBACK_URL` → frontend can call `/api/payments/verify/<reference>/` as a fallback, while the gateway's webhook independently confirms server-to-server.
- **Acceptance criteria:** Settlement is idempotent — calling it twice (e.g. both webhook and manual verify fire) does not double-credit a vendor or double-send emails. Webhooks are rejected with 401 if the HMAC signature doesn't match. The client-side redirect is never trusted alone to mark an order paid.
- **Known edge cases:** *Anticipated, not yet confirmed:* partial/failed gateway responses when only some data is present; a payment record exists in `pending`/`failed` state if verification never succeeds, but nothing currently surfaces this to the customer as an actionable retry flow in the API — worth a follow-up.
- **Dependencies:** Orders app, Celery for async notification emails.
- **Status:** Built; not yet smoke-tested end-to-end. Real Paystack/Opay test credentials have not been supplied, so gateway calls have not been exercised against the live sandbox APIs.

### Reviews
- **What it does / who uses it:** Customers can leave one rating+comment per product, but **only if they have a paid/processing/shipped/delivered order for that product** — purchase is a hard requirement to submit a review, not just a badge.
- **User flow:** Customer attempts to review a product → serializer checks for a qualifying `OrderItem` → rejected with a clear error if none exists → one review per (product, user) pair if it does.
- **Acceptance criteria:** A user cannot submit a second review for the same product. A user with no qualifying purchase cannot submit a review at all (confirmed via direct serializer test: rejected with "You can only review products you've purchased," then accepted once a paid `OrderItem` existed). Only the review's own author can edit/delete it.
- **Known edge cases:** *Anticipated, not yet confirmed:* whether a refunded/cancelled order's items should retroactively invalidate an existing review — not currently enforced (the `order_item` link is set once at creation and not re-validated on edit).
- **Dependencies:** OrderItem with a qualifying status.
- **Status:** Built and functionally verified (both the rejection and acceptance paths tested directly against the database).

**Established features summary:** None yet — this is the first session, so no features have graduated to "stable, unchanged" status.

## 5. Design & UI/UX Standard
No formal design system (palette, typography scale, spacing scale, component variant rules) has been defined or extracted from the codebase yet — the frontend uses default Tailwind v4 + shadcn/ui primitives, which is a starting toolkit, not a documented design system. **This is a prerequisite gap**, not a placeholder decision — do not treat default shadcn styling as an intentional brand choice in future sessions.

Regardless of that gap, the following standards apply once UI work resumes:
- Every interactive element must be designed for all relevant states: default, hover, active, focus, disabled, loading, empty, error, success.
- Genuine responsiveness across realistic breakpoints, intentionally composed at each one — specific breakpoints not yet defined, default to Tailwind's standard scale (`sm/md/lg/xl/2xl`) until told otherwise.
- Accessibility baseline: WCAG 2.1 AA as the floor.
- Four-part design justification test for meaningful visual/interaction decisions: logical (serves content/function), strategic (serves the business goal), emotional (fits brand/audience), accessible.

## 6. Data & Content

**Key entities and relationships** (backend, as implemented):
- `User` (custom, email as username) 1—1 `Vendor` (optional); 1—many `ShippingAddress`; 1—1 `Cart`; 1—many `Order`; 1—many `Payment`; 1—many `Review`.
- `Vendor` 1—many `Product`; 1—many `OrderItem` (as seller of record); has `commission_rate`, `is_activated`, `is_diamond`, `total_sales_ever`.
- `Category` self-referential (`parent`) for nesting; 1—many `Product`.
- `Product` many—1 `Vendor`, many—1 `Category` (nullable); 1—many `ProductImage`; 1—many `CartItem`/`OrderItem`/`Review`.
- `Cart` 1—many `CartItem` (unique per product per cart).
- `Order` 1—many `OrderItem` (snapshotted price/name/commission, per-vendor fulfillment status); many—1 `ShippingAddress`; 1—many `Payment`.
- `Payment` many—1 `Order`, many—1 `User`; stores gateway, reference, verification state, raw gateway response JSON.

**Data ownership/source of truth:** Platform-owned Postgres database is the single source of truth. Vendors own their own product content but the platform mediates all transactional data (orders, payments).

**Localization:** Nigeria-specific address fields (State, LGA, Country defaulting to "Nigeria") are built in. No multi-country support is in scope.

**Data retention/privacy handling:** Not discussed. **Gap** — flagged given the app handles PII (emails, addresses, phone numbers) and payment references; NDPR applicability should be confirmed before production launch.

## 7. Architecture Notes

- **Session + CSRF auth over JWT:** Chosen to match the frontend's pre-existing axios client (`withCredentials` + `X-CSRFToken`) rather than retrofitting the frontend to a token scheme. Reasoning: httpOnly session cookies are less exposed to XSS than a JWT stored in JS-accessible storage, appropriate for a same-origin-ish browser app.
- **Service-layer for checkout/payment settlement:** `orders/services.py` holds `checkout_cart`, `mark_order_paid`, `cancel_order` as standalone functions rather than view methods, specifically so the same logic can be triggered from the webhook, a manual verify endpoint, and (later) an admin action or scheduled task without duplicating the locking/transaction logic.
- **Row-level locking (`select_for_update`) at checkout:** Chosen over optimistic checks to guarantee no overselling of limited stock under concurrent checkout attempts, at the cost of a small amount of write contention on popular products — considered an acceptable tradeoff at current expected scale (unconfirmed, see Section 2 Scalability gap).
- **Snapshotting price/name/commission onto `OrderItem`:** Chosen so historical orders remain accurate and legally/financially consistent even if a vendor later changes a product's price or the platform changes a vendor's commission rate.
- **Gateway abstraction (`BaseGateway`):** Paystack and Opay share one interface (`initialize`/`verify`/`verify_webhook_signature`) so the payment views and future gateway additions don't need gateway-specific branching logic.

## 8. Constraints & Guardrails

- Never mark an order paid from a client-side redirect alone — must go through gateway verification (webhook and/or server-side verify call).
- Never log or store raw passwords or gateway secret keys; secrets live only in `.env`/environment variables, never in the repo.
- `CSRF_COOKIE_HTTPONLY=False` is a deliberate, necessary tradeoff (the frontend JS must read the CSRF cookie to set the header) — do not "fix" this by making it `True` without also changing the frontend's CSRF strategy.
- A vendor must be `is_activated` before they can create products or be counted in public listings — do not bypass this gate.
- Payout/commission-disbursement automation is explicitly out of scope for the current phase (user's decision: "decide later") — commission is tracked (`commission_rate`, `vendor_earning` computed property) but no money-movement logic to vendors exists or should be assumed to exist.
- Regulatory context (NDPR / Nigerian data protection law) has not been reviewed — do not claim compliance in any future session without an explicit review.

## 9. Instructions to Future AI Models
- Check Section 0/1's stage tier before proceeding — this project is in **active build**, backend scaffolded but **not yet confirmed working end-to-end via live HTTP requests**. Do not present it as tested or production-ready.
- Do not ship anything that fails the acceptance criteria in Section 2/4 without flagging it explicitly.
- Do not silently fill gaps in this document with assumptions — surface them and ask, or state the assumption being made and why, before proceeding.
- Think through edge cases (stated and anticipated) before presenting a solution as complete.
- Justify UI/UX decisions against the four-part test in Section 5 rather than defaulting to generic component-library styling — and note that no design system exists yet, so early UI decisions are provisional, not brand-final.
- Surface tradeoffs honestly and default to the robust option unless told otherwise.
- Where this file conflicts with something said earlier in a new conversation, this file is authoritative unless the user explicitly updates it — prompt for the update when a real change is identified.
- After any session that adds new information: update Section 0, update Section 4 statuses, and log the change in Section 11. Never skip the changelog entry.

## 10. Open Gaps, Assumptions & Superseded Facts

**Open gaps:**
- Payout/vendor-disbursement logic — Not yet defined. User explicitly deferred this decision ("decide later"). Commission is tracked but not automated.
- Performance budgets (load time, API response targets, bundle size) — Not yet defined.
- Scalability profile (expected traffic/data volume) — Not yet defined.
- Hosting/deployment target (AWS, Render, DigitalOcean, Fly, etc.) — Not yet chosen. Docker Compose scaffolding is host-agnostic.
- SMTP/email provider — Not yet chosen. Dev uses Django's console backend only.
- AWS S3 bucket & credentials for production media — Not yet provisioned.
- Sentry DSN — Not yet provisioned; integration code exists but is inactive.
- CI/CD pipeline — Not yet set up.
- Automated test suite — `pytest-django` configured, but no tests written yet.
- Data retention / privacy policy / NDPR compliance review — Not yet discussed.
- Frontend design system (palette, typography, spacing scale) — Not yet established; currently default Tailwind v4 + shadcn/ui.
- Guest (non-authenticated) cart/checkout — Not decided; currently requires login.
- Staging environment — Not defined (only local dev and prod settings exist).
- Payment gateway test credentials — Not supplied; gateway integrations are untested against Paystack/Opay's actual sandbox APIs.

**Superseded facts:**
- **Abandoned-order cleanup** — Previously (2026-08-17, session 1): flagged as an open gap, no auto-cancel job existed. Now (2026-08-17, session 2): resolved. Orders stuck in `pending_payment` for longer than `ORDER_PAYMENT_TIMEOUT_MINUTES` (default 30) are auto-cancelled and restocked by a Celery Beat task (`apps.orders.tasks.cancel_stale_orders`, scheduled every 5 minutes). Reason: user asked for a best-practice default rather than leaving it undecided; 30 minutes matches a realistic Paystack/Opay checkout session window.
- **Product moderation policy** — Previously (2026-08-17, session 1): implemented as auto-live but flagged as "not explicitly confirmed as the intended policy." Now (2026-08-17, session 2): confirmed as the intended policy. Products go live immediately once a vendor is activated, with no per-listing admin review; admins retain the ability to deactivate individual products via `is_active`. Reason: matches how comparable marketplaces (Jumia, Amazon Marketplace, Etsy) gate at the vendor level, not the listing level, and is the appropriate tradeoff for this project's current stage.
- **Review gating** — Previously (2026-08-17, session 1): any authenticated user could review any product; only the "verified purchase" badge depended on purchase history. Now (2026-08-17, session 2): a verified purchase is a hard requirement to submit a review at all, enforced in `ReviewSerializer.validate()`. Reason: open review-writing invites fake/manipulated reviews; gating at write-time is the safer default for marketplace trust.

## 11. Change Log
| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2026-08-17 | 1.0 | Initial context generated after Django backend scaffolding session (7 apps, models, migrations verified, smoke test in progress) | AI |
| 2026-08-17 | 1.1 | Resolved three open gaps per user's "whatever approach is best" instruction: added stale-order auto-cancel (Celery Beat, 30-min default), confirmed auto-live product policy (no code change), and made verified-purchase a hard requirement for reviews (was previously just a badge). All three changes were functionally tested against a live database, not just statically checked. | AI |
