alter table public.event_recommendations
  alter column recipient_user_id drop not null;

create unique index if not exists event_recommendations_entity_unique_idx
  on public.event_recommendations(event_id, recommender_entity_id)
  where recipient_user_id is null;

drop policy if exists event_recommendations_select_involved
  on public.event_recommendations;
create policy event_recommendations_select_involved
  on public.event_recommendations
  for select
  using (
    recipient_user_id = auth.uid()
    or recommender_entity_id = auth.uid()
    or (
      recipient_user_id is null
      and (
        exists (
          select 1
          from public.rosters roster
          join public.roster_members roster_member
            on roster_member.roster_id = roster.id
          where roster.roster_owner_id = recommender_entity_id
            and roster_member.user_id = auth.uid()
        )
        or exists (
          select 1
          from public.user_organizations user_organization
          where user_organization.parent_organization_id = recommender_entity_id
            and user_organization.user_id = auth.uid()
        )
      )
    )
  );

drop policy if exists event_recommendations_insert_recommender
  on public.event_recommendations;
create policy event_recommendations_insert_recommender
  on public.event_recommendations
  for insert
  with check (
    recommender_entity_id = auth.uid()
    and exists (
      select 1
      from public.profiles recommender
      where recommender.id = auth.uid()
        and recommender.user_type = 'organization'
    )
    and (
      recipient_user_id is null
      or exists (
        select 1
        from public.profiles recipient
        where recipient.id = recipient_user_id
          and recipient.user_type = 'individual'
      )
    )
  );
