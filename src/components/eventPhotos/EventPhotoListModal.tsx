import { CircularProgress } from "@mui/material";
import { PhotoLibrary } from "@mui/icons-material";

import {
  useGetEntityEventPhotoSummariesQuery,
  useGetIndividualEventPhotoSummariesQuery,
} from "../../services/api/endpoints/eventPhotos/eventPhotos.api";
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

type ListScope = "entity" | "individual";

interface ListContext {
  userId: string;
  scope: ListScope;
}

const parseListContext = (externalData: unknown): ListContext => {
  if (typeof externalData === "string") {
    return { userId: externalData, scope: "entity" };
  }
  if (
    externalData &&
    typeof externalData === "object" &&
    "userId" in externalData &&
    typeof (externalData as Record<string, unknown>).userId === "string"
  ) {
    const record = externalData as Record<string, unknown>;
    const scope =
      record.scope === "individual" ? "individual" : "entity";
    return { userId: record.userId as string, scope };
  }
  return { userId: "", scope: "entity" };
};

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
  const { userId, scope } = parseListContext(externalData);

  const entityQuery = useGetEntityEventPhotoSummariesQuery(userId, {
    skip: !userId || scope !== "entity",
  });
  const individualQuery = useGetIndividualEventPhotoSummariesQuery(userId, {
    skip: !userId || scope !== "individual",
  });

  const events = scope === "entity" ? entityQuery.data : individualQuery.data;
  const isLoading =
    scope === "entity" ? entityQuery.isLoading : individualQuery.isLoading;

  const handleEventClick = (eventId: string) => {
    dispatch(
      setExternalData({ eventId, listUserId: userId, listScope: scope })
    );
    dispatch(setModalType(EDIT_SECTIONS.eventPhotoCarousel));
  };

  if (!userId) {
    return (
      <div className={styles.eventPhotoListEmpty}>No user selected</div>
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
