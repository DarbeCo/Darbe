-- One-time alpha reset script.
--
-- This deletes app users, auth users, uploaded file references, and all
-- user-generated database rows. It intentionally preserves schema/migrations,
-- storage buckets/objects, and lookup data such as public.causes.
--
-- Supabase does not allow direct deletes from storage.objects. To remove
-- uploaded files, use the Storage API or Supabase dashboard after this script.
--
-- Run manually in the Supabase SQL editor or psql against the intended
-- alpha database only. Take a backup first.

begin;

-- Clear all public app data that belongs to users/content.
do $$
declare
  tables_to_clear text[] := array[
    'notifications',
    'messages',
    'message_thread_participants',
    'message_threads',
    'event_photos',
    'event_signups',
    'event_volunteer_impacts',
    'event_requirements',
    'event_addresses',
    'events',
    'comment_likes',
    'comments',
    'post_likes',
    'post_files',
    'posts',
    'documents',
    'entity_donors',
    'entity_staff',
    'entity_details',
    'roster_members',
    'rosters',
    'friend_requests',
    'friendships',
    'follows',
    'impact',
    'user_causes',
    'user_organizations',
    'organizations',
    'user_military_service',
    'user_volunteer_experiences',
    'user_job_experiences',
    'user_education',
    'user_licenses',
    'user_skills',
    'user_availability',
    'user_details',
    'profiles'
  ];
  table_name text;
  existing_tables text := '';
begin
  foreach table_name in array tables_to_clear loop
    if to_regclass('public.' || table_name) is not null then
      existing_tables := existing_tables || format('%I.%I, ', 'public', table_name);
    end if;
  end loop;

  if existing_tables <> '' then
    existing_tables := left(existing_tables, length(existing_tables) - 2);
    execute 'truncate table ' || existing_tables || ' restart identity cascade';
  end if;
end $$;

-- Clear Supabase Auth data. These tables can vary between Supabase versions,
-- so each delete checks whether the table exists first.
do $$
declare
  auth_tables_to_clear text[] := array[
    'mfa_challenges',
    'mfa_factors',
    'one_time_tokens',
    'saml_relay_states',
    'sso_domains',
    'sso_providers',
    'flow_state',
    'refresh_tokens',
    'sessions',
    'identities',
    'users'
  ];
  table_name text;
begin
  foreach table_name in array auth_tables_to_clear loop
    if to_regclass('auth.' || table_name) is not null then
      execute format('delete from %I.%I', 'auth', table_name);
    end if;
  end loop;
end $$;

commit;
