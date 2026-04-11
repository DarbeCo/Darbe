import { Notification } from "../../../../components/notification/types";
import { darbeBaseApi } from "../darbe.api";
import {
  getNotificationCount,
  getNotifications,
  markNotificationsRead,
} from "../../../darbeService";

const notificationsApi = darbeBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<Notification[], void>({
      async queryFn() {
        try {
          const data = await getNotifications();
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
    }),
    getNotificationCount: builder.query<number, void>({
      async queryFn() {
        try {
          const data = await getNotificationCount();
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
      providesTags: ["NotificationCount"],
    }),
    markNotificationsRead: builder.mutation<void, void>({
      async queryFn() {
        try {
          await markNotificationsRead();
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
      invalidatesTags: ['NotificationCount'],
    })
  }),
});

export const {
  useGetNotificationsQuery,
  useGetNotificationCountQuery,
  useMarkNotificationsReadMutation
 } = notificationsApi;
