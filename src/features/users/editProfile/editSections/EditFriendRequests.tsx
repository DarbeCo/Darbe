import { IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { CustomSvgs } from "../../../../components/customSvgs/CustomSvgs";
import { Typography } from "../../../../components/typography/Typography";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { selectReceivedFriendRequests } from "../../selectors";
import { removeReceivedFriendRequest } from "../../userSlice";
import {
  useAcceptFriendRequestMutation,
  useDeleteFriendRequestMutation,
} from "../../../../services/api/endpoints/friends/friends.api";
import { DarbeComms } from "../../../../components/darbeComms/DarbeComms";
import { UserAvatars } from "../../../../components/avatars/UserAvatars";
import { PROFILE_ROUTE } from "../../../../routes/route.constants";

import styles from "../styles/profileEdit.module.css";

export const EditFriendRequests = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const friendRequests = useAppSelector(selectReceivedFriendRequests);
  const [deleteFriendRequest, { isError, isSuccess }] =
    useDeleteFriendRequestMutation();
  const [
    acceptFriendRequest,
    { isError: acceptError, isSuccess: acceptSuccess },
  ] = useAcceptFriendRequestMutation();

  const handleApproveFriendRequest = async (friendId: string) => {
    try {
      await acceptFriendRequest(friendId).unwrap();
      dispatch(removeReceivedFriendRequest(friendId));
    } catch (error) {
      console.error("Error accepting friend request", error);
    }
  };

  const handleDenyFriendRequest = async (friendId: string) => {
    try {
      await deleteFriendRequest(friendId).unwrap();
      dispatch(removeReceivedFriendRequest(friendId));
    } catch (error) {
      console.error("Error removing friend request", error);
    }
  };

  const errorTriggred = isError || acceptError;
  const isSuccesful = isSuccess || acceptSuccess;

  const handleClick = (userId: string) => {
    navigate(`${PROFILE_ROUTE}/${userId}`);
  };

  return (
    <div className={styles.profileEditContentFriends}>
      {errorTriggred ||
        (isSuccesful && (
          <DarbeComms
            isError={errorTriggred}
            isSuccess={isSuccesful}
            contentType="friendRequest"
          />
        ))}
      {!!friendRequests?.length && (
        <>
          <Typography
            variant="sectionTitle"
            textToDisplay={`Friend Requests`}
          />
        </>
      )}
      {friendRequests?.map((friendRequest) => (
        <div
          key={friendRequest.requesterId?.id}
          className={styles.simpleFriendCard}
        >
          <UserAvatars
            onClick={() => handleClick(friendRequest.requesterId.id)}
            userId={friendRequest.requesterId?.id}
            fullName={friendRequest.requesterId?.fullName}
            profilePicture={friendRequest.requesterId?.profilePicture}
          />
          <div className={styles.approveDenyButtons}>
            <IconButton
              onClick={() =>
                handleDenyFriendRequest(friendRequest.requesterId.id)
              }
            >
              <CustomSvgs
                svgPath="/svgs/common/removeItemIcon.svg"
                altText="Remove friendRequest"
              />
            </IconButton>
            <IconButton
              onClick={() =>
                handleApproveFriendRequest(friendRequest.requesterId?.id)
              }
            >
              <CustomSvgs
                svgPath="/svgs/common/addFriendIcon.svg"
                altText="Approve friendRequest"
              />
            </IconButton>
          </div>
        </div>
      ))}
      {!friendRequests?.length && (
        <Typography
          variant="sectionTitle"
          textToDisplay={`No friend requests found!`}
        />
      )}
    </div>
  );
};
