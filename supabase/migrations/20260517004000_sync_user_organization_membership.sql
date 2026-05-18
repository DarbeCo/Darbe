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
  )
  on conflict do nothing;
end;
$$;

grant execute on function public.sync_user_organization_membership(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
