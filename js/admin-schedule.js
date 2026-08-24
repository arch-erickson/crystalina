/* Crystalina admin workforce scheduling and timesheet review. */
(() => {
  const board = document.getElementById('weeklyScheduleBoard');
  if (!board || !window.CrystalinaSchedule) return;

  const Domain = window.CrystalinaSchedule;
  const $ = id => document.getElementById(id);
  const uid = prefix => `${prefix}-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
  const pad = value => String(value).padStart(2, '0');
  const dateKey = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const dateFromKey = key => new Date(`${key}T12:00:00`);
  const mondayOf = value => { const date = new Date(value); const day = date.getDay(); date.setDate(date.getDate() - (day === 0 ? 6 : day - 1)); date.setHours(12, 0, 0, 0); return date; };
  const addDays = (date, amount) => { const next = new Date(date); next.setDate(next.getDate() + amount); return next; };
  const displayTime = value => new Date(`2026-01-01T${value}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const displayDate = value => dateFromKey(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const escape = value => typeof escapeHTML === 'function' ? escapeHTML(String(value ?? '')) : String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const statusKey = value => ({ Tentative: 'draft', 'Awaiting staff confirmation': 'pending', 'Confirmed by staff': 'accepted', Declined: 'declined', 'Change requested': 'change_requested' })[value] || String(value || 'draft').toLowerCase().replaceAll(' ', '_');
  const statusLabel = value => ({ draft: 'Draft', pending: 'Pending acceptance', accepted: 'Accepted', declined: 'Declined', change_requested: 'Change requested', cancelled: 'Cancelled' })[statusKey(value)] || value;
  const roleLabel = value => ({ sales: 'Sales Associate', technician: 'Technician', manager: 'Manager', admin: 'Manager' })[String(value || '').toLowerCase()] || value || 'Staff';
  const minutes = (start, end) => { const [sh, sm] = start.split(':').map(Number); const [eh, em] = end.split(':').map(Number); let total = (eh * 60 + em) - (sh * 60 + sm); if (total <= 0) total += 1440; return total; };
  const durationLabel = (start, end, breakMinutes = 0) => `${Math.max(0, minutes(start, end) - Number(breakMinutes || 0)) / 60}h`;

  const modal = $('staffScheduleModal'); const form = $('staffScheduleForm'); const weekInput = $('scheduleWeek');
  const staffInput = $('scheduleStaffId'); const dateInput = $('scheduleDate'); const stateInput = $('scheduleState');
  const conflict = $('scheduleConflictWarning'); const error = $('scheduleError');
  let activeTab = 'schedule';

  function data() { return Store.getAdminData(); }
  function currentWeek() { return mondayOf(dateFromKey(weekInput.value)); }
  function weekDates(start = currentWeek()) { return Array.from({ length: 7 }, (_, index) => addDays(start, index)); }
  function staffName(id) { if (!id) return 'Unassigned'; const member = data().staff.find(item => item.id === id); return member?.name || member?.fullName || member?.email || id; }
  function staffRole(member) { return roleLabel(member?.role || member?.primaryRole || member?.roles?.find(role => role !== 'customer')) || 'Staff'; }
  function setError(message = '') { error.textContent = message; error.classList.toggle('show', Boolean(message)); }
  function closeModal(target = modal) { target?.classList.remove('open'); setError(); }
  function openOverlay(target) { target?.classList.add('open'); }
  function weekKeys(start = currentWeek()) { return new Set(weekDates(start).map(dateKey)); }
  function isUnavailable(staffId, date, start, end) {
    if (!staffId) return null;
    const records = data().staffAvailability.filter(item => item.staffId === staffId && item.date === date);
    return records.find(item => !item.start || !item.end || (start < item.end && end > item.start));
  }
  function approvedTimeOff(staffId, date) {
    const at = dateFromKey(date);
    return data().staffTimeOffRequests.find(item => item.staffId === staffId && item.status === 'approved' && at >= new Date(item.startAt) && at <= new Date(item.endAt));
  }
  function overlappingShift(staffId, date, start, end, ignoredId = '') {
    return data().staffSchedules.find(item => item.id !== ignoredId && item.staffId === staffId && item.date === date && statusKey(item.status) !== 'cancelled' && start < item.end && end > item.start);
  }
  function conflictFor(staffId, date, start, end, ignoredId = '') { return isUnavailable(staffId, date, start, end) || approvedTimeOff(staffId, date) || overlappingShift(staffId, date, start, end, ignoredId); }

  async function hydrateStaffDirectory() {
    if (data().staff.length || !window.CrystalinaAuth) return;
    try {
      const auth = await window.CrystalinaAuth;
      const members = await auth.staffDirectory?.();
      if (members?.length) { Store.saveAdminCollection('staff', members); refreshStaffOptions(); renderAll(); }
    } catch (loadError) { console.warn('Staff directory remains empty until Supabase access is available.', loadError); }
  }

  function refreshStaffOptions() {
    const members = data().staff;
    const options = members.map(member => `<option value="${escape(member.id)}">${escape(staffName(member.id))} · ${escape(staffRole(member))}</option>`).join('');
    [staffInput, $('scheduleStaffFilter'), $('timesheetStaffFilter'), $('staffUnavailableStaffId'), $('staffTimeOffStaffId')].forEach(select => {
      if (!select) return;
      const first = select === staffInput ? '<option value="">Unassigned / open shift</option>' : '<option value="">All staff</option>';
      select.innerHTML = first + options;
    });
  }

  function setTab(tab) {
    activeTab = tab;
    document.querySelectorAll('#staffWorkspaceTabs [data-staff-tab]').forEach(button => { const selected = button.dataset.staffTab === tab; button.classList.toggle('active', selected); button.setAttribute('aria-selected', String(selected)); });
    document.querySelectorAll('#view-staff > .staff-workspace-panel').forEach(panel => { panel.hidden = panel.id !== `staffPanel${tab[0].toUpperCase()}${tab.slice(1)}`; });
    if (tab === 'requests') renderRequests();
    if (tab === 'timesheets') renderTimesheets();
    if (tab === 'availability') renderAvailability();
  }

  function filteredStaff() {
    const role = $('scheduleRoleFilter').value; const id = $('scheduleStaffFilter').value;
    return data().staff.filter(member => (!role || staffRole(member) === role) && (!id || member.id === id));
  }
  function filteredShifts(shifts) { const status = $('scheduleStatusFilter').value; return shifts.filter(item => !status || statusKey(item.status) === statusKey(status)); }
  function shiftCard(shift) {
    const status = statusKey(shift.status); const hasConflict = Boolean(conflictFor(shift.staffId, shift.date, shift.start, shift.end, shift.id));
    return `<button class="resource-shift status-${escape(status)} ${hasConflict ? 'has-conflict' : ''}" type="button" data-edit-shift="${escape(shift.id)}"><strong>${displayTime(shift.start)}–${displayTime(shift.end)} <small>${escape(durationLabel(shift.start, shift.end, shift.breakMinutes))}</small></strong><span>${escape(shift.location || shift.role || 'Crystalina shift')}</span><em>${hasConflict ? 'Conflict · ' : ''}${escape(statusLabel(status))}</em></button>`;
  }
  function resourceRow(label, subtitle, shifts, staffId = '', roleClass = '') {
    return `<div class="resource-row ${escape(roleClass)}" role="row"><div class="resource-person" role="rowheader"><strong>${escape(label)}</strong><span>${escape(subtitle)}</span></div>${weekDates().map(date => { const key = dateKey(date); const items = filteredShifts(shifts.filter(item => item.date === key)); return `<div class="resource-day-cell" role="gridcell" data-add-shift-date="${key}" data-add-shift-staff="${escape(staffId)}">${items.map(shiftCard).join('')}<button class="resource-quick-add" type="button" aria-label="Add shift for ${escape(label)} on ${key}">Add</button></div>`; }).join('')}</div>`;
  }

  function renderSchedule() {
    const snapshot = data(); const dates = weekDates(); const shifts = snapshot.staffSchedules.filter(item => weekKeys().has(item.date));
    const members = filteredStaff(); const grouped = new Map(); members.forEach(member => { const role = staffRole(member); if (!grouped.has(role)) grouped.set(role, []); grouped.get(role).push(member); });
    const unassigned = shifts.filter(item => !item.staffId && !item.openForClaim); const open = shifts.filter(item => !item.staffId && item.openForClaim);
    board.innerHTML = `<div class="resource-grid-head" role="row"><div role="columnheader"><strong>Name &amp; role</strong><span>Weekly hours</span></div>${dates.map(date => `<div role="columnheader" class="${dateKey(date) === dateKey(new Date()) ? 'is-today' : ''}"><strong>${date.toLocaleDateString('en-US', { weekday: 'short' })}</strong><span>${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></div>`).join('')}</div>${resourceRow('Unassigned shifts', `${unassigned.length} shift${unassigned.length === 1 ? '' : 's'}`, unassigned, '', 'resource-lane')}${resourceRow('Open shifts', `${open.length} available`, open, '', 'resource-lane open-lane')}${[...grouped.entries()].map(([role, people]) => `<div class="resource-role-group"><button type="button" data-toggle-role="${escape(role)}" aria-expanded="true">${escape(role)} <span>${people.length}</span></button></div>${people.map(member => { const memberShifts = shifts.filter(item => item.staffId === member.id); const hours = memberShifts.reduce((sum, item) => sum + minutes(item.start, item.end) - Number(item.breakMinutes || 0), 0) / 60; return resourceRow(staffName(member.id), `${role} · ${hours}h`, memberShifts, member.id); }).join('')}`).join('') || '<div class="resource-empty"><strong>No staff profiles yet</strong><span>Staff accounts from Supabase will appear here. You can still create unassigned shifts.</span></div>'}`;
    const drafts = shifts.filter(item => statusKey(item.status) === 'draft').length; $('unpublishedShiftCount').textContent = drafts ? `(${drafts})` : '';
    $('scheduleCoverageSummary').innerHTML = `<strong>${members.length} staff</strong><span>${shifts.length} shifts · ${drafts} unpublished · ${shifts.filter(item => conflictFor(item.staffId, item.date, item.start, item.end, item.id)).length} conflicts</span>`;
  }

  function checkConflict() {
    const item = conflictFor(staffInput.value, dateInput.value, $('scheduleStart').value, $('scheduleEnd').value, $('staffScheduleId').value);
    conflict.hidden = !item;
    if (item) conflict.querySelector('span').textContent = item.reason ? `Conflict: ${item.reason}` : 'This person has unavailable time, approved time off, or an overlapping shift.';
  }
  function openShiftModal(item = null, preferredDate = '', preferredStaff = '') {
    refreshStaffOptions(); form.reset(); $('staffScheduleTitle').textContent = item ? 'Edit Staff Shift' : 'Add Staff Shift'; $('staffScheduleId').value = item?.id || '';
    staffInput.value = item?.staffId || preferredStaff || ''; dateInput.value = item?.date || preferredDate || dateKey(currentWeek());
    $('scheduleRole').value = item?.role || (data().staff.find(member => member.id === staffInput.value) ? staffRole(data().staff.find(member => member.id === staffInput.value)) : '');
    $('scheduleLocation').value = item?.location || ''; $('scheduleStart').value = item?.start || '09:00'; $('scheduleEnd').value = item?.end || '17:00'; $('scheduleBreakMinutes').value = String(item?.breakMinutes ?? 30); $('scheduleNotes').value = item?.notes || '';
    stateInput.value = ['pending', 'accepted', 'declined', 'change_requested'].includes(statusKey(item?.status)) ? 'Awaiting staff confirmation' : 'Tentative';
    setError(); checkConflict(); openOverlay(modal);
  }

  function saveShift(values, id = '') { if (id) return Store.updateAdminItem('staffSchedules', id, values); const item = { id: uid('SCH'), ...values }; Store.addAdminItem('staffSchedules', item); return item; }
  function saveRepeatedShifts(base) {
    const repeat = $('scheduleRepeatEnabled').checked; if (!repeat) return [saveShift(base, $('staffScheduleId').value)];
    const until = $('scheduleRepeatUntil').value; const days = new Set([...document.querySelectorAll('[name="scheduleRepeatDay"]:checked')].map(input => Number(input.value)));
    if (!until || !days.size) throw new Error('Choose repeat weekdays and an end date.');
    const seriesId = base.seriesId || uid('SERIES');
    const results = []; for (let date = dateFromKey(base.date); date <= dateFromKey(until); date = addDays(date, 1)) if (days.has(date.getDay())) results.push(saveShift({ ...base, date: dateKey(date), status: 'draft', seriesId })); return results;
  }

  function notifyShift(shift, title = 'New schedule needs your response') {
    if (!shift.staffId) return;
    Store.addStaffNotification({ staffId: shift.staffId, type: 'shift_published', title, message: `${displayDate(shift.date)} · ${displayTime(shift.start)}–${displayTime(shift.end)}. Accept, decline, or request a change.`, scheduleId: shift.id, actionUrl: '/staff/schedule' });
  }

  function publishWeek() {
    const snapshot = data(); const keys = weekKeys(); const drafts = snapshot.staffSchedules.filter(item => keys.has(item.date) && statusKey(item.status) === 'draft');
    if (!drafts.length) { toast('No unpublished shifts this week'); return; }
    const batchId = uid('PUB'); const now = new Date().toISOString(); drafts.forEach(item => { item.status = item.staffId ? 'pending' : 'draft'; item.openForClaim = !item.staffId; item.publishedAt = now; item.publishBatchId = batchId; item.updated = now; notifyShift(item); });
    Store.saveAdminCollection('staffSchedules', snapshot.staffSchedules); Store.addAdminItem('schedulePublishBatches', { id: batchId, weekStart: dateKey(currentWeek()), shiftIds: drafts.map(item => item.id), createdAt: now, createdBy: Store.currentUser()?.id || 'admin' });
    renderAll(); toast(`${drafts.length} shift${drafts.length === 1 ? '' : 's'} published and staff notified`);
  }

  function copyPreviousWeek() {
    const previous = addDays(currentWeek(), -7); const source = data().staffSchedules.filter(item => weekKeys(previous).has(item.date)); if (!source.length) { toast('The previous week has no shifts to copy'); return; }
    source.forEach(item => Store.addAdminItem('staffSchedules', { ...item, id: uid('SCH'), date: dateKey(addDays(dateFromKey(item.date), 7)), status: 'draft', publishedAt: null, publishBatchId: null, copiedFrom: item.id, updated: new Date().toISOString() })); renderAll(); toast(`${source.length} shift${source.length === 1 ? '' : 's'} copied as drafts`);
  }

  function requestRows() {
    const snapshot = data(); const changes = snapshot.shiftChangeRequests.map(item => ({ ...item, type: 'change', label: 'Schedule change', current: `${new Date(item.original.startAt).toLocaleString()}–${new Date(item.original.endAt).toLocaleTimeString()}`, proposedText: `${new Date(item.proposed.startAt).toLocaleString()}–${new Date(item.proposed.endAt).toLocaleTimeString()}` }));
    const timeOff = snapshot.staffTimeOffRequests.map(item => ({ ...item, type: 'time-off', label: 'Time off', current: 'Published schedule remains active', proposedText: `${new Date(item.startAt).toLocaleDateString()}–${new Date(item.endAt).toLocaleDateString()}`, requestedAt: item.requestedAt }));
    const declined = snapshot.staffSchedules.filter(item => statusKey(item.status) === 'declined').map(item => ({ id: item.id, shiftId: item.id, staffId: item.staffId, type: 'decline', label: 'Declined shift', current: `${displayDate(item.date)} ${displayTime(item.start)}–${displayTime(item.end)}`, proposedText: item.responseReason || 'No reason provided', requestedAt: item.respondedAt, status: 'pending' }));
    return [...changes, ...timeOff, ...declined];
  }
  function renderRequests() {
    const search = $('scheduleRequestSearch').value.toLowerCase(); const type = $('scheduleRequestTypeFilter').value; const status = $('scheduleRequestStatusFilter').value;
    const rows = requestRows().filter(item => (!type || item.type === type) && (!status || item.status === status) && (!search || staffName(item.staffId).toLowerCase().includes(search)));
    $('scheduleRequestsBody').innerHTML = rows.map(item => `<tr><td><strong>${escape(staffName(item.staffId))}</strong></td><td>${escape(item.label)}<br><small>${escape(item.reason || item.proposedText)}</small></td><td>${escape(item.current)}</td><td>${escape(item.proposedText)}</td><td>${item.requestedAt ? new Date(item.requestedAt).toLocaleString() : '—'}</td><td><span class="shift-status ${escape(item.status)}">${escape(item.status)}</span></td><td>${item.status === 'pending' ? `<div class="table-actions"><button class="btn btn-sm btn-primary" type="button" data-review-request="${escape(item.id)}" data-request-type="${escape(item.type)}">Review</button><button class="btn btn-sm btn-outline" type="button" data-request-decision="rejected" data-request-id="${escape(item.id)}" data-request-type="${escape(item.type)}">Reject</button></div>` : 'Recorded'}</td></tr>`).join('');
    $('scheduleRequestsEmpty').hidden = Boolean(rows.length); const pending = requestRows().filter(item => item.status === 'pending').length; $('scheduleRequestCount').textContent = `${pending} pending`; $('staffRequestTabCount').textContent = pending ? String(pending) : '';
  }
  function reviewRequest(id, type, decision) {
    const now = new Date().toISOString(); const reviewer = Store.currentUser()?.id || 'admin';
    if (type === 'change') {
      const request = data().shiftChangeRequests.find(item => item.id === id); if (!request) return;
      const result = Domain.reviewChangeRequest(request, decision, reviewer, now); Store.updateAdminItem('shiftChangeRequests', id, result);
      const shift = data().staffSchedules.find(item => item.id === request.shiftId); if (shift) { if (decision === 'approved') { const start = new Date(request.proposed.startAt); const end = new Date(request.proposed.endAt); Store.updateAdminItem('staffSchedules', shift.id, { date: dateKey(start), start: `${pad(start.getHours())}:${pad(start.getMinutes())}`, end: `${pad(end.getHours())}:${pad(end.getMinutes())}`, status: 'accepted', updated: now }); } else Store.updateAdminItem('staffSchedules', shift.id, { status: shift.authoritativeStatus || 'accepted', updated: now }); }
      Store.addStaffNotification({ staffId: request.staffId, title: `Schedule change ${decision}`, message: decision === 'approved' ? 'Your requested schedule change was approved.' : 'Your requested change was not approved. The original shift remains active.', actionUrl: '/staff/schedule' });
    } else if (type === 'time-off') {
      const request = data().staffTimeOffRequests.find(item => item.id === id); if (!request) return; Store.updateAdminItem('staffTimeOffRequests', id, { status: decision, reviewedAt: now, reviewedBy: reviewer }); Store.addStaffNotification({ staffId: request.staffId, title: `Time off ${decision}`, message: decision === 'approved' ? 'Your time-off request was approved.' : 'Your time-off request was not approved.', actionUrl: '/staff/time-off' });
    } else { const shift = data().staffSchedules.find(item => item.id === id); if (shift) openShiftModal(shift); }
    renderAll(); toast(`Request ${decision}`);
  }

  function payPeriod() { return { start: dateFromKey($('timesheetPeriodStart').value), end: dateFromKey($('timesheetPeriodEnd').value) }; }
  function entriesInPeriod() { const period = payPeriod(); return data().timeEntries.filter(item => { const at = new Date(item.clockIn); return at >= period.start && at <= addDays(period.end, 1); }); }
  function timesheetSummaryFor(staffId) {
    const entries = entriesInPeriod().filter(item => item.staffId === staffId); const worked = entries.reduce((sum, item) => item.clockOut ? sum + Domain.minutesBetween(item.clockIn, item.clockOut) - Number(item.breakMinutes || 0) : sum, 0); const scheduled = entries.reduce((sum, item) => sum + Number(item.scheduledMinutes || 0), 0); return { entries, worked, scheduled, breakMinutes: entries.reduce((sum, item) => sum + Number(item.breakMinutes || 0), 0), status: entries.some(item => item.status === 'correction_requested') ? 'correction_requested' : entries.every(item => item.status === 'approved') && entries.length ? 'approved' : entries.some(item => item.status === 'submitted') ? 'submitted' : 'draft' }; }
  function renderTimesheets() {
    const staffFilter = $('timesheetStaffFilter').value; const roleFilter = $('timesheetRoleFilter').value; const statusFilter = $('timesheetStatusFilter').value; const members = data().staff.filter(member => (!staffFilter || member.id === staffFilter) && (!roleFilter || staffRole(member) === roleFilter));
    const rows = members.map(member => ({ member, summary: timesheetSummaryFor(member.id) })).filter(item => item.summary.entries.length && (!statusFilter || item.summary.status === statusFilter));
    $('timesheetsTableBody').innerHTML = rows.map(({ member, summary }) => `<tr><td><strong>${escape(staffName(member.id))}</strong></td><td>${escape(staffRole(member))}</td><td>${(summary.scheduled / 60).toFixed(2)}h</td><td>${(summary.worked / 60).toFixed(2)}h</td><td>${summary.breakMinutes}m</td><td>${((summary.worked - summary.scheduled) / 60).toFixed(2)}h</td><td><span class="shift-status ${escape(summary.status)}">${escape(summary.status.replaceAll('_', ' '))}</span></td><td><button class="btn btn-sm btn-outline" type="button" data-review-timesheet="${escape(member.id)}">Review</button></td></tr>`).join(''); $('timesheetsEmpty').hidden = Boolean(rows.length);
    const summaries = members.map(member => timesheetSummaryFor(member.id)); $('timesheetPendingCount').textContent = summaries.filter(item => item.status === 'submitted').length; $('timesheetMissingCount').textContent = summaries.filter(item => item.entries.some(entry => !entry.clockOut)).length; $('timesheetOvertimeCount').textContent = summaries.filter(item => item.worked > 2400).length; $('timesheetApprovedHours').textContent = (summaries.filter(item => item.status === 'approved').reduce((sum, item) => sum + item.worked, 0) / 60).toFixed(1);
  }
  function setPayPeriod(start) {
    const periodStart = mondayOf(start); $('timesheetPeriodStart').value = dateKey(periodStart); $('timesheetPeriodEnd').value = dateKey(addDays(periodStart, 13)); renderTimesheets();
  }
  function exportTimesheets() {
    const members = data().staff.map(member => ({ member, summary: timesheetSummaryFor(member.id) })).filter(item => item.summary.entries.length);
    if (!members.length) { toast('There are no timesheets to export for this pay period'); return; }
    const rows = [['Staff member', 'Role', 'Scheduled hours', 'Recorded hours', 'Break minutes', 'Variance hours', 'Status'], ...members.map(({ member, summary }) => [staffName(member.id), staffRole(member), (summary.scheduled / 60).toFixed(2), (summary.worked / 60).toFixed(2), summary.breakMinutes, ((summary.worked - summary.scheduled) / 60).toFixed(2), summary.status])];
    const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = `crystalina-timesheets-${$('timesheetPeriodStart').value}-${$('timesheetPeriodEnd').value}.csv`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(link.href);
  }
  function openTimesheetReview(staffId) {
    const summary = timesheetSummaryFor(staffId); $('timesheetReviewId').value = staffId; $('timesheetReviewStaffSummary').innerHTML = `<div><h3>${escape(staffName(staffId))}</h3><p>${summary.entries.length} entries · ${(summary.worked / 60).toFixed(2)} recorded hours</p></div>`; $('timesheetEntriesBody').innerHTML = summary.entries.map(item => `<tr><td>${new Date(item.clockIn).toLocaleDateString()}</td><td>${new Date(item.clockIn).toLocaleTimeString()}</td><td>${item.clockOut ? new Date(item.clockOut).toLocaleTimeString() : 'Missing'}</td><td>${item.breakMinutes || 0}m</td><td>${item.clockOut ? ((Domain.minutesBetween(item.clockIn, item.clockOut) - Number(item.breakMinutes || 0)) / 60).toFixed(2) : '—'}</td><td>${(Number(item.scheduledMinutes || 0) / 60).toFixed(2)}</td><td>${escape(item.correctionReason || '')}</td></tr>`).join(''); openOverlay($('timesheetReviewModal'));
  }

  function renderAvailability() {
    const snapshot = data(); $('staffAvailabilityTableBody').innerHTML = snapshot.staffAvailability.map(item => `<tr><td>${escape(staffName(item.staffId))}</td><td>${escape(displayDate(item.date))} ${escape(item.start || 'All day')}–${escape(item.end || '')}</td><td>${escape(item.repeat || 'No')}</td><td>${escape(item.reason || '—')}</td><td><button class="btn btn-sm btn-ghost" type="button" data-delete-availability="${escape(item.id)}">Remove</button></td></tr>`).join(''); $('staffAvailabilityEmpty').hidden = Boolean(snapshot.staffAvailability.length);
    $('staffTimeOffTableBody').innerHTML = snapshot.staffTimeOffRequests.map(item => `<tr><td>${escape(staffName(item.staffId))}</td><td>${new Date(item.startAt).toLocaleDateString()}–${new Date(item.endAt).toLocaleDateString()}</td><td>${escape(item.type || 'Time off')}</td><td><span class="shift-status ${escape(item.status)}">${escape(item.status)}</span></td><td>${item.status === 'pending' ? `<button class="btn btn-sm btn-primary" type="button" data-request-decision="approved" data-request-id="${escape(item.id)}" data-request-type="time-off">Approve</button> <button class="btn btn-sm btn-outline" type="button" data-request-decision="rejected" data-request-id="${escape(item.id)}" data-request-type="time-off">Reject</button>` : 'Recorded'}</td></tr>`).join(''); $('staffTimeOffEmpty').hidden = Boolean(snapshot.staffTimeOffRequests.length); $('timeOffPendingCount').textContent = `${snapshot.staffTimeOffRequests.filter(item => item.status === 'pending').length} pending`;
  }
  function renderAll() { refreshStaffOptions(); renderSchedule(); renderRequests(); renderTimesheets(); renderAvailability(); }

  form.addEventListener('submit', event => {
    event.preventDefault(); setError(); const start = $('scheduleStart').value; const end = $('scheduleEnd').value;
    const values = { staffId: staffInput.value, role: $('scheduleRole').value, location: $('scheduleLocation').value.trim(), date: dateInput.value, start, end, breakMinutes: Number($('scheduleBreakMinutes').value), status: stateInput.value === 'Tentative' ? 'draft' : staffInput.value ? 'pending' : 'draft', openForClaim: !staffInput.value && stateInput.value !== 'Tentative', notes: $('scheduleNotes').value.trim(), createdBy: Store.currentUser()?.id || 'admin', updated: new Date().toISOString() };
    if (!values.role) { setError('Choose the role required for this shift.'); return; }
    try { const saved = saveRepeatedShifts(values); if (values.status === 'pending') saved.forEach(notifyShift); closeModal(); renderAll(); toast(conflictFor(values.staffId, values.date, start, end, $('staffScheduleId').value) ? 'Shift saved with a conflict warning' : `${saved.length} shift${saved.length === 1 ? '' : 's'} saved`); } catch (saveError) { setError(saveError.message); }
  });

  board.addEventListener('click', event => { const edit = event.target.closest('[data-edit-shift]'); if (edit) { openShiftModal(data().staffSchedules.find(item => item.id === edit.dataset.editShift)); return; } const cell = event.target.closest('[data-add-shift-date]'); if (cell) openShiftModal(null, cell.dataset.addShiftDate, cell.dataset.addShiftStaff); const toggle = event.target.closest('[data-toggle-role]'); if (toggle) { const group = toggle.parentElement; const collapsed = group.classList.toggle('is-collapsed'); toggle.setAttribute('aria-expanded', String(!collapsed)); } });
  document.querySelector('#staffWorkspaceTabs').addEventListener('click', event => { const button = event.target.closest('[data-staff-tab]'); if (button) setTab(button.dataset.staffTab); });
  $('schedulePreviousWeekBtn').addEventListener('click', () => { weekInput.value = dateKey(addDays(currentWeek(), -7)); renderSchedule(); }); $('scheduleTodayBtn').addEventListener('click', () => { weekInput.value = dateKey(mondayOf(new Date())); renderSchedule(); }); $('scheduleNextWeekBtn').addEventListener('click', () => { weekInput.value = dateKey(addDays(currentWeek(), 7)); renderSchedule(); });
  [weekInput, $('scheduleRoleFilter'), $('scheduleStaffFilter'), $('scheduleStatusFilter')].forEach(input => input.addEventListener('change', renderSchedule));
  [$('scheduleRequestSearch'), $('scheduleRequestTypeFilter'), $('scheduleRequestStatusFilter')].forEach(input => input.addEventListener(input.tagName === 'INPUT' ? 'input' : 'change', renderRequests));
  [$('timesheetPeriodStart'), $('timesheetPeriodEnd'), $('timesheetStaffFilter'), $('timesheetRoleFilter'), $('timesheetStatusFilter')].forEach(input => input.addEventListener('change', renderTimesheets));
  $('timesheetPreviousPeriodBtn').addEventListener('click', () => setPayPeriod(addDays(payPeriod().start, -14)));
  $('timesheetCurrentPeriodBtn').addEventListener('click', () => setPayPeriod(new Date()));
  $('timesheetNextPeriodBtn').addEventListener('click', () => setPayPeriod(addDays(payPeriod().start, 14)));
  $('exportTimesheetsBtn').addEventListener('click', exportTimesheets);
  document.addEventListener('click', event => {
    const review = event.target.closest('[data-review-request]'); if (review) { if (review.dataset.requestType === 'change') { const request = data().shiftChangeRequests.find(item => item.id === review.dataset.reviewRequest); if (request) { $('scheduleChangeRequestId').value = request.id; $('scheduleChangeCurrentSummary').textContent = `${new Date(request.original.startAt).toLocaleString()}–${new Date(request.original.endAt).toLocaleTimeString()}`; $('scheduleChangeDate').value = request.proposed.startAt.slice(0, 10); $('scheduleChangeStart').value = request.proposed.startAt.slice(11, 16); $('scheduleChangeEnd').value = request.proposed.endAt.slice(11, 16); $('scheduleChangeReason').value = request.reason; openOverlay($('scheduleChangeRequestModal')); } } else if (review.dataset.requestType === 'decline') openShiftModal(data().staffSchedules.find(item => item.id === review.dataset.reviewRequest)); return; }
    const decision = event.target.closest('[data-request-decision]'); if (decision) { reviewRequest(decision.dataset.requestId, decision.dataset.requestType, decision.dataset.requestDecision); return; }
    const timesheet = event.target.closest('[data-review-timesheet]'); if (timesheet) { openTimesheetReview(timesheet.dataset.reviewTimesheet); return; }
    const remove = event.target.closest('[data-delete-availability]'); if (remove) { Store.deleteAdminItem('staffAvailability', remove.dataset.deleteAvailability); renderAvailability(); toast('Unavailable time removed'); }
  });

  $('scheduleChangeRequestForm').addEventListener('submit', event => { event.preventDefault(); reviewRequest($('scheduleChangeRequestId').value, 'change', 'approved'); closeModal($('scheduleChangeRequestModal')); });
  $('scheduleChangeRejectBtn').addEventListener('click', () => { reviewRequest($('scheduleChangeRequestId').value, 'change', 'rejected'); closeModal($('scheduleChangeRequestModal')); });
  $('staffUnavailableForm').addEventListener('submit', event => { event.preventDefault(); const allDay = $('staffUnavailableAllDay').checked; Store.addAdminItem('staffAvailability', { id: uid('AVL'), staffId: $('staffUnavailableStaffId').value, date: $('staffUnavailableStartDate').value, start: allDay ? '' : $('staffUnavailableStartTime').value, end: allDay ? '' : $('staffUnavailableEndTime').value, repeat: $('staffUnavailableRepeat').value, reason: $('staffUnavailableReason').value.trim(), createdAt: new Date().toISOString() }); closeModal($('staffUnavailableModal')); renderAll(); toast('Unavailable time saved'); });
  $('staffTimeOffForm').addEventListener('submit', event => { event.preventDefault(); const item = Domain.createTimeOffRequest({ id: $('staffTimeOffId').value || uid('TOR'), staffId: $('staffTimeOffStaffId').value, startAt: `${$('staffTimeOffStartDate').value}T00:00`, endAt: `${$('staffTimeOffEndDate').value}T23:59`, type: $('staffTimeOffType').value, reason: $('staffTimeOffReason').value.trim(), adminNote: $('staffTimeOffAdminNote').value.trim() }); item.status = $('staffTimeOffStatus').value; Store.addAdminItem('staffTimeOffRequests', item); closeModal($('staffTimeOffModal')); renderAll(); toast('Time-off record saved'); });
  $('timesheetReviewForm').addEventListener('submit', event => { event.preventDefault(); const staffId = $('timesheetReviewId').value; entriesInPeriod().filter(item => item.staffId === staffId && item.status === 'submitted').forEach(item => Store.updateAdminItem('timeEntries', item.id, { status: 'approved', approvedAt: new Date().toISOString(), approvedBy: Store.currentUser()?.id || 'admin' })); Store.addStaffNotification({ staffId, title: 'Timesheet approved', message: 'Your submitted timesheet was approved.', actionUrl: '/staff/timesheet' }); closeModal($('timesheetReviewModal')); renderTimesheets(); toast('Timesheet approved'); });
  $('timesheetCorrectionBtn').addEventListener('click', () => { const staffId = $('timesheetReviewId').value; const note = $('timesheetReviewNote').value.trim(); if (!note) { $('timesheetReviewError').textContent = 'Add a review note before requesting a correction.'; $('timesheetReviewError').classList.add('show'); return; } entriesInPeriod().filter(item => item.staffId === staffId && item.status === 'submitted').forEach(item => Store.updateAdminItem('timeEntries', item.id, { status: 'correction_requested', adminNote: note })); Store.addStaffNotification({ staffId, title: 'Timesheet correction requested', message: note, actionUrl: '/staff/timesheet' }); closeModal($('timesheetReviewModal')); renderTimesheets(); toast('Correction requested'); });

  $('addScheduleBtn').addEventListener('click', () => openShiftModal()); $('lockWeekBtn').addEventListener('click', publishWeek); $('copyScheduleWeekBtn').addEventListener('click', copyPreviousWeek); $('addUnavailableTimeBtn').addEventListener('click', () => openOverlay($('staffUnavailableModal'))); $('addTimeOffBtn').addEventListener('click', () => openOverlay($('staffTimeOffModal')));
  $('staffScheduleClose').addEventListener('click', () => closeModal()); $('staffScheduleCancel').addEventListener('click', () => closeModal()); [staffInput, dateInput, $('scheduleStart'), $('scheduleEnd')].forEach(input => input.addEventListener('change', checkConflict));
  [['scheduleChangeRequestClose', 'scheduleChangeRequestModal'], ['staffUnavailableClose', 'staffUnavailableModal'], ['staffUnavailableCancel', 'staffUnavailableModal'], ['staffTimeOffClose', 'staffTimeOffModal'], ['staffTimeOffCancel', 'staffTimeOffModal'], ['timesheetReviewClose', 'timesheetReviewModal'], ['timesheetReviewCancel', 'timesheetReviewModal']].forEach(([button, overlay]) => $(button).addEventListener('click', () => closeModal($(overlay))));
  document.querySelectorAll('.modal-overlay').forEach(overlay => overlay.addEventListener('click', event => { if (event.target === overlay) closeModal(overlay); }));

  const todayMonday = mondayOf(new Date()); weekInput.value = dateKey(todayMonday); const payStart = mondayOf(new Date()); $('timesheetPeriodStart').value = dateKey(payStart); $('timesheetPeriodEnd').value = dateKey(addDays(payStart, 13));
  if (location.hash === '#staff-requests') activeTab = 'requests'; refreshStaffOptions(); renderAll(); setTab(activeTab); hydrateStaffDirectory();
})();
