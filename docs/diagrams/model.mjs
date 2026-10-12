/* The one data list behind every diagram in the blueprint.
 *
 * WebWork playbook 02: "Drive it from one data list, not from hand-placed
 * text, and update that list after every batch of work." Nothing in
 * docs/diagrams/*.svg is drawn by hand. Edit this file, run
 *
 *     npm run diagrams
 *
 * and every drawing, and the contact sheet at docs/diagrams/index.html,
 * is rebuilt.
 *
 * Status words are the five from WebWork playbook 13 and nothing else:
 *   Implemented  built, checked, doing its job
 *   Partial      some of it is built; the rest is named and planned
 *   Missing      not started
 *   Refactor     exists, has to be rebuilt somewhere else before it counts
 *   Post-MVP     deliberately not now
 *
 * Every `verified` date is the day someone actually checked, not the day the
 * line was written. If a date here is more than about a week old, re-check
 * before trusting it.
 */

export const meta = {
  project: 'Crystalina',
  tagline: 'Pure Water. Pure Life.',
  domain: 'crystalina.org',
  asOf: '2026-10-11',
  /* Two dates, because they were checked by different means and one is
     older. Never collapse them into a single reassuring number. */
  stateVerified: '2026-10-09',
  verified: {
    hosting: {
      date: '2026-10-09',
      how: 'Requested the live hosts. crystalina.org answers with Server: GitHub.com, crystalina.vercel.app answers with Server: Vercel, and POST /api/newsletter still returns 500, so the environment variables are still unset. Six weeks on, nothing in the hosting picture has moved.',
    },
    tests: {
      date: '2026-10-09',
      how: 'npm test: 20 tests, 20 pass.',
    },
    database: {
      date: '2026-08-31',
      how: 'Migrations, the site-media bucket and the staff-gated catalog functions were checked against the live project. Not re-checked since; treat as the older half of this record.',
    },
  },
  shape: 'shop',
  target: 'Cloudflare Pages, Pages Functions and Turnstile, with Supabase kept for data and identity',
};

/* ------------------------------------------------------------------ *
 * 1 and 2. Architecture, as it is today and as it is being moved to.
 * ------------------------------------------------------------------ */

