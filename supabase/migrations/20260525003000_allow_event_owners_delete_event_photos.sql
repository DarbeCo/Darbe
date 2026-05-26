drop policy if exists event_photos_delete_uploader on public.event_photos;
create policy event_photos_delete_uploader_or_event_owner on public.event_photos
  for delete using (
    uploaded_by = auth.uid()
    or exists (
      select 1
      from public.events event
      where event.id = event_id
        and event.event_owner_id = auth.uid()
    )
  );

drop policy if exists event_photos_storage_delete on storage.objects;
create policy event_photos_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'event-photos'
    and (
      owner = auth.uid()
      or exists (
        select 1
        from public.events event
        where event.id::text = (storage.foldername(name))[1]
          and event.event_owner_id = auth.uid()
      )
    )
  );

notify pgrst, 'reload schema';
