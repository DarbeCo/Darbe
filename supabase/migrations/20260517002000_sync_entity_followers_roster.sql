create or replace function public.sync_entity_followers_roster(
  target_entity_id uuid,
  target_follower_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  followers_roster_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if auth.uid() <> target_follower_id then
    raise exception 'Cannot sync another user as a follower';
  end if;

  if not exists (
    select 1
    from public.profiles profile
    where profile.id = target_entity_id
      and profile.user_type in ('organization', 'nonprofit')
  ) then
    raise exception 'Follower rosters are only available for entities';
  end if;

  if not exists (
    select 1
    from public.follows follow
    where follow.following_id = target_entity_id
      and follow.follower_id = target_follower_id
  ) then
    raise exception 'Follower relationship not found';
  end if;

  select roster.id
    into followers_roster_id
  from public.rosters roster
  where roster.roster_owner_id = target_entity_id
    and roster.roster_name = 'Followers'
  limit 1;

  if followers_roster_id is null then
    insert into public.rosters (roster_owner_id, roster_name)
    values (target_entity_id, 'Followers')
    returning id into followers_roster_id;
  end if;

  insert into public.roster_members (
    roster_id,
    user_id,
    is_admin
  )
  values (
    followers_roster_id,
    target_follower_id,
    false
  )
  on conflict (roster_id, user_id) do nothing;
end;
$$;

grant execute on function public.sync_entity_followers_roster(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
