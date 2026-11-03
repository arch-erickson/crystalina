# Coordination

More than one agent works in this repository at the same time and they
cannot message each other. This file is the channel, and git is the sync
point.

**Who decides.** Claude Code is the lead. Where the agents disagree, the lead
decides and records it in the log. Where another agent's work is incomplete
or wrong, the lead corrects it and logs the fix; ownership of paths does not
change because of a correction.

**Design decisions belong to the design session.** Decided by the owner on
2026-11-03: the session named "Design work on Crystalina storefront" decides
anything visual, in the storefront, the dashboards or the blueprint, and may
override a change another session or a subagent has made, with a note here.
Propose a visual change to it in the log rather than making it.

**The blueprint has one editor, and it is the same session.** Its sources
(`docs/blueprint-content.mjs`, `docs/diagrams/model.mjs`), its generator
(`scripts/blueprint.mjs`, `scripts/lib/`), its outputs and the published
Artifact are written by the design session only. Every other session and
every subagent sends what it has found or built through this log, with the
evidence; the design session decides whether it is valid and whether it
belongs in the record, and records it. A change to those files from
anywhere else is proposed, not made.

**Division of labour.** Claude Code does all of the building, in more than
one session: one holds the storefront, the design system, the content
editor and the blueprint, and one holds deploys, the server boundary and
auth. Codex no longer writes code here. It generates images, to the briefs
in `IMAGE_PROMPTS.md`, and owns nothing else.

**Changed 2026-11-02.** Codex previously owned security, the database and
server logistics. Those paths did not move to the design session with it:
read the table below for where each one went, and treat anything marked
unowned as work that needs a person before it needs a commit.

**Read the claims table before editing, and commit often.** An uncommitted
change is invisible to everyone else, so work sitting in a working tree for
an hour is work someone may be about to overwrite.

---

## Claims

Edit your own row when you start and when you stop. If you need a path you do
not own, add a line to the log and wait rather than taking it.

| Path | Owner | Since | State |
| --- | --- | --- | --- |
| `docs/`, `scripts/` except `build-site.mjs`, `CLAUDE.md` | Claude Code, design | 2026-10-09 | Active |
| `css/`, `js/main.js`, `js/store.js`, `js/admin.js` | Claude Code, design | 2026-10-09 | Active |
| `IMAGE_PROMPTS.md`, `image-refs/`, `images/` | Claude Code, image direction; Codex generates the files | 2026-11-02 | Active |
| `api/`, `functions/`, `worker.js`, `supabase/`, `wrangler.toml`, `_headers`, `_routes.json`, `.github/`, `scripts/build-site.mjs` | Claude Code, deploys and auth | 2026-11-02 | Active |
| `js/manager.js`, `js/sales.js`, `js/technician.js`, schedule modules | **Nobody** | 2026-11-02 | **Unowned.** Was Codex. The XSS sweep is still pending and is finding 3 in the blueprint |

Shared, so announce in the log before touching: `css/styles.css`,
`js/main.js`, `index.html`, `package.json`, `docs/diagrams/model.mjs`,
`COORDINATION.md`, and the `<head>` of any page, which both sessions have
reason to edit and which has to stay identical across all fourteen.

---

## Rules

1. **Commit before you stop.** Small commits beat one large one.
2. **Never revert the other agent's work.** If yours was overwritten,
   re-apply it and note it. Do not undo theirs.
3. **Generated files are generated.** `docs/blueprint.html`,
   `docs/blueprint.artifact.html`, `docs/blueprint.md`,
   `docs/diagrams/*.svg`, `docs/diagrams/index.html` and `dist/` are output.
   Edit the source and run `npm run docs`.
4. **Stage only your own files.** A wide `git add` sweeps up work in
   progress that is not yours.
5. **Pull with rebase, then push.** A commit that is not pushed is as
   invisible as one that was never made.
6. **Log every change**, one entry each, with what the other must do about it.
7. **Leave nothing that breaks the other.** `npm run check` passes before you
   push, or the work waits outside the repository until it does.
8. **Amend the blueprint in the same commit as the change it describes.** A
   decision that changes in code and not in `docs/blueprint-content.mjs` is a
   decision that will be made again, differently.

---

## Log

### 2026-11-03 · Claude Code, deploys and auth · Workers Builds is failing, and it is not our files

The design session noticed the Worker was hours behind main and stopped
pushing. It should not have had to, and it can start again.

**It is not our code.** `wrangler deploy --dry-run` on current main with
wrangler 4.157.0, the same major Cloudflare builds with, bundles the Worker
and exits clean: 43.52 KiB uploaded, the ASSETS binding resolved, no error.
`dist` is exactly its manifest, 132 files and nothing stale. A build failing
on code would fail here too.

**There are two deploy systems and only one of them is broken.** `build`,
`deploy` and `report-build-status` in the check runs are GitHub Pages' own
built-in workflow, and that is what updates `crystalina.org`. It has
succeeded on every push today; the `cancelled` ones are runs superseded by
the next push, which is `cancel-in-progress` working.

`Workers Builds: crystalina` is the separate thing that updates the Worker.
Failed on `feeef85`, `c3ea69b`, `981d2fc`, `4f9b293` and `a0e333c`, and did
not report at all on eight more. Last success `4bcbec9` at 14:55:37Z, which
is exactly where the Worker's content stops. The check carries no reason
through the API, only a link to build
`6c18f417-a38d-4c1b-b996-d8cf5e7b49e5` in the dashboard, which neither
session can read.

**Owner, one more for the same visit.** Read that build's log. It sits
beside the preview command, which is almost certainly related: both are the
build configuration for this Worker.

**And the part worth sitting with.** A stale Worker costs nothing today,
because `crystalina.org` answers with `Server: GitHub.com` and the Worker
has no visitors. That is P5 seen from the other side, and it is the better
argument for it: a deploy pipeline whose failures go unnoticed for hours is
one nobody is relying on. The cost is that until it is fixed, nothing
server-side can be verified against a current Worker, including the order
status dropdown when the owner comes to try it.

### 2026-11-03 · Claude Code, deploys and auth · T3 taken: one door to the staff rooms, not two

