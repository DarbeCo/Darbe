create or replace function public.get_public_entity_volunteer_impact(target_entity_id uuid)
returns table (
  id uuid,
  event_id uuid,
  hours_volunteered numeric
)
language sql
security definer
set search_path = public
as $$
  select
    event.id as id,
    event.id as event_id,
    coalesce(
      sum(
        greatest(
          extract(epoch from (signup.check_out_at - signup.check_in_at)) / 3600,
          0
        )
      ),
      0
    )::numeric as hours_volunteered
  from public.events event
  join public.event_signups signup
    on signup.event_id = event.id
  where event.event_owner_id = target_entity_id
    and signup.status = 'approved'
    and signup.check_in_at is not null
    and signup.check_out_at is not null
  group by event.id, event.event_date
  order by event.event_date desc;
$$;

grant execute on function public.get_public_entity_volunteer_impact(uuid) to authenticated;

notify pgrst, 'reload schema';
