import {
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CircularProgress } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

import {
  useDeleteEventMutation,
  useGetEventsQuery,
  useGetRosterAdminEventsQuery,
  useGetSignedUpEventsQuery,
} from "../../../services/api/endpoints/events/events.api";
import {
  useGetRosterAdminEntityIdsQuery,
  useGetRosterEventAdminEntityAccessQuery,
} from "../../../services/api/endpoints/roster/roster.api";
import { EventCard } from "../../../components/events/EventCard";
import { ShortEventState } from "../../../services/api/endpoints/types/events.api.types";
import { SimpleUserInfo } from "../../../services/api/endpoints/types/user.api.types";
import { useAppSelector } from "../../../services/hooks";
import { selectCurrentUserId, selectUserType } from "../../users/selectors";
import { CustomSvgs } from "../../../components/customSvgs/CustomSvgs";
import { UserAvatars } from "../../../components/avatars/UserAvatars";
import { CREATE_EVENT_ROUTE, PROFILE_ROUTE } from "../../../routes/route.constants";
import {
  getIncompletePostNeedEventsForUser,
  incompletePostNeedEventToShortEvent,
  removeIncompletePostNeedEvent,
} from "../../postNeed/incompleteEvents";
import {
  parseEventDateAsLocalDate,
  parseEventDateTimeAsLocalDate,
} from "../../../utils/eventDateUtils";
import { assetUrl } from "../../../utils/assetUrl";

import styles from "../styles/entityEvents.module.css";

const adminTabs = ["Current", "Past", "Admin", "Incomplete"] as const;
const nonprofitTabs = ["Past", "Current", "Admin", "Incomplete"] as const;
const nonAdminTabs = ["Current", "Past"] as const;
type EventsTab = (typeof adminTabs)[number];
const COLLAPSED_SUMMARY_COUNT = 3;

const formatSummaryDate = (eventDate: string) =>
  parseEventDateAsLocalDate(eventDate).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
  });

const getOwnerName = (event: ShortEventState) =>
  event.eventOwner.organizationName ||
  event.eventOwner.nonprofitName ||
  event.eventOwner.fullName;

const getCoordinatorName = (event: ShortEventState) =>
  event.eventCoordinator?.fullName ||
  event.eventCoordinator?.organizationName ||
  event.eventCoordinator?.nonprofitName ||
  "";

const getUserName = (user?: {
  fullName?: string;
  organizationName?: string;
  nonprofitName?: string;
}) => user?.fullName || user?.organizationName || user?.nonprofitName || "";

const getVolunteerCount = (
  event: ShortEventState,
  signupCount?: number
) => event.signups?.length ?? signupCount ?? 0;

const getDateOnlyTime = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const getEventDateOnlyTime = (eventDate: string) => {
  const [year, month, day] = eventDate.split("T")[0].split("-").map(Number);

  if (year && month && day) {
    return new Date(year, month - 1, day).getTime();
  }

  return getDateOnlyTime(new Date(eventDate));
};

const isPastEvent = (
  event: Pick<ShortEventState, "eventDate" | "endTime">
) => {
  const todayTime = getDateOnlyTime(new Date());
  const eventDateTime = getEventDateOnlyTime(event.eventDate);

  if (event.endTime !== undefined) {
    return (
      new Date() > parseEventDateTimeAsLocalDate(event.eventDate, event.endTime)
    );
  }

  return eventDateTime < todayTime;
};

const isCurrentEvent = (
  event: Pick<ShortEventState, "eventDate" | "endTime">
) => !isPastEvent(event);

const isIncompleteEvent = (event: ShortEventState) => {
  const maybeEvent = event as ShortEventState & {
    isComplete?: boolean;
    status?: string;
    projectStatus?: string;
  };

  return (
    maybeEvent.isComplete === false ||
    maybeEvent.status === "incomplete" ||
    maybeEvent.projectStatus === "incomplete"
  );
};

type VolunteerEventDisplay = {
  event: ShortEventState;
  isSignedUp?: boolean;
  signupCount?: number;
};

type EventCreateType = "externalEvent" | "internalEvent";

