# Crystalina — Brief for Codex

**Last verified: 2026-08-31.** Re-check anything older than a week; two assistants commit to `main`.

You are **Codex**, working on Crystalina alongside Claude Code. **You own security, the
database and server logistics**; Claude Code owns the storefront, the admin content editor
and the design system.

**Your current work list is `CODEX_TASKS.md`.** It is dated and prioritised. Read it first.
The original image-generation task described below is **complete** and is kept for context. Treat this as a shared codebase: match the existing conventions, keep changes clean, and
write clear commit messages so Claude can pick up seamlessly.

## The project
- **Crystalina** — a premium home water-filtration e-commerce site for **New York City** ("Pure Water. Pure Life.").
- **Live:** https://crystalina.org, currently served by **GitHub Pages**. A Vercel project
  (`crystalina`) is linked and deployed at https://crystalina.vercel.app and runs the `/api`
  functions; the DNS cutover is still pending. See `CODEX_TASKS.md`.
- **Stack:** static HTML/CSS/JS with Vercel serverless functions in `/api` (`.mjs`, ESM). No build
  step. Clean URLs. Products, orders and site content live in **Supabase**; the browser uses the
  publishable key only and every privileged write goes through `/api` or a role-gated function.

## Step 1 — Get oriented (read these first, in order)
1. `README.md` — what the site is and how it runs.
2. `LAUNCH_CHECKLIST.md` — current status and the full roadmap to launch. **Work from this.**
3. `IMAGE_PROMPTS.md` — every image to generate, with exact target paths, sizes, and prompts.
4. `css/styles.css` — the complete design system (palette, unified buttons, components).
5. `js/main.js` (shared UI, icons, escaping), `js/store.js` (local cache, hydrated from Supabase),
   `js/data-remote.js` (Supabase reads, writes and uploads), `js/admin.js` (admin console).
6. `supabase/migrations/` — the schema. `docs/SUPABASE_VERCEL_SETUP.md` and `DEPLOY_STEPS.md`.
6. `index.html` and the per-folder pages: `shop/`, `product/`, `quiz/`, `nyc-water/`, `about/`, `contact/`, `checkout/`, `signin/`, `account/`, `admin/`.

Going through the **LAUNCH_CHECKLIST.md** end to end should give you a solid understanding of what's
done, what's pending, and where you can help.

## Brand + code conventions (keep these consistent)
- **Palette:** navy `#15375D` / `#1F4C80`, blue `#2A7BC4`, light blue `#53A4DA`, cyan `#3DC7F4`, silver `#CFD2D3`, white. No greens, purples, or warm casts.
- **Fonts:** Inter (body), Poppins (headings).
- **No em/en dashes** in copy — use commas/periods; numeric ranges read "1961 to 1990".
- **Icons** are professional stroke line-icons (see `ICONS` in `js/main.js`). No emoji anywhere.
- **Paths** are root-absolute (`/css/…`, `/js/…`, `/images/…`); URLs are clean folders.
- **Buttons** use the unified center-out fill hover — don't reintroduce ad-hoc button styles.

## Completed: image generation (kept for reference)

All images below were generated and are in the repo. Nothing to do here.

### Original brief
1. Generate **every image in `IMAGE_PROMPTS.md`**, export **WebP** at the specified sizes, and save each to the **exact path** listed:
   - `/images/hero-bg.webp` (full-bleed hero, **a family on the right**, calm negative space on the left)
   - `/images/exploded-filter.webp` (transparent exploded RO-10)
   - `/images/cat-*.webp` (six category tiles)
   - `/images/lifestyle-hydration.webp`, `/images/nyc-skyline.webp`, `/images/point-of-use.webp`
   - `/images/products/<id>.webp` (twelve product photos)
2. Follow the art direction and **palette exactly**. `hero-bg.webp` and `exploded-filter.webp` are already wired and appear the moment the files exist.
3. Where `IMAGE_PROMPTS.md` says to swap a stock `<img src>` to a local path, do it (keep the existing `onerror` fallback).
4. For product photos, set the `image` field in `js/store.js` or note them for admin upload.

## Working agreement (you + Claude)
- **This is a collaboration with Claude Code.** Keep the design system intact; don't restyle existing components.
- **`git pull` before you start** and before each push — Claude also commits to `main`; pull to avoid conflicts.
- Commit in **small, clearly-described units**. If you touch shared files (`styles.css`, `js/main.js`), say so in the message so Claude can stay in sync.
- **Don't improvise the big-ticket checklist items** (backend, payments, real auth) — those are team decisions; flag them rather than building them ad hoc.
- Co-author your commits (e.g. `Co-Authored-By: Codex <noreply@openai.com>`).

## Where to go next
Work `CODEX_TASKS.md` in priority order. `LAUNCH_CHECKLIST.md` holds the wider roadmap and
records what is already done. When in doubt, say so in the commit message so Claude can
coordinate rather than duplicating the work.
