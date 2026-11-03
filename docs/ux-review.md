# Storefront UX review

**Date:** 2026-11-03
**Reviewed at:** commit `80c3b9a` ("an order has a life after it is paid"), working tree
clean apart from untracked `design/` and `output/`.
**Widths:** 1366 x 900 and 390 x 844, plus 320 and 1024 for reflow.
**Pages:** `/`, `/shop/`, `/product/?id=…`, `/checkout/`, `/quiz/`, `/nyc-water/`,
`/about/`, `/contact/`, `/signin/`, `/account/`, `/manuals/`, `/order/`, `/admin/`,
`/manager/`, `/sales/`, `/technician/`, `/privacy/`, `/terms/`, `/shipping-returns/`.
**Rubric, in priority order:** `CLAUDE.md`, then WCAG 2.1 AA, then the Nielsen
Norman heuristics, then Baymard's e-commerce findings, then hierarchy and
consistency.

Nothing in this file has been changed in the code. Every number here was measured
in headless Chrome against the running site, not estimated. Method and caveats are
in the appendix; read them before trusting a number, because two of the harness's
own warnings are false and are called out there.

---

## Counts by severity

| Severity | Count | Findings |
| --- | --- | --- |
| Blocks a sale | 12 | G5, G7, G14, G15, S1, S4, S6, P1, P5, P6, C1, C4 |
| Blocks a person with a disability | 26 | G1, G2, G3, G4, G6, G8, G9, G10, H1, H2, S2, S3, S5, S7, C3, Q1, Q2, Q3, W1, B1, N1, N2, N3, I1, A3, T2 |
| Breaks a house rule | 16 | G13, G16, G17, P2, P9, C5, C7, Q4, Q6, N4, N5, A2, A4, A5, M2, T3 |
| Polish | 13 | G11, G12, S8, P4, P7, P8, C6, Q5, N6, I3, A1, M1, M3 |
| **Total** | **67** | |

Where a finding violates two rubric items at once it is counted under the earlier
one and both are named in its Rule line, because `CLAUDE.md` beats WCAG and WCAG
beats the heuristics.

Nine more numbered entries — H3, P3, C2, W2, N7, I2, O1, L1 and T1 — are
cross-references to a finding already listed, or a scope note. They are numbered so
the implementer can refer to them per page, and they are not counted above.

Plus 7 entries in "Taste, not defect", which carry no severity and can be ignored.

## The three that matter most

**The focus ring is invisible, and there is no way past the header.** One token,
`--ring: 0 0 0 3px rgba(42,123,196,.35)`, paints at **1.59:1** against white, 1.56:1
on `--silver-50` and 1.43:1 on the navy footer. WCAG 1.4.11 asks for 3:1. It is the
only focus indicator on the site, because `:focus-visible` also sets
`outline: none`, so a keyboard user has nothing to follow on any control on any
page. On `/shop/` at 1366 it takes **20 Tab presses** to get from the top of the
document to the breadcrumb and **30** to reach the first product, because the Shop
mega menu opens on focus and lays eleven more links in the path, and there is no
skip link on any of the nineteen pages. Fixing `--ring`, deleting one
`box-shadow: none`, and adding a skip link are three small edits that together
change the site from unusable by keyboard to usable. **G1, G2, G3.**

**The cart drawer claims to be a modal and behaves like a loose panel.** It carries
`role="dialog" aria-modal="true"`, and opening it leaves focus exactly where it was
(measured: focus before and after open are both `a.mega-feature`), Escape does not
close it, and eight consecutive Tab presses while it is open all land on page
content behind it while `body` is scroll-locked. A keyboard shopper who adds to cart
is told nothing — `#toast` has no `role` and no `aria-live`, so "Added to cart" is
announced to nobody — and then has to tab through the entire page to find the
Checkout button inside a dialog they cannot see. **G4, G5.**

**Three forms a customer has to fill in have no labels a screen reader can use.**
`/checkout/` has eight `<label>` elements, none with `for`, and eight inputs, none
inside a label and none with `aria-label`. `/contact/` has five of five the same way.
Neither form carries a single `autocomplete` attribute, which is WCAG 1.3.5 at AA and
is one of Baymard's largest measured checkout losses. `/signin/` already does this
correctly with `<label for="aEmail">`, so the pattern to copy is in the repository.
**C1, C2, N1, G14.**

---

## `npm run verify` baseline

Run at `80c3b9a` with puppeteer 24 installed via `npm i -D puppeteer --no-save`
(it is not in `package.json`). These are the before-numbers; re-run the same command
after the fixes and compare.

`npm run verify -- /product/` renders the no-id state, because `scripts/verify.mjs`
builds its screenshot filename from the target and a `?` is not a legal Windows
filename. The real product page row is measured with the same metrics by a separate
harness and is marked `*`.

| Page | View | Height | Transferred | Overflow | Console errors | Failed req. | Low contrast (harness) | Images / unsized |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | desktop | 7923px | 2079KB | no | none | none | 20 | 16 / 14 |
| `/` | tablet | 8304px | 2076KB | no | none | none | 20 | 16 / 14 |
| `/` | phone | 13057px | 1643KB | no | none | none | 18 | 16 / 14 |
| `/shop/` | desktop | 3628px | 1733KB | no | none | none | 0 | 21 / 20 |
| `/shop/` | tablet | 4345px | 1462KB | no | none | none | 0 | 21 / 20 |
| `/shop/` | phone | 5227px | 1488KB | no | none | none | 0 | 21 / 20 |
| `/product/` (no id) | desktop | 1324px | 564KB | no | none | none | 1 | 4 / 3 |
| `/product/` (no id) | phone | 2223px | 320KB | no | none | none | 1 | 4 / 3 |
| `/product/?id=c1000000-…0001` * | desktop | 2897px | 1178KB | no | none | none | 5 | 10 / 9 |
| `/product/?id=c1000000-…0001` * | phone | 4858px | 655KB | no | none | none | 4 | 10 / 9 |
| `/checkout/` | desktop | 1266px | 564KB | no | none | none | 1 | 4 / 3 |
| `/checkout/` | phone | 2226px | 320KB | no | none | none | 1 | 4 / 3 |
| `/quiz/` | desktop | 1537px | 564KB | no | none | none | 3 | 4 / 3 |
| `/quiz/` | phone | 2439px | 320KB | no | none | none | 2 | 4 / 3 |
| `/nyc-water/` | desktop | 4316px | 683KB | no | none | none | 20 | 5 / 3 |
| `/nyc-water/` | phone | 7470px | 439KB | no | none | none | 20 | 5 / 3 |
| `/about/` | desktop | 2485px | 861KB | no | none | none | 4 | 5 / 3 |
| `/about/` | phone | 4413px | 617KB | no | none | none | 4 | 5 / 3 |
| `/contact/` | desktop | 2642px | 564KB | no | none | none | 3 | 4 / 3 |
| `/contact/` | phone | 4416px | 320KB | no | none | none | 3 | 4 / 3 |
| `/signin/` | desktop | 1316px | 569KB | no | none | none | 1 | 4 / 3 |
| `/signin/` | phone | 2272px | 325KB | no | none | none | 1 | 4 / 3 |
| `/account/` | desktop | 1316px | 568KB | no | none | none | 1 | 4 / 3 |
| `/account/` | phone | 2272px | 325KB | no | none | none | 1 | 4 / 3 |
| `/manuals/` | desktop | 3721px | 1601KB | no | **17** | **17** | 0 | 21 / 20 |
| `/manuals/` | tablet | 3468px | 1738KB | no | **17** | **17** | 0 | 21 / 20 |
| `/manuals/` | phone | 12120px | 989KB | no | **17** | **17** | 0 | 21 / 20 |
| `/order/` | desktop | 1141px | 567KB | no | none | none | 0 | 4 / 3 |
| `/order/` | phone | 2090px | 323KB | no | none | none | 0 | 4 / 3 |
| `/admin/` | desktop | 1246px | 571KB | no | none | none | 1 | 4 / 3 |
| `/admin/` | phone | 2202px | 402KB | no | none | none | 1 | 4 / 3 |
| `/manager/` | desktop | 1246px | 571KB | no | none | none | 1 | 4 / 3 |
| `/manager/` | phone | 2202px | 402KB | no | none | none | 1 | 4 / 3 |
| `/sales/` | desktop | 1246px | 571KB | no | none | none | 1 | 4 / 3 |
| `/sales/` | phone | 2202px | 402KB | no | none | none | 1 | 4 / 3 |
| `/technician/` | desktop | 1246px | 571KB | no | none | none | 1 | 4 / 3 |
| `/technician/` | phone | 2202px | 402KB | no | none | none | 1 | 4 / 3 |
| `/privacy/` | desktop | 2781px | 567KB | no | none | none | 2 | 4 / 3 |
| `/privacy/` | phone | 4498px | 323KB | no | none | none | 2 | 4 / 3 |
| `/terms/` | desktop | 2746px | 567KB | no | none | none | 3 | 4 / 3 |
| `/terms/` | phone | 4436px | 323KB | no | none | none | 3 | 4 / 3 |
| `/shipping-returns/` | desktop | 2700px | 567KB | no | none | none | 2 | 4 / 3 |
| `/shipping-returns/` | phone | 4278px | 323KB | no | none | none | 2 | 4 / 3 |

The harness's `low contrast` column counts text whose background it could not
resolve, so most of those twenty on `/` and `/nyc-water/` are white type on the
navy wash and are fine. The real contrast failures, measured from rendered pixels,
are twelve and are listed as G10, H1, H2, P2, P3, Q4 and W1. Its `long lines`
column is also wrong on the legal pages; see the appendix.

Two numbers are worth carrying forward on their own:

| Page | Image bytes | Above the fold | `srcset` | `preload` |
| --- | --- | --- | --- | --- |
| `/` 1366 | 1811KB | 274KB | 0 of 16 | none |
| `/shop/` 1366 | 1465KB | **1013KB** | 0 of 21 | none |
| `/manuals/` 1366 | 1465KB | **1013KB** | 0 of 21 | none |

The blueprint's first-screen budget is 420KB. `/shop/` is at 1013KB above the fold.

---

## Every page (the shared header, footer and cart drawer)

These are rendered by `js/main.js` on all nineteen pages, so each one is nineteen
instances of the same defect and one fix.

### G1. No skip link exists anywhere
- **Element:** the first child of `.site-top`, which does not exist.
  `document.querySelector('.skip-link, a[href="#main"], a[href="#content"]')` returns
  `null` on all nineteen pages.
