import { CircularProgress } from "@mui/material";

import { useGetEventDetailsQuery } from "../../../services/api/endpoints/events/events.api";
import { EventDetailCard } from "../../../components/events/EventDetailCard";

import styles from "../styles/singleItems.module.css";

interface RenderSingleEventProps {
  userId: string;
  eventId: string;
}

// TODO: Fill me out once post a need cards are done
export const RenderSingleEvent = ({
  userId,
  eventId,
}: RenderSingleEventProps) => {
  const { data, isLoading } = useGetEventDetailsQuery(eventId);
  const isEventOwner = data?.eventOwner?.id === userId;

  return (
    <div className={styles.renderSingleItem}>
      {isLoading && <CircularProgress />}
      {!isLoading && data && (
        <EventDetailCard event={data} isEventOwner={isEventOwner} />
      )}
    </div>
  );
};
