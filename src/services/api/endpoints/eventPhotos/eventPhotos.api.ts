import { darbeBaseApi } from "../darbe.api";
import {
  canDeleteEventPhotos,
  canUploadEventPhotos,
  deleteEventPhoto,
  getEntityEventPhotoSummaries,
  getEventPhotos,
  getIndividualEventPhotoSummaries,
  uploadEventPhoto,
  type EntityEventPhotoSummary,
  type EventPhoto,
} from "../../../darbeService";

const EventPhotosApi = darbeBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEventPhotos: builder.query<EventPhoto[], string>({
      async queryFn(eventId) {
        try {
          const data = await getEventPhotos(eventId);
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
      providesTags: (_result, _error, eventId) => [
        { type: "EventPhotos" as const, id: eventId },
      ],
    }),
    getEntityEventPhotoSummaries: builder.query<
      EntityEventPhotoSummary[],
      string
    >({
      async queryFn(entityId) {
        try {
          const data = await getEntityEventPhotoSummaries(entityId);
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
      providesTags: (_result, _error, entityId) => [
        { type: "EventPhotos" as const, id: `entity-${entityId}` },
      ],
    }),
    getIndividualEventPhotoSummaries: builder.query<
      EntityEventPhotoSummary[],
      string
    >({
      async queryFn(userId) {
        try {
          const data = await getIndividualEventPhotoSummaries(userId);
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
      providesTags: (_result, _error, userId) => [
        { type: "EventPhotos" as const, id: `individual-${userId}` },
      ],
    }),
    canUploadEventPhotos: builder.query<boolean, string>({
      async queryFn(eventId) {
        try {
          const data = await canUploadEventPhotos(eventId);
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
    canDeleteEventPhotos: builder.query<boolean, string>({
      async queryFn(eventId) {
        try {
          const data = await canDeleteEventPhotos(eventId);
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
    deleteEventPhoto: builder.mutation<
      void,
      {
        photoId: string;
        eventId: string;
        entityId?: string;
        individualId?: string;
      }
    >({
      async queryFn({ photoId }) {
        try {
          await deleteEventPhoto(photoId);
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
      invalidatesTags: (_result, _error, { eventId, entityId, individualId }) => {
        const tags = [{ type: "EventPhotos" as const, id: eventId }];
        if (entityId) {
          tags.push({ type: "EventPhotos" as const, id: `entity-${entityId}` });
        }
        if (individualId) {
          tags.push({
            type: "EventPhotos" as const,
            id: `individual-${individualId}`,
          });
        }
        return tags;
      },
    }),
    uploadEventPhoto: builder.mutation<
      EventPhoto,
      {
        eventId: string;
        file: File;
        entityId?: string;
        individualId?: string;
      }
    >({
      async queryFn({ eventId, file }) {
        try {
          const data = await uploadEventPhoto(eventId, file);
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
      invalidatesTags: (_result, _error, { eventId, entityId, individualId }) => {
        const tags = [{ type: "EventPhotos" as const, id: eventId }];
        if (entityId) {
          tags.push({ type: "EventPhotos" as const, id: `entity-${entityId}` });
        }
        if (individualId) {
          tags.push({
            type: "EventPhotos" as const,
            id: `individual-${individualId}`,
          });
        }
        return tags;
      },
    }),
  }),
});

export const {
  useGetEventPhotosQuery,
  useGetEntityEventPhotoSummariesQuery,
  useGetIndividualEventPhotoSummariesQuery,
  useCanDeleteEventPhotosQuery,
  useCanUploadEventPhotosQuery,
  useDeleteEventPhotoMutation,
  useUploadEventPhotoMutation,
} = EventPhotosApi;