type EventAdminEntityOption = {
  entityId: string;
  entityName?: string;
  profilePicture?: string;
  userType?: string;
  canEditInternalEvents: boolean;
  canEditExternalEvents: boolean;
};

export const EventSignup = () => {
  const navigate = useNavigate();
  const userType = useAppSelector(selectUserType);
  const currentUserId = useAppSelector(selectCurrentUserId);
  const isPostNeedAdmin =
    userType === "organization" || userType === "nonprofit";
  const location = useLocation();
  const restoredTab = (location.state as { activeEventsTab?: string } | null)
    ?.activeEventsTab;
  const focusEventId = (
    location.state as { focusEventId?: string } | null
  )?.focusEventId;
  const [showAllSummaryRows, setShowAllSummaryRows] = useState(false);
  const [incompleteDraftEvents, setIncompleteDraftEvents] = useState<
    ShortEventState[]
  >([]);
  const [createEventChoice, setCreateEventChoice] = useState<{
    eventType: EventCreateType;
    options: EventAdminEntityOption[];
  } | null>(null);
  const [hiddenEventIds, setHiddenEventIds] = useState<string[]>([]);
  const eventCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { data: events, isLoading } = useGetEventsQuery();
  const [deleteEvent] = useDeleteEventMutation();
  const { data: rosterAdminEntityIds = [] } = useGetRosterAdminEntityIdsQuery();
  const { data: rosterEventAdminEntityAccess = [] } =
    useGetRosterEventAdminEntityAccessQuery(undefined, {
      skip: userType !== "individual",
    });
  const {
    data: rosterAdminEvents = [],
    isLoading: isLoadingRosterAdminEvents,
  } = useGetRosterAdminEventsQuery(undefined, {
    skip: userType !== "individual",
  });
  const { data: signedUpEvents, isLoading: isLoadingSignedUpEvents } =
    useGetSignedUpEventsQuery(
      { when: "upcoming" },
      { skip: !currentUserId }
    );
  const { data: pastSignedUpEvents, isLoading: isLoadingPastSignedUpEvents } =
    useGetSignedUpEventsQuery(
      { when: "past" },
      { skip: !currentUserId }
    );
  const rosterAdminEventIdSet = useMemo(
    () => new Set(rosterAdminEvents.map((event) => event.id)),
    [rosterAdminEvents]
  );
  const internalEventAdminEntityIds = useMemo(
    () =>
      rosterEventAdminEntityAccess
        .filter((access) => access.canEditInternalEvents)
        .map((access) => access.entityId),
    [rosterEventAdminEntityAccess]
  );
  const externalEventAdminEntityIds = useMemo(
    () =>
      rosterEventAdminEntityAccess
        .filter((access) => access.canEditExternalEvents)
        .map((access) => access.entityId),
    [rosterEventAdminEntityAccess]
  );
  const postNeedAdminEntityAccess = useMemo(
    () =>
      rosterEventAdminEntityAccess.filter(
        (access) =>
          access.canEditExternalEvents && access.userType === "nonprofit"
      ),
    [rosterEventAdminEntityAccess]
  );
  const hasInternalEventAdminRights = internalEventAdminEntityIds.length > 0;
  const hasAnyEventAdminRights =
    hasInternalEventAdminRights || externalEventAdminEntityIds.length > 0;
  const canShowPostNeedAction =
    userType === "organization" ||
    userType === "nonprofit" ||
    (userType === "individual" && externalEventAdminEntityIds.length > 0);
  const canUsePostNeedAction =
    userType === "nonprofit" ||
    (userType === "individual" && postNeedAdminEntityAccess.length > 0);
  const canShowInternalEventAction =
    userType === "organization" ||
    userType === "nonprofit" ||
    (userType === "individual" && internalEventAdminEntityIds.length > 0);
  const hasCoordinatorEvents = Boolean(
    currentUserId &&
      [...(events ?? []), ...rosterAdminEvents].some(
        (event) =>
          event.eventCoordinator?.id === currentUserId ||
          rosterAdminEntityIds.includes(event.eventOwner.id) ||
          rosterAdminEventIdSet.has(event.id)
      )
  );
  const availableTabs: readonly EventsTab[] = userType === "organization"
    ? adminTabs
    : userType === "nonprofit"
    ? nonprofitTabs
    : hasInternalEventAdminRights
    ? adminTabs
    : hasCoordinatorEvents
    ? ["Current", "Past", "Admin"]
    : nonAdminTabs;
  const [activeTab, setActiveTab] = useState<EventsTab>("Current");

  useEffect(() => {
    if (
      restoredTab &&
      availableTabs.includes(restoredTab as EventsTab) &&
      activeTab !== restoredTab
    ) {
      setActiveTab(restoredTab as EventsTab);
      return;
    }

    if (!availableTabs.includes(activeTab)) {
      setActiveTab(
        availableTabs.includes("Current") ? "Current" : availableTabs[0]
      );
    }
  }, [activeTab, availableTabs, restoredTab]);

  useEffect(() => {
    if (!currentUserId || (!isPostNeedAdmin && !hasInternalEventAdminRights)) {
      setIncompleteDraftEvents([]);
      return;
    }

    const drafts = getIncompletePostNeedEventsForUser(currentUserId)
      .filter((draft) => draft.missingFields.length > 0)
      .map(incompletePostNeedEventToShortEvent);

    setIncompleteDraftEvents(drafts);
  }, [currentUserId, hasInternalEventAdminRights, isPostNeedAdmin, activeTab]);

  const volunteerEvents = useMemo<VolunteerEventDisplay[]>(() => {
    const eventsById = new Map<string, ShortEventState>();

    [
      ...(events ?? []),
      ...rosterAdminEvents,
      ...(signedUpEvents ?? []).map(({ event }) => event),
      ...(pastSignedUpEvents ?? []).map(({ event }) => event),
    ].forEach((event) => {
      eventsById.set(event.id, event);
    });

    const eventsToDisplay = Array.from(eventsById.values());
    const hiddenEventIdSet = new Set(hiddenEventIds);
    const adminManagedEvents = eventsToDisplay.filter(
      (event) =>
        event.eventOwner.id === currentUserId ||
        event.eventCoordinator?.id === currentUserId ||
        rosterAdminEntityIds.includes(event.eventOwner.id) ||
        rosterAdminEventIdSet.has(event.id)
    );
    const coordinatorManagedEvents = adminManagedEvents;
    const sourceEvents =
      isPostNeedAdmin || hasAnyEventAdminRights || activeTab === "Admin"
        ? adminManagedEvents
        : eventsToDisplay;

    if (activeTab === "Past") {
      const signedUpPastEvents = [...(pastSignedUpEvents ?? [])]
        .filter(
          ({ event }) =>
            isPastEvent(event) && !hiddenEventIdSet.has(event.id)
        )
        .map(({ event, signupCount }) => ({
          event,
          signupCount,
          isSignedUp: true,
        }));

      if (!isPostNeedAdmin) {
        const signedUpPastEventIds = new Set(
          signedUpPastEvents.map(({ event }) => event.id)
        );
        const coordinatedPastEvents = coordinatorManagedEvents
          .filter(
            (event) =>
              isPastEvent(event) &&
              !hiddenEventIdSet.has(event.id) &&
              !signedUpPastEventIds.has(event.id)
          )
          .map((event) => ({ event }));

        return [...signedUpPastEvents, ...coordinatedPastEvents].sort(
          (first, second) =>
            getEventDateOnlyTime(second.event.eventDate) -
            getEventDateOnlyTime(first.event.eventDate)
        );
      }

      const signedUpPastEventIds = new Set(
        signedUpPastEvents.map(({ event }) => event.id)
      );
      const managedPastEvents = sourceEvents
        .filter((event) => isPastEvent(event))
        .filter((event) => !signedUpPastEventIds.has(event.id))
        .map((event) => ({ event }));

      return [...signedUpPastEvents, ...managedPastEvents]
        .sort(
          (first, second) =>
            getEventDateOnlyTime(second.event.eventDate) -
            getEventDateOnlyTime(first.event.eventDate)
        );
    }

    if (activeTab === "Current") {
      const signedUpCurrentEvents = [...(signedUpEvents ?? [])]
        .filter(
          ({ event, status }) =>
            status !== "passed" &&
            isCurrentEvent(event) &&
            !hiddenEventIdSet.has(event.id)
        )
        .sort(
          (first, second) =>
            getEventDateOnlyTime(first.event.eventDate) -
            getEventDateOnlyTime(second.event.eventDate)
        )
        .map(({ event, signupCount }) => ({
          event,
          signupCount,
          isSignedUp: true,
        }));

      if (isPostNeedAdmin || hasAnyEventAdminRights) {
        const signedUpCurrentEventIds = new Set(
          signedUpCurrentEvents.map(({ event }) => event.id)
        );
        const managedCurrentEvents = sourceEvents
          .filter(
            (event) => isCurrentEvent(event) && !hiddenEventIdSet.has(event.id)
          )
          .filter((event) => !signedUpCurrentEventIds.has(event.id))
          .map((event) => ({ event }));

        return [...signedUpCurrentEvents, ...managedCurrentEvents].sort(
          (first, second) =>
            getEventDateOnlyTime(first.event.eventDate) -
            getEventDateOnlyTime(second.event.eventDate)
        );
      }

      const signedUpCurrentEventIds = new Set(
        signedUpCurrentEvents.map(({ event }) => event.id)
      );
      const managedCurrentEvents = adminManagedEvents
        .filter(
          (event) =>
            isCurrentEvent(event) &&
            !hiddenEventIdSet.has(event.id) &&
            !signedUpCurrentEventIds.has(event.id)
        )
        .map((event) => ({ event }));

      return [...signedUpCurrentEvents, ...managedCurrentEvents].sort(
        (first, second) =>
          getEventDateOnlyTime(first.event.eventDate) -
          getEventDateOnlyTime(second.event.eventDate)
      );
    }

    if (activeTab === "Incomplete") {
      const databaseIncompleteEvents = sourceEvents
        .filter((event) => isIncompleteEvent(event))
        .map((event) => ({ event }));
      const draftIncompleteEvents = incompleteDraftEvents.map((event) => ({
        event,
      }));

      return [...databaseIncompleteEvents, ...draftIncompleteEvents].sort(
          (first, second) =>
            getEventDateOnlyTime(second.event.eventDate) -
            getEventDateOnlyTime(first.event.eventDate)
        );
    }

    if (activeTab === "Admin") {
      return adminManagedEvents
        .sort(
          (first, second) =>
            getEventDateOnlyTime(second.eventDate) -
            getEventDateOnlyTime(first.eventDate)
        )
        .map((event) => ({ event }));
    }

    return sourceEvents
      .sort(
        (first, second) =>
          getEventDateOnlyTime(second.eventDate) -
          getEventDateOnlyTime(first.eventDate)
      )
      .map((event) => ({ event }));
  }, [
    activeTab,
    currentUserId,
    events,
    hiddenEventIds,
    incompleteDraftEvents,
    hasAnyEventAdminRights,
    isPostNeedAdmin,
    pastSignedUpEvents,
    rosterAdminEventIdSet,
    rosterAdminEvents,
    rosterAdminEntityIds,
    signedUpEvents,
  ]);

  const isLoadingVolunteerEvents =
    isLoading ||
    isLoadingRosterAdminEvents ||
    (activeTab === "Current" && isLoadingSignedUpEvents) ||
    (activeTab === "Past" && isLoadingPastSignedUpEvents);
  const summaryEvents = showAllSummaryRows
    ? volunteerEvents
    : volunteerEvents.slice(0, COLLAPSED_SUMMARY_COUNT);

  useEffect(() => {
    if (!focusEventId || isLoadingVolunteerEvents) {
      return;
    }

    window.requestAnimationFrame(() => {
      eventCardRefs.current[focusEventId]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [focusEventId, isLoadingVolunteerEvents, volunteerEvents]);

  const handleSummaryEventClick = (eventId: string) => {
    eventCardRefs.current[eventId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleSummaryEventKeyDown = (
    keyDownEvent: KeyboardEvent<HTMLDivElement>,
    eventId: string
  ) => {
    if (keyDownEvent.key !== "Enter" && keyDownEvent.key !== " ") {
      return;
    }

    keyDownEvent.preventDefault();
    handleSummaryEventClick(eventId);
  };

  const handleSummaryCoordinatorClick = (
    clickEvent: MouseEvent<HTMLButtonElement>,
    coordinatorId: string
  ) => {
    clickEvent.stopPropagation();
    navigate(`${PROFILE_ROUTE}/${coordinatorId}`);
  };

  const getAdditionalVolunteerCoordinators = (): SimpleUserInfo[] => {
    return [];
  };

  const handleFinishIncompleteEvent = (eventId: string) => {
    navigate(CREATE_EVENT_ROUTE, {
      state: { incompleteEventId: eventId },
    });
  };

  const getEntityOptionName = (option: EventAdminEntityOption) =>
    option.entityName ||
    (option.userType === "nonprofit" ? "Nonprofit" : "Organization");

  const navigateToCreateEvent = (
    eventType: EventCreateType,
    delegatedEntity?: EventAdminEntityOption
  ) => {
    navigate(CREATE_EVENT_ROUTE, {
      state: {
        initialEventType: eventType,
        initialEventOwnerId: delegatedEntity?.entityId,
        initialEventOwnerName: delegatedEntity
          ? getEntityOptionName(delegatedEntity)
          : undefined,
        initialEventOwnerProfilePicture: delegatedEntity?.profilePicture,
        initialEventOwnerUserType: delegatedEntity?.userType,
      },
    });
  };

  const handleCreateEvent = (eventType: EventCreateType) => {
    if (eventType === "externalEvent" && userType === "organization") {
      return;
    }

    if (userType !== "individual") {
      navigateToCreateEvent(eventType);
      return;
    }

    const eligibleEntities =
      eventType === "internalEvent"
        ? rosterEventAdminEntityAccess.filter(
            (access) => access.canEditInternalEvents
          )
        : postNeedAdminEntityAccess;

    if (eligibleEntities.length === 0) {
      return;
    }

    if (eligibleEntities.length === 1) {
      navigateToCreateEvent(eventType, eligibleEntities[0]);
      return;
    }

    setCreateEventChoice({
      eventType,
      options: eligibleEntities,
    });
  };

  const handleCreateEventChoice = (option: EventAdminEntityOption) => {
    if (!createEventChoice) {
      return;
    }

    navigateToCreateEvent(createEventChoice.eventType, option);
    setCreateEventChoice(null);
  };

  const handlePassEventSuccess = (eventId: string) => {
    setHiddenEventIds((currentHiddenEventIds) =>
      currentHiddenEventIds.includes(eventId)
        ? currentHiddenEventIds
        : [...currentHiddenEventIds, eventId]
    );
  };

  const hasEventAdminDeleteAccess = (event: ShortEventState) => {
    if (userType === "organization" || userType === "nonprofit") {
      return event.eventOwner.id === currentUserId;
    }

    if (userType !== "individual") {
      return false;
    }

    const entityIds = event.isFollowersOnly
      ? internalEventAdminEntityIds
      : externalEventAdminEntityIds;

    return entityIds.includes(event.eventOwner.id);
  };

  const canDeleteDisplayedEvent = (event: ShortEventState) => {
    if (activeTab !== "Current" && activeTab !== "Incomplete") {
      return false;
    }

    if (activeTab === "Current" && !isCurrentEvent(event)) {
      return false;
    }

    return hasEventAdminDeleteAccess(event);
  };

  const handleDeleteDisplayedEvent = async (event: ShortEventState) => {
    const maybeIncompleteEvent = event as ShortEventState & {
      incompleteDraftId?: string;
      status?: string;
    };

    if (maybeIncompleteEvent.incompleteDraftId || isIncompleteEvent(event)) {
      removeIncompletePostNeedEvent(
        maybeIncompleteEvent.incompleteDraftId ?? event.id
      );
      setIncompleteDraftEvents((currentEvents) =>
        currentEvents.filter((draftEvent) => draftEvent.id !== event.id)
      );
      return;
    }

    await deleteEvent(event.id).unwrap();
    setHiddenEventIds((currentHiddenEventIds) =>
      currentHiddenEventIds.includes(event.id)
        ? currentHiddenEventIds
        : [...currentHiddenEventIds, event.id]
    );
  };

  return (
    <section
      className={`${styles.volunteerEventsPanel} ${
        userType === "nonprofit" ? styles.nonprofitEventsPanel : ""
      }`}
    >
        <div className={styles.volunteerEventsTitle}>
          <CustomSvgs
            svgPath="/svgs/common/eventsIcon.svg"
            variant="small"
            altText=""
          />
          <h1>Events</h1>
        </div>
        {(canShowPostNeedAction || canShowInternalEventAction) && (
          <div className={styles.nonprofitEventActions}>
            {canShowPostNeedAction && (
              <button
                type="button"
                className={`${styles.nonprofitEventAction} ${
                  !canUsePostNeedAction ? styles.nonprofitEventActionDisabled : ""
                }`}
                disabled={!canUsePostNeedAction}
                onClick={() => handleCreateEvent("externalEvent")}
              >
                <CustomSvgs
                  svgPath="/svgs/common/postAddIcon.svg"
                  variant="small"
                  altText=""
                />
                <span>Post A Need</span>
              </button>
            )}
            {canShowInternalEventAction && (
              <button
                type="button"
                className={styles.nonprofitEventAction}
                onClick={() => handleCreateEvent("internalEvent")}
              >
                <CustomSvgs
                  svgPath="/svgs/common/eventsIcon.svg"
                  variant="small"
                  altText=""
                />
                <span>Create Internal Event</span>
              </button>
            )}
          </div>
        )}
        <div className={styles.volunteerEventsTabs} role="tablist">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={
                tab === activeTab ? styles.volunteerEventsTabActive : undefined
              }
              onClick={() => {
                setActiveTab(tab);
                setShowAllSummaryRows(false);
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        {isLoadingVolunteerEvents && (
          <div className={styles.volunteerEventsLoading}>
            <CircularProgress />
          </div>
        )}
        {!isLoadingVolunteerEvents && volunteerEvents.length === 0 && (
          <p className={styles.noEventMatches}>No events found.</p>
        )}
        {!isLoadingVolunteerEvents && volunteerEvents.length > 0 && (
          <>
            <div className={styles.volunteerSummaryCard}>
              <h2>Summary</h2>
              <div
                className={`${styles.volunteerSummaryRows} ${
                  showAllSummaryRows ? styles.volunteerSummaryRowsExpanded : ""
                }`}
              >
                {summaryEvents.map(({ event, signupCount }) => {
                  const coordinatorName = getCoordinatorName(event);
                  const additionalCoordinators =
                    getAdditionalVolunteerCoordinators();
                  const extraCoordinatorNames = additionalCoordinators
                    .map((coordinator) => getUserName(coordinator))
                    .filter(Boolean);
                  const hasCoordinator = Boolean(
                    (event.eventCoordinator?.id && coordinatorName) ||
                      extraCoordinatorNames.length
                  );
                  const coordinatorDisplayName = [
                    coordinatorName,
                    ...extraCoordinatorNames,
                  ]
                    .filter(Boolean)
                    .filter(
                      (name, index, names) => names.indexOf(name) === index
                    )
                    .join(", ");
                  const coordinatorProfileId =
                    event.eventCoordinator?.id ||
                    additionalCoordinators[0]?.id ||
                    "";

                  return (
                    <div
                      role="button"
                      tabIndex={0}
                      className={styles.volunteerSummaryRow}
                      key={event.id}
                      onClick={() => handleSummaryEventClick(event.id)}
                      onKeyDown={(keyDownEvent) =>
                        handleSummaryEventKeyDown(keyDownEvent, event.id)
                      }
                    >
                      <span className={styles.volunteerSummaryDate}>
                        {formatSummaryDate(event.eventDate)}
                      </span>
                      <div className={styles.volunteerSummaryEvent}>
                        <strong>{event.eventName}</strong>
                        <span>{getOwnerName(event)}</span>
                      </div>
                      <span className={styles.volunteerSummaryVolunteerCount}>
                        {getVolunteerCount(event, signupCount)}/
                        {event.maxVolunteerCount}{" "}
                        Volunteers
                      </span>
                      {hasCoordinator ? (
                        <button
                          type="button"
                          className={styles.volunteerSummaryCoordinator}
                          onClick={(clickEvent) =>
                            coordinatorProfileId &&
                            handleSummaryCoordinatorClick(clickEvent, coordinatorProfileId)
                          }
                        >
                          <UserAvatars
                            variant="small"
                            userId={event.eventCoordinator?.id}
                            profilePicture={
                              event.eventCoordinator?.profilePicture
                            }
                          />
                          <span>{coordinatorDisplayName}</span>
                        </button>
                      ) : (
                        <div className={styles.volunteerSummaryCoordinator}>
                          <span>No Volunteer Coordinator</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {volunteerEvents.length > 3 && (
                <button
                  type="button"
                  className={styles.volunteerSummarySeeMore}
                  onClick={() =>
                    setShowAllSummaryRows((showAllRows) => !showAllRows)
                  }
                >
                  {showAllSummaryRows ? "See less" : "See more"}
                </button>
              )}
            </div>
            <div className={styles.darbeEventCards}>
              {volunteerEvents.map(
                ({ event, signupCount, isSignedUp }: VolunteerEventDisplay) => {
                  const isRosterAdminForEvent = rosterAdminEntityIds.includes(
                    event.eventOwner.id
                  ) || rosterAdminEventIdSet.has(event.id);
                  const isCoordinatorForEvent =
                    event.eventCoordinator?.id === currentUserId ||
                    isRosterAdminForEvent;

                  return (
                    <div
                      key={event.id}
                      ref={(element) => {
                        eventCardRefs.current[event.id] = element;
                      }}
                      className={styles.volunteerEventCardAnchor}
                    >
                      <EventCard
                        event={event}
                        variant="match"
                        isSignedUp={isSignedUp}
                        signupCount={signupCount}
                        hideVolunteerActions={
                          isPostNeedAdmin ||
                          activeTab === "Past" ||
                          activeTab === "Admin"
                        }
                        hideDetailsAction={activeTab === "Incomplete"}
                        returnToEventsTab={activeTab}
                        canExpandVolunteers
                        allowCoordinatorVolunteerManagement={
                          isPostNeedAdmin ||
                          activeTab === "Admin" ||
                          (activeTab === "Current" && isCoordinatorForEvent)
                        }
                        enableAdminControls={
                          activeTab === "Admin" &&
                          (isPostNeedAdmin || isRosterAdminForEvent)
                        }
                        additionalVolunteerCoordinators={
                          getAdditionalVolunteerCoordinators()
                        }
                        showInvitationBanner={
                          Boolean(event.invitationFrom) ||
                          event.eventOwner.userType === "organization"
                        }
                        useCurrentEventTimingActions={
                          userType === "individual" && activeTab === "Current"
                        }
                        onPassSuccess={handlePassEventSuccess}
                        incompleteActionLabel={
                          activeTab === "Incomplete"
                            ? "Complete Event Creation"
                            : undefined
                        }
                        onIncompleteAction={
                          activeTab === "Incomplete"
                            ? handleFinishIncompleteEvent
                            : undefined
                        }
                        canDeleteEvent={canDeleteDisplayedEvent(event)}
                        onDeleteEvent={() => handleDeleteDisplayedEvent(event)}
                      />
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}
        {createEventChoice && (
          <div
            className={styles.createEventEntityDialogOverlay}
            onClick={() => setCreateEventChoice(null)}
          >
            <div
              className={styles.createEventEntityDialog}
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-event-entity-dialog-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.createEventEntityDialogHeader}>
                <h2 id="create-event-entity-dialog-title">
                  Create event for
                </h2>
                <button
                  type="button"
                  onClick={() => setCreateEventChoice(null)}
                  aria-label="Close organization selection"
                >
                  x
                </button>
              </div>
              <div className={styles.createEventEntityList}>
                {createEventChoice.options.map((option) => (
                  <button
                    type="button"
                    key={option.entityId}
                    className={styles.createEventEntityOption}
                    onClick={() => handleCreateEventChoice(option)}
                  >
                    <img
                      src={
                        option.profilePicture ||
                        assetUrl("/images/defaultProfilePicture.jpg")
                      }
                      alt=""
                    />
                    <span>{getEntityOptionName(option)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
    </section>
  );
};
