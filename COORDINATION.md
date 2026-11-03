# Coordination

Two agents work in this repository at the same time and cannot message each
other. This file is the channel, and git is the sync point.

**Who decides.** Claude Code is the lead. Where the agents disagree, the lead
decides and records it in the log. Where another agent's work is incomplete
or wrong, the lead corrects it and logs the fix; ownership of paths does not
change because of a correction.

**Division of labour.** Codex owns security, the database and server
logistics. Claude Code owns the storefront, the admin content editor, the
design system and the blueprint.

**Read the claims table before editing, and commit often.** An uncommitted
change is invisible to everyone else, so work sitting in a working tree for
an hour is work someone may be about to overwrite.

---

## Claims

Edit your own row when you start and when you stop. If you need a path you do
not own, add a line to the log and wait rather than taking it.

| Path | Owner | Since | State |
| --- | --- | --- | --- |
| `docs/`, `scripts/`, `CLAUDE.md`, `COORDINATION.md` | Claude Code | 2026-10-09 | Active |
| `css/`, `js/main.js`, `js/store.js`, `js/admin.js` | Claude Code | 2026-10-09 | Active |
| `IMAGE_PROMPTS.md`, `image-refs/`, `images/` | Claude Code, image direction | 2026-11-02 | Active |
| `api/`, `functions/`, `supabase/` | Codex | 2026-08-31 | Active |
| `wrangler.toml`, `_headers`, `_routes.json` | Codex | 2026-10-09 | Handed over, see the log |
| `js/manager.js`, `js/sales.js`, `js/technician.js`, schedule modules | Codex | 2026-08-31 | Active, XSS sweep pending |

Shared, so announce in the log before touching: `css/styles.css`,
`js/main.js`, `index.html`, `package.json`, `docs/diagrams/model.mjs`.

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

Newest at the top. Date, who, what changed, and anything the other needs to
do about it.

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
