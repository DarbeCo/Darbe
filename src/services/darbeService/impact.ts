import type { EventImpact } from "../api/endpoints/types/impact.api.types";
import { supabase } from "../supabase/client";
import { ensureUserId } from "./utils";
import { getShortEventsByIds } from "./events";

export const getUserImpact = async (userId?: string): Promise<EventImpact[]> => {
  const currentUserId = userId ?? (await ensureUserId());
  const { data: impactRows, error } = await supabase
    .from("impact")
    .select("id, event_id, hours_volunteered")
    .eq("impact_owner_id", currentUserId)
    .not("event_id", "is", null)
    .gt("events_attended", 0)
    .order("updated_at", { ascending: false });

  if (error) throw error;

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
