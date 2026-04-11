import type {
  EligibleRosterMembers,
  NewRoster,
  Roster,
  RosterMember,
} from "../api/endpoints/types/roster.api.types";
import type { SimpleEntityInfo, SimpleUserInfo } from "../api/endpoints/types/user.api.types";
import { supabase } from "../supabase/client";
import { ensureUserId } from "./utils";
import { getProfilesByIds, mapProfileToSimpleUserInfo } from "./profiles";

const mapProfileToSimpleEntityInfo = (profile: any): SimpleEntityInfo => ({
  id: profile.id,
  nonprofitName: profile.nonprofit_name ?? undefined,
  organizationName: profile.organization_name ?? undefined,
  profilePicture: profile.profile_picture_url ?? undefined,
  userType: profile.user_type ?? undefined,
});

const mapRosterMembers = async (rows: Array<{ roster_id: string; user_id: string; is_admin: boolean }>) => {
  const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
  const profiles = await getProfilesByIds(userIds);
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  return rows.map((row) => {
    const profile = profileMap.get(row.user_id);
    const user: SimpleUserInfo = profile ? mapProfileToSimpleUserInfo(profile) : {
      id: row.user_id,
      fullName: "",
      firstName: "",
      lastName: "",
      nonprofitName: undefined,
      organizationName: undefined,
      profilePicture: undefined,
      userType: undefined,
    };

    return {
      user,
      isAdmin: row.is_admin,
      rosterId: row.roster_id,
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
    .select("roster_id, user_id, is_admin")
    .in("roster_id", rosterIds);

  if (membersError) throw membersError;

  const rosterMembers = await mapRosterMembers(members ?? []);
  const membersByRoster = new Map<string, RosterMember[]>();
  rosterMembers.forEach((member) => {
    const list = membersByRoster.get(member.rosterId) ?? [];
    list.push({ user: member.user, isAdmin: member.isAdmin });
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
    .select("roster_id, user_id, is_admin")
    .eq("roster_id", rosterId);

  if (error) throw error;

  const rosterMembers = await mapRosterMembers(data ?? []);
  return rosterMembers.map((member) => ({ user: member.user, isAdmin: member.isAdmin }));
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

export const promoteUserToAdmin = async (userId: string, rosterId: string): Promise<void> => {
  const { error } = await supabase
    .from("roster_members")
    .update({ is_admin: true })
    .match({ roster_id: rosterId, user_id: userId });
  if (error) throw error;
};

export const demoteUserFromAdmin = async (userId: string, rosterId: string): Promise<void> => {
  const { error } = await supabase
    .from("roster_members")
    .update({ is_admin: false })
    .match({ roster_id: rosterId, user_id: userId });
  if (error) throw error;
};

export const addToRoster = async (followerId: string, rosterId: string): Promise<void> => {
  const { error } = await supabase.from("roster_members").upsert({
    roster_id: rosterId,
    user_id: followerId,
    is_admin: false,
  });
  if (error) throw error;
};

export const removeFromRoster = async (memberId: string, rosterId: string): Promise<void> => {
  const { error } = await supabase
    .from("roster_members")
    .delete()
    .match({ roster_id: rosterId, user_id: memberId });
  if (error) throw error;
};

export const getRosterAdmins = async (): Promise<SimpleUserInfo[]> => {
  const userId = await ensureUserId();
  const { data: rosterIds, error: rosterError } = await supabase
    .from("rosters")
    .select("id")
    .eq("roster_owner_id", userId);

  if (rosterError) throw rosterError;

  const ids = (rosterIds ?? []).map((row) => row.id);
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
    .select("id")
    .eq("roster_owner_id", userId);

  if (rosterError) throw rosterError;

  const ids = (rosterIds ?? []).map((row) => row.id);
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
