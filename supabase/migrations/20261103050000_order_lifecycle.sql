-- Crystalina: the life of an order after it is paid.
--
-- Until now the admin dashboard's status dropdown wrote to localStorage.
-- The manager marked an order shipped, the toast said so, and the database
-- never heard about it: the customer's own order page still said paid, and
-- the next person to open the dashboard on another machine saw the old
-- status. Nothing was lost because nothing was saved.
--
-- Three things are decided here, and they are the whole of it.
--
--   1. Which moves are legal is data, in order_transitions, not a case
--      tree inside a function. The lifecycle can be read by selecting
--      from a table, which is also how the dashboard builds its dropdown
--      rather than keeping its own list.
--   2. Every status change is recorded, by a trigger rather than by each
--      caller, so a change made by the webhook, by this function, or by
--      hand in the SQL editor all leave the same trail.
--   3. A refund is never typed into this website. Money moves in Stripe
--      and the record follows, the same rule as prices: if the two can be
--      edited independently they will eventually disagree, and the one
--      holding the money wins the argument.
--
-- Additive and re-runnable throughout.

-- ---------------------------------------------------------------- --
-- What the storefront reads off the order itself.
--
-- The timeline lives in order_events. These two are here because the
-- customer's order page shows them next to the status, and a join for
-- two scalars is a join for nothing.
-- ---------------------------------------------------------------- --
alter table public.orders
  add column if not exists tracking_number text;

alter table public.orders
  add column if not exists shipped_at timestamptz;

comment on column public.orders.tracking_number is
  'Carrier tracking reference, set when the order is marked shipped. Shown to the customer.';

-- ---------------------------------------------------------------- --
-- The lifecycle, as data.
--
-- returns_stock: whether this move puts the units back on the shelf.
-- It is true for every cancellation before despatch and for a refund of
-- something that never left the building. It is false once the order has
-- shipped, because the goods are with the customer: a return is received
-- by hand and counted in by hand, and a row that silently invented stock
-- would be worse than no row.
--
-- notifies: whether the customer is told. Processing is us, not them.
-- ---------------------------------------------------------------- --
create table if not exists public.order_transitions (
  from_status public.order_status not null,
  to_status public.order_status not null,
  returns_stock boolean not null default false,
  notifies boolean not null default false,
  primary key (from_status, to_status)
);

comment on table public.order_transitions is
  'Every legal order status change. Read by advance_order to decide, and by the dashboard to build its dropdown.';

insert into public.order_transitions (from_status, to_status, returns_stock, notifies) values
  ('pending_payment', 'cancelled',  true,  false),
  ('paid',            'processing', false, false),
  ('paid',            'shipped',    false, true),
  ('paid',            'cancelled',  true,  true),
  ('paid',            'refunded',   true,  true),
  ('processing',      'shipped',    false, true),
  ('processing',      'cancelled',  true,  true),
  ('processing',      'refunded',   true,  true),
  ('shipped',         'delivered',  false, true),
  ('shipped',         'refunded',   false, true),
  ('delivered',       'refunded',   false, true)
on conflict (from_status, to_status) do update
  set returns_stock = excluded.returns_stock,
      notifies      = excluded.notifies;

alter table public.order_transitions enable row level security;

-- Readable by anyone signed in, so the dashboard's dropdown comes from
-- the same rows the database enforces. Written by migrations only.
drop policy if exists "order transitions are readable" on public.order_transitions;
create policy "order transitions are readable"
  on public.order_transitions for select
  to authenticated
  using (true);

grant select on public.order_transitions to authenticated;

-- ---------------------------------------------------------------- --
-- The trail.
--
-- One row per status change, written by a trigger so that no path can
-- skip it. actor_id is the person who did it, or null when it was
-- Stripe or a migration: that is the honest distinction, and it is why
-- there is no "source" column guessing at the rest.
-- ---------------------------------------------------------------- --
create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  actor_id uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

