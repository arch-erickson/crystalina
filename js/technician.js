/* Crystalina technician portal, browser-backed prototype. */
(() => {
  const REQUIRED_ROLE = 'Technician';
  const auth = document.getElementById('portalAuth');
  const shell = document.getElementById('portalShell');
  const emailForm = document.getElementById('staffEmailForm');
  const codeForm = document.getElementById('staffCodeForm');
  const error = document.getElementById('portalError');
  let pendingEmail = '';
  let pendingPhoto = null;

  const defaultChecklist = job => [
    { label: 'Confirm customer and system', done: false },
    { label: 'Photograph pre-job condition', done: Boolean(job.beforePhoto) },
    { label: 'Complete installation requirements', done: false },
    { label: 'Pressure and leak test', done: false },
    { label: 'Record finished-job photo', done: Boolean(job.afterPhoto) }
  ];

  function showError(message) { error.textContent = message; error.classList.toggle('show', Boolean(message)); }
  function sessionIsValid(session) {
    return Boolean(session?.roles?.includes('technician'));
  }
  function showPortal(session) {
    auth.hidden = true; shell.hidden = false;
    document.getElementById('portalStaffName').textContent = session.name;
    document.getElementById('portalStaffId').textContent = session.id;
    renderJobs(session);
    window.dispatchEvent(new CustomEvent('staff-session-ready'));
    window.dispatchEvent(new CustomEvent('technician-session-ready'));
  }

  emailForm.addEventListener('submit', event => {
    event.preventDefault(); pendingEmail = document.getElementById('staffEmail').value.trim();
    const result = Store.requestStaffCode(pendingEmail, REQUIRED_ROLE);
    if (!result.ok) { showError(result.error); return; }
    showError(''); emailForm.hidden = true; codeForm.hidden = false;
    const note = document.getElementById('prototypeCode');
    note.hidden = false; note.innerHTML = `<strong>Prototype verification</strong><span>Email delivery will be connected with the backend. For this browser demo, use code <b>${result.demoCode}</b>.</span>`;
    document.getElementById('staffCode').focus();
  });
  codeForm.addEventListener('submit', event => {
    event.preventDefault();
    const result = Store.verifyStaffCode(pendingEmail, document.getElementById('staffCode').value.trim(), REQUIRED_ROLE);
    if (!result.ok) { showError(result.error); return; }
    showPortal(result.staff);
  });
  document.getElementById('changeStaffEmail').addEventListener('click', () => { codeForm.hidden = true; emailForm.hidden = false; document.getElementById('prototypeCode').hidden = true; showError(''); });
  document.getElementById('staffSignOut').addEventListener('click', async () => { try { const authClient = await window.CrystalinaAuth; await authClient.signOut(); } finally { Store.signOut(); Store.staffSignOut(); location.href = '/signin/?mode=staff'; } });

  function renderJobs(session = Store.currentStaff()) {
    const data = Store.getAdminData();
    const jobs = data.jobs.filter(job => job.technician === session.name);
    document.getElementById('technicianStats').innerHTML = `<div class="stat-card"><div class="sc-label">Assigned</div><div class="sc-value">${jobs.length}</div><div class="sc-hint">upcoming jobs</div></div><div class="stat-card"><div class="sc-label">In progress</div><div class="sc-value">${jobs.filter(job => job.status === 'In progress').length}</div><div class="sc-hint">active now</div></div><div class="stat-card"><div class="sc-label">QC complete</div><div class="sc-value">${jobs.filter(job => job.beforePhoto && job.afterPhoto).length}</div><div class="sc-hint">both photos saved</div></div>`;
    document.getElementById('technicianJobs').innerHTML = jobs.length ? jobs.map(job => {
      const checklist = job.checklist?.length ? job.checklist : defaultChecklist(job);
      const done = checklist.filter(item => item.done).length;
      return `<article class="portal-job-card"><div class="portal-job-head"><div><span class="admin-badge">${escapeHTML(job.id)}</span><h2>${escapeHTML(job.type)}</h2><button class="entity-link" onclick="TechnicianUI.openCustomer('${encodeURIComponent(job.customer)}')">${escapeHTML(job.customer)}</button><p>${escapeHTML(job.address)}, ${escapeHTML(job.borough)}</p></div><div><strong>${new Date(job.date + 'T12:00:00').toLocaleDateString('en-US', { dateStyle: 'medium' })}</strong><span>${escapeHTML(job.time)}</span></div></div><div class="portal-job-info"><div><span>Product / System</span><strong>${escapeHTML(job.product || 'System details pending')} · ${Number(job.installationMinutes || 30)} min service</strong></div><div><span>Installation Requirements</span><strong>${escapeHTML(job.requirements || 'Follow the standard Crystalina installation checklist.')}</strong></div></div><div class="field"><label>Status</label><select class="admin-select" onchange="TechnicianUI.updateStatus('${job.id}',this.value)">${['Assigned', 'Confirmed', 'En route', 'In progress', 'Needs follow-up', 'Completed'].map(status => `<option ${status === job.status ? 'selected' : ''}>${status}</option>`).join('')}</select></div><div class="job-checklist"><div class="panel-title-row"><h3>Installation Checklist</h3><span class="admin-badge">${done} of ${checklist.length}</span></div>${checklist.map((item, index) => `<label><input type="checkbox" ${item.done ? 'checked' : ''} onchange="TechnicianUI.toggleChecklist('${job.id}',${index},this.checked)"><span>${escapeHTML(item.label)}</span></label>`).join('')}</div><div class="job-photo-controls"><button class="photo-upload-card ${job.beforePhoto ? 'has-photo' : ''}" onclick="TechnicianUI.choosePhoto('${job.id}','beforePhoto')">${job.beforePhoto ? `<img src="${job.beforePhoto}" alt="Pre-job condition"><strong>Replace pre-job photo</strong>` : '<strong>Upload pre-job photo</strong><span>Required before work begins</span>'}</button><button class="photo-upload-card ${job.afterPhoto ? 'has-photo' : ''}" onclick="TechnicianUI.choosePhoto('${job.id}','afterPhoto')">${job.afterPhoto ? `<img src="${job.afterPhoto}" alt="Finished job"><strong>Replace finished-job photo</strong>` : '<strong>Upload finished-job photo</strong><span>Required before completion</span>'}</button></div></article>`;
    }).join('') : '<div class="admin-panel"><h3>No assigned jobs</h3><p class="admin-subtitle">New assignments from an administrator or manager will appear here.</p></div>';
  }

  const customerModal = document.getElementById('technicianCustomerModal');
  document.getElementById('technicianCustomerClose').addEventListener('click', () => customerModal.classList.remove('open'));
  customerModal.addEventListener('click', event => { if (event.target === customerModal) customerModal.classList.remove('open'); });
  const photoInput = document.getElementById('technicianPhotoInput');
  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0]; if (!file || !pendingPhoto) return;
    if (file.size > 2.5 * 1024 * 1024) { toast('Photo too large, keep it under 2.5 MB'); return; }
    const reader = new FileReader();
    reader.onload = () => { const session = Store.currentStaff(); Store.updateAdminItem('jobs', pendingPhoto.jobId, { [pendingPhoto.field]: reader.result, updatedBy: session.id, updatedAt: new Date().toISOString() }); Store.logActivity(session.id, `Uploaded ${pendingPhoto.field === 'beforePhoto' ? 'pre-job' : 'finished-job'} photo`, pendingPhoto.jobId); pendingPhoto = null; photoInput.value = ''; renderJobs(); toast('Quality-control photo saved'); };
    reader.readAsDataURL(file);
  });

  window.TechnicianUI = {
    updateStatus(id, status) { const session = Store.currentStaff(); Store.updateAdminItem('jobs', id, { status, updatedBy: session.id, updatedAt: new Date().toISOString() }); Store.logActivity(session.id, `Changed job status to ${status}`, id); renderJobs(); toast('Job status updated'); },
    toggleChecklist(id, index, done) {
      const job = Store.getAdminData().jobs.find(item => item.id === id); if (!job) return;
      const checklist = job.checklist?.length ? job.checklist : defaultChecklist(job); checklist[index].done = done;
      const session = Store.currentStaff(); Store.updateAdminItem('jobs', id, { checklist, checklistDone: checklist.filter(item => item.done).length, checklistTotal: checklist.length, updatedBy: session.id, updatedAt: new Date().toISOString() }); Store.logActivity(session.id, `${done ? 'Completed' : 'Reopened'} checklist item`, id); renderJobs();
    },
    choosePhoto(jobId, field) { pendingPhoto = { jobId, field }; photoInput.click(); },
    openCustomer(encodedName) {
      const name = decodeURIComponent(encodedName); const customer = Store.getAdminData().customers.find(item => item.name === name); if (!customer) return;
      document.getElementById('technicianCustomerContent').innerHTML = `<div class="profile-head"><div class="profile-avatar">${customer.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2)}</div><div><h2>${escapeHTML(customer.name)}</h2><p>${escapeHTML(customer.id)}</p></div></div><div class="profile-grid"><section class="profile-section"><h3>Contact</h3><ul class="profile-list"><li>Phone <strong>${escapeHTML(customer.phone)}</strong></li><li>Email <strong>${escapeHTML(customer.email)}</strong></li><li>Address <strong>${escapeHTML(customer.address)}</strong></li></ul></section><section class="profile-section"><h3>Installation Context</h3><ul class="profile-list"><li>Products <strong>${customer.products.map(escapeHTML).join('<br>') || 'None'}</strong></li><li>Service notes <strong>${escapeHTML(customer.notes)}</strong></li></ul></section></div>`;
      customerModal.classList.add('open');
    }
  };

  const existing = Store.currentUser();
  if (sessionIsValid(existing)) showPortal(existing); else location.replace('/signin/?mode=staff');
})();
