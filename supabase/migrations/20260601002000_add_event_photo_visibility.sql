alter table public.events
  add column if not exists event_photo_visibility text not null default 'public';

alter table public.events
  drop constraint if exists events_event_photo_visibility_check;

alter table public.events
  add constraint events_event_photo_visibility_check
  check (event_photo_visibility in ('public', 'private'));

create or replace function public.can_view_event_photos(target_event_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.events event
    where event.id = target_event_id
      and (
        coalesce(event.event_photo_visibility, 'public') = 'public'
        or event.event_owner_id = auth.uid()
        or event.event_coordinator_id = auth.uid()
        or exists (
          select 1
          from public.event_signups signup
          where signup.event_id = event.id
            and signup.user_id = auth.uid()
        )
        or exists (
          select 1
          from public.rosters roster
          join public.roster_members roster_member
            on roster_member.roster_id = roster.id
          where roster.roster_owner_id = event.event_owner_id
            and roster_member.user_id = auth.uid()
            and roster.roster_name <> 'Followers'
        )
      )
  );
$$;

grant execute on function public.can_view_event_photos(uuid) to authenticated;

drop policy if exists event_photos_select_all on public.event_photos;
drop policy if exists event_photos_select_visible on public.event_photos;
create policy event_photos_select_visible on public.event_photos
  for select using (public.can_view_event_photos(event_id));

notify pgrst, 'reload schema';
