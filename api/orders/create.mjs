/* POST /api/orders/create
 *
 * Server-authoritative order creation. The browser sends product ids and
 * quantities only; the database recomputes every price and total,
 * enforces stock, and decrements inventory in one transaction.
 *
 * **This route closes itself when payment exists.** It creates an order
 * and holds the stock without taking any money, which was harmless while
 * nothing could take money: an unpaid order is not shipped. The moment
 * Stripe is configured it stops being harmless, because anyone with an
 * account could call it in a loop and hold every unit in the catalogue
 * without ever paying, and that is a shop with nothing left to sell.
 *
 * So once STRIPE_SECRET_KEY is set, this answers 410 and the only way to
 * an order is /api/checkout/session, which creates the order and the
 * payment together. The gate is the presence of the key rather than a
 * separate switch, so it cannot be forgotten: turning payment on turns
 * this off, in the same action.
 */
import { json, methodGuard, readJson, clientIp, rateLimit, durableRateLimit, cleanText } from '../_lib/http.mjs';
import { verifyTurnstile } from '../_lib/turnstile.mjs';
import { userFromToken, rpcAsUser } from '../_lib/supabase.mjs';
import { sendEmail } from '../_lib/email.mjs';
import { confirmationEmail } from '../_lib/receipt.mjs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;

  if (process.env.STRIPE_SECRET_KEY) {
    return json(res, 410, {
      error: 'Checkout has moved. Please refresh the page and try again.',
    });
  }

  const ip = clientIp(req);
  if (!(await durableRateLimit(`order:${ip}`, { limit: 10, windowMs: 10 * 60000 })).allowed) {
    return json(res, 429, { error: 'Too many attempts in a short time. Wait a minute and try again.' });
  }

  const user = await userFromToken(req.headers.authorization);
  if (!user) return json(res, 401, { error: 'Please sign in to place an order.' });

  let body;
  try { body = await readJson(req); }
  catch { return json(res, 400, { error: 'Invalid request.' }); }

  const captcha = await verifyTurnstile(body.turnstileToken, ip);
  if (!captcha.ok) return json(res, 400, { error: captcha.error });

  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return json(res, 400, { error: 'Your cart is empty. Add a system to check out.' });
  if (items.length > 50) return json(res, 400, { error: 'That is more than one order can hold. Split it into two, or call us and we will take it by phone.' });

  const cleanItems = [];
  for (const item of items) {
    const productId = String(item?.productId || '');
    const quantity = Number(item?.quantity);
    if (!UUID_RE.test(productId)) return json(res, 400, { error: 'One item in your cart is no longer available. Refresh the page and try again.' });
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return json(res, 400, { error: 'Choose a quantity of one or more.' });
    }
    // Optional configuration. Ids only: the database recomputes every price.
    const line = { productId, quantity };
    if (item?.stageOptionId) {
      if (!UUID_RE.test(String(item.stageOptionId))) return json(res, 400, { error: 'That option is no longer available for this system. Refresh the page and choose again.' });
      line.stageOptionId = String(item.stageOptionId);
    }
    if (item?.faucetId) {
      if (!UUID_RE.test(String(item.faucetId))) return json(res, 400, { error: 'That faucet is no longer available. Refresh the page and choose again.' });
      line.faucetId = String(item.faucetId);
    }
    cleanItems.push(line);
  }

  const a = body.shippingAddress || {};
  const shippingAddress = {
    name: cleanText(a.name, 120), email: cleanText(a.email, 200), phone: cleanText(a.phone, 40),
    line1: cleanText(a.line1, 200), borough: cleanText(a.borough, 60), zip: cleanText(a.zip, 12)
  };
  if (!shippingAddress.name || !shippingAddress.line1 || !shippingAddress.zip) {
    return json(res, 400, { error: 'Add a name, a street address and a ZIP code for delivery.' });
  }

  let order;
  try {
    // Runs as the signed-in user so auth.uid() inside create_order is correct.
    const rows = await rpcAsUser('create_order', {
      p_items: cleanItems,
      p_shipping_address: shippingAddress,
      p_installation_requested: Boolean(body.installationRequested)
    }, user.token);
    order = Array.isArray(rows) ? rows[0] : rows;
  } catch (error) {
    const detail = String(error.message || '');
    const shopperFacing = /insufficient stock|unavailable|quantity/i.test(detail);
    console.error('[orders] create failed', error);
    return json(res, shopperFacing ? 409 : 500, {
      error: shopperFacing ? detail : 'We could not place that order. Please try again.'
    });
  }

  /* The same confirmation the Stripe path sends, from api/_lib/receipt.mjs.
     Two copies of this email would drift, and the one that drifts is
     always the one nobody is looking at. */
  try {
    await sendEmail({
      to: shippingAddress.email || user.email,
      ...confirmationEmail({
        number: order.order_number,
        name: shippingAddress.name,
        totalCents: order.total_cents,
        installation: Boolean(body.installationRequested),
      }),
    });
  } catch (error) {
    console.error('[orders] confirmation email failed', error);
  }

  return json(res, 200, {
    order: { id: order.id, number: `CW-${order.order_number}`, totalCents: order.total_cents }
  });
}
