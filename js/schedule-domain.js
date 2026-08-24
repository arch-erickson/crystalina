/* Crystalina workforce scheduling domain rules. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CrystalinaSchedule = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const allowedResponses = new Set(['accepted', 'declined', 'change_requested']);

  function requireDate(value, label) {
    const parsed = new Date(value);
    if (!value || Number.isNaN(parsed.getTime())) throw new Error(`${label} is required`);
    return parsed;
  }

  function respondToAssignment(assignment, responseStatus, respondedAt = new Date().toISOString(), reason = '', proposed = null) {
    if (!assignment || !allowedResponses.has(responseStatus)) throw new Error('Unsupported assignment response');
    const canRequestChange = responseStatus === 'change_requested' && ['pending', 'accepted'].includes(assignment.responseStatus);
    if (!canRequestChange && assignment.responseStatus !== 'pending') throw new Error('Only a pending assignment can be accepted or declined');
    const responseReason = String(reason || '').trim();
    if (responseStatus === 'declined' && !responseReason) throw new Error('A reason is required to decline a shift');
    if (responseStatus === 'change_requested') {
      if (!responseReason) throw new Error('A reason is required to request a schedule change');
      if (!proposed?.startAt || !proposed?.endAt) throw new Error('Proposed start and end times are required');
    }
    return {
      ...assignment,
      responseStatus,
      respondedAt,
      responseReason: responseReason || null,
      ...(responseStatus === 'change_requested' ? {
        authoritativeShiftId: assignment.shiftId,
        proposed: { startAt: proposed.startAt, endAt: proposed.endAt }
      } : {})
    };
  }

  function createTimeOffRequest(values, requestedAt = new Date().toISOString()) {
    const start = requireDate(values?.startAt, 'Start and end time');
    const end = requireDate(values?.endAt, 'Start and end time');
    if (end <= start) throw new Error('End time must be later than start time');
    return {
      ...values,
      status: 'pending',
      requestedAt,
      reviewedAt: null,
      reviewedBy: null
    };
  }

  function reviewChangeRequest(request, decision, reviewerId, reviewedAt = new Date().toISOString()) {
    if (!request || request.status !== 'pending') throw new Error('Only a pending change request can be reviewed');
    if (!['approved', 'rejected'].includes(decision)) throw new Error('Decision must be approved or rejected');
    if (!reviewerId) throw new Error('Reviewer is required');
    return {
      ...request,
      status: decision,
      reviewedBy: reviewerId,
      reviewedAt,
      effective: decision === 'approved' ? request.proposed : request.original
    };
  }

  function minutesBetween(startAt, endAt) {
    const start = requireDate(startAt, 'Start time');
    const end = requireDate(endAt, 'End time');
    if (end < start) throw new Error('End time must be after start time');
    return Math.round((end - start) / 60000);
  }

  function summarizeTimeEntry(entry) {
    const grossMinutes = minutesBetween(entry.clockIn, entry.clockOut);
    const breakMinutes = Math.max(0, Number(entry.breakMinutes) || 0);
    const workedMinutes = Math.max(0, grossMinutes - breakMinutes);
    const scheduledMinutes = Math.max(0, Number(entry.scheduledMinutes) || 0);
    const warnings = [];
    if (entry.scheduledStart && requireDate(entry.clockIn, 'Clock in') > requireDate(entry.scheduledStart, 'Scheduled start')) warnings.push('late_clock_in');
    return { workedMinutes, scheduledMinutes, varianceMinutes: workedMinutes - scheduledMinutes, warnings };
  }

  return {
    respondToAssignment,
    createTimeOffRequest,
    reviewChangeRequest,
    minutesBetween,
    summarizeTimeEntry
  };
});