- **Rule:** WCAG 2.1 AA — 2.4.1 Bypass Blocks (Level A).
- **Evidence:** a real Tab walk on `/shop/` at 1366 reaches `a.header-link` at stop 1
  and the page's own first link, the `Home` breadcrumb, at **stop 21**. Stops 6 to 16
  are the Shop mega menu, which opens on `:focus-within`. The first product link is
  stop 31. At 390 the drawer is shut and it is 4 stops, so this is a desktop and
  tablet failure.
- **Severity:** blocks a person with a disability.
- **Fix:** `js/main.js`, in `renderHeader()`, prepend
  `<a class="skip-link" href="#main">Skip to content</a>` as the first node of
  `el.innerHTML`, and give every page's `<main>` `id="main"`. Add a `.skip-link`
  component to `css/styles.css` near the header block: visually hidden until
  `:focus`, then pinned top-left above `z-index: 90`. Nothing close to this exists;
  `.sr-only` is the nearest and is permanently hidden, so it is the wrong base.

### G2. The focus ring is below the contrast floor on every control
- **Element:** `:focus-visible { outline: none; box-shadow: var(--ring); }`
  (`css/styles.css:68`) with `--ring: 0 0 0 3px rgba(42, 123, 196, .35)` (line 34).
- **Rule:** WCAG 2.1 AA — 1.4.11 Non-text Contrast; 2.4.7 Focus Visible.
- **Evidence:** composited over its surface the ring paints
  `rgb(180,209,234)` on white = **1.59:1**; `rgb(179,208,232)` on `--silver-50` =
  **1.56:1**; `rgb(28,79,129)` on the navy footer = **1.43:1**. Measured on all 30
  tab stops of `/shop/` with real keyboard focus: every stop returned
  `outline: none` and a ring contrast of 1.59, 1.56 or 1.43. The floor is 3:1.
- **Severity:** blocks a person with a disability.
- **Fix:** `css/styles.css`, the `--ring` token. Raising the alpha to 1 and using
  `--navy-800` gives 8.4:1 on white; a two-tone ring
  (`0 0 0 2px #fff, 0 0 0 4px var(--navy-800)`) also clears 3:1 on the navy footer,
  which a single blue ring does not. Change the token, not the 14 rules that read it.

### G3. The shop and manuals toolbars delete the focus ring outright
- **Element:** `.shop-toolbar input:focus, .shop-toolbar select:focus { outline: none; box-shadow: none; … }`
  (`css/styles.css:473`), which `/shop/` and `/manuals/` both use.
- **Rule:** WCAG 2.1 AA — 2.4.7 Focus Visible.
- **Evidence:** at tab stops 29 (`input` Search) and 30 (`select` Sort) on `/shop/`,
  `el.matches(':focus-visible')` is `true` while computed `outline` is `none` and
  computed `box-shadow` is `none`. The only remaining cue is `border-bottom-color`
  moving from `transparent` to `--blue-500` on a 1px edge.
- **Severity:** blocks a person with a disability.
- **Fix:** `css/styles.css:473`, remove `box-shadow: none` so the shared ring from
  G2 applies. Keep the border-bottom colour change; it is the hover affordance.

### G4. `#toast` is not a live region, so no cart or form feedback is announced
- **Element:** `<div class="toast" id="toast"></div>` (`js/main.js:430`), the target
  of `toast('Added to cart')`, `toast('Complete set added to cart')`,
  `toast('You are on the list. Welcome to the Crystalina Club.')` and every
  newsletter error.
- **Rule:** WCAG 2.1 AA — 4.1.3 Status Messages.
- **Evidence:** measured `role: null`, `aria-live: null`, `aria-atomic: null`. Count
  of elements matching `[aria-live],[role=status],[role=alert]`: `/` 0, `/shop/` 0,
  `/checkout/` 0, `/quiz/` 0, `/nyc-water/` 0, `/about/` 0, `/contact/` 0, and the
  three legal pages 0.
- **Severity:** blocks a person with a disability.
- **Fix:** `js/main.js:430`, `role="status" aria-live="polite" aria-atomic="true"`.
  `manuals/index.html:38` already does this on `.doc-count`; copy that.

### G5. The cart drawer is a dialog with no focus handling and no Escape
- **Element:** `#cartDrawer`, `role="dialog" aria-modal="true" aria-label="Shopping cart"`
  (`js/main.js:419`), opened by `openCart()` (line 441).
- **Rule:** WCAG 2.1 AA — 2.4.3 Focus Order; 4.1.2 Name, Role, Value. Nielsen 3,
  user control and freedom.
- **Evidence:** three separate measurements with an item in the cart.
  (a) focus before open and after open are both `A.mega-feature` — `openCart()` only
  adds a body class. (b) After `Escape`, `document.body.classList.contains('cart-open')`
  is still `true`; the nav drawer does handle Escape (`js/main.js:213`), the cart
  drawer does not. (c) Eight consecutive Tab presses with the drawer open gave
  `insideDrawer=false` eight times: `nav-link Water Facts`, `nav-link Find Your
  Filter`, `nav-link About Us`, `nav-link Contact`, `a Home`, `button All`,
  `button Reverse Osmosis`, `button Whole House` — all behind the overlay, while
  `body` computed `overflow: hidden`. The drawer holds 7 focusable controls,
  including Checkout, and none of them is reachable without tabbing the whole page.
- **Severity:** blocks a sale, and blocks a person with a disability.
- **Fix:** `js/main.js`. In `openCart()`: remember `document.activeElement`, focus
  `#cartCloseBtn`, and set `inert` on `.site-top` and `main`. In `closeCart()`:
  clear `inert` and restore focus. Add Escape to the existing document `keydown`
  listener at line 213, which already closes the nav drawer, rather than adding a
  second listener. A small shared `trapFocus(el)` helper would also serve the
  `/manuals/` `<dialog>` and the notification menu.

### G6. The mega menu puts three `h4`s above every page's `h1`, and page headings skip levels
- **Element:** `.mega-col h4` in `navItem()` (`js/main.js:125`), plus
  `.shop-sidebar h4`, `.pd-specs h4`, `.ci-card h4`, `.shop-empty h3`.
- **Rule:** WCAG 2.1 AA — 1.3.1 Info and Relationships.
- **Evidence:** measured visible heading order at 1366. `/shop/`:
  `H4 Systems, H4 Keep it running, H4 Help choosing, H1 Shop…, H4 Categories`.
  `/product/`: `H4, H4, H4, H1, H4 Key Features` — a 1 to 4 jump. `/contact/`:
  `H1, H4 Call Us` — the same jump, five times. `/`: `H2 Component by Component,
  H4 Manufacturer-rated 600 GPD…` — a 2 to 4 jump, six times. `/manuals/`:
  `H1, H3` seventeen times. `/admin/`, `/manager/`, `/sales/`, `/technician/`:
  `H1 Staff sign in, H3 Your Cart`.
- **Severity:** blocks a person with a disability.
- **Fix:** `js/main.js:125`, make the mega column title a `<p class="mega-col-title">`
  and move the existing `.mega-col h4` rule in `css/styles.css` onto that class; the
  columns are navigation, not document structure. For the page-level jumps, move
  `.pd-specs h4`, `.ci-card h4` and `.shop-sidebar h4` to `h2`, `.shop-empty h3` and
  `.doc-name h3` to `h2`, and reuse the same CSS rules by adding the new selector
  beside the old one rather than restyling.

### G7. The three footer legal links go nowhere, and the three pages they mean are not published
- **Element:** `js/main.js:573` —
  `<a href="#">Privacy Policy</a> · <a href="#">Terms of Service</a> · <a href="#">Shipping &amp; Returns</a>`.
- **Rule:** Nielsen 2, match between the system and the real world. Baymard: the
  returns and shipping policy must be reachable before a shopper commits.
- **Evidence:** 3 dead `a[href="#"]` on all nineteen pages. The pages exist and
  render correctly (`/privacy/` 2781px, `/terms/` 2746px, `/shipping-returns/`
  2700px at 1366, zero console errors, zero contrast failures). `DIRS` in
  `scripts/build-site.mjs:31-35` lists `about, account, admin, checkout, contact,
  manager, nyc-water, manuals, order, product, quiz, sales, shop, signin, technician`
  and omits all three, so they are absent from `dist/` and would 404 in production.
  They are also absent from `sitemap.xml`, which lists eight URLs.
- **Severity:** blocks a sale.
- **Fix:** three edits in one commit. `scripts/build-site.mjs`, add `'privacy'`,
  `'terms'`, `'shipping-returns'` to `DIRS`. `js/main.js:573`, point the three hrefs
  at `/privacy/`, `/terms/`, `/shipping-returns/`. `sitemap.xml`, add the three
  `<loc>` entries. `scripts/build-site.mjs` is owned by the deploys session, so
  announce it in `COORDINATION.md` first.

### G8. The newsletter email field has no label of any kind
- **Element:** `<input type="email" placeholder="Your email address" required>` in
  `renderFooter()` (`js/main.js:538`). No `id`, no `aria-label`, no wrapping label.
- **Rule:** WCAG 2.1 AA — 1.3.1; 3.3.2 Labels or Instructions; 4.1.2.
- **Evidence:** the unlabelled-input count is exactly 1 on seventeen of the nineteen
  pages and this is that one; on `/contact/` and `/checkout/` it is one of six and
  one of nine. A screen reader announces "edit text" with no name once the field has
  content, because a placeholder is not an accessible name once it disappears.
- **Severity:** blocks a person with a disability.
- **Fix:** `js/main.js:538`, give the input `id="newsletterEmail"` and add
  `<label class="sr-only" for="newsletterEmail">Your email address</label>`.
  `.sr-only` already exists and `shop/index.html:29` uses exactly this pattern.

### G9. A failed subscription reports only through the silent toast
- **Element:** `bindNewsletter()` catch branch, `toast(error.message)`
  (`js/main.js:672`).
- **Rule:** WCAG 2.1 AA — 3.3.1 Error Identification. Nielsen 9, help users
  recognise and recover from errors.
- **Evidence:** the error never reaches the field: no `aria-invalid` is set, no
  message is associated by `aria-describedby`, focus is not returned to the input,
  and the toast it does reach has no live region (G4). The toast also self-destructs
  after 2600ms (`t._h = setTimeout(…, 2600)`), so a slow reader loses it.
- **Severity:** blocks a person with a disability.
- **Fix:** `js/main.js`, in the catch branch set `input.setAttribute('aria-invalid','true')`,
  render the message into a `<p class="form-error" id="newsletterError" role="alert">`
  inside the form, point `aria-describedby` at it, and focus the input. `.form-error`
  already exists in `css/styles.css` and `signin/index.html:28` already pairs it with
  `role="alert"`; extend that, do not invent a second error component.

