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
    coalesce(impact.id, signup.id) as id,
    signup.event_id,
    greatest(
      extract(epoch from (signup.check_out_at - signup.check_in_at)) / 3600,
      0
    )::numeric as hours_volunteered
  from public.event_signups signup
  left join public.impact impact
    on impact.event_id = signup.event_id
    and impact.impact_owner_id = signup.user_id
    and impact.events_attended > 0
  where signup.user_id = target_user_id
    and signup.event_id is not null
    and signup.status = 'approved'
    and signup.check_in_at is not null
    and signup.check_out_at is not null
  order by coalesce(impact.updated_at, signup.event_action_timestamp) desc;
$$;

grant execute on function public.get_public_user_impact(uuid) to authenticated;

notify pgrst, 'reload schema';
