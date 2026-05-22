create table if not exists public.profile_public_id_counters (
  user_type text primary key,
  next_value integer not null default 1
);

insert into public.profile_public_id_counters (user_type, next_value)
values
  ('individual', 1),
  ('nonprofit', 1),
  ('organization', 1)
on conflict (user_type) do nothing;

alter table public.profiles
  add column if not exists public_id text;

create unique index if not exists profiles_public_id_unique_idx
  on public.profiles(public_id)
  where public_id is not null;

create or replace function public.get_profile_public_id_prefix(profile_user_type text)
returns text
language sql
immutable
as $$
  select case
    when lower(trim(profile_user_type)) = 'individual' then 'U'
    when lower(trim(profile_user_type)) in ('nonprofit', 'non-profit', 'non profit') then 'N'
    when lower(trim(profile_user_type)) = 'organization' then 'O'
    else 'U'
  end;
$$;

create or replace function public.assign_profile_public_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_type text;
  next_number integer;
  id_prefix text;
begin
  if new.public_id is not null then
    return new;
  end if;

  normalized_type := case
    when lower(trim(new.user_type)) = 'individual' then 'individual'
    when lower(trim(new.user_type)) in ('nonprofit', 'non-profit', 'non profit') then 'nonprofit'
    when lower(trim(new.user_type)) = 'organization' then 'organization'
    else 'individual'
  end;
  id_prefix := public.get_profile_public_id_prefix(normalized_type);

  insert into public.profile_public_id_counters (user_type, next_value)
  values (normalized_type, 1)
  on conflict (user_type) do nothing;

  update public.profile_public_id_counters
  set next_value = next_value + 1
  where user_type = normalized_type
  returning next_value - 1 into next_number;

  new.public_id := id_prefix || '-' || next_number;
  return new;
end;
$$;

drop trigger if exists assign_profile_public_id_before_insert on public.profiles;
create trigger assign_profile_public_id_before_insert
  before insert on public.profiles
  for each row
  execute function public.assign_profile_public_id();

with numbered_profiles as (
  select
    id,
    public.get_profile_public_id_prefix(user_type) as id_prefix,
    lower(trim(user_type)) as normalized_type,
    row_number() over (
      partition by public.get_profile_public_id_prefix(user_type)
      order by created_at, id
    ) as sequence_number
  from public.profiles
  where public_id is null
)
update public.profiles profile
set public_id = numbered.id_prefix || '-' || numbered.sequence_number
from numbered_profiles numbered
where profile.id = numbered.id;

update public.profile_public_id_counters counter
set next_value = coalesce((
  select max(substring(profile.public_id from 3)::integer) + 1
  from public.profiles profile
  where public.get_profile_public_id_prefix(profile.user_type) =
    public.get_profile_public_id_prefix(counter.user_type)
), 1);
