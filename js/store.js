/* ============================================================
   Crystalina, temporary local state during the Supabase migration
   Operational records are deliberately empty. Browser storage is only
   used for a shopper's cart until the Supabase data layer is connected.
   ============================================================ */

const Store = (() => {
  const KEYS = {
    products: 'crystalina_products', cart: 'crystalina_cart', users: 'crystalina_users',
    session: 'crystalina_session', staffSession: 'crystalina_staff_session',
    staffChallenge: 'crystalina_staff_challenge', orders: 'crystalina_orders',
    adminData: 'crystalina_admin_data', dataVersion: 'crystalina_data_version',
    catalogSeedCount: 'crystalina_catalog_seed_count'
  };
  const DATA_VERSION = 'manufacturer-catalog-v3';
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const catalog = () => window.CrystalinaProductCatalog || { products: [], compatibilities: [], bundleItems: [] };
  const catalogProducts = () => catalog().products.map(product => ({ ...product }));

  function placeholder(label, variant = 0) {
    const palettes = [['#0B2A5B', '#1E7BE0'], ['#123C7A', '#3FA9F5'], ['#0E3163', '#2196F3']];
    const [start, end] = palettes[variant % palettes.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${start}"/><stop offset="1" stop-color="${end}"/></linearGradient></defs><rect width="640" height="480" fill="url(#g)"/><path d="M320 120S250 220 250 280a70 70 0 0 0 140 0c0-60-70-160-70-160Z" fill="#fff" opacity=".9"/><text x="320" y="420" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#fff">${label}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function siteSettings() {
    return {
      companyName: 'Crystalina Water Co.', email: 'info@crystalina.org', phone: '(917) 809-4803',
      address: 'New York City, NY, USA', hours: 'Monday to Saturday, 8am to 7pm ET',
      navy: '#15375D', primary: '#2A7BC4', accent: '#3DC7F4',
      heroEyebrow: "NYC's Home Water Filtration Company",
      heroHeading: 'Your Tap Water Travels 125 Miles. The Last 50 Feet Are the Problem.',
      heroBody: "NYC's water is great at the reservoir, but old mains, aging building pipes, and pre-1961 lead solder stand between it and your glass. Crystalina filters are engineered for exactly that.",
      heroImage: '/images/hero-bg.webp', announcement: 'Free shipping on orders over $99, delivered anywhere in the five boroughs'
    };
  }

  function emptyAdminData() {
    return {
      subscriptions: [], customers: [], notifications: [], jobs: [], staff: [], staffSchedules: [],
      shiftAssignments: [], shiftChangeRequests: [], staffAvailability: [], staffTimeOffRequests: [],
      staffNotifications: [], timeEntries: [], timesheetSubmissions: [], schedulePublishBatches: [],
      suppliers: [], supplierProfiles: [], activityLog: [],
      leads: [], campaigns: [], discounts: [], abandonedCarts: [], outreach: [], qrCodes: [], tickets: [],
      content: [], pageSections: [], roles: [], finance: { months: [], areas: [], products: [] }, siteSettings: siteSettings()
    };
  }

  function syncManufacturerCatalog() {
    const seededProducts = catalogProducts();
    const storedVersion = localStorage.getItem(KEYS.dataVersion);
    const recordedSeedCount = Number(localStorage.getItem(KEYS.catalogSeedCount) || 0);
    const storedProducts = read(KEYS.products, []);
    const needsVersionUpgrade = storedVersion !== DATA_VERSION;
    const needsFailedSeedRepair = storedVersion === DATA_VERSION && storedProducts.length === 0 && recordedSeedCount === 0 && seededProducts.length > 0;
    if (!needsVersionUpgrade && !needsFailedSeedRepair) return;

    write(KEYS.products, seededProducts);
    localStorage.setItem(KEYS.dataVersion, DATA_VERSION);
    localStorage.setItem(KEYS.catalogSeedCount, String(seededProducts.length));
  }

  const getProducts = () => read(KEYS.products, catalogProducts());
  const getProduct = id => getProducts().find(product => product.id === id);
  const getBundlesForSystem = systemId => getProducts().filter(product => product.productKind === 'filter_bundle' && (product.compatibleSystemIds || []).includes(systemId));
  const getBundleComponents = bundleId => catalog().bundleItems
    .filter(item => item.bundleId === bundleId)
    .map(item => ({ ...item, product: getProduct(item.componentId) }))
    .filter(item => item.product);
  const getCompatibleFilters = systemId => catalog().compatibilities
    .filter(item => item.systemId === systemId)
    .map(item => ({ ...item, product: getProduct(item.replacementId) }))
    .filter(item => item.product);
  const saveProducts = products => write(KEYS.products, products);
  function upsertProduct(product) {
    const products = getProducts(); const index = products.findIndex(item => item.id === product.id);
    if (index >= 0) products[index] = { ...products[index], ...product };
    else products.unshift({ rating: '0.0', reviews: 0, ...product });
    saveProducts(products);
  }
  const deleteProduct = id => saveProducts(getProducts().filter(product => product.id !== id));
  const deleteAllProducts = () => saveProducts([]);

  const getCart = () => read(KEYS.cart, []);
  function setCart(cart) { write(KEYS.cart, cart); document.dispatchEvent(new CustomEvent('cart:changed')); }
  function addToCart(id, qty = 1) {
    if (!getProduct(id)) return;
    const cart = getCart(); const item = cart.find(entry => entry.id === id);
    if (item) item.qty += qty; else cart.push({ id, qty });
    setCart(cart);
  }
  function updateQty(id, qty) {
    const cart = getCart(); const item = cart.find(entry => entry.id === id);
    if (!item) return;
    if (qty <= 0) setCart(cart.filter(entry => entry.id !== id)); else { item.qty = qty; setCart(cart); }
  }
  const clearCart = () => setCart([]);
  const cartCount = () => getCart().reduce((count, item) => count + item.qty, 0);
  function cartDetails() {
    const items = getCart().map(item => ({ ...item, product: getProduct(item.id) })).filter(item => item.product);
    return { items, subtotal: items.reduce((sum, item) => sum + item.product.price * item.qty, 0) };
  }

  const getUsers = () => read(KEYS.users, []);
  const currentUser = () => read(KEYS.session, null);
  const setCurrentUser = user => write(KEYS.session, user);
  const currentStaff = () => read(KEYS.staffSession, null);
  const unavailableAuth = () => ({ ok: false, error: 'Secure sign-in is being configured. Please check back shortly.' });
  const signUp = unavailableAuth;
  const signIn = unavailableAuth;
  const signOut = () => localStorage.removeItem(KEYS.session);
  const requestStaffCode = () => ({ ok: false, error: 'Staff sign-in is being configured securely.' });
  const verifyStaffCode = () => ({ ok: false, error: 'Staff sign-in is being configured securely.' });
  const staffSignOut = () => localStorage.removeItem(KEYS.staffSession);

  const getOrders = () => read(KEYS.orders, []);
  const placeOrder = () => null;
  function updateOrderStatus(id, status) {
    const orders = getOrders(); const order = orders.find(item => item.id === id);
    if (order) { order.status = status; write(KEYS.orders, orders); }
  }
  const deleteOrder = id => write(KEYS.orders, getOrders().filter(order => order.id !== id));

  function getAdminData() {
    const saved = read(KEYS.adminData, {}); const defaults = emptyAdminData();
    return { ...defaults, ...saved, finance: { ...defaults.finance, ...(saved.finance || {}) }, siteSettings: { ...siteSettings(), ...(saved.siteSettings || {}) } };
  }
  const saveAdminData = data => write(KEYS.adminData, data);
  function updateAdminItem(collection, id, changes) {
    const data = getAdminData(); const item = (data[collection] || []).find(entry => entry.id === id);
    if (item) { Object.assign(item, changes); saveAdminData(data); }
    return item || null;
  }
  function addAdminItem(collection, item) {
    const data = getAdminData(); data[collection] = data[collection] || []; data[collection].unshift(item); saveAdminData(data); return item;
  }
  function deleteAdminItem(collection, id) {
    const data = getAdminData(); data[collection] = (data[collection] || []).filter(item => item.id !== id); saveAdminData(data);
  }
  function saveAdminCollection(collection, items) { const data = getAdminData(); data[collection] = items; saveAdminData(data); return items; }
  const addNotification = notification => addAdminItem('notifications', { id: `NOT-${Date.now()}`, sent: new Date().toISOString(), read: false, ...notification });
  const addStaffNotification = notification => addAdminItem('staffNotifications', { id: `SNOT-${Date.now()}`, sent: new Date().toISOString(), read: false, ...notification });
  const getStaffNotifications = staffId => getAdminData().staffNotifications.filter(item => item.staffId === staffId);
  function markStaffNotificationsRead(staffId) {
    const data = getAdminData(); data.staffNotifications.forEach(item => { if (item.staffId === staffId) item.read = true; }); saveAdminData(data);
  }
  function markStaffNotificationRead(staffId, notificationId) {
    const data = getAdminData();
    const item = data.staffNotifications.find(entry => entry.id === notificationId && entry.staffId === staffId);
    if (item) { item.read = true; item.readAt = new Date().toISOString(); saveAdminData(data); }
    return item || null;
  }
  const logActivity = (actorId, action, entity) => addAdminItem('activityLog', { id: `ACT-${Date.now()}`, actorId, action, entity, timestamp: new Date().toISOString() });
  function getNotificationsForUser(user) {
    if (!user) return [];
    const data = getAdminData(); const customer = data.customers.find(item => item.id === user.id || item.email?.toLowerCase() === user.email?.toLowerCase());
    return customer ? data.notifications.filter(item => item.customerId === customer.id || item.customerId === 'all') : [];
  }
  function markNotificationsRead(user) {
    if (!user) return;
    const data = getAdminData(); const customer = data.customers.find(item => item.id === user.id || item.email?.toLowerCase() === user.email?.toLowerCase());
    if (!customer) return;
    data.notifications.forEach(item => { if (item.customerId === customer.id || item.customerId === 'all') item.read = true; }); saveAdminData(data);
  }
  const getSiteSettings = () => getAdminData().siteSettings;
  function updateSiteSettings(changes) { const data = getAdminData(); data.siteSettings = { ...data.siteSettings, ...changes }; saveAdminData(data); return data.siteSettings; }

  syncManufacturerCatalog();
  return {
    placeholder, getProducts, getProduct, getBundlesForSystem, getBundleComponents, getCompatibleFilters,
    upsertProduct, deleteProduct, deleteAllProducts,
    getCart, addToCart, updateQty, clearCart, cartCount, cartDetails,
    getUsers, currentUser, setCurrentUser, signUp, signIn, signOut, currentStaff, requestStaffCode, verifyStaffCode, staffSignOut,
    getOrders, placeOrder, updateOrderStatus, deleteOrder, getAdminData, updateAdminItem, addAdminItem, deleteAdminItem,
    saveAdminCollection, addNotification, getNotificationsForUser, markNotificationsRead, addStaffNotification,
    getStaffNotifications, markStaffNotificationsRead, markStaffNotificationRead, logActivity, getSiteSettings, updateSiteSettings
  };
})();
