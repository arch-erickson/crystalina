/* The node registry, and every dependency list in the blueprint.
 *
 * One idea: anything drawn on a card is a node, every node has one global
 * key, and nothing that can be derived is ever written out twice.
 *
 * The keys are namespaced, because two drawings legitimately hold a card
 * called "Supabase Postgres" and they are the same thing seen at two
 * moments:
 *
 *   finding:F1   now:worker   target:cffn   rq-split    own-dns
 *   page:shop    table:orders flow:order    stage:prod  phase:P3
 *   risk:R1      threat:xss   trigger:csp   ad:AD10     unknown:U8
 *   asset:gsc    def:shipping
 *
 * Every card in every drawing carries its key as `data-node`, and every
 * detail panel in the document is built from the entry here, so clicking a
 * card in one drawing and clicking the same thing in another reach the same
 * panel.
 *
 * Dependencies are derived, in both directions, from the edge lists in
 * docs/diagrams/model.mjs:
 *
 *   architecture edges   Talks to / Talked to by
 *   page edges           Links to / Reached from
 *   table relations      Relates to / Related from, carrying the cardinality
 *   phase needs          Needs first / Unblocks
 *   unknown blocks       Blocks / Waiting on
 *   stages and steps     Then / After, from the order they are listed in
 *   rel                  See also, symmetric
 *
 * A `rel` entry that names a key nothing registered is a mistake, and
 * `unresolved()` returns them so npm run docs can refuse to finish.
 */

const KIND = {
  finding: 'Finding',
  now: 'Architecture today',
  target: 'Architecture after the cutover',
  rq: 'Request path',
  own: 'Owner task',
  page: 'Page',
  table: 'Table',
  flow: 'Flow',
  stage: 'Deploy stage',
  phase: 'Phase',
  risk: 'Risk',
  threat: 'Threat',
  trigger: 'Postponed',
  ad: 'Decision',
  unknown: 'Unknown',
  asset: 'Channel',
  def: 'One definition',
};

/* Which drawing each kind of node is drawn on. The names are checked
   against the drawings actually emitted, so a rename cannot go unnoticed. */
const SHOWN = {
  finding: ['findings.svg'],
  now: ['architecture-now.svg'],
  target: ['architecture-target.svg'],
  rq: ['request-path.svg'],
  own: ['owner-tasks.svg'],
  page: ['sitemap.svg'],
  table: ['data-model.svg'],
  flow: [],
  stage: ['deployment.svg'],
  phase: ['build-plan.svg'],
  risk: ['risks.svg'],
  threat: ['threats.svg'],
  trigger: ['postponed.svg'],
  ad: ['decisions.svg'],
  unknown: ['unknowns.svg'],
  asset: ['channels.svg'],
  def: ['one-definition.svg'],
};

