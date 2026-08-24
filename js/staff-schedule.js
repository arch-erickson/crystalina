/* Shared schedule, availability, time-off, timesheets, and notifications for staff portals. */
(() => {
  const portal = document.querySelector('.portal-shell');
  const portalMain = portal?.querySelector('.portal-main');
  const portalUser = portal?.querySelector('.portal-user');
  if (!portal || !portalMain || !portalUser || !window.CrystalinaSchedule) return;

  const Domain = window.CrystalinaSchedule;
  const uid = prefix => `${prefix}-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
  const pad = value => String(value).padStart(2, '0');
  const dateKey = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const dateFromKey = key => new Date(`${key}T12:00:00`);
  const mondayOf = value => {
    const date = new Date(value);
    const day = date.getDay();
    date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
    date.setHours(12, 0, 0, 0);
    return date;
  };
  const addDays = (date, amount) => { const next = new Date(date); next.setDate(next.getDate() + amount); return next; };
  const displayTime = value => new Date(`2026-01-01T${value}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const displayDate = value => dateFromKey(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const escape = value => typeof escapeHTML === 'function' ? escapeHTML(String(value ?? '')) : String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const legacyStatus = status => ({ Tentative: 'draft', 'Awaiting staff confirmation': 'pending', 'Confirmed by staff': 'accepted' })[status] || String(status || 'draft').toLowerCase().replaceAll(' ', '_');
  const statusLabel = status => ({ draft: 'Draft', published: 'Pending acceptance', pending: 'Pending acceptance', accepted: 'Accepted', declined: 'Declined', change_requested: 'Change requested', cancelled: 'Cancelled' })[legacyStatus(status)] || status;

  const initialDate = new Date();
  if (initialDate.getDay() === 0) initialDate.setDate(initialDate.getDate() + 1);
  let selectedWeek = mondayOf(initialDate);
  let activeTab = 'schedule';

  const bell = document.createElement('div');
  bell.className = 'staff-notification-wrap';
  bell.innerHTML = `<button class="staff-notification-bell" id="staffNotificationBell" type="button" aria-label="Open staff notifications" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span id="staffNotificationCount" hidden>0</span></button><div class="staff-notification-menu" id="staffNotificationMenu" hidden><header><strong>Notifications</strong><span>Schedule and timekeeping updates</span></header><div id="staffNotificationList"></div></div>`;
  portalUser.insertBefore(bell, portalUser.lastElementChild);

  const workspace = document.createElement('section');
  workspace.className = 'admin-panel staff-workforce-workspace';
  workspace.innerHTML = `
    <div class="staff-workspace-heading"><div><h2>My Staff Workspace</h2><p class="admin-subtitle">Review shifts, share availability, request time off, and keep accurate time.</p></div></div>
    <nav class="staff-workspace-tabs" aria-label="Staff workspace">
      <button class="staff-workspace-tab active" type="button" data-staff-tab="schedule" aria-selected="true">My Schedule</button>
      <button class="staff-workspace-tab" type="button" data-staff-tab="availability" aria-selected="false">Time unavailable</button>
      <button class="staff-workspace-tab" type="button" data-staff-tab="time-off" aria-selected="false">Request time off</button>
      <button class="staff-workspace-tab" type="button" data-staff-tab="timesheets" aria-selected="false">Timesheets</button>
    </nav>
    <section class="staff-workspace-panel" data-staff-panel="schedule">
      <div class="staff-schedule-toolbar"><div class="schedule-period-controls"><button class="btn btn-sm btn-outline" type="button" data-week-step="-7" aria-label="Previous week">‹</button><button class="btn btn-sm btn-ghost" type="button" data-week-today>Today</button><button class="btn btn-sm btn-outline" type="button" data-week-step="7" aria-label="Next week">›</button></div><strong id="staffWeekRange"></strong></div>
      <div class="staff-shift-list" id="staffShiftList"></div>
    </section>
    <section class="staff-workspace-panel" data-staff-panel="availability" hidden>
      <div class="staff-form-intro"><div><h3>Time unavailable</h3><p>Block a date and time you cannot work. This is visible to scheduling managers immediately.</p></div><span class="admin-badge">No approval needed</span></div>
      <form class="staff-request-form" id="staffAvailabilityForm"><div class="field"><label for="availabilityDate">Date</label><input id="availabilityDate" name="date" type="date" required></div><div class="field"><label for="availabilityStart">From</label><input id="availabilityStart" name="start" type="time" required></div><div class="field"><label for="availabilityEnd">Until</label><input id="availabilityEnd" name="end" type="time" required></div><div class="field"><label for="availabilityReason">Note</label><input id="availabilityReason" name="reason" maxlength="240" placeholder="Optional context"></div><button class="btn btn-primary" type="submit">Record unavailable time</button></form>
      <div class="staff-record-list" id="staffAvailabilityList"></div>
    </section>
    <section class="staff-workspace-panel" data-staff-panel="time-off" hidden>
      <div class="staff-form-intro"><div><h3>Request time off</h3><p>Your request remains pending until an administrator approves it. Keep working your current schedule until then.</p></div><span class="admin-badge is-warning">Admin approval required</span></div>
      <form class="staff-request-form" id="staffTimeOffForm"><div class="field"><label for="timeOffStart">Starts</label><input id="timeOffStart" name="startAt" type="datetime-local" required></div><div class="field"><label for="timeOffEnd">Ends</label><input id="timeOffEnd" name="endAt" type="datetime-local" required></div><div class="field staff-form-wide"><label for="timeOffReason">Reason</label><textarea id="timeOffReason" name="reason" rows="2" maxlength="500" required></textarea></div><button class="btn btn-primary" type="submit">Send request for approval</button></form>
      <div class="staff-record-list" id="staffTimeOffList"></div>
    </section>
    <section class="staff-workspace-panel" data-staff-panel="timesheets" hidden>
      <div class="staff-form-intro"><div><h3>Timesheets</h3><p>Timesheets record actual worked time. Schedule changes do not alter approved time entries.</p></div><span class="admin-badge">Current pay period</span></div>
      <div class="time-clock-card" id="staffTimeClock"></div><div class="timesheet-list" id="staffTimesheetList"></div>
    </section>
    <div class="staff-action-sheet" id="staffActionSheet" hidden><form id="staffActionForm"><input name="shiftId" type="hidden"><input name="action" type="hidden"><div class="staff-action-heading"><div><h3 id="staffActionTitle"></h3><p id="staffActionSummary"></p></div><button type="button" class="btn btn-sm btn-ghost" data-close-action>Close</button></div><div class="staff-change-fields" id="staffChangeFields" hidden><div class="field"><label for="requestedStart">Requested start</label><input id="requestedStart" name="requestedStart" type="datetime-local"></div><div class="field"><label for="requestedEnd">Requested end</label><input id="requestedEnd" name="requestedEnd" type="datetime-local"></div></div><div class="field"><label for="staffActionReason">Reason</label><textarea id="staffActionReason" name="reason" rows="3" maxlength="500" required></textarea></div><button class="btn btn-primary" type="submit">Send to scheduling manager</button></form></div>`;
  const stats = portalMain.querySelector('.stat-cards');
  if (stats) stats.insertAdjacentElement('afterend', workspace); else portalMain.prepend(workspace);

  const notificationButton = bell.querySelector('#staffNotificationBell');
  const notificationMenu = bell.querySelector('#staffNotificationMenu');
  const actionSheet = workspace.querySelector('#staffActionSheet');
  const actionForm = workspace.querySelector('#staffActionForm');

  function session() { return Store.currentStaff(); }
  function weekDates() { return Array.from({ length: 7 }, (_, index) => addDays(selectedWeek, index)); }
  function weekShifts(data, staffId) { const keys = new Set(weekDates().map(dateKey)); return data.staffSchedules.filter(item => item.staffId === staffId && keys.has(item.date)); }
  function notifyAdmin(type, title, message, entityId, staffId) { Store.addNotification({ type, title, message, entityId, staffId, customerId: 'staff-admins', actionUrl: '/admin/#staff-requests' }); }

  function renderNotifications() {
    const staff = session(); if (!staff) return;
    const items = Store.getStaffNotifications(staff.id).sort((a, b) => String(b.sent).localeCompare(String(a.sent)));
    const unread = items.filter(item => !item.read).length;
    const count = bell.querySelector('#staffNotificationCount'); count.textContent = unread > 9 ? '9+' : unread; count.hidden = !unread;
    bell.querySelector('#staffNotificationList').innerHTML = items.length ? items.map(item => `<button class="staff-notification-item ${item.read ? '' : 'unread'}" type="button" data-notification-id="${escape(item.id)}" data-action-url="${escape(item.actionUrl || '')}"><strong>${escape(item.title)}</strong><p>${escape(item.message)}</p><time>${new Date(item.sent).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</time></button>`).join('') : '<p class="staff-notification-empty">No notifications yet.</p>';
  }

  function renderSchedule(data, staff) {
    const shifts = weekShifts(data, staff.id); const start = weekDates()[0]; const end = weekDates()[6];
    workspace.querySelector('#staffWeekRange').textContent = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    workspace.querySelector('#staffShiftList').innerHTML = weekDates().map(date => {
      const key = dateKey(date); const dayShifts = shifts.filter(item => item.date === key).sort((a, b) => a.start.localeCompare(b.start)); const unavailable = data.staffAvailability.filter(item => item.staffId === staff.id && item.date === key);
      return `<article class="staff-shift-day"><header><div><strong>${date.toLocaleDateString('en-US', { weekday: 'long' })}</strong><span>${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></div>${unavailable.length ? '<span class="shift-status unavailable">Unavailable time recorded</span>' : ''}</header><div>${dayShifts.length ? dayShifts.map(shift => { const status = legacyStatus(shift.status); const canRespond = ['pending', 'published'].includes(status); return `<section class="staff-shift-row status-${escape(status)}"><div class="staff-shift-time"><strong>${displayTime(shift.start)}–${displayTime(shift.end)}</strong><span>${escape(shift.location || shift.notes || 'Crystalina assignment')}</span></div><span class="shift-status ${escape(status)}">${escape(statusLabel(status))}</span>${canRespond ? `<div class="staff-response-actions"><button class="btn btn-sm btn-primary" type="button" data-shift-response="accepted" data-shift-id="${escape(shift.id)}">Accept</button><button class="btn btn-sm btn-outline" type="button" data-shift-response="declined" data-shift-id="${escape(shift.id)}">Decline</button><button class="btn btn-sm btn-ghost" type="button" data-shift-response="change_requested" data-shift-id="${escape(shift.id)}">Request change</button></div>` : ''}</section>`; }).join('') : '<p class="staff-empty-row">No shift scheduled.</p>'}</div></article>`;
    }).join('');
  }

  function renderAvailability(data, staff) {
    const items = data.staffAvailability.filter(item => item.staffId === staff.id).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    workspace.querySelector('#staffAvailabilityList').innerHTML = items.length ? items.map(item => `<article><div><strong>${displayDate(item.date)} · ${escape(item.start || 'All day')}–${escape(item.end || '')}</strong><span>${escape(item.reason || 'No note')}</span></div><button class="btn btn-sm btn-ghost" type="button" data-remove-availability="${escape(item.id)}">Remove</button></article>`).join('') : '<p class="staff-empty-state">No unavailable time recorded.</p>';
  }

  function renderTimeOff(data, staff) {
    const items = data.staffTimeOffRequests.filter(item => item.staffId === staff.id).sort((a, b) => String(b.requestedAt).localeCompare(String(a.requestedAt)));
    workspace.querySelector('#staffTimeOffList').innerHTML = items.length ? items.map(item => `<article><div><strong>${new Date(item.startAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}–${new Date(item.endAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</strong><span>${escape(item.reason)}</span></div><span class="shift-status ${escape(item.status)}">${escape(item.status)}</span></article>`).join('') : '<p class="staff-empty-state">No time-off requests.</p>';
  }

  function renderTimesheets(data, staff) {
    const entries = data.timeEntries.filter(item => item.staffId === staff.id).sort((a, b) => String(b.clockIn).localeCompare(String(a.clockIn))); const active = entries.find(item => !item.clockOut);
    workspace.querySelector('#staffTimeClock').innerHTML = active ? `<div><strong>Shift in progress</strong><span>Started ${new Date(active.clockIn).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span></div><div class="time-clock-actions">${active.breakStartedAt ? '<button class="btn btn-outline" type="button" data-clock-action="end-break">End break</button>' : '<button class="btn btn-outline" type="button" data-clock-action="start-break">Start break</button>'}<button class="btn btn-primary" type="button" data-clock-action="clock-out">End shift</button></div>` : '<div><strong>Ready to start?</strong><span>Your actual time will appear in this pay period.</span></div><button class="btn btn-primary" type="button" data-clock-action="clock-in">Start shift</button>';
    workspace.querySelector('#staffTimesheetList').innerHTML = entries.length ? entries.map(item => { const summary = item.clockOut ? Domain.summarizeTimeEntry({ clockIn: item.clockIn, clockOut: item.clockOut, breakMinutes: item.breakMinutes || 0, scheduledMinutes: item.scheduledMinutes || 0, scheduledStart: item.scheduledStart }) : null; return `<article class="timesheet-entry"><div><strong>${new Date(item.clockIn).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</strong><span>${new Date(item.clockIn).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}–${item.clockOut ? new Date(item.clockOut).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'In progress'}</span></div><div><strong>${summary ? `${(summary.workedMinutes / 60).toFixed(2)} hrs` : 'Open'}</strong><span>${escape(item.status || 'draft')}</span></div>${item.clockOut && item.status !== 'approved' ? `<button class="btn btn-sm btn-outline" type="button" data-timesheet-correction="${escape(item.id)}">Request correction</button>` : ''}</article>`; }).join('') : '<p class="staff-empty-state">No time entries in this pay period.</p>';
  }

  function render() { const staff = session(); if (!staff || portal.hidden) return; const data = Store.getAdminData(); renderSchedule(data, staff); renderAvailability(data, staff); renderTimeOff(data, staff); renderTimesheets(data, staff); renderNotifications(); }
  function setTab(tab) { activeTab = tab; workspace.querySelectorAll('[data-staff-tab]').forEach(button => { const selected = button.dataset.staffTab === tab; button.classList.toggle('active', selected); button.setAttribute('aria-selected', String(selected)); }); workspace.querySelectorAll('[data-staff-panel]').forEach(panel => { panel.hidden = panel.dataset.staffPanel !== tab; }); }

  function openResponseSheet(shift, action) {
    actionForm.reset(); actionForm.elements.shiftId.value = shift.id; actionForm.elements.action.value = action; const changing = action === 'change_requested';
    workspace.querySelector('#staffActionTitle').textContent = changing ? 'Request a schedule change' : 'Decline this shift';
    workspace.querySelector('#staffActionSummary').textContent = `${displayDate(shift.date)} · ${displayTime(shift.start)}–${displayTime(shift.end)}. The current shift remains active until an administrator approves a change.`;
    workspace.querySelector('#staffChangeFields').hidden = !changing; actionForm.elements.requestedStart.required = changing; actionForm.elements.requestedEnd.required = changing;
    if (changing) { actionForm.elements.requestedStart.value = `${shift.date}T${shift.start}`; actionForm.elements.requestedEnd.value = `${shift.date}T${shift.end}`; }
    actionSheet.hidden = false; actionForm.elements.reason.focus();
  }

  workspace.addEventListener('click', event => {
    const tab = event.target.closest('[data-staff-tab]'); if (tab) { setTab(tab.dataset.staffTab); return; }
    const step = event.target.closest('[data-week-step]'); if (step) { selectedWeek = addDays(selectedWeek, Number(step.dataset.weekStep)); render(); return; }
    if (event.target.closest('[data-week-today]')) { selectedWeek = mondayOf(new Date()); render(); return; }
    const response = event.target.closest('[data-shift-response]');
    if (response) {
      const staff = session(); const shift = Store.getAdminData().staffSchedules.find(item => item.id === response.dataset.shiftId && item.staffId === staff.id); if (!shift) return;
      if (response.dataset.shiftResponse === 'accepted') { const result = Domain.respondToAssignment({ id: shift.id, shiftId: shift.id, responseStatus: legacyStatus(shift.status) }, 'accepted'); Store.updateAdminItem('staffSchedules', shift.id, { status: result.responseStatus, respondedAt: result.respondedAt, updated: result.respondedAt }); notifyAdmin('shift_accepted', 'Shift accepted', `${staff.name || staff.email} accepted ${displayDate(shift.date)}.`, shift.id, staff.id); Store.logActivity(staff.id, 'Accepted schedule shift', shift.id); render(); toast('Shift accepted'); } else openResponseSheet(shift, response.dataset.shiftResponse);
      return;
    }
    if (event.target.closest('[data-close-action]')) { actionSheet.hidden = true; return; }
    const removeAvailability = event.target.closest('[data-remove-availability]'); if (removeAvailability) { Store.deleteAdminItem('staffAvailability', removeAvailability.dataset.removeAvailability); render(); toast('Unavailable time removed'); return; }
    const clock = event.target.closest('[data-clock-action]'); if (clock) { handleClockAction(clock.dataset.clockAction); return; }
    const correction = event.target.closest('[data-timesheet-correction]');
    if (correction) { const note = window.prompt('What needs to be corrected on this time entry?'); if (!note?.trim()) return; Store.updateAdminItem('timeEntries', correction.dataset.timesheetCorrection, { status: 'correction_requested', correctionReason: note.trim(), updatedAt: new Date().toISOString() }); notifyAdmin('timesheet_correction', 'Timesheet correction requested', note.trim(), correction.dataset.timesheetCorrection, session().id); render(); toast('Correction request sent'); }
  });

  actionForm.addEventListener('submit', event => {
    event.preventDefault(); const values = Object.fromEntries(new FormData(actionForm).entries()); const staff = session(); const shift = Store.getAdminData().staffSchedules.find(item => item.id === values.shiftId && item.staffId === staff.id); if (!shift) return;
    if (values.action === 'declined') { const result = Domain.respondToAssignment({ id: shift.id, shiftId: shift.id, responseStatus: legacyStatus(shift.status) }, 'declined', new Date().toISOString(), values.reason); Store.updateAdminItem('staffSchedules', shift.id, { status: result.responseStatus, responseReason: result.responseReason, respondedAt: result.respondedAt }); notifyAdmin('shift_declined', 'Shift declined', `${staff.name || staff.email}: ${result.responseReason}`, shift.id, staff.id); toast('Shift declined and scheduling was notified'); }
    else { const result = Domain.respondToAssignment({ id: shift.id, shiftId: shift.id, responseStatus: legacyStatus(shift.status) }, 'change_requested', new Date().toISOString(), values.reason, { startAt: values.requestedStart, endAt: values.requestedEnd }); const requestId = uid('SCR'); Store.addAdminItem('shiftChangeRequests', { id: requestId, assignmentId: shift.id, shiftId: shift.id, staffId: staff.id, status: 'pending', original: { startAt: `${shift.date}T${shift.start}`, endAt: `${shift.date}T${shift.end}` }, proposed: result.proposed, reason: result.responseReason, requestedAt: result.respondedAt }); Store.updateAdminItem('staffSchedules', shift.id, { status: 'change_requested', changeRequestId: requestId, authoritativeStatus: legacyStatus(shift.status), updated: result.respondedAt }); notifyAdmin('schedule_change_requested', 'Schedule change requested', `${staff.name || staff.email}: ${result.responseReason}`, requestId, staff.id); toast('Change request sent. Your current shift stays active until approval.'); }
    actionSheet.hidden = true; render();
  });

  workspace.querySelector('#staffAvailabilityForm').addEventListener('submit', event => { event.preventDefault(); const staff = session(); const values = Object.fromEntries(new FormData(event.currentTarget).entries()); if (values.end <= values.start) { toast('Unavailable end time must be after the start time'); return; } const id = uid('AVL'); Store.addAdminItem('staffAvailability', { id, staffId: staff.id, date: values.date, start: values.start, end: values.end, reason: values.reason.trim(), createdAt: new Date().toISOString() }); notifyAdmin('availability_recorded', 'Unavailable time recorded', `${staff.name || staff.email} is unavailable ${displayDate(values.date)} ${displayTime(values.start)}–${displayTime(values.end)}.`, id, staff.id); event.currentTarget.reset(); render(); toast('Unavailable time recorded'); });
  workspace.querySelector('#staffTimeOffForm').addEventListener('submit', event => { event.preventDefault(); const staff = session(); const values = Object.fromEntries(new FormData(event.currentTarget).entries()); try { const request = Domain.createTimeOffRequest({ id: uid('TOR'), staffId: staff.id, startAt: values.startAt, endAt: values.endAt, reason: values.reason.trim() }); Store.addAdminItem('staffTimeOffRequests', request); notifyAdmin('time_off_requested', 'Time-off approval needed', `${staff.name || staff.email}: ${request.reason}`, request.id, staff.id); event.currentTarget.reset(); render(); toast('Time-off request sent for admin approval'); } catch (error) { toast(error.message); } });

  function handleClockAction(action) {
    const staff = session(); const data = Store.getAdminData(); const active = data.timeEntries.find(item => item.staffId === staff.id && !item.clockOut); const now = new Date().toISOString();
    if (action === 'clock-in' && !active) Store.addAdminItem('timeEntries', { id: uid('TIME'), staffId: staff.id, clockIn: now, clockOut: null, breakMinutes: 0, status: 'draft', source: 'web_clock', createdAt: now });
    if (action === 'start-break' && active && !active.breakStartedAt) Store.updateAdminItem('timeEntries', active.id, { breakStartedAt: now });
    if (action === 'end-break' && active?.breakStartedAt) Store.updateAdminItem('timeEntries', active.id, { breakMinutes: (active.breakMinutes || 0) + Domain.minutesBetween(active.breakStartedAt, now), breakStartedAt: null });
    if (action === 'clock-out' && active) { let breakMinutes = active.breakMinutes || 0; if (active.breakStartedAt) breakMinutes += Domain.minutesBetween(active.breakStartedAt, now); Store.updateAdminItem('timeEntries', active.id, { clockOut: now, breakMinutes, breakStartedAt: null, status: 'submitted', submittedAt: now }); notifyAdmin('timesheet_submitted', 'Timesheet ready for review', `${staff.name || staff.email} ended a shift.`, active.id, staff.id); }
    render(); toast(({ 'clock-in': 'Shift started', 'start-break': 'Break started', 'end-break': 'Break ended', 'clock-out': 'Shift ended and submitted' })[action]);
  }

  bell.querySelector('#staffNotificationList').addEventListener('click', event => { const item = event.target.closest('[data-notification-id]'); if (!item) return; Store.markStaffNotificationRead(session().id, item.dataset.notificationId); if (item.dataset.actionUrl?.includes('timesheet')) setTab('timesheets'); else setTab('schedule'); notificationMenu.hidden = true; notificationButton.setAttribute('aria-expanded', 'false'); renderNotifications(); });
  notificationButton.addEventListener('click', event => { event.stopPropagation(); const opening = notificationMenu.hidden; notificationMenu.hidden = !opening; notificationButton.setAttribute('aria-expanded', String(opening)); });
  document.addEventListener('click', event => { if (!bell.contains(event.target)) { notificationMenu.hidden = true; notificationButton.setAttribute('aria-expanded', 'false'); } });
  window.addEventListener('staff-session-ready', render);
  setTab(activeTab); render();
})();