comment on table public.order_events is
  'One row per order status change, written by a trigger. A row whose from_status equals its to_status is a note against the order rather than a move: a partial refund is the one that does this.';

create index if not exists order_events_order_id_idx
  on public.order_events (order_id, created_at);

alter table public.order_events enable row level security;

-- The customer sees the history of their own order, which is what makes
-- a timeline on the order page possible without a server round trip.
drop policy if exists "customers read their own order events" on public.order_events;
create policy "customers read their own order events"
  on public.order_events for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_events.order_id and o.user_id = (select auth.uid())
    )
    or private.has_role('admin')
    or private.has_role('manager')
  );

-- No insert, update or delete policy exists, on purpose. The trigger
-- below writes these rows; nothing with a publishable key can.
grant select on public.order_events to authenticated;

-- ---------------------------------------------------------------- --
-- The writer.
--
-- A note belongs to the change, not to the order, so it arrives as a
-- transaction-local setting that advance_order sets just before the
-- update. Anything that changes a status without setting it still gets
-- a row, with no note, which is the point.
-- ---------------------------------------------------------------- --
create or replace function private.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_note text;
begin
  if new.status is distinct from old.status then
    v_note := nullif(current_setting('crystalina.order_note', true), '');
    insert into public.order_events (order_id, from_status, to_status, actor_id, note)
    values (new.id, old.status, new.status, auth.uid(), v_note);
  end if;
  return new;
end;
$$;

revoke all on function private.log_order_status_change() from public, anon, authenticated;

drop trigger if exists orders_log_status_change on public.orders;
create trigger orders_log_status_change
  after update of status on public.orders
  for each row execute function private.log_order_status_change();

-- ---------------------------------------------------------------- --
-- advance_order
--
-- The one way a person moves an order. Refuses an illegal move by
-- consulting order_transitions, returns stock when that row says to,
-- and tells the caller whether the customer should be emailed rather
-- than sending the mail itself: the database does not know how to send
-- mail and should not learn.
--
-- A refund of a Stripe payment is refused here. The money is in Stripe
-- and only Stripe can give it back; typing "refunded" into a dashboard
-- would produce a record that says the customer was paid when they were
-- not. Refund in Stripe, and the webhook writes this row for you.
-- ---------------------------------------------------------------- --
create or replace function public.advance_order(
  p_order_id uuid,
  p_to_status public.order_status,
  p_note text default null,
  p_tracking text default null
)
-- Returns json rather than a table of named columns because half those
-- names are also column names on orders, and inside plpgsql an output
-- parameter shadows the column it is named after. One object, read by
-- the route that has to send the email.
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_rule public.order_transitions%rowtype;
  v_item record;
  v_tracking text;
  v_email text;
  v_name text;
