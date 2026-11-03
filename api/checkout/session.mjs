/* POST /api/checkout/session
 *
 * Starts a payment. The order is created first, by create_order in the
 * database, which prices every line, applies stage options and faucet
 * upgrades, checks stock and decrements it in one transaction. Only then
 * is Stripe told what to charge.
 *
 * That ordering is the point. Nothing in JavaScript ever works out a
 * price, so the amount on the card is the amount the database computed,
 * and a browser that sends a price is ignored because it is never read.
 *
 * The cost of it: stock is held from the moment checkout starts. A
 * customer who wanders off must not hold it forever, which is what
 * checkout.session.expired and release_order are for.
 */
import { json, methodGuard, readJson, clientIp, rateLimit, cleanText } from '../_lib/http.mjs';
import { verifyTurnstile } from '../_lib/turnstile.mjs';
import { userFromToken, rpcAsUser } from '../_lib/supabase.mjs';
import { stripePost } from '../_lib/stripe.mjs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;

  const ip = clientIp(req);
  if (!rateLimit(`checkout:${ip}`, { limit: 10, windowMs: 10 * 60000 }).allowed) {
    return json(res, 429, { error: 'Too many attempts. Please try again shortly.' });
  }

  const user = await userFromToken(req.headers.authorization);
  if (!user) return json(res, 401, { error: 'Please sign in to check out.' });

  let body;
  try { body = await readJson(req); }
  catch { return json(res, 400, { error: 'Invalid request.' }); }

  const captcha = await verifyTurnstile(body.turnstileToken, ip);
  if (!captcha.ok) return json(res, 400, { error: captcha.error });

  /* Ids and quantities only. Anything resembling a price is not read. */
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return json(res, 400, { error: 'Your cart is empty.' });
  if (items.length > 50) return json(res, 400, { error: 'Too many items in one order.' });

  const cleanItems = [];
  for (const item of items) {
    const productId = String(item?.productId || '');
    const quantity = Number(item?.quantity);
    if (!UUID_RE.test(productId)) return json(res, 400, { error: 'Unrecognised product in cart.' });
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return json(res, 400, { error: 'Invalid quantity.' });
    }
    const line = { productId, quantity };
    if (item?.stageOptionId) {
      if (!UUID_RE.test(String(item.stageOptionId))) return json(res, 400, { error: 'Unrecognised configuration.' });
      line.stageOptionId = String(item.stageOptionId);
    }
    if (item?.faucetId) {
      if (!UUID_RE.test(String(item.faucetId))) return json(res, 400, { error: 'Unrecognised faucet.' });
      line.faucetId = String(item.faucetId);
    }
    cleanItems.push(line);
  }

  const a = body.shippingAddress || {};
  const shippingAddress = {
    name: cleanText(a.name, 120), email: cleanText(a.email, 200), phone: cleanText(a.phone, 40),
    line1: cleanText(a.line1, 200), borough: cleanText(a.borough, 60), zip: cleanText(a.zip, 12),
  };
  if (!shippingAddress.name || !shippingAddress.line1 || !shippingAddress.zip) {
    return json(res, 400, { error: 'A delivery name, address and ZIP code are required.' });
  }

  /* 1. The database prices it and holds the stock. */
  let order;
  try {
    const rows = await rpcAsUser('create_order', {
      p_items: cleanItems,
      p_shipping_address: shippingAddress,
      p_installation_requested: Boolean(body.installationRequested),
    }, user.token);
    order = Array.isArray(rows) ? rows[0] : rows;
  } catch (error) {
    const detail = String(error.message || '');
    const shopperFacing = /insufficient stock|unavailable|quantity/i.test(detail);
    console.error('[checkout] create_order failed', error);
    return json(res, shopperFacing ? 409 : 500, {
      error: shopperFacing ? detail : 'We could not start that checkout. Please try again.',
    });
  }

  /* 2. Stripe is told one amount: the total the database arrived at. A
        single line item, because itemising here would mean recomputing
        the split and that is the mistake this whole shape avoids. */
  const base = (process.env.PUBLIC_SITE_URL || 'https://crystalina.org').replace(/\/$/, '');
  let session;
  try {
    session = await stripePost('/checkout/sessions', {
      mode: 'payment',
      /* Stripe replaces the placeholder itself; it must not be encoded. */
      success_url: `${base}/account/?order=${order.id}`,
      cancel_url: `${base}/checkout/?cancelled=1`,
      client_reference_id: order.id,
      customer_email: shippingAddress.email || user.email || undefined,
      metadata: { order_id: order.id, order_number: String(order.order_number) },
      payment_intent_data: { metadata: { order_id: order.id } },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: order.total_cents,
          product_data: { name: `Crystalina order CW-${order.order_number}` },
        },
      }],
    }, {
      /* One session per order, however many times this is retried. */
      idempotencyKey: `order-${order.id}`,
    });
  } catch (error) {
    console.error('[checkout] stripe session failed', error);
    return json(res, 502, { error: 'We could not reach the payment provider. Please try again.' });
  }

  /* 3. Remember which session belongs to this order, so the webhook can
        find it. If this fails the customer can still pay, and the webhook
        falls back to the order id in the session metadata. */
  try {
    await rpcAsUser('attach_stripe_session', {
      p_order_id: order.id, p_session_id: session.id,
    }, user.token);
  } catch (error) {
    console.error('[checkout] attach_stripe_session failed', error);
  }

  return json(res, 200, {
    url: session.url,
    sessionId: session.id,
    order: { id: order.id, number: `CW-${order.order_number}`, totalCents: order.total_cents },
  });
}