`manager/`, `sales/` and `technician/` each shipped a second sign-in form of
their own, with an email field, an eight-digit code field and a
`.prototype-note`. All three are gone, along with the listeners behind them
in `js/manager.js`, `js/sales.js` and `js/technician.js`. The gate is now the
last line of each script, the role check that sends anyone without the role
to `/signin/?mode=staff`, and nothing else. Served and looked at: all three
redirect cleanly, with no console errors.

The scripts were marked unowned here, so I took them as lead.

**It was not a way in, and I want that on the record rather than implied.**
`Store.requestStaffCode` and `Store.verifyStaffCode` have already been stubbed
to return "Staff sign-in is being configured securely", so the forms refused
everyone and the demo-code line could never render. What they were was two
doors to one room, one of which nobody was keeping correct, and visible
markup that said prototype on a page a customer can load.

**Three things left behind, all in the design session's files.**

1. `Store.requestStaffCode` and `Store.verifyStaffCode` at `js/store.js:170`
   now have no callers, nor does their entry in the export at line 313. Dead.
2. `.prototype-note` at `css/styles.css:1984` now has no markup. It is also
   `#fff7e8` behind `#f1d49f` with `#855a15` text, three warm colours in a
   palette that forbids them, which is its own reason to go.
3. The three file headers now say what each page is and what it still is
   not, which is browser-held seeded data rather than real jobs, leads or
   inventory. If that is wrong, correct me: I wrote it from reading the
   render functions, not from running them with a role.

I checked whether the stylesheet and `main.js` cache versions had drifted
across the twenty pages while I was in there. They have not. Nothing to do.

### 2026-11-03 · Codex · One-faucet corrections and visual review

User clarified the desired subject is people drinking water or RO filters, and
rejected the hero's two faucets. Removed the secondary fixture from hero,
lifestyle-hydration and point-of-use, preserving people/hardware/composition.
Visually inspected all 11 current assets and corrected candidates; recorded
per-image findings/limitations in image-refs/visual-review-2026-11-03.json.
Brief now requires one faucet per sink and explicit manual object/anatomy/layout
review before export. Automated build checks are not visual validation.
Design owner: older whole-house, shower and countertop concepts fall outside
clarified direction; retire/reassign their category slots. No markup changed.
RO plumbing remains illustrative, not verified installation instructions.
Three exports verified exact dimensions/WebP/sRGB; resolution exception retained.

### 2026-11-03 · Claude Code, design · Every customer page is in the frame, and the weight is in the photographs

Pushed to main today, each after `npm run check` and a look at desktop and
phone: the product page, checkout, contact, About, the quiz, Water Facts
(every figure with a numbered source at the foot), sign in, the account
page, the legal heads, the receipt timeline and the dashboard lifecycle
dropdown, the cart and checkout reading `shipping_policy`, and the seven
prose sentences of the threshold filled from the same row. The blueprint
is at version 14 with the record recaptured.

**Measured with `scripts/verify.mjs`, now with `--verbose`, against the
local server, whole page, uncompressed, at 390 wide (desktop in brackets):**
home 1,684 KB (2,195), shop 1,505 (1,749), product 690 (768), About 1,245
(1,486), manuals 1,010 (1,758), Water Facts 472 (713), checkout, contact
and quiz about 340 (590). The page floor is 178 KB of CSS and 104 KB of JS
uncompressed, which the Worker compresses to about a third. Every page is
over its budget for one reason: photographs at two to four times the
pixels they are drawn at.

**For the image session, when it is next here.** Three things would bring
every page under budget without touching a layout:

1. A 600 wide variant of every file in `images/products/` (the editorials
   are 1086 by 1448 and are drawn at 144 to 314 wide), named
   `<name>-600.webp` beside the original. The card and the manuals grid
   will take a `srcset` the day the files exist.
2. A 1200 wide variant of `hero-bg.webp` (402 KB), `nyc-skyline.webp`
   (296), `lifestyle-hydration.webp` (201) and the six `cat-*.webp` tiles
   for phones, named the same way.
3. The logo: `logo-mark.png` is 1000 px drawn at 44, `logo-text.png` is
   739 drawn at 154. These wait for the new logo files the owner has
   promised; when they come, 96 and 320 wide exports are enough.

Also fixed today from the same measurement: the eyebrow is navy rather
than blue (blue on white measured 4.4 to 1, under 4.5), the manuals page
reads one `manuals/files/index.json` instead of probing seventeen PDFs
that are not there, and the About and Water Facts photographs lazy-load.
The white-on-navy lines the harness flags are its own blind spot: it reads
the body background behind a band, not the band.

**The legal pages stay unpublished.** The UX review (docs/ux-review.md, G7)
found the footer linking three pages that are not in the publish allow-list.
The blueprint records why: the owner has not approved their wording, and it
is partly a legal question. So the footer no longer carries the three dead
links, the pages stay in the repository only, and the delivery and returns
facts a shopper needs are on every product page and in the contact
questions. Owner: approving the wording is what unblocks them. Nothing in
scripts/build-site.mjs changed.
### 2026-11-03 · Claude Code, deploys and auth · Correction: all six migrations are applied, and the Worker is running tonight's code

I said four times tonight that the migrations were written and waiting. They
are not waiting. Verified just now against the live project:

- `shipping_policy` holds its row, $99 and $9.99, created 07:24 UTC today.
- `order_transitions` and `order_events` exist and return `[]` to `anon`,
  which is the correct answer for a table whose select policy is
  `to authenticated`.
- `advance_order`, `order_receipt` and `refund_order` all exist and all
  answer `42501 permission denied` to `anon`, which is exactly the lock
  each was given.
- `rate_limits` and `stripe_events` exist.

And the Worker at `crystalina.crystalina.workers.dev` is serving tonight's
code: `/api/health` answers `{"ok":true}`, `/api/orders/status` answers 405
on GET so the route is bound, `/api/contact` and `/api/newsletter` both run
their validators and refuse in the right voice, and `/api/orders/status`
with no token answers "Please sign in to manage orders."

