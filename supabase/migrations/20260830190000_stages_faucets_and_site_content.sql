-- Crystalina: configurable stage counts, faucet upgrades, merchandising order,
-- and editable site content.
--
-- Pricing stays server-authoritative. A shopper chooses a stage option and an
-- optional faucet upgrade; create_order looks both up in the database and
-- recomputes the line price, so nothing sent by the browser sets a price.

-- 'faucet' is added here but deliberately not referenced by data in this same
-- migration, which Postgres requires for a newly added enum value.
alter type public.product_kind add value if not exists 'faucet';

-- ------------------------------------------------------------ merchandising
alter table public.products
  add column if not exists display_order integer not null default 100,
  add column if not exists available_as_upgrade boolean not null default false,
  add column if not exists default_faucet_id uuid references public.products(id) on delete set null;

comment on column public.products.display_order is
  'Lower sorts first within a category. Editable from the admin content editor.';
comment on column public.products.available_as_upgrade is
  'True for faucets that shoppers may pick as a paid upgrade on a system.';
comment on column public.products.default_faucet_id is
  'Faucet included with this system at no extra cost.';

create index if not exists products_display_order_idx on public.products (display_order, name);

-- --------------------------------------------------------- stage options
-- Each row is one buyable configuration of a system, for example a 7-stage
-- build. price_cents is the full price of the system in that configuration.
create table if not exists public.product_stage_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  stage_count smallint not null check (stage_count between 1 and 20),
  price_cents integer not null check (price_cents >= 0),
  label text,
  description text,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, stage_count)
);

create index if not exists stage_options_product_idx
  on public.product_stage_options (product_id, sort_order, stage_count);

-- At most one default configuration per product.
create unique index if not exists stage_options_one_default_idx
  on public.product_stage_options (product_id) where is_default;

alter table public.product_stage_options enable row level security;

create policy "stage_options_public_read" on public.product_stage_options
  for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.published
  ));

create policy "stage_options_staff_manage" on public.product_stage_options
  for all to authenticated
  using (exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role in ('admin', 'manager')
  ))
  with check (exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role in ('admin', 'manager')
  ));

-- ------------------------------------------------------------ site content
-- Key/value blocks backing the admin content editor. Public read so the
-- storefront renders what staff publish; only staff may write.
create table if not exists public.site_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

alter table public.site_content enable row level security;

create policy "site_content_public_read" on public.site_content
  for select to anon, authenticated using (true);

create policy "site_content_staff_write" on public.site_content
  for all to authenticated
  using (exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role in ('admin', 'manager')
  ))
  with check (exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role in ('admin', 'manager')
  ));

-- ---------------------------------------------------- order line configuration
alter table public.order_items
  add column if not exists stage_option_id uuid references public.product_stage_options(id) on delete set null,
  add column if not exists stage_count smallint,
  add column if not exists faucet_id uuid references public.products(id) on delete set null,
  add column if not exists faucet_name_snapshot text,
  add column if not exists faucet_price_cents integer not null default 0
    check (faucet_price_cents >= 0);
