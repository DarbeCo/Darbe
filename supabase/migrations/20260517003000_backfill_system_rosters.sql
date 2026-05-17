insert into public.rosters (roster_owner_id, roster_name)
select distinct
  follow.following_id,
  'Followers'
from public.follows follow
join public.profiles profile
  on profile.id = follow.following_id
where profile.user_type in ('organization', 'nonprofit')
  and not exists (
    select 1
    from public.rosters existing_roster
    where existing_roster.roster_owner_id = follow.following_id
      and existing_roster.roster_name = 'Followers'
  );

insert into public.roster_members (
  roster_id,
  user_id,
  is_admin
)
select distinct
  roster.id,
  follow.follower_id,
  false
from public.follows follow
join public.rosters roster
  on roster.roster_owner_id = follow.following_id
  and roster.roster_name = 'Followers'
on conflict (roster_id, user_id) do nothing;

insert into public.rosters (roster_owner_id, roster_name)
select distinct
  roster.roster_owner_id,
  'Volunteer Coordinators'
from public.rosters roster
join public.roster_members roster_member
  on roster_member.roster_id = roster.id
where roster_member.is_admin = true
  and roster_member.can_assign_volunteer_coordinators = true
  and not exists (
    select 1
    from public.rosters existing_roster
    where existing_roster.roster_owner_id = roster.roster_owner_id
      and existing_roster.roster_name = 'Volunteer Coordinators'
  );

insert into public.roster_members (
  roster_id,
  user_id,
  is_admin
)
select distinct
  coordinator_roster.id,
  roster_member.user_id,
  true
from public.rosters source_roster
join public.roster_members roster_member
  on roster_member.roster_id = source_roster.id
join public.rosters coordinator_roster
  on coordinator_roster.roster_owner_id = source_roster.roster_owner_id
  and coordinator_roster.roster_name = 'Volunteer Coordinators'
where roster_member.is_admin = true
  and roster_member.can_assign_volunteer_coordinators = true
on conflict (roster_id, user_id) do nothing;

notify pgrst, 'reload schema';
