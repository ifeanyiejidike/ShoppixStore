# Shoppix — Frontend

Next.js frontend for Shoppix, a multi-vendor e-commerce marketplace for the
Nigerian market. Customer-facing storefront (browse, cart, checkout, orders,
reviews) and vendor-facing tools (apply, dashboard, product/order
management) in one app.

For what the project *is* as a whole, see the [root README](../README.md).
For architecture decisions, feature status, and open gaps, see
[`project-context.md`](../docs/project-context.md).

## Table of contents

- [Tech stack](#tech-stack)
- [Design system](#design-system)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Project structure](#project-structure)
- [Connecting to the backend](#connecting-to-the-backend)
- [Fonts — self-hosted, not next/font/google](#fonts--self-hosted-not-nextfontgoogle)
- [Adding a shadcn/ui component](#adding-a-shadcnui-component)
- [Testing & verification](#testing--verification)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui components on Radix primitives |
| Forms & validation | react-hook-form + zod |
| HTTP client | axios (session-cookie + CSRF auth against the Django backend) |
| Toasts | sonner |
| Icons | lucide-react |
| Fonts | Fraunces, Inter, IBM Plex Mono — self-hosted via `@fontsource` |

## Design system

Not default shadcn/ui styling — a custom system defined in
`src/app/globals.css` as CSS custom properties, mapped to Tailwind tokens via
`@theme inline`.

- **Palette**: Ink `#10241C` (near-black green, text/dark surfaces), Canvas
  `#F6F5EF` (warm paper background), Marigold `#E8A33D` (primary
  accent/CTAs), Jade `#12684A` (secondary/vendor accent), Coral (destructive/
  urgency — tuned to `hsl(13 74% 44%)` specifically to pass WCAG AA contrast
  against light backgrounds; don't lighten it back without re-checking
  contrast).
- **Type**: Fraunces (display/headings, used italic) + Inter (body/UI) + IBM
  Plex Mono (prices, order references — a deliberate "receipt/ledger"
  register for commerce data).
- **Signature element**: a die-cut "price tag" notch (`.price-tag` utility
  class) on product cards and hero decorative elements — a literal
  market-price-tag motif tying back to the brand.
- **Accessibility floor**: WCAG 2.1 AA. Every color pairing used for text has
  been checked against this, not just chosen by eye — see
  `docs/project-context.md` §11 changelog for the specific contrast audit.

## Prerequisites

- Node.js 20+
- npm 10+
- The backend running (see [root README](../README.md#getting-started)) —
  this app has no mock-data mode, it expects a real API to talk to.

## Setup

```bash
npm install
cp .env.example .env    # defaults already point at http://localhost:8000
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

`.env.example` is the only tracked template — every real variant
(`.env`, `.env.local`, `.env.production`) is gitignored.

| Variable | Example | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend origin, **no** `/api` suffix — the client appends it. Must match a host in the backend's `CORS_ALLOWED_ORIGINS`/`CSRF_TRUSTED_ORIGINS`. |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Used for metadata, Open Graph URLs, and sitemap generation. |

Next.js's env-file precedence applies: `.env.local` > `.env.production`/
`.env.development` (depending on mode) > `.env`. Use `.env.local` for
machine-specific overrides you never want committed (it's gitignored either
way, but keeping it separate from `.env` avoids merge noise).

## Available scripts

```bash
npm run dev      # dev server with Turbopack, http://localhost:3000
npm run build    # production build — stricter than dev, run this before
                 # trusting anything is actually production-ready
npm run start    # serve the production build (run `build` first)
npm run lint     # eslint
```

There's no test script yet — see `docs/project-context.md` §10 (Open Gaps).
Type-checking isn't a package.json script but is run directly:

```bash
npx tsc --noEmit
```

## Project structure

```
src/
├── app/                      App Router — one folder per route
│   ├── (marketing/shop pages) page.tsx, products/, vendors/, cart/, checkout/
│   ├── account/                Layout + profile/orders/addresses pages
│   ├── auth/                   login/register/forgot-password/reset/verify-email
│   ├── vendor/                 apply/, dashboard/
│   ├── layout.tsx              Root layout — fonts, providers, Header/Footer
│   ├── globals.css             Design tokens (the actual design system)
│   ├── error.tsx                Branded error boundary
│   ├── loading.tsx              Route-transition loading state
│   ├── not-found.tsx            404 page
│   ├── robots.ts                robots.txt generation
│   └── sitemap.ts               Dynamic sitemap (fetches live products/vendors)
│
├── components/
│   ├── ui/                     shadcn/ui primitives (button, select, dialog, ...)
│   ├── shared/                  Header, Footer
│   ├── products/                ProductCard, ProductGrid, filters, reviews
│   ├── home/                    Hero, category rail, flash deals, featured
│   ├── account/                 ShippingAddressForm
│   ├── vendor/                  ProductForm (vendor dashboard)
│   └── auth/                    AuthCard, PasswordInput
│
├── context/                  AuthProvider, CartProvider (React context)
├── hooks/                     useAuth, useCart
└── lib/
    ├── api/                    Typed client functions per backend domain
    │                           (accounts, vendors, catalog, cart, orders,
    │                            payments, reviews) — the only place that
    │                            should import axiosInstance directly
    ├── axios.config.ts         The actual axios instance + CSRF interceptor
    ├── types.ts                 TypeScript types mirroring DRF serializers
    ├── schema.ts                 zod schemas matching backend validation
    ├── constants.ts              Site constants, Nigerian states list
    ├── utils.ts                  cn(), currency formatting, error extraction
    └── placeholder-images.ts     Verified fallback imagery for products/vendors
                                  without uploaded photos
```

## Connecting to the backend

The axios client (`lib/axios.config.ts`) is configured for the backend's
session + CSRF auth:

- `withCredentials: true` — sends/receives the `sessionid` and `csrftoken`
  cookies.
- An interceptor reads the `csrftoken` cookie **fresh on every unsafe
  request** (POST/PUT/PATCH/DELETE) and sets it as the `X-CSRFToken` header.
  This matters: Django rotates the CSRF token on login, so if you ever
  refactor this to cache a token instead of reading the cookie live, you
  will reintroduce a real bug (writes will 403 after login).
- `AuthProvider` calls `GET /api/accounts/csrf/` once on mount, before
  checking whether a session is already active — this is what makes the
  cookie exist in the first place.

All actual API calls go through `lib/api/*.ts`, not raw axios calls
scattered through components — each file is a thin, typed wrapper per
backend app (`accounts.ts`, `catalog.ts`, etc.), so the shape of every
request/response is known at compile time and matches the DRF serializers
exactly (cross-checked against live API responses, not just assumed).

## Fonts — self-hosted, not next/font/google

Fraunces, Inter, and IBM Plex Mono are loaded via `@fontsource-variable/*`
and `@fontsource/ibm-plex-mono`, imported directly in `app/layout.tsx` — not
via `next/font/google`.

This is a deliberate choice, not an oversight: `next/font/google` needs live
network access to `fonts.googleapis.com` at **build** time, with no
fallback. In a network-restricted build environment (Docker, CI/CD,
corporate firewall), `next build` fails outright — confirmed during this
project's development. Self-hosting removes that dependency entirely, and
as a side benefit avoids a third-party network request to Google at runtime
too.

If you ever touch font setup, keep this property. Verify with:

```bash
npm run build   # should succeed with no network-related errors
# then check the built CSS has no external font-CDN references:
grep -r "fonts.googleapis\|fonts.gstatic" .next/static/ || echo "clean"
```

## Adding a shadcn/ui component

The shadcn CLI (`npx shadcn add ...`) needs to reach `ui.shadcn.com`, which
may not be available in every environment this project gets built in. If the
CLI isn't reachable, install the underlying Radix primitive via npm and
hand-write the component using shadcn's standard source (consistent with how
`select.tsx`, `checkbox.tsx`, `tabs.tsx`, `textarea.tsx`, and `dialog.tsx`
were added to this project) — copy the pattern from an existing file in
`components/ui/` rather than inventing a new style.

## Testing & verification

There's no automated test suite yet (see `docs/project-context.md` §10). Until
one exists, treat these as the minimum bar before considering a change done:

```bash
npx tsc --noEmit       # type check
npx eslint src          # lint
npm run build            # full production build
```

All three should be clean before shipping anything. This project's history
has repeatedly caught real bugs this way — type mismatches from zod's
`coerce` fields, invalid nested-interactive-element HTML, and the font
build-failure above were all caught by one of these three, not by eyeballing
the code.

**What these three don't catch**: actual visual rendering. No environment
this project has been built in so far has had a working headless browser, so
UI correctness has been verified by code review, computed contrast math, and
live HTTP/HTML inspection — not by a human (or automated tool) actually
looking at rendered pages. Do a manual pass in a real browser across
realistic breakpoints before trusting the UI is visually correct.

## Deployment

Not deployed anywhere yet. `npm run build && npm start` produces a
production server; see the [root README's deployment notes](../README.md#deployment-notes)
for what's still outstanding (hosting target, real backend URL, etc.)
before that matters.

## Troubleshooting

**"Cannot find module" for a `@fontsource*` package**: run `npm install`
again — these are real dependencies, not optional.

**CSRF 403s**: see the [root README's troubleshooting section](../README.md#troubleshooting)
— this is almost always a stale-token issue, not a frontend bug, and the
frontend's own axios setup already avoids it (see
[Connecting to the backend](#connecting-to-the-backend)).

**Images not loading from the backend or Unsplash**: check
`next.config.ts`'s `images.remotePatterns` — any new external image host
needs to be added there explicitly, Next.js blocks unlisted domains by
design.

**TypeScript errors after pulling changes**: run `npm install` (a schema or
type change likely came with a dependency bump) before assuming the code
itself is broken.
