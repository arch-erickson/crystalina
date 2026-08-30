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
      productsPromise = SB.restGet('products?select=*&published=eq.true&order=category,name')
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

  return { loadProducts, myOrders, createOrder, mapRow };
})();
