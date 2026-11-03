-- Crystalina: the payment path.
--
-- The shape, and why. create_order already prices every line, applies stage
-- options and faucet upgrades, checks stock and decrements it, all in one
-- transaction. So the checkout route calls it first and the order exists as
-- pending_payment before Stripe is ever contacted. Nothing reprices in
-- JavaScript, which is the only way the price on the card and the price in
-- the database cannot drift.
--
-- That means stock is held from the moment checkout starts. A customer who
-- abandons the page must not hold it forever, so Stripe's
-- checkout.session.expired releases it again through release_order.
--
-- Everything here is additive and re-runnable: if not exists, create or
-- replace, and policies dropped before they are created.

-- ---------------------------------------------------------------- --
-- Which Stripe session an order belongs to.
-- ---------------------------------------------------------------- --
alter table public.orders
  add column if not exists stripe_session_id text;

-- One session, one order. If Stripe retries session creation the unique
-- index is what stops a second order appearing.
create unique index if not exists orders_stripe_session_id_key
  on public.orders (stripe_session_id)
  where stripe_session_id is not null;

alter table public.orders
  add column if not exists paid_at timestamptz;

-- ---------------------------------------------------------------- --
-- The idempotency ledger.
--
-- Stripe guarantees at-least-once delivery and will redeliver an event
-- after any non-2xx, a timeout, or for no reason at all. Marking an order
-- paid twice is survivable; creating a second order, or refunding twice,
-- is not. Every handler writes its event id here first and does nothing
-- if the insert finds the row already present.
-- ---------------------------------------------------------------- --
create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  order_id uuid references public.orders(id) on delete set null,
  received_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;

-- Nobody reaches this from a browser. It is written by the webhook with
-- the service role and read by nothing else, so there is no policy that
-- grants access: row level security on with no policy denies everyone.
drop policy if exists "stripe_events are server only" on public.stripe_events;

-- ---------------------------------------------------------------- --
-- mark_order_paid
--
-- Idempotent on the Stripe event id. Returns true when this call is the
-- one that moved the order, false when the event had already been seen,
-- so the webhook can answer 200 either way and Stripe stops retrying.
-- ---------------------------------------------------------------- --
create or replace function public.mark_order_paid(
  p_event_id text,
  p_event_type text,
  p_session_id text,
  p_payment_intent text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  -- The ledger first. A duplicate delivery stops here.
  begin
    insert into public.stripe_events (id, type) values (p_event_id, p_event_type);
  exception when unique_violation then
    return false;
  end;

  select * into v_order from public.orders where stripe_session_id = p_session_id;
  if not found then
    raise exception 'No order for Stripe session %', p_session_id
      using errcode = 'no_data_found';
  end if;

  update public.orders
     set status = 'paid',
         payment_status = 'paid',
         paid_at = coalesce(paid_at, now()),
         stripe_payment_intent_id = coalesce(p_payment_intent, stripe_payment_intent_id),
         updated_at = now()
   where id = v_order.id;

  update public.stripe_events set order_id = v_order.id where id = p_event_id;
  return true;
end;
$$;

-- ---------------------------------------------------------------- --
-- release_order
--
-- The other half of holding stock at checkout. When a session expires or
-- the payment fails, put the stock back and cancel the order. Also
-- idempotent, and it refuses to touch an order that has been paid, so a
-- late expiry event cannot cancel a real sale.
-- ---------------------------------------------------------------- --
create or replace function public.release_order(
  p_event_id text,
  p_event_type text,
  p_session_id text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  begin
    insert into public.stripe_events (id, type) values (p_event_id, p_event_type);
  exception when unique_violation then
    return false;
  end;

  select * into v_order from public.orders where stripe_session_id = p_session_id;
  if not found then
    return false;
  end if;

  -- A paid order is never released, whatever Stripe says afterwards.
  if v_order.payment_status = 'paid' then
    update public.stripe_events set order_id = v_order.id where id = p_event_id;
    return false;
  end if;

  for v_item in
    select product_id, quantity from public.order_items where order_id = v_order.id
  loop
    update public.products
       set stock = stock + v_item.quantity, updated_at = now()
     where id = v_item.product_id;
  end loop;

  update public.orders
     set status = 'cancelled', payment_status = 'failed', updated_at = now()
   where id = v_order.id;

  update public.stripe_events set order_id = v_order.id where id = p_event_id;
  return true;
end;
$$;

-- ---------------------------------------------------------------- --
-- attach_stripe_session
--
-- Called by the checkout route once Stripe has given it a session id, so
-- the webhook can find the order later. Runs as the signed-in customer
-- and will only touch their own unpaid order.
-- ---------------------------------------------------------------- --
create or replace function public.attach_stripe_session(
  p_order_id uuid,
  p_session_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.orders
     set stripe_session_id = p_session_id, updated_at = now()
   where id = p_order_id
     and user_id = auth.uid()
     and payment_status = 'pending';

  if not found then
    raise exception 'No unpaid order % for this account', p_order_id
      using errcode = 'no_data_found';
  end if;
end;
$$;

-- The webhook calls the first two with the service role, never a browser.
revoke all on function public.mark_order_paid(text, text, text, text) from public, anon, authenticated;
revoke all on function public.release_order(text, text, text) from public, anon, authenticated;

-- The checkout route calls this one as the customer.
revoke all on function public.attach_stripe_session(uuid, text) from public, anon;
grant execute on function public.attach_stripe_session(uuid, text) to authenticated;
