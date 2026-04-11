import {
  FriendRequestState,
  PendingFriendRequestState,
  ProfileFollowState,
  ProfileFriendState,
  SuggestedFriendState,
} from "../../../../features/friends/types";
import { darbeBaseApi } from "../darbe.api";
import {
  acceptFriendRequest,
  deleteFriend,
  deleteFriendRequest,
  denyFriendRequest,
  followEntity,
  getFriendRequests,
  getFriends,
  getMutualFriends,
  getSentFriendRequests,
  getSuggestedFriends,
  getUserFollowers,
  sendFriendRequest,
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
      invalidatesTags: ["FriendRequests"],
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
      invalidatesTags: ["Friends", "FriendRequests", "Feed", "Profile"],
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
      invalidatesTags: ["Friends", "FriendRequests", "Feed"],
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
  useFollowEntityMutation,
  useGetUserFollowersQuery,
  useLazyGetUserFollowersQuery,
  useGetMutualFriendsQuery,
  useGetSuggestedFriendsQuery,
  useLazyGetSuggestedFriendsQuery
} = friendsApi;
