alter table public.notifications
  drop constraint if exists notifications_content_type_check;

alter table public.notifications
  add constraint notifications_content_type_check
  check (
    content_type in (
      'like',
      'comment',
      'friendRequest',
      'acceptedFriendRequest',
      'follow',
      'post',
      'orgJoinRequest',
      'acceptedOrgJoinRequest',
      'deniedOrgJoinRequest'
    )
  );

notify pgrst, 'reload schema';