export const architecture = {
  now: {
    title: 'Architecture today',
    note: 'Two hosts serve the same repository. crystalina.org is static GitHub Pages, so the /api folder never runs there; the Vercel project runs the functions but has no environment variables set, so every server path returns 500. Verified 2026-08-31.',
    zones: [
      {
        id: 'visitor', col: 0, family: 'blue',
        label: 'Who is asking',
        nodes: [
          { id: 'customer', family: 'blue', icon: 'person', label: 'Customer browser', detail: 'Pages, cart in localStorage', status: 'Implemented' },
          { id: 'staff', family: 'violet', icon: 'people', label: 'Staff browser', detail: 'Admin, manager, sales, technician', status: 'Partial', note: 'Access decided in markup' },
        ],
      },
      {
        id: 'serving', col: 1, family: 'amber',
        label: 'Serving today',
        nodes: [
          { id: 'pages', family: 'amber', icon: 'server', label: 'GitHub Pages', detail: 'crystalina.org, static files only', status: 'Implemented', note: 'No server, so /api is dead here' },
          { id: 'vercel', family: 'amber', icon: 'bolt', label: 'Vercel functions', detail: 'crystalina.vercel.app /api/*', status: 'Partial', note: 'Deployed, environment unset' },
          { id: 'dns', family: 'amber', icon: 'globe', label: 'Squarespace DNS', detail: 'Four GitHub Pages A records', status: 'Refactor', note: 'Has to move to Cloudflare' },
        ],
      },
      {
        id: 'data', col: 2, family: 'teal',
        label: 'Data and identity',
        nodes: [
          { id: 'pg', family: 'teal', icon: 'database', label: 'Supabase Postgres', detail: '23 tables, RLS on, 12 migrations applied', status: 'Implemented' },
          { id: 'auth', family: 'violet', icon: 'key', label: 'Supabase Auth', detail: 'Email sign-in, JWT, user_roles', status: 'Partial', note: 'No reset, no verification' },
          { id: 'storage', family: 'teal', icon: 'image', label: 'Supabase Storage', detail: 'site-media bucket, public reads', status: 'Implemented' },
        ],
      },
      {
        id: 'third', col: 2, family: 'slate',
        label: 'Third parties',
        nodes: [
          { id: 'resend', family: 'blue', icon: 'mail', label: 'Resend', detail: 'Transactional email', status: 'Partial', note: 'Code wired, key unset' },
          { id: 'turnstile', family: 'rose', icon: 'shield', label: 'Turnstile', detail: 'Server verification only', status: 'Partial', note: 'No widget on any form' },
          { id: 'stripe', family: 'green', icon: 'card', label: 'Stripe', detail: 'Payment', status: 'Missing', note: 'Zero references in the codebase' },
        ],
      },
    ],
    edges: [
      { from: 'customer', to: 'pages', label: 'static pages' },
      { from: 'staff', to: 'pages', label: 'dashboards' },
      { from: 'customer', to: 'vercel', label: '/api, returns 500', tone: 'amber' },
      { from: 'dns', to: 'pages', label: 'A records', tone: 'mute', dash: '4 3' },
      { from: 'pages', to: 'pg', label: 'publishable key, RLS reads' },
      { from: 'pages', to: 'auth', label: 'sign in' },
      { from: 'pages', to: 'storage', label: 'images' },
      { from: 'vercel', to: 'pg', label: 'service role writes', tone: 'amber' },
      { from: 'vercel', to: 'resend', label: 'send', tone: 'amber' },
      { from: 'vercel', to: 'turnstile', label: 'verify', tone: 'amber' },
    ],
  },

  target: {
    title: 'Architecture after the move to Cloudflare',
    note: 'One platform serves the site and the server boundary, and one DNS zone sits in front of both. Supabase is kept: the schema, the row level security and the server-authoritative order function already exist and work, and moving them to D1 would be a rewrite with nothing to show for it (AD3). Turnstile is already the captcha, so it comes home to the same account.',
    zones: [
      {
        id: 'visitor', col: 0, family: 'blue',
        label: 'Who is asking',
        nodes: [
          { id: 'customer', family: 'blue', icon: 'person', label: 'Customer browser', detail: 'Pages, cart in localStorage', status: 'Implemented' },
          { id: 'staff', family: 'violet', icon: 'people', label: 'Staff browser', detail: 'Admin, manager, sales, technician', status: 'Refactor', note: 'Gate moves to a policy' },
        ],
      },
      {
        id: 'cf', col: 1, family: 'amber',
        label: 'Cloudflare (one account)',
        nodes: [
          { id: 'cfdns', family: 'amber', icon: 'globe', label: 'Cloudflare DNS', detail: 'crystalina.org zone, proxied', status: 'Missing', note: 'Nameserver change, phase 5' },
          { id: 'cfpages', family: 'amber', icon: 'cloud', label: 'Pages', detail: 'Static site, production and preview', status: 'Missing', note: 'Phase 1' },
          { id: 'cffn', family: 'amber', icon: 'bolt', label: 'Pages Functions', detail: 'functions/api/*, Workers runtime', status: 'Missing', note: 'Port of /api, phase 2' },
          { id: 'cfts', family: 'rose', icon: 'shield', label: 'Turnstile', detail: 'Widget plus server verification', status: 'Partial', note: 'Server side already done' },
          { id: 'cfaccess', family: 'violet', icon: 'lock', label: 'Access', detail: 'Preview and staging gate', status: 'Missing', note: 'Phase 1' },
          { id: 'cfwaf', family: 'rose', icon: 'filter', label: 'WAF rate limiting', detail: 'Durable limit on /api/*', status: 'Missing', note: 'Replaces the in-process limiter' },
          { id: 'cfanalytics', family: 'blue', icon: 'chart', label: 'Web Analytics', detail: 'No cookie, no consent banner', status: 'Missing', note: 'Phase 5' },
          { id: 'cfcron', family: 'slate', icon: 'clock', label: 'Cron Triggers', detail: 'Abandoned cart, expiry, reconciliation', status: 'Post-MVP' },
          { id: 'cfr2', family: 'slate', icon: 'box', label: 'R2', detail: 'Image originals', status: 'Post-MVP', note: 'Only if Storage egress bites' },
        ],
      },
      {
        id: 'data', col: 2, family: 'teal',
        label: 'Data and identity (kept)',
        nodes: [
          { id: 'pg', family: 'teal', icon: 'database', label: 'Supabase Postgres', detail: 'RLS, create_order, catalog RPCs', status: 'Implemented' },
          { id: 'auth', family: 'violet', icon: 'key', label: 'Supabase Auth', detail: 'Email sign-in, JWT, user_roles', status: 'Partial', note: 'Reset and verification to add' },
          { id: 'storage', family: 'teal', icon: 'image', label: 'Supabase Storage', detail: 'site-media bucket', status: 'Implemented' },
        ],
      },
      {
        id: 'third', col: 2, family: 'slate',
        label: 'Third parties',
        nodes: [
          { id: 'stripe', family: 'green', icon: 'card', label: 'Stripe', detail: 'Checkout Session plus webhook', status: 'Missing', note: 'Phase 3, blocks launch' },
          { id: 'resend', family: 'blue', icon: 'mail', label: 'Resend', detail: 'Transactional email', status: 'Partial', note: 'Needs a verified domain' },
          { id: 'sentry', family: 'rose', icon: 'alert', label: 'Error monitoring', detail: 'Functions and browser', status: 'Missing', note: 'Phase 9' },
        ],
      },
    ],
    edges: [
      { from: 'customer', to: 'cfdns', label: 'crystalina.org' },
      { from: 'staff', to: 'cfdns', label: 'dashboards' },
      { from: 'cfdns', to: 'cfpages', label: 'proxied' },
      { from: 'cfpages', to: 'cffn', label: '/api/*' },
      { from: 'cfwaf', to: 'cffn', label: 'rate limit', tone: 'mute', dash: '4 3' },
      { from: 'cfaccess', to: 'cfpages', label: 'preview only', tone: 'mute', dash: '4 3' },
      { from: 'cfts', to: 'cffn', label: 'token check', tone: 'mute' },
      { from: 'cfpages', to: 'pg', label: 'publishable key, RLS reads' },
      { from: 'cfpages', to: 'auth', label: 'sign in' },
      { from: 'cfpages', to: 'storage', label: 'images' },
      { from: 'cffn', to: 'pg', label: 'service role, RPCs' },
      { from: 'cffn', to: 'stripe', label: 'session, webhook' },
      { from: 'cffn', to: 'resend', label: 'send' },
      { from: 'cfcron', to: 'pg', label: 'scheduled work', tone: 'mute', dash: '4 3' },
    ],
  },
};

