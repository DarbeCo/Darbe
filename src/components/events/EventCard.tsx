import { useNavigate } from "react-router-dom";
import { IconButton } from "@mui/material";
import { ContentCopy } from "@mui/icons-material";
import { useState } from "react";

import { EVENTS_ROUTE, PROFILE_ROUTE } from "../../routes/route.constants";
import {
  EventEditableUpdate,
  ShortEventState,
} from "../../services/api/endpoints/types/events.api.types";
import { SimpleUserInfo } from "../../services/api/endpoints/types/user.api.types";
import { UserAvatars } from "../avatars/UserAvatars";
import { Typography } from "../typography/Typography";
import { DarbeButton } from "../buttons/DarbeButton";
import { CustomSvgs } from "../customSvgs/CustomSvgs";
import {
  formatDarbeTimeToString,
  getUserStateFromZip,
} from "../../utils/CommonFunctions";
import { useAppSelector } from "../../services/hooks";
import {
  selectCurrentUserId,
} from "../../features/users/selectors";
import { assetUrl } from "../../utils/assetUrl";
import {
  getEventTimeParts,
  parseEventDateAsLocalDate,
  parseEventDateTimeAsLocalDate,
} from "../../utils/eventDateUtils";

import styles from "./styles/eventCards.module.css";
import {
  useAddEventVolunteerMutation,
  useApproveAllEventVolunteersMutation,
  useApproveEventVolunteerMutation,
  usePassOnEventMutation,
  useRecommendEventToFollowersMutation,
  useCheckInForEventMutation,
  useCheckOutFromEventMutation,
  useDenyEventVolunteerMutation,
  useUnvolunteerFromEventMutation,
  useUpdateEventDetailsMutation,
  useUpdateEventSignupImpactDetailsMutation,
  useUpdateEventTimeMutation,
  useVolunteerForEventMutation,
} from "../../services/api/endpoints/events/events.api";
import { useGetRostersQuery } from "../../services/api/endpoints/roster/roster.api";
import { useGetSearchResultsQuery } from "../../services/api/endpoints/search/search.api";

interface EventCardProps {
  event: ShortEventState;
  isSignedUp?: boolean;
  signupCount?: number;
  impactView?: boolean;
  onUnvolunteerSuccess?: (eventId: string) => void;
  canUnvolunteer?: boolean;
  hideVolunteerActions?: boolean;
  hideDetailsAction?: boolean;
  returnToEventsTab?: string;
  canExpandVolunteers?: boolean;
  variant?: "default" | "match";
  incompleteActionLabel?: string;
  onIncompleteAction?: (eventId: string) => void;
  useCurrentEventTimingActions?: boolean;
  showVolunteerAndPassActions?: boolean;
  showRecommendToFollowersAction?: boolean;
  onVolunteerSuccess?: (eventId: string) => void;
  onPassSuccess?: (eventId: string) => void;
  onRecommendSuccess?: (eventId: string) => void;
  allowCoordinatorVolunteerManagement?: boolean;
  enableAdminControls?: boolean;
  additionalVolunteerCoordinators?: SimpleUserInfo[];
}