### G10. `--blue-500` is 4.44:1 on white and is used for body-size text in six places
- **Element:** `--blue-500: #2A7BC4` (`css/styles.css:12`), read by `.eyebrow`,
  `.nav-link.active`, `.nav-link:hover`, `.pd-cat`, `.pd-stock.low`,
  `.pd-bundle-label`, `.link`.
- **Rule:** WCAG 2.1 AA — 1.4.3 Contrast Minimum.
- **Evidence:** measured from rendered pixels, needs 4.5:1 in every case because
  every one is under 18.66px.

  | Selector | Page | Size | On | Ratio |
  | --- | --- | --- | --- | --- |
  | `span.eyebrow` | `/`, `/nyc-water/`, `/about/` | 12.5px / 700 | `#fff` | **4.44** |
  | `span.eyebrow` | `/product/`, `/contact/`, `/about/` 390 | 12.5px / 700 | `--silver-50` | **4.10** |
  | `a.nav-link.active` | every page with an active item | 12.5px / 500 | `#fff` | **4.44** |
  | `span.pd-cat` | `/product/` | 12.2px / 700 | `#fff` | **4.44** |
  | `div.pd-stock.low` | `/product/` | 13.8px / 600 | `#fff` | **4.44** |
  | `span.pd-bundle-label` | `/product/` | 12.2px / 700 | `--ice-50` | **4.21** |
  | `a.link` | `/terms/` | 16px / 600 | `#fff` | **4.44** |

- **Severity:** blocks a person with a disability.
- **Fix:** `css/styles.css`. `--blue-500` is also the link and CTA colour and a
  gradient stop, so do not move it blind. Add one text-safe token beside it,
  `--blue-text: #246FB2` (5.1:1 on white, 4.7:1 on `--silver-50`, both inside the
  palette as a darker step of the same blue), and point those seven text rules at it.
  Leave `--blue-500` for fills, borders and gradients, where the 3:1 floor applies
  and it passes.

### G11. Several shared controls are under 24px in their smaller dimension
- **Element:** `.footer-links a` (`js/main.js:573`), `.hamburger`
  (`css/styles.css`), `.cart-close` (`css/styles.css:387`), `.ci-qty button`.
- **Rule:** WCAG 2.5.8 Target Size (Minimum), which is AA in WCAG 2.2; it is 2.5.5
  at AAA in 2.1, so this is below the stated bar but is the kind of thing that costs
  taps on a phone. Baymard treats it as a measured mobile conversion factor.
- **Evidence:** measured boxes. `Privacy Policy` 83x15, `Terms of Service` 99x15,
  `Shipping & Returns` 118x15, `Staff sign in` 71x15 on every page. `.hamburger`
  40x44 at 390. `.cart-close` **16x27**. `.ci-qty` decrease and increase **24x24**
  each, `.ci-remove` 49x24. By contrast `/product/`'s own `#qDec` and `#qInc` are
  44x46, and `.cat-filter button` carries `min-height: 46px` at 620px and below, so
  the project already knows the number.
- **Severity:** polish.
- **Fix:** `css/styles.css`. Give `.footer-links a` `display: inline-block;
  padding: 6px 0`. Give `.cart-close` and `.ci-qty button` `min-width: 44px;
  min-height: 44px`. Give `.hamburger` `width: 44px`. The `min-height: 46px` rule at
  `css/styles.css:2340` is the existing convention; extend its selector list rather
  than writing new numbers.

### G12. Mega menu and category links read as one run-on word
- **Element:** `navItem()` builds `<a>${label}${desc ? <small>${desc}</small> : ''}</a>`
  (`js/main.js:126`); `renderCategoryTiles()` does the same with `.ct-label`.
- **Rule:** WCAG 2.1 AA — 4.1.2 Name, Role, Value (name quality); Nielsen 6,
  recognition rather than recall.
- **Evidence:** the computed accessible names from the tab walk are
  `"Reverse OsmosisUnder-sink purity"`, `"Whole HouseEvery tap protected"`,
  `"CountertopRenter friendly"`, `"Shower & BathSofter skin and hair"`,
  `"Replacement FiltersKeep it pure"`, `"AccessoriesMeters, UV and more"`,
  `"Find your filterFive questions, one answer"`,
  `"Manuals and guidesEvery manual, to read or keep"`,
  `"Talk to usCall, WhatsApp or visit"`. Also
  `"Crystalina Water Co.New York City, NY, USA"` in `.footer-addr`.
- **Severity:** polish.
- **Fix:** `js/main.js`, put a space or a comma in the template between the label and
  the `<small>`: `${escapeHTML(k.label)}${k.desc ? `<small> ${escapeHTML(k.desc)}</small>` : ''}`.
  The `<small>` is already `display: block`, so nothing changes visually.

### G13. `user.name` reaches `innerHTML` unescaped in the header
- **Element:** `js/main.js:166-168` —
  `title="${user ? user.name : 'Sign in'}"` and
  `<span class="icon-label">${user ? user.name.split(' ')[0] : 'Sign In'}</span>`.
- **Rule:** `CLAUDE.md`, "Everything that reaches `innerHTML` goes through
  `escapeHTML` first."
- **Evidence:** both interpolations are raw. The same function escapes
  `item.title`, `item.message`, `c.title`, `k.label` and `p.name` correctly nine
  lines above and below, so this is an omission inside an otherwise correct file.
  `CLAUDE.md` names `js/admin.js` as the one open exception; this is a second,
  on a page every customer loads.
- **Severity:** breaks a house rule.
- **Fix:** `js/main.js:166-168`, wrap both in `escapeHTML()`.

### G14. No form on the site carries `autocomplete`
- **Element:** every input on `/checkout/` (8), `/contact/` (3 of 5) and
  `/signin/` (`#aEmail`).
- **Rule:** WCAG 2.1 AA — 1.3.5 Identify Input Purpose. Baymard: autofill is one
  of the largest measured reductions in checkout abandonment.
- **Evidence:** `grep -rn autocomplete` over all nineteen pages returns exactly two
  hits: `autocomplete="off"` on `#manualSearch` and `autocomplete="one-time-code"`
  on `#aCode`. Every field that has a defined autofill token has none:
  `fFirst`, `fLast`, `fEmail`, `fPhone`, `fAddr`, `fZip`, `cName`, `cEmail`,
  `cPhone`, `aEmail`. Measured `autocomplete: null` on all eight checkout fields.
- **Severity:** blocks a sale.
- **Fix:** `checkout/index.html` — `given-name`, `family-name`, `email`, `tel`,
  `street-address`, `address-level2` on the borough select, `postal-code`.
  `contact/index.html` — `name`, `email`, `tel`. `signin/index.html` — `email` on
  `#aEmail`. Also add `inputmode="numeric"` to `fZip` and `inputmode="tel"` to
  `fPhone` and `cPhone`; neither has one today.

### G15. Product imagery is shipped at four times the size it is shown, with no `srcset`
- **Element:** `.pc-img img` and `.ct-media img` sources in `images/`.
- **Rule:** Baymard: page weight on the category page. The blueprint's first-screen
  budget is 420KB.
- **Evidence:** `/shop/` at 1366 transfers **1465KB of images, 1013KB of it above
  the fold**, for cards drawn at 249x312 CSS px. `h5-600-uv-editorial.webp` is
  1086x1448 and 241KB, drawn at 249x312; `w5-400-alkaline-editorial.webp` 223KB;
  `f5-600-uv-editorial.webp` 196KB. Nineteen of the twenty-one images on the page are
  over twice their drawn width. `logo-mark.png` is a **1000x1000 PNG drawn at 46x46**
  in the header of every page. `0 of 21` images carry `srcset`; the only resource
  hint in any page head is a bare `preconnect` to Google Fonts, with no `preload` for
  the hero.
- **Severity:** blocks a sale on a phone.
- **Fix:** generate 320w, 640w and 1024w variants into `images/` and add
  `srcset`/`sizes` where the cards are built — `productCard()` in `js/main.js`,
  `renderCategoryTiles()` in `js/main.js`, and `card()` in `manuals/index.html`.
  Replace `logo-mark.png` with a 96x96 file. Add
  `<link rel="preload" as="image" href="/images/hero-bg.webp">` to `index.html` only.
  `images/` is owned by the image-direction session; the markup is not.

### G16. The cart close control is a `&times;` glyph, not an icon from `ICONS`
- **Element:** `<button class="cart-close" aria-label="Close cart">&times;</button>`
  (`js/main.js:421`), styled `font-size: 1.7rem` (`css/styles.css:387`).
- **Rule:** `CLAUDE.md`, "Icons are the stroke line-icons in `ICONS` in `js/main.js`."
- **Evidence:** `ICONS.close` exists and is used by `#navCloseBtn` eight lines later
  in the same function. The glyph also renders at 16x27, which is G11.
- **Severity:** breaks a house rule.
- **Fix:** `js/main.js:421`, `${icon('close')}` in place of `&times;`, and drop the
  `font-size` from `css/styles.css:387`.

### G17. The free shipping threshold now has a home in the database and the browser still hard-codes it nine times
- **Element:** `supabase/migrations/20261103040000_one_shipping_policy.sql` creates
  `public.shipping_policy`, a single row, publicly selectable "because the threshold
  is on the front of the site".
- **Rule:** `CLAUDE.md`, "If an element appears more than once, it is built once, and
  every screen calls it," and the named open item under "One definition, read
  everywhere".
