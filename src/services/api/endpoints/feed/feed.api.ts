import { darbeBaseApi } from "../darbe.api";
import { PostReponse } from "../types/posts.api.types";
import { getUserFeed, submitPostLike } from "../../../darbeService";

const feedApi = darbeBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserFeed: builder.query<PostReponse[], void>({
      async queryFn() {
        try {
          const data = await getUserFeed();
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
      providesTags: ["Feed"],
      keepUnusedDataFor: 10,
    }),
    submitLike: builder.mutation<void, string>({
      async queryFn(postId) {
        try {
          await submitPostLike(postId);
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
      invalidatesTags: ["Feed"],
    }),
  }),
});

export const { useGetUserFeedQuery, useSubmitLikeMutation } = feedApi;
