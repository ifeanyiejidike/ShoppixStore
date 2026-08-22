---
document_type: project_context
project: Shoppix
version: 1.8
last_reviewed: 2026-08-22
schema_version: 3
---

# Shoppix — Project Context

## 0. Quick-Scan Header
```
PROJECT: Shoppix
STAGE: active build
LAST UPDATED: 2026-08-22 (0 days ago) — Design palette revised (v1→v2) after real user visual feedback on the live deployment: deeper/more premium near-black + antique gold + wine palette, real hero photography replacing decorative mockups, all re-verified for WCAG contrast
LIVE BLOCKER: none
NEXT ACTION: A real visual browser QA pass is still owed for the rest of the site beyond the homepage hero — the user's feedback so far covers the hero specifically; other pages haven't had the same live-deployment scrutiny yet — owner: user
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

**Frontend:** Next.js 16.3.1 (App Router) `[confirmed — patched for a known security advisory this session]`, React 19.2, TypeScript, Tailwind CSS v4 + shadcn/ui (Radix primitives), react-hook-form + zod v4 for forms/validation, axios 1.19.0 configured with `withCredentials: true` and an `X-CSRFToken` header (session-cookie auth pattern) `[confirmed]`. Fonts are self-hosted via `@fontsource`/`@fontsource-variable` (Fraunces, Inter, IBM Plex Mono) rather than `next/font/google`, specifically because the latter requires live network access to fonts.googleapis.com at build time with no fallback — confirmed this breaks production builds outright in network-restricted environments. Package manager: npm (`package-lock.json` present) `[confirmed]`. `npm audit`: 0 vulnerabilities as of 2026-08-19.

**Backend:** Django 5.2.17 (LTS) + Django REST Framework 3.15.2 `[confirmed — upgraded from 5.1.4 this session after 5.1.x was found to have an unpatched CVE with no fix in that branch]`. Session + CSRF auth (`SessionAuthentication`, `CSRF_HEADER_NAME=HTTP_X_CSRFTOKEN`, `CSRF_COOKIE_HTTPONLY=False` so the frontend JS can read it) to match the pre-existing frontend client. Database: SQLite for local dev, Postgres 16 for Docker/production (`django-environ` `DATABASE_URL` switch). Cache/broker: Redis, via `django-redis` and Celery 5.4 + `django-celery-beat` 2.9.0 (bumped from 2.7.0, which capped `Django<5.2`). API docs: `drf-spectacular` (Swagger/Redoc at `/api/docs/`, `/api/redoc/`). Static/media: Whitenoise for static in all environments; `django-storages` + S3 wired for prod media but **no bucket/credentials provisioned yet**. `pip-audit`: 0 vulnerabilities as of 2026-08-19 (was 56 across Django/Pillow/requests/pytest before this session's upgrades).

**Payments:** Paystack and Opay, both implemented behind a shared `BaseGateway` interface (`initialize`, `verify`, `verify_webhook_signature`) so the view layer doesn't care which gateway a payment used `[confirmed — user's explicit choice]`.

**Hosting/infra:** Docker + `docker-compose.yml` (db, redis, web/gunicorn, celery_worker, celery_beat) scaffolded for production; `docker-compose.dev.yml` override for local live-reload. **Gap:** actual hosting target (AWS/Render/DigitalOcean/Fly/etc.) has not been chosen.

**Repo structure:** Monorepo at `ShoppixStore/` — `shoppix/` (Next.js frontend), `shoppix_backend/` (Django backend: `apps/{accounts,vendors,catalog,cart,orders,payments,reviews,common}` + `config/settings/{base,dev,prod}.py` + `config/{urls,wsgi,asgi,celery}.py`), with a shared root `.gitignore`, root `README.md`, and this file at `docs/project-context.md` (not nested inside either app, since it describes both). `requests.http` (every backend endpoint, for the VS Code REST Client / JetBrains HTTP Client) lives in `shoppix_backend/`.

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
- **Fixed this session:** the vendor-facing "my catalog" view (`GET /api/catalog/products/mine/`) was previously dead code — `get_queryset()` checked for `self.action == "mine"` but no such route existed, so a vendor had no way to see their own inactive/expired listings via the API. Added a proper `@action(detail=False)` route, confirmed it's registered before the `/products/<slug>/` catch-all (no routing ambiguity), and functionally verified: deactivated a product, confirmed it disappears from the public list but still appears in `/mine/`.
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
A real design system now exists (built this session, not default shadcn styling): defined in `shoppix/src/app/globals.css` as CSS custom properties, with Tailwind v4 tokens mapped via `@theme inline`.

- **Palette (v2, revised this session)**: Ink `#17140E` (near-black, warm undertone), Canvas `#F9F8F5` (clean warm ivory), Gold `#D69729` (antique/metallic — CTAs, price tags, badges on dark backgrounds; a dark "Gold Ink" `#573A19` variant handles gold used as text on light backgrounds), Emerald `#124932` (deepened from the original Jade — vendor/success accents), Wine `#7A1F2E` (deepened from the original bright orange-red Coral — destructive/urgency). Every text-on-background pairing is contrast-checked (computed WCAG luminance/contrast, not eyeballed): ink/canvas 17.27:1, gold-ink/white 10.37:1, wine/white 10.18:1, emerald/white 10.37:1, gold/ink (hero headline use) 7.26:1. **Why revised**: the v1 palette (bright mustard `#E8A33D` directly on a muddy brown-black `#10241C`) read as "rustic craft stall" rather than the premium marketplace this project is meant to be — user feedback after seeing it live, and a fair one. v2 keeps the same warm, market-rooted identity but with a true near-black ground and a deeper, metallic-leaning gold and wine, closer to how a premium fashion or jewelry brand reads. CSS variable *names* (`--marigold`, `--jade`, `--coral`) were kept as-is to avoid touching every component file — only the underlying HSL values changed, verified via `grep` that zero hardcoded hex values exist anywhere in `src/` that would have bypassed the token update.
- **Type**: Fraunces (display/headings, used italic), Inter (body/UI), IBM Plex Mono (prices, order references — a deliberate "receipt/ledger" register for commerce data). Self-hosted via `@fontsource` (see Section 3/11 — this was a separate, unrelated fix for a production-build failure).
- **Signature element**: a die-cut "price tag" notch (`.price-tag` utility in globals.css) on product cards and the homepage hero's social-proof callout — a literal market-price-tag motif tying back to the brand's Nigerian-marketplace positioning, not a generic card shadow.
- **Hero imagery (added this session)**: the homepage hero previously had no real photography — just text and three small decorative "sticky note" mockups on the right side, which read as filler rather than a real trust signal, and left the hero feeling sparse. Replaced with a full-bleed real photograph (a verified Unsplash image, resolved by fetching Unsplash's own live search-results page and extracting the actual CDN URL — not a guessed photo ID) in a premium editorial split layout, with a single confident stat callout ("2,400+ sellers") overlaid on the photo instead of three competing mockups.
- **Component states**: Interactive elements have default/hover/active/focus/disabled/loading states via Tailwind + Radix primitives; `:focus-visible` has a global visible outline (gold, 2px) rather than relying on browser defaults.
- **Responsiveness**: Tailwind's standard breakpoint scale (`sm/md/lg/xl/2xl`), mobile-first. Verified via code review + live HTTP checks, not a visual browser pass (see Section 10 gap).
- **Accessibility**: WCAG 2.1 AA is the active floor, not just an aspiration — a full audit pass found and fixed real AA violations (contrast, invalid nested-interactive HTML, missing ARIA group roles, missing accessible names on search inputs), and the v2 palette revision was re-verified against the same standard rather than assumed safe because it looked fine. See Section 11's changelog for the specific findings and fixes.
- **Four-part design justification test**: logical (the near-black/gold pairing and real photography clearly signal "premium" the way flat mustard-on-brown and decorative mockups didn't); strategic (differentiates from generic Jumia/Amazon-clone aesthetics while no longer reading as a discount bazaar); emotional (grounds the brand in the physical Nigerian-market experience it's digitizing, now via a real human photograph rather than an abstraction of one); accessible (every pairing contrast-checked, not just chosen for looks).

**Known gap**: everything above has been verified by a human-inspectable rendered HTML/CSS/JS review, `tsc`, `eslint`, a full production build, and live HTTP checks against the running dev server — but not by an actual person looking at it in a real browser across real device widths. This sandbox cannot run headless Chromium (network-restricted). Treat the UI as code-verified, not visually-verified, until someone does that pass. Note that the v1→v2 palette revision itself was prompted by the user viewing a live deployment (not this sandbox) and giving direct visual feedback — that's the closest this project has gotten to real visual QA so far, and it caught something the code-only audits didn't (a real screenshot review would have flagged "this looks like a craft stall, not premium" long before now).

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
- Real visual browser QA — All UI work this session was verified via code review, `tsc`, `eslint`, and live HTTP/HTML checks, not by viewing it in an actual browser (this sandbox can't run headless Chromium). Needs a human pass across real device widths before considering the UI audit closed.
- Placeholder imagery — Product/vendor images currently fall back to curated stock Unsplash photos (verified real, not broken) since no vendor has uploaded real product photos yet. Fine for demo/development; replace with real vendor-uploaded imagery before production.
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
| 2026-08-19 | 1.2 | Frontend build session: full design system, data/API layer, and every core page built (home, product listing/detail, cart, checkout, auth flow, vendor apply/dashboard). Found and fixed a real bug in `requests.http` (delivered in a prior session): Django rotates the CSRF token on login, but every section reused the pre-login token for subsequent writes, which would 403 for anyone actually using the file. Fixed by adding a documented CSRF re-fetch step after every login block, verified against the live backend. Also fixed the `/api/catalog/products/mine/` dead-route bug (see Section 4, Product Catalog). Confirmed the actual frontend app was never affected by the CSRF rotation issue, since its axios client reads the CSRF cookie live on every request rather than caching a token — verified via live product creation through the real vendor dashboard flow. | AI |
| 2026-08-19 | 1.3 | Completed the frontend page set: account section (profile/password change, order history with cancellation, address management), vendor public storefront listing and individual storefront pages. All pages type-checked, linted, and live-verified against the running dev server; the vendor storefront's data chain (vendor lookup + vendor-filtered product list) was independently confirmed correct via direct API calls before trusting the page to render it right. Frontend is now feature-complete for the core marketplace flow: browse → vendor storefronts → cart → checkout → account/order management, plus the vendor-side apply → dashboard → fulfill flow. | AI |
| 2026-08-19 | 1.4 | Site-wide UI/UX/accessibility audit (code-based — this sandbox cannot run a headless browser, so verification was via `tsc`, `eslint`, live curl against the running servers, and computed WCAG contrast math, not visual inspection). Real issues found and fixed: (1) `ProductCard` and `not-found.tsx` both nested a `<button>` inside a `<Link>` — invalid HTML, restructured both; (2) `text-coral` measured 3.81:1 contrast against white/canvas, failing WCAG AA's 4.5:1 for normal text — darkened the `--coral` token (53%→44% lightness) to 5.13:1, fixing every usage site-wide from one change; verified jade (7.18:1) and marigold-ink (9.55:1) were already fine; (3) checkout's address/payment selectors and the product image gallery selector had zero group semantics for screen readers — added `role="radiogroup"`/`role="radio"`/`aria-checked`; (4) both search inputs relied solely on `placeholder` for their accessible name (not reliable per WCAG 4.1.2) — added `aria-label` and `role="search"`; (5) mobile header had no direct search access, only buried inside the hamburger menu — added a persistent mobile search row, removed the now-redundant one inside the drawer. Also fixed a backend bug surfaced mid-audit: `Product.current_price`'s `MinValueValidator(0)` used a Python `int` on a `DecimalField`, triggering a DRF UserWarning on every request — fixed to `MinValueValidator(Decimal("0"))`, confirmed the warning is gone. Built a verified fallback-image system (`lib/placeholder-images.ts`) — every URL was confirmed real by fetching live Unsplash pages via `web_fetch` and extracting actual CDN links, not guessed photo IDs — replacing bare icon placeholders across product cards, product detail, cart, and vendor avatars. Removed an unused 82KB leftover asset (`bg.jpeg`) and an untouched off-brand scaffold page. Added missing Open Graph/Twitter Card metadata (real gap for a marketplace relying on WhatsApp/social sharing). Added missing production-standard Next.js infrastructure: root `error.tsx` (branded error boundary — previously any unhandled render error showed Next's default unstyled crash screen), `loading.tsx` (route-transition loading state), `robots.ts`, and a dynamic `sitemap.ts` that fetches live product/vendor data from the backend at request time (verified: real seeded products and the vendor appeared in the generated sitemap, not just static routes). Final sweep: all 18 frontend routes plus the two new SEO routes returned correct status codes with zero real console/server errors (only the sandbox's known `fonts.googleapis.com` block, unrelated to app code). | AI |
| 2026-08-19 | 1.5 | Full clean-room verification of both apps per user request, prompted by user-reported build errors. Frontend: fresh `node_modules` reinstall, `npm audit` found 15 real vulnerabilities (axios had ~30 CVEs at its pinned version, plus Next.js itself); `npm audit fix` resolved all 15 with zero breaking changes (axios→1.19.0, Next.js→16.3.1, both within existing semver ranges). Then ran an actual **production build** (`next build`, stricter than dev mode) — it failed outright: `next/font/google` requires live network access to fonts.googleapis.com at BUILD time with no fallback, meaning production builds break entirely in any network-restricted environment (Docker, CI/CD, corporate firewalls) — this was a real, previously-undetected bug, not just a sandbox artifact. Fixed by self-hosting all three fonts via `@fontsource`/`@fontsource-variable` packages (downloaded via the npm registry, not Google's CDN) instead of `next/font/google`; verified the fix by rebuilding — production build now succeeds, and confirmed via direct inspection of the built CSS bundle that zero references to fonts.googleapis.com/fonts.gstatic.com remain and all font assets are self-hosted under `/_next/static/media/`. Backend: fresh venv reinstall, `pip-audit` found 56 known vulnerabilities across 4 packages — most seriously, Django 5.1.4 had a vulnerability (PYSEC-2026-3717) with **no fix released in the 5.1.x branch at all**, meaning it had stopped receiving security patches. Upgraded to Django 5.2.17 (the actively-patched LTS branch); this surfaced a real dependency conflict (`django-celery-beat==2.7.0` caps `Django<5.2`), resolved by upgrading to `django-celery-beat==2.9.0`. Also bumped Pillow→12.3.0, requests→2.34.2, pytest→9.0.3. Re-ran `pip-audit`: zero vulnerabilities. Verified the Django 5.1→5.2 minor-version bump didn't break anything: `manage.py check` clean, `makemigrations` detected zero model-layer changes needed, and the full purchase flow (register→login→address→cart→checkout) was re-run end-to-end against the upgraded stack with a real order successfully created. Final combined sweep: all 20 frontend routes + backend functional flow confirmed working on the fully updated, vulnerability-free dependency set. | AI |
| 2026-08-21 | 1.6 | Documentation overhaul, prompted by user feedback that all three READMEs were inadequate — the frontend one was still literally the untouched `create-next-app` boilerplate (referenced a Geist font this project doesn't use, linked Vercel deploy docs), and the root/backend ones, while accurate, lacked the depth expected of production documentation (no architecture diagram, no full env-var reference tables, no troubleshooting section, no explicit prerequisites/tech-stack tables). Rewrote all three from scratch: root README (project overview, architecture diagram, full repo layout, prerequisites, environment variables, Docker instructions, security/audit section, troubleshooting), frontend README (tech stack, design system summary, full project-structure tree, CSRF-cookie-timing explainer, font self-hosting rationale, shadcn-without-the-CLI instructions, troubleshooting), backend README (per-app responsibility table, full env-var reference table, Celery instructions, business-rules-in-code summary, deployment checklist, troubleshooting). Also fixed this file's own front matter, which had gone stale — `version: 1.0` / `last_reviewed: 2026-08-17` despite five changelog entries already existing up through `1.5` on `2026-08-19`, a real inconsistency the user's question about currency caught. | AI |
| 2026-08-21 | 1.7 | User renamed the backend directory `shoppix-backend` → `shoppix_backend` and moved this file from the repo root into `docs/project-context.md`, on their end (via Windows File Explorer, outside this session). Mirrored both changes locally and swept the whole repo for stale references: root `README.md` (repo-layout tree, 9 path mentions), `shoppix/README.md` (4 mentions), `shoppix_backend/README.md` (4 mentions), `.gitignore` (5 path patterns), this file's own "Repo structure" line, and a stray comment in `shoppix/.env.production`. Confirmed via `grep -r` across the whole repo (excluding `venv`/`node_modules`) that zero references to the old directory name or the old root-level `project-context.md` path remain. | AI |
| 2026-08-22 | 1.8 | Design palette revision (v1→v2), prompted directly by the user viewing the live deployment and giving honest visual feedback: the palette read as "rustic craft stall" rather than premium, and the homepage hero had no real photography — just text and three small decorative mockups that read as filler. Before agreeing, first ruled out a decoy: the user's initial screenshot was from a completely different, unrelated app (different copy, different framework, different footer credit) — confirmed via careful visual diffing before accepting any critique, then confirmed the *second* screenshot genuinely was this build. Revised the palette: Ink deepened to a true near-black with warm undertone (was a muddier brown-black), Marigold deepened into an antique/metallic Gold, Coral deepened into a jewel-toned Wine (replacing the brighter orange-red), Jade deepened into Emerald. Every new pairing re-verified via computed WCAG contrast math (ink/canvas 17.27:1, gold-ink/white 10.37:1, wine/white 10.18:1, emerald/white 10.37:1) rather than assumed safe because it looked fine — the new palette has *better* contrast margins than v1, not just a different mood. CSS variable names kept as-is (`--marigold`, `--jade`, `--coral`) to avoid touching every component file; confirmed via repo-wide `grep` that zero hardcoded hex values exist anywhere that would have bypassed the token-level update. Rebuilt the homepage hero: replaced the three decorative "sticky note" mockups with a full-bleed real photograph (verified via live Unsplash page fetch, not a guessed photo ID) in a premium editorial split layout, with a single confident stat callout instead of three competing small ones. Verified via `tsc`, `eslint`, a full production build (`next build` — all 20 routes compiled clean), and live HTTP checks confirming the new tokens and hero image actually appear in the served CSS/HTML, not just in source. | AI |
