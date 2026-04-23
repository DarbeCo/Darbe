import type { DarbeProfileSharedState, UserState } from "../../features/users/userSlice";
import type {
  EducationState,
  EmergencyContactState,
  JobExperienceState,
  LicenseState,
  MilitaryServiceState,
  OrganizationState,
  SimpleOrganizationInfo,
  SimpleUserState,
  SkillState,
  VolunteerExperienceState,
} from "../../features/users/userProfiles/types";
import type {
  ProfileFriendState,
  ProfileFollowState,
} from "../../features/friends/types";
import type { EntityDonorsAndStaff } from "../api/endpoints/types/roster.api.types";
import type { EntityDocument, SimpleUserInfo } from "../api/endpoints/types/user.api.types";
import type { Availability, DayOfWeek } from "../types/availability.types";
import { supabase } from "../supabase/client";
import { ensureUserId } from "./utils";
import type { MilitaryBranch } from "../../features/users/userProfiles/constants";

type RelatedUserTable =
  | "user_skills"
  | "user_licenses"
  | "user_education"
  | "user_job_experiences"
  | "user_volunteer_experiences"
  | "user_military_service"
  | "user_organizations"
  | "user_causes";

const DAY_ORDER: DayOfWeek[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const DAY_TO_INDEX = DAY_ORDER.reduce(
  (acc, day, index) => {
    acc[day] = index;
    return acc;
  },
  {} as Record<DayOfWeek, number>
);

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );

const hoursToTime = (value?: string): string | null => {
  if (!value) {
    return null;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  const hours = Math.floor(numeric);
  const minutes = numeric % 1 === 0 ? 0 : 30;
  const hh = String(hours).padStart(2, "0");
  const mm = minutes === 0 ? "00" : "30";
  return `${hh}:${mm}`;
};

const buildAvailabilityRows = (userId: string, availability?: Availability) => {
  if (!availability) {
    return [] as Array<{
      user_id: string;
      day_of_week: number;
      start_time: string | null;
      end_time: string | null;
      is_open: boolean;
    }>;
  }

  return DAY_ORDER.map((day) => {
    const entry = availability[day];
    const isOpen = Boolean(entry?.open);
    return {
      user_id: userId,
      day_of_week: DAY_TO_INDEX[day],
      start_time: hoursToTime(entry?.start),
      end_time: hoursToTime(entry?.end),
      is_open: isOpen,
    };
  });
};

const resolveCauseIds = async (causeValues: string[]) => {
  const values = (causeValues ?? []).filter(Boolean);
  if (!values.length) return [];

  const directIds = values.filter(isUuid);
  const names = values.filter((value) => !isUuid(value));

  if (!names.length) return Array.from(new Set(directIds));

  const { data, error } = await supabase
    .from("causes")
    .select("id, name")
    .in("name", names);

  if (error) throw error;

  const idsFromNames = (data ?? []).map((row) => row.id);
  return Array.from(new Set([...directIds, ...idsFromNames]));
};

const mapProfileToUserState = (
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    user_type: string;
    zip: string;
    city: string;
    date_of_birth?: string | null;
    ein: string | null;
    nonprofit_name: string | null;
    organization_name: string | null;
    profile_picture_url: string | null;
    cover_photo_url: string | null;
  },
  causeIds: string[],
  availability?: Availability
): UserState => ({
  id: profile.id,
  email: profile.email,
  fullName:
    profile.full_name ??
    `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim(),
  firstName: profile.first_name ?? "",
  lastName: profile.last_name ?? "",
  dateOfBirth: profile.date_of_birth ?? undefined,
  causes: causeIds,
  userType: profile.user_type,
  zip: profile.zip,
  city: profile.city,
  availability,
  ein: profile.ein ?? undefined,
  nonprofitName: profile.nonprofit_name ?? undefined,
  organizationName: profile.organization_name ?? undefined,
  profilePicture: profile.profile_picture_url ?? undefined,
  coverPhoto: profile.cover_photo_url ?? undefined,
});

export const mapProfileToSimpleUserInfo = (
  profile: {
    id: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    nonprofit_name: string | null;
    organization_name: string | null;
    profile_picture_url: string | null;
    user_type?: string | null;
  }
): SimpleUserInfo => ({
  id: profile.id,
  fullName:
    profile.full_name ??
    `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim(),
  firstName: profile.first_name ?? "",
  lastName: profile.last_name ?? "",
  nonprofitName: profile.nonprofit_name ?? undefined,
  organizationName: profile.organization_name ?? undefined,
  profilePicture: profile.profile_picture_url ?? undefined,
  userType: profile.user_type ?? undefined,
});

