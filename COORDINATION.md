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
