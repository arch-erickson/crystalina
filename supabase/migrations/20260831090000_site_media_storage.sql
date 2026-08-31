-- Crystalina: a public bucket for images uploaded through the admin console.
--
-- Uploads previously became base64 data URLs inside a single localStorage key.
-- A 2.5 MB photo turned into ~3.3 MB of text and could exhaust the ~5 MB quota,
-- taking the entire admin dataset down with it, and the image never reached a
-- real visitor. Storage fixes both: the browser uploads the file and we keep
-- only the public URL.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media', 'site-media', true, 5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anyone may read; the storefront renders these images to the public.
drop policy if exists "site_media_public_read" on storage.objects;
create policy "site_media_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'site-media');

-- Only staff may add, replace or remove media.
drop policy if exists "site_media_staff_write" on storage.objects;
create policy "site_media_staff_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'site-media'
    and exists (
      select 1 from public.user_roles r
      where r.user_id = auth.uid() and r.role in ('admin', 'manager')
    )
  );

drop policy if exists "site_media_staff_update" on storage.objects;
create policy "site_media_staff_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'site-media'
    and exists (
      select 1 from public.user_roles r
      where r.user_id = auth.uid() and r.role in ('admin', 'manager')
    )
  );

drop policy if exists "site_media_staff_delete" on storage.objects;
create policy "site_media_staff_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'site-media'
    and exists (
      select 1 from public.user_roles r
      where r.user_id = auth.uid() and r.role in ('admin', 'manager')
    )
  );
