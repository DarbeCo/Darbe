import { useNavigate } from "react-router";
import { DarbeButton } from "../../../../components/buttons/DarbeButton";
import {
  useAcceptFriendRequestMutation,
  useFollowEntityMutation,
  useGetOrgJoinRequestStatusQuery,
  useSendOrgJoinRequestMutation,
  useSendFriendRequestMutation,
} from "../../../../services/api/endpoints/friends/friends.api";
import useScreenWidthHook from "../../../../utils/commonHooks/UseScreenWidth";
import { MESSAGING_ROUTE } from "../../../../routes/route.constants";

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
  const [sendOrgJoinRequest, { isLoading: isSendingJoinRequest }] =
    useSendOrgJoinRequestMutation();
  const { data: orgJoinRequestStatus = "none" } =
    useGetOrgJoinRequestStatusQuery(userId, { skip: !isEntityProfile });
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

  const handleJoin = async () => {
    await sendOrgJoinRequest(userId).unwrap();
  };

  const handleMessage = () => {
    navigate(`${MESSAGING_ROUTE}/${userId}`);
  };

  const friendtTextToShow = hasSentRequest ? "Pending" : "Connect";
  const followTextToShow = isFollowing ? "Following" : "Follow";
  const isJoinPending =
    isSendingJoinRequest || orgJoinRequestStatus === "pending";
  const isJoined = orgJoinRequestStatus === "approved";
  const joinTextToShow = isJoined
    ? "Joined"
    : isJoinPending
      ? "Pending"
      : "Join";

  const entityProfileButtons = (
    <>
      <DarbeButton
        isDisabled={isJoinPending || isJoined}
        darbeButtonType="messageFriendButton"
        buttonText={joinTextToShow}
        onClick={handleJoin}
      />
      <DarbeButton
        isDisabled={hasSentRequest || isFollowing}
        darbeButtonType="friendRequestButton"
        buttonText={followTextToShow}
        onClick={handleFollow}
      />
      <DarbeButton
        darbeButtonType="messageFriendButton"
        buttonText="Message"
        onClick={handleMessage}
      />
    </>
  );

  const userProfileButtons = (
    <>
      <DarbeButton
        darbeButtonType="messageFriendButton"
        buttonText="Message"
        onClick={handleMessage}
      />
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
