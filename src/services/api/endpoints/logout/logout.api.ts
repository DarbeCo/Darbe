import { darbeBaseApi } from "../darbe.api";
import { signOut } from "../../../darbeService";

const logoutApi = darbeBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    logout: builder.mutation<string, void>({
      async queryFn() {
        try {
          await signOut();
          return { data: "Logged out successfully" };
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

export const { useLogoutMutation } = logoutApi;
