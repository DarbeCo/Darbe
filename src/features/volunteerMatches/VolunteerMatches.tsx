import { CircularProgress } from "@mui/material";
import { useGetVolunteerMatchesQuery } from "../../services/api/endpoints/events/events.api";
import { VolunteerCard } from "./VolunteerCard";

import styles from "./styles/volunteerMathces.module.css";

export const VolunteerMatches = () => {
  const { data, isLoading } = useGetVolunteerMatchesQuery();

  return (
    <div className={styles.volunteerMatchesContainer}>
      {isLoading && <CircularProgress />}
      {data && data.length === 0 && <p>No volunteer matches found.</p>}
      {data && data.length > 0 && (
        <>
          {data.map((match) => (
            <VolunteerCard key={match.id} match={match} />
          ))}
        </>
      )}
    </div>
  );
};
