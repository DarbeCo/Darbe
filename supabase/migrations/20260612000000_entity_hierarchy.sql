create table if not exists public.entity_hierarchy (
  id uuid primary key default gen_random_uuid(),
  parent_entity_id uuid not null references public.profiles(id) on delete cascade,
  child_entity_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  responded_by uuid references public.profiles(id) on delete set null,
  constraint entity_hierarchy_status_check check (status in ('pending', 'accepted')),
  constraint entity_hierarchy_not_self_check check (parent_entity_id <> child_entity_id),
  constraint entity_hierarchy_one_parent unique (child_entity_id)
);

alter table public.entity_hierarchy enable row level security;

drop policy if exists entity_hierarchy_public_read on public.entity_hierarchy;

create policy entity_hierarchy_public_read
on public.entity_hierarchy
for select
using (status = 'accepted');

alter table public.notifications
  drop constraint if exists notifications_content_type_check;

alter table public.notifications
  add constraint notifications_content_type_check
  check (
    content_type in (
      'like',
      'comment',
      'friendRequest',
      'acceptedFriendRequest',
      'follow',
      'post',
      'orgJoinRequest',
      'acceptedOrgJoinRequest',
      'deniedOrgJoinRequest',
      'entityHierarchyChildRequest'
    )
  );

create or replace function public.is_entity_profile(target_entity_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles profile
    where profile.id = target_entity_id
      and profile.user_type in ('organization', 'nonprofit')
  );
$$;

create or replace function public.get_public_entity_hierarchy(root_entity_id uuid)
returns table (
  id uuid,
  parent_entity_id uuid,
  child_entity_id uuid,
  status text,
  depth integer,
  entity_id uuid,
  entity_name text,
  profile_picture_url text,
  user_type text
)
language sql
security definer
set search_path = public
as $$
  with recursive hierarchy as (
    select
      link.id,
      link.parent_entity_id,
      link.child_entity_id,
      link.status,
      1 as depth
    from public.entity_hierarchy link
    where link.parent_entity_id = root_entity_id
      and link.status = 'accepted'

    union all

    select
      child_link.id,
      child_link.parent_entity_id,
      child_link.child_entity_id,
      child_link.status,
      hierarchy.depth + 1
    from public.entity_hierarchy child_link
    join hierarchy
      on hierarchy.child_entity_id = child_link.parent_entity_id
    where child_link.status = 'accepted'
  )
  select
    hierarchy.id,
    hierarchy.parent_entity_id,
    hierarchy.child_entity_id,
    hierarchy.status,
    hierarchy.depth,
    profile.id as entity_id,
    coalesce(profile.organization_name, profile.nonprofit_name, profile.full_name) as entity_name,
    profile.profile_picture_url,
    profile.user_type
  from hierarchy
  join public.profiles profile
    on profile.id = hierarchy.child_entity_id;
$$;

