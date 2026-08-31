/* POST /api/newsletter — subscribe an address to the Crystalina Club. */
import { json, methodGuard, readJson, clientIp, rateLimit, isEmail, cleanText } from './_lib/http.mjs';
import { verifyTurnstile } from './_lib/turnstile.mjs';
import { admin } from './_lib/supabase.mjs';

export default async function handler(req, res) {
  if (!methodGuard(req, res)) return;
  const ip = clientIp(req);
  if (!rateLimit(`news:${ip}`, { limit: 8, windowMs: 10 * 60000 }).allowed) {
    return json(res, 429, { error: 'Too many attempts. Please try again shortly.' });
  }

  let body;
  try { body = await readJson(req); }
  catch { return json(res, 400, { error: 'Invalid request.' }); }

  const email = cleanText(body.email, 200).toLowerCase();
  if (!isEmail(email)) return json(res, 400, { error: 'Please enter a valid email address.' });

  const captcha = await verifyTurnstile(body.turnstileToken, ip);
  if (!captcha.ok) return json(res, 400, { error: captcha.error });

  try {
    // Idempotent: repeat sign-ups resolve rather than erroring.
    await admin('newsletter_subscribers?on_conflict=email', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: [{ email }]
    });
  } catch (error) {
    console.error('[newsletter] store failed', error);
    return json(res, 500, { error: 'We could not add you just now. Please try again.' });
  }
  return json(res, 200, { ok: true });
}
