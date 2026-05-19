import type {
  CreateEvent,
  EntityEventCounts,
  EventEditableUpdate,
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
import {
  getEventTimeParts,
  parseEventDateAsLocalDate,
  parseEventDateTimeAsLocalDate,
} from "../../utils/eventDateUtils";

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

const mapSignupVolunteerToSimpleUser = (volunteer: {
  user_id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_picture_url: string | null;
  nonprofit_name: string | null;
  organization_name: string | null;
  user_type: string | null;
}): SimpleUserInfo => ({
  id: volunteer.user_id,
  fullName: volunteer.full_name ?? "",
  firstName: volunteer.first_name ?? "",
  lastName: volunteer.last_name ?? "",
  profilePicture: volunteer.profile_picture_url ?? undefined,
  nonprofitName: volunteer.nonprofit_name ?? undefined,
  organizationName: volunteer.organization_name ?? undefined,
  userType: volunteer.user_type ?? undefined,
});

const timeToDecimal = (time: string | null): number | undefined => {
  if (!time) return undefined;
  const [hourValue, minuteValue] = time.split(":");
  const hours = Number(hourValue);
  const minutes = Number(minuteValue);
  if (!Number.isFinite(hours)) return undefined;
  if (!Number.isFinite(minutes)) return hours;
  return Number(`${hours}.${minutes.toString().padStart(2, "0")}`);
};

const decimalToTimeString = (value: number | undefined): string | null => {
  if (value === undefined || value === null) return null;
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return null;
  const { hour, minute } = getEventTimeParts(numberValue);
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}:00`;
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

const toLocalDateString = (value: Date): string => {
  const year = value.getFullYear();
  const month = (value.getMonth() + 1).toString().padStart(2, "0");
  const day = value.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const calculateEventImpactValue = (
  event: {
    start_time: string | null;
    end_time: string | null;
    max_volunteer_count: number;
  },
  impact?: EventImpactRow
) => {
  if (!impact) return "";

  const start = timeToDecimal(event.start_time) ?? 0;
  const end = timeToDecimal(event.end_time);
  const duration = end ? Math.max(end - start, 0) : undefined;
  let amount = 0;
  let label = "";

  if (impact.is_individual_impact) {
    amount =
      Number.parseInt(impact.individual_impact_per_hour ?? "1", 10) *
      event.max_volunteer_count *
      (duration ?? 1);
    label = impact.individual_impact ?? "";
  }

  if (impact.is_group_impact) {
    amount =
      Number.parseInt(impact.group_impact_per_hour ?? "1", 10) *
      event.max_volunteer_count *
      (duration ?? 1);
    label = impact.group_impact ?? "";
  }

  if (!label) return "";

  const displayAmount = Number.isInteger(amount)
    ? amount.toString()
    : amount.toFixed(1);

  return `${displayAmount} ${label}`.trim();
};

const getJobTitleMap = async (userIds: string[]) => {
  if (!userIds.length) return new Map<string, string>();

  const { data, error } = await supabase
    .from("user_job_experiences")
    .select("user_id, job_title, start_date")
    .in("user_id", userIds)
    .order("start_date", { ascending: false, nullsFirst: false });

  if (error) throw error;

  const jobTitleMap = new Map<string, string>();
  (data ?? []).forEach((row) => {
    if (!jobTitleMap.has(row.user_id) && row.job_title) {
      jobTitleMap.set(row.user_id, row.job_title);
    }
  });

  return jobTitleMap;
};

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

const getRosterAdminUserIds = async (entityId: string): Promise<string[]> => {
  const { data: rosters, error: rostersError } = await supabase
    .from("rosters")
    .select("id")
    .eq("roster_owner_id", entityId);

  if (rostersError) throw rostersError;

  const rosterIds = (rosters ?? []).map((roster) => roster.id);
  if (!rosterIds.length) return [];

  const { data: members, error: membersError } = await supabase
    .from("roster_members")
    .select("user_id")
    .in("roster_id", rosterIds)
    .eq("is_admin", true);

  if (membersError) throw membersError;

  return Array.from(new Set((members ?? []).map((member) => member.user_id)));
};

const buildShortEvents = async (events: EventRow[]): Promise<ShortEventState[]> => {
  if (!events.length) return [];

  const eventIds = events.map((event) => event.id);
  const ownerIds = Array.from(new Set(events.map((event) => event.event_owner_id)));
  const coordinatorIds = Array.from(
    new Set(
      events
        .map((event) => event.event_coordinator_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  const [addressesRes, impactsRes, signupRowsRes, owners, coordinators] =
    await Promise.all([
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
      supabase
        .rpc("get_event_signup_volunteers", { event_ids: eventIds }),
      getProfilesByIds(ownerIds),
      getProfilesByIds(coordinatorIds),
    ]);

  if (addressesRes.error) throw addressesRes.error;
  if (impactsRes.error) throw impactsRes.error;
  if (signupRowsRes.error) throw signupRowsRes.error;

  const addressMap = new Map<string, EventAddressRow>();
  (addressesRes.data ?? []).forEach((row) => addressMap.set(row.event_id, row));

  const impactMap = new Map<string, EventImpactRow>();
  (impactsRes.data ?? []).forEach((row) => impactMap.set(row.event_id, row));

  const ownerMap = new Map(owners.map((profile) => [profile.id, profile]));
  const coordinatorMap = new Map(
    coordinators.map((profile) => [profile.id, profile])
  );
  const signupUserIds = Array.from(
    new Set((signupRowsRes.data ?? []).map((signup) => signup.user_id))
  );
  const signupJobTitleMap = await getJobTitleMap(signupUserIds);
  const signupsByEvent = new Map<
    string,
    {
      id: string;
      user: SimpleUserInfo;
      eventId: string;
      status:
        | "volunteered"
        | "confirmed"
        | "passed"
        | "no_show"
        | "approved"
        | "denied";
      eventActionTimeStamp: string;
      checkInAt?: string;
      checkOutAt?: string;
      volunteerStartTime?: string;
      volunteerEndTime?: string;
      volunteerLocation?: string;
      volunteerImpact?: string;
    }[]
  >();

  (signupRowsRes.data ?? []).forEach((signup) => {
    const signupUser = mapSignupVolunteerToSimpleUser(signup);
    signupUser.jobTitle = signupJobTitleMap.get(signup.user_id);

    const eventSignups = signupsByEvent.get(signup.event_id) ?? [];
    eventSignups.push({
      id: signup.id,
      user: signupUser,
      eventId: signup.event_id,
      status: signup.status as
        | "volunteered"
        | "confirmed"
        | "passed"
        | "no_show"
        | "approved"
        | "denied",
      eventActionTimeStamp: signup.event_action_timestamp,
      checkInAt: signup.check_in_at ?? undefined,
      checkOutAt: signup.check_out_at ?? undefined,
      volunteerStartTime: signup.volunteer_start_time ?? undefined,
      volunteerEndTime: signup.volunteer_end_time ?? undefined,
      volunteerLocation: signup.volunteer_location ?? undefined,
      volunteerImpact: signup.volunteer_impact ?? undefined,
    });
    signupsByEvent.set(signup.event_id, eventSignups);
  });

  return events.map((event) => {
    const coordinatorId = event.event_coordinator_id;
    const eventSignups = signupsByEvent.get(event.id) ?? [];

    return {
      id: event.id,
      eventOwner: toSimpleUser(ownerMap.get(event.event_owner_id), event.event_owner_id),
      eventCoordinator: coordinatorId
        ? toSimpleUser(coordinatorMap.get(coordinatorId), coordinatorId)
        : undefined,
      eventName: event.event_name,
      eventDate: event.event_date,
      startTime: timeToDecimal(event.start_time) ?? 0,
      endTime: timeToDecimal(event.end_time),
      maxVolunteerCount: event.max_volunteer_count,
      eventCoverPhoto: event.event_cover_photo_url ?? "",
      eventDescription: event.event_description ?? "",
      volunteerImpact: mapImpactRow(impactMap.get(event.id)),
      eventAddress: mapAddressRow(addressMap.get(event.id)),
      signups: eventSignups,
    };
  });
};

export const getShortEventsByIds = async (eventIds: string[]): Promise<ShortEventState[]> => {
  if (!eventIds.length) return [];
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, event_owner_id, event_name, event_description, event_date, start_time, end_time, is_followers_only, max_volunteer_count, event_cover_photo_url, event_coordinator_id"
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
    .is("event_id", null)
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
      event_id: null,
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
    events_created: Math.max(0, existing.events_created + (fields.events_created ?? 0)),
    events_attended: Math.max(0, existing.events_attended + (fields.events_attended ?? 0)),
    events_passed: Math.max(0, existing.events_passed + (fields.events_passed ?? 0)),
    events_coordinated: Math.max(
      0,
      existing.events_coordinated + (fields.events_coordinated ?? 0)
    ),
    hours_volunteered: Math.max(
      0,
      Number(existing.hours_volunteered ?? 0) + (fields.hours_volunteered ?? 0)
    ),
  };

  const { error } = await supabase
    .from("impact")
    .update(updated)
    .eq("id", existing.id);

  if (error) throw error;
};

const getHoursBetweenTimestamps = (start?: string | null, end?: string | null) => {
  if (!start || !end) return 0;

  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return 0;
  }

  return Math.max((endTime - startTime) / 3600000, 0);
};

const ensureApprovedVolunteerImpact = async (
  eventId: string,
  userId: string
): Promise<void> => {
  const { data: signup, error: signupError } = await supabase
    .from("event_signups")
    .select("check_in_at, check_out_at")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .eq("status", "approved")
    .not("check_in_at", "is", null)
    .not("check_out_at", "is", null)
    .order("event_action_timestamp", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (signupError) throw signupError;
  if (!signup) return;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw profileError ?? new Error("Volunteer profile not found");
  }

  const hoursVolunteered = getHoursBetweenTimestamps(
    signup.check_in_at,
    signup.check_out_at
  );
  const { data: existingImpact, error: existingImpactError } = await supabase
    .from("impact")
    .select("id")
    .eq("impact_owner_id", userId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (existingImpactError) throw existingImpactError;

  if (existingImpact) {
    const { error: updateError } = await supabase
      .from("impact")
      .update({
        user_type: profile.user_type,
        events_attended: 1,
        hours_volunteered: hoursVolunteered,
      })
      .eq("id", existingImpact.id);

    if (updateError) throw updateError;
    return;
  }

  const { error: insertError } = await supabase.from("impact").insert({
    impact_owner_id: userId,
    user_type: profile.user_type,
    event_id: eventId,
    events_created: 0,
    events_attended: 1,
    events_passed: 0,
    events_coordinated: 0,
    hours_volunteered: hoursVolunteered,
  });

  if (insertError) throw insertError;
};

const syncApprovedVolunteerImpactSummary = async (
  userId: string
): Promise<void> => {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw profileError ?? new Error("Volunteer profile not found");
  }

  const { data: approvedImpacts, error: impactError } = await supabase
    .from("impact")
    .select("hours_volunteered, events_attended")
    .eq("impact_owner_id", userId)
    .not("event_id", "is", null)
    .gt("events_attended", 0);

  if (impactError) throw impactError;

  const summary = (approvedImpacts ?? []).reduce(
    (totals, impact) => ({
      eventsAttended:
        totals.eventsAttended + Number(impact.events_attended ?? 0),
      hoursVolunteered:
        totals.hoursVolunteered + Number(impact.hours_volunteered ?? 0),
    }),
    { eventsAttended: 0, hoursVolunteered: 0 }
  );

  const { data: existingSummary, error: summaryError } = await supabase
    .from("impact")
    .select("id")
    .eq("impact_owner_id", userId)
    .is("event_id", null)
    .maybeSingle();

  if (summaryError) throw summaryError;

  if (existingSummary) {
    const { error: updateError } = await supabase
      .from("impact")
      .update({
        events_attended: summary.eventsAttended,
        hours_volunteered: summary.hoursVolunteered,
      })
      .eq("id", existingSummary.id);

    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabase.from("impact").insert({
      impact_owner_id: userId,
      user_type: profile.user_type,
      event_id: null,
      events_created: 0,
      events_attended: summary.eventsAttended,
      events_passed: 0,
      events_coordinated: 0,
      hours_volunteered: summary.hoursVolunteered,
    });

    if (insertError) throw insertError;
  }

  const { error: detailsError } = await supabase.from("user_details").upsert(
    {
      user_id: userId,
      volunteer_hours: summary.hoursVolunteered,
    },
    { onConflict: "user_id" }
  );

  if (detailsError) throw detailsError;
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

  let eventsQuery = supabase
    .from("events")
    .select(
      "id, event_owner_id, event_name, event_description, event_date, start_time, end_time, is_followers_only, max_volunteer_count, event_cover_photo_url, event_coordinator_id"
    )
    .order("event_date", { ascending: true });

  eventsQuery = isIndividual
    ? eventsQuery.neq("event_owner_id", userId)
    : eventsQuery.or(`event_owner_id.eq.${userId},event_coordinator_id.eq.${userId}`);

  const { data: events, error } = await eventsQuery;

  if (error) throw error;

  let filteredEvents = events ?? [];

  if (isIndividual) {
    const [
      { data: signups },
      { data: following },
      { data: memberships },
      { data: savedOrganizations },
      { data: staffEntries },
    ] = await Promise.all([
      supabase
        .from("event_signups")
        .select("event_id, status")
        .eq("user_id", userId),
      supabase.from("follows").select("following_id").eq("follower_id", userId),
      supabase
        .from("roster_members")
        .select("roster_id, is_admin")
        .eq("user_id", userId),
      supabase
        .from("user_organizations")
        .select("parent_organization_id")
        .eq("user_id", userId),
      supabase.from("entity_staff").select("entity_id").eq("user_id", userId),
    ]);

    const blockedEventIds = new Set(
      (signups ?? [])
        .filter((row) =>
          ["volunteered", "confirmed", "approved", "no_show"].includes(row.status)
        )
        .map((row) => row.event_id)
    );

    const rosterIds = (memberships ?? []).map((row) => row.roster_id);
    const adminRosterIds = (memberships ?? [])
      .filter((row) => row.is_admin)
      .map((row) => row.roster_id);
    const { data: memberRosters, error: memberRostersError } = rosterIds.length
      ? await supabase
          .from("rosters")
          .select("roster_owner_id, roster_name")
          .in("id", rosterIds)
      : { data: [], error: null };
    const { data: adminRosters, error: adminRostersError } =
      adminRosterIds.length
        ? await supabase
            .from("rosters")
            .select("roster_owner_id, roster_name")
            .in("id", adminRosterIds)
        : { data: [], error: null };

    if (memberRostersError) throw memberRostersError;
    if (adminRostersError) throw adminRostersError;

    const memberEntityIds = new Set(
      [
        ...((memberRosters ?? [])
          .filter((row) => row.roster_name !== "Followers")
          .map((row) => row.roster_owner_id)),
        ...((savedOrganizations ?? [])
          .map((row) => row.parent_organization_id)
        .filter(Boolean) as string[]),
      ]
    );
    const adminEntityIds = new Set(
      (adminRosters ?? [])
        .filter((row) => row.roster_name !== "Followers")
        .map((row) => row.roster_owner_id)
    );
    const affiliatedEntityIds = new Set<string>([
      ...((following ?? []).map((row) => row.following_id)),
      ...memberEntityIds,
      ...((staffEntries ?? []).map((row) => row.entity_id)),
    ]);

    filteredEvents = filteredEvents.filter((event) => {
      if (event.event_coordinator_id === userId) return true;
      if (adminEntityIds.has(event.event_owner_id)) return true;
      if (blockedEventIds.has(event.id)) return false;
      if (memberEntityIds.has(event.event_owner_id)) return true;
      if (affiliatedEntityIds.has(event.event_owner_id)) return true;
      if (event.is_followers_only) return false;
      return true;
    });
  }

  return buildShortEvents(filteredEvents as EventRow[]);
};

export const getEntityEventCounts = async (
  entityId: string
): Promise<EntityEventCounts> => {
  const { data, error } = await supabase
    .from("events")
    .select("event_date, start_time, end_time")
    .eq("event_owner_id", entityId);

  if (error) throw error;

  const now = new Date();

  return (data ?? []).reduce<EntityEventCounts>(
    (counts, event) => {
      const eventEnd = parseEventDateTimeAsLocalDate(
        event.event_date,
        Number(event.end_time ?? 0)
      );

      // Completed: only events that have ended (past events)
      // Upcoming: events that haven't ended yet (future or in progress)
      if (eventEnd < now) {
        counts.completedProjectsCount += 1;
      } else {
        counts.upcomingProjectsCount += 1;
      }

      return counts;
    },
    { upcomingProjectsCount: 0, completedProjectsCount: 0 }
  );
};

export const getEntityUpcomingEvents = async (
  entityId: string
): Promise<ShortEventState[]> => {
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, event_owner_id, event_name, event_description, event_date, start_time, end_time, is_followers_only, max_volunteer_count, event_cover_photo_url, event_coordinator_id"
    )
    .eq("event_owner_id", entityId)
    .gte("event_date", toLocalDateString(new Date()))
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;

  return buildShortEvents((data ?? []) as EventRow[]);
};

export const getRosterAdminEvents = async (): Promise<ShortEventState[]> => {
  await ensureUserId();
  const { data: events, error: eventsError } = await supabase.rpc(
    "get_roster_admin_events"
  );

  if (eventsError) throw eventsError;

  return buildShortEvents((events ?? []) as EventRow[]);
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
  ]);

  if (addressRes.error) throw addressRes.error;
  if (requirementsRes.error) throw requirementsRes.error;
  if (impactsRes.error) throw impactsRes.error;

  const ownerProfile = ownerProfiles[0];
  const coordinatorProfile = coordinatorProfiles[0];
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
    signups: [],
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

  const rosterAdminUserIds = await getRosterAdminUserIds(eventOwnerId);

  if (rosterAdminUserIds.length) {
    const adminSignupResults = await Promise.all(
      rosterAdminUserIds.map((adminUserId) =>
        supabase.rpc("manage_event_signup_check_time", {
          target_event_id: event.id,
          target_user_id: adminUserId,
          check_action: "add_volunteer",
        })
      )
    );

    adminSignupResults.forEach((result) => {
      if (result.error) throw result.error;
    });
  }

  await incrementImpact(eventOwnerId, { events_created: 1 });

  return {
    eventName: event.event_name,
    eventDate: event.event_date,
    startTime: timeToDecimal(event.start_time) ?? 0,
    endTime: timeToDecimal(event.end_time),
  };
};

export const updateEventTime = async ({
  eventId,
  eventDate,
  startTime,
  endTime,
}: {
  eventId: string;
  eventDate: string;
  startTime: number;
  endTime?: number;
}): Promise<void> => {
  const userId = await ensureUserId();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("event_owner_id, event_coordinator_id")
    .eq("id", eventId)
    .single();

  if (eventError || !event) throw eventError ?? new Error("Event not found");

  let canEdit =
    event.event_owner_id === userId || event.event_coordinator_id === userId;

  if (!canEdit) {
    const { data: rosters, error: rosterError } = await supabase
      .from("rosters")
      .select("id")
      .eq("roster_owner_id", event.event_owner_id);

    if (rosterError) throw rosterError;

    const rosterIds = (rosters ?? []).map((roster) => roster.id);
    if (rosterIds.length) {
      const { data: adminMembership, error: adminError } = await supabase
        .from("roster_members")
        .select("user_id")
        .eq("user_id", userId)
        .eq("is_admin", true)
        .in("roster_id", rosterIds)
        .limit(1)
        .maybeSingle();

      if (adminError) throw adminError;
      canEdit = Boolean(adminMembership);
    }
  }

  if (!canEdit) {
    throw new Error("You do not have permission to edit this event");
  }

  const { error: updateError } = await supabase
    .from("events")
    .update({
      event_date: toDatabaseDateString(eventDate),
      start_time: decimalToTimeString(startTime),
      end_time: decimalToTimeString(endTime),
    })
    .eq("id", eventId);

  if (updateError) throw updateError;
};

const ensureCanEditEvent = async (eventId: string) => {
  const userId = await ensureUserId();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("event_owner_id, event_coordinator_id")
    .eq("id", eventId)
    .single();

  if (eventError || !event) throw eventError ?? new Error("Event not found");

  let canEdit =
    event.event_owner_id === userId || event.event_coordinator_id === userId;

  if (!canEdit) {
    const { data: rosters, error: rosterError } = await supabase
      .from("rosters")
      .select("id")
      .eq("roster_owner_id", event.event_owner_id);

    if (rosterError) throw rosterError;

    const rosterIds = (rosters ?? []).map((roster) => roster.id);
    if (rosterIds.length) {
      const { data: adminMembership, error: adminError } = await supabase
        .from("roster_members")
        .select("user_id")
        .eq("user_id", userId)
        .eq("is_admin", true)
        .in("roster_id", rosterIds)
        .limit(1)
        .maybeSingle();

      if (adminError) throw adminError;
      canEdit = Boolean(adminMembership);
    }
  }

  if (!canEdit) {
    throw new Error("You do not have permission to edit this event");
  }
};

export const updateEventDetails = async ({
  eventId,
  eventName,
  eventDescription,
  maxVolunteerCount,
  eventAddress,
  volunteerImpact,
}: EventEditableUpdate): Promise<void> => {
  await ensureCanEditEvent(eventId);

  const eventUpdates: {
    event_name?: string;
    event_description?: string;
    max_volunteer_count?: number;
  } = {};

  if (eventName !== undefined) eventUpdates.event_name = eventName;
  if (eventDescription !== undefined) {
    eventUpdates.event_description = eventDescription;
  }
  if (maxVolunteerCount !== undefined) {
    eventUpdates.max_volunteer_count = maxVolunteerCount;
  }

  const updates = [];

  if (Object.keys(eventUpdates).length) {
    updates.push(supabase.from("events").update(eventUpdates).eq("id", eventId));
  }

  if (eventAddress) {
    updates.push(
      supabase.from("event_addresses").upsert(
        {
          event_id: eventId,
          location_name: eventAddress.locationName ?? null,
          street_name: eventAddress.streetName ?? null,
          city: eventAddress.city ?? null,
          zip_code: eventAddress.zipCode ?? null,
        },
        { onConflict: "event_id" }
      )
    );
  }

  if (volunteerImpact) {
    updates.push(
      supabase.from("event_volunteer_impacts").upsert(
        {
          event_id: eventId,
          individual_impact: volunteerImpact.individualImpact ?? null,
          individual_impact_per_hour:
            volunteerImpact.individualImpactPerHour ?? null,
          group_impact: volunteerImpact.groupImpact ?? null,
          group_impact_per_hour: volunteerImpact.groupImpactPerHour ?? null,
          is_individual_impact: volunteerImpact.isIndividualImpact ?? false,
          is_group_impact: volunteerImpact.isGroupImpact ?? false,
        },
        { onConflict: "event_id" }
      )
    );
  }

  const results = await Promise.all(updates);
  results.forEach((result) => {
    if (result.error) throw result.error;
  });
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw error;
};

export const volunteerForEvent = async (eventId: string): Promise<void> => {
  const userId = await ensureUserId();

  const { data: existing, error: existingError } = await supabase
    .from("event_signups")
    .select("id, status")
    .eq("event_id", eventId)
    .eq("user_id", userId);

  if (existingError) throw existingError;

  const passedSignups = (existing ?? []).filter(
    (signup) => signup.status === "passed"
  );

  if (passedSignups.length) {
    const { error } = await supabase
      .from("event_signups")
      .update({
        status: "volunteered",
        event_action_timestamp: new Date().toISOString(),
      })
      .in("id", passedSignups.map((signup) => signup.id));

    if (error) throw error;
    return;
  }

  if ((existing ?? []).length > 0) {
    throw new Error("You have already volunteered for this event");
  }

  const { error } = await supabase.from("event_signups").insert({
    event_id: eventId,
    user_id: userId,
    status: "volunteered",
  });

  if (error) throw error;
};

export const passOnEvent = async (eventId: string): Promise<void> => {
  const userId = await ensureUserId();

  const { data: existingSignups, error: existingError } = await supabase
    .from("event_signups")
    .select("id, status")
    .match({ event_id: eventId, user_id: userId });

  if (existingError) throw existingError;

  const activeSignups = (existingSignups ?? []).filter(
    (signup) => signup.status !== "passed"
  );

  if ((existingSignups ?? []).length > 0) {
    if (!activeSignups.length) {
      throw new Error("You have already passed this event");
    }

    const passedAt = new Date().toISOString();
    const activeSignupIds = activeSignups.map((signup) => signup.id);
    const { error } = await supabase
      .from("event_signups")
      .update({
        status: "passed",
        check_in_at: null,
        check_out_at: null,
        event_action_timestamp: passedAt,
      })
      .in("id", activeSignupIds);

    if (error) throw error;

    await incrementImpact(userId, { events_passed: 1 });
    return;
  }

  const { error } = await supabase.from("event_signups").insert({
    event_id: eventId,
    user_id: userId,
    status: "passed",
  });

  if (error) throw error;

  await incrementImpact(userId, { events_passed: 1 });
};

type EventSignupAction = {
  eventId: string;
  userId?: string;
};

const normalizeEventSignupAction = (
  action: string | EventSignupAction
): Required<EventSignupAction> => ({
  eventId: typeof action === "string" ? action : action.eventId,
  userId: typeof action === "string" ? "" : action.userId ?? "",
});

export const checkInForEvent = async (
  action: string | EventSignupAction
): Promise<void> => {
  const userId = await ensureUserId();
  const { eventId, userId: targetUserIdFromAction } =
    normalizeEventSignupAction(action);
  const targetUserId = targetUserIdFromAction || userId;

  const { error } = await supabase.rpc("manage_event_signup_check_time", {
    target_event_id: eventId,
    target_user_id: targetUserId,
    check_action: "check_in",
  });

  if (error) throw error;
};

export const checkOutFromEvent = async (
  action: string | EventSignupAction
): Promise<void> => {
  const userId = await ensureUserId();
  const { eventId, userId: targetUserIdFromAction } =
    normalizeEventSignupAction(action);
  const targetUserId = targetUserIdFromAction || userId;

  const { error } = await supabase.rpc("manage_event_signup_check_time", {
    target_event_id: eventId,
    target_user_id: targetUserId,
    check_action: "check_out",
  });

  if (error) throw error;
};

export const markNoShowForEvent = async (
  action: EventSignupAction
): Promise<void> => {
  await ensureUserId();

  if (!action.userId) {
    throw new Error("Volunteer is required");
  }

  const { error } = await supabase.rpc("manage_event_signup_check_time", {
    target_event_id: action.eventId,
    target_user_id: action.userId,
    check_action: "no_show",
  });

  if (error) throw error;
};

export const addEventVolunteer = async (
  action: EventSignupAction
): Promise<void> => {
  await ensureUserId();

  if (!action.userId) {
    throw new Error("Volunteer is required");
  }

  const { error } = await supabase.rpc("manage_event_signup_check_time", {
    target_event_id: action.eventId,
    target_user_id: action.userId,
    check_action: "add_volunteer",
  });

  if (error) throw error;
};

export const approveEventVolunteer = async (
  action: EventSignupAction
): Promise<void> => {
  await ensureUserId();

  if (!action.userId) {
    throw new Error("Volunteer is required");
  }

  const { error } = await supabase.rpc("manage_event_signup_check_time", {
    target_event_id: action.eventId,
    target_user_id: action.userId,
    check_action: "approve",
  });

  if (error) throw error;

  await ensureApprovedVolunteerImpact(action.eventId, action.userId);
  await syncApprovedVolunteerImpactSummary(action.userId);
};

export const denyEventVolunteer = async (
  action: EventSignupAction
): Promise<void> => {
  await ensureUserId();

  if (!action.userId) {
    throw new Error("Volunteer is required");
  }

  const { error } = await supabase.rpc("deny_event_volunteer_as_no_show", {
    target_event_id: action.eventId,
    target_user_id: action.userId,
  });

  if (error) throw error;
};

export const approveAllEventVolunteers = async (
  eventId: string
): Promise<void> => {
  await ensureUserId();

  const { error } = await supabase.rpc("approve_all_event_volunteers", {
    target_event_id: eventId,
  });

  if (error) throw error;

  const { data: approvedSignups, error: approvedSignupsError } = await supabase
    .from("event_signups")
    .select("user_id")
    .eq("event_id", eventId)
    .eq("status", "approved");

  if (approvedSignupsError) throw approvedSignupsError;

  await Promise.all(
    (approvedSignups ?? []).map((signup) =>
      ensureApprovedVolunteerImpact(eventId, signup.user_id)
    )
  );

  await Promise.all(
    Array.from(new Set((approvedSignups ?? []).map((signup) => signup.user_id))).map(
      (userId) => syncApprovedVolunteerImpactSummary(userId)
    )
  );
};

export type EventSignupImpactDetails = {
  signupId: string;
  startTime: string;
  endTime: string;
  location: string;
  impact: string;
};

export const updateEventSignupImpactDetails = async ({
  signupId,
  startTime,
  endTime,
  location,
  impact,
}: EventSignupImpactDetails): Promise<void> => {
  const { error } = await supabase.rpc("update_event_signup_impact_details", {
    target_signup_id: signupId,
    volunteer_start_time_value: startTime,
    volunteer_end_time_value: endTime,
    volunteer_location_value: location,
    volunteer_impact_value: impact,
  });

  if (error) throw error;
};

export const unvolunteerFromEvent = async (eventId: string): Promise<void> => {
  const userId = await ensureUserId();

  const [{ data: existingSignups, error: signupError }, { data: event, error: eventError }] =
    await Promise.all([
      supabase
        .from("event_signups")
        .select("id, status")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .in("status", ["volunteered", "confirmed"]),
      supabase
        .from("events")
        .select("start_time, end_time")
        .eq("id", eventId)
        .single(),
    ]);

  if (signupError) throw signupError;
  if (eventError || !event) throw eventError ?? new Error("Event not found");

  const signupIds = (existingSignups ?? []).map((signup) => signup.id);

  if (!signupIds.length) {
    return;
  }

  const { error } = await supabase.from("event_signups").delete().in("id", signupIds);

  if (error) throw error;

  const start = timeToDecimal(event.start_time) ?? 0;
  const end = timeToDecimal(event.end_time);
  const hours = end ? Math.max(end - start, 0) : 0;

  await incrementImpact(userId, { events_attended: -1, hours_volunteered: -hours });
};

export const getSignedUpEvents = async (
  when: "upcoming" | "past" | undefined
): Promise<UserEventSignups[]> => {
  const userId = await ensureUserId();
  const { data: signups, error } = await supabase
    .from("event_signups")
    .select("event_id, status, event_action_timestamp, check_in_at, check_out_at")
    .eq("user_id", userId)
    .in("status", ["volunteered", "confirmed", "approved", "no_show"]);

  if (error) throw error;

  const eventIds = Array.from(new Set((signups ?? []).map((row) => row.event_id)));

  if (!eventIds.length) return [];

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select(
      "id, event_owner_id, event_name, event_description, event_date, start_time, end_time, is_followers_only, max_volunteer_count, event_cover_photo_url, event_coordinator_id"
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
      const eventDate = parseEventDateAsLocalDate(event.event_date);
      const eventEndTime = timeToDecimal(event.end_time);
      const hasEventEnded =
        eventEndTime !== undefined
          ? new Date() >
            parseEventDateTimeAsLocalDate(event.event_date, eventEndTime)
          : eventDate < startOfToday;

      return when === "past"
        ? hasEventEnded
        : !hasEventEnded;
    });
  }

  const shortEvents = await buildShortEvents(filteredEvents as EventRow[]);
  const eventMap = new Map(shortEvents.map((event) => [event.id, event]));

  const profile = (await getProfilesByIds([userId]))[0];
  const signedUpUser = toSimpleUser(profile, userId);
  const signupCountMap = await getSignupCounts(filteredEvents.map((event) => event.id));

  const latestSignupByEvent = new Map<
    string,
    {
      event_id: string;
      status: string;
      event_action_timestamp: string;
      check_in_at: string | null;
      check_out_at: string | null;
    }
  >();

  (signups ?? []).forEach((signup) => {
    if (!eventMap.has(signup.event_id)) {
      return;
    }

    const existingSignup = latestSignupByEvent.get(signup.event_id);

    if (
      !existingSignup ||
      new Date(signup.event_action_timestamp).getTime() >
      new Date(existingSignup.event_action_timestamp).getTime()
    ) {
      latestSignupByEvent.set(signup.event_id, signup);
    }
  });

  return Array.from(latestSignupByEvent.values()).map((signup) => ({
    event: eventMap.get(signup.event_id) as ShortEventState,
    signedUpUser,
    eventActionTimeStamp: signup.event_action_timestamp,
    status: signup.status as
      | "volunteered"
      | "confirmed"
      | "passed"
      | "no_show"
      | "approved"
      | "denied",
    checkInAt: signup.check_in_at ?? undefined,
    checkOutAt: signup.check_out_at ?? undefined,
    signupCount: signupCountMap.get(signup.event_id) ?? 0,
  }));
};

export const getVolunteerMatches = async (): Promise<VolunteerMatch[]> => {
  const entityId = await ensureUserId();

  const { data: nextEvent, error: nextEventError } = await supabase
    .from("events")
    .select("id, event_name, event_date, start_time, end_time, max_volunteer_count")
    .eq("event_owner_id", entityId)
    .gte("event_date", toLocalDateString(new Date()))
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (nextEventError) throw nextEventError;

  const { data: nextEventImpact, error: nextEventImpactError } = nextEvent
    ? await supabase
        .from("event_volunteer_impacts")
        .select(
          "event_id, individual_impact, individual_impact_per_hour, group_impact, group_impact_per_hour, is_individual_impact, is_group_impact"
        )
        .eq("event_id", nextEvent.id)
        .maybeSingle()
    : { data: null, error: null };

  if (nextEventImpactError) throw nextEventImpactError;

  const nextEventMatch = nextEvent
    ? {
        id: nextEvent.id,
        eventName: nextEvent.event_name,
        impactValue: calculateEventImpactValue(
          nextEvent,
          nextEventImpact ?? undefined
        ),
      }
    : undefined;

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
      .select("user_id, emergency_contact_name, emergency_contact_phone, emergency_contact_email, emergency_contact_relation")
      .in("user_id", profileIds),
    supabase
      .from("impact")
      .select("impact_owner_id, hours_volunteered, events_attended")
      .in("impact_owner_id", profileIds)
      .is("event_id", null),
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
        email: details?.emergency_contact_email ?? "",
        relation: details?.emergency_contact_relation ?? "",
      },
      nextEvent: nextEventMatch,
      volunteerSummary: {
        hoursVolunteered: Number(impact?.hours_volunteered ?? 0),
        volunteerValue: Number(impact?.hours_volunteered ?? 0) * 33.49,
        eventsAttended: impact?.events_attended ?? 0,
      },
    };
  });
};
