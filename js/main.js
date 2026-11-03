/* ============================================================
   Crystalina, Shared UI (header, footer, cart drawer, helpers)
   ============================================================ */

const money = n => '$' + n.toFixed(2);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
if (typeof window !== 'undefined') window.escapeHTML = escapeHTML;

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

/* The six shop categories, written once. The home page tiles, the Shop menu
   and the footer all read this list; the shop page filters by the name. */
const CATEGORIES = [
  { name: 'Reverse Osmosis',     desc: 'Under-sink purity',    image: '/images/cat-reverse-osmosis.webp', alt: 'Reverse osmosis drinking water' },
  { name: 'Whole House',         desc: 'Every tap protected',  image: '/images/cat-whole-house.webp',     alt: 'Whole house water filtration' },
  { name: 'Countertop',          desc: 'Renter friendly',      image: '/images/cat-countertop.webp',      alt: 'Countertop water dispenser' },
  { name: 'Shower & Bath',       desc: 'Softer skin and hair', image: '/images/cat-shower.webp',          alt: 'Shower filtration' },
  { name: 'Replacement Filters', desc: 'Keep it pure',         image: '/images/cat-replacement.webp',     alt: 'Replacement filters' },
  { name: 'Accessories',         desc: 'Meters, UV and more',  image: '/images/cat-accessories.webp',     alt: 'Water accessories' },
].map(c => ({ ...c, href: '/shop/?cat=' + encodeURIComponent(c.name) }));

/* Top navigation. An item with a menu opens a full width panel; its columns
   are lists of links and an optional feature tile, and every link is to a
   page or a filter that exists. */
