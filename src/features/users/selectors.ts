import { RootState } from "../../services/store";

export const selectUser = (state: RootState) => state.users;
export const selectUserType = (state: RootState) => state.users.user?.userType;
export const selectUserProfileInformation = (state: RootState) =>
  state.users.userProfile;
export const selectSentFriendRequests = (state: RootState) =>
  state.users.sentFriendRequests;
export const selectReceivedFriendRequests = (state: RootState) =>
  state.users.receivedFriendRequests;
export const selectQualifications = (state: RootState) => {
  const licenses = state.users.userProfile?.licenses;
  const skills = state.users.userProfile?.skills;

  return {
    licenses,
    skills,
  };
};

export const selectCurrentUserId = (state: RootState) => {
  const user = state.users;

  if (!user.user) {
    return "";
  }

  return user.user.id;
};

export const selectCurrentUserProfilePicture = (state: RootState) => {
  const user = state.users;

  if (!user.user) {
    return "";
  }

  return user.user.profilePicture;
};

export const selectCurrentUserCauses = (state: RootState) => {
  const user = state.users;

  if (!user.user?.causes?.length) {
    return [];
  }

  return user.user.causes;
}

export const selectCurrentFriends = (state: RootState) => {
  const userProfile = state.users.userProfile;

  if (!userProfile) {
    return [];
  }

  return userProfile.friends;
};

export const selectUserOrganizations = (state: RootState) => {
  const organizations = state.users.userProfile?.organizations;

  return organizations;
}
