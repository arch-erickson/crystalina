-- Published catalog reads have one path; staff privileges apply only to writes.
drop policy "products_staff_manage" on public.products;

create policy "products_staff_insert" on public.products
for insert to authenticated
with check ((select private.has_role('admin')) or (select private.has_role('manager')));
create policy "products_staff_update" on public.products
for update to authenticated
using ((select private.has_role('admin')) or (select private.has_role('manager')))
with check ((select private.has_role('admin')) or (select private.has_role('manager')));
create policy "products_staff_delete" on public.products
for delete to authenticated
using ((select private.has_role('admin')) or (select private.has_role('manager')));