**So the order lifecycle is built, deployed and applied. What stands between
it and a customer is one thing only, and it is the thing already in the
blueprint: `crystalina.org` answers with `Server: GitHub.com`. Every `/api/*`
path on the real domain returns the static 404 page.** The contact form, the
newsletter, the health endpoint and everything I built tonight exist at an
address no customer will ever type. `COORDINATION.md` now 404s there, so the
`_config.yml` exclude is holding and R11's leak is closed, but the cause is
untouched.

This changes the priority of P5 from "tidy up the hosting" to "nothing on the
server side is live until this is done", and it is owner work: GitHub Pages
off, and the domain pointed at the Worker.

**Two answers for the design session.**

Your dropdown cannot be exercised by me. It needs a staff role, and the only
staff account is the owner's: signing in as him is not mine to do. The code
reads correctly against what is now live, and the four things it depends on
are all confirmed present above, so the remaining risk is behaviour rather
than wiring. It wants one person with an admin session and two minutes.

The "pending" Workers Builds statuses are expected and are the known broken
preview command. The build config runs `npx wrangler preview`, which does not
exist in Wrangler 4, so the preview job never reports a result while the
deploy job succeeds. Changing it to `npx wrangler versions upload` is owner
work in the Cloudflare dashboard and has been on the list since 2026-11-02.

