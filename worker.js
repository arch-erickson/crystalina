/* The Worker entry point.
 *
 * Cloudflare has folded Pages into Workers: new projects are created
 * through the Workers flow, which deploys with `wrangler deploy` and whose
 * build token carries Workers permissions rather than Pages ones. Rather
 * than fight that, this serves the same site as a Worker (AD10).
 *
 * Two jobs, in this order:
 *   /api/*   runs the handler for that route
 *   anything else is a static file out of dist/, through the ASSETS binding
 *
 * The handlers in /api are unchanged, and so is functions/_shim.js: a Pages
 * Function receives { request, env } and so does this, so the same adapter
 * works for both. If Cloudflare ever offers the Pages flow again, the files
 * under functions/ still work and this file can go.
 */
import { toPagesFunction } from './functions/_shim.js';
import contact from './api/contact.mjs';
import newsletter from './api/newsletter.mjs';
import createOrder from './api/orders/create.mjs';

/* Exact paths only. A prefix match would route /api/contact-us here too. */
const ROUTES = new Map([
  ['/api/contact', toPagesFunction(contact)],
  ['/api/newsletter', toPagesFunction(newsletter)],
  ['/api/orders/create', toPagesFunction(createOrder)],
]);

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);

    if (pathname.startsWith('/api/')) {
      const route = ROUTES.get(pathname.replace(/\/+$/, '') || pathname);
      if (!route) return json(404, { error: 'Not found.' });
      return route({ request, env, ctx });
    }

    return env.ASSETS.fetch(request);
  },
};
