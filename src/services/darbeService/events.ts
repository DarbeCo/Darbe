import type {
  CreateEvent,
  EventsState,
  ShortEventState,
  SimpleEventState,
  UserEventSignups,
  VolunteerMatch,
} from "../api/endpoints/types/events.api.types";
import type { Cause } from "../types/cause.types";
import type { SimpleUserInfo } from "../api/endpoints/types/user.api.types";
import { supabase } from "../supabase/client";
import { ensureUserId } from "./utils";
import { getProfilesByIds, mapProfileToSimpleUserInfo } from "./profiles";

type EventRow = {
  id: string;
  event_owner_id: string;
  event_name: string;
  event_description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  is_repeating: boolean | null;
  is_followers_only: boolean | null;
  event_parking_info: string | null;
  event_internal_location: string | null;
  is_indoor: boolean | null;
  is_outdoor: boolean | null;
  max_volunteer_count: number;
  event_cover_photo_url: string | null;
  event_coordinator_id: string;
  adult_waiver_url: string | null;
  minor_waiver_url: string | null;
};

type EventAddressRow = {
  event_id: string;
  location_name: string | null;
  street_name: string | null;
  city: string | null;
  zip_code: string | null;
};

type EventRequirementRow = {
  event_id: string;
  supplies: string | null;
  age_restrictions: string | null;
  attire: string | null;
  lift_requirements: string | null;
};

type EventImpactRow = {
  event_id: string;
  individual_impact: string | null;
  individual_impact_per_hour: string | null;
  group_impact: string | null;
  group_impact_per_hour: string | null;
  is_individual_impact: boolean | null;
  is_group_impact: boolean | null;
};

const fallbackSimpleUser = (id: string): SimpleUserInfo => ({
  id,
  fullName: "",
  firstName: "",
  lastName: "",
  nonprofitName: undefined,
  organizationName: undefined,
  profilePicture: undefined,
  userType: undefined,
});

const toSimpleUser = (profile: any, id: string): SimpleUserInfo =>
  profile ? mapProfileToSimpleUserInfo(profile) : fallbackSimpleUser(id);

const timeToDecimal = (time: string | null): number | undefined => {
  if (!time) return undefined;
  const [hourValue, minuteValue] = time.split(":");
  const hours = Number(hourValue);
  const minutes = Number(minuteValue);
  if (!Number.isFinite(hours)) return undefined;
  const decimal = minutes >= 30 ? 0.5 : 0;
  return hours + decimal;
};

const decimalToTimeString = (value: number | undefined): string | null => {
  if (value === undefined || value === null) return null;
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return null;
  const hours = Math.floor(numberValue);
  const minutes = numberValue % 1 === 0 ? "00" : "30";
  return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
};

const toDatabaseDateString = (value: Date | string): string => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const mmDdYyyyMatch = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);

  if (mmDdYyyyMatch) {
    const [, month, day, year] = mmDdYyyyMatch;
    return `${year}-${month}-${day}`;
  }

  return value.split("T")[0];
};

const buildSignupPlaceholders = (count: number, eventId: string) =>
  Array.from({ length: count }, (_, index) => ({
    id: `${eventId}-${index}`,
    user: fallbackSimpleUser(""),
    eventId,
    status: "volunteered" as const,
    eventActionTimeStamp: new Date(0).toISOString(),
  }));

const mapAddressRow = (row?: EventAddressRow) => ({
  locationName: row?.location_name ?? "",
  streetName: row?.street_name ?? "",
  city: row?.city ?? "",
  zipCode: row?.zip_code ?? "",
});

const mapImpactRow = (row?: EventImpactRow) => ({
  individualImpact: row?.individual_impact ?? "",
  individualImpactPerHour: row?.individual_impact_per_hour ?? "",
  groupImpact: row?.group_impact ?? "",
  groupImpactPerHour: row?.group_impact_per_hour ?? "",
  isIndividualImpact: row?.is_individual_impact ?? false,
  isGroupImpact: row?.is_group_impact ?? false,
});

