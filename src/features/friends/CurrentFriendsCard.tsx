import { CancelTwoTone } from "@mui/icons-material";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAvatars } from "../../components/avatars/UserAvatars";
import { ConfirmDialog } from "../../components/confirmDialog/ConfirmDialog";
import { useDeleteFriendMutation } from "../../services/api/endpoints/friends/friends.api";
import { ProfileFriendState } from "./types";
import styles from "./styles/currentFriends.module.css";
import { PROFILE_ROUTE } from "../../routes/route.constants";

const formatConnectedDate = (connectedAt?: string) => {
  if (!connectedAt) {
    return "";
  }

  return new Date(connectedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const CurrentFriendsCard = ({ friend }: { friend: ProfileFriendState }) => {
  const navigate = useNavigate();
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const [removeFriend] = useDeleteFriendMutation();

  const handleDenyFriendRequest = useCallback(async () => {
    try {
      await removeFriend(friend.id);
      setShowRemoveConfirm(false);
    } catch (err) {
      console.log(err, "Error deleting incoming friend request");
    }
  }, [removeFriend, friend.fullName, friend.id]);

  const redirectToFriendProfile = (friendId: string) => {
    navigate(`${PROFILE_ROUTE}/${friendId}`);
  };
  const connectedDate = formatConnectedDate(friend.connectedAt);

  return (
    <div className={styles.currentFriendCardContentDiv}>
      <div>
        <div className={styles.currentFriendDetails}>
          <UserAvatars
            key={friend.id}
            className={styles.currentFriendAvatar}
            infoClassName={styles.currentFriendAvatarInfo}
            profilePicture={friend.profilePicture}
            fullName={friend.fullName}
            onClick={() => redirectToFriendProfile(friend.id)}
            city={friend.city}
            zip={friend.zip}
          />
          {connectedDate && (
            <span className={styles.connectedDate}>
              Connected on {connectedDate}
            </span>
          )}
        </div>
      </div>
      <div className={styles.currentFriendButton}>
        <CancelTwoTone
          className={styles.removeCurrentFriendIcon}
          onClick={() => setShowRemoveConfirm(true)}
        />
      </div>
      {showRemoveConfirm && (
        <ConfirmDialog
          title={`Remove ${friend.fullName || "this friend"}?`}
          message="This will remove them from your friends."
          confirmLabel="Remove"
          onConfirm={handleDenyFriendRequest}
          onCancel={() => setShowRemoveConfirm(false)}
        />
      )}
    </div>
  );
};

export default CurrentFriendsCard;
