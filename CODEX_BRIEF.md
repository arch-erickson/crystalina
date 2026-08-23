# Crystalina — Brief for Codex

You are **Codex**, joining the Crystalina project to **collaborate with Claude Code**. Claude has
built the site so far; you're coming in to **generate the imagery and help push the project toward
launch**. Treat this as a shared codebase: match the existing conventions, keep changes clean, and
write clear commit messages so Claude can pick up seamlessly.

## The project
- **Crystalina** — a premium home water-filtration e-commerce site for **New York City** ("Pure Water. Pure Life.").
- **Live:** https://crystalina.org · **Repo:** `arch-erickson/crystalina` (branch `main`) · **Host:** GitHub Pages (push to `main` auto-deploys).
- **Stack:** static HTML/CSS/JS, no build step. Clean URLs (`/shop/`, not `/shop.html`). Serves the five boroughs.

## Step 1 — Get oriented (read these first, in order)
1. `README.md` — what the site is and how it runs.
2. `LAUNCH_CHECKLIST.md` — current status and the full roadmap to launch. **Work from this.**
3. `IMAGE_PROMPTS.md` — every image to generate, with exact target paths, sizes, and prompts.
4. `css/styles.css` — the complete design system (palette, unified buttons, components).
5. `js/main.js`, `js/store.js`, `js/admin.js` — shared UI + icon system, the localStorage data layer, the admin dashboard.
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

## Step 2 — Your main task: generate the images
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

## Step 3 — Then
Work down `LAUNCH_CHECKLIST.md` for anything else you can safely advance (image optimization,
replacing remaining stock placeholders with the new assets, alt-text polish). When in doubt, leave a
note in the commit or open a discussion so Claude can coordinate.