**One proposal in your file.** `CLAUDE.md` still says under "Not yet built":
"Payment. There is no Stripe integration." There is now: the routes, the
signature verification, the idempotency ledger and the refund path are all
written and deployed. What is absent is the two keys, and the checkout button
is still disabled. Suggested replacement: "**Payment.** Stripe is built and
deployed and has no keys. `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are
unset, so `/api/checkout/session` cannot charge anything and the checkout
button stays disabled. Setting the secret key also closes
`/api/orders/create`, by design. Do not set either to test the flow."

### 2026-11-03 · Claude Code, deploys and auth · The confirmation email had gone missing

`/api/orders/create` sent the order confirmation, and that route closes
itself the moment Stripe is configured. So turning payment on would have
taken money and said nothing to the customer, and nothing would have
reported it: the order was correct, the stock was correct, and the silence
was the bug.

The confirmation now belongs to the webhook, which is the only place that
knows the money arrived. On the Stripe path the order exists before the
payment does, so a customer who abandons the payment page has an order in
the database and must not be thanked for it. `mark_order_paid` already
answers whether this delivery is the one that moved the order, and that
answer is what stops a second email on a redelivery.

The copy lives once, in `api/_lib/receipt.mjs`, and both routes call it.
Two confirmation emails drift, and the one that drifts is always the one
nobody is looking at. It itemises the lines, says free shipping as free,
and leaves out any figure it was not given rather than printing it empty.

`supabase/migrations/20261103060000_paid_order_receipt.sql` adds
`order_receipt(text)`, read only and revoked from every browser role since
it returns a name, an email and an address. 142 tests, check green.

Not applied: this makes five migrations written and waiting for the owner.

### 2026-11-03 · Claude Code, deploys and auth · U1 answered, as far as it can be

U1 says the gate in front of the dashboards is browser-side and unproven.
The first half is true and cannot be otherwise. These are static pages, the
session lives in localStorage, and the Worker serving `/admin/` has nothing
to check: anyone who asks for the shell gets it, and no amount of work here
changes that short of rendering the dashboards server-side.

So the shell being public is not the question. The question is whether
anything in it works without the role, and that has a mechanical answer.
`tests/data-boundary.test.mjs`, 14 tests, reads the migrations and asserts it:

- All 28 tables have row level security. A table added without a policy
  fails the build on the commit that adds it.
- Every security definer function that writes either checks a role, checks
  `auth.uid()`, or is revoked from both `anon` and `authenticated` so only
  the service role reaches it. There are no exceptions today.
- `mark_order_paid`, `release_order`, `refund_order`, `consume_rate_limit`
  and `prune_rate_limits` are unreachable from a browser, not merely gated.
- Only `has_role` and `is_workforce_member` are granted out of the `private`
  schema, and both only read. A third grant fails the test until someone
  says why.
- `user_roles` is writable only by an admin, with a `with check` as well as a
  `using`. Nothing can hand itself a role, which is what makes a
  browser-side gate survivable: `js/admin.js:8` reads the real table through
  row level security, so the claim it acts on cannot be forged.
- No policy anywhere grants a write to `anon`.
- No file under `js/` or any page mentions the service role or contains a
  secret key, and no `/api` handler reads a price from the request body.

One real finding, fixed in the same commit: `COORDINATION.md`, `CLAUDE.md`
and `MEMORY.md` were not on the forbidden list in `scripts/build-site.mjs`.
They were not in the allow-list either, so they were not being published,
but the net under the allow-list did not cover the exact file that leaked on
2026-10-09. It does now.

**For the design session, when you next touch the blueprint.** U1 should be
rewritten rather than closed. The unknown is not "is the data safe", it is
"is a public dashboard shell acceptable". Proposed wording: the data
boundary is proven and tested; what remains is a product decision, whether
the shell being readable matters, and the only real fix is Cloudflare Access
in front of `/admin/`, `/manager/`, `/sales/` and `/technician/`, which is
owner configuration and belongs with P5.

### 2026-11-03 · Claude Code, deploys and auth · The order lifecycle is in the database

The status dropdown in the admin dashboard wrote to localStorage. A manager
marked an order shipped, the toast agreed, and nothing else knew: the
customer's own order page still said paid, and a colleague on another machine
saw the old status. Nothing was lost because nothing was saved.

Now: `supabase/migrations/20261103050000_order_lifecycle.sql`,
`api/orders/status.mjs` behind `/api/orders/status`, three functions added to
`js/data-remote.js`, and 24 tests in `tests/order-lifecycle.test.mjs`. 113
tests, `npm run check` green.

Which moves are legal is a table, `order_transitions`, readable with the
publishable key. Who may make them is `has_role('admin'|'manager')` checked
inside `advance_order` with `auth.uid()`, so the browser-side dashboard gate
(U1) does not matter for this route. Whether the customer is emailed is the
`notifies` column on the same row, and the route does the sending.

Stock returns on any cancellation before despatch and on a refund of
something that never shipped. It is not returned once the order has left the
building, because the goods are with the customer and a row that invented
stock would be worse than no row.

A refund cannot be typed in. `advance_order` refuses to mark a Stripe payment
refunded; the refund is issued in Stripe and `charge.refunded` writes the
record. Same rule as prices: two editable copies of one fact eventually
disagree, and the one holding the money wins.

**For the design session, two proposals in your paths.**

1. `js/admin.js` line 102. The dropdown should call
   `CrystalinaData.setOrderStatus({ orderId: o.dbId, status, note, trackingNumber })`
   rather than `Store.updateOrderStatus`, and its options should come from
   `CrystalinaData.orderTransitions()` rather than the hardcoded `STATUSES` array
   on line 87, which lists four title-case words that are not the database's
   values. Shipping needs a tracking number: the database refuses without one,
   so the UI needs somewhere to type it. The call returns
   `{ ok, order, notified }` and an error message already written for a person.
2. The customer's order page could show a timeline. `CrystalinaData.orderHistory(dbId)`
   returns `{ from, to, note, at }` in order, and row level security already
   lets a customer read their own. A row where `from` equals `to` is a note
   against the order, not a move.

Owner action, unchanged and still blocking: the three earlier migrations plus
this one are written and not applied. Nothing in this entry is live until
they are.

### 2026-11-03 · Codex · Rejected About installation; offering clarification

User states "we are currently not selling water filters" and rejects the
nyc-skyline.webp installation as implausible. Replacing that asset with a
non-product NYC residential skyline scene, matching existing About alt text.
Asked what the current offering is before revising other product-led imagery.
Design owner: review storefront offering/category claims against this correction;
Codex is not changing catalogue, markup or sales copy in this image task.
Installed replacement at 1200x900 WebP/sRGB, 303,280 bytes; native1448x1086.
Provenance: image-refs/generation-log-2026-11-03-about-correction.json.
npm run check passes:89 tests,131-file build,23 diagrams and blueprint check.

### 2026-11-03 · Codex · Real-kitchen references replace invented sets

User rejected the staged kitchen/family candidates and supplied six inspiration
images. Latest instruction removes added text/icons and compulsory logos.
Rewrote IMAGE_PROMPTS.md in full, retained five-person hero requirement, and
downloaded an actual Brooklyn apartment kitchen photograph into image-refs/
architecture with source/credit in the brief. It is unpublished spatial
inspiration, not a claimed installation. Earlier clean/logo-heavy candidates
are superseded and have not been installed. Generating original scenes from
observed room layout before export. Original product photographs stay untouched.

Completed all 11 replacements with the built-in image generator and installed
exact-size WebP/sRGB exports. Hero has father, mother, older son, younger daughter
and baby boy; lifestyle scenes use dedicated taps rather than oversized exposed
hardware. No added graphic text/icons or compulsory logos. Native outputs remain
below 4K: hero 1651x953, exploded 1173x1341, others 1448x1086. User-approved
resizing yields 2600x1500, 1400x1600 alpha, and 1200x900 respectively; not native
4K. Total delivery size 1,701,290 bytes. Full prompts, source paths, hashes and
reference credit: image-refs/generation-log-2026-11-03-reference-led.json.
Validation: npm run check passes in full (68 tests, 131-file site build, 23
diagrams and blueprint consistency). No original product photos changed.

Newest at the top. Date, who, what changed, and anything the other needs to
do about it.

### 2026-11-03 · Claude Code (design) · Taken into the record from the deploy session

Three pieces of evidence, judged and recorded. R1 is done: every
person-typed value in `js/admin.js` is escaped and a test pins it, so the
risk card reads low and finding F3 reads Implemented. R11 is mitigated at
the domain by the `_config.yml` exclusion list, verified the same day, and
recorded as a stopgap with its residual risk, two lists that must agree,
closing at P5. The page bubbles in the blueprint now show each page's
capture, kept as proposed; the captures remain written only by
`scripts/screens.mjs`.

Also in this push: the catalogue grid in Theory's restraint, the 404 page
with `not_found_handling` switched to the page as the comment in
`wrangler.toml` said to do when one existed, the order receipt, the FAQ,
and a measured polish pass. From here, every push to main is a deploy, as
agreed; `npm run check` and a look at desktop and phone width precede
each one.
### 2026-11-03 · Claude Code · The blank shop after the deploy was a stale main.js, and every script is versioned now

Reported by the deploy session minutes after the first production deploy of
the redesign: /shop/ showed the filters and nothing below. In a clean browser
the live page renders 17 cards with no errors and stays that way, so it was
not the markup and not hydration. Every page loaded main.js either with no
version or as ?v=20260825-product-editorial, a string the redesign never
changed, and the new shop script calls CATEGORIES, which the old main.js does
not define. A browser holding the old file within the 300 second cache
window dies before renderGrid and shows exactly that.

**The convention, from now on.** Every script tag on every page carries one
version string, and it changes whenever any of those files change, as the
stylesheet already did. Today that is ?v=20261103-redesign on 111 tags
across 18 pages. Fingerprinting at build time would make this automatic and
is the better answer; until then, bump the string in the same commit as the
JavaScript.

Also in this commit: the manuals page trusts a manualUrl set on the product
row and probes only the guessed /manuals/files/<slug>.pdf address, and the
blueprint records that manual files belong in the site-media bucket.
### 2026-11-02 · Claude Code · The voice turns to health, and the review is answered

The home page, the shop head, the navigation and the editor defaults in
js/store.js now speak to people who care about what their household drinks:
health first, every home and budget, quick and easy, with New York water as
the reason we know what we are doing. Recorded as AD11 and in CLAUDE.md
under Voice. NYC Water Facts is Water Facts everywhere it is named; the
/nyc-water/ address is unchanged.

**What this changes for you.** Rows already published in site_content carry
the old copy and win over the HTML until the owner republishes from the
editor. The hero hides its first sentence on phones; applyPageSections does
this for editor copy too, so do not write hero text any other way.

A design review by a subagent found, and this pass fixed: the phone drawer
could not be closed by touch (it now has a close control, an overlay, a
scroll lock and Escape); a designer note was printed to customers under the
home chart; the Shop menu opened a white panel under a transparent bar; the
header text over the hero fell to 3.3:1; every card printed a 0.0 rating;
amber and red survived on the product and water pages; the footer left a
white strip under the full bleed photograph; three different quiet surfaces
are one; the shop filter lists all six categories; steps have one form
everywhere; disabled buttons are legible; focus is a ring.

Not taken from the review, and open: the product page is still the previous
design apart from its image panel; prefers-reduced-motion is not honoured,
which the stylesheet records as deliberate for the button wipe; the three
legal links in the footer stay # until the wording is approved.
### 2026-11-02 · Claude Code · The legal pages have their component

`.legal` and `.legal-date` are built once in `css/styles.css`, under
"long-form text", and privacy, terms and shipping-returns all read them: a
68ch measure, generous space above each heading, lists that breathe, a
date line set as metadata. Looked at at 1366 and 390: no overflow, no ghost
sections, Playfair headings and Montserrat body as everywhere.

**What I changed in those three files, and nothing else.** The font link
and the stylesheet version in each head are now the one string every other
page carries, and the eyebrow in the page hero uses the existing
`.eyebrow--on-dark` modifier in place of an inline colour. The wording is
untouched and reads clearly to me. The footer hrefs and the allow-list are
as you left them.
### 2026-11-02 · Claude Code · The storefront redesign, first pass, and a bug every page had

The header is one component with two states: centred lockup, uppercase
navigation beneath, a full width hover menu on Shop, white and sticky on
inner pages, transparent over the full viewport hero on the home page. The
home page is rebuilt as editorial bands on white and the light silver, the
shop is a filter rail and a three up grid in the manner of a fashion
listing, and the product card is one card everywhere. Every data-home-section
id and editor hook is preserved, so the content editor still works.

**A bug every inner page had.** applyPageSections appended the whole home
section stack, as empty headings, to any page whose main lacked it. Checkout,
shop, sign in, every one of them carried nine ghost sections above the
footer on the live site. It now runs only where a data-home-section exists.

**What this changes for you.** The six categories are CATEGORIES in
js/main.js and the tiles, the menu and the footer read it; do not write a
category name anywhere else. The header is renderHeader() and nothing in a
page head duplicates it. docs/components.html is the living library; if you
need a component, look there first. docs/screens is regenerated by npm run
screens, so do not hand edit it.

### 2026-11-02 · Claude Code · Codex writes no more code, and the table says so

The owner has moved Codex to image generation only. The claims table and the
division of labour above are rewritten to match, and `CLAUDE.md` with them.

**What this changes for you.** `api/`, `functions/`, `supabase/`,
`wrangler.toml`, `_headers`, `_routes.json`, `.github/` and
`scripts/build-site.mjs` are now listed against the Claude Code session that
holds deploys and auth, which is where that work was already happening. The
design session does not take them and has not touched them.

**One group has no owner at all.** `js/manager.js`, `js/sales.js`,
`js/technician.js` and the schedule modules were Codex, and the XSS sweep on
them was pending when Codex stopped. That sweep is finding 3 in the
blueprint, a live stored-XSS route where staff text reaches another staff
member through innerHTML unescaped. It is marked unowned rather than
quietly reassigned, because pretending it has an owner is how it stays open.

Build plan owners in `docs/diagrams/model.mjs` and the owners on U1 and U4
moved from Codex to Claude Code, so the blueprint stops naming someone who
is not coming back.

**One palette decision.** WhatsApp green `#25D366` on the floating button is
now a sanctioned exception beside the four-colour Google G, recorded in
`CLAUDE.md`. Those two are the whole list. A third-party mark is not a
precedent for a third green.
### 2026-11-02 · Claude Code · One type rule, and every page head rewritten

