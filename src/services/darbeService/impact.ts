import type { EventImpact } from "../api/endpoints/types/impact.api.types";
import { supabase } from "../supabase/client";
import { ensureUserId } from "./utils";
import { getShortEventsByIds } from "./events";
import { getVolunteerValuePerHour } from "./volunteerValue";
import {
  parseEventDateAsLocalDate,
  parseEventDateTimeAsLocalDate,
} from "../../utils/eventDateUtils";

const getHoursBetweenTimestamps = (start?: string | null, end?: string | null) => {
  if (!start || !end) return 0;

  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return 0;
  }

  return Math.max((endTime - startTime) / 3600000, 0);
};

const mapImpactRowsToEvents = async (
  rows: Array<{
    id: string;
    event_id: string | null;
    hours_volunteered: number | null;
    volunteer_value_per_hour?: number | null;
  }>
): Promise<EventImpact[]> => {
  const eventIds = Array.from(
    new Set(
      rows
        .map((row) => row.event_id)
        .filter((eventId): eventId is string => Boolean(eventId))
    )
  );
  const events = await getShortEventsByIds(eventIds);
  const eventMap = new Map(events.map((event) => [event.id, event]));
  const currentVolunteerValuePerHour = await getVolunteerValuePerHour();

  return rows
    .filter((impact) => impact.event_id && eventMap.has(impact.event_id))
    .map((impact) => ({
      id: impact.id,
      impactType: "individual" as const,
      hoursVolunteered: Number(impact.hours_volunteered ?? 0),
      volunteerValue:
        Number(impact.hours_volunteered ?? 0) *
        Number(
          impact.volunteer_value_per_hour ?? currentVolunteerValuePerHour
        ),
      event: eventMap.get(impact.event_id as string)!,
    }));
};

const hasShortEventEnded = (
  event: { eventDate: string; endTime?: number },
  now = new Date()
) => {
  if (event.endTime !== undefined) {
    return now > parseEventDateTimeAsLocalDate(event.eventDate, event.endTime);
  }

  const eventDate = parseEventDateAsLocalDate(event.eventDate);
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  return eventDate < startOfToday;
};

const getEntitySignupImpactRows = async (
  entityId: string
): Promise<
  Array<{
    id: string;
    event_id: string | null;
    hours_volunteered: number | null;
  }>
> => {
  const activeSignupStatuses = ["volunteered", "confirmed", "approved", "no_show"];
  const [
    { data: directSignups, error: directSignupsError },
    { data: memberInvitationSignups, error: memberInvitationSignupsError },
  ] = await Promise.all([
    supabase
      .from("event_signups")
      .select("id, event_id, check_in_at, check_out_at")
      .eq("user_id", entityId)
      .in("status", activeSignupStatuses)
      .not("event_id", "is", null),
    supabase
      .from("event_signups")
      .select("id, event_id, check_in_at, check_out_at")
      .eq("invited_by_entity_id", entityId)
      .is("invitation_removed_at", null)
      .in("status", activeSignupStatuses)
      .not("event_id", "is", null),
  ]);

  if (directSignupsError) throw directSignupsError;
  if (memberInvitationSignupsError) throw memberInvitationSignupsError;

  const signups = [
    ...(directSignups ?? []),
    ...(memberInvitationSignups ?? []),
  ];

  const eventIds = Array.from(
    new Set(
      signups
        .map((signup) => signup.event_id)
        .filter((eventId): eventId is string => Boolean(eventId))
    )
  );

  if (!eventIds.length) return [];

  const events = await getShortEventsByIds(eventIds);
  const pastEventIds = new Set(
    events
      .filter((event) => hasShortEventEnded(event))
      .map((event) => event.id)
  );

  const rowsByEventId = new Map<
    string,
    { id: string; event_id: string; hours_volunteered: number }
  >();

  signups
    .filter(
      (signup) => Boolean(signup.event_id) && pastEventIds.has(signup.event_id)
    )
    .forEach((signup) => {
      const hoursVolunteered = getHoursBetweenTimestamps(
        signup.check_in_at,
        signup.check_out_at
      );
      const existingRow = rowsByEventId.get(signup.event_id);

      rowsByEventId.set(signup.event_id, {
        id: existingRow?.id ?? signup.id,
        event_id: signup.event_id,
        hours_volunteered:
          (existingRow?.hours_volunteered ?? 0) + hoursVolunteered,
      });
    });

  return Array.from(rowsByEventId.values());
};

