import { CircularProgress } from "@mui/material";
import { useMemo } from "react";
import { useGetVolunteerMatchesQuery } from "../../services/api/endpoints/events/events.api";
import { VolunteerCard } from "./VolunteerCard";

import styles from "./styles/volunteerMathces.module.css";

interface VolunteerMatchesProps {
  matchFilter: "Volunteer Matches" | "Cause Matches" | "Availability Matches";
  recentFilter: "Most Recent" | "Least Recent" | "A - Z";
}

const getVolunteerName = (match: { fullName?: string; firstName?: string; lastName?: string }) =>
  match.fullName || `${match.firstName ?? ""} ${match.lastName ?? ""}`.trim();

export const VolunteerMatches = ({
  matchFilter,
  recentFilter,
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
    <div className={styles.volunteerMatchesContainer}>
      {isLoading && <CircularProgress />}
      {!isLoading && filteredMatches.length === 0 && (
        <p>No volunteer matches found.</p>
      )}
      {!isLoading && filteredMatches.length > 0 && (
        <>
          {filteredMatches.map((match) => (
            <VolunteerCard key={match.id} match={match} />
          ))}
        </>
      )}
    </div>
  );
};
