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

---

## Applying the 2026-08-30/31 migrations

Verified against project `ucrmebgsbkfizxthngbi` on 2026-08-31:

| Migration | Status |
|---|---|
| `20260830120000_orders_rpc_and_inbound_forms.sql` | applied |
| `20260830190000_stages_faucets_and_site_content.sql` | applied |
| `20260830190500_create_order_with_configuration.sql` | applied |
| `20260831090000_site_media_storage.sql` | **not applied** |

The storage migration is the only one still outstanding. Until it runs, image
uploads in the admin console fail with a message saying storage is not set up;
nothing else is affected.

To apply it, open the Supabase dashboard for the project, go to **SQL Editor**,
paste the contents of `supabase/migrations/20260831090000_site_media_storage.sql`
and run it. It creates the public `site-media` bucket (5 MB limit, images only)
and the read/write policies. Re-run is safe: the insert upserts and each policy
is dropped before being recreated.

Verify with:

```
curl -s -o /dev/null -w "%{http_code}\n" \
  https://ucrmebgsbkfizxthngbi.supabase.co/storage/v1/object/public/site-media/x.png
```

`400` means the bucket is still missing. `404` means the bucket exists and the
file simply is not there, which is the expected result.

## Catalog data still to seed

The schema is live but empty in three places:

1. `product_stage_options` has no rows, so no product offers a stage choice yet.
   Add one row per buyable build, for example a 5, 6 and 7 stage version of a
   system, each with its own `price_cents` and one marked `is_default`.
2. No products have `product_kind = 'faucet'`. Once faucet products exist, set
   `available_as_upgrade = true` on the ones shoppers may pick, and set each
   system's `default_faucet_id` to the faucet included in the box.
3. `site_content` is empty until someone presses **Publish to website** in the
   admin content editor.
