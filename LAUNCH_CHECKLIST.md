# Crystalina — Launch Readiness Checklist

Status of the website on the road from **demo** to a **real store taking real orders**.

Legend: `[x]` done · `[ ]` to do · **!** demo-only placeholder that MUST be replaced before real use.

> Last verified against the codebase on 2026-08-30. Built collaboratively by Claude Code and Codex.
> When you finish an item, tick it here so both assistants stay in sync.

---

## [x] Foundation (done)

**Site & hosting**
- [x] Domain (crystalina.org), DNS, HTTPS/SSL enforced
- [x] GitHub Pages hosting with auto-deploy on push to `main`
- [x] Clean URLs (`/shop/`, `/nyc-water/`, no `.html`)
- [x] Responsive across desktop and mobile
- [x] Sitemap.xml, robots.txt, Organization structured data
- [x] Google Search Console verified

**Brand & design system**
- [x] Logo mark, wordmark lockup, favicons, app icons
- [x] Colour system sampled from the logo (navy #1F4C80, blue #2A7BC4, cyan #3DC7F4, silver #CFD2D3)
- [x] Typography: Inter body, Poppins headings
- [x] Unified button system with the centre-out fill hover animation
- [x] Professional stroke line-icon set (all emoji removed)
- [x] All em/en dashes removed from copy
- [x] Full-bleed hero, elevated cards and diagrams, scroll-reveal animation

**Imagery (delivered by Codex)**
- [x] Hero background, exploded RO-10 view
- [x] Six category tiles, lifestyle, NYC skyline, point-of-use
- [x] 54 studio product photographs in `/images/products/`
- [x] Zero stock-photo placeholders remaining on any page

**Backend foundations (Supabase)**
- [x] Supabase project connected; 7 SQL migrations in `supabase/migrations/`
- [x] Real email-OTP authentication (`js/auth.js`), publishable key only, no secrets in the front end
- [x] `user_roles` table with role-based routing; RLS policies in place
- [x] Demo admin credentials removed from the sign-in page
- [x] Setup documented in `docs/SUPABASE_VERCEL_SETUP.md`

**Operations tooling (beyond the original scope)**
- [x] Workforce scheduling and timesheets (schedules, shifts, availability, time-off, publish batches)
- [x] Manufacturer-backed product catalog with filter compatibility and model-specific bundles
- [x] Role dashboards: `/admin/`, `/manager/`, `/sales/`, `/technician/`
- [x] QR code tooling and technician routing

---

## MUST-HAVE before taking a single real order

### Finish the Supabase migration (the current blocker)
`js/store.js` still says *"temporary local state during the Supabase migration."* Auth and the
workforce tools are on Supabase; **the storefront data layer is not yet.**
- [ ] **!** Move **products** from the local catalog seed into Supabase, so admin edits are real and visible to every visitor
- [ ] **!** Write **orders** to Supabase (currently the operational arrays are deliberately empty)
- [ ] **!** Authoritative **inventory / stock counts** server-side
- [ ] **!** Customer records persisted server-side
- [ ] Retire the legacy `Store` auth stubs (`signUp`/`signIn` return "being configured") now that `CrystalinaAuth` is live
- [ ] Extend `CrystalinaAuth` beyond `/signin/` to the pages that still rely on local session state

### Payments (nothing built yet)
- [ ] Payment processor: **Stripe** recommended (covers Apple/Google Pay); PayPal optional
- [ ] Server-side order total and tax calculation (never trust the browser)
- [ ] Validate the NYC sales tax rate (currently hardcoded 8.875%) with an accountant
- [ ] Order confirmation email to the customer, notification to you
- [ ] Refund and cancellation handling
- [ ] Roll the Stripe test secret key that was pasted into chat; only ever expose `pk_` keys

### Security
- [ ] Server-side admin/role protection verified end to end (RLS covers data; confirm no client-only gates remain)
- [ ] Password reset and email verification flows
- [ ] Rate limiting / brute-force protection on sign-in
- [ ] Bot protection on forms (Cloudflare Turnstile or hCaptcha)
- [ ] Input sanitization review: user-entered text is injected as HTML in several render paths (XSS risk)
- [ ] Confirm no secrets or service-role keys reach client-side code

### Legal (required to sell)
- [ ] Business registration / LLC + NY sales tax permit
- [ ] **!** Privacy Policy (footer link is still `#`)
- [ ] **!** Terms of Service (footer link is still `#`)
- [ ] **!** Shipping & Returns policy (footer link is still `#`)
- [ ] Warranty terms

---

## SHOULD-HAVE for a credible public launch

### Content
- [ ] **!** Replace the testimonials, the current ones are written examples, not real customers
- [ ] **!** Verify the statistics on the homepage and NYC Water page, both still carry an "illustrative" disclaimer. Cite NYC DEP / EPA figures before presenting them as fact.
- [ ] Real product descriptions, specs, and final pricing to match the new catalog
- [ ] Real "About" story, team, founding details
- [ ] Confirm business contact details are final (phone, email, address, hours)

### Forms & communication
- [ ] **!** Contact form does not send anything yet (no Formspree/EmailJS/backend action)
- [ ] Newsletter signup connected to an email platform (Mailchimp / Klaviyo / Beehiiv)
- [ ] Automated order and shipping confirmation emails
- [ ] Test phone, WhatsApp, and every social link end to end

### SEO & growth
- [ ] Submit sitemap.xml in Search Console and request indexing
- [ ] Bing Webmaster Tools (also covers Yahoo)
- [ ] **Google Business Profile** (high impact for local NYC search)
- [ ] Open Graph / Twitter Card tags so shared links show a preview image (none present today)
- [ ] Unique meta descriptions on every page
- [ ] Product structured data for rich results
- [ ] Analytics (GA4 or Plausible) — none installed
- [ ] Cookie/consent notice once analytics or pixels are added

---

## NICE-TO-HAVE / ongoing polish
- [ ] Custom 404 page
- [ ] Redirects from the old `/page.html` URLs to `/page/`
- [ ] Accessibility pass (contrast, keyboard nav, alt text, form labels)
- [ ] Cross-browser and real-device testing (Safari, Firefox, Edge, iOS, Android)
- [ ] Image optimization pass (the catalog is now image-heavy; check page weight and lazy loading)
- [ ] Error monitoring (Sentry)
- [ ] Real product reviews and ratings
- [ ] Order tracking and status emails
- [ ] Blog for SEO (NYC water topics)
- [ ] Live chat or chatbot
- [ ] Automated daily social posts (Instagram, X, Facebook, LinkedIn; WhatsApp stays manual)
- [ ] Wishlist, discount codes, promotions
- [ ] Database backup routine

---

## Suggested order of attack
1. **Finish the storefront Supabase migration** (products, orders, inventory). Everything else depends on this.
2. **Payments** (Stripe) plus order confirmation emails.
3. **Legal pages** and business registration. Can run in parallel from day one.
4. **Content truth pass**: real testimonials, verified statistics, final pricing.
5. **Forms**: contact and newsletter actually delivering.
6. **SEO and analytics**: Google Business Profile, Open Graph, GA4/Plausible.
7. **Polish**: 404, accessibility, performance, cross-browser testing.
