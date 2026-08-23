/* ============================================================
   Crystalina, Data Layer (localStorage-backed, first draft)
   Products, cart, users, sessions, orders.
   ============================================================ */

const Store = (() => {
  const KEYS = {
    products: 'crystalina_products',
    cart: 'crystalina_cart',
    users: 'crystalina_users',
    session: 'crystalina_session',
    orders: 'crystalina_orders',
    adminData: 'crystalina_admin_data',
    seedVersion: 'crystalina_seed_v'
  };
  const SEED_VERSION = 3;

  /* ---------- SVG placeholder image generator ---------- */
  // Generates a branded placeholder (gradient + droplet + label).
  // Real product photos will replace these later.
  function placeholder(label, variant = 0) {
    const palettes = [
      ['#0B2A5B', '#1E7BE0'],
      ['#123C7A', '#3FA9F5'],
      ['#0E3163', '#2196F3'],
      ['#0B2A5B', '#48C6EF'],
      ['#14468C', '#1E7BE0']
    ];
    const [c1, c2] = palettes[variant % palettes.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
        </linearGradient>
        <linearGradient id="d" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#BFE3FF"/><stop offset="1" stop-color="#FFFFFF"/>
        </linearGradient>
      </defs>
      <rect width="640" height="480" fill="url(#g)"/>
      <circle cx="540" cy="80" r="140" fill="#ffffff" opacity="0.06"/>
      <circle cx="80" cy="420" r="180" fill="#ffffff" opacity="0.05"/>
      <path d="M320 120 C 320 120, 250 220, 250 280 A 70 70 0 0 0 390 280 C 390 220, 320 120, 320 120 Z"
            fill="url(#d)" opacity="0.92"/>
      <ellipse cx="298" cy="262" rx="14" ry="26" fill="#ffffff" opacity="0.85" transform="rotate(-18 298 262)"/>
      <text x="320" y="410" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif"
            font-size="28" font-weight="600" fill="#ffffff" opacity="0.95">${label}</text>
      <text x="320" y="440" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif"
            font-size="15" fill="#ffffff" opacity="0.6">Placeholder, photo coming soon</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  /* ---------- Seed catalog ---------- */
  function seedProducts() {
    const P = (id, name, category, price, comparePrice, stock, badge, short, description, specs, variant) => ({
      id, name, category, price, comparePrice, stock, badge, short, description, specs,
      image: `/images/products/${id}.webp`,
      rating: (4.5 + (variant % 5) * 0.1).toFixed(1),
      reviews: 40 + variant * 37
    });

    return [
      P('ro-alkaline-10', 'Crystalina RO-10 Alkaline Reverse Osmosis System', 'Reverse Osmosis', 349.99, 429.99, 24, 'Best Seller',
        '10-stage under-sink RO with remineralization, built for NYC apartments.',
        'Our flagship 10-stage reverse osmosis system removes up to 99.99% of contaminants commonly found in New York City tap water, including lead from aging building plumbing, chlorine, chloramine, PFAS, and microplastics, then adds back healthy minerals for crisp, alkaline-balanced water. Compact tank design fits under standard NYC apartment sinks.',
        ['10 filtration stages', 'Alkaline remineralization', '100 gallons per day', 'Lead, PFAS, chlorine & microplastic reduction', 'Fits under standard sinks', 'Includes designer faucet'], 0),
      P('ro-classic-5', 'Crystalina RO-5 Classic Reverse Osmosis System', 'Reverse Osmosis', 219.99, 279.99, 41, null,
        'Proven 5-stage RO purification at an accessible price.',
        'The RO-5 Classic delivers the same core purification trusted in millions of homes: sediment, dual carbon, RO membrane, and polishing post-carbon. Everything you need to turn NYC tap into bottle-quality water, without the bottles.',
        ['5 filtration stages', '50 gallons per day', 'Quick-connect fittings', '1-year filter life (pre-filters)', 'Includes chrome faucet'], 1),
      P('wh-3stage', 'Crystalina Whole Home 3-Stage Filtration System', 'Whole House', 499.99, 599.99, 12, 'New',
        'Filters every tap, shower, and appliance in your home or brownstone.',
        'Designed for NYC brownstones, townhouses, and whole-apartment retrofits. Three heavy-duty stages, sediment, KDF, and activated carbon, protect your plumbing and appliances while removing chlorine, rust from old mains, and heavy metals before water reaches a single tap.',
        ['Whole-home coverage', '3 heavy-duty stages', '0.25 micron sediment capture', 'Protects appliances & plumbing', '150,000 gallon capacity'], 2),
      P('ct-luxe', 'Crystalina Countertop Luxe Dispenser', 'Countertop', 179.99, null, 33, null,
        'No installation. Plug in, fill, and drink pure water in minutes.',
        'Renting in the city? The Countertop Luxe needs zero plumbing. A 4-stage cartridge with UV polishing turns tap water into clean, great-tasting water at the push of a button, perfect for apartments where installations aren\'t allowed.',
        ['Zero installation', '4-stage cartridge + UV', 'Hot, cold & ambient dispensing', '1.5 gallon reservoir', 'Renter friendly'], 3),
      P('shower-12', 'Crystalina VitaShower 12-Stage Shower Filter', 'Shower & Bath', 44.99, 59.99, 87, 'Popular',
        'Softer skin and hair, removes chlorine right at the showerhead.',
        'NYC disinfects its water with chlorine, which is great for safety but rough on skin and hair. The VitaShower\'s 12-stage cartridge with KDF-55 and vitamin C reduces chlorine and heavy metals at the point of use. Installs in under 5 minutes, no tools.',
        ['12 filtration stages', 'KDF-55 + Vitamin C', 'Fits all standard showers', '6-month cartridge life', 'Tool-free install'], 4),
      P('faucet-pure', 'Crystalina PureTap Faucet Filter', 'Faucet & Pitcher', 34.99, null, 120, null,
        'Twist-on faucet filtration for instant cleaner water.',
        'The fastest way to upgrade your tap. The PureTap twists onto any standard kitchen faucet and reduces lead, chlorine taste, and sediment with a switchable filtered/unfiltered lever.',
        ['Tool-free install', 'Lead & chlorine reduction', '200 gallon cartridge', 'Filtered/unfiltered switch'], 0),
      P('pitcher-glacier', 'Crystalina Glacier 10-Cup Filter Pitcher', 'Faucet & Pitcher', 29.99, 39.99, 96, null,
        'The classic pitcher, upgraded with 7-layer filtration.',
        'A fridge-ready 10-cup pitcher with our 7-layer cartridge: activated coconut carbon, ion exchange resin, and micro-net screens for cleaner, better-tasting water anywhere.',
        ['10-cup capacity', '7-layer cartridge', '40 gallon filter life', 'BPA-free Tritan body'], 1),
      P('filters-ro-set', 'RO Replacement Filter Set (Stages 1 to 3)', 'Replacement Filters', 49.99, null, 200, null,
        'Annual pre-filter refresh for RO-5 and RO-10 systems.',
        'Keep your system performing like day one. Includes sediment and dual carbon block pre-filters compatible with all Crystalina RO systems. Replace every 12 months.',
        ['Fits RO-5 & RO-10', 'Sediment + 2 carbon blocks', '12-month service life', 'Tool-free twist design'], 2),
      P('filters-wh-set', 'Whole Home Replacement Set', 'Replacement Filters', 89.99, 109.99, 64, null,
        'Full 3-stage refresh for the Whole Home system.',
        'Heavy-duty sediment, KDF, and carbon replacements engineered for NYC\'s aging water mains. Replace every 6 to 12 months depending on usage.',
        ['Fits Whole Home 3-Stage', 'Sediment + KDF + carbon', '6 to 12 month service life'], 3),
      P('uv-guard', 'Crystalina UV Guard Add-On', 'Accessories', 119.99, null, 18, null,
        'Ultraviolet sterilization stage for 99.99% microbial protection.',
        'Add a UV sterilization chamber to any Crystalina RO system for an extra layer of protection against bacteria, viruses, and cysts, peace of mind during city boil advisories and turbidity events.',
        ['11W UV chamber', '99.99% microbial reduction', 'Fits all Crystalina RO systems', 'Annual lamp replacement'], 4),
      P('tds-meter', 'Digital TDS Water Quality Meter', 'Accessories', 19.99, null, 150, null,
        'Test your tap and your filtered water, see the difference.',
        'A pocket digital meter that reads total dissolved solids in seconds. Test your building\'s tap water, then test your Crystalina water and watch the number drop.',
        ['0 to 9990 ppm range', 'Auto temperature compensation', 'Includes carry case'], 0),
      P('mineral-drops', 'Crystalina Trace Mineral Drops', 'Accessories', 24.99, null, 75, null,
        'Electrolyte and mineral boost for RO-purified water.',
        'Purification removes the bad and some of the good. Add back magnesium, calcium, and potassium with a few drops per glass for taste and hydration.',
        ['76 trace minerals', '4 oz / ~200 servings', 'Unflavored'], 1)
    ];
  }

  function ensureSeed() {
    const v = Number(localStorage.getItem(KEYS.seedVersion) || 0);
    if (v < SEED_VERSION || !localStorage.getItem(KEYS.products)) {
      localStorage.setItem(KEYS.products, JSON.stringify(seedProducts()));
      localStorage.setItem(KEYS.seedVersion, String(SEED_VERSION));
    }
    if (!localStorage.getItem(KEYS.users)) {
      localStorage.setItem(KEYS.users, JSON.stringify([{
        id: 'admin-1',
        name: 'Crystalina Admin',
        email: 'admin@crystalinawater.com',
        password: 'crystalina2026', // demo only, replace with real auth before launch
        role: 'admin',
        created: new Date().toISOString()
      }]));
    }
    if (!localStorage.getItem(KEYS.adminData)) {
      localStorage.setItem(KEYS.adminData, JSON.stringify(seedAdminData()));
    }
  }

  function seedAdminData() {
    return {
      subscriptions: [
        { id: 'SUB-1048', customer: 'Maya Chen', email: 'maya@example.com', system: 'RO-10 Alkaline', cadence: '6 months', nextDate: '2026-09-03', replacement: 'Stages 1 to 3', status: 'Active' },
        { id: 'SUB-1047', customer: 'James Wilson', email: 'james@example.com', system: 'Whole Home 3-Stage', cadence: '6 months', nextDate: '2026-09-05', replacement: 'Whole Home Set', status: 'Active' },
        { id: 'SUB-1044', customer: 'Sofia Martinez', email: 'sofia@example.com', system: 'RO-5 Classic', cadence: '12 months', nextDate: '2026-09-09', replacement: 'Stages 1 to 3', status: 'Paused' },
        { id: 'SUB-1039', customer: 'Noah Brown', email: 'noah@example.com', system: 'VitaShower', cadence: '6 months', nextDate: '2026-09-12', replacement: 'Shower Cartridge', status: 'Active' }
      ],
      jobs: [
        { id: 'JOB-2081', customer: 'Maya Chen', address: '45-18 21st St', borough: 'Queens', type: 'Filter replacement', date: '2026-08-25', time: '9:00 AM', technician: 'Luis Rivera', status: 'Confirmed', checklistDone: 1, checklistTotal: 4, beforePhoto: '', afterPhoto: '' },
        { id: 'JOB-2082', customer: 'James Wilson', address: '211 W 104th St', borough: 'Manhattan', type: 'Whole home install', date: '2026-08-25', time: '1:30 PM', technician: 'Amina Patel', status: 'Assigned', checklistDone: 0, checklistTotal: 6, beforePhoto: '', afterPhoto: '' },
        { id: 'JOB-2083', customer: 'Sofia Martinez', address: '78 Prospect Pl', borough: 'Brooklyn', type: 'Annual maintenance', date: '2026-08-26', time: '10:00 AM', technician: 'Luis Rivera', status: 'Needs assignment', checklistDone: 0, checklistTotal: 5, beforePhoto: '', afterPhoto: '' }
      ],
      staff: [
        { id: 'STAFF-01', name: 'Luis Rivera', role: 'Lead Technician', email: 'luis@crystalina.org', phone: '(917) 555-0142', area: 'Brooklyn, Queens', availability: 'Available', rating: 4.9, jobs: 38, initials: 'LR' },
        { id: 'STAFF-02', name: 'Amina Patel', role: 'Installation Technician', email: 'amina@crystalina.org', phone: '(917) 555-0188', area: 'Manhattan, Bronx', availability: 'On job', rating: 4.8, jobs: 31, initials: 'AP' },
        { id: 'STAFF-03', name: 'Marcus Lee', role: 'Sales Representative', email: 'marcus@crystalina.org', phone: '(917) 555-0164', area: 'All boroughs', availability: 'Available', rating: 4.7, jobs: 24, initials: 'ML' }
      ],
      suppliers: [
        { id: 'PO-3108', supplier: 'AquaCore Components', category: 'RO membranes', contact: 'orders@aquacore.example', amount: 2840, eta: '2026-08-27', status: 'In transit', tracking: 'ACX-884120' },
        { id: 'PO-3107', supplier: 'PureFlow Wholesale', category: 'Carbon blocks', contact: 'sales@pureflow.example', amount: 1925, eta: '2026-08-29', status: 'Confirmed', tracking: 'PFW-220419' },
        { id: 'PO-3104', supplier: 'Metro Plumbing Supply', category: 'Installation fittings', contact: 'dispatch@metroplumbing.example', amount: 760, eta: '2026-08-22', status: 'Delivered', tracking: 'MPS-741026' }
      ],
      leads: [
        { id: 'LEAD-5028', name: 'Olivia Thompson', email: 'olivia@example.com', source: 'Website quote', interest: 'Whole Home 3-Stage', borough: 'Brooklyn', value: 1299, followUp: '2026-08-24', stage: 'Qualified' },
        { id: 'LEAD-5027', name: 'Ethan Davis', email: 'ethan@example.com', source: 'Referral', interest: 'RO-10 Alkaline', borough: 'Queens', value: 599, followUp: '2026-08-25', stage: 'Quote sent' },
        { id: 'LEAD-5024', name: 'Ava Robinson', email: 'ava@example.com', source: 'Water quiz', interest: 'Countertop Luxe', borough: 'Manhattan', value: 180, followUp: '2026-08-26', stage: 'New' },
        { id: 'LEAD-5018', name: 'Lucas Garcia', email: 'lucas@example.com', source: 'Phone inquiry', interest: 'RO-5 Classic', borough: 'Bronx', value: 420, followUp: '2026-08-23', stage: 'Won' }
      ],
      campaigns: [
        { id: 'CAM-108', name: 'End of Summer Filter Refresh', channel: 'Email + SMS', audience: 'Replacement customers', sent: 1840, conversion: 8.4, status: 'Active' },
        { id: 'CAM-106', name: 'Brooklyn Brownstone Water Guide', channel: 'Email', audience: 'Brooklyn leads', sent: 624, conversion: 5.9, status: 'Scheduled' },
        { id: 'CAM-102', name: 'RO-10 Welcome Series', channel: 'Email', audience: 'New subscribers', sent: 392, conversion: 12.1, status: 'Active' }
      ],
      discounts: [
        { id: 'NYCPURE15', type: '15% off', usage: 84, limit: 250, expires: '2026-09-30', status: 'Active' },
        { id: 'FILTER20', type: '$20 off filters', usage: 47, limit: 150, expires: '2026-10-15', status: 'Active' },
        { id: 'WELCOME10', type: '10% off', usage: 126, limit: 0, expires: '2026-12-31', status: 'Active' }
      ],
      tickets: [
        { id: 'TKT-7041', customer: 'Maya Chen', subject: 'Low pressure after filter change', type: 'Troubleshooting', priority: 'High', updated: '2026-08-23', status: 'Open', channel: 'Email' },
        { id: 'TKT-7038', customer: 'James Wilson', subject: 'Warranty claim for faucet', type: 'Warranty', priority: 'Normal', updated: '2026-08-22', status: 'Waiting on customer', channel: 'Chat' },
        { id: 'TKT-7034', customer: 'Sofia Martinez', subject: 'Return unopened replacement set', type: 'Return', priority: 'Normal', updated: '2026-08-21', status: 'In progress', channel: 'Email' },
        { id: 'TKT-7029', customer: 'Noah Brown', subject: 'VitaShower installation help', type: 'Troubleshooting', priority: 'Low', updated: '2026-08-20', status: 'Resolved', channel: 'Chat' }
      ],
      finance: {
        months: [
          { month: 'Mar', revenue: 18400, cost: 10950, orders: 52 }, { month: 'Apr', revenue: 21300, cost: 12400, orders: 61 },
          { month: 'May', revenue: 19800, cost: 11600, orders: 58 }, { month: 'Jun', revenue: 24900, cost: 13950, orders: 73 },
          { month: 'Jul', revenue: 28700, cost: 15800, orders: 84 }, { month: 'Aug', revenue: 32600, cost: 17400, orders: 96 }
        ],
        areas: [
          { name: 'Brooklyn', revenue: 42600, orders: 118 }, { name: 'Queens', revenue: 36700, orders: 104 }, { name: 'Manhattan', revenue: 31900, orders: 82 },
          { name: 'Bronx', revenue: 17400, orders: 49 }, { name: 'Staten Island', revenue: 7100, orders: 21 }
        ],
        products: [
          { name: 'RO-10 Alkaline', units: 94, revenue: 32899, margin: 48 }, { name: 'Whole Home 3-Stage', units: 41, revenue: 20499, margin: 43 },
          { name: 'RO-5 Classic', units: 72, revenue: 15839, margin: 46 }, { name: 'Replacement Filter Sets', units: 186, revenue: 10972, margin: 55 },
          { name: 'Countertop Luxe', units: 57, revenue: 10259, margin: 44 }
        ]
      },
      content: [
        { id: 'CNT-301', type: 'FAQ', title: 'How often should I replace my filters?', placement: 'Contact / FAQ', updated: '2026-08-18', status: 'Published' },
        { id: 'CNT-298', type: 'Promotion', title: 'Free NYC delivery over $99', placement: 'Announcement bar', updated: '2026-08-15', status: 'Published' },
        { id: 'CNT-294', type: 'Banner', title: 'Find the right filter for your building', placement: 'Shop landing page', updated: '2026-08-12', status: 'Draft' },
        { id: 'CNT-287', type: 'Review', title: 'Maya C. review, RO-10 installation', placement: 'Home testimonials', updated: '2026-08-05', status: 'Needs approval' }
      ],
      roles: [
        { id: 'ROLE-1', role: 'Administrator', members: 1, permissions: 'Full access' },
        { id: 'ROLE-2', role: 'Operations Manager', members: 1, permissions: 'Orders, customers, service, inventory' },
        { id: 'ROLE-3', role: 'Technician', members: 2, permissions: 'Assigned jobs, checklists, photos' },
        { id: 'ROLE-4', role: 'Sales Representative', members: 1, permissions: 'Leads, quotes, customer notes' }
      ],
      siteSettings: {
        companyName: 'Crystalina Water Co.', email: 'info@crystalina.org', phone: '(917) 809-4803', address: 'New York City, NY, USA', hours: 'Monday to Saturday, 8am to 7pm ET',
        navy: '#15375D', primary: '#2A7BC4', accent: '#3DC7F4',
        heroEyebrow: "NYC's Home Water Filtration Company", heroHeading: 'Your Tap Water Travels 125 Miles. The Last 50 Feet Are the Problem.',
        heroBody: "NYC's water is great at the reservoir, but old mains, aging building pipes, and pre-1961 lead solder stand between it and your glass. Crystalina filters are engineered for exactly that.",
        heroImage: '/images/hero-bg.webp', announcement: 'Free shipping on orders over $99, delivered anywhere in the five boroughs'
      }
    };
  }

  /* ---------- generic helpers ---------- */
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  /* ---------- products ---------- */
  const getProducts = () => read(KEYS.products, []);
  const getProduct = id => getProducts().find(p => p.id === id);
  const saveProducts = list => write(KEYS.products, list);

  function upsertProduct(prod) {
    const list = getProducts();
    const i = list.findIndex(p => p.id === prod.id);
    if (i >= 0) list[i] = { ...list[i], ...prod };
    else list.unshift({ rating: '5.0', reviews: 0, ...prod });
    saveProducts(list);
  }
  function deleteProduct(id) { saveProducts(getProducts().filter(p => p.id !== id)); }

  /* ---------- cart ---------- */
  const getCart = () => read(KEYS.cart, []);
  const setCart = c => { write(KEYS.cart, c); document.dispatchEvent(new CustomEvent('cart:changed')); };

  function addToCart(id, qty = 1) {
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (item) item.qty += qty; else cart.push({ id, qty });
    setCart(cart);
  }
  function updateQty(id, qty) {
    let cart = getCart();
    if (qty <= 0) cart = cart.filter(i => i.id !== id);
    else { const it = cart.find(i => i.id === id); if (it) it.qty = qty; }
    setCart(cart);
  }
  const clearCart = () => setCart([]);
  const cartCount = () => getCart().reduce((n, i) => n + i.qty, 0);
  function cartDetails() {
    const items = getCart().map(i => ({ ...i, product: getProduct(i.id) })).filter(i => i.product);
    const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
    return { items, subtotal };
  }

  /* ---------- auth ---------- */
  const getUsers = () => read(KEYS.users, []);
  const currentUser = () => read(KEYS.session, null);

  function signUp(name, email, password) {
    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase()))
      return { ok: false, error: 'An account with this email already exists.' };
    const user = { id: 'u-' + Date.now(), name, email, password, role: 'customer', created: new Date().toISOString() };
    users.push(user); write(KEYS.users, users);
    return signIn(email, password);
  }
  function signIn(email, password) {
    const u = getUsers().find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!u) return { ok: false, error: 'Invalid email or password.' };
    const session = { id: u.id, name: u.name, email: u.email, role: u.role };
    write(KEYS.session, session);
    return { ok: true, user: session };
  }
  function signOut() { localStorage.removeItem(KEYS.session); }

  /* ---------- orders ---------- */
  const getOrders = () => read(KEYS.orders, []);
  function placeOrder(customer) {
    const { items, subtotal } = cartDetails();
    if (!items.length) return null;
    const shipping = subtotal >= 99 ? 0 : 9.99;
    const tax = subtotal * 0.08875; // NYC sales tax
    const order = {
      id: 'CW-' + String(Date.now()).slice(-7),
      date: new Date().toISOString(),
      customer,
      items: items.map(i => ({ id: i.id, name: i.product.name, price: i.product.price, qty: i.qty })),
      subtotal, shipping, tax, total: subtotal + shipping + tax,
      status: 'Processing'
    };
    const orders = getOrders(); orders.unshift(order); write(KEYS.orders, orders);
    // decrement stock
    const products = getProducts();
    items.forEach(i => { const p = products.find(p => p.id === i.id); if (p) p.stock = Math.max(0, p.stock - i.qty); });
    saveProducts(products);
    clearCart();
    return order;
  }
  function updateOrderStatus(id, status) {
    const orders = getOrders();
    const o = orders.find(o => o.id === id);
    if (o) { o.status = status; write(KEYS.orders, orders); }
  }

  /* ---------- admin operations ---------- */
  function getAdminData() {
    return { ...seedAdminData(), ...read(KEYS.adminData, {}) };
  }
  function saveAdminData(data) { write(KEYS.adminData, data); }
  function updateAdminItem(collection, id, changes) {
    const data = getAdminData();
    const item = (data[collection] || []).find(entry => entry.id === id);
    if (item) { Object.assign(item, changes); saveAdminData(data); }
    return item || null;
  }
  function addAdminItem(collection, item) {
    const data = getAdminData();
    data[collection] = data[collection] || [];
    data[collection].unshift(item);
    saveAdminData(data);
    return item;
  }
  const getSiteSettings = () => getAdminData().siteSettings;
  function updateSiteSettings(changes) {
    const data = getAdminData();
    data.siteSettings = { ...data.siteSettings, ...changes };
    saveAdminData(data);
    return data.siteSettings;
  }

  ensureSeed();

  return {
    placeholder,
    getProducts, getProduct, upsertProduct, deleteProduct,
    getCart, addToCart, updateQty, clearCart, cartCount, cartDetails,
    getUsers, currentUser, signUp, signIn, signOut,
    getOrders, placeOrder, updateOrderStatus,
    getAdminData, updateAdminItem, addAdminItem, getSiteSettings, updateSiteSettings
  };
})();
