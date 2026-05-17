import { darbeBaseApi } from "../darbe.api";
import {
  canUploadEventPhotos,
  getEntityEventPhotoSummaries,
  getEventPhotos,
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
    uploadEventPhoto: builder.mutation<
      EventPhoto,
      { eventId: string; file: File; entityId?: string }
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
      invalidatesTags: (_result, _error, { eventId, entityId }) => {
        const tags = [{ type: "EventPhotos" as const, id: eventId }];
        if (entityId) {
          tags.push({ type: "EventPhotos" as const, id: `entity-${entityId}` });
        }
        return tags;
      },
    }),
  }),
});

export const {
  useGetEventPhotosQuery,
  useGetEntityEventPhotoSummariesQuery,
  useCanUploadEventPhotosQuery,
  useUploadEventPhotoMutation,
} = EventPhotosApi;