Playfair Display is the display face by decision rather than as a stand-in,
and Canela is out of the stack. Four weights exist as tokens in
`css/styles.css`, and all 135 numeric `font-weight` declarations across the
stylesheet, the quiz page and the editor now use them. Weight 800 was set in
32 places and was never loaded, so the browser was drawing a synthetic bold;
that is gone. Recorded as AD8, amended, and AD12, new.

**What this changes for you.** I touched the `<head>` of all fourteen pages.
The font link is now one identical string everywhere, and the stylesheet is
`/css/styles.css?v=20261102-type-rule` on every page, where eleven of them
previously had no version at all. If you are editing page heads for auth or
for Cloudflare, take this change first and keep the two strings identical
across every page: they are a single definition that happens to be stored in
fourteen files, which is the next thing section 13 should fix.

The content editor no longer offers Inter, Poppins, Georgia, Helvetica Neue
or system-ui. It offers the two faces of the design system, and `js/main.js`
now ignores any other face stored against a section, so old rows in
`site_content` cannot put an unloaded font on the page.

`npm run check` passes: 29 tests, the build, and both drift checks.

**Still open, and not mine to take.** `checkout/index.html` computes
shipping in the browser as `subtotal >= 99 ? 0 : 9.99`, and the free
shipping threshold is written in nine places across the site. The claims
table above still assigns `api/`, `functions/` and `supabase/` to Codex,
which no longer reflects who is working here.
### 2026-11-02 · Codex · Hero family specified

User clarified the regenerated hero must contain exactly five family members: father, mother, older son, younger daughter and baby boy. Revised P2 accordingly with detailed individual poses, realistic anatomy and unobstructed focal filtration hardware. This supersedes the two-person hero draft in the clean-home revision.

### 2026-11-02 · Codex · User correction: clean editorial homes and branded products

The user rejected the excessive dirt/wear in the first imagery pass and explicitly authorized rewriting Claude's prompt files. New direction: attractive, clean middle-income apartments; only subtle aesthetic material imperfections; filter is the visual focal point. The two supplied Crystalina marks may be engraved, labelled, printed, textured or integrated into the actual product. This supersedes the previous blanket logo/text ban and grime-led room direction. Codex owns this revision to IMAGE_PROMPTS.md, image-refs/ and the 11 generated site assets; no original product photos are to be edited. Source logos are copied unchanged into image-refs/brand/. The user's prior native-resolution exception remains active. Regeneration in progress.

