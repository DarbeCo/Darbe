alter table public.event_signups
  add column if not exists volunteer_start_time text,
  add column if not exists volunteer_end_time text,
  add column if not exists volunteer_location text,
  add column if not exists volunteer_impact text;

drop function if exists public.get_event_signup_volunteers(uuid[]);

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
    );
$$;
