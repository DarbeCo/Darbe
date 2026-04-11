import { useModal } from "../../../../utils/commonHooks/UseModal";
import { PictureModal } from "../../editProfile/editSections/subSections/PIctureModal";
import { EditProfileIcon } from "./EditProfileIcon";

import styles from "../styles/userProfiles.module.css";

interface UserProfilePictureProps {
  canEdit: boolean;
  profilePicture?: string;
  userId: string | undefined;
}

export const UserProfilePicture = ({
  canEdit,
  profilePicture,
  userId,
}: UserProfilePictureProps) => {
  const {
    isVisible: addProfilePictureModal,
    show: showProfilePictureModal,
    toggle: hideProfilePictureModal,
  } = useModal();

  const handleEditProfilePicture = () => {
    showProfilePictureModal();
  };

  const profilePictureFallback = "/images/defaultProfilePicture.jpg";
  const altText = profilePicture
    ? "Profile Picture"
    : "Default Profile Picture";

  return (
    <div className={styles.profilePicture}>
      <img
        src={profilePicture ?? profilePictureFallback}
        alt={altText}
        className={styles.profilePictureImage}
      />
      {canEdit && (
        <EditProfileIcon
          onClick={handleEditProfilePicture}
          className={styles.editProfilePictureButton}
          useOtherIcon
          variant="default"
        />
      )}
      {addProfilePictureModal && userId && (
        <PictureModal
          isCoverPhoto={false}
          closeModal={hideProfilePictureModal}
          userId={userId}
        />
      )}
    </div>
  );
};
