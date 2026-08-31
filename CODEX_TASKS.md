# Codex task list: security, database and server

Division of labour: **Codex owns security, the database and server logistics.**
Claude Code is working on the storefront, the admin content editor and the
design system. Both push to `main`, so `git pull` before you start and before
each push, and keep commits small and clearly described.

Current state is verified, not assumed (checked 2026-08-31):

- All migrations in `supabase/migrations/` are **applied**, including the
  `site-media` storage bucket and the staff-gated catalog write functions.
- The Vercel project `crystalina` is **linked and deployed**;
  https://crystalina.vercel.app serves the current build and the `/api`
  functions execute.
- **Environment variables are not set in Vercel.** `POST /api/newsletter`
  returns 500 because the server boundary cannot reach Supabase.
- `crystalina.org` still resolves to **GitHub Pages**, so no DNS cutover yet.

---

## P0: blocking a real launch

### 1. Set the Vercel environment variables
`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_INBOX`, `TURNSTILE_SECRET_KEY`,
`PUBLIC_SITE_URL`. Names and guidance are in `.env.example` and
`DEPLOY_STEPS.md`. Service role, Stripe and Turnstile secrets are server-only.

Verify: `POST /api/newsletter` with a valid address returns 200 and a row lands
in `newsletter_subscribers`.

### 2. Stripe checkout, end to end
Nothing exists yet; there are zero Stripe references in the codebase.
- `POST /api/checkout/session` creating a Checkout Session from a **server-side**
  recomputation of the cart. Never trust a browser-supplied price.
- `POST /api/stripe/webhook` with signature verification, marking the order
  paid and being **idempotent** on redelivery.
- `create_order` already prices stage options and faucet upgrades server-side;
  reuse it rather than recalculating in JavaScript.
- Re-enable the checkout button in `checkout/index.html` (currently disabled on
  purpose so nobody can place an unpaid order).
- Roll the Stripe test secret key that was pasted into a chat transcript.

### 3. DNS cutover to Vercel
Only after a preview passes. Replace the four GitHub Pages A records with
Vercel's, point `www` at `cname.vercel-dns.com`, and add the Vercel preview URL
plus `https://crystalina.org/**` to the Supabase Auth redirect allow-list.
Keep GitHub Pages live until Vercel reports the domain verified.

### 4. Finish the auth migration
- `js/store.js` still exposes `signUp`/`signIn` stubs that return "being
  configured". Retire them now that `CrystalinaAuth` is live.
- `CrystalinaAuth` is only wired into `/signin/`. Extend it to the pages still
  reading local session state: `/account/`, `/admin/`, `/manager/`, `/sales/`,
  `/technician/`.
- Add password reset and email verification flows.

---

## P1: security hardening

### 5. Confirm no client-only gates remain
Every dashboard currently decides access in the browser. RLS protects the data,
but verify that opening `/admin/` or `/manager/` while signed in as a customer
exposes nothing. Anything sensitive must be gated by a policy, not by markup.

### 6. XSS sweep of the dashboards
`escapeHTML` exists in `js/main.js` and the storefront paths are escaped.
The dashboards still interpolate record fields into `innerHTML` in many places.
Sweep `js/admin.js`, `js/manager.js`, `js/sales.js`, `js/technician.js` and the
schedule modules. Staff-entered text reaching another staff member unescaped is
a real stored-XSS route.

### 7. Turnstile widgets
Server verification is already wired and enforces once `TURNSTILE_SECRET_KEY`
is set. The **widgets are not on the forms yet**: add them to the contact form,
the newsletter form and checkout, passing the token the API already expects.

### 8. Durable rate limiting
`api/_lib/http.mjs` uses an in-process limiter. Serverless instances are short
lived and not shared, so it only blunts casual abuse. Move to Vercel KV,
Upstash, or enable Vercel WAF rate limiting on the `/api` routes.

### 9. Supabase advisors
Run the security and performance advisors in the dashboard and clear the
findings, particularly any table with RLS disabled or an overly broad policy.

---

## P2: data and operations

### 10. Seed the catalog data the schema now supports
- `product_stage_options` is empty: add each buyable build (5, 6, 7 stage) with
  its own `price_cents`, one marked `is_default`. Use `upsert_stage_option`.
- No products have `product_kind = 'faucet'`. Once the faucet products exist,
  set `available_as_upgrade` on the upgradeable ones and `default_faucet_id` on
  each system.
- Stock is 0 for all 13 filters and bundles.

### 11. Order lifecycle
Shipping and dispatch notification emails; order status transitions; refund and
cancellation handling.

### 12. Backups and monitoring
Scheduled Supabase backups, and error monitoring (Sentry or similar) on both
the functions and the browser.

---

## Conventions to keep

- Browser code may use the **publishable key only**. Every privileged mutation
  goes through `/api` or a `security definer` function gated on
  `private.has_role(...)`.
- Prices, totals and stock are recomputed server-side. The browser sends ids
  and quantities, never money.
- Migrations are additive and re-runnable: `create or replace`, `if not exists`,
  drop-then-create for policies.
- Run `npm test` before pushing. All 20 tests currently pass.
