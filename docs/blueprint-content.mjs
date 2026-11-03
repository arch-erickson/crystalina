/* The blueprint, as content rather than as a page.
 *
 * This file and docs/diagrams/model.mjs are the source. docs/blueprint.html,
 * docs/blueprint.artifact.html and docs/blueprint.md are generated from them
 * by
 *
 *     npm run blueprint
 *
 * Do not edit any generated file. If a decision changes, change it here or
 * in the model, in the same commit as the code it describes.
 *
 * **What belongs here, and what does not.** This file holds the connecting
 * sentences: the ones that say why a drawing is on the page and what to
 * look at in it. Everything else, every "what this is", every "why it has
 * that status", every dependency, belongs on the node in
 * docs/diagrams/model.mjs, where it is one click away from the card that
 * names it and cannot drift from the drawing. If a paragraph here is really
 * detail about one thing, it is in the wrong file.
 *
 * Section ids were rewritten on 2026-11-02 from s1..s18 to the names below,
 * because the order changed. Decision ids (AD1 to AD10) and unknown ids
 * (U1 to U8) are never renumbered, and are what anything else should cite.
 *
 * Block types the renderer understands:
 *   p, h3, h4, ul, ol, table, callout, diagram, index,
 *   matrix, secrets, verified, personal
 */

export const doc = {
  title: 'Crystalina blueprint',
  subtitle: 'Water filtration for New York City. Pure Water. Pure Life.',
  lede: 'What Crystalina is, what actually runs today, and what stands between it and an open shop. Every drawing is generated from one data file, every card in every drawing can be clicked for what it is and what it is waiting on, and every status word is one of five.',
  shape: 'Shop',
  status: 'Building',
  prepared: '2026-10-09',
  revised: '2026-11-02. The server boundary works for the first time: the Worker is live and all three API routes answer, checked against the live host. The Vercel project is deleted and the domain still points at GitHub Pages. Google sign-in is enabled and there is no password anywhere in the project. Four claims that had been carried forward unchecked were wrong and are corrected below. Every card in every drawing is now clickable.',
};