const NAV_LINKS = [
  { label: 'Shop', href: '/shop/', menu: {
    columns: [
      { title: 'Systems', links: CATEGORIES.slice(0, 4).map(c => ({ label: c.name, href: c.href, desc: c.desc })) },
      { title: 'Keep it running', links: CATEGORIES.slice(4).map(c => ({ label: c.name, href: c.href, desc: c.desc })) },
      { title: 'Help choosing', links: [
        { label: 'Find your filter', href: '/quiz/', desc: 'Five questions, one answer' },
        { label: 'Water facts', href: '/nyc-water/', desc: 'What is in the tap, and why it matters' },
        { label: 'Talk to us', href: '/contact/', desc: 'Call, WhatsApp or visit' },
      ] },
    ],
    feature: { href: '/shop/', image: '/images/products/h5-600-uv-editorial.webp', alt: 'The Crystalina flagship reverse osmosis system', title: 'The flagship', text: 'Ten stages, alkaline, UV, built for New York water.' },
  } },
  { label: 'Water Facts', href: '/nyc-water/' },
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
function navItem(link, active) {
  const cls = 'nav-link' + (active === link.href ? ' active' : '');
  if (!link.menu) return `<li><a href="${link.href}" class="${cls}">${escapeHTML(link.label)}</a></li>`;
  const col = c => `<div class="mega-col"><h4>${escapeHTML(c.title)}</h4><ul>${c.links.map(k =>
    `<li><a href="${k.href}">${escapeHTML(k.label)}${k.desc ? `<small>${escapeHTML(k.desc)}</small>` : ''}</a></li>`).join('')}</ul></div>`;
  const feat = link.menu.feature ? `<a class="mega-feature" href="${link.menu.feature.href}">
      <div class="mega-feature-media"><img src="${link.menu.feature.image}" alt="${escapeHTML(link.menu.feature.alt)}" loading="lazy"></div>
      <strong>${escapeHTML(link.menu.feature.title)}</strong><small>${escapeHTML(link.menu.feature.text)}</small></a>` : '';
  return `<li class="has-menu"><a href="${link.href}" class="${cls}" aria-haspopup="true" aria-expanded="false">${escapeHTML(link.label)}</a>
    <div class="mega"><div class="container mega-inner">${link.menu.columns.map(col).join('')}${feat}</div></div></li>`;
}

function renderHeader(active = '') {
  const user = Store.currentUser();
  const notifications = user && user.role === 'customer' && Store.getNotificationsForUser ? Store.getNotificationsForUser(user) : [];
  const unreadNotifications = notifications.filter(item => !item.read).length;
  // The home page carries the header over its full viewport hero; every other
  // page has it as a sticky white bar in the flow.
  const overlay = active === '/';
  const el = document.createElement('div');
  el.className = 'site-top' + (overlay ? ' site-top--overlay' : '');
  el.innerHTML = `
  <div class="announce-bar">
    <span>${icon('droplet')} Free shipping on orders over $99, delivered anywhere in the five boroughs</span>
  </div>
  <header class="site-header${overlay ? ' is-transparent' : ''}">
    <div class="container header-inner">
      <div class="header-row">
        <div class="header-side header-side--left">
          <a href="tel:+19178094803" class="header-link">${icon('phone')} (917) 809-4803</a>
        </div>
        <a class="brand" href="/" aria-label="Crystalina. Pure Water. Pure Life.">
          ${LOGO_LOCKUP}
        </a>
        <div class="header-side header-actions">
          ${user && user.role === 'customer' ? `<div class="notification-wrap">
            <button class="icon-btn notification-btn" id="notificationBtn" title="Notifications" aria-label="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
              <span class="icon-label">Alerts</span>${unreadNotifications ? `<span class="notification-count" id="notificationCount">${unreadNotifications}</span>` : ''}
            </button>
            <div class="notification-menu" id="notificationMenu"><div class="notification-menu-head"><strong>Notifications</strong><span>${unreadNotifications} new</span></div>${notifications.length ? notifications.map(item => `<article class="notification-item ${item.read ? '' : 'unread'}"><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.message)}</p><small>${new Date(item.sent).toLocaleDateString('en-US', { dateStyle: 'medium' })}</small></article>`).join('') : '<p class="notification-empty">You have no notifications.</p>'}</div>
          </div>` : ''}
          <a href="${user ? (user.role === 'admin' ? '/admin/' : '/account/') : '/signin/'}" class="icon-btn" title="${user ? user.name : 'Sign in'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>
            <span class="icon-label">${user ? user.name.split(' ')[0] : 'Sign In'}</span>
          </a>
          <button class="icon-btn cart-btn" id="cartOpenBtn" title="Cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2.5 3.5h3l2.6 12h10.4l2.5-8.5H6.2"/></svg>
            <span class="icon-label">Cart</span>
            <span class="cart-count" id="cartCount">0</span>
          </button>
          <button class="hamburger" id="hamburgerBtn" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
        </div>
      </div>
      <nav class="main-nav" id="mainNav" aria-label="Main">
        <button class="nav-close" id="navCloseBtn" aria-label="Close menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        <ul>${NAV_LINKS.map(link => navItem(link, active)).join('')}</ul>
      </nav>
    </div>
  </header>
  <div class="nav-overlay" id="navOverlay"></div>`;
  document.body.prepend(el);

  const header = el.querySelector('.site-header');
  const nav = document.getElementById('mainNav');

  // Height as a custom property, for anything that has to clear the bar.
  const setHeight = () => document.documentElement.style.setProperty('--header-h', el.offsetHeight + 'px');
  setHeight();
  if (window.ResizeObserver) new ResizeObserver(setHeight).observe(el);

  // Transparent over the hero, white once scrolled.
  if (overlay) {
    const onScroll = () => header.classList.toggle('is-transparent', window.scrollY < 24 && !nav.classList.contains('open'));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    nav.addEventListener('transitionend', onScroll);
  }

  const hamburger = document.getElementById('hamburgerBtn');
  const setDrawer = open => {
    nav.classList.toggle('open', open);
    document.body.classList.toggle('nav-open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    if (overlay) header.classList.toggle('is-transparent', !open && window.scrollY < 24);
  };
  hamburger.addEventListener('click', () => setDrawer(!nav.classList.contains('open')));
  document.getElementById('navCloseBtn').addEventListener('click', () => setDrawer(false));
  document.getElementById('navOverlay').addEventListener('click', () => setDrawer(false));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('open')) { setDrawer(false); hamburger.focus(); } });

  // While a menu is open the bar is white even over the hero, and the link
  // says so to assistive technology.
  el.querySelectorAll('.has-menu').forEach(li => {
    const link = li.querySelector('.nav-link');
    const show = () => { header.classList.add('menu-open'); link.setAttribute('aria-expanded', 'true'); };
    const hide = () => { if (!li.classList.contains('is-open')) { header.classList.remove('menu-open'); link.setAttribute('aria-expanded', 'false'); } };
    li.addEventListener('mouseenter', show);
    li.addEventListener('mouseleave', hide);
    li.addEventListener('focusin', show);
    li.addEventListener('focusout', event => { if (!li.contains(event.relatedTarget)) hide(); });
  });

  // Menus: hover and focus open them on their own through CSS. Where there is
  // no hover, or inside the drawer, the first tap opens and the second follows.
  const closeMenus = () => { el.querySelectorAll('.has-menu.is-open').forEach(li => {
    li.classList.remove('is-open');
    li.querySelector('.nav-link').setAttribute('aria-expanded', 'false');
  }); header.classList.remove('menu-open'); };
  el.querySelectorAll('.has-menu > .nav-link').forEach(link => {
    link.addEventListener('click', event => {
      const li = link.parentElement;
      const tapToOpen = window.matchMedia('(max-width: 860px)').matches || window.matchMedia('(hover: none)').matches;
      if (!tapToOpen || li.classList.contains('is-open')) return;
      event.preventDefault();
      closeMenus();
      li.classList.add('is-open');
      link.setAttribute('aria-expanded', 'true');
    });
  });
  document.addEventListener('click', event => { if (!event.target.closest('.has-menu')) closeMenus(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeMenus(); document.activeElement?.blur(); } });

  document.getElementById('cartOpenBtn').addEventListener('click', openCart);
  const notificationBtn = document.getElementById('notificationBtn');
  if (notificationBtn) notificationBtn.addEventListener('click', event => {
    event.stopPropagation();
    document.getElementById('notificationMenu').classList.toggle('open');
    Store.markNotificationsRead(user);
    document.getElementById('notificationCount')?.remove();
  });
  document.addEventListener('click', event => { if (!event.target.closest('.notification-wrap')) document.getElementById('notificationMenu')?.classList.remove('open'); });
  updateCartBadge();
}

