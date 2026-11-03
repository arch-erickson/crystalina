/* The one data list behind every diagram, every detail panel and every
 * generated table in the blueprint.
 *
 * Nothing in docs/diagrams/*.svg or docs/blueprint.* is drawn or written by
 * hand. Edit this file, run
 *
 *     npm run docs
 *
 * and every drawing, every panel and the contact sheet at
 * docs/diagrams/index.html is rebuilt.
 *
 * Status words are the five and nothing else:
 *   Implemented  built, checked, doing its job
 *   Partial      some of it is built; the rest is named and planned
 *   Missing      not started
 *   Refactor     exists, has to be rebuilt somewhere else before it counts
 *   Post-MVP     deliberately not now
 *
 * Three fields carry the detail panels, and they are the reason this file is
 * long:
 *   what   what the thing is, in plain words, to someone who did not build it
 *   why    why it carries the status it carries
 *   rel    other nodes worth jumping to, as namespaced ids
 *
 * Dependencies are never written out in prose. Every "depends on" and
 * "depended on by" list in the document is derived from the edge lists here
 * by scripts/lib/graph.mjs, so the two cannot drift apart.
 *
 * Every `verified` date is the day someone actually checked, not the day the
 * line was written. If a date here is more than about a week old, re-check
 * before trusting it.
 */

export const meta = {
  project: 'Crystalina',
  tagline: 'Pure Water. Pure Life.',
  domain: 'crystalina.org',
  asOf: '2026-11-02',
  stateVerified: '2026-11-02',
  /* Separate rows, because they were checked by different means and one is
     much older. Never collapse them into a single reassuring number. */
  verified: {
    hosting: {
      date: '2026-11-02',
      how: 'Requested all three hosts. crystalina.crystalina.workers.dev answers 200 with Server: cloudflare. crystalina.org answers 200 with Server: GitHub.com, so the domain has not moved. crystalina.vercel.app answers 404 DEPLOYMENT_NOT_FOUND, so the Vercel project is gone.',
    },
    boundary: {
      date: '2026-11-02',
      how: 'Probed each route on the Worker. GET returns 405 with a JSON method guard; POST with an empty body returns 400 from the validator on /api/contact and /api/newsletter and 401 on /api/orders/create; an unknown /api path returns 404 rather than a static file. The owner reports a real submission returning 200 on both forms the same day. The probe proves routing, guards and validation, and stops before Supabase, so it does not by itself prove the keys are set.',
    },
    tests: {
      date: '2026-11-02',
      how: 'npm test: 35 tests over 6 files, 35 pass, under a second.',
    },
    catalogue: {
      date: '2026-11-02',
      how: 'Read the seed migration. 17 published rows: four systems carrying stock 1, nine replacement filters and four filter bundles carrying stock 0. No faucet rows, and product_stage_options is created and never inserted into.',
    },
    repository: {
      date: '2026-11-02',
      how: 'GitHub API: arch-erickson/crystalina is public. dist/ holds 128 files and the allow-list check finds no .sql, test or internal .md file in it.',
    },
    database: {
      date: '2026-08-31',
      how: '12 migrations, 23 tables, row level security on every table, nine distinct security definer functions. Checked against the live project then and not since, so the live rows may have moved away from the migrations.',
    },
  },
  shape: 'shop',
  target: 'One Cloudflare Worker serving dist and routing /api/*, with Supabase kept for data and identity',
};

/* ------------------------------------------------------------------ *
 * 0. The findings. The five things that decide what happens next.
 * Severity is Critical, High, Medium or Low, and position in this list
 * is the order to deal with them in.
 * ------------------------------------------------------------------ */

export const findings = [
  {
    id: 'F1', severity: 'High', icon: 'card', family: 'green',
    label: 'Nothing takes payment',
    detail: 'Zero Stripe integration anywhere',
    status: 'Missing',
    what: 'There is no payment provider in the project. A repository-wide search finds the two secret names in .env.example, one unused stripe_payment_intent_id column and a handful of mentions in prose. There is no API route, no webhook and no client library. The checkout submit button is a static disabled attribute reading "Checkout unavailable", and the handler behind it calls a stub that returns null.',
    why: 'Missing, and deliberately unreachable. The shop cannot open until this exists, which makes it the single largest remaining piece of work and the reason the launch phase sits where it does.',
    fixedBy: ['phase:P3'],
    rel: ['flow:payment', 'risk:R2', 'ad:AD4'],
  },
  {
    id: 'F2', severity: 'High', icon: 'box', family: 'blue',
    label: 'The catalogue is schema-complete and data-empty',
    detail: 'Thirteen of seventeen rows carry stock 0',
    status: 'Partial',
    what: 'The seed migration publishes seventeen products: four systems at stock 1, and nine replacement filters plus four filter bundles at stock 0. product_stage_options is created and never filled, so the five, six and seven stage choice never renders. No product has product_kind faucet, so the faucet upgrade control has nothing to offer and never appears.',
    why: 'Partial. Every shape exists in the database and most of the shelf reads as sold out. Two of the three controls on a product page are built, wired and invisible for want of rows.',
    fixedBy: ['phase:P7'],
    rel: ['table:products', 'table:product_stage_options', 'risk:R9'],
  },
  {
    id: 'F3', severity: 'High', icon: 'alert', family: 'rose',
    label: 'One dashboard interpolates record text unescaped',
    detail: 'js/admin.js, about thirty sites',
    status: 'Partial',
    what: 'escapeHTML is defined once in js/main.js and used 37 times in js/admin.js, and about thirty other interpolations in the same file put record text straight into innerHTML: product names, order statuses, job addresses, campaign names, role names. Checked 2026-11-02: js/manager.js, js/sales.js, js/technician.js, js/technician-route.js, js/admin-schedule.js and js/staff-schedule.js all escape their record text, so the earlier claim that all four dashboards were unescaped was wrong.',
    why: 'Partial, and narrower than it was described as. One file is the whole finding. Row level security still decides who can read a row; this decides what happens to a row once it is on a staff screen.',
    fixedBy: ['phase:P6'],
    rel: ['risk:R1', 'threat:xss', 'page:admin'],
  },
  {
    id: 'F4', severity: 'High', icon: 'lock', family: 'violet',
    label: 'The gate in front of every private page is localStorage',
    detail: 'Store.currentUser(), not a session',
    status: 'Refactor',
    what: 'The five staff pages and /account/ decide what to show by reading Store.currentUser() out of localStorage and checking a roles array on it. js/auth.js, which holds the real Supabase session, is loaded on the staff pages for sign-out, the role switcher and the staff directory only, and /account/ does not load it at all. Row level security still refuses the data, so the exposure is what the page draws before any query returns, not the rows themselves.',
    why: 'Refactor. The protection that matters is in the database and is in place. The gate in front of it is markup, and markup is a suggestion. Nobody has yet signed in as an ordinary customer and looked, which is U1.',
    fixedBy: ['phase:P4'],
    rel: ['unknown:U1', 'risk:R4', 'flow:identity'],
  },
  {
    id: 'F5', severity: 'Medium', icon: 'tag', family: 'amber',
    label: 'The accounts that would bring people in are held and unconnected',
    detail: 'No feed, no analytics, no attribution',
    status: 'Missing',
    what: 'The domain, Google Search Console, the Meta Business account and the WhatsApp number all exist and have history. There is no product feed for Google Merchant Center or the Meta catalogue, no analytics of any kind, and no pixel or Conversions API. Seventeen products with no feed is free traffic left on the table, and a pixel added after a campaign starts cannot report on the days before it.',
    why: 'Missing. None of it blocks launch and all of it is cheaper to decide now than to retrofit. A pixel also turns the cookie banner into a real question, which Cloudflare Web Analytics on its own does not.',
    rel: ['asset:merchant', 'asset:pixel', 'asset:analytics'],
  },
];

/* ------------------------------------------------------------------ *
 * 1 and 2. Architecture, as it is today and as it is being moved to.
 * ------------------------------------------------------------------ */

