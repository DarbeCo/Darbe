import { darbeBaseApi } from "../darbe.api";
import { EventImpact } from "../types/impact.api.types";
import { getUserImpact } from "../../../darbeService";

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
    }),
  }),
});

export const { useGetUserImpactQuery } = ImpactApi;
