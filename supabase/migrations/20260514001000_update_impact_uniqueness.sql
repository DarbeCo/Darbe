alter table public.impact
  drop constraint if exists impact_impact_owner_id_key;

drop index if exists public.impact_impact_owner_id_key;

create unique index if not exists impact_owner_summary_unique
  on public.impact (impact_owner_id)
  where event_id is null;

create unique index if not exists impact_owner_event_unique
  on public.impact (impact_owner_id, event_id)
  where event_id is not null;
