# Crystalina

A premium home water filtration shop for New York City. Pure HTML, CSS and
JavaScript with no bundler, one Cloudflare Worker that serves `dist` and
routes `/api/*` (AD10), and Supabase for data and identity.

**Read the blueprint before changing anything structural.** It is the record
of what exists, what is decided and why, and what is still unknown. It has
one editor, the design session: send it what you have found or built through
`COORDINATION.md`, with the evidence, and it decides what is valid and what
is recorded. Nobody else edits its sources, its generator or the Artifact.

- **https://claude.ai/artifact/SrRGRwrLYrSisyGC53rCLo** is the published
  Artifact, and the copy to send anyone.
- `docs/blueprint.html` is the same page as a file in the repository.

Both are generated from `docs/blueprint-content.mjs` and
`docs/diagrams/model.mjs`. Never edit either output: `npm run docs`
overwrites them.

## The rule that matters most

**If an element appears more than once, it is built once, and every screen
calls it.** A variation is a parameter, never a second copy. Before writing
markup, look for the component. If it half exists, extend it.

| Concern | File |
| --- | --- |
| Design tokens and every component | `css/styles.css` |
| The library, rendered live, for looking | `docs/components.html` at /docs/components.html when served |
| Shared UI, icons, `escapeHTML` | `js/main.js` |
| Local cache, hydrated from Supabase | `js/store.js` |
| Supabase reads, writes and uploads | `js/data-remote.js` |
| Server boundary | `api/*.mjs`, routed by `worker.js` |
| Schema | `supabase/migrations/` |
| The system as data, and every detail panel | `docs/diagrams/model.mjs` |
| Derived dependency lists, in both directions | `scripts/lib/graph.mjs` |
| The blueprint's click-to-inspect viewer | `scripts/lib/viewer.mjs` |
| Diagram components and icons | `scripts/lib/components.mjs`, `scripts/lib/icons.mjs` |

Three things still have no single home and should get one: the free
shipping threshold (written out ten times across six files, checked
2026-11-02), the schema.org `sameAs` list that repeats the footer's social
links, and the five blocks of repeatable items inside home page sections.
See "One definition, read everywhere" in the blueprint.

## Commands

```bash
npm test             # 35 tests over 6 files, about a second
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
designer. The subject is health: what a household drinks every day, and the
quiet confidence of having taken care of it. New York water is why we know
what we are doing, not the headline. Affordability is said as value, never
as cheapness; speed as ease; the product as care. Subtle and eloquent,
never breathless. "Water Facts", not "NYC Water Facts".

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
- **Two colours are sanctioned exceptions, and there are no others.** The
  four-colour Google G inside the sign-in button, and WhatsApp green
  `#25D366` on the `.wa-float` button. Both are another company mark, where
  recolouring it to the palette would misrepresent the brand and, for
  Google, break their terms. Neither licenses a third green: a new
  third-party mark is a decision, not a precedent.
- Type: **Montserrat** for text, **Playfair Display** for titles (AD8). Four
  weights exist, and they are tokens: `--w-regular` 400, `--w-medium` 500,
  `--w-semibold` 600, `--w-bold` 700. **Never write a numeric font-weight.**
  Montserrat sets everything that is read, including all dashboard text.
  Playfair sets titles, the button label, prices and the large storefront
  numerals. The rule is written out at the top of `css/styles.css` (AD12).
- Paths are root-absolute (`/css/...`), URLs are clean folders.
- Buttons use the unified centre-out fill hover. Do not reintroduce ad hoc
  button styles.

## Security rules that are not negotiable

- The browser holds the **publishable key only**. Every privileged write goes
  through `/api` with the service role, or a `security definer` function
  gated on `private.has_role(...)`.
- Prices, totals and stock are recomputed in the database. The browser sends
  ids and quantities, **never money**.
- Everything that reaches `innerHTML` goes through `escapeHTML` first.
  `js/admin.js` does not, in about thirty places, and that is an open
  finding rather than a convention. The other dashboards were checked on
  2026-11-02 and do escape their record text.
- Migrations are additive and re-runnable: `create or replace`,
  `if not exists`, drop-then-create for policies.
- Secrets live in the Cloudflare dashboard, per environment. Never in the
  repository, never in a variable that reaches the browser, never in chat.

## What is published

`npm run build:site` copies an explicit list into `dist/`, and the Worker
serves `dist/` through its ASSETS binding. **Adding a file to the site means naming it in
`scripts/build-site.mjs`.** Serving the repository root publishes the
repository: on 2026-10-09 the live Vercel host was serving the SQL
migrations, the tests and the internal task list to anyone who asked.

## Not yet built, and must not be connected to real data

- **Payment.** There is no Stripe integration. The checkout button is
  disabled on purpose. Do not enable it to "test the flow".
- **Catalogue data.** Thirteen of the seventeen seeded products carry
  stock 0, `product_stage_options` has no rows, and no faucet products
  exist.
- **Dashboard access control.** Row level security protects the data; the
  gate in front of the dashboards is browser-side and unproven (U1).

## Who works here

Claude Code does the building, across more than one session at a time, and
the sessions cannot message each other. Codex no longer writes code here:
it generates images, to the briefs in `IMAGE_PROMPTS.md`.

Read `COORDINATION.md` before you start, take the claims table seriously
because another session may be in the same file, `git pull` before you start
and before each push, and keep commits small and clearly described. Amend
the blueprint in the same commit as the change it describes.

## Pushing goes straight to the live site

**Owner's instruction, 2026-11-03, until he says otherwise: commit and push
to `main` directly. Do not open a pull request and do not wait to be told
to push.** Cloudflare builds every push to `main` and the Worker serves it,
so a push is a deploy. He does not want to approve them one at a time.

That removes the only thing standing between a mistake and a customer, so
the checks have to carry the weight instead:

- **`npm run check` passes before every push.** Tests, the publish
  allow-list, and both drift checks. No exceptions, including for a change
  that "only touches documentation".
- **Serve it and look at the page** you changed, at desktop and phone
  width, before pushing. On 2026-11-03 a blank shop page reached the live
  site because a stale `main.js` was cached and nobody loaded `/shop/`
  after the deploy.
- **Push small.** A push that does one thing can be reverted in one
  command; a push that does nine cannot.
- **If you break the live site, say so and fix it forward.** Rolling back
  is promoting the previous deployment in the Cloudflare dashboard, which
  only the owner can do, so a fix you can push beats a rollback you have
  to ask for.