export const sections = [

/* ================================================================= */
{
  id: 'stands',
  title: 'Where this stands',
  blocks: [
    { t: 'p', text: 'Crystalina is a premium home water filtration shop for New York City: seventeen products with real compatibility and bundle relationships, a customer account, and five private pages for admin, managers, sales and field technicians. The design is built. The database is built and protected. As of today the server boundary runs as well. What is missing is a way to take money, a shelf that is not sold out, and a domain pointed at the half that works.' },
    { t: 'diagram', name: 'findings.svg' },
    {
      t: 'callout', kind: 'note', title: 'How to read this document',
      text: 'Every card in every drawing opens a panel: what the thing is, why it carries the status it carries, what it is waiting on, and what is waiting on it. Both lists are derived from one data file rather than written out, so they cannot drift. Click through a chain and the trail at the top of the panel remembers where you started. Nothing here is fetched: with scripting off, the same detail is an index at the foot of the page.',
    },
    { t: 'h3', text: 'The path, in four lines' },
    {
      t: 'ol',
      items: [
        'Build the payment path once, carefully, with the money recomputed on the server and the webhook keyed so a retry cannot charge twice. This is now the largest remaining piece of work.',
        'Seed the catalogue. It is half a day, it is blocked on nothing, and it is the difference between a shop and a page of sold-out items.',
        'Close the three findings that are each under a day: escape one file, put the captcha widget on three forms, move the rate limit to the edge.',
        'Then move the nameservers, which is what makes everything already built visible to a visitor.',
      ],
    },
    { t: 'h3', text: 'What was checked, when, and how' },
    { t: 'verified' },
    {
      t: 'callout', kind: 'warn', title: 'Four things this document used to say that were not true',
      items: [
        'That all four staff dashboards interpolated record text unescaped. One does, about thirty times: js/admin.js. The other five files escape theirs.',
        'That the free shipping threshold was written in three places. It was written on ten lines across six files, six of them arithmetic; since 2026-11-03 the arithmetic reads one database row.',
        'That stock was 0 on all thirteen products. There are seventeen published rows; four systems carry stock 1 and the other thirteen carry 0.',
        'That the environment variables were unset and every server call returned 500. The Worker answers, and the method guards and validators on all three routes were exercised against the live host today.',
      ],
    },
  ],
},

/* ================================================================= */
{
  id: 'today',
  title: 'What runs today',
  blocks: [
    { t: 'p', text: 'One working host nobody visits, and one stale host everybody visits. That is the whole of the remaining hosting problem, and it is one nameserver change rather than the two half-deployments it was a month ago.' },
    { t: 'diagram', name: 'architecture-now.svg' },
    {
      t: 'callout', kind: 'warn', title: 'The shape of the problem',
      text: 'The repository is correct. Both deployments are correct in isolation. What is wrong is that the domain points at the half that cannot run code. No amount of further building fixes that; one nameserver change does, and it is held up by a question about mail rather than by anything technical.',
    },
  ],
},

/* ================================================================= */
{
  id: 'request',
  title: 'How one request travels',
  blocks: [
    { t: 'p', text: 'The Worker makes one branch and then a short series of decisions in a fixed order. This is the drawing to read before changing anything in the server boundary, because it is the only place where the route table, the shim and the handler guards are visible together.' },
    { t: 'diagram', name: 'request-path.svg' },
  ],
},

/* ================================================================= */
{
  id: 'target',
  title: 'Where it is going',
  blocks: [
    { t: 'p', text: 'The same picture with the domain in front of it, and with the four things that only exist once the zone is on Cloudflare: Access on the previews, WAF rate limiting on the API, Web Analytics with no cookie, and a captcha that has a widget as well as a verifier.' },
    { t: 'diagram', name: 'architecture-target.svg' },
    {
      t: 'callout', kind: 'learn', title: 'The rule that survives the choice',
      text: 'Two environments, secrets per environment, a deploy that is one command and a rollback that is one more. If a platform ever makes one of those four hard, that is the signal to look again rather than to work around it.',
    },
    { t: 'h3', text: 'What only the owner can do' },
    { t: 'diagram', name: 'owner-tasks.svg' },
  ],
},

/* ================================================================= */
{
  id: 'channels',
  title: 'Channels and accounts already held',
  blocks: [
    { t: 'p', text: 'Crystalina is not a new project, so most of the "go and open an account" work is already done. The question on each card is not whether the account exists; it is whether the site uses it, and whether the move breaks it.' },
    { t: 'diagram', name: 'channels.svg' },
    {
      t: 'callout', kind: 'warn', title: 'One of these changed, and not for the better',
      text: 'Google Workspace on the domain is suspended behind a Squarespace reseller lock, so info@crystalina.org is not receiving mail. The contact form still writes its row, so no enquiry is lost, but nobody is told one arrived. It also sits on the same DNS zone as the nameserver move, which is why it is recorded as U8 rather than as a nuisance.',
    },
  ],
},

/* ================================================================= */
{
  id: 'pages',
  title: 'Every page, and the state of the work behind it',
  blocks: [
    { t: 'p', text: 'The one picture that answers "how far along are we". Click any page for what it looks like today beside what is left to do on it. Menu, search and footer links are left out on purpose: drawn, they turn the arrows into a web. Dashed arrows are staff actions that reach a customer page.' },
    { t: 'diagram', name: 'sitemap.svg' },
    { t: 'h3', text: 'The same thing as a table' },
    { t: 'matrix' },
    { t: 'h3', text: 'And the same thing as photographs' },
    { t: 'p', text: 'Captured from the served site at three widths, so a redesign has a before to be judged against and a reader who has never opened the shop can see it without a server. Every page is here, and the home page is here twice: whole, and then section by section, in the order a visitor meets them. Each of these also appears inside its own page bubble above.' },
    { t: 'screens' },
    { t: 'h3', text: 'Looked at by someone else' },
    { t: 'p', text: 'Two reviews on 2026-11-03, both measured in headless Chrome rather than estimated. The first, docs/ux-review.md, was taken at 80c3b9a by the agent of the deploy session: sixty-seven findings over nineteen pages, ranked against CLAUDE.md, then WCAG 2.1 AA, then the Nielsen Norman heuristics, then Baymard. The second, by the reviewer of this session after the redesign, was nineteen findings over seventeen pages with 246 captures. Everything in either that still stood at the time of reading is fixed on main: a skip link, a focus ring that clears 3 to 1 everywhere, the cart as a real dialog, labels and autocomplete on every form, live regions where a page repaints, 44 pixel targets on phones, contrast on the navy band, one word for delivery and one for fitting, no grade on our own products. Two things were not taken: the three legal pages stay unpublished until the owner approves their wording, and struck-through compare prices are hidden until each is confirmed to have been a real price. Both are on the claims register in docs/voice-guide.md.' },
    {
      t: 'callout', kind: 'learn', title: 'Refreshing the captures',
      text: 'Serve the site, then run npm run screens. The script captures every page and every data-home-section element at 1366, 834 and 390 pixels wide, writes them to docs/screens as webp and rewrites docs/screens/index.json, which this section and the page bubbles are both generated from. Run npm run blueprint afterwards, as for any other change. Staff pages are captured signed out, so they show what a visitor who guesses the address sees, which is the honest version.',
    },
  ],
},

/* ================================================================= */
{
  id: 'data',
  title: 'The content model',
  blocks: [
    { t: 'p', text: 'Twenty three tables in one Supabase project, grouped by what they are for. The fields shown are the ones another part of the system depends on, not every column. The panel at the foot of the drawing is the sentence the whole data design turns on.' },
    { t: 'diagram', name: 'data-model.svg' },
    {
      t: 'callout', kind: 'warn', title: 'Migrations',
      text: 'Additive and re-runnable: create or replace, if not exists, drop-then-create for policies. Forward only, numbered, applied as a job rather than by hand. Keep it that way: a migration that cannot be run twice will eventually be run twice.',
    },
  ],
},

/* ================================================================= */
{
  id: 'flows',
  title: 'The flows that carry money, identity or anything irreversible',
  blocks: [
    { t: 'p', text: 'Five flows, each with the happy path numbered and the failure path drawn beside it rather than left in a footnote. These are the only flows drawn, because these are the only ones where being wrong costs something a reload cannot undo.' },
    { t: 'diagram', name: 'flow-order.svg' },
    { t: 'diagram', name: 'flow-payment.svg' },
    { t: 'diagram', name: 'flow-identity.svg' },
    { t: 'diagram', name: 'flow-publish.svg' },
    { t: 'diagram', name: 'flow-inbound.svg' },
  ],
},

/* ================================================================= */
{
  id: 'security',
  title: 'Security and privacy',
  blocks: [
    { t: 'p', text: 'Every threat that actually applies, in the column that says whether anything stands in front of it. The right-hand column is the work, and two of the three cards in the middle column are the same single file.' },
    { t: 'diagram', name: 'threats.svg' },
    { t: 'h3', text: 'Personal data held' },
    { t: 'personal' },
    {
      t: 'callout', kind: 'note', title: 'Deliberately accepted',
      text: 'The five security headers in _headers, carried over from the Vercel configuration unchanged, are nosniff, a strict referrer policy, DENY framing, a closed permissions policy and HSTS with preload. There is no Content-Security-Policy: the pages still use inline handlers, so a policy written today would either break them or be weak enough to be theatre. It belongs after the escaping sweep, not before it.',
    },
  ],
},

/* ================================================================= */
{
  id: 'deploy',
  title: 'Deployment, environments and secrets',
  blocks: [
    { t: 'diagram', name: 'deployment.svg' },
    { t: 'h3', text: 'Every value, and where it is allowed to exist' },
    { t: 'secrets' },
    {
      t: 'callout', kind: 'warn', title: 'One deploy path, not two',
      text: 'Cloudflare can deploy from its own Git connection or from a workflow in the repository. Pick one. With both connected, every push deploys twice, the two race, and the one that wins is whichever finished last. The Git connection is the choice here, and GitHub Actions only gates it. See AD9, which is Partial rather than done: the branch protection the whole decision rests on is not switched on yet.',
    },
  ],
},

/* ================================================================= */
{
  id: 'budget',
  title: 'Performance budget',
  blocks: [
    { t: 'p', text: 'The targets are set and the bars are empty, because nothing has been measured on a served copy yet. A guessed number in a budget is worse than an empty one: it gets believed. npm run verify reports transferred weight per page and fills these in.' },
    { t: 'diagram', name: 'performance-budget.svg' },
    {
      t: 'ul',
      items: [
        'The site is static HTML, CSS and JavaScript with no build step, so there is no bundler cost to argue about and no framework runtime to pay for.',
        'Imagery is the whole budget. The hero is allowed to be the single heaviest asset on the site; everything below the fold is lazy.',
        'Cache busting is not in place. Styles and scripts are referenced with no version or hash, so a returning visitor can hold a stale stylesheet after a deploy. This is almost always the cause when a site looks broken for some people and not others.',
      ],
    },
  ],
},

/* ================================================================= */
{
  id: 'plan',
  title: 'Build plan',
  blocks: [
    { t: 'p', text: 'Phases, not dates. An arrow means the phase it points at cannot honestly start before the one behind it has finished. P2 is the first to finish, and it finished by changing a deploy target rather than a handler.' },
    { t: 'diagram', name: 'build-plan.svg' },
  ],
},

/* ================================================================= */
{
  id: 'risks',
  title: 'Risks',
  blocks: [
    { t: 'diagram', name: 'risks.svg' },
    {
      t: 'callout', kind: 'note', title: 'What moved on 2026-11-02',
      text: 'R1 dropped from high likelihood to medium when the other five dashboard files were checked and found to escape their record text. R10 and R11 both dropped: the Worker deploys inside the free plan, and the Vercel host that was publishing the repository has been deleted. Nothing got worse. R3 is still an hour of work and still in the top row.',
    },
  ],
},

/* ================================================================= */
{
  id: 'once',
  title: 'One definition, read everywhere',
  blocks: [
    { t: 'p', text: 'Anything that appears twice is built once, and a variation is a parameter rather than a second copy. This is the rule the whole project runs on, and it is the rule that quietly breaks first.' },
    { t: 'diagram', name: 'one-definition.svg' },
    { t: 'p', text: 'The library can be looked at as well as read. docs/components.html is a page in the repository that loads the real stylesheet and the real script and renders every token, button, heading, band, card, wash and icon the storefront is built from, with the real header above it. Serve the site and open /docs/components.html. It is outside the publish allow-list, so it never reaches a customer, and because it uses the live components rather than copies of them, it cannot drift from the site.' },
    {
      t: 'callout', kind: 'warn', title: 'The one that is worse than it looked',
      text: 'The free shipping threshold was recorded as living in three places. Checked on 2026-11-02 it was on ten lines across six files: six of them arithmetic, including both versions of create_order, and four of them sentences of customer-facing copy. On 2026-11-03 it moved to shipping_policy, one enforced row that create_order reads on the server and Store.shippingPolicy() reads in the browser, so the cart drawer and the checkout quote the figure the order is charged. The seven sentences of prose wrap the figure in a span that main.js fills from the same row, so the words and the arithmetic cannot disagree. The announcement bar is the one copy left, because staff edit it as a sentence.',
    },
  ],
},

/* ================================================================= */
{
  id: 'later',
  title: 'Deliberately not built',
  blocks: [
    { t: 'p', text: 'This section exists to prevent an argument later. Every card is a decision not to build something, and the text on it is the condition that reverses that decision.' },
    { t: 'diagram', name: 'postponed.svg' },
  ],
},

/* ================================================================= */
{
  id: 'decisions',
  title: 'Architecture decisions',
  blocks: [
    { t: 'p', text: 'Ten decisions, numbered, dated and never renumbered, grouped by what they decide rather than by when they were taken. Click a card for what it does, why it belongs here, what it costs and when it should be replaced. The last of those is the field people skip and the one that matters in a year.' },
    { t: 'diagram', name: 'decisions.svg' },
  ],
},

/* ================================================================= */
{
  id: 'unknowns',
  title: 'Questions and unknowns',
  blocks: [
    { t: 'p', text: 'Numbered, owned, and drawn beside what each one is holding up. An unknown with no owner is a decision nobody is making. Answered ones stay here, marked answered with the date, rather than being deleted; the trail is the value.' },
    { t: 'diagram', name: 'unknowns.svg' },
  ],
},

/* ================================================================= */
{
  id: 'drawings',
  title: 'The drawing system',
  blocks: [
    { t: 'p', text: 'Every drawing is assembled from one icon library and nine components, and coloured by a palette where the colour carries meaning rather than decoration. Learn the seven families once and no drawing needs a legend.' },
    {
      t: 'table',
      head: ['Family', 'Stands for'],
      rows: [
        ['Blue', 'The visitor, and anything a customer touches'],
        ['Amber', 'The edge: hosting, DNS, caching, the things in front'],
        ['Violet', 'Identity, secrets, anything that proves who someone is'],
        ['Teal', 'Data at rest'],
        ['Green', 'Money, and the things that must be exactly right'],
        ['Rose', 'Danger, failure paths, and anything untrusted'],
        ['Slate', 'Neutral, and anything deliberately postponed'],
      ],
    },
    { t: 'p', text: 'A status word is a family too, so Partial is the same amber on a card, in a table and in a progress report. The word is printed on every chip as well as the colour, and anything that does not exist yet also carries a dashed outline, so a monochrome printout and a colour-blind reader both lose nothing. An arrow takes the colour of what it points at, which means a path through a drawing can be followed by colour alone.' },
    { t: 'diagram', name: 'component-library.svg' },
  ],
},

/* ================================================================= */
{
  id: 'index',
  title: 'Everything, one card at a time',
  blocks: [
    { t: 'p', text: 'Every card in every drawing, as a panel. This is where the detail lives, and it is the same content the drawings open: clicking a card above and finding its entry here reach the same place. With scripting switched off this section is the document, and every dependency is an ordinary link.' },
    { t: 'index' },
  ],
},

/* ================================================================= */
{
  id: 'kept',
  title: 'How this document is kept true',
  blocks: [
    {
      t: 'ul',
      items: [
        'The source is docs/blueprint-content.mjs for the connecting sentences and docs/diagrams/model.mjs for everything else. Three surfaces are generated and none is written by hand: the Artifact, which is the one to send anybody; docs/blueprint.html, the same page as a file; and docs/blueprint.md, for reading in a pull request. Editing any of the three is work the next regeneration silently destroys.',
        'Detail belongs on the node, not in the prose. If a paragraph in the content file is really about one thing, it belongs on that thing in the model, where it is one click from the card that names it.',
        'Dependencies are never written out. Every "depends on" and "what depends on it" list is derived from the edges in the model by scripts/lib/graph.mjs, in both directions. A cross-reference that names a node which does not exist fails the build rather than becoming a dead link.',
        'npm run docs rebuilds every drawing and all three surfaces. npm run check runs the tests, the publish allow-list and both drift checks, so a stale picture or a page that has drifted from its source cannot survive a pull request.',
        'Amend this in the same commit as the change it describes. A decision that changes in code and not here is a decision that will be made again, differently.',
        'Mark an answered question answered, with the date and the answer. Do not delete it. Never renumber a decision or an unknown.',
        'More than one session commits to main. Read COORDINATION.md before editing, and pull before you start and before each push.',
      ],
    },
    {
      t: 'callout', kind: 'learn', title: 'Publish from one place',
      text: 'The Artifact is published from this repository and nowhere else. Anyone republishing it pulls first and republishes to the same URL rather than creating a second one. A generated document published from two places stops matching its own sources quietly, and the next person to rebuild wipes out work nobody remembers doing.',
    },
  ],
},

/* ================================================================= */
];