export const architecture = {
  now: {
    title: 'Architecture today',
    note: 'The Worker is live and answering, and the domain still is not pointed at it. crystalina.org is served by GitHub Pages from the repository root; the Worker at crystalina.crystalina.workers.dev serves dist and runs the three API routes. One address has the server code and no visitors; the other has the visitors and no server. Verified 2026-11-02.',
    zones: [
      {
        id: 'visitor', col: 0, family: 'blue',
        label: 'Who is asking',
        nodes: [
          {
            id: 'customer', family: 'blue', icon: 'person', label: 'Customer browser', detail: 'Pages, cart in localStorage', status: 'Implemented',
            what: 'An ordinary visitor on a phone or a laptop. The cart lives in localStorage, products are read straight from Supabase with the publishable key, and nothing about a price is decided here.',
            why: 'Implemented. Every storefront page renders and hydrates. What a visitor cannot do is pay.',
            rel: ['finding:F1', 'page:shop'],
          },
          {
            id: 'staff', family: 'violet', icon: 'people', label: 'Staff browser', detail: 'Admin, manager, sales, technician', status: 'Refactor',
            what: 'One of five private pages opened by a member of staff. Which page a person may open is decided by a roles array read out of localStorage, not by a session.',
            why: 'Refactor. The data is protected by row level security; the gate in front of it is markup. See F4 and U1.',
            rel: ['finding:F4', 'unknown:U1', 'page:admin'],
          },
        ],
      },
      {
        id: 'serving', col: 1, family: 'amber',
        label: 'Serving today',
        nodes: [
          {
            id: 'worker', family: 'amber', icon: 'bolt', label: 'Cloudflare Worker', detail: 'crystalina.crystalina.workers.dev', status: 'Implemented',
            what: 'worker.js routes the three /api paths to their handlers and hands everything else to the ASSETS binding, which serves dist. Six tests pin the route table down.',
            why: 'Implemented, and verified on 2026-11-02: method guards answer 405, validators answer 400, an unknown /api path answers 404 rather than a static file. This is the first time the server boundary has run anywhere.',
            rel: ['ad:AD10', 'now:pages', 'phase:P5'],
          },
          {
            id: 'pages', family: 'amber', icon: 'server', label: 'GitHub Pages', detail: 'crystalina.org, static files only', status: 'Refactor',
            what: 'The live domain, still served by GitHub Pages out of the repository root. A static host has no server, so the three API routes do not exist at this address at all.',
            why: 'Refactor. It is what a visitor reaches today, and it is the half that cannot run code. It is retired by the DNS cutover, not before.',
            rel: ['now:dns', 'phase:P5', 'risk:R5'],
          },
          {
            id: 'dns', family: 'amber', icon: 'globe', label: 'Squarespace DNS', detail: 'Four GitHub Pages A records', status: 'Refactor',
            what: 'The crystalina.org zone, hosted at the registrar, with four A records pointing at GitHub Pages. The same reseller account holds the Google Workspace subscription.',
            why: 'Refactor. The zone has to be on Cloudflare before Access, WAF rate limiting or Web Analytics can apply to the site. Nothing has moved yet.',
            rel: ['phase:P5', 'unknown:U8', 'target:cfdns'],
          },
        ],
      },
      {
        id: 'data', col: 2, family: 'teal',
        label: 'Data and identity',
        nodes: [
          {
            id: 'pg', family: 'teal', icon: 'database', label: 'Supabase Postgres', detail: '23 tables, RLS on, 12 migrations', status: 'Implemented',
            what: 'One Postgres database holding the catalogue, orders, inbound forms, published page content and ten workforce tables, with row level security on every one of them and nine security definer functions in front of the privileged writes.',
            why: 'Implemented, and the most finished thing in the project. Last checked against the live project on 2026-08-31, which makes it the oldest row in the verified table.',
            rel: ['ad:AD3', 'table:products', 'table:orders'],
          },
          {
            id: 'auth', family: 'violet', icon: 'key', label: 'Supabase Auth', detail: 'Email code or Google, JWT, user_roles', status: 'Implemented',
            what: 'Passwordless sign-in. A visitor either receives a code by email or continues with Google; both return a real Supabase session and a JWT that every query carries. There is no password anywhere in the project, and no password column.',
            why: 'Implemented as of 2026-11-02: the Google provider is enabled and the button works. What is unfinished is not the sign-in, it is the six pages that still read localStorage instead of the session.',
            rel: ['finding:F4', 'flow:identity', 'page:signin'],
          },
          {
            id: 'storage', family: 'teal', icon: 'image', label: 'Supabase Storage', detail: 'site-media bucket, public reads', status: 'Implemented',
            what: 'One bucket holding the images staff upload from the admin console. Reads are public by URL; writes require a staff session.',
            why: 'Implemented. Moving the originals to R2 is deliberately postponed until Storage egress shows up on a bill.',
            rel: ['target:cfr2', 'flow:publish'],
          },
        ],
      },
      {
        id: 'third', col: 2, family: 'slate',
        label: 'Third parties',
        nodes: [
          {
            id: 'resend', family: 'blue', icon: 'mail', label: 'Resend', detail: 'Transactional email', status: 'Partial',
            what: 'The sender for contact notifications and, later, order confirmations. The code is written and never blocks: if the key is unset or the send fails, the row is already written and the submission is not lost.',
            why: 'Partial. The sending domain has not been verified and info@crystalina.org is not currently receiving mail, so the half of this that matters is unproven. See U3 and U8.',
            rel: ['unknown:U3', 'unknown:U8', 'flow:inbound'],
          },
          {
            id: 'turnstile', family: 'rose', icon: 'shield', label: 'Turnstile', detail: 'Server verification only', status: 'Partial',
            what: 'Cloudflare\'s captcha. The server half is written: with a secret set, a request without a valid token is refused. With no secret set, verification is skipped so the endpoints stay usable.',
            why: 'Partial, and the wrong half is done. No page renders a widget, and contact/index.html reads a token from a widget that does not exist. Setting the secret today would therefore break the contact form rather than protect it.',
            rel: ['threat:spam', 'phase:P6', 'flow:inbound'],
          },
          {
            id: 'stripe', family: 'green', icon: 'card', label: 'Stripe', detail: 'Payment', status: 'Missing',
            what: 'The payment provider, chosen and not built. Nothing of it exists in the codebase.',
            why: 'Missing. It is the one piece between a working order path and an open shop.',
            rel: ['finding:F1', 'phase:P3', 'flow:payment'],
          },
        ],
      },
    ],
    edges: [
      { from: 'customer', to: 'pages', label: 'crystalina.org' },
      { from: 'staff', to: 'pages', label: 'dashboards' },
      { from: 'customer', to: 'worker', label: 'workers.dev only' },
      { from: 'dns', to: 'pages', label: 'A records', tone: 'mute', dash: '4 3' },
      { from: 'pages', to: 'pg', label: 'publishable key, RLS reads' },
      { from: 'pages', to: 'auth', label: 'sign in' },
      { from: 'pages', to: 'storage', label: 'images' },
      { from: 'worker', to: 'pg', label: 'service role writes', tone: 'amber' },
      { from: 'worker', to: 'resend', label: 'send', tone: 'amber' },
      { from: 'worker', to: 'turnstile', label: 'verify', tone: 'amber' },
    ],
  },

  target: {
    title: 'Architecture after the DNS cutover',
    note: 'One platform serves the site and the server boundary, and one DNS zone sits in front of both. Supabase is kept: the schema, the row level security and the server-authoritative order function already exist and work, and moving them to D1 would be a rewrite with nothing to show for it (AD3). Turnstile is already the captcha, so it comes home to the same account.',
    zones: [
      {
        id: 'visitor', col: 0, family: 'blue',
        label: 'Who is asking',
        nodes: [
          {
            id: 'customer', family: 'blue', icon: 'person', label: 'Customer browser', detail: 'Pages, cart in localStorage', status: 'Implemented',
            what: 'The same visitor, arriving at crystalina.org instead of a workers.dev address.',
            why: 'Implemented. Nothing about the browser changes in the cutover.',
            rel: ['now:customer'],
          },
          {
            id: 'staff', family: 'violet', icon: 'people', label: 'Staff browser', detail: 'Admin, manager, sales, technician', status: 'Refactor',
            what: 'The same five private pages, with the gate moved from a roles array in localStorage to the session the database already trusts.',
            why: 'Refactor, and the work is phase 4 and phase 6 rather than the cutover.',
            rel: ['now:staff', 'phase:P4'],
          },
        ],
      },
      {
        id: 'cf', col: 1, family: 'amber',
        label: 'Cloudflare (one account)',
        nodes: [
          {
            id: 'cfdns', family: 'amber', icon: 'globe', label: 'Cloudflare DNS', detail: 'crystalina.org zone, proxied', status: 'Missing',
            what: 'The zone moved from the registrar to Cloudflare, so that everything below it can apply to the real domain rather than to a workers.dev address.',
            why: 'Missing. It is a nameserver change the owner makes, and it is the single step that turns the live Worker into the live site. It also has to not break Google Workspace, which is U8.',
            rel: ['phase:P5', 'now:dns', 'unknown:U8'],
          },
          {
            id: 'cfassets', family: 'amber', icon: 'cloud', label: 'Static assets', detail: 'dist, served by the ASSETS binding', status: 'Implemented',
            what: 'Every page, stylesheet, script and image, copied into dist by an explicit allow-list and served by the Worker\'s assets binding.',
            why: 'Implemented and live on the workers.dev address. What is missing is the domain in front of it.',
            rel: ['ad:AD7', 'ad:AD10', 'now:worker'],
          },
          {
            id: 'cffn', family: 'amber', icon: 'bolt', label: 'Worker routes', detail: 'worker.js routes /api/*', status: 'Implemented',
            what: 'A route table of three: /api/contact, /api/newsletter and /api/orders/create. Exact paths only, so a prefix cannot be captured by accident, and an unknown /api path is a 404 rather than a static file.',
            why: 'Implemented and verified on 2026-11-02. Payment adds two more lines to the same table.',
            rel: ['ad:AD10', 'phase:P3', 'now:worker'],
          },
          {
            id: 'cfts', family: 'rose', icon: 'shield', label: 'Turnstile', detail: 'Widget plus server verification', status: 'Partial',
            what: 'The captcha, with the widget finally rendered on the contact, newsletter and checkout forms so that there is a token for the server half to check.',
            why: 'Partial. The server side is done and the widget is not, which is the wrong way round: the secret cannot be set until the widget exists.',
            rel: ['now:turnstile', 'phase:P6', 'threat:spam'],
          },
          {
            id: 'cfaccess', family: 'violet', icon: 'lock', label: 'Access', detail: 'Preview and staging gate', status: 'Missing',
            what: 'A sign-in wall in front of any non-production address, so a half-finished copy cannot be indexed or found.',
            why: 'Missing. Free, quick, and worth having before the first preview is shared with anyone.',
            rel: ['phase:P1', 'stage:preview'],
          },
          {
            id: 'cfwaf', family: 'rose', icon: 'filter', label: 'WAF rate limiting', detail: 'Durable limit on /api/*', status: 'Missing',
            what: 'A rate limit applied at the edge, where the count survives, replacing the in-process Map that each Worker instance holds on its own.',
            why: 'Missing, and an hour of work. It cannot be fixed in application code: a counter inside an instance does not outlive the instance.',
            rel: ['risk:R3', 'phase:P6', 'threat:spam'],
          },
          {
            id: 'cfanalytics', family: 'blue', icon: 'chart', label: 'Web Analytics', detail: 'No cookie, no consent banner', status: 'Missing',
            what: 'Who arrives and from where, measured at the edge with no cookie and therefore no consent banner.',
            why: 'Missing. It needs the zone on Cloudflare first, so it follows the cutover.',
            rel: ['asset:analytics', 'phase:P5'],
          },
          {
            id: 'cfcron', family: 'slate', icon: 'clock', label: 'Cron Triggers', detail: 'Abandoned cart, expiry, reconciliation', status: 'Post-MVP',
            what: 'Scheduled work: chasing an abandoned cart, expiring a stale reservation, reconciling a day of payments against orders.',
            why: 'Post-MVP by decision. There is nothing to reconcile until payment is live and a month of real orders exists.',
            rel: ['trigger:cron', 'page:sales'],
          },
          {
            id: 'cfr2', family: 'slate', icon: 'box', label: 'R2', detail: 'Image originals', status: 'Post-MVP',
            what: 'Object storage for image originals, in front of or instead of the Supabase bucket.',
            why: 'Post-MVP by decision. Only worth it when Storage egress shows up on a bill or image delivery becomes the slowest thing on a product page.',
            rel: ['trigger:r2', 'now:storage'],
          },
        ],
      },
      {
        id: 'data', col: 2, family: 'teal',
        label: 'Data and identity (kept)',
        nodes: [
          {
            id: 'pg', family: 'teal', icon: 'database', label: 'Supabase Postgres', detail: 'RLS, create_order, catalog RPCs', status: 'Implemented',
            what: 'Unchanged by the move. The serving layer is what is moving.',
            why: 'Implemented. See AD3 for why it is not moving to D1.',
            rel: ['ad:AD3', 'now:pg'],
          },
          {
            id: 'auth', family: 'violet', icon: 'key', label: 'Supabase Auth', detail: 'Email code or Google, JWT, user_roles', status: 'Implemented',
            what: 'Unchanged, except that the redirect allow-list has to learn the new domain on the day the DNS moves.',
            why: 'Implemented. The redirect list is a line on the cutover checklist, and forgetting it breaks sign-in on the new domain only.',
            rel: ['now:auth', 'phase:P5'],
          },
          {
            id: 'storage', family: 'teal', icon: 'image', label: 'Supabase Storage', detail: 'site-media bucket', status: 'Implemented',
            what: 'Unchanged.',
            why: 'Implemented.',
            rel: ['now:storage'],
          },
        ],
      },
      {
        id: 'third', col: 2, family: 'slate',
        label: 'Third parties',
        nodes: [
          {
            id: 'stripe', family: 'green', icon: 'card', label: 'Stripe', detail: 'Checkout Session plus webhook', status: 'Missing',
            what: 'Two more routes on the same table: one that creates a Checkout Session from server-repriced lines, and one that receives the webhook and is the only thing allowed to mark an order paid.',
            why: 'Missing, and it blocks launch. See AD4 for the shape it has to take.',
            rel: ['finding:F1', 'phase:P3', 'flow:payment'],
          },
          {
            id: 'resend', family: 'blue', icon: 'mail', label: 'Resend', detail: 'Transactional email', status: 'Partial',
            what: 'Unchanged, and needing a verified sending domain before any of it is believable.',
            why: 'Partial. See U3 and U8.',
            rel: ['now:resend', 'unknown:U3'],
          },
          {
            id: 'sentry', family: 'rose', icon: 'alert', label: 'Error monitoring', detail: 'Functions and browser', status: 'Missing',
            what: 'Somewhere for an exception to go other than a console nobody is reading.',
            why: 'Missing. It belongs with backups in phase 9, before launch rather than after the first incident.',
            rel: ['phase:P9', 'risk:R7'],
          },
        ],
      },
    ],
    edges: [
      { from: 'customer', to: 'cfdns', label: 'crystalina.org' },
      { from: 'staff', to: 'cfdns', label: 'dashboards' },
      { from: 'cfdns', to: 'cfassets', label: 'proxied' },
      { from: 'cfassets', to: 'cffn', label: '/api/*' },
      { from: 'cfwaf', to: 'cffn', label: 'rate limit', tone: 'mute', dash: '4 3' },
      { from: 'cfaccess', to: 'cfassets', label: 'preview only', tone: 'mute', dash: '4 3' },
      { from: 'cfts', to: 'cffn', label: 'token check', tone: 'mute' },
      { from: 'cfassets', to: 'pg', label: 'publishable key, RLS reads' },
      { from: 'cfassets', to: 'auth', label: 'sign in' },
      { from: 'cfassets', to: 'storage', label: 'images' },
      { from: 'cffn', to: 'pg', label: 'service role, RPCs' },
      { from: 'cffn', to: 'stripe', label: 'session, webhook' },
      { from: 'cffn', to: 'resend', label: 'send' },
      { from: 'cfcron', to: 'pg', label: 'scheduled work', tone: 'mute', dash: '4 3' },
    ],
  },
};

/* ------------------------------------------------------------------ *
 * 2b. How a request actually travels, now that the site is a Worker.
 * One decision per step, in the order the Worker makes them.
 * ------------------------------------------------------------------ */

export const requestPath = {
  note: 'The order the Worker decides things in, for one request. Everything that is not an /api path is a file, and the route table is exact, so a path that looks like an endpoint and is not gets a 404 rather than a page. Verified against worker.js and its six tests on 2026-11-02.',
  steps: [
    {
      id: 'rq-arrive', icon: 'globe', family: 'blue', label: 'A request arrives', detail: 'crystalina.crystalina.workers.dev',
      what: 'One fetch, with a URL, a method and headers. Today it arrives at the workers.dev address, because the domain still points at GitHub Pages.',
      why: 'Implemented', status: 'Implemented', rel: ['now:worker', 'phase:P5'],
    },
    {
      id: 'rq-split', icon: 'branch', family: 'amber', label: 'Is the path under /api/?', detail: 'pathname.startsWith("/api/")',
      what: 'The only branch in the Worker. Yes goes to the route table; no goes to the assets binding. There is no third case.',
      why: 'Implemented', status: 'Implemented', rel: ['ad:AD10'],
    },
    {
      id: 'rq-asset', icon: 'page', family: 'amber', label: 'Served out of dist', detail: 'ASSETS.fetch(request)',
      what: 'The assets binding answers from dist, with auto-trailing-slash handling so /shop and /shop/ both find the folder. dist is built from an explicit allow-list, so the repository is not published with the site.',
      why: 'Implemented', status: 'Implemented', rel: ['ad:AD7', 'target:cfassets'],
    },
    {
      id: 'rq-route', icon: 'filter', family: 'amber', label: 'Exact match in the route table', detail: 'three entries, trailing slash trimmed',
      what: 'A Map of three exact paths. A prefix of a real route does not match it, and an unknown /api path returns a JSON 404 instead of falling through to a file.',
      why: 'Implemented', status: 'Implemented', rel: ['target:cffn'],
    },
    {
      id: 'rq-shim', icon: 'layers', family: 'violet', label: 'The shim adapts the handler', detail: 'functions/_shim.js',
      what: 'The handlers in api/ are written in the Node request and response style. One adapter turns { request, env } into that shape and the handler\'s reply back into a Response, which is why a Pages Function and a Worker can run the same file. Nine tests cover it.',
      why: 'Implemented', status: 'Implemented', rel: ['ad:AD2', 'ad:AD10'],
    },
    {
      id: 'rq-guard', icon: 'shield', family: 'rose', label: 'Method, rate limit, body cap', detail: '405, 429, 400',
      what: 'The method guard answers 405 before the body is read. The in-process rate limit allows five to ten requests per ten minutes per IP. The body is capped before it is parsed.',
      why: 'Partial: the rate limit does not survive the instance that holds it, which is R3.',
      status: 'Partial', rel: ['risk:R3', 'target:cfwaf'],
    },
    {
      id: 'rq-validate', icon: 'check', family: 'rose', label: 'Clean and validate every field', detail: '400 with a readable message',
      what: 'Every field is trimmed and capped to a length, the email is checked, the topic has to be one of seven. Verified on 2026-11-02: an empty body returns "Please include your name and a message."',
      why: 'Implemented', status: 'Implemented', rel: ['flow:inbound'],
    },
    {
      id: 'rq-captcha', icon: 'lock', family: 'rose', label: 'Verify the Turnstile token', detail: 'skipped while the secret is unset',
      what: 'With a secret set, a missing or bad token is a 400. With no secret set, verification is skipped so the endpoints stay usable.',
      why: 'Partial, and in the worse-than-absent state: no page renders a widget, so setting the secret would refuse every real submission.',
      status: 'Partial', rel: ['now:turnstile', 'threat:spam'],
    },
    {
      id: 'rq-write', icon: 'database', family: 'teal', label: 'Write with the service role', detail: 'or call create_order as the user',
      what: 'An inbound form inserts with the service role. An order calls create_order as the signed-in user, which reprices every line, checks stock and decrements it in one transaction. The browser never sends money.',
      why: 'Implemented', status: 'Implemented', rel: ['ad:AD4', 'table:orders'],
    },
    {
      id: 'rq-notify', icon: 'mail', family: 'blue', label: 'Send the email, and never gate on it', detail: 'Resend',
      what: 'The row is written first. If the send fails or the key is unset, the failure is logged and the caller still gets a 200, because a lost enquiry is worse than a missing notification.',
      why: 'Partial: the sending domain is unverified and the inbox is not receiving mail. See U3 and U8.',
      status: 'Partial', rel: ['now:resend', 'unknown:U8'],
    },
  ],
};

/* ------------------------------------------------------------------ *
 * 3. What the owner already holds.
 *
 * Crystalina is not a new project, so most of the "go and create an
 * account" work is already done. What matters is the second column: an
 * account that exists but is not connected to the shop is doing nothing.
 * ------------------------------------------------------------------ */

