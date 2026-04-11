import { useCallback, useState } from "react";
import { useGetSuggestedFriendsQuery } from "../../services/api/endpoints/friends/friends.api";
import useScreenWidthHook from "../../utils/commonHooks/UseScreenWidth";
import { DesktopFriendSuggestions } from "./DesktopFriendSuggestions";
import { MobileFriendSuggestions } from "./MobileFriendSuggestions";

export const FriendSuggestions = () => {
  const { isDesktop } = useScreenWidthHook();

  const [filterIds, setFilterIds] = useState<string[]>([])
  
  const { data: suggestedFriends } = useGetSuggestedFriendsQuery({
    filterIds
  });

  const handleFriendSuggestionRefresh = useCallback((newIdsToFilterOn: string[]) => {
    setFilterIds((prev) => [...prev, ...newIdsToFilterOn] )
  }, [])


  // TODO: Combine these, pretty much copy past unless we have some wild changes
  return (
    <>
      {isDesktop && (
        <DesktopFriendSuggestions suggestedFriends={suggestedFriends} handleFriendSuggestionRefresh={handleFriendSuggestionRefresh}/>
      )}
      {!isDesktop && (
        <MobileFriendSuggestions suggestedFriends={suggestedFriends} />
      )}
    </>
  );
};
