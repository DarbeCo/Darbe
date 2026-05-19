update public.profiles
set user_type = 'nonprofit'
where lower(trim(user_type)) in ('non-profit', 'non profit');

notify pgrst, 'reload schema';
