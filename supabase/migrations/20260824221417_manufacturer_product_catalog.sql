-- Manufacturer-backed Crystalina systems, service parts, and model-specific filter sets.
create type public.product_kind as enum ('system', 'replacement_filter', 'filter_bundle');

alter table public.products
  add column sku text,
  add column model_code text,
  add column product_kind public.product_kind not null default 'system';

create unique index products_sku_idx on public.products (sku) where sku is not null;
create index published_products_kind_name_idx on public.products (product_kind, name) where published;

create table public.system_filter_compatibilities (
  system_product_id uuid not null references public.products(id) on delete cascade,
  replacement_product_id uuid not null references public.products(id) on delete restrict,
  stage_code text not null check (length(trim(stage_code)) > 0),
  quantity integer not null default 1 check (quantity > 0),
  replacement_interval_days integer not null check (replacement_interval_days > 0),
  primary key (system_product_id, replacement_product_id, stage_code),
  check (system_product_id <> replacement_product_id)
);

create table public.product_bundle_items (
  bundle_product_id uuid not null references public.products(id) on delete cascade,
  component_product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  primary key (bundle_product_id, component_product_id),
  check (bundle_product_id <> component_product_id)
);

create index system_filter_compatibilities_replacement_idx
  on public.system_filter_compatibilities (replacement_product_id);
create index product_bundle_items_component_idx
  on public.product_bundle_items (component_product_id);

alter table public.system_filter_compatibilities enable row level security;
alter table public.product_bundle_items enable row level security;

revoke all on public.system_filter_compatibilities, public.product_bundle_items from anon, authenticated;
grant select on public.system_filter_compatibilities, public.product_bundle_items to anon, authenticated;
grant insert, update, delete on public.products, public.system_filter_compatibilities, public.product_bundle_items to authenticated;
revoke insert, update, delete on public.products from anon;

create policy "compatibilities_public_read_published" on public.system_filter_compatibilities
for select to anon, authenticated
using (
  exists (
    select 1 from public.products system_product
    where system_product.id = system_product_id and system_product.published
  )
  and exists (
    select 1 from public.products replacement_product
    where replacement_product.id = replacement_product_id and replacement_product.published
  )
);

create policy "compatibilities_staff_manage" on public.system_filter_compatibilities
for all to authenticated
using ((select private.has_role('admin')) or (select private.has_role('manager')))
with check ((select private.has_role('admin')) or (select private.has_role('manager')));

create policy "bundle_items_public_read_published" on public.product_bundle_items
for select to anon, authenticated
using (
  exists (
    select 1 from public.products bundle_product
    where bundle_product.id = bundle_product_id and bundle_product.published
  )
  and exists (
    select 1 from public.products component_product
    where component_product.id = component_product_id and component_product.published
  )
);

create policy "bundle_items_staff_manage" on public.product_bundle_items
for all to authenticated
using ((select private.has_role('admin')) or (select private.has_role('manager')))
with check ((select private.has_role('admin')) or (select private.has_role('manager')));

