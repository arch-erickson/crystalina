/* ============================================================
   Crystalina, Shared UI (header, footer, cart drawer, helpers)
   ============================================================ */

const money = n => '$' + n.toFixed(2);

/* ============================================================
   Icon system, professional stroke line-icons (currentColor).
   ICONS[name] holds inner SVG paths; svgIcon()/icon() wrap them.
   Exposed on window so inline page scripts can use them too.
   ============================================================ */
const ICONS = {
  droplet: '<path d="M12 3.2C12 3.2 5.5 10 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10 12 3.2 12 3.2Z"/>',
  phone: '<path d="M6.8 3.5H9.2l1.3 3.6-1.8 1.3a10.5 10.5 0 0 0 4.6 4.6l1.3-1.8 3.6 1.3v2.4a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.8 5.7 2 2 0 0 1 6.8 3.5Z"/>',
  chat: '<path d="M20.5 12a7.5 7.5 0 0 1-10.9 6.7L4.5 20l1.3-4.8A7.5 7.5 0 1 1 20.5 12Z"/><path d="M9 11h6M9 14h4"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.2"/><path d="M4 7.5l8 5.5 8-5.5"/>',
  pin: '<path d="M12 21s6-5.4 6-10.2a6 6 0 0 0-12 0C6 15.6 12 21 12 21Z"/><circle cx="12" cy="10.6" r="2.3"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.3 5.3L4 17v3h3l5.4-5.4a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.7-2.7 2.3-2.9Z"/>',
  truck: '<path d="M3 6.5h11v9H3z"/><path d="M14 9.5h3.6l3 3v3H14z"/><circle cx="7" cy="18.3" r="1.7"/><circle cx="17.3" cy="18.3" r="1.7"/>',
  returns: '<path d="M8 7l-4 5 4 5"/><path d="M4 12h10a5.5 5.5 0 0 1 5.5 5.5V19"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2.4"/><path d="M3 10h18"/>',
  home: '<path d="M4 11l8-6.5 8 6.5"/><path d="M6.5 9.6V19h11V9.6"/>',
  building: '<rect x="6" y="3" width="12" height="18" rx="1.4"/><path d="M9.6 7h1M13.4 7h1M9.6 11h1M13.4 11h1M11 21v-3.5h2V21"/>',
  townhouse: '<path d="M4 20V9l4-3 4 3 4-3 4 3v11"/><path d="M9.5 20v-4h5v4"/>',
  shield: '<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/>',
  shieldCheck: '<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path d="M9 11.8l2 2 4-4.2"/>',
  shower: '<path d="M12 3.2v3.2"/><path d="M6.6 11a5.4 5.4 0 0 1 10.8 0Z"/><path d="M9 15v1.4M12 15v1.4M15 15v1.4M9 18.4v1.2M12 18.4v1.2M15 18.4v1.2"/>',
  tag: '<path d="M4 4h7l9 9-7 7-9-9z"/><circle cx="8" cy="8" r="1.5"/>',
  purity: '<path d="M12 3.2C12 3.2 5.5 10 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10 12 3.2 12 3.2Z"/><path d="M9.4 13.8l1.8 1.8 3.4-3.6"/>',
  chart: '<path d="M3.5 20h17"/><path d="M6 20v-7M10.5 20V6M15 20v-9M19.5 20V9"/>',
  box: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
  receipt: '<path d="M6 3h12v18l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4L6 21z"/><path d="M9 8h6M9 12h5"/>',
  users: '<circle cx="9.5" cy="8" r="3"/><path d="M4 20a5.5 5.5 0 0 1 11 0"/><path d="M16.5 6.2a3 3 0 0 1 0 5.6M18.5 20a5.5 5.5 0 0 0-3-5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18"/>',
  logout: '<path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/><path d="M10 8l-4 4 4 4M6 12h9"/>',
  alert: '<path d="M12 4l8.5 15H3.5z"/><path d="M12 10v4M12 16.6v.2"/>',
  camera: '<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.2"/>',
  check: '<path d="M5 13l4 4 10-11"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  arrowRight: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  sparkle: '<path d="M12 3.5l1.7 4.8 4.8 1.7-4.8 1.7L12 16.5l-1.7-4.8L5.5 10l4.8-1.7z"/>',
  funnel: '<path d="M4 5h16l-6.2 7.4V19l-3.6 2v-8.6z"/>',
  leaf: '<path d="M5 19C5 11 11 5 19 5c0 8-6 14-14 14z"/><path d="M9 15c2-3.5 4.5-5.5 8-7"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2.2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'
};
const svgIcon = (name, sw = 1.7) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
const icon = (name, sw) => `<span class="ic">${svgIcon(name, sw)}</span>`;
if (typeof window !== 'undefined') { window.ICONS = ICONS; window.svgIcon = svgIcon; window.icon = icon; }

