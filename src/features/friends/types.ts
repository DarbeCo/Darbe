export type ProfileFriendState = {
  id: string;
  _id: string;
  fullName: string;
  profilePicture: string;
  firstName: string;
  lastName: string;
  mutualFriends?: string[];
  // Since you can follow entitites
  organizationName?: string;
  nonprofitName?: string;
  zip: string
  city: string
};

export type ProfileFollowState = {
  id: string;
  profilePicture: string;
  nonprofitName?: string;
  organizationName?: string;
};

// TODO: the requesterId is not really descriptive of what this is, fix here and in server
export type FriendRequestState = {
  receiverId: string;
  requestType: string;
  requesterId: ProfileFriendState;
};

export type PendingFriendRequestState = {
  receiverId: ProfileFriendState;
  requestType: string;
  requesterId: ProfileFriendState;
}


export interface SuggestedFriendState  {
  id: string;
  fullName: string;
  profilePicture: string;
  firstName: string;
  lastName: string;
  city: string
  zip: string
}