const mapRequirementsRow = (row?: EventRequirementRow) => ({
  supplies: row?.supplies ?? "",
  ageRestrictions: row?.age_restrictions ?? "",
  attire: row?.attire ?? "",
  liftRequirements: row?.lift_requirements ?? "",
});

const getSignupCounts = async (eventIds: string[]) => {
  if (!eventIds.length) return new Map<string, number>();
  const { data, error } = await supabase.rpc("get_event_signup_counts", {
    event_ids: eventIds,
  });
  if (error) throw error;
  const map = new Map<string, number>();
  (data ?? []).forEach((row: { event_id: string; signup_count: number }) => {
    map.set(row.event_id, row.signup_count);
  });
  return map;
};

const buildShortEvents = async (events: EventRow[]): Promise<ShortEventState[]> => {
  if (!events.length) return [];

  const eventIds = events.map((event) => event.id);
  const ownerIds = Array.from(new Set(events.map((event) => event.event_owner_id)));

  const [addressesRes, impactsRes, owners, signupCountMap] = await Promise.all([
    supabase
      .from("event_addresses")
      .select("event_id, location_name, street_name, city, zip_code")
      .in("event_id", eventIds),
    supabase
      .from("event_volunteer_impacts")
      .select(
        "event_id, individual_impact, individual_impact_per_hour, group_impact, group_impact_per_hour, is_individual_impact, is_group_impact"
      )
      .in("event_id", eventIds),
    getProfilesByIds(ownerIds),
    getSignupCounts(eventIds),
  ]);

  if (addressesRes.error) throw addressesRes.error;
  if (impactsRes.error) throw impactsRes.error;

  const addressMap = new Map<string, EventAddressRow>();
  (addressesRes.data ?? []).forEach((row) => addressMap.set(row.event_id, row));

  const impactMap = new Map<string, EventImpactRow>();
  (impactsRes.data ?? []).forEach((row) => impactMap.set(row.event_id, row));

  const ownerMap = new Map(owners.map((profile) => [profile.id, profile]));

  return events.map((event) => {
    const signupCount = signupCountMap.get(event.id) ?? 0;

    return {
      id: event.id,
      eventOwner: toSimpleUser(ownerMap.get(event.event_owner_id), event.event_owner_id),
      eventName: event.event_name,
      eventDate: event.event_date,
      startTime: timeToDecimal(event.start_time) ?? 0,
      endTime: timeToDecimal(event.end_time),
      maxVolunteerCount: event.max_volunteer_count,
      eventCoverPhoto: event.event_cover_photo_url ?? "",
      eventDescription: event.event_description ?? "",
      volunteerImpact: mapImpactRow(impactMap.get(event.id)),
      eventAddress: mapAddressRow(addressMap.get(event.id)),
      signups: buildSignupPlaceholders(signupCount, event.id),
    };
  });
};

export const getShortEventsByIds = async (eventIds: string[]): Promise<ShortEventState[]> => {
  if (!eventIds.length) return [];
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, event_owner_id, event_name, event_description, event_date, start_time, end_time, is_followers_only, max_volunteer_count, event_cover_photo_url"
    )
    .in("id", eventIds);

  if (error) throw error;
  return buildShortEvents((data ?? []) as EventRow[]);
};

