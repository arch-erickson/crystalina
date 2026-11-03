/* GET /api/health
 *
 * The gap this closes: on 2026-11-02 the contact form had been returning
 * 500 since August because environment variables were never set, and
 * nothing anywhere said so. The only way to find out was to submit the
 * form and read a generic apology. Later the same week, setting a single
 * Turnstile key would have refused every submission on the site, and
 * again nothing would have reported it.
 *
 * So: one request that says what this Worker actually has.
 *
 * Two levels, deliberately.
 *
 * Public gets liveness only. Whether the thing is up is not a secret,
 * and an uptime checker needs no more than that.
 *
 * Detail needs HEALTH_KEY, passed as `?key=`. It reports which
 * configuration is present and whether Supabase answers. That is mild
 * reconnaissance, and this repository has already been published once by
 * accident, so it is behind a key rather than open. If HEALTH_KEY is not
 * set the detailed view does not exist at all, which is the right
 * default for something nobody has deliberately turned on.
 *
 * It reports presence, never values. No secret is ever in a response,
 * including a truncated one: a prefix is still a prefix.
 */
import { json } from './_lib/http.mjs';

/* Names only. The value is never read into the response. */
const EXPECTED = [
  ['SUPABASE_URL', 'the database'],
  ['SUPABASE_PUBLISHABLE_KEY', 'browser reads under row level security'],
  ['SUPABASE_SERVICE_ROLE_KEY', 'privileged writes from this Worker'],
  ['PUBLIC_SITE_URL', 'links in emails and Stripe redirects'],
  ['RESEND_API_KEY', 'sending email'],
  ['EMAIL_FROM', 'the address email comes from'],
  ['CONTACT_INBOX', 'where enquiries land'],
  ['TURNSTILE_SITE_KEY', 'the captcha widget on the forms'],
  ['TURNSTILE_SECRET_KEY', 'verifying captcha tokens'],
  ['STRIPE_SECRET_KEY', 'creating a checkout session'],
  ['STRIPE_WEBHOOK_SECRET', 'trusting what Stripe tells us'],
];

/* Combinations that are individually fine and together are a problem. */
function warnings(present) {
  const out = [];
  if (present.TURNSTILE_SECRET_KEY && !present.TURNSTILE_SITE_KEY) {
    out.push('Turnstile secret is set without a site key. No page can render a '
      + 'widget, so no token can exist. Verification is being skipped rather '
      + 'than refusing every submission.');
  }
  if (present.STRIPE_SECRET_KEY && !present.STRIPE_WEBHOOK_SECRET) {
    out.push('Stripe can take a payment but the webhook cannot be trusted, so '
      + 'no order would ever be marked paid.');
  }
  if (present.STRIPE_WEBHOOK_SECRET && !present.STRIPE_SECRET_KEY) {
    out.push('A Stripe webhook secret is set but no secret key, so no checkout '
      + 'session can be created.');
  }
  if (!present.SUPABASE_SERVICE_ROLE_KEY) {
    out.push('No service role key, so every write from this Worker will fail: '
      + 'contact, newsletter and orders all return 500.');
  }
  if (present.RESEND_API_KEY && !present.EMAIL_FROM) {
    out.push('Resend is configured with no from address, so sending will fail.');
  }
  return out;
}

async function databaseReachable() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { reachable: false, reason: 'not configured' };
  try {
    const started = Date.now();
    const res = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    return { reachable: res.ok, status: res.status, ms: Date.now() - started };
  } catch (error) {
    return { reachable: false, reason: String(error.message || error) };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { error: 'Method not allowed.' });
  }

  const healthKey = process.env.HEALTH_KEY;
  const offered = new URL(req.url, 'https://crystalina.org').searchParams.get('key');

  /* Liveness. Always public, always cheap, nothing revealed. */
  if (!healthKey || !offered || offered !== healthKey) {
    return json(res, 200, { ok: true, service: 'crystalina-worker' });
  }

  const present = {};
  for (const [name] of EXPECTED) present[name] = Boolean(process.env[name]);

  const database = await databaseReachable();
  const problems = warnings(present);

  return json(res, 200, {
    ok: database.reachable && problems.length === 0,
    service: 'crystalina-worker',
    checkedAt: new Date().toISOString(),
    database,
    configuration: EXPECTED.map(([name, purpose]) => ({
      name, purpose, present: present[name],
    })),
    warnings: problems,
  });
}
