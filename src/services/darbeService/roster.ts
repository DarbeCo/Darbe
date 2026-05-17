import type {
  EligibleRosterMembers,
  NewRoster,
  Roster,
  RosterAdminPermissions,
  RosterMember,
} from "../api/endpoints/types/roster.api.types";
import type { SimpleEntityInfo, SimpleUserInfo } from "../api/endpoints/types/user.api.types";
import type { Cause } from "../types/cause.types";
import { supabase } from "../supabase/client";
import { ensureUserId } from "./utils";
import { getProfilesByIds, mapProfileToSimpleUserInfo } from "./profiles";

const VOLUNTEER_VALUE_PER_HOUR = 33.49;
const FOLLOWERS_ROSTER_NAME = "Followers";
const VOLUNTEER_COORDINATORS_ROSTER_NAME = "Volunteer Coordinators";

const isMembershipRoster = (rosterName?: string | null) =>
  rosterName !== FOLLOWERS_ROSTER_NAME;

const getRosterInfo = async (
  rosterId: string
): Promise<{ ownerId: string; name: string }> => {
  const { data, error } = await supabase
    .from("rosters")
    .select("roster_owner_id, roster_name")
    .eq("id", rosterId)
    .single();

  if (error || !data) throw error ?? new Error("Roster not found");

  return {
    ownerId: data.roster_owner_id,
    name: data.roster_name,
  };
};

const getOrCreateNamedRoster = async (
  entityId: string,
  rosterName: string
): Promise<string> => {
  const { data: existingRoster, error: existingRosterError } = await supabase
    .from("rosters")
    .select("id")
    .eq("roster_owner_id", entityId)
    .eq("roster_name", rosterName)
    .limit(1)
    .maybeSingle();

  if (existingRosterError) throw existingRosterError;
  if (existingRoster?.id) return existingRoster.id;

  const { data: roster, error } = await supabase
    .from("rosters")
    .insert({
      roster_owner_id: entityId,
      roster_name: rosterName,
    })
    .select("id")
    .single();

  if (error || !roster) throw error ?? new Error("Failed to create roster");

  return roster.id;
};

const syncVolunteerCoordinatorRoster = async (
  entityId: string,
  userId: string,
  shouldInclude: boolean
): Promise<void> => {
  if (shouldInclude) {
    const rosterId = await getOrCreateNamedRoster(
      entityId,
      VOLUNTEER_COORDINATORS_ROSTER_NAME
    );
    const { error } = await supabase.from("roster_members").upsert({
      roster_id: rosterId,
      user_id: userId,
      is_admin: true,
    });

    if (error) throw error;
    await syncUserOrganizationMembership(userId, entityId);
    return;
  }

  const { data: roster, error: rosterError } = await supabase
    .from("rosters")
    .select("id")
    .eq("roster_owner_id", entityId)
    .eq("roster_name", VOLUNTEER_COORDINATORS_ROSTER_NAME)
    .limit(1)
    .maybeSingle();

  if (rosterError) throw rosterError;
  if (!roster?.id) return;

  const { error } = await supabase
    .from("roster_members")
    .delete()
    .match({ roster_id: roster.id, user_id: userId });

  if (error) throw error;
};

const hasVolunteerCoordinatorPermission = async (
  entityId: string,
  userId: string
): Promise<boolean> => {
  const { data: rosters, error: rosterError } = await supabase
    .from("rosters")
    .select("id")
    .eq("roster_owner_id", entityId);

  if (rosterError) throw rosterError;

  const rosterIds = (rosters ?? []).map((roster) => roster.id);
  if (!rosterIds.length) return false;

  const { data: membership, error } = await supabase
    .from("roster_members")
    .select("user_id")
    .eq("user_id", userId)
    .eq("is_admin", true)
    .eq("can_assign_volunteer_coordinators", true)
    .in("roster_id", rosterIds)
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return Boolean(membership);
};

