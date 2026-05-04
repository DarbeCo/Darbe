import { useEffect, useMemo, useRef, useState } from "react";
import { CircularProgress } from "@mui/material";
import { useLocation } from "react-router-dom";

import {
  useGetEventsQuery,
  useGetSignedUpEventsQuery,
} from "../../../services/api/endpoints/events/events.api";
import { EventCard } from "../../../components/events/EventCard";
import { ShortEventState } from "../../../services/api/endpoints/types/events.api.types";
import { useAppSelector } from "../../../services/hooks";
import { selectCurrentUserId, selectUserType } from "../../users/selectors";
import { CustomSvgs } from "../../../components/customSvgs/CustomSvgs";
import { UserAvatars } from "../../../components/avatars/UserAvatars";
import {
  getIncompletePostNeedEventsForUser,
  incompletePostNeedEventToShortEvent,
} from "../../postNeed/incompleteEvents";

import styles from "../styles/entityEvents.module.css";

const adminTabs = ["Current", "Past", "Admin", "Incomplete"] as const;
const nonprofitTabs = ["Current", "Past", "Incomplete"] as const;
const nonAdminTabs = ["Current", "Past"] as const;
type EventsTab = (typeof adminTabs)[number];
const COLLAPSED_SUMMARY_COUNT = 3;

const formatSummaryDate = (eventDate: string) =>
  new Date(eventDate).toLocaleDateString("en-US", {
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

const getDateOnlyTime = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const getEventDateOnlyTime = (eventDate: string) => {
  const [year, month, day] = eventDate.split("T")[0].split("-").map(Number);

  if (year && month && day) {
    return new Date(year, month - 1, day).getTime();
  }

  return getDateOnlyTime(new Date(eventDate));
};

const isPastEvent = (eventDate: string) => {
  const todayTime = getDateOnlyTime(new Date());
  const eventDateTime = getEventDateOnlyTime(eventDate);

  return eventDateTime < todayTime;
};

const isCurrentEvent = (eventDate: string) => {
  const todayTime = getDateOnlyTime(new Date());
  const eventDateTime = getEventDateOnlyTime(eventDate);

  return eventDateTime >= todayTime;
};

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
  const userType = useAppSelector(selectUserType);
  const currentUserId = useAppSelector(selectCurrentUserId);
  const isPostNeedAdmin =
    userType === "organization" || userType === "nonprofit";
  const availableTabs: readonly EventsTab[] = userType === "organization"
    ? adminTabs
    : userType === "nonprofit"
    ? nonprofitTabs
    : nonAdminTabs;
  const location = useLocation();
  const restoredTab = (location.state as { activeEventsTab?: string } | null)
    ?.activeEventsTab;
  const [activeTab, setActiveTab] = useState<EventsTab>(
    availableTabs.includes(restoredTab as EventsTab)
      ? (restoredTab as EventsTab)
      : availableTabs[0]
  );
  const [showAllSummaryRows, setShowAllSummaryRows] = useState(false);
  const [incompleteDraftEvents, setIncompleteDraftEvents] = useState<
    ShortEventState[]
  >([]);
  const eventCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { data: events, isLoading } = useGetEventsQuery();
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
    const adminManagedEvents = eventsToDisplay.filter(
      (event) =>
        event.eventOwner.id === currentUserId ||
        event.eventCoordinator?.id === currentUserId
    );
    const sourceEvents = isPostNeedAdmin ? adminManagedEvents : eventsToDisplay;

    if (activeTab === "Past") {
      if (!isPostNeedAdmin) {
        return [...(pastSignedUpEvents ?? [])]
          .filter(({ event }) => isPastEvent(event.eventDate))
          .sort(
            (first, second) =>
              getEventDateOnlyTime(second.event.eventDate) -
              getEventDateOnlyTime(first.event.eventDate)
          )
          .map(({ event, signupCount }) => ({
            event,
            signupCount,
            isSignedUp: true,
          }));
      }

      return sourceEvents
        .filter((event) => isPastEvent(event.eventDate))
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
          .filter((event) => isCurrentEvent(event.eventDate))
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
            status !== "passed" && isCurrentEvent(event.eventDate)
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
    incompleteDraftEvents,
    isPostNeedAdmin,
    pastSignedUpEvents,
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

  return (
    <section className={styles.volunteerEventsPanel}>
        <div className={styles.volunteerEventsTitle}>
          <CustomSvgs
            svgPath="/svgs/common/eventsIcon.svg"
            variant="small"
            altText=""
          />
          <h1>Events</h1>
        </div>
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
                    <button
                      type="button"
                      className={styles.volunteerSummaryRow}
                      key={event.id}
                      onClick={() => handleSummaryEventClick(event.id)}
                    >
                      <span className={styles.volunteerSummaryDate}>
                        {formatSummaryDate(event.eventDate)}
                      </span>
                      <div className={styles.volunteerSummaryEvent}>
                        <strong>{event.eventName}</strong>
                        <span>{getOwnerName(event)}</span>
                      </div>
                      <span className={styles.volunteerSummaryVolunteerCount}>
                        {signupCount ?? event.signups?.length ?? 0}/
                        {event.maxVolunteerCount}{" "}
                        Volunteers
                      </span>
                      <div className={styles.volunteerSummaryCoordinator}>
                        {hasCoordinator ? (
                          <>
                            <UserAvatars
                              variant="small"
                              userId={event.eventCoordinator?.id}
                              profilePicture={
                                event.eventCoordinator?.profilePicture
                              }
                            />
                            <span>{coordinatorName}</span>
                          </>
                        ) : (
                          <span>No Volunteer Coordinator</span>
                        )}
                      </div>
                    </button>
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
                        isPostNeedAdmin || activeTab === "Past"
                      }
                      hideDetailsAction={activeTab === "Incomplete"}
                      returnToEventsTab={activeTab}
                      canExpandVolunteers={activeTab === "Current"}
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
