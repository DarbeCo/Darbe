create or replace function public.get_public_user_impact(target_user_id uuid)
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
    impact.id,
    impact.event_id,
    impact.hours_volunteered
  from public.impact
  join public.event_signups signup
    on signup.event_id = impact.event_id
    and signup.user_id = impact.impact_owner_id
  where impact.impact_owner_id = target_user_id
    and impact.event_id is not null
    and impact.events_attended > 0
    and signup.status = 'approved'
  order by impact.updated_at desc;
$$;

grant execute on function public.get_public_user_impact(uuid) to authenticated;

notify pgrst, 'reload schema';
