create table if not exists public.event_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  uploaded_by uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists event_photos_event_id_idx
  on public.event_photos (event_id, created_at desc);

create index if not exists event_photos_uploaded_by_idx
  on public.event_photos (uploaded_by);

alter table public.event_photos enable row level security;

drop policy if exists event_photos_select_all on public.event_photos;
create policy event_photos_select_all on public.event_photos
  for select using (true);

drop policy if exists event_photos_insert_involved on public.event_photos;
create policy event_photos_insert_involved on public.event_photos
  for insert with check (
    uploaded_by = auth.uid()
    and exists (
      select 1
      from public.events e
      where e.id = event_id
        and (
          e.event_owner_id = auth.uid()
          or e.event_coordinator_id = auth.uid()
          or exists (
            select 1
            from public.event_signups s
            where s.event_id = e.id
              and s.user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists event_photos_delete_uploader on public.event_photos;
create policy event_photos_delete_uploader on public.event_photos
  for delete using (uploaded_by = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-photos',
  'event-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists event_photos_storage_select on storage.objects;
create policy event_photos_storage_select on storage.objects
  for select using (bucket_id = 'event-photos');

drop policy if exists event_photos_storage_insert on storage.objects;
create policy event_photos_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'event-photos'
    and exists (
      select 1
      from public.events e
      where e.id::text = (storage.foldername(name))[1]
        and (
          e.event_owner_id = auth.uid()
          or e.event_coordinator_id = auth.uid()
          or exists (
            select 1
            from public.event_signups s
            where s.event_id = e.id
              and s.user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists event_photos_storage_delete on storage.objects;
create policy event_photos_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'event-photos'
    and owner = auth.uid()
  );

notify pgrst, 'reload schema';
