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
  with owned_event_impacts as (
    select
      event.id as id,
      event.id as event_id,
      event.event_date,
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
  ),
  entity_signup_impacts as (
    select
      signup.id,
      signup.event_id,
      event.event_date,
      case
        when signup.check_in_at is not null and signup.check_out_at is not null then
          greatest(
            extract(epoch from (signup.check_out_at - signup.check_in_at)) / 3600,
            0
          )::numeric
        else 0::numeric
      end as hours_volunteered
    from public.event_signups signup
    join public.events event
      on event.id = signup.event_id
    where signup.user_id = target_entity_id
      and signup.status in ('volunteered', 'confirmed', 'approved', 'no_show')
      and (
        (
          event.end_time is not null
          and (event.event_date + event.end_time) < now()
        )
        or (
          event.end_time is null
          and event.event_date < current_date
        )
      )
      and not exists (
        select 1
        from owned_event_impacts owned
        where owned.event_id = signup.event_id
      )
  )
  select
    impact.id,
    impact.event_id,
    impact.hours_volunteered
  from (
    select * from owned_event_impacts
    union all
    select * from entity_signup_impacts
  ) impact
  order by impact.event_date desc;
$$;

grant execute on function public.get_public_entity_volunteer_impact(uuid) to authenticated;

notify pgrst, 'reload schema';
