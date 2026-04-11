import { useCallback, useMemo, useState } from "react";
import {
  useGetFriendRequestsQuery,
  useGetSentFriendRequestsQuery,
  useGetSuggestedFriendsQuery,
} from "../../services/api/endpoints/friends/friends.api";
import useScreenWidthHook from "../../utils/commonHooks/UseScreenWidth";
import { DesktopFriendSuggestions } from "./DesktopFriendSuggestions";
import { MobileFriendSuggestions } from "./MobileFriendSuggestions";

export const FriendSuggestions = () => {
  const { isDesktop } = useScreenWidthHook();

  const [filterIds, setFilterIds] = useState<string[]>([]);

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

  const { data: suggestedFriends } = useGetSuggestedFriendsQuery({
    filterIds: combinedFilterIds,
  });

  const filteredSuggestedFriends = useMemo(() => {
    if (!suggestedFriends) return suggestedFriends;
    return suggestedFriends.filter(
      (suggestedFriend) => !pendingRequestIdSet.has(suggestedFriend.id)
    );
  }, [pendingRequestIdSet, suggestedFriends]);

  const handleFriendSuggestionRefresh = useCallback(
    (newIdsToFilterOn: string[]) => {
      setFilterIds((prev) => [...prev, ...newIdsToFilterOn]);
    },
    []
  );


  // TODO: Combine these, pretty much copy past unless we have some wild changes
  return (
    <>
      {isDesktop && (
        <DesktopFriendSuggestions
          suggestedFriends={filteredSuggestedFriends}
          handleFriendSuggestionRefresh={handleFriendSuggestionRefresh}
        />
      )}
      {!isDesktop && (
        <MobileFriendSuggestions suggestedFriends={filteredSuggestedFriends} />
      )}
    </>
  );
};
