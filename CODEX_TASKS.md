# Codex task list: security, database and server

**Issued:** Monday 2026-08-31 · **State verified:** 2026-08-31 · **Review by:** 2026-09-07

Each task carries a target window and a `Status:` line with the date it was last
checked. If a status is older than about a week, re-verify before trusting it:
this repo has two assistants committing to `main`, so items can be completed
out from under the list.

Target windows below are working-day estimates from the issue date, not hard
deadlines. Do them in priority order; P0 items block a real launch.

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
**Target: by Fri 2026-09-04.** Nothing can go live until these are done.

### 1. Set the Vercel environment variables
_Target: Tue 2026-09-01 · Status (2026-08-31): **not started**. `POST /api/newsletter` returns 500, so the server boundary cannot reach Supabase._
`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_INBOX`, `TURNSTILE_SECRET_KEY`,
`PUBLIC_SITE_URL`. Names and guidance are in `.env.example` and
`DEPLOY_STEPS.md`. Service role, Stripe and Turnstile secrets are server-only.

Verify: `POST /api/newsletter` with a valid address returns 200 and a row lands
in `newsletter_subscribers`.

### 2. Stripe checkout, end to end
_Target: Thu 2026-09-03 · Status (2026-08-31): **not started**. Zero Stripe references in the codebase._
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
_Target: Fri 2026-09-04, after 1 and 2 pass on a preview · Status (2026-08-31): **not started**. crystalina.org still serves from GitHub Pages._
Only after a preview passes. Replace the four GitHub Pages A records with
Vercel's, point `www` at `cname.vercel-dns.com`, and add the Vercel preview URL
plus `https://crystalina.org/**` to the Supabase Auth redirect allow-list.
Keep GitHub Pages live until Vercel reports the domain verified.

### 4. Finish the auth migration
_Target: Fri 2026-09-04 · Status (2026-08-31): **partly done**. `CrystalinaAuth` is live but only on `/signin/`; the `Store` sign-in stubs remain._
- `js/store.js` still exposes `signUp`/`signIn` stubs that return "being
  configured". Retire them now that `CrystalinaAuth` is live.
- `CrystalinaAuth` is only wired into `/signin/`. Extend it to the pages still
  reading local session state: `/account/`, `/admin/`, `/manager/`, `/sales/`,
  `/technician/`.
- Add password reset and email verification flows.

---

## P1: security hardening
**Target: by Fri 2026-09-11.** Required before the site takes public traffic.

### 5. Confirm no client-only gates remain
_Target: Mon 2026-09-08 · Status (2026-08-31): **unverified**. RLS is in place; the browser-side gating has not been tested against a customer account._
Every dashboard currently decides access in the browser. RLS protects the data,
but verify that opening `/admin/` or `/manager/` while signed in as a customer
exposes nothing. Anything sensitive must be gated by a policy, not by markup.

### 6. XSS sweep of the dashboards
_Target: Tue 2026-09-09 · Status (2026-08-31): **partly done**. Storefront paths are escaped; the dashboards are not._
`escapeHTML` exists in `js/main.js` and the storefront paths are escaped.
The dashboards still interpolate record fields into `innerHTML` in many places.
Sweep `js/admin.js`, `js/manager.js`, `js/sales.js`, `js/technician.js` and the
schedule modules. Staff-entered text reaching another staff member unescaped is
a real stored-XSS route.

### 7. Turnstile widgets
_Target: Wed 2026-09-10 · Status (2026-08-31): **server side done, widgets missing**._
Server verification is already wired and enforces once `TURNSTILE_SECRET_KEY`
is set. The **widgets are not on the forms yet**: add them to the contact form,
the newsletter form and checkout, passing the token the API already expects.

### 8. Durable rate limiting
_Target: Thu 2026-09-11 · Status (2026-08-31): **in-process only**, which does not survive across serverless instances._
`api/_lib/http.mjs` uses an in-process limiter. Serverless instances are short
lived and not shared, so it only blunts casual abuse. Move to Vercel KV,
Upstash, or enable Vercel WAF rate limiting on the `/api` routes.

### 9. Supabase advisors
_Target: Fri 2026-09-11 · Status (2026-08-31): **not run since the 2026-08-30/31 migrations**._
Run the security and performance advisors in the dashboard and clear the
findings, particularly any table with RLS disabled or an overly broad policy.

---

## P2: data and operations
**Target: by Fri 2026-09-25.** Needed for day-to-day running, not for the cutover.

### 10. Seed the catalog data the schema now supports
_Target: Fri 2026-09-18 · Status (2026-08-31): **schema live, tables empty**. No stage options, no faucet products, stock 0 on 13 items._
- `product_stage_options` is empty: add each buyable build (5, 6, 7 stage) with
  its own `price_cents`, one marked `is_default`. Use `upsert_stage_option`.
- No products have `product_kind = 'faucet'`. Once the faucet products exist,
  set `available_as_upgrade` on the upgradeable ones and `default_faucet_id` on
  each system.
- Stock is 0 for all 13 filters and bundles.

### 11. Order lifecycle
_Target: Fri 2026-09-25 · Status (2026-08-31): **not started**. Order confirmation email exists; dispatch and refund flows do not._
Shipping and dispatch notification emails; order status transitions; refund and
cancellation handling.

### 12. Backups and monitoring
_Target: Fri 2026-09-25 · Status (2026-08-31): **not started**._
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

---

## Keeping this list current

When you finish a task, change its `Status:` line to
`Status (YYYY-MM-DD): **done**` with a one-line note on how it was verified,
and add a row below. Do not delete completed tasks; a dated record of what was
checked and when is more useful than a short list.

| Date | Task | Change | By |
|---|---|---|---|
| 2026-08-31 | — | List issued; state verified against the live project | Claude Code |
