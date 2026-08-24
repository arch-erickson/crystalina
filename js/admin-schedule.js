/* Crystalina admin weekly staff scheduling */
(() => {
  const board = document.getElementById('weeklyScheduleBoard');
  if (!board) return;
  const modal = document.getElementById('staffScheduleModal');
  const form = document.getElementById('staffScheduleForm');
  const weekInput = document.getElementById('scheduleWeek');
  const staffInput = document.getElementById('scheduleStaffId');
  const dateInput = document.getElementById('scheduleDate');
  const stateInput = document.getElementById('scheduleState');
  const conflict = document.getElementById('scheduleConflictWarning');
  const error = document.getElementById('scheduleError');

  const dateKey = date => { const part = value => String(value).padStart(2, '0'); return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}`; };
  const dateFromKey = key => new Date(`${key}T12:00:00`);
  const mondayOf = value => { const date = new Date(value); const day = date.getDay(); date.setDate(date.getDate() - (day === 0 ? 6 : day - 1)); date.setHours(12, 0, 0, 0); return date; };
  const displayTime = value => new Date(`2026-01-01T${value}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const staffName = id => Store.getAdminData().staff.find(member => member.id === id)?.name || id;
  const statusClass = status => status.startsWith('Confirmed') ? 'confirmed' : status.startsWith('Awaiting') ? 'awaiting' : 'tentative';

  function currentWeek() { return mondayOf(dateFromKey(weekInput.value)); }
  function weekDates() { const start = currentWeek(); return Array.from({ length: 7 }, (_, index) => { const day = new Date(start); day.setDate(start.getDate() + index); return day; }); }

  function setError(message = '') { error.textContent = message; error.classList.toggle('show', Boolean(message)); }
  function closeModal() { modal.classList.remove('open'); form.reset(); setError(); conflict.hidden = true; }
  function unavailableEntry(staffId, date) { return Store.getAdminData().staffAvailability.find(item => item.staffId === staffId && item.date === date); }
  function checkConflict() {
    const unavailable = unavailableEntry(staffInput.value, dateInput.value);
    conflict.hidden = !unavailable;
    if (unavailable) conflict.querySelector('span').textContent = `${staffName(staffInput.value)} marked this day unavailable${unavailable.reason ? `: ${unavailable.reason}` : '.'} You can still save the shift.`;
  }

  function openModal(item = null, preferredDate = '') {
    const data = Store.getAdminData();
    document.getElementById('staffScheduleTitle').textContent = item ? 'Edit Staff Shift' : 'Add Staff Shift';
    document.getElementById('staffScheduleId').value = item?.id || '';
    staffInput.innerHTML = data.staff.map(member => `<option value="${member.id}" ${member.id === item?.staffId ? 'selected' : ''}>${escapeHTML(member.name)} · ${escapeHTML(member.id)}</option>`).join('');
    dateInput.value = item?.date || preferredDate || dateKey(currentWeek());
    document.getElementById('scheduleStart').value = item?.start || '09:00';
    document.getElementById('scheduleEnd').value = item?.end || '17:00';
    document.getElementById('scheduleNotes').value = item?.notes || '';
    stateInput.innerHTML = '<option value="Tentative">Tentative</option><option value="Awaiting staff confirmation">Lock &amp; request confirmation</option><option value="Confirmed by staff">Confirmed by staff</option>';
    stateInput.value = item?.status || 'Tentative';
    checkConflict(); modal.classList.add('open');
  }

  function render() {
    const data = Store.getAdminData();
    const dates = weekDates();
    board.innerHTML = dates.map(date => {
      const key = dateKey(date);
      const schedules = data.staffSchedules.filter(item => item.date === key).sort((a, b) => a.start.localeCompare(b.start));
      const unavailable = data.staffAvailability.filter(item => item.date === key);
      return `<section class="schedule-day"><header><div><strong>${date.toLocaleDateString('en-US', { weekday: 'short' })}</strong><span>${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></div><button class="schedule-add" onclick="AdminScheduleUI.add('${key}')" aria-label="Add shift on ${key}">+</button></header><div class="schedule-day-body">${unavailable.map(item => `<div class="unavailable-chip" title="${escapeHTML(item.reason || 'Unavailable')}">${escapeHTML(staffName(item.staffId))} unavailable</div>`).join('')}${schedules.map(item => { const isConflict = Boolean(unavailableEntry(item.staffId, key)); return `<article class="schedule-shift ${statusClass(item.status)} ${isConflict ? 'has-conflict' : ''}"><button class="schedule-shift-main" onclick="AdminScheduleUI.edit('${item.id}')"><strong>${escapeHTML(staffName(item.staffId))}</strong><span>${displayTime(item.start)}–${displayTime(item.end)}</span><small>${escapeHTML(item.status)}</small>${item.notes ? `<small>${escapeHTML(item.notes)}</small>` : ''}${isConflict ? '<em>Availability conflict</em>' : ''}</button><button class="schedule-delete" onclick="AdminScheduleUI.remove('${item.id}')" aria-label="Delete shift">×</button></article>`; }).join('') || '<p class="schedule-empty">No shifts</p>'}</div></section>`;
    }).join('');
  }

  window.AdminScheduleUI = {
    render,
    add(date) { openModal(null, date); },
    edit(id) { openModal(Store.getAdminData().staffSchedules.find(item => item.id === id)); },
    remove(id) {
      if (!confirm('Delete this staff shift?')) return;
      Store.deleteAdminItem('staffSchedules', id); render(); toast('Shift deleted');
    }
  };

  form.addEventListener('submit', event => {
    event.preventDefault(); setError();
    const id = document.getElementById('staffScheduleId').value;
    const start = document.getElementById('scheduleStart').value; const end = document.getElementById('scheduleEnd').value;
    if (end <= start) { setError('End time must be later than start time.'); return; }
    const values = { staffId: staffInput.value, date: dateInput.value, start, end, status: stateInput.value, notes: document.getElementById('scheduleNotes').value.trim(), createdBy: Store.currentUser()?.id || 'admin', updated: new Date().toISOString() };
    const savedId = id || `SCH-${String(Date.now()).slice(-6)}`;
    const hadConflict = !conflict.hidden;
    if (id) Store.updateAdminItem('staffSchedules', id, values); else Store.addAdminItem('staffSchedules', { id: savedId, ...values });
    if (values.status === 'Awaiting staff confirmation') Store.addStaffNotification({ staffId: values.staffId, title: 'Schedule confirmation requested', message: `Please confirm your ${dateFromKey(values.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} shift from ${displayTime(values.start)} to ${displayTime(values.end)}.`, scheduleId: savedId });
    closeModal(); render(); toast(hadConflict ? 'Shift saved with an availability warning' : 'Staff shift saved');
  });

  document.getElementById('lockWeekBtn').addEventListener('click', () => {
    const data = Store.getAdminData(); const keys = new Set(weekDates().map(dateKey));
    const tentative = data.staffSchedules.filter(item => keys.has(item.date) && item.status === 'Tentative');
    if (!tentative.length) { toast('No tentative shifts to lock this week'); return; }
    const staffIds = new Set();
    tentative.forEach(item => { item.status = 'Awaiting staff confirmation'; item.updated = new Date().toISOString(); staffIds.add(item.staffId); });
    Store.saveAdminCollection('staffSchedules', data.staffSchedules);
    staffIds.forEach(staffId => Store.addStaffNotification({ staffId, title: 'Your weekly schedule is ready', message: `Your schedule for the week of ${currentWeek().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} is locked and ready for confirmation.`, scheduleId: '' }));
    render(); toast(`${tentative.length} shift(s) locked and ${staffIds.size} staff member(s) notified`);
  });

  document.getElementById('addScheduleBtn').addEventListener('click', () => openModal());
  document.getElementById('staffScheduleClose').addEventListener('click', closeModal);
  document.getElementById('staffScheduleCancel').addEventListener('click', closeModal);
  modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
  [staffInput, dateInput].forEach(input => input.addEventListener('change', checkConflict));
  weekInput.addEventListener('change', () => { weekInput.value = dateKey(currentWeek()); render(); });
  const initialDate = new Date();
  if (initialDate.getDay() === 0) initialDate.setDate(initialDate.getDate() + 1);
  weekInput.value = dateKey(mondayOf(initialDate));
  render();
})();