export const assets = {
  note: 'Held already, so no phase asks for them. The question each one answers is not "do we have it" but "is it wired to the site, and does the move break it".',
  groups: [
    {
      id: 'identityAssets', family: 'blue', label: 'Domain and search', col: 0,
      items: [
        {
          id: 'domain', icon: 'globe', label: 'crystalina.org', detail: 'Owned. DNS at Squarespace today',
          wired: 'Partial',
          what: 'The domain, with its zone at the registrar and four A records pointing at GitHub Pages.',
          why: 'Partial. It resolves and serves the old copy. The zone moves to Cloudflare in phase 5; the registrar can stay where it is.',
          rel: ['now:dns', 'phase:P5', 'unknown:U8'],
        },
        {
          id: 'gsc', icon: 'search', label: 'Google Search Console', detail: 'Verified by a file at the site root',
          wired: 'Implemented',
          what: 'The property is verified by googlea4ca9585bd44aaf9.html, 53 bytes, served from the root. It is named in the publish allow-list and present in dist, checked 2026-11-02.',
          why: 'Implemented. Keep that file served at the root or verification lapses silently on the new host. Once the zone is on Cloudflare, adding the DNS TXT method as a second, host-independent proof costs nothing.',
          rel: ['ad:AD7', 'asset:sitemap'],
        },
        {
          id: 'sitemap', icon: 'page', label: 'sitemap.xml and robots.txt', detail: 'Seven URLs, no dates',
          wired: 'Partial',
          what: 'Seven URLs with changefreq and priority and no lastmod on any of them. /product/, /checkout/ and /account/ are absent, so seven of sixteen published directories are listed. robots.txt allows everything and names the sitemap; there is no Disallow, so the staff pages are crawlable as far as it is concerned.',
          why: 'Partial. Worth fixing in the same change as the cutover, when the URLs change anyway.',
          rel: ['asset:gsc', 'phase:P5'],
        },
        {
          id: 'merchant', icon: 'tag', label: 'Google Merchant Center', detail: 'Product feed for free listings',
          wired: 'Missing',
          what: 'The feed that puts products into Google Shopping\'s free listings. One feed would serve the Meta catalogue as well.',
          why: 'Missing. Seventeen products with no feed is free traffic left on the table.',
          rel: ['finding:F5', 'asset:metacat'],
        },
        {
          id: 'analytics', icon: 'chart', label: 'Analytics', detail: 'Who arrives, and from where',
          wired: 'Missing',
          what: 'Nothing measures traffic today. Cloudflare Web Analytics is the choice: no cookie, so no consent banner.',
          why: 'Missing. It needs the zone on Cloudflare, so it follows the cutover.',
          rel: ['target:cfanalytics', 'finding:F5'],
        },
      ],
    },
    {
      id: 'metaAssets', family: 'violet', label: 'Meta and messaging', col: 1,
      items: [
        {
          id: 'metabiz', icon: 'layers', label: 'Meta Business Account', detail: 'Holds the Facebook page and Instagram',
          wired: 'Partial',
          what: 'The account that owns the Facebook page and the Instagram account, and would own a catalogue and a pixel.',
          why: 'Partial. The account exists; nothing on the site talks to it.',
          rel: ['asset:pixel', 'asset:metacat'],
        },
        {
          id: 'social', icon: 'link', label: 'Four social profiles', detail: 'Instagram, X, Facebook, LinkedIn',
          wired: 'Implemented',
          what: 'Instagram and X at @crystalinawater, a Facebook page, and a LinkedIn company page. The footer renders five icons, the fifth being WhatsApp; the schema.org sameAs list on the home page names the four profiles only.',
          why: 'Implemented. The footer is built by renderFooter in js/main.js from one SOCIALS array, so the five icons are one definition. The sameAs list in index.html is the second copy.',
          rel: ['def:social', 'asset:whatsapp'],
        },
        {
          id: 'pixel', icon: 'eye', label: 'Meta Pixel or Conversions API', detail: 'Attribution for anything paid',
          wired: 'Missing',
          what: 'The measurement that tells you whether an ad worked.',
          why: 'Missing. Decide before spending on ads, not after: a pixel cannot report on the days before it existed, and it also makes the cookie banner a real question.',
          rel: ['trigger:pixel', 'finding:F5'],
        },
        {
          id: 'metacat', icon: 'tag', label: 'Meta product catalog', detail: 'Shopping tags on Instagram and Facebook',
          wired: 'Missing',
          what: 'The catalogue behind a shopping tag on a post.',
          why: 'Missing. The same feed as Merchant Center would serve both.',
          rel: ['asset:merchant'],
        },
      ],
    },
    {
      id: 'contactAssets', family: 'green', label: 'How a customer reaches a human', col: 2,
      items: [
        {
          id: 'whatsapp', icon: 'chat', label: 'WhatsApp (917) 809-4803', detail: 'wa.me/19178094803',
          wired: 'Implemented',
          what: 'A plain wa.me link, in the footer, in the hero and as a floating button on every storefront page.',
          why: 'Implemented, and unaffected by hosting: it is a link to a third party, so the cutover cannot break it.',
          rel: ['asset:wabiz', 'asset:phone'],
        },
        {
          id: 'wabiz', icon: 'chat', label: 'WhatsApp Business', detail: 'Catalog, away messages, several agents',
          wired: 'Missing',
          what: 'The business app, which adds a catalogue, away messages and more than one agent on the same number.',
          why: 'Missing. A wa.me link is not the Business app. Worth it the week after launch.',
          rel: ['asset:whatsapp'],
        },
        {
          id: 'inbox', icon: 'mail', label: 'info@crystalina.org', detail: 'Where the contact form lands',
          wired: 'Missing',
          what: 'The inbox the contact form notifies. Google Workspace on the domain is suspended behind a reseller lock, so mail to this address is not being received.',
          why: 'Missing as of 2026-11-02, and it was Partial before. The form still writes its row, so no enquiry is lost, but nobody is told one arrived. See U8.',
          rel: ['unknown:U8', 'unknown:U3', 'now:resend'],
        },
        {
          id: 'phone', icon: 'phone', label: 'Phone (917) 809-4803', detail: 'Same number as WhatsApp',
          wired: 'Implemented',
          what: 'The same number, in the footer and on the contact page.',
          why: 'Implemented, and the only channel that is currently reaching a human reliably.',
          rel: ['asset:whatsapp'],
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ *
 * 4. The site map, with a status on every page.
 * Menu, search and footer links are left out on purpose, or the arrows
 * become a web. Staff actions that reach a customer page are dashed.
 * ------------------------------------------------------------------ */

export const pages = [
  {
    id: 'home', icon: 'page', label: 'Home', route: '/', area: 'client', col: 0, row: 0,
    design: 'Implemented', server: 'Partial',
    built: ['Hydrates hero, sections and best sellers from site_content', 'Products read with the publishable key'],
    remaining: ['Trust bar, category tiles, testimonials and water facts are still in the HTML'],
    what: 'The front page. The hero, the section copy and the best-seller row are published from site_content, so a manager can change them without a developer. Five blocks of repeatable items are not.',
    why: 'Partial. What a manager can edit is the part that was finished; what is still in the markup is the part that looks editable and is not. See U7.',
    rel: ['def:sections', 'unknown:U7', 'flow:publish'],
  },
  {
    id: 'shop', icon: 'cart', label: 'Shop', route: '/shop/', area: 'client', col: 1, row: 0,
    design: 'Implemented', server: 'Implemented',
    built: ['Catalog, filter, search and sort read from Supabase'],
    remaining: ['Thirteen of seventeen rows carry stock 0, so most cards read out of stock'],
    what: 'The shelf. Filtering, search and sort all run against the live catalogue rather than a copy.',
    why: 'Implemented on the server side, and reading as mostly sold out because of the data behind it. See F2.',
    rel: ['finding:F2', 'table:products', 'phase:P7'],
  },
  {
    id: 'product', icon: 'box', label: 'Product', route: '/product/?id=', area: 'client', col: 2, row: 0,
    design: 'Implemented', server: 'Partial',
    built: ['Product, specs, compatibility and bundle relationships', 'Related products'],
    remaining: ['product_stage_options is empty, so no 5, 6 or 7 stage choice renders', 'No faucet rows exist, so the upgrade control has nothing to offer'],
    what: 'One product, its specifications, which systems a filter fits, what a bundle contains, and two configuration controls: how many stages, and whether to add a faucet.',
    why: 'Partial. Both configuration controls are built, priced server-side in create_order, and invisible, because neither has any rows behind it.',
    rel: ['finding:F2', 'table:product_stage_options', 'phase:P7'],
  },
  {
    id: 'checkout', icon: 'card', label: 'Checkout', route: '/checkout/', area: 'client', col: 3, row: 0,
    design: 'Implemented', server: 'Partial',
    built: ['POST /api/orders/create, server-authoritative pricing through create_order', 'Borough selector, 8.875% tax, stock enforced in one transaction'],
    remaining: ['No payment: the submit button carries a static disabled attribute', 'No Turnstile widget, though the server expects a token'],
    what: 'The last page before money. The browser sends ids, quantities, a stage option, a faucet choice and an address; the database decides every price.',
    why: 'Partial, and deliberately unreachable. Everything except taking the money works and is tested. The button reads "Checkout unavailable" so the gap cannot be reached by accident.',
    rel: ['finding:F1', 'flow:order', 'flow:payment', 'phase:P3'],
  },
  {
    id: 'quiz', icon: 'filter', label: 'Find your filter', route: '/quiz/', area: 'client', col: 1, row: 1,
    design: 'Implemented', server: 'Implemented',
    built: ['Five questions, recommendation computed in the browser'],
    remaining: ['Nothing. No server work needed'],
    what: 'Five questions that end in a recommended system. Entirely client-side, by design: there is nothing here worth a round trip.',
    why: 'Implemented, and finished.',
    rel: ['page:product'],
  },
  {
    id: 'water', icon: 'drop', label: 'NYC water', route: '/nyc-water/', area: 'client', col: 0, row: 1,
    design: 'Implemented', server: 'Missing',
    built: ['Charts and FAQ render from values in the page'],
    remaining: ['Figures are illustrative and unverified against NYC DEP reports (U2)'],
    what: 'The argument for filtering New York tap water, with charts and a FAQ. The numbers are written into the page.',
    why: 'Missing on the server side because it needs none. The problem is the figures: they were drafted as illustrative and are presented as fact. That is U2, and it blocks launch.',
    rel: ['unknown:U2', 'risk:R6'],
  },
  {
    id: 'about', icon: 'people', label: 'About', route: '/about/', area: 'client', col: 0, row: 2,
    design: 'Implemented', server: 'Missing',
    built: ['Static brand story'],
    remaining: ['Nothing. No server work needed'],
    what: 'The brand story, static on purpose.',
    why: 'Missing on the server side because it needs none.',
    rel: [],
  },
  {
    id: 'contact', icon: 'mail', label: 'Contact', route: '/contact/', area: 'client', col: 1, row: 2,
    design: 'Implemented', server: 'Implemented',
    built: ['POST /api/contact validates, rate limits and writes contact_messages', 'Answers 200 on the Worker, checked 2026-11-02'],
    remaining: ['No Turnstile widget, and the page reads a token from one that does not exist', 'The notification lands in a suspended inbox (U8)'],
    what: 'A form that writes contact_messages and emails the team. The first server route to work anywhere.',
    why: 'Implemented as of 2026-11-02: the route answers on the Worker, the method guard and validator both fire. What is not implemented is the captcha widget and a mailbox that receives.',
    rel: ['flow:inbound', 'unknown:U8', 'now:turnstile'],
  },
  {
    id: 'signin', icon: 'key', label: 'Sign in', route: '/signin/', area: 'client', col: 2, row: 1,
    design: 'Implemented', server: 'Implemented',
    built: ['CrystalinaAuth on Supabase Auth: a code by email, or Continue with Google', 'Real sessions and a JWT on every query'],
    remaining: ['Store.signUp and Store.signIn stubs are still exported from js/store.js and must be retired'],
    what: 'The only page that holds a real session. Passwordless: an eight-digit code by email, or Google. There is no password in the project.',
    why: 'Implemented as of 2026-11-02, Google included. The unfinished part is the six other pages that still read localStorage rather than this session.',
    rel: ['finding:F4', 'flow:identity', 'now:auth', 'page:account'],
  },
  {
    id: 'account', icon: 'person', label: 'Account', route: '/account/', area: 'client', col: 3, row: 1,
    design: 'Implemented', server: 'Refactor',
    built: ['Order history read under row level security'],
    remaining: ['Gates on Store.currentUser() from localStorage and does not load js/auth.js at all'],
    what: 'A customer\'s own orders. The rows come back under row level security, so the data is right even though the gate is not.',
    why: 'Refactor. It is the clearest example of F4: the page decides whether to render from localStorage, and signs out by deleting a local key rather than ending the Supabase session.',
    rel: ['finding:F4', 'phase:P4', 'page:signin'],
  },
  {
    id: 'admin', icon: 'gear', label: 'Admin console', route: '/admin/', area: 'staff', col: 0, row: 0,
    design: 'Implemented', server: 'Partial',
    built: ['Catalog writes through upsert_product and delete_product, gated on has_role', 'Content editor publishes site_content', 'Image upload to the site-media bucket'],
    remaining: ['About thirty record-text interpolations reach innerHTML unescaped (F3)', 'Gated on localStorage, not on the session (F4, U1)', 'No screen for stage options or faucet assignment'],
    what: 'Where the catalogue and the published page content are edited, and where images are uploaded. Every write goes through a security definer function that refuses a caller without the role.',
    why: 'Partial. The writes are correct and gated in the database. The page around them is the one file in the project with an open escaping gap, and it has no screen for the two empty tables that F2 is about.',
    rel: ['finding:F3', 'finding:F4', 'flow:publish', 'phase:P7'],
  },
  {
    id: 'manager', icon: 'calendar', label: 'Manager', route: '/manager/', area: 'staff', col: 1, row: 0,
    design: 'Implemented', server: 'Partial',
    built: ['Inventory, support, technician schedules and job assignment', 'Record text is escaped, checked 2026-11-02'],
    remaining: ['Same localStorage gate as every other private page (F4)'],
    what: 'Inventory, support tickets, technician schedules and job assignment.',
    why: 'Partial. The escaping claim against this file was wrong and has been corrected: it escapes its record text. The gate is the remaining problem.',
    rel: ['finding:F4', 'page:tech', 'table:staff_shifts'],
  },
  {
    id: 'sales', icon: 'chart', label: 'Sales', route: '/sales/', area: 'staff', col: 2, row: 0,
    design: 'Implemented', server: 'Partial',
    built: ['Leads, sales, customers and campaign screens', 'Record text is escaped, checked 2026-11-02'],
    remaining: ['Cart recovery sends nothing: no scheduled job exists', 'Same localStorage gate (F4)'],
    what: 'Leads, sales, customers and campaigns.',
    why: 'Partial. The screen for cart recovery exists and nothing sends anything, because scheduled work is postponed until payment is live.',
    rel: ['finding:F4', 'target:cfcron', 'trigger:cron'],
  },
  {
    id: 'tech', icon: 'wrench', label: 'Technician', route: '/technician/', area: 'staff', col: 3, row: 0,
    design: 'Implemented', server: 'Partial',
    built: ['Assigned jobs, checklists, statuses, installation photos', 'Record text is escaped, checked 2026-11-02'],
    remaining: ['Photos upload but are not tied to an order record', 'Same localStorage gate (F4)'],
    what: 'What a technician sees in the field: assigned jobs, a checklist per job, a status to set and photos to upload.',
    why: 'Partial. The photos land in the bucket and nothing joins them to the order they belong to, so they cannot be found again from an order.',
    rel: ['finding:F4', 'now:storage', 'page:manager'],
  },
];

/* Arrows a visitor or a staff member actually follows. `cross` marks a staff
 * action that reaches a customer page, drawn dashed. */
export const pageEdges = [
  { from: 'home', to: 'shop', label: 'browse' },
  { from: 'home', to: 'water', label: 'learn' },
  { from: 'home', to: 'quiz', label: 'not sure' },
  { from: 'shop', to: 'product', label: 'open' },
  { from: 'quiz', to: 'product', label: 'recommended' },
  { from: 'water', to: 'shop', label: 'shop' },
  { from: 'product', to: 'checkout', label: 'add to cart' },
  { from: 'checkout', to: 'account', label: 'order placed' },
  { from: 'signin', to: 'account', label: 'customer' },
  { from: 'product', to: 'signin', label: 'sign in to buy' },
  { from: 'admin', to: 'home', label: 'publish to website', cross: true },
  { from: 'admin', to: 'shop', label: 'price, stock, copy', cross: true },
  { from: 'manager', to: 'tech', label: 'assign job' },
  { from: 'sales', to: 'checkout', label: 'cart recovery (missing)', cross: true, status: 'Missing' },
];

/* ------------------------------------------------------------------ *
 * 5. The content model. Groups, not one card per table, or the drawing
 * stops being readable at 23 tables.
 * ------------------------------------------------------------------ */

export const entities = {
  groups: [
    {
      id: 'identity', family: 'violet', label: 'Identity', col: 0,
      tables: [
        {
          name: 'profiles', fields: ['id -> auth.users', 'full_name', 'phone'], status: 'Implemented',
          what: 'One row per signed-in person, created by a trigger on sign-up. Holds the name and phone an order needs.',
          why: 'Implemented.',
        },
        {
          name: 'user_roles', fields: ['user_id', 'role'], status: 'Implemented', note: 'private.has_role() reads this',
          what: 'Which roles a person has. private.has_role() reads it, and about thirty row level security policies and every privileged function call it.',
          why: 'Implemented, and the hinge the whole privilege model turns on.',
          rel: ['finding:F4', 'flow:identity'],
        },
      ],
    },
    {
      id: 'catalog', family: 'blue', label: 'Catalog', col: 1,
      tables: [
        {
          name: 'products', fields: ['id', 'slug', 'sku', 'price_cents', 'stock_quantity', 'product_kind', 'details', 'published'], status: 'Partial', note: '13 of 17 rows carry stock 0',
          what: 'Seventeen published rows: four systems, nine replacement filters and four filter bundles. product_kind also allows faucet, and no faucet row exists. js/product-catalog.js mirrors the same seventeen for the tests, in dollars where the database holds cents.',
          why: 'Partial. The schema is finished; the shelf reads as mostly sold out. See F2.',
          rel: ['finding:F2', 'def:catalog', 'phase:P7'],
        },
        {
          name: 'product_stage_options', fields: ['product_id', 'stages', 'price_cents', 'is_default'], status: 'Missing', note: 'Table created, never inserted into',
          what: 'The five, six or seven stage choice on a system, and what each costs. create_order prices from this table, never from the browser.',
          why: 'Missing. The table, the RPCs and the control on the product page all exist; there are no rows, so the control never renders.',
          rel: ['finding:F2', 'page:product', 'phase:P7'],
        },
        {
          name: 'product_bundle_items', fields: ['bundle_id', 'item_id', 'quantity'], status: 'Implemented',
          what: 'What a filter bundle contains. One bundle per system, discounted against the sum of its parts, enforced by a test.',
          why: 'Implemented.',
        },
        {
          name: 'system_filter_bundles', fields: ['system_id', 'bundle_id'], status: 'Implemented',
          what: 'Which bundle belongs to which system, so a product page can offer the right one.',
          why: 'Implemented.',
        },
        {
          name: 'system_filter_compatibilities', fields: ['system_id', 'filter_id', 'fit'], status: 'Implemented',
          what: 'Which filter fits which system, and how confidently. The uncertain connector variants are marked as needing fit confirmation rather than asserted.',
          why: 'Implemented, and the reason filter replacement reminders are a data problem already solved rather than a feature to design.',
          rel: ['trigger:subs'],
        },
        {
          name: 'reviews', fields: ['product_id', 'user_id', 'rating', 'body'], status: 'Partial', note: 'Read, never written',
          what: 'Customer reviews of a product.',
          why: 'Partial. The table is read by the product page and nothing writes to it, because there is no submission screen.',
        },
      ],
    },
    {
      id: 'commerce', family: 'green', label: 'Commerce', col: 2,
      tables: [
        {
          name: 'orders', fields: ['id', 'user_id', 'status', 'subtotal_cents', 'tax_cents', 'total_cents', 'shipping_address'], status: 'Partial', note: 'No paid state yet',
          what: 'One row per order, with every money column computed in the database. There is an unused stripe_payment_intent_id column waiting for the payment work.',
          why: 'Partial. Orders can be created and cannot be paid for, so no row ever reaches a paid state.',
          rel: ['finding:F1', 'flow:order', 'flow:payment'],
        },
        {
          name: 'order_items', fields: ['order_id', 'product_id', 'stage_option_id', 'faucet_id', 'quantity', 'unit_price_cents'], status: 'Implemented',
          what: 'One row per line, carrying the configuration chosen and the unit price the database decided.',
          why: 'Implemented. create_order writes it, prices it and decrements stock in the same transaction.',
          rel: ['ad:AD4'],
        },
      ],
    },
    {
      id: 'inbound', family: 'amber', label: 'Inbound and content', col: 3,
      tables: [
        {
          name: 'contact_messages', fields: ['name', 'email', 'topic', 'message', 'source_ip_hash'], status: 'Implemented',
          what: 'Enquiries from the contact form, with the sender IP stored as a truncated hash rather than an address.',
          why: 'Implemented, and receiving rows for the first time now that the Worker answers. Retention is unresolved.',
          rel: ['flow:inbound', 'trigger:deletion'],
        },
        {
          name: 'newsletter_subscribers', fields: ['email', 'created_at'], status: 'Partial', note: 'No unsubscribe path',
          what: 'Addresses from the newsletter form.',
          why: 'Partial. Rows go in and there is no way out: no unsubscribe path is built.',
          rel: ['flow:inbound', 'trigger:deletion'],
        },
        {
          name: 'site_content', fields: ['key', 'payload jsonb', 'published_at'], status: 'Implemented', note: 'What Publish to website writes',
          what: 'The published page copy, one row per key. Editing in the admin console is local until someone presses Publish to website, which writes here.',
          why: 'Implemented. What is not here is the five blocks of repeatable home page items that are still in the markup.',
          rel: ['def:sections', 'flow:publish'],
        },
      ],
    },
    {
      id: 'workforce', family: 'slate', label: 'Workforce', col: 4,
      tables: [
        { name: 'staff_shifts', fields: ['id', 'starts_at', 'ends_at', 'role'], status: 'Implemented', what: 'A published shift, which assignments hang off.', why: 'Implemented.' },
        { name: 'shift_assignments', fields: ['shift_id', 'user_id', 'state'], status: 'Implemented', what: 'One person on one shift, pending until accepted or declined.', why: 'Implemented.' },
        { name: 'shift_change_requests', fields: ['assignment_id', 'kind', 'state'], status: 'Implemented', what: 'A proposed change, which leaves the original assignment authoritative until it is approved.', why: 'Implemented.' },
        { name: 'staff_availability', fields: ['user_id', 'weekday', 'window'], status: 'Implemented', what: 'When a person can work.', why: 'Implemented.' },
        { name: 'staff_time_off_requests', fields: ['user_id', 'from', 'to', 'state'], status: 'Implemented', what: 'Time off, starting pending.', why: 'Implemented.' },
        { name: 'time_entries', fields: ['user_id', 'clock_in', 'clock_out'], status: 'Implemented', what: 'Clock in and out, summed across overnight shifts by the timesheet maths.', why: 'Implemented.' },
        { name: 'timesheet_periods', fields: ['starts_on', 'ends_on'], status: 'Implemented', what: 'The pay period a submission belongs to.', why: 'Implemented.' },
        { name: 'timesheet_submissions', fields: ['period_id', 'user_id', 'state'], status: 'Implemented', what: 'One person\'s hours for one period, submitted for approval.', why: 'Implemented.' },
        { name: 'staff_notifications', fields: ['user_id', 'kind', 'read_at'], status: 'Implemented', what: 'In-app notices for staff.', why: 'Implemented.' },
        {
          name: 'workforce_audit_log', fields: ['actor', 'action', 'payload'], status: 'Implemented', note: 'Retention unresolved: U5',
          what: 'Who changed which workforce record, written by a trigger.',
          why: 'Implemented, and holding payroll-adjacent data with no retention rule named. That is U5.',
          rel: ['unknown:U5'],
        },
      ],
    },
  ],
  relations: [
    { from: 'profiles', to: 'orders', card: 'one to many' },
    { from: 'orders', to: 'order_items', card: 'one to many' },
    { from: 'products', to: 'order_items', card: 'one to many' },
    { from: 'products', to: 'product_stage_options', card: 'one to many' },
    { from: 'products', to: 'product_bundle_items', card: 'bundle of products' },
    { from: 'products', to: 'system_filter_compatibilities', card: 'fits which systems' },
    { from: 'products', to: 'reviews', card: 'one to many' },
    { from: 'profiles', to: 'user_roles', card: 'one to many' },
    { from: 'profiles', to: 'shift_assignments', card: 'one to many' },
    { from: 'staff_shifts', to: 'shift_assignments', card: 'one to many' },
  ],
  /* Where the privilege boundary sits. This is the sentence the whole data
   * design turns on, so the drawing says it rather than implying it. */
  boundary: [
    'Browser holds the publishable key only. Every read passes row level security.',
    'Every privileged write goes through /api with the service role, or one of nine security definer functions gated on private.has_role().',
    'Prices, totals and stock are recomputed in the database. The browser sends ids and quantities, never money.',
  ],
};

/* ------------------------------------------------------------------ *
 * 6. The flows that carry money, identity or anything irreversible.
 * Each has the happy path numbered and the failure path beside it.
 * ------------------------------------------------------------------ */

export const flows = [
  {
    id: 'order',
    title: 'Placing an order, as it works today',
    status: 'Partial',
    note: 'Server-authoritative and atomic, and deliberately unreachable: nothing takes money yet, so the submit button in /checkout/ carries a static disabled attribute.',
    what: 'The whole order path except payment. The browser sends ids, quantities, a configuration and an address. The database prices every line, checks stock, decrements it and inserts the order in one transaction.',
    why: 'Partial. Every step works and is tested, and the one missing step is the one that takes money.',
    rel: ['finding:F1', 'flow:payment', 'ad:AD4', 'page:checkout'],
    lanes: [
      { family: 'blue', icon: 'browser', id: 'b', label: 'Browser', detail: '/checkout/' },
      { family: 'amber', icon: 'bolt', id: 'fn', label: 'Worker route', detail: 'POST /api/orders/create' },
      { family: 'rose', icon: 'shield', id: 'ts', label: 'Turnstile', detail: 'siteverify' },
      { family: 'teal', icon: 'database', id: 'db', label: 'Postgres', detail: 'create_order()' },
      { family: 'blue', icon: 'mail', id: 'mail', label: 'Resend', detail: 'confirmation' },
    ],
    steps: [
      { from: 'b', to: 'fn', label: 'ids, quantities, address, token. No prices', n: 1 },
      { from: 'fn', to: 'fn', label: 'method guard, 10 per 10 minutes per IP, body capped', n: 2, self: true },
      { from: 'fn', to: 'ts', label: 'verify token, or skip while the secret is unset', n: 3 },
      { from: 'fn', to: 'fn', label: 'JWT to user, UUIDs checked, max 50 lines, quantity 1 to 99', n: 4, self: true },
      { from: 'fn', to: 'db', label: 'create_order(items, address) as the signed-in user', n: 5 },
      { from: 'db', to: 'db', label: 'reprice every line, check stock, decrement, insert order: one transaction', n: 6, self: true },
      { from: 'db', to: 'fn', label: 'order id and total', n: 7, back: true },
      { from: 'fn', to: 'mail', label: 'confirmation email', n: 8 },
      { from: 'fn', to: 'b', label: '201 and the order id', n: 9, back: true },
    ],
    failures: [
      'No session: 401 before anything is read. Verified on the live Worker 2026-11-02.',
      'Bad or missing captcha token: 400, nothing written. Skipped entirely while the secret is unset.',
      'Out of stock: create_order raises, the transaction rolls back, no partial order.',
      'Resend unavailable or key unset: the order stands and the email is skipped. Email never gates the order.',
      'The front door is the problem, not the path: the submit button is disabled, so a customer on crystalina.org cannot reach step 1.',
    ],
  },
  {
    id: 'payment',
    title: 'Taking the money (Stripe, phase 3)',
    status: 'Missing',
    note: 'Nothing of this exists yet. Drawn because it is the one flow that must be right the first time: a payment taken twice, or an order marked paid that was not, is not a bug you can apologise your way out of.',
    what: 'Two new routes on the Worker\'s route table. One reprices the cart and creates a Stripe Checkout Session; the other receives the webhook, verifies its signature, and is the only thing permitted to mark an order paid.',
    why: 'Missing. See AD4 for the shape and F1 for what it blocks.',
    rel: ['finding:F1', 'phase:P3', 'ad:AD4', 'risk:R2'],
    lanes: [
      { family: 'blue', icon: 'browser', id: 'b', label: 'Browser', detail: '/checkout/' },
      { family: 'amber', icon: 'bolt', id: 'fn', label: 'Worker route', detail: '/api/checkout/session' },
      { family: 'green', icon: 'card', id: 'st', label: 'Stripe', detail: 'Checkout' },
      { family: 'amber', icon: 'bolt', id: 'hook', label: 'Worker route', detail: '/api/stripe/webhook' },
      { family: 'teal', icon: 'database', id: 'db', label: 'Postgres', detail: 'orders' },
    ],
    steps: [
      { from: 'b', to: 'fn', label: 'cart ids and quantities', n: 1 },
      { from: 'fn', to: 'db', label: 'reprice the cart server side. Never trust a browser total', n: 2 },
      { from: 'fn', to: 'st', label: 'create Checkout Session with the repriced lines', n: 3 },
      { from: 'fn', to: 'b', label: 'session URL', n: 4, back: true },
      { from: 'b', to: 'st', label: 'customer pays on Stripe', n: 5 },
      { from: 'st', to: 'hook', label: 'checkout.session.completed', n: 6 },
      { from: 'hook', to: 'hook', label: 'verify the signature, then look up by event id', n: 7, self: true },
      { from: 'hook', to: 'db', label: 'create_order, or mark paid. Keyed, so a retry cannot duplicate it', n: 8 },
      { from: 'hook', to: 'st', label: '200, or Stripe redelivers', n: 9, back: true },
    ],
    failures: [
      'Unsigned or wrongly signed webhook: 400, nothing written.',
      'Stripe redelivers the same event: the write is keyed on the event id, so the second one is a no-op.',
      'Customer abandons the hosted page: no order, and the cart is untouched.',
      'Webhook arrives before the browser returns: the webhook is the source of truth, never the redirect.',
      'The test secret key that was pasted into a chat transcript is rolled before any of this ships.',
    ],
  },
  {
    id: 'identity',
    title: 'Signing in, and what a role is allowed to do',
    status: 'Refactor',
    note: 'The data is protected by row level security, which is the part that matters. What is wrong is the gate in front of the private pages: it reads localStorage, and localStorage is a suggestion.',
    what: 'Passwordless sign-in, and what happens afterwards. A code by email or Google returns a real session; every query then carries the JWT and the database decides what comes back.',
    why: 'Refactor. Step 1 and step 5 onwards are right. Step 3 and step 4 are the hole: the page decides what to draw from a roles array in localStorage.',
    rel: ['finding:F4', 'unknown:U1', 'phase:P4', 'page:signin'],
    lanes: [
      { family: 'blue', icon: 'browser', id: 'b', label: 'Browser', detail: '/signin/' },
      { id: 'auth', family: 'violet', icon: 'key', label: 'Supabase Auth', detail: 'Google, or a code by email' },
      { family: 'violet', icon: 'page', id: 'page', label: 'Private page', detail: '/admin/, /account/, ...' },
      { family: 'teal', icon: 'database', id: 'db', label: 'Postgres', detail: 'RLS and has_role()' },
    ],
    steps: [
      { from: 'b', to: 'auth', label: 'Continue with Google, or an eight-digit code by email', n: 1 },
      { from: 'auth', to: 'b', label: 'session and JWT', n: 2, back: true },
      { from: 'b', to: 'page', label: 'open a private page', n: 3 },
      { from: 'page', to: 'page', label: 'today: the page reads Store.currentUser() from localStorage and decides. This is the hole', n: 4, self: true, tone: 'amber' },
      { from: 'page', to: 'db', label: 'every query carries the JWT', n: 5 },
      { from: 'db', to: 'db', label: 'row level security, and private.has_role() on every privileged function', n: 6, self: true },
      { from: 'db', to: 'page', label: 'only the rows this role may see', n: 7, back: true },
    ],
    failures: [
      'Customer opens /admin/ directly: the markup renders, and every query should return nothing. Verifying that "nothing" really is nothing is U1.',
      'Expired JWT: queries fail closed, and the page sends the visitor back to sign in.',
      'Role removed while signed in: the next query fails, not the next page load.',
      'Signing out of /account/ deletes a local key and does not end the Supabase session.',
      'There is no password to reset, so the locked-out case is a code that never arrives, which is U8.',
    ],
  },
  {
    id: 'publish',
    title: 'Staff changing what a visitor sees',
    status: 'Partial',
    note: 'Editing is local until someone presses Publish to website. That is deliberate: a manager can work through changes without a half-finished page going live.',
    what: 'How a price, a photo or a paragraph gets from a staff screen to a visitor. Writes go through security definer functions; the published payload lands in site_content; the next visitor hydrates from it.',
    why: 'Partial. The path works. What is wrong is at the two ends: unescaped record text on the way in, and no cache busting on the way out.',
    rel: ['finding:F3', 'page:admin', 'table:site_content', 'def:sections'],
    lanes: [
      { family: 'violet', icon: 'gear', id: 'adm', label: 'Admin browser', detail: '/admin/' },
      { family: 'teal', icon: 'database', id: 'db', label: 'Postgres', detail: 'security definer RPCs' },
      { family: 'teal', icon: 'image', id: 'store', label: 'Storage', detail: 'site-media' },
      { family: 'blue', icon: 'globe', id: 'site', label: 'Storefront', detail: '/ and /shop/' },
    ],
    steps: [
      { from: 'adm', to: 'db', label: 'upsert_product(...) with the staff JWT', n: 1 },
      { from: 'db', to: 'db', label: 'private.has_role(admin or manager), or refuse', n: 2, self: true },
      { from: 'adm', to: 'store', label: 'upload an image to site-media', n: 3 },
      { from: 'adm', to: 'db', label: 'Publish to website writes site_content', n: 4 },
      { from: 'site', to: 'db', label: 'next visitor hydrates from site_content and products', n: 5 },
      { from: 'site', to: 'store', label: 'images by public URL', n: 6 },
    ],
    failures: [
      'Anonymous or customer caller: the function refuses. Checked 2026-08-31.',
      'Delete a product that is on an order: refused, so order history cannot be orphaned.',
      'About thirty interpolations in js/admin.js put record text into innerHTML unescaped, so a staff edit can become script on another staff screen (F3).',
      'No cache busting on styles or scripts, so a returning visitor can hold a stale stylesheet after a deploy.',
      'Five blocks of home page items are not in site_content at all, so publishing cannot change them.',
    ],
  },
  {
    id: 'inbound',
    title: 'A stranger sending something in',
    status: 'Partial',
    note: 'Contact and newsletter share one shape. Both are open to the internet with no session, so they are the cheapest thing to abuse and the first thing to harden. Both answer on the Worker as of 2026-11-02.',
    what: 'The only two paths a stranger can write to the database through. Rate limited, validated, captcha-checked when a secret exists, written with the service role, and notified by email afterwards.',
    why: 'Partial. The route works for the first time. The captcha has no widget and the notification lands in a suspended inbox.',
    rel: ['now:turnstile', 'unknown:U8', 'threat:spam', 'page:contact'],
    lanes: [
      { family: 'blue', icon: 'browser', id: 'b', label: 'Browser', detail: 'form' },
      { family: 'rose', icon: 'filter', id: 'waf', label: 'Cloudflare', detail: 'WAF rate limit (missing)' },
      { family: 'amber', icon: 'bolt', id: 'fn', label: 'Worker route', detail: '/api/contact' },
      { family: 'rose', icon: 'shield', id: 'ts', label: 'Turnstile', detail: 'siteverify' },
      { family: 'teal', icon: 'database', id: 'db', label: 'Postgres', detail: 'contact_messages' },
      { family: 'blue', icon: 'mail', id: 'mail', label: 'Resend', detail: 'to the inbox' },
    ],
    steps: [
      { from: 'b', to: 'waf', label: 'POST with a Turnstile token', n: 1 },
      { from: 'waf', to: 'fn', label: 'within the rate limit', n: 2 },
      { from: 'fn', to: 'ts', label: 'verify the token', n: 3 },
      { from: 'fn', to: 'fn', label: 'clean and cap every field', n: 4, self: true },
      { from: 'fn', to: 'db', label: 'insert with the service role', n: 5 },
      { from: 'fn', to: 'mail', label: 'notify CONTACT_INBOX', n: 6 },
      { from: 'fn', to: 'b', label: '200 and the success state', n: 7, back: true },
    ],
    failures: [
      'No widget on any form, so no token is sent. Verification is skipped while the secret is unset, which means setting the secret today would refuse every real submission.',
      'The rate limit is an in-process Map, so each Worker instance counts on its own. It blunts casual abuse and nothing more.',
      'Mail fails: the row is already written and the submission is not lost.',
      'The notification currently lands in a suspended mailbox, so a real enquiry is stored and nobody is told (U8).',
      'Step 2 is drawn and does not exist: WAF rate limiting has not been configured.',
    ],
  },
];

/* ------------------------------------------------------------------ *
 * 7. Deployment: two environments, one deploy path, one rollback.
 * ------------------------------------------------------------------ */

export const deployment = {
  note: 'One deploy path, not two. Cloudflare builds from its own Git connection: it clones the repository, runs the build and deploys a Worker that serves dist and routes /api/* (AD10). GitHub Actions deploys nothing and holds no credential; it runs the tests and the drift checks, and branch protection makes them required. The gate on production is therefore the merge, performed by a person who has applied the migrations first (AD9).',
  stages: [
    {
      id: 'dev', family: 'slate', icon: 'branch', label: 'Working tree', detail: 'npm test, npm run build:site, npm run check', status: 'Implemented', note: 'The browser harness still needs puppeteer',
      what: 'What runs before a commit: 35 tests, the publish allow-list, and both drift checks. npm run verify renders a page in a real browser and needs puppeteer installed.',
      why: 'Implemented. npm run check passes today.',
      rel: ['ad:AD7'],
    },
    {
      id: 'pr', family: 'blue', icon: 'check', label: 'Pull request', detail: 'Actions: tests, both drift checks, the build', status: 'Implemented', note: 'Make them required on main, or this is decoration',
      what: 'One workflow that deploys nothing and holds no credential. It runs the same checks as the working tree, on every pull request.',
      why: 'Implemented, and only half useful until branch protection makes it required.',
      rel: ['ad:AD9', 'stage:merge'],
    },
    {
      id: 'preview', family: 'violet', icon: 'eye', label: 'Preview', detail: 'A build per branch, behind Access', status: 'Missing',
      what: 'A copy of the site per branch, at an address nobody can index, with its own Supabase project.',
      why: 'Missing. It needs Access turned on and U4 answered: two environments with one database is one environment.',
      rel: ['target:cfaccess', 'unknown:U4'],
    },
    {
      id: 'merge', family: 'amber', icon: 'person', label: 'Merge to main', detail: 'The gate. A person merges, migrations first', status: 'Missing', note: 'Needs branch protection on main',
      what: 'The only human gate on production, by decision. Whoever merges has already applied any migration the change needs.',
      why: 'Missing, because branch protection is not on yet. Until it is, nothing gates production at all.',
      rel: ['ad:AD9', 'stage:prod'],
    },
    {
      id: 'prod', family: 'green', icon: 'rocket', label: 'Production', detail: 'Cloudflare builds main', status: 'Partial', note: 'Live on workers.dev, not on the domain',
      what: 'The Worker that main deploys to. It is live and answering at crystalina.crystalina.workers.dev.',
      why: 'Partial as of 2026-11-02. It deploys and runs; the domain in front of it has not moved.',
      rel: ['now:worker', 'phase:P5'],
    },
    {
      id: 'rollback', family: 'slate', icon: 'undo', label: 'Rollback', detail: 'Promote the previous deployment', status: 'Missing', note: 'Practise once before launch',
      what: 'Promoting the previous Worker version, which takes seconds.',
      why: 'Missing until someone has actually done it. A rollback nobody has run is a rollback nobody can run at two in the morning, so it has to be practised once, deliberately, by someone who did not build it.',
      rel: ['phase:P9'],
    },
  ],
  environments: [
    { name: 'Preview', host: 'A per-branch Workers preview', data: 'Supabase preview project (U4)', gate: 'Cloudflare Access, noindex' },
    { name: 'Production', host: 'crystalina.crystalina.workers.dev today, crystalina.org after phase 5', data: 'Supabase production project', gate: 'Public' },
  ],
  secrets: [
    { name: 'SUPABASE_URL', secret: false, where: 'Function and build' },
    { name: 'SUPABASE_PUBLISHABLE_KEY', secret: false, where: 'Browser, safe only because RLS holds' },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', secret: true, where: 'Function only' },
    { name: 'STRIPE_SECRET_KEY', secret: true, where: 'Function only' },
    { name: 'STRIPE_WEBHOOK_SECRET', secret: true, where: 'Function only' },
    { name: 'TURNSTILE_SITE_KEY', secret: false, where: 'Browser widget' },
    { name: 'TURNSTILE_SECRET_KEY', secret: true, where: 'Function only' },
    { name: 'RESEND_API_KEY', secret: true, where: 'Function only' },
    { name: 'EMAIL_FROM', secret: false, where: 'Function' },
    { name: 'CONTACT_INBOX', secret: false, where: 'Function' },
    { name: 'PUBLIC_SITE_URL', secret: false, where: 'Function and build' },
  ],
};

/* ------------------------------------------------------------------ *
 * 7b. What the owner does, and what an agent cannot do for them.
 * Every one of these needs a person in a dashboard with a password.
 * ------------------------------------------------------------------ */

export const ownerSteps = {
  note: 'Seven things that need a person signed in to a dashboard. An agent can name every value and write every line of configuration; it cannot create an account, accept terms or move a nameserver. Ordered by what blocks what.',
  steps: [
    {
      id: 'own-secrets', icon: 'key', family: 'violet', label: 'Set every secret on the Worker', status: 'Partial',
      what: 'Eleven names, per environment, in the Cloudflare dashboard. The agent names them; it never holds them.',
      why: 'Partial. The routes answer, so enough of them are set for the forms to work. Stripe, Turnstile and Resend are not.',
      rel: ['phase:P1', 'stage:prod'],
    },
    {
      id: 'own-protect', icon: 'check', family: 'blue', label: 'Turn on branch protection for main', status: 'Missing',
      what: 'Require the Checks job on main, so no push reaches production without a green pull request.',
      why: 'Missing. Without it the deploy has no gate at all, which is the one thing AD9 depends on.',
      rel: ['ad:AD9', 'stage:merge'],
    },
    {
      id: 'own-access', icon: 'lock', family: 'violet', label: 'Put Access in front of every preview', status: 'Missing',
      what: 'A sign-in wall on any non-production address, so a half-built copy cannot be indexed or shared by accident.',
      why: 'Missing, free, and a few minutes of work.',
      rel: ['target:cfaccess', 'stage:preview'],
    },
    {
      id: 'own-resend', icon: 'mail', family: 'blue', label: 'Verify a sending domain in Resend', status: 'Missing',
      what: 'Verify crystalina.org, add the DNS records, and send one real test to an address outside the company.',
      why: 'Missing, and now entangled with the suspended Workspace: mail from an unverified domain is filed as spam, and nobody is reading the inbox either way.',
      rel: ['unknown:U3', 'unknown:U8'],
    },
    {
      id: 'own-workspace', icon: 'alert', family: 'rose', label: 'Unlock Google Workspace on the domain', status: 'Missing',
      what: 'The Workspace subscription is suspended behind a reseller lock, so info@crystalina.org is not receiving mail.',
      why: 'Missing, and outside the repository entirely. It is the only item here that a technical decision cannot route around. See U8.',
      rel: ['unknown:U8', 'asset:inbox'],
    },
    {
      id: 'own-dns', icon: 'globe', family: 'amber', label: 'Move the nameservers to Cloudflare', status: 'Missing',
      what: 'Point crystalina.org at Cloudflare, then add the new origin to the Supabase redirect allow-list.',
      why: 'Missing, and the single step that turns a working Worker into a working site. Do it only when a preview has passed, and check what it does to Workspace mail first.',
      rel: ['phase:P5', 'target:cfdns', 'unknown:U8'],
    },
    {
      id: 'own-rollback', icon: 'undo', family: 'slate', label: 'Practise a rollback once', status: 'Missing',
      what: 'Promote the previous deployment, deliberately, before launch, with someone who did not build it.',
      why: 'Missing. It is the cheapest insurance in the project and the easiest thing to skip.',
      rel: ['stage:rollback'],
    },
  ],
};

/* ------------------------------------------------------------------ *
 * 8. Performance budget. `measured` stays null until the harness has
 * actually rendered the page. A guessed number in a budget is worse
 * than an empty one, because it gets believed.
 * ------------------------------------------------------------------ */

export const budget = {
  note: 'Target is the first screen on a mid-range phone over 4G. Nothing here has been measured yet: scripts/verify.mjs reports transferred weight per page, and these bars fill in once it has been run against a served copy.',
  unit: 'KB transferred, first screen',
  rows: [
    { page: '/', budget: 420, measured: null, heavy: 'hero-bg.webp is allowed to be the single heaviest asset' },
    { page: '/shop/', budget: 380, measured: null, heavy: 'Seventeen product thumbnails, lazy below the fold' },
    { page: '/product/', budget: 400, measured: null, heavy: 'One large product photo' },
    { page: '/checkout/', budget: 220, measured: null, heavy: 'No imagery. Should be the lightest page' },
    { page: '/admin/', budget: 600, measured: null, heavy: 'Staff only, on a desktop. Deliberately allowed to be heavy' },
  ],
};

/* ------------------------------------------------------------------ *
 * 9. Build plan. Phases, what each needs first, and what it changes.
 * ------------------------------------------------------------------ */

export const phases = [
  {
    id: 'P1', family: 'amber', icon: 'cloud', label: 'Cloudflare project and secrets', needs: [], status: 'Partial', col: 0, row: 0, owner: 'Owner, then Codex', detail: 'Worker project, Access on previews, every secret per environment',
    what: 'Get a Cloudflare project that builds and deploys, with every value set per environment and a sign-in wall in front of anything that is not production.',
    why: 'Partial as of 2026-11-02. The project exists, builds and deploys; the Worker answers. Access is not on and three of the eleven values are unset.',
    rel: ['stage:prod', 'target:cfaccess', 'own-secrets'],
  },
  {
    id: 'P2', family: 'amber', icon: 'bolt', label: 'Run /api on Cloudflare', needs: ['P1'], status: 'Implemented', col: 1, row: 0, owner: 'Codex', detail: 'Three routes, one runtime shim, 35 tests green',
    what: 'Make the three server routes run on Cloudflare without rewriting the handlers: one adapter, one route table, tests for both.',
    why: 'Implemented as of 2026-11-02 and verified against the live Worker. It is the first phase to finish, and it went from Partial to done by changing a deploy target rather than a handler.',
    rel: ['ad:AD10', 'now:worker', 'target:cffn'],
  },
  {
    id: 'P3', family: 'green', icon: 'card', label: 'Stripe checkout and webhook', needs: ['P2'], status: 'Missing', col: 2, row: 0, owner: 'Codex', detail: 'Server repricing, signature check, idempotent write',
    what: 'Two routes, a signature check and a write keyed on the Stripe event id, reusing create_order rather than recalculating anything in JavaScript.',
    why: 'Missing, and it is now the largest thing between here and an open shop. Nothing else in the plan is blocked on anything that is not already done.',
    rel: ['finding:F1', 'flow:payment', 'ad:AD4', 'risk:R2'],
  },
  {
    id: 'P4', family: 'violet', icon: 'key', label: 'Finish the auth migration', needs: ['P1'], status: 'Partial', col: 1, row: 1, owner: 'Codex', detail: 'Retire the stubs, put the six remaining pages on the session',
    what: 'Move the six pages that read Store.currentUser() onto the real session, retire the signUp and signIn stubs, and make signing out end the Supabase session rather than delete a local key.',
    why: 'Partial. Sign-in itself is finished, Google included. What remains is everything downstream of it.',
    rel: ['finding:F4', 'page:account', 'unknown:U1'],
  },
  {
    id: 'P5', family: 'amber', icon: 'globe', label: 'DNS cutover', needs: ['P2', 'P3'], status: 'Missing', col: 3, row: 0, owner: 'Owner', detail: 'Nameservers, then the Supabase redirect allow-list',
    what: 'Point crystalina.org at Cloudflare, retire GitHub Pages, and teach Supabase the new origin.',
    why: 'Missing. It is the step that makes everything already built visible to a visitor, and it has to not break Workspace mail, which is U8.',
    rel: ['target:cfdns', 'unknown:U8', 'risk:R5'],
  },
  {
    id: 'P6', family: 'rose', icon: 'shield', label: 'Security hardening', needs: ['P2'], status: 'Partial', col: 2, row: 1, owner: 'Codex', detail: 'Escape js/admin.js, Turnstile widgets, WAF rate limit',
    what: 'The three findings that are each less than a day: sweep the thirty interpolations in js/admin.js, put the captcha widget on the three forms, and move the rate limit to the edge.',
    why: 'Partial. The scope shrank on 2026-11-02 when the other dashboards were checked and found to be escaping already.',
    rel: ['finding:F3', 'risk:R1', 'risk:R3', 'threat:xss'],
  },
  {
    id: 'P7', family: 'blue', icon: 'box', label: 'Seed the catalogue', needs: [], status: 'Missing', col: 0, row: 2, owner: 'Claude Code', detail: 'Stage options, faucet rows, real stock',
    what: 'Fill the three gaps behind the shop: stock on the thirteen rows that have none, rows in product_stage_options, and at least one faucet product.',
    why: 'Missing, and blocked on nothing. It can be done by whoever is free, today, and it is what turns a sold-out shelf into a shop.',
    rel: ['finding:F2', 'table:product_stage_options', 'page:product'],
  },
  {
    id: 'P8', family: 'green', icon: 'truck', label: 'Order lifecycle', needs: ['P3'], status: 'Missing', col: 3, row: 1, owner: 'Codex', detail: 'Dispatch mail, status transitions, refunds',
    what: 'What happens to an order after it is paid for: statuses, dispatch mail, refunds.',
    why: 'Missing, and genuinely blocked: there is no paid order to move through a lifecycle yet.',
    rel: ['phase:P3', 'table:orders'],
  },
  {
    id: 'P9', family: 'slate', icon: 'bell', label: 'Backups and monitoring', needs: ['P5'], status: 'Missing', col: 4, row: 0, owner: 'Codex', detail: 'Scheduled backups, errors from the Worker and the browser',
    what: 'Scheduled Supabase backups, one of them restored into a scratch project, and somewhere for an exception to go.',
    why: 'Missing. A backup nobody has restored is a hope, not a backup.',
    rel: ['risk:R7', 'target:sentry', 'stage:rollback'],
  },
  {
    id: 'P10', family: 'green', icon: 'rocket', label: 'Launch', needs: ['P5', 'P6', 'P7', 'P9'], status: 'Missing', col: 5, row: 0, owner: 'Both', detail: 'Checklist, analytics, handover',
    what: 'The checklist, analytics turned on, and a handover to whoever maintains this.',
    why: 'Missing. Four phases have to finish first, and U2 and U7 have to be answered.',
    rel: ['unknown:U2', 'unknown:U7', 'asset:analytics'],
  },
];

/* ------------------------------------------------------------------ *
 * 10. Risks, placed by likelihood and impact.
 * ------------------------------------------------------------------ */

export const risks = [
  {
    id: 'R1', label: 'Unescaped record text in js/admin.js', likelihood: 'medium', impact: 'high',
    fix: 'Sweep about thirty interpolations in js/admin.js through escapeHTML. The other dashboards were checked on 2026-11-02 and already escape', effort: 'Half a day',
    what: 'A staff edit that contains markup becomes markup on another staff screen. The sites are product names, order statuses, job addresses, campaign names and role names.',
    why: 'Likelihood dropped from high to medium on 2026-11-02, when the other five dashboard files were checked and found to escape their record text. One file, about thirty sites.',
    fixedBy: ['phase:P6'],
    rel: ['finding:F3', 'threat:xss'],
  },
  {
    id: 'R2', label: 'Payment taken twice on a webhook redelivery', likelihood: 'medium', impact: 'high',
    fix: 'Key the write on the Stripe event id before the first real charge', effort: 'Half a day, inside phase 3',
    what: 'Stripe redelivers events. A webhook that writes without checking whether it has already seen that event id can charge or record the same order twice.',
    why: 'It does not exist yet, which is the only reason it has not happened. It has to be right the first time.',
    fixedBy: ['phase:P3'],
    rel: ['flow:payment', 'ad:AD4'],
  },
  {
    id: 'R3', label: 'Rate limit does not survive the instance', likelihood: 'high', impact: 'medium',
    fix: 'Cloudflare WAF rate limiting on /api/*, which the move makes free', effort: 'An hour',
    what: 'The limit is an in-process Map. Worker instances are short lived and unshared, so each one counts from zero.',
    why: 'It blunts casual abuse and an accidental double submit, and nothing more. It cannot be fixed in application code.',
    fixedBy: ['phase:P6'],
    rel: ['target:cfwaf', 'threat:spam'],
  },
  {
    id: 'R4', label: 'Every private page gated in the browser only', likelihood: 'medium', impact: 'high',
    fix: 'Prove with a customer account that /admin/ exposes nothing, then move the gate onto the session', effort: 'A day',
    what: 'Six pages decide what to show from localStorage. The data behind them is protected; what is drawn before any query returns is not.',
    why: 'Nobody has looked yet, which is U1. Until someone does, the claim that it exposes nothing is an assumption.',
    fixedBy: ['phase:P4'],
    rel: ['finding:F4', 'unknown:U1'],
  },
  {
    id: 'R5', label: 'The domain still points at the half that cannot run code', likelihood: 'high', impact: 'medium',
    fix: 'Move the nameservers. The Worker is already live and answering', effort: 'Phase 5',
    what: 'crystalina.org is GitHub Pages. Everything built in the last month is at an address nobody visits.',
    why: 'Improved on 2026-11-02: it was two half-deployed hosts and is now one working host and one stale one. The remaining step is a nameserver change.',
    fixedBy: ['phase:P5'],
    rel: ['now:pages', 'unknown:U8'],
  },
  {
    id: 'R6', label: 'Unverified NYC water figures published as fact', likelihood: 'medium', impact: 'high',
    fix: 'Check every number against NYC DEP reports, or mark it illustrative in the page', effort: 'Half a day',
    what: 'The charts and FAQ on /nyc-water/ present first-draft illustrative numbers to a New York audience as fact.',
    why: 'Publishing an unverified water quality claim is a different kind of mistake from a layout bug. It blocks launch, and it is U2.',
    fixedBy: ['unknown:U2'],
    rel: ['page:water'],
  },
  {
    id: 'R7', label: 'No backup has ever been restored', likelihood: 'low', impact: 'high',
    fix: 'Schedule them, then restore one into a scratch project', effort: 'Half a day',
    what: 'There is no scheduled backup, and nothing has been restored.',
    why: 'Low likelihood of being needed, total cost if it is.',
    fixedBy: ['phase:P9'],
    rel: ['stage:rollback'],
  },
  {
    id: 'R8', label: 'Stripe test key pasted into a chat transcript', likelihood: 'high', impact: 'low',
    fix: 'Roll it. It is a test key, and rolling it costs nothing', effort: 'Minutes',
    what: 'A test secret key was pasted into a transcript.',
    why: 'Low impact because it is a test key. High likelihood because it has already happened and has not been rolled.',
    rel: ['flow:payment'],
  },
  {
    id: 'R9', label: 'Most of the shelf reads as sold out', likelihood: 'high', impact: 'medium',
    fix: 'Seed real stock with the stage options in phase 7', effort: 'Half a day',
    what: 'Thirteen of seventeen published rows carry stock 0, so a visitor sees a catalogue of unavailable items.',
    why: 'Certain, because it is the current state of the data rather than a hazard. Half a day of work, blocked on nothing.',
    fixedBy: ['phase:P7'],
    rel: ['finding:F2', 'table:products'],
  },
  {
    id: 'R10', label: 'Worker size and CPU limits on the free plan', likelihood: 'low', impact: 'low',
    fix: 'Let a deploy fail on size rather than guessing. Workers Paid is five dollars', effort: 'Minutes',
    what: 'The free plan caps script size and CPU time per request.',
    why: 'Dropped from medium to low on 2026-11-02: the Worker deploys and answers, so the limits are not being hit.',
    rel: ['ad:AD1', 'now:worker'],
  },
  {
    id: 'R11', label: 'The repository is published with the site', likelihood: 'low', impact: 'medium',
    fix: 'Publish from an explicit allow-list into dist/ rather than serving the repository root. Done, and checked again 2026-11-02: dist holds 128 files and no .sql, test or internal .md file', effort: 'Done',
    what: 'On 2026-10-09 the live Vercel host served the SQL migrations, the test files and the internal task list to anyone who asked.',
    why: 'Likelihood dropped to low: the Vercel project is deleted, the Worker serves dist only, and the build refuses to finish if a forbidden file reaches it. The repository being public is why this one mattered.',
    rel: ['ad:AD7', 'now:worker'],
  },
];

/* ------------------------------------------------------------------ *
 * 11. The threats that actually apply, and what stands in front of
 * each one. A threat with no mitigation named is a threat nobody owns.
 * ------------------------------------------------------------------ */

export const threats = [
  {
    id: 'orders', icon: 'eye', family: 'rose', label: 'A visitor reads another customer\'s orders', status: 'Implemented',
    mitigation: 'Row level security on every table, every query carrying the signed-in JWT',
    what: 'The classic multi-tenant leak: one customer seeing another\'s order history by changing an id.',
    why: 'Implemented. Policies are on all 23 tables and were checked against the live project on 2026-08-31.',
    rel: ['table:orders', 'flow:identity'],
  },
  {
    id: 'underpay', icon: 'card', family: 'green', label: 'A visitor pays less than the price', status: 'Implemented',
    mitigation: 'create_order reprices every line in the database. The browser sends ids and quantities only',
    what: 'A browser that can influence a price is a browser that can choose one.',
    why: 'Implemented, and unreachable until payment exists. The repricing covers stage options and faucet upgrades too, so the payment work extends it rather than inventing a second path.',
    rel: ['ad:AD4', 'flow:order', 'finding:F1'],
  },
  {
    id: 'xss', icon: 'alert', family: 'rose', label: 'Staff text reaching another staff member as script', status: 'Partial',
    mitigation: 'escapeHTML in js/main.js, used on every interpolation',
    what: 'Stored cross-site scripting through a staff screen: an edit that contains markup becomes markup for the next person to open the record.',
    why: 'Partial, and narrower than it was recorded as. js/admin.js has about thirty unescaped record-text sites; the other five dashboard files were checked on 2026-11-02 and escape theirs.',
    fixedBy: ['phase:P6'],
    rel: ['finding:F3', 'risk:R1', 'page:admin'],
  },
  {
    id: 'gate', icon: 'lock', family: 'violet', label: 'A customer opening a staff page', status: 'Refactor',
    mitigation: 'A policy, not markup',
    what: 'Someone signed in as an ordinary customer opening /admin/ and seeing something they should not.',
    why: 'Refactor. The data is protected and the gate is not. Nobody has tested it against a real customer account, which is U1.',
    fixedBy: ['phase:P4'],
    rel: ['finding:F4', 'unknown:U1', 'risk:R4'],
  },
  {
    id: 'spam', icon: 'filter', family: 'rose', label: 'Form spam and abuse', status: 'Partial',
    mitigation: 'Turnstile, plus a rate limit that survives the instance',
    what: 'Two endpoints open to the internet with no session: the cheapest thing in the project to abuse.',
    why: 'Partial, and in an awkward state. Server verification is written and skipped while the secret is unset; no page renders a widget, so setting the secret would refuse every real submission. The rate limit does not survive its instance.',
    fixedBy: ['phase:P6'],
    rel: ['now:turnstile', 'risk:R3', 'flow:inbound'],
  },
  {
    id: 'keys', icon: 'key', family: 'violet', label: 'A leaked key', status: 'Partial',
    mitigation: 'Secrets per environment in the platform store, never in the repository',
    what: 'A service role key or a payment secret in a place that can be read. The repository is public, which raises the stakes.',
    why: 'Partial. .gitignore covers .env*, the build refuses to publish it, and one Stripe test key was pasted into a chat transcript and has not been rolled.',
    rel: ['risk:R8', 'ad:AD7'],
  },
  {
    id: 'double', icon: 'undo', family: 'green', label: 'Payment taken twice', status: 'Missing',
    mitigation: 'A webhook write keyed on the Stripe event id',
    what: 'Stripe redelivers. A webhook that does not check the event id can charge or record twice.',
    why: 'Missing, with the rest of payment. It has to exist before the first real charge, not after.',
    fixedBy: ['phase:P3'],
    rel: ['risk:R2', 'flow:payment'],
  },
  {
    id: 'inject', icon: 'browser', family: 'slate', label: 'A third-party script changing the page', status: 'Post-MVP',
    mitigation: 'A Content-Security-Policy, after the inline handlers are gone',
    what: 'Anything that can inject a script into a page can read a form on it.',
    why: 'Post-MVP by decision. The pages still use inline handlers, so a policy written today would either break them or be weak enough to be theatre. It belongs after the escaping sweep.',
    fixedBy: ['trigger:csp'],
    rel: ['phase:P6'],
  },
];

/* Personal data held, and for how long. A retention rule nobody has
 * written is a retention rule nobody is following. */
export const personalData = [
  { what: 'Name, email, phone, delivery address', where: 'Supabase: profiles and orders.shipping_address', how: 'For the life of the account. No deletion flow exists' },
  { what: 'Contact form messages', where: 'Supabase: contact_messages, with the sender IP as a truncated hash', how: 'Indefinite. Worth a rule before volume makes one urgent' },
  { what: 'Newsletter addresses', where: 'Supabase: newsletter_subscribers', how: 'Until unsubscribed, and no unsubscribe path is built' },
  { what: 'Card details', where: 'Never touched. Stripe would hold them on its own hosted page', how: 'Not applicable, and it must stay that way' },
  { what: 'Staff hours, shifts, time off', where: 'Supabase: ten workforce tables and an audit log', how: 'For the life of employment, plus whatever payroll law requires. Unresolved: U5' },
];

/* ------------------------------------------------------------------ *
 * 12. Deliberately not built, and the condition that changes that.
 * This exists to prevent an argument later.
 * ------------------------------------------------------------------ */

export const triggers = [
  {
    id: 'r2', icon: 'box', family: 'slate', label: 'Cloudflare R2 for images', status: 'Post-MVP',
    trigger: 'Supabase Storage egress shows up on a bill, or image delivery becomes the slowest thing on a product page',
    what: 'Object storage for image originals, in front of or instead of the Supabase bucket.',
    why: 'Post-MVP. Nothing is slow and nothing is expensive yet.',
    rel: ['target:cfr2', 'now:storage'],
  },
  {
    id: 'd1', icon: 'database', family: 'slate', label: 'Cloudflare D1 instead of Supabase', status: 'Post-MVP',
    trigger: 'Two writers need to scale independently, or the Supabase bill outgrows the cost of a rewrite',
    what: 'Moving the data to Cloudflare\'s own database.',
    why: 'Post-MVP, and the most expensive idea in this list. D1 has no row level security, so moving would mean reimplementing every policy as application code. See AD3.',
    rel: ['ad:AD3', 'now:pg'],
  },
  {
    id: 'cron', icon: 'clock', family: 'slate', label: 'Cron Triggers for carts and reconciliation', status: 'Post-MVP',
    trigger: 'Payment is live and there is at least a month of real order data to reconcile against',
    what: 'Scheduled work: chasing an abandoned cart, reconciling payments against orders.',
    why: 'Post-MVP. The sales page already has a cart recovery screen that sends nothing, which is the honest version of this.',
    rel: ['target:cfcron', 'page:sales', 'phase:P3'],
  },
  {
    id: 'subs', icon: 'truck', family: 'slate', label: 'Subscriptions and replacement reminders', status: 'Post-MVP',
    trigger: 'The first cohort of customers reaches a filter change interval',
    what: 'Telling a customer their filter is due, and selling them the right one.',
    why: 'Post-MVP, and cheaper than it looks: system_filter_compatibilities already knows which filter fits which system, so the data is ready before the feature is.',
    rel: ['table:system_filter_compatibilities', 'phase:P8'],
  },
  {
    id: 'deletion', icon: 'person', family: 'slate', label: 'Customer data deletion and export', status: 'Post-MVP',
    trigger: 'Before any marketing to an EU or California audience, or on the first request, whichever comes first',
    what: 'A way for a customer to get their data out, and to have it removed.',
    why: 'Post-MVP by date, not by importance. The first request makes it urgent with no notice.',
    rel: ['table:contact_messages', 'unknown:U5'],
  },
  {
    id: 'csp', icon: 'shield', family: 'slate', label: 'A Content-Security-Policy', status: 'Post-MVP',
    trigger: 'After the escaping sweep in phase 6, when inline handlers are gone',
    what: 'A header that says which scripts may run.',
    why: 'Post-MVP, and deliberately so. _headers says the same thing in a comment: a policy written while inline handlers remain is either broken or theatre.',
    rel: ['threat:inject', 'phase:P6'],
  },
  {
    id: 'pixel', icon: 'eye', family: 'slate', label: 'Meta Pixel or Conversions API', status: 'Post-MVP',
    trigger: 'Before the first paid campaign, and not before, because a pixel brings a consent banner with it',
    what: 'Attribution for advertising.',
    why: 'Post-MVP. A pixel cannot report on the days before it existed, so the timing matters more than the work.',
    rel: ['asset:pixel', 'asset:analytics'],
  },
  {
    id: 'i18n', icon: 'globe', family: 'slate', label: 'A second language', status: 'Post-MVP',
    trigger: 'Someone asks. New York is multilingual and nobody has',
    what: 'Spanish, most likely.',
    why: 'Post-MVP with no evidence either way, which is U6. It doubles the cost of lifting copy out of the markup if the answer arrives late.',
    rel: ['unknown:U6', 'def:sections'],
  },
];

/* ------------------------------------------------------------------ *
 * 13. Architecture decisions. Numbered, dated, never renumbered.
 * The last two fields are the ones people skip and the ones that
 * matter in a year.
 * ------------------------------------------------------------------ */

export const decisions = [
  {
    id: 'AD1', theme: 'Platform', date: '2026-10-09', status: 'Implemented', icon: 'cloud', family: 'amber',
    title: 'Cloudflare, rather than staying on Vercel or on GitHub Pages',
    does: 'One project serves the static pages and runs the three server routes, behind one DNS zone we control.',
    need: 'The domain pointed at a host that cannot run server code, and the host that could had never been given its keys. Any fix that left two hosts in place left the same confusion.',
    here: 'Turnstile is already the captcha and is a Cloudflare product. Access closes the preview for free. WAF rate limiting fixes a finding that cannot be fixed in application code. Web Analytics needs no cookie and therefore no consent banner. All four come with the zone.',
    costs: 'A nameserver move, a port of three handlers to a non-Node runtime, and every library checked. There are no libraries: the handlers are dependency free.',
    now: 'Three routes and a static site sit far inside the free plan. Verified on 2026-11-02: the Worker deploys and answers.',
    replace: 'The server work grows beyond what a Worker can do inside its CPU limit, or a long-running job appears that wants a real Node host.',
    rel: ['ad:AD10', 'now:worker', 'phase:P1'],
  },
  {
    id: 'AD2', theme: 'Platform', date: '2026-10-09', status: 'Implemented', icon: 'bolt', family: 'amber',
    title: 'One file per route, rather than a Worker with a framework',
    does: 'Each route stays one file under api/, matching the original /api layout one to one, with a route table in worker.js in front of them.',
    need: 'The three routes are already written against standard web APIs and have no dependencies. They need a runtime, not a framework.',
    here: 'The site has no build step, and adding one to serve three endpoints would be the largest change in the project for the smallest reason.',
    costs: 'No file-based routing conveniences, and a request and response shim that has to be written once and tested. It is, nine times.',
    now: 'Three endpoints. A framework earns its place somewhere around twenty.',
    replace: 'The server surface grows past roughly a dozen routes, or server-rendered pages become necessary.',
    rel: ['ad:AD10', 'rq-shim'],
  },
  {
    id: 'AD3', theme: 'Data and money', date: '2026-10-09', status: 'Implemented', icon: 'database', family: 'teal',
    title: 'Supabase stays. The data does not move to D1',
    does: 'Postgres, row level security, Auth and Storage stay exactly where they are. Only the serving layer moves.',
    need: '23 tables, 12 applied migrations, policies on every table, a server-authoritative order function and nine security definer functions already exist and work.',
    here: 'D1 has no row level security. Moving would mean reimplementing every policy as application code behind a data access layer, with a test for every path, to gain a network hop. The security model is the most valuable thing in the project.',
    costs: 'A network hop from the Worker to Supabase, a second vendor, and a bill that grows with use.',
    now: 'The database is nowhere near being the bottleneck, and the policies are the reason the browser can safely hold a key at all.',
    replace: 'The Supabase bill becomes material, or the latency of that hop shows up in a measurement rather than in a worry.',
    rel: ['trigger:d1', 'now:pg'],
  },
  {
    id: 'AD4', theme: 'Data and money', date: '2026-10-09', status: 'Partial', icon: 'card', family: 'green',
    title: 'The money is recomputed in the database, and the webhook is the source of truth',
    does: 'The browser sends product ids and quantities. create_order prices every line, including stage options and faucet upgrades, checks stock and decrements it in one transaction. The Stripe webhook, not the browser redirect, marks an order paid.',
    need: 'A price that the browser can influence is a price a customer can choose. A redirect that the browser can skip is a payment that can be lost.',
    here: 'Half of it already exists and is tested. The payment work extends it rather than inventing a parallel path.',
    costs: 'The webhook has to verify its signature and be keyed on the event id, because Stripe will redeliver.',
    now: 'This is the one flow that has to be right the first time. Being taken twice for the same order is not something you can apologise your way out of.',
    replace: 'Never, as long as the site takes money.',
    rel: ['flow:payment', 'flow:order', 'risk:R2', 'phase:P3'],
  },
  {
    id: 'AD5', theme: 'How this is written', date: '2026-10-09', status: 'Implemented', icon: 'chart', family: 'blue',
    title: 'Every drawing and every detail panel is generated from one data file',
    does: 'docs/diagrams/model.mjs holds the system as data. scripts/diagrams.mjs draws every SVG from it, scripts/lib/graph.mjs derives every dependency list from its edges, and this document is generated too. Nothing is hand placed and no dependency is written out twice.',
    need: 'A status picture that is two weeks old is worse than none, because it is believed. Hand-drawn diagrams are never updated after the second time, and a hand-written "depends on" list is wrong within a month.',
    here: 'The site map with a status on every page is the one picture that answers "how far along are we", and it is read by whoever is paying rather than by whoever is building.',
    costs: 'A renderer to maintain, and layout expressed as code rather than dragged into place.',
    now: 'Nineteen drawings and every detail panel from one file, regenerated in under a second, with two drift checks failing a pull request where the picture and the model disagree.',
    replace: 'The drawings need art direction that layout code cannot express. Then export once to a design tool and accept that it is now a second copy.',
    rel: ['ad:AD6', 'def:status'],
  },
  {
    id: 'AD6', theme: 'How this is written', date: '2026-10-09', status: 'Implemented', icon: 'layers', family: 'violet',
    title: 'Icons are symbols, and diagram elements are components',
    does: 'Every icon is one SVG symbol, instanced with use. Every repeated diagram element is one component in scripts/lib/components.mjs, with its variants listed in a manifest the library sheet is drawn from.',
    need: 'It is the same rule the site runs on, applied to the drawings. An icon copied into three diagrams is three icons to fix.',
    here: 'It is also what makes the set exportable: a symbol library and a component manifest map one to one onto a design tool\'s components and instances, so the set can be rebuilt without being redrawn.',
    costs: 'Layout maths lives in code, and a component change redraws everything, which is the point and is occasionally startling.',
    now: 'Forty one symbols and nine components carry nineteen drawings, and the library sheet shows every one of them.',
    replace: 'The library is maintained in a design tool and exported into the repository, rather than the other way round.',
    rel: ['ad:AD5'],
  },
  {
    id: 'AD7', theme: 'Shipping it', date: '2026-10-09', status: 'Implemented', icon: 'filter', family: 'amber',
    title: 'The site is published from an explicit allow-list, not from the repository root',
    does: 'npm run build:site copies 16 named directories and 19 named files into dist/, refuses to finish if anything on a list of 14 forbidden patterns made it in, and writes a manifest.',
    need: 'Serving the repository root publishes the repository. Verified on 2026-10-09 against the live Vercel host: the SQL migrations, the test files and the internal task list were all downloadable by anyone.',
    here: 'A Worker has no special case for /api, so without this it would publish the server source as well. The repository is public, which makes the cost of getting this wrong immediate.',
    costs: 'Adding a file to the site means naming it in one list. That friction is the feature.',
    now: 'Checked again on 2026-11-02: dist holds 128 files and no .sql, test or internal .md file.',
    replace: 'A real build step appears for another reason, and can own the same list.',
    rel: ['risk:R11', 'target:cfassets'],
  },
  {
    id: 'AD8', theme: 'How this is written', date: '2026-10-09', status: 'Implemented', icon: 'page', family: 'blue',
    title: 'Montserrat for text, and a Canela-like serif for titles',
    does: 'Replaces Inter and Poppins across the site, the drawings and this document. Two tokens in css/styles.css and one in scripts/lib/tokens.mjs.',
    need: 'The brand reads as a premium product and was set in two geometric sans faces, which read as a technology product.',
    here: 'Changing it costs two tokens and a font link while the site is pre-launch. After launch it is a visual regression test across every page.',
    costs: 'Montserrat is a wider face than Inter, so anything that was close to wrapping now wraps. Canela is licensed, so Playfair Display stands in for it.',
    now: 'Both faces are on Google Fonts, so there is no licence to buy and no file to self-host yet.',
    replace: 'Canela is licensed. Then change the one token in each place, and self-host rather than loading from a third party.',
    rel: ['def:status'],
  },
  {
    id: 'AD9', theme: 'Shipping it', date: '2026-11-02', status: 'Partial', icon: 'check', family: 'blue',
    title: 'Cloudflare deploys from its own Git connection, and GitHub Actions only gates it',
    does: 'Cloudflare clones the repository, runs npm run build:site and deploys. Every push to main goes to production. GitHub Actions deploys nothing: it runs the tests and both drift checks, and branch protection on main makes them required.',
    need: 'The first plan had the workflow do the deploying, which meant an API token in repository secrets and a hand-built approval step. Two weeks of elapsed time later none of it was set up, and the setup was the reason.',
    here: 'It removes the credential entirely. A workflow that holds no token cannot leak one, and the repository is public, so that is worth more here than it would be elsewhere. The gate moves from a deploy approval to the merge, which is where a person already has to think.',
    costs: 'Production deploys on every push to main with no second confirmation. That is only safe because nothing reaches main without a reviewed, green pull request, so branch protection is load bearing rather than optional.',
    now: 'Partial: the deploy half works and branch protection is still not on, so the gate this decision depends on does not exist yet.',
    replace: 'Production needs to lag main deliberately, or a deploy needs to wait on something a merge cannot express, such as a migration run by a job rather than by hand.',
    rel: ['stage:merge', 'own-protect', 'stage:pr'],
  },
  {
    id: 'AD10', theme: 'Platform', date: '2026-11-02', status: 'Implemented', icon: 'bolt', family: 'amber',
    title: 'A Worker with static assets, because Cloudflare retired the Pages flow',
    does: 'worker.js routes /api/* to the three handlers and hands everything else to the ASSETS binding, which serves dist. wrangler.toml declares main and [assets] rather than pages_build_output_dir.',
    need: 'Creating a project now goes through the Workers flow. It requires a deploy command, fills in wrangler deploy, and issues a build token with Workers permissions. Five builds failed: first on the wrong command, then on the Pages API refusing a Workers-scoped token. The platform had moved; the configuration had not.',
    here: 'The handlers in api/ did not change, and neither did functions/_shim.js. A Pages Function is handed { request, env } and so is this, so one adapter serves both. The files under functions/ still work if the Pages flow ever returns.',
    costs: 'Routing is now a table in worker.js rather than the filesystem, so a new endpoint means a line there as well as a file. Six tests pin that table down.',
    now: 'Verified on 2026-11-02 against the live Worker: three routes answer, method guards return 405, an unknown /api path returns 404 rather than a file.',
    replace: 'The route list outgrows one screen, or Cloudflare offers file-based routing for Workers.',
    rel: ['ad:AD1', 'ad:AD2', 'now:worker', 'phase:P2'],
  },
];

/* ------------------------------------------------------------------ *
 * 14. Questions and unknowns. Numbered, owned, with what each one
 * blocks, as ids rather than as prose. Answered ones stay, marked
 * answered with the date; the trail is the value.
 * ------------------------------------------------------------------ */

export const unknowns = [
  {
    id: 'U1', status: 'Missing', icon: 'lock', family: 'violet',
    question: 'Does opening /admin/ as an ordinary customer expose anything at all?',
    why: 'Row level security should mean the page renders and every query returns nothing. Should is not a result. Until someone signs in as a customer and looks, the gate is an assumption.',
    how: 'Create a customer account on a preview, open each of the five private pages, and read the network tab as well as the screen.',
    owner: 'Codex',
    blocks: ['phase:P4', 'phase:P6', 'finding:F4'],
    rel: ['risk:R4', 'threat:gate'],
  },
  {
    id: 'U2', status: 'Missing', icon: 'drop', family: 'blue',
    question: 'Are the NYC water figures on /nyc-water/ defensible?',
    why: 'They are presented as fact to a New York audience and were written as first-draft illustrative numbers. Publishing an unverified water quality claim is a different kind of mistake from a layout bug.',
    how: 'Check every figure against the NYC DEP annual water quality reports. Anything that cannot be sourced is removed or labelled illustrative in the page itself.',
    owner: 'Owner, with Claude Code',
    blocks: ['phase:P10'],
    rel: ['risk:R6', 'page:water'],
  },
  {
    id: 'U3', status: 'Missing', icon: 'mail', family: 'blue',
    question: 'Which Resend sending domain, and is it verified?',
    why: 'EMAIL_FROM is noreply@crystalina.org. Mail from an unverified domain is either rejected or filed as spam, and an order confirmation in a spam folder looks exactly like an order that was never taken.',
    how: 'Verify crystalina.org in Resend, add the DNS records, and send one real test to an address outside the company. Entangled with U8.',
    owner: 'Owner',
    blocks: ['phase:P3', 'phase:P8'],
    rel: ['unknown:U8', 'now:resend', 'own-resend'],
  },
  {
    id: 'U4', status: 'Missing', icon: 'branch', family: 'amber',
    question: 'Is there a second Supabase project for preview, or does preview share production data?',
    why: 'Two environments with one database is one environment. A test order placed on a preview would decrement real stock and send a real email.',
    how: 'Decide. If the answer is one project, then preview must be read-only and say so, loudly, in the handoff.',
    owner: 'Owner, with Codex',
    blocks: ['stage:preview', 'phase:P1'],
    rel: ['stage:preview'],
  },
  {
    id: 'U5', status: 'Missing', icon: 'clock', family: 'slate',
    question: 'What retention does the workforce data need, and under what rule?',
    why: 'Ten tables and an audit log hold staff hours, shifts and time off. Payroll records carry statutory retention periods, and nobody has named one.',
    how: 'Ask whoever handles payroll what the obligation is, then write it down as a retention policy with a job that enforces it.',
    owner: 'Owner',
    blocks: [],
    rel: ['table:workforce_audit_log', 'trigger:deletion'],
  },
  {
    id: 'U6', status: 'Missing', icon: 'globe', family: 'slate',
    question: 'Does the site need Spanish?',
    why: 'The audience is New York City. Nobody has asked for it, and retrofitting language into a site with copy in the markup is considerably harder than planning for it.',
    how: 'Ask. If the answer is yes or probably, lift the page copy out of the markup in the same pass as the repeatable items rather than twice.',
    owner: 'Owner',
    blocks: [],
    rel: ['trigger:i18n', 'def:sections'],
  },
  {
    id: 'U7', status: 'Missing', icon: 'people', family: 'slate',
    question: 'Who maintains this after launch, and how technical are they?',
    why: 'It decides how much is editable from the admin console and how much is a developer task forever.',
    how: 'Name the person. If they are not technical, the three things with no single home stop being tidy-up and become required work.',
    owner: 'Owner',
    blocks: ['phase:P10'],
    rel: ['def:sections', 'def:shipping', 'page:home'],
  },
  {
    id: 'U8', status: 'Missing', icon: 'alert', family: 'rose',
    question: 'How does Google Workspace on crystalina.org get unlocked, and what does the DNS move do to it?',
    why: 'The Workspace subscription is suspended behind a Squarespace reseller lock, so info@crystalina.org is not receiving mail. Two consequences: every contact notification is being written and not read, and the nameserver move in phase 5 touches the same zone that carries the MX records. Doing the cutover without knowing the mail state risks turning a suspended mailbox into a deleted one.',
    how: 'Resolve the reseller lock with Squarespace, or move the mail to a provider that is not behind it. Either way, record the MX, SPF, DKIM and DMARC records before the nameservers move and recreate them in Cloudflare DNS.',
    owner: 'Owner',
    blocks: ['phase:P5', 'phase:P3', 'asset:inbox'],
    rel: ['unknown:U3', 'own-workspace', 'now:dns'],
    added: '2026-11-02',
  },
];

/* ------------------------------------------------------------------ *
 * 15. One definition, read everywhere. What is defined once, and the
 * places where a second copy has already appeared.
 * ------------------------------------------------------------------ */

export const definitions = [
  {
    id: 'tokens', thing: 'Design tokens and components', home: 'css/styles.css', readers: ['Every page', 'Every dashboard'], status: 'Implemented',
    what: 'The palette, the type scale, the unified button and every component the pages are assembled from.',
    why: 'Implemented. It is the part of the project that most clearly follows the rule.',
  },
  {
    id: 'ui', thing: 'Shared UI, icons, escaping', home: 'js/main.js', readers: ['Storefront', 'Dashboards'], status: 'Implemented',
    what: 'The header, the footer, the cart drawer, the icon set and escapeHTML. The footer and its five social icons are built here from one array, so they are genuinely one definition.',
    why: 'Implemented. escapeHTML living here is why the gap in js/admin.js is a sweep rather than a rewrite.',
    rel: ['finding:F3', 'def:social'],
  },
  {
    id: 'catalog', thing: 'Product catalogue', home: 'Supabase products, mirrored in js/product-catalog.js', readers: ['Shop', 'Product', 'Checkout', 'Admin', 'The tests'], status: 'Partial',
    what: 'Seventeen products. The database holds cents and is authoritative; the JavaScript mirror holds dollars and exists so the tests can check SKUs and slugs without a network call.',
    why: 'Partial, because it is a second copy with a test holding it honest rather than a single definition. The test is what makes it defensible.',
    rel: ['table:products', 'finding:F2'],
  },
  {
    id: 'sections', thing: 'Published page sections', home: 'Supabase site_content', readers: ['Home'], status: 'Partial',
    note: 'The trust bar, category tiles, testimonials, water facts and process steps are still in the HTML',
    what: 'The copy a manager can change without a developer. The hero and the section text are published; five blocks of repeatable items are not.',
    why: 'Partial, and the gap matters most if whoever maintains this is not technical, which is U7.',
    rel: ['unknown:U7', 'table:site_content', 'page:home'],
  },
  {
    id: 'shipping', thing: 'Free shipping threshold', home: 'Nowhere. Written out ten times in six files', readers: ['Announcement bar', 'Cart drawer', 'Checkout', 'Shop copy', 'Home hero', 'create_order'], status: 'Refactor',
    note: 'Six arithmetic sites and four sentences of copy, with no shared constant',
    what: 'The $99 free delivery threshold. Checked 2026-11-02: it appears on ten lines across six files, six of them arithmetic and four of them prose, and the $9.99 flat fee is duplicated three times alongside it.',
    why: 'Refactor, and worse than the three places it was recorded as. The database is authoritative because create_order computes shipping; the other nine are copies of a number that the database already knows.',
    rel: ['table:orders', 'unknown:U7'],
  },
  {
    id: 'social', thing: 'Navigation and social links', home: 'js/main.js, except the schema.org copy', readers: ['Every storefront page', 'index.html sameAs'], status: 'Partial',
    what: 'NAV_LINKS and SOCIALS are arrays in js/main.js, rendered into every storefront page by one function. The schema.org sameAs list in index.html names four of the same profiles again.',
    why: 'Partial, and better than it was recorded as: the footer is one definition, and only the sameAs list is a second copy. Two things to fix alongside it, both checked 2026-11-02: the five staff pages have no footer at all, and the three footer legal links still point at "#" although privacy/ and terms/ now exist in the repository. Neither of those two pages is named in the publish allow-list, so neither reaches dist and neither would answer on the live site even once the links are pointed at them.',
    rel: ['def:ui', 'asset:social'],
  },
  {
    id: 'status', thing: 'Status vocabulary, drawings and dependencies', home: 'docs/diagrams/model.mjs', readers: ['Blueprint', 'Contact sheet', 'Any progress report'], status: 'Implemented',
    what: 'The five status words, every drawing, and every dependency list in this document. The lists are derived from the edges in this file, never written out.',
    why: 'Implemented, with two drift checks that fail a pull request where a drawing or a page no longer matches its source.',
    rel: ['ad:AD5', 'ad:AD6'],
  },
];
