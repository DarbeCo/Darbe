import { CircularProgress } from "@mui/material";

import { useGetEventsQuery } from "../../../services/api/endpoints/events/events.api";
import { ShortEventState } from "../../../services/api/endpoints/types/events.api.types";
import { EventCard } from "../../../components/events/EventCard";

import styles from "../styles/entityEvents.module.css";

export const EntityEvents = () => {
  const { data, isLoading } = useGetEventsQuery();

  return (
    <div className={styles.darbeEventCards}>
      {isLoading && <CircularProgress />}
      {!isLoading &&
        data?.map((event: ShortEventState) => <EventCard event={event} />)}
    </div>
  );
};
