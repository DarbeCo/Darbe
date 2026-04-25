import { darbeBaseApi } from "../darbe.api";
import {
  CreateEvent,
  EventsState,
  ShortEventState,
  SimpleEventState,
  UserEventSignups,
  VolunteerMatch,
} from "../types/events.api.types";
import {
  createEvent,
  deleteEvent,
  getEventDetails,
  getEvents,
  getSignedUpEvents,
  getVolunteerMatches,
  passOnEvent,
  unvolunteerFromEvent,
  volunteerForEvent,
} from "../../../darbeService";

const eventsApi = darbeBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEvents: builder.query<ShortEventState[], void>({
      async queryFn() {
        try {
          const data = await getEvents();
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
      providesTags: ["Events"],
      keepUnusedDataFor: 10,
    }),
    getEventDetails: builder.query<EventsState, string>({
      async queryFn(eventId) {
        try {
          const data = await getEventDetails(eventId);
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
      providesTags: ["Events"],
    }),
    createEvent: builder.mutation<SimpleEventState, CreateEvent>({
      async queryFn(newEvent) {
        try {
          const data = await createEvent(newEvent);
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
      invalidatesTags: ["Events"],
    }),
    deleteEvent: builder.mutation<void, string>({
      async queryFn(eventId) {
        try {
          await deleteEvent(eventId);
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
      invalidatesTags: ["Events"],
    }),
    volunteerForEvent: builder.mutation<void, string>({
      async queryFn(eventId) {
        try {
          await volunteerForEvent(eventId);
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
      invalidatesTags: ["Events"],
    }),
    passOnEvent: builder.mutation<void, string>({
      async queryFn(eventId) {
        try {
          await passOnEvent(eventId);
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
      invalidatesTags: ["Events"],
    }),
    unvolunteerFromEvent: builder.mutation<void, string>({
      async queryFn(eventId) {
        try {
          await unvolunteerFromEvent(eventId);
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
      invalidatesTags: ["Events"],
    }),
    // Accept an optional filter argument to request upcoming or past signups
    getSignedUpEvents: builder.query<
      UserEventSignups[],
      { when: "upcoming" | "past" | undefined }
    >({
      async queryFn(arg) {
        try {
          const data = await getSignedUpEvents(arg.when);
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
      providesTags: ["Events"],
      keepUnusedDataFor: 10,
    }),
    getVolunteerMatches: builder.query<VolunteerMatch[], void>({
      async queryFn() {
        try {
          const data = await getVolunteerMatches();
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
      providesTags: ["VolunteerMatches"],
      keepUnusedDataFor: 10,
    }),
  }),
});

export const {
  useGetEventsQuery,
  useGetEventDetailsQuery,
  useCreateEventMutation,
  useDeleteEventMutation,
  useVolunteerForEventMutation,
  usePassOnEventMutation,
  useUnvolunteerFromEventMutation,
  useGetSignedUpEventsQuery,
  useGetVolunteerMatchesQuery,
} = eventsApi;
