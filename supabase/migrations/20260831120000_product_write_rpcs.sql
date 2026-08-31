-- Crystalina: staff-gated catalog writes.
--
-- Until now the admin product editor wrote to localStorage only, and the next
-- catalog hydration overwrote it. Every price, stock and copy change a manager
-- made was silently discarded and no customer ever saw it. These functions give
-- the editor a real, permission-checked write path.
--
-- The editor captures far more than the core commerce columns (flow rate,
-- micron rating, warranty terms, gallery images and so on). Rather than adding
-- twenty-odd columns, everything outside the core lives in products.details.

alter table public.products
  add column if not exists details jsonb not null default '{}'::jsonb;

comment on column public.products.details is
  'Editor-managed attributes with no dedicated column: specifications, media gallery, warranty and service metadata.';

-- ---------------------------------------------------------------- upsert
create or replace function public.upsert_product(p_product jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_id uuid;
  v_slug text;
  v_price integer;
  v_compare integer;
begin
  if not (private.has_role('admin') or private.has_role('manager')) then
    raise exception 'not authorised to manage the catalog' using errcode = '42501';
  end if;

  if coalesce(trim(p_product->>'name'), '') = '' then
    raise exception 'a product name is required' using errcode = '22023';
  end if;

  v_price := round(coalesce((p_product->>'price')::numeric, 0) * 100);
  if v_price < 0 then
    raise exception 'price cannot be negative' using errcode = '22023';
  end if;

  v_compare := case
    when coalesce(p_product->>'comparePrice', '') = '' then null
    else round((p_product->>'comparePrice')::numeric * 100)
  end;
  if v_compare is not null and v_compare < v_price then
    raise exception 'compare-at price must be above the sale price' using errcode = '22023';
  end if;

  v_id := nullif(p_product->>'id', '')::uuid;
  v_slug := nullif(trim(p_product->>'slug'), '');
  if v_slug is null then
    v_slug := regexp_replace(lower(trim(p_product->>'name')), '[^a-z0-9]+', '-', 'g');
    v_slug := trim(both '-' from v_slug);
  end if;

  insert into public.products as prod (
    id, slug, name, category, price_cents, compare_price_cents, stock_quantity,
    published, image_path, short_description, description, specs, badge,
    installation_minutes, sku, model_code, product_kind, display_order,
    available_as_upgrade, default_faucet_id, details, updated_at
  ) values (
    coalesce(v_id, gen_random_uuid()),
    v_slug,
    trim(p_product->>'name'),
    coalesce(nullif(trim(p_product->>'category'), ''), 'Accessories'),
    v_price,
    v_compare,
    greatest(coalesce((p_product->>'stock')::int, 0), 0),
    coalesce((p_product->>'published')::boolean, true),
    nullif(p_product->>'image', ''),
    coalesce(p_product->>'short', ''),
    coalesce(p_product->>'description', ''),
    coalesce(p_product->'specs', '[]'::jsonb),
    nullif(p_product->>'badge', ''),
    greatest(coalesce((p_product->>'installationMinutes')::int, 30), 0),
    nullif(p_product->>'sku', ''),
    nullif(p_product->>'modelCode', ''),
    coalesce(nullif(p_product->>'productKind', ''), 'system')::public.product_kind,
    coalesce((p_product->>'displayOrder')::int, 100),
    coalesce((p_product->>'availableAsUpgrade')::boolean, false),
    nullif(p_product->>'defaultFaucetId', '')::uuid,
    coalesce(p_product->'details', '{}'::jsonb),
    now()
  )
  on conflict (id) do update set
    slug = excluded.slug, name = excluded.name, category = excluded.category,
    price_cents = excluded.price_cents, compare_price_cents = excluded.compare_price_cents,
    stock_quantity = excluded.stock_quantity, published = excluded.published,
    image_path = excluded.image_path, short_description = excluded.short_description,
    description = excluded.description, specs = excluded.specs, badge = excluded.badge,
    installation_minutes = excluded.installation_minutes, sku = excluded.sku,
    model_code = excluded.model_code, product_kind = excluded.product_kind,
    display_order = excluded.display_order,
    available_as_upgrade = excluded.available_as_upgrade,
    default_faucet_id = excluded.default_faucet_id,
    details = excluded.details, updated_at = now()
  returning prod.id into v_id;

  return v_id;
end;
$fn$;

revoke all on function public.upsert_product(jsonb) from public, anon;
grant execute on function public.upsert_product(jsonb) to authenticated;

-- ---------------------------------------------------------------- delete
-- Refuses when the product appears on an order, so order history stays intact.
create or replace function public.delete_product(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not (private.has_role('admin') or private.has_role('manager')) then
    raise exception 'not authorised to manage the catalog' using errcode = '42501';
  end if;

  if exists (select 1 from public.order_items where product_id = p_id) then
    raise exception 'this product appears on an order; unpublish it instead of deleting'
      using errcode = '23503';
  end if;

  delete from public.products where id = p_id;
end;
$fn$;

revoke all on function public.delete_product(uuid) from public, anon;
grant execute on function public.delete_product(uuid) to authenticated;

-- ------------------------------------------------- stage option management
create or replace function public.upsert_stage_option(p_option jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare v_id uuid;
begin
  if not (private.has_role('admin') or private.has_role('manager')) then
    raise exception 'not authorised to manage the catalog' using errcode = '42501';
  end if;

  insert into public.product_stage_options as opt (
    id, product_id, stage_count, price_cents, label, description, is_default, sort_order
  ) values (
    coalesce(nullif(p_option->>'id', '')::uuid, gen_random_uuid()),
    (p_option->>'productId')::uuid,
    (p_option->>'stageCount')::smallint,
    round(coalesce((p_option->>'price')::numeric, 0) * 100),
    nullif(p_option->>'label', ''),
    nullif(p_option->>'description', ''),
    coalesce((p_option->>'isDefault')::boolean, false),
    coalesce((p_option->>'sortOrder')::int, 0)
  )
  on conflict (product_id, stage_count) do update set
    price_cents = excluded.price_cents, label = excluded.label,
    description = excluded.description, is_default = excluded.is_default,
    sort_order = excluded.sort_order
  returning opt.id into v_id;

  if coalesce((p_option->>'isDefault')::boolean, false) then
    update public.product_stage_options
    set is_default = false
    where product_id = (p_option->>'productId')::uuid and id <> v_id;
  end if;

  return v_id;
end;
$fn$;

revoke all on function public.upsert_stage_option(jsonb) from public, anon;
grant execute on function public.upsert_stage_option(jsonb) to authenticated;

create or replace function public.delete_stage_option(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not (private.has_role('admin') or private.has_role('manager')) then
    raise exception 'not authorised to manage the catalog' using errcode = '42501';
  end if;
  delete from public.product_stage_options where id = p_id;
end;
$fn$;

revoke all on function public.delete_stage_option(uuid) from public, anon;
grant execute on function public.delete_stage_option(uuid) to authenticated;
