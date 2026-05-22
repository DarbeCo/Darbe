create or replace function public.unsync_entity_followers_roster(
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
  if auth.uid() <> target_follower_id then
    raise exception 'Cannot unsync another user as a follower';
  end if;

  select roster.id
    into followers_roster_id
  from public.rosters roster
  where roster.roster_owner_id = target_entity_id
    and roster.roster_name = 'Followers'
  limit 1;

  if followers_roster_id is null then
    return;
  end if;

  delete from public.roster_members
  where roster_id = followers_roster_id
    and user_id = target_follower_id;
end;
$$;

grant execute on function public.unsync_entity_followers_roster(uuid, uuid) to authenticated;
