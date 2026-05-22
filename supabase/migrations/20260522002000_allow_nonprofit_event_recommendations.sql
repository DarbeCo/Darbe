alter table public.event_recommendations
  alter column recipient_user_id drop not null;

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
        and recommender.user_type in ('organization', 'nonprofit')
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
