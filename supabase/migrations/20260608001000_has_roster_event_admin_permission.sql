create or replace function public.has_roster_event_admin_permission(
  target_entity_id uuid,
  requested_event_type text
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.roster_members roster_member
    join public.rosters roster
      on roster.id = roster_member.roster_id
    where roster.roster_owner_id = target_entity_id
      and roster_member.user_id = auth.uid()
      and roster_member.is_admin = true
      and (
        (
          requested_event_type = 'internal'
          and roster_member.can_edit_internal_events = true
        )
        or (
          requested_event_type = 'external'
          and roster_member.can_edit_external_events = true
        )
      )
  );
$$;

grant execute on function public.has_roster_event_admin_permission(uuid, text) to authenticated;

notify pgrst, 'reload schema';
