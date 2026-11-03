/* POST /api/orders/status
 *
 * The order lifecycle, from the dashboard to the database to the
 * customer's inbox.
 *
 * Before this, the status dropdown in the admin dashboard wrote to
 * localStorage. A manager marked an order shipped, the toast agreed, and
 * nothing else in the world knew: the customer's order page still said
 * paid, and a colleague on another machine saw the old status. Nothing
 * was lost, because nothing was saved.
 *
 * Three decisions live elsewhere on purpose.
 *
 *   Which moves are legal is in order_transitions, a table, so the
 *   dashboard's dropdown and the database's refusal come from the same
 *   rows rather than from two lists that drift.
 *
 *   Who may do it is private.has_role('admin'|'manager'), checked inside
 *   advance_order with auth.uid(). This route calls the function as the
 *   signed-in person rather than with the service role, so the gate in
 *   front of the dashboards being browser-side (U1) does not matter
 *   here: a stranger who reaches this endpoint still cannot move an
 *   order.
 *
 *   Whether the customer hears about it is the notifies column on that
 *   same row. This route does the sending, because the database does not
 *   know how to send mail and should not learn.
 *
 * A refund is not typed here. advance_order refuses to mark a Stripe
 * payment refunded; the refund is issued in Stripe and the webhook
 * writes the record. Money and the record must not be separately
 * editable, for the same reason prices are not computed in a browser.
 */
import { json, methodGuard, readJson, clientIp, durableRateLimit, cleanText } from '../_lib/http.mjs';
import { userFromToken, rpcAsUser } from '../_lib/supabase.mjs';
import { sendEmail, esc } from '../_lib/email.mjs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* The statuses a person may ask for. Narrower than the enum: paid is set
   by the payment, not by hand, and pending_payment is where an order
   begins. */
const REQUESTABLE = new Set(['processing', 'shipped', 'delivered', 'cancelled', 'refunded']);

const WHATSAPP = '(917) 809-4803';

/* Read the request, or say why it cannot be. Exported because this is
   where a typo becomes a 500 at three in the afternoon, and it is worth
   testing without a signed-in session to hand. */
export function validateRequest(body) {
  const orderId = String((body && body.orderId) || '');
  if (!UUID_RE.test(orderId)) {
    return { error: 'That order could not be found. Refresh the page and try again.' };
  }
  const status = String((body && body.status) || '');
  if (!REQUESTABLE.has(status)) {
    return { error: 'That is not a status an order can be moved to.' };
  }
  return {
    orderId,
    status,
    note: cleanText(body.note, 500) || null,
    tracking: cleanText(body.trackingNumber, 64) || null,
  };
}

/* What the customer reads. One household, one order, written to the
   person and not about them. */
export function customerEmail(result) {
  const number = `CW-${result.orderNumber}`;
  const name = esc(result.customerName || 'there');
  const sign = `<p style="color:#15375D">Crystalina, New York</p>`;
  const ask = `<p>Any question at all, reply to this email or send us a message on WhatsApp at ${WHATSAPP}.</p>`;

  switch (result.toStatus) {
    case 'shipped':
      return {
        subject: `Order ${number} is on its way`,
        html: `<h2 style="color:#15375D">Your system has shipped, ${name}</h2>
          <p>Order <strong>${esc(number)}</strong> left us today.</p>
          ${result.trackingNumber
            ? `<p>Tracking reference <strong>${esc(result.trackingNumber)}</strong>.</p>`
            : ''}
          <p>Everything you need for the install is in the box. If you asked us to
             fit it, we will be in touch to agree a time.</p>
          ${ask}${sign}`,
      };
    case 'delivered':
      return {
        subject: `Order ${number} has been delivered`,
        html: `<h2 style="color:#15375D">Delivered, ${name}</h2>
          <p>Order <strong>${esc(number)}</strong> has arrived. From the first glass,
             your household is drinking filtered water.</p>
          <p>Keep the model number to hand when a cartridge is due. We will remind you
             in good time.</p>
          ${ask}${sign}`,
      };
    case 'cancelled':
      return {
        subject: `Order ${number} has been cancelled`,
        html: `<h2 style="color:#15375D">Order ${esc(number)} is cancelled</h2>
          <p>We have cancelled it and nothing further will be charged.</p>
          <p>If this was not what you expected, tell us and we will put it right.</p>
          ${ask}${sign}`,
      };
    case 'refunded':
      return {
        subject: `Order ${number} has been refunded`,
        html: `<h2 style="color:#15375D">Your refund is on its way</h2>
          <p>Order <strong>${esc(number)}</strong> has been refunded in full.
             Your bank usually shows it within five to ten days.</p>
          ${ask}${sign}`,
      };
    default:
      return null;
  }
}

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;

  const ip = clientIp(req);
  if (!(await durableRateLimit(`order-status:${ip}`, { limit: 60, windowMs: 10 * 60000 })).allowed) {
    return json(res, 429, { error: 'Too many changes in a short time. Wait a minute and try again.' });
  }

  const user = await userFromToken(req.headers.authorization);
  if (!user) return json(res, 401, { error: 'Please sign in to manage orders.' });

  let body;
  try { body = await readJson(req); }
  catch { return json(res, 400, { error: 'Invalid request.' }); }

  const asked = validateRequest(body);
  if (asked.error) return json(res, 400, { error: asked.error });

  let result;
  try {
    const rows = await rpcAsUser('advance_order', {
      p_order_id: asked.orderId,
      p_to_status: asked.status,
      p_note: asked.note,
      p_tracking: asked.tracking,
    }, user.token);
    result = Array.isArray(rows) ? rows[0] : rows;
  } catch (error) {
    const detail = String(error.message || '');
    /* The database's refusals are written for the person reading them,
       so they are passed through. Anything else is ours to explain. */
    if (/not authorised/i.test(detail)) {
      return json(res, 403, { error: 'Your account cannot change orders.' });
    }
    if (/no such order|no_data_found/i.test(detail)) {
      return json(res, 404, { error: 'That order could not be found. Refresh the page and try again.' });
    }
    if (/cannot become|already|tracking number|refund this payment/i.test(detail)) {
      return json(res, 409, { error: detail });
    }
    console.error('[orders] advance failed', error);
    return json(res, 500, { error: 'We could not change that order. Please try again.' });
  }

  /* The order has moved. From here nothing may fail the request: a
     refused email does not un-ship a package. */
  let notified = false;
  if (result && result.notify && result.customerEmail) {
    const message = customerEmail(result);
    if (message) {
      try {
        await sendEmail({ to: result.customerEmail, ...message });
        notified = true;
      } catch (error) {
        console.error('[orders] status email failed', result.orderNumber, error);
      }
    }
  }

  return json(res, 200, {
    order: {
      id: result.orderId,
      number: `CW-${result.orderNumber}`,
      status: result.toStatus,
      previousStatus: result.fromStatus,
      trackingNumber: result.trackingNumber || null,
    },
    notified,
  });
}
