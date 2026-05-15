alter table public.roster_members
  add column if not exists can_edit_assigned_roster boolean not null default false,
  add column if not exists can_assign_volunteer_coordinators boolean not null default false,
  add column if not exists can_edit_internal_events boolean not null default false,
  add column if not exists can_edit_external_events boolean not null default false;

notify pgrst, 'reload schema';
