# Crystalina

A premium home water filtration shop for New York City. Pure HTML, CSS and
JavaScript with no bundler, Cloudflare Pages Functions for the server
boundary, and Supabase for data and identity.

**Read `docs/blueprint.html` before changing anything structural.** It is the
record of what exists, what is decided and why, and what is still unknown.
It is generated; its source is `docs/blueprint-content.mjs` and
`docs/diagrams/model.mjs`.

## The rule that matters most

**If an element appears more than once, it is built once, and every screen
calls it.** A variation is a parameter, never a second copy. Before writing
markup, look for the component. If it half exists, extend it.

| Concern | File |
| --- | --- |
| Design tokens and every component | `css/styles.css` |
| Shared UI, icons, `escapeHTML` | `js/main.js` |
| Local cache, hydrated from Supabase | `js/store.js` |
| Supabase reads, writes and uploads | `js/data-remote.js` |
| Server boundary | `api/*.mjs`, run by `functions/api/*.js` |
| Schema | `supabase/migrations/` |
| The system as data, for the diagrams | `docs/diagrams/model.mjs` |
| Diagram components and icons | `scripts/lib/components.mjs`, `scripts/lib/icons.mjs` |

Three things still have no single home and should get one:
the free shipping threshold (written in three places), the navigation and
social links (in every page head), and the repeatable items inside home page
sections. See section 13 of the blueprint.

## Commands

```bash
npm test             # 29 tests, about a second
npm run serve        # the site on http://localhost:4321
npm run build:site   # assemble dist/ from the publish allow-list
npm run docs         # rebuild every diagram and the blueprint
npm run check        # tests, build, and both drift checks
```

`npm run verify -- /shop/` renders a page in a real browser and reports
console errors, overflow, contrast and weight. It needs puppeteer
(`npm i -D puppeteer`) and the server running.

## Build, then look

After any visual change, serve the site and look at the page. Root-absolute
paths mean opening an HTML file directly gives unstyled markup and a false
impression of a broken page. Measure what you claim: widths, gaps, contrast,
weight.

## Voice

Client facing and professional, addressed to the reader and never to the
designer.

- **No em dashes or en dashes.** Use commas and full stops. Ranges read
  "1961 to 1990".
- No emoji anywhere. Icons are the stroke line-icons in `ICONS` in
  `js/main.js`.
- No "placeholder", "coming soon", "concept", or notes to self in visible
  text. If something is not built, say so in the blueprint, not on the page.
- Palette: navy `#15375D` / `#1F4C80`, blue `#2A7BC4`, light blue `#53A4DA`,
  cyan `#3DC7F4`, silver `#CFD2D3`, white. No greens, purples or warm casts
  anywhere a customer can see. The wider palette in
  `scripts/lib/tokens.mjs` is for internal diagrams only.
- Type: **Montserrat** for text, **Playfair Display** for headings, standing
  in for Canela until it is licensed (AD8).
- Paths are root-absolute (`/css/...`), URLs are clean folders.
- Buttons use the unified centre-out fill hover. Do not reintroduce ad hoc
  button styles.

## Security rules that are not negotiable

- The browser holds the **publishable key only**. Every privileged write goes
  through `/api` with the service role, or a `security definer` function
  gated on `private.has_role(...)`.
- Prices, totals and stock are recomputed in the database. The browser sends
  ids and quantities, **never money**.
- Everything that reaches `innerHTML` goes through `escapeHTML` first. The
  dashboards do not yet, and that is an open finding, not a convention.
- Migrations are additive and re-runnable: `create or replace`,
  `if not exists`, drop-then-create for policies.
- Secrets live in the Cloudflare Pages dashboard, per environment. Never in
  the repository, never in a variable that reaches the browser, never in
  chat.

## What is published

`npm run build:site` copies an explicit list into `dist/`, and Pages
publishes `dist/`. **Adding a file to the site means naming it in
`scripts/build-site.mjs`.** Serving the repository root publishes the
repository: on 2026-10-09 the live Vercel host was serving the SQL
migrations, the tests and the internal task list to anyone who asked.

## Not yet built, and must not be connected to real data

- **Payment.** There is no Stripe integration. The checkout button is
  disabled on purpose. Do not enable it to "test the flow".
- **Catalogue data.** Stock is 0 everywhere, `product_stage_options` is
  empty, and no faucet products exist.
- **Dashboard access control.** Row level security protects the data; the
  gate in front of the dashboards is browser-side and unproven (U1).

## Two assistants

Claude Code and Codex both commit to `main`. Read `COORDINATION.md` before
you start, `git pull` before you start and before each push, and keep commits
small and clearly described. Amend the blueprint in the same commit as the
change it describes.
