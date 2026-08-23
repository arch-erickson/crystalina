/* ============================================================
   Crystalina, Admin Dashboard logic
   ============================================================ */

(() => {
  const user = Store.currentUser();
  if (!user || user.role !== 'admin') { location.href = '/signin/?mode=admin'; return; }
  document.getElementById('adminWho').textContent = 'Signed in as ' + user.name;

  document.getElementById('adminSignOut').addEventListener('click', () => {
    Store.signOut(); location.href = '/';
  });

  /* ---------- view switching ---------- */
  const views = ['overview', 'products', 'orders', 'customers', 'subscriptions', 'service', 'staff', 'suppliers', 'leads', 'marketing', 'support'];
  function showView(view, updateHash = true) {
    if (!views.includes(view)) view = 'overview';
    document.querySelectorAll('.side-link[data-view]').forEach(btn => btn.classList.toggle('active', btn.dataset.view === view));
    views.forEach(v => document.getElementById('view-' + v).style.display = v === view ? '' : 'none');
    if (updateHash) history.replaceState(null, '', '#' + view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  document.querySelectorAll('.side-link[data-view]').forEach(btn => btn.addEventListener('click', () => showView(btn.dataset.view)));
  document.querySelectorAll('[data-view-jump]').forEach(btn => btn.addEventListener('click', () => showView(btn.dataset.viewJump)));
  showView(location.hash.slice(1) || 'overview', false);

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
      : `<p style="color:var(--muted);font-size:.9rem;">No orders yet, they'll appear here as customers check out.</p>`;
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
        <td>${p.badge ? `<span class="admin-badge">${p.badge}</span>` : ', '}</td>
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
        <td>${o.customer.borough || ', '}${o.customer.installation ? '<br><small style="color:var(--blue-500)">+ installation</small>' : ''}</td>
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

  function renderSubscriptions() {
    const list = Store.getAdminData().subscriptions;
    const active = list.filter(s => s.status === 'Active');
    document.getElementById('subscriptionStats').innerHTML =
      statCard('Active plans', active.length, `${list.filter(s => s.status === 'Paused').length} currently paused`) +
      statCard('Next 30 days', active.length, 'scheduled renewals') +
      statCard('Projected value', money(active.length * 64.99), 'next replacement cycle');
    document.getElementById('replacementCount').textContent = `${active.length} upcoming`;
    document.querySelector('#subscriptionsTable tbody').innerHTML = list.map(s => `<tr>
      <td><strong>${s.customer}</strong><br><small>${s.email}</small></td>
      <td>${s.system}</td><td>${s.cadence}</td><td>${formatDate(s.nextDate)}</td><td>${s.replacement}</td>
      <td><span class="record-status ${statusClass(s.status)}">${s.status}</span></td>
      <td><div class="table-actions"><button class="btn btn-sm btn-outline" onclick="AdminUI.toggleSubscription('${s.id}')">${s.status === 'Paused' ? 'Resume' : 'Pause'}</button><button class="btn btn-sm btn-ghost" onclick="AdminUI.editRecord('subscription','${s.id}')">Edit</button></div></td>
    </tr>`).join('');
  }

  let jobFilter = 'all';
  function renderService() {
    const allJobs = Store.getAdminData().jobs;
    const jobs = jobFilter === 'unassigned' ? allJobs.filter(j => j.status === 'Needs assignment') : allJobs;
    document.getElementById('serviceStats').innerHTML =
      statCard('Upcoming jobs', allJobs.length, 'across the next 7 days') +
      statCard('Needs assignment', allJobs.filter(j => j.status === 'Needs assignment').length, 'requires dispatch') +
      statCard('QC complete', allJobs.filter(j => j.beforePhoto && j.afterPhoto).length, 'before and finish photos');
    document.querySelector('#jobsTable tbody').innerHTML = jobs.map(j => {
      const pct = Math.round((j.checklistDone / j.checklistTotal) * 100);
      return `<tr>
        <td><strong>${formatDate(j.date)}</strong><br><small>${j.time}</small></td>
        <td><strong>${j.customer}</strong><br><small>${j.address}, ${j.borough}</small></td>
        <td>${j.type}</td>
        <td><select class="admin-select" onchange="AdminUI.assignTechnician('${j.id}',this.value)"><option ${j.technician === 'Needs assignment' ? 'selected' : ''}>Needs assignment</option>${Store.getAdminData().staff.filter(s => s.role.includes('Technician')).map(s => `<option ${s.name === j.technician ? 'selected' : ''}>${s.name}</option>`).join('')}</select></td>
        <td><select class="admin-select" onchange="AdminUI.setJobStatus('${j.id}',this.value)">${['Needs assignment', 'Assigned', 'Confirmed', 'In progress', 'Completed', 'Cancelled'].map(s => `<option ${s === j.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
        <td><button class="photo-chip" onclick="AdminUI.advanceChecklist('${j.id}')"><span class="progress-compact"><span>${j.checklistDone} of ${j.checklistTotal} complete</span><span class="progress-track"><i style="width:${pct}%"></i></span></span></button></td>
        <td><div class="photo-actions"><button class="photo-chip ${j.beforePhoto ? 'has-photo' : ''}" onclick="AdminUI.chooseJobPhoto('${j.id}','beforePhoto')">${j.beforePhoto ? 'Pre-job saved' : 'Add pre-job'}</button><button class="photo-chip ${j.afterPhoto ? 'has-photo' : ''}" onclick="AdminUI.chooseJobPhoto('${j.id}','afterPhoto')">${j.afterPhoto ? 'Finish saved' : 'Add finish'}</button></div></td>
      </tr>`;
    }).join('') || `<tr><td colspan="7">No jobs match this filter.</td></tr>`;
  }

  function renderStaff() {
    document.getElementById('staffGrid').innerHTML = Store.getAdminData().staff.map(s => `<article class="staff-card">
      <div class="staff-card-head"><div class="staff-avatar">${s.initials}</div><div><h3>${s.name}</h3><div class="staff-role">${s.role}</div></div></div>
      <div class="staff-details"><span><strong>Coverage:</strong> ${s.area}</span><span><strong>Schedule:</strong> <span class="record-status ${statusClass(s.availability)}">${s.availability}</span></span><span>${s.email}<br>${s.phone}</span></div>
      <div class="staff-metrics"><div class="staff-metric"><strong>${s.rating}</strong><span>Review score</span></div><div class="staff-metric"><strong>${s.jobs}</strong><span>Jobs completed</span></div></div>
      <button class="btn btn-sm btn-outline btn-block" onclick="AdminUI.editRecord('staff','${s.id}')">Edit Profile &amp; Schedule</button>
    </article>`).join('');
  }

  function renderSuppliers() {
    const list = Store.getAdminData().suppliers;
    document.getElementById('supplierStats').innerHTML =
      statCard('Open purchase orders', list.filter(p => p.status !== 'Delivered').length, 'awaiting delivery') +
      statCard('In transit', list.filter(p => p.status === 'In transit').length, 'active shipment') +
      statCard('Committed spend', money(list.filter(p => p.status !== 'Delivered').reduce((sum, p) => sum + Number(p.amount), 0)), 'open purchase orders');
    document.querySelector('#suppliersTable tbody').innerHTML = list.map(p => `<tr>
      <td><strong>${p.id}</strong></td><td><strong>${p.supplier}</strong><br><small>${p.contact}</small></td><td>${p.category}</td><td>${money(p.amount)}</td><td>${formatDate(p.eta)}</td><td><span class="admin-badge">${p.tracking}</span></td>
      <td><select class="admin-select" onchange="AdminUI.setSupplierStatus('${p.id}',this.value)">${['Draft', 'Confirmed', 'In transit', 'Delayed', 'Delivered'].map(s => `<option ${s === p.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
    </tr>`).join('');
  }

  function renderLeads() {
    const leads = Store.getAdminData().leads;
    const open = leads.filter(l => l.stage !== 'Won' && l.stage !== 'Lost');
    const value = open.reduce((sum, lead) => sum + Number(lead.value), 0);
    document.getElementById('leadStats').innerHTML =
      statCard('Open opportunities', open.length, 'active conversations') +
      statCard('Pipeline value', money(value), 'estimated sales') +
      statCard('Follow-ups due', leads.filter(l => l.followUp <= '2026-08-25' && l.stage !== 'Won').length, 'today and overdue');
    const stages = ['New', 'Qualified', 'Quote sent', 'Won'];
    document.getElementById('leadPipeline').innerHTML = stages.map(stage => `<div class="pipeline-stage"><span>${stage}</span><strong>${leads.filter(l => l.stage === stage).length}</strong></div>`).join('');
    document.querySelector('#leadsTable tbody').innerHTML = leads.map(l => `<tr>
      <td><strong>${l.name}</strong><br><small>${l.email}</small></td><td>${l.interest}</td><td>${l.source}</td><td>${l.borough}</td><td><strong>${money(Number(l.value))}</strong></td><td>${formatDate(l.followUp)}</td>
      <td><select class="admin-select" onchange="AdminUI.setLeadStage('${l.id}',this.value)">${['New', 'Qualified', 'Quote sent', 'Won', 'Lost'].map(s => `<option ${s === l.stage ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
    </tr>`).join('');
  }

  function renderMarketing() {
    const data = Store.getAdminData();
    const avgConversion = data.campaigns.reduce((sum, c) => sum + Number(c.conversion), 0) / Math.max(data.campaigns.length, 1);
    document.getElementById('marketingStats').innerHTML =
      statCard('List size', '2,418', 'email and SMS contacts') +
      statCard('Average conversion', `${avgConversion.toFixed(1)}%`, 'across current campaigns') +
      statCard('Referral sales', money(7260), 'this quarter') +
      statCard('Abandoned carts', '23', '$4,860 recoverable value');
    document.querySelector('#campaignsTable tbody').innerHTML = data.campaigns.map(c => `<tr>
      <td><strong>${c.name}</strong><br><small>${c.channel}</small></td><td>${c.audience}</td><td>${Number(c.sent).toLocaleString()}</td><td><strong>${c.conversion}%</strong></td>
      <td><select class="admin-select" onchange="AdminUI.setCampaignStatus('${c.id}',this.value)">${['Draft', 'Scheduled', 'Active', 'Paused', 'Completed'].map(s => `<option ${s === c.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
    </tr>`).join('');
    document.querySelector('#discountsTable tbody').innerHTML = data.discounts.map(d => `<tr><td><strong>${d.id}</strong></td><td>${d.type}</td><td>${d.usage}${Number(d.limit) ? ` / ${d.limit}` : ''}</td><td>${formatDate(d.expires)}</td><td><span class="record-status ${statusClass(d.status)}">${d.status}</span></td></tr>`).join('');
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
      <td><strong>${t.id}</strong><br><small>${t.channel}</small></td><td>${t.customer}</td><td><strong>${t.subject}</strong><br><button class="link-button" onclick="AdminUI.markDemoAction('Conversation history opened')">View notes &amp; history</button></td><td>${t.type}</td><td><span class="record-status ${t.priority === 'High' ? 'is-danger' : t.priority === 'Normal' ? 'is-warning' : ''}">${t.priority}</span></td><td>${formatDate(t.updated)}</td>
      <td><select class="admin-select" onchange="AdminUI.setTicketStatus('${t.id}',this.value)">${['Open', 'In progress', 'Waiting on customer', 'Resolved'].map(s => `<option ${s === t.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
    </tr>`).join('') || `<tr><td colspan="7">No tickets match this filter.</td></tr>`;
  }

  document.querySelectorAll('[data-job-filter]').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('[data-job-filter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); jobFilter = btn.dataset.jobFilter; renderService();
  }));
  document.querySelectorAll('[data-ticket-filter]').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('[data-ticket-filter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); ticketFilter = btn.dataset.ticketFilter; renderSupport();
  }));

  let pendingPhoto = null;
  const jobPhotoInput = document.getElementById('jobPhotoInput');
  jobPhotoInput.addEventListener('change', () => {
    const file = jobPhotoInput.files[0];
    if (!file || !pendingPhoto) return;
    if (file.size > 2.5 * 1024 * 1024) { toast('Photo too large, please keep under 2.5 MB'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      Store.updateAdminItem('jobs', pendingPhoto.id, { [pendingPhoto.field]: reader.result });
      pendingPhoto = null; jobPhotoInput.value = ''; renderService(); toast('Quality-control photo saved');
    };
    reader.readAsDataURL(file);
  });

  /* ---------- reusable record forms ---------- */
  const recordModal = document.getElementById('recordModal');
  const recordForm = document.getElementById('recordForm');
  let recordType = null;
  let editingRecordId = null;
  const recordConfigs = {
    subscription: { title: 'Subscription', collection: 'subscriptions', prefix: 'SUB', fields: [
      ['customer', 'Customer name', 'text'], ['email', 'Email', 'email'], ['system', 'Filtration system', 'text'], ['cadence', 'Renewal cadence', 'select', ['3 months', '6 months', '12 months']], ['nextDate', 'Next renewal', 'date'], ['replacement', 'Replacement kit', 'text'], ['status', 'Status', 'select', ['Active', 'Paused']]
    ] },
    job: { title: 'Service Job', collection: 'jobs', prefix: 'JOB', fields: [
      ['customer', 'Customer name', 'text'], ['address', 'Service address', 'text'], ['borough', 'Borough', 'select', ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island']], ['type', 'Job type', 'select', ['New installation', 'Filter replacement', 'Annual maintenance', 'Repair visit']], ['date', 'Service date', 'date'], ['time', 'Arrival time', 'time'], ['technician', 'Technician', 'select', ['Needs assignment', 'Luis Rivera', 'Amina Patel']], ['status', 'Status', 'select', ['Needs assignment', 'Assigned', 'Confirmed']]
    ] },
    staff: { title: 'Staff Profile', collection: 'staff', prefix: 'STAFF', fields: [
      ['name', 'Full name', 'text'], ['role', 'Role', 'select', ['Installation Technician', 'Lead Technician', 'Sales Representative']], ['email', 'Work email', 'email'], ['phone', 'Phone', 'tel'], ['area', 'Coverage area', 'text'], ['availability', 'Availability', 'select', ['Available', 'On job', 'Off duty']]
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
    if (recordType === 'lead') values.value = Number(values.value);
    if (recordType === 'campaign') { values.sent = Number(values.sent); values.conversion = Number(values.conversion); }
    if (recordType === 'discount') { values.usage = 0; values.limit = Number(values.limit); values.id = values.id.toUpperCase(); }
    if (recordType === 'ticket') values.updated = new Date().toISOString().slice(0, 10);
    if (recordType === 'staff') {
      values.initials = values.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
      if (!editingRecordId) { values.rating = 5; values.jobs = 0; }
    }
    if (recordType === 'job' && !editingRecordId) Object.assign(values, { checklistDone: 0, checklistTotal: 5, beforePhoto: '', afterPhoto: '' });
    if (editingRecordId) Store.updateAdminItem(config.collection, editingRecordId, values);
    else Store.addAdminItem(config.collection, { id: `${config.prefix}-${String(Date.now()).slice(-5)}`, ...values });
    closeRecordModal(); renderAll(); toast(`${config.title} saved`);
  });

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
      : `<p><span class="ic" style="width:22px;height:22px;color:var(--blue-500);">${svgIcon('camera')}</span><br>Click to upload or drag and drop<br><small>PNG or JPG, stored locally in this draft</small></p>`;
  }

  function readImage(file) {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 2.5 * 1024 * 1024) { toast('Image too large, please keep under 2.5 MB'); return; }
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
    advanceChecklist(id) {
      const job = Store.getAdminData().jobs.find(j => j.id === id);
      if (!job) return;
      const next = job.checklistDone >= job.checklistTotal ? 0 : job.checklistDone + 1;
      Store.updateAdminItem('jobs', id, { checklistDone: next }); renderService();
      toast(next === job.checklistTotal ? 'Maintenance checklist completed' : 'Checklist progress saved');
    },
    chooseJobPhoto(id, field) {
      pendingPhoto = { id, field }; jobPhotoInput.click();
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
    markDemoAction(message) { toast(message); },
    editRecord(type, id) {
      openRecordModal(type, id);
    }
  };

  function renderAll() {
    renderOverview(); renderProducts(); renderOrders(); renderCustomers();
    renderSubscriptions(); renderService(); renderStaff(); renderSuppliers();
    renderLeads(); renderMarketing(); renderSupport();
  }
  renderAll();
})();
