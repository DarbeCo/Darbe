import { AddCircleTwoTone } from "@mui/icons-material";
import { Avatar, CircularProgress } from "@mui/material";
import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { SuggestedFriendState } from "../../features/friends/types";
import { PROFILE_ROUTE } from "../../routes/route.constants";
import {
  useGetFriendRequestsQuery,
  useGetSentFriendRequestsQuery,
  useGetSuggestedFriendsQuery,
  useSendFriendRequestMutation,
} from "../../services/api/endpoints/friends/friends.api";

import styles from "./styles/friendSuggestions.module.css";

const VISIBLE_SUGGESTIONS_COUNT = 4;

const getSuggestionName = (suggestedFriend: SuggestedFriendState) =>
  suggestedFriend.fullName?.length > 0
    ? suggestedFriend.fullName
    : suggestedFriend.firstName;

export const FriendSuggestionsDialog = () => {
  const navigate = useNavigate();
  const [filterIds, setFilterIds] = useState<string[]>([]);
  const [requestingIds, setRequestingIds] = useState<Record<string, boolean>>(
    {}
  );
  const requestLocksRef = useRef(new Set<string>());
  const [sendFriendRequest] = useSendFriendRequestMutation();
  const { data: friendRequests = [] } = useGetFriendRequestsQuery();
  const { data: pendingRequests = [] } = useGetSentFriendRequestsQuery();

  const pendingRequestIds = useMemo(() => {
    const ids = new Set<string>();
    friendRequests.forEach((request) => {
      if (request.requesterId?.id) ids.add(request.requesterId.id);
    });
    pendingRequests.forEach((request) => {
      if (request.receiverId?.id) ids.add(request.receiverId.id);
    });
    return Array.from(ids).sort();
  }, [friendRequests, pendingRequests]);

  const combinedFilterIds = useMemo(() => {
    const ids = new Set<string>();
    filterIds.forEach((id) => ids.add(id));
    pendingRequestIds.forEach((id) => ids.add(id));
    return Array.from(ids);
  }, [filterIds, pendingRequestIds]);

  const pendingRequestIdSet = useMemo(
    () => new Set(pendingRequestIds),
    [pendingRequestIds]
  );

  const { data: suggestedFriends, isLoading } = useGetSuggestedFriendsQuery({
    filterIds: combinedFilterIds,
  });

  const filteredSuggestedFriends = useMemo(() => {
    if (!suggestedFriends) return [];
    return suggestedFriends.filter(
      (suggestedFriend) => !pendingRequestIdSet.has(suggestedFriend.id)
    );
  }, [pendingRequestIdSet, suggestedFriends]);

  const visibleSuggestions = filteredSuggestedFriends.slice(
    0,
    VISIBLE_SUGGESTIONS_COUNT
  );

  const handleSendFriendRequest = useCallback(
    async (suggestedFriendId: string) => {
      if (requestLocksRef.current.has(suggestedFriendId)) return;

      requestLocksRef.current.add(suggestedFriendId);
      setRequestingIds((prev) => ({ ...prev, [suggestedFriendId]: true }));

      try {
        await sendFriendRequest(suggestedFriendId).unwrap();
        setFilterIds((prev) => [...prev, suggestedFriendId]);
      } catch (error) {
        requestLocksRef.current.delete(suggestedFriendId);
        setRequestingIds((prev) => ({ ...prev, [suggestedFriendId]: false }));
        console.error(error, "Error sending friend request");
      }
    },
    [sendFriendRequest]
  );

  const handleShowMore = () => {
    setFilterIds((prev) => [
      ...prev,
      ...visibleSuggestions.map((suggestion) => suggestion.id),
    ]);
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
          {filteredSuggestedFriends.length > VISIBLE_SUGGESTIONS_COUNT && (
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