- **Evidence:** `grep -rn shipping_policy js/ api/` returns **nothing** — no browser
  or Worker code reads the table. The literal `99` remains at `js/main.js:146`
  (announcement bar), `js/main.js:455`, `:456`, `:459` (the drawer's progress bar),
  `js/store.js:36` (editor default), `checkout/index.html:97`
  (`subtotal >= 99 ? 0 : 9.99`, which also duplicates the `$9.99` fee),
  `index.html:76`, `shop/index.html:24` and `product/index.html:163`. Nine sites.
- **Severity:** breaks a house rule.
- **Fix:** add `loadShippingPolicy()` to `js/data-remote.js` beside the other reads,
  cache it in `js/store.js` next to the catalogue, expose
  `Store.shippingPolicy()` returning `{ thresholdCents, feeCents }`, and have
  `js/main.js` and `checkout/index.html` read it. The three copy sites should take
  the figure from the same getter at render time rather than carrying a typed
  number. Keep the hard-coded 99 as the fallback for the first paint, in one
  constant, not nine.

---

## `/` (home)

### H1. `.chart-note` is 3.76:1 on the navy band
- **Element:** `div.chart-note`, "Rates vary with water pressure, temperature and
  cartridge age." `css/styles.css:328` — `color: #8aa8ce; font-size: .7rem`.
- **Rule:** WCAG 2.1 AA — 1.4.3.
- **Evidence:** measured from pixels, `rgb(138,168,206)` on `rgb(40,73,111)` =
  **3.76:1** at 1366 and **3.38:1** at 390, at 11.2px / 400. Needs 4.5:1. It is the
  worst text contrast on the storefront.
- **Severity:** blocks a person with a disability.
- **Fix:** `css/styles.css:328`, `color: #cfe0f5`, the value `.fact-card p` on the
  same band already uses, which measures 9:1. Do not introduce a fourth light blue.

### H2. `.bar-val` is 4.34:1 on the navy band
- **Element:** `span.bar-val`, "99%", `css/styles.css` — `color: var(--cyan-300)`.
- **Rule:** WCAG 2.1 AA — 1.4.3.
- **Evidence:** `rgb(61,199,244)` on `rgb(43,78,119)` = **4.34:1** at 13.1px / 700
  (needs 4.5), and **4.41:1** at 390. The same token on `/nyc-water/` measures
  4.43:1 and 4.26:1, and `.nyc-band strong` at 390 measures **3.99:1**.
- **Severity:** blocks a person with a disability.
- **Fix:** `css/styles.css`. `--cyan-300` is a sanctioned brand accent and reads
  well at display sizes, so keep it for `.f-num` (6.15:1, passes) and lighten only
  the small uses: set `.bar-val` and `.nyc-band strong` to `#80DAFA`, which is
  already in the stylesheet and measures 6.4:1 on that band.

### H3. `.eyebrow` at 4.44:1
See G10; the home page carries three instances ("The Systems", "What care looks
like", "Chosen most often").

---

## `/shop/`

### S1. A shopper cannot tell what is in stock
- **Element:** `.pc-soldout` is set to `display: none` by `css/styles.css:303`
  together with `.pc-badge`, `.pc-off`, `.pc-cat`, `.pc-rating` and
  `.product-card .pc-add`.
- **Rule:** Baymard: unclear availability on the category page is a known order
  loss. Nielsen 1, visibility of system status.
- **Evidence:** 17 cards render; **13 of the 17 have `stock` 0** (measured:
  `document.querySelectorAll('.pc-add[disabled]').length` = 13). Every card looks
  identical and nothing on it says sold out, so three quarters of the grid leads to a
  product page whose only button is disabled. The hiding of `.pc-add` and `.pc-badge`
  is deliberate and documented in the CSS comment above line 303 ("the badge, the
  category and the button belong to the product page"); hiding the stock state is the
  part that costs orders.
- **Severity:** blocks a sale.
- **Fix:** `css/styles.css:303`, remove `.pc-soldout` from that selector list. The
  card already has a quiet text slot, `.pc-line`, and `.pc-soldout` already styles
  as white on `--ink` at 15.72:1, so either works without breaking the restraint the
  comment describes. Do not re-expose `.pc-add`; that is a settled decision.

### S2. Nothing says how many products are showing, and filtering is silent
- **Element:** `#shopGrid` and `#shopEmpty` in `shop/index.html`, repainted by
  `renderGrid()` on every keystroke and every category click.
- **Rule:** WCAG 2.1 AA — 4.1.3 Status Messages. Nielsen 1, visibility of system
  status. Baymard: a result count on the category page.
- **Evidence:** no text matching `\d+\s+(product|result|system|item)` appears
  anywhere on the page, and `document.querySelectorAll('[aria-live],[role=status]').length`
  is **0**. Typing in the search box changes the grid from 17 cards to 0 with no
  announcement at all.
- **Severity:** blocks a person with a disability.
- **Fix:** `shop/index.html`, add `<p class="doc-count" id="shopCount" aria-live="polite"></p>`
  above `#shopGrid` and set it in `renderGrid()`. This component already exists:
  `manuals/index.html:38` is `<p class="doc-count" id="manualCount" aria-live="polite">`
  and its text is built in `renderGrid()` there. Copy it rather than writing a second
  one, and move `.doc-count` in `css/styles.css` beside the shop toolbar rules so both
  pages read one definition.

### S3. The category filter's selected state is colour only
- **Element:** `.cat-filter button` in `renderCats()` (`shop/index.html`), and the
  same control in `manuals/index.html`.
- **Rule:** WCAG 2.1 AA — 1.4.1 Use of Colour; 4.1.2 Name, Role, Value.
- **Evidence:** measured on the active button: `aria-pressed: null`,
  `aria-current: null`, `aria-selected: null`. The only difference is
  `.cat-filter button.active { color: var(--navy-800); font-weight: var(--w-semibold);
  text-decoration: underline }` (`css/styles.css:470`). The underline does carry
  non-colour information, so 1.4.1 is arguably met visually, but nothing is exposed
  to assistive technology: a screen-reader user cannot tell which filter is on.
- **Severity:** blocks a person with a disability.
- **Fix:** `shop/index.html` and `manuals/index.html` in `renderCats()`, add
  `aria-pressed="${c === activeCat}"` to each button. `manuals/index.html:36`
  already wraps its filters in `role="group" aria-label="Filter by category"` and
  `/shop/`'s `#catFilter` does not — give `/shop/` the same wrapper so the two
  instances of this control match.

### S4. Three of seven category filters sit outside the viewport at 390 with no scroll affordance
- **Element:** `.cat-filter` at 390, `css/styles.css:2164` —
  `display: flex; gap: 22px; overflow-x: auto; scrollbar-width: none`.
- **Rule:** Nielsen 1, visibility of system status. Baymard: hidden category filters
  on mobile.
- **Evidence:** measured at 390: the scroller is `clientW=346` with
  `scrollW=759`. Button positions are `All` x=22-40, `Reverse Osmosis` 62-179,
  `Whole House` 201-293, `Countertop` 315-395, `Shower & Bath` **417-518**,
  `Replacement Filters` **540-679**, `Accessories` **701-781**. The last three begin
  beyond the 390px viewport. The scrollbar is suppressed and there is no fade, arrow
  or partial-item peek, so nothing indicates there is more to the right. Tab does
  reach them, because the browser scrolls a focused child into view, so this is a
  touch problem, not a keyboard one.
- **Severity:** blocks a sale.
- **Fix:** `css/styles.css:2164`. Either keep the scroller and add a right-edge
  gradient mask on `.cat-filter` (`mask-image: linear-gradient(90deg, #000 85%, transparent)`)
  so a cut-off chip is visible, or wrap at 390 with `flex-wrap: wrap` and let the rail
  take two rows. The second needs no new mechanics and matches `.cat-filter--row`,
  which already sets `flex-wrap: wrap` at `css/styles.css:485`.

### S5. The empty state is an `h3` and is never announced
- **Element:** `#shopEmpty`, "Nothing here yet / Try another category or search, or
  ask us." (`shop/index.html`).
- **Rule:** WCAG 2.1 AA — 1.3.1 (heading order); 4.1.3 (status).
- **Evidence:** measured: the empty state's heading is `H3` directly after the page
  `H1`, and `announced: false` — no `aria-live` on it or on the grid. Searching
  `zzzzqq` moves the grid from 17 cards to 0 and shows the panel with no announcement.
  It does contain a recovery link, which is right.
- **Severity:** blocks a person with a disability.
- **Fix:** `shop/index.html`, change the empty-state heading to `h2` and add the
  selector to the existing `.shop-empty h3` rule in `css/styles.css:476`. The live
  region is solved by S2.

### S6. Three of the six categories the site advertises return nothing
- **Element:** `CATEGORIES` in `js/main.js:95`, read by the nav mega menu, the home
  tiles and the footer, all linking to `/shop/?cat=…`.
- **Rule:** Nielsen 2, match between the system and the real world.
- **Evidence:** measured — selecting `Whole House` gives
  `document.querySelectorAll('.shop-grid .product-card').length` = **0** and shows
  the empty state. The catalogue holds only `Reverse Osmosis`,
  `Replacement Filters` and bundles, so `Whole House`, `Countertop` and
  `Shower & Bath` are empty. Each of those three is linked from three places: the
  mega menu, the home category grid and the footer. Nine dead ends.
- **Severity:** blocks a sale.
- **Fix:** this is a catalogue decision, not a markup one, and `CLAUDE.md` already
  records the catalogue as incomplete. The implementable half: give `CATEGORIES` in
  `js/main.js:95` an `available` flag derived from the live catalogue at render time,
  and have `renderCategoryTiles()`, `navItem()` and `renderFooter()` skip or mark the
  empty ones, so one list still drives all three surfaces. Do not hard-code which
  three are empty; the catalogue is being filled.

### S7. Long product names lose half their text, and lose more at 200% zoom
- **Element:** `.pc-name`, `css/styles.css:305` —
  `display: -webkit-box; -webkit-line-clamp: 2; overflow: hidden`.
- **Rule:** WCAG 2.1 AA — 1.4.4 Resize Text.
- **Evidence:** at 390 the name box is 147x41 and **6 of 17 names overflow it**:
  `W5-400 Alkaline Complete Replacement Filter Set` has `scrollHeight` 82 against
  `clientHeight` 41, so half the name is cut, with `title: null`, so the full string
  is nowhere. At 1366 with the root font size doubled to emulate 200% text zoom,
  `.pc-name` reports `scrollHeight` 165 against `clientHeight` 82 — the clamp holds
  two lines while the text needs four, so zooming loses content rather than
  revealing it. Reflow at 320 and text-spacing overrides are both clean on every
  page; this clamp is the only 1.4.4 failure found.
- **Severity:** blocks a person with a disability.
- **Fix:** `css/styles.css:305`, raise `-webkit-line-clamp` to 3 and add
  `min-height: calc(3 * 1.4em)` so the grid stays even, or drop the clamp and let the
  name wrap. If the clamp stays, add `title="${escapeHTML(p.name)}"` to the `.pc-name`
  anchor in `productCard()` (`js/main.js`) so the full name is available on hover.

### S8. Sorting by "Top Rated" does nothing
- **Element:** `<option value="rating">Top Rated</option>` in `shop/index.html`, and
  `list.sort((a, b) => b.rating - a.rating)` in `renderGrid()`.
- **Rule:** Nielsen 1, visibility of system status; Nielsen 2, match with the real
  world.
- **Evidence:** all seventeen seeded products carry `rating: '0.0'` and `reviews: 0`
  (`js/product-catalog.js`), so the comparator is always 0 and the order never
  changes. The control looks functional and is not.
- **Severity:** polish.
- **Fix:** `shop/index.html`, hide the `rating` option while no product has reviews:
  build the `<option>` list from a condition on
  `Store.getProducts().some(p => p.reviews > 0)`, the same test `productCard()`
  already uses at `js/main.js` to suppress `.pc-rating`.

---

## `/product/?id=c1000000-0000-4000-8000-000000000001`

### P1. Every product advertises a 0.0 rating and zero reviews
- **Element:** `<div class="pd-rating">★ ${p.rating} <span>· ${p.reviews} reviews</span></div>`
  (`product/index.html:139`).
- **Rule:** Baymard: a visible zero rating measurably reduces purchase intent.
  Hierarchy and consistency: the card and the detail page disagree.
- **Evidence:** measured on both an in-stock and an out-of-stock product, the
  rendered text is `★ 0.0 · 0 reviews` in `rgb(21,55,93)` at 16px / 700, directly
  under the `h1` and above the price — the most prominent position on the page.
  `productCard()` in `js/main.js` guards the same block with `${p.reviews ? … : ''}`
  and correctly renders nothing. All seventeen products carry `reviews: 0`.
- **Severity:** blocks a sale.
- **Fix:** `product/index.html:139`, wrap the block in the same guard the card uses:
  `${p.reviews ? `<div class="pd-rating">…</div>` : ''}`.

### P2. The out-of-stock line is a warm red at 4.38:1
- **Element:** `.pd-stock.out { color: var(--danger) }` (`css/styles.css:518`),
  `--danger: #D64545`.
- **Rule:** `CLAUDE.md` palette, "No greens, purples or warm casts anywhere a
  customer can see," which the 2026-11-02 log already applied by removing amber and
  red from the product and water pages. Also WCAG 2.1 AA — 1.4.3.
- **Evidence:** loaded `?id=c2000000-0000-4000-8000-000000000001`, a stock-0
  replacement filter: `.pd-stock.out` renders `rgb(214,69,69)` at 13.8px / 600 on
  white = **4.38:1**, below the 4.5 floor. It is reachable on 13 of the 17 products.
  The same rule block also holds `.pd-stock.in { color: var(--success) }`
  (`#1B9E6B`, a green), which is unreachable only because no product has stock above
  15 today.
- **Severity:** breaks a house rule, and blocks a person with a disability.
- **Fix:** `css/styles.css:518`. Set `.pd-stock.out` to `var(--muted)` (`#5B6B84`,
  5.41:1) and `.pd-stock.in` to `var(--navy-800)` (12.09:1). The state is already
  carried by the `ICONS` glyph beside it (`close`, `alert`, `check`) and by the
  words, so no information is lost with the colour.

### P3. `.pd-cat`, `.pd-stock.low` and `.pd-bundle-label` at 4.1 to 4.44:1
See G10. Three of the seven instances of that token are on this page.

### P4. The product page has no breadcrumb
- **Element:** `.breadcrumb`, absent from `product/index.html`.
- **Rule:** Nielsen 6, recognition rather than recall. Consistency with the rest of
  the site.
- **Evidence:** measured `document.querySelector('.breadcrumb')` is `null` on
  `/product/`. `/shop/`, `/manuals/` and `/order/` all render
  `<nav class="breadcrumb" aria-label="Breadcrumb">`, so the deepest page in the
  funnel is the one page with no way back up to its category.
- **Severity:** polish.
- **Fix:** `product/index.html`, add
  `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/shop/">Shop</a><span>/</span><span>…</span></nav>`
  to the page hero, with the third segment set from `p.category` linking to
  `/shop/?cat=…`. The component and its CSS already exist; nothing new is needed.

### P5. One image, no zoom, for a $1,499 product
- **Element:** `.pd-img`, `product/index.html:135` —
  `<div class="pd-img"><img src="${p.image}" alt="${p.name}"></div>`.
- **Rule:** Baymard: product imagery is the single largest measured factor on a
  product page; one non-zoomable image is its most frequently cited shortfall.
- **Evidence:** measured `document.querySelectorAll('.pd-img img, .pd-gallery img').length`
  = **1** and no zoom or lightbox control inside `.pd-img`. `images/products/`
  holds one editorial file per product, so there is no second angle to show today.
- **Severity:** blocks a sale.
- **Fix:** the minimum that is not a redesign: make the single image openable at full
  size. `manuals/index.html` already uses a native `<dialog>` with a close button and
  an overlay click handler; reuse that element and its `.doc-viewer` styling for an
  image view rather than adding a lightbox library. Additional angles are an
  `IMAGE_PROMPTS.md` request, not a markup change.

### P6. No delivery expectation is shown
- **Element:** `stockTxt` in `product/index.html:132`.
- **Rule:** Baymard: the delivery estimate belongs on the product page, not only at
  checkout.
- **Evidence:** the "ships in 1 to 2 business days" string only appears on the
  `stock > 15` branch. Every product in the catalogue has stock 0 or 1, so the branch
  taken is always `Out of stock` or `Low stock, only N left`, and the page never
  states when anything arrives. Measured: no text matching
  `ships in|business day|arrive` on either the in-stock or the out-of-stock product.
- **Severity:** blocks a sale.
- **Fix:** `product/index.html:132`, move the shipping sentence out of the stock
  ternary into its own line beneath `.pd-stock`, so it shows on every in-stock
  branch. `.pd-perk` is the existing component for exactly this kind of line and
  already carries three of them below the button.

### P7. The quantity picker is live on a product that cannot be bought
- **Element:** `#qDec` and `#qInc` in `.qty-picker` (`product/index.html:157`).
- **Rule:** Nielsen 5, error prevention.
- **Evidence:** on the stock-0 product, `#addBtn` is correctly `disabled` while
  `#qDec.disabled` and `#qInc.disabled` are both `false` and both render at 44x46.
  A shopper can set a quantity of 4 for something with no Add to Cart.
- **Severity:** polish.
- **Fix:** `product/index.html:157`, add `${p.stock === 0 ? 'disabled' : ''}` to both
  buttons, matching what the same template already does for `#addBtn` two lines down.

### P8. Reaching the stock ceiling is silent
- **Element:** `qty = Math.min(qty + 1, Math.max(p.stock, 1))`
  (`product/index.html:170`).
- **Rule:** Nielsen 1, visibility of system status.
- **Evidence:** on the in-stock product, `p.stock` is 1. Clicking `#qInc` leaves
  `#qVal` at `1` and prints nothing. `#qVal` does carry `aria-live="polite"`, but its
  text does not change, so there is nothing to announce. The control looks broken.
- **Severity:** polish.
- **Fix:** `product/index.html`, disable `#qInc` once `qty === p.stock` and add one
  line of helper text, or reuse `.pd-stock`'s own wording. The stock number is
  already on the page, so the message can simply be the existing "Low stock, only 1
  left" given focus.

### P9. Six interpolations reach `innerHTML` unescaped
- **Element:** `product/index.html:135-149` — `${p.image}` into `src`, `${p.name}`
  into `alt` and into the `h1`, `${p.category}`, `${p.rating}`, `${p.reviews}`,
  `${p.description}`, and `${s}` for each spec in the `.checklist` map.
- **Rule:** `CLAUDE.md`, "Everything that reaches `innerHTML` goes through
  `escapeHTML` first."
- **Evidence:** the same file escapes correctly twenty lines earlier — `${escapeHTML(faucet.name)}`,
  `${escapeHTML(faucet.id)}`, `${escapeHTML(defaultFaucet.name)}` — and then stops.
  These fields are editable by staff through the product editor, so the values are
  person-typed. `CLAUDE.md` names `js/admin.js` as the single open exception; this is
  a second one, on a customer page.
- **Severity:** breaks a house rule.
- **Fix:** `product/index.html:135-149`, wrap all eight in `escapeHTML()`. The
  function is already on `window`.

---

## `/checkout/`

Measured with an item in the cart; with an empty cart the form is replaced by an
empty-cart panel, which is why the harness's unlabelled-input count for this page
reads 1.

### C1. Eight form fields have no programmatic label
- **Element:** `checkout/index.html:32-50` — `<div class="field"><label>First name</label><input required id="fFirst"></div>`
  and seven more in the same shape: `fLast`, `fEmail`, `fPhone`, `fAddr`,
  `fBorough`, `fZip`, `fInstall`.
- **Rule:** WCAG 2.1 AA — 1.3.1; 3.3.2 Labels or Instructions; 4.1.2.
- **Evidence:** measured on all eight: `labelled: false`. The label is a sibling with
  no `for`, and no input is nested inside its label or carries `aria-label`. Static
  count: 8 `<label>` elements, **0** with `for`, 8 inputs. A screen reader announces
  every one of them as an unnamed edit field.
- **Severity:** blocks a sale, and blocks a person with a disability.
- **Fix:** `checkout/index.html`, add `for="fFirst"` and so on to all eight labels.
  `signin/index.html:45` and `technician/index.html:22` already do this correctly
  inside the same `.field` component, so no CSS changes.

### C2. No `autocomplete` and no `inputmode` on a shipping address form
See G14. Measured `autocomplete: null` and `inputmode: null` on all eight fields.
`fZip` carries `pattern="\d{5}"` and still opens a full keyboard on a phone.

### C3. `#coError` is not a live region and errors are not tied to fields
- **Element:** `<div class="form-error" id="coError"></div>`
  (`checkout/index.html:28`).
- **Rule:** WCAG 2.1 AA — 3.3.1 Error Identification; 4.1.3 Status Messages.
- **Evidence:** measured `role: null`, `aria-live: null`. Nothing in the page script
  ever writes to it either, so a failed `Store.placeOrder` returns silently
  (`if (!order) return;`). The identical box in `signin/index.html:28` carries
  `role="alert" aria-live="polite"`.
- **Severity:** blocks a person with a disability.
- **Fix:** `checkout/index.html:28`, add `role="alert" aria-live="polite"`, matching
  `signin/index.html:28`, and give the `if (!order) return` branch a message.

### C4. The order total sits below the whole form
- **Element:** the two `.panel` children of `#checkoutLayout`; the summary is the
  second.
- **Rule:** Baymard: hidden costs and a total that is not visible at the point of
  entry are its most-cited abandonment causes.
- **Evidence:** measured DOM order — `summaryBeforeForm: "summary after form"`. At
  390 the page is 2226px tall and `.checkout-layout` is a single column, so the
  shopper passes eight fields before seeing `Subtotal $1499.00 · Shipping FREE · NYC
  sales tax (8.875%) $133.04 · Total $1632.04`. The figures themselves are complete
  and correct, which is the hard part; only their position costs anything.
- **Severity:** blocks a sale.
- **Fix:** `css/styles.css`, in the 860px and below block, give `.checkout-layout`
  `display: flex; flex-direction: column` and the summary panel `order: -1`. No
  markup change, and the desktop two-column layout is untouched.

### C5. The customer's own name and email reach `innerHTML` unescaped
- **Element:** `checkout/index.html:102-133` — `${i.product.image}` into `src`,
  `${i.product.name}`, and `${order.customer.email}` inside `<strong>`.
- **Rule:** `CLAUDE.md`, the `escapeHTML` rule.
- **Severity:** breaks a house rule.
- **Fix:** `checkout/index.html:102-133`, wrap all three in `escapeHTML()`.

### C6. The disabled submit button is not tied to the reason it is disabled
- **Element:** `<button type="submit" class="btn btn-primary btn-block" disabled>Checkout unavailable</button>`
  (`checkout/index.html:53`) and the paragraph above it.
- **Rule:** WCAG 2.1 AA — 3.3.2 Labels or Instructions.
- **Evidence:** measured `aria-describedby: null`. The explanation is in an
  unlinked `<p>` directly above. The button's own contrast is fine:
  `rgb(91,107,132)` on `rgb(236,238,240)` = **4.65:1**, which satisfies the
  `CLAUDE.md` requirement that disabled buttons stay legible. Pressing Enter in a
  text field does not submit, verified: cart count unchanged, `#orderSuccess` still
  `display: none`.
- **Severity:** polish.
- **Fix:** `checkout/index.html`, give the paragraph `id="checkoutUnavailable"` and
  the button `aria-describedby="checkoutUnavailable"`.

### C7. The payment notice is written as an inline style block, not a component
- **Element:** `checkout/index.html:51-52`, a `<p>` with eleven inline declarations
  including `background: var(--ice-50); border: 1px solid var(--silver)`, and the
  success state's `.big-check` re-declared inline at line 132.
- **Rule:** `CLAUDE.md`, "If an element appears more than once, it is built once, and
  every screen calls it."
- **Evidence:** `.big-check` already exists in `css/styles.css:606` as
  `.order-success .big-check` and is written again inline here and a third time in
  `contact/index.html:52`. The notice box is the fourth variant of a bordered
  informational panel, beside `.prototype-note` (`css/styles.css:1838`),
  `.form-error` and the quiz's over-budget note.
- **Severity:** breaks a house rule.
- **Fix:** `css/styles.css`, add one `.notice` component near `.form-error` with a
  `--notice-accent` custom property for the variations, and have
  `checkout/index.html`, `contact/index.html` and `quiz/index.html` call it. Drop
  `.big-check` from the `.order-success` descendant selector so it can be used
  standalone, and delete both inline copies.

---

## `/quiz/`

### Q1. The Back control is a `<span>` and cannot be reached by keyboard
- **Element:** `<span class="link" id="quizBack">← Back</span>`
  (`quiz/index.html:147`).
- **Rule:** WCAG 2.1 AA — 2.1.1 Keyboard (Level A); 4.1.2 Name, Role, Value.
- **Evidence:** measured after answering question 1: `backTag: "SPAN"`,
  `role: null`, `tabindex: null`, and `backFocusAccepted: false` — calling
  `.focus()` on it does not move focus. A 40-press Tab walk through the quiz card
  returned only the four option buttons and never the Back control. A keyboard or
  switch user who mis-answers question 2 has no way back except reloading the page.
- **Severity:** blocks a person with a disability.
- **Fix:** `quiz/index.html:147`, make it `<button type="button" class="link" id="quizBack">`.
  `.link` is already applied to a `<button>` in `signin/index.html:57`
  (`class="link auth-mode-link"`), so the styling already supports a button and
  `css/styles.css:586` already gives that pairing a focus style.

### Q2. Each question replaces the card and drops focus to `<body>`
- **Element:** `render()` in `quiz/index.html:135`, which sets `card.innerHTML`
  on every step.
- **Rule:** WCAG 2.1 AA — 2.4.3 Focus Order; 4.1.3 Status Messages.
- **Evidence:** measured immediately after answering question 1:
  `focusAfterStepChange: "body (lost)"`, and
  `document.querySelectorAll('[aria-live],[role=status]').length` = **0**. The new
  question is neither focused nor announced, so a screen-reader user hears nothing
  and a keyboard user restarts from the top of the document on all five steps.
- **Severity:** blocks a person with a disability.
- **Fix:** `quiz/index.html`, in `render()` give the `h2.quiz-q` `tabindex="-1"` and
  focus it after each repaint, and wrap `#quizCard` in
  `aria-live="polite" aria-atomic="true"`.

### Q3. The options are not a group and are not tied to the question
- **Element:** `.quiz-opts` and its four `<button>` children
  (`quiz/index.html:141`).
- **Rule:** WCAG 2.1 AA — 1.3.1 Info and Relationships.
- **Evidence:** measured `role: null` and `aria-labelledby: null` on `.quiz-opts`.
  The question is an `h2` with no `id`, so nothing connects the four answers to the
  question they answer.
- **Severity:** blocks a person with a disability.
- **Fix:** `quiz/index.html:140-141`, give the `h2` an `id="quizQuestion"` and the
  wrapper `role="group" aria-labelledby="quizQuestion"`. `product/index.html:104`
  already does exactly this for its faucet configurator
  (`role="group" aria-labelledby="faucetLabel"`); copy that.

### Q4. "YOUR MATCH" is green, at 3.41:1
- **Element:** `quiz/index.html:156` —
  `<p style="…color:var(--success);font-weight:var(--w-bold);…">… YOUR MATCH</p>`.
- **Rule:** `CLAUDE.md` palette, "No greens, purples or warm casts anywhere a
  customer can see." Also WCAG 2.1 AA — 1.4.3.
- **Evidence:** measured on the finished quiz: `rgb(27,158,107)` at 12.8px / 700 on
  white = **3.41:1**, against a 4.5 floor. `--success` is `#1B9E6B`.
- **Severity:** breaks a house rule, and blocks a person with a disability.
- **Fix:** `quiz/index.html:156`, use `var(--blue-text)` from G10 or `--navy-800`.
  The check glyph beside it already carries the meaning.

### Q5. The progress bar has no role and no value
- **Element:** `<div class="quiz-progress"><div style="width:…%"></div></div>`
  (`quiz/index.html:138`).
- **Rule:** WCAG 2.1 AA — 4.1.2 Name, Role, Value.
- **Evidence:** measured `role: null`, `aria-valuenow: null`. On question 1 the bar
  width is `0%`, so sighted users see an empty track on the first screen too.
- **Severity:** polish.
- **Fix:** `quiz/index.html:138`, `role="progressbar"` with `aria-valuemin="0"`,
  `aria-valuemax="5"`, `aria-valuenow="${step}"` and
  `aria-label="Question ${step + 1} of 5"`, and start the width at
  `(step + 1) / 6 * 100` so question 1 shows progress.

### Q6. The step counter and the match label are typed in capitals
- **Element:** `QUESTION ${step + 1} OF ${QUESTIONS.length}` (`quiz/index.html:139`)
  and `YOUR MATCH` (line 156).
- **Rule:** `CLAUDE.md` voice, "Subtle and eloquent, never breathless."
- **Evidence:** both strings are literal uppercase in the source, not
  `text-transform`, so screen readers may spell them and the text cannot be restyled
  without editing copy. The project's own convention for this treatment is
  `.eyebrow`, which uses `text-transform: uppercase` with `letter-spacing: .16em`
  (`css/styles.css:86`).
- **Severity:** breaks a house rule.
- **Fix:** `quiz/index.html`, write `Question 1 of 5` and `Your match` in sentence
  case and apply the existing `.eyebrow` class, which also removes two inline style
  blocks.

---

## `/nyc-water/`

### W1. `.chart-note`, `.bar-val` and `.nyc-band strong` are below the floor
- **Rule:** WCAG 2.1 AA — 1.4.3.
- **Evidence:** measured from pixels. `div.chart-note` "Estimates for a household of
  four" `rgb(138,168,206)` on `rgb(38,70,106)` = **3.96:1** at 1366, **3.46:1** at
  390. `span.bar-val` "$1,640" `rgb(61,199,244)` = **4.43:1** at 1366, **4.26:1** at
  390. `strong` "4,000+ plastic bottles per household" `rgb(61,199,244)` at 14.4px /
  700 = **3.99:1** at 390.
- **Severity:** blocks a person with a disability.
- **Fix:** the same two token edits as H1 and H2; this page shares both components.

### W2. `.eyebrow` at 4.44:1
See G10. One instance, "The Journey".

Otherwise this page is clean: no overflow at 320 or 390, no console errors, no
failed requests, and the body copy on the navy wash measures 9:1.

---

## `/about/`

### B1. `.eyebrow` at 4.44:1 and 4.10:1
- **Evidence:** "Why We Exist" `rgb(42,123,196)` on white = **4.44:1** at 1366;
  "What We Stand For" on `--silver-50` = **4.10:1** at 390. See G10.
- **Severity:** blocks a person with a disability.

Nothing else measured as failing: 25 text runs checked at 1366, 19 at 390, zero
overflow, zero console errors.

---

## `/contact/`

### N1. All five form fields have no programmatic label
- **Element:** `contact/index.html:38-48` — `<div class="field"><label>Name *</label><input required id="cName"></div>`,
  and `cEmail`, `cPhone`, `cTopic`, `cMsg` in the same shape.
- **Rule:** WCAG 2.1 AA — 1.3.1; 3.3.2; 4.1.2.
- **Evidence:** measured `hasLabel: false` on all five. Static count: 5 `<label>`
  elements, **0** with `for`, 5 inputs. The `*` convention is also never explained
  anywhere on the page.
- **Severity:** blocks a person with a disability.
- **Fix:** `contact/index.html:38-48`, add `for` to all five labels, and one line of
  text saying what `*` means, or replace `*` with the word "required".

### N2. The submit error is appended above the form, unannounced, with focus left on the button
- **Element:** `contactError()` in `contact/index.html:80`, which creates a
  `<div class="form-error">` and prepends it to the form.
- **Rule:** WCAG 2.1 AA — 3.3.1 Error Identification; 4.1.3 Status Messages.
- **Evidence:** the created element has no `role` and no `aria-live`, it is inserted
  above eight fields so on a phone it is off-screen when it appears, focus stays on
  the submit button at the bottom, and no field is marked `aria-invalid`. The error
  text is good — it names the WhatsApp number as a fallback — and nobody using a
  screen reader will hear it.
- **Severity:** blocks a person with a disability.
- **Fix:** `contact/index.html:80`, add `role="alert"` when creating the box and
  `box.focus()` after setting its text, with `tabindex="-1"` on it. Match
  `signin/index.html:28`.

### N3. The success state swaps the form out without moving focus
- **Element:** `contactForm.style.display = 'none'` and
  `document.getElementById('contactDone').style.display = 'block'`
  (`contact/index.html:102`).
- **Rule:** WCAG 2.1 AA — 4.1.3 Status Messages; 2.4.3 Focus Order.
- **Evidence:** the button that had focus is removed from the layout and nothing
  takes its place, so focus falls to `<body>`. `#contactDone` has no live region, so
  a screen-reader user is told neither that the message was sent nor where they now
  are.
- **Severity:** blocks a person with a disability.
- **Fix:** `contact/index.html`, give `#contactDone` `tabindex="-1"` and
  `role="status"`, and focus it after showing it.

### N4. The success check is a green circle, declared inline
- **Element:** `contact/index.html:52` —
  `<div class="big-check" style="…background:var(--success);…">✓</div>`.
- **Rule:** `CLAUDE.md` palette (green on a customer page) and `CLAUDE.md`
  "built once" (`.big-check` already exists at `css/styles.css:606`, and
  `checkout/index.html:132` writes a third copy).
- **Evidence:** `--success` is `#1B9E6B`. The glyph is also a literal `✓` rather than
  `ICONS.check`, which `CLAUDE.md` names as the icon source.
- **Severity:** breaks a house rule.
- **Fix:** see C7 — one `.big-check` component, `var(--navy-800)` or
  `var(--blue-500)` as its fill, `${icon('check')}` as its content, called from all
  three places.

### N5. "Message received!" and the exclamation mark
- **Element:** `contact/index.html:53-54`.
- **Rule:** `CLAUDE.md` voice, "Subtle and eloquent, never breathless."
- **Evidence:** the page is otherwise in voice. "Message received!" is the only
  exclamation on the storefront apart from `/account/`'s "Welcome back, Name!".
- **Severity:** breaks a house rule.
- **Fix:** `contact/index.html:53`, "Your message is with us." and keep the second
  line as it is.

### N6. The contact method links are 16px tall
- **Element:** the `<a>` inside each `.ci-card`.
- **Rule:** target size, as G11.
- **Evidence:** measured `(917) 809-4803` 101x16, `Message us on WhatsApp` 179x16,
  `info@crystalina.org` 132x16. These are the three fastest routes to a sale on the
  page.
- **Severity:** polish.
- **Fix:** `css/styles.css`, `.ci-card a { display: inline-block; padding: 6px 0 }`.

### N7. `.eyebrow` at 4.10:1
See G10. One instance, "Questions we are asked", on `--silver-50`.

---

## `/signin/`

This is the best-built page on the site: labels carry `for`, `#authError` has
`role="alert"`, `#codeStatus` has `role="status"`, `#aCode` has
`autocomplete="one-time-code"`, the Google button uses the sanctioned four-colour
mark with `aria-hidden` on the SVG, and zero contrast failures at either width.
Three small things.

### I1. The Sign In / Create Account tabs expose no state
- **Element:** `<button id="tabSignin" class="active">Sign In</button>` and
  `<button id="tabSignup">Create Account</button>` (`signin/index.html:25-26`).
- **Rule:** WCAG 2.1 AA — 4.1.2 Name, Role, Value; 1.4.1 Use of Colour.
- **Evidence:** the only difference between the two is the `active` class. No
  `aria-pressed`, `aria-selected`, `role="tab"` or `aria-current`.
- **Severity:** blocks a person with a disability.
- **Fix:** `signin/index.html`, `aria-pressed` on both, toggled wherever the
  `active` class is toggled. Same shape as S3, so pick one convention and use it in
  both places.

### I2. `#aEmail` has no `autocomplete`
See G14. One attribute: `autocomplete="email"`.

### I3. `role="alert"` and `aria-live="polite"` on the same element
- **Element:** `<div class="form-error" id="authError" role="alert" aria-live="polite">`
  (`signin/index.html:28`).
- **Rule:** WCAG 2.1 AA — 4.1.3 Status Messages.
- **Evidence:** `role="alert"` already implies `aria-live="assertive"`; the explicit
  `polite` contradicts it and the resolution differs between screen readers.
- **Severity:** polish.
- **Fix:** `signin/index.html:28`, keep `role="alert"` and drop `aria-live`. This
  element is the pattern several other fixes above copy, so it is worth getting
  right first.

---

## `/account/`

### A1. Every order status pill is unstyled, because the class names never match
- **Element:** `<span class="status-pill status-${escapeHTML(o.status)}">`
  (`account/index.html:91`), also `order/index.html:95` and `js/admin.js:61`.
- **Rule:** Nielsen 1, visibility of system status. Hierarchy and consistency.
- **Evidence:** `STATUS_LABELS` in `account/index.html:76` defines the status values
  as `pending_payment, paid, processing, shipped, delivered, cancelled, refunded` —
  all lower case. `css/styles.css:657-660` defines `.status-Processing`,
  `.status-Shipped`, `.status-Delivered`, `.status-Cancelled` — all capitalised.
  **No emitted class ever matches a rule**, so every pill renders as bare
  `.status-pill`: 11.8px bold text with no background and no colour. `paid`,
  `pending_payment` and `refunded` have no rule at any capitalisation.
- **Severity:** polish, today, because the catalogue has no orders; it becomes
  "blocks a sale" the day orders exist, since the shopper cannot see whether an order
  shipped.
- **Fix:** `css/styles.css:657-660`, rename the four selectors to the lower-case
  values and add `.status-paid`, `.status-pending_payment` and `.status-refunded`.
  Do not fix it by capitalising in the markup; the database values are the source.
  While renaming, see A2.

### A2. The status palette is green, amber and red on a customer page
- **Element:** `css/styles.css:657-660` — `.status-Processing { background: #fff4e0;
  color: #b47416 }`, `.status-Delivered { background: #e2f6ec; color: var(--success) }`,
  `.status-Cancelled { background: #fdecec; color: var(--danger) }`.
- **Rule:** `CLAUDE.md` palette, "No greens, purples or warm casts anywhere a
  customer can see. The wider palette in `scripts/lib/tokens.mjs` is for internal
  diagrams only."
- **Evidence:** `#fff4e0`/`#b47416` is amber, `#e2f6ec`/`#1B9E6B` is green,
  `#fdecec`/`#D64545` is red. These rules are read by `account/index.html:91` and
  `order/index.html:95`, both customer pages, and by `js/admin.js:61`. The staff
  colour tokens at `css/styles.css:824-829` are a separate, legitimate set; these
  four are not scoped to staff.
- **Severity:** breaks a house rule.
- **Fix:** `css/styles.css:657-660`. Build the pill from the blue and silver ramp:
  `pending_payment` and `processing` on `--ice-100` with `--navy-800`,
  `shipped` on `--ice-50` with `--blue-text`, `delivered` on `--navy-800` with
  white, `cancelled` and `refunded` on `--silver-100` with `--muted`. Add a dot or
  the existing `.record-status::before` marker so the state is not colour alone.
  Keep the staff-only `--staff-*` tokens where they are.

### A3. The order list is repainted with no live region
- **Element:** `#ordersWrap`, written three times by `renderOrders()`
  (`account/index.html:82-98`): a loading message, then either the list, the empty
  state or an error.
- **Rule:** WCAG 2.1 AA — 4.1.3 Status Messages.
- **Evidence:** no `aria-live` on `#ordersWrap` or any ancestor.
  `order/index.html:31` gets this right — `<div class="receipt" id="receipt" aria-live="polite">`.
- **Severity:** blocks a person with a disability.
- **Fix:** `account/index.html:25`, add `aria-live="polite"` to `#ordersWrap`,
  copying `order/index.html:31`.

### A4. Sign Out is a red destructive button
- **Element:** `<button class="btn btn-danger btn-block btn-sm" id="signOutBtn">Sign Out</button>`
  (`account/index.html:28`).
- **Rule:** `CLAUDE.md` palette (warm red on a customer page) and Nielsen 4,
  consistency and standards — red is the colour of an irreversible action, and
  signing out is neither irreversible nor dangerous.
- **Evidence:** `.btn-danger { background: var(--danger) }` with `--danger: #D64545`.
- **Severity:** breaks a house rule.
- **Fix:** `account/index.html:28`, `class="btn btn-outline btn-block btn-sm"`. The
  two links above it are already `.btn-outline`, so the panel also becomes
  consistent.

### A5. Two developer-isms in customer copy
- **Element:** `'Welcome back, ' + user.name.split(' ')[0] + '!'`
  (`account/index.html:68`) and
  `${o.items.reduce((n, i) => n + i.qty, 0)} item(s)` (line 92).
- **Rule:** `CLAUDE.md` voice.
- **Evidence:** `item(s)` is a plural the reader has to resolve; the exclamation is
  the second on the site after N5.
- **Severity:** breaks a house rule.
- **Fix:** `account/index.html`, drop the exclamation, and pluralise properly —
  `manuals/index.html:118` already does this
  (`${list.length === 1 ? 'manual' : 'manuals'}`), so copy that shape.

---

## `/manuals/`

### M1. Seventeen 404s on every page load
- **Element:** `probe(p)` in `manuals/index.html:76`, which issues a `HEAD` request
  to `/manuals/files/<slug>.pdf` for every product.
- **Rule:** Nielsen 1, visibility of system status. Measurable defect: this is the
  only page on the site with console errors.
- **Evidence:** measured at both widths and all three verify viewports: **17 failed
  requests and 17 console errors** per load. The filenames are
  `f5-600-uv-alkaline.pdf`, `h5-600-uv-alkaline.pdf`, `w5-400-alkaline.pdf`,
  `x2a-600-smart-tankless.pdf` and thirteen more. `npm run verify -- /manuals/`
  therefore exits non-zero, which masks any future real error on the page. The grid
  also renders twice, once showing "Checking" and once with the answer.
- **Severity:** polish, but it is the one page that fails `npm run verify`.
- **Fix:** stop probing. The comment at `manuals/index.html:68` already says a
  manual named on the product row is trusted, so make `manualUrl` return `null` when
  `p.manualUrl` is unset and render the "Request this manual" branch without a
  request. When files land in the `site-media` bucket they will arrive with
  `manualUrl` set on the row, as the blueprint records.

### M2. The page promises a manual for everything and has none
- **Element:** `manuals/index.html:25` — "The manual for every system we sell, to
  read here or to keep."
- **Rule:** `CLAUDE.md` voice: "No 'placeholder', 'coming soon', 'concept', or notes
  to self in visible text. If something is not built, say so in the blueprint, not on
  the page." The inverse applies: the page should not promise what is not there.
  Nielsen 2, match with the real world.
- **Evidence:** all 17 cards resolve to the `Request this manual` mailto branch,
  because all 17 probes 404. The lead sentence is false for every row on the page.
- **Severity:** breaks a house rule.
- **Fix:** `manuals/index.html:25`, say what is true: that a manual can be sent for
  any system, and that the library is filling. The per-card copy already handles the
  individual case correctly and honestly.

### M3. The `All` filter chip is 18px wide
- **Element:** `.cat-filter button` with the label `All`.
- **Rule:** target size, as G11.
- **Evidence:** measured 18x46 at 390 and 19x36 at 1366, on both `/manuals/` and
  `/shop/`. `min-height` is applied and the width is not.
- **Severity:** polish.
- **Fix:** `css/styles.css:2166`, add `min-width: 44px` beside the existing
  `min-height: 44px`, or pad the chip horizontally.

---

## `/order/`

### O1. The status pill mismatch
See A1 and A2; `order/index.html:95` emits the same `status-${order.status}`.

This page is otherwise the cleanest on the site and is worth using as the reference
for the fixes above: `aria-live="polite"` on the region that is repainted,
`escapeHTML` on every interpolation including the address lines, a real `<table>`
for the line items, a breadcrumb, zero contrast failures and zero console errors at
both widths.

---

## `/admin/`, `/manager/`, `/sales/`, `/technician/`

### T1. Scope limit, recorded rather than reviewed
All four URLs redirect an unauthenticated visitor to the staff sign-in: measured
`<title>Sign In | Crystalina</title>` and `h1 "Staff sign in"`, with identical
heights (1246px desktop, 2202px phone) and weights. The dashboards behind the gate
could not be reached, because the gate is browser-side and unproven, which the
blueprint records as U1. **The dashboard interiors are therefore not covered by this
review.** Everything in the Every-page section applies to the four gates, which
render the customer header, footer and cart drawer.

### T2. The staff gates inherit the heading jump and the dead footer links
- **Evidence:** measured heading order on all four: `H1 Staff sign in, H3 Your Cart,
  H3 Join the Crystalina Club, H4 Shop…` — a 1 to 3 jump, and the customer cart
  drawer and newsletter form are present on a staff sign-in page. 3 dead footer
  links, 1 unlabelled newsletter input, `.auth-mode-link` at 192x23.
- **Severity:** blocks a person with a disability (the heading jump), polish (the
  rest).
- **Fix:** covered by G6, G7, G8 and G11.

### T3. `technician/index.html` ships a second, unreachable sign-in form
- **Element:** `technician/index.html:21-30`, a complete `#staffEmailForm` /
  `#staffCodeForm` pair with its own `#portalError` and `.prototype-note`, inside
  `main.portal-auth`.
- **Rule:** `CLAUDE.md`, "If an element appears more than once, it is built once, and
  every screen calls it."
- **Evidence:** the page redirects to `/signin/?mode=staff` before this markup is
  ever shown, so it is a dead second implementation of the sign-in the
  `/signin/` page now owns. `manager/index.html` and `sales/index.html` each carry a
  third and fourth copy, in a single line, with `.prototype-note` placeholders.
  Static label counts in these files also lag: `admin` 156 labels / 140 with `for` /
  171 inputs, `sales` 13 / 2 / 14, `manager` 9 / 2 / 9, `technician` 4 / 2 / 5 — so
  31, 11, 7 and 3 inputs respectively have no associated label in the markup. Those
  are inside the dashboards this review could not reach, so they are reported as a
  code reading, not a measurement.
- **Severity:** breaks a house rule.
- **Fix:** delete the gate markup and its scripts from `technician/index.html`,
  `manager/index.html` and `sales/index.html`, since `/signin/?mode=staff` is the
  single gate now. `js/manager.js`, `js/sales.js` and `js/technician.js` are marked
  **unowned** in `COORDINATION.md`, so raise this rather than taking it.

---

## `/privacy/`, `/terms/`, `/shipping-returns/`

### L1. They are not published
See G7, which is the finding. Nothing else here is wrong.

Measured clean: no overflow at 320, 390 or 1366; no console errors; no failed
requests. `/terms/` has one contrast failure, `a.link "Shipping and Returns"` at
**4.44:1** (G10). The `.legal` component holds its measure correctly — real font
metrics put every paragraph on all three pages under 80 characters a line, against
the `max-width: 68ch` the stylesheet sets, so `npm run verify`'s 12 to 20 "long
lines" on these pages are a harness artefact and not a defect. See the appendix.

---

## Taste, not defect

Judgement calls. Safe to ignore; none of them is a rubric violation.

1. **`prefers-reduced-motion` is not honoured.** `css/styles.css:92` records the
   2000ms button wipe as deliberate regardless of the preference, and
   `html { scroll-behavior: smooth }` has no guard. WCAG 2.3.3 is AAA, so this is
   outside the stated bar and is already a recorded decision.
2. **`.reveal { opacity: 0 }`** means the page below the fold is blank until
   `IntersectionObserver` fires. The fallback adds `.in` when the API is missing, and
   the header, footer and products are all JavaScript-rendered anyway, so a no-script
   visitor sees nothing regardless. Worth knowing, not worth changing.
3. **"You've unlocked FREE shipping"** in the cart drawer (`js/main.js:457`). The
   capitals and the word "unlocked" read as a loyalty app rather than the voice the
   rest of the site keeps. "Shipping is on us" would sit better. Same for
   `Shipping FREE` in the checkout summary.
4. **The checkout page explains the build state to the customer twice**
   (`checkout/index.html:20` and `:52`). `CLAUDE.md` says to record what is not built
   in the blueprint, not on the page, but a disabled checkout does have to say
   something, and what it says is calm and honest. A judgement call about how much.
5. **The header is 10.6px in places** (`.icon-label`). It passes contrast and it is
   hidden below 560px. Small, deliberately.
6. **The home page is 13,057px tall at 390**, fifteen screens. That is an editorial
   decision, and the bands are well paced.
7. **`target="_blank"` on the WhatsApp and social links** with no "opens in a new
   tab" cue. WCAG 3.2.5 is AAA.

---

## Appendix: method, and two harness warnings that are wrong

**Tooling.** `npm run serve` on port 4321 against the working tree at `80c3b9a`.
`npm run verify -- <page>` for the baseline table, with puppeteer 24 installed as
`npm i -D puppeteer --no-save` so `package.json` was not touched. Everything else is
headless Chrome driven directly, in the session scratchpad, nothing added to the
repository.

**How contrast was measured.** Reconstructing a composite from CSS gradients gave
wrong answers — an early pass of this review had the hero header at 1.4:1 — so every
ratio quoted here is taken from the rendered page instead. Each element is scrolled
to the centre of the viewport, the viewport is captured as a PNG, the PNG is decoded,
and the pixels inside the text node's own `Range` client rects are split into ink and
paper by distance from the declared colour. The paper average is the background. The
threshold is 4.5:1, or 3:1 where the computed size is 24px or more, or 18.66px at
weight 700 or more. Elements with a `visibility: hidden` or `opacity < 0.95`
ancestor, and rects outside the viewport, are excluded, which is what keeps the
closed mega menu and the closed cart drawer out of the numbers.

**The header over the hero photograph is fine.** This was checked carefully because
the 2026-11-02 log records it as having been at 3.3:1. Measured from pixels at 1366:
`.header-link` 13.18:1, `.nav-link` 10.22:1, `.icon-label` 5.18:1, `.hero h1`
14.46:1, `.hero p.lead` 12.12:1. The `.wash--hero` component is doing its job. The
one marginal value is `.hero-eyebrow`, 6.02:1 on average with the darkest sampled
paper at 3.98:1 against a 4.5 floor — close enough to the edge to be worth a glance
when the hero photograph is next replaced, not close enough to list as a finding.

**Two `npm run verify` columns over-report, and should not be treated as defects.**

- **`low contrast`** walks up the DOM for a background colour and stops at the first
  one it finds, so white type on the navy wash reads as white-on-white and scores
  1:1. That is why `/` and `/nyc-water/` show 20 each while the pixel measurement
  finds 3 and 4. Trust the findings, not that column.
- **`long lines`** estimates characters per line as `width / (fontSize * 0.5)`, which
  over-counts for Montserrat. Measured with the real font metrics through a canvas
  `measureText`, **no paragraph on any page exceeds 80 characters a line**, and the
  legal pages honour their `max-width: 68ch`. The 20, 12 and 12 reported for
  `/privacy/`, `/terms/` and `/shipping-returns/` are all false.
- **`unsized`** is mostly benign here: 14 to 20 images per page carry no `width` or
  `height`, but `.pc-img` sets `aspect-ratio: 4/5` and `.ct-media` sets `4/3`, so the
  boxes are reserved by CSS and layout does not shift. The real image finding is
  bytes and missing `srcset` (G15), not shift.

**Also checked and clean.** Horizontal reflow at 320 and 390 on all nineteen pages:
no two-dimensional scrolling anywhere, which is WCAG 1.4.10 met. Text-spacing
overrides (1.4.12): no clipping on any page. Numeric `font-weight`: zero occurrences
across `css/`, `js/` and all nineteen pages, so AD12 holds. Every page has exactly
one `<h1>`, exactly one `<main>` and `lang="en"`. No image anywhere is missing an
`alt` attribute. `npm test` passes, 113 of 113.

**What moved under this review.** `7acd0bd` ("the catalogue in Theory's restraint")
and five later commits landed while measurements were running. Every number above
was re-taken afterwards. One early finding was retired by that commit and is recorded
here so it is not re-reported: before `7acd0bd`, `.shop-layout` resolved its grid
track to a fixed 787.641px at every viewport from 320 to 860, so every product card
and the sort control sat up to 420px beyond the right edge, clipped silently by
`body { overflow-x: hidden }`. The redesign removed `.shop-layout` and the defect
with it. `/shop/` at 390 now measures a clean two-column grid, 171px cards, no
overflow.
