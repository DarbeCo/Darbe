create or replace function public.get_roster_admin_events()
returns table (
  id uuid,
  event_owner_id uuid,
  event_name text,
  event_description text,
  event_date date,
  start_time time,
  end_time time,
  is_followers_only boolean,
  max_volunteer_count integer,
  event_cover_photo_url text,
  event_coordinator_id uuid
)
language sql
security definer
set search_path = public
as $$
  select distinct
    event.id,
    event.event_owner_id,
    event.event_name,
    event.event_description,
    event.event_date,
    event.start_time,
    event.end_time,
    event.is_followers_only,
    event.max_volunteer_count,
    event.event_cover_photo_url,
    event.event_coordinator_id
  from public.events event
  join public.rosters roster
    on roster.roster_owner_id = event.event_owner_id
  join public.roster_members roster_member
    on roster_member.roster_id = roster.id
  where roster_member.user_id = auth.uid()
    and roster_member.is_admin = true
  order by event.event_date asc, event.start_time asc;
$$;

grant execute on function public.get_roster_admin_events() to authenticated;

notify pgrst, 'reload schema';
