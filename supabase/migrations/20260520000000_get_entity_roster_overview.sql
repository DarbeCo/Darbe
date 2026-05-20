create or replace function public.get_entity_roster_access(target_entity_id uuid)
returns table (
  is_member boolean,
  is_admin boolean,
  member_count bigint
)
language sql
security definer
set search_path = public
as $$
  with membership_rosters as (
    select roster.id
    from public.rosters roster
    where roster.roster_owner_id = target_entity_id
      and roster.roster_name <> 'Followers'
  ),
  membership_members as (
    select
      roster_member.user_id,
      bool_or(coalesce(roster_member.is_admin, false)) as is_admin
    from public.roster_members roster_member
    join membership_rosters roster
      on roster.id = roster_member.roster_id
    group by roster_member.user_id
  )
  select
    auth.uid() = target_entity_id
      or exists (
        select 1
        from membership_members member
        where member.user_id = auth.uid()
      ) as is_member,
    auth.uid() = target_entity_id
      or coalesce((
        select member.is_admin
        from membership_members member
        where member.user_id = auth.uid()
      ), false) as is_admin,
    (select count(*) from membership_members) as member_count;
$$;

create or replace function public.get_entity_roster_member_ids(target_entity_id uuid)
returns table (
  user_id uuid
)
language sql
security definer
set search_path = public
as $$
  select distinct roster_member.user_id
  from public.roster_members roster_member
  join public.rosters roster
    on roster.id = roster_member.roster_id
  where roster.roster_owner_id = target_entity_id
    and roster.roster_name <> 'Followers'
  order by roster_member.user_id;
$$;

create or replace function public.get_entity_roster_rows(target_entity_id uuid)
returns table (
  roster_id uuid,
  roster_owner_id uuid,
  roster_name text,
  roster_created_at timestamptz,
  user_id uuid,
  is_admin boolean,
  can_edit_assigned_roster boolean,
  can_assign_volunteer_coordinators boolean,
  can_edit_internal_events boolean,
  can_edit_external_events boolean,
  member_created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    roster.id as roster_id,
    roster.roster_owner_id,
    roster.roster_name::text as roster_name,
    roster.created_at as roster_created_at,
    roster_member.user_id,
    coalesce(roster_member.is_admin, false) as is_admin,
    coalesce(roster_member.can_edit_assigned_roster, false) as can_edit_assigned_roster,
    coalesce(roster_member.can_assign_volunteer_coordinators, false) as can_assign_volunteer_coordinators,
    coalesce(roster_member.can_edit_internal_events, false) as can_edit_internal_events,
    coalesce(roster_member.can_edit_external_events, false) as can_edit_external_events,
    roster_member.created_at as member_created_at
  from public.rosters roster
  left join public.roster_members roster_member
    on roster_member.roster_id = roster.id
  where roster.roster_owner_id = target_entity_id
    and roster.roster_name <> 'Followers'
  order by roster.created_at asc, roster_member.created_at asc;
$$;

update public.rosters roster
set roster_name = 'Member Roster'
where roster.roster_name = 'Default Roster'
  and not exists (
    select 1
    from public.rosters member_roster
    where member_roster.roster_owner_id = roster.roster_owner_id
      and member_roster.roster_name = 'Member Roster'
  );

insert into public.rosters (roster_owner_id, roster_name)
select distinct
  roster.roster_owner_id,
  'Member Roster'
from public.rosters roster
join public.profiles profile
  on profile.id = roster.roster_owner_id
where lower(trim(profile.user_type)) in ('organization', 'nonprofit', 'non-profit', 'non profit')
  and roster.roster_name <> 'Followers'
  and not exists (
    select 1
    from public.rosters member_roster
    where member_roster.roster_owner_id = roster.roster_owner_id
      and member_roster.roster_name in ('Member Roster', 'Default Roster')
  );

insert into public.roster_members (
  roster_id,
  user_id,
  is_admin,
  can_edit_assigned_roster,
  can_assign_volunteer_coordinators,
  can_edit_internal_events,
  can_edit_external_events
)
select distinct on (member_roster.id, roster_member.user_id)
  member_roster.id,
  roster_member.user_id,
  roster_member.is_admin,
  roster_member.can_edit_assigned_roster,
  roster_member.can_assign_volunteer_coordinators,
  roster_member.can_edit_internal_events,
  roster_member.can_edit_external_events
from public.rosters source_roster
join public.roster_members roster_member
  on roster_member.roster_id = source_roster.id
join public.rosters member_roster
  on member_roster.roster_owner_id = source_roster.roster_owner_id
  and member_roster.roster_name in ('Member Roster', 'Default Roster')
where source_roster.roster_name <> 'Followers'
order by
  member_roster.id,
  roster_member.user_id,
  roster_member.is_admin desc,
  roster_member.can_edit_assigned_roster desc,
  roster_member.can_assign_volunteer_coordinators desc,
  roster_member.can_edit_internal_events desc,
  roster_member.can_edit_external_events desc
on conflict (roster_id, user_id) do update
set
  is_admin = excluded.is_admin or public.roster_members.is_admin,
  can_edit_assigned_roster =
    excluded.can_edit_assigned_roster or public.roster_members.can_edit_assigned_roster,
  can_assign_volunteer_coordinators =
    excluded.can_assign_volunteer_coordinators or public.roster_members.can_assign_volunteer_coordinators,
  can_edit_internal_events =
    excluded.can_edit_internal_events or public.roster_members.can_edit_internal_events,
  can_edit_external_events =
    excluded.can_edit_external_events or public.roster_members.can_edit_external_events;

grant execute on function public.get_entity_roster_access(uuid) to authenticated;
grant execute on function public.get_entity_roster_member_ids(uuid) to authenticated;
grant execute on function public.get_entity_roster_rows(uuid) to authenticated;

notify pgrst, 'reload schema';
