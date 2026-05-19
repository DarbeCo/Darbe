delete from public.event_signups signup
using public.events event
where signup.event_id = event.id
  and signup.status = 'volunteered'
  and signup.check_in_at is null
  and signup.check_out_at is null
  and signup.volunteer_start_time is null
  and signup.volunteer_end_time is null
  and exists (
    select 1
    from public.rosters roster
    join public.roster_members roster_member
      on roster_member.roster_id = roster.id
    join public.profiles profile
      on profile.id = roster_member.user_id
    where roster.roster_owner_id = event.event_owner_id
      and roster.roster_name <> 'Followers'
      and roster_member.user_id = signup.user_id
      and roster_member.is_admin = true
      and profile.user_type = 'individual'
  );

notify pgrst, 'reload schema';
