create or replace function public.remove_event_volunteer_signup(
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
  target_profile record;
  can_manage_as_roster_admin boolean := false;
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

  select event_owner_id, event_coordinator_id, is_followers_only
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
        or (
          managed_event.is_followers_only = true
          and roster_member.can_edit_internal_events = true
        )
        or (
          coalesce(managed_event.is_followers_only, false) = false
          and roster_member.can_edit_external_events = true
        )
      )
  )
    into can_manage_as_roster_admin;

  if acting_user_id <> managed_event.event_owner_id
    and acting_user_id <> managed_event.event_coordinator_id
    and can_manage_as_roster_admin = false then
    raise exception 'You do not have permission to remove this volunteer';
  end if;

  select user_type
    into target_profile
  from public.profiles
  where id = target_user_id;

  if not found then
    raise exception 'Volunteer profile not found';
  end if;

  if target_profile.user_type in ('organization', 'nonprofit') then
    delete from public.event_signups
    where event_id = target_event_id
      and invited_by_entity_id = target_user_id;
  end if;

  delete from public.event_signups
  where event_id = target_event_id
    and user_id = target_user_id
    and status in ('volunteered', 'confirmed');

  if not found then
    raise exception 'Volunteer signup not found';
  end if;
end;
$$;

grant execute on function public.remove_event_volunteer_signup(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
