create table if not exists public.event_recommendations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  recommender_entity_id uuid not null references public.profiles(id) on delete cascade,
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, recommender_entity_id, recipient_user_id)
);

create index if not exists event_recommendations_recipient_user_id_idx
  on public.event_recommendations(recipient_user_id);

create index if not exists event_recommendations_recommender_entity_id_idx
  on public.event_recommendations(recommender_entity_id);

alter table public.event_recommendations enable row level security;

drop policy if exists event_recommendations_select_involved
  on public.event_recommendations;
create policy event_recommendations_select_involved
  on public.event_recommendations
  for select
  using (
    recipient_user_id = auth.uid()
    or recommender_entity_id = auth.uid()
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
    and exists (
      select 1
      from public.profiles recipient
      where recipient.id = recipient_user_id
        and recipient.user_type = 'individual'
    )
  );

drop policy if exists event_recommendations_update_recommender
  on public.event_recommendations;
create policy event_recommendations_update_recommender
  on public.event_recommendations
  for update
  using (recommender_entity_id = auth.uid())
  with check (recommender_entity_id = auth.uid());

drop policy if exists event_recommendations_delete_recommender
  on public.event_recommendations;
create policy event_recommendations_delete_recommender
  on public.event_recommendations
  for delete
  using (recommender_entity_id = auth.uid());
