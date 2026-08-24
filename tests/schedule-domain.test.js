const test = require('node:test');
const assert = require('node:assert/strict');
const {
  respondToAssignment,
  createTimeOffRequest,
  reviewChangeRequest,
  minutesBetween,
  summarizeTimeEntry
} = require('../js/schedule-domain');

test('staff can accept or decline only a pending published assignment', () => {
  const pending = { id: 'assignment-1', responseStatus: 'pending' };
  assert.deepEqual(respondToAssignment(pending, 'accepted', '2026-08-24T14:00:00Z'), {
    ...pending,
    responseStatus: 'accepted',
    respondedAt: '2026-08-24T14:00:00Z',
    responseReason: null
  });
  assert.deepEqual(respondToAssignment(pending, 'declined', '2026-08-24T14:05:00Z', 'Medical appointment'), {
    ...pending,
    responseStatus: 'declined',
    respondedAt: '2026-08-24T14:05:00Z',
    responseReason: 'Medical appointment'
  });
  assert.throws(() => respondToAssignment({ ...pending, responseStatus: 'accepted' }, 'declined'), /pending/i);
  assert.throws(() => respondToAssignment(pending, 'declined'), /reason/i);
});

test('requesting a schedule change leaves the original assignment authoritative', () => {
  const assignment = { id: 'assignment-2', shiftId: 'shift-2', responseStatus: 'accepted' };
  const result = respondToAssignment(assignment, 'change_requested', '2026-08-24T15:00:00Z', 'Need a later start', {
    startAt: '2026-08-28T14:00:00-04:00',
    endAt: '2026-08-28T22:00:00-04:00'
  });
  assert.equal(result.responseStatus, 'change_requested');
  assert.equal(result.authoritativeShiftId, 'shift-2');
  assert.deepEqual(result.proposed, {
    startAt: '2026-08-28T14:00:00-04:00',
    endAt: '2026-08-28T22:00:00-04:00'
  });
});

test('time-off requests always start pending admin approval', () => {
  const request = createTimeOffRequest({
    staffId: 'staff-1',
    startAt: '2026-08-29T00:00:00-04:00',
    endAt: '2026-08-30T00:00:00-04:00',
    reason: 'Personal'
  }, '2026-08-24T16:00:00Z');
  assert.equal(request.status, 'pending');
  assert.equal(request.requestedAt, '2026-08-24T16:00:00Z');
  assert.equal(request.reviewedAt, null);
  assert.throws(() => createTimeOffRequest({ staffId: 'staff-1' }), /start.*end/i);
});

test('approving a change applies the proposal while rejecting keeps the original shift', () => {
  const request = {
    id: 'request-1',
    status: 'pending',
    original: { startAt: '2026-08-28T13:00:00-04:00', endAt: '2026-08-28T21:00:00-04:00' },
    proposed: { startAt: '2026-08-28T15:00:00-04:00', endAt: '2026-08-28T23:00:00-04:00' }
  };
  assert.deepEqual(reviewChangeRequest(request, 'approved', 'admin-1', '2026-08-24T17:00:00Z').effective, request.proposed);
  assert.deepEqual(reviewChangeRequest(request, 'rejected', 'admin-1', '2026-08-24T17:00:00Z').effective, request.original);
});

test('timesheet math supports overnight shifts and reports schedule variance', () => {
  assert.equal(minutesBetween('2026-08-24T21:00:00-04:00', '2026-08-25T05:00:00-04:00'), 480);
  assert.deepEqual(summarizeTimeEntry({
    scheduledStart: '2026-08-24T09:00:00-04:00',
    clockIn: '2026-08-24T09:04:00-04:00',
    clockOut: '2026-08-24T17:21:00-04:00',
    breakMinutes: 30,
    scheduledMinutes: 480
  }), {
    workedMinutes: 467,
    scheduledMinutes: 480,
    varianceMinutes: -13,
    warnings: ['late_clock_in']
  });
});