const incrementImpact = async (
  userId: string,
  fields: Partial<{
    events_created: number;
    events_attended: number;
    events_passed: number;
    events_coordinated: number;
    hours_volunteered: number;
  }>
) => {
  const { data: existing, error: existingError } = await supabase
    .from("impact")
    .select(
      "id, events_created, events_attended, events_passed, events_coordinated, hours_volunteered, user_type"
    )
    .eq("impact_owner_id", userId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (!existing) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", userId)
      .single();

    if (profileError || !profile) throw profileError ?? new Error("User not found");

    const { error } = await supabase.from("impact").insert({
      impact_owner_id: userId,
      user_type: profile.user_type,
      events_created: fields.events_created ?? 0,
      events_attended: fields.events_attended ?? 0,
      events_passed: fields.events_passed ?? 0,
      events_coordinated: fields.events_coordinated ?? 0,
      hours_volunteered: fields.hours_volunteered ?? 0,
    });

    if (error) throw error;
    return;
  }

  const updated = {
    events_created: existing.events_created + (fields.events_created ?? 0),
    events_attended: existing.events_attended + (fields.events_attended ?? 0),
    events_passed: existing.events_passed + (fields.events_passed ?? 0),
    events_coordinated: existing.events_coordinated + (fields.events_coordinated ?? 0),
    hours_volunteered: Number(existing.hours_volunteered ?? 0) + (fields.hours_volunteered ?? 0),
  };

  const { error } = await supabase
    .from("impact")
    .update(updated)
    .eq("id", existing.id);

  if (error) throw error;
};

export const getEvents = async (): Promise<ShortEventState[]> => {
  const userId = await ensureUserId();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", userId)
    .single();

  if (profileError || !profile) throw profileError ?? new Error("User not found");

  const isIndividual = profile.user_type === "individual";

  const { data: events, error } = await supabase
    .from("events")
    .select(
      "id, event_owner_id, event_name, event_description, event_date, start_time, end_time, is_followers_only, max_volunteer_count, event_cover_photo_url"
    )
    .match(isIndividual ? {} : { event_owner_id: userId })
    .neq(isIndividual ? "event_owner_id" : "id", isIndividual ? userId : "")
    .order("event_date", { ascending: true });

  if (error) throw error;

  let filteredEvents = events ?? [];

  if (isIndividual) {
    const [{ data: signups }, { data: following }] = await Promise.all([
      supabase
        .from("event_signups")
        .select("event_id, status")
        .eq("user_id", userId),
      supabase.from("follows").select("following_id").eq("follower_id", userId),
    ]);

    const blockedEventIds = new Set(
      (signups ?? [])
        .filter((row) => row.status === "volunteered" || row.status === "passed")
        .map((row) => row.event_id)
    );

    const followingIds = new Set((following ?? []).map((row) => row.following_id));

    filteredEvents = filteredEvents.filter((event) => {
      if (blockedEventIds.has(event.id)) return false;
      if (event.is_followers_only) {
        return followingIds.has(event.event_owner_id);
      }
      return true;
    });
  }

  return buildShortEvents(filteredEvents as EventRow[]);
};

