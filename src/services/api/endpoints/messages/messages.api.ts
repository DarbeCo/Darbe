import { darbeBaseApi } from "../darbe.api";
import {
  GetMessageThreadParams,
  MessageState,
  MessageThreadsState,
  NewMessage,
  SingleMessageThreadState,
} from "../types/messages.api.types";
import {
  createMessage,
  deleteMessagesThread,
  getMessages,
  getMessageThread,
  markMessageAsRead,
} from "../../../darbeService";

const notificationsApi = darbeBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMessages: builder.query<MessageThreadsState[], void>({
      async queryFn() {
        try {
          const data = await getMessages();
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
      providesTags: ["Messages"],
      keepUnusedDataFor: 1
    }),
    createMessage: builder.mutation<MessageState, NewMessage>({
      async queryFn(message) {
        try {
          const data = await createMessage(message);
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
      invalidatesTags: ["Messages", "Threads"],
    }),
    markMessageAsRead: builder.mutation<MessageState, string>({
      async queryFn(messageId) {
        try {
          const data = await markMessageAsRead(messageId);
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
      invalidatesTags: ["Messages"],
    }),
    getMessageThread: builder.query<
      SingleMessageThreadState,
      GetMessageThreadParams
    >({
      async queryFn(params) {
        try {
          const data = await getMessageThread(params);
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
      providesTags: ["Threads"],
    }),
    deleteMessagesThread: builder.mutation<void, string>({
      async queryFn(threadId) {
        try {
          await deleteMessagesThread(threadId);
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
      invalidatesTags: ["Messages", "Threads"],
    }),
  })
});

export const {
  useGetMessagesQuery,
  useCreateMessageMutation,
  useMarkMessageAsReadMutation,
  useGetMessageThreadQuery,
  useDeleteMessagesThreadMutation
} = notificationsApi;
