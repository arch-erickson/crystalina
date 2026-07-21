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
| `admin.html` | Admin dashboard — stats, product manager (add/edit/delete with image upload), orders, customers |
| `nyc-water.html` | Education page: what's in NYC tap water, cost comparison charts, FAQ |
| `quiz.html` | 5-question "Find Your Filter" recommender |
| `about.html` / `contact.html` | Brand story and contact form |

Shared pieces: sticky header with slide-out cart drawer (Express Water–style), footer with
Instagram / X / Facebook / WhatsApp links, floating WhatsApp button.

## Demo admin login

- Email: `admin@crystalinawater.com`
- Password: `crystalina2026`

In the admin **Products** tab you can add a product with image upload (drag & drop or click),
name, category, price, compare-at price, stock count, descriptions, and key features.
New products appear in the shop immediately.

## First-draft notes (for the next phase)

- All data (products, cart, users, orders) lives in `localStorage` — swap for a real backend + database.
- Auth is demo-grade (plaintext, client-side). Replace with real authentication before launch.
- Checkout simulates orders; wire up Stripe/PayPal next.
- Product and lifestyle images are placeholders (branded SVGs + stock photos) — replace with real photography.
- NYC water statistics are illustrative first-draft figures; verify against NYC DEP reports and lab data before publishing claims.
- Social links point to `crystalinawater` handles — update once accounts exist. WhatsApp/phone: (929) 455-6788.
