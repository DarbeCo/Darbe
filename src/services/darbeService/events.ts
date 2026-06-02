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
import { getVolunteerValuePerHour } from "./volunteerValue";
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
  event_photo_visibility: "public" | "private" | null;
  event_coordinator_id: string;
  roster_id: string | null;
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

const hasEventEnded = (
  event: Pick<EventRow, "event_date" | "end_time">,
  now = new Date()
) => {
  const eventDate = parseEventDateAsLocalDate(event.event_date);
  const eventEndTime = timeToDecimal(event.end_time);

  if (eventEndTime !== undefined) {
    return now > parseEventDateTimeAsLocalDate(event.event_date, eventEndTime);
  }

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  return eventDate < startOfToday;
};

const getVisibleInternalEventOwnerIds = async (
  userId: string
): Promise<Set<string>> => {
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.user_type === "organization" || profile?.user_type === "nonprofit") {
    return new Set([userId]);
  }

  const [
    { data: memberships, error: membershipsError },
    { data: savedOrganizations, error: savedOrganizationsError },
    { data: staffEntries, error: staffEntriesError },
  ] = await Promise.all([
    supabase.from("roster_members").select("roster_id").eq("user_id", userId),
    supabase
      .from("user_organizations")
      .select("parent_organization_id")
      .eq("user_id", userId),
    supabase.from("entity_staff").select("entity_id").eq("user_id", userId),
  ]);

  if (membershipsError) throw membershipsError;
  if (savedOrganizationsError) throw savedOrganizationsError;
  if (staffEntriesError) throw staffEntriesError;

  const rosterIds = (memberships ?? []).map((membership) => membership.roster_id);
  const { data: rosters, error: rostersError } = rosterIds.length
    ? await supabase
        .from("rosters")
        .select("roster_owner_id, roster_name")
        .in("id", rosterIds)
    : { data: [], error: null };

  if (rostersError) throw rostersError;

  return new Set(
    [
      ...((rosters ?? [])
        .filter((roster) => roster.roster_name !== "Followers")
        .map((roster) => roster.roster_owner_id)),
      ...((savedOrganizations ?? [])
        .map((organization) => organization.parent_organization_id)
        .filter(Boolean) as string[]),
      ...((staffEntries ?? []).map((staffEntry) => staffEntry.entity_id)),
    ].filter(Boolean)
  );
};

const filterInternalEventsForViewer = async <T extends { event_owner_id: string; is_followers_only?: boolean | null }>(
  events: T[],
  userId: string
): Promise<T[]> => {
  const internalEventOwnerIds = await getVisibleInternalEventOwnerIds(userId);

  return events.filter(
    (event) =>
      !event.is_followers_only || internalEventOwnerIds.has(event.event_owner_id)
  );
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
      Number(impact.individual_impact_per_hour ?? "1") *
      event.max_volunteer_count *
      (duration ?? 1);
    label = impact.individual_impact ?? "";
  }

  if (impact.is_group_impact) {
    amount =
      Number(impact.group_impact_per_hour ?? "1") *
      event.max_volunteer_count *
      (duration ?? 1);
    label = impact.group_impact ?? "";
  }

  if (!label) return "";

  const displayAmount = Number.isInteger(amount)
    ? amount.toString()
    : amount.toFixed(2);

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

const buildShortEvents = async (
  events: EventRow[],
  invitationByEventId = new Map<string, SimpleUserInfo>()
): Promise<ShortEventState[]> => {
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
  const invitedByEntityIds = Array.from(
    new Set(
      (signupRowsRes.data ?? [])
        .map((signup) => signup.invited_by_entity_id)
        .filter((id): id is string => Boolean(id))
    )
  );
  const invitationRemovedByIds = Array.from(
    new Set(
      (signupRowsRes.data ?? [])
        .map((signup) => signup.invitation_removed_by)
        .filter((id): id is string => Boolean(id))
    )
  );
  const [
    signupJobTitleMap,
    invitedByEntityProfiles,
    invitationRemovedByProfiles,
  ] = await Promise.all([
    getJobTitleMap(signupUserIds),
    getProfilesByIds(invitedByEntityIds),
    getProfilesByIds(invitationRemovedByIds),
  ]);
  const invitedByEntityMap = new Map(
    invitedByEntityProfiles.map((profile) => [
      profile.id,
      mapProfileToSimpleUserInfo(profile),
    ])
  );
  const invitationRemovedByMap = new Map(
    invitationRemovedByProfiles.map((profile) => [
      profile.id,
      mapProfileToSimpleUserInfo(profile),
    ])
  );
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
      invitedByEntity?: SimpleUserInfo;
      invitationRemovedAt?: string;
      invitationRemovedBy?: SimpleUserInfo;
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
      invitedByEntity: signup.invited_by_entity_id
        ? invitedByEntityMap.get(signup.invited_by_entity_id)
        : undefined,
      invitationRemovedAt: signup.invitation_removed_at ?? undefined,
      invitationRemovedBy: signup.invitation_removed_by
        ? invitationRemovedByMap.get(signup.invitation_removed_by)
        : undefined,
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
      invitationFrom: invitationByEventId.get(event.id),
      rosterId: event.roster_id ?? undefined,
      isFollowersOnly: event.is_followers_only ?? false,
      eventName: event.event_name,
      eventDate: event.event_date,
      startTime: timeToDecimal(event.start_time) ?? 0,
      endTime: timeToDecimal(event.end_time),
      maxVolunteerCount: event.max_volunteer_count,
      eventCoverPhoto: event.event_cover_photo_url ?? "",
      eventPhotoVisibility: event.event_photo_visibility ?? "public",
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
      "id, event_owner_id, roster_id, event_name, event_description, event_date, start_time, end_time, is_followers_only, max_volunteer_count, event_cover_photo_url, event_photo_visibility, event_coordinator_id"
    )
    .in("id", eventIds);

  if (error) throw error;
  return buildShortEvents((data ?? []) as EventRow[]);
};

