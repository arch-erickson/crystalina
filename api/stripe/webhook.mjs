/* POST /api/stripe/webhook
 *
 * The source of truth for whether an order was paid. Not the redirect
 * back to the site: a customer can close the tab, lose signal, or never
 * follow it, and the payment still happened.
 *
 * Three things keep this honest, and all three are load bearing:
 *
 *   1. The signature is checked against the raw body before anything is
 *      parsed or trusted. An unsigned request is not from Stripe.
 *   2. Every write is keyed on the Stripe event id. Stripe guarantees
 *      at-least-once delivery and redelivers after any non-2xx or
 *      timeout, so a handler that is not idempotent eventually charges or
 *      refunds twice.
 *   3. A 200 is returned for anything already handled or not interesting,
 *      so Stripe stops retrying. A 500 means "ask me again", and it
 *      should only ever mean that.
 */
import { json, methodGuard } from '../_lib/http.mjs';
import { verifyWebhook } from '../_lib/stripe.mjs';
import { admin } from '../_lib/supabase.mjs';
import { sendEmail } from '../_lib/email.mjs';
import { confirmationEmail } from '../_lib/receipt.mjs';

/* The raw bytes, exactly as sent. Reparsing and re-serialising would
   change the signed payload and every signature would fail. */
async function rawBody(req) {
  if (typeof req.body === 'string') return req.body;
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) throw new Error('Payload too large.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function callRpc(fn, args) {
  return admin(`rpc/${fn}`, { method: 'POST', body: args });
}

/* Mark it paid, and if this delivery is the one that moved it, say thank
 * you. The order exists before the money does on this path, so the
 * confirmation belongs here rather than at checkout: a customer who
 * abandons the payment page has an order in the database and must not be
 * thanked for it.
 *
 * mark_order_paid returns false for a redelivered event, which is also
 * what stops a second email. The send is wrapped because a refused email
 * must not turn into a 500: Stripe would retry, mark_order_paid would
 * answer false, and the email would never be sent at all. A failure here
 * is logged and the payment still stands.
 */
async function markPaidAndThank(event, object, sessionId) {
  const moved = await callRpc('mark_order_paid', {
    p_event_id: event.id,
    p_event_type: event.type,
    p_session_id: sessionId,
    p_payment_intent: typeof object.payment_intent === 'string' ? object.payment_intent : null,
  });

  if (moved !== true) return { applied: false, thanked: false };

  let thanked = false;
  try {
    const order = await callRpc('order_receipt', { p_session_id: sessionId });
    if (order && order.email) {
      await sendEmail({ to: order.email, ...confirmationEmail(order) });
      thanked = true;
    } else {
      console.error('[stripe] no address to confirm order on session', sessionId);
    }
  } catch (error) {
    console.error('[stripe] confirmation email failed for session', sessionId, error);
  }
  return { applied: true, thanked };
}

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;

  let body;
  try { body = await rawBody(req); }
  catch { return json(res, 400, { error: 'Invalid request.' }); }

  const signature = req.headers['stripe-signature'];
  let verified;
  try {
    verified = await verifyWebhook(body, signature);
  } catch (error) {
    /* Reaching here means the secret is not configured. That is our
       problem, not Stripe's, so ask to be told again. */
    console.error('[stripe] webhook verification unavailable', error);
    return json(res, 500, { error: 'Webhook not configured.' });
  }

  if (!verified.ok) {
    console.warn('[stripe] rejected webhook:', verified.reason);
    return json(res, 400, { error: 'Invalid signature.' });
  }

  const event = verified.event;
  const object = (event.data && event.data.object) || {};
  const sessionId = object.id;

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        /* Stripe sends this for completed sessions whose payment may
           still be processing. Only a paid one counts. */
        if (object.payment_status && object.payment_status !== 'paid') {
          return json(res, 200, { received: true, ignored: 'awaiting payment' });
        }
        const outcome = await markPaidAndThank(event, object, sessionId);
        return json(res, 200, { received: true, ...outcome });
      }

      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed': {
        const released = await callRpc('release_order', {
          p_event_id: event.id,
          p_event_type: event.type,
          p_session_id: sessionId,
        });
        return json(res, 200, { received: true, released: released === true });
      }

      case 'checkout.session.async_payment_succeeded': {
        const outcome = await markPaidAndThank(event, object, sessionId);
        return json(res, 200, { received: true, ...outcome });
      }

      case 'charge.refunded': {
        /* A refund is issued in Stripe, by a person, in the dashboard.
           This is the record following the money rather than leading it,
           which is why advance_order refuses to mark a Stripe payment
           refunded by hand: two editable copies of the same fact
           eventually disagree, and the one holding the money wins.

           A partial refund is recorded against the order and leaves the
           status alone. Half refunded is not refunded. */
        const intent = typeof object.payment_intent === 'string' ? object.payment_intent : null;
        if (!intent) {
          return json(res, 200, { received: true, ignored: 'refund with no payment intent' });
        }
        const applied = await callRpc('refund_order', {
          p_event_id: event.id,
          p_event_type: event.type,
          p_payment_intent: intent,
          p_amount_refunded_cents: Number(object.amount_refunded) || 0,
          p_fully_refunded: object.refunded === true,
        });
        return json(res, 200, { received: true, applied: applied === true });
      }

      default:
        /* Everything else is acknowledged and dropped. Stripe sends a
           great many event types and retrying the ones we ignore helps
           nobody. */
        return json(res, 200, { received: true, ignored: event.type });
    }
  } catch (error) {
    const detail = String(error.message || '');
    /* An event for an order we cannot find is not going to succeed on a
       retry either, so take it off Stripe's queue and leave it in the
       log to be looked at. */
    if (/no_data_found|No order for Stripe/i.test(detail)) {
      console.error('[stripe] no order for event', sessionId, event.id);
      return json(res, 200, { received: true, ignored: 'no matching order' });
    }
    console.error('[stripe] handler failed', event.type, error);
    return json(res, 500, { error: 'Could not process that event.' });
  }
}