/* Home page category tiles, from the same list as the menu. */
function renderCategoryTiles() {
  const grid = document.getElementById('categoryGrid');
  if (!grid) return;
  grid.innerHTML = CATEGORIES.map((c, i) => `
    <a href="${c.href}" class="cat-tile">
      <div class="ct-media"><img src="${c.image}" alt="${escapeHTML(c.alt)}" loading="lazy" onerror="this.onerror=null;this.src=Store.placeholder('${escapeHTML(c.name).replace(/'/g, '')}',${i})"></div>
      <div class="ct-label">${escapeHTML(c.name)} <small>${escapeHTML(c.desc)}</small></div>
    </a>`).join('');
}

function applyAnnouncementStyle(settings) {
  const bar = document.querySelector('.announce-bar');
  if (!bar || !settings) return;
  const style = settings.announcementStyle || {};
  if (style.font) bar.style.fontFamily = style.font;
  if (style.size) bar.style.fontSize = style.size;
  if (style.color) bar.style.color = style.color;
  if (style.background) bar.style.background = style.background;
}

function applySiteSettings() {
  const _annSettings = Store.getSiteSettings ? Store.getSiteSettings() : null;
  applyAnnouncementStyle(_annSettings);
  if (!Store.getSiteSettings) return;
  const settings = Store.getSiteSettings();
  document.documentElement.style.setProperty('--navy-900', settings.navy);
  document.documentElement.style.setProperty('--navy-800', settings.navy);
  document.documentElement.style.setProperty('--blue-500', settings.primary);
  document.documentElement.style.setProperty('--cyan-300', settings.accent);

  const announcement = document.querySelector('.announce-bar > span');
  if (announcement && announcement.lastChild) announcement.lastChild.textContent = ' ' + settings.announcement;
  const eyebrow = document.getElementById('homeHeroEyebrow');
  const heading = document.getElementById('homeHeroHeading');
  const body = document.getElementById('homeHeroBody');
  const hero = document.querySelector('.hero');
  if (eyebrow) eyebrow.textContent = settings.heroEyebrow;
  if (heading) {
    heading.replaceChildren();
    settings.heroHeading.split(/(50 Feet)/).forEach(part => {
      if (part === '50 Feet') { const accent = document.createElement('em'); accent.textContent = part; heading.append(accent); }
      else heading.append(document.createTextNode(part));
    });
  }
  if (body) body.textContent = settings.heroBody;
  if (hero && settings.heroImage) hero.style.setProperty('--hero-image', `url("${settings.heroImage.replace(/"/g, '\\"')}")`);
  applyPageSections();
}

