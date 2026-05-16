create or replace function public.deny_event_volunteer_as_no_show(
  target_event_id uuid,
  target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  managed_event record;
  target_signup record;
  can_manage_as_roster_admin boolean := false;
  action_timestamp timestamptz := now();
begin
  if acting_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if target_event_id is null then
    raise exception 'Event is required';
  end if;

  if target_user_id is null then
    raise exception 'Volunteer is required';
  end if;

  select event_owner_id, event_coordinator_id
    into managed_event
  from public.events
  where id = target_event_id;

  if not found then
    raise exception 'Event not found';
  end if;

  select exists (
    select 1
    from public.rosters roster
    join public.roster_members roster_member
      on roster_member.roster_id = roster.id
    where roster.roster_owner_id = managed_event.event_owner_id
      and roster_member.user_id = acting_user_id
      and (
        roster_member.is_admin = true
        or roster_member.can_edit_internal_events = true
        or roster_member.can_edit_external_events = true
      )
  )
    into can_manage_as_roster_admin;

  if acting_user_id <> managed_event.event_owner_id
    and acting_user_id <> managed_event.event_coordinator_id
    and can_manage_as_roster_admin = false then
    raise exception 'You do not have permission to manage this volunteer';
  end if;

  select id
    into target_signup
  from public.event_signups
  where event_id = target_event_id
    and user_id = target_user_id
    and status in ('volunteered', 'confirmed', 'approved', 'denied', 'no_show')
  order by event_action_timestamp desc
  limit 1;

  if not found then
    raise exception 'Volunteer signup not found';
  end if;

  update public.event_signups
  set
    status = 'no_show',
    check_in_at = null,
    check_out_at = null,
    volunteer_start_time = null,
    volunteer_end_time = null,
    event_action_timestamp = action_timestamp
  where id = target_signup.id;
end;
$$;

grant execute on function public.deny_event_volunteer_as_no_show(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
