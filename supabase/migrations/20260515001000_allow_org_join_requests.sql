alter table public.friend_requests
  drop constraint if exists friend_requests_request_type_check;

alter table public.friend_requests
  add constraint friend_requests_request_type_check
  check (request_type in ('friend', 'follow', 'join'));

notify pgrst, 'reload schema';
