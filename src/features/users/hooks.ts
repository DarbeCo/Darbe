import { useAppSelector } from "../../services/hooks";
import { selectUserProfileInformation } from "./selectors";

export const useAreWeFriends = (userId: string | undefined) => {
  const profileData = useAppSelector(selectUserProfileInformation);
  console.log("profileData", profileData);
  console.log("userId", userId);
  const areWeFriends = profileData?.friends?.some(
    (friend) => friend.id === userId
  );

  return areWeFriends;
};

export const useAmIFollowing = (userId: string | undefined) => {
  const profileData = useAppSelector(selectUserProfileInformation);
  const amIFollowing = profileData?.following?.some(
    (following) => following.id === userId
  );

  return amIFollowing;
};
