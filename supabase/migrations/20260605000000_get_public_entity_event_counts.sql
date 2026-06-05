create or replace function public.get_public_entity_event_counts(target_entity_id uuid)
returns table (
  upcoming_projects_count integer,
  completed_projects_count integer
)
language sql
security definer
set search_path = public
as $$
  with project_events as (
    select
      event.id,
      event.event_date,
      event.end_time
    from public.events event
    where event.event_owner_id = target_entity_id

    union

    select
      event.id,
      event.event_date,
      event.end_time
    from public.event_signups signup
    join public.events event
      on event.id = signup.event_id
    where (
        signup.user_id = target_entity_id
        or (
          signup.invited_by_entity_id = target_entity_id
          and signup.invitation_removed_at is null
        )
      )
      and signup.status in ('volunteered', 'confirmed', 'approved')
  )
  select
    count(*) filter (
      where not (
        (
          project_events.end_time is not null
          and (project_events.event_date + project_events.end_time) < now()
        )
        or (
          project_events.end_time is null
          and project_events.event_date < current_date
        )
      )
    )::integer as upcoming_projects_count,
    count(*) filter (
      where (
        (
          project_events.end_time is not null
          and (project_events.event_date + project_events.end_time) < now()
        )
        or (
          project_events.end_time is null
          and project_events.event_date < current_date
        )
      )
    )::integer as completed_projects_count
  from project_events;
$$;

grant execute on function public.get_public_entity_event_counts(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
