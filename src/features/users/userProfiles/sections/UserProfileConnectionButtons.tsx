import { useNavigate } from "react-router";
import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import {
  useAcceptFriendRequestMutation,
  useFollowEntityMutation,
  useSendFriendRequestMutation,
} from "../../../../services/api/endpoints/friends/friends.api";
import useScreenWidthHook from "../../../../utils/commonHooks/UseScreenWidth";
import { FRIEND_MESSAGE_ROUTE } from "../../../../routes/route.constants";

import styles from "../styles/userProfiles.module.css";
import { useAppDispatch } from "../../../../services/hooks";
import { removeReceivedFriendRequest } from "../../userSlice";

interface UserProfileConnectionButtonsProps {
  userId: string;
  isEntityProfile: boolean;
  isFriend?: boolean;
  isFollowing?: boolean;
  hasSentRequest?: boolean;
  hasReceivedRequestFromUser?: boolean;
}

export const UserProfileConnectionButtons = ({
  isFriend,
  isEntityProfile,
  isFollowing,
  hasSentRequest,
  hasReceivedRequestFromUser,
  userId,
}: UserProfileConnectionButtonsProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [sendFriendRequest] = useSendFriendRequestMutation();
  const [acceptFriendRequest] = useAcceptFriendRequestMutation();
  const [followEntity] = useFollowEntityMutation();
  const { isMobile } = useScreenWidthHook();

  const handleAcceptConnection = async (friendId: string) => {
    await acceptFriendRequest(friendId).unwrap();
    dispatch(removeReceivedFriendRequest(friendId));
  };

  const handleConnect = () => {
    sendFriendRequest(userId);
  };

  const handleFollow = () => {
    followEntity(userId);
  };

  const handleMessage = () => {
    navigate(FRIEND_MESSAGE_ROUTE(userId));
  };

  const friendtTextToShow = hasSentRequest ? "Pending" : "Connect";
  const followTextToShow = isFollowing ? "Following" : "Follow";

  // TODO: Some refactor required to message entities
  const entityProfileButtons = (
    <>
      <DarbeButton
        isDisabled={hasSentRequest || isFollowing}
        darbeButtonType="friendRequestButton"
        buttonText={followTextToShow}
        onClick={handleFollow}
      />
      {!isFollowing}
      {/* <DarbeButton
        darbeButtonType="messageFriendButton"
        buttonText="Message"
        onClick={handleMessage}
      /> */}
    </>
  );

  const userProfileButtons = (
    <>
      {isFriend && (
        <DarbeButton
          darbeButtonType="messageFriendButton"
          buttonText="Message"
          onClick={handleMessage}
        />
      )}
      {!isFriend && hasReceivedRequestFromUser && !isFriend && (
        <DarbeButton
          darbeButtonType="friendRequestButton"
          buttonText="Accept Request"
          onClick={() => handleAcceptConnection(userId)}
        />
      )}
      {!isFriend && !hasReceivedRequestFromUser && !isFriend && (
        <DarbeButton
          isDisabled={hasSentRequest}
          darbeButtonType="friendRequestButton"
          buttonText={friendtTextToShow}
          onClick={handleConnect}
        />
      )}
    </>
  );

  const buttonsToRender = isEntityProfile
    ? entityProfileButtons
    : userProfileButtons;

  return (
    <div className={styles.userConnectionButtons}>
      {isMobile && <>{buttonsToRender}</>}
      {!isMobile && <>{buttonsToRender}</>}
    </div>
  );
};
