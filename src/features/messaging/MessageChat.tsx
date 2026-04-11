import { useParams } from "react-router-dom";

import { selectCurrentFriends, selectCurrentUserId } from "../users/selectors";
import { useAppSelector } from "../../services/hooks";
import { UserAvatars } from "../../components/avatars/UserAvatars";
import { ComplexHeader } from "../../components/complexHeader/ComplexHeader";
import { MessagesDisplay } from "./MessagesDisplay";

import styles from "./styles/messaging.module.css";

export const MessageChat = () => {
  const { friendId } = useParams<{ friendId: string }>();
  const myFriends = useAppSelector(selectCurrentFriends);
  const myUserId = useAppSelector(selectCurrentUserId);

  const friendData = myFriends.find((friend) => friend.id === friendId);

  return (
    <div className={styles.messagingChat}>
      <ComplexHeader
        children={
          <UserAvatars
            userId={friendData?.id}
            profilePicture={friendData?.profilePicture}
            fullName={
              friendData?.fullName ||
              friendData?.nonprofitName ||
              friendData?.organizationName
            }
          />
        }
      />
      <MessagesDisplay currentUserId={myUserId} friendId={friendData?.id} />
    </div>
  );
};