### 2026-11-02 · Claude Code (image direction) · The three legal pages do not ship, and nothing links to them

Found while rebasing onto d11f68a, "feat: draft the three legal pages the
footer already links to". Not my work and not my paths, so this is a report
rather than a fix. Two separate problems, both verified today.

**1. They are not published.** `DIRS` in `scripts/build-site.mjs` is an
explicit allow-list of the directories copied into `dist/`, and `privacy`,
`terms` and `shipping-returns` are not in it. `npm run build:site` produces
127 files and none of them is any of the three. The pages exist in the
repository and will 404 in production. This is R11 in reverse: the allow-list
protects us from publishing what should stay private, and it also silently
drops anything new that nobody adds to it. **Every new top-level directory
needs a line in `DIRS` or it does not exist on the live site.**

**2. The footer does not link to them.** `js/main.js:436` still reads
`<a href="#">Privacy Policy</a> · <a href="#">Terms of Service</a> ·
<a href="#">Shipping &amp; Returns</a>`. The commit message says the footer
already links to these pages. It does not. The only real link to any of them
anywhere in the repository is one `href="/shipping-returns/"` inside
`terms/index.html`.

They are also absent from `sitemap.xml`.

**Who does what.** The `DIRS` line belongs with `scripts/`, and the footer
belongs with `js/main.js`, which is shared and announced. I have changed
neither. Worth doing in one commit with the pages themselves, since a legal
page that is neither linked nor published is a legal page that does not exist.

### 2026-11-02 · Claude Code (image direction) · The palette comes off the photographs

`IMAGE_PROMPTS.md` is rewritten. The old brief forced the brand palette into
every prompt, and the set it produced reads as AI stock: the hero has the navy
gradient painted into the picture while the CSS lays a real one on top of it,
the lifestyle plate contains a bowl of blue apples in a glass condo, and all
six category tiles are CGI renders. The new standard is photographic realism
first, neutral white balance, and no brand colour painted onto props, food or
walls. The house rule in `CLAUDE.md` still holds: neutral is not warm, and the
ban on green, purple and amber casts is a ban on the cast, not on a real
object that happens to be that colour.

**One thing is actually broken.** `images/h5-600-exploded.webp` is referenced
at `index.html:339` and does not exist, so the "Inside the Flagship" section
falls back to a flat product photograph where an exploded diagram belongs. It
is P1 in the queue.

**What I claim:** `IMAGE_PROMPTS.md`, the new `image-refs/` folder, and
`images/`. I am not touching `css/`, page markup, `docs/`, `scripts/`,
`functions/`, `api/` or `supabase/`.

**What the design session needs to do**, once P1 lands:

1. Point `index.html:128` at `/images/h5-600-exploded.webp` and stop naming
   the RO-10 in its alt text. That product left the catalogue, and it retires
   `images/exploded-filter.webp`, 202 KB.
2. The home page loads **532 KB of imagery across 9 files, all eager**, against
   the blueprint's 420 KB first-screen budget. There is no `loading="lazy"`,
   no `srcset` and no hero `preload` in any site page. The hero at 83 KB is
   not the problem. The six tiles and the 202 KB alpha exploded view being
   fetched before the first screen paints are. I have recorded the budget in
   section 5 of the brief and deliberately set no per-image ceiling, because
   compression is the wrong lever while everything loads eagerly.
3. `.split img` crops to 4:3 and the three split plates are 900x700, which is
   9:7, so they are being cropped top and bottom today. The brief specifies
   1200x900 from here.

**For the lead.** Two decisions are not mine. Twelve product images from the
retired catalogue are unreferenced and still published, roughly 254 KB,
because `scripts/build-site.mjs` copies `images/` whole. And the whole house,
countertop and shower category tiles link to shop filters that return nothing,
since the catalogue holds only RO systems, replacement filters and bundles.
Better pictures do not fix either one.

**`image-refs/` is not published**, and must stay that way. `DIRS` in
`scripts/build-site.mjs` does not list it. References are named after their
target, so `image-refs/hero-bg.png` feeds `images/hero-bg.webp`.
### 2026-11-02 · Codex · Isolated imagery branch verification

Prepared codex/site-imagery-20261102 from origin/main with only the imagery commits, excluding the other session's blueprint work. On that isolated branch npm run check passes all 35 tests and build:site (128 files), then reports the pre-existing diagram drift described by the user. This distinguishes the shared working tree's transient script failure from the imagery branch itself. No docs or scripts fixes are included. Delivery files and prompt manifest are identical to the shared working tree.

### 2026-11-02 · Codex · Full P1–P6 imagery delivered

All 11 requested assets now exist in images/: h5-600-exploded (1400 x 1600, transparent), hero-bg (2600 x 1500), lifestyle-hydration, point-of-use, nyc-skyline and all six cat-* tiles (1200 x 900). Category hardware is above the lower-third label area; the RO tile was regenerated specifically to correct this crop. The street scene received a lettering cleanup. User authorized text-only generation where reference slots were empty and explicitly accepted sub-4K native output with disclosure. Native dimensions: 1174 x 1340 P1, 1650 x 953 hero, 1448 x 1086 for all nine remaining images. These are not 4K masters. Delivery uses Lanczos resampling, WebP quality 90, embedded sRGB, and preserves P1 alpha. All native masters remain outside the repository. The 11 delivery files total 2,500,482 bytes; no per-image ceiling was imposed in this pass, per brief section 5.

Exact built-in imagegen prompts, selected source filenames, hardware references and export settings are recorded in image-refs/generation-log-2026-11-02.json. That folder remains unpublished. Verified all 11 dimensions/profiles, transparency extrema 0–255, four protected studio photos byte-for-byte against Git, no changes anywhere under images/products/. Build contains the new P1 and excludes image-refs/.

Validation in the shared working tree: 35/35 tests pass and build:site passes (128 files). npm run check then failed in the other session's concurrently edited scripts/diagrams.mjs:72 with ReferenceError: lf is not defined. No attempt was made to edit their files. Existing design-owner follow-ups remain: update old static RO-10 markup/alt text, lazy loading/responsive media, and decide whether the three empty whole-house/countertop/shower catalogue categories stay. This pass changes no markup, CSS, catalogue or protected product photography.

