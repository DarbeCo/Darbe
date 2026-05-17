import { CircularProgress } from "@mui/material";
import { PhotoLibrary } from "@mui/icons-material";

import { useGetEntityEventPhotoSummariesQuery } from "../../services/api/endpoints/eventPhotos/eventPhotos.api";
import { useAppDispatch } from "../../services/hooks";
import {
  setExternalData,
  setModalType,
} from "../modal/modalSlice";
import { EDIT_SECTIONS } from "../../features/users/userProfiles/constants";
import { parseEventDateAsLocalDate } from "../../utils/eventDateUtils";

import styles from "./styles/eventPhotos.module.css";

interface EventPhotoListModalProps {
  externalData?: unknown;
}

const formatEventDate = (eventDate: string): string => {
  if (!eventDate) return "";
  return parseEventDateAsLocalDate(eventDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const EventPhotoListModal = ({
  externalData,
}: EventPhotoListModalProps) => {
  const dispatch = useAppDispatch();
  const entityId = typeof externalData === "string" ? externalData : "";

  const { data: events, isLoading } = useGetEntityEventPhotoSummariesQuery(
    entityId,
    { skip: !entityId }
  );

  const handleEventClick = (eventId: string) => {
    dispatch(setExternalData({ eventId, entityId }));
    dispatch(setModalType(EDIT_SECTIONS.eventPhotoCarousel));
  };

  if (!entityId) {
    return (
      <div className={styles.eventPhotoListEmpty}>No entity selected</div>
    );
  }

  return (
    <div className={styles.eventPhotoList}>
      {isLoading && (
        <div className={styles.eventPhotoListLoading}>
          <CircularProgress />
        </div>
      )}

      {!isLoading && !events?.length && (
        <p className={styles.eventPhotoListEmpty}>No events yet</p>
      )}

      {!isLoading &&
        events?.map((event) => (
          <button
            key={event.eventId}
            type="button"
            className={styles.eventPhotoListRow}
            onClick={() => handleEventClick(event.eventId)}
          >
            <div className={styles.eventPhotoListThumb}>
              {event.coverPhotoUrl ? (
                <img src={event.coverPhotoUrl} alt="" />
              ) : (
                <PhotoLibrary />
              )}
            </div>
            <div className={styles.eventPhotoListMeta}>
              <strong>{event.eventName || "Untitled event"}</strong>
              <span>{formatEventDate(event.eventDate)}</span>
            </div>
            <span className={styles.eventPhotoListCount}>
              {event.photoCount} {event.photoCount === 1 ? "photo" : "photos"}
            </span>
          </button>
        ))}
    </div>
  );
};
