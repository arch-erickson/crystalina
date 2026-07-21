/* ============================================================
   Crystalina — Shared UI (header, footer, cart drawer, helpers)
   ============================================================ */

const money = n => '$' + n.toFixed(2);

const SOCIALS = [
  { name: 'Instagram', url: 'https://instagram.com/crystalinawater', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>' },
  { name: 'X', url: 'https://x.com/crystalinawater', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.9 3H21l-6.8 7.8L22.2 21h-6.3l-4.9-6.4L5.4 21H2.2l7.3-8.3L2 3h6.4l4.4 5.9L17.9 3zm-1.1 16.1h1.7L7.1 4.8H5.3l11.5 14.3z"/></svg>' },
  { name: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61591728311575', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5h2.5l.5-3h-3V8.6c0-.9.3-1.6 1.7-1.6h1.4V4.3c-.6-.1-1.5-.2-2.4-.2-2.4 0-4 1.4-4 4v2.4H7.5v3h2.7V21h3.3z"/></svg>' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/company/crystalina-water/', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2 2 0 1 1-.02 4 2 2 0 0 1 .02-4zM3.5 9h3v11.5h-3V9zm5.5 0h2.87v1.57h.04c.4-.76 1.38-1.57 2.84-1.57 3.04 0 3.6 2 3.6 4.6v6.9h-3v-6.12c0-1.46-.03-3.34-2.03-3.34-2.04 0-2.35 1.59-2.35 3.23v6.23H9V9z"/></svg>' },
  { name: 'WhatsApp', url: 'https://wa.me/19178094803', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.2-.8l.5-.7c.1-.2 0-.4 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.9.9-1.1 2.2-.3 3.7a12 12 0 0 0 4.6 4.5c1.7.9 2.7 1 3.6.7.6-.2 1.4-.8 1.6-1.5.2-.7.2-1.2.1-1.3-.1-.2-.3-.2-.6-.3z"/></svg>' }
];

const NAV_LINKS = [
  { label: 'Shop', href: 'shop.html' },
  { label: 'NYC Water Facts', href: 'nyc-water.html' },
  { label: 'Find Your Filter', href: 'quiz.html' },
  { label: 'About Us', href: 'about.html' },
  { label: 'Contact', href: 'contact.html' }
];

/* Branded droplet logo mark */
const LOGO_SVG = `
<svg viewBox="0 0 48 48" class="logo-mark" aria-hidden="true">
  <path d="M24 42a15 15 0 0 1-15-15C9 15 24 15 24 15s-9.5 4-9.5 12A9.5 9.5 0 0 0 24 36.5 9.5 9.5 0 0 0 33.5 27C33.5 19 24 15 24 15s15 0 15 12a15 15 0 0 1-15 15z" fill="none"/>
  <path d="M24 4a15.4 15.4 0 1 0 0 30.8A15.4 15.4 0 0 0 24 4zm0 27.3a11.9 11.9 0 1 1 0-23.8 11.9 11.9 0 0 1 0 23.8z" fill="#0B2A5B" opacity="0" />
  <path d="M35.8 8.6A15.5 15.5 0 1 0 39 19.4h-4.1a11.6 11.6 0 1 1-2.4-8.2l3.3-2.6z" fill="url(#lgA)"/>
  <path d="M24 9s-7.6 8.7-7.6 14.2a7.6 7.6 0 0 0 15.2 0C31.6 17.7 24 9 24 9z" fill="url(#lgB)"/>
  <defs>
    <linearGradient id="lgA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0B2A5B"/><stop offset="1" stop-color="#1E7BE0"/></linearGradient>
    <linearGradient id="lgB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#48C6EF"/><stop offset="1" stop-color="#1565C0"/></linearGradient>
  </defs>
</svg>`;

/* ---------- header ---------- */
function renderHeader(active = '') {
  const user = Store.currentUser();
  const el = document.createElement('div');
  el.innerHTML = `
  <div class="announce-bar">
    <span>💧 Free shipping on orders over $99 — delivered anywhere in the five boroughs</span>
    <a href="tel:+19178094803" class="announce-phone">📞 (917) 809-4803</a>
  </div>
  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="index.html">
        ${LOGO_SVG}
        <span class="brand-text">
          <span class="brand-name">CRYSTALINA</span>
          <span class="brand-tag">Pure Water. Pure Life.</span>
        </span>
      </a>
      <nav class="main-nav" id="mainNav">
        ${NAV_LINKS.map(l => `<a href="${l.href}" class="${active === l.href ? 'active' : ''}">${l.label}</a>`).join('')}
      </nav>
      <div class="header-actions">
        <a href="${user ? (user.role === 'admin' ? 'admin.html' : 'account.html') : 'signin.html'}" class="icon-btn" title="${user ? user.name : 'Sign in'}">
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
      <a href="checkout.html" class="btn btn-primary btn-block" id="checkoutBtn">Checkout</a>
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
    ? `<span class="ship-msg ship-ok">🎉 You've unlocked <strong>FREE shipping</strong>!</span>`
    : `<span class="ship-msg">Add <strong>${money(Math.max(remaining, 0))}</strong> more for free shipping</span>
       <div class="ship-track"><div class="ship-fill" style="width:${Math.min(subtotal / 99 * 100, 100)}%"></div></div>`;

  if (!items.length) {
    wrap.innerHTML = `<div class="cart-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" width="52"><circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2.5 3.5h3l2.6 12h10.4l2.5-8.5H6.2"/></svg>
      <p>Your cart is empty.</p><a class="btn btn-primary" href="shop.html">Shop Filters</a></div>`;
  } else {
    wrap.innerHTML = items.map(i => `
      <div class="cart-item">
        <img src="${i.product.image}" alt="${i.product.name}">
        <div class="ci-info">
          <a href="product.html?id=${i.id}" class="ci-name">${i.product.name}</a>
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
      ${LOGO_SVG}
      <p class="footer-tag">Pure Water. Pure Life.</p>
      <p class="footer-desc">Water filtration systems designed for New York City homes — from studio apartments to brownstones.</p>
      <div class="socials">
        ${SOCIALS.map(s => `<a href="${s.url}" target="_blank" rel="noopener" aria-label="${s.name}" title="${s.name}">${s.icon}</a>`).join('')}
      </div>
    </div>
    <div>
      <h4>Shop</h4>
      <a href="shop.html?cat=Reverse%20Osmosis">Reverse Osmosis</a>
      <a href="shop.html?cat=Whole%20House">Whole House</a>
      <a href="shop.html?cat=Countertop">Countertop</a>
      <a href="shop.html?cat=Shower%20%26%20Bath">Shower &amp; Bath</a>
      <a href="shop.html?cat=Replacement%20Filters">Replacement Filters</a>
    </div>
    <div>
      <h4>Learn</h4>
      <a href="nyc-water.html">NYC Water Facts</a>
      <a href="quiz.html">Find Your Filter</a>
      <a href="about.html">Our Story</a>
      <a href="contact.html">FAQ</a>
    </div>
    <div>
      <h4>Support</h4>
      <a href="contact.html">Contact Us</a>
      <a href="account.html">My Account</a>
      <a href="tel:+19178094803">(917) 809-4803</a>
      <a href="mailto:info@crystalina.org">info@crystalina.org</a>
      <a href="https://wa.me/19178094803" target="_blank" rel="noopener">WhatsApp Us</a>
    </div>
    <div>
      <h4>Visit</h4>
      <p class="footer-addr">Crystalina Water Co.<br>New York City, NY, USA</p>
      <p class="footer-addr">Mon–Sat, 8am–7pm ET</p>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="container footer-bottom-inner">
      <span>© ${new Date().getFullYear()} Crystalina Water Co. All rights reserved. Proudly serving the five boroughs.</span>
      <span class="footer-links"><a href="#">Privacy Policy</a> · <a href="#">Terms of Service</a> · <a href="#">Shipping &amp; Returns</a> · <a href="signin.html?mode=admin">Admin</a></span>
    </div>
  </div>`;
  document.body.appendChild(el);
}

/* ---------- product card ---------- */
function productCard(p) {
  const off = p.comparePrice ? Math.round((1 - p.price / p.comparePrice) * 100) : 0;
  return `
  <div class="product-card">
    <a href="product.html?id=${p.id}" class="pc-img">
      <img src="${p.image}" alt="${p.name}" loading="lazy">
      ${p.badge ? `<span class="pc-badge">${p.badge}</span>` : ''}
      ${off ? `<span class="pc-off">-${off}%</span>` : ''}
      ${p.stock === 0 ? `<span class="pc-soldout">Sold Out</span>` : ''}
    </a>
    <div class="pc-body">
      <span class="pc-cat">${p.category}</span>
      <a href="product.html?id=${p.id}" class="pc-name">${p.name}</a>
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
      toast('Added to cart ✓');
      openCart();
    }));
}

/* ---------- page boot ---------- */
function initPage(activeNav = '') {
  renderHeader(activeNav);
  renderCartDrawer();
  renderFooter();
}