/* Text edited directly in the admin preview. Each entry is keyed by a
   structural path within the section, so arbitrary text (a stat, a button
   label, a list item) can be overridden without a field per element. */
function applyTextOverrides(sectionEl, overrides) {
  if (!sectionEl || !overrides) return;
  Object.entries(overrides).forEach(([path, value]) => {
    let node = sectionEl;
    for (const step of path.split('>')) {
      const index = Number(step.split(':')[1]);
      node = node && node.children[index];
      if (!node) return;
    }
    if (node && node !== sectionEl) node.textContent = value;
  });
}

/* Per-section typography chosen in the content editor. Values are applied as
   inline custom properties so an empty field simply falls back to the design
   system rather than overriding it with a blank. */
function applySectionTypography(el, typography) {
  if (!el || !typography) return;
  const map = {
    headingFont: '--sec-heading-font', headingSize: '--sec-heading-size',
    headingColor: '--sec-heading-color', bodyFont: '--sec-body-font',
    bodySize: '--sec-body-size', bodyColor: '--sec-body-color'
  };
  // Only the two design system faces may be set. A section saved before the
  // type rule existed can still name a font the site does not load, which
  // would render in whatever the visitor's machine happened to have.
  const FACES = ['var(--font-head)', 'var(--font-body)'];
  let touched = false;
  Object.entries(map).forEach(([key, prop]) => {
    const value = typography[key];
    if (!value) return;
    if (key.endsWith('Font') && !FACES.includes(value)) return;
    el.style.setProperty(prop, value);
    touched = true;
  });
  if (touched) el.classList.add('has-custom-type');
}

/* Hero copy from the editor, written so a phone can leave out everything
   before the last sentence: those sentences are wrapped in .phone-hide. The
   accent, when given, is set in an em wherever it appears. */
function setHeroText(el, text, accent) {
  const appendWithAccent = (parent, str) => {
    if (!accent || !str.includes(accent)) { parent.append(document.createTextNode(str)); return; }
    str.split(accent).forEach((part, i) => {
      if (i) { const em = document.createElement('em'); em.textContent = accent; parent.append(em); }
      if (part) parent.append(document.createTextNode(part));
    });
  };
  el.replaceChildren();
  const sentences = String(text || '').match(/[^.!?]+[.!?]+\s*|[^.!?]+$/g) || [];
  const head = sentences.slice(0, -1).join('');
  const tail = sentences[sentences.length - 1] || '';
  if (head) { const span = document.createElement('span'); span.className = 'phone-hide'; appendWithAccent(span, head); el.append(span); }
  appendWithAccent(el, tail);
}

