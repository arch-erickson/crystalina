-- Crystalina: transactional order creation plus inbound form storage.
--
-- Order totals are never trusted from the browser. create_order recomputes
-- every line from the products table, enforces stock inside one transaction,
-- and decrements inventory atomically so two shoppers cannot oversell a unit.

-- ---------------------------------------------------------------- orders RPC
create or replace function public.create_order(
  p_items jsonb,
  p_shipping_address jsonb,
  p_installation_requested boolean default false
)
returns table (id uuid, order_number bigint, total_cents integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_subtotal integer := 0;
  v_shipping integer;
  v_tax integer;
  v_total integer;
  v_order_id uuid;
  v_order_number bigint;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'no items supplied' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'too many line items' using errcode = '22023';
  end if;

  -- Lock each product row, validate availability, and accumulate the subtotal
  -- from database pricing only.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(coalesce((v_item->>'quantity')::int, 0), 0);
    if v_qty = 0 then
      raise exception 'quantity must be greater than zero' using errcode = '22023';
    end if;
    if v_qty > 99 then
      raise exception 'quantity above the per-item limit' using errcode = '22023';
    end if;

    select * into v_product
    from public.products
    where id = (v_item->>'productId')::uuid
    for update;

    if not found or not v_product.published then
      raise exception 'product is unavailable' using errcode = '22023';
    end if;
    if v_product.stock_quantity < v_qty then
      raise exception 'insufficient stock for %', v_product.name using errcode = '22023';
    end if;

    v_subtotal := v_subtotal + (v_product.price_cents * v_qty);
  end loop;

  -- Free delivery at or above $99, otherwise a flat $9.99. NYC rate 8.875%.
  v_shipping := case when v_subtotal >= 9900 then 0 else 999 end;
  v_tax := round(v_subtotal * 0.08875);
  v_total := v_subtotal + v_shipping + v_tax;

  insert into public.orders (
    user_id, status, payment_status, subtotal_cents, shipping_cents,
    tax_cents, total_cents, shipping_address, installation_requested
  ) values (
    v_user_id, 'pending_payment', 'pending', v_subtotal, v_shipping,
    v_tax, v_total, p_shipping_address, coalesce(p_installation_requested, false)
  )
  returning orders.id, orders.order_number into v_order_id, v_order_number;

  -- Snapshot each line and decrement stock in the same transaction.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;

    select * into v_product from public.products
    where id = (v_item->>'productId')::uuid;

    insert into public.order_items (order_id, product_id, product_name_snapshot, unit_price_cents, quantity)
    values (v_order_id, v_product.id, v_product.name, v_product.price_cents, v_qty);

    update public.products
    set stock_quantity = stock_quantity - v_qty, updated_at = now()
    where products.id = v_product.id;
  end loop;

  return query select v_order_id, v_order_number, v_total;
end;
$$;

revoke all on function public.create_order(jsonb, jsonb, boolean) from public, anon;
grant execute on function public.create_order(jsonb, jsonb, boolean) to authenticated;

-- ------------------------------------------------------- inbound form storage
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 200),
  phone text check (phone is null or char_length(phone) <= 40),
  topic text not null default 'General' check (char_length(topic) <= 80),
  message text not null check (char_length(message) between 1 and 4000),
  source_ip_hash text,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) between 3 and 200),
  confirmed boolean not null default false,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- No anon or authenticated policies: these tables are written only by the
-- server boundary using the service-role key. Staff read through that boundary.
create policy "contact_messages_staff_read" on public.contact_messages
  for select to authenticated
  using (exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role in ('admin', 'manager', 'sales')
  ));

create policy "newsletter_staff_read" on public.newsletter_subscribers
  for select to authenticated
  using (exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role in ('admin', 'manager', 'sales')
  ));
