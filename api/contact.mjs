/* POST /api/contact
   Stores the enquiry in Supabase and emails the team. Protected by Turnstile
   (when configured) and a per-IP rate limit. */
import { json, methodGuard, readJson, clientIp, rateLimit, isEmail, cleanText } from './_lib/http.mjs';
import { verifyTurnstile } from './_lib/turnstile.mjs';
import { admin } from './_lib/supabase.mjs';
import { sendEmail, esc } from './_lib/email.mjs';
import { createHash } from 'node:crypto';

const TOPICS = [
  'Product question', 'Order status', 'Installation',
  "My building's water quality", 'Wholesale / partnerships', 'Other', 'General'
];

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;
  const ip = clientIp(req);
  if (!rateLimit(`contact:${ip}`, { limit: 5, windowMs: 10 * 60000 }).allowed) {
    return json(res, 429, { error: 'Too many messages. Please try again shortly.' });
  }

  let body;
  try { body = await readJson(req); }
  catch { return json(res, 400, { error: 'Invalid request.' }); }

  const name = cleanText(body.name, 120);
  const email = cleanText(body.email, 200);
  const phone = cleanText(body.phone, 40);
  const message = cleanText(body.message, 4000);
  const topic = TOPICS.includes(body.topic) ? body.topic : 'General';

  if (!name || !message) return json(res, 400, { error: 'Please include your name and a message.' });
  if (!isEmail(email)) return json(res, 400, { error: 'Please enter a valid email address.' });

  const captcha = await verifyTurnstile(body.turnstileToken, ip);
  if (!captcha.ok) return json(res, 400, { error: captcha.error });

  try {
    await admin('contact_messages', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: [{
        name, email, phone: phone || null, topic, message,
        source_ip_hash: createHash('sha256').update(ip).digest('hex').slice(0, 32)
      }]
    });
  } catch (error) {
    console.error('[contact] store failed', error);
    return json(res, 500, { error: 'We could not save your message. Please call or WhatsApp us.' });
  }

  try {
    await sendEmail({
      to: process.env.CONTACT_INBOX || 'info@crystalina.org',
      replyTo: email,
      subject: `Crystalina enquiry: ${topic} from ${name}`,
      html: `<h2>New enquiry</h2>
        <p><strong>Name:</strong> ${esc(name)}<br>
        <strong>Email:</strong> ${esc(email)}<br>
        <strong>Phone:</strong> ${esc(phone || 'not supplied')}<br>
        <strong>Topic:</strong> ${esc(topic)}</p>
        <p style="white-space:pre-wrap">${esc(message)}</p>`
    });
  } catch (error) {
    // The enquiry is already stored, so report success rather than losing it.
    console.error('[contact] email failed', error);
  }

  return json(res, 200, { ok: true });
}
