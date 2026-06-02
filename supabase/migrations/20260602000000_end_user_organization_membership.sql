drop policy if exists user_organizations_update_member_or_entity_manager
  on public.user_organizations;
create policy user_organizations_update_member_or_entity_manager
  on public.user_organizations
  for update
  using (
    user_id = auth.uid()
    or parent_organization_id = auth.uid()
    or exists (
      select 1
      from public.organizations organization
      where organization.id = user_organizations.parent_organization_id
        and organization.organization_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.organizations organization
      join public.rosters admin_roster
        on admin_roster.roster_owner_id in (
          organization.id,
          organization.organization_user_id
        )
      join public.roster_members admin_membership
        on admin_membership.roster_id = admin_roster.id
      where organization.id = user_organizations.parent_organization_id
        and admin_membership.user_id = auth.uid()
        and admin_membership.is_admin = true
        and admin_membership.can_edit_assigned_roster = true
    )
  )
  with check (
    user_id = auth.uid()
    or parent_organization_id = auth.uid()
    or exists (
      select 1
      from public.organizations organization
      where organization.id = user_organizations.parent_organization_id
        and organization.organization_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.organizations organization
      join public.rosters admin_roster
        on admin_roster.roster_owner_id in (
          organization.id,
          organization.organization_user_id
        )
      join public.roster_members admin_membership
        on admin_membership.roster_id = admin_roster.id
      where organization.id = user_organizations.parent_organization_id
        and admin_membership.user_id = auth.uid()
        and admin_membership.is_admin = true
        and admin_membership.can_edit_assigned_roster = true
    )
  );

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
    update public.user_organizations
    set end_date = current_date
    where user_id = target_user_id
      and parent_organization_id = target_roster.roster_owner_id
      and position = 'Member'
      and end_date is null;
  end if;
end;
$$;

grant execute on function public.remove_roster_member(uuid, uuid) to authenticated;

create or replace function public.sync_user_organization_membership(
  target_user_id uuid,
  target_entity_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  entity_name text;
  organization_record_id uuid;
begin
  if acting_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if acting_user_id <> target_entity_id then
    raise exception 'Only the organization can sync this membership';
  end if;

  select coalesce(profile.nonprofit_name, profile.organization_name, profile.full_name, 'Organization')
    into entity_name
  from public.profiles profile
  where profile.id = target_entity_id
    and profile.user_type in ('organization', 'nonprofit');

  if entity_name is null then
    raise exception 'Organization not found';
  end if;

  select organization.id
    into organization_record_id
  from public.organizations organization
  where organization.id = target_entity_id
     or organization.organization_user_id = target_entity_id
  limit 1;

  if organization_record_id is null then
    insert into public.organizations (
      id,
      organization_user_id,
      is_child_organization
    )
    values (
      target_entity_id,
      target_entity_id,
      false
    )
    returning id into organization_record_id;
  end if;

  if not exists (
    select 1
    from public.rosters roster
    join public.roster_members roster_member
      on roster_member.roster_id = roster.id
    where roster.roster_owner_id = target_entity_id
      and roster.roster_name <> 'Followers'
      and roster_member.user_id = target_user_id
  ) then
    raise exception 'Roster membership not found';
  end if;

  update public.user_organizations
  set
    organization_name = entity_name,
    end_date = null,
    parent_organization_id = organization_record_id,
    is_child_organization = false
  where user_id = target_user_id
    and (
      parent_organization_id = organization_record_id
      or parent_organization_id = target_entity_id
    )
    and position = 'Member';

  if found then
    return;
  end if;

  insert into public.user_organizations (
    user_id,
    organization_name,
    position,
    start_date,
    parent_organization_id,
    is_child_organization
  )
  values (
    target_user_id,
    entity_name,
    'Member',
    current_date,
    organization_record_id,
    false
  );
end;
$$;

grant execute on function public.sync_user_organization_membership(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