insert into public.products (
  id, slug, sku, model_code, product_kind, name, category, price_cents,
  compare_price_cents, stock_quantity, published, image_path, short_description,
  description, specs, badge, installation_minutes
)
values
  (
    'c1000000-0000-4000-8000-000000000001', 'h5-600-uv-alkaline', 'CRY-H5-600-UV', 'H5-600-UV', 'system',
    'Crystalina H5-600 High-Flow UV Alkaline RO', 'Reverse Osmosis', 149900, null, 1, true,
    '/images/products/h5-600-uv.webp',
    'Black-frame 600 GPD reverse osmosis system with alkaline finishing and LED-UVC treatment.',
    'A customized high-flow system for larger households and higher daily demand. This Crystalina configuration pairs three serviceable prefilter housings with a 600 GPD RO membrane, alkaline finishing media, real-time monitoring, and a long-life LED-UVC treatment module.',
    '["Manufacturer-rated 600 GPD purified-water capacity","1-micron sediment and activated-carbon prefiltration","600 GPD reverse osmosis membrane","Weak-alkaline finishing cartridge","LED-UVC treatment module","Two pressure gauges and digital monitoring panel"]'::jsonb,
    'New Arrival', 120
  ),
  (
    'c1000000-0000-4000-8000-000000000002', 'f5-600-uv-alkaline', 'CRY-F5-600-UV', 'F5-600-UV', 'system',
    'Crystalina F5-600 UV Alkaline RO', 'Reverse Osmosis', 129900, null, 1, true,
    '/images/products/f5-600-uv.webp',
    'Open-frame 600 GPD RO system with alkaline finishing, polishing carbon, and LED-UVC treatment.',
    'A fully equipped F5-600 configuration with three front-access prefilters, a high-output membrane, taste-polishing carbon, alkaline finishing media, and a mercury-free LED-UVC module. The open layout keeps routine cartridge changes accessible.',
    '["Manufacturer-rated 600 GPD purified-water capacity","Three front-access prefilter housings","600 GPD reverse osmosis membrane","T33 taste-polishing carbon cartridge","Weak-alkaline finishing cartridge","LED-UVC treatment module"]'::jsonb,
    'New Arrival', 120
  ),
  (
    'c1000000-0000-4000-8000-000000000003', 'x2a-600-smart-tankless', 'CRY-X2A-600', 'X2A-600', 'system',
    'Crystalina X2A Smart Tankless RO', 'Reverse Osmosis', 139900, null, 1, true,
    '/images/products/x2a-600.webp',
    'Enclosed tankless 600 GPD system with real-time TDS monitoring and three-cartridge service.',
    'The compact X2A places its FSA prefilter, 600 GPD RO membrane, and ACM finishing cartridge inside a clean enclosed cabinet. A front display provides real-time TDS monitoring, while the three physical replacement cartridges simplify scheduled service.',
    '["Manufacturer-rated 600 GPD configuration","0.0001-micron manufacturer-rated RO filtration","Real-time TDS monitoring display","FSA 3-in-1 prefilter cartridge","ACM 2-in-1 finishing cartridge","Compact 478 x 161 x 410 mm cabinet"]'::jsonb,
    'Smart System', 90
  ),
  (
    'c1000000-0000-4000-8000-000000000004', 'w5-400-alkaline', 'CRY-W5-400-ALK', 'W5-400-ALK', 'system',
    'Crystalina W5-400 Non-Electric Alkaline RO', 'Reverse Osmosis', 104900, null, 1, true,
    '/images/products/w5-400-alkaline.webp',
    'Non-electric 400 GPD RO rack with polishing carbon and weak-alkaline finishing media.',
    'This customized W5-400 configuration operates without a booster pump or powered controls. It combines three transparent front housings with a 400 GPD membrane, a T33 polishing cartridge, and weak-alkaline finishing media.',
    '["Manufacturer-rated 400 GPD nominal capacity","Non-electric operation","Three transparent front filter housings","400 GPD reverse osmosis membrane","T33 taste-polishing carbon cartridge","Weak-alkaline finishing cartridge"]'::jsonb,
    'No Electricity', 90
  ),
  (
    'c2000000-0000-4000-8000-000000000001', 'ppf-02-sediment-cartridge', 'PPF-02', 'PPF-02', 'replacement_filter',
    'PPF-02 1-Micron Sediment Cartridge', 'Replacement Filters', 1900, null, 0, true,
    '/images/products/filter-ppf-02.webp',
    '1-micron polypropylene sediment cartridge for visible particles, rust, and suspended solids.',
    'A grooved 252 x 63 mm polypropylene prefilter used as the first service stage in Crystalina open-frame systems. The photographed Crystalina cartridges specify replacement within six months, depending on water conditions and usage.',
    '["Model PPF-02","1-micron filtration","Grooved polypropylene construction","Fits purchased H5-600, F5-600, and W5-400 configurations","Typical replacement interval: up to 6 months"]'::jsonb,
    null, 15
  ),
  (
    'c2000000-0000-4000-8000-000000000002', 'acm-10-sintered-carbon-cartridge', 'CRY-ACM-10', 'ACM-10', 'replacement_filter',
    'ACM Sintered Carbon Cartridge', 'Replacement Filters', 3900, null, 0, true,
    '/images/products/filter-acm-10.webp',
    '1-micron coconut-shell sintered activated-carbon cartridge for open-frame systems.',
    'A high-iodine-value sintered activated-carbon cartridge used in the second and third front housings of the purchased H5-600 and F5-600 configurations.',
    '["Crystalina ACM-10 fit reference","1-micron manufacturer-rated filtration","Sintered activated carbon","Two cartridges required per complete H5/F5/W5 service set","Typical replacement interval: up to 12 months"]'::jsonb,
    null, 15
  ),
  (
    'c2000000-0000-4000-8000-000000000003', 'x2a-fsa-3-in-1-prefilter', 'CRY-X2A-FSA', 'FSA-X2A', 'replacement_filter',
    'X2A FSA 3-in-1 Prefilter', 'Replacement Filters', 4900, null, 0, true,
    '/images/products/filter-x2a-fsa.webp',
    'Plug-in sediment, carbon, and anti-scale prefilter for the Crystalina X2A.',
    'The X2A first cartridge combines pleated polypropylene, sintered activated carbon, and anti-scale media in one plug-in service part.',
    '["Crystalina X2A fit reference","3-in-1 composite cartridge","1-micron manufacturer-rated filtration","Connector variant verified before fulfillment","Typical replacement interval: up to 12 months"]'::jsonb,
    null, 10
  ),
  (
    'c2000000-0000-4000-8000-000000000004', 'crystalina-600-gpd-ro-membrane', 'CRY-RO-600', 'RO-600', 'replacement_filter',
    '600 GPD Reverse Osmosis Membrane', 'Replacement Filters', 11900, null, 0, true,
    '/images/products/filter-ro-600.webp',
    'High-flux 600 GPD membrane for Crystalina H5, F5, and X2A configurations.',
    'The core membrane replacement for the purchased 600 GPD systems. Service life depends on incoming water quality, prefilter maintenance, and household demand.',
    '["Crystalina RO-600 fit reference","600 GPD manufacturer-rated flux","0.0001-micron manufacturer-rated filtration","Fits purchased H5-600, F5-600, and X2A-600 systems","Typical replacement interval: 24 to 60 months"]'::jsonb,
    null, 20
  ),
  (
    'c2000000-0000-4000-8000-000000000005', 't33-polishing-carbon-cartridge', 'T33', 'T33', 'replacement_filter',
    'T33 Polishing Carbon Cartridge', 'Replacement Filters', 3900, null, 0, true,
    '/images/products/filter-t33.webp',
    'Post-RO sintered activated-carbon cartridge for final taste and odor polishing.',
    'A compact post-treatment cartridge used after the RO membrane in the purchased F5-600 and W5-400 configurations.',
    '["Model T33","1-micron manufacturer-rated filtration","Sintered activated carbon","Fits purchased F5-600 and W5-400 configurations","Typical replacement interval: up to 12 months"]'::jsonb,
    null, 10
  ),
  (
    'c2000000-0000-4000-8000-000000000006', 'mfc-ph-alkaline-cartridge', 'MFC', 'MFC', 'replacement_filter',
    'MFC + pH Alkaline Finishing Cartridge', 'Replacement Filters', 4900, null, 0, true,
    '/images/products/filter-mfc-ph.webp',
    'Sintered-carbon finishing cartridge with weak-alkaline mineral media.',
    'A post-RO finishing cartridge combining activated-carbon polishing with weak-alkaline media for the purchased H5-600, F5-600, and W5-400 alkaline configurations.',
    '["Model MFC","1-micron manufacturer-rated filtration","Sintered carbon plus weak-alkaline media","Manufacturer-stated pH range: 7.5 to 9","Typical replacement interval: up to 12 months"]'::jsonb,
    null, 10
  ),
  (
    'c2000000-0000-4000-8000-000000000007', 'x2a-acm-finishing-cartridge', 'CRY-X2A-ACM', 'ACM-X2A', 'replacement_filter',
    'X2A ACM Finishing Cartridge', 'Replacement Filters', 4900, null, 0, true,
    '/images/products/filter-x2a-acm.webp',
    'Plug-in coconut-shell sintered-carbon finishing cartridge for the Crystalina X2A.',
    'The X2A final cartridge uses a framed, plug-in sintered-carbon design for final-stage treatment after the RO membrane.',
    '["Crystalina X2A fit reference","1-micron manufacturer-rated filtration","Sintered activated carbon","Connector variant verified before fulfillment","Typical replacement interval: up to 12 months"]'::jsonb,
    null, 10
  ),
  (
    'c2000000-0000-4000-8000-000000000008', 'led-uvc-sterilization-module', 'LED-UVC', 'LED-UVC', 'replacement_filter',
    'LED-UVC Sterilization Module', 'Replacement Filters', 12900, null, 0, true,
    '/images/products/filter-led-uvc.webp',
    'Mercury-free flow-activated LED-UVC service module for compatible Crystalina systems.',
    'A long-life treatment module for compatible H5, F5 UV, and X2A configurations. It is listed individually as a service part and is not included in annual cartridge bundles.',
    '["Model LED-UVC","Mercury-free LED module","Manufacturer-rated 10,000-hour LED lifespan","Flow-activated start","Professional service recommended"]'::jsonb,
    'Service Part', 30
  ),
  (
    'c2000000-0000-4000-8000-000000000009', 'crystalina-400-gpd-ro-membrane', 'CRY-RO-400', 'RO-400', 'replacement_filter',
    '400 GPD Reverse Osmosis Membrane', 'Replacement Filters', 9900, null, 0, true,
    '/images/products/filter-ro-400.webp',
    'High-flux 400 GPD membrane fitted to the purchased Crystalina W5-400 configuration.',
    'The core membrane replacement for the non-electric W5-400. The supplier connector suffix is verified against the installed cartridge before fulfillment.',
    '["Crystalina RO-400 fit reference","400 GPD manufacturer-rated flux","0.0001-micron manufacturer-rated filtration","Fits purchased W5-400 system","Typical replacement interval: 24 to 36 months"]'::jsonb,
    null, 20
  ),
  (
    'c3000000-0000-4000-8000-000000000001', 'h5-600-complete-filter-set', 'CRY-H5-600-SET', 'H5-600-SET', 'filter_bundle',
    'H5-600 Complete Replacement Filter Set', 'Replacement Filters', 23900, 26500, 0, true,
    '/images/products/bundle-h5-600.webp',
    'Five physical replacement cartridges matched to the purchased H5-600 UV alkaline system.',
    'One-box routine service set for the Crystalina H5-600 UV alkaline configuration. The long-life LED-UVC module is sold separately only when service replacement is needed.',
    '["1 PPF-02 sediment cartridge","2 ACM sintered-carbon cartridges","1 600 GPD RO membrane","1 MFC + pH alkaline cartridge"]'::jsonb,
    'Complete Set', 45
  ),
  (
    'c3000000-0000-4000-8000-000000000002', 'f5-600-uv-complete-filter-set', 'CRY-F5-600-UV-SET', 'F5-600-UV-SET', 'filter_bundle',
    'F5-600 UV Complete Replacement Filter Set', 'Replacement Filters', 26900, 30400, 0, true,
    '/images/products/bundle-f5-600-uv.webp',
    'Six physical replacement cartridges matched to the purchased F5-600 UV alkaline system.',
    'Complete routine cartridge set for the Crystalina F5-600 UV alkaline configuration. The long-life LED-UVC module remains available separately as a service part.',
    '["1 PPF-02 sediment cartridge","2 ACM sintered-carbon cartridges","1 600 GPD RO membrane","1 T33 polishing cartridge","1 MFC + pH alkaline cartridge"]'::jsonb,
    'Complete Set', 50
  ),
  (
    'c3000000-0000-4000-8000-000000000003', 'x2a-600-complete-filter-set', 'CRY-X2A-600-SET', 'X2A-600-SET', 'filter_bundle',
    'X2A Complete 3-Cartridge Replacement Set', 'Replacement Filters', 19500, 21700, 0, true,
    '/images/products/bundle-x2a-600.webp',
    'The three physical replacement cartridges used by the Crystalina X2A.',
    'A model-specific set containing the X2A FSA prefilter, 600 GPD RO membrane, and ACM finishing cartridge. Its long-life LED-UVC module is not a routine cartridge and is sold separately for service replacement.',
    '["1 X2A FSA 3-in-1 prefilter","1 600 GPD RO membrane","1 X2A ACM finishing cartridge"]'::jsonb,
    'Complete Set', 35
  ),
  (
    'c3000000-0000-4000-8000-000000000004', 'w5-400-alkaline-complete-filter-set', 'CRY-W5-400-ALK-SET', 'W5-400-ALK-SET', 'filter_bundle',
    'W5-400 Alkaline Complete Replacement Filter Set', 'Replacement Filters', 24900, 28400, 0, true,
    '/images/products/bundle-w5-400-alkaline.webp',
    'Six physical replacement cartridges matched to the purchased W5-400 alkaline system.',
    'Complete routine cartridge set for the Crystalina W5-400 non-electric alkaline configuration, with sediment, dual carbon, RO, polishing, and alkaline finishing stages.',
    '["1 PPF-02 sediment cartridge","2 ACM sintered-carbon cartridges","1 400 GPD RO membrane","1 T33 polishing cartridge","1 MFC + pH alkaline cartridge"]'::jsonb,
    'Complete Set', 50
  )