export function buildGraph(M) {
  const nodes = new Map();
  const missing = [];

  const kindOf = (key) => {
    const ns = key.includes(':') ? key.slice(0, key.indexOf(':')) : key.split('-')[0];
    return ns;
  };

  const add = (key, n) => {
    const ns = kindOf(key);
    nodes.set(key, {
      key,
      ns,
      kind: KIND[ns] || 'Node',
      shown: SHOWN[ns] || [],
      label: n.label,
      sub: n.sub || '',
      status: n.status || null,
      icon: n.icon || null,
      family: n.family || 'slate',
      what: n.what || '',
      why: n.why || '',
      extra: n.extra || [],
      rel: n.rel || [],
      out: [],
      in: [],
      see: [],
    });
  };

  /* ------------------------------------------------------------ *
   * Register everything.
   * ------------------------------------------------------------ */

  for (const f of M.findings) {
    add(`finding:${f.id}`, {
      ...f, sub: f.detail,
      extra: [['Severity', f.severity]],
    });
  }

  for (const [phaseKey, phase] of [['now', M.architecture.now], ['target', M.architecture.target]]) {
    for (const zone of phase.zones) {
      for (const n of zone.nodes) {
        add(`${phaseKey}:${n.id}`, {
          ...n, sub: n.detail,
          extra: [['Zone', zone.label]],
        });
      }
    }
  }

  for (const s of M.requestPath.steps) add(s.id, { ...s, sub: s.detail });
  for (const s of M.ownerSteps.steps) add(s.id, { ...s, sub: 'Needs a person in a dashboard' });

  for (const p of M.pages) {
    add(`page:${p.id}`, {
      ...p, sub: p.route,
      status: p.server,
      extra: [
        ['Design', p.design], ['Server', p.server],
        ['Backend built', p.built],
        ['Remaining', p.remaining],
      ],
    });
  }

  for (const g of M.entities.groups) {
    for (const t of g.tables) {
      add(`table:${t.name}`, {
        ...t, label: t.name, sub: t.fields.join(', '),
        family: g.family,
        extra: [['Group', g.label], ['Fields', t.fields.join(', ')]],
      });
    }
  }

  for (const f of M.flows) {
    add(`flow:${f.id}`, {
      ...f, label: f.title, sub: `${f.steps.length} steps, ${f.failures.length} failure paths`,
      icon: 'branch', family: 'blue',
      extra: [['Participants', f.lanes.map((l) => l.label).join(', ')]],
    });
  }

  M.deployment.stages.forEach((s) => add(`stage:${s.id}`, { ...s, sub: s.detail }));
  M.phases.forEach((p) => add(`phase:${p.id}`, {
    ...p, label: `${p.id} · ${p.label}`, sub: p.detail,
    extra: [['Owner', p.owner]],
  }));

  for (const rk of M.risks) {
    add(`risk:${rk.id}`, {
      ...rk, sub: `${rk.likelihood} likelihood, ${rk.impact} impact`,
      icon: 'alert', family: rk.impact === 'high' ? 'rose' : 'amber',
      status: null,
      extra: [
        ['Likelihood', rk.likelihood], ['Impact', rk.impact],
        ['What to do', rk.fix], ['Effort', rk.effort],
      ],
    });
  }

  for (const t of M.threats) {
    add(`threat:${t.id}`, { ...t, sub: 'Threat', extra: [['What stands in front of it', t.mitigation]] });
  }

  for (const t of M.triggers) {
    add(`trigger:${t.id}`, { ...t, sub: 'Deliberately not built', extra: [['Build it when', t.trigger]] });
  }

  for (const d of M.decisions) {
    add(`ad:${d.id}`, {
      ...d, label: `${d.id} · ${d.title}`, sub: `Decided ${d.date}`,
      what: d.does, why: d.now,
      extra: [
        ['Why we need it', d.need], ['Why it belongs here', d.here],
        ['What it costs', d.costs], ['Replace when', d.replace],
      ],
    });
  }

  for (const u of M.unknowns) {
    add(`unknown:${u.id}`, {
      ...u, label: `${u.id} · ${u.question}`, sub: `Owner: ${u.owner}`,
      what: u.why, why: '',
      extra: [['How to resolve it', u.how], ['Owner', u.owner]],
    });
  }

  for (const g of M.assets.groups) {
    for (const a of g.items) {
      add(`asset:${a.id}`, {
        ...a, sub: a.detail, status: a.wired,
        family: g.family,
        extra: [['Group', g.label]],
      });
    }
  }

  for (const d of M.definitions) {
    add(`def:${d.id}`, {
      ...d, label: d.thing, sub: d.home,
      icon: 'layers', family: 'blue',
      extra: [['Lives in', d.home], ['Read by', d.readers.join(', ')]],
    });
  }

  /* ------------------------------------------------------------ *
   * Derive every dependency, in both directions.
   * ------------------------------------------------------------ */

  const link = (fromKey, toKey, out, back) => {
    const a = nodes.get(fromKey);
    const b = nodes.get(toKey);
    if (!a || !b) { missing.push(`${fromKey} -> ${toKey}`); return; }
    if (!a.out.some((e) => e.key === toKey && e.rel === out)) a.out.push({ key: toKey, rel: out });
    if (!b.in.some((e) => e.key === fromKey && e.rel === back)) b.in.push({ key: fromKey, rel: back });
  };

  for (const [ns, phase] of [['now', M.architecture.now], ['target', M.architecture.target]]) {
    for (const e of phase.edges) {
      link(`${ns}:${e.from}`, `${ns}:${e.to}`, `Talks to: ${e.label}`, `Talked to by: ${e.label}`);
    }
  }

  for (const e of M.pageEdges) {
    link(`page:${e.from}`, `page:${e.to}`, `Links to: ${e.label}`, `Reached from: ${e.label}`);
  }

  for (const rel of M.entities.relations) {
    link(`table:${rel.from}`, `table:${rel.to}`, `Relates to: ${rel.card}`, `Related from: ${rel.card}`);
  }

  for (const p of M.phases) {
    for (const need of p.needs) link(`phase:${need}`, `phase:${p.id}`, 'Unblocks', 'Needs first');
  }

  for (const u of M.unknowns) {
    for (const b of u.blocks) link(`unknown:${u.id}`, b, 'Blocks', 'Waiting on the answer to');
  }

  /* A finding, a risk and a threat are three views of the same worry, and
     all three are closed by a phase. Drawn from one field so that a phase
     can list everything it closes without that list being typed out. */
  const fixers = [
    ...M.findings.map((f) => [`finding:${f.id}`, f.fixedBy]),
    ...M.risks.map((rk) => [`risk:${rk.id}`, rk.fixedBy]),
    ...M.threats.map((t) => [`threat:${t.id}`, t.fixedBy]),
  ];
  for (const [from, list] of fixers) {
    for (const to of list || []) link(from, to, 'Closed by', 'Closes');
  }

  const chain = (keys) => {
    for (let i = 0; i < keys.length - 1; i += 1) link(keys[i], keys[i + 1], 'Then', 'After');
  };
  chain(M.deployment.stages.map((s) => `stage:${s.id}`));
  chain(M.requestPath.steps.map((s) => s.id));

  /* `rel` is a curated cross-reference and is symmetric: if a decision
     names a phase, the phase names the decision back. The node's own
     choices come first, because they are the ones someone chose. */
  for (const n of nodes.values()) {
    for (const key of n.rel) {
      const other = nodes.get(key);
      if (!other) { missing.push(`${n.key} see ${key}`); continue; }
      if (!n.see.includes(key)) n.see.push(key);
      if (!other.see.includes(n.key)) other.see.push(n.key);
    }
  }
  /* Anything already named as a dependency is not also a "see also": one
     row per relationship, and the strongest relationship wins. */
  for (const n of nodes.values()) {
    const named = new Set([...n.out, ...n.in].map((e) => e.key));
    n.see = n.see.filter((k) => !named.has(k));
    n.see.sort((a, b) => Number(n.rel.includes(b)) - Number(n.rel.includes(a)));
  }

  /* Order: the way a reader meets them, so the appendix reads in the same
     order as the document. */
  const order = [...nodes.keys()];

  return {
    nodes,
    order,
    get: (key) => nodes.get(key),
    unresolved: () => [...new Set(missing)],
    /* Every key a drawing is allowed to put on a card. */
    kinds: KIND,
    shownFor: (key) => (nodes.get(key) || {}).shown || [],
  };
}

/* The id a drawing writes into data-node, given a collection and a local
   id. Kept here so a drawing can never invent a key the registry has not
   heard of. */
export const key = {
  finding: (id) => `finding:${id}`,
  arch: (phase, id) => `${phase}:${id}`,
  page: (id) => `page:${id}`,
  table: (name) => `table:${name}`,
  flow: (id) => `flow:${id}`,
  stage: (id) => `stage:${id}`,
  phase: (id) => `phase:${id}`,
  risk: (id) => `risk:${id}`,
  threat: (id) => `threat:${id}`,
  trigger: (id) => `trigger:${id}`,
  ad: (id) => `ad:${id}`,
  unknown: (id) => `unknown:${id}`,
  asset: (id) => `asset:${id}`,
  def: (id) => `def:${id}`,
  step: (id) => id,
};