const getEntityDisplayName = async (entityId: string): Promise<string> => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("nonprofit_name, organization_name, full_name")
    .eq("id", entityId)
    .single();

  if (error || !profile) {
    throw error ?? new Error("Organization not found");
  }

  return (
    profile.nonprofit_name ||
    profile.organization_name ||
    profile.full_name ||
    "Organization"
  );
};

const syncUserOrganizationMembership = async (
  userId: string,
  entityId: string
): Promise<void> => {
  const organizationName = await getEntityDisplayName(entityId);
  const { data: existingOrganization, error: existingError } = await supabase
    .from("user_organizations")
    .select("id")
    .eq("user_id", userId)
    .eq("parent_organization_id", entityId)
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingOrganization) return;

  const { error } = await supabase.from("user_organizations").insert({
    user_id: userId,
    organization_name: organizationName,
    position: "Member",
    start_date: new Date().toISOString().split("T")[0],
    parent_organization_id: entityId,
    is_child_organization: false,
  });

  if (error) throw error;
};

const removeUserOrganizationMembershipIfNeeded = async (
  userId: string,
  entityId: string
): Promise<void> => {
  const { data: rosters, error: rosterError } = await supabase
    .from("rosters")
    .select("id, roster_name")
    .eq("roster_owner_id", entityId);

  if (rosterError) throw rosterError;

  const rosterIds = (rosters ?? [])
    .filter((roster) => isMembershipRoster(roster.roster_name))
    .map((roster) => roster.id);
  if (!rosterIds.length) return;

  const { data: remainingMembership, error: membershipError } = await supabase
    .from("roster_members")
    .select("user_id")
    .eq("user_id", userId)
    .in("roster_id", rosterIds)
    .limit(1)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (remainingMembership) return;

  const { error } = await supabase
    .from("user_organizations")
    .delete()
    .eq("user_id", userId)
    .eq("parent_organization_id", entityId)
    .eq("position", "Member");

  if (error) throw error;
};

const mapProfileToSimpleEntityInfo = (profile: any): SimpleEntityInfo => ({
  id: profile.id,
  nonprofitName: profile.nonprofit_name ?? undefined,
  organizationName: profile.organization_name ?? undefined,
  profilePicture: profile.profile_picture_url ?? undefined,
  userType: profile.user_type ?? undefined,
});

