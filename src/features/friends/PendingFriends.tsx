import { CancelTwoTone } from "@mui/icons-material";
import { UserAvatars } from "../../components/avatars/UserAvatars";
import { PendingFriendRequestState } from "./types";
import styles from "./styles/currentFriends.module.css";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDeleteFriendRequestMutation } from "../../services/api/endpoints/friends/friends.api";
import { PROFILE_ROUTE } from "../../routes/route.constants";

const PendingFriends = ({
  friendRequest,
}: {
  friendRequest: PendingFriendRequestState;
}) => {
  const navigate = useNavigate();

  const [deleteFriendRequest] = useDeleteFriendRequestMutation();

  const handleDeletePendingFriendRequest = useCallback(async () => {
    try {
      await deleteFriendRequest(friendRequest.receiverId.id);
    } catch (err) {
      console.log(err, "Error deleting incoming friend request");
    }
  }, [deleteFriendRequest]);

  const redirectToFriendProfile = (friendId: string) => {
    navigate(`${PROFILE_ROUTE}/${friendId}`);
  };

  return (
    <div className={styles.currentFriendCardContentDiv}>
      <div>
        <div style={{ maxWidth: "350px" }}>
          <UserAvatars
            key={friendRequest.receiverId.id}
            profilePicture={friendRequest.receiverId.profilePicture}
            fullName={
              friendRequest.receiverId.firstName +
              " " +
              friendRequest.receiverId.lastName
            }
            onClick={() =>
              redirectToFriendProfile(friendRequest.receiverId._id)
            }
            city={friendRequest.receiverId.city}
            zip={friendRequest.receiverId.zip}
          />
        </div>
      </div>
      <div className={styles.currentFriendButton}>
        <CancelTwoTone
          className={styles.removeCurrentFriendIcon}
          onClick={handleDeletePendingFriendRequest}
        />
      </div>
    </div>
  );
};

export default PendingFriends;