begin
  if not (private.has_role('admin') or private.has_role('manager')) then
    raise exception 'not authorised to manage orders' using errcode = '42501';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'no such order' using errcode = 'no_data_found';
  end if;

  if v_order.status = p_to_status then
    raise exception 'that order is already %', p_to_status using errcode = '22023';
  end if;

  select * into v_rule from public.order_transitions
   where from_status = v_order.status and to_status = p_to_status;
  if not found then
    raise exception 'an order that is % cannot become %', v_order.status, p_to_status
      using errcode = '22023';
  end if;

  -- Money moves in Stripe. See the header.
  if p_to_status = 'refunded' and v_order.stripe_payment_intent_id is not null then
    raise exception 'refund this payment in Stripe and the record will follow'
      using errcode = '42501';
  end if;

  v_tracking := nullif(trim(coalesce(p_tracking, '')), '');
  if p_to_status = 'shipped' and v_tracking is null and v_order.tracking_number is null then
    raise exception 'a tracking number is needed to mark an order shipped'
      using errcode = '22023';
  end if;

  if v_rule.returns_stock then
    for v_item in
      select oi.product_id, oi.quantity from public.order_items oi
       where oi.order_id = v_order.id and oi.product_id is not null
    loop
      update public.products
         set stock = stock + v_item.quantity, updated_at = now()
       where id = v_item.product_id;
    end loop;
  end if;

  -- The trigger reads this and attaches it to the row it writes.
  perform set_config('crystalina.order_note', coalesce(p_note, ''), true);

  update public.orders
     set status = p_to_status,
         payment_status = case
           when p_to_status = 'refunded' then 'refunded'::public.payment_status
           when p_to_status = 'cancelled' and payment_status = 'pending'
             then 'failed'::public.payment_status
           else payment_status
         end,
         tracking_number = coalesce(v_tracking, tracking_number),
         shipped_at = case
           when p_to_status = 'shipped' then coalesce(shipped_at, now())
           else shipped_at
         end,
         updated_at = now()
   where id = v_order.id;

  perform set_config('crystalina.order_note', '', true);

  -- The address on the order first: that is where the customer asked to
  -- be written to about this order. The account is the fallback.
  select coalesce(nullif(v_order.shipping_address->>'email', ''), u.email),
         coalesce(nullif(v_order.shipping_address->>'name', ''), nullif(p.full_name, ''))
    into v_email, v_name
    from public.profiles p
    left join auth.users u on u.id = p.id
   where p.id = v_order.user_id;

  return jsonb_build_object(
    'orderId', v_order.id,
    'orderNumber', v_order.order_number,
    'fromStatus', v_order.status,
    'toStatus', p_to_status,
    'notify', v_rule.notifies,
    'trackingNumber', coalesce(v_tracking, v_order.tracking_number),
    'customerEmail', v_email,
    'customerName', v_name,
    'totalCents', v_order.total_cents
  );
end;
$$;

revoke all on function public.advance_order(uuid, public.order_status, text, text)
  from public, anon;
grant execute on function public.advance_order(uuid, public.order_status, text, text)
  to authenticated;

-- ---------------------------------------------------------------- --
-- refund_order
--
-- Called by the webhook when a refund is issued in Stripe, keyed on the
-- Stripe event id like every other webhook write.
--
-- A partial refund is recorded and does not change the status: an order
-- half refunded is not a refunded order, and saying so would be the one
-- mistake that matters here. Stock is never returned, because a refund
-- says nothing about where the goods are.
-- ---------------------------------------------------------------- --
create or replace function public.refund_order(
  p_event_id text,
  p_event_type text,
  p_payment_intent text,
  p_amount_refunded_cents integer,
  p_fully_refunded boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  begin
    insert into public.stripe_events (id, type) values (p_event_id, p_event_type);
  exception when unique_violation then
    return false;
  end;

  select * into v_order from public.orders
   where stripe_payment_intent_id = p_payment_intent;
  if not found then
    raise exception 'No order for Stripe payment %', p_payment_intent
      using errcode = 'no_data_found';
  end if;

  update public.stripe_events set order_id = v_order.id where id = p_event_id;

  if not p_fully_refunded then
    insert into public.order_events (order_id, from_status, to_status, note)
    values (
      v_order.id, v_order.status, v_order.status,
      format('Partial refund of $%s issued in Stripe.',
             to_char(p_amount_refunded_cents / 100.0, 'FM999999990.00'))
    );
    return true;
  end if;

  if v_order.status = 'refunded' then
    return false;
  end if;

  perform set_config(
    'crystalina.order_note',
    format('Refunded $%s in Stripe.', to_char(p_amount_refunded_cents / 100.0, 'FM999999990.00')),
    true
  );

  update public.orders
     set status = 'refunded',
         payment_status = 'refunded',
         updated_at = now()
   where id = v_order.id;

  perform set_config('crystalina.order_note', '', true);
  return true;
end;
$$;

-- The webhook calls this with the service role, never a browser.
revoke all on function public.refund_order(text, text, text, integer, boolean)
  from public, anon, authenticated;
