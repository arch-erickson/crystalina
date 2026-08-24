# Supabase and Vercel setup

Crystalina currently has an empty local storefront and no browser-only authentication or order processing. Do not restore demo records. The initial schema migration creates empty tables and no initial administrator.

## Database setup

1. Choose or create the dedicated Crystalina Supabase project.
2. Apply `supabase/migrations/20260824155614_initial_schema.sql` to that project.
3. Create the first administrator in Supabase Auth, then grant the `admin` role using a server-only SQL session. Do not grant admin roles from the browser.
4. Configure Supabase Auth redirect URLs for `https://crystalina.org/**` and Vercel preview URLs.
5. Run Supabase security and performance advisors after applying the migration.

## Vercel setup

1. Import the GitHub repository as a Framework Preset of `Other`, with no build command or output directory.
2. Add the variables listed in `.env.example`. Keep service-role, Stripe, and Turnstile secret values server-only.
3. Deploy to a Vercel preview first. Verify folder routes, root-absolute assets, sitemap, robots, and the manifest.
4. Keep GitHub Pages active until the preview has passed verification. Move `crystalina.org` only after Vercel domain verification and a planned DNS cutover.

## Application migration order

1. Public catalog and approved reviews.
2. Supabase Auth, customer profiles, and account orders.
3. Server-side Stripe checkout, webhook verification, and transactional inventory updates.
4. Admin product/order management.
5. Staff, service, suppliers, leads, marketing, and reporting domains, each with its own schema and RLS policy.

Browser code may use only the Supabase publishable key. All role changes, order creation, payment verification, inventory changes, and administrative mutations must occur through a server boundary with the service-role key kept in Vercel.
