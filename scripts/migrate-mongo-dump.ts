import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/services/supabase/database.types";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

type BsonValue = Record<string, unknown> | string | number | boolean | null | undefined;

type OidLike = { $oid?: string };
type NumberLike = { $numberLong?: string; $numberInt?: string; $numberDouble?: string };
type DateLike = { $date?: NumberLike | string | number };

type UserDoc = {
  _id: OidLike;
  email?: string;
  password?: string;
  city?: string;
  zip?: string;
  dob?: { day?: string; month?: string; year?: string };
  causes?: string[];
  availability?: Record<string, { start?: string; end?: string; open?: boolean }>;
  firstName?: string;
  lastName?: string;
  nonprofitName?: string;
  organizationName?: string;
  ein?: string;
  coverPhoto?: string | null;
  profilePicture?: string | null;
  createdAt?: DateLike;
  updatedAt?: DateLike;
};

const DAY_ORDER = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

const DEFAULT_DUMP_DIR = "/Users/jasonrodgers/Downloads/darbe";
const DEFAULT_OUTPUT_DIR = "supabase/migration_output";
const BATCH_SIZE = 500;

const args = process.argv.slice(2);
const getArgValue = (flag: string) => {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  return args[index + 1] ?? null;
};
const hasFlag = (flag: string) => args.includes(flag);

const dumpDir = resolve(getArgValue("--dump-dir") ?? process.env.MONGO_DUMP_DIR ?? DEFAULT_DUMP_DIR);
const outputDir = resolve(getArgValue("--output-dir") ?? DEFAULT_OUTPUT_DIR);
const apply = hasFlag("--apply");
const dryRun = !apply;

const supabaseUrl =
  process.env.SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "";
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SERVICE_ROLE_KEY ??
  "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in env.");
  console.error("Set them before running this script.");
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const existingAuthUsersByEmail = new Map<string, string>();

const loadExistingAuthUsers = async () => {
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }
    for (const user of data.users) {
      if (user.email) {
        existingAuthUsersByEmail.set(user.email.toLowerCase(), user.id);
      }
    }
    if (!data.nextPage) {
      break;
    }
    page = data.nextPage;
  }
};

const readBson = <T>(filePath: string): T[] => {
  const output = execFileSync("bsondump", ["--quiet", filePath], { encoding: "utf8" });
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
};

const toOid = (value: BsonValue): string | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const oid = (value as OidLike).$oid;
  return oid ?? null;
};

const toNumber = (value: BsonValue): number | null => {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === "object") {
    const numberLike = value as NumberLike;
    if (numberLike.$numberLong != null) return Number(numberLike.$numberLong);
    if (numberLike.$numberInt != null) return Number(numberLike.$numberInt);
    if (numberLike.$numberDouble != null) return Number(numberLike.$numberDouble);
    const dateLike = value as DateLike;
    if (dateLike.$date != null) return toNumber(dateLike.$date as BsonValue);
  }
  return null;
};

const toDateTime = (value: BsonValue): string | null => {
  if (value == null) return null;
  const numeric = toNumber(value);
  if (numeric != null && Number.isFinite(numeric)) {
    const date = new Date(numeric);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  if (typeof value === "object") {
    const dateLike = value as DateLike;
    if (dateLike.$date) {
      return toDateTime(dateLike.$date as BsonValue);
    }
  }
  return null;
};

const toDateOnly = (value: BsonValue): string | null => {
  const dateTime = toDateTime(value);
  return dateTime ? dateTime.slice(0, 10) : null;
};

const parseDob = (dob?: UserDoc["dob"]): string | null => {
  if (!dob?.year || !dob.month || !dob.day) return null;
  const monthMap: Record<string, number> = {
    Jan: 1,
    Feb: 2,
    Mar: 3,
    Apr: 4,
    May: 5,
    Jun: 6,
    Jul: 7,
    Aug: 8,
    Sep: 9,
    Oct: 10,
    Nov: 11,
    Dec: 12,
  };
  const month = monthMap[dob.month] ?? Number(dob.month);
  const day = Number(dob.day);
  const year = Number(dob.year);
  if (!Number.isFinite(month) || !Number.isFinite(day) || !Number.isFinite(year)) {
    return null;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

const parseTime = (value: BsonValue): string | null => {
  const numeric = toNumber(value);
  if (numeric == null || !Number.isFinite(numeric)) {
    return null;
  }
  const hours = Math.floor(numeric);
  const minutes = Math.round((numeric - hours) * 60);
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return `${hh}:${mm}:00`;
};

const parseEventDate = (value: BsonValue): string | null => {
  const numeric = toNumber(value);
  if (numeric != null && Number.isFinite(numeric)) {
    const asString = String(Math.trunc(numeric));
    if (asString.length === 8 && numeric < 100000000) {
      const month = Number(asString.slice(0, 2));
      const day = Number(asString.slice(2, 4));
      const year = Number(asString.slice(4, 8));
      const date = new Date(Date.UTC(year, month - 1, day));
      return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
    }
    const date = new Date(numeric);
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  }
  if (typeof value === "object") {
    const dateLike = value as DateLike;
    if (dateLike.$date) {
      return parseEventDate(dateLike.$date as BsonValue);
    }
  }
  return null;
};

const normalizeName = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.toLowerCase() : null;
};

const chunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const insertRows = async <T>(
  table: keyof Database["public"]["Tables"],
  rows: T[],
  options: { upsert?: boolean; onConflict?: string } = {}
) => {
  if (!rows.length) return;
  const batches = chunk(rows, BATCH_SIZE);
  for (const batch of batches) {
    if (dryRun) {
      console.log(`[dry-run] ${options.upsert ? "upsert" : "insert"} ${batch.length} -> ${table}`);
      continue;
    }
    const query = supabase.from(table);
    const { error } = options.upsert
      ? await query.upsert(batch as never[], { onConflict: options.onConflict })
      : await query.insert(batch as never[]);
    if (error) throw error;
  }
};

const randomPassword = (): string => {
  const rand = Math.random().toString(36).slice(2);
  return `Temp!${rand}A1`;
};

const writeJson = (name: string, data: unknown) => {
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, name), JSON.stringify(data, null, 2));
};