const getInvitationByEventIdForUser = async (
  userId: string,
  eventIds?: string[]
) => {
  const scopedEventIds = eventIds?.filter(Boolean) ?? [];

  const directRecommendationsQuery = supabase
    .from("event_recommendations")
    .select("event_id, recommender_entity_id")
    .eq("recipient_user_id", userId);

  if (scopedEventIds.length) {
    directRecommendationsQuery.in("event_id", scopedEventIds);
  }

  const [
    { data: directRecommendations, error: directRecommendationsError },
    { data: savedOrganizations, error: savedOrganizationsError },
    { data: memberships, error: membershipsError },
  ] = await Promise.all([
    directRecommendationsQuery,
    supabase
      .from("user_organizations")
      .select("parent_organization_id")
      .eq("user_id", userId),
    supabase
      .from("roster_members")
      .select("roster_id")
      .eq("user_id", userId),
  ]);

  if (directRecommendationsError) throw directRecommendationsError;
  if (savedOrganizationsError) throw savedOrganizationsError;
  if (membershipsError) throw membershipsError;

  const rosterIds = (memberships ?? []).map((membership) => membership.roster_id);
  const { data: memberRosters, error: memberRostersError } = rosterIds.length
    ? await supabase
        .from("rosters")
        .select("roster_owner_id, roster_name")
        .in("id", rosterIds)
    : { data: [], error: null };

  if (memberRostersError) throw memberRostersError;

  const memberEntityIds = Array.from(
    new Set([
      ...((savedOrganizations ?? [])
        .map((organization) => organization.parent_organization_id)
        .filter(Boolean) as string[]),
      ...((memberRosters ?? [])
        .filter((roster) => roster.roster_name !== "Followers")
        .map((roster) => roster.roster_owner_id)),
    ])
  );

  let entityRecommendations:
    | { event_id: string; recommender_entity_id: string }[]
    | null = [];

  if (memberEntityIds.length) {
    const entityRecommendationsQuery = supabase
      .from("event_recommendations")
      .select("event_id, recommender_entity_id")
      .is("recipient_user_id", null)
      .in("recommender_entity_id", memberEntityIds);

    if (scopedEventIds.length) {
      entityRecommendationsQuery.in("event_id", scopedEventIds);
    }

    const { data, error } = await entityRecommendationsQuery;
    if (error) throw error;
    entityRecommendations = data;
  }

  const recommendations = [
    ...(directRecommendations ?? []),
    ...(entityRecommendations ?? []),
  ];
  const recommenderIds = Array.from(
    new Set(recommendations.map((row) => row.recommender_entity_id))
  );
  const recommenderProfiles = await getProfilesByIds(recommenderIds);
  const recommenderMap = new Map(
    recommenderProfiles.map((profile) => [
      profile.id,
      mapProfileToSimpleUserInfo(profile),
    ])
  );
  const invitationByEventId = new Map<string, SimpleUserInfo>();

  recommendations.forEach((recommendation) => {
    const recommender = recommenderMap.get(recommendation.recommender_entity_id);

    if (recommender) {
      invitationByEventId.set(recommendation.event_id, recommender);
    }
  });

  return invitationByEventId;
};

type EventAdminEntityAccess = {
  entityId: string;
  canEditInternalEvents: boolean;
  canEditExternalEvents: boolean;
};

const getEventAdminEntityAccessForUser = async (
  userId: string
): Promise<EventAdminEntityAccess[]> => {
  const { data: memberships, error: membershipsError } = await supabase
    .from("roster_members")
    .select("roster_id, can_edit_internal_events, can_edit_external_events")
    .eq("user_id", userId)
    .eq("is_admin", true);

  if (membershipsError) throw membershipsError;

  const eventAdminMemberships = (memberships ?? []).filter(
    (membership) =>
      membership.can_edit_internal_events || membership.can_edit_external_events
  );
  const rosterIds = eventAdminMemberships.map((membership) => membership.roster_id);
  if (!rosterIds.length) return [];

  const { data: rosters, error: rostersError } = await supabase
    .from("rosters")
    .select("id, roster_owner_id")
    .in("id", rosterIds);

  if (rostersError) throw rostersError;

  const rosterOwnerByRosterId = new Map(
    (rosters ?? []).map((roster) => [roster.id, roster.roster_owner_id])
  );
  const accessByEntityId = new Map<string, EventAdminEntityAccess>();

  eventAdminMemberships.forEach((membership) => {
    const entityId = rosterOwnerByRosterId.get(membership.roster_id);

    if (!entityId) {
      return;
    }

    const currentAccess = accessByEntityId.get(entityId) ?? {
      entityId,
      canEditInternalEvents: false,
      canEditExternalEvents: false,
    };

    accessByEntityId.set(entityId, {
      entityId,
      canEditInternalEvents: Boolean(
        currentAccess.canEditInternalEvents ||
          membership.can_edit_internal_events
      ),
      canEditExternalEvents: Boolean(
        currentAccess.canEditExternalEvents ||
          membership.can_edit_external_events
      ),
    });
  });

  return Array.from(accessByEntityId.values());
};

