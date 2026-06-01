import { supabase } from "../supabase/client";

export const FALLBACK_VOLUNTEER_VALUE_PER_HOUR = 36.14;

let cachedVolunteerValuePerHour: number | undefined;

export const getVolunteerValuePerHour = async (): Promise<number> => {
  if (cachedVolunteerValuePerHour !== undefined) {
    return cachedVolunteerValuePerHour;
  }

  const { data, error } = await supabase
    .from("volunteer_value_rates")
    .select("hourly_value")
    .eq("id", "current")
    .maybeSingle();

  if (error) {
    if ((error as { code?: string }).code !== "PGRST205") {
      throw error;
    }

    cachedVolunteerValuePerHour = FALLBACK_VOLUNTEER_VALUE_PER_HOUR;
    return cachedVolunteerValuePerHour;
  }

  const hourlyValue = Number(data?.hourly_value);
  cachedVolunteerValuePerHour = Number.isFinite(hourlyValue)
    ? hourlyValue
    : FALLBACK_VOLUNTEER_VALUE_PER_HOUR;

  return cachedVolunteerValuePerHour;
};