create or replace function public.get_manage_entity_hierarchy(root_entity_id uuid)
returns table (
  id uuid,
  parent_entity_id uuid,
  child_entity_id uuid,
  status text,
  depth integer,
  entity_id uuid,
  entity_name text,
  profile_picture_url text,
  user_type text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() <> root_entity_id then
    raise exception 'You do not have permission to manage this hierarchy.'
      using errcode = '42501';
  end if;

  if not public.is_entity_profile(root_entity_id) then
    raise exception 'Only organizations and nonprofits can manage hierarchies.'
      using errcode = '42501';
  end if;

  return query
    with recursive hierarchy as (
      select
        link.id,
        link.parent_entity_id,
        link.child_entity_id,
        link.status,
        1 as depth
      from public.entity_hierarchy link
      where link.parent_entity_id = root_entity_id

      union all

      select
        child_link.id,
        child_link.parent_entity_id,
        child_link.child_entity_id,
        child_link.status,
        hierarchy.depth + 1
      from public.entity_hierarchy child_link
      join hierarchy
        on hierarchy.child_entity_id = child_link.parent_entity_id
    )
    select
      hierarchy.id,
      hierarchy.parent_entity_id,
      hierarchy.child_entity_id,
      hierarchy.status,
      hierarchy.depth,
      profile.id as entity_id,
      coalesce(profile.organization_name, profile.nonprofit_name, profile.full_name) as entity_name,
      profile.profile_picture_url,
      profile.user_type
    from hierarchy
    join public.profiles profile
      on profile.id = hierarchy.child_entity_id;
end;
$$;

create or replace function public.get_entity_hierarchy_candidates(
  root_entity_id uuid,
  search_text text default ''
)
returns table (
  id uuid,
  entity_name text,
  profile_picture_url text,
  user_type text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() <> root_entity_id then
    raise exception 'You do not have permission to edit this hierarchy.'
      using errcode = '42501';
  end if;

  return query
    select
      profile.id,
      coalesce(profile.organization_name, profile.nonprofit_name, profile.full_name) as entity_name,
      profile.profile_picture_url,
      profile.user_type
    from public.profiles profile
    where profile.user_type in ('organization', 'nonprofit')
      and profile.id <> root_entity_id
      and not exists (
        select 1
        from public.entity_hierarchy existing_parent
        where existing_parent.child_entity_id = profile.id
      )
      and (
        coalesce(search_text, '') = ''
        or coalesce(profile.organization_name, profile.nonprofit_name, profile.full_name, '')
          ilike '%' || search_text || '%'
      )
    order by entity_name
    limit 25;
end;
$$;

drop function if exists public.request_entity_child(uuid, uuid);

create or replace function public.request_entity_child(
  target_parent_entity_id uuid,
  target_child_entity_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_hierarchy_id uuid;
begin
  if auth.uid() <> target_parent_entity_id then
    raise exception 'You do not have permission to edit this hierarchy.'
      using errcode = '42501';
  end if;

  if not public.is_entity_profile(target_parent_entity_id) or not public.is_entity_profile(target_child_entity_id) then
    raise exception 'Only organizations and nonprofits can be added to hierarchies.'
      using errcode = '42501';
  end if;

  if target_parent_entity_id = target_child_entity_id then
    raise exception 'An entity cannot be added under itself.'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.entity_hierarchy existing_parent
    where existing_parent.child_entity_id = target_child_entity_id
  ) then
    raise exception 'This entity already has a parent.'
      using errcode = '23505';
  end if;

  if exists (
    with recursive descendants as (
      select link.child_entity_id
      from public.entity_hierarchy link
      where link.parent_entity_id = target_child_entity_id

      union all

      select link.child_entity_id
      from public.entity_hierarchy link
      join descendants
        on descendants.child_entity_id = link.parent_entity_id
    )
    select 1
    from descendants
    where descendants.child_entity_id = target_parent_entity_id
  ) then
    raise exception 'This move would create a hierarchy cycle.'
      using errcode = '23514';
  end if;

  insert into public.entity_hierarchy (
    parent_entity_id,
    child_entity_id,
    status,
    created_by
  )
  values (
    target_parent_entity_id,
    target_child_entity_id,
    'pending',
    auth.uid()
  )
  returning id into new_hierarchy_id;

  insert into public.notifications (
    recipient_user_id,
    sender_user_id,
    content_type,
    content_type_id
  )
  values (
    target_child_entity_id,
    target_parent_entity_id,
    'entityHierarchyChildRequest',
    new_hierarchy_id
  );

  return new_hierarchy_id;
end;
$$;

create or replace function public.accept_entity_child_request(
  hierarchy_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.entity_hierarchy link
  set
    status = 'accepted',
    responded_at = now(),
    responded_by = auth.uid()
  where link.id = hierarchy_id
    and link.child_entity_id = auth.uid();

  if not found then
    raise exception 'Hierarchy request not found or not permitted.'
      using errcode = '42501';
  end if;

  update public.notifications
  set read = true
  where content_type = 'entityHierarchyChildRequest'
    and content_type_id = hierarchy_id
    and recipient_user_id = auth.uid();
end;
$$;

create or replace function public.reject_entity_child_request(
  hierarchy_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.entity_hierarchy link
  where link.id = hierarchy_id
    and link.child_entity_id = auth.uid();

  if not found then
    raise exception 'Hierarchy request not found or not permitted.'
      using errcode = '42501';
  end if;

  update public.notifications
  set read = true
  where content_type = 'entityHierarchyChildRequest'
    and content_type_id = hierarchy_id
    and recipient_user_id = auth.uid();
end;
$$;

drop function if exists public.remove_entity_child(uuid, uuid);

create or replace function public.remove_entity_child(
  target_parent_entity_id uuid,
  target_child_entity_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() <> target_parent_entity_id then
    raise exception 'You do not have permission to edit this hierarchy.'
      using errcode = '42501';
  end if;

  delete from public.entity_hierarchy link
  where link.parent_entity_id = target_parent_entity_id
    and link.child_entity_id = target_child_entity_id;
end;
$$;

grant execute on function public.is_entity_profile(uuid) to authenticated, anon;
grant execute on function public.get_public_entity_hierarchy(uuid) to authenticated, anon;
grant execute on function public.get_manage_entity_hierarchy(uuid) to authenticated;
grant execute on function public.get_entity_hierarchy_candidates(uuid, text) to authenticated;
grant execute on function public.request_entity_child(uuid, uuid) to authenticated;
grant execute on function public.accept_entity_child_request(uuid) to authenticated;
grant execute on function public.reject_entity_child_request(uuid) to authenticated;
grant execute on function public.remove_entity_child(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
