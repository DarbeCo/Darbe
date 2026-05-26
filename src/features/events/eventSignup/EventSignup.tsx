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
      { skip: userType !== "individual" }
    );
  const { data: pastSignedUpEvents, isLoading: isLoadingPastSignedUpEvents } =
    useGetSignedUpEventsQuery(
      { when: "past" },
      { skip: userType !== "individual" }
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
    if (!currentUserId || !isPostNeedAdmin) {
      setIncompleteDraftEvents([]);
      return;
    }

    const drafts = getIncompletePostNeedEventsForUser(currentUserId)
      .filter((draft) => draft.missingFields.length > 0)
      .map(incompletePostNeedEventToShortEvent);

    setIncompleteDraftEvents(drafts);
  }, [currentUserId, isPostNeedAdmin, activeTab]);

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
      isPostNeedAdmin || activeTab === "Admin"
        ? adminManagedEvents
        : eventsToDisplay;

    if (activeTab === "Past") {
      if (!isPostNeedAdmin) {
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

      return sourceEvents
        .filter((event) => isPastEvent(event))
        .sort(
          (first, second) =>
            getEventDateOnlyTime(second.eventDate) -
            getEventDateOnlyTime(first.eventDate)
        )
        .map((event) => ({ event }));
    }

    if (activeTab === "Current") {
      if (isPostNeedAdmin) {
        return sourceEvents
          .filter(
            (event) => isCurrentEvent(event) && !hiddenEventIdSet.has(event.id)
          )
          .sort(
            (first, second) =>
              getEventDateOnlyTime(first.eventDate) -
              getEventDateOnlyTime(second.eventDate)
          )
          .map((event) => ({ event }));
      }

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

  const handleCreateEvent = (eventType: "externalEvent" | "internalEvent") => {
    const delegatedEventOwnerId =
      userType === "individual"
        ? eventType === "internalEvent"
          ? internalEventAdminEntityIds[0]
          : externalEventAdminEntityIds[0]
        : undefined;

    navigate(CREATE_EVENT_ROUTE, {
      state: {
        initialEventType: eventType,
        initialEventOwnerId: delegatedEventOwnerId,
      },
    });
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
        {((userType === "organization" || userType === "nonprofit") ||
          (userType === "individual" && rosterAdminEntityIds.length > 0)) && (
          <div className={styles.nonprofitEventActions}>
            {(userType === "organization" ||
              userType === "nonprofit" ||
              (userType === "individual" &&
                externalEventAdminEntityIds.length > 0)) && (
              <button
                type="button"
                className={styles.nonprofitEventAction}
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
            {(userType === "organization" ||
              userType === "nonprofit" ||
              (userType === "individual" &&
                internalEventAdminEntityIds.length > 0)) && (
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
    </section>
  );
};
