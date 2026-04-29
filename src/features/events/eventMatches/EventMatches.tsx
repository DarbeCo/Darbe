import { CircularProgress } from "@mui/material";
import { useMemo } from "react";

import { useGetEventsQuery } from "../../../services/api/endpoints/events/events.api";
import { EventCard } from "../../../components/events/EventCard";
import { ShortEventState } from "../../../services/api/endpoints/types/events.api.types";

import styles from "../styles/entityEvents.module.css";

interface EventMatchesProps {
  matchFilter?: "Event Matches" | "Cause Matches" | "Availability Matches";
  recentFilter?: "Most Recent" | "Least Recent" | "A - Z";
}

export const EventMatches = ({
  matchFilter = "Event Matches",
  recentFilter = "Most Recent",
}: EventMatchesProps) => {
  const { data, isLoading } = useGetEventsQuery();
  const filteredEvents = useMemo(() => {
    if (!data || matchFilter !== "Event Matches") {
      return [];
    }

    const sortedEvents = [...data];

    if (recentFilter === "Most Recent") {
      sortedEvents.sort(
        (first, second) =>
          new Date(second.eventDate).getTime() -
          new Date(first.eventDate).getTime()
      );
    }

    if (recentFilter === "Least Recent") {
      sortedEvents.sort(
        (first, second) =>
          new Date(first.eventDate).getTime() -
          new Date(second.eventDate).getTime()
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
      {isLoading && <CircularProgress />}
      {!isLoading &&
        filteredEvents.length === 0 && (
          <p className={styles.noEventMatches}>No matches found.</p>
        )}
      {!isLoading &&
        filteredEvents.map((event: ShortEventState) => (
          <EventCard key={event.id} event={event} variant="match" />
        ))}
    </div>
  );
};
