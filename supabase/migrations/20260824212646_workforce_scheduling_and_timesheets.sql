-- Workforce scheduling and timesheets. This migration intentionally contains no seed data.
-- Staff identity is always public.profiles.id, with authorization derived from public.user_roles.

create type public.workforce_shift_status as enum ('draft', 'scheduled', 'cancelled', 'completed');
create type public.workforce_assignment_status as enum ('assigned', 'confirmed', 'declined', 'cancelled');
create type public.workforce_change_request_type as enum ('schedule_change', 'shift_swap', 'coverage_request', 'release_shift');
create type public.workforce_request_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type public.workforce_availability_status as enum ('available', 'unavailable', 'preferred');
create type public.workforce_notification_type as enum ('schedule', 'assignment', 'change_request', 'time_off', 'timesheet', 'system');
create type public.workforce_time_entry_status as enum ('open', 'submitted', 'approved', 'rejected');
create type public.workforce_timesheet_status as enum ('open', 'submitted', 'approved', 'rejected', 'locked');
create type public.workforce_audit_action as enum ('created', 'updated', 'deleted', 'submitted', 'approved', 'rejected', 'cancelled');

create function private.is_workforce_member(subject_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select subject_user_id is not null
    and exists (
      select 1
      from public.user_roles
      where user_id = subject_user_id
        and role in ('admin', 'manager', 'technician', 'sales')
    );
$$;

revoke all on function private.is_workforce_member(uuid) from public;
grant execute on function private.is_workforce_member(uuid) to authenticated;

create table public.staff_shifts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  location text,
  notes text,
  scheduled_start_at timestamptz not null,
  scheduled_end_at timestamptz not null,
  scheduled_range tstzrange generated always as (tstzrange(scheduled_start_at, scheduled_end_at, '[)')) stored,
  status public.workforce_shift_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (scheduled_end_at > scheduled_start_at)
);

create table public.shift_assignments (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.staff_shifts(id) on delete cascade,
  staff_id uuid not null references public.profiles(id) on delete cascade,
  assignment_status public.workforce_assignment_status not null default 'assigned',
  response_note text,
  responded_at timestamptz,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shift_id, staff_id),
  check (
    (assignment_status in ('confirmed', 'declined') and responded_at is not null)
    or (assignment_status not in ('confirmed', 'declined'))
  )
);

create table public.shift_change_requests (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.shift_assignments(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  request_type public.workforce_change_request_type not null,
  replacement_staff_id uuid references public.profiles(id) on delete set null,
  requested_start_at timestamptz,
  requested_end_at timestamptz,
  reason text not null check (char_length(btrim(reason)) between 1 and 2000),
  status public.workforce_request_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (requested_start_at is null and requested_end_at is null)
    or (requested_start_at is not null and requested_end_at is not null and requested_end_at > requested_start_at)
  ),
  check (
    (status in ('approved', 'rejected') and reviewed_by is not null and reviewed_at is not null)
    or status not in ('approved', 'rejected')
  )
);

create table public.staff_availability (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.profiles(id) on delete cascade,
  availability_range tstzrange not null,
  availability_status public.workforce_availability_status not null default 'available',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not isempty(availability_range))
);

create table public.staff_time_off_requests (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.profiles(id) on delete cascade,
  requested_range tstzrange not null,
  reason text not null check (char_length(btrim(reason)) between 1 and 2000),
  status public.workforce_request_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not isempty(requested_range)),
  check (
    (status in ('approved', 'rejected') and reviewed_by is not null and reviewed_at is not null)
    or status not in ('approved', 'rejected')
  )
);

