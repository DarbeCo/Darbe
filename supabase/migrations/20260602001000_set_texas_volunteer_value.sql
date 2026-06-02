insert into public.volunteer_value_rates (
  id,
  hourly_value,
  source,
  source_year,
  fetched_at,
  updated_at
)
values (
  'current',
  33.59,
  'Texas volunteer value cached override',
  2025,
  now(),
  now()
)
on conflict (id) do update
set
  hourly_value = excluded.hourly_value,
  source = excluded.source,
  source_year = excluded.source_year,
  fetched_at = excluded.fetched_at,
  updated_at = excluded.updated_at;

update public.impact
set volunteer_value_per_hour = 33.59
where volunteer_value_per_hour is distinct from 33.59;

create or replace function public.get_current_volunteer_value_per_hour()
returns numeric
language sql
stable
set search_path = public
as $$
  select coalesce(
    (
      select hourly_value
      from public.volunteer_value_rates
      where id = 'current'
      limit 1
    ),
    33.59
  );
$$;

grant execute on function public.get_current_volunteer_value_per_hour() to authenticated;

notify pgrst, 'reload schema';
