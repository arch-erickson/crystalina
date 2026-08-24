/* Shared weekly schedule, availability, and notifications for staff portals. */
(() => {
  const portal = document.querySelector('.portal-shell');
  const portalMain = portal?.querySelector('.portal-main');
  const portalUser = portal?.querySelector('.portal-user');
  if (!portal || !portalMain || !portalUser) return;

  const dateKey = date => {
    const pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };
  const dateFromKey = key => new Date(`${key}T12:00:00`);
  const mondayOf = value => {
    const date = new Date(value);
    const day = date.getDay();
    date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
    date.setHours(12, 0, 0, 0);
    return date;
  };
  const displayTime = value => new Date(`2026-01-01T${value}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const initialDate = new Date();
  if (initialDate.getDay() === 0) initialDate.setDate(initialDate.getDate() + 1);
  const currentMonday = dateKey(mondayOf(initialDate));

  const bell = document.createElement('div');
  bell.className = 'staff-notification-wrap';
  bell.innerHTML = `<button class="staff-notification-bell" id="staffNotificationBell" type="button" aria-label="Open staff notifications" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span id="staffNotificationCount" hidden>0</span></button><div class="staff-notification-menu" id="staffNotificationMenu" hidden><header><strong>Notifications</strong><span>Schedule updates</span></header><div id="staffNotificationList"></div></div>`;
  portalUser.insertBefore(bell, portalUser.lastElementChild);

  const panel = document.createElement('section');
  panel.className = 'admin-panel staff-self-schedule';
  panel.innerHTML = `<div class="panel-title-row"><div><h3>My Weekly Schedule</h3><p class="admin-subtitle">Confirm locked shifts and tell dispatch when you are unavailable.</p></div><label class="field schedule-week-field"><span>Week of</span><input id="staffWeekPicker" type="date" value="${currentMonday}"></label></div><div class="staff-week-strip" id="staffWeekStrip"></div><form class="staff-availability-form" id="staffAvailabilityForm"><div><strong>Mark a day unavailable</strong><span>Admin can override it, but they will see a warning before scheduling you.</span></div><label class="field"><span>Date</span><input name="date" type="date" required></label><label class="field"><span>Reason</span><input name="reason" placeholder="Optional note"></label><button class="btn btn-sm btn-outline" type="submit">Add Unavailable Day</button></form><div class="staff-unavailable-list" id="staffUnavailableList"></div>`;
  const stats = portalMain.querySelector('.stat-cards');
  if (stats) stats.insertAdjacentElement('afterend', panel); else portalMain.prepend(panel);

  const weekPicker = panel.querySelector('#staffWeekPicker');
  const weekStrip = panel.querySelector('#staffWeekStrip');
  const unavailableList = panel.querySelector('#staffUnavailableList');
  const notificationButton = bell.querySelector('#staffNotificationBell');
  const notificationMenu = bell.querySelector('#staffNotificationMenu');

  function session() { return Store.currentStaff(); }
  function weekDates() {
    const start = mondayOf(dateFromKey(weekPicker.value));
    return Array.from({ length: 7 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return date; });
  }
  function statusClass(status) { return status.startsWith('Confirmed') ? 'confirmed' : status.startsWith('Awaiting') ? 'awaiting' : 'tentative'; }

  function renderNotifications() {
    const staff = session(); if (!staff) return;
    const items = Store.getStaffNotifications(staff.id).sort((a, b) => String(b.sent).localeCompare(String(a.sent)));
    const unread = items.filter(item => !item.read).length;
    const count = bell.querySelector('#staffNotificationCount');
    count.textContent = unread > 9 ? '9+' : unread;
    count.hidden = !unread;
    bell.querySelector('#staffNotificationList').innerHTML = items.length ? items.map(item => `<article class="staff-notification-item ${item.read ? '' : 'unread'}"><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.message)}</p><time>${new Date(item.sent).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</time></article>`).join('') : '<p class="staff-notification-empty">No notifications yet.</p>';
  }

  function render() {
    const staff = session();
    if (!staff || portal.hidden) return;
    const data = Store.getAdminData();
    const dates = weekDates();
    const keys = new Set(dates.map(dateKey));
    const shifts = data.staffSchedules.filter(item => item.staffId === staff.id && keys.has(item.date));
    const unavailable = data.staffAvailability.filter(item => item.staffId === staff.id && keys.has(item.date));
    weekStrip.innerHTML = dates.map(date => {
      const key = dateKey(date);
      const dayShifts = shifts.filter(item => item.date === key).sort((a, b) => a.start.localeCompare(b.start));
      const unavailableDay = unavailable.find(item => item.date === key);
      return `<article class="staff-week-day ${unavailableDay ? 'is-unavailable' : ''}"><header><strong>${date.toLocaleDateString('en-US', { weekday: 'short' })}</strong><span>${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></header>${unavailableDay ? `<span class="staff-day-unavailable">Unavailable</span>` : ''}<div>${dayShifts.map(shift => `<section class="staff-self-shift ${statusClass(shift.status)}"><strong>${displayTime(shift.start)}–${displayTime(shift.end)}</strong><span>${escapeHTML(shift.status)}</span>${shift.notes ? `<small>${escapeHTML(shift.notes)}</small>` : ''}${shift.status === 'Awaiting staff confirmation' ? `<button class="btn btn-sm btn-primary" type="button" onclick="StaffScheduleUI.confirm('${shift.id}')">Confirm Shift</button>` : ''}</section>`).join('') || '<p>No shift</p>'}</div></article>`;
    }).join('');
    unavailableList.innerHTML = unavailable.length ? `<strong>Unavailable this week</strong>${unavailable.sort((a, b) => a.date.localeCompare(b.date)).map(item => `<span>${dateFromKey(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}${item.reason ? ` · ${escapeHTML(item.reason)}` : ''}<button type="button" onclick="StaffScheduleUI.removeUnavailable('${item.id}')" aria-label="Remove unavailable day">×</button></span>`).join('')}` : '';
    renderNotifications();
  }

  window.StaffScheduleUI = {
    render,
    confirm(id) {
      const staff = session();
      const shift = Store.getAdminData().staffSchedules.find(item => item.id === id && item.staffId === staff.id);
      if (!shift) return;
      Store.updateAdminItem('staffSchedules', id, { status: 'Confirmed by staff', confirmedAt: new Date().toISOString(), updated: new Date().toISOString() });
      Store.logActivity(staff.id, 'Confirmed weekly schedule shift', id);
      render(); toast('Shift confirmed');
    },
    removeUnavailable(id) {
      Store.deleteAdminItem('staffAvailability', id);
      Store.logActivity(session().id, 'Removed unavailable day', id);
      render(); toast('Availability updated');
    }
  };

  panel.querySelector('#staffAvailabilityForm').addEventListener('submit', event => {
    event.preventDefault();
    const staff = session(); const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const exists = Store.getAdminData().staffAvailability.some(item => item.staffId === staff.id && item.date === values.date);
    if (exists) { toast('That day is already marked unavailable'); return; }
    const id = `AVL-${String(Date.now()).slice(-6)}`;
    Store.addAdminItem('staffAvailability', { id, staffId: staff.id, date: values.date, reason: values.reason.trim(), created: new Date().toISOString() });
    Store.logActivity(staff.id, 'Marked a day unavailable', id);
    event.currentTarget.reset(); render(); toast('Unavailable day added');
  });
  weekPicker.addEventListener('change', () => { weekPicker.value = dateKey(mondayOf(dateFromKey(weekPicker.value))); render(); });
  notificationButton.addEventListener('click', event => {
    event.stopPropagation();
    const opening = notificationMenu.hidden;
    notificationMenu.hidden = !opening;
    notificationButton.setAttribute('aria-expanded', String(opening));
    if (opening) { Store.markStaffNotificationsRead(session().id); renderNotifications(); }
  });
  document.addEventListener('click', event => { if (!bell.contains(event.target)) { notificationMenu.hidden = true; notificationButton.setAttribute('aria-expanded', 'false'); } });
  window.addEventListener('staff-session-ready', render);
  render();
})();
