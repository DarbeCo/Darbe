import { useGetSuggestedFriendsQuery } from "../../services/api/endpoints/friends/friends.api";
import { useAppSelector } from "../../services/hooks";
import useScreenWidthHook from "../../utils/commonHooks/UseScreenWidth";
import { selectUserType } from "../../features/users/selectors";
import { DesktopFriendSuggestions } from "./DesktopFriendSuggestions";
import { MobileFriendSuggestions } from "./MobileFriendSuggestions";

export const FriendSuggestions = () => {
  const { isDesktop } = useScreenWidthHook();
  const userType = useAppSelector(selectUserType);
  const isIndividual = userType === "individual";

  const { data: suggestedFriends } = useGetSuggestedFriendsQuery(undefined, {
    skip: !isIndividual,
  });

  if (!isIndividual) {
    return null;
  }

  return (
    <>
      {isDesktop ? (
        <DesktopFriendSuggestions
          suggestedFriends={suggestedFriends}
        />
      ) : (
        <MobileFriendSuggestions
          suggestedFriends={suggestedFriends}
        />
      )}
    </>
  );
};
