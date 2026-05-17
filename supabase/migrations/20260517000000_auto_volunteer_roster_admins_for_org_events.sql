insert into public.event_signups (
  event_id,
  user_id,
  status,
  event_action_timestamp
)
select distinct
  event.id,
  roster_member.user_id,
  'volunteered',
  now()
from public.events event
join public.rosters roster
  on roster.roster_owner_id = event.event_owner_id
join public.roster_members roster_member
  on roster_member.roster_id = roster.id
join public.profiles profile
  on profile.id = roster_member.user_id
where roster_member.is_admin = true
  and profile.user_type = 'individual'
  and not exists (
    select 1
    from public.event_signups existing_signup
    where existing_signup.event_id = event.id
      and existing_signup.user_id = roster_member.user_id
  );

notify pgrst, 'reload schema';
