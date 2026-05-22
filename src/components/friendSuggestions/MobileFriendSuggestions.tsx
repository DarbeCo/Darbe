import { IconButton } from "@mui/material";
import { Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import { useSendFriendRequestMutation } from "../../services/api/endpoints/friends/friends.api";
import { SuggestedFriendState } from "../../features/friends/types";
import { UserAvatars } from "../avatars/UserAvatars";
import { Typography } from "../typography/Typography";
import { PROFILE_ROUTE } from "../../routes/route.constants";
import { useMemo, useRef, useState } from "react";

import styles from "./styles/friendSuggestions.module.css";

interface MobileFriendSuggestionsProps {
  suggestedFriends?: SuggestedFriendState[];
}

const getSuggestionName = (suggestedFriend: SuggestedFriendState) =>
  suggestedFriend.fullName?.length > 0
    ? suggestedFriend.fullName
    : suggestedFriend.firstName;

export const MobileFriendSuggestions = ({
  suggestedFriends,
}: MobileFriendSuggestionsProps) => {
  const showSuggestedFriends = suggestedFriends && suggestedFriends?.length > 0;
  const [sendFriendRequest] = useSendFriendRequestMutation();
  const navigate = useNavigate();
  const [requestingIds, setRequestingIds] = useState<Record<string, boolean>>(
    {}
  );
  const [hiddenSuggestionIds, setHiddenSuggestionIds] = useState<string[]>([]);
  const requestLocksRef = useRef(new Set<string>());
  const sortedSuggestedFriends = useMemo(
    () => {
      const hiddenIds = new Set(hiddenSuggestionIds);
      return [...(suggestedFriends ?? [])]
        .filter((suggestedFriend) => !hiddenIds.has(suggestedFriend.id))
        .sort((firstSuggestion, secondSuggestion) =>
        getSuggestionName(firstSuggestion).localeCompare(
          getSuggestionName(secondSuggestion),
          undefined,
          { sensitivity: "base" }
        )
      );
    },
    [hiddenSuggestionIds, suggestedFriends]
  );

  const handleSendFriendRequest = async (suggestedFriendId: string) => {
    if (requestLocksRef.current.has(suggestedFriendId)) return;

    requestLocksRef.current.add(suggestedFriendId);
    setRequestingIds((prev) => ({ ...prev, [suggestedFriendId]: true }));

    try {
      await sendFriendRequest(suggestedFriendId).unwrap();
      setHiddenSuggestionIds((currentIds) =>
        currentIds.includes(suggestedFriendId)
          ? currentIds
          : [...currentIds, suggestedFriendId]
      );
      setRequestingIds((prev) => ({ ...prev, [suggestedFriendId]: false }));
    } catch (error) {
      requestLocksRef.current.delete(suggestedFriendId);
      setRequestingIds((prev) => ({ ...prev, [suggestedFriendId]: false }));
      console.error(error, "Error sending friend request");
    }
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
            {sortedSuggestedFriends.map((suggestedFriend) => {
              const nameToUse = getSuggestionName(suggestedFriend);

              return (
                <div
                  key={suggestedFriend.id}
                  className={styles.suggestedFriendCard}
                >
                  <UserAvatars
                    profilePicture={suggestedFriend.profilePicture}
                    fullName={nameToUse}
                    onClick={() => handleClick(suggestedFriend.id)}
                  />
                  <IconButton
                    onClick={() => handleSendFriendRequest(suggestedFriend.id)}
                    disabled={!!requestingIds[suggestedFriend.id]}
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
