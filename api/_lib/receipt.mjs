/* The order confirmation, written once.
 *
 * Two routes could send it. /api/orders/create sends it itself, because
 * on that path the order is final the moment it is created. On the Stripe
 * path the order exists before the money does, so the confirmation
 * belongs to the webhook: a customer who abandons the payment page has an
 * order in the database and must not be thanked for it.
 *
 * Keeping the copy in one place is the whole reason this file exists. Two
 * confirmation emails drift, and the one that drifts is always the one
 * nobody is looking at.
 */
import { esc } from './email.mjs';

const WHATSAPP = '(917) 809-4803';
const NAVY = '#15375D';

export const money = (cents) =>
  `$${(Number(cents || 0) / 100).toFixed(2)}`;

/* `order` carries: number, name, totalCents, and optionally
   subtotalCents, shippingCents, taxCents, items [{ name, qty, unitCents }]
   and installation. Everything beyond the first three is left out of the
   email when it is absent rather than printed empty. */
export function confirmationEmail(order) {
  const number = `CW-${order.number}`;
  const name = esc(order.name || 'there');

  const lines = Array.isArray(order.items) && order.items.length
    ? `<table style="border-collapse:collapse;margin:16px 0">
         ${order.items.map((item) => `
           <tr>
             <td style="padding:4px 16px 4px 0">${esc(item.name)}</td>
             <td style="padding:4px 16px 4px 0">&times;&nbsp;${esc(item.qty)}</td>
             <td style="padding:4px 0;text-align:right">${esc(money(item.unitCents * item.qty))}</td>
           </tr>`).join('')}
       </table>`
    : '';

  const totals = [
    order.subtotalCents != null ? ['Subtotal', order.subtotalCents] : null,
    order.shippingCents != null
      ? ['Shipping', order.shippingCents === 0 ? 'Free' : money(order.shippingCents)]
      : null,
    order.taxCents ? ['Tax', order.taxCents] : null,
  ].filter(Boolean);

  const summary = `
    <table style="border-collapse:collapse;margin:16px 0">
      ${totals.map(([label, value]) => `
        <tr>
          <td style="padding:2px 24px 2px 0;color:#5a6b7d">${label}</td>
          <td style="padding:2px 0;text-align:right">${esc(typeof value === 'number' ? money(value) : value)}</td>
        </tr>`).join('')}
      <tr>
        <td style="padding:8px 24px 2px 0"><strong>Total</strong></td>
        <td style="padding:8px 0 2px;text-align:right"><strong>${esc(money(order.totalCents))}</strong></td>
      </tr>
    </table>`;

  return {
    subject: `Crystalina order ${number} confirmed`,
    html: `<h2 style="color:${NAVY}">Thank you, ${name}</h2>
      <p>Order <strong>${esc(number)}</strong> is confirmed.</p>
      ${lines}
      ${summary}
      ${order.installation
        ? '<p>You asked us to fit it. We will be in touch to agree a time that suits the household.</p>'
        : ''}
      <p>We will email tracking as soon as it ships.</p>
      <p>Any question at all, reply to this email or send us a message on WhatsApp at ${WHATSAPP}.</p>
      <p style="color:${NAVY}">Crystalina, New York</p>`,
  };
}
