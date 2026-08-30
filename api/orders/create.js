/* POST /api/orders/create
   Server-authoritative order creation. The browser sends product ids and
   quantities only; the database recomputes every price and total, enforces
   stock, and decrements inventory in one transaction. */
import { json, methodGuard, readJson, clientIp, rateLimit, cleanText } from '../_lib/http.js';
import { verifyTurnstile } from '../_lib/turnstile.js';
import { userFromToken, rpcAsUser } from '../_lib/supabase.js';
import { sendEmail, esc } from '../_lib/email.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;
  const ip = clientIp(req);
  if (!rateLimit(`order:${ip}`, { limit: 10, windowMs: 10 * 60000 }).allowed) {
    return json(res, 429, { error: 'Too many attempts. Please try again shortly.' });
  }

  const user = await userFromToken(req.headers.authorization);
  if (!user) return json(res, 401, { error: 'Please sign in to place an order.' });

  let body;
  try { body = await readJson(req); }
  catch { return json(res, 400, { error: 'Invalid request.' }); }

  const captcha = await verifyTurnstile(body.turnstileToken, ip);
  if (!captcha.ok) return json(res, 400, { error: captcha.error });

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
    // Optional configuration. Ids only: the database recomputes every price.
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
    line1: cleanText(a.line1, 200), borough: cleanText(a.borough, 60), zip: cleanText(a.zip, 12)
  };
  if (!shippingAddress.name || !shippingAddress.line1 || !shippingAddress.zip) {
    return json(res, 400, { error: 'A delivery name, address and ZIP code are required.' });
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

  const total = (order.total_cents / 100).toFixed(2);
  try {
    await sendEmail({
      to: shippingAddress.email || user.email,
      subject: `Crystalina order CW-${order.order_number} confirmed`,
      html: `<h2>Thank you, ${esc(shippingAddress.name)}</h2>
        <p>Order <strong>CW-${esc(order.order_number)}</strong> is confirmed. Total $${esc(total)}.</p>
        <p>We will email tracking as soon as it ships. Questions? Reply here or WhatsApp (917) 809-4803.</p>`
    });
  } catch (error) {
    console.error('[orders] confirmation email failed', error);
  }

  return json(res, 200, {
    order: { id: order.id, number: `CW-${order.order_number}`, totalCents: order.total_cents }
  });
}