on conflict (slug) do update set
  sku = excluded.sku,
  model_code = excluded.model_code,
  product_kind = excluded.product_kind,
  name = excluded.name,
  category = excluded.category,
  price_cents = excluded.price_cents,
  compare_price_cents = excluded.compare_price_cents,
  stock_quantity = excluded.stock_quantity,
  published = excluded.published,
  image_path = excluded.image_path,
  short_description = excluded.short_description,
  description = excluded.description,
  specs = excluded.specs,
  badge = excluded.badge,
  installation_minutes = excluded.installation_minutes;

with compatibility_rows (system_slug, replacement_slug, stage_code, quantity, replacement_interval_days) as (
  values
    ('h5-600-uv-alkaline', 'ppf-02-sediment-cartridge', '1', 1, 90),
    ('h5-600-uv-alkaline', 'acm-10-sintered-carbon-cartridge', '2-3', 2, 365),
    ('h5-600-uv-alkaline', 'crystalina-600-gpd-ro-membrane', '4', 1, 730),
    ('h5-600-uv-alkaline', 'mfc-ph-alkaline-cartridge', '5', 1, 365),
    ('h5-600-uv-alkaline', 'led-uvc-sterilization-module', 'UV', 1, 4562),
    ('f5-600-uv-alkaline', 'ppf-02-sediment-cartridge', '1', 1, 90),
    ('f5-600-uv-alkaline', 'acm-10-sintered-carbon-cartridge', '2-3', 2, 365),
    ('f5-600-uv-alkaline', 'crystalina-600-gpd-ro-membrane', '4', 1, 730),
    ('f5-600-uv-alkaline', 't33-polishing-carbon-cartridge', '5', 1, 365),
    ('f5-600-uv-alkaline', 'mfc-ph-alkaline-cartridge', '6', 1, 365),
    ('f5-600-uv-alkaline', 'led-uvc-sterilization-module', 'UV', 1, 4562),
    ('x2a-600-smart-tankless', 'x2a-fsa-3-in-1-prefilter', '1-3', 1, 365),
    ('x2a-600-smart-tankless', 'crystalina-600-gpd-ro-membrane', '4', 1, 730),
    ('x2a-600-smart-tankless', 'x2a-acm-finishing-cartridge', '5-6', 1, 365),
    ('x2a-600-smart-tankless', 'led-uvc-sterilization-module', '7', 1, 4562),
    ('w5-400-alkaline', 'ppf-02-sediment-cartridge', '1', 1, 90),
    ('w5-400-alkaline', 'acm-10-sintered-carbon-cartridge', '2-3', 2, 365),
    ('w5-400-alkaline', 'crystalina-400-gpd-ro-membrane', '4', 1, 730),
    ('w5-400-alkaline', 't33-polishing-carbon-cartridge', '5', 1, 365),
    ('w5-400-alkaline', 'mfc-ph-alkaline-cartridge', '6', 1, 365)
)
insert into public.system_filter_compatibilities (
  system_product_id, replacement_product_id, stage_code, quantity, replacement_interval_days
)
select system_product.id, replacement_product.id, row.stage_code, row.quantity, row.replacement_interval_days
from compatibility_rows row
join public.products system_product on system_product.slug = row.system_slug
join public.products replacement_product on replacement_product.slug = row.replacement_slug
on conflict (system_product_id, replacement_product_id, stage_code) do update set
  quantity = excluded.quantity,
  replacement_interval_days = excluded.replacement_interval_days;