function applyPageSections() {
  const main = document.querySelector('main');
  const sections = Store.getAdminData?.().pageSections || [];
  // Only the home page has a section stack. Without this guard every other
  // page grew the whole stack as empty headings beneath its own content.
  if (!main || !sections.length || !main.querySelector('[data-home-section]')) return;
  const configuredIds = new Set(sections.map(section => section.id));
  main.querySelectorAll('[data-home-section]').forEach(section => {
    // Hide only what the editor explicitly disabled. A section that is simply
    // absent from the stack stays visible, so adding one custom layer can never
    // blank out the rest of the homepage.
    const config = sections.find(entry => entry.id === section.dataset.homeSection);
    if (config && config.enabled === false) section.hidden = true;
    if (config) applySectionTypography(section, config.typography);
    if (config) applyTextOverrides(section, config.textOverrides);
  });
  sections.forEach(config => {
    let section = main.querySelector(`[data-home-section="${CSS.escape(config.id)}"]`);
    if (!section) {
      section = document.createElement('section');
      section.className = 'section section-alt';
      section.dataset.homeSection = config.id;
      section.innerHTML = '<div class="container"><div class="section-head"><span class="eyebrow"></span><h2></h2><p></p></div></div>';
    }
    if (!section) return;
    section.hidden = config.enabled === false;
    if (config.id === 'hero') {
      const eyebrow = section.querySelector('#homeHeroEyebrow');
      const heading = section.querySelector('#homeHeroHeading');
      const body = section.querySelector('#homeHeroBody');
      if (eyebrow) eyebrow.textContent = config.eyebrow || '';
      if (heading) setHeroText(heading, config.heading, heading.querySelector('em')?.textContent || '');
      if (body) setHeroText(body, config.body);
    } else {
      const eyebrow = section.querySelector('.section-head .eyebrow') || section.querySelector('.split .eyebrow');
      const heading = section.querySelector('.section-head h2') || section.querySelector('.split h2') || section.querySelector('.cta-band h2');
      const body = section.querySelector('.section-head p') || section.querySelector('.split h2 + p') || section.querySelector('.cta-band p');
      if (eyebrow && config.eyebrow !== undefined) eyebrow.textContent = config.eyebrow;
      if (heading && config.heading) heading.textContent = config.heading;
      if (body && config.body) body.textContent = config.body;
    }
    main.appendChild(section);
  });
}

