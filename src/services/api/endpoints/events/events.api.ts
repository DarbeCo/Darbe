import { darbeBaseApi } from "../darbe.api";
import {
  CreateEvent,
  EntityEventCounts,
  EventsState,
  ShortEventState,
  SimpleEventState,
  UserEventSignups,
  VolunteerMatch,
} from "../types/events.api.types";
import {
  addEventVolunteer,
  approveAllEventVolunteers,
  approveEventVolunteer,
  createEvent,
  deleteEvent,
  denyEventVolunteer,
  getEntityEventCounts,
  getEventDetails,
  getEvents,
  getSignedUpEvents,
  getVolunteerMatches,
  checkInForEvent,
  checkOutFromEvent,
  markNoShowForEvent,
  passOnEvent,
  unvolunteerFromEvent,
  updateEventSignupImpactDetails,
  volunteerForEvent,
} from "../../../darbeService";

type EventSignupAction = {
  eventId: string;
  userId?: string;
};

type EventSignupImpactDetails = {
  signupId: string;
  startTime: string;
  endTime: string;
  location: string;
  impact: string;
};

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
    getEntityEventCounts: builder.query<EntityEventCounts, string>({
      async queryFn(entityId) {
        try {
          const data = await getEntityEventCounts(entityId);
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
    checkInForEvent: builder.mutation<void, string | EventSignupAction>({
      async queryFn(action) {
        try {
          await checkInForEvent(action);
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
    checkOutFromEvent: builder.mutation<void, string | EventSignupAction>({
      async queryFn(action) {
        try {
          await checkOutFromEvent(action);
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
    markNoShowForEvent: builder.mutation<void, EventSignupAction>({
      async queryFn(action) {
        try {
          await markNoShowForEvent(action);
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
    addEventVolunteer: builder.mutation<void, EventSignupAction>({
      async queryFn(action) {
        try {
          await addEventVolunteer(action);
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
    approveEventVolunteer: builder.mutation<void, EventSignupAction>({
      async queryFn(action) {
        try {
          await approveEventVolunteer(action);
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
      invalidatesTags: ["Events", "Impact"],
    }),
    denyEventVolunteer: builder.mutation<void, EventSignupAction>({
      async queryFn(action) {
        try {
          await denyEventVolunteer(action);
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
    approveAllEventVolunteers: builder.mutation<void, string>({
      async queryFn(eventId) {
        try {
          await approveAllEventVolunteers(eventId);
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
      invalidatesTags: ["Events", "Impact"],
    }),
    updateEventSignupImpactDetails: builder.mutation<
      void,
      EventSignupImpactDetails
    >({
      async queryFn(details) {
        try {
          await updateEventSignupImpactDetails(details);
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
  useGetEntityEventCountsQuery,
  useAddEventVolunteerMutation,
  useApproveAllEventVolunteersMutation,
  useApproveEventVolunteerMutation,
  useCreateEventMutation,
  useDenyEventVolunteerMutation,
  useDeleteEventMutation,
  useVolunteerForEventMutation,
  usePassOnEventMutation,
  useCheckInForEventMutation,
  useCheckOutFromEventMutation,
  useMarkNoShowForEventMutation,
  useUnvolunteerFromEventMutation,
  useUpdateEventSignupImpactDetailsMutation,
  useGetSignedUpEventsQuery,
  useGetVolunteerMatchesQuery,
} = eventsApi;