const main = async () => {
  console.log(`Dump dir: ${dumpDir}`);
  console.log(`Output dir: ${outputDir}`);
  console.log(`Mode: ${dryRun ? "dry-run" : "apply"}`);

  if (!dryRun) {
    await loadExistingAuthUsers();
  }

  const users = readBson<UserDoc>(join(dumpDir, "users.bson"));
  const userDetails = readBson<Record<string, unknown>>(join(dumpDir, "userdetails.bson"));
  const causes = readBson<Record<string, unknown>>(join(dumpDir, "causes.bson"));
  const events = readBson<Record<string, unknown>>(join(dumpDir, "events.bson"));
  const eventSignups = readBson<Record<string, unknown>>(join(dumpDir, "eventsignups.bson"));
  const posts = readBson<Record<string, unknown>>(join(dumpDir, "posts.bson"));
  const comments = readBson<Record<string, unknown>>(join(dumpDir, "comments.bson"));
  const messageThreads = readBson<Record<string, unknown>>(join(dumpDir, "messagethreads.bson"));
  const messages = readBson<Record<string, unknown>>(join(dumpDir, "messages.bson"));
  const documents = readBson<Record<string, unknown>>(join(dumpDir, "documents.bson"));
  const entityDetails = readBson<Record<string, unknown>>(join(dumpDir, "entitydetails.bson"));
  const rosters = readBson<Record<string, unknown>>(join(dumpDir, "rosters.bson"));
  const friends = readBson<Record<string, unknown>>(join(dumpDir, "friends.bson"));
  const followers = readBson<Record<string, unknown>>(join(dumpDir, "followers.bson"));
  const requests = readBson<Record<string, unknown>>(join(dumpDir, "requests.bson"));
  const impacts = readBson<Record<string, unknown>>(join(dumpDir, "impacts.bson"));
  const notifications = readBson<Record<string, unknown>>(join(dumpDir, "notifications.bson"));

  // Causes
  const causeByNameRows = new Map<string, Database["public"]["Tables"]["causes"]["Insert"]>();
  for (const cause of causes) {
    const name = (cause.name as string) ?? "";
    if (!name) continue;
    causeByNameRows.set(name, {
      name,
      description: (cause.description as string) ?? "",
      active: Boolean(cause.active ?? true),
      created_at: toDateTime(cause.createdAt as BsonValue) ?? undefined,
    });
  }
  const causeRows = Array.from(causeByNameRows.values());
  await insertRows("causes", causeRows, { upsert: true, onConflict: "name" });
  const { data: causeData, error: causeError } = await supabase
    .from("causes")
    .select("id,name");
  if (causeError) throw causeError;
  const causeByName = new Map(causeData.map((row) => [row.name, row.id]));

  const userIdMap = new Map<string, string>();
  const emailToSupabaseId = new Map<string, string>();
  const uniqueUsers: UserDoc[] = [];

  // Auth users + profiles
  const profileRows: Database["public"]["Tables"]["profiles"]["Insert"][] = [];
  for (const user of users) {
    const mongoId = toOid(user._id);
    if (!mongoId || !user.email) {
      continue;
    }

    const normalizedEmail = user.email.toLowerCase();
    const existingForEmail = emailToSupabaseId.get(normalizedEmail);
    if (existingForEmail) {
      userIdMap.set(mongoId, existingForEmail);
      continue;
    }

    let supabaseUserId = randomUUID();
    if (!dryRun) {
      const existingId = existingAuthUsersByEmail.get(normalizedEmail);
      if (existingId) {
        supabaseUserId = existingId;
      } else {
        const { data, error } = await supabase.auth.admin.createUser({
          email: user.email,
          password: randomPassword(),
          email_confirm: true,
        });
        if (error?.code === "email_exists") {
          const existingIdFromCache = existingAuthUsersByEmail.get(normalizedEmail);
          if (existingIdFromCache) {
            supabaseUserId = existingIdFromCache;
          } else {
            await loadExistingAuthUsers();
            const refreshedId = existingAuthUsersByEmail.get(normalizedEmail);
            if (!refreshedId) {
              throw new Error(`Email exists but user not found for ${user.email}`);
            }
            supabaseUserId = refreshedId;
          }
        } else if (error || !data.user) {
          throw error ?? new Error(`Failed to create auth user for ${user.email}`);
        } else {
          supabaseUserId = data.user.id;
          existingAuthUsersByEmail.set(normalizedEmail, supabaseUserId);
        }
      }
    }

    userIdMap.set(mongoId, supabaseUserId);
    emailToSupabaseId.set(normalizedEmail, supabaseUserId);
    uniqueUsers.push(user);

    const userType = user.nonprofitName
      ? "nonprofit"
      : user.organizationName
      ? "organization"
      : "individual";

    profileRows.push({
      id: supabaseUserId,
      user_type: userType,
      email: user.email,
      first_name: user.firstName ?? null,
      last_name: user.lastName ?? null,
      organization_name: user.organizationName ?? null,
      nonprofit_name: user.nonprofitName ?? null,
      ein: user.ein ?? null,
      city: user.city ?? "",
      zip: user.zip ?? "",
      date_of_birth: parseDob(user.dob),
      profile_picture_url: user.profilePicture ?? null,
      cover_photo_url: user.coverPhoto ?? null,
      created_at: toDateTime(user.createdAt as BsonValue) ?? undefined,
      updated_at: toDateTime(user.updatedAt as BsonValue) ?? undefined,
    });
  }
  await insertRows("profiles", profileRows, { upsert: true, onConflict: "id" });

  // user_details + resume-like tables
  const detailsRows: Database["public"]["Tables"]["user_details"]["Insert"][] = [];
  const skillsRows: Database["public"]["Tables"]["user_skills"]["Insert"][] = [];
  const licenseRows: Database["public"]["Tables"]["user_licenses"]["Insert"][] = [];
  const educationRows: Database["public"]["Tables"]["user_education"]["Insert"][] = [];
  const jobRows: Database["public"]["Tables"]["user_job_experiences"]["Insert"][] = [];
  const volunteerRows: Database["public"]["Tables"]["user_volunteer_experiences"]["Insert"][] = [];
  const militaryRows: Database["public"]["Tables"]["user_military_service"]["Insert"][] = [];
  const orgRows: Database["public"]["Tables"]["user_organizations"]["Insert"][] = [];

  const detailsByUser = new Map<string, Database["public"]["Tables"]["user_details"]["Insert"]>();
  for (const detail of userDetails) {
    const userId = toOid(detail.userId as BsonValue) ?? toOid(detail.user as BsonValue);
    if (!userId) continue;
    const supabaseUserId = userIdMap.get(userId);
    if (!supabaseUserId) continue;

    const emergency = detail.emergencyContact as Record<string, unknown> | undefined;
    detailsByUser.set(supabaseUserId, {
      user_id: supabaseUserId,
      about_me: (detail.aboutMe as string) ?? null,
      volunteer_reason: (detail.volunteerReason as string) ?? null,
      tag_line: (detail.tagLine as string) ?? null,
      gender: (detail.gender as string) ?? null,
      race: (detail.race as string) ?? null,
      phone_number: (detail.phoneNumber as string) ?? null,
      allergies: (detail.allergies as string) ?? null,
      address: (detail.address as string) ?? null,
      state: (detail.state as string) ?? null,
      nonprofit_type: (detail.nonprofitType as string) ?? null,
      website: (detail.website as string) ?? null,
      motto: (detail.motto as string) ?? null,
      mission: (detail.mission as string) ?? null,
      values: (detail.values as string) ?? null,
      about_us: (detail.aboutUs as string) ?? null,
      programs: (detail.programs as string) ?? null,
      emergency_contact_name: (emergency?.name as string) ?? null,
      emergency_contact_phone: (emergency?.phone as string) ?? null,
      emergency_contact_relation: (emergency?.relation as string) ?? null,
      created_at: toDateTime(detail.createdAt as BsonValue) ?? undefined,
      updated_at: toDateTime(detail.updatedAt as BsonValue) ?? undefined,
    });

    const skills = (detail.skills as Array<Record<string, unknown>>) ?? [];
    for (const skill of skills) {
      const name = skill.skillName as string | undefined;
      if (!name) continue;
      skillsRows.push({
        id: randomUUID(),
        user_id: supabaseUserId,
        skill_name: name,
      });
    }

    const licenses = (detail.licenses as Array<Record<string, unknown>>) ?? [];
    for (const license of licenses) {
      const name = license.licenseName as string | undefined;
      if (!name) continue;
      licenseRows.push({
        id: randomUUID(),
        user_id: supabaseUserId,
        license_name: name,
        license_issuer: (license.licenseIssuer as string) ?? null,
        issue_date: toDateOnly(license.issueDate as BsonValue),
        expiration_date: toDateOnly(license.expirationDate as BsonValue),
        does_not_expire: Boolean(license.doesNotExpire ?? false),
        description: (license.description as string) ?? null,
      });
    }

    const education = (detail.education as Array<Record<string, unknown>>) ?? [];
    for (const entry of education) {
      const school = entry.schoolName as string | undefined;
      const degree = entry.degree as string | undefined;
      const startDate = toDateOnly(entry.startDate as BsonValue);
      if (!school || !degree || !startDate) {
        continue;
      }
      educationRows.push({
        id: randomUUID(),
        user_id: supabaseUserId,
        school_name: school,
        degree,
        start_date: startDate,
        end_date: toDateOnly(entry.endDate as BsonValue),
        description: (entry.description as string) ?? null,
      });
    }

    const jobs = (detail.jobExperiences as Array<Record<string, unknown>>) ?? [];
    for (const job of jobs) {
      const title = job.jobTitle as string | undefined;
      const entity = job.entityName as string | undefined;
      const startDate = toDateOnly(job.startDate as BsonValue);
      if (!title || !entity || !startDate) {
        continue;
      }
      jobRows.push({
        id: randomUUID(),
        user_id: supabaseUserId,
        job_title: title,
        entity_name: entity,
        start_date: startDate,
        end_date: toDateOnly(job.endDate as BsonValue),
        description: (job.description as string) ?? null,
      });
    }

    const volunteers = (detail.volunteerExperiences as Array<Record<string, unknown>>) ?? [];
    for (const volunteer of volunteers) {
      const entity = volunteer.entityName as string | undefined;
      const startDate = toDateOnly(volunteer.startDate as BsonValue);
      const totalHours = toNumber(volunteer.totalHours as BsonValue);
      if (!entity || !startDate || totalHours == null) {
        continue;
      }
      volunteerRows.push({
        id: randomUUID(),
        user_id: supabaseUserId,
        entity_name: entity,
        start_date: startDate,
        end_date: toDateOnly(volunteer.endDate as BsonValue),
        total_hours: totalHours,
        description: (volunteer.description as string) ?? null,
      });
    }

    const military = (detail.militaryService as Array<Record<string, unknown>>) ?? [];
    for (const service of military) {
      const branch = service.branch as string | undefined;
      const startDate = toDateOnly(service.startDate as BsonValue);
      if (!branch || !startDate) {
        continue;
      }
      militaryRows.push({
        id: randomUUID(),
        user_id: supabaseUserId,
        branch,
        start_date: startDate,
        end_date: toDateOnly(service.endDate as BsonValue),
        rank: (service.rank as string) ?? null,
        description: (service.description as string) ?? null,
        status: (service.status as string) ?? null,
      });
    }

    const organizations = (detail.organizations as Array<Record<string, unknown>>) ?? [];
    for (const org of organizations) {
      const name = org.organizationName as string | undefined;
      const position = org.position as string | undefined;
      const startDate = toDateOnly(org.startDate as BsonValue);
      if (!name || !position || !startDate) {
        continue;
      }
      orgRows.push({
        id: randomUUID(),
        user_id: supabaseUserId,
        organization_name: name,
        position,
        start_date: startDate,
        end_date: toDateOnly(org.endDate as BsonValue),
        description: (org.description as string) ?? null,
        parent_organization_id: null,
        is_child_organization: false,
      });
    }
  }

  detailsRows.push(...detailsByUser.values());
  await insertRows("user_details", detailsRows, { upsert: true, onConflict: "user_id" });
  await insertRows("user_skills", skillsRows);
  await insertRows("user_licenses", licenseRows);
  await insertRows("user_education", educationRows);
  await insertRows("user_job_experiences", jobRows);
  await insertRows("user_volunteer_experiences", volunteerRows);
  await insertRows("user_military_service", militaryRows);
  await insertRows("user_organizations", orgRows);

  // user availability + causes
  const availabilityRows: Database["public"]["Tables"]["user_availability"]["Insert"][] = [];
  const userCauseRows: Database["public"]["Tables"]["user_causes"]["Insert"][] = [];

  const availabilityByKey = new Map<string, Database["public"]["Tables"]["user_availability"]["Insert"]>();
  const userCauseKey = new Set<string>();
  for (const user of uniqueUsers) {
    const mongoId = toOid(user._id);
    if (!mongoId) continue;
    const supabaseUserId = userIdMap.get(mongoId);
    if (!supabaseUserId) continue;

    const availability = user.availability ?? {};
    DAY_ORDER.forEach((day, index) => {
      const slot = availability[day];
      const row = {
        user_id: supabaseUserId,
        day_of_week: index,
        start_time: parseTime(slot?.start as BsonValue),
        end_time: parseTime(slot?.end as BsonValue),
        is_open: Boolean(slot?.open ?? false),
      };
      availabilityByKey.set(`${supabaseUserId}|${index}`, row);
    });

    const userCauses = user.causes ?? [];
    for (const causeName of userCauses) {
      const causeId = causeByName.get(causeName);
      if (!causeId) continue;
      const key = `${supabaseUserId}|${causeId}`;
      if (userCauseKey.has(key)) continue;
      userCauseKey.add(key);
      userCauseRows.push({ user_id: supabaseUserId, cause_id: causeId });
    }
  }

  availabilityRows.push(...availabilityByKey.values());
  await insertRows("user_availability", availabilityRows, { upsert: true, onConflict: "user_id,day_of_week" });
  await insertRows("user_causes", userCauseRows, { upsert: true, onConflict: "user_id,cause_id" });

  // entity details + staff/donors
  const entityDetailsRows: Database["public"]["Tables"]["entity_details"]["Insert"][] = [];
  const entityStaffRows: Database["public"]["Tables"]["entity_staff"]["Insert"][] = [];
  const entityDonorRows: Database["public"]["Tables"]["entity_donors"]["Insert"][] = [];

  for (const detail of entityDetails) {
    const entityId = toOid(detail.user as BsonValue);
    if (!entityId) continue;
    const supabaseEntityId = userIdMap.get(entityId);
    if (!supabaseEntityId) continue;

    entityDetailsRows.push({
      user_id: supabaseEntityId,
      created_at: toDateTime(detail.createdAt as BsonValue) ?? undefined,
      updated_at: toDateTime(detail.updatedAt as BsonValue) ?? undefined,
    });

    const staffList = (detail.staffList as Array<OidLike>) ?? [];
    for (const staff of staffList) {
      const staffId = toOid(staff as BsonValue);
      if (!staffId) continue;
      const supabaseStaffId = userIdMap.get(staffId);
      if (!supabaseStaffId) continue;
      entityStaffRows.push({
        entity_id: supabaseEntityId,
        user_id: supabaseStaffId,
      });
    }

    const donorList = (detail.donorList as Array<OidLike>) ?? [];
    for (const donor of donorList) {
      const donorId = toOid(donor as BsonValue);
      if (!donorId) continue;
      const supabaseDonorId = userIdMap.get(donorId);
      if (!supabaseDonorId) continue;
      entityDonorRows.push({
        entity_id: supabaseEntityId,
        user_id: supabaseDonorId,
      });
    }
  }

  await insertRows("entity_details", entityDetailsRows, { upsert: true, onConflict: "user_id" });
  await insertRows("entity_staff", entityStaffRows, { upsert: true, onConflict: "entity_id,user_id" });
  await insertRows("entity_donors", entityDonorRows, { upsert: true, onConflict: "entity_id,user_id" });

  // rosters + roster members
  const rosterIdMap = new Map<string, string>();
  const rosterRows: Database["public"]["Tables"]["rosters"]["Insert"][] = [];
  const rosterMemberRows: Database["public"]["Tables"]["roster_members"]["Insert"][] = [];

  for (const roster of rosters) {
    const mongoRosterId = toOid(roster._id as BsonValue);
    const ownerId = toOid(roster.rosterOwner as BsonValue);
    if (!mongoRosterId || !ownerId) continue;
    const supabaseOwnerId = userIdMap.get(ownerId);
    if (!supabaseOwnerId) continue;
    const newRosterId = randomUUID();
    rosterIdMap.set(mongoRosterId, newRosterId);
    rosterRows.push({
      id: newRosterId,
      roster_owner_id: supabaseOwnerId,
      roster_name: (roster.rosterName as string) ?? "Default Roster",
      created_at: toDateTime(roster.createdAt as BsonValue) ?? undefined,
      updated_at: toDateTime(roster.updatedAt as BsonValue) ?? undefined,
    });

    const members = (roster.members as Array<Record<string, unknown>>) ?? [];
    for (const member of members) {
      const memberId = toOid(member.user as BsonValue);
      if (!memberId) continue;
      const supabaseMemberId = userIdMap.get(memberId);
      if (!supabaseMemberId) continue;
      rosterMemberRows.push({
        roster_id: newRosterId,
        user_id: supabaseMemberId,
        is_admin: Boolean(member.isAdmin ?? false),
        created_at: toDateTime(roster.updatedAt as BsonValue) ?? undefined,
      });
    }
  }

  await insertRows("rosters", rosterRows);
  await insertRows("roster_members", rosterMemberRows);

  // events + related tables
  const eventIdMap = new Map<string, string>();
  const eventRows: Database["public"]["Tables"]["events"]["Insert"][] = [];
  const eventAddressRows: Database["public"]["Tables"]["event_addresses"]["Insert"][] = [];
  const eventRequirementRows: Database["public"]["Tables"]["event_requirements"]["Insert"][] = [];
  const eventImpactRows: Database["public"]["Tables"]["event_volunteer_impacts"]["Insert"][] = [];

  for (const event of events) {
    const mongoEventId = toOid(event._id as BsonValue);
    const ownerId = toOid(event.eventOwner as BsonValue);
    const coordinatorId = toOid(event.eventCoordinator as BsonValue);
    if (!mongoEventId || !ownerId || !coordinatorId) continue;
    const supabaseOwnerId = userIdMap.get(ownerId);
    const supabaseCoordinatorId = userIdMap.get(coordinatorId);
    if (!supabaseOwnerId || !supabaseCoordinatorId) continue;

    const newEventId = randomUUID();
    eventIdMap.set(mongoEventId, newEventId);

    eventRows.push({
      id: newEventId,
      event_owner_id: supabaseOwnerId,
      event_name: (event.eventName as string) ?? "",
      event_description: (event.eventDescription as string) ?? null,
      event_date: parseEventDate(event.eventDate as BsonValue) ?? "1970-01-01",
      start_time: parseTime(event.startTime as BsonValue),
      end_time: parseTime(event.endTime as BsonValue),
      is_repeating: Boolean(event.isRepeating ?? false),
      is_followers_only: Boolean(event.isFollowersOnly ?? false),
      event_parking_info: (event.eventParkingInfo as string) ?? null,
      event_internal_location: (event.eventInternalLocation as string) ?? null,
      is_indoor: Boolean(event.isIndoor ?? false),
      is_outdoor: Boolean(event.isOutdoor ?? false),
      max_volunteer_count: toNumber(event.maxVolunteerCount as BsonValue) ?? 0,
      event_cover_photo_url: (event.eventCoverPhoto as string) ?? null,
      event_coordinator_id: supabaseCoordinatorId,
      adult_waiver_url: (event.adultWaiver as string) ?? null,
      minor_waiver_url: (event.minorWaiver as string) ?? null,
      created_at: toDateTime(event.createdAt as BsonValue) ?? undefined,
      updated_at: toDateTime(event.updatedAt as BsonValue) ?? undefined,
    });

    const address = event.eventAddress as Record<string, unknown> | undefined;
    if (address) {
      eventAddressRows.push({
        event_id: newEventId,
        location_name: (address.locationName as string) ?? null,
        street_name: (address.streetName as string) ?? null,
        city: (address.city as string) ?? null,
        zip_code: (address.zipCode as string) ?? null,
      });
    }

    const requirements = event.eventRequirements as Record<string, unknown> | undefined;
    if (requirements) {
      eventRequirementRows.push({
        event_id: newEventId,
        supplies: (requirements.supplies as string) ?? null,
        age_restrictions: (requirements.ageRestrictions as string) ?? null,
        attire: (requirements.attire as string) ?? null,
        lift_requirements: (requirements.liftRequirements as string) ?? null,
      });
    }

    const impact = event.volunteerImpact as Record<string, unknown> | undefined;
    if (impact) {
      eventImpactRows.push({
        event_id: newEventId,
        individual_impact:
          (impact.individualImpact as string) ??
          (impact.invidualImpact as string) ??
          null,
        individual_impact_per_hour: (impact.individualImpactPerHour as string) ?? null,
        group_impact: (impact.groupImpact as string) ?? null,
        group_impact_per_hour: (impact.groupImpactPerHour as string) ?? null,
        is_individual_impact: Boolean(impact.isIndividualImpact ?? false),
        is_group_impact: Boolean(impact.isGroupImpact ?? false),
      });
    }
  }

  await insertRows("events", eventRows);
  await insertRows("event_addresses", eventAddressRows);
  await insertRows("event_requirements", eventRequirementRows);
  await insertRows("event_volunteer_impacts", eventImpactRows);

  // event signups
  const eventSignupRows: Database["public"]["Tables"]["event_signups"]["Insert"][] = [];
  for (const signup of eventSignups) {
    const eventId = toOid(signup.event as BsonValue);
    const userId = toOid(signup.user as BsonValue);
    if (!eventId || !userId) continue;
    const supabaseEventId = eventIdMap.get(eventId);
    const supabaseUserId = userIdMap.get(userId);
    if (!supabaseEventId || !supabaseUserId) continue;
    eventSignupRows.push({
      id: randomUUID(),
      event_id: supabaseEventId,
      user_id: supabaseUserId,
      status: (signup.status as string) ?? "volunteered",
      event_action_timestamp: toDateTime(signup.eventActionTimestamp as BsonValue) ?? undefined,
      created_at: toDateTime(signup.createdAt as BsonValue) ?? undefined,
    });
  }
  await insertRows("event_signups", eventSignupRows);

  // posts + post_files + post_likes
  const postIdMap = new Map<string, string>();
  const postRows: Database["public"]["Tables"]["posts"]["Insert"][] = [];
  const postFileRows: Database["public"]["Tables"]["post_files"]["Insert"][] = [];
  const postLikeRows: Database["public"]["Tables"]["post_likes"]["Insert"][] = [];

  for (const post of posts) {
    const mongoPostId = toOid(post._id as BsonValue);
    const posterId = toOid(post.posterId as BsonValue);
    if (!mongoPostId || !posterId) continue;
    const supabasePosterId = userIdMap.get(posterId);
    if (!supabasePosterId) continue;
    const newPostId = randomUUID();
    postIdMap.set(mongoPostId, newPostId);
    postRows.push({
      id: newPostId,
      poster_id: supabasePosterId,
      post_text: (post.postText as string) ?? "",
      created_at: toDateTime(post.createdAt as BsonValue) ?? undefined,
      updated_at: toDateTime(post.updatedAt as BsonValue) ?? undefined,
    });

    const files = (post.files as string[]) ?? [];
    for (const fileUrl of files) {
      postFileRows.push({
        id: randomUUID(),
        post_id: newPostId,
        file_url: fileUrl,
      });
    }

    const likes = (post.likes as Array<OidLike>) ?? [];
    for (const like of likes) {
      const likerId = toOid(like as BsonValue);
      if (!likerId) continue;
      const supabaseLikerId = userIdMap.get(likerId);
      if (!supabaseLikerId) continue;
      postLikeRows.push({
        post_id: newPostId,
        user_id: supabaseLikerId,
        created_at: toDateTime(post.updatedAt as BsonValue) ?? undefined,
      });
    }
  }

  await insertRows("posts", postRows);
  await insertRows("post_files", postFileRows);
  await insertRows("post_likes", postLikeRows);

  // comments + comment_likes
  const commentIdMap = new Map<string, string>();
  const replyParentMap = new Map<string, string>();

  for (const comment of comments) {
    const parentId = toOid(comment._id as BsonValue);
    if (!parentId) continue;
    const replies = (comment.replies as Array<OidLike>) ?? [];
    for (const reply of replies) {
      const replyId = toOid(reply as BsonValue);
      if (replyId) {
        replyParentMap.set(replyId, parentId);
      }
    }
  }

  for (const comment of comments) {
    const mongoId = toOid(comment._id as BsonValue);
    if (!mongoId) continue;
    commentIdMap.set(mongoId, randomUUID());
  }

  const commentRows: Database["public"]["Tables"]["comments"]["Insert"][] = [];
  const commentLikeRows: Database["public"]["Tables"]["comment_likes"]["Insert"][] = [];

  const commentById = new Map<string, Record<string, unknown>>();
  comments.forEach((comment) => {
    const mongoId = toOid(comment._id as BsonValue);
    if (mongoId) {
      commentById.set(mongoId, comment);
    }
  });

  const commentDocs = comments as Array<Record<string, unknown>>;
  const rootComments: Record<string, unknown>[] = [];
  const replyComments: Record<string, unknown>[] = [];
  for (const comment of commentDocs) {
    const mongoId = toOid(comment._id as BsonValue);
    if (!mongoId) continue;
    if (replyParentMap.has(mongoId)) {
      replyComments.push(comment);
    } else {
      rootComments.push(comment);
    }
  }

  const buildCommentRow = (comment: Record<string, unknown>) => {
    const mongoId = toOid(comment._id as BsonValue);
    if (!mongoId) return;
    const newId = commentIdMap.get(mongoId);
    if (!newId) return;
    const userId = toOid(comment.userId as BsonValue);
    if (!userId) return;
    const supabaseUserId = userIdMap.get(userId);
    if (!supabaseUserId) return;

    let postId = toOid(comment.postId as BsonValue);
    if (!postId) {
      const parentId = replyParentMap.get(mongoId);
      if (parentId) {
        const parentDoc = commentById.get(parentId);
        postId = parentDoc ? toOid(parentDoc.postId as BsonValue) : null;
      }
    }

    if (!postId) return;
    const supabasePostId = postIdMap.get(postId);
    if (!supabasePostId) return;

    const parentMongoId = replyParentMap.get(mongoId);
    const parentCommentId = parentMongoId ? commentIdMap.get(parentMongoId) : null;

    commentRows.push({
      id: newId,
      post_id: supabasePostId,
      user_id: supabaseUserId,
      comment_text: (comment.commentText as string) ?? "",
      parent_comment_id: parentCommentId ?? null,
      created_at: toDateTime(comment.createdAt as BsonValue) ?? undefined,
      updated_at: toDateTime(comment.updatedAt as BsonValue) ?? undefined,
    });

    const likes = (comment.commentLikes as Array<OidLike>) ?? [];
    for (const like of likes) {
      const likerId = toOid(like as BsonValue);
      if (!likerId) continue;
      const supabaseLikerId = userIdMap.get(likerId);
      if (!supabaseLikerId) continue;
      commentLikeRows.push({
        comment_id: newId,
        user_id: supabaseLikerId,
        created_at: toDateTime(comment.updatedAt as BsonValue) ?? undefined,
      });
    }
  };

  rootComments.forEach(buildCommentRow);
  replyComments.forEach(buildCommentRow);

  await insertRows("comments", commentRows);
  await insertRows("comment_likes", commentLikeRows);

  // message threads + participants + messages
  const threadIdMap = new Map<string, string>();
  const messageIdMap = new Map<string, string>();
  const messageThreadMap = new Map<string, string>();

  const threadRows: Database["public"]["Tables"]["message_threads"]["Insert"][] = [];
  const threadParticipantRows: Database["public"]["Tables"]["message_thread_participants"]["Insert"][] = [];

  for (const thread of messageThreads) {
    const mongoThreadId = toOid(thread._id as BsonValue);
    if (!mongoThreadId) continue;
    const newThreadId = randomUUID();
    threadIdMap.set(mongoThreadId, newThreadId);
    threadRows.push({
      id: newThreadId,
      created_at: toDateTime(thread.createdAt as BsonValue) ?? undefined,
    });

    const participants = (thread.participants as Array<OidLike>) ?? [];
    for (const participant of participants) {
      const participantId = toOid(participant as BsonValue);
      if (!participantId) continue;
      const supabaseParticipantId = userIdMap.get(participantId);
      if (!supabaseParticipantId) continue;
      threadParticipantRows.push({
        thread_id: newThreadId,
        user_id: supabaseParticipantId,
      });
    }

    const threadMessages = (thread.messages as Array<OidLike>) ?? [];
    for (const message of threadMessages) {
      const messageId = toOid(message as BsonValue);
      if (!messageId) continue;
      messageThreadMap.set(messageId, newThreadId);
    }
  }

  await insertRows("message_threads", threadRows);
  await insertRows("message_thread_participants", threadParticipantRows);

  const messageRows: Database["public"]["Tables"]["messages"]["Insert"][] = [];
  for (const message of messages) {
    const mongoMessageId = toOid(message._id as BsonValue);
    if (!mongoMessageId) continue;
    const newMessageId = randomUUID();
    messageIdMap.set(mongoMessageId, newMessageId);
    const threadId = messageThreadMap.get(mongoMessageId);
    if (!threadId) continue;

    const senderId = toOid(message.senderId as BsonValue);
    const receiverId = toOid(message.receiverId as BsonValue);
    if (!senderId || !receiverId) continue;
    const supabaseSenderId = userIdMap.get(senderId);
    const supabaseReceiverId = userIdMap.get(receiverId);
    if (!supabaseSenderId || !supabaseReceiverId) continue;

    messageRows.push({
      id: newMessageId,
      thread_id: threadId,
      sender_id: supabaseSenderId,
      receiver_id: supabaseReceiverId,
      message: (message.message as string) ?? "",
      is_read: Boolean(message.isRead ?? false),
      date_sent: toDateTime(message.dateSent as BsonValue) ?? undefined,
      created_at: toDateTime(message.createdAt as BsonValue) ?? undefined,
    });
  }

  await insertRows("messages", messageRows);

  // documents
  const documentRows: Database["public"]["Tables"]["documents"]["Insert"][] = [];
  for (const doc of documents) {
    const userId = toOid(doc.user as BsonValue);
    if (!userId) continue;
    const supabaseUserId = userIdMap.get(userId);
    if (!supabaseUserId) continue;
    documentRows.push({
      id: randomUUID(),
      user_id: supabaseUserId,
      url: (doc.url as string) ?? "",
      document_category: (doc.documentCategory as string) ?? "",
      file_name: (doc.fileName as string) ?? "",
      file_type: (doc.fileType as string) ?? "",
      uploaded_at: toDateTime(doc.uploadedAt as BsonValue) ?? undefined,
    });
  }
  await insertRows("documents", documentRows);

  // impact
  const impactRows: Database["public"]["Tables"]["impact"]["Insert"][] = [];
  const impactByOwner = new Map<string, Database["public"]["Tables"]["impact"]["Insert"]>();
  for (const impact of impacts) {
    const ownerId = toOid(impact.impactOwner as BsonValue);
    if (!ownerId) continue;
    const supabaseOwnerId = userIdMap.get(ownerId);
    if (!supabaseOwnerId) continue;
    impactByOwner.set(supabaseOwnerId, {
      id: randomUUID(),
      impact_owner_id: supabaseOwnerId,
      user_type: (impact.userType as string) ?? "individual",
      event_id: null,
      hours_volunteered: toNumber(impact.hoursVolunteered as BsonValue) ?? 0,
      events_created: toNumber(impact.eventsCreated as BsonValue) ?? 0,
      events_attended: toNumber(impact.eventsAttended as BsonValue) ?? 0,
      events_passed: toNumber(impact.eventsPassed as BsonValue) ?? 0,
      events_coordinated: toNumber(impact.eventsCoordinated as BsonValue) ?? 0,
    });
  }
  impactRows.push(...impactByOwner.values());
  await insertRows("impact", impactRows, { upsert: true, onConflict: "impact_owner_id" });

  // friend requests
  const friendRequestRows: Database["public"]["Tables"]["friend_requests"]["Insert"][] = [];
  const friendRequestKeyToId = new Map<string, string>();
  const friendRequestRowByKey = new Map<string, Database["public"]["Tables"]["friend_requests"]["Insert"]>();
  const friendRequestIdByMongoId = new Map<string, string>();
  for (const requestDoc of requests) {
    const requestList = (requestDoc.requests as Array<Record<string, unknown>>) ?? [];
    for (const request of requestList) {
      const mongoRequestId = toOid(request._id as BsonValue);
      const requesterId = toOid(request.requesterId as BsonValue);
      const receiverId = toOid(request.receiverId as BsonValue);
      if (!requesterId || !receiverId) continue;
      const supabaseRequesterId = userIdMap.get(requesterId);
      const supabaseReceiverId = userIdMap.get(receiverId);
      if (!supabaseRequesterId || !supabaseReceiverId) continue;
      const requestType = (request.requestType as string) ?? "friend";
      const key = `${supabaseRequesterId}|${supabaseReceiverId}|${requestType}`;
      let friendRequestId = friendRequestKeyToId.get(key);
      if (!friendRequestId) {
        friendRequestId = randomUUID();
        friendRequestKeyToId.set(key, friendRequestId);
        const row: Database["public"]["Tables"]["friend_requests"]["Insert"] = {
          id: friendRequestId,
          requester_id: supabaseRequesterId,
          receiver_id: supabaseReceiverId,
          request_type: requestType,
          status: (request.accepted ? "accepted" : "pending") as "accepted" | "pending",
          created_at: toDateTime(requestDoc.createdAt as BsonValue) ?? undefined,
        };
        friendRequestRows.push(row);
        friendRequestRowByKey.set(key, row);
      } else if (request.accepted) {
        const existing = friendRequestRowByKey.get(key);
        if (existing && existing.status !== "accepted") {
          existing.status = "accepted";
        }
      }
      if (mongoRequestId && friendRequestId) {
        friendRequestIdByMongoId.set(mongoRequestId, friendRequestId);
      }
    }
  }
  await insertRows("friend_requests", friendRequestRows, { upsert: true, onConflict: "requester_id,receiver_id,request_type" });

  // friendships
  const friendshipRows: Database["public"]["Tables"]["friendships"]["Insert"][] = [];
  const friendshipKeys = new Set<string>();
  for (const friendDoc of friends) {
    const userId = toOid(friendDoc.userId as BsonValue);
    if (!userId) continue;
    const supabaseUserId = userIdMap.get(userId);
    if (!supabaseUserId) continue;
    const friendsList = (friendDoc.friendsList as Array<OidLike>) ?? [];
    for (const friend of friendsList) {
      const friendId = toOid(friend as BsonValue);
      if (!friendId) continue;
      const supabaseFriendId = userIdMap.get(friendId);
      if (!supabaseFriendId) continue;
      const key = `${supabaseUserId}|${supabaseFriendId}`;
      if (friendshipKeys.has(key)) continue;
      friendshipKeys.add(key);
      friendshipRows.push({
        user_id: supabaseUserId,
        friend_id: supabaseFriendId,
        created_at: toDateTime(friendDoc.createdAt as BsonValue) ?? undefined,
      });
    }
  }
  await insertRows("friendships", friendshipRows, { upsert: true, onConflict: "user_id,friend_id" });

  // follows
  const followRows: Database["public"]["Tables"]["follows"]["Insert"][] = [];
  const followKeys = new Set<string>();
  for (const followDoc of followers) {
    const userId = toOid(followDoc.userId as BsonValue);
    if (!userId) continue;
    const supabaseUserId = userIdMap.get(userId);
    if (!supabaseUserId) continue;

    const followerList = (followDoc.followerList as Array<OidLike>) ?? [];
    for (const follower of followerList) {
      const followerId = toOid(follower as BsonValue);
      if (!followerId) continue;
      const supabaseFollowerId = userIdMap.get(followerId);
      if (!supabaseFollowerId) continue;
      if (supabaseFollowerId === supabaseUserId) continue;
      const key = `${supabaseFollowerId}|${supabaseUserId}`;
      if (followKeys.has(key)) continue;
      followKeys.add(key);
      followRows.push({
        follower_id: supabaseFollowerId,
        following_id: supabaseUserId,
        created_at: toDateTime(followDoc.createdAt as BsonValue) ?? undefined,
      });
    }

    const followingList = (followDoc.followingList as Array<OidLike>) ?? [];
    for (const following of followingList) {
      const followingId = toOid(following as BsonValue);
      if (!followingId) continue;
      const supabaseFollowingId = userIdMap.get(followingId);
      if (!supabaseFollowingId) continue;
      if (supabaseFollowingId === supabaseUserId) continue;
      const key = `${supabaseUserId}|${supabaseFollowingId}`;
      if (followKeys.has(key)) continue;
      followKeys.add(key);
      followRows.push({
        follower_id: supabaseUserId,
        following_id: supabaseFollowingId,
        created_at: toDateTime(followDoc.createdAt as BsonValue) ?? undefined,
      });
    }
  }
  await insertRows("follows", followRows, { upsert: true, onConflict: "follower_id,following_id" });

  // notifications
  const userNameToSupabaseId = new Map<string, string>();
  const userNameDuplicates = new Set<string>();
  for (const user of uniqueUsers) {
    const first = (user.firstName ?? "").trim();
    const last = (user.lastName ?? "").trim();
    const fullName = normalizeName([first, last].filter(Boolean).join(" "));
    if (!fullName) continue;
    const mongoId = toOid(user._id);
    if (!mongoId) continue;
    const supabaseId = userIdMap.get(mongoId);
    if (!supabaseId) continue;
    const existing = userNameToSupabaseId.get(fullName);
    if (existing && existing !== supabaseId) {
      userNameDuplicates.add(fullName);
      continue;
    }
    userNameToSupabaseId.set(fullName, supabaseId);
  }
  for (const duplicate of userNameDuplicates) {
    userNameToSupabaseId.delete(duplicate);
  }

  const notificationRows: Database["public"]["Tables"]["notifications"]["Insert"][] = [];
  const notificationIdMap = new Map<string, string>();
  const notificationStats = {
    total: notifications.length,
    inserted: 0,
    skipped_missing_user: 0,
    skipped_missing_sender: 0,
    skipped_missing_content: 0,
    skipped_unknown_type: 0,
  };

  for (const notification of notifications) {
    const contentType =
      (notification.contentType as string | undefined) ??
      (notification.notificationType as string | undefined);
    if (!contentType) {
      notificationStats.skipped_unknown_type += 1;
      continue;
    }

    const recipientMongoId = toOid(notification.recipientUserId as BsonValue);
    if (!recipientMongoId) {
      notificationStats.skipped_missing_user += 1;
      continue;
    }
    const recipientId = userIdMap.get(recipientMongoId);
    if (!recipientId) {
      notificationStats.skipped_missing_user += 1;
      continue;
    }

    const senderMongoId = toOid(notification.senderUserId as BsonValue);
    let senderId = senderMongoId ? userIdMap.get(senderMongoId) ?? null : null;
    if (!senderId) {
      const legacyName = normalizeName(notification.userName);
      senderId = legacyName ? userNameToSupabaseId.get(legacyName) ?? null : null;
    }
    if (!senderId) {
      notificationStats.skipped_missing_sender += 1;
      continue;
    }

    const contentMongoId =
      toOid(notification.contentTypeId as BsonValue) ??
      toOid(notification.idOfContentType as BsonValue);

    let contentId: string | undefined;
    if (contentType === "post") {
      contentId = contentMongoId ? postIdMap.get(contentMongoId) : undefined;
    } else if (contentType === "comment") {
      contentId = contentMongoId ? commentIdMap.get(contentMongoId) : undefined;
    } else if (contentType === "like") {
      if (contentMongoId) {
        contentId = postIdMap.get(contentMongoId) ?? commentIdMap.get(contentMongoId);
      }
    } else if (
      contentType === "friendRequest" ||
      contentType === "follow" ||
      contentType === "acceptedFriendRequest"
    ) {
      if (contentMongoId) {
        contentId = friendRequestIdByMongoId.get(contentMongoId);
      }
      if (!contentId) {
        const requestType = contentType === "follow" ? "follow" : "friend";
        const key = `${senderId}|${recipientId}|${requestType}`;
        contentId = friendRequestKeyToId.get(key);
      }
    } else {
      notificationStats.skipped_unknown_type += 1;
      continue;
    }

    if (!contentId) {
      notificationStats.skipped_missing_content += 1;
      continue;
    }

    const newNotificationId = randomUUID();
    const mongoNotificationId = toOid(notification._id as BsonValue);
    if (mongoNotificationId) {
      notificationIdMap.set(mongoNotificationId, newNotificationId);
    }

    notificationRows.push({
      id: newNotificationId,
      recipient_user_id: recipientId,
      sender_user_id: senderId,
      content_type: contentType,
      content_type_id: contentId,
      read: Boolean(notification.read ?? false),
      created_at:
        toDateTime(notification.createdAt as BsonValue) ??
        toDateTime(notification.date as BsonValue) ??
        undefined,
    });
    notificationStats.inserted += 1;
  }

  await insertRows("notifications", notificationRows);

  writeJson("id-map.json", {
    users: Object.fromEntries(userIdMap),
    posts: Object.fromEntries(postIdMap),
    comments: Object.fromEntries(commentIdMap),
    events: Object.fromEntries(eventIdMap),
    rosters: Object.fromEntries(rosterIdMap),
    threads: Object.fromEntries(threadIdMap),
    messages: Object.fromEntries(messageIdMap),
    friend_requests: Object.fromEntries(friendRequestIdByMongoId),
    notifications: Object.fromEntries(notificationIdMap),
  });

  console.log("Migration completed.");
  console.log(`Notifications imported: ${notificationStats.inserted}/${notificationStats.total}.`);
  if (
    notificationStats.skipped_missing_user ||
    notificationStats.skipped_missing_sender ||
    notificationStats.skipped_missing_content ||
    notificationStats.skipped_unknown_type
  ) {
    console.log(
      [
        "Notification skips:",
        `missing-user=${notificationStats.skipped_missing_user}`,
        `missing-sender=${notificationStats.skipped_missing_sender}`,
        `missing-content=${notificationStats.skipped_missing_content}`,
        `unknown-type=${notificationStats.skipped_unknown_type}`,
      ].join(" ")
    );
  }
};

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
