alter table public.event_signups
  add column if not exists check_in_at timestamptz,
  add column if not exists check_out_at timestamptz;
