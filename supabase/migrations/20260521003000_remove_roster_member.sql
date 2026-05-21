create or replace function public.remove_roster_member(
  target_roster_id uuid,
  target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  target_roster record;
  can_manage_roster boolean := false;
begin
  if acting_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select
    roster.id,
    roster.roster_owner_id,
    roster.roster_name
    into target_roster
  from public.rosters roster
  where roster.id = target_roster_id;

  if not found then
    raise exception 'Roster not found';
  end if;

  select
    acting_user_id = target_roster.roster_owner_id
    or exists (
      select 1
      from public.rosters admin_roster
      join public.roster_members admin_membership
        on admin_membership.roster_id = admin_roster.id
      where admin_roster.roster_owner_id = target_roster.roster_owner_id
        and admin_membership.user_id = acting_user_id
        and admin_membership.is_admin = true
        and admin_membership.can_edit_assigned_roster = true
    )
    into can_manage_roster;

  if can_manage_roster = false then
    raise exception 'You do not have permission to remove this roster member';
  end if;

  if target_roster.roster_name in ('Member Roster', 'Default Roster') then
    delete from public.roster_members roster_member
    using public.rosters roster
    where roster.id = roster_member.roster_id
      and roster.roster_owner_id = target_roster.roster_owner_id
      and roster.roster_name <> 'Followers'
      and roster_member.user_id = target_user_id;
  else
    delete from public.roster_members
    where roster_id = target_roster_id
      and user_id = target_user_id;
  end if;

  if target_roster.roster_name <> 'Followers'
    and not exists (
      select 1
      from public.rosters roster
      join public.roster_members roster_member
        on roster_member.roster_id = roster.id
      where roster.roster_owner_id = target_roster.roster_owner_id
        and roster.roster_name <> 'Followers'
        and roster_member.user_id = target_user_id
    ) then
    delete from public.user_organizations
    where user_id = target_user_id
      and parent_organization_id = target_roster.roster_owner_id
      and position = 'Member';
  end if;
end;
$$;

grant execute on function public.remove_roster_member(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
