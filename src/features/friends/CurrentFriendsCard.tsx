import { CancelTwoTone } from "@mui/icons-material";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { UserAvatars } from "../../components/avatars/UserAvatars";
import { useDeleteFriendMutation } from "../../services/api/endpoints/friends/friends.api";
import { ProfileFriendState } from "./types";
import styles from "./styles/currentFriends.module.css";
import { PROFILE_ROUTE } from "../../routes/route.constants";

const CurrentFriendsCard = ({ friend }: { friend: ProfileFriendState }) => {
  const navigate = useNavigate();

  const [removeFriend] = useDeleteFriendMutation();

  const handleDenyFriendRequest = useCallback(async () => {
    try {
      await removeFriend(friend.id);
    } catch (err) {
      console.log(err, "Error deleting incoming friend request");
    }
  }, [removeFriend, friend.id]);

  const redirectToFriendProfile = (friendId: string) => {
    navigate(`${PROFILE_ROUTE}/${friendId}`);
  };

  return (
    <div className={styles.currentFriendCardContentDiv}>
      <div>
        <div style={{ maxWidth: "350px" }}>
          <UserAvatars
            key={friend.id}
            profilePicture={friend.profilePicture}
            fullName={friend.fullName}
            onClick={() => redirectToFriendProfile(friend.id)}
            city={friend.city}
            zip={friend.zip}
          />
        </div>
      </div>
      <div className={styles.currentFriendButton}>
        <CancelTwoTone
          className={styles.removeCurrentFriendIcon}
          onClick={handleDenyFriendRequest}
        />
      </div>
    </div>
  );
};

export default CurrentFriendsCard;
