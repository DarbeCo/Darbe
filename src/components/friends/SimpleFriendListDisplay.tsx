import { useNavigate } from "react-router-dom";
import { UserAvatars } from "../avatars/UserAvatars";
import { PROFILE_ROUTE } from "../../routes/route.constants";
import { useAppDispatch } from "../../services/hooks";
import { hideModal } from "../modal/modalSlice";

import styles from "./styles/friends.module.css";

interface SimpleFriendListDisplayProps {
  externalData: any;
}

export const SimpleFriendListDisplay = ({
  externalData,
}: SimpleFriendListDisplayProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const hasFriends = externalData?.length > 0;

  const handleFriendRedirect = (friendId: string) => {
    navigate(`${PROFILE_ROUTE}/${friendId}`);
    dispatch(hideModal());
  };

  return (
    <div className={styles.mutualFriendsContainer}>
      <div className={styles.mutualFriendsScrollArea}>
        {!hasFriends && (
          <div className={styles.noMutualFriends}>No friends to display</div>
        )}
        {hasFriends &&
          externalData.map((friend: any) => (
            <div key={friend.id} className={styles.mutualFriendCard}>
              <UserAvatars
                userId={friend.id}
                profilePicture={friend.profilePicture}
                fullName={friend.fullName}
                onClick={() => handleFriendRedirect(friend.id)}
              />
            </div>
          ))}
      </div>
    </div>
  );
};
