alter table public.user_details
  add column if not exists parent_entity_name text;
