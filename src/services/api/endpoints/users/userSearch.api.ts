import { darbeBaseApi } from "../darbe.api";
import { UserActivity } from "../types/activity.api.types";
import { getUserActivity } from "../../../darbeService";

// TODO: Rename, this is a misleading name, not really used for searching users specifically, more like their details within darbe
const userSearchApi = darbeBaseApi.injectEndpoints({
  endpoints: (build) => ({
    getUserActivity: build.query<UserActivity[], string>({
      async queryFn(userId) {
        try {
          const data = await getUserActivity(userId);
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
      providesTags: ["UserActivity"],
      // TODO: Figure out the cache time for this
      keepUnusedDataFor: 10
    })
  }),
});

export const { useGetUserActivityQuery } = userSearchApi;