const formatCheckTimestamp = (timestamp?: string) => {
  if (!timestamp) {
    return "";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatEventTimeRangeValue = (time?: number) =>
  time !== undefined ? formatDarbeTimeToString(time) : "--";

const decimalHourToTimeInputValue = (time?: number) => {
  if (time === undefined || time === null || !Number.isFinite(time)) {
    return "";
  }

  const { hour, minute } = getEventTimeParts(time);

  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
};

const timeInputValueToDecimalHour = (time: string) => {
  const [hourValue, minuteValue] = time.split(":");
  const hour = Number(hourValue);
  const minute = Number(minuteValue);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return Number.NaN;
  }

  return Number(`${hour}.${minute.toString().padStart(2, "0")}`);
};

const formatImpactNumber = (value: number) =>
  Number.isInteger(value) ? value.toString() : value.toFixed(2);

const formatVolunteerActionTime = (timestamp?: string) => {
  if (!timestamp) {
    return "";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const timeTextToTimeInputValue = (value?: string) => {
  if (!value) {
    return "";
  }

  const trimmedValue = value.trim();
  const twentyFourHourMatch = trimmedValue.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  if (twentyFourHourMatch) {
    const [, hour, minute] = twentyFourHourMatch;
    return `${hour.padStart(2, "0")}:${minute}`;
  }

  const twelveHourMatch = trimmedValue.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!twelveHourMatch) {
    return "";
  }

  const [, hourValue, minute, meridiem] = twelveHourMatch;
  let hour = Number(hourValue);

  if (meridiem.toUpperCase() === "PM" && hour < 12) {
    hour += 12;
  }

  if (meridiem.toUpperCase() === "AM" && hour === 12) {
    hour = 0;
  }

  return `${hour.toString().padStart(2, "0")}:${minute}`;
};

const timeInputValueToDisplayTime = (value?: string) => {
  const timeInputValue = timeTextToTimeInputValue(value);

  if (!timeInputValue) {
    return value ?? "";
  }

  const [hourValue, minuteValue] = timeInputValue.split(":").map(Number);
  const date = new Date();
  date.setHours(hourValue, minuteValue, 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

type ImpactEditState = {
  signupId: string;
  startTime: string;
  endTime: string;
  location: string;
  impact: string;
};

type EventTimeEditState = {
  eventDate: string;
  startTime: string;
  endTime: string;
};

type EventFieldEditState =
  | {
      field: "eventName" | "eventDescription";
      label: string;
      value: string;
      multiline?: boolean;
    }
  | {
      field: "maxVolunteerCount";
      label: string;
      value: string;
    }
  | {
      field: "location";
      label: string;
      locationName: string;
      city: string;
      zipCode: string;
    }
  | {
      field: "volunteerImpact";
      label: string;
      amount: string;
      impact: string;
      impactType: "individual" | "group";
    }
  | {
      field: "rosterId";
      label: string;
      rosterId: string;
    };

type VolunteerSignupRow = ShortEventState["signups"][number] & {
  isCoordinator: boolean;
};

export const EventCard = ({
  event,
  isSignedUp,
  signupCount = 0,
  impactView = false,
  onUnvolunteerSuccess,
  canUnvolunteer = true,
  hideVolunteerActions = false,
  hideDetailsAction = false,
  returnToEventsTab,
  canExpandVolunteers = false,
  variant = "default",
  incompleteActionLabel,
  onIncompleteAction,
  useCurrentEventTimingActions = false,
  showVolunteerAndPassActions = false,
  showRecommendToFollowersAction = false,
  onVolunteerSuccess,
  onPassSuccess,
  onRecommendSuccess,
  allowCoordinatorVolunteerManagement = true,
  enableAdminControls = false,
  additionalVolunteerCoordinators = [],
}: EventCardProps) => {
  const navigate = useNavigate();
  const currentUserId = useAppSelector(selectCurrentUserId);
  const [passOnEvent, { isLoading: isPassing }] = usePassOnEventMutation();
  const [recommendEventToFollowers, { isLoading: isRecommending }] =
    useRecommendEventToFollowersMutation();
  const [checkInForEvent, { isLoading: isCheckingIn }] =
    useCheckInForEventMutation();
  const [checkOutFromEvent, { isLoading: isCheckingOut }] =
    useCheckOutFromEventMutation();
  const [addEventVolunteer, { isLoading: isAddingVolunteer }] =
    useAddEventVolunteerMutation();
  const [approveEventVolunteer, { isLoading: isApprovingVolunteer }] =
    useApproveEventVolunteerMutation();
  const [denyEventVolunteer, { isLoading: isDenyingVolunteer }] =
    useDenyEventVolunteerMutation();
  const [approveAllEventVolunteers, { isLoading: isApprovingAllVolunteers }] =
    useApproveAllEventVolunteersMutation();
  const [updateEventDetails, { isLoading: isUpdatingEventDetails }] =
    useUpdateEventDetailsMutation();
  const [updateImpactDetails, { isLoading: isUpdatingImpactDetails }] =
    useUpdateEventSignupImpactDetailsMutation();
  const [updateEventTime, { isLoading: isUpdatingEventTime }] =
    useUpdateEventTimeMutation();
  const [unvolunteerFromEvent, { isLoading: isUnvolunteering }] =
    useUnvolunteerFromEventMutation();
  const [volunteerForEvent, { isLoading: isVolunteering }] =
    useVolunteerForEventMutation();
  const { data: eventOwnerRosters = [] } = useGetRostersQuery(event.eventOwner.id, {
    skip: !event.eventOwner.id,
  });
  const [hasVolunteered, setHasVolunteered] = useState(Boolean(isSignedUp));
  const [showVolunteerDialog, setShowVolunteerDialog] = useState(false);
  const [showPassConfirmDialog, setShowPassConfirmDialog] = useState(false);
  const [showPassRejectedDialog, setShowPassRejectedDialog] = useState(false);
  const [approvalDialogMessage, setApprovalDialogMessage] = useState("");
  const [isVolunteerListOpen, setIsVolunteerListOpen] = useState(false);
  const [isAddVolunteerOpen, setIsAddVolunteerOpen] = useState(false);
  const [addVolunteerSearch, setAddVolunteerSearch] = useState("");
  const [impactEditState, setImpactEditState] =
    useState<ImpactEditState | null>(null);
  const [impactEditError, setImpactEditError] = useState("");
  const [eventTimeEditState, setEventTimeEditState] =
    useState<EventTimeEditState | null>(null);
  const [eventTimeEditError, setEventTimeEditError] = useState("");
  const [eventFieldEditState, setEventFieldEditState] =
    useState<EventFieldEditState | null>(null);
  const [eventFieldEditError, setEventFieldEditError] = useState("");
  const [impactDetailOverrides, setImpactDetailOverrides] = useState<
    Record<string, Omit<ImpactEditState, "signupId">>
  >({});
  const { data: addVolunteerResults = [] } = useGetSearchResultsQuery(
    addVolunteerSearch,
    {
      skip: addVolunteerSearch.trim().length < 3,
    }
  );

  const handleAvatarClick = (userId: string) => {
    navigate(`${PROFILE_ROUTE}/${userId}`);
  };

  const handlePassEvent = () => {
    setShowPassConfirmDialog(true);
  };

  const handleConfirmPassEvent = async () => {
    try {
      await passOnEvent(event.id).unwrap();
      setShowPassConfirmDialog(false);
      onPassSuccess?.(event.id);
      setShowPassRejectedDialog(true);
      setTimeout(() => setShowPassRejectedDialog(false), 1400);
    } catch (error) {
      console.error("Error passing on event", error);
    }
  };

  const handleVolunteerEvent = async () => {
    const eventId = event.id;

    try {
      await volunteerForEvent(eventId).unwrap();
      setHasVolunteered(true);
      onVolunteerSuccess?.(eventId);
      setShowVolunteerDialog(true);
      setTimeout(() => setShowVolunteerDialog(false), 1400);
    } catch (error) {
      const errorMessage =
        (error as { data?: { message?: string } })?.data?.message ??
        "Unable to volunteer for this event right now.";

      if (errorMessage.includes("already volunteered")) {
        setHasVolunteered(true);
        onVolunteerSuccess?.(eventId);
      } else {
        console.error("Error volunteering for event", error);
      }
    }
  };

  const handleRecommendEvent = async () => {
    try {
      await recommendEventToFollowers(event.id).unwrap();
      onRecommendSuccess?.(event.id);
    } catch (error) {
      console.error("Error recommending event to followers", error);
    }
  };

  const handleUnvolunteerEvent = async () => {
    try {
      await unvolunteerFromEvent(event.id).unwrap();
      setHasVolunteered(false);
      onUnvolunteerSuccess?.(event.id);
    } catch (error) {
      console.error("Error unvolunteering from event", error);
    }
  };

  const handleCheckInEvent = async (targetUserId?: string) => {
    try {
      await checkInForEvent(
        targetUserId ? { eventId: event.id, userId: targetUserId } : event.id
      ).unwrap();
    } catch (error) {
      console.error("Error checking into event", error);
    }
  };

  const handleCheckOutEvent = async (targetUserId?: string) => {
    try {
      await checkOutFromEvent(
        targetUserId ? { eventId: event.id, userId: targetUserId } : event.id
      ).unwrap();
    } catch (error) {
      console.error("Error checking out of event", error);
    }
  };

  const handleAddVolunteer = async (targetUserId: string) => {
    try {
      await addEventVolunteer({
        eventId: event.id,
        userId: targetUserId,
      }).unwrap();
      setAddVolunteerSearch("");
      setIsAddVolunteerOpen(false);
    } catch (error) {
      console.error("Error adding volunteer to event", error);
    }
  };

  const handleApproveVolunteer = async (targetUserId: string) => {
    try {
      await approveEventVolunteer({
        eventId: event.id,
        userId: targetUserId,
      }).unwrap();
      setApprovalDialogMessage("Volunteer Approved");
      setTimeout(() => setApprovalDialogMessage(""), 1400);
    } catch (error) {
      console.error("Error approving volunteer impact", error);
    }
  };

  const handleDenyVolunteer = async (targetUserId: string) => {
    try {
      await denyEventVolunteer({
        eventId: event.id,
        userId: targetUserId,
      }).unwrap();
    } catch (error) {
      console.error("Error denying volunteer impact", error);
    }
  };

  const handleApproveAllVolunteers = async () => {
    try {
      await approveAllEventVolunteers(event.id).unwrap();
      setApprovalDialogMessage("Volunteers Approved");
      setTimeout(() => setApprovalDialogMessage(""), 1400);
    } catch (error) {
      console.error("Error approving all volunteer impacts", error);
    }
  };

  const handleSaveImpactDetails = async () => {
    if (!impactEditState) {
      return;
    }

    try {
      setImpactEditError("");
      await updateImpactDetails(impactEditState).unwrap();
      setImpactDetailOverrides((currentOverrides) => ({
        ...currentOverrides,
        [impactEditState.signupId]: {
          startTime: impactEditState.startTime,
          endTime: impactEditState.endTime,
          location: impactEditState.location,
          impact: impactEditState.impact,
        },
      }));
      setImpactEditState(null);
    } catch (error) {
      console.error("Error updating volunteer impact details", error);
      setImpactEditError("Unable to save impact details.");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(eventShareUrl);
  };

  const handleEditEventTime = () => {
    setEventTimeEditError("");
    setEventTimeEditState({
      eventDate: event.eventDate.split("T")[0],
      startTime: decimalHourToTimeInputValue(event.startTime),
      endTime: decimalHourToTimeInputValue(event.endTime),
    });
  };

  const handleSaveEventTime = async () => {
    if (!eventTimeEditState) return;

    const parsedStartTime = timeInputValueToDecimalHour(
      eventTimeEditState.startTime
    );
    const parsedEndTime = eventTimeEditState.endTime.trim()
      ? timeInputValueToDecimalHour(eventTimeEditState.endTime)
      : undefined;

    if (
      !eventTimeEditState.eventDate ||
      !Number.isFinite(parsedStartTime) ||
      (parsedEndTime !== undefined && !Number.isFinite(parsedEndTime))
    ) {
      setEventTimeEditError("Enter a valid date and time.");
      return;
    }

    try {
      await updateEventTime({
        eventId: event.id,
        eventDate: eventTimeEditState.eventDate,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
      }).unwrap();
      setEventTimeEditState(null);
      setEventTimeEditError("");
    } catch (error) {
      console.error("Error updating event time", error);
      setEventTimeEditError("Unable to update event time.");
    }
  };

  const openEventFieldEdit = (state: EventFieldEditState) => {
    setEventFieldEditError("");
    setEventFieldEditState(state);
  };

  const handleSaveEventField = async () => {
    if (!eventFieldEditState) return;

    const update: EventEditableUpdate = { eventId: event.id };

    if (eventFieldEditState.field === "eventName") {
      update.eventName = eventFieldEditState.value.trim();
    }

    if (eventFieldEditState.field === "eventDescription") {
      update.eventDescription = eventFieldEditState.value.trim();
    }

    if (eventFieldEditState.field === "maxVolunteerCount") {
      const nextCount = Number(eventFieldEditState.value);

      if (!Number.isFinite(nextCount) || nextCount < 0) {
        setEventFieldEditError("Enter a valid volunteer count.");
        return;
      }

      update.maxVolunteerCount = nextCount;
    }

    if (eventFieldEditState.field === "location") {
      update.eventAddress = {
        ...event.eventAddress,
        locationName: eventFieldEditState.locationName.trim(),
        city: eventFieldEditState.city.trim(),
        zipCode: eventFieldEditState.zipCode.trim(),
      };
    }

    if (eventFieldEditState.field === "volunteerImpact") {
      const isIndividual = eventFieldEditState.impactType === "individual";

      update.volunteerImpact = {
        ...event.volunteerImpact,
        individualImpactPerHour: isIndividual
          ? eventFieldEditState.amount.trim()
          : event.volunteerImpact.individualImpactPerHour,
        individualImpact: isIndividual
          ? eventFieldEditState.impact.trim()
          : event.volunteerImpact.individualImpact,
        groupImpactPerHour: !isIndividual
          ? eventFieldEditState.amount.trim()
          : event.volunteerImpact.groupImpactPerHour,
        groupImpact: !isIndividual
          ? eventFieldEditState.impact.trim()
          : event.volunteerImpact.groupImpact,
        isIndividualImpact: isIndividual,
        isGroupImpact: !isIndividual,
      };
    }

    if (eventFieldEditState.field === "rosterId") {
      update.rosterId = eventFieldEditState.rosterId || null;
    }

    try {
      await updateEventDetails(update).unwrap();
      setEventFieldEditState(null);
      setEventFieldEditError("");
    } catch (error) {
      console.error("Error updating event details", error);
      setEventFieldEditError("Unable to update event details.");
    }
  };

  const eventState = getUserStateFromZip(event.eventAddress.zipCode)?.st;
  const cityStateText = [event.eventAddress.city, eventState]
    .filter(Boolean)
    .join(", ");
  const locationText =
    cityStateText || event.eventAddress.locationName || event.eventAddress.zipCode || "";
  const eventAddressText = [
    event.eventAddress.streetName,
    cityStateText,
  ]
    .filter(Boolean)
    .join(", ");
  const displayName =
    event.eventOwner.userType === "organization"
      ? event.eventOwner.organizationName
      : event.eventOwner.nonprofitName;
  const invitationFromName =
    event.invitationFrom?.organizationName ||
    event.invitationFrom?.nonprofitName ||
    event.invitationFrom?.fullName;

  const eventDuration = event?.endTime
    ? `${(event.endTime - event.startTime).toFixed(1)} Hours`
    : "? Hours";

  const eventDate = parseEventDateAsLocalDate(event.eventDate);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const eventStartDateTime = parseEventDateTimeAsLocalDate(
    event.eventDate,
    event.startTime
  );
  const eventEndDateTime =
    event.endTime !== undefined
      ? parseEventDateTimeAsLocalDate(event.eventDate, event.endTime)
      : undefined;
  const now = new Date();
  const isBeforeEventStart = now < eventStartDateTime;
  const isWithinEventTime =
    now >= eventStartDateTime &&
    (eventEndDateTime === undefined || now <= eventEndDateTime);
  const hasEventEnded =
    eventEndDateTime !== undefined ? now > eventEndDateTime : undefined;
  const compactDate = eventDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const calculatedEventDuration = event.endTime
    ? event.endTime - event.startTime
    : undefined;
  const formattedStartTime = formatDarbeTimeToString(event.startTime);
  const today = new Date();
  const todayTime = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();
  const eventDateTime = new Date(
    eventDate.getFullYear(),
    eventDate.getMonth(),
    eventDate.getDate()
  ).getTime();
  const signupValueToUse =
    signupCount > 0 ? signupCount : event.signups?.length || 0;
  const signedUpVolunteers = `${signupValueToUse}/${event.maxVolunteerCount} ${
    variant === "match" ? "Volunteers" : "Signed Up"
  }`;
  const isEventPoster = currentUserId === event.eventOwner.id;
  const isEventCoordinator = currentUserId === event.eventCoordinator?.id;
  const isAdditionalVolunteerCoordinator = additionalVolunteerCoordinators.some(
    (coordinator) => coordinator.id === currentUserId
  );
  const canManageVolunteerCheckIns =
    enableAdminControls ||
    isEventPoster ||
    (allowCoordinatorVolunteerManagement &&
      (isEventCoordinator || isAdditionalVolunteerCoordinator));
  const canEditEventFields = isEventPoster || enableAdminControls;
  const isPastEvent =
    hasEventEnded !== undefined ? hasEventEnded : eventDateTime < todayTime;
  const isVolunteerLocked = hasVolunteered || isVolunteering;
  const isCheckInLocked =
    isCheckingIn ||
    isCheckingOut ||
    isAddingVolunteer ||
    isApprovingVolunteer ||
    isDenyingVolunteer ||
    isApprovingAllVolunteers ||
    isUpdatingImpactDetails ||
    isUpdatingEventTime;
  const isSignedUpCard = Boolean(isSignedUp);
  const canSelectVolunteers = canManageVolunteerCheckIns;
  const checkedInVolunteerCount =
    event.signups?.filter((signup) => signup.checkInAt).length ?? 0;
  const currentUserSignup = event.signups?.find(
    (signup) => signup.user.id === currentUserId
  );
  const volunteerCoordinators = [
    ...(event.eventCoordinator ? [event.eventCoordinator] : []),
    ...additionalVolunteerCoordinators,
  ].filter(
    (coordinator, index, coordinators) =>
      coordinator.id &&
      coordinators.findIndex(
        (candidate) => candidate.id === coordinator.id
      ) === index
  );
  const coordinatorVolunteerRow: VolunteerSignupRow[] =
    volunteerCoordinators.map((coordinator) => {
      const coordinatorSignup = event.signups?.find(
        (signup) => signup.user.id === coordinator.id
      );

      return {
        id: coordinatorSignup?.id ?? `coordinator-${coordinator.id}`,
        user: coordinator,
        eventId: event.id,
        status: coordinatorSignup?.status ?? ("volunteered" as const),
        eventActionTimeStamp:
          coordinatorSignup?.eventActionTimeStamp ?? new Date(0).toISOString(),
        checkInAt: coordinatorSignup?.checkInAt,
        checkOutAt: coordinatorSignup?.checkOutAt,
        volunteerStartTime: coordinatorSignup?.volunteerStartTime,
        volunteerEndTime: coordinatorSignup?.volunteerEndTime,
        volunteerLocation: coordinatorSignup?.volunteerLocation,
        volunteerImpact: coordinatorSignup?.volunteerImpact,
        isCoordinator: true,
      };
    });
  const volunteerRows: VolunteerSignupRow[] = [
    ...coordinatorVolunteerRow,
    ...(event.signups ?? [])
      .filter(
        (signup) =>
          !volunteerCoordinators.some(
            (coordinator) => coordinator.id === signup.user.id
          )
      )
      .map((signup): VolunteerSignupRow => ({ ...signup, isCoordinator: false })),
  ];
  const volunteerUserIds = new Set(volunteerRows.map((signup) => signup.user.id));
  const addableVolunteerResults = addVolunteerResults.filter(
    (result) =>
      result.userType === "individual" && !volunteerUserIds.has(result.id)
  );
  const rosterOptions = [...eventOwnerRosters].sort((firstRoster, secondRoster) =>
    firstRoster.rosterName.localeCompare(secondRoster.rosterName)
  );
  const selectedRosterName =
    rosterOptions.find((roster) => roster.id === event.rosterId)?.rosterName ||
    "No roster selected";
  const hasApprovableVolunteers =
    canManageVolunteerCheckIns &&
    isPastEvent &&
    volunteerRows.some(
      (signup) =>
        signup.user.userType !== "organization" &&
        signup.user.userType !== "nonprofit" &&
        Boolean(signup.checkInAt) &&
        Boolean(signup.checkOutAt) &&
        signup.status !== "approved" &&
        signup.status !== "denied" &&
        signup.status !== "no_show"
    );
  const currentUserCheckedIn = Boolean(currentUserSignup?.checkInAt);
  const currentUserCheckedOut = Boolean(currentUserSignup?.checkOutAt);
  const showCurrentEventPassAction =
    useCurrentEventTimingActions && isSignedUpCard && isBeforeEventStart;
  const showCurrentEventCheckInAction =
    useCurrentEventTimingActions &&
    isSignedUpCard &&
    isWithinEventTime &&
    !currentUserCheckedIn;
  const showCurrentEventCheckOutAction =
    useCurrentEventTimingActions &&
    isSignedUpCard &&
    currentUserCheckedIn &&
    !currentUserCheckedOut;

  // TODO: Move out to a hook/util?
  const calculateEventImpact = () => {
    let totalEventGroupGoal;
    let totalEventIndivdualGoal;
    let eventImpactText = "";

    if (event.volunteerImpact.isIndividualImpact) {
      if (calculatedEventDuration) {
        totalEventIndivdualGoal =
          Number(event.volunteerImpact.individualImpactPerHour ?? "1") *
          event.maxVolunteerCount *
          calculatedEventDuration;

        eventImpactText = `${formatImpactNumber(totalEventIndivdualGoal)} ${event.volunteerImpact.individualImpact}`;
      } else {
        totalEventIndivdualGoal =
          Number(event.volunteerImpact.individualImpactPerHour ?? "1") *
          event.maxVolunteerCount;

        eventImpactText = `${formatImpactNumber(totalEventIndivdualGoal)} ${event.volunteerImpact.individualImpact}`;
      }
    }
    if (event.volunteerImpact.isGroupImpact) {
      if (calculatedEventDuration) {
        totalEventGroupGoal =
          Number(event.volunteerImpact.groupImpactPerHour ?? "1") *
          event.maxVolunteerCount *
          calculatedEventDuration;

        eventImpactText = `${formatImpactNumber(totalEventGroupGoal)} ${event.volunteerImpact.groupImpact}`;
      } else {
        totalEventGroupGoal =
          Number(event.volunteerImpact.groupImpactPerHour ?? "1") *
          event.maxVolunteerCount;

        eventImpactText = `${formatImpactNumber(totalEventGroupGoal)} ${event.volunteerImpact.groupImpact}`;
      }
    }

    return eventImpactText;
  };

  const handleDetailsClick = () => {
    navigate(`${EVENTS_ROUTE}/${event.id}`, {
      state: returnToEventsTab ? { returnToEventsTab } : undefined,
    });
  };

  const handleEventNameClick = () => {
    navigate(EVENTS_ROUTE, {
      state: {
        ...(returnToEventsTab ? { activeEventsTab: returnToEventsTab } : {}),
        focusEventId: event.id,
      },
    });
  };

  const eventImpactText = calculateEventImpact();
  const isMatchVariant = variant === "match";
  const eventShareUrl = `${window.location.origin}/home/events/${event.id}`;
  const eventCardClassName = `${styles.eventMatchPreview} ${
    isMatchVariant ? styles.eventMatchPreviewCard : ""
  }`;
  const eventDateToDisplay = isMatchVariant ? compactDate : formattedDate;
  const eventCoverPhoto =
    event.eventCoverPhoto || assetUrl("/images/defaultCoverPhoto.jpg");
  const renderEditPencil = (
    label: string,
    onClick: () => void
  ) =>
    canEditEventFields ? (
      <button
        type="button"
        className={styles.eventFieldEditButton}
        onClick={onClick}
        aria-label={`Edit ${label}`}
      >
        <CustomSvgs
          svgPath="/svgs/common/editProfileIcon.svg"
          variant="small"
          altText=""
        />
      </button>
    ) : null;

  return (
    <div className={eventCardClassName}>
      {isMatchVariant && invitationFromName && (
        <div className={styles.eventInvitationBanner}>
          Invitation from: {invitationFromName}
        </div>
      )}
      <div className={styles.eventMatchHeader}>
        <div className={styles.eventMatchHeaderUserInfo}>
          <UserAvatars
            profilePicture={event.eventOwner.profilePicture}
            onClick={() => handleAvatarClick(event.eventOwner.id)}
          />
          <Typography
            variant="blueTextNormal"
            textToDisplay={displayName}
            onClick={() => handleAvatarClick(event.eventOwner.id)}
            extraClass="clickable"
          />
        </div>
        <div className={styles.eventMatchHeaderDetails}>
          {!isMatchVariant && (
            <IconButton onClick={handleCopyLink}>
              <ContentCopy />
            </IconButton>
          )}
          {!hideDetailsAction && (
            <Typography
              variant="blueTextNormal"
              textToDisplay={"Details"}
              onClick={handleDetailsClick}
              extraClass="clickable"
            />
          )}
        </div>
      </div>
      <div className={styles.eventMatchBodyQuickInfo}>
        <img
          src={eventCoverPhoto}
          className={styles.eventCardCover}
          alt={`event cover - ${event.eventName}`}
        />
        <div className={styles.eventCardSection}>
          <div className={styles.eventCardRowInfo}>
            <CustomSvgs
              svgPath="/svgs/common/hourglassIcon.svg"
              variant="small"
              altText="Event Duration Icon"
            />
            <div className={styles.eventEditableValue}>
              <Typography variant="text" textToDisplay={eventDuration} />
              {renderEditPencil("event time", handleEditEventTime)}
            </div>
          </div>
          <div className={styles.eventCardRowInfo}>
            <CustomSvgs
              svgPath="/svgs/common/calendarIcon.svg"
              variant="small"
              altText="Event Date Icon"
            />
            <div className={styles.eventEditableValue}>
              <Typography variant="text" textToDisplay={eventDateToDisplay} />
              {renderEditPencil("event date", handleEditEventTime)}
            </div>
          </div>
          <div className={styles.eventCardRowInfo}>
            <CustomSvgs
              svgPath="/svgs/common/clockIcon.svg"
              variant="small"
              altText="Event Time Icon"
            />
            <div className={styles.eventEditableValue}>
              <Typography variant="text" textToDisplay={formattedStartTime} />
              {renderEditPencil("event time", handleEditEventTime)}
            </div>
          </div>
          <div className={styles.eventCardRowInfo}>
            <CustomSvgs
              svgPath="/svgs/common/whyVolunteerIcon.svg"
              variant="small"
              altText="Event Location Icon"
            />
            <div className={styles.eventEditableValue}>
              <Typography variant="text" textToDisplay={signedUpVolunteers} />
              {renderEditPencil("volunteer count", () =>
                openEventFieldEdit({
                  field: "maxVolunteerCount",
                  label: "Volunteer Count",
                  value: event.maxVolunteerCount.toString(),
                })
              )}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.eventMatchBodyDescription}>
        <div className={styles.eventTitleEditableLine}>
          <button
            type="button"
            className={styles.eventCardEventNameButton}
            onClick={handleEventNameClick}
          >
            <Typography
              variant="sectionTitle"
              textToDisplay={event.eventName}
              extraClass={styles.eventCardEventName}
            />
          </button>
          {renderEditPencil("event name", () =>
            openEventFieldEdit({
              field: "eventName",
              label: "Event Name",
              value: event.eventName,
            })
          )}
        </div>
        {canEditEventFields && (
          <div className={styles.eventEditableLine}>
            <span className={styles.eventRosterText}>
              <strong>Roster:</strong> {selectedRosterName}
            </span>
            {renderEditPencil("event roster", () =>
              openEventFieldEdit({
                field: "rosterId",
                label: "Roster",
                rosterId: event.rosterId ?? "",
              })
            )}
          </div>
        )}
        <div className={`${styles.eventEditableLine} ${styles.eventLocationSection}`}>
          <div className={styles.eventLocationText}>
            <strong>Location</strong>
            {event.eventAddress.locationName && (
              <span>{event.eventAddress.locationName}</span>
            )}
            {eventAddressText && <span>{eventAddressText}</span>}
            {event.eventAddress.zipCode && (
              <span>{event.eventAddress.zipCode}</span>
            )}
          </div>
          {renderEditPencil("event location", () =>
            openEventFieldEdit({
              field: "location",
              label: "Location",
              locationName: event.eventAddress.locationName ?? "",
              city: event.eventAddress.city ?? "",
              zipCode: event.eventAddress.zipCode ?? "",
            })
          )}
        </div>
        <div className={styles.eventEditableLine}>
          <Typography variant="text" textToDisplay={event.eventDescription} />
          {renderEditPencil("event description", () =>
            openEventFieldEdit({
              field: "eventDescription",
              label: "Description",
              value: event.eventDescription,
              multiline: true,
            })
          )}
        </div>
        <div>
          <Typography
            variant="text"
            textToDisplay="Volunteer Impact:"
            extraClass={styles.eventCardImpactLabel}
          />
          <Typography variant="text" textToDisplay={eventImpactText} />
          {renderEditPencil("volunteer impact", () => {
            const isIndividual = Boolean(event.volunteerImpact.isIndividualImpact);

            openEventFieldEdit({
              field: "volunteerImpact",
              label: "Volunteer Impact",
              amount: isIndividual
                ? event.volunteerImpact.individualImpactPerHour ?? ""
                : event.volunteerImpact.groupImpactPerHour ?? "",
              impact: isIndividual
                ? event.volunteerImpact.individualImpact ?? ""
                : event.volunteerImpact.groupImpact ?? "",
              impactType: isIndividual ? "individual" : "group",
            });
          })}
        </div>
      </div>

      {!impactView && (
        <div className={styles.eventMatchFooter}>
          <button
            type="button"
            className={styles.eventSeeVolunteersButton}
            onClick={() => {
              if (canExpandVolunteers) {
                setIsVolunteerListOpen((isOpen) => !isOpen);
                return;
              }

              handleDetailsClick();
            }}
            aria-expanded={canExpandVolunteers ? isVolunteerListOpen : undefined}
          >
            See Volunteers
            <CustomSvgs
              svgPath={
                canExpandVolunteers && isVolunteerListOpen
                  ? "/svgs/common/goUpIcon.svg"
                  : "/svgs/common/goForwardIcon.svg"
              }
              variant="small"
              altText=""
            />
          </button>
          {!isEventPoster && !hideVolunteerActions && (
            <div className={styles.eventMatchActions}>
              {showRecommendToFollowersAction ? (
                <>
                  <DarbeButton
                    buttonText="Pass"
                    onClick={handlePassEvent}
                    darbeButtonType="secondaryNextButton"
                    isDisabled={isPassing}
                  />
                  <DarbeButton
                    buttonText="Invite Members"
                    onClick={handleRecommendEvent}
                    darbeButtonType="nextButton"
                    isDisabled={isRecommending}
                  />
                </>
              ) : showVolunteerAndPassActions && !hasVolunteered && !isSignedUpCard ? (
                <>
                  <DarbeButton
                    buttonText="Pass"
                    onClick={handlePassEvent}
                    darbeButtonType="secondaryNextButton"
                    isDisabled={isPassing}
                  />
                  <DarbeButton
                    buttonText="Volunteer"
                    onClick={handleVolunteerEvent}
                    darbeButtonType="nextButton"
                    isDisabled={isVolunteerLocked}
                  />
                </>
              ) : showCurrentEventPassAction ? (
                <DarbeButton
                  buttonText="Pass"
                  onClick={handlePassEvent}
                  darbeButtonType="secondaryNextButton"
                  isDisabled={isPassing}
                />
              ) : showCurrentEventCheckInAction ? (
                <DarbeButton
                  buttonText="Check In"
                  onClick={() => handleCheckInEvent()}
                  darbeButtonType="nextButton"
                  isDisabled={isCheckingIn}
                />
              ) : showCurrentEventCheckOutAction ? (
                <DarbeButton
                  buttonText="Check Out"
                  onClick={() => handleCheckOutEvent()}
                  darbeButtonType="checkoutButton"
                  isDisabled={isCheckInLocked}
                />
              ) : !hasVolunteered && !isSignedUpCard ? (
                <DarbeButton
                  buttonText="Pass"
                  onClick={handlePassEvent}
                  darbeButtonType="secondaryNextButton"
                  isDisabled={isPassing}
                />
              ) : isSignedUpCard && canUnvolunteer && !useCurrentEventTimingActions ? (
                <DarbeButton
                  buttonText="Unvolunteer"
                  onClick={handleUnvolunteerEvent}
                  darbeButtonType="secondaryNextButton"
                  isDisabled={isUnvolunteering}
                />
              ) : !isSignedUpCard ? (
                <DarbeButton
                  buttonText={
                    hasVolunteered ? "Volunteered" : "Volunteer"
                  }
                  onClick={handleVolunteerEvent}
                  darbeButtonType="nextButton"
                  isDisabled={isVolunteerLocked}
                />
              ) : null}
            </div>
          )}
          {incompleteActionLabel && onIncompleteAction && (
            <div className={styles.eventMatchActions}>
              <DarbeButton
                buttonText={incompleteActionLabel}
                onClick={() => onIncompleteAction(event.id)}
                darbeButtonType="nextButton"
              />
            </div>
          )}
        </div>
      )}
      {canExpandVolunteers && isVolunteerListOpen && (
        <div className={styles.eventVolunteerList}>
          {canManageVolunteerCheckIns && (
            <div className={styles.eventVolunteerAdminToolbar}>
              <div className={styles.eventVolunteerSearchWrap}>
                <CustomSvgs
                  svgPath="/svgs/common/searchIcon.svg"
                  variant="small"
                  altText=""
                />
                <input
                  type="search"
                  placeholder="Search"
                  value={addVolunteerSearch}
                  onFocus={() => setIsAddVolunteerOpen(true)}
                  onChange={(event) => {
                    setAddVolunteerSearch(event.target.value);
                    setIsAddVolunteerOpen(true);
                  }}
                />
              </div>
              <div className={styles.eventVolunteerAdminActions}>
                <button
                  type="button"
                  className={styles.eventVolunteerAddButton}
                  onClick={() => setIsAddVolunteerOpen((isOpen) => !isOpen)}
                >
                  Add Volunteer
                </button>
                <button
                  type="button"
                  className={styles.eventVolunteerApproveAllButton}
                  onClick={handleApproveAllVolunteers}
                  disabled={isCheckInLocked || !hasApprovableVolunteers}
                >
                  Approve All
                </button>
              </div>
            </div>
          )}
          {canManageVolunteerCheckIns &&
            isAddVolunteerOpen &&
            addVolunteerSearch.trim().length >= 3 && (
            <div className={styles.eventVolunteerAddPanel}>
              {addableVolunteerResults.map((result) => {
                const resultName =
                  result.fullName ||
                  `${result.firstName ?? ""} ${result.lastName ?? ""}`.trim();

                return (
                  <button
                    type="button"
                    key={result.id}
                    onClick={() => handleAddVolunteer(result.id)}
                    disabled={isCheckInLocked}
                  >
                    <span>{resultName}</span>
                    <strong>Add</strong>
                  </button>
                );
              })}
              {addableVolunteerResults.length === 0 && (
                <p className={styles.eventVolunteerNoSearchResults}>
                  No volunteers found.
                </p>
              )}
            </div>
          )}
          {volunteerRows.map((signup) => {
            const volunteerName =
              signup.user.fullName ||
              signup.user.organizationName ||
              signup.user.nonprofitName ||
              `${signup.user.firstName ?? ""} ${signup.user.lastName ?? ""}`.trim();
            const isCurrentVolunteer = signup.user.id === currentUserId;
            const hasSignupRecord = !signup.id.startsWith("coordinator-");
            const isCheckableUser =
              signup.user.userType !== "organization" &&
              signup.user.userType !== "nonprofit";
            const isVolunteerCoordinator =
              signup.user.id === event.eventCoordinator?.id;
            const isCheckedIn = Boolean(signup.checkInAt);
            const isCheckedOut = Boolean(signup.checkOutAt);
            const isNoShow = signup.status === "no_show";
            const isApproved = signup.status === "approved";
            const isDenied = signup.status === "denied";
            const canShowApprovalActions =
              canManageVolunteerCheckIns &&
              isCheckableUser &&
              isPastEvent &&
              isCheckedIn &&
              !isApproved &&
              !isDenied &&
              !isNoShow;
            const isPendingPastVolunteer =
              isPastEvent &&
              !canManageVolunteerCheckIns &&
              !isApproved &&
              !isDenied &&
              !isNoShow;
            const hasVolunteeredForPastEvent =
              isPastEvent && isCheckedIn && !canShowApprovalActions;
            const isPostEventNoShow = isPastEvent && !isCheckedIn;
            const checkStatusText = isNoShow
              ? "No Show"
              : isDenied
              ? "No Show"
              : isApproved
              ? "Volunteered"
              : isPendingPastVolunteer
              ? ""
              : isPostEventNoShow
              ? "No Show"
              : hasVolunteeredForPastEvent
              ? "Volunteered"
              : isCheckedOut
              ? "Checked Out"
              : isCheckedIn
              ? "Checked In"
              : "Not Checked In";
            const checkedOutTimeText = checkStatusText && isCheckedOut
              ? formatCheckTimestamp(signup.checkOutAt)
              : "";
            const checkedInTimeText =
              checkStatusText && isCheckedIn && !isCheckedOut
                ? formatCheckTimestamp(signup.checkInAt)
                : "";
            const checkButtonText = isCheckedIn ? "Check Out" : "Check In";
            const isManageableVolunteer =
              isCheckableUser &&
              (hasSignupRecord ||
                (canManageVolunteerCheckIns && isVolunteerCoordinator));
            const canShowSelfCheckAction =
              isCurrentVolunteer &&
              isManageableVolunteer &&
              !isPastEvent &&
              !isCheckedOut &&
              isWithinEventTime;
            const canShowManagedCheckAction =
              canManageVolunteerCheckIns &&
              isManageableVolunteer &&
              isWithinEventTime &&
              !isCheckedOut &&
              !isApproved &&
              !isDenied &&
              !isNoShow;
            const canShowCheckAction =
              canShowSelfCheckAction || canShowManagedCheckAction;
            const canEditImpactDetails =
              canManageVolunteerCheckIns &&
              isCheckableUser &&
              (hasSignupRecord || isVolunteerCoordinator) &&
              isPastEvent;
            const showApprovalCandidateLayout =
              isPastEvent &&
              (canShowApprovalActions ||
                isApproved ||
                isDenied ||
                canEditImpactDetails);
            const impactDetailOverride = impactDetailOverrides[signup.id];
            const canUseDefaultVolunteerTimes = !isPastEvent || isCheckedIn;
            const candidateStartTime =
              timeInputValueToDisplayTime(
                impactDetailOverride?.startTime ||
                  signup.volunteerStartTime ||
                  formatVolunteerActionTime(signup.checkInAt) ||
                  (canUseDefaultVolunteerTimes
                    ? formatEventTimeRangeValue(event.startTime)
                    : "")
              );
            const candidateEndTime =
              timeInputValueToDisplayTime(
                impactDetailOverride?.endTime ||
                  signup.volunteerEndTime ||
                  formatVolunteerActionTime(signup.checkOutAt) ||
                  (canUseDefaultVolunteerTimes
                    ? formatEventTimeRangeValue(event.endTime)
                    : "")
              );
            const candidateLocation =
              impactDetailOverride?.location ||
              signup.volunteerLocation ||
              event.eventAddress.locationName ||
              locationText;
            const candidateImpact =
              impactDetailOverride?.impact ||
              signup.volunteerImpact ||
              eventImpactText ||
              "--";

            return (
              <div
                className={`${styles.eventVolunteerRow} ${
                  showApprovalCandidateLayout
                    ? styles.eventVolunteerApprovalRow
                    : ""
                }`.trim()}
                key={signup.id}
              >
                <div className={styles.eventVolunteerMain}>
                  <div className={styles.eventVolunteerInfo}>
                    <button
                      type="button"
                      className={styles.eventVolunteerAvatarButton}
                      onClick={() => handleAvatarClick(signup.user.id)}
                      aria-label={`Open ${volunteerName} profile`}
                    >
                      <img
                        className={styles.eventVolunteerAvatar}
                        src={
                          signup.user.profilePicture ||
                          assetUrl("/images/defaultProfilePicture.jpg")
                        }
                        alt=""
                      />
                    </button>
                    <div className={styles.eventVolunteerText}>
                      <button
                        type="button"
                        onClick={() => handleAvatarClick(signup.user.id)}
                      >
                        {volunteerName}
                      </button>
                      <span>
                        {signup.isCoordinator
                          ? "Volunteer Coordinator"
                          : signup.user.jobTitle}
                      </span>
                    </div>
                  </div>
                  {showApprovalCandidateLayout && (
                    <div className={styles.eventVolunteerCandidateDetails}>
                      <span>
                        <strong>Start Time:</strong>{" "}
                        {candidateStartTime}
                      </span>
                      <span>
                        <strong>Location:</strong>{" "}
                        {candidateLocation}
                      </span>
                      <span>
                        <strong>End Time:</strong>{" "}
                        {candidateEndTime}
                      </span>
                      <span>
                        <strong>Impact:</strong> {candidateImpact}
                      </span>
                    </div>
                  )}
                </div>
                <div className={styles.eventVolunteerCheckIn}>
                  {!showApprovalCandidateLayout && (
                    <div className={styles.eventVolunteerCheckStatus}>
                      {checkStatusText && <strong>{checkStatusText}</strong>}
                      {checkedOutTimeText && (
                        <span className={styles.eventVolunteerCheckTime}>
                          {checkedOutTimeText}
                        </span>
                      )}
                      {checkedInTimeText && (
                        <span className={styles.eventVolunteerCheckTime}>
                          {checkedInTimeText}
                        </span>
                      )}
                    </div>
                  )}
                  {showApprovalCandidateLayout && !canShowApprovalActions && (
                    <div className={styles.eventVolunteerCheckStatus}>
                      {checkStatusText && <strong>{checkStatusText}</strong>}
                    </div>
                  )}
                  {canShowCheckAction && (
                    <button
                      type="button"
                      className={styles.eventVolunteerCheckInButton}
                      onClick={() =>
                        isCheckedIn
                          ? handleCheckOutEvent(signup.user.id)
                          : handleCheckInEvent(signup.user.id)
                      }
                      disabled={isCheckInLocked}
                    >
                      {checkButtonText}
                    </button>
                  )}
                  {canShowApprovalActions && (
                    <div className={styles.eventVolunteerApprovalActions}>
                      <button
                        type="button"
                        className={styles.eventVolunteerApproveButton}
                        onClick={() => handleApproveVolunteer(signup.user.id)}
                        disabled={isCheckInLocked}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className={styles.eventVolunteerDenyButton}
                        onClick={() => handleDenyVolunteer(signup.user.id)}
                        disabled={isCheckInLocked}
                      >
                        Deny
                      </button>
                    </div>
                  )}
                  {canEditImpactDetails && (
                    <button
                      type="button"
                      className={styles.eventVolunteerApprovalMark}
                      onClick={() => {
                        setImpactEditState({
                          signupId: signup.id,
                          startTime: timeTextToTimeInputValue(candidateStartTime),
                          endTime: timeTextToTimeInputValue(candidateEndTime),
                          location: candidateLocation,
                          impact: candidateImpact,
                        });
                        setImpactEditError("");
                      }}
                      aria-label={`Edit ${volunteerName} impact details`}
                    >
                      <CustomSvgs
                        svgPath="/svgs/common/editProfileIcon.svg"
                        variant="small"
                        altText=""
                      />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div className={styles.eventVolunteerListFooter}>
            <strong>
              Check in status: {checkedInVolunteerCount}/{event.maxVolunteerCount}{" "}
              Volunteers Checked in
            </strong>
            {canSelectVolunteers && (
              <button type="button">
                Select Volunteers
                <CustomSvgs
                  svgPath="/svgs/common/goDownIcon.svg"
                  variant="small"
                  altText=""
                />
              </button>
            )}
          </div>
        </div>
      )}
      {showVolunteerDialog ? (
        <div className={styles.eventVolunteerDialogOverlay}>
          <div
            className={styles.eventVolunteerDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`volunteer-dialog-title-${event.id}`}
          >
            <h2
              className={styles.eventVolunteerDialogTitle}
              id={`volunteer-dialog-title-${event.id}`}
            >
              <span
                className={styles.eventVolunteerDialogIcon}
                aria-hidden="true"
              />
              <span>Event Accepted</span>
            </h2>
          </div>
        </div>
      ) : null}
      {showPassConfirmDialog ? (
        <div className={styles.eventVolunteerDialogOverlay}>
          <div
            className={styles.eventPassConfirmDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`pass-dialog-title-${event.id}`}
          >
            <h2
              className={styles.eventPassConfirmTitle}
              id={`pass-dialog-title-${event.id}`}
            >
              Are you sure you want to Pass?
            </h2>
            <div className={styles.eventPassConfirmActions}>
              <button
                type="button"
                className={styles.eventPassYesButton}
                onClick={handleConfirmPassEvent}
                disabled={isPassing}
              >
                Yes
              </button>
              <button
                type="button"
                className={styles.eventPassCancelButton}
                onClick={() => setShowPassConfirmDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {showPassRejectedDialog ? (
        <div className={styles.eventVolunteerDialogOverlay}>
          <div className={styles.eventVolunteerDialog} role="status">
            <h2 className={styles.eventVolunteerDialogTitle}>
              <span
                className={styles.eventVolunteerDialogIcon}
                aria-hidden="true"
              />
              <span>Event Rejected</span>
            </h2>
          </div>
        </div>
      ) : null}
      {approvalDialogMessage ? (
        <div className={styles.eventVolunteerDialogOverlay}>
          <div className={styles.eventVolunteerDialog} role="status">
            <h2 className={styles.eventVolunteerDialogTitle}>
              <span
                className={styles.eventVolunteerDialogIcon}
                aria-hidden="true"
              />
              <span>{approvalDialogMessage}</span>
            </h2>
          </div>
        </div>
      ) : null}
      {eventFieldEditState ? (
        <div className={styles.eventTimeEditOverlay}>
          <div
            className={styles.eventTimeEditDialog}
            role="dialog"
            aria-modal="true"
          >
            <h2>Edit {eventFieldEditState.label}</h2>
            {(eventFieldEditState.field === "eventName" ||
              eventFieldEditState.field === "eventDescription" ||
              eventFieldEditState.field === "maxVolunteerCount") && (
              <label>
                <span>{eventFieldEditState.label}</span>
                {eventFieldEditState.field === "eventDescription" ? (
                  <textarea
                    value={eventFieldEditState.value}
                    onChange={(event) =>
                      setEventFieldEditState((currentState) =>
                        currentState &&
                        (currentState.field === "eventName" ||
                          currentState.field === "eventDescription" ||
                          currentState.field === "maxVolunteerCount")
                          ? { ...currentState, value: event.target.value }
                          : currentState
                      )
                    }
                  />
                ) : (
                  <input
                    type={
                      eventFieldEditState.field === "maxVolunteerCount"
                        ? "number"
                        : "text"
                    }
                    value={eventFieldEditState.value}
                    onChange={(event) =>
                      setEventFieldEditState((currentState) =>
                        currentState &&
                        (currentState.field === "eventName" ||
                          currentState.field === "eventDescription" ||
                          currentState.field === "maxVolunteerCount")
                          ? { ...currentState, value: event.target.value }
                          : currentState
                      )
                    }
                  />
                )}
              </label>
            )}
            {eventFieldEditState.field === "location" && (
              <>
                <label>
                  <span>Location</span>
                  <input
                    value={eventFieldEditState.locationName}
                    onChange={(event) =>
                      setEventFieldEditState((currentState) =>
                        currentState?.field === "location"
                          ? {
                              ...currentState,
                              locationName: event.target.value,
                            }
                          : currentState
                      )
                    }
                  />
                </label>
                <label>
                  <span>City</span>
                  <input
                    value={eventFieldEditState.city}
                    onChange={(event) =>
                      setEventFieldEditState((currentState) =>
                        currentState?.field === "location"
                          ? { ...currentState, city: event.target.value }
                          : currentState
                      )
                    }
                  />
                </label>
                <label>
                  <span>Zip Code</span>
                  <input
                    value={eventFieldEditState.zipCode}
                    onChange={(event) =>
                      setEventFieldEditState((currentState) =>
                        currentState?.field === "location"
                          ? { ...currentState, zipCode: event.target.value }
                          : currentState
                      )
                    }
                  />
                </label>
              </>
            )}
            {eventFieldEditState.field === "volunteerImpact" && (
              <>
                <label>
                  <span>Type</span>
                  <select
                    value={eventFieldEditState.impactType}
                    onChange={(event) =>
                      setEventFieldEditState((currentState) =>
                        currentState?.field === "volunteerImpact"
                          ? {
                              ...currentState,
                              impactType: event.target.value as
                                | "individual"
                                | "group",
                            }
                          : currentState
                      )
                    }
                  >
                    <option value="individual">Individual</option>
                    <option value="group">Group</option>
                  </select>
                </label>
                <label>
                  <span>Amount</span>
                  <input
                    value={eventFieldEditState.amount}
                    onChange={(event) =>
                      setEventFieldEditState((currentState) =>
                        currentState?.field === "volunteerImpact"
                          ? { ...currentState, amount: event.target.value }
                          : currentState
                      )
                    }
                  />
                </label>
                <label>
                  <span>Impact</span>
                  <input
                    value={eventFieldEditState.impact}
                    onChange={(event) =>
                      setEventFieldEditState((currentState) =>
                        currentState?.field === "volunteerImpact"
                          ? { ...currentState, impact: event.target.value }
                          : currentState
                      )
                    }
                  />
                </label>
              </>
            )}
            {eventFieldEditState.field === "rosterId" && (
              <label>
                <span>Roster</span>
                <select
                  value={eventFieldEditState.rosterId}
                  onChange={(event) =>
                    setEventFieldEditState((currentState) =>
                      currentState?.field === "rosterId"
                        ? { ...currentState, rosterId: event.target.value }
                        : currentState
                    )
                  }
                >
                  <option value="">No roster selected</option>
                  {rosterOptions.map((roster) => (
                    <option key={roster.id} value={roster.id}>
                      {roster.rosterName}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className={styles.eventTimeEditActions}>
              <button
                type="button"
                className={styles.eventTimeEditSave}
                onClick={handleSaveEventField}
                disabled={isUpdatingEventDetails}
              >
                Save
              </button>
              <button
                type="button"
                className={styles.eventTimeEditCancel}
                onClick={() => setEventFieldEditState(null)}
                disabled={isUpdatingEventDetails}
              >
                Cancel
              </button>
            </div>
            {eventFieldEditError && (
              <p className={styles.eventTimeEditError}>{eventFieldEditError}</p>
            )}
          </div>
        </div>
      ) : null}
      {eventTimeEditState ? (
        <div className={styles.eventTimeEditOverlay}>
          <div
            className={styles.eventTimeEditDialog}
            role="dialog"
            aria-modal="true"
          >
            <h2>Edit Time</h2>
            <label>
              <span>Event Date</span>
              <input
                type="date"
                value={eventTimeEditState.eventDate}
                onChange={(event) =>
                  setEventTimeEditState((currentState) =>
                    currentState
                      ? { ...currentState, eventDate: event.target.value }
                      : currentState
                  )
                }
              />
            </label>
            <label>
              <span>Start Time</span>
              <input
                type="time"
                value={eventTimeEditState.startTime}
                onChange={(event) =>
                  setEventTimeEditState((currentState) =>
                    currentState
                      ? { ...currentState, startTime: event.target.value }
                      : currentState
                  )
                }
              />
            </label>
            <label>
              <span>End Time</span>
              <input
                type="time"
                value={eventTimeEditState.endTime}
                onChange={(event) =>
                  setEventTimeEditState((currentState) =>
                    currentState
                      ? { ...currentState, endTime: event.target.value }
                      : currentState
                  )
                }
              />
            </label>
            <div className={styles.eventTimeEditActions}>
              <button
                type="button"
                className={styles.eventTimeEditSave}
                onClick={handleSaveEventTime}
                disabled={isUpdatingEventTime}
              >
                Save
              </button>
              <button
                type="button"
                className={styles.eventTimeEditCancel}
                onClick={() => setEventTimeEditState(null)}
                disabled={isUpdatingEventTime}
              >
                Cancel
              </button>
            </div>
            {eventTimeEditError && (
              <p className={styles.eventTimeEditError}>{eventTimeEditError}</p>
            )}
          </div>
        </div>
      ) : null}
      {impactEditState ? (
        <div className={styles.eventImpactEditOverlay}>
          <div className={styles.eventImpactEditDialog} role="dialog" aria-modal="true">
            <label>
              <span>Start Time:</span>
              <input
                type="time"
                value={impactEditState.startTime}
                onChange={(event) =>
                  setImpactEditState((currentState) =>
                    currentState
                      ? { ...currentState, startTime: event.target.value }
                      : currentState
                  )
                }
              />
            </label>
            <label>
              <span>End Time:</span>
              <input
                type="time"
                value={impactEditState.endTime}
                onChange={(event) =>
                  setImpactEditState((currentState) =>
                    currentState
                      ? { ...currentState, endTime: event.target.value }
                      : currentState
                  )
                }
              />
            </label>
            <label>
              <span>Location:</span>
              <input
                value={impactEditState.location}
                onChange={(event) =>
                  setImpactEditState((currentState) =>
                    currentState
                      ? { ...currentState, location: event.target.value }
                      : currentState
                  )
                }
              />
            </label>
            <label>
              <span>Impact:</span>
              <input
                value={impactEditState.impact}
                onChange={(event) =>
                  setImpactEditState((currentState) =>
                    currentState
                      ? { ...currentState, impact: event.target.value }
                      : currentState
                  )
                }
              />
            </label>
            <div className={styles.eventImpactEditActions}>
              <button
                type="button"
                className={styles.eventImpactEditSave}
                onClick={handleSaveImpactDetails}
                disabled={isUpdatingImpactDetails}
              >
                Save
              </button>
              <button
                type="button"
                className={styles.eventImpactEditCancel}
                onClick={() => setImpactEditState(null)}
              >
                Cancel
              </button>
            </div>
            {impactEditError && (
              <p className={styles.eventImpactEditError}>{impactEditError}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
