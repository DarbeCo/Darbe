import { CircularProgress } from "@mui/material";

import { useGetEventsQuery } from "../../../services/api/endpoints/events/events.api";
import { EventCard } from "../../../components/events/EventCard";
import { ShortEventState } from "../../../services/api/endpoints/types/events.api.types";

import styles from "../styles/entityEvents.module.css";

export const EventMatches = () => {
  const { data, isLoading } = useGetEventsQuery();

  return (
    <div className={styles.darbeEventCards}>
      {isLoading && <CircularProgress />}
      {!isLoading &&
        data?.map((event: ShortEventState) => <EventCard event={event} />)}
    </div>
  );
};
