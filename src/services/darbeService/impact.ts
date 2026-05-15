import type { EventImpact } from "../api/endpoints/types/impact.api.types";
import { supabase } from "../supabase/client";
import { ensureUserId } from "./utils";
import { getShortEventsByIds } from "./events";

const getHoursBetweenTimestamps = (start?: string | null, end?: string | null) => {
  if (!start || !end) return 0;

  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return 0;
  }

  return Math.max((endTime - startTime) / 3600000, 0);
};

export const getUserImpact = async (userId?: string): Promise<EventImpact[]> => {
  const currentUserId = userId ?? (await ensureUserId());
  const signedInUserId = await ensureUserId();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", currentUserId)
    .single();

  if (profileError || !profile) {
    throw profileError ?? new Error("User profile not found");
  }

  if (currentUserId !== signedInUserId) {
    const { data: publicImpactRows, error: publicImpactError } =
      await supabase.rpc("get_public_user_impact", {
        target_user_id: currentUserId,
      });

    if (publicImpactError) {
      if ((publicImpactError as { code?: string }).code === "PGRST202") {
        console.warn(
          "get_public_user_impact is not available yet. Apply the latest Supabase migrations and reload the PostgREST schema cache."
        );
        return [];
      }

      throw publicImpactError;
    }

    const eventIds = Array.from(
      new Set(
        (publicImpactRows ?? [])
          .map((row) => row.event_id)
          .filter((eventId): eventId is string => Boolean(eventId))
      )
    );
    const events = await getShortEventsByIds(eventIds);
    const eventMap = new Map(events.map((event) => [event.id, event]));

    return (publicImpactRows ?? [])
      .filter((impact) => eventMap.has(impact.event_id))
      .map((impact) => ({
        id: impact.id,
        impactType: "individual" as const,
        hoursVolunteered: Number(impact.hours_volunteered ?? 0),
        volunteerValue: 0,
        event: eventMap.get(impact.event_id)!,
      }));
  }

  const { data: initialImpactRows, error } = await supabase
    .from("impact")
    .select("id, event_id, hours_volunteered, events_attended")
    .eq("impact_owner_id", currentUserId)
    .not("event_id", "is", null)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const existingImpactByEventId = new Map(
    (initialImpactRows ?? [])
      .filter((impact) => Boolean(impact.event_id))
      .map((impact) => [impact.event_id as string, impact])
  );
  const { data: approvedSignups, error: approvedSignupsError } = await supabase
    .from("event_signups")
    .select("event_id, check_in_at, check_out_at")
    .eq("user_id", currentUserId)
    .eq("status", "approved")
    .not("event_id", "is", null)
    .not("check_in_at", "is", null)
    .not("check_out_at", "is", null);

  if (approvedSignupsError) throw approvedSignupsError;

  const impactRowsToCreate = [];

  for (const signup of approvedSignups ?? []) {
    const hoursVolunteered = getHoursBetweenTimestamps(
      signup.check_in_at,
      signup.check_out_at
    );
    const existingImpact = existingImpactByEventId.get(signup.event_id);

    if (!existingImpact) {
      impactRowsToCreate.push({
        impact_owner_id: currentUserId,
        user_type: profile.user_type,
        event_id: signup.event_id,
        events_created: 0,
        events_attended: 1,
        events_passed: 0,
        events_coordinated: 0,
        hours_volunteered: hoursVolunteered,
      });
      continue;
    }

    if (
      Number(existingImpact.events_attended ?? 0) < 1 ||
      Number(existingImpact.hours_volunteered ?? 0) !== hoursVolunteered
    ) {
      const { error: updateError } = await supabase
        .from("impact")
        .update({
          events_attended: 1,
          hours_volunteered: hoursVolunteered,
        })
        .eq("id", existingImpact.id);

      if (updateError) throw updateError;
    }
  }

  if (impactRowsToCreate.length) {
    const { error: insertError } = await supabase.from("impact").insert(
      impactRowsToCreate
    );

    if (insertError) throw insertError;
  }

  const { data: impactRows, error: refreshedImpactError } = await supabase
    .from("impact")
    .select("id, event_id, hours_volunteered")
    .eq("impact_owner_id", currentUserId)
    .not("event_id", "is", null)
    .gt("events_attended", 0)
    .order("updated_at", { ascending: false });

  if (refreshedImpactError) throw refreshedImpactError;

  const eventIds = Array.from(
    new Set(
      (impactRows ?? [])
        .map((row) => row.event_id)
        .filter((eventId): eventId is string => Boolean(eventId))
    )
  );
  const events = await getShortEventsByIds(eventIds);
  const eventMap = new Map(events.map((event) => [event.id, event]));

  return (impactRows ?? [])
    .filter((impact) => {
      if (!impact.event_id) return false;
      return eventMap.has(impact.event_id);
    })
    .map((impact) => {
      const event = eventMap.get(impact.event_id as string)!;

      return {
        id: impact.id,
        impactType: "individual" as const,
        hoursVolunteered: Number(impact.hours_volunteered ?? 0),
        volunteerValue: 0,
        event,
      };
    });
};
