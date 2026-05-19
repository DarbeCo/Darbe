import { FriendRequests } from "../../../friends/friendRequests";
import PendingFriendRequests from "../../../friends/PendingRequests";
import CurrentFriends from "../../../friends/CurrentFriends";
import { useAppSelector } from "../../../../services/hooks";
import { selectUser } from "../../selectors";

import styles from "../styles/profileEdit.module.css";

export const EditFriends = () => {
  const { user } = useAppSelector(selectUser);

  return (
    <div className={styles.profileDialogContent}>
      <div className={styles.profileDialogScrollArea}>
        <div className={styles.profileFriendsDialogSections}>
          <FriendRequests />
          <CurrentFriends user={user} />
        </div>
      </div>
    </div>
  );
};
