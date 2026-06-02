alter table public.event_signups
  add column if not exists invitation_removed_at timestamptz,
  add column if not exists invitation_removed_by uuid references public.profiles(id) on delete set null;

drop function if exists public.get_event_signup_volunteers(uuid[]);

create or replace function public.get_event_signup_volunteers(event_ids uuid[])
returns table (
  id uuid,
  event_id uuid,
  user_id uuid,
  status text,
  event_action_timestamp timestamptz,
  check_in_at timestamptz,
  check_out_at timestamptz,
  volunteer_start_time text,
  volunteer_end_time text,
  volunteer_location text,
  volunteer_impact text,
  invited_by_entity_id uuid,
  invitation_removed_at timestamptz,
  invitation_removed_by uuid,
  full_name text,
  first_name text,
  last_name text,
  profile_picture_url text,
  nonprofit_name text,
  organization_name text,
  city text,
  zip text,
  user_type text
)
language sql
security definer
set search_path = public
as $$
  select
    signup.id,
    signup.event_id,
    signup.user_id,
    signup.status,
    signup.event_action_timestamp,
    signup.check_in_at,
    signup.check_out_at,
    signup.volunteer_start_time,
    signup.volunteer_end_time,
    signup.volunteer_location,
    signup.volunteer_impact,
    signup.invited_by_entity_id,
    signup.invitation_removed_at,
    signup.invitation_removed_by,
    profile.full_name,
    profile.first_name,
    profile.last_name,
    profile.profile_picture_url,
    profile.nonprofit_name,
    profile.organization_name,
    profile.city,
    profile.zip,
    profile.user_type
  from public.event_signups signup
  join public.profiles profile on profile.id = signup.user_id
  where signup.event_id = any(event_ids)
    and signup.status in (
      'volunteered',
      'confirmed',
      'no_show',
      'approved',
      'denied'
    )
    and (
      signup.invitation_removed_at is null
      or signup.invited_by_entity_id = auth.uid()
    );
$$;

grant execute on function public.get_event_signup_volunteers(uuid[]) to authenticated;

create or replace function public.remove_event_invitation_volunteer(
  target_event_id uuid,
  target_user_id uuid,
  target_inviter_entity_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  managed_event record;
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

  if target_inviter_entity_id is null then
    raise exception 'Organization is required';
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

  if acting_user_id <> target_inviter_entity_id
    and acting_user_id <> managed_event.event_owner_id
    and acting_user_id <> managed_event.event_coordinator_id
    and can_manage_as_roster_admin = false then
    raise exception 'You do not have permission to remove this volunteer from the organization list';
  end if;

  update public.event_signups
  set
    invitation_removed_at = now(),
    invitation_removed_by = acting_user_id,
    event_action_timestamp = now()
  where event_id = target_event_id
    and user_id = target_user_id
    and invited_by_entity_id = target_inviter_entity_id
    and invitation_removed_at is null;

  if found then
    return;
  end if;

  raise exception 'Volunteer is not assigned to this organization list';
end;
$$;

grant execute on function public.remove_event_invitation_volunteer(uuid, uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
