drop policy if exists roster_members_delete_entity_manager
  on public.roster_members;
create policy roster_members_delete_entity_manager
  on public.roster_members
  for delete
  using (
    exists (
      select 1
      from public.rosters roster
      where roster.id = roster_members.roster_id
        and (
          roster.roster_owner_id = auth.uid()
          or exists (
            select 1
            from public.rosters admin_roster
            join public.roster_members admin_membership
              on admin_membership.roster_id = admin_roster.id
            where admin_roster.roster_owner_id = roster.roster_owner_id
              and admin_membership.user_id = auth.uid()
              and admin_membership.is_admin = true
              and admin_membership.can_edit_assigned_roster = true
          )
        )
    )
  );

drop policy if exists user_organizations_delete_member_or_entity_manager
  on public.user_organizations;
create policy user_organizations_delete_member_or_entity_manager
  on public.user_organizations
  for delete
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
  );

notify pgrst, 'reload schema';