with bundle_rows (bundle_slug, component_slug, quantity) as (
  values
    ('h5-600-complete-filter-set', 'ppf-02-sediment-cartridge', 1),
    ('h5-600-complete-filter-set', 'acm-10-sintered-carbon-cartridge', 2),
    ('h5-600-complete-filter-set', 'crystalina-600-gpd-ro-membrane', 1),
    ('h5-600-complete-filter-set', 'mfc-ph-alkaline-cartridge', 1),
    ('f5-600-uv-complete-filter-set', 'ppf-02-sediment-cartridge', 1),
    ('f5-600-uv-complete-filter-set', 'acm-10-sintered-carbon-cartridge', 2),
    ('f5-600-uv-complete-filter-set', 'crystalina-600-gpd-ro-membrane', 1),
    ('f5-600-uv-complete-filter-set', 't33-polishing-carbon-cartridge', 1),
    ('f5-600-uv-complete-filter-set', 'mfc-ph-alkaline-cartridge', 1),
    ('x2a-600-complete-filter-set', 'x2a-fsa-3-in-1-prefilter', 1),
    ('x2a-600-complete-filter-set', 'crystalina-600-gpd-ro-membrane', 1),
    ('x2a-600-complete-filter-set', 'x2a-acm-finishing-cartridge', 1),
    ('w5-400-alkaline-complete-filter-set', 'ppf-02-sediment-cartridge', 1),
    ('w5-400-alkaline-complete-filter-set', 'acm-10-sintered-carbon-cartridge', 2),
    ('w5-400-alkaline-complete-filter-set', 'crystalina-400-gpd-ro-membrane', 1),
    ('w5-400-alkaline-complete-filter-set', 't33-polishing-carbon-cartridge', 1),
    ('w5-400-alkaline-complete-filter-set', 'mfc-ph-alkaline-cartridge', 1)
)
insert into public.product_bundle_items (bundle_product_id, component_product_id, quantity)
select bundle_product.id, component_product.id, row.quantity
from bundle_rows row
join public.products bundle_product on bundle_product.slug = row.bundle_slug
join public.products component_product on component_product.slug = row.component_slug
on conflict (bundle_product_id, component_product_id) do update set
  quantity = excluded.quantity;
