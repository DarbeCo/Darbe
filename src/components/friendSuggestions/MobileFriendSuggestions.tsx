import { IconButton } from "@mui/material";
import { Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import { useSendFriendRequestMutation } from "../../services/api/endpoints/friends/friends.api";
import { SuggestedFriendState } from "../../features/friends/types";
import { UserAvatars } from "../avatars/UserAvatars";
import { Typography } from "../typography/Typography";
import { PROFILE_ROUTE } from "../../routes/route.constants";

import styles from "./styles/friendSuggestions.module.css";

interface MobileFriendSuggestionsProps {
  suggestedFriends?: SuggestedFriendState[];
}

export const MobileFriendSuggestions = ({
  suggestedFriends,
}: MobileFriendSuggestionsProps) => {
  const showSuggestedFriends = suggestedFriends && suggestedFriends?.length > 0;
  const [sendFriendRequest] = useSendFriendRequestMutation();
  const navigate = useNavigate();

  const handleSendFriendRequest = async (suggestedFriendId: string) => {
    await sendFriendRequest(suggestedFriendId);
  };

  const handleClick = (userId: string) => {
    navigate(`${PROFILE_ROUTE}/${userId}`);
  };

  return (
    <div className={styles.friendSuggestions}>
      <div className={styles.friendSuggestionsHeader}>
        <Typography
          variant="sectionTitle"
          textToDisplay="Friend Suggestions"
          extraClass="paddingLeft"
        />
        {showSuggestedFriends ? (
          <>
            {suggestedFriends.map((suggestedFriend) => {
              const nameToUse =
                suggestedFriend.fullName?.length > 0
                  ? suggestedFriend.fullName
                  : suggestedFriend.firstName;

              return (
                <div className={styles.suggestedFriendCard}>
                  <UserAvatars
                    key={suggestedFriend.id}
                    profilePicture={suggestedFriend.profilePicture}
                    fullName={nameToUse}
                    onClick={() => handleClick(suggestedFriend.id)}
                  />
                  <IconButton
                    onClick={() => handleSendFriendRequest(suggestedFriend.id)}
                  >
                    <Add />
                  </IconButton>
                </div>
              );
            })}
          </>
        ) : (
          <Typography
            variant="informational"
            textToDisplay="No friend suggestions available"
            extraClass="paddingLeft"
          />
        )}
      </div>
    </div>
  );
};
