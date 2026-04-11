import {  AddCircleTwoTone, RefreshTwoTone } from "@mui/icons-material";
import { Card, CardContent, CardHeader } from "@mui/material";

import { SuggestedFriendState } from "../../features/friends/types";
import { useSendFriendRequestMutation } from "../../services/api/endpoints/friends/friends.api";
import { UserAvatars } from "../avatars/UserAvatars";
import { Typography } from "../typography/Typography";

import styles from "./styles/friendSuggestions.module.css";
import { useCallback, useMemo, useRef, useState } from "react";

export interface DesktopFriendSuggestionsProps {
  suggestedFriends?: SuggestedFriendState[];
  handleFriendSuggestionRefresh: (newIdsToFilterOn: string[]) => void
}

const FriendSuggestion = ({ 
  suggestedFriend, 
  handleSendFriendRequest,
  isRequesting,
}: { 
  suggestedFriend: SuggestedFriendState,  
  handleSendFriendRequest: (suggestedFriendId: string) => Promise<void> 
  isRequesting: boolean;
}) => {

  const nameToUse =
    suggestedFriend.fullName?.length > 0
      ? suggestedFriend.fullName
      : suggestedFriend.firstName;
  return (
    <div className={styles.suggestedFriendCard} >
      <div>
        <UserAvatars
          key={suggestedFriend.id}
          profilePicture={suggestedFriend.profilePicture}
          fullName={nameToUse}
          city={suggestedFriend.city}
          zip={suggestedFriend.zip}
        />
      </div>
      <div
        onClick={() => {
          if (isRequesting) return;
          handleSendFriendRequest(suggestedFriend.id);
        }}
        aria-disabled={isRequesting}
        className={styles.addFriendCardAddIcon}
        style={isRequesting ? { opacity: 0.5, pointerEvents: "none" } : undefined}
      >
        <AddCircleTwoTone 
          htmlColor="#1976d2"
        />
      </div>
    </div>
  )
}

export const DesktopFriendSuggestions = ({
  suggestedFriends,
  handleFriendSuggestionRefresh
}: DesktopFriendSuggestionsProps) => {


  const [sendFriendRequest] = useSendFriendRequestMutation();
  const [requestingIds, setRequestingIds] = useState<Record<string, boolean>>(
    {}
  );
  const requestLocksRef = useRef(new Set<string>());

  const handleSendFriendRequest = useCallback(
    async (suggestedFriendId: string) => {
      if (requestLocksRef.current.has(suggestedFriendId)) return;

      requestLocksRef.current.add(suggestedFriendId);
      setRequestingIds((prev) => ({ ...prev, [suggestedFriendId]: true }));

      try {
        await sendFriendRequest(suggestedFriendId).unwrap();
      } catch (error) {
        requestLocksRef.current.delete(suggestedFriendId);
        setRequestingIds((prev) => ({ ...prev, [suggestedFriendId]: false }));
        console.error(error, "Error sending friend request");
      }
    },
    [sendFriendRequest]
  );

  
  const showSuggestedFriends = useMemo(() => {
    return suggestedFriends && suggestedFriends?.length > 0
  }, [suggestedFriends])

  const suggestions = useMemo(() => {
    if (!suggestedFriends) return []
    return suggestedFriends.slice(0,20)
  }, [suggestedFriends])

  return (
    <Card>
      <CardHeader className={styles.friendSuggestionCardHeader} title={
        <div style={{
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div>
            Friend Suggestions
          </div>
          <div className={styles.refreshTwoTone}>
            <RefreshTwoTone className={styles.refreshTwoTone} onClick={() => {
              if (!suggestions) return 
              handleFriendSuggestionRefresh(suggestions.map(el => el.id))
            }}/>
          </div>
        </div>
      }/>
      <CardContent className={styles.friendSuggestionsCard} >
        {showSuggestedFriends ? (
          <>
            {suggestions.map((suggestedFriend, index) => {
              const isRequesting = !!requestingIds[suggestedFriend.id];
              return (
                  <FriendSuggestion 
                    key={`${suggestedFriend.id}_${index}`}
                    suggestedFriend={suggestedFriend}
                    handleSendFriendRequest={handleSendFriendRequest}
                    isRequesting={isRequesting}
                  />
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
      </CardContent>
    </Card>
  );
};
