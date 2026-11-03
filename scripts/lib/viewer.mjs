/* The inspector: the thing that turns this document from a wall of text
 * into something you can take apart.
 *
 * Every card in every drawing carries a registry key in `data-node`, and
 * every key has a panel in the index at the foot of the page. Clicking a
 * card opens that panel beside the drawing, lights up the arrows touching
 * the card, and dims everything else. The panel answers four questions and
 * stops:
 *
 *     what is this, how far along is it,
 *     what is it waiting on, what is waiting on it
 *
 * The last two are lists of other cards, so a dependency chain can be
 * walked without leaving the page. A trail across the top remembers where
 * the walk started.
 *
 * Three rules it is held to:
 *
 * - **Nothing is fetched.** Every panel is already in the DOM. With
 *   scripting off the page is a document with an index at the end and
 *   working anchor links, which is why the panels are written as articles
 *   rather than as data attributes.
 * - **Nothing is a button until it works.** tabindex and role are added
 *   here, at runtime, so a reader with scripting off is not offered
 *   controls that do nothing.
 * - **Motion is optional.** Every transition and every scroll is behind
 *   prefers-reduced-motion.
 */

export const css = `
/* --- the bar above each drawing ------------------------------------ */
.dg-bar{display:flex;align-items:center;justify-content:space-between;gap:.6rem;margin:1rem 0 -.35rem;font-size:.74rem;color:var(--ink-3)}
.dg-btn{font:600 .72rem/1 var(--sans);letter-spacing:.02em;color:var(--ink);background:#fff;border:1px solid var(--line);border-radius:6px;padding:.45rem .7rem;cursor:pointer;display:inline-flex;align-items:center;gap:.35rem}
.dg-btn:hover{background:var(--tile);border-color:var(--blue-light)}
.dg-btn:focus-visible{outline:2px solid var(--blue);outline-offset:2px}

/* --- tracing inside a drawing --------------------------------------- */
.fx .node{cursor:pointer}
.fx .node:focus{outline:none}
.fx .node:focus-visible>rect:nth-of-type(1),.fx .node:focus-visible>rect:nth-of-type(2){stroke:var(--blue);stroke-width:3}
.fx.focus [data-from],.fx.focus .node{opacity:.17}
.fx.focus [data-from].hot,.fx.focus .node.hot{opacity:1}
.fx.focus path.hot,.fx.focus .hot path{stroke-width:3.4}
.fx.focus .node.sel>rect:nth-of-type(2){stroke:#0F172A;stroke-width:2.8}
@media (prefers-reduced-motion:no-preference){
  .fx [data-from],.fx .node{transition:opacity .16s ease}
}

/* --- the index at the foot, with scripting off ---------------------- */
.np-index{display:grid;gap:.9rem}
.np{background:var(--surface);border:1px solid var(--line-soft);border-left:3px solid var(--blue-light);border-radius:6px;padding:.9rem 1.1rem;scroll-margin-top:1rem}
.np:target{border-left-color:var(--blue);background:var(--wash)}
.np h3{margin:0 0 .15rem;font-size:.95rem;display:flex;gap:.5rem;align-items:baseline;flex-wrap:wrap}
.np h4{margin:.7rem 0 .15rem}
.np .np-kind{font-size:.7rem;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);margin:0 0 .4rem}
.np p{margin:.15rem 0 .4rem;font-size:.85rem}
.np ul{margin:.2rem 0 .3rem;padding-left:1rem;font-size:.85rem}
.np dl{display:grid;grid-template-columns:minmax(120px,160px) minmax(0,1fr);gap:.2rem .9rem;margin:.4rem 0 0;font-size:.83rem}
.np dt{color:var(--ink-3);font-size:.7rem;font-weight:700;padding-top:.15rem}
.np dd{margin:0;color:var(--ink-2)}
.np .np-where{font-size:.74rem;color:var(--ink-3);margin:.6rem 0 0}

/* --- with scripting on, the index becomes a lookup grid ------------- */
html[data-js] .np-index{grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.4rem}
html[data-js] .np{padding:.45rem .6rem;border-left-width:2px;cursor:pointer}
html[data-js] .np>*{display:none}
html[data-js] .np>h3{display:flex;font-size:.78rem;font-weight:600;margin:0}
html[data-js] .np>h3 .st{font-size:.56rem}
html[data-js] .np:hover{background:var(--tile);border-left-color:var(--blue)}

/* --- the drawer ----------------------------------------------------- */
.np-drawer{position:fixed;z-index:1200;right:0;top:0;bottom:0;width:min(420px,92vw);background:#fff;border-left:1px solid var(--line);box-shadow:-14px 0 40px rgba(15,23,42,.1);display:flex;flex-direction:column}
.np-drawer[hidden]{display:none}
.np-top{display:flex;align-items:center;gap:.4rem;padding:.6rem .7rem;border-bottom:1px solid var(--line-soft);background:var(--wash)}
.np-top .np-trail{font-size:.68rem;color:var(--ink-3);margin-right:auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.np-scroll{overflow:auto;padding:1rem 1.1rem 2.4rem;-webkit-overflow-scrolling:touch}
.np-scroll:focus{outline:none}
html[data-js] .np-scroll .np{border:0;padding:0;background:none;cursor:default}
html[data-js] .np-scroll .np>*{display:revert}
html[data-js] .np-scroll .np>h3{display:flex;font-size:1.02rem;margin:0 0 .15rem}
html[data-js] .np-scroll .np>h3 .st{font-size:.63rem}
.np-scroll a{color:var(--blue);text-decoration:none;border-bottom:1px solid var(--line)}
.np-scroll a:hover{border-bottom-color:var(--blue)}
.np-scroll li{margin:.22rem 0}
.np-dep{list-style:none;padding:0}
.np-dep li{display:flex;gap:.4rem;align-items:baseline;justify-content:space-between}
.dg-btn[hidden]{display:none}

/* With the drawer open on a wide screen the page makes room for it, so a
   drawing and its detail can be read at the same time. */
@media (min-width:1100px){
  html[data-np-open] .shell{padding-right:420px}
}
@media (max-width:760px){
  .np-drawer{right:0;left:0;top:auto;height:min(66vh,560px);width:auto;border-left:0;border-top:1px solid var(--line);box-shadow:0 -14px 40px rgba(15,23,42,.14)}
}

/* --- full screen ---------------------------------------------------- */
.dg-full{position:fixed;inset:0;z-index:1000;background:#fff;display:flex;flex-direction:column}
.dg-full[hidden]{display:none}
.dg-top{display:flex;align-items:center;gap:.5rem;padding:.6rem .8rem;border-bottom:1px solid var(--line);background:#fff;flex-wrap:wrap}
.dg-top .dg-title{font:600 .82rem var(--sans);color:var(--ink);margin-right:auto}
.dg-top .dg-pct{font:500 .74rem var(--mono);min-width:3.6rem;text-align:center;color:var(--ink-2)}
.dg-top .dg-hint{font-size:.72rem;color:var(--ink-3)}
.dg-stage{position:relative;flex:1;overflow:hidden;cursor:grab;touch-action:none;background:#F8FAFC}
.dg-stage.drag{cursor:grabbing}
.dg-stage svg{position:absolute;left:0;top:0;transform-origin:0 0;max-width:none!important;min-width:0!important;background:#fff;box-shadow:0 8px 30px rgba(15,23,42,.08)}
body.dg-lock{overflow:hidden}
@media (max-width:620px){.dg-top .dg-hint{display:none}}
`;

