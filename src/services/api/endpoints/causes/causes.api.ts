import { darbeBaseApi } from "../darbe.api";
import { Cause } from "../../../types/cause.types";
import { getCauses, getMutualCauses } from "../../../darbeService";

const causesApi = darbeBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCauses: builder.query<Cause[], void>({
      async queryFn() {
        try {
          const data = await getCauses();
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
      providesTags: ["Causes"],
    }),
    getMutualCauses: builder.query<Cause[], string>({
      async queryFn(userId) {
        try {
          const data = await getMutualCauses(userId);
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

export const { useGetCausesQuery, useGetMutualCausesQuery } = causesApi;
