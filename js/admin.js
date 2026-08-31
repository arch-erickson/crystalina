/* ============================================================
   Crystalina, Admin Dashboard logic
   ============================================================ */

(() => {
  const localPreview = ['127.0.0.1', 'localhost'].includes(location.hostname) && new URLSearchParams(location.search).has('qa');
  const user = Store.currentUser() || (localPreview ? { id: 'local-design-qa', name: 'Design QA', roles: ['admin'] } : null);
  if (!user || !user.roles?.includes('admin')) { location.href = '/signin/?mode=staff'; return; }
  document.getElementById('adminWho').textContent = 'Signed in as ' + user.name;

  document.getElementById('adminSignOut').addEventListener('click', async () => {
    try { const auth = await window.CrystalinaAuth; await auth.signOut(); }
    finally { Store.signOut(); Store.staffSignOut(); location.href = '/signin/?mode=staff'; }
  });

  /* ---------- view switching ---------- */
  const views = ['overview', 'products', 'orders', 'customers', 'subscriptions', 'service', 'staff', 'suppliers', 'leads', 'marketing', 'qrcodes', 'support', 'content', 'finance', 'settings'];
  function showView(view, updateHash = true) {
    if (!views.includes(view)) view = 'overview';
    document.querySelectorAll('.side-link[data-view]').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
    views.forEach(v => document.getElementById('view-' + v).style.display = v === view ? '' : 'none');
    if (updateHash) history.replaceState(null, '', '#' + view);
    if (view === 'qrcodes') window.QRAdminUI?.render();
    if (view === 'staff') window.AdminScheduleUI?.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  document.querySelectorAll('.side-link[data-view]').forEach(btn => btn.addEventListener('click', () => showView(btn.dataset.view)));
  document.querySelectorAll('[data-view-jump]').forEach(btn => btn.addEventListener('click', () => showView(btn.dataset.viewJump)));
  showView(location.hash.slice(1) || 'overview', false);

  const customerButton = (name, email = '') => `<button class="entity-link" onclick="AdminUI.openCustomerByName('${encodeURIComponent(name)}')">${escapeHTML(name)}</button>${email ? `<br><small>${escapeHTML(email)}</small>` : ''}`;
  const initials = name => name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();

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
        orders.slice(0, 5).map(o => `<tr><td><strong>${o.id}</strong></td><td>${customerButton(o.customer.name, o.customer.email)}</td><td>${money(o.total)}</td>
          <td><span class="status-pill status-${o.status}">${o.status}</span></td></tr>`).join('') + `</tbody></table>`
      : `<p style="color:var(--muted);font-size:.9rem;">No orders yet, they'll appear here as customers check out.</p>`;
  }

  /* ---------- products table ---------- */
  let productFilters = { search: '', category: '', stock: '' };
  function renderProducts() {
    const tbody = document.querySelector('#productsTable tbody');
    const products = Store.getProducts().filter(product => (!productFilters.search || `${product.name} ${product.short}`.toLowerCase().includes(productFilters.search)) && (!productFilters.category || product.category === productFilters.category) && (!productFilters.stock || productFilters.stock === 'low' && product.stock > 0 && product.stock <= 15 || productFilters.stock === 'out' && product.stock === 0 || productFilters.stock === 'available' && product.stock > 15));
    tbody.innerHTML = products.map(p => `
      <tr>
        <td><img src="${p.image}" alt=""></td>
        <td style="max-width:280px;"><strong>${p.name}</strong><br><small style="color:var(--muted)">${p.short || ''}</small></td>
        <td>${p.category}</td>
        <td>${money(p.price)}${p.comparePrice ? `<br><small style="color:var(--muted);text-decoration:line-through">${money(p.comparePrice)}</small>` : ''}</td>
        <td class="${p.stock === 0 ? 'out-stock' : p.stock <= 15 ? 'low-stock' : ''}">${p.stock}</td>
        <td>${p.installationMinutes || 30} min</td>
        <td>${p.badge ? `<span class="admin-badge">${p.badge}</span>` : ', '}</td>
        <td><div class="table-actions">
          <button class="btn btn-sm btn-outline" onclick="AdminUI.editProduct('${p.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="AdminUI.removeProduct('${p.id}')">Delete</button>
        </div></td>
      </tr>`).join('') || '<tr><td colspan="8">No products match these filters.</td></tr>';
  }

  /* ---------- orders table ---------- */
  const STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
  let orderFilters = { search: '', date: '', status: '' };
  function renderOrders() {
    const allOrders = Store.getOrders();
    const orders = allOrders.filter(order => (!orderFilters.search || `${order.id} ${order.customer.name} ${order.customer.email}`.toLowerCase().includes(orderFilters.search)) && (!orderFilters.date || order.date.slice(0, 10) === orderFilters.date) && (!orderFilters.status || order.status === orderFilters.status));
    document.getElementById('noOrders').style.display = allOrders.length ? 'none' : 'block';
    document.querySelector('#ordersTable tbody').innerHTML = orders.map(o => `
      <tr>
        <td><strong>${o.id}</strong></td>
        <td>${new Date(o.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}</td>
        <td>${customerButton(o.customer.name, o.customer.email)}</td>
        <td>${o.customer.borough || ', '}${o.customer.installation ? '<br><small style="color:var(--blue-500)">+ installation</small>' : ''}</td>
        <td style="max-width:240px;font-size:.8rem;">${o.items.map(i => `${i.name} × ${i.qty}`).join('<br>')}</td>
        <td><strong>${money(o.total)}</strong></td>
        <td>
          <select onchange="AdminUI.setStatus('${o.id}', this.value)" style="padding:6px 10px;border:1px solid #d7e2f0;border-radius:8px;">
            ${STATUSES.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td><td><button class="btn btn-sm btn-danger" onclick="AdminUI.deleteOrder('${o.id}')">Delete</button></td>
      </tr>`).join('') || (allOrders.length ? '<tr><td colspan="8">No orders match these filters.</td></tr>' : '');
  }

  /* ---------- customers table ---------- */
  let customerFilters = { search: '', from: '', to: '' };
  function renderCustomers() {
    const data = Store.getAdminData();
    const customers = data.customers.filter(customer => {
      const haystack = `${customer.name} ${customer.email}`.toLowerCase();
      return (!customerFilters.search || haystack.includes(customerFilters.search)) && (!customerFilters.from || customer.joined >= customerFilters.from) && (!customerFilters.to || customer.joined <= customerFilters.to);
    });
    document.querySelector('#customersTable tbody').innerHTML = customers.map(customer => {
      const openTickets = data.tickets.filter(ticket => ticket.customer === customer.name && ticket.status !== 'Resolved').length;
      return `<tr><td>${customerButton(customer.name, customer.email)}<br><small>${escapeHTML(customer.address)}</small></td><td>${escapeHTML(customer.phone)}</td><td>${formatDate(customer.joined)}</td><td>${customer.products.length}</td><td>${openTickets}</td><td><div class="table-actions"><button class="btn btn-sm btn-outline" onclick="AdminUI.openCustomerProfile('${customer.id}')">View Profile</button><button class="btn btn-sm btn-ghost" onclick="AdminUI.editRecord('customer','${customer.id}')">Edit</button></div></td></tr>`;
    }).join('') || '<tr><td colspan="6">No customers match these filters.</td></tr>';
  }

  function findCustomerByName(name) {
    const data = Store.getAdminData();
    const customer = data.customers.find(item => item.name.toLowerCase() === name.toLowerCase());
    if (customer) return customer;
    const lead = data.leads.find(item => item.name.toLowerCase() === name.toLowerCase());
    return lead ? { id: lead.id, name: lead.name, email: lead.email, phone: 'Not provided', joined: lead.followUp, address: `${lead.borough}, NY`, source: lead.source, assignedSalesId: '', products: [], cart: [], installed: [], notes: `Lead interested in ${lead.interest}.` } : null;
  }

  const profileModal = document.getElementById('profileModal');
  function openCustomerProfile(customer) {
    if (!customer) return;
    const data = Store.getAdminData();
    const orders = Store.getOrders().filter(order => order.customer.email?.toLowerCase() === customer.email.toLowerCase() || order.customer.name === customer.name);
    const jobs = data.jobs.filter(job => job.customer === customer.name);
    const tickets = data.tickets.filter(ticket => ticket.customer === customer.name);
    const subscriptions = data.subscriptions.filter(subscription => subscription.customer === customer.name);
    const messages = data.notifications.filter(notification => notification.customerId === customer.id);
    const photos = jobs.flatMap(job => [{ label: `${job.id} pre-job`, src: job.beforePhoto }, { label: `${job.id} finished job`, src: job.afterPhoto }]);
    document.getElementById('profileContent').innerHTML = `<div class="profile-head"><div class="profile-avatar">${initials(customer.name)}</div><div><h2>${escapeHTML(customer.name)}</h2><p>${escapeHTML(customer.id)} · Customer since ${formatDate(customer.joined)}</p></div><div class="profile-actions"><button class="btn btn-sm btn-primary" onclick="AdminUI.composeMessage('${customer.id}')">Send Message</button>${customer.id.startsWith('CUS-') ? `<button class="btn btn-sm btn-outline" onclick="AdminUI.editRecord('customer','${customer.id}')">Edit</button><button class="btn btn-sm btn-danger" onclick="AdminUI.deleteRecord('customers','${customer.id}','${encodeURIComponent(customer.name)}')">Delete</button>` : ''}</div></div>
      <div class="profile-grid">
        <section class="profile-section"><h3>Contact &amp; Account</h3><ul class="profile-list"><li>Email <strong>${escapeHTML(customer.email)}</strong></li><li>Phone <strong>${escapeHTML(customer.phone)}</strong></li><li>Address <strong>${escapeHTML(customer.address)}</strong></li><li>Source <strong>${escapeHTML(customer.source)}</strong></li><li>Sales ID <strong>${escapeHTML(customer.assignedSalesId || 'Unassigned')}</strong></li></ul></section>
        <section class="profile-section"><h3>Products &amp; Current Cart</h3><ul class="profile-list"><li>Products bought <strong>${customer.products.length ? customer.products.map(escapeHTML).join('<br>') : 'None yet'}</strong></li><li>Cart items <strong>${customer.cart.length ? customer.cart.map(escapeHTML).join('<br>') : 'Cart is empty'}</strong></li><li>Orders <strong>${orders.length}</strong></li><li>Subscriptions <strong>${subscriptions.length ? subscriptions.map(item => `${escapeHTML(item.system)} (${escapeHTML(item.status)})`).join('<br>') : 'None'}</strong></li></ul></section>
        <section class="profile-section full"><h3>Installation &amp; Service Photos</h3><div class="profile-photo-grid">${photos.length ? photos.map(photo => `<div class="profile-photo">${photo.src ? `<img src="${photo.src}" alt="${escapeHTML(photo.label)}">` : `${escapeHTML(photo.label)}<br>No photo uploaded`}</div>`).join('') : '<div class="profile-photo">No installation photos apply to this customer.</div>'}</div></section>
        <section class="profile-section"><h3>Jobs &amp; Installation History</h3><ul class="profile-list">${jobs.length ? jobs.map(job => `<li>${escapeHTML(job.id)} · ${escapeHTML(job.type)} <strong>${formatDate(job.date)}<br>${escapeHTML(job.status)}</strong></li>`).join('') : '<li>No service jobs <strong>—</strong></li>'}</ul></section>
        <section class="profile-section"><h3>Feedback &amp; Support</h3><ul class="profile-list">${tickets.length ? tickets.map(ticket => `<li>${escapeHTML(ticket.type)} · ${escapeHTML(ticket.subject)} <strong>${escapeHTML(ticket.status)}</strong></li>`).join('') : '<li>No support tickets <strong>—</strong></li>'}</ul></section>
        <section class="profile-section full"><h3>Notes &amp; Communication History</h3><p class="admin-subtitle">${escapeHTML(customer.notes || 'No customer notes.')}</p><ul class="profile-list" style="margin-top:12px">${messages.length ? messages.map(message => `<li>${escapeHTML(message.channel)} · ${escapeHTML(message.title)} <strong>${new Date(message.sent).toLocaleDateString()}</strong></li>`).join('') : '<li>No messages sent <strong>—</strong></li>'}</ul></section>
      </div>`;
    profileModal.classList.add('open');
  }

  function openStaffProfile(member) {
    if (!member) return;
    const data = Store.getAdminData();
    const jobs = data.jobs.filter(job => job.technician === member.name);
    const customers = data.customers.filter(customer => customer.assignedSalesId === member.id);
    const activity = data.activityLog.filter(item => item.actorId === member.id || jobs.some(job => job.id === item.entity));
    document.getElementById('profileContent').innerHTML = `<div class="profile-head"><div class="profile-avatar">${member.photo ? `<img src="${member.photo}" alt="${escapeHTML(member.name)}">` : escapeHTML(member.initials || initials(member.name))}</div><div><h2>${escapeHTML(member.name)}</h2><p>${escapeHTML(member.id)} · ${staffRoles(member).map(escapeHTML).join(' · ')}</p></div><div class="profile-actions"><button class="btn btn-sm btn-primary" onclick="AdminUI.chooseStaffPhoto('${member.id}')">${member.photo ? 'Replace Photo' : 'Add Photo'}</button><button class="btn btn-sm btn-outline" onclick="AdminUI.editRecord('staff','${member.id}')">Edit</button><button class="btn btn-sm btn-danger" onclick="AdminUI.deleteRecord('staff','${member.id}','${encodeURIComponent(member.name)}')">Delete</button></div></div><div class="profile-grid"><section class="profile-section"><h3>Staff Information</h3><ul class="profile-list"><li>Email <strong>${escapeHTML(member.email)}</strong></li><li>Phone <strong>${escapeHTML(member.phone)}</strong></li><li>Coverage <strong>${escapeHTML(member.area)}</strong></li><li>Availability <strong>${escapeHTML(member.availability)}</strong></li><li>Review score <strong>${member.rating}</strong></li></ul></section><section class="profile-section"><h3>Tracked Relationships</h3><ul class="profile-list"><li>Assigned jobs <strong>${jobs.length}</strong></li><li>Customers created / owned <strong>${customers.length}</strong></li><li>Tracked actions <strong>${activity.length}</strong></li></ul></section><section class="profile-section full"><h3>Job &amp; Customer History</h3><ul class="profile-list">${jobs.length ? jobs.map(job => `<li>${escapeHTML(job.id)} · ${escapeHTML(job.type)} · ${customerButton(job.customer)} <strong>${formatDate(job.date)}<br>${escapeHTML(job.status)}</strong></li>`).join('') : customers.length ? customers.map(customer => `<li>Customer created / assigned ${customerButton(customer.name, customer.email)} <strong>${escapeHTML(customer.id)}</strong></li>`).join('') : '<li>No linked jobs or customers <strong>—</strong></li>'}</ul></section><section class="profile-section full"><h3>Employee Activity Log</h3><ul class="profile-list">${activity.length ? activity.map(item => `<li>${escapeHTML(item.action)} <strong>${escapeHTML(item.entity)}<br>${new Date(item.timestamp).toLocaleString()}</strong></li>`).join('') : '<li>No recorded changes yet <strong>—</strong></li>'}</ul></section></div>`;
    profileModal.classList.add('open');
  }

  function openSupplierProfile(profile) {
    if (!profile) return;
    const orders = Store.getAdminData().suppliers.filter(order => order.supplier === profile.name);
    document.getElementById('profileContent').innerHTML = `<div class="profile-head"><div class="profile-avatar">${initials(profile.name)}</div><div><h2>${escapeHTML(profile.name)}</h2><p>${escapeHTML(profile.id)} · Supplier profile</p></div><div class="profile-actions"><button class="btn btn-sm btn-outline" onclick="AdminUI.editRecord('supplierProfile','${profile.id}')">Edit</button><button class="btn btn-sm btn-danger" onclick="AdminUI.deleteRecord('supplierProfiles','${profile.id}','${encodeURIComponent(profile.name)}')">Delete</button></div></div><div class="profile-grid"><section class="profile-section"><h3>Supplier Information</h3><ul class="profile-list"><li>Email <strong>${escapeHTML(profile.email)}</strong></li><li>Phone <strong>${escapeHTML(profile.phone)}</strong></li><li>Address <strong>${escapeHTML(profile.address)}</strong></li><li>Status <strong>${escapeHTML(profile.status)}</strong></li></ul></section><section class="profile-section"><h3>Purchasing Terms</h3><ul class="profile-list"><li>Categories <strong>${escapeHTML(profile.categories)}</strong></li><li>Lead time <strong>${escapeHTML(profile.leadTime)}</strong></li><li>Rating <strong>${profile.rating}</strong></li><li>Notes <strong>${escapeHTML(profile.notes)}</strong></li></ul></section><section class="profile-section full"><h3>Purchase Order History</h3><ul class="profile-list">${orders.length ? orders.map(order => `<li>${escapeHTML(order.id)} · ${escapeHTML(order.category)} <strong>${money(Number(order.amount))}<br>${escapeHTML(order.status)}</strong></li>`).join('') : '<li>No purchase orders <strong>—</strong></li>'}</ul></section></div>`;
    profileModal.classList.add('open');
  }
  document.getElementById('profileClose').addEventListener('click', () => profileModal.classList.remove('open'));
  profileModal.addEventListener('click', event => { if (event.target === profileModal) profileModal.classList.remove('open'); });

  const messageModal = document.getElementById('messageModal');
  const closeMessageModal = () => messageModal.classList.remove('open');
  document.getElementById('messageClose').addEventListener('click', closeMessageModal);
  document.getElementById('messageCancel').addEventListener('click', closeMessageModal);
  messageModal.addEventListener('click', event => { if (event.target === messageModal) closeMessageModal(); });
  document.getElementById('messageForm').addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    Store.addNotification(values); closeMessageModal(); profileModal.classList.remove('open'); event.currentTarget.reset();
    toast(values.channel.includes('Email') ? 'Message queued for website and/or email delivery' : 'Website notification sent');
  });

  const audienceModal = document.getElementById('audienceModal');
  const closeAudienceModal = () => audienceModal.classList.remove('open');
  document.getElementById('audienceClose').addEventListener('click', closeAudienceModal);
  document.getElementById('audienceCancel').addEventListener('click', closeAudienceModal);
  audienceModal.addEventListener('click', event => { if (event.target === audienceModal) closeAudienceModal(); });
  document.getElementById('audienceForm').addEventListener('submit', event => {
    event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget).entries()); const data = Store.getAdminData();
    const recipients = values.audience === 'pendingLeads' ? data.leads.filter(lead => !['Won', 'Lost'].includes(lead.stage)) : values.audience.startsWith('cart:') ? data.abandonedCarts.filter(cart => cart.id === values.audience.split(':')[1]) : data.abandonedCarts.filter(cart => cart.status === 'Pending');
    Store.addAdminItem('outreach', { id: 'OUT-' + String(Date.now()).slice(-6), audience: values.audience, channel: values.channel, subject: values.subject, message: values.message, recipients: recipients.map(item => item.email), count: recipients.length, created: new Date().toISOString(), status: 'Queued' });
    if (values.channel.includes('Website')) recipients.filter(item => item.customerId).forEach(item => Store.addNotification({ customerId: item.customerId, channel: values.channel, title: values.subject, message: values.message }));
    if (values.audience !== 'pendingLeads') recipients.forEach(item => Store.updateAdminItem('abandonedCarts', item.id, { status: 'Contacted' }));
    closeAudienceModal(); event.currentTarget.reset(); renderMarketing(); toast(`${recipients.length} outreach message(s) queued`);
  });
  document.getElementById('exportPendingLeads').addEventListener('click', () => {
    const pending = Store.getAdminData().leads.filter(lead => !['Won', 'Lost'].includes(lead.stage));
    const csv = [['Name', 'Email', 'Stage', 'Interest'], ...pending.map(lead => [lead.name, lead.email, lead.stage, lead.interest])].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = 'pending-lead-emails.csv'; link.click(); URL.revokeObjectURL(link.href); toast('Pending lead emails exported');
  });

  let staffPhotoId = null;
  const staffPhotoInput = document.getElementById('staffPhotoInput');
  staffPhotoInput.addEventListener('change', async () => {
    const file = staffPhotoInput.files[0]; if (!file || !staffPhotoId) return;
    toast('Uploading photo...');
    const result = await window.CrystalinaData.uploadImage(file, { folder: 'staff' });
    const targetId = staffPhotoId;
    staffPhotoId = null; staffPhotoInput.value = '';
    if (!result.ok) { toast(result.error); return; }
    Store.updateAdminItem('staff', targetId, { photo: result.url });
    const member = Store.getAdminData().staff.find(item => item.id === targetId);
    renderStaff(); openStaffProfile(member); toast('Staff photo saved');
  });

  /* ---------- operations ---------- */
  const formatDate = value => new Date(value + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const statusClass = status => {
    if (['Active', 'Confirmed', 'Completed', 'Delivered', 'Available'].includes(status)) return 'is-success';
    if (['Paused', 'Needs assignment', 'Delayed'].includes(status)) return 'is-warning';
    if (['Cancelled'].includes(status)) return 'is-danger';
    return '';
  };

  function statCard(label, value, hint) {
    return `<div class="stat-card"><div class="sc-label">${label}</div><div class="sc-value">${value}</div><div class="sc-hint">${hint}</div></div>`;
  }

  let subscriptionFilters = { search: '', status: '', date: '' };
  function renderSubscriptions() {
    const allSubscriptions = Store.getAdminData().subscriptions;
    const list = allSubscriptions.filter(subscription => (!subscriptionFilters.search || `${subscription.customer} ${subscription.email} ${subscription.system}`.toLowerCase().includes(subscriptionFilters.search)) && (!subscriptionFilters.status || subscription.status === subscriptionFilters.status) && (!subscriptionFilters.date || subscription.nextDate <= subscriptionFilters.date));
    const active = allSubscriptions.filter(s => s.status === 'Active');
    document.getElementById('subscriptionStats').innerHTML =
      statCard('Active plans', active.length, `${list.filter(s => s.status === 'Paused').length} currently paused`) +
      statCard('Next 30 days', active.length, 'scheduled renewals') +
      statCard('Projected value', money(active.length * 64.99), 'next replacement cycle');
    document.getElementById('replacementCount').textContent = `${active.length} upcoming`;
    document.querySelector('#subscriptionsTable tbody').innerHTML = list.map(s => `<tr>
      <td>${customerButton(s.customer, s.email)}</td>
      <td>${s.system}</td><td>${s.cadence}</td><td>${formatDate(s.nextDate)}</td><td>${s.replacement}</td>
      <td><span class="record-status ${statusClass(s.status)}">${s.status}</span></td>
      <td><div class="table-actions"><button class="btn btn-sm btn-outline" onclick="AdminUI.toggleSubscription('${s.id}')">${s.status === 'Paused' ? 'Resume' : 'Pause'}</button><button class="btn btn-sm btn-ghost" onclick="AdminUI.editRecord('subscription','${s.id}')">Edit</button><button class="btn btn-sm btn-danger" onclick="AdminUI.deleteRecord('subscriptions','${s.id}','${encodeURIComponent(s.id)}')">Delete</button></div></td>
    </tr>`).join('');
  }

  let serviceFilters = { search: '', date: '', borough: '', status: '' };
  function renderService() {
    const allJobs = Store.getAdminData().jobs;
    const jobs = allJobs.filter(job => {
      const haystack = `${job.id} ${job.customer} ${job.product || ''} ${job.type}`.toLowerCase();
      return (!serviceFilters.search || haystack.includes(serviceFilters.search)) && (!serviceFilters.date || job.date === serviceFilters.date) && (!serviceFilters.borough || job.borough === serviceFilters.borough) && (!serviceFilters.status || job.status === serviceFilters.status);
    });
    document.getElementById('serviceStats').innerHTML =
      statCard('Upcoming jobs', allJobs.length, 'across the next 7 days') +
      statCard('Needs assignment', allJobs.filter(j => j.status === 'Needs assignment').length, 'requires dispatch') +
      statCard('QC complete', allJobs.filter(j => j.beforePhoto && j.afterPhoto).length, 'before and finish photos');
    document.querySelector('#jobsTable tbody').innerHTML = jobs.map(j => {
      const pct = Math.round((j.checklistDone / j.checklistTotal) * 100);
      return `<tr>
        <td><strong>${formatDate(j.date)}</strong><br><small>${j.time}</small></td>
        <td>${customerButton(j.customer)}<br><small>${j.address}, ${j.borough}</small></td>
        <td><strong>${escapeHTML(j.product || j.type)}</strong><br><small>${escapeHTML(j.requirements || 'See technician checklist for requirements.')}</small></td>
        <td><select class="admin-select" onchange="AdminUI.assignTechnician('${j.id}',this.value)"><option ${j.technician === 'Needs assignment' ? 'selected' : ''}>Needs assignment</option>${Store.getAdminData().staff.filter(s => (s.roles || [s.role]).includes('Technician') || s.role.includes('Technician')).map(s => `<option ${s.name === j.technician ? 'selected' : ''}>${s.name}</option>`).join('')}</select></td>
        <td><span class="record-status ${statusClass(j.status)}">${j.status}</span><br><small>Updated by technician</small></td>
        <td><div class="progress-compact"><span>${j.checklistDone} of ${j.checklistTotal} checklist items</span><span class="progress-track"><i style="width:${pct}%"></i></span></div><small>${j.beforePhoto && j.afterPhoto ? 'Both photos uploaded' : j.beforePhoto || j.afterPhoto ? '1 of 2 photos' : 'No photos yet'}</small></td>
        <td><div class="table-actions"><button class="btn btn-sm btn-outline" onclick="AdminUI.editRecord('job','${j.id}')">Edit</button><button class="btn btn-sm btn-danger" onclick="AdminUI.deleteRecord('jobs','${j.id}','${encodeURIComponent(j.id)}')">Delete</button></div></td>
      </tr>`;
    }).join('') || `<tr><td colspan="7">No jobs match this filter.</td></tr>`;
  }

  const staffRoles = staff => staff.roles || [staff.role.includes('Technician') ? 'Technician' : staff.role.includes('Sales') ? 'Sales Associate' : staff.role];
  let staffFilters = { search: '', role: '', availability: '' };
  function renderStaff() {
    const staff = Store.getAdminData().staff.filter(member => {
      const haystack = `${member.id} ${member.name} ${member.email}`.toLowerCase();
      return (!staffFilters.search || haystack.includes(staffFilters.search)) && (!staffFilters.role || staffRoles(member).includes(staffFilters.role)) && (!staffFilters.availability || member.availability === staffFilters.availability);
    });
    document.getElementById('staffGrid').innerHTML = staff.map(member => `<article class="staff-card">
      <div class="staff-card-head"><div class="staff-avatar">${member.photo ? `<img src="${member.photo}" alt="${escapeHTML(member.name)}">` : escapeHTML(member.initials || initials(member.name))}</div><div><button class="entity-link" onclick="AdminUI.openStaffProfile('${member.id}')">${escapeHTML(member.name)}</button><div class="staff-role">${staffRoles(member).map(escapeHTML).join(' · ')} · ${escapeHTML(member.id)}</div></div></div>
      <div class="staff-details"><span><strong>Coverage:</strong> ${escapeHTML(member.area)}</span><span><strong>Schedule:</strong> <span class="record-status ${statusClass(member.availability)}">${escapeHTML(member.availability)}</span></span><span>${escapeHTML(member.email)}<br>${escapeHTML(member.phone)}</span></div>
      <div class="staff-metrics"><div class="staff-metric"><strong>${member.rating}</strong><span>Review score</span></div><div class="staff-metric"><strong>${member.jobs}</strong><span>Jobs / records</span></div></div>
      <div class="table-actions"><button class="btn btn-sm btn-outline" onclick="AdminUI.openStaffProfile('${member.id}')">View Profile</button><button class="btn btn-sm btn-ghost" onclick="AdminUI.editRecord('staff','${member.id}')">Edit</button><button class="btn btn-sm btn-danger" onclick="AdminUI.deleteRecord('staff','${member.id}','${encodeURIComponent(member.name)}')">Delete</button></div>
    </article>`).join('') || '<div class="admin-panel">No staff match these filters.</div>';
  }

  let supplierFilters = { search: '', status: '' };
  const supplierButton = name => `<button class="entity-link" onclick="AdminUI.openSupplierByName('${encodeURIComponent(name)}')">${escapeHTML(name)}</button>`;
  function renderSuppliers() {
    const data = Store.getAdminData();
    const profiles = data.supplierProfiles.filter(profile => !supplierFilters.search || `${profile.name} ${profile.categories}`.toLowerCase().includes(supplierFilters.search));
    const list = data.suppliers.filter(order => (!supplierFilters.search || `${order.id} ${order.supplier} ${order.category}`.toLowerCase().includes(supplierFilters.search)) && (!supplierFilters.status || order.status === supplierFilters.status));
    document.getElementById('supplierStats').innerHTML =
      statCard('Active suppliers', data.supplierProfiles.filter(p => p.status === 'Active').length, 'approved vendors') +
      statCard('Open purchase orders', data.suppliers.filter(p => p.status !== 'Delivered').length, 'awaiting delivery') +
      statCard('Committed spend', money(data.suppliers.filter(p => p.status !== 'Delivered').reduce((sum, p) => sum + Number(p.amount), 0)), 'open purchase orders');
    document.getElementById('supplierDirectoryCount').textContent = `${profiles.length} suppliers`;
    document.querySelector('#supplierProfilesTable tbody').innerHTML = profiles.map(profile => `<tr><td>${supplierButton(profile.name)}<br><small>${escapeHTML(profile.email)} · ${escapeHTML(profile.phone)}</small></td><td>${escapeHTML(profile.categories)}</td><td>${escapeHTML(profile.leadTime)}</td><td>${profile.rating}</td><td><span class="record-status ${statusClass(profile.status)}">${escapeHTML(profile.status)}</span></td><td><div class="table-actions"><button class="btn btn-sm btn-outline" onclick="AdminUI.openSupplierProfile('${profile.id}')">View</button><button class="btn btn-sm btn-ghost" onclick="AdminUI.editRecord('supplierProfile','${profile.id}')">Edit</button><button class="btn btn-sm btn-danger" onclick="AdminUI.deleteRecord('supplierProfiles','${profile.id}','${encodeURIComponent(profile.name)}')">Delete</button></div></td></tr>`).join('') || '<tr><td colspan="6">No suppliers match this filter.</td></tr>';
    document.querySelector('#suppliersTable tbody').innerHTML = list.map(p => `<tr>
      <td><strong>${p.id}</strong></td><td>${supplierButton(p.supplier)}<br><small>${p.contact}</small></td><td>${p.category}</td><td>${money(p.amount)}</td><td>${formatDate(p.eta)}</td><td><span class="admin-badge">${p.tracking}</span></td>
      <td><select class="admin-select" onchange="AdminUI.setSupplierStatus('${p.id}',this.value)">${['Draft', 'Confirmed', 'In transit', 'Delayed', 'Delivered'].map(s => `<option ${s === p.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td><td><div class="table-actions"><button class="btn btn-sm btn-ghost" onclick="AdminUI.editRecord('supplier','${p.id}')">Edit</button><button class="btn btn-sm btn-danger" onclick="AdminUI.deleteRecord('suppliers','${p.id}','${encodeURIComponent(p.id)}')">Delete</button></div></td>
    </tr>`).join('');
  }

  let leadFilters = { search: '', stage: '', source: '' };
  function renderLeads() {
    const allLeads = Store.getAdminData().leads;
    const leads = allLeads.filter(lead => (!leadFilters.search || `${lead.name} ${lead.email} ${lead.interest}`.toLowerCase().includes(leadFilters.search)) && (!leadFilters.stage || lead.stage === leadFilters.stage) && (!leadFilters.source || lead.source === leadFilters.source));
    const open = allLeads.filter(l => l.stage !== 'Won' && l.stage !== 'Lost');
    const value = open.reduce((sum, lead) => sum + Number(lead.value), 0);
    document.getElementById('leadStats').innerHTML =
      statCard('Open opportunities', open.length, 'active conversations') +
      statCard('Pipeline value', money(value), 'estimated sales') +
      statCard('Follow-ups due', leads.filter(l => l.followUp <= '2026-08-25' && l.stage !== 'Won').length, 'today and overdue');
    const stages = ['New', 'Qualified', 'Quote sent', 'Won'];
    document.getElementById('leadPipeline').innerHTML = stages.map(stage => `<div class="pipeline-stage"><span>${stage}</span><strong>${allLeads.filter(l => l.stage === stage).length}</strong></div>`).join('');
    document.querySelector('#leadsTable tbody').innerHTML = leads.map(l => `<tr>
      <td>${customerButton(l.name, l.email)}</td><td>${l.interest}</td><td>${l.source}</td><td>${l.borough}</td><td><strong>${money(Number(l.value))}</strong></td><td>${formatDate(l.followUp)}</td>
      <td><select class="admin-select" onchange="AdminUI.setLeadStage('${l.id}',this.value)">${['New', 'Qualified', 'Quote sent', 'Won', 'Lost'].map(s => `<option ${s === l.stage ? 'selected' : ''}>${s}</option>`).join('')}</select></td><td><div class="table-actions"><button class="btn btn-sm btn-ghost" onclick="AdminUI.editRecord('lead','${l.id}')">Edit</button><button class="btn btn-sm btn-danger" onclick="AdminUI.deleteRecord('leads','${l.id}','${encodeURIComponent(l.name)}')">Delete</button></div></td>
    </tr>`).join('') || '<tr><td colspan="8">No leads match these filters.</td></tr>';
  }

  function renderMarketing() {
    const data = Store.getAdminData();
    const avgConversion = data.campaigns.reduce((sum, c) => sum + Number(c.conversion), 0) / Math.max(data.campaigns.length, 1);
    const pendingCarts = data.abandonedCarts.filter(cart => cart.status === 'Pending');
    document.getElementById('marketingStats').innerHTML =
      statCard('List size', '2,418', 'email and SMS contacts') +
      statCard('Average conversion', `${avgConversion.toFixed(1)}%`, 'across current campaigns') +
      statCard('Referral sales', money(7260), 'this quarter') +
      statCard('Abandoned carts', pendingCarts.length, `${money(pendingCarts.reduce((sum, cart) => sum + Number(cart.total), 0))} recoverable value`);
    document.querySelector('#campaignsTable tbody').innerHTML = data.campaigns.map(c => `<tr>
      <td><strong>${c.name}</strong><br><small>${c.channel}</small></td><td>${c.audience}</td><td>${Number(c.sent).toLocaleString()}</td><td><strong>${c.conversion}%</strong></td>
      <td><select class="admin-select" onchange="AdminUI.setCampaignStatus('${c.id}',this.value)">${['Draft', 'Scheduled', 'Active', 'Paused', 'Completed'].map(s => `<option ${s === c.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td><td><div class="table-actions"><button class="btn btn-sm btn-ghost" onclick="AdminUI.editRecord('campaign','${c.id}')">Edit</button><button class="btn btn-sm btn-danger" onclick="AdminUI.deleteRecord('campaigns','${c.id}','${encodeURIComponent(c.name)}')">Delete</button></div></td>
    </tr>`).join('');
    document.querySelector('#discountsTable tbody').innerHTML = data.discounts.map(d => `<tr><td><strong>${d.id}</strong></td><td>${d.type}</td><td>${d.usage}${Number(d.limit) ? ` / ${d.limit}` : ''}</td><td>${formatDate(d.expires)}</td><td><span class="record-status ${statusClass(d.status)}">${d.status}</span></td><td><div class="table-actions"><button class="btn btn-sm btn-ghost" onclick="AdminUI.editRecord('discount','${d.id}')">Edit</button><button class="btn btn-sm btn-danger" onclick="AdminUI.deleteRecord('discounts','${d.id}','${encodeURIComponent(d.id)}')">Delete</button></div></td></tr>`).join('');
    document.querySelector('#abandonedCartsTable tbody').innerHTML = data.abandonedCarts.map(cart => `<tr><td>${cart.customerId ? customerButton(cart.customer, cart.email) : `<strong>${escapeHTML(cart.customer)}</strong>`}</td><td>${escapeHTML(cart.email)}<br><small>${escapeHTML(cart.phone || 'No SMS number')}</small></td><td>${cart.items.map(escapeHTML).join('<br>')}</td><td><strong>${money(Number(cart.total))}</strong></td><td>${new Date(cart.updated).toLocaleString()}</td><td><span class="record-status ${cart.status === 'Recovered' ? 'is-success' : cart.status === 'Pending' ? 'is-warning' : ''}">${escapeHTML(cart.status)}</span></td><td><div class="table-actions"><button class="btn btn-sm btn-outline" onclick="AdminUI.composeCart('${cart.id}')">Message</button><button class="btn btn-sm btn-danger" onclick="AdminUI.deleteRecord('abandonedCarts','${cart.id}','${encodeURIComponent(cart.id)}')">Delete</button></div></td></tr>`).join('');
  }

  let ticketFilter = 'all';
  function renderSupport() {
    const allTickets = Store.getAdminData().tickets;
    const tickets = allTickets.filter(ticket => ticketFilter === 'all' || (ticketFilter === 'open' && ticket.status !== 'Resolved') || (ticketFilter === 'warranty' && ticket.type === 'Warranty') || (ticketFilter === 'returns' && ticket.type === 'Return'));
    document.getElementById('supportStats').innerHTML =
      statCard('Open tickets', allTickets.filter(t => t.status !== 'Resolved').length, 'across email and chat') +
      statCard('Warranty claims', allTickets.filter(t => t.type === 'Warranty' && t.status !== 'Resolved').length, 'awaiting resolution') +
      statCard('Average response', '1h 18m', 'during business hours');
    document.querySelector('#ticketsTable tbody').innerHTML = tickets.map(t => `<tr>
      <td><strong>${t.id}</strong><br><small>${t.channel}</small></td><td>${customerButton(t.customer)}</td><td><strong>${t.subject}</strong><br><button class="link-button" onclick="AdminUI.openCustomerByName('${encodeURIComponent(t.customer)}')">View notes &amp; history</button></td><td>${t.type}</td><td><span class="record-status ${t.priority === 'High' ? 'is-danger' : t.priority === 'Normal' ? 'is-warning' : ''}">${t.priority}</span></td><td>${formatDate(t.updated)}</td>
      <td><select class="admin-select" onchange="AdminUI.setTicketStatus('${t.id}',this.value)">${['Open', 'In progress', 'Waiting on customer', 'Resolved'].map(s => `<option ${s === t.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td><td><div class="table-actions"><button class="btn btn-sm btn-ghost" onclick="AdminUI.editRecord('ticket','${t.id}')">Edit</button><button class="btn btn-sm btn-danger" onclick="AdminUI.deleteRecord('tickets','${t.id}','${encodeURIComponent(t.id)}')">Delete</button></div></td>
    </tr>`).join('') || `<tr><td colspan="7">No tickets match this filter.</td></tr>`;
  }

  let contentFilter = 'all';
  function renderContent() {
    const data = Store.getAdminData();
    const settings = data.siteSettings;
    document.getElementById('announcementInput').value = settings.announcement;
    document.getElementById('heroImagePreview').style.setProperty('--hero-preview', `url("${settings.heroImage.replace(/"/g, '\\"')}")`);
    const sections = data.pageSections || [];
    document.getElementById('pageSectionList').innerHTML = sections.map((section, index) => `<article class="content-layer ${section.enabled === false ? 'is-hidden' : ''}">
      <div class="layer-order"><span>${String(index + 1).padStart(2, '0')}</span><small>${index === 0 ? 'TOP' : index === sections.length - 1 ? 'BOTTOM' : 'LAYER'}</small></div>
      <div class="layer-copy"><div><strong>${escapeHTML(section.label || section.heading)}</strong><span>${escapeHTML(section.type)}</span></div><p>${escapeHTML(section.heading || 'Untitled section')}${section.type === 'Best Sellers' ? ` · ${(section.products || []).length} selected products` : ''}</p></div>
      <label class="layer-toggle"><input type="checkbox" ${section.enabled !== false ? 'checked' : ''} onchange="AdminUI.toggleSection('${section.id}',this.checked)"><span>${section.enabled !== false ? 'Visible' : 'Hidden'}</span></label>
      <div class="layer-actions"><button class="btn btn-sm btn-ghost" ${index === 0 ? 'disabled' : ''} onclick="AdminUI.moveSection('${section.id}',-1)" aria-label="Move section up">↑</button><button class="btn btn-sm btn-ghost" ${index === sections.length - 1 ? 'disabled' : ''} onclick="AdminUI.moveSection('${section.id}',1)" aria-label="Move section down">↓</button><button class="btn btn-sm btn-outline" onclick="AdminUI.editSection('${section.id}')">Edit</button><button class="btn btn-sm btn-ghost" onclick="AdminUI.duplicateSection('${section.id}')">Duplicate</button><button class="btn btn-sm btn-danger" onclick="AdminUI.deleteSection('${section.id}')">Delete</button></div>
    </article>`).join('') || '<p class="admin-subtitle">No landing-page sections. Add a section to start rebuilding the page.</p>';
    const content = contentFilter === 'all' ? data.content : data.content.filter(item => item.type === contentFilter);
    document.querySelector('#contentTable tbody').innerHTML = content.map(item => `<tr><td><strong>${escapeHTML(item.title)}</strong><br><small>${escapeHTML(item.type)}</small></td><td>${escapeHTML(item.placement)}</td><td>${formatDate(item.updated)}</td><td><select class="admin-select" onchange="AdminUI.setContentStatus('${item.id}',this.value)">${['Draft', 'Needs approval', 'Published', 'Archived'].map(status => `<option ${status === item.status ? 'selected' : ''}>${status}</option>`).join('')}</select></td><td><div class="table-actions"><button class="btn btn-sm btn-ghost" onclick="AdminUI.editRecord('content','${item.id}')">Edit</button><button class="btn btn-sm btn-danger" onclick="AdminUI.deleteRecord('content','${item.id}','${encodeURIComponent(item.title)}')">Delete</button></div></td></tr>`).join('') || '<tr><td colspan="5">No website items match this filter.</td></tr>';
  }

  function renderFinance() {
    const adminData = Store.getAdminData();
    const finance = adminData.finance;
    if (!finance.months.length) {
      document.getElementById('financeStats').innerHTML =
        statCard('Revenue', money(0), 'No data yet') +
        statCard('Gross profit', money(0), 'No data yet') +
        statCard('Orders', '0', 'No data yet') +
        statCard('Outstanding invoices', money(0), 'No data yet');
      document.getElementById('revenueChart').innerHTML = '<p class="empty-state">No revenue data yet.</p>';
      document.querySelector('#boroughDonut span').innerHTML = `${money(0)}<small>Total sales</small>`;
      document.getElementById('boroughLegend').innerHTML = '<p class="empty-state">No area sales data yet.</p>';
      document.querySelector('#areaSalesTable tbody').innerHTML = '<tr><td colspan="4">No sales data yet.</td></tr>';
      document.querySelector('#productSalesTable tbody').innerHTML = '<tr><td colspan="4">No product sales data yet.</td></tr>';
      document.querySelector('#marketingFinanceTable tbody').innerHTML = '<tr><td colspan="6">No campaign data yet.</td></tr>';
      return;
    }
    const revenue = finance.months.reduce((sum, month) => sum + month.revenue, 0);
    const costs = finance.months.reduce((sum, month) => sum + month.cost, 0);
    const profit = revenue - costs;
    const orders = finance.months.reduce((sum, month) => sum + month.orders, 0);
    document.getElementById('financeStats').innerHTML =
      statCard('Revenue', money(revenue), 'last 6 months') +
      statCard('Gross profit', money(profit), `${Math.round((profit / revenue) * 100)}% margin`) +
      statCard('Orders', orders.toLocaleString(), `${money(revenue / orders)} average value`) +
      statCard('Outstanding invoices', money(4820), '7 invoices awaiting payment');
    const max = Math.max(...finance.months.map(month => month.revenue));
    document.getElementById('revenueChart').innerHTML = finance.months.map(month => {
      const monthProfit = month.revenue - month.cost;
      return `<div class="chart-month"><div class="chart-bar" style="height:${Math.round((month.revenue / max) * 100)}%" data-value="${money(month.revenue)}"></div><div class="chart-bar profit" style="height:${Math.round((monthProfit / max) * 100)}%" data-value="${money(monthProfit)}"></div><span>${month.month}</span></div>`;
    }).join('');
    const areaTotal = finance.areas.reduce((sum, area) => sum + area.revenue, 0);
    document.querySelector('#boroughDonut span').innerHTML = `${money(areaTotal / 1000).replace('.00', '')}k<small>Total sales</small>`;
    document.getElementById('boroughLegend').innerHTML = `<div class="borough-legend">${finance.areas.map(area => `<div><span>${area.name}</span><strong>${Math.round((area.revenue / areaTotal) * 100)}%</strong></div>`).join('')}</div>`;
    document.querySelector('#areaSalesTable tbody').innerHTML = finance.areas.map(area => { const share = Math.round((area.revenue / areaTotal) * 100); return `<tr><td><strong>${area.name}</strong></td><td>${area.orders}</td><td>${money(area.revenue)}</td><td><div class="share-bar"><i style="width:${share}%"></i></div><small>${share}%</small></td></tr>`; }).join('');
    document.querySelector('#productSalesTable tbody').innerHTML = finance.products.map(product => `<tr><td><strong>${product.name}</strong></td><td>${product.units}</td><td>${money(product.revenue)}</td><td>${product.margin}%</td></tr>`).join('');
    const averageOrder = revenue / orders;
    document.querySelector('#marketingFinanceTable tbody').innerHTML = adminData.campaigns.map(campaign => { const estimatedOrders = Math.round(Number(campaign.sent) * Number(campaign.conversion) / 100); return `<tr><td><strong>${escapeHTML(campaign.name)}</strong></td><td>${escapeHTML(campaign.channel)}</td><td>${Number(campaign.sent).toLocaleString()}</td><td>${campaign.conversion}%</td><td>${estimatedOrders}</td><td><strong>${money(estimatedOrders * averageOrder)}</strong></td></tr>`; }).join('');
  }

  function renderSettings() {
    const data = Store.getAdminData();
    const settings = data.siteSettings;
    ['companyName', 'email', 'phone', 'address', 'hours'].forEach(name => {
      const input = document.querySelector(`#companySettingsForm [name="${name}"]`);
      if (input) input.value = settings[name];
    });
    document.getElementById('navyColor').value = settings.navy;
    document.getElementById('primaryColor').value = settings.primary;
    document.getElementById('accentColor').value = settings.accent;
    updateColorLabels();
    const roleNames = ['Technician', 'Sales Associate', 'Manager'];
    document.querySelector('#staffRolesTable tbody').innerHTML = data.staff.map(member => {
      const roles = staffRoles(member);
      return `<tr><td><button class="entity-link" onclick="AdminUI.openStaffProfile('${member.id}')">${escapeHTML(member.name)}</button><br><small>${escapeHTML(member.email)}</small></td><td><strong>${escapeHTML(member.id)}</strong></td>${roleNames.map(role => `<td><label class="role-check"><input type="checkbox" ${roles.includes(role) ? 'checked' : ''} onchange="AdminUI.toggleStaffRole('${member.id}','${role}',this.checked)"><span>${roles.includes(role) ? 'Assigned' : 'Not assigned'}</span></label></td>`).join('')}<td><select class="admin-select" onchange="AdminUI.setPrimaryRole('${member.id}',this.value)">${roles.map(role => `<option ${role === member.role ? 'selected' : ''}>${escapeHTML(role)}</option>`).join('')}</select></td></tr>`;
    }).join('');
    document.querySelector('#rolesTable tbody').innerHTML = data.roles.map(role => `<tr><td><strong>${role.role}</strong></td><td>${role.members}</td><td>${role.permissions}</td><td><select class="admin-select" onchange="AdminUI.setRolePermissions('${role.id}',this.value)">${['Full access', 'Orders, customers, service, inventory', 'Assigned jobs, checklists, photos', 'Leads, quotes, customer notes', 'View only'].map(option => `<option ${option === role.permissions ? 'selected' : ''}>${option}</option>`).join('')}</select></td></tr>`).join('');
  }

  function updateColorLabels() {
    [['navyColor', 'navyValue'], ['primaryColor', 'primaryValue'], ['accentColor', 'accentValue']].forEach(([inputId, valueId]) => { document.getElementById(valueId).textContent = document.getElementById(inputId).value.toUpperCase(); });
  }

  ['serviceSearch', 'serviceDateFilter', 'serviceBoroughFilter', 'serviceStatusFilter'].forEach(id => document.getElementById(id).addEventListener('input', () => {
    serviceFilters = { search: document.getElementById('serviceSearch').value.trim().toLowerCase(), date: document.getElementById('serviceDateFilter').value, borough: document.getElementById('serviceBoroughFilter').value, status: document.getElementById('serviceStatusFilter').value };
    renderService();
  }));
  ['productSearch', 'productCategoryFilter', 'productStockFilter'].forEach(id => document.getElementById(id).addEventListener('input', () => {
    productFilters = { search: document.getElementById('productSearch').value.trim().toLowerCase(), category: document.getElementById('productCategoryFilter').value, stock: document.getElementById('productStockFilter').value }; renderProducts();
  }));
  ['orderSearch', 'orderDateFilter', 'orderStatusFilter'].forEach(id => document.getElementById(id).addEventListener('input', () => {
    orderFilters = { search: document.getElementById('orderSearch').value.trim().toLowerCase(), date: document.getElementById('orderDateFilter').value, status: document.getElementById('orderStatusFilter').value }; renderOrders();
  }));
  ['subscriptionSearch', 'subscriptionStatusFilter', 'subscriptionDateFilter'].forEach(id => document.getElementById(id).addEventListener('input', () => {
    subscriptionFilters = { search: document.getElementById('subscriptionSearch').value.trim().toLowerCase(), status: document.getElementById('subscriptionStatusFilter').value, date: document.getElementById('subscriptionDateFilter').value }; renderSubscriptions();
  }));
  document.querySelectorAll('[data-ticket-filter]').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('[data-ticket-filter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); ticketFilter = btn.dataset.ticketFilter; renderSupport();
  }));
  document.querySelectorAll('[data-content-filter]').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('[data-content-filter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); contentFilter = btn.dataset.contentFilter; renderContent();
  }));
  ['customerSearch', 'customerDateFrom', 'customerDateTo'].forEach(id => document.getElementById(id).addEventListener('input', () => {
    customerFilters = { search: document.getElementById('customerSearch').value.trim().toLowerCase(), from: document.getElementById('customerDateFrom').value, to: document.getElementById('customerDateTo').value };
    renderCustomers();
  }));
  document.getElementById('clearCustomerFilters').addEventListener('click', () => {
    ['customerSearch', 'customerDateFrom', 'customerDateTo'].forEach(id => { document.getElementById(id).value = ''; });
    customerFilters = { search: '', from: '', to: '' }; renderCustomers();
  });
  ['staffSearch', 'staffRoleFilter', 'staffAvailabilityFilter'].forEach(id => document.getElementById(id).addEventListener('input', () => {
    staffFilters = { search: document.getElementById('staffSearch').value.trim().toLowerCase(), role: document.getElementById('staffRoleFilter').value, availability: document.getElementById('staffAvailabilityFilter').value };
    renderStaff();
  }));
  ['supplierSearch', 'supplierStatusFilter'].forEach(id => document.getElementById(id).addEventListener('input', () => {
    supplierFilters = { search: document.getElementById('supplierSearch').value.trim().toLowerCase(), status: document.getElementById('supplierStatusFilter').value };
    renderSuppliers();
  }));
  ['leadSearch', 'leadStageFilter', 'leadSourceFilter'].forEach(id => document.getElementById(id).addEventListener('input', () => {
    leadFilters = { search: document.getElementById('leadSearch').value.trim().toLowerCase(), stage: document.getElementById('leadStageFilter').value, source: document.getElementById('leadSourceFilter').value }; renderLeads();
  }));

  document.getElementById('heroMediaForm').addEventListener('submit', event => {
    event.preventDefault();
    Store.updateSiteSettings(Object.fromEntries(new FormData(event.currentTarget).entries()));
    toast('Announcement saved');
  });
  const heroImageInput = document.getElementById('heroImageInput');
  document.getElementById('heroImageButton').addEventListener('click', () => heroImageInput.click());
  heroImageInput.addEventListener('change', async () => {
    const file = heroImageInput.files[0];
    if (!file) return;
    toast('Uploading image...');
    const result = await window.CrystalinaData.uploadImage(file, { folder: 'hero' });
    heroImageInput.value = '';
    if (!result.ok) { toast(result.error); return; }
    Store.updateSiteSettings({ heroImage: result.url });
    renderContent();
    toast('Landing page image saved. Publish to make it live.');
  });

  const sectionModal = document.getElementById('sectionModal');
  const sectionForm = document.getElementById('sectionForm');
  const sectionType = document.getElementById('sectionType');
  function updateSectionProductVisibility() {
    document.getElementById('sectionProductsField').hidden = sectionType.value !== 'Best Sellers';
    const featured = document.getElementById('sectionFeaturedField');
    if (featured) featured.hidden = sectionType.value !== 'Product Feature';
  }
  function closeSectionModal() { sectionModal.classList.remove('open'); sectionForm.reset(); }
  function openSectionModal(section = null) {
    const products = Store.getProducts();
    document.getElementById('sectionModalTitle').textContent = section ? `Edit ${section.label}` : 'Add Page Section';
    document.getElementById('sectionId').value = section?.id || '';
    sectionType.value = section?.type || 'Custom Section';
    document.getElementById('sectionLabel').value = section?.label || '';
    document.getElementById('sectionEyebrow').value = section?.eyebrow || '';
    document.getElementById('sectionHeading').value = section?.heading || '';
    document.getElementById('sectionBody').value = section?.body || '';
    document.getElementById('sectionEnabled').checked = section?.enabled !== false;
    document.getElementById('sectionProductOptions').innerHTML = products.map(product => `<label><input type="checkbox" name="products" value="${product.id}" ${(section?.products || []).includes(product.id) ? 'checked' : ''}><span><strong>${escapeHTML(product.name)}</strong><small>${escapeHTML(product.category)}</small></span></label>`).join('') || '<p class="admin-subtitle">Add products before selecting Best Sellers.</p>';
    document.getElementById('sectionImage').value = section?.image || '';
    const preview = document.getElementById('sectionImagePreview');
    preview.src = section?.image || '';
    preview.style.display = section?.image ? '' : 'none';
    document.getElementById('sectionButtonLabel').value = section?.buttonLabel || '';
    document.getElementById('sectionButtonHref').value = section?.buttonHref || '';
    // Only complete systems make sense as the flagship breakdown.
    const featureable = products.filter(product => product.productKind === 'system' || product.productKind === 'faucet');
    document.getElementById('sectionFeaturedProduct').innerHTML =
      '<option value="">Choose automatically</option>' + featureable.map(product =>
        `<option value="${escapeHTML(product.id)}" ${section?.featuredProductId === product.id ? 'selected' : ''}>${escapeHTML(product.name)}</option>`).join('');
    sectionType.disabled = Boolean(section && section.type !== 'Custom Section');
    updateSectionProductVisibility();
    sectionModal.classList.add('open');
  }
  document.getElementById('addSectionBtn').addEventListener('click', () => openSectionModal());
  document.getElementById('sectionClose').addEventListener('click', closeSectionModal);
  document.getElementById('sectionCancel').addEventListener('click', closeSectionModal);
  sectionModal.addEventListener('click', event => { if (event.target === sectionModal) closeSectionModal(); });
  sectionType.addEventListener('change', updateSectionProductVisibility);
  sectionForm.addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(sectionForm);
    const id = formData.get('id');
    const existing = Store.getAdminData().pageSections.find(section => section.id === id);
    const values = {
      type: sectionType.value, label: formData.get('label'), eyebrow: formData.get('eyebrow'),
      heading: formData.get('heading'), body: formData.get('body'),
      enabled: formData.get('enabled') === 'on', products: formData.getAll('products'),
      image: formData.get('image') || '', buttonLabel: formData.get('buttonLabel') || '',
      buttonHref: formData.get('buttonHref') || '', featuredProductId: formData.get('featuredProductId') || ''
    };
    if (existing) Store.updateAdminItem('pageSections', id, values);
    else Store.saveAdminCollection('pageSections', [...Store.getAdminData().pageSections, { id: `custom-${Date.now()}`, ...values }]);
    if (id === 'hero') Store.updateSiteSettings({ heroEyebrow: values.eyebrow, heroHeading: values.heading, heroBody: values.body });
    closeSectionModal(); renderContent(); toast('Landing page section saved');
  });
  /* Section image: accept a path, or upload a file and keep it as a data URL
     until Supabase Storage is wired up. */
  const sectionImageInput = document.getElementById('sectionImage');
  const sectionImagePreview = document.getElementById('sectionImagePreview');
  sectionImageInput.addEventListener('input', () => {
    sectionImagePreview.src = sectionImageInput.value;
    sectionImagePreview.style.display = sectionImageInput.value ? '' : 'none';
  });
  document.getElementById('sectionImageUpload').addEventListener('click', () =>
    document.getElementById('sectionImageFile').click());
  document.getElementById('sectionImageFile').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    // Show the local file immediately, then replace the preview with the
    // hosted URL once the upload finishes.
    const localPreview = URL.createObjectURL(file);
    sectionImagePreview.src = localPreview;
    sectionImagePreview.style.display = '';
    toast('Uploading image...');
    const result = await window.CrystalinaData.uploadImage(file, { folder: 'sections' });
    URL.revokeObjectURL(localPreview);
    if (!result.ok) {
      sectionImagePreview.src = sectionImageInput.value || '';
      sectionImagePreview.style.display = sectionImageInput.value ? '' : 'none';
      toast(result.error);
      return;
    }
    sectionImageInput.value = result.url;
    sectionImagePreview.src = result.url;
    toast('Image uploaded');
  });

  /* Publish: push the page layout and settings to Supabase so real visitors
     see them. Without this, edits stay in this browser only. */
  const publishBtn = document.getElementById('publishContentBtn');
  if (publishBtn) publishBtn.addEventListener('click', async () => {
    publishBtn.disabled = true;
    const original = publishBtn.textContent;
    publishBtn.textContent = 'Publishing...';
    try {
      const result = await Store.publishSiteContent();
      toast(result.ok ? 'Website updated for all visitors' : result.error);
    } catch (error) {
      toast('Could not publish: ' + error.message);
    } finally {
      publishBtn.disabled = false;
      publishBtn.textContent = original;
    }
  });

  document.getElementById('companySettingsForm').addEventListener('submit', event => {
    event.preventDefault(); Store.updateSiteSettings(Object.fromEntries(new FormData(event.currentTarget).entries())); toast('Company details saved');
  });
  document.querySelectorAll('#paletteForm input[type="color"]').forEach(input => input.addEventListener('input', () => {
    updateColorLabels();
    const preview = Object.fromEntries(new FormData(document.getElementById('paletteForm')).entries());
    document.documentElement.style.setProperty('--navy-900', preview.navy); document.documentElement.style.setProperty('--navy-800', preview.navy); document.documentElement.style.setProperty('--blue-500', preview.primary); document.documentElement.style.setProperty('--cyan-300', preview.accent);
  }));
  document.getElementById('paletteForm').addEventListener('submit', event => {
    event.preventDefault(); Store.updateSiteSettings(Object.fromEntries(new FormData(event.currentTarget).entries())); toast('Website color palette saved');
  });
  document.getElementById('exportReportBtn').addEventListener('click', () => AdminUI.exportReport());

  /* ---------- reusable record forms ---------- */
  const recordModal = document.getElementById('recordModal');
  const recordForm = document.getElementById('recordForm');
  let recordType = null;
  let editingRecordId = null;
  const recordConfigs = {
    customer: { title: 'Customer', collection: 'customers', prefix: 'CUS', fields: [
      ['name', 'Customer name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'tel'], ['joined', 'Joined date', 'date'], ['address', 'Full address', 'text'], ['source', 'Customer source', 'select', ['Website', 'Sales Associate', 'Referral', 'Water quiz', 'Phone inquiry']], ['assignedSalesId', 'Assigned sales ID', 'text'], ['notes', 'Customer notes', 'text']
    ] },
    subscription: { title: 'Subscription', collection: 'subscriptions', prefix: 'SUB', fields: [
      ['customer', 'Customer name', 'text'], ['email', 'Email', 'email'], ['system', 'Filtration system', 'text'], ['cadence', 'Renewal cadence', 'select', ['3 months', '6 months', '12 months']], ['nextDate', 'Next renewal', 'date'], ['replacement', 'Replacement kit', 'text'], ['status', 'Status', 'select', ['Active', 'Paused']]
    ] },
    job: { title: 'Service Job', collection: 'jobs', prefix: 'JOB', fields: [
      ['customer', 'Customer name', 'text'], ['address', 'Service address', 'text'], ['borough', 'Borough', 'select', ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island']], ['type', 'Job type', 'select', ['New installation', 'Filter replacement', 'Annual maintenance', 'Repair visit']], ['product', 'Product / system', 'text'], ['requirements', 'Installation requirements', 'text'], ['date', 'Service date', 'date'], ['time', 'Arrival time', 'time'], ['technician', 'Technician', 'select', ['Needs assignment']], ['status', 'Status', 'select', ['Needs assignment', 'Assigned', 'Confirmed']]
    ] },
    staff: { title: 'Staff Profile', collection: 'staff', prefix: 'STAFF', fields: [
      ['name', 'Full name', 'text'], ['role', 'Primary role', 'select', ['Technician', 'Sales Associate', 'Manager']], ['email', 'Work email', 'email'], ['phone', 'Phone', 'tel'], ['area', 'Coverage area', 'text'], ['availability', 'Availability', 'select', ['Available', 'On job', 'Off duty']]
    ] },
    supplierProfile: { title: 'Supplier Profile', collection: 'supplierProfiles', prefix: 'SUP', fields: [
      ['name', 'Supplier name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'tel'], ['address', 'Address', 'text'], ['categories', 'Product categories', 'text'], ['leadTime', 'Typical lead time', 'text'], ['rating', 'Supplier rating', 'number'], ['status', 'Status', 'select', ['Active', 'On hold', 'Inactive']], ['notes', 'Supplier notes', 'text']
    ] },
    supplier: { title: 'Purchase Order', collection: 'suppliers', prefix: 'PO', fields: [
      ['supplier', 'Supplier', 'text'], ['category', 'Product category', 'text'], ['contact', 'Contact email', 'email'], ['amount', 'Order amount', 'number'], ['eta', 'Estimated delivery', 'date'], ['tracking', 'Tracking number', 'text'], ['status', 'Status', 'select', ['Draft', 'Confirmed', 'In transit']]
    ] },
    lead: { title: 'Lead', collection: 'leads', prefix: 'LEAD', fields: [
      ['name', 'Customer name', 'text'], ['email', 'Email', 'email'], ['source', 'Lead source', 'select', ['Website quote', 'Water quiz', 'Referral', 'Phone inquiry']], ['interest', 'Product interest', 'text'], ['borough', 'Borough', 'select', ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island']], ['value', 'Estimated value', 'number'], ['followUp', 'Follow-up date', 'date'], ['stage', 'Pipeline stage', 'select', ['New', 'Qualified', 'Quote sent', 'Won']]
    ] },
    campaign: { title: 'Campaign', collection: 'campaigns', prefix: 'CAM', fields: [
      ['name', 'Campaign name', 'text'], ['channel', 'Channel', 'select', ['Email', 'SMS', 'Email + SMS']], ['audience', 'Audience list', 'text'], ['sent', 'Contacts', 'number'], ['conversion', 'Conversion goal (%)', 'number'], ['status', 'Status', 'select', ['Draft', 'Scheduled', 'Active']]
    ] },
    discount: { title: 'Discount Code', collection: 'discounts', prefix: 'CODE', fields: [
      ['id', 'Discount code', 'text'], ['type', 'Offer', 'text'], ['limit', 'Usage limit (0 for unlimited)', 'number'], ['expires', 'Expiration date', 'date'], ['status', 'Status', 'select', ['Active', 'Paused']]
    ] },
    ticket: { title: 'Support Ticket', collection: 'tickets', prefix: 'TKT', fields: [
      ['customer', 'Customer', 'text'], ['subject', 'Issue summary', 'text'], ['type', 'Request type', 'select', ['Troubleshooting', 'Warranty', 'Return', 'General question']], ['priority', 'Priority', 'select', ['Low', 'Normal', 'High']], ['channel', 'Channel', 'select', ['Email', 'Chat', 'Phone']], ['status', 'Status', 'select', ['Open', 'In progress', 'Waiting on customer']]
    ] },
    content: { title: 'Website Content', collection: 'content', prefix: 'CNT', fields: [
      ['type', 'Content type', 'select', ['FAQ', 'Promotion', 'Banner', 'Review']], ['title', 'Title', 'text'], ['placement', 'Website placement', 'text'], ['status', 'Status', 'select', ['Draft', 'Needs approval', 'Published']]
    ] }
  };

  function fieldMarkup(field, value = '') {
    const [name, label, type, options] = field;
    if (type === 'select') return `<div class="field"><label for="record-${name}">${label}</label><select id="record-${name}" name="${name}" required>${options.map(option => `<option ${option === value ? 'selected' : ''}>${option}</option>`).join('')}</select></div>`;
    return `<div class="field"><label for="record-${name}">${label}</label><input id="record-${name}" name="${name}" type="${type}" value="${value || ''}" ${type === 'number' ? 'min="0" step="0.01"' : ''} required></div>`;
  }

  function openRecordModal(type, id = null) {
    const config = recordConfigs[type];
    if (!config) return;
    recordType = type; editingRecordId = id;
    const existing = id ? Store.getAdminData()[config.collection].find(item => item.id === id) : null;
    document.getElementById('recordModalTitle').textContent = `${id ? 'Edit' : 'Add'} ${config.title}`;
    document.getElementById('recordFields').innerHTML = config.fields.map(field => fieldMarkup(field, existing ? existing[field[0]] : '')).join('');
    recordModal.classList.add('open');
  }
  function closeRecordModal() { recordModal.classList.remove('open'); recordForm.reset(); recordType = null; editingRecordId = null; }
  document.querySelectorAll('[data-open-record]').forEach(btn => btn.addEventListener('click', () => openRecordModal(btn.dataset.openRecord)));
  document.getElementById('recordCancel').addEventListener('click', closeRecordModal);
  recordModal.addEventListener('click', event => { if (event.target === recordModal) closeRecordModal(); });
  recordForm.addEventListener('submit', event => {
    event.preventDefault();
    const config = recordConfigs[recordType];
    const values = Object.fromEntries(new FormData(recordForm).entries());
    if (recordType === 'supplier') values.amount = Number(values.amount);
    if (recordType === 'supplierProfile') values.rating = Number(values.rating);
    if (recordType === 'lead') values.value = Number(values.value);
    if (recordType === 'campaign') { values.sent = Number(values.sent); values.conversion = Number(values.conversion); }
    if (recordType === 'discount') { values.usage = 0; values.limit = Number(values.limit); values.id = values.id.toUpperCase(); }
    if (recordType === 'ticket') values.updated = new Date().toISOString().slice(0, 10);
    if (recordType === 'content') values.updated = new Date().toISOString().slice(0, 10);
    if (recordType === 'customer' && !editingRecordId) Object.assign(values, { products: [], cart: [], installed: [] });
    if (recordType === 'staff') {
      values.initials = values.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
      const existingStaff = editingRecordId ? Store.getAdminData().staff.find(member => member.id === editingRecordId) : null;
      values.roles = existingStaff ? [...new Set([values.role, ...staffRoles(existingStaff).filter(role => role !== existingStaff.role)])] : [values.role];
      if (!editingRecordId) { values.rating = 5; values.jobs = 0; values.photo = ''; }
    }
    if (recordType === 'job' && !editingRecordId) Object.assign(values, { checklist: [{ label: 'Confirm customer and system', done: false }, { label: 'Photograph pre-job condition', done: false }, { label: 'Complete installation requirements', done: false }, { label: 'Pressure and leak test', done: false }, { label: 'Record finished-job photo', done: false }], checklistDone: 0, checklistTotal: 5, beforePhoto: '', afterPhoto: '' });
    if (editingRecordId) Store.updateAdminItem(config.collection, editingRecordId, values);
    else {
      const staffPrefix = recordType === 'staff' ? ({ Technician: 'TEC', 'Sales Associate': 'SAL', Manager: 'MGR' }[values.role] || 'STF') : config.prefix;
      Store.addAdminItem(config.collection, { id: `${staffPrefix}-${String(Date.now()).slice(-5)}`, ...values });
    }
    closeRecordModal(); renderAll(); toast(`${config.title} saved`);
  });

  /* ---------- product modal (add / edit) ---------- */
  const modal = document.getElementById('productModal');
  const form = document.getElementById('productForm');
  const imgDrop = document.getElementById('imgDrop');
  const imgInput = document.getElementById('imgInput');
  const previewWrap = document.getElementById('imgPreviewWrap');
  const mediaGrid = document.getElementById('productMediaGrid');
  const featureRows = document.getElementById('featureRows');
  let editingId = null;
  let productImages = [];
  let featureItems = [];
  let systemFilterTags = [];
  let replacementFilterTags = [];

  const productFieldIds = [
    'pName', 'pSku', 'pModel', 'pCat', 'pStatus', 'pBadge', 'pInstallTime', 'pPrice', 'pCompare', 'pCost', 'pStock',
    'pShort', 'pDesc', 'pSystemStyle', 'pGpd', 'pStages', 'pDrainRatio', 'pPower', 'pVoltage', 'pPressure', 'pDimensions',
    'pWeight', 'pFilterType', 'pFilterMedia', 'pMicron', 'pMembraneGpd', 'pServiceLife', 'pCapacityGallons',
    'pFilterDimensions', 'pConnector', 'pWarrantyMonths', 'pReturnDays', 'pCertifications', 'pManualUrl', 'pWarrantyNotes'
  ];
  const escapeMarkup = value => String(value || '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  const valueOf = id => document.getElementById(id).value.trim();
  const numberOrNull = id => {
    const value = valueOf(id);
    return value === '' ? null : Number(value);
  };
  const setProductField = (id, value = '') => { document.getElementById(id).value = value ?? ''; };
  const normalizedTag = value => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  function renderMediaGallery() {
    document.getElementById('mediaCount').textContent = `${productImages.length} / 8`;
    previewWrap.innerHTML = `<p><span class="ic" style="width:22px;height:22px;color:var(--blue-500);">${svgIcon('camera')}</span><br>${productImages.length ? 'Add more product photos' : 'Add product photos'}<br><small>PNG, JPG, or WebP · drag and drop or browse</small></p>`;
    mediaGrid.innerHTML = productImages.map((image, index) => `<article class="product-media-item${index === 0 ? ' is-primary' : ''}"><img src="${escapeMarkup(image)}" alt="Product media ${index + 1}"><div><strong>${index === 0 ? 'Primary image' : `Image ${index + 1}`}</strong><span>${index === 0 ? 'Shown first on the storefront' : 'Additional gallery view'}</span></div><div class="product-media-actions">${index === 0 ? '' : `<button type="button" data-media-action="primary" data-index="${index}">Set primary</button>`}<button type="button" data-media-action="remove" data-index="${index}" aria-label="Remove image ${index + 1}">Remove</button></div></article>`).join('');
  }

  function renderFeatureRows() {
    if (!featureItems.length) featureItems = [''];
    featureRows.innerHTML = featureItems.map((feature, index) => `<div class="feature-row"><span aria-hidden="true">${index + 1}</span><label class="sr-only" for="productFeature-${index}">Feature ${index + 1}</label><input id="productFeature-${index}" value="${escapeMarkup(feature)}" placeholder="For example: 600 GPD high-flow membrane" data-feature-index="${index}"><button type="button" data-feature-remove="${index}" aria-label="Remove feature ${index + 1}">&times;</button></div>`).join('');
  }

  function renderTagList(targetId, tags, label) {
    document.getElementById(targetId).innerHTML = tags.length
      ? tags.map(tag => `<button type="button" class="tag-chip" data-tag-list="${targetId}" data-tag="${escapeMarkup(tag)}" aria-label="Remove ${label} ${escapeMarkup(tag)}">${escapeMarkup(tag)} <span aria-hidden="true">&times;</span></button>`).join('')
      : `<span class="tag-empty">No tags added yet.</span>`;
  }

  function renderProductTags() {
    renderTagList('filterTagList', systemFilterTags, 'required filter tag');
    renderTagList('replacementTagList', replacementFilterTags, 'filter tag');
  }

  function addTag(inputId, collectionName) {
    const input = document.getElementById(inputId);
    const tag = normalizedTag(input.value);
    if (!tag) return;
    const collection = collectionName === 'system' ? systemFilterTags : replacementFilterTags;
    if (!collection.includes(tag)) collection.push(tag);
    input.value = '';
    renderProductTags();
    input.focus();
  }

  function updateCategoryFields() {
    const category = document.getElementById('pCat').value;
    document.getElementById('systemProductFields').hidden = !['Reverse Osmosis', 'Whole House', 'Countertop'].includes(category);
    document.getElementById('filterProductFields').hidden = category !== 'Replacement Filters';
  }

  function openModal(prod) {
    editingId = prod ? prod.id : null;
    productImages = prod?.images?.length ? [...prod.images] : (prod?.image ? [prod.image] : []);
    featureItems = prod?.specs?.length ? [...prod.specs] : [''];
    systemFilterTags = [...(prod?.requiredFilterTypes || [])];
    replacementFilterTags = [...(prod?.filterTypeTags || [])];
    document.getElementById('modalTitle').textContent = prod ? 'Edit Product' : 'Add New Product';
    setProductField('pName', prod?.name);
    setProductField('pSku', prod?.sku);
    setProductField('pModel', prod?.model);
    setProductField('pCat', prod?.category || 'Reverse Osmosis');
    setProductField('pStatus', prod?.status || 'active');
    setProductField('pBadge', prod?.badge);
    setProductField('pPrice', prod?.price);
    setProductField('pCompare', prod?.comparePrice);
    setProductField('pCost', prod?.cost);
    setProductField('pStock', prod?.stock);
    setProductField('pInstallTime', String(prod?.installationMinutes || 30));
    setProductField('pShort', prod?.short);
    setProductField('pDesc', prod?.description);
    setProductField('pSystemStyle', prod?.systemStyle);
    setProductField('pGpd', prod?.gpd);
    setProductField('pStages', prod?.filtrationStages);
    setProductField('pDrainRatio', prod?.pureToDrainRatio);
    setProductField('pPower', prod?.powerRequirement);
    setProductField('pVoltage', prod?.voltage);
    setProductField('pPressure', prod?.inletPressure);
    setProductField('pDimensions', prod?.dimensions);
    setProductField('pWeight', prod?.weight);
    setProductField('pFilterType', prod?.filterType);
    setProductField('pFilterMedia', prod?.filterMedia);
    setProductField('pMicron', prod?.micronRating);
    setProductField('pMembraneGpd', prod?.membraneGpd);
    setProductField('pServiceLife', prod?.serviceLifeMonths);
    setProductField('pCapacityGallons', prod?.capacityGallons);
    setProductField('pFilterDimensions', prod?.filterDimensions);
    setProductField('pConnector', prod?.connectorSize);
    setProductField('pWarrantyMonths', prod?.warrantyMonths);
    setProductField('pReturnDays', prod?.returnWindowDays);
    setProductField('pCertifications', (prod?.certifications || []).join(', '));
    setProductField('pManualUrl', prod?.manualUrl);
    setProductField('pWarrantyNotes', prod?.warrantyNotes);
    renderMediaGallery();
    renderFeatureRows();
    renderProductTags();
    updateCategoryFields();
    document.getElementById('prodError').classList.remove('show');
    modal.classList.add('open');
    document.body.classList.add('modal-open');
    window.setTimeout(() => document.getElementById('pName').focus(), 0);
  }
  function closeModal() {
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
    form.reset();
    productFieldIds.forEach(id => { const field = document.getElementById(id); if (field) field.value = ''; });
    productImages = []; featureItems = []; systemFilterTags = []; replacementFilterTags = []; editingId = null;
  }

  async function readImages(files) {
    const availableSlots = Math.max(0, 8 - productImages.length);
    const accepted = [...files].filter(file => file.type.startsWith('image/')).slice(0, availableSlots);
    if (!accepted.length) { if (!availableSlots) toast('This product already has eight photos'); return; }
    toast(accepted.length > 1 ? `Uploading ${accepted.length} photos...` : 'Uploading photo...');
    const results = await Promise.all(
      accepted.map(file => window.CrystalinaData.uploadImage(file, { folder: 'products' }))
    );
    const failed = results.filter(result => !result.ok);
    if (failed.length) toast(failed[0].error);
    const additions = results.filter(result => result.ok).map(result => result.url);
    if (!additions.length) return;
    productImages.push(...additions);
    renderMediaGallery();
  }

  imgDrop.addEventListener('click', () => imgInput.click());
  imgDrop.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); imgInput.click(); } });
  imgInput.addEventListener('change', async () => { await readImages(imgInput.files); imgInput.value = ''; });
  imgDrop.addEventListener('dragover', e => { e.preventDefault(); imgDrop.classList.add('drag'); });
  imgDrop.addEventListener('dragleave', () => imgDrop.classList.remove('drag'));
  imgDrop.addEventListener('drop', async e => { e.preventDefault(); imgDrop.classList.remove('drag'); await readImages(e.dataTransfer.files); });
  mediaGrid.addEventListener('click', event => {
    const button = event.target.closest('[data-media-action]');
    if (!button) return;
    const index = Number(button.dataset.index);
    if (button.dataset.mediaAction === 'remove') productImages.splice(index, 1);
    if (button.dataset.mediaAction === 'primary' && productImages[index]) productImages.unshift(productImages.splice(index, 1)[0]);
    renderMediaGallery();
  });
  featureRows.addEventListener('input', event => {
    if (!event.target.matches('[data-feature-index]')) return;
    featureItems[Number(event.target.dataset.featureIndex)] = event.target.value;
  });
  featureRows.addEventListener('click', event => {
    const button = event.target.closest('[data-feature-remove]');
    if (!button) return;
    featureItems.splice(Number(button.dataset.featureRemove), 1);
    renderFeatureRows();
  });
  document.getElementById('addFeatureBtn').addEventListener('click', () => {
    featureItems.push(''); renderFeatureRows();
    [...featureRows.querySelectorAll('[data-feature-index]')].at(-1)?.focus();
  });
  document.getElementById('pCat').addEventListener('change', updateCategoryFields);
  document.getElementById('addFilterTagBtn').addEventListener('click', () => addTag('pFilterTagInput', 'system'));
  document.getElementById('addReplacementTagBtn').addEventListener('click', () => addTag('pReplacementTagInput', 'replacement'));
  ['pFilterTagInput', 'pReplacementTagInput'].forEach(id => document.getElementById(id).addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addTag(id, id === 'pFilterTagInput' ? 'system' : 'replacement');
  }));
  modal.addEventListener('click', event => {
    const chip = event.target.closest('[data-tag-list]');
    if (!chip) return;
    const collection = chip.dataset.tagList === 'filterTagList' ? systemFilterTags : replacementFilterTags;
    const index = collection.indexOf(chip.dataset.tag);
    if (index >= 0) collection.splice(index, 1);
    renderProductTags();
  });

  document.getElementById('addProductBtn').addEventListener('click', () => openModal(null));
  document.getElementById('deleteAllProductsBtn').addEventListener('click', () => {
    if (confirm('Delete every product from the catalog? This removes the entire browser-stored product list.')) {
      Store.deleteAllProducts(); renderAll(); toast('All products deleted');
    }
  });
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('modalClose').addEventListener('click', closeModal);
  modal.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); closeModal(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...modal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')].filter(element => !element.closest('[hidden]'));
    const first = focusable[0]; const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = valueOf('pName');
    const price = Number(valueOf('pPrice'));
    const stock = Number(valueOf('pStock'));
    const compare = numberOrNull('pCompare');
    const err = document.getElementById('prodError');
    if (compare && compare <= price) {
      err.textContent = 'Compare-at price should be higher than the sale price.';
      err.classList.add('show'); return;
    }
    const category = valueOf('pCat');
    const existing = editingId ? Store.getProduct(editingId) : null;
    const wasEditing = Boolean(editingId);
    const id = editingId || ('p-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36));
    Store.upsertProduct({
      id, name,
      sku: valueOf('pSku'), model: valueOf('pModel'), category, status: valueOf('pStatus'),
      productKind: ['Reverse Osmosis', 'Whole House', 'Countertop'].includes(category) ? 'system' : (category === 'Replacement Filters' ? (existing?.productKind === 'filter_bundle' ? 'filter_bundle' : 'replacement_filter') : (existing?.productKind || 'product')),
      badge: valueOf('pBadge') || null,
      price, comparePrice: compare, stock,
      cost: numberOrNull('pCost'), installationMinutes: Number(valueOf('pInstallTime')),
      short: valueOf('pShort'), description: valueOf('pDesc'), specs: featureItems.map(item => item.trim()).filter(Boolean),
      image: productImages[0] || Store.placeholder(name, Math.floor(Math.random() * 5)), images: [...productImages],
      systemStyle: valueOf('pSystemStyle'), gpd: numberOrNull('pGpd'), filtrationStages: numberOrNull('pStages'), pureToDrainRatio: valueOf('pDrainRatio'),
      powerRequirement: valueOf('pPower'), voltage: valueOf('pVoltage'), inletPressure: valueOf('pPressure'), dimensions: valueOf('pDimensions'), weight: valueOf('pWeight'),
      requiredFilterTypes: ['Reverse Osmosis', 'Whole House', 'Countertop'].includes(category) ? [...systemFilterTags] : [],
      filterType: valueOf('pFilterType'), filterMedia: valueOf('pFilterMedia'), micronRating: numberOrNull('pMicron'), membraneGpd: numberOrNull('pMembraneGpd'),
      serviceLifeMonths: numberOrNull('pServiceLife'), capacityGallons: numberOrNull('pCapacityGallons'), filterDimensions: valueOf('pFilterDimensions'), connectorSize: valueOf('pConnector'),
      filterTypeTags: category === 'Replacement Filters' ? [...replacementFilterTags] : [],
      warrantyMonths: numberOrNull('pWarrantyMonths'), returnWindowDays: numberOrNull('pReturnDays'),
      certifications: valueOf('pCertifications').split(',').map(item => item.trim()).filter(Boolean), manualUrl: valueOf('pManualUrl'), warrantyNotes: valueOf('pWarrantyNotes')
    });
    closeModal();
    renderAll();
    toast(wasEditing ? 'Product updated ✓' : 'Product added ✓');
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
    },
    deleteOrder(id) {
      if (!confirm(`Delete order ${id}? This removes the browser-stored order record.`)) return;
      Store.deleteOrder(id); renderAll(); toast(`Order ${id} deleted`);
    },
    toggleSubscription(id) {
      const item = Store.getAdminData().subscriptions.find(s => s.id === id);
      if (!item) return;
      Store.updateAdminItem('subscriptions', id, { status: item.status === 'Paused' ? 'Active' : 'Paused' });
      renderSubscriptions(); toast(`Subscription ${item.status === 'Paused' ? 'resumed' : 'paused'}`);
    },
    setJobStatus(id, status) {
      Store.updateAdminItem('jobs', id, { status }); renderService(); toast(`Job ${id} updated`);
    },
    assignTechnician(id, technician) {
      Store.updateAdminItem('jobs', id, { technician, status: technician === 'Needs assignment' ? 'Needs assignment' : 'Assigned' });
      renderService(); toast(`Technician assignment updated`);
    },
    setSupplierStatus(id, status) {
      Store.updateAdminItem('suppliers', id, { status }); renderSuppliers(); toast(`Purchase order ${id} updated`);
    },
    setLeadStage(id, stage) {
      Store.updateAdminItem('leads', id, { stage }); renderLeads(); toast(`Lead moved to ${stage}`);
    },
    setCampaignStatus(id, status) {
      Store.updateAdminItem('campaigns', id, { status }); renderMarketing(); toast(`Campaign status updated`);
    },
    setTicketStatus(id, status) {
      Store.updateAdminItem('tickets', id, { status, updated: new Date().toISOString().slice(0, 10) }); renderSupport(); toast(`Ticket ${id} updated`);
    },
    setContentStatus(id, status) {
      Store.updateAdminItem('content', id, { status, updated: new Date().toISOString().slice(0, 10) }); renderContent(); toast('Content status updated');
    },
    editSection(id) { openSectionModal(Store.getAdminData().pageSections.find(section => section.id === id)); },
    toggleSection(id, enabled) { Store.updateAdminItem('pageSections', id, { enabled }); renderContent(); toast(`Section ${enabled ? 'shown' : 'hidden'} on landing page`); },
    moveSection(id, direction) {
      const sections = [...Store.getAdminData().pageSections];
      const index = sections.findIndex(section => section.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= sections.length) return;
      [sections[index], sections[nextIndex]] = [sections[nextIndex], sections[index]];
      Store.saveAdminCollection('pageSections', sections); renderContent(); toast('Landing page order updated');
    },
    duplicateSection(id) {
      const sections = [...Store.getAdminData().pageSections];
      const index = sections.findIndex(section => section.id === id);
      if (index < 0) return;
      const duplicate = { ...sections[index], id: `custom-${Date.now()}`, type: 'Custom Section', label: `${sections[index].label} copy` };
      sections.splice(index + 1, 0, duplicate); Store.saveAdminCollection('pageSections', sections); renderContent(); toast('Section duplicated');
    },
    deleteSection(id) {
      const section = Store.getAdminData().pageSections.find(item => item.id === id);
      if (!section || !confirm(`Delete the ${section.label} landing-page section?`)) return;
      Store.deleteAdminItem('pageSections', id); renderContent(); toast('Landing page section deleted');
    },
    setRolePermissions(id, permissions) {
      Store.updateAdminItem('roles', id, { permissions }); renderSettings(); toast('Role permissions updated');
    },
    toggleStaffRole(id, role, checked) {
      const member = Store.getAdminData().staff.find(item => item.id === id);
      if (!member) return;
      let roles = staffRoles(member);
      roles = checked ? [...new Set([...roles, role])] : roles.filter(item => item !== role);
      if (!roles.length) { toast('Each employee must retain at least one role'); renderSettings(); return; }
      const primary = roles.includes(member.role) ? member.role : roles[0];
      Store.updateAdminItem('staff', id, { roles, role: primary });
      Store.logActivity(user.id, `${checked ? 'Assigned' : 'Removed'} ${role} role`, id); renderSettings(); renderStaff(); toast(`${member.name}'s access updated`);
    },
    setPrimaryRole(id, role) {
      const member = Store.getAdminData().staff.find(item => item.id === id);
      if (!member || !staffRoles(member).includes(role)) return;
      Store.updateAdminItem('staff', id, { role }); renderSettings(); renderStaff(); toast(`${member.name}'s primary role updated`);
    },
    exportReport() {
      const finance = Store.getAdminData().finance;
      const rows = [['Month', 'Revenue', 'Cost', 'Gross Profit', 'Orders'], ...finance.months.map(m => [m.month, m.revenue, m.cost, m.revenue - m.cost, m.orders])];
      const blob = new Blob([rows.map(row => row.join(',')).join('\n')], { type: 'text/csv' });
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'crystalina-finance-report.csv'; link.click(); URL.revokeObjectURL(link.href); toast('Finance report exported');
    },
    openCustomerProfile(id) {
      openCustomerProfile(Store.getAdminData().customers.find(customer => customer.id === id));
    },
    openCustomerByName(encodedName) {
      openCustomerProfile(findCustomerByName(decodeURIComponent(encodedName)));
    },
    openStaffProfile(id) { openStaffProfile(Store.getAdminData().staff.find(member => member.id === id)); },
    chooseStaffPhoto(id) { staffPhotoId = id; staffPhotoInput.click(); },
    openSupplierProfile(id) { openSupplierProfile(Store.getAdminData().supplierProfiles.find(profile => profile.id === id)); },
    openSupplierByName(encodedName) {
      const name = decodeURIComponent(encodedName); openSupplierProfile(Store.getAdminData().supplierProfiles.find(profile => profile.name === name));
    },
    composeAudience(type) {
      const data = Store.getAdminData();
      const count = type === 'pendingLeads' ? data.leads.filter(lead => !['Won', 'Lost'].includes(lead.stage)).length : data.abandonedCarts.filter(cart => cart.status === 'Pending').length;
      document.getElementById('audienceType').value = type; document.getElementById('audienceSummary').textContent = `${count} recipient(s) will be included in this automated outreach.`; audienceModal.classList.add('open');
    },
    composeCart(id) {
      document.getElementById('audienceType').value = `cart:${id}`; document.getElementById('audienceSummary').textContent = 'This recovery message will be sent to one abandoned-cart contact.'; audienceModal.classList.add('open');
    },
    composeMessage(customerId) {
      const customer = Store.getAdminData().customers.find(item => item.id === customerId) || Store.getAdminData().leads.find(item => item.id === customerId);
      document.getElementById('messageCustomerId').value = customerId;
      document.getElementById('messageTitle').value = '';
      document.getElementById('messageBody').value = '';
      if (customer && !customerId.startsWith('CUS-')) document.getElementById('messageChannel').value = 'Email';
      messageModal.classList.add('open');
    },
    deleteRecord(collection, id, encodedLabel) {
      const label = decodeURIComponent(encodedLabel);
      if (!confirm(`Delete ${label}? This removes the browser-stored record.`)) return;
      Store.deleteAdminItem(collection, id); profileModal.classList.remove('open'); renderAll(); toast(`${label} deleted`);
    },
    markDemoAction(message) { toast(message); },
    editRecord(type, id) {
      profileModal.classList.remove('open'); openRecordModal(type, id);
    }
  };

  function renderAll() {
    renderOverview(); renderProducts(); renderOrders(); renderCustomers();
    renderSubscriptions(); renderService(); renderStaff(); renderSuppliers();
    renderLeads(); renderMarketing(); renderSupport();
    renderContent(); renderFinance(); renderSettings();
    window.QRAdminUI?.render();
    window.AdminScheduleUI?.render();
  }
  renderAll();
})();