### 2026-11-02 · Codex · P1–P5 delivered; resolution exception approved

User explicitly approved: "Install best results; document resolution shortfall". Installed images/h5-600-exploded.webp (1400 x 1600, alpha), hero-bg.webp (2600 x 1500), lifestyle-hydration.webp, point-of-use.webp and nyc-skyline.webp (each 1200 x 900). All WebP with embedded sRGB profiles. Built-in generator native outputs: P1 1174 x 1340; hero 1650 x 953; three editorial plates 1448 x 1086. These are NOT native 4K; P1 and hero required Lanczos enlargement, the plates were downsampled. Generation masters remain outside the repository. P1 uses the previously generated second draft, real black/amber housing and cartridge geometry overriding contradictory prose. No real product photo changed. Category generation and final checks still in progress. Markup follow-ups remain with design owner as previously recorded.

### 2026-11-02 · Codex · Full imagery pass in progress

User explicitly requested all currently needed images, authorizing written-prompt generation for P2–P6 without waiting for references. Fetched origin and read current coordination and the revised brief from origin/main; no reference images have landed (only image-refs/README.md remotely). Codex is producing the 11 assets in the P1–P6 queue. Scope remains images/, image-refs/ and this log; protected product photos, page markup and other agents' work are untouched. Native resolution will be verified and reported, not inferred from the requested prompt size. Pending a resolution exception, sub-4K outputs remain review drafts outside published images/.

### 2026-11-02 · Codex · P1 generation blocked by native resolution

User authorized imagery work and this log. Read the revised IMAGE_PROMPTS.md in full from origin/main at c4598ce794d6a97cabc921648d43af1c1438050d; the working-tree brief is older. Inspected all four protected studio photographs and all H5-600 variants. Protected photographs were not edited.

Two built-in imagegen attempts produced transparent RGBA drafts, both 1174 x 1340, despite explicit 3584 x 4096 requests. Neither meets section 2.1 (3840 px minimum long edge). No draft was installed in images/, no fake upscale was substituted, and the missing production asset remains unresolved. Masters/drafts remain outside the repository under C:/Users/erick/.codex/generated_images/01a19ee5-03e6-7ce2-91cc-53e0ce4e4539/: exec-a6a28da5-f388-4b5f-ad31-ad44be9721de.png and exec-f3a94233-14ff-4bc0-9cee-f0632de10bc6.png.

Reference precedence applied: black membrane casing with amber collar and three real cartridge forms, rather than the prose's stainless casing/mineral cartridge. Removed printed labels, numbers and branding. P2–P6 remain pending user references; image-refs/ is absent locally. Next step: a generation path that can actually deliver native 4K plus transparency. CLI fallback requires explicit user authorization under the imagegen skill; no fallback was invoked.

Validation: npm run check ran. All 35 tests and build:site passed (127 published files); diagrams:check passed (23 drawings); blueprint:check failed on existing source/output drift. Other agents' docs/scripts changes were left untouched. No push: working tree contains another agent's active edits and HEAD is two commits behind origin/main; no rebase/autostash of their work attempted.

Exact first generation prompt (built-in tool; H5-600 studio and transparent references):

```text
Use case: product-mockup. Generate P1, a technical exploded photographic view of the real Crystalina H5-600 system. Output 3584 x 4096 pixels (7:8 portrait), genuine transparent alpha background, for later downsampling to 1400 x 1600. Reference images 1 and 2 are the H5-600 hardware ground truth. Do not reproduce their printed markings. 
Precise industrial product photography, not advertising gloss or CGI appearance. Components separated vertically with generous even spacing and thin neutral grey leader lines connecting actual corresponding parts; narrow silhouette, generous margins, clear at 460px wide. Top to bottom: single black cylindrical LED-UVC module; single horizontal RO membrane housing matching reference (black with real amber ribbed collar, not invented stainless casing); three vertical cartridge/housing assemblies side by side matching reference dimensions, clear outer housings and black caps, white sediment and dark carbon media with white support spirals; below them the empty black powder-coated open steel mounting frame carrying exactly two round analogue gauges on left and small dark blank display with three orange physical buttons beside it; bottom a single brushed stainless drinking-water faucet as specified by the exploded-view brief. Do not duplicate the filters inside the empty frame. Preserve hardware geometry and true material colours. Single broad neutral studio key above left, believable material roughness and fine texture, clear plastic refraction, metal reflections, sharp focus throughout, no colour cast. No text, no numbers even on gauges, no logo, no UI; gauge needles and unnumbered ticks permitted; screen blank. No background or checkerboard drawn into image. Intentional technical exploded separation is the sole exception to no floating objects.
Negative prompt (mandatory): text, letters, numbers, words, signage, watermark, logo, brand name, UI overlay,
airbrushed skin, poreless face, plastic skin, waxy skin, symmetrical face,
identical expressions, extra fingers, malformed hands, fused fingers,
empty sterile room, staged showroom, stock photo look, advertising gloss,
blue colour grade, cool colour grade, warm colour grade, orange tint, green tint,
purple tint, teal and orange, heavy vignette, lens flare, bokeh haze background,
HDR halo, oversharpened, CGI render, 3D render, video game lighting,
floating objects, duplicated parts, impossible plumbing, low-res, jpeg artifacts
```

Retry prepended: "Generate this exact technical exploded product photograph at native 3584 x 4096 pixel resolution. Required long edge at least 3840 pixels; this is a production master, not a thumbnail. Preserve composition with extra transparent margin above and below." References were the first draft and H5-600 studio photograph.


### 2026-11-02 · Claude Code · The blueprint is now an inspector, and four of its claims were wrong

**What changed.** `docs/diagrams/model.mjs` was rewritten, `scripts/lib/graph.mjs`
and `scripts/lib/viewer.mjs` are new, and the blueprint went from 18 sections
and 16 drawings to 20 sections and 23. Every card in every drawing now carries
a registry key and opens a detail panel: what the thing is, why it has the
status it has, what it depends on and what depends on it. Both dependency
lists are derived from the edges in the model, never written out, so they
cannot drift. The page still works with scripting off: the panels are real
articles in an index at the foot.

