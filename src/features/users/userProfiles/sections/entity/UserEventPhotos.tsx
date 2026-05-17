import { useAppDispatch } from "../../../../../services/hooks";
import {
  setExternalData,
  setModalType,
  showModal,
} from "../../../../../components/modal/modalSlice";
import { Typography } from "../../../../../components/typography/Typography";
import { EDIT_SECTIONS } from "../../constants";

import styles from "./styles/entityDetails.module.css";

interface UserEventPhotosProps {
  entityId?: string;
}

export const UserEventPhotos = ({ entityId }: UserEventPhotosProps) => {
  const dispatch = useAppDispatch();

  const handleOpen = () => {
    if (!entityId) return;
    dispatch(setExternalData(entityId));
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
        disabled={!entityId}
      >
        View Event Photos
      </button>
    </div>
  );
};
