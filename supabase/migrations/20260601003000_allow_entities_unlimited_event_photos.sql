drop policy if exists event_photos_insert_involved on public.event_photos;
create policy event_photos_insert_involved on public.event_photos
  for insert with check (
    uploaded_by = auth.uid()
    and (
      exists (
        select 1
        from public.profiles profile
        where profile.id = auth.uid()
          and profile.user_type in ('organization', 'nonprofit')
      )
      or (
        select count(*)
        from public.event_photos existing_photo
        where existing_photo.event_id = event_photos.event_id
          and existing_photo.uploaded_by = auth.uid()
      ) < 5
    )
    and exists (
      select 1
      from public.events event
      where event.id = event_photos.event_id
        and (
          event.event_owner_id = auth.uid()
          or event.event_coordinator_id = auth.uid()
          or exists (
            select 1
            from public.event_signups signup
            where signup.event_id = event.id
              and signup.user_id = auth.uid()
          )
        )
    )
  );

drop policy if exists event_photos_storage_insert on storage.objects;
create policy event_photos_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'event-photos'
    and (
      exists (
        select 1
        from public.profiles profile
        where profile.id = auth.uid()
          and profile.user_type in ('organization', 'nonprofit')
      )
      or (
        select count(*)
        from public.event_photos existing_photo
        where existing_photo.event_id::text = (storage.foldername(name))[1]
          and existing_photo.uploaded_by = auth.uid()
      ) < 5
    )
    and exists (
      select 1
      from public.events event
      where event.id::text = (storage.foldername(name))[1]
        and (
          event.event_owner_id = auth.uid()
          or event.event_coordinator_id = auth.uid()
          or exists (
            select 1
            from public.event_signups signup
            where signup.event_id = event.id
              and signup.user_id = auth.uid()
          )
        )
    )
  );

notify pgrst, 'reload schema';
