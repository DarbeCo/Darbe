import { useAppDispatch } from "../../../../services/hooks";
import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { ProfileFriendState } from "../../../friends/types";
import { Cause } from "../../../../services/types/cause.types";
import { EDIT_SECTIONS } from "../constants";
import {
  showModal,
  setModalType,
  MODAL_TYPE,
  setModalUserId,
  setExternalData,
} from "../../../../components/modal/modalSlice";
import { assetUrl } from "../../../../utils/assetUrl";

import styles from "../styles/userProfiles.module.css";

interface UserProfileButtonsProps {
  friendCount: number;
  causesCount: number;
  friends?: ProfileFriendState[];
  causes?: string[];
  canEdit?: boolean;
  mutualCauses?: number;
  mutualFriends?: number;
  mutualCausePreviews?: Cause[];
  mutualFriendPreviews?: ProfileFriendState[];
  userId?: string;
}

const MAX_MUTUAL_ICONS = 3;

const MutualCountButton = ({
  count,
  label,
  icons,
  fallbackSrc,
  onClick,
}: {
  count: number;
  label: string;
  icons: Array<{ id: string; image?: string; name?: string }>;
  fallbackSrc: string;
  onClick: () => void;
}) => {
  const visibleIcons = icons.slice(0, MAX_MUTUAL_ICONS);

  return (
    <button
      type="button"
      className={styles.profileIconCountButton}
      onClick={onClick}
      disabled={count === 0}
    >
      <span className={styles.profileIconCountStack} aria-hidden="true">
        {visibleIcons.map((icon) => (
          <img
            key={icon.id}
            src={icon.image || fallbackSrc}
            alt=""
            title={icon.name}
          />
        ))}
      </span>
      <span className={styles.profileIconCountText}>
        {count} {label}
      </span>
    </button>
  );
};

export const UserProfileButtons = ({
  friendCount,
  causesCount,
  friends,
  causes,
  canEdit,
  mutualCauses,
  mutualFriends,
  mutualCausePreviews = [],
  mutualFriendPreviews = [],
  userId,
}: UserProfileButtonsProps) => {
  const dispatch = useAppDispatch();
  const mutualFriendIcons = mutualFriendPreviews.map((friend) => ({
    id: friend.id,
    image: friend.profilePicture,
    name:
      friend.fullName ||
      friend.organizationName ||
      friend.nonprofitName ||
      `${friend.firstName ?? ""} ${friend.lastName ?? ""}`.trim(),
  }));
  const mutualCauseIcons = mutualCausePreviews.map((cause) => ({
    id: cause.id,
    image: cause.imageUrl,
    name: cause.name,
  }));

  const handleFriendsClick = () => {
    if (canEdit) {
      dispatch(setModalType(EDIT_SECTIONS.friends));
      dispatch(showModal());
    } else {
      dispatch(setModalType(MODAL_TYPE.profileFriends));
      dispatch(setModalUserId(userId));
      dispatch(setExternalData(friends));
      dispatch(showModal());
    }
  };

  const handleCausesClick = () => {
    if (canEdit) {
      dispatch(setModalType(EDIT_SECTIONS.causes));
      dispatch(showModal());
    } else {
      dispatch(setModalType(MODAL_TYPE.profileCauses));
      dispatch(setModalUserId(userId));
      dispatch(setExternalData(causes));
      dispatch(showModal());
    }
  };

  const handleMutualCausesClick = () => {
    dispatch(setModalType(MODAL_TYPE.mutualCauses));
    dispatch(setModalUserId(userId));
    dispatch(showModal());
  };

  const handleMutualFriendsClick = () => {
    dispatch(setModalType(MODAL_TYPE.mutualFriends));
    dispatch(setModalUserId(userId));
    dispatch(showModal());
  };

  return (
    <div className={styles.userProfileButtons}>
      <div className={styles.userProfileFriendButtons}>
        <DarbeButton
          darbeButtonType="profileButtons"
          onClick={handleFriendsClick}
          buttonText={`Friends ${friendCount}`}
        />
        {!canEdit && (
          <MutualCountButton
            onClick={handleMutualFriendsClick}
            count={mutualFriends ?? 0}
            label="mutual"
            icons={mutualFriendIcons}
            fallbackSrc={assetUrl("/images/defaultProfilePicture.jpg")}
          />
        )}
      </div>

      <div className={styles.userProfileCausesButtons}>
        <DarbeButton
          darbeButtonType="profileButtons"
          onClick={handleCausesClick}
          buttonText={`Causes ${causesCount}`}
        />
        {!canEdit && (
          <MutualCountButton
            onClick={handleMutualCausesClick}
            count={mutualCauses ?? 0}
            label="Shared"
            icons={mutualCauseIcons}
            fallbackSrc={assetUrl("/images/defaultCoverPhoto.jpg")}
          />
        )}
      </div>
    </div>
  );
};
