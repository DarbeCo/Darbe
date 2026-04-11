import {  AddCircleTwoTone, RefreshTwoTone } from "@mui/icons-material";
import { Card, CardContent, CardHeader } from "@mui/material";

import { SuggestedFriendState } from "../../features/friends/types";
import { useSendFriendRequestMutation } from "../../services/api/endpoints/friends/friends.api";
import { UserAvatars } from "../avatars/UserAvatars";
import { Typography } from "../typography/Typography";

import styles from "./styles/friendSuggestions.module.css";
import { useCallback, useMemo } from "react";

export interface DesktopFriendSuggestionsProps {
  suggestedFriends?: SuggestedFriendState[];
  handleFriendSuggestionRefresh: (newIdsToFilterOn: string[]) => void
}

const FriendSuggestion = ({ 
  suggestedFriend, 
   handleSendFriendRequest
}: { 
  suggestedFriend: SuggestedFriendState,  
  handleSendFriendRequest: (suggestedFriendId: string) => Promise<void> 
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
        onClick={() =>
          handleSendFriendRequest(suggestedFriend.id) 
        }
        className={styles.addFriendCardAddIcon}
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

  const handleSendFriendRequest = useCallback(async (suggestedFriendId: string) => {
    await sendFriendRequest(suggestedFriendId);
  }, []);

  
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
              return (
                  <FriendSuggestion 
                    key={`${suggestedFriend.id}_${index}`}
                    suggestedFriend={suggestedFriend}
                    handleSendFriendRequest={handleSendFriendRequest}
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
