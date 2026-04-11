import type { SignUpState } from "../../features/signup/types";
import type { UserState } from "../../features/users/userSlice";
import type { Availability, DayOfWeek } from "../types/availability.types";
import { supabase } from "../supabase/client";

const DAY_ORDER: DayOfWeek[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

const DAY_TO_INDEX = DAY_ORDER.reduce(
  (acc, day, index) => {
    acc[day] = index;
    return acc;
  },
  {} as Record<DayOfWeek, number>
);

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const toDateString = (dob?: SignUpState["dob"]): string | null => {
  if (!dob?.year || !dob?.month || !dob?.day) {
    return null;
  }

  const rawMonth = dob.month.trim();
  const monthIndex =
    MONTHS[rawMonth] ?? (Number.isNaN(Number(rawMonth)) ? null : Number(rawMonth) - 1);

  if (monthIndex === null || monthIndex < 0 || monthIndex > 11) {
    return null;
  }

  const dayNum = Number(dob.day);
  const yearNum = Number(dob.year);
  if (!Number.isFinite(dayNum) || !Number.isFinite(yearNum)) {
    return null;
  }

  const date = new Date(Date.UTC(yearNum, monthIndex, dayNum));
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
};

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

const buildAvailabilityRows = (
  userId: string,
  availability?: Availability
) => {
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

export const checkEmailAvailability = async (email: string): Promise<boolean> => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return false;
  }

  const { data: existingProfiles, error: existingProfileError } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", normalizedEmail)
    .limit(1);

  if (existingProfileError) {
    throw existingProfileError;
  }

  return !existingProfiles || existingProfiles.length === 0;
};

const timeToHours = (value: string | null): string => {
  if (!value) {
    return "";
  }
  const [hoursValue, minutesValue] = value.split(":");
  const hours = Number(hoursValue);
  const minutes = Number(minutesValue);
  if (!Number.isFinite(hours)) {
    return "";
  }
  const decimal = minutes >= 30 ? 0.5 : 0;
  return (hours + decimal).toString();
};

const mapAvailability = (rows: Array<{ day_of_week: number; start_time: string | null; end_time: string | null; is_open: boolean; }>) => {
  const availability: Availability = {};
  DAY_ORDER.forEach((day) => {
    availability[day] = { start: "", end: "", open: false };
  });

  rows.forEach((row) => {
    const day = DAY_ORDER[row.day_of_week];
    if (!day) {
      return;
    }
    availability[day] = {
      start: timeToHours(row.start_time),
      end: timeToHours(row.end_time),
      open: row.is_open,
    };
  });

  return availability;
};

const fetchUserState = async (userId: string): Promise<UserState> => {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, first_name, last_name, user_type, zip, city, ein, nonprofit_name, organization_name, profile_picture_url, cover_photo_url"
    )
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw profileError ?? new Error("Profile not found");
  }

  const { data: causesRows, error: causesError } = await supabase
    .from("user_causes")
    .select("cause_id")
    .eq("user_id", userId);

  if (causesError) {
    throw causesError;
  }

  const { data: availabilityRows, error: availabilityError } = await supabase
    .from("user_availability")
    .select("day_of_week, start_time, end_time, is_open")
    .eq("user_id", userId);

  if (availabilityError) {
    throw availabilityError;
  }

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name ?? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim(),
    firstName: profile.first_name ?? "",
    lastName: profile.last_name ?? "",
    causes: causesRows?.map((row) => row.cause_id) ?? [],
    userType: profile.user_type,
    zip: profile.zip,
    city: profile.city,
    availability: availabilityRows ? mapAvailability(availabilityRows) : undefined,
    ein: profile.ein ?? undefined,
    nonprofitName: profile.nonprofit_name ?? undefined,
    organizationName: profile.organization_name ?? undefined,
    profilePicture: profile.profile_picture_url ?? undefined,
    coverPhoto: profile.cover_photo_url ?? undefined,
  };
};

