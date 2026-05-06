import { CircularProgress } from "@mui/material";
import { useMemo } from "react";

import { useGetEventsQuery } from "../../../services/api/endpoints/events/events.api";
import { EventCard } from "../../../components/events/EventCard";
import { ShortEventState } from "../../../services/api/endpoints/types/events.api.types";

import styles from "../styles/entityEvents.module.css";

interface EventMatchesProps {
  matchFilter?: "Event Matches" | "Cause Matches" | "Availability Matches";
  recentFilter?: "Most Recent" | "Least Recent" | "A - Z";
  hideLoadingSpinner?: boolean;
}

const getDateOnlyTime = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const getEventDateOnlyTime = (eventDate: string) => {
  const [year, month, day] = eventDate.split("T")[0].split("-").map(Number);

  if (year && month && day) {
    return new Date(year, month - 1, day).getTime();
  }

  return getDateOnlyTime(new Date(eventDate));
};

const hasNotHappenedYet = (eventDate: string) => {
  const todayTime = getDateOnlyTime(new Date());
  const eventDateTime = getEventDateOnlyTime(eventDate);

  return eventDateTime >= todayTime;
};

export const getUpcomingEventMatches = (events: ShortEventState[] = []) =>
  events.filter((event) => hasNotHappenedYet(event.eventDate));

export const EventMatches = ({
  matchFilter = "Event Matches",
  recentFilter = "Most Recent",
  hideLoadingSpinner = false,
}: EventMatchesProps) => {
  const { data, isLoading } = useGetEventsQuery();
  const filteredEvents = useMemo(() => {
    if (!data || matchFilter !== "Event Matches") {
      return [];
    }

    const sortedEvents = getUpcomingEventMatches(data);

    if (recentFilter === "Most Recent") {
      sortedEvents.sort(
        (first, second) =>
          getEventDateOnlyTime(second.eventDate) -
          getEventDateOnlyTime(first.eventDate)
      );
    }

    if (recentFilter === "Least Recent") {
      sortedEvents.sort(
        (first, second) =>
          getEventDateOnlyTime(first.eventDate) -
          getEventDateOnlyTime(second.eventDate)
      );
    }

    if (recentFilter === "A - Z") {
      sortedEvents.sort((first, second) =>
        first.eventName.localeCompare(second.eventName)
      );
    }

    return sortedEvents;
  }, [data, matchFilter, recentFilter]);

  return (
    <div className={styles.darbeEventCards}>
      {isLoading && !hideLoadingSpinner && <CircularProgress />}
      {!isLoading && filteredEvents.length === 0 && (
        <p className={styles.noEventMatches}>No matches found.</p>
      )}
      {!isLoading &&
        filteredEvents.map((event: ShortEventState) => (
          <EventCard key={event.id} event={event} variant="match" />
        ))}
    </div>
  );
};