/* Scroll-reveal: gently fades + lifts elements marked .reveal as they enter view. */
function initReveal(root = document) {
  const els = root.querySelectorAll('.reveal:not(.reveal-bound)');
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const sibs = [...e.target.parentElement.querySelectorAll(':scope > .reveal')];
        e.target.style.transitionDelay = Math.min(sibs.indexOf(e.target), 6) * 80 + 'ms';
        e.target.classList.add('in');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => { e.classList.add('reveal-bound'); io.observe(e); });
}
if (typeof window !== 'undefined') window.initReveal = initReveal;

const SOCIALS = [
  { name: 'Instagram', url: 'https://instagram.com/crystalinawater', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>' },
  { name: 'X', url: 'https://x.com/crystalinawater', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.9 3H21l-6.8 7.8L22.2 21h-6.3l-4.9-6.4L5.4 21H2.2l7.3-8.3L2 3h6.4l4.4 5.9L17.9 3zm-1.1 16.1h1.7L7.1 4.8H5.3l11.5 14.3z"/></svg>' },
  { name: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61591728311575', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5h2.5l.5-3h-3V8.6c0-.9.3-1.6 1.7-1.6h1.4V4.3c-.6-.1-1.5-.2-2.4-.2-2.4 0-4 1.4-4 4v2.4H7.5v3h2.7V21h3.3z"/></svg>' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/company/crystalina-water/', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2 2 0 1 1-.02 4 2 2 0 0 1 .02-4zM3.5 9h3v11.5h-3V9zm5.5 0h2.87v1.57h.04c.4-.76 1.38-1.57 2.84-1.57 3.04 0 3.6 2 3.6 4.6v6.9h-3v-6.12c0-1.46-.03-3.34-2.03-3.34-2.04 0-2.35 1.59-2.35 3.23v6.23H9V9z"/></svg>' },
  { name: 'WhatsApp', url: 'https://wa.me/19178094803', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.2-.8l.5-.7c.1-.2 0-.4 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.9.9-1.1 2.2-.3 3.7a12 12 0 0 0 4.6 4.5c1.7.9 2.7 1 3.6.7.6-.2 1.4-.8 1.6-1.5.2-.7.2-1.2.1-1.3-.1-.2-.3-.2-.6-.3z"/></svg>' }
];

const NAV_LINKS = [
  { label: 'Shop', href: '/shop/' },
  { label: 'NYC Water Facts', href: '/nyc-water/' },
  { label: 'Find Your Filter', href: '/quiz/' },
  { label: 'About Us', href: '/about/' },
  { label: 'Contact', href: '/contact/' }
];

/* Branded droplet logo mark */
// Logo pieces, composed separately so each can be sized independently:
//  LOGO_MARK, the compact C + droplet mark (footer + favicon source).
//  LOGO_LOCKUP, header lockup: the mark on the left + the trimmed wordmark on the right.
//                The wordmark text is dark navy, so this only sits on light backgrounds.
const LOGO_MARK = `<img src="/logo-mark.png" class="logo-mark" alt="Crystalina" width="48" height="48">`;
const LOGO_LOCKUP = `<img src="/logo-mark.png" class="brand-mark" alt=""><img src="/logo-text.png" class="brand-wordmark" alt="Crystalina. Pure Water. Pure Life.">`;

/* ---------- header ---------- */
function renderHeader(active = '') {
  const user = Store.currentUser();
  const el = document.createElement('div');
  el.innerHTML = `
  <div class="announce-bar">
    <span>${icon('droplet')} Free shipping on orders over $99, delivered anywhere in the five boroughs</span>
    <a href="tel:+19178094803" class="announce-phone">${icon('phone')} (917) 809-4803</a>
  </div>
  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="/" aria-label="Crystalina. Pure Water. Pure Life.">
        ${LOGO_LOCKUP}
      </a>
      <nav class="main-nav" id="mainNav">
        ${NAV_LINKS.map(l => `<a href="${l.href}" class="${active === l.href ? 'active' : ''}">${l.label}</a>`).join('')}
      </nav>
      <div class="header-actions">
        <a href="${user ? (user.role === 'admin' ? '/admin/' : '/account/') : '/signin/'}" class="icon-btn" title="${user ? user.name : 'Sign in'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>
          <span class="icon-label">${user ? user.name.split(' ')[0] : 'Sign In'}</span>
        </a>
        <button class="icon-btn cart-btn" id="cartOpenBtn" title="Cart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2.5 3.5h3l2.6 12h10.4l2.5-8.5H6.2"/></svg>
          <span class="icon-label">Cart</span>
          <span class="cart-count" id="cartCount">0</span>
        </button>
        <button class="hamburger" id="hamburgerBtn" aria-label="Menu"><span></span><span></span><span></span></button>
      </div>
    </div>
  </header>`;
  document.body.prepend(el);

  document.getElementById('hamburgerBtn').addEventListener('click', () =>
    document.getElementById('mainNav').classList.toggle('open'));
  document.getElementById('cartOpenBtn').addEventListener('click', openCart);
  updateCartBadge();
}

/* ---------- cart drawer ---------- */
function renderCartDrawer() {
  const el = document.createElement('div');
  el.innerHTML = `
  <div class="cart-overlay" id="cartOverlay"></div>
  <aside class="cart-drawer" id="cartDrawer" aria-label="Shopping cart">
    <div class="cart-head">
      <h3>Your Cart</h3>
      <button class="cart-close" id="cartCloseBtn" aria-label="Close cart">&times;</button>
    </div>
    <div class="cart-shipbar" id="cartShipBar"></div>
    <div class="cart-items" id="cartItems"></div>
    <div class="cart-foot">
      <div class="cart-subtotal"><span>Subtotal</span><strong id="cartSubtotal">$0.00</strong></div>
      <p class="cart-note">Shipping &amp; NYC sales tax calculated at checkout.</p>
      <a href="/checkout/" class="btn btn-primary btn-block" id="checkoutBtn">Checkout</a>
      <button class="btn btn-ghost btn-block" id="cartContinueBtn">Continue Shopping</button>
    </div>
  </aside>
  <div class="toast" id="toast"></div>`;
  document.body.appendChild(el);

  document.getElementById('cartCloseBtn').addEventListener('click', closeCart);
  document.getElementById('cartContinueBtn').addEventListener('click', closeCart);
  document.getElementById('cartOverlay').addEventListener('click', closeCart);
  document.addEventListener('cart:changed', () => { updateCartBadge(); renderCartItems(); });
  renderCartItems();
}

function openCart() { document.body.classList.add('cart-open'); renderCartItems(); }
function closeCart() { document.body.classList.remove('cart-open'); }

function updateCartBadge() {
  const badge = document.getElementById('cartCount');
  if (badge) { const n = Store.cartCount(); badge.textContent = n; badge.style.display = n ? 'flex' : 'none'; }
}

function renderCartItems() {
  const wrap = document.getElementById('cartItems');
  if (!wrap) return;
  const { items, subtotal } = Store.cartDetails();
  const shipBar = document.getElementById('cartShipBar');
  const remaining = 99 - subtotal;
  shipBar.innerHTML = subtotal >= 99
    ? `<span class="ship-msg ship-ok">${icon('sparkle')} You've unlocked <strong>FREE shipping</strong></span>`
    : `<span class="ship-msg">Add <strong>${money(Math.max(remaining, 0))}</strong> more for free shipping</span>
       <div class="ship-track"><div class="ship-fill" style="width:${Math.min(subtotal / 99 * 100, 100)}%"></div></div>`;

  if (!items.length) {
    wrap.innerHTML = `<div class="cart-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" width="52"><circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2.5 3.5h3l2.6 12h10.4l2.5-8.5H6.2"/></svg>
      <p>Your cart is empty.</p><a class="btn btn-primary" href="/shop/">Shop Filters</a></div>`;
  } else {
    wrap.innerHTML = items.map(i => `
      <div class="cart-item">
        <img src="${i.product.image}" alt="${i.product.name}">
        <div class="ci-info">
          <a href="/product/?id=${i.id}" class="ci-name">${i.product.name}</a>
          <div class="ci-price">${money(i.product.price)}</div>
          <div class="ci-qty">
            <button data-act="dec" data-id="${i.id}">−</button>
            <span>${i.qty}</span>
            <button data-act="inc" data-id="${i.id}">+</button>
            <button class="ci-remove" data-act="rm" data-id="${i.id}">Remove</button>
          </div>
        </div>
        <div class="ci-line">${money(i.product.price * i.qty)}</div>
      </div>`).join('');
    wrap.querySelectorAll('button[data-act]').forEach(b => b.addEventListener('click', () => {
      const { act, id } = b.dataset;
      const item = Store.getCart().find(x => x.id === id);
      if (!item) return;
      if (act === 'inc') Store.updateQty(id, item.qty + 1);
      if (act === 'dec') Store.updateQty(id, item.qty - 1);
      if (act === 'rm') Store.updateQty(id, 0);
    }));
  }
  const st = document.getElementById('cartSubtotal');
  if (st) st.textContent = money(subtotal);
  const co = document.getElementById('checkoutBtn');
  if (co) co.style.display = items.length ? '' : 'none';
}

function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- footer ---------- */
function renderFooter() {
  const el = document.createElement('footer');
  el.className = 'site-footer';
  el.innerHTML = `
  <div class="footer-cta">
    <div class="container footer-cta-inner">
      <div>
        <h3>Join the Crystalina Club</h3>
        <p>Filter change reminders, NYC water quality alerts, and members-only pricing.</p>
      </div>
      <form class="newsletter" onsubmit="event.preventDefault(); toast('Thanks for subscribing! (demo)'); this.reset();">
        <input type="email" placeholder="Your email address" required>
        <button class="btn btn-accent" type="submit">Subscribe</button>
      </form>
    </div>
  </div>
  <div class="container footer-grid">
    <div class="footer-brand">
      ${LOGO_MARK}
      <p class="footer-tag">Pure Water. Pure Life.</p>
      <p class="footer-desc">Water filtration systems designed for New York City homes, from studio apartments to brownstones.</p>
      <div class="socials">
        ${SOCIALS.map(s => `<a href="${s.url}" target="_blank" rel="noopener" aria-label="${s.name}" title="${s.name}">${s.icon}</a>`).join('')}
      </div>
    </div>
    <div>
      <h4>Shop</h4>
      <a href="/shop/?cat=Reverse%20Osmosis">Reverse Osmosis</a>
      <a href="/shop/?cat=Whole%20House">Whole House</a>
      <a href="/shop/?cat=Countertop">Countertop</a>
      <a href="/shop/?cat=Shower%20%26%20Bath">Shower &amp; Bath</a>
      <a href="/shop/?cat=Replacement%20Filters">Replacement Filters</a>
    </div>
    <div>
      <h4>Learn</h4>
      <a href="/nyc-water/">NYC Water Facts</a>
      <a href="/quiz/">Find Your Filter</a>
      <a href="/about/">Our Story</a>
      <a href="/contact/">FAQ</a>
    </div>
    <div>
      <h4>Support</h4>
      <a href="/contact/">Contact Us</a>
      <a href="/account/">My Account</a>
      <a href="tel:+19178094803">(917) 809-4803</a>
      <a href="mailto:info@crystalina.org">info@crystalina.org</a>
      <a href="https://wa.me/19178094803" target="_blank" rel="noopener">WhatsApp Us</a>
    </div>
    <div>
      <h4>Visit</h4>
      <p class="footer-addr">Crystalina Water Co.<br>New York City, NY, USA</p>
      <p class="footer-addr">Monday to Saturday, 8am to 7pm ET</p>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="container footer-bottom-inner">
      <span>© ${new Date().getFullYear()} Crystalina Water Co. All rights reserved. Proudly serving the five boroughs.</span>
      <span class="footer-links"><a href="#">Privacy Policy</a> · <a href="#">Terms of Service</a> · <a href="#">Shipping &amp; Returns</a> · <a href="/signin/?mode=admin">Admin</a></span>
    </div>
  </div>`;
  document.body.appendChild(el);
}

/* ---------- product card ---------- */
function productCard(p) {
  const off = p.comparePrice ? Math.round((1 - p.price / p.comparePrice) * 100) : 0;
  return `
  <div class="product-card reveal">
    <a href="/product/?id=${p.id}" class="pc-img">
      <img src="${p.image}" alt="${p.name}" loading="lazy">
      ${p.badge ? `<span class="pc-badge">${p.badge}</span>` : ''}
      ${off ? `<span class="pc-off">-${off}%</span>` : ''}
      ${p.stock === 0 ? `<span class="pc-soldout">Sold Out</span>` : ''}
    </a>
    <div class="pc-body">
      <span class="pc-cat">${p.category}</span>
      <a href="/product/?id=${p.id}" class="pc-name">${p.name}</a>
      <div class="pc-rating">★ ${p.rating} <span>(${p.reviews})</span></div>
      <div class="pc-prices">
        <span class="pc-price">${money(p.price)}</span>
        ${p.comparePrice ? `<span class="pc-compare">${money(p.comparePrice)}</span>` : ''}
      </div>
      <button class="btn btn-primary btn-block pc-add" data-id="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>
        ${p.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
      </button>
    </div>
  </div>`;
}

function bindAddButtons(scope = document) {
  scope.querySelectorAll('.pc-add:not([disabled])').forEach(b =>
    b.addEventListener('click', () => {
      Store.addToCart(b.dataset.id);
      toast('Added to cart');
      openCart();
    }));
  if (window.initReveal) initReveal(scope);
}

/* Auto-tag common blocks below the fold so they animate on scroll. */
function autoReveal() {
  ['.step', '.testi', '.fact-card', '.stage', '.anatomy-figure', '.split > *', '.ci-card']
    .forEach(sel => document.querySelectorAll(sel).forEach(el => el.classList.add('reveal')));
}

/* ---------- page boot ---------- */
function initPage(activeNav = '') {
  renderHeader(activeNav);
  renderCartDrawer();
  renderFooter();
  autoReveal();
  requestAnimationFrame(() => initReveal());
}