const mergeImpactRowsByEvent = (
  primaryRows: Array<{
    id: string;
    event_id: string | null;
    hours_volunteered: number | null;
    volunteer_value_per_hour?: number | null;
  }>,
  secondaryRows: Array<{
    id: string;
    event_id: string | null;
    hours_volunteered: number | null;
    volunteer_value_per_hour?: number | null;
  }>
) => {
  const seenEventIds = new Set(
    primaryRows
      .map((row) => row.event_id)
      .filter((eventId): eventId is string => Boolean(eventId))
  );

  return [
    ...primaryRows,
    ...secondaryRows.filter((row) => {
      if (!row.event_id || seenEventIds.has(row.event_id)) return false;
      seenEventIds.add(row.event_id);
      return true;
    }),
  ];
};

const getEntityVolunteerImpact = async (entityId: string): Promise<EventImpact[]> => {
  const { data: publicImpactRows, error: publicImpactError } =
    await supabase.rpc("get_public_entity_volunteer_impact", {
      target_entity_id: entityId,
    });

  if (!publicImpactError) {
    const entitySignupRows = await getEntitySignupImpactRows(entityId);
    return mapImpactRowsToEvents(
      mergeImpactRowsByEvent(publicImpactRows ?? [], entitySignupRows)
    );
  }

  if ((publicImpactError as { code?: string }).code !== "PGRST202") {
    throw publicImpactError;
  }

  console.warn(
    "get_public_entity_volunteer_impact is not available yet. Apply the latest Supabase migrations and reload the PostgREST schema cache."
  );

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id")
    .eq("event_owner_id", entityId);

  if (eventsError) throw eventsError;

  const eventIds = (events ?? []).map((event) => event.id);
  const { data: signups, error: signupsError } = eventIds.length
    ? await supabase
        .from("event_signups")
        .select("event_id, check_in_at, check_out_at")
        .in("event_id", eventIds)
        .eq("status", "approved")
        .not("check_in_at", "is", null)
        .not("check_out_at", "is", null)
    : { data: [], error: null };

  if (signupsError) throw signupsError;

  const hoursByEvent = new Map<string, number>();
  (signups ?? []).forEach((signup) => {
    hoursByEvent.set(
      signup.event_id,
      (hoursByEvent.get(signup.event_id) ?? 0) +
        getHoursBetweenTimestamps(signup.check_in_at, signup.check_out_at)
    );
  });

  const ownedEventRows = Array.from(hoursByEvent.entries()).map(
    ([eventId, hoursVolunteered]) => ({
      id: eventId,
      event_id: eventId,
      hours_volunteered: hoursVolunteered,
    })
  );

  const entitySignupRows = await getEntitySignupImpactRows(entityId);

  return mapImpactRowsToEvents(
    mergeImpactRowsByEvent(ownedEventRows, entitySignupRows)
  );
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

  if (profile.user_type !== "individual") {
    return getEntityVolunteerImpact(currentUserId);
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

    return mapImpactRowsToEvents(publicImpactRows ?? []);
  }

  const { data: initialImpactRows, error } = await supabase
    .from("impact")
    .select("id, event_id, hours_volunteered, events_attended, volunteer_value_per_hour")
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
  const currentVolunteerValuePerHour = await getVolunteerValuePerHour();

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
        volunteer_value_per_hour: currentVolunteerValuePerHour,
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
          volunteer_value_per_hour:
            existingImpact.volunteer_value_per_hour ??
            currentVolunteerValuePerHour,
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
    .select("id, event_id, hours_volunteered, volunteer_value_per_hour")
    .eq("impact_owner_id", currentUserId)
    .not("event_id", "is", null)
    .gt("events_attended", 0)
    .order("updated_at", { ascending: false });

  if (refreshedImpactError) throw refreshedImpactError;

  return mapImpactRowsToEvents(impactRows ?? []);
};
