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
