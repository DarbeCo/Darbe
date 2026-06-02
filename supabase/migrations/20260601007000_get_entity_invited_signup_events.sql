alter table public.event_signups
  add column if not exists invitation_removed_at timestamptz,
  add column if not exists invitation_removed_by uuid references public.profiles(id) on delete set null;

create or replace function public.get_entity_invited_signup_events()
returns table (
  event_id uuid,
  status text,
  event_action_timestamp timestamptz,
  check_in_at timestamptz,
  check_out_at timestamptz,
  invited_by_entity_id uuid,
  event_owner_id uuid,
  roster_id uuid,
  event_name text,
  event_description text,
  event_date date,
  start_time time,
  end_time time,
  is_followers_only boolean,
  max_volunteer_count integer,
  event_cover_photo_url text,
  event_photo_visibility text,
  event_coordinator_id uuid
)
language sql
security definer
set search_path = public
as $$
  select
    signup.event_id,
    signup.status,
    signup.event_action_timestamp,
    signup.check_in_at,
    signup.check_out_at,
    signup.invited_by_entity_id,
    event.event_owner_id,
    event.roster_id,
    event.event_name,
    event.event_description,
    event.event_date,
    event.start_time,
    event.end_time,
    event.is_followers_only,
    event.max_volunteer_count,
    event.event_cover_photo_url,
    event.event_photo_visibility,
    event.event_coordinator_id
  from public.event_signups signup
  join public.events event
    on event.id = signup.event_id
  where signup.invited_by_entity_id = auth.uid()
    and signup.invitation_removed_at is null
    and signup.status in ('volunteered', 'confirmed', 'approved', 'no_show');
$$;

grant execute on function public.get_entity_invited_signup_events() to authenticated;

notify pgrst, 'reload schema';
