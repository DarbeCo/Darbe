import { AddCircleTwoTone } from "@mui/icons-material";
import { Avatar, CircularProgress } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { SuggestedFriendState } from "../../features/friends/types";
import { PROFILE_ROUTE } from "../../routes/route.constants";
import {
  useGetSuggestedFriendsQuery,
  useSendFriendRequestMutation,
} from "../../services/api/endpoints/friends/friends.api";

import styles from "./styles/friendSuggestions.module.css";

const VISIBLE_SUGGESTIONS_COUNT = 4;
const SUGGESTIONS_INCREMENT = 4;

const getSuggestionName = (suggestedFriend: SuggestedFriendState) =>
  suggestedFriend.fullName?.length > 0
    ? suggestedFriend.fullName
    : suggestedFriend.firstName;

export const FriendSuggestionsDialog = () => {
  const navigate = useNavigate();
  const [visibleSuggestions, setVisibleSuggestions] = useState<
    SuggestedFriendState[]
  >([]);
  const [requestingIds, setRequestingIds] = useState<Record<string, boolean>>(
    {}
  );
  const requestLocksRef = useRef(new Set<string>());
  const [sendFriendRequest] = useSendFriendRequestMutation();
  const { data: suggestedFriends, isLoading } = useGetSuggestedFriendsQuery();

  const filteredSuggestedFriends = useMemo(() => {
    if (!suggestedFriends) return [];
    return suggestedFriends
      .sort((firstSuggestion, secondSuggestion) =>
        getSuggestionName(firstSuggestion).localeCompare(
          getSuggestionName(secondSuggestion),
          undefined,
          { sensitivity: "base" }
        )
      );
  }, [suggestedFriends]);

  useEffect(() => {
    setVisibleSuggestions((currentSuggestions) => {
      const availableSuggestionIds = new Set(
        filteredSuggestedFriends.map((suggestedFriend) => suggestedFriend.id)
      );
      const keptSuggestions = currentSuggestions.filter((suggestedFriend) =>
        availableSuggestionIds.has(suggestedFriend.id)
      );

      if (keptSuggestions.length) {
        return keptSuggestions;
      }

      return filteredSuggestedFriends.slice(0, VISIBLE_SUGGESTIONS_COUNT);
    });
  }, [filteredSuggestedFriends]);

  const hasMoreSuggestions = filteredSuggestedFriends.some(
    (suggestedFriend) =>
      !visibleSuggestions.some(
        (visibleSuggestion) => visibleSuggestion.id === suggestedFriend.id
      )
  );

  const handleSendFriendRequest = useCallback(
    async (suggestedFriendId: string) => {
      if (requestLocksRef.current.has(suggestedFriendId)) return;

      requestLocksRef.current.add(suggestedFriendId);
      setRequestingIds((prev) => ({ ...prev, [suggestedFriendId]: true }));

      try {
        await sendFriendRequest(suggestedFriendId).unwrap();
        setVisibleSuggestions((currentSuggestions) =>
          currentSuggestions.filter(
            (suggestedFriend) => suggestedFriend.id !== suggestedFriendId
          )
        );
      } catch (error) {
        requestLocksRef.current.delete(suggestedFriendId);
        setRequestingIds((prev) => ({ ...prev, [suggestedFriendId]: false }));
        console.error(error, "Error sending friend request");
      }
    },
    [sendFriendRequest]
  );

  const handleShowMore = () => {
    setVisibleSuggestions((currentSuggestions) => {
      const visibleSuggestionIds = new Set(
        currentSuggestions.map((suggestedFriend) => suggestedFriend.id)
      );
      const nextSuggestions = filteredSuggestedFriends
        .filter((suggestedFriend) => !visibleSuggestionIds.has(suggestedFriend.id))
        .slice(0, SUGGESTIONS_INCREMENT);

      return [...currentSuggestions, ...nextSuggestions];
    });
  };

  const handleProfileClick = (userId: string) => {
    navigate(`${PROFILE_ROUTE}/${userId}`);
  };

  return (
    <div className={styles.friendSuggestionsDialog}>
      {isLoading && (
        <div className={styles.friendSuggestionsDialogState}>
          <CircularProgress size={24} />
        </div>
      )}
      {!isLoading && visibleSuggestions.length === 0 && (
        <p className={styles.friendSuggestionsDialogEmpty}>
          No friend suggestions available
        </p>
      )}
      {!isLoading && visibleSuggestions.length > 0 && (
        <>
          <div className={styles.friendSuggestionsDialogList}>
            {visibleSuggestions.map((suggestedFriend) => {
              const nameToUse = getSuggestionName(suggestedFriend);
              const isRequesting = !!requestingIds[suggestedFriend.id];

              return (
                <div
                  key={suggestedFriend.id}
                  className={styles.friendSuggestionDialogRow}
                >
                  <button
                    type="button"
                    className={styles.friendSuggestionDialogIdentity}
                    onClick={() => handleProfileClick(suggestedFriend.id)}
                  >
                    <Avatar
                      className={styles.friendSuggestionAvatar}
                      alt={nameToUse}
                      src={suggestedFriend.profilePicture}
                    />
                    <span className={styles.friendSuggestionText}>
                      <span className={styles.friendSuggestionName}>
                        {nameToUse}
                      </span>
                      <span className={styles.friendSuggestionLocation}>
                        {suggestedFriend.city}, {suggestedFriend.zip}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.addFriendCardAddIcon}
                    onClick={() => handleSendFriendRequest(suggestedFriend.id)}
                    disabled={isRequesting}
                    aria-label={`Add ${nameToUse}`}
                  >
                    <AddCircleTwoTone htmlColor="#1976d2" />
                  </button>
                </div>
              );
            })}
          </div>
          {hasMoreSuggestions && (
            <button
              type="button"
              className={styles.friendSuggestionsShowMore}
              onClick={handleShowMore}
            >
              Show more
            </button>
          )}
        </>
      )}
    </div>
  );
};