const mapRosterMembers = async (
  rows: Array<{
    roster_id: string;
    user_id: string;
    is_admin: boolean;
    can_edit_assigned_roster?: boolean;
    can_assign_volunteer_coordinators?: boolean;
    can_edit_internal_events?: boolean;
    can_edit_external_events?: boolean;
    created_at?: string;
  }>
) => {
  const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
  const profiles = await getProfilesByIds(userIds);
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const [causeLinksRes, causesRes, impactRes, jobRes] = await Promise.all([
    userIds.length
      ? supabase
          .from("user_causes")
          .select("user_id, cause_id")
          .in("user_id", userIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("causes").select("id, name, description, image_url, active"),
    userIds.length
      ? supabase
          .from("impact")
          .select("impact_owner_id, hours_volunteered, events_attended")
          .in("impact_owner_id", userIds)
          .is("event_id", null)
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? supabase
          .from("user_job_experiences")
          .select("user_id, job_title, start_date")
          .in("user_id", userIds)
          .order("start_date", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (causeLinksRes.error) throw causeLinksRes.error;
  if (causesRes.error) throw causesRes.error;
  if (impactRes.error) throw impactRes.error;
  if (jobRes.error) throw jobRes.error;

  const causeMap = new Map(
    (causesRes.data ?? []).map((cause) => [
      cause.id,
      {
        id: cause.id,
        name: cause.name,
        description: cause.description,
        imageUrl: cause.image_url ?? "",
        active: cause.active,
      } as Cause,
    ])
  );
  const causesByUser = new Map<string, Cause[]>();
  (causeLinksRes.data ?? []).forEach((row) => {
    const cause = causeMap.get(row.cause_id);
    if (!cause) return;

    const list = causesByUser.get(row.user_id) ?? [];
    list.push(cause);
    causesByUser.set(row.user_id, list);
  });
  const impactMap = new Map(
    (impactRes.data ?? []).map((impact) => [impact.impact_owner_id, impact])
  );
  const jobTitleByUser = new Map<string, string>();
  (jobRes.data ?? []).forEach((job) => {
    if (!jobTitleByUser.has(job.user_id)) {
      jobTitleByUser.set(job.user_id, job.job_title);
    }
  });

  return rows.map((row) => {
    const profile = profileMap.get(row.user_id);
    const user: SimpleUserInfo = profile
      ? {
          ...mapProfileToSimpleUserInfo(profile),
          jobTitle: jobTitleByUser.get(row.user_id),
        }
      : {
          id: row.user_id,
          fullName: "",
          firstName: "",
          lastName: "",
          nonprofitName: undefined,
          organizationName: undefined,
          profilePicture: undefined,
          userType: undefined,
          jobTitle: jobTitleByUser.get(row.user_id),
        };
    const impact = impactMap.get(row.user_id);
    const hoursVolunteered = Number(impact?.hours_volunteered ?? 0);

    return {
      user,
      isAdmin: row.is_admin,
      adminPermissions: {
        canEditAssignedRoster: row.can_edit_assigned_roster ?? false,
        canAssignVolunteerCoordinators:
          row.can_assign_volunteer_coordinators ?? false,
        canEditInternalEvents: row.can_edit_internal_events ?? false,
        canEditExternalEvents: row.can_edit_external_events ?? false,
      },
      rosterId: row.roster_id,
      memberSince: row.created_at,
      causes: causesByUser.get(row.user_id) ?? [],
      volunteerSummary: {
        hoursVolunteered,
        volunteerValue: hoursVolunteered * VOLUNTEER_VALUE_PER_HOUR,
        eventsAttended: Number(impact?.events_attended ?? 0),
      },
    } as RosterMember & { rosterId: string };
  });
};

export const getRosters = async (): Promise<Roster[]> => {
  const userId = await ensureUserId();
  const { data: rosters, error } = await supabase
    .from("rosters")
    .select("id, roster_owner_id, roster_name, created_at")
    .eq("roster_owner_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  let rosterRows = rosters ?? [];

  if (!rosterRows.length) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("nonprofit_name, organization_name, user_type, profile_picture_url")
      .eq("id", userId)
      .single();

    if (profileError || !profile) throw profileError ?? new Error("User not found");

    const rosterName = profile.nonprofit_name || profile.organization_name || "Default";

    const { data: newRoster, error: insertError } = await supabase
      .from("rosters")
      .insert({
        roster_owner_id: userId,
        roster_name: `${rosterName}'s Default Roster`,
      })
      .select("id, roster_owner_id, roster_name, created_at")
      .single();

    if (insertError || !newRoster) throw insertError ?? new Error("Failed to create roster");

    rosterRows = [newRoster];
  }

  const rosterIds = rosterRows.map((roster) => roster.id);
  const { data: members, error: membersError } = await supabase
    .from("roster_members")
    .select("roster_id, user_id, is_admin, can_edit_assigned_roster, can_assign_volunteer_coordinators, can_edit_internal_events, can_edit_external_events, created_at")
    .in("roster_id", rosterIds);

  if (membersError) throw membersError;

  const rosterMembers = await mapRosterMembers(members ?? []);
  const membersByRoster = new Map<string, RosterMember[]>();
  rosterMembers.forEach((member) => {
    const list = membersByRoster.get(member.rosterId) ?? [];
    list.push({
      user: member.user,
      isAdmin: member.isAdmin,
      adminPermissions: member.adminPermissions,
      memberSince: member.memberSince,
      causes: member.causes,
      volunteerSummary: member.volunteerSummary,
    });
    membersByRoster.set(member.rosterId, list);
  });

  const ownerProfile = (await getProfilesByIds([userId]))[0];
  const ownerInfo = ownerProfile
    ? mapProfileToSimpleEntityInfo(ownerProfile)
    : ({ id: userId } as SimpleEntityInfo);

  return rosterRows.map((roster) => ({
    id: roster.id,
    rosterOwner: ownerInfo,
    rosterName: roster.roster_name,
    members: membersByRoster.get(roster.id) ?? [],
    createdAt: roster.created_at,
  }));
};

export const getRosterMembers = async (rosterId: string): Promise<RosterMember[]> => {
  const { data, error } = await supabase
    .from("roster_members")
    .select("roster_id, user_id, is_admin, can_edit_assigned_roster, can_assign_volunteer_coordinators, can_edit_internal_events, can_edit_external_events, created_at")
    .eq("roster_id", rosterId);

  if (error) throw error;

  const rosterMembers = await mapRosterMembers(data ?? []);
  return rosterMembers.map((member) => ({
    user: member.user,
    isAdmin: member.isAdmin,
    adminPermissions: member.adminPermissions,
    memberSince: member.memberSince,
    causes: member.causes,
    volunteerSummary: member.volunteerSummary,
  }));
};

export const createRoster = async (newRoster: NewRoster): Promise<Roster> => {
  const { data: roster, error } = await supabase
    .from("rosters")
    .insert({
      roster_owner_id: newRoster.rosterOwner,
      roster_name: newRoster.rosterName,
    })
    .select("id, roster_owner_id, roster_name, created_at")
    .single();

  if (error || !roster) throw error ?? new Error("Failed to create roster");

  if (newRoster.members?.length) {
    const { error: membersError } = await supabase.from("roster_members").insert(
      newRoster.members.map((memberId) => ({
        roster_id: roster.id,
        user_id: memberId,
        is_admin: false,
      }))
    );

    if (membersError) throw membersError;

    await Promise.all(
      newRoster.members.map((memberId) =>
        syncUserOrganizationMembership(memberId, roster.roster_owner_id)
      )
    );
  }

  const ownerProfile = (await getProfilesByIds([roster.roster_owner_id]))[0];
  const rosterOwner = ownerProfile
    ? mapProfileToSimpleEntityInfo(ownerProfile)
    : ({ id: roster.roster_owner_id } as SimpleEntityInfo);

  return {
    id: roster.id,
    rosterOwner,
    rosterName: roster.roster_name,
    members: [],
    createdAt: roster.created_at,
  };
};

export const deleteRoster = async (rosterId: string): Promise<void> => {
  const userId = await ensureUserId();
  const { data: roster, error: rosterError } = await supabase
    .from("rosters")
    .select("id")
    .eq("id", rosterId)
    .eq("roster_owner_id", userId)
    .single();

  if (rosterError || !roster) {
    throw rosterError ?? new Error("Roster not found");
  }

  const { data: existingMembers, error: existingMembersError } = await supabase
    .from("roster_members")
    .select("user_id")
    .eq("roster_id", rosterId);

  if (existingMembersError) throw existingMembersError;

  const { error: membersError } = await supabase
    .from("roster_members")
    .delete()
    .eq("roster_id", rosterId);

  if (membersError) throw membersError;

  const { error } = await supabase
    .from("rosters")
    .delete()
    .eq("id", rosterId)
    .eq("roster_owner_id", userId);

  if (error) throw error;

  await Promise.all(
    (existingMembers ?? []).map((member) =>
      removeUserOrganizationMembershipIfNeeded(member.user_id, userId)
    )
  );
};

export const promoteUserToAdmin = async (
  userId: string,
  rosterId: string,
  permissions: RosterAdminPermissions = {
    canEditAssignedRoster: false,
    canAssignVolunteerCoordinators: false,
    canEditInternalEvents: false,
    canEditExternalEvents: false,
  }
): Promise<void> => {
  const { error } = await supabase
    .from("roster_members")
    .update({
      is_admin: true,
      can_edit_assigned_roster: permissions.canEditAssignedRoster,
      can_assign_volunteer_coordinators:
        permissions.canAssignVolunteerCoordinators,
      can_edit_internal_events: permissions.canEditInternalEvents,
      can_edit_external_events: permissions.canEditExternalEvents,
    })
    .match({ roster_id: rosterId, user_id: userId });
  if (error) throw error;

  const roster = await getRosterInfo(rosterId);
  const shouldBeVolunteerCoordinator =
    permissions.canAssignVolunteerCoordinators ||
    (await hasVolunteerCoordinatorPermission(roster.ownerId, userId));

  await syncVolunteerCoordinatorRoster(
    roster.ownerId,
    userId,
    shouldBeVolunteerCoordinator
  );
};

export const demoteUserFromAdmin = async (userId: string, rosterId: string): Promise<void> => {
  const { error } = await supabase
    .from("roster_members")
    .update({
      is_admin: false,
      can_edit_assigned_roster: false,
      can_assign_volunteer_coordinators: false,
      can_edit_internal_events: false,
      can_edit_external_events: false,
    })
    .match({ roster_id: rosterId, user_id: userId });
  if (error) throw error;

  const roster = await getRosterInfo(rosterId);
  await syncVolunteerCoordinatorRoster(
    roster.ownerId,
    userId,
    await hasVolunteerCoordinatorPermission(roster.ownerId, userId)
  );
};

export const addToRoster = async (followerId: string, rosterId: string): Promise<void> => {
  const { error } = await supabase.from("roster_members").upsert({
    roster_id: rosterId,
    user_id: followerId,
    is_admin: false,
  });
  if (error) throw error;

  const roster = await getRosterInfo(rosterId);
  if (isMembershipRoster(roster.name)) {
    await syncUserOrganizationMembership(followerId, roster.ownerId);
  }
};

export const removeFromRoster = async (memberId: string, rosterId: string): Promise<void> => {
  const roster = await getRosterInfo(rosterId);
  const { error } = await supabase
    .from("roster_members")
    .delete()
    .match({ roster_id: rosterId, user_id: memberId });
  if (error) throw error;

  if (roster.name === VOLUNTEER_COORDINATORS_ROSTER_NAME) {
    return;
  }

  if (isMembershipRoster(roster.name)) {
    await removeUserOrganizationMembershipIfNeeded(memberId, roster.ownerId);
  }
};

export const getRosterAdmins = async (): Promise<SimpleUserInfo[]> => {
  const userId = await ensureUserId();
  const { data: rosterIds, error: rosterError } = await supabase
    .from("rosters")
    .select("id, roster_name")
    .eq("roster_owner_id", userId);

  if (rosterError) throw rosterError;

  const ids = (rosterIds ?? [])
    .filter((row) => isMembershipRoster(row.roster_name))
    .map((row) => row.id);
  if (!ids.length) return [];

  const { data: admins, error } = await supabase
    .from("roster_members")
    .select("user_id")
    .in("roster_id", ids)
    .eq("is_admin", true);

  if (error) throw error;

  const adminIds = Array.from(new Set((admins ?? []).map((row) => row.user_id)));
  const profiles = await getProfilesByIds(adminIds);
  return profiles.map(mapProfileToSimpleUserInfo);
};

export const getAllRosterMembers = async (): Promise<EligibleRosterMembers> => {
  const userId = await ensureUserId();
  const { data: rosterIds, error: rosterError } = await supabase
    .from("rosters")
    .select("id, roster_name")
    .eq("roster_owner_id", userId);

  if (rosterError) throw rosterError;

  const ids = (rosterIds ?? [])
    .filter((row) => isMembershipRoster(row.roster_name))
    .map((row) => row.id);
  if (!ids.length) {
    return { eligibleDonors: [], eligibleStaff: [] };
  }

  const { data: rosterMembers, error: rosterMembersError } = await supabase
    .from("roster_members")
    .select("user_id")
    .in("roster_id", ids);

  if (rosterMembersError) throw rosterMembersError;

  const memberIds = Array.from(new Set((rosterMembers ?? []).map((row) => row.user_id)));
  const profiles = await getProfilesByIds(memberIds);
  const memberInfo = profiles.map(mapProfileToSimpleUserInfo);

  const [donorsRes, staffRes] = await Promise.all([
    supabase.from("entity_donors").select("user_id").eq("entity_id", userId),
    supabase.from("entity_staff").select("user_id").eq("entity_id", userId),
  ]);

  if (donorsRes.error) throw donorsRes.error;
  if (staffRes.error) throw staffRes.error;

  const donorIds = new Set((donorsRes.data ?? []).map((row) => row.user_id));
  const staffIds = new Set((staffRes.data ?? []).map((row) => row.user_id));

  return {
    eligibleDonors: memberInfo.filter((member) => !donorIds.has(member.id)),
    eligibleStaff: memberInfo.filter((member) => !staffIds.has(member.id)),
  };
};

export const getEntityRosterAccess = async (
  entityId: string
): Promise<{ isMember: boolean; isAdmin: boolean; memberCount: number }> => {
  const userId = await ensureUserId();
  const { data: rosters, error: rosterError } = await supabase
    .from("rosters")
    .select("id, roster_name")
    .eq("roster_owner_id", entityId);

  if (rosterError) throw rosterError;

  const rosterIds = (rosters ?? [])
    .filter((roster) => isMembershipRoster(roster.roster_name))
    .map((roster) => roster.id);

  if (!rosterIds.length) {
    return { isMember: userId === entityId, isAdmin: userId === entityId, memberCount: 0 };
  }

  const { data: members, error: membersError } = await supabase
    .from("roster_members")
    .select("user_id, is_admin")
    .in("roster_id", rosterIds);

  if (membersError) throw membersError;

  const memberIds = new Set((members ?? []).map((member) => member.user_id));
  const currentMembership = (members ?? []).find((member) => member.user_id === userId);

  return {
    isMember: userId === entityId || memberIds.has(userId),
    isAdmin: userId === entityId || Boolean(currentMembership?.is_admin),
    memberCount: memberIds.size,
  };
};

export const getEntityRosterMembers = async (
  entityId: string
): Promise<SimpleUserInfo[]> => {
  const { data: rosters, error: rosterError } = await supabase
    .from("rosters")
    .select("id, roster_name")
    .eq("roster_owner_id", entityId);

  if (rosterError) throw rosterError;

  const rosterIds = (rosters ?? [])
    .filter((roster) => isMembershipRoster(roster.roster_name))
    .map((roster) => roster.id);
  if (!rosterIds.length) return [];

  const { data: members, error: membersError } = await supabase
    .from("roster_members")
    .select("user_id")
    .in("roster_id", rosterIds);

  if (membersError) throw membersError;

  const memberIds = Array.from(
    new Set((members ?? []).map((member) => member.user_id))
  );
  const profiles = await getProfilesByIds(memberIds);

  return profiles.map(mapProfileToSimpleUserInfo);
};

export const getRosterAdminEntityIds = async (): Promise<string[]> => {
  const userId = await ensureUserId();
  const { data: memberships, error: membershipsError } = await supabase
    .from("roster_members")
    .select("roster_id")
    .eq("user_id", userId)
    .eq("is_admin", true);

  if (membershipsError) throw membershipsError;

  const rosterIds = (memberships ?? []).map((membership) => membership.roster_id);
  if (!rosterIds.length) return [];

  const { data: rosters, error: rostersError } = await supabase
    .from("rosters")
    .select("roster_owner_id")
    .in("id", rosterIds);

  if (rostersError) throw rostersError;

  return Array.from(new Set((rosters ?? []).map((roster) => roster.roster_owner_id)));
};
