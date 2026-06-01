import { darbeBaseApi } from "../darbe.api";
import { EventImpact } from "../types/impact.api.types";
import { getUserImpact, getVolunteerValuePerHour } from "../../../darbeService";

const ImpactApi = darbeBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserImpact: builder.query<EventImpact[], string>({
      async queryFn(userId) {
        try {
          const data = await getUserImpact(userId);
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
      providesTags: ["Impact"],
      keepUnusedDataFor: 0,
    }),
    getVolunteerValuePerHour: builder.query<number, void>({
      async queryFn() {
        try {
          const data = await getVolunteerValuePerHour();
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
      providesTags: ["VolunteerValue"],
    }),
  }),
});

export const { useGetUserImpactQuery, useGetVolunteerValuePerHourQuery } = ImpactApi;
