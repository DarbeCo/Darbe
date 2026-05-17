import { useAppDispatch } from "../../../../../services/hooks";
import {
  setExternalData,
  setModalType,
  showModal,
} from "../../../../../components/modal/modalSlice";
import { Typography } from "../../../../../components/typography/Typography";
import { EDIT_SECTIONS } from "../../constants";

import styles from "./styles/entityDetails.module.css";

export type EventPhotoScope = "entity" | "individual";

interface UserEventPhotosProps {
  userId?: string;
  scope?: EventPhotoScope;
}

export const UserEventPhotos = ({
  userId,
  scope = "entity",
}: UserEventPhotosProps) => {
  const dispatch = useAppDispatch();

  const handleOpen = () => {
    if (!userId) return;
    dispatch(setExternalData({ userId, scope }));
    dispatch(setModalType(EDIT_SECTIONS.eventPhotoList));
    dispatch(showModal());
  };

  return (
    <div className={styles.entityUserDisplay}>
      <div className={styles.entityDetailsHeader}>
        <Typography variant="sectionTitle" textToDisplay="Event Photos" />
      </div>
      <button
        type="button"
        className={styles.entityUserShowAll}
        onClick={handleOpen}
        disabled={!userId}
      >
        View Event Photos
      </button>
    </div>
  );
};