export const js = `(function(){
  'use strict';
  var root = document.documentElement;
  root.setAttribute('data-js','');
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- the index, keyed by node ---------- */
  var panels = {};
  [].forEach.call(document.querySelectorAll('.np[data-np]'), function (el) {
    panels[el.getAttribute('data-np')] = el;
  });
  /* The status word lives inside the heading as a pill, so it is taken out
     before the heading is read as a name: "Stripe checkout and webhookM"
     is what you get if you forget. */
  function titleOf(k) {
    var p = panels[k];
    if (!p) return k;
    var h = p.querySelector('h3');
    if (!h) return k;
    var c = h.cloneNode(true);
    var pill = c.querySelector('.st');
    if (pill) pill.parentNode.removeChild(pill);
    return c.textContent.replace(/\\s+/g, ' ').trim();
  }
  function statusOf(k) {
    var p = panels[k];
    var s = p && p.querySelector('h3 .st');
    return s ? s.textContent.trim() : '';
  }

  /* ---------- every card becomes a control ---------- */
  [].forEach.call(document.querySelectorAll('svg.fx [data-node]'), function (g) {
    var k = g.getAttribute('data-node');
    var st = statusOf(k);
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', titleOf(k) + (st ? ', ' + st : '') + '. Open detail');
  });

  /* ---------- the drawer ---------- */
  var drawer, scroll, trailEl, backBtn, trail = [], current = null, opener = null;
  function buildDrawer() {
    drawer = document.createElement('aside');
    drawer.className = 'np-drawer';
    drawer.hidden = true;
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Detail');
    drawer.innerHTML = '<div class="np-top">' +
      '<button type="button" class="dg-btn np-back" hidden>Back</button>' +
      '<span class="np-trail"></span>' +
      '<button type="button" class="dg-btn np-close" aria-label="Close detail">Close</button>' +
      '</div><div class="np-scroll" tabindex="-1"></div>';
    document.body.appendChild(drawer);
    scroll = drawer.querySelector('.np-scroll');
    trailEl = drawer.querySelector('.np-trail');
    backBtn = drawer.querySelector('.np-back');
    drawer.querySelector('.np-close').addEventListener('click', function () { close(true); });
    backBtn.addEventListener('click', function () {
      trail.pop();
      var prev = trail.pop();
      if (prev) show(prev, true); else close(true);
    });
    scroll.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-go]');
      if (!a) return;
      e.preventDefault();
      show(a.getAttribute('data-go'), true);
    });
  }

  function show(k, keepFocus) {
    if (!panels[k]) return;
    if (!drawer) buildDrawer();
    current = k;
    if (trail[trail.length - 1] !== k) trail.push(k);
    if (trail.length > 12) trail.shift();
    scroll.innerHTML = '<div class="np">' + panels[k].innerHTML + '</div>';
    backBtn.hidden = trail.length < 2;
    trailEl.textContent = trail.length > 1
      ? trail.slice(-3).map(function (t) {
        var name = titleOf(t).split(' · ')[0];
        return name.length > 26 ? name.slice(0, 25).trim() + '\\u2026' : name;
      }).join('  \\u203a  ')
      : '';
    drawer.hidden = false;
    root.setAttribute('data-np-open','');
    scroll.scrollTop = 0;
    paint(k);
    if (keepFocus) scroll.focus();
  }

  function close(restore) {
    if (!drawer) return;
    drawer.hidden = true;
    root.removeAttribute('data-np-open');
    trail = [];
    current = null;
    paint(null);
    if (restore && opener && document.contains(opener)) opener.focus();
  }

  /* ---------- tracing ---------- */
  function paint(k) {
    [].forEach.call(document.querySelectorAll('svg.fx'), function (svg) {
      [].forEach.call(svg.querySelectorAll('.hot,.sel'), function (el) {
        el.classList.remove('hot', 'sel');
      });
      var mine = k ? svg.querySelectorAll('[data-node="' + cssq(k) + '"]') : [];
      if (!k || !mine.length) { svg.classList.remove('focus'); return; }
      svg.classList.add('focus');
      [].forEach.call(mine, function (n) { n.classList.add('hot', 'sel'); });
      [].forEach.call(svg.querySelectorAll('[data-from]'), function (el) {
        var f = el.getAttribute('data-from');
        var t = el.getAttribute('data-to');
        if (f !== k && t !== k) return;
        el.classList.add('hot');
        var other = svg.querySelectorAll('[data-node="' + cssq(f === k ? t : f) + '"]');
        [].forEach.call(other, function (n) { n.classList.add('hot'); });
      });
    });
  }
  function cssq(s) { return String(s).replace(/"/g, '\\\\"'); }

  /* Bring the first drawing holding this card into view, but only when it
     is not already on screen: a jump the reader did not ask for is worse
     than a scroll they have to make themselves. */
  function reveal(k) {
    var hit = document.querySelector('.diagram svg.fx [data-node="' + cssq(k) + '"]');
    if (!hit) return;
    var box = hit.closest('.diagram').getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) return;
    hit.closest('.diagram').scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' });
  }

  /* ---------- clicking a card ---------- */
  function hit(e) {
    var g = e.target.closest('[data-node]');
    if (!g) return null;
    return g;
  }
  document.addEventListener('click', function (e) {
    var card = e.target.closest('.np-index .np');
    if (card && card.getAttribute('data-np')) {
      e.preventDefault();
      opener = card;
      show(card.getAttribute('data-np'), false);
      reveal(card.getAttribute('data-np'));
      return;
    }
    var svg = e.target.closest('svg.fx');
    if (!svg) return;
    if (stage && stage.contains(svg) && stage.dataset.moved === '1') return;
    var g = hit(e);
    if (!g) { close(false); return; }
    var k = g.getAttribute('data-node');
    opener = g;
    if (k === current) { close(false); return; }
    show(k, false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer && !drawer.hidden && (!full || full.hidden)) {
      close(true);
      e.preventDefault();
      return;
    }
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    var g = document.activeElement && document.activeElement.closest
      ? document.activeElement.closest('[data-node]') : null;
    if (!g || !g.closest('svg.fx')) return;
    e.preventDefault();
    opener = g;
    show(g.getAttribute('data-node'), true);
  });

  /* ---------- full screen, pan and zoom ---------- */
  var full, stage, pct, ftitle, fsvg, home, s = 1, x = 0, y = 0, W = 0, H = 0;
  function build() {
    full = document.createElement('div');
    full.className = 'dg-full';
    full.hidden = true;
    full.setAttribute('role', 'dialog');
    full.setAttribute('aria-modal', 'true');
    full.setAttribute('aria-label', 'Drawing, full screen');
    full.innerHTML = '<div class="dg-top"><span class="dg-title"></span>' +
      '<span class="dg-hint">Drag to move, scroll to zoom, click a card for its detail</span>' +
      '<button type="button" class="dg-btn" data-z="out" aria-label="Zoom out">\\u2212</button>' +
      '<span class="dg-pct" aria-live="polite"></span>' +
      '<button type="button" class="dg-btn" data-z="in" aria-label="Zoom in">+</button>' +
      '<button type="button" class="dg-btn" data-z="fit">Fit</button>' +
      '<button type="button" class="dg-btn" data-z="close">Close</button></div>' +
      '<div class="dg-stage" tabindex="0"></div>';
    document.body.appendChild(full);
    stage = full.querySelector('.dg-stage');
    pct = full.querySelector('.dg-pct');
    ftitle = full.querySelector('.dg-title');
    full.addEventListener('click', function (e) {
      var b = e.target.closest('[data-z]');
      if (!b) return;
      var z = b.getAttribute('data-z');
      if (z === 'close') shut();
      else if (z === 'fit') fit();
      else zoomAt(z === 'in' ? 1.5 : 1 / 1.5, stage.clientWidth / 2, stage.clientHeight / 2);
    });
    stage.addEventListener('wheel', function (e) {
      e.preventDefault();
      var r = stage.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0022)), e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    stage.addEventListener('dblclick', function (e) {
      var r = stage.getBoundingClientRect();
      zoomAt(2, e.clientX - r.left, e.clientY - r.top);
    });
    var pts = {}, last = null, moved = 0;
    stage.addEventListener('pointerdown', function (e) {
      stage.setPointerCapture(e.pointerId);
      pts[e.pointerId] = [e.clientX, e.clientY];
      moved = 0; last = snap(); stage.classList.add('drag');
    });
    stage.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return;
      var prev = pts[e.pointerId];
      pts[e.pointerId] = [e.clientX, e.clientY];
      var ids = Object.keys(pts);
      if (ids.length === 1) {
        x += e.clientX - prev[0]; y += e.clientY - prev[1];
        moved += Math.abs(e.clientX - prev[0]) + Math.abs(e.clientY - prev[1]);
        apply();
      } else if (ids.length === 2) {
        var now = snap();
        if (last && last.d) {
          var r = stage.getBoundingClientRect();
          zoomAt(now.d / last.d, now.cx - r.left, now.cy - r.top);
          x += now.cx - last.cx; y += now.cy - last.cy; apply();
        }
        last = now; moved = 99;
      }
    });
    function snap() {
      var ids = Object.keys(pts);
      if (ids.length < 2) return null;
      var a = pts[ids[0]], b = pts[ids[1]];
      return { d: Math.hypot(a[0] - b[0], a[1] - b[1]), cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2 };
    }
    function up(e) {
      delete pts[e.pointerId];
      last = snap();
      if (!Object.keys(pts).length) stage.classList.remove('drag');
      stage.dataset.moved = moved > 5 ? '1' : '';
    }
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);
    document.addEventListener('keydown', function (e) {
      if (full.hidden) return;
      var k = e.key, c = [stage.clientWidth / 2, stage.clientHeight / 2];
      if (k === 'Escape') shut();
      else if (k === '+' || k === '=') zoomAt(1.5, c[0], c[1]);
      else if (k === '-' || k === '_') zoomAt(1 / 1.5, c[0], c[1]);
      else if (k === '0') fit();
      else if (k.indexOf('Arrow') === 0) {
        var d = 80;
        if (k === 'ArrowLeft') x += d;
        if (k === 'ArrowRight') x -= d;
        if (k === 'ArrowUp') y += d;
        if (k === 'ArrowDown') y -= d;
        apply();
      } else return;
      e.preventDefault();
    });
  }
  function apply() {
    fsvg.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')';
    pct.textContent = Math.round(s * 100) + '%';
  }
  function zoomAt(f, px, py) {
    var fitS = Math.min(stage.clientWidth / W, stage.clientHeight / H) * 0.5;
    var ns = Math.max(fitS, Math.min(6, s * f));
    x = px - (px - x) * (ns / s);
    y = py - (py - y) * (ns / s);
    s = ns; apply();
  }
  function fit() {
    var cw = stage.clientWidth, ch = stage.clientHeight;
    s = Math.min(cw / W, ch / H) * 0.96;
    x = (cw - W * s) / 2;
    y = Math.max(8, (ch - H * s) / 2);
    apply();
  }
  function open(box) {
    if (!full) build();
    fsvg = box.querySelector('svg');
    home = box;
    var vb = fsvg.viewBox.baseVal;
    W = vb.width; H = vb.height;
    fsvg.dataset.style = fsvg.getAttribute('style') || '';
    fsvg.setAttribute('style', 'width:' + W + 'px;height:' + H + 'px');
    var cap = box.nextElementSibling;
    ftitle.textContent = cap && cap.querySelector('strong')
      ? cap.querySelector('strong').textContent.replace(/\\.$/, '') : 'Drawing';
    stage.appendChild(fsvg);
    full.hidden = false;
    document.body.classList.add('dg-lock');
    fit();
    stage.focus();
  }
  function shut() {
    fsvg.setAttribute('style', fsvg.dataset.style || '');
    home.appendChild(fsvg);
    full.hidden = true;
    document.body.classList.remove('dg-lock');
    var b = home.previousElementSibling && home.previousElementSibling.querySelector('.dg-btn');
    if (b) b.focus();
  }

  /* ---------- a bar above every drawing ---------- */
  [].forEach.call(document.querySelectorAll('.diagram'), function (box) {
    var bar = document.createElement('div');
    bar.className = 'dg-bar';
    var n = box.querySelectorAll('[data-node]').length;
    bar.innerHTML = '<span>' + (n
      ? 'Click any of the ' + n + ' cards for what it is, what it waits on, and what waits on it.'
      : '') + '</span><button type="button" class="dg-btn">' +
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">' +
      '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>Full screen</button>';
    bar.querySelector('button').addEventListener('click', function () { open(box); });
    box.parentNode.insertBefore(bar, box);
  });

  /* A link to a panel from anywhere in the prose opens the drawer rather
     than jumping to the foot of the page. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#n-"]');
    if (!a || e.target.closest('.np-scroll')) return;
    var id = a.getAttribute('href').slice(1);
    var el = document.getElementById(id);
    if (!el || !el.getAttribute('data-np')) return;
    e.preventDefault();
    opener = a;
    show(el.getAttribute('data-np'), true);
    reveal(el.getAttribute('data-np'));
  });

  /* Arriving on a deep link opens the panel it names, and so does a hash
     that changes while the page is already open. */
  function fromHash() {
    if (location.hash.indexOf('#n-') !== 0) return;
    var el0 = document.getElementById(location.hash.slice(1));
    if (el0 && el0.getAttribute('data-np')) {
      show(el0.getAttribute('data-np'), false);
      reveal(el0.getAttribute('data-np'));
    }
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();`;
