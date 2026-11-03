/* ============================================================
   Crystalina, Supabase-backed storefront data.

   Products, inventory and pricing are authoritative in Supabase.
   The bundled catalog file supplies relational metadata that the base
   products table does not carry (product kind, filter compatibility,
   bundle composition) and acts as an offline fallback.

   Reads use the publishable key under RLS. Every write that affects
   money or inventory goes through /api, which holds the service-role key.
   ============================================================ */
window.CrystalinaData = (() => {
  const SB = window.CrystalinaSupabase;
  const centsToDollars = cents => (typeof cents === 'number' ? cents / 100 : null);

  function localById() {
    const catalog = window.CrystalinaProductCatalog || { products: [] };
    return new Map(catalog.products.map(product => [product.id, product]));
  }

  /* Map a Supabase products row onto the shape the storefront renders. */
  function mapRow(row, local) {
    const extra = local || {};
    return {
      ...extra,
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.category,
      price: centsToDollars(row.price_cents),
      comparePrice: centsToDollars(row.compare_price_cents),
      stock: row.stock_quantity,
      published: row.published,
      badge: row.badge ?? extra.badge ?? null,
      short: row.short_description || extra.short || '',
      description: row.description || extra.description || '',
      specs: Array.isArray(row.specs) && row.specs.length ? row.specs : (extra.specs || []),
      installationMinutes: row.installation_minutes ?? extra.installationMinutes ?? 30,
      // Classification and merchandising now come from the database, so a
      // product created there sorts and behaves correctly without a code change.
      productKind: row.product_kind ?? extra.productKind ?? 'system',
      sku: row.sku ?? extra.sku ?? '',
      modelCode: row.model_code ?? extra.modelCode ?? '',
      displayOrder: row.display_order ?? extra.displayOrder ?? 100,
      priceIsPlaceholder: row.price_is_placeholder ?? extra.priceIsPlaceholder ?? false,
      availableAsUpgrade: row.available_as_upgrade === true,
      defaultFaucetId: row.default_faucet_id ?? null,
      // Buyable configurations, cheapest build first.
      stageOptions: (row.product_stage_options || [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order || a.stage_count - b.stage_count)
        .map(option => ({
          id: option.id,
          stageCount: option.stage_count,
          price: centsToDollars(option.price_cents),
          label: option.label || (option.stage_count + '-stage'),
          description: option.description || '',
          isDefault: option.is_default === true
        })),
      // Prefer the richer editorial artwork shipped with the catalog.
      image: extra.image || row.image_path,
      rating: extra.rating ?? '0.0',
      reviews: extra.reviews ?? 0
    };
  }

  let productsPromise = null;

  /* Published catalog. Falls back to the bundled catalog when offline. */
  function loadProducts({ force = false } = {}) {
    if (force) productsPromise = null;
    if (!productsPromise) {
      productsPromise = SB.restGet('products?select=*,product_stage_options(*)&published=eq.true&order=display_order.asc,name.asc')
        .then(rows => {
          const local = localById();
          const mapped = rows.map(row => mapRow(row, local.get(row.id)));
          return { source: 'supabase', products: mapped };
        })
        .catch(error => {
          console.warn('[Crystalina] Supabase catalog unavailable, using bundled catalog.', error);
          const catalog = window.CrystalinaProductCatalog || { products: [] };
          return { source: 'local', products: catalog.products.map(product => ({ ...product })) };
        });
    }
    return productsPromise;
  }

  /* Orders belonging to the signed-in customer. RLS scopes this to them. */
  async function myOrders() {
    const supabase = await SB.client();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, status, payment_status, subtotal_cents, shipping_cents, tax_cents, total_cents, installation_requested, created_at, order_items(quantity, unit_price_cents, product_name_snapshot)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(order => ({
      id: `CW-${order.order_number}`,
      dbId: order.id,
      date: order.created_at,
      status: order.status,
      paymentStatus: order.payment_status,
      subtotal: centsToDollars(order.subtotal_cents),
      shipping: centsToDollars(order.shipping_cents),
      tax: centsToDollars(order.tax_cents),
      total: centsToDollars(order.total_cents),
      installation: order.installation_requested,
      items: (order.order_items || []).map(item => ({
        name: item.product_name_snapshot, qty: item.quantity, price: centsToDollars(item.unit_price_cents)
      }))
    }));
  }

  /* One order of the signed-in customer, by its id, with the address it is
     going to. RLS returns nothing for an order that is not theirs. */
  async function myOrder(id) {
    const supabase = await SB.client();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !id) return null;
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, status, payment_status, subtotal_cents, shipping_cents, tax_cents, total_cents, installation_requested, shipping_address, created_at, order_items(quantity, unit_price_cents, product_name_snapshot)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: `CW-${data.order_number}`,
      dbId: data.id,
      date: data.created_at,
      status: data.status,
      paymentStatus: data.payment_status,
      subtotal: centsToDollars(data.subtotal_cents),
      shipping: centsToDollars(data.shipping_cents),
      tax: centsToDollars(data.tax_cents),
      total: centsToDollars(data.total_cents),
      installation: data.installation_requested,
      address: data.shipping_address,
      items: (data.order_items || []).map(item => ({
        name: item.product_name_snapshot, qty: item.quantity, price: centsToDollars(item.unit_price_cents)
      }))
    };
  }

  /* Order creation is server-authoritative: /api recomputes every total
     from database prices and decrements stock in one transaction. */
  async function createOrder({ items, shippingAddress, installationRequested, turnstileToken }) {
    const supabase = await SB.client();
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {})
      },
      body: JSON.stringify({
        items: items.map(item => ({
          productId: item.id, quantity: item.qty,
          ...(item.stageOptionId ? { stageOptionId: item.stageOptionId } : {}),
          ...(item.faucetId ? { faucetId: item.faucetId } : {})
        })),
        shippingAddress, installationRequested, turnstileToken
      })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || 'We could not place that order. Please try again.');
    return body.order;
  }

  /* ---------------------------------------------------------------
     The life of an order after it is paid.

     The dashboard's status dropdown used to write to localStorage, so a
     manager marked an order shipped and only that browser ever knew.
     These three go to the database instead.

     Which moves are legal is a table, order_transitions, read with the
     publishable key. The dropdown is built from the same rows the
     database enforces, so the two cannot drift apart.
     --------------------------------------------------------------- */

  /* Move an order, and let the customer know where the transition says to.
     /api checks the role inside advance_order, as the signed-in person. */
  async function setOrderStatus({ orderId, status, note, trackingNumber }) {
    const supabase = await SB.client();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { ok: false, error: 'Sign in as staff to manage orders.' };
    let body = {};
    try {
      const res = await fetch('/api/orders/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ orderId, status, note, trackingNumber })
      });
      body = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: body.error || 'We could not change that order. Please try again.' };
    } catch {
      return { ok: false, error: 'We could not reach the server. Check the connection and try again.' };
    }
    return { ok: true, order: body.order, notified: body.notified === true };
  }

  /* Where an order may go from where it is now. Returns a Map from status
     to the statuses reachable from it. */
  async function orderTransitions() {
    const rows = await SB.restGet('order_transitions?select=from_status,to_status,notifies');
    const map = new Map();
    for (const row of rows || []) {
      if (!map.has(row.from_status)) map.set(row.from_status, []);
      map.get(row.from_status).push(row.to_status);
    }
    return map;
  }

  /* The trail. Readable by the customer for their own order, which is what
     a timeline on the order page is made of, and by staff for any order. */
  async function orderHistory(orderId) {
    if (!orderId) return [];
    const supabase = await SB.client();
    const { data, error } = await supabase
      .from('order_events')
      .select('from_status, to_status, note, created_at')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(row => ({
      from: row.from_status, to: row.to_status, note: row.note, at: row.created_at
    }));
  }

  /* ---------------------------------------------------------------
     Site content. Everything the admin edits in "Content & Website"
     lives in the site_content table so real visitors see it. Public
     read is open; only admin and manager roles may write.
     --------------------------------------------------------------- */
  const CONTENT_KEYS = ['pageSections', 'siteSettings'];

  /* The free delivery threshold and the fee below it, from the one row of
     shipping_policy. Dollars, because that is what the storefront shows;
     the database keeps cents. Null when the read fails, so the caller
     keeps its cached figure. */
  async function loadShippingPolicy() {
    try {
      const rows = await SB.restGet('shipping_policy?select=threshold_cents,fee_cents&limit=1');
      const row = Array.isArray(rows) ? rows[0] : null;
      if (!row || typeof row.threshold_cents !== 'number' || typeof row.fee_cents !== 'number') return null;
      return { threshold: row.threshold_cents / 100, fee: row.fee_cents / 100 };
    } catch (error) {
      console.warn('[Crystalina] Shipping policy unavailable; using the cached figure.', error);
      return null;
    }
  }

  async function loadSiteContent() {
    try {
      const rows = await SB.restGet('site_content?select=key,value');
      const out = {};
      (rows || []).forEach(row => { out[row.key] = row.value; });
      return out;
    } catch (error) {
      console.warn('[Crystalina] Site content unavailable; using local copy.', error);
      return null;
    }
  }

  /* Upsert one content block. Returns false when the signed-in user is not
     allowed to publish, so the caller can explain rather than fail silently. */
  async function saveSiteContent(key, value) {
    if (!CONTENT_KEYS.includes(key)) throw new Error('Unknown content key: ' + key);
    const supabase = await SB.client();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { ok: false, error: 'Sign in as an administrator to publish changes.' };
    const { error } = await supabase
      .from('site_content')
      .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: session.user.id },
              { onConflict: 'key' });
    if (error) {
      return { ok: false, error: /row-level security/i.test(error.message)
        ? 'Your account does not have permission to publish website changes.'
        : error.message };
    }
    return { ok: true };
  }

  /* ---------------------------------------------------------------
     Media uploads. Files go to the public site-media bucket and we keep
     only the resulting URL, so images reach real visitors and never sit
     in localStorage as multi-megabyte data URLs.
     --------------------------------------------------------------- */
  const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/svg+xml'];

  async function uploadImage(file, { folder = 'content' } = {}) {
    if (!file) return { ok: false, error: 'No file selected.' };
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { ok: false, error: 'Use a PNG, JPG, WebP, AVIF or SVG image.' };
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return { ok: false, error: 'That image is over 5 MB. Please compress it first.' };
    }

    const supabase = await SB.client();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { ok: false, error: 'Sign in as staff to upload images.' };

    // Keep a readable, collision-free name.
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, '');
    const path = `${folder}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage.from('site-media')
      .upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type });
    if (error) {
      if (/bucket not found|NoSuchBucket/i.test(error.message)) {
        return { ok: false, error: 'Image storage is not set up yet. Apply the site-media storage migration in Supabase, then try again.' };
      }
      return { ok: false, error: /row-level security|not authorized/i.test(error.message)
        ? 'Your account does not have permission to upload images.'
        : error.message };
    }
    const { data } = supabase.storage.from('site-media').getPublicUrl(path);
    return { ok: true, url: data.publicUrl, path };
  }

  /* ---------------------------------------------------------------
     Catalog writes. These call staff-gated database functions, so the
     permission check lives on the server and the browser never holds a
     privileged key. Everything the editor captures beyond the core
     commerce columns travels in details.
     --------------------------------------------------------------- */
  const CORE_FIELDS = new Set([
    'id', 'slug', 'name', 'category', 'price', 'comparePrice', 'stock', 'published',
    'image', 'short', 'description', 'specs', 'badge', 'installationMinutes',
    'sku', 'modelCode', 'productKind', 'displayOrder', 'availableAsUpgrade',
    'defaultFaucetId', 'details', 'stageOptions', 'rating', 'reviews'
  ]);

  function splitDetails(product) {
    const details = {};
    Object.keys(product).forEach(key => {
      if (!CORE_FIELDS.has(key)) details[key] = product[key];
    });
    return { ...product, details };
  }

  async function rpc(fn, args) {
    const supabase = await SB.client();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { ok: false, error: 'Sign in as staff to make catalog changes.' };
    const { data, error } = await supabase.rpc(fn, args);
    if (error) {
      const denied = /row-level security|42501/i.test(error.message);
      return { ok: false, error: denied
        ? 'Your account does not have permission to change the catalog.'
        : error.message };
    }
    return { ok: true, data };
  }

  const saveProduct = product => rpc('upsert_product', { p_product: splitDetails(product) });
  const removeProduct = id => rpc('delete_product', { p_id: id });
  const saveStageOption = option => rpc('upsert_stage_option', { p_option: option });
  const removeStageOption = id => rpc('delete_stage_option', { p_id: id });

  return { loadProducts, myOrders, myOrder, createOrder, mapRow, loadShippingPolicy, loadSiteContent, saveSiteContent, uploadImage,
           setOrderStatus, orderTransitions, orderHistory,
           saveProduct, removeProduct, saveStageOption, removeStageOption };
})();
