/* GET /api/analytics?days=30
 *
 * The traffic numbers, read from Cloudflare and handed to the Finance and
 * Analytics view of the admin dashboard.
 *
 * Why this exists at all, when the numbers are already on a page in the
 * Cloudflare dashboard: the owner asked to read them beside the revenue,
 * and a figure nobody opens is a figure nobody uses.
 *
 * Why it is a server route rather than a fetch from the dashboard. The
 * Cloudflare API token that reads this is a real credential: it can read
 * every analytic on the account. It belongs in the Worker's environment
 * with the other secrets and never in a browser, which is the same rule
 * that keeps the service-role key out of there (AD4). The site token in
 * js/main.js is the opposite kind of value, public by design, and the two
 * must not be confused: this route needs the account's API token and the
 * site TAG, neither of which is the beacon token.
 *
 * Who may read it: admin or manager, checked here against user_roles.
 * The dashboards' own gate is browser-side and unproven (U1), so this
 * route does not trust it and makes the check itself.
 *
 * Unconfigured is not an error. Until the owner creates the API token this
 * answers 200 with configured:false, so the panel can say what is missing
 * in a sentence instead of drawing a broken state.
 */
import { json, methodGuard, clientIp, durableRateLimit } from './_lib/http.mjs';
import { admin, userFromToken } from './_lib/supabase.mjs';

const GRAPHQL = 'https://api.cloudflare.com/client/v4/graphql';
const ALLOWED = new Set(['admin', 'manager']);

/* The three values this needs, named here so the failure says which one is
   missing rather than "not configured". */
export const SETTINGS = ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_RUM_SITE_TAG'];

export function missingSettings(env = process.env) {
  return SETTINGS.filter(name => !env[name]);
}

/* A whole number of days, between a day and a quarter. Anything else is
   somebody probing the query string. */
export function daysFrom(value, fallback = 30) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(90, Math.max(1, n));
}

export function rangeFor(days, now = new Date()) {
  const end = new Date(now);
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

/* One query, two groupings: a day at a time for the bars, and the busiest
   paths for the table. count is page views; sum.visits is sessions. */
export const QUERY = `
query Traffic($accountTag: string!, $siteTag: string!, $start: Time!, $end: Time!) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      days: rumPageloadEventsAdaptiveGroups(
        filter: { siteTag: $siteTag, datetime_geq: $start, datetime_leq: $end }
        limit: 100
        orderBy: [date_ASC]
      ) {
        count
        sum { visits }
        dimensions { date }
      }
      pages: rumPageloadEventsAdaptiveGroups(
        filter: { siteTag: $siteTag, datetime_geq: $start, datetime_leq: $end }
        limit: 8
        orderBy: [count_DESC]
      ) {
        count
        sum { visits }
        dimensions { requestPath }
      }
    }
  }
}`;

/* Cloudflare's shape to ours. Written as a pure function because it is the
   part most likely to be quietly wrong, and the part a test can hold. */
export function summarise(payload) {
  const account = payload?.data?.viewer?.accounts?.[0] || {};
  const series = (account.days || []).map(row => ({
    date: row?.dimensions?.date || '',
    views: Number(row?.count || 0),
    visits: Number(row?.sum?.visits || 0),
  }));
  const pages = (account.pages || []).map(row => ({
    path: row?.dimensions?.requestPath || '/',
    views: Number(row?.count || 0),
    visits: Number(row?.sum?.visits || 0),
  }));
  return {
    totals: {
      views: series.reduce((sum, day) => sum + day.views, 0),
      visits: series.reduce((sum, day) => sum + day.visits, 0),
    },
    series,
    pages,
  };
}

async function rolesOf(userId) {
  const rows = await admin(`user_roles?user_id=eq.${encodeURIComponent(userId)}&select=role`);
  return (rows || []).map(row => row.role);
}

export default async function handler(req, res) {
  if (!methodGuard(req, res, 'GET')) return;

  const ip = clientIp(req);
  if (!(await durableRateLimit(`analytics:${ip}`, { limit: 60, windowMs: 10 * 60000 })).allowed) {
    return json(res, 429, { error: 'Too many requests. Wait a minute and try again.' });
  }

  const user = await userFromToken(req.headers.authorization);
  if (!user) return json(res, 401, { error: 'Please sign in.' });

  let roles = [];
  try { roles = await rolesOf(user.id); }
  catch (error) {
    console.error('[analytics] role lookup failed', error);
    return json(res, 500, { error: 'We could not check your access. Please try again.' });
  }
  if (!roles.some(role => ALLOWED.has(role))) {
    return json(res, 403, { error: 'Your account cannot read the traffic figures.' });
  }

  const missing = missingSettings();
  if (missing.length) {
    return json(res, 200, { configured: false, missing });
  }

  const url = new URL(req.url || '/api/analytics', 'https://crystalina.org');
  const days = daysFrom(url.searchParams.get('days'));
  const { start, end } = rangeFor(days);

  let payload;
  try {
    const response = await fetch(GRAPHQL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: QUERY,
        variables: {
          accountTag: process.env.CLOUDFLARE_ACCOUNT_ID,
          siteTag: process.env.CLOUDFLARE_RUM_SITE_TAG,
          start,
          end,
        },
      }),
    });
    payload = await response.json();
    if (!response.ok) throw new Error(`Cloudflare ${response.status}`);
  } catch (error) {
    console.error('[analytics] graphql request failed', error);
    return json(res, 502, { error: 'Cloudflare did not answer. Try again in a minute.' });
  }

  /* GraphQL answers 200 with an errors array, so a failed query looks like
     a success until this line. */
  if (Array.isArray(payload?.errors) && payload.errors.length) {
    console.error('[analytics] graphql errors', JSON.stringify(payload.errors).slice(0, 500));
    return json(res, 502, { error: 'Cloudflare refused that query. The token or the site tag may be wrong.' });
  }

  /* period is the number of days asked for; series is one row per day. They
     were both called days until the spread below quietly kept one of them. */
  return json(res, 200, { configured: true, period: days, range: { start, end }, ...summarise(payload) });
}
