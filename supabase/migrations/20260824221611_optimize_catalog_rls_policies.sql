-- Keep one permissive SELECT path while retaining admin and manager catalog writes.
drop policy "compatibilities_staff_manage" on public.system_filter_compatibilities;
drop policy "bundle_items_staff_manage" on public.product_bundle_items;

create policy "compatibilities_staff_insert" on public.system_filter_compatibilities
for insert to authenticated
with check ((select private.has_role('admin')) or (select private.has_role('manager')));
create policy "compatibilities_staff_update" on public.system_filter_compatibilities
for update to authenticated
using ((select private.has_role('admin')) or (select private.has_role('manager')))
with check ((select private.has_role('admin')) or (select private.has_role('manager')));
create policy "compatibilities_staff_delete" on public.system_filter_compatibilities
for delete to authenticated
using ((select private.has_role('admin')) or (select private.has_role('manager')));

create policy "bundle_items_staff_insert" on public.product_bundle_items
for insert to authenticated
with check ((select private.has_role('admin')) or (select private.has_role('manager')));
create policy "bundle_items_staff_update" on public.product_bundle_items
for update to authenticated
using ((select private.has_role('admin')) or (select private.has_role('manager')))
with check ((select private.has_role('admin')) or (select private.has_role('manager')));
create policy "bundle_items_staff_delete" on public.product_bundle_items
for delete to authenticated
using ((select private.has_role('admin')) or (select private.has_role('manager')));
