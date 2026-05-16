import { CircularProgress } from "@mui/material";
import { useMemo } from "react";
import { useGetVolunteerMatchesQuery } from "../../services/api/endpoints/events/events.api";
import { VolunteerCard } from "./VolunteerCard";

import styles from "./styles/volunteerMathces.module.css";

interface VolunteerMatchesProps {
  matchFilter: "Volunteer Matches" | "Cause Matches" | "Availability Matches";
  recentFilter: "Most Recent" | "Least Recent" | "A - Z";
  hideLoadingSpinner?: boolean;
}

const getVolunteerName = (match: { fullName?: string; firstName?: string; lastName?: string }) =>
  match.fullName || `${match.firstName ?? ""} ${match.lastName ?? ""}`.trim();

export const VolunteerMatches = ({
  matchFilter,
  recentFilter,
  hideLoadingSpinner = false,
}: VolunteerMatchesProps) => {
  const { data, isLoading } = useGetVolunteerMatchesQuery();
  const filteredMatches = useMemo(() => {
    if (!data || matchFilter === "Availability Matches") {
      return [];
    }

    const sortedMatches = [...data];

    if (recentFilter === "Most Recent") {
      sortedMatches.sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
      );
    }

    if (recentFilter === "Least Recent") {
      sortedMatches.sort(
        (first, second) =>
          new Date(first.createdAt).getTime() -
          new Date(second.createdAt).getTime()
      );
    }

    if (recentFilter === "A - Z") {
      sortedMatches.sort((first, second) =>
        getVolunteerName(first).localeCompare(getVolunteerName(second))
      );
    }

    return sortedMatches;
  }, [data, matchFilter, recentFilter]);

  return (
    <div className={styles.volunteerMatchesList}>
      {isLoading && !hideLoadingSpinner && <CircularProgress />}
      {!isLoading && filteredMatches.length === 0 && (
        <p className={styles.volunteerMatchesEmpty}>
          No volunteer matches found.
        </p>
      )}
      {!isLoading && filteredMatches.length > 0 && (
        <>
          {filteredMatches.map((match, index) => (
            <div className={styles.volunteerMatchGroup} key={match.id}>
              <div className={styles.volunteerCardHeader}>
                <strong>Volunteer # {index + 1}/15</strong>
                <button type="button">
                  {match.nextEvent?.impactValue ||
                    match.nextEvent?.eventName ||
                    "No upcoming event"}
                </button>
              </div>
              <div className={styles.volunteerMatchesContainer}>
                <VolunteerCard match={match} />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};
