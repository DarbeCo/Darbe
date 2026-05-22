alter table public.event_signups
  add column if not exists invited_by_entity_id uuid references public.profiles(id) on delete set null;

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