/* ------------------------------------------------------------------ *
 * 3. What the owner already holds.
 *
 * Crystalina is not a new project, so most of the "go and create an
 * account" work in the WebWork playbook is already done. These are real
 * assets with real history, and the Cloudflare move must not break any of
 * them. What matters here is the second column: an account that exists but
 * is not connected to the shop is doing nothing.
 * ------------------------------------------------------------------ */

export const assets = {
  note: 'Held already, so no phase asks for them. The question each one answers is not "do we have it" but "is it wired to the site, and does the move break it".',
  groups: [
    {
      id: 'identityAssets', family: 'blue', label: 'Domain and search', col: 0,
      items: [
        {
          icon: 'globe', label: 'crystalina.org', detail: 'Owned. DNS at Squarespace today',
          wired: 'Partial', note: 'Zone moves to Cloudflare in phase 5. Registrar can stay where it is',
        },
        {
          icon: 'search', label: 'Google Search Console', detail: 'Verified by file at /googlea4ca9585bd44aaf9.html',
          wired: 'Implemented', note: 'Keep that file served at the root or verification lapses on the new host',
        },
        {
          icon: 'page', label: 'sitemap.xml and robots.txt', detail: 'Seven URLs listed',
          wired: 'Partial', note: 'Missing /product/ and /checkout/; no entry is dated',
        },
        {
          icon: 'tag', label: 'Google Merchant Center', detail: 'Product feed for free listings and Shopping',
          wired: 'Missing', note: 'No feed exists. 13 products with no feed is free traffic left on the table',
        },
        {
          icon: 'chart', label: 'Analytics', detail: 'Who arrives, and from where',
          wired: 'Missing', note: 'Cloudflare Web Analytics after the move: no cookie, so no consent banner',
        },
      ],
    },
    {
      id: 'metaAssets', family: 'violet', label: 'Meta and messaging', col: 1,
      items: [
        {
          icon: 'layers', label: 'Meta Business Account', detail: 'Holds the Facebook page and the Instagram account',
          wired: 'Partial', note: 'Account exists; nothing on the site talks to it',
        },
        {
          icon: 'flag', label: 'Facebook page', detail: 'profile.php?id=61591728311575',
          wired: 'Implemented', note: 'Linked from the footer and the schema.org sameAs list',
        },
        {
          icon: 'link', label: 'Instagram and X', detail: '@crystalinawater',
          wired: 'Implemented', note: 'Linked from the footer',
        },
        {
          icon: 'link', label: 'LinkedIn', detail: 'company/crystalina-water',
          wired: 'Implemented', note: 'Linked from the footer',
        },
        {
          icon: 'eye', label: 'Meta Pixel or Conversions API', detail: 'Attribution for anything paid',
          wired: 'Missing', note: 'Decide before spending on ads, not after. A pixel also makes the cookie banner a real question',
        },
        {
          icon: 'tag', label: 'Meta product catalog', detail: 'Shopping tags on Instagram and Facebook',
          wired: 'Missing', note: 'Same feed as Merchant Center would serve both',
        },
      ],
    },
    {
      id: 'contactAssets', family: 'green', label: 'How a customer reaches a human', col: 2,
      items: [
        {
          icon: 'chat', label: 'WhatsApp (917) 809-4803', detail: 'wa.me/19178094803',
          wired: 'Implemented', note: 'Footer, hero, and the floating button on every page',
        },
        {
          icon: 'chat', label: 'WhatsApp Business', detail: 'Catalog, away messages, several agents',
          wired: 'Missing', note: 'A wa.me link is not the Business app. Worth it the week after launch',
        },
        {
          icon: 'mail', label: 'info@crystalina.org', detail: 'Where the contact form lands',
          wired: 'Partial', note: 'The form writes to the database; the email needs a Resend domain and a key',
        },
        {
          icon: 'phone', label: 'Phone (917) 809-4803', detail: 'Same number as WhatsApp',
          wired: 'Implemented', note: 'In the footer and the contact page',
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ *
 * 4. The site map, with a status on every page (blueprint 9b).
 * Menu, search and footer links are left out on purpose, or the arrows
 * become a web. Staff actions that reach a customer page are dashed.
 * ------------------------------------------------------------------ */

export const pages = [
  {
    id: 'home', icon: 'page', label: 'Home', route: '/', area: 'client', col: 0, row: 0,
    design: 'Implemented', server: 'Partial',
    built: ['Hydrates hero, sections and best sellers from site_content', 'Products read with the publishable key'],
    remaining: ['Trust bar, category tiles, testimonials and water facts are still in the HTML'],
  },
  {
    id: 'shop', icon: 'cart', label: 'Shop', route: '/shop/', area: 'client', col: 1, row: 0,
    design: 'Implemented', server: 'Implemented',
    built: ['Catalog, filter, search and sort read from Supabase'],
    remaining: ['Stock is 0 on all 13 items, so every card reads out of stock'],
  },
  {
    id: 'product', icon: 'box', label: 'Product', route: '/product/?id=', area: 'client', col: 2, row: 0,
    design: 'Implemented', server: 'Partial',
    built: ['Product, specs, compatibility and bundle relationships', 'Related products'],
    remaining: ['product_stage_options is empty, so no 5, 6 or 7 stage choice renders', 'No faucet products exist, so the upgrade control has nothing to offer'],
  },
  {
    id: 'checkout', icon: 'card', label: 'Checkout', route: '/checkout/', area: 'client', col: 3, row: 0,
    design: 'Implemented', server: 'Partial',
    built: ['POST /api/orders/create, server-authoritative pricing through create_order', 'Borough selector, 8.875% tax, stock enforced in one transaction'],
    remaining: ['No payment: the submit button is disabled on purpose', 'No Turnstile widget, though the server expects a token'],
  },
  {
    id: 'quiz', icon: 'filter', label: 'Find your filter', route: '/quiz/', area: 'client', col: 1, row: 1,
    design: 'Implemented', server: 'Implemented',
    built: ['Five questions, recommendation computed in the browser'],
    remaining: ['Nothing. No server work needed'],
  },
  {
    id: 'water', icon: 'drop', label: 'NYC water', route: '/nyc-water/', area: 'client', col: 0, row: 1,
    design: 'Implemented', server: 'Missing',
    built: ['Charts and FAQ render from values in the page'],
    remaining: ['Figures are illustrative and unverified against NYC DEP reports (U2)'],
  },
  {
    id: 'about', icon: 'people', label: 'About', route: '/about/', area: 'client', col: 0, row: 2,
    design: 'Implemented', server: 'Missing',
    built: ['Static brand story'],
    remaining: ['Nothing. No server work needed'],
  },
  {
    id: 'contact', icon: 'mail', label: 'Contact', route: '/contact/', area: 'client', col: 1, row: 2,
    design: 'Implemented', server: 'Partial',
    built: ['POST /api/contact validates, rate limits and writes contact_messages', 'Resend email to CONTACT_INBOX when the key is set'],
    remaining: ['Returns 500 in production: no environment variables are set', 'No Turnstile widget'],
  },
  {
    id: 'signin', icon: 'key', label: 'Sign in', route: '/signin/', area: 'client', col: 2, row: 1,
    design: 'Implemented', server: 'Partial',
    built: ['CrystalinaAuth on Supabase Auth, real sessions'],
    remaining: ['No password reset, no email verification', 'Store.signUp and Store.signIn stubs still exist and must be retired'],
  },
  {
    id: 'account', icon: 'person', label: 'Account', route: '/account/', area: 'client', col: 3, row: 1,
    design: 'Implemented', server: 'Refactor',
    built: ['Order history read under RLS'],
    remaining: ['Still reads local session state instead of CrystalinaAuth'],
  },
  {
    id: 'admin', icon: 'gear', label: 'Admin console', route: '/admin/', area: 'staff', col: 0, row: 0,
    design: 'Implemented', server: 'Partial',
    built: ['Catalog writes through upsert_product and delete_product, gated on has_role', 'Content editor publishes site_content', 'Image upload to the site-media bucket'],
    remaining: ['Access decided in the browser, not by a policy (U1)', 'Record fields reach innerHTML unescaped: stored XSS route', 'No screen for stage options or faucet assignment'],
  },
  {
    id: 'manager', icon: 'calendar', label: 'Manager', route: '/manager/', area: 'staff', col: 1, row: 0,
    design: 'Implemented', server: 'Partial',
    built: ['Inventory, support, technician schedules and job assignment'],
    remaining: ['Same browser-side gate and same unescaped interpolation'],
  },
  {
    id: 'sales', icon: 'chart', label: 'Sales', route: '/sales/', area: 'staff', col: 2, row: 0,
    design: 'Implemented', server: 'Partial',
    built: ['Leads, sales, customers and campaign screens'],
    remaining: ['Cart recovery sends nothing: no scheduled job exists'],
  },
  {
    id: 'tech', icon: 'wrench', label: 'Technician', route: '/technician/', area: 'staff', col: 3, row: 0,
    design: 'Implemented', server: 'Partial',
    built: ['Assigned jobs, checklists, statuses, installation photos'],
    remaining: ['Same browser-side gate', 'Photos upload but are not tied to an order record'],
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
        { name: 'profiles', fields: ['id -> auth.users', 'full_name', 'phone'], status: 'Implemented' },
        { name: 'user_roles', fields: ['user_id', 'role'], status: 'Implemented', note: 'private.has_role() reads this' },
      ],
    },
    {
      id: 'catalog', family: 'blue', label: 'Catalog', col: 1,
      tables: [
        { name: 'products', fields: ['id', 'slug', 'name', 'price_cents', 'stock', 'product_kind', 'details', 'published'], status: 'Partial', note: 'Stock 0 on 13 rows' },
        { name: 'product_stage_options', fields: ['product_id', 'stages', 'price_cents', 'is_default'], status: 'Missing', note: 'Table exists, no rows' },
        { name: 'product_bundle_items', fields: ['bundle_id', 'item_id', 'quantity'], status: 'Implemented' },
        { name: 'system_filter_bundles', fields: ['system_id', 'bundle_id'], status: 'Implemented' },
        { name: 'system_filter_compatibilities', fields: ['system_id', 'filter_id', 'fit'], status: 'Implemented' },
        { name: 'reviews', fields: ['product_id', 'user_id', 'rating', 'body'], status: 'Partial', note: 'No submission screen' },
      ],
    },
    {
      id: 'commerce', family: 'green', label: 'Commerce', col: 2,
      tables: [
        { name: 'orders', fields: ['id', 'user_id', 'status', 'subtotal_cents', 'tax_cents', 'total_cents', 'shipping_address'], status: 'Partial', note: 'No paid state yet' },
        { name: 'order_items', fields: ['order_id', 'product_id', 'stage_option_id', 'faucet_id', 'quantity', 'unit_price_cents'], status: 'Implemented' },
      ],
    },
    {
      id: 'inbound', family: 'amber', label: 'Inbound and content', col: 3,
      tables: [
        { name: 'contact_messages', fields: ['name', 'email', 'message', 'created_at'], status: 'Implemented' },
        { name: 'newsletter_subscribers', fields: ['email', 'created_at'], status: 'Implemented' },
        { name: 'site_content', fields: ['key', 'payload jsonb', 'published_at'], status: 'Implemented', note: 'What Publish to website writes' },
      ],
    },
    {
      id: 'workforce', family: 'slate', label: 'Workforce', col: 4,
      tables: [
        { name: 'staff_shifts', fields: ['id', 'starts_at', 'ends_at', 'role'], status: 'Implemented' },
        { name: 'shift_assignments', fields: ['shift_id', 'user_id', 'state'], status: 'Implemented' },
        { name: 'shift_change_requests', fields: ['assignment_id', 'kind', 'state'], status: 'Implemented' },
        { name: 'staff_availability', fields: ['user_id', 'weekday', 'window'], status: 'Implemented' },
        { name: 'staff_time_off_requests', fields: ['user_id', 'from', 'to', 'state'], status: 'Implemented' },
        { name: 'time_entries', fields: ['user_id', 'clock_in', 'clock_out'], status: 'Implemented' },
        { name: 'timesheet_periods', fields: ['starts_on', 'ends_on'], status: 'Implemented' },
        { name: 'timesheet_submissions', fields: ['period_id', 'user_id', 'state'], status: 'Implemented' },
        { name: 'staff_notifications', fields: ['user_id', 'kind', 'read_at'], status: 'Implemented' },
        { name: 'workforce_audit_log', fields: ['actor', 'action', 'payload'], status: 'Implemented' },
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
    'Every privileged write goes through /api with the service role, or a security definer function gated on private.has_role().',
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
    note: 'Server-authoritative and atomic, and deliberately unreachable: nothing takes money yet, so the submit button in /checkout/ is disabled.',
    lanes: [
      { family: 'blue', icon: 'browser', id: 'b', label: 'Browser', detail: '/checkout/' },
      { family: 'amber', icon: 'bolt', id: 'fn', label: 'Server boundary', detail: 'POST /api/orders/create' },
      { family: 'rose', icon: 'shield', id: 'ts', label: 'Turnstile', detail: 'siteverify' },
      { family: 'teal', icon: 'database', id: 'db', label: 'Postgres', detail: 'create_order()' },
      { family: 'blue', icon: 'mail', id: 'mail', label: 'Resend', detail: 'confirmation' },
    ],
    steps: [
      { from: 'b', to: 'fn', label: 'ids, quantities, address, token. No prices', n: 1 },
      { from: 'fn', to: 'fn', label: 'method guard, 10 per 10 minutes per IP, body capped at 64KB', n: 2, self: true },
      { from: 'fn', to: 'ts', label: 'verify token', n: 3 },
      { from: 'fn', to: 'fn', label: 'JWT to user, UUIDs checked, max 50 lines, quantity 1 to 99', n: 4, self: true },
      { from: 'fn', to: 'db', label: 'create_order(items, address) as the signed-in user', n: 5 },
      { from: 'db', to: 'db', label: 'reprice every line, check stock, decrement, insert order: one transaction', n: 6, self: true },
      { from: 'db', to: 'fn', label: 'order id and total', n: 7, back: true },
      { from: 'fn', to: 'mail', label: 'confirmation email', n: 8 },
      { from: 'fn', to: 'b', label: '201 and the order id', n: 9, back: true },
    ],
    failures: [
      'No session: 401 before anything is read.',
      'Bad or missing captcha token: 400, nothing written.',
      'Out of stock: create_order raises, the transaction rolls back, no partial order.',
      'Resend unavailable or key unset: the order stands and the email is skipped. Email never gates the order.',
      'Today, in production: no environment variables, so the function cannot reach Supabase and returns 500.',
    ],
  },
  {
    id: 'payment',
    title: 'Taking the money (Stripe, phase 3)',
    status: 'Missing',
    note: 'Nothing of this exists yet. Drawn because it is the one flow that must be right the first time: a payment that is taken twice, or an order marked paid that was not, is not a bug you can apologise your way out of.',
    lanes: [
      { family: 'blue', icon: 'browser', id: 'b', label: 'Browser', detail: '/checkout/' },
      { family: 'amber', icon: 'bolt', id: 'fn', label: 'Pages Function', detail: '/api/checkout/session' },
      { family: 'green', icon: 'card', id: 'st', label: 'Stripe', detail: 'Checkout' },
      { family: 'amber', icon: 'bolt', id: 'hook', label: 'Pages Function', detail: '/api/stripe/webhook' },
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
    note: 'The data is protected by row level security, which is the part that matters. What is wrong is the gate in front of the dashboards: it is markup, and markup is a suggestion.',
    lanes: [
      { family: 'blue', icon: 'browser', id: 'b', label: 'Browser', detail: '/signin/' },
      { id: 'auth', family: 'violet', icon: 'key', label: 'Supabase Auth', detail: 'email and password' },
      { family: 'violet', icon: 'page', id: 'page', label: 'Dashboard page', detail: '/admin/, /manager/, ...' },
      { family: 'teal', icon: 'database', id: 'db', label: 'Postgres', detail: 'RLS and has_role()' },
    ],
    steps: [
      { from: 'b', to: 'auth', label: 'email and password', n: 1 },
      { from: 'auth', to: 'b', label: 'session and JWT', n: 2, back: true },
      { from: 'b', to: 'page', label: 'open a staff page', n: 3 },
      { from: 'page', to: 'page', label: 'today: the page itself decides what to show. This is the hole', n: 4, self: true, tone: 'amber' },
      { from: 'page', to: 'db', label: 'every query carries the JWT', n: 5 },
      { from: 'db', to: 'db', label: 'row level security, and private.has_role() on every privileged function', n: 6, self: true },
      { from: 'db', to: 'page', label: 'only the rows this role may see', n: 7, back: true },
    ],
    failures: [
      'Customer opens /admin/ directly: the markup renders, and every query returns nothing. Verifying that "nothing" really is nothing is U1.',
      'Expired JWT: queries fail closed, and the page sends the visitor back to sign in.',
      'Role removed while signed in: the next query fails, not the next page load.',
      'Password reset and email verification do not exist yet, so a locked-out customer has no self-service path.',
    ],
  },
  {
    id: 'publish',
    title: 'Staff changing what a visitor sees',
    status: 'Partial',
    note: 'Editing is local until someone presses Publish to website. That is deliberate: a manager can work through changes without a half-finished page going live.',
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
      'Staff text reaches another staff member through innerHTML unescaped. That is a stored XSS route and it is open today.',
      'No cache busting on the published payload yet, so a returning visitor can hold a stale section for one load.',
    ],
  },
  {
    id: 'inbound',
    title: 'A stranger sending something in',
    status: 'Partial',
    note: 'Contact and newsletter share one shape. Both are open to the internet with no session, so they are the cheapest thing to abuse and the first thing to harden.',
    lanes: [
      { family: 'blue', icon: 'browser', id: 'b', label: 'Browser', detail: 'form' },
      { family: 'rose', icon: 'filter', id: 'waf', label: 'Cloudflare', detail: 'WAF rate limit' },
      { family: 'amber', icon: 'bolt', id: 'fn', label: 'Pages Function', detail: '/api/contact' },
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
      'No widget on the form today, so no token is sent and verification is skipped while the secret is unset.',
      'Rate limit is in-process only today: serverless instances are short lived and unshared, so it blunts casual abuse and nothing more.',
      'Mail fails: the row is already written and the submission is not lost.',
      'Today, in production: 500. The environment variables are not set, so the function cannot reach Supabase.',
    ],
  },
];

/* ------------------------------------------------------------------ *
  * 7. Deployment: two environments, one deploy path, one rollback.
 * ------------------------------------------------------------------ */

export const deployment = {
  note: 'One deploy path, not two. Cloudflare Pages can deploy from its own Git connection or from a workflow; picking both means every push deploys twice. The workflow is chosen because the tests and the render harness have to pass first.',
  stages: [
    { id: 'dev', family: 'slate', icon: 'branch', label: 'Working tree', detail: 'npm test, npm run build:site, node scripts/verify.mjs', status: 'Partial', note: 'Harness added, no browser installed yet' },
    { id: 'pr', family: 'blue', icon: 'check', label: 'Pull request', detail: 'GitHub Actions: tests, harness, diagram drift', status: 'Missing' },
    { id: 'preview', family: 'violet', icon: 'eye', label: 'Pages preview', detail: 'Per-branch URL behind Cloudflare Access, noindex', status: 'Missing' },
    { id: 'approve', family: 'amber', icon: 'person', label: 'Manual approval', detail: 'A person presses it. Migrations first', status: 'Missing' },
    { id: 'prod', family: 'green', icon: 'rocket', label: 'Production', detail: 'crystalina.org through the Cloudflare zone', status: 'Missing' },
    { id: 'rollback', family: 'slate', icon: 'undo', label: 'Rollback', detail: 'Promote the previous Pages deployment', status: 'Missing', note: 'Practise once before launch' },
  ],
  environments: [
    { name: 'Preview', host: '<branch>.crystalina.pages.dev', data: 'Supabase preview project', gate: 'Cloudflare Access, noindex' },
    { name: 'Production', host: 'crystalina.org', data: 'Supabase production project', gate: 'Public' },
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
  * 8. Performance budget. `measured` stays null until the harness has
 * actually rendered the page. A guessed number in a budget is worse
 * than an empty one, because it gets believed.
 * ------------------------------------------------------------------ */

export const budget = {
  note: 'Target is the first screen on a mid-range phone over 4G. Nothing here has been measured yet: scripts/verify.mjs reports transferred weight per page, and these bars fill in once it has been run against a served copy.',
  unit: 'KB transferred, first screen',
  rows: [
    { page: '/', budget: 420, measured: null, heavy: 'hero-bg.webp is allowed to be the single heaviest asset' },
    { page: '/shop/', budget: 380, measured: null, heavy: 'Twelve product thumbnails, lazy below the fold' },
    { page: '/product/', budget: 400, measured: null, heavy: 'One large product photo' },
    { page: '/checkout/', budget: 220, measured: null, heavy: 'No imagery. Should be the lightest page' },
    { page: '/admin/', budget: 600, measured: null, heavy: 'Staff only, on a desktop. Deliberately allowed to be heavy' },
  ],
};

/* ------------------------------------------------------------------ *
  * 9. Build plan. Phases, what each needs first, and what it changes.
 * ------------------------------------------------------------------ */

export const phases = [
  { id: 'P1', family: 'amber', icon: 'cloud', label: 'Cloudflare project and secrets', needs: [], status: 'Missing', col: 0, row: 0, owner: 'Owner, then Codex', detail: 'Pages project, Access on the preview, every secret set per environment' },
  { id: 'P2', family: 'amber', icon: 'bolt', label: 'Port /api to Pages Functions', needs: ['P1'], status: 'Partial', col: 1, row: 0, owner: 'Codex', detail: 'Three routes, one runtime shim, tests green' },
  { id: 'P3', family: 'green', icon: 'card', label: 'Stripe checkout and webhook', needs: ['P2'], status: 'Missing', col: 2, row: 0, owner: 'Codex', detail: 'Server repricing, signature check, idempotent write' },
  { id: 'P4', family: 'violet', icon: 'key', label: 'Finish the auth migration', needs: ['P1'], status: 'Partial', col: 1, row: 1, owner: 'Codex', detail: 'Retire the stubs, extend CrystalinaAuth, reset and verification' },
  { id: 'P5', family: 'amber', icon: 'globe', label: 'DNS cutover to Cloudflare', needs: ['P2', 'P3'], status: 'Missing', col: 3, row: 0, owner: 'Owner', detail: 'Nameservers, then the redirect allow-list in Supabase' },
  { id: 'P6', family: 'rose', icon: 'shield', label: 'Security hardening', needs: ['P2'], status: 'Partial', col: 2, row: 1, owner: 'Codex', detail: 'XSS sweep, Turnstile widgets, WAF rate limit, advisors' },
  { id: 'P7', family: 'blue', icon: 'box', label: 'Seed the catalog', needs: [], status: 'Missing', col: 0, row: 2, owner: 'Claude Code', detail: 'Stage options, faucet products, real stock' },
  { id: 'P8', family: 'green', icon: 'truck', label: 'Order lifecycle', needs: ['P3'], status: 'Missing', col: 3, row: 1, owner: 'Codex', detail: 'Dispatch mail, status transitions, refunds' },
  { id: 'P9', family: 'slate', icon: 'bell', label: 'Backups and monitoring', needs: ['P5'], status: 'Missing', col: 4, row: 0, owner: 'Codex', detail: 'Scheduled Supabase backups, errors from functions and browser' },
  { id: 'P10', family: 'green', icon: 'rocket', label: 'Launch', needs: ['P5', 'P6', 'P7', 'P9'], status: 'Missing', col: 5, row: 0, owner: 'Both', detail: 'Checklist, analytics, handover' },
];

/* ------------------------------------------------------------------ *
  * 10. Risks, placed by likelihood and impact.
 * ------------------------------------------------------------------ */

export const risks = [
  { id: 'R1', label: 'Unescaped staff text in the dashboards', likelihood: 'high', impact: 'high', fix: 'Sweep js/admin.js, js/manager.js, js/sales.js, js/technician.js and the schedule modules through escapeHTML', effort: 'A day' },
  { id: 'R2', label: 'Payment taken twice on a webhook redelivery', likelihood: 'medium', impact: 'high', fix: 'Key the write on the Stripe event id before the first real charge', effort: 'Half a day, inside phase 3' },
  { id: 'R3', label: 'Rate limit does not survive the instance', likelihood: 'high', impact: 'medium', fix: 'Cloudflare WAF rate limiting on /api/*, which the move makes free', effort: 'An hour' },
  { id: 'R4', label: 'Dashboards gated in the browser only', likelihood: 'medium', impact: 'high', fix: 'Prove with a customer account that /admin/ exposes nothing, then move the gate to a policy', effort: 'A day' },
  { id: 'R5', label: 'Two hosts serving one domain', likelihood: 'high', impact: 'medium', fix: 'The Cloudflare move retires both. One platform, one deploy path', effort: 'Phases 1, 2 and 5' },
  { id: 'R6', label: 'Unverified NYC water figures published as fact', likelihood: 'medium', impact: 'high', fix: 'Check every number against NYC DEP reports, or mark it illustrative in the page', effort: 'Half a day' },
  { id: 'R7', label: 'No backups ever restored', likelihood: 'low', impact: 'high', fix: 'Schedule them, then restore one into a scratch project', effort: 'Half a day' },
  { id: 'R8', label: 'Stripe test key pasted into a chat transcript', likelihood: 'high', impact: 'low', fix: 'Roll it. It is a test key, and rolling it costs nothing', effort: 'Minutes' },
  { id: 'R9', label: 'Stock 0 everywhere, so the shop reads sold out', likelihood: 'high', impact: 'medium', fix: 'Seed real stock with the stage options in phase 7', effort: 'Half a day' },
  { id: 'R10', label: 'Worker size and CPU limits on the free plan', likelihood: 'medium', impact: 'low', fix: 'Let the deploy fail on size rather than guessing. Workers Paid is five dollars', effort: 'Minutes' },
  { id: 'R11', label: 'The whole repository is published with the site', likelihood: 'high', impact: 'medium', fix: 'Publish from an explicit allow-list into dist/ rather than serving the repository root. Verified 2026-10-09: the migrations, the tests and the task list are all downloadable from the live Vercel host', effort: 'An hour, inside phase 1' },
];

/* ------------------------------------------------------------------ *
  * 11. One definition, two surfaces. What is defined once and read
 * everywhere, and the places where a second copy has already appeared.
 * ------------------------------------------------------------------ */

export const definitions = [
  { thing: 'Design tokens and components', home: 'css/styles.css', readers: ['Every page', 'Every dashboard'], status: 'Implemented' },
  { thing: 'Shared UI, icons, escaping', home: 'js/main.js', readers: ['Storefront', 'Dashboards'], status: 'Implemented' },
  { thing: 'Product catalog', home: 'Supabase products, mirrored in js/product-catalog.js', readers: ['Shop', 'Product', 'Checkout', 'Admin'], status: 'Implemented' },
  { thing: 'Published page sections', home: 'Supabase site_content', readers: ['Home'], status: 'Partial', note: 'Trust bar, tiles, testimonials and water facts are still in the HTML' },
  { thing: 'Free shipping threshold', home: 'Nowhere. Written in three places', readers: ['Header', 'Cart drawer', 'Checkout'], status: 'Refactor', note: 'Pick one home before launch' },
  { thing: 'Navigation and social links', home: 'Nowhere. In every page head', readers: ['Every page'], status: 'Refactor' },
  { thing: 'Status vocabulary and diagrams', home: 'docs/diagrams/model.mjs', readers: ['Blueprint', 'Contact sheet', 'Any progress report'], status: 'Implemented' },
];