const hasEventAdminPermission = async (
  entityId: string,
  userId: string,
  eventType: "internal" | "external"
) => {
  const entityAccess = await getEventAdminEntityAccessForUser(userId);
  const access = entityAccess.find((entity) => entity.entityId === entityId);

  return eventType === "internal"
    ? Boolean(access?.canEditInternalEvents)
    : Boolean(access?.canEditExternalEvents);
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
  const volunteerValuePerHour = await getVolunteerValuePerHour();
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
        volunteer_value_per_hour: volunteerValuePerHour,
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
    volunteer_value_per_hour: volunteerValuePerHour,
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
    .select("hours_volunteered, events_attended, volunteer_value_per_hour")
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

  const currentVolunteerValuePerHour = await getVolunteerValuePerHour();

  if (existingSummary) {
    const { error: updateError } = await supabase
      .from("impact")
      .update({
        events_attended: summary.eventsAttended,
        hours_volunteered: summary.hoursVolunteered,
        volunteer_value_per_hour: currentVolunteerValuePerHour,
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
      volunteer_value_per_hour: currentVolunteerValuePerHour,
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

export const getEvents = async (
  scope: "default" | "recommendable" = "default"
): Promise<ShortEventState[]> => {
  const userId = await ensureUserId();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", userId)
    .single();

  if (profileError || !profile) throw profileError ?? new Error("User not found");

  const isIndividual = profile.user_type === "individual";
  const isRecommendableEntityScope = !isIndividual && scope === "recommendable";

  let eventsQuery = supabase
    .from("events")
    .select(
      "id, event_owner_id, roster_id, event_name, event_description, event_date, start_time, end_time, is_followers_only, max_volunteer_count, event_cover_photo_url, event_photo_visibility, event_coordinator_id"
    )
    .order("event_date", { ascending: true });

  if (!isRecommendableEntityScope) {
    eventsQuery = isIndividual
      ? eventsQuery.neq("event_owner_id", userId)
      : eventsQuery.or(`event_owner_id.eq.${userId},event_coordinator_id.eq.${userId}`);
  }

  const { data: events, error } = await eventsQuery;

  if (error) throw error;

  let filteredEvents = (events ?? []) as EventRow[];
  const invitationByEventId = new Map<string, SimpleUserInfo>();

  if (isRecommendableEntityScope) {
    const [
      { data: passedRows, error: passedRowsError },
      { data: followingRows, error: followingRowsError },
      { data: recommendedRows, error: recommendedRowsError },
    ] = await Promise.all([
      supabase
        .from("event_signups")
        .select("event_id")
        .eq("user_id", userId)
        .eq("status", "passed"),
      supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId),
      supabase
        .from("event_recommendations")
        .select("event_id")
        .eq("recommender_entity_id", userId),
    ]);

    if (passedRowsError) throw passedRowsError;
    if (followingRowsError) throw followingRowsError;
    if (recommendedRowsError) throw recommendedRowsError;

    const passedEventIds = new Set(
      (passedRows ?? []).map((signup) => signup.event_id)
    );
    const recommendedEventIds = new Set(
      (recommendedRows ?? []).map((recommendation) => recommendation.event_id)
    );
    const followedEntityIds = new Set(
      (followingRows ?? []).map((follow) => follow.following_id)
    );
    const followedProfiles = await getProfilesByIds(Array.from(followedEntityIds));
    const followedProfileMap = new Map(
      followedProfiles.map((followedProfile) => [
        followedProfile.id,
        mapProfileToSimpleUserInfo(followedProfile),
      ])
    );

    filteredEvents = filteredEvents.filter(
      (event) => {
        const isFollowedEntityEvent = followedEntityIds.has(event.event_owner_id);
        const canShowEvent =
          event.event_owner_id !== userId &&
          event.event_coordinator_id !== userId &&
          !passedEventIds.has(event.id) &&
          !recommendedEventIds.has(event.id) &&
          (!event.is_followers_only || isFollowedEntityEvent);

        if (canShowEvent && isFollowedEntityEvent) {
          const followedEntity = followedProfileMap.get(event.event_owner_id);

          if (followedEntity) {
            invitationByEventId.set(event.id, followedEntity);
          }
        }

        return canShowEvent;
      }
    );
  }

  if (isIndividual) {
    const [
      { data: signups },
      { data: following },
      { data: memberships },
      { data: savedOrganizations },
      { data: staffEntries },
      { data: directRecommendations, error: directRecommendationsError },
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
      supabase
        .from("event_recommendations")
        .select("event_id, recommender_entity_id")
        .eq("recipient_user_id", userId),
    ]);

    if (directRecommendationsError) throw directRecommendationsError;

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
    const { data: entityRecommendations, error: entityRecommendationsError } =
      memberEntityIds.size
        ? await supabase
            .from("event_recommendations")
            .select("event_id, recommender_entity_id")
            .is("recipient_user_id", null)
            .in("recommender_entity_id", Array.from(memberEntityIds))
        : { data: [], error: null };

    if (entityRecommendationsError) throw entityRecommendationsError;

    const recommendations = [
      ...(directRecommendations ?? []),
      ...(entityRecommendations ?? []),
    ];
    const recommendedEventIds = new Set(
      recommendations.map((row) => row.event_id)
    );
    const recommenderIds = Array.from(
      new Set(recommendations.map((row) => row.recommender_entity_id))
    );
    const recommenderProfiles = await getProfilesByIds(recommenderIds);
    const recommenderMap = new Map(
      recommenderProfiles.map((profile) => [profile.id, profile])
    );

    recommendations.forEach((recommendation) => {
      const recommender = recommenderMap.get(recommendation.recommender_entity_id);

      if (recommender) {
        invitationByEventId.set(
          recommendation.event_id,
          mapProfileToSimpleUserInfo(recommender)
        );
      }
    });

    const availableEventIds = new Set(filteredEvents.map((event) => event.id));
    const missingRecommendedEventIds = Array.from(recommendedEventIds).filter(
      (eventId) => !availableEventIds.has(eventId)
    );

    if (missingRecommendedEventIds.length) {
      const { data: recommendedEvents, error: recommendedEventsError } =
        await supabase
          .from("events")
          .select(
            "id, event_owner_id, roster_id, event_name, event_description, event_date, start_time, end_time, is_followers_only, max_volunteer_count, event_cover_photo_url, event_photo_visibility, event_coordinator_id"
          )
          .in("id", missingRecommendedEventIds);

      if (recommendedEventsError) throw recommendedEventsError;

      filteredEvents = [
        ...filteredEvents,
        ...((recommendedEvents ?? []) as EventRow[]),
      ];
    }

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
    const followingEntityIds = Array.from(
      new Set((following ?? []).map((row) => row.following_id))
    );
    const followingProfiles = await getProfilesByIds(followingEntityIds);
    const followingProfileMap = new Map(
      followingProfiles.map((profile) => [
        profile.id,
        mapProfileToSimpleUserInfo(profile),
      ])
    );

    filteredEvents = filteredEvents.filter((event) => {
      if (event.event_coordinator_id === userId) return true;
      if (adminEntityIds.has(event.event_owner_id)) return true;
      if (blockedEventIds.has(event.id)) return false;
      if (recommendedEventIds.has(event.id)) return true;
      if (memberEntityIds.has(event.event_owner_id)) return true;
      if (
        affiliatedEntityIds.has(event.event_owner_id) &&
        !event.is_followers_only
      ) {
        const followedEntity = followingProfileMap.get(event.event_owner_id);

        if (followedEntity && !invitationByEventId.has(event.id)) {
          invitationByEventId.set(event.id, followedEntity);
        }

        return true;
      }
      if (event.is_followers_only) return false;
      return true;
    });
  }

  return buildShortEvents(filteredEvents as EventRow[], invitationByEventId);
};

export const recommendEventToFollowers = async (
  eventId: string
): Promise<void> => {
  const recommenderEntityId = await ensureUserId();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", recommenderEntityId)
    .single();

  if (profileError || !profile) {
    throw profileError ?? new Error("User not found");
  }

  if (profile.user_type !== "organization" && profile.user_type !== "nonprofit") {
    throw new Error("Only organizations and nonprofits can recommend events to followers.");
  }

  const actionTimestamp = new Date().toISOString();
  const { data: existingEntitySignups, error: existingEntitySignupsError } =
    await supabase
      .from("event_signups")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("user_id", recommenderEntityId);

  if (existingEntitySignupsError) throw existingEntitySignupsError;

  const hasActiveEntitySignup = (existingEntitySignups ?? []).some((signup) =>
    ["volunteered", "confirmed", "approved"].includes(signup.status)
  );

  if (!hasActiveEntitySignup) {
    const entitySignupIds = (existingEntitySignups ?? []).map(
      (signup) => signup.id
    );

    if (entitySignupIds.length) {
      const { error: restoreEntitySignupError } = await supabase
        .from("event_signups")
        .update({
          status: "volunteered",
          check_in_at: null,
          check_out_at: null,
          invited_by_entity_id: null,
          invitation_removed_at: null,
          invitation_removed_by: null,
          event_action_timestamp: actionTimestamp,
        })
        .in("id", entitySignupIds);

      if (restoreEntitySignupError) throw restoreEntitySignupError;
    } else {
      const { error: insertEntitySignupError } = await supabase
        .from("event_signups")
        .insert({
          event_id: eventId,
          user_id: recommenderEntityId,
          status: "volunteered",
          check_in_at: null,
          check_out_at: null,
          invited_by_entity_id: null,
          event_action_timestamp: actionTimestamp,
        });

      if (insertEntitySignupError) throw insertEntitySignupError;
    }
  }

  const [
    { data: followers, error: followersError },
    { data: rosters, error: rostersError },
    { data: userOrganizations, error: userOrganizationsError },
  ] = await Promise.all([
      supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", recommenderEntityId),
      supabase
        .from("rosters")
        .select("id")
        .eq("roster_owner_id", recommenderEntityId),
      supabase
        .from("user_organizations")
        .select("user_id")
        .eq("parent_organization_id", recommenderEntityId),
    ]);

  if (followersError) throw followersError;
  if (rostersError) throw rostersError;
  if (userOrganizationsError) throw userOrganizationsError;

  const rosterIds = (rosters ?? []).map((roster) => roster.id);
  const { data: rosterMembers, error: rosterMembersError } = rosterIds.length
    ? await supabase
        .from("roster_members")
        .select("user_id")
        .in("roster_id", rosterIds)
    : { data: [], error: null };

  if (rosterMembersError) throw rosterMembersError;

  const { data: existingEntityRecommendation, error: existingEntityRecommendationError } =
    await supabase
      .from("event_recommendations")
      .select("id")
      .eq("event_id", eventId)
      .eq("recommender_entity_id", recommenderEntityId)
      .is("recipient_user_id", null)
      .limit(1)
      .maybeSingle();

  if (existingEntityRecommendationError) {
    throw existingEntityRecommendationError;
  }

  if (!existingEntityRecommendation) {
    const { error: entityRecommendationError } = await supabase
    .from("event_recommendations")
      .insert({
        event_id: eventId,
        recommender_entity_id: recommenderEntityId,
        recipient_user_id: null,
      });

    if (entityRecommendationError) {
      const errorCode = (entityRecommendationError as { code?: string }).code;

      if (errorCode !== "23502") {
        throw entityRecommendationError;
      }

      console.warn(
        "Org-level event recommendations require recipient_user_id to allow null. Apply the latest Supabase migrations to support future members."
      );
    }
  }

  const recipientUserIds = Array.from(
    new Set([
      ...(followers ?? []).map((follower) => follower.follower_id),
      ...((rosterMembers ?? []).map((member) => member.user_id)),
      ...((userOrganizations ?? []).map((organization) => organization.user_id)),
    ])
  ).filter((recipientUserId) => recipientUserId !== recommenderEntityId);

  if (!recipientUserIds.length) {
    return;
  }

  const { data: recipientProfiles, error: recipientProfilesError } = await supabase
    .from("profiles")
    .select("id")
    .in("id", recipientUserIds)
    .eq("user_type", "individual");

  if (recipientProfilesError) throw recipientProfilesError;

  const rows = (recipientProfiles ?? []).map((recipient) => ({
    event_id: eventId,
    recommender_entity_id: recommenderEntityId,
    recipient_user_id: recipient.id,
  }));

  if (!rows.length) {
    return;
  }

  const { error } = await supabase
    .from("event_recommendations")
    .upsert(rows, {
      onConflict: "event_id,recommender_entity_id,recipient_user_id",
    });

  if (error) throw error;
};

export const getEntityEventCounts = async (
  entityId: string
): Promise<EntityEventCounts> => {
  const userId = await ensureUserId();
  const { data, error } = await supabase
    .from("events")
    .select("event_owner_id, event_date, start_time, end_time, is_followers_only")
    .eq("event_owner_id", entityId);

  if (error) throw error;

  const now = new Date();
  const visibleEvents = await filterInternalEventsForViewer(
    (data ?? []) as Pick<
      EventRow,
      "event_owner_id" | "event_date" | "start_time" | "end_time" | "is_followers_only"
    >[],
    userId
  );

  return visibleEvents.reduce<EntityEventCounts>(
    (counts, event) => {
      if (hasEventEnded(event, now)) {
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
  const userId = await ensureUserId();
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, event_owner_id, roster_id, event_name, event_description, event_date, start_time, end_time, is_followers_only, max_volunteer_count, event_cover_photo_url, event_photo_visibility, event_coordinator_id"
    )
    .eq("event_owner_id", entityId)
    .gte("event_date", toLocalDateString(new Date()))
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;

  const now = new Date();
  const visibleEvents = await filterInternalEventsForViewer(
    (data ?? []) as EventRow[],
    userId
  );
  const upcomingEvents = visibleEvents.filter(
    (event) => !hasEventEnded(event, now)
  );

  return buildShortEvents(upcomingEvents);
};

export const getRosterAdminEvents = async (): Promise<ShortEventState[]> => {
  const userId = await ensureUserId();
  const eventAdminEntityAccess = await getEventAdminEntityAccessForUser(userId);
  const eventAdminEntityIds = eventAdminEntityAccess.map(
    (access) => access.entityId
  );
  const eventFilter = [
    `event_coordinator_id.eq.${userId}`,
    ...eventAdminEntityIds.map((entityId) => `event_owner_id.eq.${entityId}`),
  ].join(",");

  if (!eventFilter) return [];

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select(
      "id, event_owner_id, roster_id, event_name, event_description, event_date, start_time, end_time, is_repeating, is_followers_only, event_parking_info, event_internal_location, is_indoor, is_outdoor, max_volunteer_count, event_cover_photo_url, event_photo_visibility, event_coordinator_id, adult_waiver_url, minor_waiver_url"
    )
    .or(eventFilter)
    .order("event_date", { ascending: false });

  if (eventsError) throw eventsError;

  const accessByEntityId = new Map(
    eventAdminEntityAccess.map((access) => [access.entityId, access])
  );
  const filteredEvents = ((events ?? []) as EventRow[]).filter((event) => {
    if (event.event_coordinator_id === userId) {
      return true;
    }

    const access = accessByEntityId.get(event.event_owner_id);
    return event.is_followers_only
      ? Boolean(access?.canEditInternalEvents)
      : Boolean(access?.canEditExternalEvents);
  });

  return buildShortEvents(filteredEvents);
};

export const getEventDetails = async (eventId: string): Promise<EventsState> => {
  const { data: event, error } = await supabase
    .from("events")
    .select(
      "id, event_owner_id, roster_id, event_name, event_description, event_date, start_time, end_time, is_repeating, is_followers_only, event_parking_info, event_internal_location, is_indoor, is_outdoor, max_volunteer_count, event_cover_photo_url, event_photo_visibility, event_coordinator_id, adult_waiver_url, minor_waiver_url"
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
    eventPhotoVisibility:
      (event.event_photo_visibility as EventsState["eventPhotoVisibility"]) ??
      "public",
    eventCoordinator: toSimpleUser(coordinatorProfile, event.event_coordinator_id),
    eventOwner: toSimpleUser(ownerProfile, event.event_owner_id),
    rosterId: event.roster_id ?? undefined,
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

  if (eventOwnerId !== userId) {
    const eventType = newEvent.isFollowersOnly ? "internal" : "external";
    const canCreateEvent = await hasEventAdminPermission(
      eventOwnerId,
      userId,
      eventType
    );

    if (!canCreateEvent) {
      throw new Error(
        `You do not have permission to create ${eventType} events for this entity.`
      );
    }
  }

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
      event_photo_visibility: newEvent.eventPhotoVisibility ?? "public",
      event_coordinator_id: newEvent.eventCoordinator || eventOwnerId,
      roster_id: newEvent.rosterId || null,
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
    .select("event_owner_id, event_coordinator_id, is_followers_only")
    .eq("id", eventId)
    .single();

  if (eventError || !event) throw eventError ?? new Error("Event not found");

  const canEdit =
    event.event_owner_id === userId ||
    event.event_coordinator_id === userId ||
    (await hasEventAdminPermission(
      event.event_owner_id,
      userId,
      event.is_followers_only ? "internal" : "external"
    ));

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
    .select("event_owner_id, event_coordinator_id, is_followers_only")
    .eq("id", eventId)
    .single();

  if (eventError || !event) throw eventError ?? new Error("Event not found");

  const canEdit =
    event.event_owner_id === userId ||
    event.event_coordinator_id === userId ||
    (await hasEventAdminPermission(
      event.event_owner_id,
      userId,
      event.is_followers_only ? "internal" : "external"
    ));

  if (!canEdit) {
    throw new Error("You do not have permission to edit this event");
  }
};

export const updateEventDetails = async ({
  eventId,
  eventName,
  eventDescription,
  maxVolunteerCount,
  rosterId,
  eventAddress,
  volunteerImpact,
  eventPhotoVisibility,
}: EventEditableUpdate): Promise<void> => {
  await ensureCanEditEvent(eventId);

  const eventUpdates: {
    event_name?: string;
    event_description?: string;
    max_volunteer_count?: number;
    roster_id?: string | null;
    event_photo_visibility?: "public" | "private";
  } = {};

  if (eventName !== undefined) eventUpdates.event_name = eventName;
  if (eventDescription !== undefined) {
    eventUpdates.event_description = eventDescription;
  }
  if (maxVolunteerCount !== undefined) {
    eventUpdates.max_volunteer_count = maxVolunteerCount;
  }
  if (rosterId !== undefined) {
    eventUpdates.roster_id = rosterId;
  }
  if (eventPhotoVisibility !== undefined) {
    eventUpdates.event_photo_visibility = eventPhotoVisibility;
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
    updates.push(
      supabase
        .from("impact")
        .update({ updated_at: new Date().toISOString() })
        .eq("event_id", eventId)
        .gt("events_attended", 0)
    );
  }

  const results = await Promise.all(updates);
  results.forEach((result) => {
    if (result.error) throw result.error;
  });
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  const userId = await ensureUserId();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("event_owner_id, event_date, end_time, is_followers_only")
    .eq("id", eventId)
    .single();

  if (eventError || !event) throw eventError ?? new Error("Event not found");

  const eventEndTime = timeToDecimal(event.end_time);
  const hasEventEnded =
    eventEndTime !== undefined
      ? new Date() > parseEventDateTimeAsLocalDate(event.event_date, eventEndTime)
      : parseEventDateAsLocalDate(event.event_date) <
        new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  if (hasEventEnded) {
    throw new Error("Past events cannot be deleted");
  }

  const canDelete =
    event.event_owner_id === userId ||
    (await hasEventAdminPermission(
      event.event_owner_id,
      userId,
      event.is_followers_only ? "internal" : "external"
    ));

  if (!canDelete) {
    throw new Error("You do not have permission to delete this event");
  }

  const deletes = await Promise.all([
    supabase.from("event_recommendations").delete().eq("event_id", eventId),
    supabase.from("event_signups").delete().eq("event_id", eventId),
    supabase.from("event_addresses").delete().eq("event_id", eventId),
    supabase.from("event_requirements").delete().eq("event_id", eventId),
    supabase.from("event_volunteer_impacts").delete().eq("event_id", eventId),
    supabase.from("impact").delete().eq("event_id", eventId),
  ]);

  deletes.forEach((result) => {
    if (result.error) throw result.error;
  });

  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw error;

  await incrementImpact(event.event_owner_id, { events_created: -1 });
};

const isMissingInvitedByEntityColumnError = (error: unknown) => {
  const message = String((error as { message?: string })?.message ?? "");
  return (
    message.includes("invited_by_entity_id") &&
    message.includes("schema cache")
  );
};

const getInvitationEntityIdForVolunteerSignup = async (
  eventId: string,
  userId: string
): Promise<string | null> => {
  const { data: directRecommendation, error: directRecommendationError } =
    await supabase
      .from("event_recommendations")
      .select("recommender_entity_id, created_at")
      .eq("event_id", eventId)
      .eq("recipient_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (directRecommendationError) throw directRecommendationError;

  if (directRecommendation?.recommender_entity_id) {
    return directRecommendation.recommender_entity_id;
  }

  const [
    { data: savedOrganizations, error: savedOrganizationsError },
    { data: memberships, error: membershipsError },
  ] = await Promise.all([
    supabase
      .from("user_organizations")
      .select("parent_organization_id")
      .eq("user_id", userId),
    supabase
      .from("roster_members")
      .select("roster_id")
      .eq("user_id", userId),
  ]);

  if (savedOrganizationsError) throw savedOrganizationsError;
  if (membershipsError) throw membershipsError;

  const rosterIds = (memberships ?? []).map((membership) => membership.roster_id);
  const { data: memberRosters, error: memberRostersError } = rosterIds.length
    ? await supabase
        .from("rosters")
        .select("roster_owner_id, roster_name")
        .in("id", rosterIds)
    : { data: [], error: null };

  if (memberRostersError) throw memberRostersError;

  const memberEntityIds = Array.from(
    new Set([
      ...((savedOrganizations ?? [])
        .map((organization) => organization.parent_organization_id)
        .filter(Boolean) as string[]),
      ...((memberRosters ?? [])
        .filter((roster) => roster.roster_name !== "Followers")
        .map((roster) => roster.roster_owner_id)),
    ])
  );

  if (!memberEntityIds.length) {
    return null;
  }

  const { data: entityRecommendation, error: entityRecommendationError } =
    await supabase
      .from("event_recommendations")
      .select("recommender_entity_id, created_at")
      .eq("event_id", eventId)
      .is("recipient_user_id", null)
      .in("recommender_entity_id", memberEntityIds)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (entityRecommendationError) throw entityRecommendationError;

  return entityRecommendation?.recommender_entity_id ?? null;
};

export const volunteerForEvent = async (eventId: string): Promise<void> => {
  const userId = await ensureUserId();
  const invitedByEntityId = await getInvitationEntityIdForVolunteerSignup(
    eventId,
    userId
  );

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
    const passedSignupIds = passedSignups.map((signup) => signup.id);
    const updatePayload = {
      status: "volunteered",
      event_action_timestamp: new Date().toISOString(),
      invited_by_entity_id: invitedByEntityId,
    };
    const { error } = await supabase
      .from("event_signups")
      .update(updatePayload)
      .in("id", passedSignupIds);

    if (error) {
      if (!isMissingInvitedByEntityColumnError(error)) {
        throw error;
      }

      const { error: fallbackError } = await supabase
        .from("event_signups")
        .update({
          status: updatePayload.status,
          event_action_timestamp: updatePayload.event_action_timestamp,
        })
        .in("id", passedSignupIds);

      if (fallbackError) throw fallbackError;
    }
    return;
  }

  if ((existing ?? []).length > 0) {
    throw new Error("You have already volunteered for this event");
  }

  const insertPayload = {
    event_id: eventId,
    user_id: userId,
    status: "volunteered",
    check_in_at: null,
    check_out_at: null,
    invited_by_entity_id: invitedByEntityId,
    event_action_timestamp: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("event_signups")
    .upsert(insertPayload, { onConflict: "event_id,user_id" });

  if (error) {
    if (!isMissingInvitedByEntityColumnError(error)) {
      throw error;
    }

    const { error: fallbackError } = await supabase.from("event_signups").upsert(
      {
        event_id: insertPayload.event_id,
        user_id: insertPayload.user_id,
        status: insertPayload.status,
        check_in_at: insertPayload.check_in_at,
        check_out_at: insertPayload.check_out_at,
        event_action_timestamp: insertPayload.event_action_timestamp,
      },
      { onConflict: "event_id,user_id" }
    );

    if (fallbackError) throw fallbackError;
  }
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

  const { error } = await supabase.from("event_signups").upsert(
    {
      event_id: eventId,
      user_id: userId,
      status: "passed",
      check_in_at: null,
      check_out_at: null,
      event_action_timestamp: new Date().toISOString(),
    },
    { onConflict: "event_id,user_id" }
  );

  if (error) throw error;

  await incrementImpact(userId, { events_passed: 1 });
};

type EventSignupAction = {
  eventId: string;
  userId?: string;
  invitedByEntityId?: string;
};

type NormalizedEventSignupAction = {
  eventId: string;
  userId: string;
};

const normalizeEventSignupAction = (
  action: string | EventSignupAction
): NormalizedEventSignupAction => ({
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

  const { error } = await supabase.rpc("deny_event_volunteer_as_no_show", {
    target_event_id: action.eventId,
    target_user_id: action.userId,
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

  if (action.invitedByEntityId) {
    const { data: inviterProfile, error: inviterProfileError } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", action.invitedByEntityId)
      .single();

    if (inviterProfileError) throw inviterProfileError;

    if (["organization", "nonprofit"].includes(inviterProfile?.user_type ?? "")) {
      const { data: memberIds, error: memberIdsError } = await supabase.rpc(
        "get_entity_roster_member_ids",
        {
          target_entity_id: action.invitedByEntityId,
        }
      );

      if (memberIdsError) throw memberIdsError;

      const isEntityMember = (memberIds ?? []).some(
        (member) => member.user_id === action.userId
      );

      if (!isEntityMember) {
        throw new Error(
          "Only organization members can be added to this volunteer list."
        );
      }
    }
  }

  const { error } = await supabase.rpc("manage_event_signup_check_time", {
    target_event_id: action.eventId,
    target_user_id: action.userId,
    check_action: "add_volunteer",
  });

  if (error) throw error;

  if (!action.invitedByEntityId) {
    return;
  }

  const { error: invitationError } = await supabase
    .from("event_signups")
    .update({
      invited_by_entity_id: action.invitedByEntityId,
      invitation_removed_at: null,
      invitation_removed_by: null,
    })
    .eq("event_id", action.eventId)
    .eq("user_id", action.userId);

  if (invitationError) {
    if (!isMissingInvitedByEntityColumnError(invitationError)) {
      throw invitationError;
    }

    console.warn(
      "Adding volunteers under an organization requires the invited_by_entity_id column. Apply the latest Supabase migrations to support grouped volunteer adds."
    );
  }
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

export const removeEventInvitationVolunteer = async (
  action: EventSignupAction
): Promise<void> => {
  await ensureUserId();

  if (!action.userId) {
    throw new Error("Volunteer is required");
  }

  if (!action.invitedByEntityId) {
    throw new Error("Organization is required");
  }

  const { error } = await supabase.rpc("remove_event_invitation_volunteer", {
    target_event_id: action.eventId,
    target_user_id: action.userId,
    target_inviter_entity_id: action.invitedByEntityId,
  });

  if (error) throw error;
};

export const removeEventVolunteer = async (
  action: EventSignupAction
): Promise<void> => {
  await ensureUserId();

  if (!action.userId) {
    throw new Error("Volunteer is required");
  }

  const { error } = await supabase.rpc("remove_event_volunteer_signup", {
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
    .select(
      "event_id, status, event_action_timestamp, check_in_at, check_out_at, invited_by_entity_id"
    )
    .eq("user_id", userId)
    .in("status", ["volunteered", "confirmed", "approved", "no_show"]);

  if (error) throw error;

  const eventIds = Array.from(new Set((signups ?? []).map((row) => row.event_id)));

  if (!eventIds.length) return [];

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select(
      "id, event_owner_id, roster_id, event_name, event_description, event_date, start_time, end_time, is_followers_only, max_volunteer_count, event_cover_photo_url, event_photo_visibility, event_coordinator_id"
    )
    .in("id", eventIds);

  if (eventsError) throw eventsError;

  let filteredEvents = events ?? [];

  if (when) {
    const now = new Date();
    filteredEvents = filteredEvents.filter((event) => {
      const eventEnded = hasEventEnded(event, now);

      return when === "past"
        ? eventEnded
        : !eventEnded;
    });
  }

  const visibleEventIds = filteredEvents.map((event) => event.id);
  const invitationByEventId = await getInvitationByEventIdForUser(
    userId,
    visibleEventIds
  );
  const invitedByEntityIds = Array.from(
    new Set(
      (signups ?? [])
        .filter((signup) => visibleEventIds.includes(signup.event_id))
        .map((signup) => signup.invited_by_entity_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  if (invitedByEntityIds.length) {
    const invitedByProfiles = await getProfilesByIds(invitedByEntityIds);
    const invitedByMap = new Map(
      invitedByProfiles.map((profile) => [
        profile.id,
        mapProfileToSimpleUserInfo(profile),
      ])
    );

    (signups ?? []).forEach((signup) => {
      if (!visibleEventIds.includes(signup.event_id) || !signup.invited_by_entity_id) {
        return;
      }

      const inviter = invitedByMap.get(signup.invited_by_entity_id);

      if (inviter) {
        invitationByEventId.set(signup.event_id, inviter);
      }
    });
  }

  const shortEvents = await buildShortEvents(
    filteredEvents as EventRow[],
    invitationByEventId
  );
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
      invited_by_entity_id: string | null;
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

  const { data: entityEvents, error: entityEventsError } = await supabase
    .from("events")
    .select("id")
    .eq("event_owner_id", entityId);

  if (entityEventsError) throw entityEventsError;

  const entityEventIds = (entityEvents ?? []).map((event) => event.id);
  if (!entityEventIds.length) return [];

  const { data: volunteeredSignups, error: volunteeredSignupsError } =
    await supabase
      .from("event_signups")
      .select("event_id, user_id, check_in_at, check_out_at")
      .in("event_id", entityEventIds)
      .in("status", ["volunteered", "confirmed", "approved"]);

  if (volunteeredSignupsError) throw volunteeredSignupsError;

  const volunteeredSignupUserIds = new Set(
    (volunteeredSignups ?? []).map((signup) => signup.user_id)
  );
  const volunteeredUserIds = Array.from(volunteeredSignupUserIds).filter(
    (userId) => userId !== entityId
  );

  if (!volunteeredUserIds.length) return [];

  const matchedEventIdsByUser = new Map<string, Set<string>>();
  const signupImpactFallbackByUser = new Map<
    string,
    { hoursVolunteered: number; eventsAttended: number }
  >();
  (volunteeredSignups ?? []).forEach((signup) => {
    const eventIds = matchedEventIdsByUser.get(signup.user_id) ?? new Set<string>();
    eventIds.add(signup.event_id);
    matchedEventIdsByUser.set(signup.user_id, eventIds);

    const hoursVolunteered = getHoursBetweenTimestamps(
      signup.check_in_at,
      signup.check_out_at
    );
    if (hoursVolunteered <= 0) {
      return;
    }

    const current = signupImpactFallbackByUser.get(signup.user_id) ?? {
      hoursVolunteered: 0,
      eventsAttended: 0,
    };
    signupImpactFallbackByUser.set(signup.user_id, {
      hoursVolunteered: current.hoursVolunteered + hoursVolunteered,
      eventsAttended: current.eventsAttended + 1,
    });
  });

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, full_name, first_name, last_name, profile_picture_url, nonprofit_name, organization_name, user_type, created_at"
    )
    .in("id", volunteeredUserIds)
    .eq("user_type", "individual");

  if (profileError) throw profileError;

  const profileIds = (profiles ?? []).map((profile) => profile.id);
  if (!profileIds.length) return [];

  const [detailsRes, impactRes, liveImpactRes, causeLinksRes] = await Promise.all([
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
      .from("impact")
      .select("impact_owner_id, hours_volunteered, events_attended")
      .in("impact_owner_id", profileIds)
      .not("event_id", "is", null)
      .gt("events_attended", 0),
    supabase
      .from("user_causes")
      .select("user_id, cause_id")
      .in("user_id", profileIds),
  ]);

  if (detailsRes.error) throw detailsRes.error;
  if (impactRes.error) throw impactRes.error;
  if (liveImpactRes.error) throw liveImpactRes.error;
  if (causeLinksRes.error) throw causeLinksRes.error;

  const publicImpactSummaries = await Promise.all(
    profileIds.map(async (profileId) => {
      const { data, error } = await supabase.rpc("get_public_user_impact", {
        target_user_id: profileId,
      });

      if (error) {
        if ((error as { code?: string }).code === "PGRST202") {
          return {
            userId: profileId,
            hoursVolunteered: undefined,
            eventsAttended: undefined,
          };
        }

        throw error;
      }

      return {
        userId: profileId,
        hoursVolunteered: (data ?? []).reduce(
          (total, impact) => total + Number(impact.hours_volunteered ?? 0),
          0
        ),
        eventsAttended: (data ?? []).length,
      };
    })
  );

  const detailMap = new Map(
    (detailsRes.data ?? []).map((row) => [row.user_id, row])
  );

  const impactMap = new Map(
    (impactRes.data ?? []).map((row) => [row.impact_owner_id, row])
  );
  const publicImpactMap = new Map(
    publicImpactSummaries.map((summary) => [summary.userId, summary])
  );
  const liveImpactMap = new Map<
    string,
    { hoursVolunteered: number; eventsAttended: number }
  >();
  (liveImpactRes.data ?? []).forEach((impact) => {
    const current = liveImpactMap.get(impact.impact_owner_id) ?? {
      hoursVolunteered: 0,
      eventsAttended: 0,
    };

    liveImpactMap.set(impact.impact_owner_id, {
      hoursVolunteered:
        current.hoursVolunteered + Number(impact.hours_volunteered ?? 0),
      eventsAttended:
        current.eventsAttended + Number(impact.events_attended ?? 0),
    });
  });

  const profileCauseIds = Array.from(
    new Set((causeLinksRes.data ?? []).map((row) => row.cause_id))
  );
  const { data: causeRows, error: causeRowsError } = profileCauseIds.length
    ? await supabase
        .from("causes")
        .select("id, name, description, image_url, active")
        .in("id", profileCauseIds)
    : { data: [], error: null };

  if (causeRowsError) throw causeRowsError;

  const causeMap = new Map(
    (causeRows ?? []).map((row) => [
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
  (causeLinksRes.data ?? []).forEach((row) => {
    const list = causesByUser.get(row.user_id) ?? [];
    const cause = causeMap.get(row.cause_id);
    if (cause) list.push(cause);
    causesByUser.set(row.user_id, list);
  });

  const currentVolunteerValuePerHour = await getVolunteerValuePerHour();

  return (profiles ?? []).map((profile) => {
    const details = detailMap.get(profile.id);
    const impact = impactMap.get(profile.id);
    const publicImpact = publicImpactMap.get(profile.id);
    const liveImpact = liveImpactMap.get(profile.id);
    const signupImpactFallback = signupImpactFallbackByUser.get(profile.id);
    const hoursVolunteered = Number(
      publicImpact?.hoursVolunteered ??
        liveImpact?.hoursVolunteered ??
        impact?.hours_volunteered ??
        signupImpactFallback?.hoursVolunteered ??
        0
    );
    const eventsAttended = Number(
      publicImpact?.eventsAttended ??
        liveImpact?.eventsAttended ??
        impact?.events_attended ??
        signupImpactFallback?.eventsAttended ??
        0
    );
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
      matchedEventCount: matchedEventIdsByUser.get(profile.id)?.size ?? 0,
      volunteerSummary: {
        hoursVolunteered,
        volunteerValue: hoursVolunteered * currentVolunteerValuePerHour,
        eventsAttended,
      },
    };
  });
};