create table public.staff_notifications (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.profiles(id) on delete cascade,
  notification_type public.workforce_notification_type not null default 'system',
  title text not null check (char_length(btrim(title)) between 1 and 200),
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  read_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.profiles(id) on delete cascade,
  assignment_id uuid references public.shift_assignments(id) on delete set null,
  started_at timestamptz not null,
  ended_at timestamptz,
  break_minutes integer not null default 0 check (break_minutes between 0 and 1440),
  note text,
  status public.workforce_time_entry_status not null default 'open',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at > started_at),
  check (ended_at is null or break_minutes * interval '1 minute' < ended_at - started_at),
  check (
    (status in ('approved', 'rejected') and reviewed_by is not null and reviewed_at is not null)
    or status not in ('approved', 'rejected')
  )
);

create table public.timesheet_periods (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  period_range daterange generated always as (daterange(period_start, period_end, '[)')) stored,
  status public.workforce_timesheet_status not null default 'open',
  closes_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (period_start, period_end),
  check (period_end > period_start),
  check (closes_at is null or closes_at >= period_start::timestamptz)
);

create table public.timesheet_submissions (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.timesheet_periods(id) on delete restrict,
  staff_id uuid not null references public.profiles(id) on delete cascade,
  status public.workforce_timesheet_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (period_id, staff_id),
  check (status <> 'open'),
  check (
    (status in ('approved', 'rejected', 'locked') and reviewed_by is not null and reviewed_at is not null)
    or status not in ('approved', 'rejected', 'locked')
  )
);

create table public.workforce_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action public.workforce_audit_action not null,
  entity_table text not null check (entity_table in (
    'staff_shifts', 'shift_assignments', 'shift_change_requests', 'staff_availability',
    'staff_time_off_requests', 'staff_notifications', 'time_entries', 'timesheet_periods', 'timesheet_submissions'
  )),
  entity_id uuid not null,
  before_data jsonb,
  after_data jsonb,
  occurred_at timestamptz not null default now(),
  check (before_data is null or jsonb_typeof(before_data) = 'object'),
  check (after_data is null or jsonb_typeof(after_data) = 'object')
);

create index staff_shifts_scheduled_range_idx on public.staff_shifts using gist (scheduled_range);
create index staff_shifts_status_start_idx on public.staff_shifts (status, scheduled_start_at);
create index shift_assignments_staff_status_idx on public.shift_assignments (staff_id, assignment_status);
create index shift_assignments_shift_idx on public.shift_assignments (shift_id);
create index shift_change_requests_requester_status_idx on public.shift_change_requests (requester_id, status, created_at desc);
create index shift_change_requests_assignment_status_idx on public.shift_change_requests (assignment_id, status);
create index staff_availability_staff_status_idx on public.staff_availability (staff_id, availability_status);
create index staff_availability_range_idx on public.staff_availability using gist (availability_range);
create index staff_time_off_requests_staff_status_idx on public.staff_time_off_requests (staff_id, status, created_at desc);
create index staff_time_off_requests_range_idx on public.staff_time_off_requests using gist (requested_range);
create index staff_notifications_unread_idx on public.staff_notifications (staff_id, created_at desc) where read_at is null;
create index time_entries_staff_started_idx on public.time_entries (staff_id, started_at desc);
create index time_entries_assignment_idx on public.time_entries (assignment_id) where assignment_id is not null;
create index timesheet_periods_range_idx on public.timesheet_periods using gist (period_range);
create index timesheet_submissions_staff_status_idx on public.timesheet_submissions (staff_id, status, submitted_at desc);
create index workforce_audit_log_entity_idx on public.workforce_audit_log (entity_table, entity_id, occurred_at desc);
create index workforce_audit_log_actor_idx on public.workforce_audit_log (actor_id, occurred_at desc) where actor_id is not null;

-- RLS protects rows. These guards prevent a staff member from changing privileged columns
-- on a row they are allowed to update, while leaving administrators and managers unrestricted.
create function private.guard_staff_assignment_response()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not (private.has_role('admin') or private.has_role('manager')) then
    if new.shift_id is distinct from old.shift_id
      or new.staff_id is distinct from old.staff_id
      or new.assigned_by is distinct from old.assigned_by
      or new.created_at is distinct from old.created_at
      or new.assignment_status not in ('confirmed', 'declined')
      or new.responded_at is null then
      raise exception 'Staff may only respond to their existing shift assignment';
    end if;
  end if;
  return new;
