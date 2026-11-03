-- Crystalina: what the webhook needs in order to say thank you.
--
-- The confirmation email was sent by /api/orders/create, which is the
-- route that closes itself the moment Stripe is configured. On the Stripe
-- path the order is created before the money arrives, so the thank you
-- belongs to the webhook: a customer who abandons the payment page has an
-- order in the database and must not be thanked for it.
--
-- mark_order_paid already answers the hard question, which is whether this
-- delivery is the one that moved the order. This only has to supply the
-- lines and the name, and is called straight after, so a redelivered
-- event never produces a second email.
--
-- It takes the session id rather than the order id because that is what
-- Stripe sends and what the webhook has in its hand. A session id is not
-- guessable and this is revoked from every browser role regardless.

create or replace function public.order_receipt(p_session_id text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'number', o.order_number,
    'name', coalesce(
      nullif(o.shipping_address->>'name', ''),
      nullif(p.full_name, '')
    ),
    'email', coalesce(nullif(o.shipping_address->>'email', ''), u.email),
    'subtotalCents', o.subtotal_cents,
    'shippingCents', o.shipping_cents,
    'taxCents', o.tax_cents,
    'totalCents', o.total_cents,
    'installation', o.installation_requested,
    'items', coalesce(
      (
        select jsonb_agg(
                 jsonb_build_object(
                   'name', i.product_name_snapshot,
                   'qty', i.quantity,
                   'unitCents', i.unit_price_cents
                 )
                 order by i.created_at, i.product_name_snapshot
               )
          from public.order_items i
         where i.order_id = o.id
      ),
      '[]'::jsonb
    )
  )
  from public.orders o
  join public.profiles p on p.id = o.user_id
  left join auth.users u on u.id = p.id
  where o.stripe_session_id = p_session_id;
$$;

comment on function public.order_receipt(text) is
  'Everything the confirmation email needs, for one Stripe session. Called by the webhook with the service role.';

-- Carries a customer name, email and address. The webhook calls it with
-- the service role; nothing with a publishable key may.
revoke all on function public.order_receipt(text) from public, anon, authenticated;
