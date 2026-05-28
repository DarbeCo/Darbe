drop function if exists public.remove_event_invitation_volunteer(uuid, uuid, uuid, uuid);

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
    invited_by_entity_id = null,
    event_action_timestamp = now()
  where event_id = target_event_id
    and user_id = target_user_id
    and invited_by_entity_id = target_inviter_entity_id;

  if found then
    return;
  end if;

  delete from public.event_signups
  where event_id = target_event_id
    and user_id = target_user_id
    and invited_by_entity_id is null
    and status in ('volunteered', 'confirmed')
    and (
      target_inviter_entity_id = managed_event.event_coordinator_id
      or exists (
        select 1
        from public.profiles profile
        where profile.id = target_inviter_entity_id
          and profile.user_type in ('organization', 'nonprofit')
      )
    );

  if found then
    return;
  end if;

  raise exception 'Volunteer is not assigned to this organization list';
end;
$$;

grant execute on function public.remove_event_invitation_volunteer(uuid, uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
