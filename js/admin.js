/* ============================================================
   Crystalina — Admin Dashboard logic
   ============================================================ */

(() => {
  const user = Store.currentUser();
  if (!user || user.role !== 'admin') { location.href = 'signin.html?mode=admin'; return; }
  document.getElementById('adminWho').textContent = 'Signed in as ' + user.name;

  document.getElementById('adminSignOut').addEventListener('click', () => {
    Store.signOut(); location.href = 'index.html';
  });

  /* ---------- view switching ---------- */
  const views = ['overview', 'products', 'orders', 'customers'];
  document.querySelectorAll('.side-link[data-view]').forEach(btn =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('.side-link[data-view]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      views.forEach(v => document.getElementById('view-' + v).style.display = v === btn.dataset.view ? '' : 'none');
    }));

  /* ---------- overview ---------- */
  function renderOverview() {
    const products = Store.getProducts();
    const orders = Store.getOrders();
    const customers = Store.getUsers().filter(u => u.role === 'customer');
    const revenue = orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + o.total, 0);
    const low = products.filter(p => p.stock <= 15);

    document.getElementById('statCards').innerHTML = `
      <div class="stat-card"><div class="sc-label">Total Revenue</div><div class="sc-value">${money(revenue)}</div><div class="sc-hint">${orders.length} order(s), all time</div></div>
      <div class="stat-card"><div class="sc-label">Orders</div><div class="sc-value">${orders.length}</div><div class="sc-hint">${orders.filter(o => o.status === 'Processing').length} awaiting processing</div></div>
      <div class="stat-card"><div class="sc-label">Products</div><div class="sc-value">${products.length}</div><div class="sc-hint">${low.length} low / out of stock</div></div>
      <div class="stat-card"><div class="sc-label">Customers</div><div class="sc-value">${customers.length}</div><div class="sc-hint">registered accounts</div></div>`;

    document.getElementById('lowStockWrap').innerHTML = low.length
      ? `<table class="admin-table"><thead><tr><th>Product</th><th>Stock</th><th></th></tr></thead><tbody>` +
        low.map(p => `<tr><td>${p.name}</td>
          <td class="${p.stock === 0 ? 'out-stock' : 'low-stock'}">${p.stock === 0 ? 'OUT OF STOCK' : p.stock + ' left'}</td>
          <td><button class="btn btn-sm btn-outline" onclick="AdminUI.editProduct('${p.id}')">Restock</button></td></tr>`).join('') +
        `</tbody></table>`
      : `<p style="color:var(--muted);font-size:.9rem;">All products are well stocked. ✓</p>`;

    document.getElementById('recentOrdersWrap').innerHTML = orders.length
      ? `<table class="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead><tbody>` +
        orders.slice(0, 5).map(o => `<tr><td><strong>${o.id}</strong></td><td>${o.customer.name}</td><td>${money(o.total)}</td>
          <td><span class="status-pill status-${o.status}">${o.status}</span></td></tr>`).join('') + `</tbody></table>`
      : `<p style="color:var(--muted);font-size:.9rem;">No orders yet — they'll appear here as customers check out.</p>`;
  }

  /* ---------- products table ---------- */
  function renderProducts() {
    const tbody = document.querySelector('#productsTable tbody');
    tbody.innerHTML = Store.getProducts().map(p => `
      <tr>
        <td><img src="${p.image}" alt=""></td>
        <td style="max-width:280px;"><strong>${p.name}</strong><br><small style="color:var(--muted)">${p.short || ''}</small></td>
        <td>${p.category}</td>
        <td>${money(p.price)}${p.comparePrice ? `<br><small style="color:var(--muted);text-decoration:line-through">${money(p.comparePrice)}</small>` : ''}</td>
        <td class="${p.stock === 0 ? 'out-stock' : p.stock <= 15 ? 'low-stock' : ''}">${p.stock}</td>
        <td>${p.badge ? `<span class="admin-badge">${p.badge}</span>` : '—'}</td>
        <td><div class="table-actions">
          <button class="btn btn-sm btn-outline" onclick="AdminUI.editProduct('${p.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="AdminUI.removeProduct('${p.id}')">Delete</button>
        </div></td>
      </tr>`).join('');
  }

  /* ---------- orders table ---------- */
  const STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
  function renderOrders() {
    const orders = Store.getOrders();
    document.getElementById('noOrders').style.display = orders.length ? 'none' : 'block';
    document.querySelector('#ordersTable tbody').innerHTML = orders.map(o => `
      <tr>
        <td><strong>${o.id}</strong></td>
        <td>${new Date(o.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}</td>
        <td>${o.customer.name}<br><small style="color:var(--muted)">${o.customer.email}</small></td>
        <td>${o.customer.borough || '—'}${o.customer.installation ? '<br><small style="color:var(--blue-500)">+ installation</small>' : ''}</td>
        <td style="max-width:240px;font-size:.8rem;">${o.items.map(i => `${i.name} × ${i.qty}`).join('<br>')}</td>
        <td><strong>${money(o.total)}</strong></td>
        <td>
          <select onchange="AdminUI.setStatus('${o.id}', this.value)" style="padding:6px 10px;border:1px solid #d7e2f0;border-radius:8px;">
            ${STATUSES.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
      </tr>`).join('');
  }

  /* ---------- customers table ---------- */
  function renderCustomers() {
    const orders = Store.getOrders();
    document.querySelector('#customersTable tbody').innerHTML = Store.getUsers().map(u => `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.role === 'admin' ? '<span class="admin-badge">Admin</span>' : 'Customer'}</td>
        <td>${new Date(u.created).toLocaleDateString('en-US', { dateStyle: 'medium' })}</td>
        <td>${orders.filter(o => o.customer.userId === u.id || o.customer.email.toLowerCase() === u.email.toLowerCase()).length}</td>
      </tr>`).join('');
  }

  /* ---------- product modal (add / edit) ---------- */
  const modal = document.getElementById('productModal');
  const form = document.getElementById('productForm');
  const imgDrop = document.getElementById('imgDrop');
  const imgInput = document.getElementById('imgInput');
  const previewWrap = document.getElementById('imgPreviewWrap');
  let editingId = null;
  let imageData = null;

  function openModal(prod) {
    editingId = prod ? prod.id : null;
    imageData = prod ? prod.image : null;
    document.getElementById('modalTitle').textContent = prod ? 'Edit Product' : 'Add New Product';
    document.getElementById('pName').value = prod ? prod.name : '';
    document.getElementById('pCat').value = prod ? prod.category : 'Reverse Osmosis';
    document.getElementById('pBadge').value = prod && prod.badge ? prod.badge : '';
    document.getElementById('pPrice').value = prod ? prod.price : '';
    document.getElementById('pCompare').value = prod && prod.comparePrice ? prod.comparePrice : '';
    document.getElementById('pStock').value = prod ? prod.stock : '';
    document.getElementById('pShort').value = prod ? prod.short : '';
    document.getElementById('pDesc').value = prod ? prod.description : '';
    document.getElementById('pSpecs').value = prod && prod.specs ? prod.specs.join('\n') : '';
    renderPreview();
    document.getElementById('prodError').classList.remove('show');
    modal.classList.add('open');
  }
  function closeModal() { modal.classList.remove('open'); form.reset(); imageData = null; editingId = null; }

  function renderPreview() {
    previewWrap.innerHTML = imageData
      ? `<img src="${imageData}" alt="preview"><p><small>Click to replace image</small></p>`
      : `<p>📷 Click to upload or drag &amp; drop<br><small>PNG / JPG — stored locally in this draft</small></p>`;
  }

  function readImage(file) {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 2.5 * 1024 * 1024) { toast('Image too large — please keep under 2.5 MB'); return; }
    const r = new FileReader();
    r.onload = () => { imageData = r.result; renderPreview(); };
    r.readAsDataURL(file);
  }

  imgDrop.addEventListener('click', () => imgInput.click());
  imgInput.addEventListener('change', () => readImage(imgInput.files[0]));
  imgDrop.addEventListener('dragover', e => { e.preventDefault(); imgDrop.classList.add('drag'); });
  imgDrop.addEventListener('dragleave', () => imgDrop.classList.remove('drag'));
  imgDrop.addEventListener('drop', e => { e.preventDefault(); imgDrop.classList.remove('drag'); readImage(e.dataTransfer.files[0]); });

  document.getElementById('addProductBtn').addEventListener('click', () => openModal(null));
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('pName').value.trim();
    const price = parseFloat(document.getElementById('pPrice').value);
    const stock = parseInt(document.getElementById('pStock').value, 10);
    const compare = parseFloat(document.getElementById('pCompare').value) || null;
    const err = document.getElementById('prodError');
    if (compare && compare <= price) {
      err.textContent = 'Compare-at price should be higher than the sale price.';
      err.classList.add('show'); return;
    }
    const id = editingId || ('p-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36));
    Store.upsertProduct({
      id, name,
      category: document.getElementById('pCat').value,
      badge: document.getElementById('pBadge').value || null,
      price, comparePrice: compare, stock,
      short: document.getElementById('pShort').value.trim(),
      description: document.getElementById('pDesc').value.trim(),
      specs: document.getElementById('pSpecs').value.split('\n').map(s => s.trim()).filter(Boolean),
      image: imageData || Store.placeholder(name, Math.floor(Math.random() * 5))
    });
    closeModal();
    renderAll();
    toast(editingId ? 'Product updated ✓' : 'Product added ✓');
  });

  /* ---------- exposed handlers ---------- */
  window.AdminUI = {
    editProduct(id) {
      // jump to products view and open the modal
      document.querySelector('.side-link[data-view="products"]').click();
      openModal(Store.getProduct(id));
    },
    removeProduct(id) {
      const p = Store.getProduct(id);
      if (p && confirm(`Delete "${p.name}"? This cannot be undone.`)) {
        Store.deleteProduct(id);
        renderAll();
        toast('Product deleted');
      }
    },
    setStatus(id, status) {
      Store.updateOrderStatus(id, status);
      renderAll();
      toast(`Order ${id} → ${status}`);
    }
  };

  function renderAll() { renderOverview(); renderProducts(); renderOrders(); renderCustomers(); }
  renderAll();
})();
