import { IconButton } from "@mui/material";

import { DarbeAvatar } from "../../../../components/avatars/DarbeAvatar";
import { CustomSvgs } from "../../../../components/customSvgs/CustomSvgs";
import { Typography } from "../../../../components/typography/Typography";
import { EditFriendRequests } from "./EditFriendRequests";
import { useAppDispatch, useAppSelector } from "../../../../services/hooks";
import { selectUserProfileInformation } from "../../selectors";
import { useDeleteFriendMutation } from "../../../../services/api/endpoints/friends/friends.api";
import { removeFriend } from "../../userSlice";
import { DarbeComms } from "../../../../components/darbeComms/DarbeComms";

import styles from "../styles/profileEdit.module.css";

export const EditFriends = () => {
  const dispatch = useAppDispatch();
  const userProfile = useAppSelector((state) =>
    selectUserProfileInformation(state)
  );

  const friends = userProfile?.friends ?? [];
  const [deleteFriend, { isSuccess, isError }] = useDeleteFriendMutation();

  const handleFriendRemoval = async (friendId: string) => {
    try {
      await deleteFriend(friendId).unwrap();
      dispatch(removeFriend(friendId));
    } catch (error) {
      console.error("Error removing friend", error);
    }
  };

  return (
    <div className={styles.profileEditContentFriends}>
      {friends?.map((friend) => (
        <div key={friend.id} className={styles.simpleFriendCard}>
          <DarbeAvatar
            showUserName
            overrideUserName={friend.fullName}
            overrideUser={friend.id}
            overrideProfilePicture={friend.profilePicture}
          />
          <IconButton onClick={() => handleFriendRemoval(friend.id)}>
            <CustomSvgs
              svgPath="/svgs/common/removeItemIcon.svg"
              altText="Remove friend"
            />
          </IconButton>
        </div>
      ))}
      {!friends.length && (
        <Typography
          variant="sectionTitle"
          textToDisplay={`No friends found!`}
        />
      )}
      {isError ||
        (isSuccess && (
          <DarbeComms
            isError={isError}
            isSuccess={isSuccess}
            contentType="friend"
          />
        ))}
      <EditFriendRequests />
    </div>
  );
};
