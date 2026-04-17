import { useModal } from "../../../../utils/commonHooks/UseModal";
import { EditProfileIcon } from "./EditProfileIcon";
import { assetUrl } from "../../../../utils/assetUrl";

import styles from "../styles/userProfiles.module.css";
import { PictureModal } from "../../editProfile/editSections/subSections/PIctureModal";

interface CoverPhotoProps {
  canEdit: boolean;
  coverPhoto?: string;
  userId?: string;
}

export const CoverPhoto = ({
  canEdit,
  coverPhoto,
  userId,
}: CoverPhotoProps) => {
  const {
    isVisible: addCoverPhotoModal,
    show: showCoverPhotoModal,
    toggle: hideCoverPhotoModal,
  } = useModal();
  const fallbackCoverPhoto = "/images/defaultCoverPhoto.jpg";
  const altText = coverPhoto
    ? "Cover Photo"
    : "Fallback Cover Photo - Karolina Kaboompics ";

  const handleEditCoverPhoto = () => {
    showCoverPhotoModal();
  };

  return (
    <div className={styles.coverPhoto}>
      <img
        src={assetUrl(coverPhoto ?? fallbackCoverPhoto)}
        alt={altText}
        className={styles.coverPhotoImage}
      />
      {canEdit && (
        <EditProfileIcon
          onClick={handleEditCoverPhoto}
          className={styles.editCoverButton}
        />
      )}
      {addCoverPhotoModal && userId && (
        <PictureModal
          isCoverPhoto
          closeModal={hideCoverPhotoModal}
          currentPicture={coverPhoto}
          userId={userId}
        />
      )}
    </div>
  );
};