export const signUpWithProfile = async (payload: SignUpState): Promise<UserState> => {
  const normalizedPayload = {
    ...payload,
    email: normalizeEmail(payload.email),
  };

  const emailAvailable = await checkEmailAvailability(normalizedPayload.email);
  if (!emailAvailable) {
    throw new Error("An account with this email already exists. Please log in.");
  }

  const { data, error } = await supabase.auth.signUp({
    email: normalizedPayload.email,
    password: normalizedPayload.password,
  });

  if (error) {
    throw error;
  }

  const userId = data.user?.id;
  if (!userId) {
    throw new Error("Sign up succeeded but no user id was returned.");
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.access_token) {
    throw new Error("No active session found after sign up. Disable email confirmation or create profile via server-side flow.");
  }

  const userEmail = data.user?.email ?? normalizedPayload.email;
  const profileInsert = {
    id: userId,
    user_type: normalizedPayload.userType,
    email: userEmail,
    first_name: normalizedPayload.firstName ?? null,
    last_name: normalizedPayload.lastName ?? null,
    organization_name: normalizedPayload.organizationName ?? null,
    nonprofit_name: normalizedPayload.nonprofitName ?? null,
    ein: normalizedPayload.ein ?? null,
    city: normalizedPayload.city,
    zip: normalizedPayload.zip,
    date_of_birth: toDateString(normalizedPayload.dob),
    profile_picture_url: null,
    cover_photo_url: null,
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(profileInsert, { onConflict: "id" });

  if (profileError) {
    throw profileError;
  }

  const { error: detailsError } = await supabase
    .from("user_details")
    .upsert({ user_id: userId }, { onConflict: "user_id" });

  if (detailsError) {
    throw detailsError;
  }

  if (normalizedPayload.causes?.length) {
    const isUuid = (value: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
      );

    const rawCauses = normalizedPayload.causes.filter(Boolean);
    const directIds = rawCauses.filter(isUuid);
    const causeNames = rawCauses.filter((cause) => !isUuid(cause));

    let resolvedIds = directIds;
    if (causeNames.length > 0) {
      const { data: causeRowsData, error: causeLookupError } = await supabase
        .from("causes")
        .select("id, name")
        .in("name", causeNames);

      if (causeLookupError) {
        throw causeLookupError;
      }

      const idsFromNames = (causeRowsData ?? []).map((row) => row.id);
      resolvedIds = Array.from(new Set([...directIds, ...idsFromNames]));
    }

    const causeRows = resolvedIds.map((causeId) => ({
      user_id: userId,
      cause_id: causeId,
    }));

    const { error: causesError } = await supabase
      .from("user_causes")
      .upsert(causeRows, { onConflict: "user_id,cause_id" });

    if (causesError) {
      throw causesError;
    }
  }

  const availabilityRows = buildAvailabilityRows(userId, normalizedPayload.availability);
  if (availabilityRows.length) {
    const { error: availabilityError } = await supabase
      .from("user_availability")
      .upsert(availabilityRows, { onConflict: "user_id,day_of_week" });

    if (availabilityError) {
      throw availabilityError;
    }
  }

  if (normalizedPayload.userType !== "individual") {
    const { error: entityError } = await supabase
      .from("entity_details")
      .upsert({ user_id: userId }, { onConflict: "user_id" });

    if (entityError) {
      throw entityError;
    }

    const { data: existingRosters, error: rosterQueryError } = await supabase
      .from("rosters")
      .select("id")
      .eq("roster_owner_id", userId)
      .limit(1);

    if (rosterQueryError) {
      throw rosterQueryError;
    }

    if (!existingRosters || existingRosters.length === 0) {
      const rosterName = `${normalizedPayload.organizationName ?? normalizedPayload.nonprofitName ?? "Entity"}'s Default Roster`;
      const { error: rosterError } = await supabase
        .from("rosters")
        .insert({ roster_owner_id: userId, roster_name: rosterName });

      if (rosterError) {
        throw rosterError;
      }
    }
  }

  return fetchUserState(userId);
};

export const signIn = async (email: string, password: string): Promise<UserState> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }

  const userId = data.user?.id;
  if (!userId) {
    throw new Error("Login succeeded but no user id was returned.");
  }

  return fetchUserState(userId);
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};
