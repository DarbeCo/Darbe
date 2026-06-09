create or replace function public.can_roster_event_admin_manage_event(
  target_event_id uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events event
    where event.id = target_event_id
      and public.has_roster_event_admin_permission(
        event.event_owner_id,
        case
          when coalesce(event.is_followers_only, false) = true then 'internal'
          else 'external'
        end
      )
  );
$$;

grant execute on function public.can_roster_event_admin_manage_event(uuid) to authenticated;

create or replace function public.increment_roster_event_admin_entity_events_created(
  target_entity_id uuid,
  amount integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_impact_id uuid;
  target_user_type text;
begin
  if not exists (
    select 1
    from public.roster_members roster_member
    join public.rosters roster
      on roster.id = roster_member.roster_id
    where roster.roster_owner_id = target_entity_id
      and roster_member.user_id = auth.uid()
      and roster_member.is_admin = true
      and (
        roster_member.can_edit_internal_events = true
        or roster_member.can_edit_external_events = true
      )
  ) then
    raise exception 'You do not have permission to update event impact for this entity.'
      using errcode = '42501';
  end if;

  select impact.id
    into existing_impact_id
  from public.impact impact
  where impact.impact_owner_id = target_entity_id
    and impact.event_id is null
  limit 1;

  if existing_impact_id is not null then
    update public.impact
    set
      events_created = greatest(0, coalesce(events_created, 0) + amount),
      updated_at = now()
    where id = existing_impact_id;

    return;
  end if;

  select profile.user_type
    into target_user_type
  from public.profiles profile
  where profile.id = target_entity_id;

  if target_user_type is null then
    raise exception 'Entity profile not found.'
      using errcode = 'P0002';
  end if;

  insert into public.impact (
    impact_owner_id,
    user_type,
    event_id,
    events_created
  )
  values (
    target_entity_id,
    target_user_type,
    null,
    greatest(0, amount)
  );
end;
$$;

grant execute on function public.increment_roster_event_admin_entity_events_created(uuid, integer) to authenticated;

drop policy if exists events_insert_roster_event_admin on public.events;

create policy events_insert_roster_event_admin
on public.events
for insert
to authenticated
with check (
  public.has_roster_event_admin_permission(
    event_owner_id,
    case
      when coalesce(is_followers_only, false) = true then 'internal'
      else 'external'
    end
  )
);

drop policy if exists event_addresses_insert_roster_event_admin on public.event_addresses;

create policy event_addresses_insert_roster_event_admin
on public.event_addresses
for insert
to authenticated
with check (
  public.can_roster_event_admin_manage_event(event_id)
);

drop policy if exists event_requirements_insert_roster_event_admin on public.event_requirements;

create policy event_requirements_insert_roster_event_admin
on public.event_requirements
for insert
to authenticated
with check (
  public.can_roster_event_admin_manage_event(event_id)
);

drop policy if exists event_volunteer_impacts_insert_roster_event_admin on public.event_volunteer_impacts;

create policy event_volunteer_impacts_insert_roster_event_admin
on public.event_volunteer_impacts
for insert
to authenticated
with check (
  public.can_roster_event_admin_manage_event(event_id)
);

notify pgrst, 'reload schema';
