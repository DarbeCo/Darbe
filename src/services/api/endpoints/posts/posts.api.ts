import { NewPostBody } from "../../../../components/createPost/types";
import { darbeBaseApi } from "../darbe.api";
import { PostReponse } from "../types/posts.api.types";
import { deletePost, getPost, getUserPosts, submitPost } from "../../../darbeService";

const postsApi = darbeBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    submitPost: builder.mutation<PostReponse, NewPostBody>({
      async queryFn(newPost) {
        try {
          const data = await submitPost({
            postText: newPost.postText,
            files: newPost.files,
          });
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
      invalidatesTags: ["Posts", "Feed"],
    }),
    getUserPosts: builder.query<PostReponse[], string>({
      async queryFn(userId) {
        try {
          const data = await getUserPosts(userId);
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
      providesTags: ["Posts"],
    }),
    deletePost: builder.mutation<void, string>({
      async queryFn(postId) {
        try {
          await deletePost(postId);
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
      invalidatesTags: ["Posts", "Feed", "UserActivity"],
    }),
    getPost: builder.query<PostReponse, string>({
      async queryFn(postId) {
        try {
          const data = await getPost(postId);
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
      providesTags: ["Posts"],
    }),
  }),
});

export const {
  useSubmitPostMutation,
  useGetUserPostsQuery,
  useDeletePostMutation,
  useGetPostQuery,
} = postsApi;
