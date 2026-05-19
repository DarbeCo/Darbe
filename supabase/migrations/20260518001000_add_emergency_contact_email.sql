alter table public.user_details
  add column if not exists emergency_contact_email text;

notify pgrst, 'reload schema';
