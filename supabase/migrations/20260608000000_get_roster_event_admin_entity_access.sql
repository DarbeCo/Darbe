create or replace function public.get_roster_event_admin_entity_access()
returns table (
  entity_id uuid,
  can_edit_internal_events boolean,
  can_edit_external_events boolean
)
language sql
security definer
set search_path = public
as $$
  select
    roster.roster_owner_id as entity_id,
    bool_or(coalesce(roster_member.can_edit_internal_events, false)) as can_edit_internal_events,
    bool_or(coalesce(roster_member.can_edit_external_events, false)) as can_edit_external_events
  from public.roster_members roster_member
  join public.rosters roster
    on roster.id = roster_member.roster_id
  where roster_member.user_id = auth.uid()
    and roster_member.is_admin = true
    and (
      roster_member.can_edit_internal_events = true
      or roster_member.can_edit_external_events = true
    )
  group by roster.roster_owner_id;
$$;

grant execute on function public.get_roster_event_admin_entity_access() to authenticated;

notify pgrst, 'reload schema';