export const mapProfileToSimpleUserState = (
  profile: {
    id: string;
    full_name: string | null;
    profile_picture_url: string | null;
  }
): SimpleUserState => ({
  id: profile.id,
  fullName: profile.full_name ?? "",
  profilePicture: profile.profile_picture_url ?? "",
});

export const mapProfileToFriend = (
  profile: {
    id: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    profile_picture_url: string | null;
    nonprofit_name: string | null;
    organization_name: string | null;
    city: string | null;
    zip: string | null;
  }
): ProfileFriendState => ({
  id: profile.id,
  _id: profile.id,
  fullName:
    profile.full_name ??
    `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim(),
  profilePicture: profile.profile_picture_url ?? "",
  firstName: profile.first_name ?? "",
  lastName: profile.last_name ?? "",
  organizationName: profile.organization_name ?? undefined,
  nonprofitName: profile.nonprofit_name ?? undefined,
  city: profile.city ?? "",
  zip: profile.zip ?? "",
});

export const mapProfileToFollow = (
  profile: {
    id: string;
    profile_picture_url: string | null;
    nonprofit_name: string | null;
    organization_name: string | null;
  }
): ProfileFollowState => ({
  id: profile.id,
  profilePicture: profile.profile_picture_url ?? "",
  nonprofitName: profile.nonprofit_name ?? undefined,
  organizationName: profile.organization_name ?? undefined,
});

const mapAvailability = (
  rows: Array<{
    day_of_week: number;
    start_time: string | null;
    end_time: string | null;
    is_open: boolean;
  }>
): Availability => {
  const availability: Availability = {};
  DAY_ORDER.forEach((day) => {
    availability[day] = { start: "", end: "", open: false };
  });

  rows.forEach((row) => {
    const day = DAY_ORDER[row.day_of_week];
    if (!day) return;

    const toHours = (time: string | null) => {
      if (!time) return "";
      const [hoursValue, minutesValue] = time.split(":");
      const hours = Number(hoursValue);
      const minutes = Number(minutesValue);
      if (!Number.isFinite(hours)) return "";
      const decimal = minutes >= 30 ? 0.5 : 0;
      return (hours + decimal).toString();
    };

    availability[day] = {
      start: toHours(row.start_time),
      end: toHours(row.end_time),
      open: row.is_open,
    };
  });

  return availability;
};

export const getProfilesByIds = async (ids: string[]) => {
  if (!ids.length) return [] as any[];
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, first_name, last_name, profile_picture_url, nonprofit_name, organization_name, city, zip, user_type"
    )
    .in("id", ids);

  if (error) throw error;
  return data ?? [];
};

export const getSimpleUserInfo = async (userId?: string): Promise<SimpleUserInfo> => {
  if (!userId) {
    throw new Error("User id required");
  }
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, first_name, last_name, profile_picture_url, nonprofit_name, organization_name, user_type"
    )
    .eq("id", userId)
    .single();

  if (error || !data) throw error ?? new Error("User not found");
  return mapProfileToSimpleUserInfo(data);
};

export const getEntityFollowers = async (userId: string): Promise<SimpleUserInfo[]> => {
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", userId);

  if (error) throw error;
  const followerIds = (data ?? []).map((row) => row.follower_id);
  const profiles = await getProfilesByIds(followerIds);
  return profiles.map(mapProfileToSimpleUserInfo);
};

export const getDonorsAndStaff = async (entityId: string): Promise<EntityDonorsAndStaff> => {
  const [{ data: donors, error: donorError }, { data: staff, error: staffError }] =
    await Promise.all([
      supabase.from("entity_donors").select("user_id").eq("entity_id", entityId),
      supabase.from("entity_staff").select("user_id").eq("entity_id", entityId),
    ]);

  if (donorError) throw donorError;
  if (staffError) throw staffError;

  const donorProfiles = await getProfilesByIds((donors ?? []).map((row) => row.user_id));
  const staffProfiles = await getProfilesByIds((staff ?? []).map((row) => row.user_id));

  return {
    donors: donorProfiles.map(mapProfileToSimpleUserInfo),
    staff: staffProfiles.map(mapProfileToSimpleUserInfo),
  };
};

export const addToDonors = async (userId: string) => {
  const entityId = await ensureUserId();
  const { error } = await supabase.from("entity_donors").upsert({
    entity_id: entityId,
    user_id: userId,
  });
  if (error) throw error;
};

export const removeFromDonors = async (userId: string) => {
  const entityId = await ensureUserId();
  const { error } = await supabase
    .from("entity_donors")
    .delete()
    .eq("entity_id", entityId)
    .eq("user_id", userId);
  if (error) throw error;
};

export const addToStaff = async (userId: string) => {
  const entityId = await ensureUserId();
  const { error } = await supabase.from("entity_staff").upsert({
    entity_id: entityId,
    user_id: userId,
  });
  if (error) throw error;
};

export const removeFromStaff = async (userId: string) => {
  const entityId = await ensureUserId();
  const { error } = await supabase
    .from("entity_staff")
    .delete()
    .eq("entity_id", entityId)
    .eq("user_id", userId);
  if (error) throw error;
};

export const getEntityDocuments = async (): Promise<EntityDocument[]> => {
  const userId = await ensureUserId();
  const { data, error } = await supabase
    .from("documents")
    .select("id, url, document_category, file_name, file_type, uploaded_at")
    .eq("user_id", userId)
    .order("uploaded_at", { ascending: false });

  if (error) throw error;

  const profile = await getSimpleUserInfo(userId);

  return (data ?? []).map((doc) => ({
    id: doc.id,
    url: doc.url,
    documentCategory: doc.document_category,
    fileName: doc.file_name,
    fileType: doc.file_type,
    uploadedAt: doc.uploaded_at,
    user: profile,
  }));
};

export const uploadDocument = async (documentCategory: string, file: File) => {
  const userId = await ensureUserId();
  const filePath = `${userId}/${crypto.randomUUID()}-${file.name}`;
  const bucket = "documents";

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { contentType: file.type });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  const { error: insertError } = await supabase.from("documents").insert({
    user_id: userId,
    url: publicUrlData.publicUrl,
    document_category: documentCategory,
    file_name: file.name,
    file_type: file.type,
  });

  if (insertError) throw insertError;
};

export const deleteDocument = async (documentId: string) => {
  const { error } = await supabase.from("documents").delete().eq("id", documentId);
  if (error) throw error;
};

const mapUserDetailsToProfile = (
  profileRow: any,
  detailsRow: any,
  causeIds: string[],
  availabilityRows: any[]
): DarbeProfileSharedState => {
  const availability = availabilityRows?.length ? mapAvailability(availabilityRows) : undefined;
  const user = mapProfileToUserState(profileRow, causeIds, availability);

  const emergencyContact: EmergencyContactState = {
    name: detailsRow?.emergency_contact_name ?? "",
    phone: detailsRow?.emergency_contact_phone ?? "",
    relation: detailsRow?.emergency_contact_relation ?? "",
  };

  return {
    user,
    friends: [],
    followers: [],
    following: [],
    volunteerHours: detailsRow?.volunteer_hours ?? 0,
    aboutMe: detailsRow?.about_me ?? "",
    volunteerReason: detailsRow?.volunteer_reason ?? "",
    tagLine: detailsRow?.tag_line ?? "",
    gender: detailsRow?.gender ?? "",
    race: detailsRow?.race ?? "",
    city: profileRow.city ?? "",
    state: detailsRow?.state ?? "",
    emergencyContact,
    phoneNumber: detailsRow?.phone_number ?? "",
    allergies: detailsRow?.allergies ?? "",
    // Entity fields
    address: detailsRow?.address ?? "",
    nonprofitType: detailsRow?.nonprofit_type ?? "",
    website: detailsRow?.website ?? "",
    motto: detailsRow?.motto ?? "",
    mission: detailsRow?.mission ?? "",
    values: detailsRow?.values ?? "",
    aboutUs: detailsRow?.about_us ?? "",
    programs: detailsRow?.programs ?? "",
  } as DarbeProfileSharedState;
};

const replaceTableRows = async (
  table: RelatedUserTable,
  userId: string,
  rows: any[]
) => {
  await supabase.from(table as any).delete().eq("user_id", userId);
  if (rows.length) {
    const { error } = await supabase.from(table as any).insert(rows as any);
    if (error) throw error;
  }
};

export const updateUserProfile = async (
  profile: Partial<DarbeProfileSharedState>
): Promise<DarbeProfileSharedState> => {
  const userId = profile.user?.id ?? (await ensureUserId());
  const availability = profile.user?.availability;

  if (profile.user) {
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: profile.user.firstName ?? undefined,
        last_name: profile.user.lastName ?? undefined,
        city: profile.user.city ?? undefined,
        zip: profile.user.zip ?? undefined,
        date_of_birth: profile.user.dateOfBirth ?? undefined,
        ein: profile.user.ein ?? undefined,
        nonprofit_name: profile.user.nonprofitName ?? undefined,
        organization_name: profile.user.organizationName ?? undefined,
        profile_picture_url: profile.user.profilePicture ?? undefined,
        cover_photo_url: profile.user.coverPhoto ?? undefined,
      })
      .eq("id", userId);

    if (error) throw error;
  }

  const { error: detailsError } = await supabase
    .from("user_details")
    .upsert(
      {
        user_id: userId,
        about_me: profile.aboutMe ?? undefined,
        volunteer_reason: profile.volunteerReason ?? undefined,
        tag_line: profile.tagLine ?? undefined,
        gender: profile.gender ?? undefined,
        race: profile.race ?? undefined,
        phone_number: profile.phoneNumber ?? undefined,
        allergies: profile.allergies ?? undefined,
        address: profile.address ?? undefined,
        state: profile.state ?? undefined,
        nonprofit_type: profile.nonprofitType ?? undefined,
        website: profile.website ?? undefined,
        motto: profile.motto ?? undefined,
        mission: profile.mission ?? undefined,
        values: profile.values ?? undefined,
        about_us: profile.aboutUs ?? undefined,
        programs: profile.programs ?? undefined,
      },
      { onConflict: "user_id" }
    );

  if (detailsError) throw detailsError;

  if (profile.user?.causes) {
    const resolvedIds = await resolveCauseIds(profile.user.causes);
    const rows = resolvedIds.map((causeId) => ({
      user_id: userId,
      cause_id: causeId,
    }));
    await replaceTableRows("user_causes", userId, rows);
  }

  if (profile.skills) {
    const rows = profile.skills.map((skill) => ({
      user_id: userId,
      skill_name: skill.skillName,
    }));
    await replaceTableRows("user_skills", userId, rows);
  }

  if (profile.licenses) {
    const rows = profile.licenses.map((license) => ({
      user_id: userId,
      license_name: license.licenseName,
      license_issuer: license.licenseIssuer,
      issue_date: license.issueDate,
      expiration_date: license.expirationDate,
      does_not_expire: license.doesNotExpire,
      description: license.description,
    }));
    await replaceTableRows("user_licenses", userId, rows);
  }

  if (profile.education) {
    const rows = profile.education.map((edu) => ({
      user_id: userId,
      school_name: edu.schoolName,
      degree: edu.degree,
      start_date: edu.startDate,
      end_date: edu.endDate,
      description: edu.description,
    }));
    await replaceTableRows("user_education", userId, rows);
  }

  if (profile.jobExperiences) {
    const rows = profile.jobExperiences.map((job) => ({
      user_id: userId,
      job_title: job.jobTitle,
      entity_name: job.entityName,
      occupation_type: job.occupationType,
      start_date: job.startDate,
      end_date: job.endDate,
      description: job.description,
    }));
    await replaceTableRows("user_job_experiences", userId, rows);
  }

  if (profile.volunteerExperiences) {
    const rows = profile.volunteerExperiences.map((volunteer) => ({
      user_id: userId,
      entity_name: volunteer.entityName,
      start_date: volunteer.startDate,
      end_date: volunteer.endDate,
      total_hours: volunteer.totalHours,
      description: volunteer.description,
    }));
    await replaceTableRows("user_volunteer_experiences", userId, rows);
  }

  if (profile.militaryService) {
    const rows = profile.militaryService.map((military) => ({
      user_id: userId,
      branch: military.branch,
      start_date: military.startDate,
      end_date: military.endDate,
      rank: military.rank,
      description: military.description,
      status: military.status,
    }));
    await replaceTableRows("user_military_service", userId, rows);
  }

  if (profile.organizations) {
    const rows = profile.organizations.map((org) => ({
      user_id: userId,
      organization_name: org.organizationName,
      position: org.position,
      start_date: org.startDate,
      end_date: org.endDate,
      description: org.description,
      parent_organization_id: org.parentOrganization?.id,
      is_child_organization: org.isChildOrganization ?? false,
    }));
    await replaceTableRows("user_organizations", userId, rows);
  }

  if (availability) {
    const availabilityRows = buildAvailabilityRows(userId, availability);
    const { error: availabilityError } = await supabase
      .from("user_availability")
      .upsert(availabilityRows, { onConflict: "user_id,day_of_week" });

    if (availabilityError) throw availabilityError;
  }

  return getUserProfile(userId);
};

export const removeUserSkill = async (skillName: string) => {
  const userId = await ensureUserId();
  const { error } = await supabase
    .from("user_skills")
    .delete()
    .eq("user_id", userId)
    .eq("skill_name", skillName);
  if (error) throw error;

  return getUserProfile(userId);
};

export const removeUserLicense = async (licenseId: string) => {
  const userId = await ensureUserId();
  const { error } = await supabase
    .from("user_licenses")
    .delete()
    .eq("id", licenseId)
    .eq("user_id", userId);
  if (error) throw error;

  return getUserProfile(userId);
};

export const removeUserOrganization = async (organizationId: string) => {
  const userId = await ensureUserId();
  const { error } = await supabase
    .from("user_organizations")
    .delete()
    .eq("id", organizationId)
    .eq("user_id", userId);
  if (error) throw error;
};

export const getUserProfile = async (userId: string): Promise<DarbeProfileSharedState> => {
  const [profileRes, detailsRes, causesRes, availabilityRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, email, full_name, first_name, last_name, user_type, zip, city, date_of_birth, ein, nonprofit_name, organization_name, profile_picture_url, cover_photo_url"
      )
      .eq("id", userId)
      .single(),
    supabase.from("user_details").select("*").eq("user_id", userId).single(),
    supabase.from("user_causes").select("cause_id").eq("user_id", userId),
    supabase
      .from("user_availability")
      .select("day_of_week, start_time, end_time, is_open")
      .eq("user_id", userId),
  ]);

  if (profileRes.error || !profileRes.data) throw profileRes.error ?? new Error("Profile not found");
  if (detailsRes.error) throw detailsRes.error;
  if (causesRes.error) throw causesRes.error;
  if (availabilityRes.error) throw availabilityRes.error;

  const profile = profileRes.data;
  const details = detailsRes.data ?? {};
  const causeIds = (causesRes.data ?? []).map((row) => row.cause_id);
  const availabilityRows = availabilityRes.data ?? [];

  const base = mapUserDetailsToProfile(profile, details, causeIds, availabilityRows);

  const [skillsRes, licensesRes, educationRes, jobRes, volunteerRes, militaryRes, orgRes] =
    await Promise.all([
      supabase.from("user_skills").select("id, skill_name").eq("user_id", userId),
      supabase
        .from("user_licenses")
        .select("id, license_name, license_issuer, issue_date, expiration_date, does_not_expire, description")
        .eq("user_id", userId),
      supabase
        .from("user_education")
        .select("id, school_name, degree, start_date, end_date, description")
        .eq("user_id", userId),
      supabase
        .from("user_job_experiences")
        .select("id, job_title, entity_name, occupation_type, start_date, end_date, description")
        .eq("user_id", userId),
      supabase
        .from("user_volunteer_experiences")
        .select("id, entity_name, start_date, end_date, total_hours, description")
        .eq("user_id", userId),
      supabase
        .from("user_military_service")
        .select("id, branch, start_date, end_date, rank, description, status")
        .eq("user_id", userId),
      supabase
        .from("user_organizations")
        .select("id, organization_name, position, start_date, end_date, description, parent_organization_id, is_child_organization")
        .eq("user_id", userId),
    ]);

  if (skillsRes.error) throw skillsRes.error;
  if (licensesRes.error) throw licensesRes.error;
  if (educationRes.error) throw educationRes.error;
  if (jobRes.error) throw jobRes.error;
  if (volunteerRes.error) throw volunteerRes.error;
  if (militaryRes.error) throw militaryRes.error;
  if (orgRes.error) throw orgRes.error;

  const skills: SkillState[] = (skillsRes.data ?? []).map((skill) => ({
    _id: skill.id,
    skillName: skill.skill_name,
  }));

  const licenses: LicenseState[] = (licensesRes.data ?? []).map((license) => ({
    _id: license.id,
    licenseName: license.license_name,
    licenseIssuer: license.license_issuer ?? "",
    issueDate: license.issue_date ?? undefined,
    expirationDate: license.expiration_date ?? undefined,
    doesNotExpire: license.does_not_expire ?? false,
    description: license.description ?? "",
  }));

  const education: EducationState[] = (educationRes.data ?? []).map((edu) => ({
    _id: edu.id,
    schoolName: edu.school_name,
    degree: edu.degree,
    startDate: edu.start_date ?? undefined,
    endDate: edu.end_date ?? undefined,
    description: edu.description ?? "",
  }));

  const jobRows = ((jobRes.data ?? []) as unknown) as Array<{
    id: string;
    job_title: string;
    entity_name: string;
    occupation_type?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    description?: string | null;
  }>;

  const jobExperiences: JobExperienceState[] = jobRows.map((job) => ({
    _id: job.id,
    jobTitle: job.job_title,
    entityName: job.entity_name,
    occupationType: job.occupation_type ?? "",
    startDate: job.start_date ?? undefined,
    endDate: job.end_date ?? undefined,
    description: job.description ?? "",
  }));

  const volunteerExperiences: VolunteerExperienceState[] = (volunteerRes.data ?? []).map(
    (volunteer) => ({
      _id: volunteer.id,
      entityName: volunteer.entity_name,
      startDate: volunteer.start_date ?? undefined,
      endDate: volunteer.end_date ?? undefined,
      totalHours: volunteer.total_hours,
      description: volunteer.description ?? "",
    })
  );

  const militaryService: MilitaryServiceState[] = (militaryRes.data ?? []).map((military) => ({
    _id: military.id,
    branch: military.branch as MilitaryBranch,
    startDate: military.start_date ?? undefined,
    endDate: military.end_date ?? undefined,
    rank: military.rank ?? "",
    description: military.description ?? "",
    status: military.status ?? "",
  }));

  const organizations: OrganizationState[] = (orgRes.data ?? []).map((org) => ({
    _id: org.id,
    organizationName: org.organization_name,
    position: org.position,
    startDate: org.start_date ?? undefined,
    endDate: org.end_date ?? undefined,
    description: org.description ?? "",
    parentOrganization: org.parent_organization_id
      ? ({ id: org.parent_organization_id, organizationName: "" } as SimpleOrganizationInfo)
      : undefined,
    isChildOrganization: org.is_child_organization,
  }));

  const [friendsRes, followersRes, followingRes] = await Promise.all([
    supabase.rpc("get_user_friends", { target_user_id: userId }),
    supabase.from("follows").select("follower_id").eq("following_id", userId),
    supabase.from("follows").select("following_id").eq("follower_id", userId),
  ]);

  if (friendsRes.error) throw friendsRes.error;
  if (followersRes.error) throw followersRes.error;
  if (followingRes.error) throw followingRes.error;

  const { data: friendsData } = friendsRes;
  const { data: followersData } = followersRes;
  const { data: followingData } = followingRes;

  const friendProfiles = await getProfilesByIds((friendsData ?? []).map((row) => row.friend_id));
  const followerProfiles = await getProfilesByIds(
    (followersData ?? []).map((row) => row.follower_id)
  );
  const followingProfiles = await getProfilesByIds(
    (followingData ?? []).map((row) => row.following_id)
  );

  let entityDetails: DarbeProfileSharedState["entityDetails"] | undefined;
  if (profile.user_type !== "individual") {
    const [donorsRes, staffRes, docsRes] = await Promise.all([
      supabase.from("entity_donors").select("user_id").eq("entity_id", userId),
      supabase.from("entity_staff").select("user_id").eq("entity_id", userId),
      supabase
        .from("documents")
        .select("id, url, document_category, file_name, file_type, uploaded_at")
        .eq("user_id", userId),
    ]);

    if (donorsRes.error) throw donorsRes.error;
    if (staffRes.error) throw staffRes.error;
    if (docsRes.error) throw docsRes.error;

    const donorProfiles = await getProfilesByIds(
      (donorsRes.data ?? []).map((row) => row.user_id)
    );
    const staffProfiles = await getProfilesByIds(
      (staffRes.data ?? []).map((row) => row.user_id)
    );

    const simpleEntityUser = mapProfileToSimpleUserInfo(profile);

    const documents: EntityDocument[] = (docsRes.data ?? []).map((doc) => ({
      id: doc.id,
      documentCategory: doc.document_category,
      url: doc.url,
      fileName: doc.file_name,
      fileType: doc.file_type,
      uploadedAt: doc.uploaded_at,
      user: simpleEntityUser,
    }));

    entityDetails = {
      donorList: donorProfiles.map(mapProfileToSimpleUserState),
      staffList: staffProfiles.map(mapProfileToSimpleUserState),
      documents,
    };
  }

  return {
    ...base,
    skills,
    licenses,
    education,
    jobExperiences,
    volunteerExperiences,
    militaryService,
    organizations,
    friends: friendProfiles.map(mapProfileToFriend),
    followers: followerProfiles.map(mapProfileToFollow),
    following: followingProfiles.map(mapProfileToFollow),
    entityDetails,
  };
};
