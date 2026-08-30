-- Crystalina: order creation that understands stage options and faucet upgrades.
--
-- Replaces the earlier create_order. The browser may send a stage option id and
-- a faucet id per line, but never a price: the unit price is recomputed here as
--   (stage option price, or the base product price when no option is chosen)
--   + (faucet price, when an upgrade faucet other than the included one is picked)
-- Stock is still validated and decremented inside the same transaction.

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
  v_option public.product_stage_options%rowtype;
  v_faucet public.products%rowtype;
  v_qty integer;
  v_unit integer;
  v_faucet_price integer;
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

  insert into public.orders (
    user_id, status, payment_status, subtotal_cents, shipping_cents,
    tax_cents, total_cents, shipping_address, installation_requested
  ) values (
    v_user_id, 'pending_payment', 'pending', 0, 0, 0, 0,
    p_shipping_address, coalesce(p_installation_requested, false)
  )
  returning orders.id, orders.order_number into v_order_id, v_order_number;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := coalesce((v_item->>'quantity')::int, 0);
    if v_qty < 1 or v_qty > 99 then
      raise exception 'invalid quantity' using errcode = '22023';
    end if;

    select * into v_product from public.products
    where id = (v_item->>'productId')::uuid for update;
    if not found or not v_product.published then
      raise exception 'product is unavailable' using errcode = '22023';
    end if;
    if v_product.stock_quantity < v_qty then
      raise exception 'insufficient stock for %', v_product.name using errcode = '22023';
    end if;

    -- Stage configuration. Must belong to this product.
    v_option := null;
    if (v_item ? 'stageOptionId') and (v_item->>'stageOptionId') is not null then
      select * into v_option from public.product_stage_options
      where id = (v_item->>'stageOptionId')::uuid and product_id = v_product.id;
      if not found then
        raise exception 'that configuration is unavailable for %', v_product.name using errcode = '22023';
      end if;
    end if;
    v_unit := coalesce(v_option.price_cents, v_product.price_cents);

    -- Faucet upgrade. The included faucet adds nothing; any other faucet must
    -- be published and explicitly offered as an upgrade.
    v_faucet := null;
    v_faucet_price := 0;
    if (v_item ? 'faucetId') and (v_item->>'faucetId') is not null then
      select * into v_faucet from public.products
      where id = (v_item->>'faucetId')::uuid;
      if not found or not v_faucet.published or v_faucet.product_kind <> 'faucet' then
        raise exception 'that faucet is unavailable' using errcode = '22023';
      end if;
      if v_product.default_faucet_id is distinct from v_faucet.id then
        if not v_faucet.available_as_upgrade then
          raise exception 'that faucet is not offered as an upgrade' using errcode = '22023';
        end if;
        v_faucet_price := v_faucet.price_cents;
      end if;
    end if;

    v_unit := v_unit + v_faucet_price;
    v_subtotal := v_subtotal + (v_unit * v_qty);

    insert into public.order_items (
      order_id, product_id, product_name_snapshot, unit_price_cents, quantity,
      stage_option_id, stage_count, faucet_id, faucet_name_snapshot, faucet_price_cents
    ) values (
      v_order_id, v_product.id, v_product.name, v_unit, v_qty,
      v_option.id, v_option.stage_count, v_faucet.id, v_faucet.name, v_faucet_price
    );

    update public.products
    set stock_quantity = stock_quantity - v_qty, updated_at = now()
    where products.id = v_product.id;
  end loop;

  -- Free delivery at or above $99, otherwise a flat $9.99. NYC rate 8.875%.
  v_shipping := case when v_subtotal >= 9900 then 0 else 999 end;
  v_tax := round(v_subtotal * 0.08875);
  v_total := v_subtotal + v_shipping + v_tax;

  update public.orders
  set subtotal_cents = v_subtotal, shipping_cents = v_shipping,
      tax_cents = v_tax, total_cents = v_total, updated_at = now()
  where orders.id = v_order_id;

  return query select v_order_id, v_order_number, v_total;
end;
$$;

revoke all on function public.create_order(jsonb, jsonb, boolean) from public, anon;
grant execute on function public.create_order(jsonb, jsonb, boolean) to authenticated;
