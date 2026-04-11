import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./authBaseQuery/authBaseQuery.api";

export const darbeBaseApi = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "Users",
    "UserSearch",
    "Profile",
    "Causes",
    "Events",
    "Notifications",
    "Posts",
    "Feed",
    "Comments",
    "Profiles",
    "Friends",
    "FriendRequests",
    "Search",
    "Followers",
    "Messages",
    "Threads",
    "SuggestedFriends",
    "UserActivity",
    "NotificationCount",
    "VolunteerMatches",
    "Roster",
    "RosterMembers",
    "Documents"
  ],
  endpoints: () => ({}),
});
