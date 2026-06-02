create table if not exists public.volunteer_value_rates (
  id text primary key default 'current',
  hourly_value numeric not null,
  source text not null,
  source_year integer,
  fetched_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.volunteer_value_rates enable row level security;

drop policy if exists volunteer_value_rates_select_all on public.volunteer_value_rates;
create policy volunteer_value_rates_select_all on public.volunteer_value_rates
  for select using (true);

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
  36.14,
  'Independent Sector/BLS cached default',
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

alter table public.impact
  add column if not exists volunteer_value_per_hour numeric;

update public.impact
set volunteer_value_per_hour = 36.14
where volunteer_value_per_hour is null
  and hours_volunteered > 0;

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
    36.14
  );
$$;

grant execute on function public.get_current_volunteer_value_per_hour() to authenticated;

notify pgrst, 'reload schema';