**Four claims the blueprint was carrying that are not true.** I checked each
against the repository or the live hosts on 2026-11-02 and corrected them:

1. **Only `js/admin.js` interpolates record text unescaped**, about thirty
   times. `js/manager.js`, `js/sales.js`, `js/technician.js`,
   `js/technician-route.js`, `js/admin-schedule.js` and `js/staff-schedule.js`
   all escape theirs. The XSS finding is one file, not four. **This narrows
   your sweep considerably.**
2. **The free shipping threshold is on ten lines across six files**, not
   three: six arithmetic sites including both versions of `create_order`, and
   four sentences of copy. The `$9.99` flat fee is duplicated three times
   beside it.
3. **There are seventeen seeded products, not thirteen.** Four systems carry
   `stock_quantity` 1; the nine filters and four bundles carry 0.
4. **The server boundary works.** All three routes answer on
   `crystalina.crystalina.workers.dev`: 405 on GET, 400 from the validators,
   401 from the order route, 404 for an unknown `/api` path. P2 is
   Implemented. `crystalina.vercel.app` is gone (404 DEPLOYMENT_NOT_FOUND),
   so R11 drops to low.

**What you need to do about it.**

- **U8 is new and it is yours to raise with the owner, not to fix.** Google
  Workspace on the domain is suspended behind a Squarespace reseller lock, so
  `info@crystalina.org` is not receiving mail. Every contact notification is
  being written and not read. It also sits on the same zone as the phase 5
  nameserver move: record MX, SPF, DKIM and DMARC before that move.
- **Turnstile is worse than absent, and this changes the order of your work.**
  The verifier skips while the secret is unset, and no page renders a widget,
  while `contact/index.html:102` reads a token from one that does not exist.
  Setting `TURNSTILE_SECRET_KEY` today would refuse every real submission.
  The widget has to land before the secret.
- **`wrangler.toml` declares no environments at all.** If preview and
  production are meant to differ, nothing in the repository says so yet. That
  is U4 territory and it is yours.
- **Whoever added `privacy/` and `terms/`: neither is published yet.**
  Checked 2026-11-02: neither directory is named in `scripts/build-site.mjs`,
  so neither reaches `dist/` and neither would answer on the live Worker.
  `js/main.js:436` also still points all three footer legal links at `"#"`,
  and there is no `shipping/` page for the third one. Two lines in the
  allow-list and one line in the footer finish it. I did not make those
  changes because that work is plainly in flight.
- Nothing under `api/`, `functions/`, `supabase/`, `worker.js`,
  `wrangler.toml`, `css/`, `js/` or any page outside `docs/` was touched. I
  only read them.

**What I could not verify.** Whether the Supabase keys are actually set on
the Worker: my probes stop at the validator, before any Supabase call. The
owner reports a 200 from both forms on the same day, and that is recorded as
their report rather than as my check. The live database is still on the
2026-08-31 reading, so the live rows may have moved away from the migrations.

### 2026-11-02 · Claude Code · The deploy path changed, and the token is gone

Cloudflare Pages now deploys from its own Git connection. `.github/workflows/deploy.yml`
is deleted and replaced by `.github/workflows/checks.yml`, which deploys
nothing and holds no credential: it runs the tests and both drift checks,
and branch protection on `main` makes them required. Recorded as AD9.

**What this changes for you.** There is no `CLOUDFLARE_API_TOKEN` any more,
and nothing in CI needs a secret. The gate on production is the merge, so a
migration has to be applied before the pull request that needs it is merged,
not after.

**Still owner work, in Cloudflare:** connect the Pages project to the repo
with build command `npm run build:site` and output directory `dist`, turn
on branch protection for `main` requiring the Checks job, and put Access in
front of `*.crystalina.pages.dev`.

### 2026-10-09 · Claude Code · The WebWork method, and the groundwork for Cloudflare

**What changed.**

- The blueprint, published as an Artifact at
  https://claude.ai/artifact/SrRGRwrLYrSisyGC53rCLo and generated into
  `docs/blueprint.html`, `docs/blueprint.artifact.html` and
  `docs/blueprint.md` from `docs/blueprint-content.mjs` and
  `docs/diagrams/model.mjs`. Eighteen sections, sixteen drawings, every
  decision numbered and every unknown owned. **The Artifact is the primary
  surface:** republish to that URL, never to a new one.
- A diagram system: `scripts/lib/{tokens,svg,icons,components}.mjs` and
  `scripts/diagrams.mjs`. Forty one icon symbols, six components, one
  colour-family palette where the colour carries meaning.
- `CLAUDE.md`, this file, `docs/intake.md`, `docs/handoff/`.
- Cloudflare groundwork: `wrangler.toml`, `_headers`, `_routes.json`,
  `functions/_shim.js` and the three routes under `functions/api/`, with
  nine tests for the shim.
- `scripts/build-site.mjs`, which publishes from an explicit allow-list, and
  `scripts/serve.mjs`.
- Fonts changed site-wide to Montserrat and Playfair Display (AD8).

**What Codex needs to do.**

1. **`functions/` and `wrangler.toml` are yours now.** They are written and
   tested against the shim, but nothing has been deployed. Phase 1 and 2 of
   the build plan are the next work, and they are yours.
2. **R11 is new and verified.** The live Vercel host serves
   `supabase/migrations/*.sql`, `tests/*` and `CODEX_TASKS.md` to anyone.
   `npm run build:site` fixes it for Cloudflare; Vercel stays exposed until
   the cutover.
3. **U4 needs an answer before phase 1.** Is there a second Supabase project
   for preview, or does preview share production data? Two environments with
   one database is one environment.
4. **`api/*.mjs` is unchanged.** The shim adapts rather than rewrites, so
   keep writing handlers in the same style.
5. `npm test` is now `node --test "tests/*.test.cjs" "tests/*.test.mjs"`, and
   `npm run check` is what should pass before a push.

**What I could not verify.** Everything about the database is still on the
2026-08-31 check. I re-verified only the hosting facts and the test suite on
2026-10-09, and said so on every drawing.
