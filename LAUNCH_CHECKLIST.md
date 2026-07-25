# Crystalina — Launch Readiness Checklist

Status of the website on the road from **first-draft demo** → **real store taking real orders**.
Legend: ✅ done · 🔲 to do · ⚠️ demo-only placeholder that MUST be replaced before real use.

---

## ✅ Already done
- [x] Domain purchased (crystalina.org) + DNS → GitHub Pages
- [x] HTTPS / SSL enforced
- [x] Hosting + auto-deploy via Git push
- [x] Brand logo (mark + wordmark), favicons, app icons
- [x] Brand color system from logo
- [x] Responsive design (desktop + mobile)
- [x] Clean URLs (/shop/, /nyc-water/, …)
- [x] Full page set: home, shop, product, cart/checkout, sign-in, account, admin, NYC water, quiz, about, contact
- [x] Sitemap.xml, robots.txt, Organization structured data
- [x] Google Search Console verified

---

## 🔴 MUST-HAVE before taking a single real order

### Backend & data (the biggest gap)
- [ ] ⚠️ Real database — products/orders/users currently live in each visitor's **browser only** (localStorage). Nothing is shared or saved server-side.
- [ ] Choose a backend: **Supabase** or **Firebase** recommended (auth + DB + storage in one, generous free tier)
- [ ] Products managed in the DB so the admin panel changes are real and visible to all visitors
- [ ] Orders written to the DB and visible to you (not just the customer's browser)
- [ ] Authoritative inventory/stock counts

### Payments
- [ ] Payment processor — **Stripe** recommended (also supports Apple/Google Pay); PayPal optional
- [ ] Server-side order total + tax calculation (never trust the browser)
- [ ] Validate NYC sales tax rate (currently hardcoded 8.875%) with an accountant
- [ ] Order confirmation email to customer + notification to you
- [ ] Refund / cancellation handling

### Authentication & security
- [ ] ⚠️ Real auth — passwords are currently stored in plaintext in the browser. Replace with proper hashed auth (Supabase/Firebase Auth).
- [ ] ⚠️ Remove the demo admin credentials shown on the sign-in page
- [ ] ⚠️ Server-side admin protection — right now `/admin/` is gated only in the browser; anyone can open it. Real access control must live on the server.
- [ ] Password reset + email verification flows
- [ ] Rate limiting / brute-force protection on login (Cloudflare, or backend middleware)
- [ ] Bot protection on forms & login (Cloudflare Turnstile / hCaptcha)
- [ ] Input sanitization to prevent XSS (user-entered text is currently injected as HTML in cart/admin)
- [ ] No secrets/API keys in client-side code

### Legal (required to sell)
- [ ] Business registration / LLC + NY sales tax permit
- [ ] Privacy Policy (currently a `#` placeholder)
- [ ] Terms of Service (currently a `#` placeholder)
- [ ] Shipping & Returns policy (currently a `#` placeholder)
- [ ] Warranty terms

---

## 🟡 SHOULD-HAVE for a credible public launch

### Content & media
- [ ] ⚠️ Replace ALL placeholder images (hero, category tiles, products, lifestyle) with real photography
- [ ] Real product photos, descriptions, specs, and prices
- [ ] ⚠️ Replace testimonials — current ones are written examples, not real customers
- [ ] ⚠️ Verify the statistics on the homepage & NYC Water page — they're currently labeled "illustrative." Replace with cited figures from NYC DEP / EPA before presenting as fact.
- [ ] Real "About" story / team / founding details
- [ ] Confirm business contact details are final (phone, email, address, hours)

### Forms & communication (currently save to browser only)
- [ ] Contact form actually delivers email — Formspree, EmailJS, or backend
- [ ] Newsletter signup connects to an email platform (Mailchimp / Klaviyo / Beehiiv)
- [ ] Automated order & shipping confirmation emails
- [ ] Test phone, WhatsApp, and all social links end-to-end

### SEO & growth
- [ ] Submit sitemap.xml in Google Search Console + request indexing
- [ ] Set up Bing Webmaster Tools (covers Yahoo too)
- [ ] Create a **Google Business Profile** (huge for local NYC search)
- [ ] Add Open Graph / Twitter Card tags so shared links show a nice preview image
- [ ] Add unique meta descriptions to every page (some are missing)
- [ ] Add Product structured data (for rich results in search)
- [ ] Install analytics (GA4 or privacy-friendly Plausible)
- [ ] Cookie/consent notice if analytics or marketing pixels are added

---

## 🟢 NICE-TO-HAVE / ongoing polish
- [ ] Custom 404 page
- [ ] Redirects from old `/page.html` URLs to `/page/` (only matters if any were shared/indexed)
- [ ] Accessibility pass (WCAG: contrast, keyboard nav, alt text, form labels)
- [ ] Cross-browser + real-device testing (Safari, Firefox, Edge, iOS, Android)
- [ ] Image optimization (compress/serve WebP) for speed
- [ ] Error monitoring (Sentry) once there's a backend
- [ ] Product reviews/ratings from real customers
- [ ] Order tracking / status emails
- [ ] Blog for SEO (NYC water topics)
- [ ] Live chat or chatbot
- [ ] Automated daily social posts (discussed separately)
- [ ] Wishlist / save-for-later
- [ ] Discount codes / promotions
- [ ] Backups once a database exists

---

## Suggested order of attack
1. **Legal + business registration** (can run in parallel with everything)
2. **Backend + database** (Supabase) — unlocks real products, orders, auth
3. **Real authentication** + remove demo credentials + server-side admin protection
4. **Payments** (Stripe) + order emails
5. **Real content** — photos, copy, verified stats, legal pages
6. **Forms** (contact/newsletter) wired to email
7. **SEO + analytics + Google Business Profile**
8. Polish: 404, accessibility, testing, performance