end;
$$;

create function private.guard_staff_change_request_cancellation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not (private.has_role('admin') or private.has_role('manager')) then
    if new.assignment_id is distinct from old.assignment_id
      or new.requester_id is distinct from old.requester_id
      or new.request_type is distinct from old.request_type
      or new.replacement_staff_id is distinct from old.replacement_staff_id
      or new.requested_start_at is distinct from old.requested_start_at
      or new.requested_end_at is distinct from old.requested_end_at
      or new.reason is distinct from old.reason
      or new.reviewed_by is distinct from old.reviewed_by
      or new.reviewed_at is distinct from old.reviewed_at
      or new.review_note is distinct from old.review_note
      or new.created_at is distinct from old.created_at
      or new.status <> 'cancelled' then
      raise exception 'Staff may only cancel their pending change request';
    end if;
  end if;
  return new;
end;
$$;

create function private.guard_staff_time_off_cancellation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not (private.has_role('admin') or private.has_role('manager')) then
    if new.staff_id is distinct from old.staff_id
      or new.requested_range is distinct from old.requested_range
      or new.reason is distinct from old.reason
      or new.reviewed_by is distinct from old.reviewed_by
      or new.reviewed_at is distinct from old.reviewed_at
      or new.review_note is distinct from old.review_note
      or new.created_at is distinct from old.created_at
      or new.status <> 'cancelled' then
      raise exception 'Staff may only cancel their pending time-off request';
    end if;
  end if;
  return new;
end;
$$;

create function private.guard_staff_notification_read()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not (private.has_role('admin') or private.has_role('manager')) then
    if new.staff_id is distinct from old.staff_id
      or new.notification_type is distinct from old.notification_type
      or new.title is distinct from old.title
      or new.body is distinct from old.body
      or new.payload is distinct from old.payload
      or new.created_by is distinct from old.created_by
      or new.created_at is distinct from old.created_at
      or new.read_at is null then
      raise exception 'Staff may only mark their notification as read';
    end if;
  end if;
  return new;
end;
$$;

create function private.guard_staff_time_entry_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not (private.has_role('admin') or private.has_role('manager')) then
    if new.staff_id is distinct from old.staff_id
      or new.assignment_id is distinct from old.assignment_id
      or new.reviewed_by is distinct from old.reviewed_by
      or new.reviewed_at is distinct from old.reviewed_at
      or new.created_at is distinct from old.created_at
      or new.status not in ('open', 'submitted') then
      raise exception 'Staff may only edit or submit their own unreviewed time entry';
    end if;
  end if;
  return new;
end;
$$;

create function private.guard_staff_timesheet_resubmission()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not (private.has_role('admin') or private.has_role('manager')) then
    if new.period_id is distinct from old.period_id
      or new.staff_id is distinct from old.staff_id
      or new.submitted_at is distinct from old.submitted_at
      or new.reviewed_by is distinct from old.reviewed_by
      or new.reviewed_at is distinct from old.reviewed_at
      or new.review_note is distinct from old.review_note
      or new.created_at is distinct from old.created_at
      or new.status <> 'submitted' then
      raise exception 'Staff may only resubmit their rejected timesheet';
    end if;
  end if;
  return new;
end;
$$;

