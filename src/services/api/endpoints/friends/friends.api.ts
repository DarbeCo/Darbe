import {
  FriendRequestState,
  OrgJoinRequestState,
  PendingFriendRequestState,
  ProfileFollowState,
  ProfileFriendState,
  SuggestedFriendState,
} from "../../../../features/friends/types";
import { darbeBaseApi } from "../darbe.api";
import {
  acceptFriendRequest,
  acceptOrgJoinRequest,
  deleteFriend,
  deleteFriendRequest,
  denyOrgJoinRequest,
  denyFriendRequest,
  followEntity,
  getFriendRequests,
  getFriends,
  getMutualFriends,
  getOrgJoinRequests,
  getOrgJoinRequestStatus,
  getSentFriendRequests,
  getSuggestedFriends,
  getUserFollowers,
  sendFriendRequest,
  sendOrgJoinRequest,
} from "../../../darbeService";

const friendsApi = darbeBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFriendRequests: builder.query<FriendRequestState[], void>({
      async queryFn() {
        try {
          const data = await getFriendRequests();
          return { data };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      providesTags: ["FriendRequests"],
      keepUnusedDataFor: 5,
    }),
    getFriends: builder.query<ProfileFriendState[], string>({
      async queryFn(userId) {
        try {
          const data = await getFriends(userId);
          return { data };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      providesTags: ["Friends"],
      keepUnusedDataFor: 5,
    }),
    getSentFriendRequests: builder.query<PendingFriendRequestState[], void>({
      async queryFn() {
        try {
          const data = await getSentFriendRequests();
          return { data };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      providesTags: ["FriendRequests"],
      keepUnusedDataFor: 10,
    }),
    getOrgJoinRequests: builder.query<OrgJoinRequestState[], void>({
      async queryFn() {
        try {
          const data = await getOrgJoinRequests();
          return { data };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      providesTags: ["FriendRequests", "Notifications"],
      keepUnusedDataFor: 5,
    }),
    sendFriendRequest: builder.mutation<void, string>({
      async queryFn(userId) {
        try {
          await sendFriendRequest(userId);
          return { data: undefined };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      invalidatesTags: ["Profiles", "FriendRequests", "Friends", "SuggestedFriends"],
    }),
    deleteFriendRequest: builder.mutation<void, string>({
      async queryFn(userId) {
        try {
          await deleteFriendRequest(userId);
          return { data: undefined };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      invalidatesTags: ["FriendRequests", "Notifications", "NotificationCount"],
    }),
    deleteFriend: builder.mutation<void, string>({
      async queryFn(userId) {
        try {
          await deleteFriend(userId);
          return { data: undefined };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      invalidatesTags: [
        "Friends",
        "FriendRequests",
        "Feed",
        "Profile",
        "Notifications",
        "NotificationCount",
      ],
    }),
    acceptFriendRequest: builder.mutation<void, string>({
      async queryFn(userId) {
        try {
          await acceptFriendRequest(userId);
          return { data: undefined };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      invalidatesTags: ["Friends", "FriendRequests", "Feed", "Profile"],
    }),
    denyFriendRequest: builder.mutation<void, string>({
      async queryFn(userId) {
        try {
          await denyFriendRequest(userId);
          return { data: undefined };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      invalidatesTags: [
        "Friends",
        "FriendRequests",
        "Feed",
        "Notifications",
        "NotificationCount",
      ],
    }),
    followEntity: builder.mutation<void, string>({
      async queryFn(userId) {
        try {
          await followEntity(userId);
          return { data: undefined };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      invalidatesTags: ["Profiles", "Followers", "Friends", "FriendRequests", "Profile"],
    }),
    sendOrgJoinRequest: builder.mutation<void, string>({
      async queryFn(entityId) {
        try {
          await sendOrgJoinRequest(entityId);
          return { data: undefined };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      invalidatesTags: ["FriendRequests", "Notifications", "NotificationCount"],
    }),
    getOrgJoinRequestStatus: builder.query<
      "none" | "pending" | "approved" | "denied",
      string
    >({
      async queryFn(entityId) {
        try {
          const data = await getOrgJoinRequestStatus(entityId);
          return { data };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      providesTags: ["FriendRequests", "Roster", "RosterMembers"],
    }),
    acceptOrgJoinRequest: builder.mutation<void, string>({
      async queryFn(requestId) {
        try {
          await acceptOrgJoinRequest(requestId);
          return { data: undefined };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      invalidatesTags: ["Roster", "RosterMembers", "FriendRequests", "Notifications", "NotificationCount", "Profile"],
    }),
    denyOrgJoinRequest: builder.mutation<void, string>({
      async queryFn(requestId) {
        try {
          await denyOrgJoinRequest(requestId);
          return { data: undefined };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      invalidatesTags: ["FriendRequests", "Notifications", "NotificationCount"],
    }),
    getUserFollowers: builder.query<ProfileFollowState[], string>({
      async queryFn(userId) {
        try {
          const data = await getUserFollowers(userId);
          return { data };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      providesTags: ["Followers"],
    }),
    getMutualFriends: builder.query<ProfileFriendState[], string>({
      async queryFn(userId) {
        try {
          const data = await getMutualFriends(userId);
          return { data };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      keepUnusedDataFor: 1
    }),
    getSuggestedFriends: builder.query<SuggestedFriendState[], { filterIds?: string[] } | void>({
      async queryFn(args) {
        try {
          const data = await getSuggestedFriends(args?.filterIds);
          return { data };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      providesTags: ["SuggestedFriends"],
      keepUnusedDataFor: 60,
    }),
  }),
});

export const {
  useGetFriendRequestsQuery,
  useGetFriendsQuery,
  useLazyGetFriendsQuery,
  useSendFriendRequestMutation,
  useDeleteFriendRequestMutation,
  useDeleteFriendMutation,
  useAcceptFriendRequestMutation,
  useGetSentFriendRequestsQuery,
  useGetOrgJoinRequestsQuery,
  useFollowEntityMutation,
  useSendOrgJoinRequestMutation,
  useGetOrgJoinRequestStatusQuery,
  useAcceptOrgJoinRequestMutation,
  useDenyOrgJoinRequestMutation,
  useGetUserFollowersQuery,
  useLazyGetUserFollowersQuery,
  useGetMutualFriendsQuery,
  useGetSuggestedFriendsQuery,
  useLazyGetSuggestedFriendsQuery
} = friendsApi;
