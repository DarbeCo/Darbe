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
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    throw error;
  }

  const userId = data.user?.id;
  if (!userId) {
    throw new Error("Sign up succeeded but no user id was returned.");
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw new Error("No active session found after sign up. Disable email confirmation or create profile via server-side flow.");
  }

  const { error: functionError } = await supabase.functions.invoke("create-profile", {
    body: payload,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (functionError) {
    throw functionError;
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
