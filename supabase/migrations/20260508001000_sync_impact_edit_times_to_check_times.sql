create or replace function public.update_event_signup_impact_details(
  target_signup_id uuid,
  volunteer_start_time_value text,
  volunteer_end_time_value text,
  volunteer_location_value text,
  volunteer_impact_value text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  target_signup record;
  start_time_value time;
  end_time_value time;
  updated_check_in_at timestamptz;
  updated_check_out_at timestamptz;
begin
  if acting_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select
    signup.id,
    event.event_date,
    event.event_owner_id,
    event.event_coordinator_id
    into target_signup
  from public.event_signups signup
  join public.events event on event.id = signup.event_id
  where signup.id = target_signup_id;

  if not found then
    raise exception 'Signup not found';
  end if;

  if acting_user_id <> target_signup.event_owner_id
    and acting_user_id <> target_signup.event_coordinator_id then
    raise exception 'You do not have permission to edit this volunteer impact';
  end if;

  if nullif(trim(volunteer_start_time_value), '') is not null then
    start_time_value := volunteer_start_time_value::time;
    updated_check_in_at := make_timestamptz(
      extract(year from target_signup.event_date::date)::int,
      extract(month from target_signup.event_date::date)::int,
      extract(day from target_signup.event_date::date)::int,
      extract(hour from start_time_value)::int,
      extract(minute from start_time_value)::int,
      0,
      'America/Chicago'
    );
  end if;

  if nullif(trim(volunteer_end_time_value), '') is not null then
    end_time_value := volunteer_end_time_value::time;
    updated_check_out_at := make_timestamptz(
      extract(year from target_signup.event_date::date)::int,
      extract(month from target_signup.event_date::date)::int,
      extract(day from target_signup.event_date::date)::int,
      extract(hour from end_time_value)::int,
      extract(minute from end_time_value)::int,
      0,
      'America/Chicago'
    );
  end if;

  update public.event_signups
  set
    volunteer_start_time = volunteer_start_time_value,
    volunteer_end_time = volunteer_end_time_value,
    volunteer_location = volunteer_location_value,
    volunteer_impact = volunteer_impact_value,
    check_in_at = coalesce(updated_check_in_at, check_in_at),
    check_out_at = coalesce(updated_check_out_at, check_out_at)
  where id = target_signup_id;
end;
$$;
