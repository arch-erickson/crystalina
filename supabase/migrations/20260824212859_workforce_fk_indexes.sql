-- Cover every foreign-key lookup reported by the Supabase database advisor.
-- Nullable references use partial indexes to keep the index smaller.

create index if not exists order_items_product_id_idx
  on public.order_items (product_id);

create index if not exists reviews_approved_by_idx
  on public.reviews (approved_by)
  where approved_by is not null;

create index if not exists reviews_user_id_idx
  on public.reviews (user_id)
  where user_id is not null;

create index if not exists shift_assignments_assigned_by_idx
  on public.shift_assignments (assigned_by)
  where assigned_by is not null;

create index if not exists shift_change_requests_replacement_staff_idx
  on public.shift_change_requests (replacement_staff_id)
  where replacement_staff_id is not null;

create index if not exists shift_change_requests_reviewed_by_idx
  on public.shift_change_requests (reviewed_by)
  where reviewed_by is not null;

create index if not exists staff_notifications_created_by_idx
  on public.staff_notifications (created_by)
  where created_by is not null;

create index if not exists staff_shifts_created_by_idx
  on public.staff_shifts (created_by)
  where created_by is not null;

create index if not exists staff_shifts_updated_by_idx
  on public.staff_shifts (updated_by)
  where updated_by is not null;

create index if not exists staff_time_off_requests_reviewed_by_idx
  on public.staff_time_off_requests (reviewed_by)
  where reviewed_by is not null;

create index if not exists time_entries_reviewed_by_idx
  on public.time_entries (reviewed_by)
  where reviewed_by is not null;

create index if not exists timesheet_periods_created_by_idx
  on public.timesheet_periods (created_by)
  where created_by is not null;

create index if not exists timesheet_submissions_reviewed_by_idx
  on public.timesheet_submissions (reviewed_by)
  where reviewed_by is not null;

create index if not exists user_roles_granted_by_idx
  on public.user_roles (granted_by)
  where granted_by is not null;
