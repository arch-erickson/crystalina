# Crystalina — Water Filtration for New York City

First-draft website for Crystalina ("Pure Water. Pure Life."), a water filter company serving NYC.
Pure HTML/CSS/JS — no build step, no server required.

## Run it

Open `index.html` in any browser, or serve the folder for cleaner URL handling:

```
npx serve .
```

## Pages

| Page | Purpose |
|---|---|
| `index.html` | Landing page — hero, categories, best sellers, NYC water stats + chart, testimonials |
| `shop.html` | Product catalog with category filter, search, and sorting (`?cat=` deep links) |
| `product.html?id=…` | Product detail with quantity picker, stock status, related products |
| `checkout.html` | Cart checkout with NYC borough selector, 8.875% sales tax, simulated orders |
| `signin.html` | Customer sign in / sign up, plus admin mode (`?mode=admin`) |
| `account.html` | Customer dashboard with order history |
| `admin/` | Admin dashboard, commerce, subscriptions, field service, staff, purchasing, leads, marketing, support, content, finance, and settings |
| `technician/` | Role-gated field workspace for assigned jobs, checklists, statuses, and installation photos |
| `manager/` | Role-gated operations workspace for inventory, support, technician schedules, and job assignments |
| `sales/` | Role-gated workspace for leads, sales, customers, campaigns, and cart recovery |
| `nyc-water.html` | Education page: what's in NYC tap water, cost comparison charts, FAQ |
| `quiz.html` | 5-question "Find Your Filter" recommender |
| `about.html` / `contact.html` | Brand story and contact form |

Shared pieces: sticky header with slide-out cart drawer (Express Water–style), footer with
Instagram / X / Facebook / WhatsApp links, floating WhatsApp button.

## Store operations

The browser-only demo catalog, accounts, staff records, orders, and admin metrics have been removed.
The manufacturer-backed catalog is versioned in `js/product-catalog.js` and mirrored in Supabase with explicit compatibility and bundle relationships. Cart and checkout persistence remain browser-local for now.

## First-draft notes (for the next phase)

- Published products and filter relationships are in Supabase; cart and simulated orders still live in `localStorage`.
- Auth is demo-grade (plaintext, client-side). Replace with real authentication before launch.
- Checkout simulates orders; wire up Stripe/PayPal next.
- The four purchased filtration systems use actual Crystalina product photos. Remaining lifestyle and legacy catalog media should be reviewed before launch.
- NYC water statistics are illustrative first-draft figures; verify against NYC DEP reports and lab data before publishing claims.
- Contact: phone/WhatsApp (917) 809-4803, info@crystalina.org, New York City, NY.
- Socials: Instagram/X @crystalinawater, Facebook profile 61591728311575, LinkedIn company/crystalina-water.
