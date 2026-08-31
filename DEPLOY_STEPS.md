# Crystalina: go-live steps

Three tasks, in order. Roughly 45 minutes total. Do them in this order because
each one depends on the previous.

---

# 1. Apply the database migrations (10 minutes)

> **Status verified 2026-08-31: step 1 is COMPLETE.**
> Both migrations are applied. The `site-media` bucket exists, and the catalog
> functions exist and correctly refuse anonymous callers. Move on to step 2.

These two migrations add image storage and the staff-gated catalog write path.
Both are already applied; the steps below are kept for reference and for
rebuilding the project from scratch.

1. Open the Supabase dashboard and select the Crystalina project
   (`ucrmebgsbkfizxthngbi`).
2. In the left sidebar choose **SQL Editor**, then **New query**.
3. Open `supabase/migrations/20260831090000_site_media_storage.sql` from this
   repo, copy the whole file, paste it into the editor, and press **Run**.
   This creates the public `site-media` bucket and its access policies.
4. **New query** again. Open `supabase/migrations/20260831120000_product_write_rpcs.sql`,
   copy the whole file, paste, and **Run**. This adds `products.details` and the
   four staff-gated catalog functions.

Both files are safe to run twice: the bucket insert upserts, policies are
dropped before being recreated, and the functions use `create or replace`.

### Confirm it worked

This project returns HTTP **400** for a missing object, not 404, so the status
code alone is misleading. Read the **body** instead. In PowerShell:

```powershell
curl.exe -s https://ucrmebgsbkfizxthngbi.supabase.co/storage/v1/object/public/site-media/x.png
```

- `"code":"NoSuchKey"` means the **bucket exists** and only that file is absent. This is success.
- `"code":"NoSuchBucket"` means the bucket was not created, so the migration did not run.

Use `curl.exe`, not `curl`: in PowerShell `curl` is an alias for
`Invoke-WebRequest`, which rejects the Unix `-s -o -w` flags.

Then in the SQL Editor:

```sql
select proname from pg_proc
where proname in ('upsert_product','delete_product','upsert_stage_option','delete_stage_option');
```

You should get four rows.

### Give yourself the admin role

The catalog functions check your role, so your account needs one. Still in the
SQL Editor, with your own email:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'you@example.com'
on conflict do nothing;
```

---

# 2. Deploy to Vercel (20 minutes)

GitHub Pages serves static files only, so the `/api` folder never runs there.
The contact form, the newsletter and order creation stay inert until this is done.

## 2.1 Import the project

1. Go to vercel.com and sign in with GitHub.
2. **Add New** then **Project**, and import `arch-erickson/crystalina`.
3. Framework Preset: **Other**. Leave Build Command and Output Directory empty.
   This is a static site plus serverless functions; there is nothing to build.
4. Do **not** deploy yet. Add the environment variables first.

## 2.2 Environment variables

In **Settings** then **Environment Variables**, add each of these for
Production, Preview and Development. Values come from Supabase under
**Settings** then **API**.

| Name | Value | Notes |
|---|---|---|
| `SUPABASE_URL` | `https://ucrmebgsbkfizxthngbi.supabase.co` | |
| `SUPABASE_PUBLISHABLE_KEY` | the anon/publishable key | safe in the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | the service role key | **server only, never share** |
| `RESEND_API_KEY` | from resend.com | optional; without it forms still save, they just do not email |
| `EMAIL_FROM` | `Crystalina <noreply@crystalina.org>` | domain must be verified in Resend |
| `CONTACT_INBOX` | `info@crystalina.org` | where enquiries land |
| `TURNSTILE_SECRET_KEY` | from Cloudflare Turnstile | optional; captcha is skipped until set |
| `PUBLIC_SITE_URL` | `https://crystalina.org` | |

## 2.3 Deploy and test on the preview URL

1. Press **Deploy**. You get a URL like `crystalina-abc123.vercel.app`.
2. On that preview URL, check in this order:
   - the homepage, `/shop/`, and a product page all render
   - submit the **contact form**; you should see the success state, and a row
     should appear in Supabase under Table Editor then `contact_messages`
   - submit the **newsletter** in the footer; check `newsletter_subscribers`
   - sign in, open `/admin/`, edit a product price and save. It should say
     "Product updated and published". Reload the storefront and confirm the new
     price is there. This is the check that matters most.
   - upload an image in the content editor and confirm it appears

If the contact form reports an error, open the Vercel **Logs** tab; a missing
`SUPABASE_SERVICE_ROLE_KEY` is the usual cause.

## 2.4 Point the domain over

Only after the preview passes.

1. In Vercel, **Settings** then **Domains**, add `crystalina.org` and `www.crystalina.org`.
2. Vercel shows the DNS records it wants. In Squarespace DNS, replace the four
   GitHub Pages A records (`185.199.108-111.153`) with Vercel's A record
   `76.76.21.21`, and point the `www` CNAME at `cname.vercel-dns.com`.
3. Keep the GitHub Pages deployment in place until Vercel reports the domain as
   verified and serving. DNS can take up to a few hours.
4. In Supabase, **Authentication** then **URL Configuration**, add your Vercel
   preview URL and `https://crystalina.org/**` to the redirect allow-list, or
   email sign-in will fail on the new host.

---

# 3. What the admin can now change on the live site

After steps 1 and 2, these admin edits reach real visitors:

| Admin screen | What it changes | How it reaches the site |
|---|---|---|
| Products | name, price, compare-at, stock, category, badge, copy, specs, images | `upsert_product`, then every page hydrates from Supabase |
| Products | delete | `delete_product`; refuses if the product is on an order |
| Content and Website | section order, show/hide, eyebrow, heading, body, image, button | **Publish to website** writes `site_content` |
| Content and Website | which products appear in Best Sellers | same publish step |
| Content and Website | the flagship product in "Inside the Flagship" | same publish step |
| Content and Website | announcement bar text, hero image | same publish step |
| Settings | company name, email, phone, address, hours | footer reads them |
| Settings | brand colours | applied as CSS variables site-wide |

**Publishing is a deliberate step.** Edits are local until someone presses
**Publish to website** in Content and Website. That is intentional: it lets a
manager work through changes without a half-finished page going live.

### Not yet editable

Honest list, so nobody hunts for a control that does not exist:

- Repeatable items inside sections: trust-bar items, category tiles,
  testimonials, water-facts figures and process steps are still in the HTML
- Navigation links and social URLs
- The free-shipping threshold, which is written in three places
- Stage options and faucet assignments have database functions but no admin
  screen yet; they are set through the SQL Editor for now
