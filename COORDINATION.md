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

### 2026-11-02 · Claude Code · One type rule, and every page head rewritten

Playfair Display is the display face by decision rather than as a stand-in,
and Canela is out of the stack. Four weights exist as tokens in
`css/styles.css`, and all 135 numeric `font-weight` declarations across the
stylesheet, the quiz page and the editor now use them. Weight 800 was set in
32 places and was never loaded, so the browser was drawing a synthetic bold;
that is gone. Recorded as AD8, amended, and AD10, new.

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