export const getEventDetails = async (eventId: string): Promise<EventsState> => {
  const { data: event, error } = await supabase
    .from("events")
    .select(
      "id, event_owner_id, event_name, event_description, event_date, start_time, end_time, is_repeating, is_followers_only, event_parking_info, event_internal_location, is_indoor, is_outdoor, max_volunteer_count, event_cover_photo_url, event_coordinator_id, adult_waiver_url, minor_waiver_url"
    )
    .eq("id", eventId)
    .single();

  if (error || !event) throw error ?? new Error("Event not found");

  const [
    addressRes,
    requirementsRes,
    impactsRes,
    ownerProfiles,
    coordinatorProfiles,
    signupCounts,
  ] = await Promise.all([
    supabase
      .from("event_addresses")
      .select("event_id, location_name, street_name, city, zip_code")
      .eq("event_id", eventId)
      .maybeSingle(),
    supabase
      .from("event_requirements")
      .select("event_id, supplies, age_restrictions, attire, lift_requirements")
      .eq("event_id", eventId)
      .maybeSingle(),
    supabase
      .from("event_volunteer_impacts")
      .select(
        "event_id, individual_impact, individual_impact_per_hour, group_impact, group_impact_per_hour, is_individual_impact, is_group_impact"
      )
      .eq("event_id", eventId)
      .maybeSingle(),
    getProfilesByIds([event.event_owner_id]),
    getProfilesByIds([event.event_coordinator_id]),
    getSignupCounts([eventId]),
  ]);

  if (addressRes.error) throw addressRes.error;
  if (requirementsRes.error) throw requirementsRes.error;
  if (impactsRes.error) throw impactsRes.error;

  const ownerProfile = ownerProfiles[0];
  const coordinatorProfile = coordinatorProfiles[0];
  const signupCount = signupCounts.get(eventId) ?? 0;

  return {
    eventName: event.event_name,
    eventDescription: event.event_description ?? "",
    eventDate: event.event_date,
    startTime: timeToDecimal(event.start_time) ?? 0,
    endTime: timeToDecimal(event.end_time),
    maxVolunteerCount: event.max_volunteer_count,
    isRepeating: event.is_repeating ?? false,
    isFollowersOnly: event.is_followers_only ?? false,
    eventAddress: mapAddressRow(addressRes.data ?? undefined),
    eventParkingInfo: event.event_parking_info ?? "",
    eventInternalLocation: event.event_internal_location ?? "",
    isIndoor: event.is_indoor ?? false,
    isOutdoor: event.is_outdoor ?? false,
    eventRequirements: mapRequirementsRow(requirementsRes.data ?? undefined),
    eventCoverPhoto: event.event_cover_photo_url ?? "",
    eventCoordinator: toSimpleUser(coordinatorProfile, event.event_coordinator_id),
    eventOwner: toSimpleUser(ownerProfile, event.event_owner_id),
    volunteerImpact: mapImpactRow(impactsRes.data ?? undefined),
    adultWaiver: event.adult_waiver_url ?? "",
    minorWaiver: event.minor_waiver_url ?? "",
    signups: buildSignupPlaceholders(signupCount, eventId),
  };
};

export const createEvent = async (newEvent: CreateEvent): Promise<SimpleEventState> => {
  const userId = await ensureUserId();
  const eventOwnerId = newEvent.eventOwner || userId;
  const eventDate = toDatabaseDateString(newEvent.eventDate);

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      event_owner_id: eventOwnerId,
      event_name: newEvent.eventName,
      event_description: newEvent.eventDescription,
      event_date: eventDate,
      start_time: decimalToTimeString(newEvent.startTime),
      end_time: decimalToTimeString(newEvent.endTime),
      is_repeating: newEvent.isRepeating ?? false,
      is_followers_only: newEvent.isFollowersOnly ?? false,
      event_parking_info: newEvent.eventParkingInfo,
      event_internal_location: newEvent.eventInternalLocation,
      is_indoor: newEvent.isIndoor ?? false,
      is_outdoor: newEvent.isOutdoor ?? false,
      max_volunteer_count: newEvent.maxVolunteerCount,
      event_cover_photo_url: newEvent.eventCoverPhoto ?? "",
      event_coordinator_id: newEvent.eventCoordinator || eventOwnerId,
      adult_waiver_url: newEvent.adultWaiver ?? "",
      minor_waiver_url: newEvent.minorWaiver ?? "",
    })
    .select("id, event_name, event_date, start_time, end_time")
    .single();

  if (error || !event) throw error ?? new Error("Failed to create event");

  const inserts = [
    supabase.from("event_addresses").insert({
      event_id: event.id,
      location_name: newEvent.eventAddress?.locationName ?? null,
      street_name: newEvent.eventAddress?.streetName ?? null,
      city: newEvent.eventAddress?.city ?? null,
      zip_code: newEvent.eventAddress?.zipCode ?? null,
    }),
    supabase.from("event_requirements").insert({
      event_id: event.id,
      supplies: newEvent.eventRequirements?.supplies ?? null,
      age_restrictions: newEvent.eventRequirements?.ageRestrictions ?? null,
      attire: newEvent.eventRequirements?.attire ?? null,
      lift_requirements: newEvent.eventRequirements?.liftRequirements ?? null,
    }),
    supabase.from("event_volunteer_impacts").insert({
      event_id: event.id,
      individual_impact: newEvent.volunteerImpact?.individualImpact ?? null,
      individual_impact_per_hour: newEvent.volunteerImpact?.individualImpactPerHour ?? null,
      group_impact: newEvent.volunteerImpact?.groupImpact ?? null,
      group_impact_per_hour: newEvent.volunteerImpact?.groupImpactPerHour ?? null,
      is_individual_impact: newEvent.volunteerImpact?.isIndividualImpact ?? false,
      is_group_impact: newEvent.volunteerImpact?.isGroupImpact ?? false,
    }),
  ];

  const results = await Promise.all(inserts);
  results.forEach((result) => {
    if (result.error) throw result.error;
  });

  await incrementImpact(eventOwnerId, { events_created: 1 });

  return {
    eventName: event.event_name,
    eventDate: event.event_date,
    startTime: timeToDecimal(event.start_time) ?? 0,
    endTime: timeToDecimal(event.end_time),
  };
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw error;
};

