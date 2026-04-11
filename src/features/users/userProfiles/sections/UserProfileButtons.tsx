import { useAppDispatch } from "../../../../services/hooks";
import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import { ProfileFriendState } from "../../../friends/types";
import { EDIT_SECTIONS } from "../constants";
import {
  showModal,
  setModalType,
  MODAL_TYPE,
  setModalUserId,
  setExternalData,
} from "../../../../components/modal/modalSlice";

import styles from "../styles/userProfiles.module.css";
import { useNavigate } from "react-router-dom";
import { FRIENDS_ROUTE } from "../../../../routes/route.constants";

interface UserProfileButtonsProps {
  friendCount: number;
  causesCount: number;
  friends?: ProfileFriendState[];
  causes?: string[];
  canEdit?: boolean;
  mutualCauses?: number;
  mutualFriends?: number;
  userId?: string;
}

export const UserProfileButtons = ({
  friendCount,
  causesCount,
  friends,
  causes,
  canEdit,
  mutualCauses,
  mutualFriends,
  userId,
}: UserProfileButtonsProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate()

  const handleFriendsClick = () => {
    if (canEdit) {
      navigate(`${FRIENDS_ROUTE}`)
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
        <DarbeButton
          darbeButtonType="profileButtons"
          onClick={handleMutualFriendsClick}
          buttonText={`${mutualFriends} Mutuals`}
        />
      </div>

      <div className={styles.userProfileCausesButtons}>
        <DarbeButton
          darbeButtonType="profileButtons"
          onClick={handleCausesClick}
          buttonText={`Causes ${causesCount}`}
        />
        <DarbeButton
          darbeButtonType="profileButtons"
          onClick={handleMutualCausesClick}
          buttonText={`${mutualCauses} Mutuals`}
        />
      </div>
    </div>
  );
};