/* ---------- cart drawer ---------- */
function renderCartDrawer() {
  const el = document.createElement('div');
  el.innerHTML = `
  <div class="cart-overlay" id="cartOverlay"></div>
  <aside class="cart-drawer" id="cartDrawer" role="dialog" aria-modal="true" aria-label="Shopping cart">
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
        <img src="${escapeHTML(i.product.image)}" alt="${escapeHTML(i.product.name)}">
        <div class="ci-info">
          <a href="/product/?id=${encodeURIComponent(i.id)}" class="ci-name">${escapeHTML(i.product.name)}</a>
          ${i.option || i.faucet ? `<div class="ci-config">${[i.option ? escapeHTML(i.option.label) : "", i.faucet ? escapeHTML(i.faucet.name) : ""].filter(Boolean).join(" &middot; ")}</div>` : ""}
          <div class="ci-price">${money(i.unitPrice)}</div>
          <div class="ci-qty">
            <button data-act="dec" data-line="${escapeHTML(i.lineId)}" aria-label="Decrease quantity">−</button>
            <span>${i.qty}</span>
            <button data-act="inc" data-line="${escapeHTML(i.lineId)}" aria-label="Increase quantity">+</button>
            <button class="ci-remove" data-act="rm" data-line="${escapeHTML(i.lineId)}">Remove</button>
          </div>
        </div>
        <div class="ci-line">${money(i.unitPrice * i.qty)}</div>
      </div>`).join('');
    wrap.querySelectorAll('button[data-act]').forEach(b => b.addEventListener('click', () => {
      // A line is product|stageOption|faucet, so the right build is mutated.
      const { act, line } = b.dataset;
      const [id, stageOptionId, faucetId] = String(line || '').split('|');
      const config = { stageOptionId: stageOptionId || null, faucetId: faucetId || null };
      const item = Store.cartDetails().items.find(x => x.lineId === line);
      if (!item) return;
      if (act === 'inc') Store.updateQty(id, item.qty + 1, config);
      if (act === 'dec') Store.updateQty(id, item.qty - 1, config);
      if (act === 'rm') Store.updateQty(id, 0, config);
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
  // Company details come from site settings so an edit in the admin console
  // actually reaches the public footer.
  const cfg = (Store.getSiteSettings && Store.getSiteSettings()) || {};
  const companyName = cfg.companyName || 'Crystalina Water Co.';
  const companyEmail = cfg.email || 'info@crystalina.org';
  const companyPhone = cfg.phone || '(917) 809-4803';
  const companyAddress = cfg.address || 'New York City, NY, USA';
  const companyHours = cfg.hours || 'Monday to Saturday, 8am to 7pm ET';
  const telHref = 'tel:+' + String(companyPhone).replace(/[^0-9]/g, '');
  const el = document.createElement('footer');
  el.className = 'site-footer';
  el.innerHTML = `
  <div class="footer-cta">
    <div class="container footer-cta-inner">
      <div>
        <h3>Join the Crystalina Club</h3>
        <p>Filter change reminders, NYC water quality alerts, and members-only pricing.</p>
      </div>
      <form class="newsletter" id="newsletterForm">
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
      ${CATEGORIES.map(c => `<a href="${c.href}">${escapeHTML(c.name)}</a>`).join('')}
    </div>
    <div>
      <h4>Learn</h4>
      <a href="/nyc-water/">Water Facts</a>
      <a href="/quiz/">Find Your Filter</a>
      <a href="/about/">Our Story</a>
      <a href="/contact/">FAQ</a>
    </div>
    <div>
      <h4>Support</h4>
      <a href="/contact/">Contact Us</a>
      <a href="/account/">My Account</a>
      <a href="${telHref}">${escapeHTML(companyPhone)}</a>
      <a href="mailto:${escapeHTML(companyEmail)}">${escapeHTML(companyEmail)}</a>
      <a href="https://wa.me/19178094803" target="_blank" rel="noopener">WhatsApp Us</a>
    </div>
    <div>
      <h4>Visit</h4>
      <p class="footer-addr">${escapeHTML(companyName)}<br>${escapeHTML(companyAddress)}</p>
      <p class="footer-addr">${escapeHTML(companyHours)}</p>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="container footer-bottom-inner">
      <span>© ${new Date().getFullYear()} ${escapeHTML(companyName.replace(/\.$/, ''))}. All rights reserved. Proudly serving the five boroughs.</span>
      <span class="footer-links"><a href="#">Privacy Policy</a> · <a href="#">Terms of Service</a> · <a href="#">Shipping &amp; Returns</a> · <a href="/signin/?mode=staff">Staff sign in</a></span>
    </div>
  </div>`;
  document.body.appendChild(el);
}

/* ------------------------------------------------------------
   Canonical merchandising order.
   Complete systems lead, then the faucets that upgrade them, then the
   consumables. Anything new falls in after the known categories rather
   than jumping to the front, so the storefront order stays predictable
   as the catalog grows.
   ------------------------------------------------------------ */
const CATEGORY_RANK = [
  'Reverse Osmosis', 'Whole House', 'Countertop', 'Faucets',
  'Shower & Bath', 'Faucet & Pitcher', 'Accessories', 'Replacement Filters'
];
const KIND_RANK = { system: 0, faucet: 1, filter_bundle: 2, replacement_filter: 3 };

function categoryRank(product) {
  const index = CATEGORY_RANK.indexOf(product.category);
  return index === -1 ? CATEGORY_RANK.length : index;
}

/* Default storefront ordering: systems first, then by category, then name. */
function sortForDisplay(products) {
  return products.slice().sort((a, b) => {
    const kind = (KIND_RANK[a.productKind] ?? 9) - (KIND_RANK[b.productKind] ?? 9);
    if (kind) return kind;
    const cat = categoryRank(a) - categoryRank(b);
    if (cat) return cat;
    if (a.displayOrder != null && b.displayOrder != null && a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }
    return String(a.name).localeCompare(String(b.name));
  });
}
if (typeof window !== 'undefined') { window.sortForDisplay = sortForDisplay; window.CATEGORY_RANK = CATEGORY_RANK; }

/* ---------- product card ---------- */
function productCard(p) {
  const off = p.comparePrice ? Math.round((1 - p.price / p.comparePrice) * 100) : 0;
  return `
  <div class="product-card reveal">
    <a href="/product/?id=${encodeURIComponent(p.id)}" class="pc-img">
      <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" loading="lazy">
      ${p.badge ? `<span class="pc-badge">${escapeHTML(p.badge)}</span>` : ''}
      ${off ? `<span class="pc-off">-${off}%</span>` : ''}
      ${p.stock === 0 ? `<span class="pc-soldout">Sold Out</span>` : ''}
    </a>
    <div class="pc-body">
      <span class="pc-cat">${escapeHTML(p.category)}</span>
      <a href="/product/?id=${encodeURIComponent(p.id)}" class="pc-name">${escapeHTML(p.name)}</a>
      ${p.reviews ? `<div class="pc-rating">★ ${p.rating} <span>(${p.reviews})</span></div>` : ''}
      <div class="pc-prices">
        <span class="pc-price">${money(p.price)}</span>
        ${p.comparePrice ? `<span class="pc-compare">${money(p.comparePrice)}</span>` : ''}
      </div>
      <button class="btn btn-primary btn-block pc-add" data-id="${escapeHTML(p.id)}" aria-label="${p.stock === 0 ? `${escapeHTML(p.name)} is out of stock` : `Add ${escapeHTML(p.name)} to cart`}" ${p.stock === 0 ? 'disabled' : ''}>
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

/* Subscribe through /api/newsletter. */
function bindNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form || form.dataset.bound) return;
  form.dataset.bound = '1';
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('button');
    const email = input.value.trim();
    button.disabled = true;
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, turnstileToken: window.turnstile?.getResponse?.() })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Subscription failed.');
      toast('You are on the list. Welcome to the Crystalina Club.');
      form.reset();
    } catch (error) {
      toast(error.message);
    } finally {
      button.disabled = false;
    }
  });
}

/* ---------- page boot ---------- */
function initPage(activeNav = '') {
  renderHeader(activeNav);
  applySiteSettings();
  renderCartDrawer();
  renderFooter();
  renderCategoryTiles();
  // One class says whether the page has scrolled; phone-only rules read it.
  const markScrolled = () => document.body.classList.toggle('is-scrolled', window.scrollY > 120);
  markScrolled();
  window.addEventListener('scroll', markScrolled, { passive: true });
  autoReveal();
  requestAnimationFrame(() => initReveal());
  bindNewsletter();
  // Refresh pricing, stock and publication state from Supabase.
  if (Store.hydrateFromSupabase) Store.hydrateFromSupabase();
  // Pull published page layout and site settings, then repaint.
  if (Store.hydrateSiteContent) {
    Store.hydrateSiteContent().then(() => { applySiteSettings(); applyPageSections(); });
  }
}
