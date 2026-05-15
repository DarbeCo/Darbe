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
  useGetEventsQuery,
  useGetSignedUpEventsQuery,
} from "../../../services/api/endpoints/events/events.api";
import { useGetRosterAdminEntityIdsQuery } from "../../../services/api/endpoints/roster/roster.api";
import { EventCard } from "../../../components/events/EventCard";
import { ShortEventState } from "../../../services/api/endpoints/types/events.api.types";
import { useAppSelector } from "../../../services/hooks";
import { selectCurrentUserId, selectUserType } from "../../users/selectors";
import { CustomSvgs } from "../../../components/customSvgs/CustomSvgs";
import { UserAvatars } from "../../../components/avatars/UserAvatars";
import { CREATE_EVENT_ROUTE, PROFILE_ROUTE } from "../../../routes/route.constants";
import {
  getIncompletePostNeedEventsForUser,
  incompletePostNeedEventToShortEvent,
} from "../../postNeed/incompleteEvents";
import {
  parseEventDateAsLocalDate,
  parseEventDateTimeAsLocalDate,
} from "../../../utils/eventDateUtils";

import styles from "../styles/entityEvents.module.css";

const adminTabs = ["Current", "Past", "Admin", "Incomplete"] as const;
const nonprofitTabs = ["Past", "Current", "Admin"] as const;
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
  const [showAllSummaryRows, setShowAllSummaryRows] = useState(false);
  const [incompleteDraftEvents, setIncompleteDraftEvents] = useState<
    ShortEventState[]
  >([]);
  const [hiddenEventIds, setHiddenEventIds] = useState<string[]>([]);
  const eventCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { data: events, isLoading } = useGetEventsQuery();
  const { data: rosterAdminEntityIds = [] } = useGetRosterAdminEntityIdsQuery();
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
  const hasCoordinatorEvents = Boolean(
    currentUserId &&
      events?.some(
        (event) =>
          event.eventCoordinator?.id === currentUserId ||
          rosterAdminEntityIds.includes(event.eventOwner.id)
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
    const eventsToDisplay = [...(events ?? [])];
    const hiddenEventIdSet = new Set(hiddenEventIds);
    const adminManagedEvents = eventsToDisplay.filter(
      (event) =>
        event.eventOwner.id === currentUserId ||
        event.eventCoordinator?.id === currentUserId ||
        rosterAdminEntityIds.includes(event.eventOwner.id)
    );
    const coordinatorManagedEvents = eventsToDisplay.filter(
      (event) => event.eventCoordinator?.id === currentUserId
    );
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

      return [...(signedUpEvents ?? [])]
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
      const eventsForAdminTab = isPostNeedAdmin
        ? adminManagedEvents
        : coordinatorManagedEvents;

      return eventsForAdminTab
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
    rosterAdminEntityIds,
    signedUpEvents,
  ]);

  const isLoadingVolunteerEvents =
    isLoading ||
    (activeTab === "Current" && isLoadingSignedUpEvents) ||
    (activeTab === "Past" && isLoadingPastSignedUpEvents);
  const summaryEvents = showAllSummaryRows
    ? volunteerEvents
    : volunteerEvents.slice(0, COLLAPSED_SUMMARY_COUNT);

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

  const handleFinishIncompleteEvent = (eventId: string) => {
    navigate(CREATE_EVENT_ROUTE, {
      state: { incompleteEventId: eventId },
    });
  };

  const handleCreateEvent = (eventType: "externalEvent" | "internalEvent") => {
    navigate(CREATE_EVENT_ROUTE, {
      state: { initialEventType: eventType },
    });
  };

  const handlePassEventSuccess = (eventId: string) => {
    setHiddenEventIds((currentHiddenEventIds) =>
      currentHiddenEventIds.includes(eventId)
        ? currentHiddenEventIds
        : [...currentHiddenEventIds, eventId]
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
        {userType === "nonprofit" && (
          <div className={styles.nonprofitEventActions}>
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
                  const hasCoordinator = Boolean(
                    event.eventCoordinator?.id && coordinatorName
                  );

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
                            handleSummaryCoordinatorClick(
                              clickEvent,
                              event.eventCoordinator!.id
                            )
                          }
                        >
                          <UserAvatars
                            variant="small"
                            userId={event.eventCoordinator?.id}
                            profilePicture={
                              event.eventCoordinator?.profilePicture
                            }
                          />
                          <span>{coordinatorName}</span>
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
                ({ event, signupCount, isSignedUp }: VolunteerEventDisplay) => (
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
                        isPostNeedAdmin || activeTab === "Admin"
                      }
                      enableAdminControls={
                        activeTab === "Admin" &&
                        (isPostNeedAdmin ||
                          event.eventCoordinator?.id === currentUserId ||
                          rosterAdminEntityIds.includes(event.eventOwner.id))
                      }
                      useCurrentEventTimingActions={
                        userType === "individual" && activeTab === "Current"
                      }
                      onPassSuccess={handlePassEventSuccess}
                      incompleteActionLabel={
                        activeTab === "Incomplete" ? "Complete Event Creation" : undefined
                      }
                      onIncompleteAction={
                        activeTab === "Incomplete"
                          ? handleFinishIncompleteEvent
                          : undefined
                      }
                    />
                  </div>
                )
              )}
            </div>
          </>
        )}
    </section>
  );
};
