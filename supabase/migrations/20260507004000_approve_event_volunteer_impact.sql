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

  select event_owner_id, event_coordinator_id, start_time, end_time
    into managed_event
  from public.events
  where id = target_event_id;

  if not found then
    raise exception 'Event not found';
  end if;

  if acting_user_id <> target_user_id
    and acting_user_id <> managed_event.event_owner_id
    and acting_user_id <> managed_event.event_coordinator_id then
    raise exception 'You do not have permission to manage this volunteer';
  end if;

  select user_type
    into target_profile
  from public.profiles
  where id = target_user_id;

  if not found then
    raise exception 'Volunteer profile not found';
  end if;

  if target_profile.user_type in ('organization', 'nonprofit') then
    raise exception 'Organizations and non-profits cannot be checked in';
  end if;

  select id, status, check_in_at, check_out_at
    into target_signup
  from public.event_signups
  where event_id = target_event_id
    and user_id = target_user_id
    and status in ('volunteered', 'confirmed', 'no_show', 'approved', 'denied')
  order by event_action_timestamp desc
  limit 1;

  if not found then
    if check_action = 'add_volunteer' then
      insert into public.event_signups (
        event_id,
        user_id,
        status,
        event_action_timestamp
      )
      values (
        target_event_id,
        target_user_id,
        'volunteered',
        action_timestamp
      );

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
      );

      return;
    end if;

    if check_action = 'no_show'
      and target_user_id = managed_event.event_coordinator_id then
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
        'no_show',
        null,
        null,
        action_timestamp
      );

      return;
    end if;

    raise exception 'Volunteer signup not found';
  end if;

  if check_action = 'add_volunteer' then
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

    if target_signup.check_in_at is null then
      raise exception 'Volunteer must be checked in before approval';
    end if;

    event_hours := greatest(
      extract(epoch from (coalesce(managed_event.end_time, managed_event.start_time) - managed_event.start_time)) / 3600,
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
        events_created,
        events_attended,
        events_passed,
        events_coordinated,
        hours_volunteered
      )
      values (
        target_user_id,
        target_profile.user_type,
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
begin
  if acting_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select event_owner_id, event_coordinator_id
    into managed_event
  from public.events
  where id = target_event_id;

  if not found then
    raise exception 'Event not found';
  end if;

  if acting_user_id <> managed_event.event_owner_id
    and acting_user_id <> managed_event.event_coordinator_id then
    raise exception 'You do not have permission to approve this event';
  end if;

  for signup_record in
    select signup.user_id
    from public.event_signups signup
    join public.profiles profile on profile.id = signup.user_id
    where signup.event_id = target_event_id
      and signup.status in ('confirmed', 'volunteered')
      and signup.check_in_at is not null
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
