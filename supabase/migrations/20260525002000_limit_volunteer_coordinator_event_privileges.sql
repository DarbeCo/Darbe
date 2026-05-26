create or replace function public.manage_event_signup_check_time(
  target_event_id uuid,
  target_user_id uuid,
  check_action text
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
  target_profile record;
  target_impact record;
  target_event_impact record;
  can_manage_as_roster_admin boolean := false;
  event_hours numeric := 0;
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

  if check_action in ('approve', 'deny', 'no_show') then
    if acting_user_id <> managed_event.event_owner_id
      and can_manage_as_roster_admin = false then
      raise exception 'You do not have permission to approve this volunteer';
    end if;
  elsif acting_user_id <> target_user_id
    and acting_user_id <> managed_event.event_owner_id
    and acting_user_id <> managed_event.event_coordinator_id
    and can_manage_as_roster_admin = false then
    raise exception 'You do not have permission to manage this volunteer';
  end if;

  select user_type
    into target_profile
  from public.profiles
  where id = target_user_id;

  if not found then
    raise exception 'Volunteer profile not found';
  end if;

  if target_profile.user_type in ('organization', 'nonprofit')
    and check_action <> 'add_volunteer' then
    raise exception 'Organizations and non-profits cannot be checked in';
  end if;

  select id, status, check_in_at, check_out_at
    into target_signup
  from public.event_signups
  where event_id = target_event_id
    and user_id = target_user_id
  order by event_action_timestamp desc
  limit 1;

  if not found then
    if check_action = 'add_volunteer' then
      insert into public.event_signups (
        event_id,
        user_id,
        status,
        check_in_at,
        check_out_at,
        event_action_timestamp
      )
      values (
        target_event_id,
        target_user_id,
        'volunteered',
        null,
        null,
        action_timestamp
      )
      on conflict (event_id, user_id) do update
      set
        status = excluded.status,
        check_in_at = null,
        check_out_at = null,
        event_action_timestamp = excluded.event_action_timestamp;

      return;
    end if;

    if check_action = 'check_in'
      and target_user_id = managed_event.event_coordinator_id then
      insert into public.event_signups (
        event_id,
        user_id,
        status,
        check_in_at,
        event_action_timestamp
      )
      values (
        target_event_id,
        target_user_id,
        'confirmed',
        action_timestamp,
        action_timestamp
      )
      on conflict (event_id, user_id) do update
      set
        status = excluded.status,
        check_in_at = excluded.check_in_at,
        event_action_timestamp = excluded.event_action_timestamp;

      return;
    end if;

    raise exception 'Volunteer signup not found';
  end if;

  if check_action = 'add_volunteer' then
    if target_signup.status in ('volunteered', 'confirmed', 'approved') then
      return;
    end if;

    update public.event_signups
    set
      status = 'volunteered',
      check_in_at = null,
      check_out_at = null,
      event_action_timestamp = action_timestamp
    where id = target_signup.id;

    return;
  end if;

  if check_action = 'check_in' then
    if target_signup.check_in_at is not null then
      return;
    end if;

    update public.event_signups
    set
      status = 'confirmed',
      check_in_at = action_timestamp,
      event_action_timestamp = action_timestamp
    where id = target_signup.id;

    return;
  end if;

  if check_action = 'check_out' then
    if target_signup.check_in_at is null or target_signup.check_out_at is not null then
      return;
    end if;

    update public.event_signups
    set
      check_out_at = action_timestamp,
      event_action_timestamp = action_timestamp
    where id = target_signup.id;

    return;
  end if;

  if check_action = 'no_show' then
    if target_signup.status = 'no_show' then
      return;
    end if;

    if target_signup.check_in_at is not null then
      return;
    end if;

    update public.event_signups
    set
      status = 'no_show',
      check_in_at = null,
      check_out_at = null,
      event_action_timestamp = action_timestamp
    where id = target_signup.id;

    return;
  end if;

  if check_action = 'approve' then
    if target_signup.status = 'approved' then
      return;
    end if;

    if target_signup.check_in_at is null or target_signup.check_out_at is null then
      raise exception 'Volunteer must be checked out before approval';
    end if;

    event_hours := greatest(
      extract(epoch from (target_signup.check_out_at - target_signup.check_in_at)) / 3600,
      0
    );

    update public.event_signups
    set
      status = 'approved',
      event_action_timestamp = action_timestamp
    where id = target_signup.id;

    select id, events_attended, hours_volunteered
      into target_impact
    from public.impact
    where impact_owner_id = target_user_id
      and event_id is null
    limit 1;

    if found then
      update public.impact
      set
        events_attended = events_attended + 1,
        hours_volunteered = hours_volunteered + event_hours,
        updated_at = action_timestamp
      where id = target_impact.id;
    else
      insert into public.impact (
        impact_owner_id,
        user_type,
        event_id,
        events_created,
        events_attended,
        events_passed,
        events_coordinated,
        hours_volunteered
      )
      values (
        target_user_id,
        target_profile.user_type,
        null,
        0,
        1,
        0,
        0,
        event_hours
      );
    end if;

    select id
      into target_event_impact
    from public.impact
    where impact_owner_id = target_user_id
      and event_id = target_event_id
    limit 1;

    if found then
      update public.impact
      set
        events_attended = 1,
        hours_volunteered = event_hours,
        updated_at = action_timestamp
      where id = target_event_impact.id;
    else
      insert into public.impact (
        impact_owner_id,
        user_type,
        event_id,
        events_created,
        events_attended,
        events_passed,
        events_coordinated,
        hours_volunteered
      )
      values (
        target_user_id,
        target_profile.user_type,
        target_event_id,
        0,
        1,
        0,
        0,
        event_hours
      );
    end if;

    return;
  end if;

  if check_action = 'deny' then
    update public.event_signups
    set
      status = 'denied',
      event_action_timestamp = action_timestamp
    where id = target_signup.id;

    return;
  end if;

  raise exception 'Unsupported check action';
end;
$$;

grant execute on function public.manage_event_signup_check_time(uuid, uuid, text) to authenticated;

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

  select event_owner_id, is_followers_only
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
    and can_manage_as_roster_admin = false then
    raise exception 'You do not have permission to deny this volunteer';
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

create or replace function public.approve_all_event_volunteers(
  target_event_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  managed_event record;
  signup_record record;
  can_manage_as_roster_admin boolean := false;
begin
  if acting_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select event_owner_id, is_followers_only
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
    and can_manage_as_roster_admin = false then
    raise exception 'You do not have permission to approve this event';
  end if;

  for signup_record in
    select signup.user_id
    from public.event_signups signup
    join public.profiles profile on profile.id = signup.user_id
    where signup.event_id = target_event_id
      and signup.status in ('confirmed', 'volunteered')
      and signup.check_in_at is not null
      and signup.check_out_at is not null
      and profile.user_type not in ('organization', 'nonprofit')
  loop
    perform public.manage_event_signup_check_time(
      target_event_id,
      signup_record.user_id,
      'approve'
    );
  end loop;
end;
$$;

grant execute on function public.approve_all_event_volunteers(uuid) to authenticated;

notify pgrst, 'reload schema';
