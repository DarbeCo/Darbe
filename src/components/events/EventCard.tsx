import { useNavigate } from "react-router-dom";
import { IconButton } from "@mui/material";
import { ContentCopy } from "@mui/icons-material";
import { useState } from "react";

import { EVENTS_ROUTE, PROFILE_ROUTE } from "../../routes/route.constants";
import {
  EventEditableUpdate,
  ShortEventState,
} from "../../services/api/endpoints/types/events.api.types";
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
  parseEventDateAsLocalDate,
  parseEventDateTimeAsLocalDate,
} from "../../utils/eventDateUtils";

import styles from "./styles/eventCards.module.css";
import {
  useAddEventVolunteerMutation,
  useApproveAllEventVolunteersMutation,
  useApproveEventVolunteerMutation,
  usePassOnEventMutation,
  useCheckInForEventMutation,
  useCheckOutFromEventMutation,
  useDenyEventVolunteerMutation,
  useMarkNoShowForEventMutation,
  useUnvolunteerFromEventMutation,
  useUpdateEventDetailsMutation,
  useUpdateEventSignupImpactDetailsMutation,
  useUpdateEventTimeMutation,
  useVolunteerForEventMutation,
} from "../../services/api/endpoints/events/events.api";
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
  onVolunteerSuccess?: (eventId: string) => void;
  onPassSuccess?: (eventId: string) => void;
  allowCoordinatorVolunteerManagement?: boolean;
  enableAdminControls?: boolean;
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

  const hour = Math.floor(time);
  const minute = Math.round((time - hour) * 60);

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

  return hour + minute / 60;
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
  onVolunteerSuccess,
  onPassSuccess,
  allowCoordinatorVolunteerManagement = true,
  enableAdminControls = false,
}: EventCardProps) => {
  const navigate = useNavigate();
  const currentUserId = useAppSelector(selectCurrentUserId);
  const [passOnEvent, { isLoading: isPassing }] = usePassOnEventMutation();
  const [checkInForEvent, { isLoading: isCheckingIn }] =
    useCheckInForEventMutation();
  const [checkOutFromEvent, { isLoading: isCheckingOut }] =
    useCheckOutFromEventMutation();
  const [markNoShowForEvent, { isLoading: isMarkingNoShow }] =
    useMarkNoShowForEventMutation();
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

  const handleNoShowEvent = async (targetUserId: string) => {
    try {
      await markNoShowForEvent({
        eventId: event.id,
        userId: targetUserId,
      }).unwrap();
    } catch (error) {
      console.error("Error marking volunteer as no show", error);
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
  const locationText = `${event.eventAddress.city}, ${eventState}`;
  const displayName =
    event.eventOwner.userType === "organization"
      ? event.eventOwner.organizationName
      : event.eventOwner.nonprofitName;

  const eventDuration = event?.endTime
    ? `${event.endTime - event.startTime} Hours`
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
  const canManageVolunteerCheckIns =
    enableAdminControls ||
    isEventPoster ||
    (allowCoordinatorVolunteerManagement && isEventCoordinator);
  const canEditEventFields = isEventPoster || enableAdminControls;
  const isPastEvent =
    hasEventEnded !== undefined ? hasEventEnded : eventDateTime < todayTime;
  const isVolunteerLocked = hasVolunteered || isVolunteering;
  const isCheckInLocked =
    isCheckingIn ||
    isCheckingOut ||
    isMarkingNoShow ||
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
  const coordinatorVolunteerSignup = event.eventCoordinator?.id
    ? event.signups?.find((signup) => signup.user.id === event.eventCoordinator?.id)
    : undefined;
  const coordinatorVolunteerRow: VolunteerSignupRow[] =
    event.eventCoordinator && event.eventCoordinator.id
      ? [
          {
            id:
              coordinatorVolunteerSignup?.id ??
              `coordinator-${event.eventCoordinator.id}`,
            user: event.eventCoordinator,
            eventId: event.id,
            status:
              coordinatorVolunteerSignup?.status ?? ("volunteered" as const),
            eventActionTimeStamp:
              coordinatorVolunteerSignup?.eventActionTimeStamp ??
              new Date(0).toISOString(),
            checkInAt: coordinatorVolunteerSignup?.checkInAt,
            checkOutAt: coordinatorVolunteerSignup?.checkOutAt,
            volunteerStartTime: coordinatorVolunteerSignup?.volunteerStartTime,
            volunteerEndTime: coordinatorVolunteerSignup?.volunteerEndTime,
            volunteerLocation: coordinatorVolunteerSignup?.volunteerLocation,
            volunteerImpact: coordinatorVolunteerSignup?.volunteerImpact,
            isCoordinator: true,
          },
        ]
      : [];
  const volunteerRows: VolunteerSignupRow[] = [
    ...coordinatorVolunteerRow,
    ...(event.signups ?? [])
      .filter((signup) => signup.user.id !== event.eventCoordinator?.id)
      .map((signup): VolunteerSignupRow => ({ ...signup, isCoordinator: false })),
  ];
  const volunteerUserIds = new Set(volunteerRows.map((signup) => signup.user.id));
  const addableVolunteerResults = addVolunteerResults.filter(
    (result) =>
      result.userType === "individual" && !volunteerUserIds.has(result.id)
  );
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
          parseInt(event.volunteerImpact.individualImpactPerHour ?? "1") *
          event.maxVolunteerCount *
          calculatedEventDuration;

        eventImpactText = `${totalEventIndivdualGoal} ${event.volunteerImpact.individualImpact}`;
      } else {
        totalEventIndivdualGoal =
          parseInt(event.volunteerImpact.individualImpactPerHour ?? "1") *
          event.maxVolunteerCount;

        eventImpactText = `${totalEventIndivdualGoal} ${event.volunteerImpact.individualImpact}`;
      }
    }
    if (event.volunteerImpact.isGroupImpact) {
      if (calculatedEventDuration) {
        totalEventGroupGoal =
          parseInt(event.volunteerImpact.groupImpactPerHour ?? "1") *
          event.maxVolunteerCount *
          calculatedEventDuration;

        eventImpactText = `${totalEventGroupGoal} ${event.volunteerImpact.groupImpact}`;
      } else {
        totalEventGroupGoal =
          parseInt(event.volunteerImpact.groupImpactPerHour ?? "1") *
          event.maxVolunteerCount;

        eventImpactText = `${totalEventGroupGoal} ${event.volunteerImpact.groupImpact}`;
      }
    }

    return eventImpactText;
  };

  const handleDetailsClick = () => {
    navigate(`${EVENTS_ROUTE}/${event.id}`, {
      state: returnToEventsTab ? { returnToEventsTab } : undefined,
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
        <Typography
          variant="sectionTitle"
          textToDisplay={event.eventName}
          extraClass={styles.eventCardEventName}
        />
        {renderEditPencil("event name", () =>
          openEventFieldEdit({
            field: "eventName",
            label: "Event Name",
            value: event.eventName,
          })
        )}
        <div className={styles.eventEditableLine}>
          <Typography variant="locationSmall" textToDisplay={locationText} />
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
              {showVolunteerAndPassActions && !hasVolunteered && !isSignedUpCard ? (
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
          {canManageVolunteerCheckIns && !incompleteActionLabel && (
            <div
              className={`${styles.eventMatchActions} ${styles.eventEditTimeAction}`}
            >
              <DarbeButton
                buttonText="Edit Time"
                onClick={handleEditEventTime}
                darbeButtonType="secondaryNextButton"
                isDisabled={isUpdatingEventTime}
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
            const checkStatusText = isNoShow
              ? "No Show"
              : isApproved
              ? "Approved"
              : isDenied
              ? "Denied"
              : isCheckedOut
              ? "Checked Out"
              : isCheckedIn
              ? "Checked In"
              : "Not Checked In";
            const checkedOutTimeText = isCheckedOut
              ? formatCheckTimestamp(signup.checkOutAt)
              : "";
            const checkedInTimeText =
              isCheckedIn && !isCheckedOut
                ? formatCheckTimestamp(signup.checkInAt)
                : "";
            const checkButtonText = isCheckedIn ? "Check Out" : "Check In";
            const canShowCheckAction =
              (isCurrentVolunteer || canManageVolunteerCheckIns) &&
              isCheckableUser &&
              (hasSignupRecord ||
                (canManageVolunteerCheckIns && isVolunteerCoordinator)) &&
              !isPastEvent &&
              !isCheckedOut &&
              isWithinEventTime;
            const canShowAdminPostEventCheckOut =
              canManageVolunteerCheckIns &&
              isCheckableUser &&
              isPastEvent &&
              isCheckedIn &&
              !isCheckedOut &&
              !isApproved &&
              !isDenied &&
              !isNoShow;
            const canShowNoShowAction =
              canManageVolunteerCheckIns &&
              isCheckableUser &&
              (hasSignupRecord || isVolunteerCoordinator) &&
              isPastEvent &&
              !isCheckedIn &&
              !isNoShow &&
              !isDenied;
            const canShowApprovalActions =
              canManageVolunteerCheckIns &&
              isCheckableUser &&
              isPastEvent &&
              isCheckedIn &&
              isCheckedOut &&
              !isApproved &&
              !isDenied &&
              !isNoShow;
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
            const candidateStartTime =
              impactDetailOverride?.startTime ||
              signup.volunteerStartTime ||
              formatVolunteerActionTime(signup.checkInAt) ||
              formatEventTimeRangeValue(event.startTime);
            const candidateEndTime =
              impactDetailOverride?.endTime ||
              signup.volunteerEndTime ||
              formatVolunteerActionTime(signup.checkOutAt) ||
              formatEventTimeRangeValue(event.endTime);
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
                      <strong>{checkStatusText}</strong>
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
                      <strong>{checkStatusText}</strong>
                    </div>
                  )}
                  {(canShowCheckAction || canShowAdminPostEventCheckOut) && (
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
                  {canShowNoShowAction && (
                    <button
                      type="button"
                      className={styles.eventVolunteerNoShowButton}
                      onClick={() => handleNoShowEvent(signup.user.id)}
                      disabled={isCheckInLocked}
                    >
                      No Show
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
                          startTime: candidateStartTime,
                          endTime: candidateEndTime,
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
