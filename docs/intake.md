# Intake

The answers the blueprint is built on. Written 2026-10-09.

Crystalina already existed when this was written, so most of these were read
out of the repository and the live site rather than asked. **An answer taken
from the code is marked as such, and is weaker than one from the owner.**
Where nobody has said, it says nobody has said, rather than guessing.

---

## The five that have to be answered before anything is built

### 1. What is this site for, and what does a good visit end with?

Selling home water filtration systems to people in New York City, and giving
them enough about NYC tap water to believe they need one. A good visit ends
with an order, or with a WhatsApp message to a human. Both paths are built
into every page; only the second one currently works.

_Source: the site itself, and README.md._

### 2. Who reads it, from where, on what device, in what language?

New York City residents, in English. Device split is unknown: there is no
analytics of any kind on the site, so nobody can say what share is on a
phone. NYC is heavily multilingual and nobody has asked for Spanish (U6).

There is a second audience the site is also built for: staff. Four
role-gated workspaces for admin, managers, sales and field technicians, used
on a desktop.

_Source: the code. The device question is genuinely unanswered._

### 3. What is the content, who writes it, how often does it change?

Thirteen products with real compatibility and bundle relationships, plus the
page sections on the home page. An admin or manager edits both in the
console and presses **Publish to website**; edits are local until then.

Not editable, and so a developer task every time: the trust bar, the category
tiles, the testimonials, the water facts, the process steps, the navigation
and social links, the free shipping threshold, and the stage options and
faucet assignments.

_Source: the code, and DEPLOY_STEPS.md section 3._

### 4. Does it take money, hold accounts, or store anything about a person?

- **Money:** intended, not yet. No payment provider is integrated and the
  checkout button is disabled on purpose.
- **Accounts:** yes. Customers through Supabase Auth, and staff with roles
  in `user_roles`.
- **Personal data:** name, email, phone, delivery address, contact messages,
  newsletter addresses, and ten tables of staff hours, shifts, time off and
  an audit log. Card details are never touched; Stripe will hold them on its
  own page.

Retention is unwritten for all of it, and the workforce data probably has a
statutory period nobody has named (U5).

_Source: the schema and the code._

### 5. Who maintains it after launch, and how technical are they?

**Nobody has said.** This is U7, and it is the answer that most changes the
scope: if whoever maintains it is not technical, then every item in the "not
editable" list above stops being tidy-up and becomes required work.

---

## The rest

### What already exists, that a new project would have to go and get

The domain `crystalina.org`, owned, with DNS at Squarespace. Google Search
Console, verified by a file at the site root. A Meta Business Account holding
the Facebook page and the Instagram account. A WhatsApp number,
(917) 809-4803, linked from the footer, the hero and a floating button on
every page. Profiles on Instagram, X, Facebook and LinkedIn. The email
address info@crystalina.org.

None of these needs to be created. What matters is that three of them are
held and not connected: there is no product feed, no analytics, and no
attribution of any kind. See section 4 of the blueprint.

### What has to be true legally

Unresolved and worth resolving. The NYC water figures on `/nyc-water/` are
presented as fact and were written as illustrative first-draft numbers
(U2). Sales tax is handled: 8.875%, with a borough selector. There is no
privacy policy, no terms, no cookie banner and no data deletion path; the
first two are launch blockers in practice, and the third is only needed if a
pixel is ever added.

### What media exists

Four purchased product photographs of real Crystalina systems, plus
generated hero, category and lifestyle imagery. Every image named in
`IMAGE_PROMPTS.md` has been produced. Remaining legacy catalogue media should
be reviewed before launch.

### How it is hosted today

Two hosts, and the domain points at the one that cannot run server code. This
is the finding the whole blueprint turns on; see sections 2 and 3.

### Who is building it

Two agents. Codex owns security, the database and server logistics. Claude
Code owns the storefront, the admin content editor, the design system and
the blueprint. Both commit to `main`. See `COORDINATION.md`.

### Budget and timing

Nobody has said. The Cloudflare path is costed at nothing to five dollars a
month for hosting, plus Supabase, plus Stripe's per-transaction fee. No
launch date has been given; the build plan is phases with dependencies
rather than dates, for that reason.

---

## How to use this file

Add to it rather than rewriting it, and date what you add. When the owner
answers one of the unknowns, write the answer here **and** mark the matching
U number answered in `docs/blueprint-content.mjs`, with the date. A question
that is answered in a conversation and nowhere else is a question that will
be asked again.
