import { AddCircleTwoTone, CancelTwoTone } from "@mui/icons-material";
import { UserAvatars } from "../../components/avatars/UserAvatars";
import { PendingFriendRequestState } from "./types";
import styles from "./styles/currentFriends.module.css";
import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useAcceptFriendRequestMutation,
  useDeleteFriendRequestMutation,
} from "../../services/api/endpoints/friends/friends.api";
import { PROFILE_ROUTE } from "../../routes/route.constants";

const PendingFriends = ({
  friendRequest,
}: {
  friendRequest: PendingFriendRequestState;
}) => {
  const navigate = useNavigate();

  const [deleteFriendRequest] = useDeleteFriendRequestMutation();
  const [acceptFriendRequest] = useAcceptFriendRequestMutation();
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteLockRef = useRef(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const acceptLockRef = useRef(false);

  const handleDeletePendingFriendRequest = useCallback(async () => {
    if (!friendRequest.receiverId?.id) return;
    if (deleteLockRef.current || isDeleting) return;

    deleteLockRef.current = true;
    setIsDeleting(true);
    try {
      await deleteFriendRequest(friendRequest.receiverId.id).unwrap();
    } catch (err) {
      deleteLockRef.current = false;
      setIsDeleting(false);
      console.log(err, "Error deleting incoming friend request");
    }
  }, [deleteFriendRequest, friendRequest.receiverId?.id, isDeleting]);

  const handleAcceptPendingFriendRequest = useCallback(async () => {
    if (!friendRequest.receiverId?.id) return;
    if (acceptLockRef.current || isAccepting) return;

    acceptLockRef.current = true;
    setIsAccepting(true);
    try {
      await acceptFriendRequest(friendRequest.receiverId.id).unwrap();
    } catch (err) {
      acceptLockRef.current = false;
      setIsAccepting(false);
      console.log(err, "Error accepting pending friend request");
    }
  }, [acceptFriendRequest, friendRequest.receiverId?.id, isAccepting]);

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
              redirectToFriendProfile(
                friendRequest.receiverId._id || friendRequest.receiverId.id
              )
            }
            city={friendRequest.receiverId.city}
            zip={friendRequest.receiverId.zip}
          />
        </div>
      </div>
      <div className={styles.pendingFriendButtons}>
        <AddCircleTwoTone
          className={styles.acceptPendingFriendIcon}
          onClick={handleAcceptPendingFriendRequest}
          aria-disabled={isAccepting}
          style={isAccepting ? { opacity: 0.5, pointerEvents: "none" } : undefined}
        />
        <CancelTwoTone
          className={styles.removeCurrentFriendIcon}
          onClick={handleDeletePendingFriendRequest}
          aria-disabled={isDeleting}
          style={isDeleting ? { opacity: 0.5, pointerEvents: "none" } : undefined}
        />
      </div>
    </div>
  );
};

export default PendingFriends;
