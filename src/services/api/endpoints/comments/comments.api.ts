import { darbeBaseApi } from "../darbe.api";
import {
  CommentResponse,
  NewCommentBody,
  NewReplyBody,
} from "../types/comments.api.types";
import {
  deleteComment,
  deleteReply,
  getCommentReplies,
  getPostComments,
  submitComment,
  submitReply,
  toggleCommentLike,
} from "../../../darbeService";

const commentsApi = darbeBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPostComments: builder.query<CommentResponse[], string>({
      async queryFn(postId) {
        try {
          const data = await getPostComments(postId);
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
      providesTags: ["Comments", "Posts"],
    }),
    submitCommentLike: builder.mutation<void, string>({
      async queryFn(commentId) {
        try {
          await toggleCommentLike(commentId);
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
      invalidatesTags: ["Comments"],
    }),
    submitComment: builder.mutation<CommentResponse, NewCommentBody>({
      async queryFn(newComment) {
        try {
          const data = await submitComment({
            postId: newComment.postId,
            commentText: newComment.commentText,
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
      invalidatesTags: ["Comments", "Posts"],
    }),
    getCommentReplies: builder.query<CommentResponse[], string>({
      async queryFn(commentId) {
        try {
          const data = await getCommentReplies(commentId);
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
      providesTags: ["Comments"],
    }),
    submitReply: builder.mutation<CommentResponse, NewReplyBody>({
      async queryFn(newComment) {
        try {
          const data = await submitReply({
            commentId: newComment.commentId,
            commentText: newComment.commentText,
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
      invalidatesTags: ["Comments"],
    }),
    deleteComment: builder.mutation<void, string>({
      async queryFn(commentId) {
        try {
          await deleteComment(commentId);
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
      invalidatesTags: ["Comments", "UserActivity"],
    }),
    deleteReply: builder.mutation<void, string>({
      async queryFn(replyId) {
        try {
          await deleteReply(replyId);
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
      invalidatesTags: ["Comments", "UserActivity"],
    }),
  }),
});

export const {
  useGetPostCommentsQuery,
  useSubmitCommentLikeMutation,
  useSubmitCommentMutation,
  useGetCommentRepliesQuery,
  useSubmitReplyMutation,
  useDeleteCommentMutation,
  useDeleteReplyMutation,
} = commentsApi;