export const volunteerForEvent = async (eventId: string): Promise<void> => {
  const userId = await ensureUserId();

  const { data: existing } = await supabase
    .from("event_signups")
    .select("id")
    .match({ event_id: eventId, user_id: userId })
    .maybeSingle();

  if (existing) {
    throw new Error("You have already volunteered for this event");
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("start_time, end_time")
    .eq("id", eventId)
    .single();

  if (eventError || !event) throw eventError ?? new Error("Event not found");

  const { error } = await supabase.from("event_signups").insert({
    event_id: eventId,
    user_id: userId,
    status: "volunteered",
  });

  if (error) throw error;

  const start = timeToDecimal(event.start_time) ?? 0;
  const end = timeToDecimal(event.end_time);
  const hours = end ? Math.max(end - start, 0) : 0;

  await incrementImpact(userId, { events_attended: 1, hours_volunteered: hours });
};

export const passOnEvent = async (eventId: string): Promise<void> => {
  const userId = await ensureUserId();

  const { data: existing } = await supabase
    .from("event_signups")
    .select("id")
    .match({ event_id: eventId, user_id: userId })
    .maybeSingle();

  if (existing) {
    throw new Error("You have already passed this event");
  }

  const { error } = await supabase.from("event_signups").insert({
    event_id: eventId,
    user_id: userId,
    status: "passed",
  });

  if (error) throw error;

  await incrementImpact(userId, { events_passed: 1 });
};

export const getSignedUpEvents = async (
  when: "upcoming" | "past" | undefined
): Promise<UserEventSignups[]> => {
  const userId = await ensureUserId();
  const { data: signups, error } = await supabase
    .from("event_signups")
    .select("event_id, status, event_action_timestamp")
    .eq("user_id", userId)
    .eq("status", "volunteered");

  if (error) throw error;

  const eventIds = Array.from(new Set((signups ?? []).map((row) => row.event_id)));

  if (!eventIds.length) return [];

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select(
      "id, event_owner_id, event_name, event_description, event_date, start_time, end_time, is_followers_only, max_volunteer_count, event_cover_photo_url"
    )
    .in("id", eventIds);

  if (eventsError) throw eventsError;

  let filteredEvents = events ?? [];

  if (when) {
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    filteredEvents = filteredEvents.filter((event) => {
      const eventDate = new Date(event.event_date);
      return when === "past"
        ? eventDate < startOfToday
        : eventDate >= startOfToday;
    });
  }

  const shortEvents = await buildShortEvents(filteredEvents as EventRow[]);
  const eventMap = new Map(shortEvents.map((event) => [event.id, event]));

  const profile = (await getProfilesByIds([userId]))[0];
  const signedUpUser = toSimpleUser(profile, userId);
  const signupCountMap = await getSignupCounts(filteredEvents.map((event) => event.id));

  return (signups ?? [])
    .filter((signup) => eventMap.has(signup.event_id))
    .map((signup) => ({
      event: eventMap.get(signup.event_id) as ShortEventState,
      signedUpUser,
      eventActionTimeStamp: signup.event_action_timestamp,
      status: signup.status as "volunteered" | "confirmed" | "passed",
      signupCount: signupCountMap.get(signup.event_id) ?? 0,
    }));
};

export const getVolunteerMatches = async (): Promise<VolunteerMatch[]> => {
  const entityId = await ensureUserId();

  const { data: entityCauses, error: causeError } = await supabase
    .from("user_causes")
    .select("cause_id")
    .eq("user_id", entityId);

  if (causeError) throw causeError;

  const causeIds = (entityCauses ?? []).map((row) => row.cause_id);
  if (!causeIds.length) return [];

  const { data: matchingUsers, error: matchError } = await supabase
    .from("user_causes")
    .select("user_id, cause_id")
    .in("cause_id", causeIds);

  if (matchError) throw matchError;

  const matchingUserIds = Array.from(
    new Set((matchingUsers ?? []).map((row) => row.user_id))
  ).filter((id) => id !== entityId);

  if (!matchingUserIds.length) return [];

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, full_name, first_name, last_name, profile_picture_url, nonprofit_name, organization_name, user_type, created_at"
    )
    .in("id", matchingUserIds)
    .eq("user_type", "individual");

  if (profileError) throw profileError;

  const profileIds = (profiles ?? []).map((profile) => profile.id);

  const [detailsRes, impactRes, causeRowsRes] = await Promise.all([
    supabase
      .from("user_details")
      .select("user_id, emergency_contact_name, emergency_contact_phone, emergency_contact_relation")
      .in("user_id", profileIds),
    supabase
      .from("impact")
      .select("impact_owner_id, hours_volunteered, events_attended")
      .in("impact_owner_id", profileIds),
    supabase
      .from("causes")
      .select("id, name, description, image_url, active")
      .in("id", Array.from(new Set((matchingUsers ?? []).map((row) => row.cause_id)))),
  ]);

  if (detailsRes.error) throw detailsRes.error;
  if (impactRes.error) throw impactRes.error;
  if (causeRowsRes.error) throw causeRowsRes.error;

  const detailMap = new Map(
    (detailsRes.data ?? []).map((row) => [row.user_id, row])
  );

  const impactMap = new Map(
    (impactRes.data ?? []).map((row) => [row.impact_owner_id, row])
  );

  const causeMap = new Map(
    (causeRowsRes.data ?? []).map((row) => [
      row.id,
      {
        id: row.id,
        name: row.name,
        description: row.description,
        imageUrl: row.image_url ?? "",
        active: row.active,
      } as Cause,
    ])
  );

  const causesByUser = new Map<string, Cause[]>();
  (matchingUsers ?? []).forEach((row) => {
    const list = causesByUser.get(row.user_id) ?? [];
    const cause = causeMap.get(row.cause_id);
    if (cause) list.push(cause);
    causesByUser.set(row.user_id, list);
  });

  return (profiles ?? []).map((profile) => {
    const details = detailMap.get(profile.id);
    const impact = impactMap.get(profile.id);
    const causes = causesByUser.get(profile.id) ?? [];

    return {
      ...mapProfileToSimpleUserInfo(profile),
      createdAt: profile.created_at,
      causes,
      emergencyContact: {
        name: details?.emergency_contact_name ?? "",
        phone: details?.emergency_contact_phone ?? "",
        relation: details?.emergency_contact_relation ?? "",
      },
      volunteerSummary: {
        hoursVolunteered: Number(impact?.hours_volunteered ?? 0),
        volunteerValue: 0,
        eventsAttended: impact?.events_attended ?? 0,
      },
    };
  });
};
