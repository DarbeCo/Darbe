alter table public.events
  add column if not exists roster_id uuid references public.rosters(id) on delete set null;

create index if not exists events_roster_id_idx
  on public.events(roster_id);
