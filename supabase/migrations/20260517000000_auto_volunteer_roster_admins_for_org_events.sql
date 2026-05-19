-- Roster admins are event admins/coordinators through roster access, but they
-- should not be volunteered automatically. Members/admins should see entity
-- events as matches and volunteer themselves.

notify pgrst, 'reload schema';
