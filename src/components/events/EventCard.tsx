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
  useRemoveEventInvitationVolunteerMutation,
  useRemoveEventVolunteerMutation,
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
  onDeleteEvent?: (eventId: string) => Promise<void> | void;
  useCurrentEventTimingActions?: boolean;
  showVolunteerAndPassActions?: boolean;
  showRecommendToFollowersAction?: boolean;
  showInvitationBanner?: boolean;
  onVolunteerSuccess?: (eventId: string) => void;
  onPassSuccess?: (eventId: string) => void;
  onRecommendSuccess?: (eventId: string) => void;
  allowCoordinatorVolunteerManagement?: boolean;
  enableAdminControls?: boolean;
  canDeleteEvent?: boolean;
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

const getSearchResultDisplayName = (result: {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  nonprofitName?: string;
}) =>
  result.fullName ||
  result.organizationName ||
  result.nonprofitName ||
  `${result.firstName ?? ""} ${result.lastName ?? ""}`.trim();

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
  isInvitationGroup?: boolean;
  isInvitationChild?: boolean;
  effectiveInvitedByEntity?: SimpleUserInfo;
  invitedVolunteerCount?: number;
  invitedVolunteerCheckedInCount?: number;
};

const isInvitationEntityUser = (user: SimpleUserInfo) =>
  user.userType === "organization" || user.userType === "nonprofit";

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
  onDeleteEvent,
  useCurrentEventTimingActions = false,
  showVolunteerAndPassActions = false,
  showRecommendToFollowersAction = false,
  showInvitationBanner = false,
  onVolunteerSuccess,
  onPassSuccess,
  onRecommendSuccess,
  allowCoordinatorVolunteerManagement = true,
  enableAdminControls = false,
  canDeleteEvent = false,
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
  const [
    removeEventInvitationVolunteer,
    { isLoading: isRemovingInvitationVolunteer },
  ] = useRemoveEventInvitationVolunteerMutation();
  const [removeEventVolunteer, { isLoading: isRemovingEventVolunteer }] =
    useRemoveEventVolunteerMutation();
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
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [approvalDialogMessage, setApprovalDialogMessage] = useState("");
  const [isVolunteerListOpen, setIsVolunteerListOpen] = useState(false);
  const [openInvitationGroupIds, setOpenInvitationGroupIds] = useState<
    Set<string>
  >(new Set());
  const [isAddVolunteerOpen, setIsAddVolunteerOpen] = useState(false);
  const [addVolunteerSearch, setAddVolunteerSearch] = useState("");
  const [activeInvitationAddGroupId, setActiveInvitationAddGroupId] =
    useState<string | null>(null);
  const [invitationAddSearch, setInvitationAddSearch] = useState("");
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
  const activeInvitationAddEntity = activeInvitationAddGroupId
    ? event.signups?.find((signup) => signup.user.id === activeInvitationAddGroupId)
        ?.user ??
      event.signups?.find(
        (signup) => signup.invitedByEntity?.id === activeInvitationAddGroupId
      )?.invitedByEntity ??
      additionalVolunteerCoordinators.find(
        (coordinator) => coordinator.id === activeInvitationAddGroupId
      ) ??
      (event.eventCoordinator?.id === activeInvitationAddGroupId
        ? event.eventCoordinator
        : undefined)
    : undefined;
  const isActiveInvitationAddEntityUser = activeInvitationAddEntity
    ? isInvitationEntityUser(activeInvitationAddEntity)
    : false;
  const { data: activeInvitationEntityRosters = [] } = useGetRostersQuery(
    activeInvitationAddGroupId ?? "",
    {
      skip: !activeInvitationAddGroupId || !isActiveInvitationAddEntityUser,
    }
  );
  const activeAddVolunteerSearch =
    activeInvitationAddGroupId ? invitationAddSearch : addVolunteerSearch;
  const { data: addVolunteerResults = [] } = useGetSearchResultsQuery(
    activeAddVolunteerSearch,
    {
      skip: activeAddVolunteerSearch.trim().length < 3,
    }
  );

  const handleAvatarClick = (userId: string) => {
    navigate(`${PROFILE_ROUTE}/${userId}`);
  };

  const handleInvitationGroupToggle = (inviterId: string) => {
    setOpenInvitationGroupIds((groupIds) => {
      const nextGroupIds = new Set(groupIds);

      if (nextGroupIds.has(inviterId)) {
        nextGroupIds.delete(inviterId);
      } else {
        nextGroupIds.add(inviterId);
      }

      return nextGroupIds;
    });
  };

  const handleInvitationAddToggle = (inviterId: string) => {
    setIsAddVolunteerOpen(false);
    setActiveInvitationAddGroupId((currentInviterId) =>
      currentInviterId === inviterId ? null : inviterId
    );
    setInvitationAddSearch("");
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
      setApprovalDialogMessage("Volunteer Added");
      setTimeout(() => setApprovalDialogMessage(""), 1400);
    } catch (error) {
      console.error("Error adding volunteer to event", error);
    }
  };

  const handleAddInvitationVolunteer = async (
    targetUserId: string,
    invitedByEntityId: string
  ) => {
    try {
      await addEventVolunteer({
        eventId: event.id,
        userId: targetUserId,
        invitedByEntityId,
      }).unwrap();
      setInvitationAddSearch("");
      setActiveInvitationAddGroupId(null);
      setOpenInvitationGroupIds((groupIds) => {
        const nextGroupIds = new Set(groupIds);
        nextGroupIds.add(invitedByEntityId);
        return nextGroupIds;
      });
      setApprovalDialogMessage("Volunteer Added");
      setTimeout(() => setApprovalDialogMessage(""), 1400);
    } catch (error) {
      console.error("Error adding volunteer to invitation group", error);
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

  const handleRemoveInvitationVolunteer = async (
    targetUserId: string,
    invitedByEntityId: string
  ) => {
    try {
      await removeEventInvitationVolunteer({
        eventId: event.id,
        userId: targetUserId,
        invitedByEntityId,
      }).unwrap();
    } catch (error) {
      console.error("Error removing volunteer from organization list", error);
    }
  };

  const handleRemoveEventVolunteer = async (targetUserId: string) => {
    try {
      await removeEventVolunteer({
        eventId: event.id,
        userId: targetUserId,
      }).unwrap();
    } catch (error) {
      console.error("Error removing volunteer from event", error);
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
          ? ""
          : event.volunteerImpact.individualImpactPerHour,
        individualImpact: isIndividual
          ? eventFieldEditState.impact.trim()
          : event.volunteerImpact.individualImpact,
        groupImpactPerHour: !isIndividual
          ? ""
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
  const canAdminManageVolunteers = enableAdminControls || isEventPoster;
  const canCoordinateVolunteers =
    allowCoordinatorVolunteerManagement &&
    (isEventCoordinator || isAdditionalVolunteerCoordinator);
  const canManageVolunteerCheckIns =
    canAdminManageVolunteers || canCoordinateVolunteers;
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
    isRemovingInvitationVolunteer ||
    isRemovingEventVolunteer ||
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
  const nonCoordinatorSignups = (event.signups ?? []).filter(
    (signup) =>
      !volunteerCoordinators.some(
        (coordinator) => coordinator.id === signup.user.id
      )
  );
  const getVolunteerDisplayName = (user: SimpleUserInfo) =>
    user.fullName ||
    user.organizationName ||
    user.nonprofitName ||
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  const getVolunteerLastNameSortValue = (
    signup: ShortEventState["signups"][number]
  ) => {
    const displayNameParts = getVolunteerDisplayName(signup.user)
      .trim()
      .split(/\s+/);

    return (
      signup.user.lastName ||
      displayNameParts[displayNameParts.length - 1] ||
      ""
    ).toLowerCase();
  };
  const sortVolunteerSignupsByLastName = (
    signups: ShortEventState["signups"]
  ) =>
    [...signups].sort((firstSignup, secondSignup) => {
      const lastNameComparison = getVolunteerLastNameSortValue(
        firstSignup
      ).localeCompare(getVolunteerLastNameSortValue(secondSignup));

      if (lastNameComparison !== 0) {
        return lastNameComparison;
      }

      return getVolunteerDisplayName(firstSignup.user).localeCompare(
        getVolunteerDisplayName(secondSignup.user)
      );
    });
  const signupsByInviter = new Map<string, ShortEventState["signups"]>();
  const inviterById = new Map<string, NonNullable<ShortEventState["signups"][number]["invitedByEntity"]>>();
  const ungroupedSignups: ShortEventState["signups"] = [];

  nonCoordinatorSignups.forEach((signup) => {
    const invitedByEntity = signup.invitedByEntity;

    if (!invitedByEntity?.id) {
      ungroupedSignups.push(signup);
      return;
    }

    inviterById.set(invitedByEntity.id, invitedByEntity);
    const groupSignups = signupsByInviter.get(invitedByEntity.id) ?? [];
    groupSignups.push(signup);
    signupsByInviter.set(invitedByEntity.id, groupSignups);
  });

  const coordinatorVolunteerRow: VolunteerSignupRow[] =
    volunteerCoordinators.flatMap((coordinator) => {
      const coordinatorSignup = event.signups?.find(
        (signup) => signup.user.id === coordinator.id
      );
      const groupSignups = signupsByInviter.get(coordinator.id) ?? [];
      const visibleGroupSignups = sortVolunteerSignupsByLastName(groupSignups);
      const hasInvitedVolunteers = groupSignups.length > 0;
      const coordinatorRow: VolunteerSignupRow = {
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
        invitedByEntity: coordinatorSignup?.invitedByEntity,
        isCoordinator: true,
        isInvitationGroup: hasInvitedVolunteers,
        invitedVolunteerCount: groupSignups.length,
        invitedVolunteerCheckedInCount: groupSignups.filter((signup) =>
          Boolean(signup.checkInAt)
        ).length,
      };

      if (!hasInvitedVolunteers) {
        return [coordinatorRow];
      }

      signupsByInviter.delete(coordinator.id);

      if (!openInvitationGroupIds.has(coordinator.id)) {
        return [coordinatorRow];
      }

      return [
        coordinatorRow,
        ...visibleGroupSignups.map((signup): VolunteerSignupRow => ({
          ...signup,
          isCoordinator: false,
          isInvitationChild: true,
          effectiveInvitedByEntity: signup.invitedByEntity,
        })),
      ];
    });

  const parentVolunteerRows: VolunteerSignupRow[] = ungroupedSignups.flatMap(
    (signup) => {
      const groupSignups = signupsByInviter.get(signup.user.id) ?? [];
      const visibleGroupSignups = sortVolunteerSignupsByLastName(groupSignups);
      const shouldShowAsInvitationGroup =
        isInvitationEntityUser(signup.user) || groupSignups.length > 0;

      if (!shouldShowAsInvitationGroup) {
        return [
          {
            ...signup,
            isCoordinator: false,
          },
        ];
      }

      signupsByInviter.delete(signup.user.id);

      const parentRow: VolunteerSignupRow = {
        ...signup,
        isCoordinator: false,
        isInvitationGroup: true,
        invitedVolunteerCount: groupSignups.length,
        invitedVolunteerCheckedInCount: groupSignups.filter((signup) =>
          Boolean(signup.checkInAt)
        ).length,
      };

      if (!openInvitationGroupIds.has(signup.user.id)) {
        return [parentRow];
      }

      return [
        parentRow,
        ...visibleGroupSignups.map((signup): VolunteerSignupRow => ({
          ...signup,
          isCoordinator: false,
          isInvitationChild: true,
          effectiveInvitedByEntity: signup.invitedByEntity,
        })),
      ];
    }
  );

  const invitationVolunteerRows: VolunteerSignupRow[] = Array.from(
    signupsByInviter.entries()
  ).flatMap(([inviterId, groupSignups]) => {
    const inviter = inviterById.get(inviterId);
    const visibleGroupSignups = sortVolunteerSignupsByLastName(groupSignups);

    if (!inviter) {
      return visibleGroupSignups.map((signup): VolunteerSignupRow => ({
        ...signup,
        isCoordinator: false,
        effectiveInvitedByEntity: signup.invitedByEntity,
      }));
    }

    const invitationGroupRow: VolunteerSignupRow = {
      id: `invitation-${event.id}-${inviter.id}`,
      user: inviter,
      eventId: event.id,
      status: "volunteered",
      eventActionTimeStamp: new Date(0).toISOString(),
      isCoordinator: false,
      isInvitationGroup: true,
      invitedVolunteerCount: groupSignups.length,
      invitedVolunteerCheckedInCount: groupSignups.filter((signup) =>
        Boolean(signup.checkInAt)
      ).length,
    };

    if (!openInvitationGroupIds.has(inviter.id)) {
      return [invitationGroupRow];
    }

    return [
      invitationGroupRow,
      ...visibleGroupSignups.map((signup): VolunteerSignupRow => ({
        ...signup,
        isCoordinator: false,
        isInvitationChild: true,
        effectiveInvitedByEntity: signup.invitedByEntity,
      })),
    ];
  });

  const volunteerRows: VolunteerSignupRow[] = [
    ...coordinatorVolunteerRow,
    ...parentVolunteerRows,
    ...invitationVolunteerRows,
  ];
  const volunteerUserIds = new Set(volunteerRows.map((signup) => signup.user.id));
  const addableVolunteerResults = addVolunteerResults.filter(
    (result) =>
      ["individual", "organization", "nonprofit"].includes(
        result.userType ?? ""
      ) && !volunteerUserIds.has(result.id)
  );
  const activeInvitationEntityMemberIds = new Set(
    activeInvitationEntityRosters.flatMap((roster) =>
      roster.members.map((member) => member.user.id)
    )
  );
  const addableInvitationVolunteerResults = addVolunteerResults.filter(
    (result) =>
      result.userType === "individual" &&
      !volunteerUserIds.has(result.id) &&
      (!isActiveInvitationAddEntityUser ||
        activeInvitationEntityMemberIds.has(result.id))
  );
  const rosterOptions = [...eventOwnerRosters].sort((firstRoster, secondRoster) =>
    firstRoster.rosterName.localeCompare(secondRoster.rosterName)
  );
  const selectedRosterName =
    rosterOptions.find((roster) => roster.id === event.rosterId)?.rosterName ||
    "No roster selected";
  const hasApprovableVolunteers =
    canAdminManageVolunteers &&
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

  const calculateEventImpact = () => {
    if (event.volunteerImpact.isIndividualImpact) {
      return event.volunteerImpact.individualImpact ?? "";
    }

    if (event.volunteerImpact.isGroupImpact) {
      return event.volunteerImpact.groupImpact ?? "";
    }

    return "";
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

  const handleConfirmDeleteEvent = async () => {
    if (!onDeleteEvent) {
      return;
    }

    try {
      setIsDeletingEvent(true);
      await onDeleteEvent(event.id);
      setShowDeleteConfirmDialog(false);
    } catch (error) {
      console.error("Error deleting event", error);
    } finally {
      setIsDeletingEvent(false);
    }
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
      {isMatchVariant && (showInvitationBanner || invitationFromName) && (
        <div className={styles.eventInvitationBanner}>
          Invitation from: {invitationFromName || displayName}
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
          {canDeleteEvent && onDeleteEvent && (
            <button
              type="button"
              className={styles.eventDeleteButton}
              onClick={() => setShowDeleteConfirmDialog(true)}
            >
              Delete
            </button>
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
                  onClick={() => {
                    setActiveInvitationAddGroupId(null);
                    setInvitationAddSearch("");
                    setIsAddVolunteerOpen((isOpen) => !isOpen);
                  }}
                >
                  Add Volunteer
                </button>
                {canAdminManageVolunteers && (
                  <button
                    type="button"
                    className={styles.eventVolunteerApproveAllButton}
                    onClick={handleApproveAllVolunteers}
                    disabled={isCheckInLocked || !hasApprovableVolunteers}
                  >
                    Approve All
                  </button>
                )}
              </div>
            </div>
          )}
          {canManageVolunteerCheckIns &&
            isAddVolunteerOpen &&
            addVolunteerSearch.trim().length >= 3 && (
            <div className={styles.eventVolunteerAddPanel}>
              {addableVolunteerResults.map((result) => {
                const resultName = getSearchResultDisplayName(result);

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
                  No volunteers or organizations found.
                </p>
              )}
            </div>
          )}
          {volunteerRows.map((signup) => {
            const volunteerName = getVolunteerDisplayName(signup.user);
            const isCurrentVolunteer = signup.user.id === currentUserId;
            const hasSignupRecord =
              !signup.id.startsWith("coordinator-") &&
              !signup.id.startsWith("invitation-");
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
              canAdminManageVolunteers &&
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
            const checkStatusText = !isCheckableUser
              ? ""
              : isNoShow
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
            const canRemoveFromInvitationGroup = Boolean(
              signup.isInvitationChild &&
                signup.effectiveInvitedByEntity?.id &&
                (canManageVolunteerCheckIns ||
                  signup.effectiveInvitedByEntity.id === currentUserId)
            );
            const canRemoveParentVolunteer =
              canManageVolunteerCheckIns &&
              hasSignupRecord &&
              !signup.isInvitationChild &&
              !isVolunteerCoordinator &&
              (signup.status === "volunteered" ||
                signup.status === "confirmed");
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
            const isInvitationGroupOpen =
              signup.isInvitationGroup &&
              openInvitationGroupIds.has(signup.user.id);
            const invitationGroupName =
              signup.user.organizationName ||
              signup.user.nonprofitName ||
              volunteerName;
            const invitationGroupSubtitle =
              signup.user.fullName && signup.user.fullName !== invitationGroupName
                ? signup.user.fullName
                : signup.user.jobTitle;

            return (
              <div
                className={`${styles.eventVolunteerRow} ${
                  showApprovalCandidateLayout
                    ? styles.eventVolunteerApprovalRow
                    : ""
                } ${
                  signup.isInvitationChild
                    ? styles.eventVolunteerInvitationChild
                    : ""
                } ${
                  signup.isInvitationGroup
                    ? styles.eventVolunteerInvitationGroup
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
                        {signup.isInvitationGroup
                          ? invitationGroupName
                          : volunteerName}
                      </button>
                      <span>
                        {signup.isCoordinator
                          ? "Volunteer Coordinator"
                          : signup.isInvitationGroup
                          ? invitationGroupSubtitle
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
                  {signup.isInvitationGroup && (
                    <>
                      <div className={styles.eventInvitationGroupFooter}>
                        <strong>
                          Check in status: {signup.invitedVolunteerCheckedInCount ?? 0}/
                          {event.maxVolunteerCount} Volunteers Checked in
                        </strong>
                        <div className={styles.eventInvitationGroupActions}>
                          {canRemoveParentVolunteer && (
                            <button
                              type="button"
                              className={styles.eventInvitationRemoveVolunteerButton}
                              onClick={() =>
                                handleRemoveEventVolunteer(signup.user.id)
                              }
                              disabled={isCheckInLocked}
                            >
                              Remove
                            </button>
                          )}
                          <button
                            type="button"
                            className={styles.eventInvitationSeeVolunteersButton}
                            onClick={() =>
                              handleInvitationGroupToggle(signup.user.id)
                            }
                            aria-expanded={Boolean(isInvitationGroupOpen)}
                          >
                            See Volunteers
                            <CustomSvgs
                              svgPath={
                                isInvitationGroupOpen
                                  ? "/svgs/common/goUpIcon.svg"
                                  : "/svgs/common/goDownIcon.svg"
                              }
                              variant="small"
                              altText=""
                            />
                          </button>
                        </div>
                      </div>
                      {isInvitationGroupOpen && (
                        <div className={styles.eventInvitationGroupTools}>
                          {canManageVolunteerCheckIns && (
                            <button
                              type="button"
                              className={styles.eventVolunteerAddButton}
                              onClick={() =>
                                handleInvitationAddToggle(signup.user.id)
                              }
                            >
                              Click Here To Add Volunteers
                            </button>
                          )}
                        </div>
                      )}
                      {isInvitationGroupOpen &&
                        canManageVolunteerCheckIns &&
                        activeInvitationAddGroupId === signup.user.id && (
                        <div className={styles.eventInvitationGroupAddPanel}>
                          <div className={styles.eventVolunteerSearchWrap}>
                            <CustomSvgs
                              svgPath="/svgs/common/searchIcon.svg"
                              variant="small"
                              altText=""
                            />
                            <input
                              type="search"
                              placeholder="Search members to add"
                              value={invitationAddSearch}
                              onChange={(event) =>
                                setInvitationAddSearch(event.target.value)
                              }
                              autoFocus
                            />
                          </div>
                          {invitationAddSearch.trim().length >= 3 && (
                            <div className={styles.eventVolunteerAddPanel}>
                              {addableInvitationVolunteerResults.map((result) => {
                                const resultName =
                                  getSearchResultDisplayName(result);

                                return (
                                  <button
                                    type="button"
                                    key={result.id}
                                    onClick={() =>
                                      handleAddInvitationVolunteer(
                                        result.id,
                                        signup.user.id
                                      )
                                    }
                                    disabled={isCheckInLocked}
                                  >
                                    <span>{resultName}</span>
                                    <strong>Add</strong>
                                  </button>
                                );
                              })}
                              {addableInvitationVolunteerResults.length === 0 && (
                                <p className={styles.eventVolunteerNoSearchResults}>
                                  No volunteers found.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className={styles.eventVolunteerCheckIn}>
                  {!signup.isInvitationGroup && !showApprovalCandidateLayout && (
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
                  {!signup.isInvitationGroup &&
                    showApprovalCandidateLayout &&
                    !canShowApprovalActions && (
                    <div className={styles.eventVolunteerCheckStatus}>
                      {checkStatusText && <strong>{checkStatusText}</strong>}
                    </div>
                  )}
                  {!signup.isInvitationGroup && canShowCheckAction && (
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
                  {!signup.isInvitationGroup && canRemoveFromInvitationGroup && (
                    <button
                      type="button"
                      className={styles.eventInvitationRemoveVolunteerButton}
                      onClick={() =>
                        handleRemoveInvitationVolunteer(
                          signup.user.id,
                          signup.effectiveInvitedByEntity?.id ?? ""
                        )
                      }
                      disabled={isCheckInLocked}
                    >
                      Remove
                    </button>
                  )}
                  {canRemoveParentVolunteer && (
                    <button
                      type="button"
                      className={styles.eventInvitationRemoveVolunteerButton}
                      onClick={() => handleRemoveEventVolunteer(signup.user.id)}
                      disabled={isCheckInLocked}
                    >
                      Remove
                    </button>
                  )}
                  {!signup.isInvitationGroup && canShowApprovalActions && (
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
                  {!signup.isInvitationGroup && canEditImpactDetails && (
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
      {showDeleteConfirmDialog && (
        <div className={styles.eventVolunteerDialogOverlay}>
          <div
            className={styles.eventDeleteConfirmDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-event-dialog-title-${event.id}`}
          >
            <h2
              className={styles.eventDeleteConfirmTitle}
              id={`delete-event-dialog-title-${event.id}`}
            >
              Are you sure you want to delete this event?
            </h2>
            <div className={styles.eventDeleteConfirmActions}>
              <button
                type="button"
                className={styles.eventDeleteConfirmYes}
                onClick={handleConfirmDeleteEvent}
                disabled={isDeletingEvent}
              >
                Yes
              </button>
              <button
                type="button"
                className={styles.eventDeleteConfirmCancel}
                onClick={() => setShowDeleteConfirmDialog(false)}
                disabled={isDeletingEvent}
              >
                Cancel
              </button>
            </div>
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
                  <span>Impact Text</span>
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
