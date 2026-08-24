-- Preserve provisional pricing and model-specific bundle fit as first-class server data.
alter table public.products
  add column price_is_placeholder boolean not null default false;

update public.products
set price_is_placeholder = true
where sku like 'CRY-%' or sku in ('PPF-02', 'T33', 'MFC', 'LED-UVC');

update public.products
set
  description = 'The core membrane replacement for the purchased 600 GPD systems. The exact supplier connector variant is verified against the installed cartridge before fulfillment.',
  specs = '["Crystalina RO-600 fit family","600 GPD manufacturer-rated flux","0.0001-micron manufacturer-rated filtration","Connector fit confirmed against the installed H5-600, F5-600, or X2A-600 cartridge","Typical replacement interval: 24 to 60 months"]'::jsonb
where slug = 'crystalina-600-gpd-ro-membrane';

update public.products
set description = case slug
  when 'h5-600-complete-filter-set' then 'One-box routine service set for the Crystalina H5-600 UV alkaline configuration. The membrane connector variant is verified against the installed cartridge before fulfillment. The long-life LED-UVC module is sold separately only when service replacement is needed.'
  when 'f5-600-uv-complete-filter-set' then 'Complete routine cartridge set for the Crystalina F5-600 UV alkaline configuration. The membrane connector variant is verified against the installed cartridge before fulfillment. The long-life LED-UVC module remains available separately as a service part.'
  when 'x2a-600-complete-filter-set' then 'A model-specific set containing the X2A FSA prefilter, 600 GPD RO membrane, and ACM finishing cartridge. The membrane connector variant is verified against the installed cartridge before fulfillment. Its long-life LED-UVC module is not a routine cartridge and is sold separately for service replacement.'
  when 'w5-400-alkaline-complete-filter-set' then 'Complete routine cartridge set for the Crystalina W5-400 non-electric alkaline configuration, with sediment, dual carbon, RO, polishing, and alkaline finishing stages. The membrane connector variant is verified against the installed cartridge before fulfillment.'
end
where slug in (
  'h5-600-complete-filter-set',
  'f5-600-uv-complete-filter-set',
  'x2a-600-complete-filter-set',
  'w5-400-alkaline-complete-filter-set'
);

create table public.system_filter_bundles (
  system_product_id uuid not null references public.products(id) on delete cascade,
  bundle_product_id uuid not null references public.products(id) on delete cascade,
  primary key (system_product_id, bundle_product_id),
  check (system_product_id <> bundle_product_id)
);

create unique index system_filter_bundles_bundle_idx
  on public.system_filter_bundles (bundle_product_id);

alter table public.system_filter_bundles enable row level security;
revoke all on public.system_filter_bundles from anon, authenticated;
grant select on public.system_filter_bundles to anon, authenticated;
grant insert, update, delete on public.system_filter_bundles to authenticated;

create policy "system_bundles_public_read_published" on public.system_filter_bundles
for select to anon, authenticated
using (
  exists (
    select 1 from public.products system_product
    where system_product.id = system_product_id and system_product.published
  )
  and exists (
    select 1 from public.products bundle_product
    where bundle_product.id = bundle_product_id and bundle_product.published
  )
);

create policy "system_bundles_staff_insert" on public.system_filter_bundles
for insert to authenticated
with check ((select private.has_role('admin')) or (select private.has_role('manager')));
create policy "system_bundles_staff_update" on public.system_filter_bundles
for update to authenticated
using ((select private.has_role('admin')) or (select private.has_role('manager')))
with check ((select private.has_role('admin')) or (select private.has_role('manager')));
create policy "system_bundles_staff_delete" on public.system_filter_bundles
for delete to authenticated
using ((select private.has_role('admin')) or (select private.has_role('manager')));

with system_bundle_rows (system_slug, bundle_slug) as (
  values
    ('h5-600-uv-alkaline', 'h5-600-complete-filter-set'),
    ('f5-600-uv-alkaline', 'f5-600-uv-complete-filter-set'),
    ('x2a-600-smart-tankless', 'x2a-600-complete-filter-set'),
    ('w5-400-alkaline', 'w5-400-alkaline-complete-filter-set')
)
insert into public.system_filter_bundles (system_product_id, bundle_product_id)
select system_product.id, bundle_product.id
from system_bundle_rows row
join public.products system_product on system_product.slug = row.system_slug
join public.products bundle_product on bundle_product.slug = row.bundle_slug
on conflict (system_product_id, bundle_product_id) do nothing;