create function private.log_workforce_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.workforce_audit_log (
    actor_id,
    action,
    entity_table,
    entity_id,
    before_data,
    after_data
  )
  values (
    (select auth.uid()),
    case tg_op
      when 'INSERT' then 'created'::public.workforce_audit_action
      when 'UPDATE' then 'updated'::public.workforce_audit_action
      when 'DELETE' then 'deleted'::public.workforce_audit_action
    end,
    tg_table_name,
    case when tg_op = 'DELETE' then old.id else new.id end,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

revoke all on function private.guard_staff_assignment_response() from public;
revoke all on function private.guard_staff_change_request_cancellation() from public;
revoke all on function private.guard_staff_time_off_cancellation() from public;
revoke all on function private.guard_staff_notification_read() from public;
revoke all on function private.guard_staff_time_entry_update() from public;
revoke all on function private.guard_staff_timesheet_resubmission() from public;
revoke all on function private.log_workforce_audit() from public;

create trigger assignment_response_guard before update on public.shift_assignments
for each row execute function private.guard_staff_assignment_response();
create trigger change_request_cancellation_guard before update on public.shift_change_requests
for each row execute function private.guard_staff_change_request_cancellation();
create trigger time_off_cancellation_guard before update on public.staff_time_off_requests
for each row execute function private.guard_staff_time_off_cancellation();
create trigger notification_read_guard before update on public.staff_notifications
for each row execute function private.guard_staff_notification_read();
create trigger time_entry_update_guard before update on public.time_entries
for each row execute function private.guard_staff_time_entry_update();
create trigger timesheet_resubmission_guard before update on public.timesheet_submissions
for each row execute function private.guard_staff_timesheet_resubmission();

create trigger staff_shifts_set_updated_at before update on public.staff_shifts
for each row execute function private.set_updated_at();
create trigger shift_assignments_set_updated_at before update on public.shift_assignments
for each row execute function private.set_updated_at();
create trigger shift_change_requests_set_updated_at before update on public.shift_change_requests
for each row execute function private.set_updated_at();
create trigger staff_availability_set_updated_at before update on public.staff_availability
for each row execute function private.set_updated_at();
create trigger staff_time_off_requests_set_updated_at before update on public.staff_time_off_requests
for each row execute function private.set_updated_at();
create trigger staff_notifications_set_updated_at before update on public.staff_notifications
for each row execute function private.set_updated_at();
create trigger time_entries_set_updated_at before update on public.time_entries
for each row execute function private.set_updated_at();
create trigger timesheet_periods_set_updated_at before update on public.timesheet_periods
for each row execute function private.set_updated_at();
create trigger timesheet_submissions_set_updated_at before update on public.timesheet_submissions
for each row execute function private.set_updated_at();

create trigger staff_shifts_audit after insert or update or delete on public.staff_shifts
for each row execute function private.log_workforce_audit();
create trigger shift_assignments_audit after insert or update or delete on public.shift_assignments
for each row execute function private.log_workforce_audit();
create trigger shift_change_requests_audit after insert or update or delete on public.shift_change_requests
for each row execute function private.log_workforce_audit();
create trigger staff_availability_audit after insert or update or delete on public.staff_availability
for each row execute function private.log_workforce_audit();
create trigger staff_time_off_requests_audit after insert or update or delete on public.staff_time_off_requests
for each row execute function private.log_workforce_audit();
create trigger staff_notifications_audit after insert or update or delete on public.staff_notifications
for each row execute function private.log_workforce_audit();
create trigger time_entries_audit after insert or update or delete on public.time_entries
for each row execute function private.log_workforce_audit();
create trigger timesheet_periods_audit after insert or update or delete on public.timesheet_periods
for each row execute function private.log_workforce_audit();
create trigger timesheet_submissions_audit after insert or update or delete on public.timesheet_submissions
for each row execute function private.log_workforce_audit();

revoke all on table public.staff_shifts, public.shift_assignments, public.shift_change_requests,
  public.staff_availability, public.staff_time_off_requests, public.staff_notifications,
  public.time_entries, public.timesheet_periods, public.timesheet_submissions,
  public.workforce_audit_log from anon;

grant select, insert, update, delete on table public.staff_shifts, public.shift_assignments,
  public.shift_change_requests, public.staff_availability, public.staff_time_off_requests,
  public.staff_notifications, public.time_entries, public.timesheet_periods,
  public.timesheet_submissions to authenticated;
grant select on table public.workforce_audit_log to authenticated;

alter table public.staff_shifts enable row level security;
alter table public.shift_assignments enable row level security;
alter table public.shift_change_requests enable row level security;
alter table public.staff_availability enable row level security;
alter table public.staff_time_off_requests enable row level security;
alter table public.staff_notifications enable row level security;
alter table public.time_entries enable row level security;
alter table public.timesheet_periods enable row level security;
alter table public.timesheet_submissions enable row level security;
alter table public.workforce_audit_log enable row level security;

-- Admins and managers can run workforce operations. Staff policies below are scoped to the caller's own rows.
create policy "workforce_operations_manage_shifts" on public.staff_shifts for all to authenticated
using (private.has_role('admin') or private.has_role('manager'))
with check (private.has_role('admin') or private.has_role('manager'));
create policy "staff_select_assigned_shifts" on public.staff_shifts for select to authenticated
using (private.is_workforce_member((select auth.uid())) and exists (
  select 1 from public.shift_assignments assignment
  where assignment.shift_id = staff_shifts.id and assignment.staff_id = (select auth.uid())
));

create policy "workforce_operations_manage_assignments" on public.shift_assignments for all to authenticated
using (private.has_role('admin') or private.has_role('manager'))
with check (
  (private.has_role('admin') or private.has_role('manager'))
  and private.is_workforce_member(staff_id)
);
create policy "staff_select_own_assignments" on public.shift_assignments for select to authenticated
using (private.is_workforce_member((select auth.uid())) and staff_id = (select auth.uid()));
create policy "staff_respond_to_own_assignments" on public.shift_assignments for update to authenticated
using (private.is_workforce_member((select auth.uid())) and staff_id = (select auth.uid()) and assignment_status = 'assigned')
with check (
  private.is_workforce_member((select auth.uid()))
  and staff_id = (select auth.uid())
  and assignment_status in ('confirmed', 'declined')
  and responded_at is not null
);

create policy "workforce_operations_manage_change_requests" on public.shift_change_requests for all to authenticated
using (private.has_role('admin') or private.has_role('manager'))
with check (
  (private.has_role('admin') or private.has_role('manager'))
  and private.is_workforce_member(requester_id)
  and (replacement_staff_id is null or private.is_workforce_member(replacement_staff_id))
);
create policy "staff_select_own_change_requests" on public.shift_change_requests for select to authenticated
using (private.is_workforce_member((select auth.uid())) and requester_id = (select auth.uid()));
create policy "staff_create_own_change_requests" on public.shift_change_requests for insert to authenticated
with check (
  private.is_workforce_member((select auth.uid()))
  and requester_id = (select auth.uid())
  and status = 'pending'
  and exists (
    select 1 from public.shift_assignments assignment
    where assignment.id = assignment_id and assignment.staff_id = (select auth.uid())
  )
);
create policy "staff_cancel_own_pending_change_requests" on public.shift_change_requests for update to authenticated
using (private.is_workforce_member((select auth.uid())) and requester_id = (select auth.uid()) and status = 'pending')
with check (private.is_workforce_member((select auth.uid())) and requester_id = (select auth.uid()) and status = 'cancelled');

create policy "workforce_operations_manage_availability" on public.staff_availability for all to authenticated
using (private.has_role('admin') or private.has_role('manager'))
with check (
  (private.has_role('admin') or private.has_role('manager'))
  and private.is_workforce_member(staff_id)
);
create policy "staff_manage_own_availability" on public.staff_availability for all to authenticated
using (private.is_workforce_member((select auth.uid())) and staff_id = (select auth.uid()))
with check (private.is_workforce_member((select auth.uid())) and staff_id = (select auth.uid()));

create policy "workforce_operations_manage_time_off" on public.staff_time_off_requests for all to authenticated
using (private.has_role('admin') or private.has_role('manager'))
with check (
  (private.has_role('admin') or private.has_role('manager'))
  and private.is_workforce_member(staff_id)
);
create policy "staff_select_own_time_off" on public.staff_time_off_requests for select to authenticated
using (private.is_workforce_member((select auth.uid())) and staff_id = (select auth.uid()));
create policy "staff_create_own_time_off" on public.staff_time_off_requests for insert to authenticated
with check (private.is_workforce_member((select auth.uid())) and staff_id = (select auth.uid()) and status = 'pending');
create policy "staff_cancel_own_pending_time_off" on public.staff_time_off_requests for update to authenticated
using (private.is_workforce_member((select auth.uid())) and staff_id = (select auth.uid()) and status = 'pending')
with check (private.is_workforce_member((select auth.uid())) and staff_id = (select auth.uid()) and status = 'cancelled');

create policy "workforce_operations_manage_notifications" on public.staff_notifications for all to authenticated
using (private.has_role('admin') or private.has_role('manager'))
with check (
  (private.has_role('admin') or private.has_role('manager'))
  and private.is_workforce_member(staff_id)
);
create policy "staff_select_own_notifications" on public.staff_notifications for select to authenticated
using (private.is_workforce_member((select auth.uid())) and staff_id = (select auth.uid()));
create policy "staff_mark_own_notifications_read" on public.staff_notifications for update to authenticated
using (private.is_workforce_member((select auth.uid())) and staff_id = (select auth.uid()) and read_at is null)
with check (private.is_workforce_member((select auth.uid())) and staff_id = (select auth.uid()) and read_at is not null);

create policy "workforce_operations_manage_time_entries" on public.time_entries for all to authenticated
using (private.has_role('admin') or private.has_role('manager'))
with check (
  (private.has_role('admin') or private.has_role('manager'))
  and private.is_workforce_member(staff_id)
);
create policy "staff_select_own_time_entries" on public.time_entries for select to authenticated
using (private.is_workforce_member((select auth.uid())) and staff_id = (select auth.uid()));
create policy "staff_create_own_open_time_entries" on public.time_entries for insert to authenticated
with check (
  private.is_workforce_member((select auth.uid()))
  and staff_id = (select auth.uid())
  and status = 'open'
  and (
    assignment_id is null or exists (
      select 1 from public.shift_assignments assignment
      where assignment.id = assignment_id and assignment.staff_id = (select auth.uid())
    )
  )
);
create policy "staff_submit_own_time_entries" on public.time_entries for update to authenticated
using (private.is_workforce_member((select auth.uid())) and staff_id = (select auth.uid()) and status in ('open', 'rejected'))
with check (private.is_workforce_member((select auth.uid())) and staff_id = (select auth.uid()) and status in ('open', 'submitted'));

create policy "workforce_operations_manage_timesheet_periods" on public.timesheet_periods for all to authenticated
using (private.has_role('admin') or private.has_role('manager'))
with check (private.has_role('admin') or private.has_role('manager'));
create policy "staff_select_timesheet_periods" on public.timesheet_periods for select to authenticated
using (private.is_workforce_member((select auth.uid())));

create policy "workforce_operations_manage_timesheet_submissions" on public.timesheet_submissions for all to authenticated
using (private.has_role('admin') or private.has_role('manager'))
with check (
  (private.has_role('admin') or private.has_role('manager'))
  and private.is_workforce_member(staff_id)
);
create policy "staff_select_own_timesheet_submissions" on public.timesheet_submissions for select to authenticated
using (private.is_workforce_member((select auth.uid())) and staff_id = (select auth.uid()));
create policy "staff_create_own_timesheet_submissions" on public.timesheet_submissions for insert to authenticated
with check (private.is_workforce_member((select auth.uid())) and staff_id = (select auth.uid()) and status = 'submitted');
create policy "staff_resubmit_rejected_timesheets" on public.timesheet_submissions for update to authenticated
using (private.is_workforce_member((select auth.uid())) and staff_id = (select auth.uid()) and status = 'rejected')
with check (private.is_workforce_member((select auth.uid())) and staff_id = (select auth.uid()) and status = 'submitted');

create policy "workforce_operations_read_audit_log" on public.workforce_audit_log for select to authenticated
using (private.has_role('admin') or private.has_role('manager'));
