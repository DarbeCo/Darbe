import type { EventImpact } from "../api/endpoints/types/impact.api.types";
import { supabase } from "../supabase/client";
import { ensureUserId } from "./utils";
import { getShortEventsByIds } from "./events";

export const getUserImpact = async (userId?: string): Promise<EventImpact[]> => {
  const currentUserId = userId ?? (await ensureUserId());
  const { data: signups, error } = await supabase
    .from("event_signups")
    .select("id, event_id, status")
    .eq("user_id", currentUserId)
    .in("status", ["volunteered", "confirmed"]);

  if (error) throw error;

  const eventIds = Array.from(new Set((signups ?? []).map((row) => row.event_id)));
  const events = await getShortEventsByIds(eventIds);
  const eventMap = new Map(events.map((event) => [event.id, event]));

  return (signups ?? [])
    .filter((signup) => eventMap.has(signup.event_id))
    .map((signup) => {
      const event = eventMap.get(signup.event_id)!;
      const hoursVolunteered =
        event.endTime !== undefined ? Math.max(event.endTime - event.startTime, 0) : 0;

      return {
        id: signup.id,
        impactType: "individual" as const,
        hoursVolunteered,
        volunteerValue: 0,
        event,
      };
    });
};
